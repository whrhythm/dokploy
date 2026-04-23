import { docker } from "@dokploy/server/constants";
import { db } from "@dokploy/server/db";
import { getRemoteDocker } from "@dokploy/server/utils/servers/remote-docker";
import type { ContainerInfo } from "dockerode";
import { sendContainerHealthNotifications } from "./container-health";

type ManagedResource =
	| {
			kind: "application";
			resourceId: string;
			appName: string;
			serverId: string;
			organizationId: string;
	  }
	| {
			kind: "compose";
			resourceId: string;
			appName: string;
			composeType: "docker-compose" | "stack";
			serverId: string;
			organizationId: string;
	  }
	| {
			kind: "service";
			resourceId: string;
			appName: string;
			serverId: string;
			organizationId: string;
	  };

const HEALTH_CHECK_INTERVAL_MS = 60_000;
const lastContainerStatus = new Map<string, string>();
let healthMonitorTimer: ReturnType<typeof setInterval> | null = null;
let isHealthScanRunning = false;

const normalizeContainerName = (name: string) => name.replace(/^\/+/, "");

const isAlertStatus = (status: string) =>
	status === "unhealthy" || status === "exited" || status === "dead";

const getDockerClient = async (serverId: string) => {
	return serverId ? await getRemoteDocker(serverId) : docker;
};

const getContainerStatus = async (
	dockerClient: typeof docker,
	container: ContainerInfo,
) => {
	try {
		const inspected = await dockerClient.getContainer(container.Id).inspect();
		return (
			inspected.State?.Health?.Status ||
			inspected.State?.Status ||
			container.State
		);
	} catch {
		return container.State || "unknown";
	}
};

const pickContainersForCheck = (containers: ContainerInfo[]) => {
	const running = containers.filter(
		(container) => container.State === "running",
	);
	if (running.length > 0) {
		return running;
	}

	return [...containers]
		.sort((a, b) => (b.Created || 0) - (a.Created || 0))
		.slice(0, 1);
};

const matchesApplication = (container: ContainerInfo, appName: string) => {
	const labels = container.Labels || {};
	const names = (container.Names || []).map(normalizeContainerName);

	return (
		labels["com.docker.swarm.service.name"] === appName ||
		names.some(
			(name) =>
				name === appName ||
				name.startsWith(`${appName}-`) ||
				name.includes(appName),
		)
	);
};

const matchesCompose = (
	container: ContainerInfo,
	appName: string,
	composeType: "docker-compose" | "stack",
) => {
	const labels = container.Labels || {};
	const names = (container.Names || []).map(normalizeContainerName);

	if (composeType === "stack") {
		return (
			labels["com.docker.stack.namespace"] === appName ||
			(labels["com.docker.swarm.service.name"] || "").startsWith(
				`${appName}_`,
			) ||
			names.some(
				(name) => name.startsWith(`${appName}_`) || name.includes(appName),
			)
		);
	}

	return (
		labels["com.docker.compose.project"] === appName ||
		names.some((name) => name === appName || name.includes(appName))
	);
};

const matchesService = (container: ContainerInfo, appName: string) => {
	const labels = container.Labels || {};
	const names = (container.Names || []).map(normalizeContainerName);

	return (
		names.some(
			(name) =>
				name === appName ||
				name.startsWith(`${appName}-`) ||
				name.includes(appName),
		) || labels["com.docker.compose.project"] === appName
	);
};

const collectManagedResources = async (): Promise<ManagedResource[]> => {
	const [
		apps,
		composes,
		redisRows,
		mariadbRows,
		mongoRows,
		mysqlRows,
		postgresRows,
	] = await Promise.all([
		db.query.applications.findMany({
			columns: {
				applicationId: true,
				appName: true,
			},
			with: {
				server: {
					columns: {
						serverId: true,
						organizationId: true,
					},
				},
				buildServer: {
					columns: {
						serverId: true,
						organizationId: true,
					},
				},
			},
		}),
		db.query.compose.findMany({
			columns: {
				composeId: true,
				appName: true,
				composeType: true,
			},
			with: {
				server: {
					columns: {
						serverId: true,
						organizationId: true,
					},
				},
			},
		}),
		db.query.redis.findMany({
			columns: {
				redisId: true,
				appName: true,
			},
			with: {
				server: {
					columns: {
						serverId: true,
						organizationId: true,
					},
				},
			},
		}),
		db.query.mariadb.findMany({
			columns: {
				mariadbId: true,
				appName: true,
			},
			with: {
				server: {
					columns: {
						serverId: true,
						organizationId: true,
					},
				},
			},
		}),
		db.query.mongo.findMany({
			columns: {
				mongoId: true,
				appName: true,
			},
			with: {
				server: {
					columns: {
						serverId: true,
						organizationId: true,
					},
				},
			},
		}),
		db.query.mysql.findMany({
			columns: {
				mysqlId: true,
				appName: true,
			},
			with: {
				server: {
					columns: {
						serverId: true,
						organizationId: true,
					},
				},
			},
		}),
		db.query.postgres.findMany({
			columns: {
				postgresId: true,
				appName: true,
			},
			with: {
				server: {
					columns: {
						serverId: true,
						organizationId: true,
					},
				},
			},
		}),
	]);

	const managedResources: ManagedResource[] = [];

	for (const app of apps) {
		const serverInfo = app.buildServer || app.server;
		if (!serverInfo?.serverId) continue;
		managedResources.push({
			kind: "application",
			resourceId: app.applicationId,
			appName: app.appName,
			serverId: serverInfo.serverId,
			organizationId: serverInfo.organizationId,
		});
	}

	for (const entry of composes) {
		if (!entry.server?.serverId) continue;
		managedResources.push({
			kind: "compose",
			resourceId: entry.composeId,
			appName: entry.appName,
			composeType: entry.composeType,
			serverId: entry.server.serverId,
			organizationId: entry.server.organizationId,
		});
	}

	for (const entry of [
		...redisRows,
		...mariadbRows,
		...mongoRows,
		...mysqlRows,
		...postgresRows,
	]) {
		if (!entry.server?.serverId) continue;
		managedResources.push({
			kind: "service",
			resourceId:
				"redisId" in entry
					? entry.redisId
					: "mariadbId" in entry
						? entry.mariadbId
						: "mongoId" in entry
							? entry.mongoId
							: "mysqlId" in entry
								? entry.mysqlId
								: entry.postgresId,
			appName: entry.appName,
			serverId: entry.server.serverId,
			organizationId: entry.server.organizationId,
		});
	}

	return managedResources;
};

const evaluateContainer = async (
	resource: ManagedResource,
	dockerClient: typeof docker,
	container: ContainerInfo,
) => {
	const name = normalizeContainerName(
		container.Names?.[0] || container.Names?.[0] || container.Id,
	);
	const status = await getContainerStatus(dockerClient, container);
	const key = `${resource.serverId}:${resource.kind}:${resource.resourceId}:${name}`;
	const previousStatus = lastContainerStatus.get(key);
	const previousAlerting = previousStatus
		? isAlertStatus(previousStatus)
		: false;
	const currentAlerting = isAlertStatus(status);

	lastContainerStatus.set(key, status);

	console.log(
		"+++++++++++++++++++++++++++++++++++++++++++++ container health status",
		{
			resource: resource.kind,
			resourceId: resource.resourceId,
			appName: resource.appName,
			serverId: resource.serverId,
			containerName: name,
			previousStatus,
			currentStatus: status,
			alerting: currentAlerting,
		},
	);

	if (!currentAlerting || previousAlerting) {
		return;
	}

	console.log(
		"+++++++++++++++++++++++++++++++++++++++++++++ checkAndSendContainerHealth",
		{
			resource: resource.kind,
			resourceId: resource.resourceId,
			appName: resource.appName,
			serverId: resource.serverId,
			containerName: name,
			previousStatus,
			currentStatus: status,
		},
	);

	await sendContainerHealthNotifications(resource.organizationId, {
		Message: `Container ${name} is ${status}`,
		Timestamp: new Date().toISOString(),
		ServerName: "小智Ops Host",
		ContainerName: name,
		CurrentStatus: status,
		PreviousStatus: previousStatus || "healthy",
	});
};

const scanServerContainers = async (
	serverId: string,
	resources: ManagedResource[],
) => {
	const dockerClient = await getDockerClient(serverId);
	const containers = await dockerClient.listContainers({ all: true });
	console.log(
		"+++++++++++++++++++++++++++++++++++++++++++++ container health scan server",
		{
			serverId,
			resourceCount: resources.length,
			containerCount: containers.length,
		},
	);

	for (const resource of resources) {
		const matched = containers.filter((container) => {
			if (resource.kind === "application") {
				return matchesApplication(container, resource.appName);
			}

			if (resource.kind === "compose") {
				return matchesCompose(
					container,
					resource.appName,
					resource.composeType,
				);
			}

			return matchesService(container, resource.appName);
		});

		if (matched.length === 0) {
			continue;
		}

		for (const container of pickContainersForCheck(matched)) {
			await evaluateContainer(resource, dockerClient, container);
		}
	}
};

const scanManagedContainers = async () => {
	if (isHealthScanRunning) {
		return;
	}

	isHealthScanRunning = true;
	try {
		const resources = await collectManagedResources();
		console.log(
			"+++++++++++++++++++++++++++++++++++++++++++++ container health scan tick",
			{
				resourceCount: resources.length,
			},
		);
		const grouped = new Map<string, ManagedResource[]>();

		for (const resource of resources) {
			const key = resource.serverId;
			const current = grouped.get(key) || [];
			current.push(resource);
			grouped.set(key, current);
		}

		await Promise.all(
			Array.from(grouped.entries()).map(([serverId, items]) =>
				scanServerContainers(serverId, items),
			),
		);
	} catch (error) {
		console.error("Container health scan failed", error);
	} finally {
		isHealthScanRunning = false;
	}
};

export const startContainerHealthMonitoring = () => {
	if (healthMonitorTimer) {
		return;
	}

	console.log(
		"+++++++++++++++++++++++++++++++++++++++++++++ container health monitor started",
		{
			intervalMs: HEALTH_CHECK_INTERVAL_MS,
		},
	);

	void scanManagedContainers();
	healthMonitorTimer = setInterval(() => {
		void scanManagedContainers();
	}, HEALTH_CHECK_INTERVAL_MS);
};
