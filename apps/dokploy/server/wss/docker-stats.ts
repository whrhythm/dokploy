import type http from "node:http";
import {
	docker,
	execAsync,
	getHostSystemStats,
	getLastAdvancedStatsFile,
	getWebServerSettings,
	IS_CLOUD,
	recordAdvancedStats,
	sendServerThresholdNotifications,
	validateRequest,
} from "@dokploy/server";
import { WebSocketServer } from "ws";

const getMetricValue = (value: unknown, key?: string): number | null => {
	if (typeof value === "number") return value;
	if (typeof value === "string") return Number.parseFloat(value);
	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		if (key && typeof record[key] === "number") return record[key] as number;
		if (key && typeof record[key] === "string") {
			const parsed = Number.parseFloat(record[key] as string);
			return Number.isNaN(parsed) ? null : parsed;
		}
		if (typeof record.value === "number") return record.value as number;
		if (typeof record.value === "string") {
			const parsed = Number.parseFloat(record.value as string);
			return Number.isNaN(parsed) ? null : parsed;
		}
	}
	return null;
};

const getLatestStat = (series: unknown) => {
	if (!Array.isArray(series) || series.length === 0) {
		return null;
	}

	return series[series.length - 1] as Record<string, unknown>;
};

const hostAlertState = new Map<string, boolean>();

const maybeSendHostAlert = async ({
	organizationId,
	type,
	value,
	threshold,
	serverName,
}: {
	organizationId: string;
	type: "CPU" | "Memory" | "Disk";
	value: number | null;
	threshold: number;
	serverName: string;
}) => {
	const alertKey = `${organizationId}:${type}`;
	const wasAbove = hostAlertState.get(alertKey) ?? false;
	const isAbove = value != null ? value > threshold : false;

	if (value == null) {
		return;
	}

	if (isAbove && !wasAbove) {
		console.log(
			"+++++++++++++++++++++++++++++++++++++++++++++ host alert triggered",
			{
				organizationId,
				serverName,
				type,
				value,
				threshold,
				above: true,
			},
		);
		hostAlertState.set(alertKey, true);

		try {
			await sendServerThresholdNotifications(organizationId, {
				ServerType: "Dokploy",
				Type: type,
				Value: value,
				Threshold: threshold,
				Message: `${type} usage is above the configured threshold.`,
				Timestamp: new Date().toISOString(),
				Token: "host-monitoring",
				ServerName: serverName,
			});
		} catch (error) {
			console.error("Failed to send host threshold notification", error);
		}
		return;
	}

	if (!isAbove && wasAbove) {
		console.log(
			"+++++++++++++++++++++++++++++++++++++++++++++ host alert reset",
			{
				organizationId,
				serverName,
				type,
				value,
				threshold,
				above: false,
			},
		);
		hostAlertState.set(alertKey, false);
	}
	return;
};

export const setupDockerStatsMonitoringSocketServer = (
	server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
) => {
	const wssTerm = new WebSocketServer({
		noServer: true,
		path: "/listen-docker-stats-monitoring",
	});

	server.on("upgrade", (req, socket, head) => {
		const { pathname } = new URL(req.url || "", `http://${req.headers.host}`);
		console.log(
			"+++++++++++++++++++++++++++++++++++++++++++++ websocket upgrade",
			{
				pathname,
				url: req.url,
				host: req.headers.host,
			},
		);

		if (pathname === "/_next/webpack-hmr") {
			return;
		}
		if (pathname === "/listen-docker-stats-monitoring") {
			wssTerm.handleUpgrade(req, socket, head, function done(ws) {
				wssTerm.emit("connection", ws, req);
			});
		}
	});

	wssTerm.on("connection", async (ws, req) => {
		const url = new URL(req.url || "", `http://${req.headers.host}`);
		console.log(
			"+++++++++++++++++++++++++++++++++++++++++++++ websocket connection",
			{
				url: req.url,
				appName: url.searchParams.get("appName"),
				appType: url.searchParams.get("appType"),
				gpuScope: url.searchParams.get("gpuScope"),
			},
		);

		if (IS_CLOUD) {
			ws.send("This feature is not available in the cloud version.");
			ws.close();
			return;
		}
		const appName = url.searchParams.get("appName");
		const appType = (url.searchParams.get("appType") || "application") as
			| "application"
			| "stack"
			| "docker-compose";
		const gpuScope = (url.searchParams.get("gpuScope") || "container") as
			| "host"
			| "container";
		const { user, session } = await validateRequest(req);

		if (!appName) {
			ws.close(4000, "appName no provided");
			return;
		}

		if (!user || !session) {
			ws.close();
			return;
		}
		const intervalId = setInterval(async () => {
			try {
				// Special case: when monitoring "dokploy", get host system stats instead of container stats
				if (appName === "dokploy" && gpuScope === "host") {
					const stat = await getHostSystemStats();

					await recordAdvancedStats(stat, appName, gpuScope);
					const data = await getLastAdvancedStatsFile(appName, gpuScope);
					const settings = await getWebServerSettings();
					const hostThresholds = settings?.metricsConfig?.host?.thresholds;
					const serverName = "小智Ops Host";
					console.log(
						"+++++++++++++++++++++++++++++++++++++++++++++ host stats tick",
						{
							appName,
							gpuScope,
							memPerc: stat.MemPerc,
							cpuPerc: stat.CPUPerc,
							diskLatest: getLatestStat(data.disk)?.value,
							thresholds: hostThresholds,
						},
					);

					if (hostThresholds) {
						await maybeSendHostAlert({
							organizationId: session.activeOrganizationId,
							type: "CPU",
							value: getMetricValue(stat.CPUPerc),
							threshold: hostThresholds.cpu,
							serverName,
						});

						await maybeSendHostAlert({
							organizationId: session.activeOrganizationId,
							type: "Memory",
							value: getMetricValue(stat.MemPerc),
							threshold: hostThresholds.memory,
							serverName,
						});

						const latestDisk = getLatestStat(data.disk);
						await maybeSendHostAlert({
							organizationId: session.activeOrganizationId,
							type: "Disk",
							value: getMetricValue(latestDisk?.value, "diskUsedPercentage"),
							threshold: hostThresholds.disk,
							serverName,
						});
					}

					ws.send(
						JSON.stringify({
							data,
						}),
					);
					return;
				}

				const filter = {
					status: ["running"],
					...(appType === "application" && {
						label: [`com.docker.swarm.service.name=${appName}`],
					}),
					...(appType === "stack" && {
						label: [`com.docker.swarm.task.name=${appName}`],
					}),
					...(appType === "docker-compose" && {
						name: [appName],
					}),
				};

				const containers = await docker.listContainers({
					filters: JSON.stringify(filter),
				});

				const container = containers[0];
				if (!container || container?.State !== "running") {
					ws.close(4000, "Container not running");
					return;
				}
				const { stdout, stderr } = await execAsync(
					`docker stats ${container.Id} --no-stream --format \'{"BlockIO":"{{.BlockIO}}","CPUPerc":"{{.CPUPerc}}","Container":"{{.Container}}","ID":"{{.ID}}","MemPerc":"{{.MemPerc}}","MemUsage":"{{.MemUsage}}","Name":"{{.Name}}","NetIO":"{{.NetIO}}"}\'`,
				);
				if (stderr) {
					console.error("Docker stats error:", stderr);
					return;
				}
				const stat = JSON.parse(stdout);

				await recordAdvancedStats(stat, appName, gpuScope);
				const data = await getLastAdvancedStatsFile(appName, gpuScope);

				ws.send(
					JSON.stringify({
						data,
					}),
				);
			} catch (error) {
				// @ts-ignore
				ws.close(4000, `Error: ${error.message}`);
			}
		}, 1300);

		ws.on("close", () => {
			clearInterval(intervalId);
		});
	});
};
