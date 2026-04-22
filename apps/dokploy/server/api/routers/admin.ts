import {
	getAdvancedStats,
	getHostSystemStats,
	getWebServerSettings,
	IS_CLOUD,
	notifyHostThreshold,
	setupWebMonitoring,
	updateWebServerSettings,
} from "@dokploy/server";
import { TRPCError } from "@trpc/server";
import {
	apiUpdateWebServerHostMonitoring,
	apiUpdateWebServerMonitoring,
} from "@/server/db/schema";
import { adminProcedure, createTRPCRouter } from "../trpc";

export const adminRouter = createTRPCRouter({
	setupMonitoring: adminProcedure
		.input(apiUpdateWebServerMonitoring)
		.mutation(async ({ input }) => {
			try {
				if (IS_CLOUD) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "Feature disabled on cloud",
					});
				}

				const hostConfig = input.metricsConfig.host ?? {
					thresholds: {
						cpu: 0,
						memory: 0,
						disk: 0,
					},
				};

				await updateWebServerSettings({
					metricsConfig: {
						server: {
							type: "Dokploy",
							refreshRate: input.metricsConfig.server.refreshRate,
							port: input.metricsConfig.server.port,
							token: input.metricsConfig.server.token,
							cronJob: input.metricsConfig.server.cronJob,
							urlCallback: input.metricsConfig.server.urlCallback,
							retentionDays: input.metricsConfig.server.retentionDays,
							thresholds: {
								cpu: input.metricsConfig.server.thresholds.cpu,
								memory: input.metricsConfig.server.thresholds.memory,
								gpu: input.metricsConfig.server.thresholds.gpu,
								disk: input.metricsConfig.server.thresholds.disk,
							},
						},
						containers: {
							refreshRate: input.metricsConfig.containers.refreshRate,
							services: {
								include: input.metricsConfig.containers.services.include || [],
								exclude: input.metricsConfig.containers.services.exclude || [],
							},
						},
						host: hostConfig,
					},
				});

				await setupWebMonitoring();
				const settings = await getWebServerSettings();
				return settings;
			} catch (error) {
				throw error;
			}
		}),
	updateHostMonitoring: adminProcedure
		.input(apiUpdateWebServerHostMonitoring)
		.mutation(async ({ input, ctx }) => {
			if (IS_CLOUD) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Feature disabled on cloud",
				});
			}

			const settings = await getWebServerSettings();
			if (!settings) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Web server settings not found",
				});
			}

			const hostConfig = input.host ?? settings.metricsConfig.host;
			if (!hostConfig) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Host monitoring settings are missing",
				});
			}

			const previousHostThresholds = settings.metricsConfig.host
				?.thresholds ?? {
				cpu: 0,
				memory: 0,
				disk: 0,
			};

			await updateWebServerSettings({
				metricsConfig: {
					server: settings.metricsConfig.server,
					containers: settings.metricsConfig.containers,
					host: hostConfig,
				},
			});

			const currentHostStats = await getHostSystemStats();
			const hostStats = await getAdvancedStats("dokploy", "host");
			const latestDisk = hostStats.disk[hostStats.disk.length - 1]?.value;
			const serverName = "小智Ops Host";
			const organizationId = ctx.session.activeOrganizationId;

			const changedThresholds = [
				{
					type: "CPU" as const,
					value: Number.parseFloat(currentHostStats.CPUPerc),
					previous: previousHostThresholds.cpu,
					current: hostConfig.thresholds.cpu,
				},
				{
					type: "Memory" as const,
					value: Number.parseFloat(currentHostStats.MemPerc),
					previous: previousHostThresholds.memory,
					current: hostConfig.thresholds.memory,
				},
				{
					type: "Disk" as const,
					value: (latestDisk as any)?.diskUsedPercentage ?? null,
					previous: previousHostThresholds.disk,
					current: hostConfig.thresholds.disk,
				},
			].filter(({ previous, current }) => previous !== current);

			for (const threshold of changedThresholds) {
				await notifyHostThreshold({
					organizationId,
					type: threshold.type,
					value: threshold.value,
					threshold: threshold.current,
					serverName,
					force: true,
				});
			}

			return getWebServerSettings();
		}),
});
