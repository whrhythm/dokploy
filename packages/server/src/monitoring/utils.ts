import { promises } from "node:fs";
import { OSUtils } from "node-os-utils";
import { paths } from "../constants";
import { execFileAsync } from "../utils/process/execAsync";

export interface Container {
	BlockIO: string;
	CPUPerc: string;
	Container: string;
	ID: string;
	MemPerc: string;
	MemUsage: string;
	Name: string;
	NetIO: string;
}

type GpuMetricValue = {
	available: boolean;
	utilization: number;
	memoryUsedMb: number;
	memoryTotalMb: number;
	gpuCount: number;
};

type GpuScope = "host" | "container";

const emptyGpuMetric: GpuMetricValue = {
	available: false,
	utilization: 0,
	memoryUsedMb: 0,
	memoryTotalMb: 0,
	gpuCount: 0,
};

const getNvidiaGpuMetric = async (): Promise<GpuMetricValue> => {
	try {
		const { stdout } = await execFileAsync("nvidia-smi", [
			"--query-gpu=utilization.gpu,memory.used,memory.total",
			"--format=csv,noheader,nounits",
		]);

		const lines = stdout
			.trim()
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);

		if (lines.length === 0) {
			return emptyGpuMetric;
		}

		let totalUtilization = 0;
		let totalMemoryUsedMb = 0;
		let totalMemoryTotalMb = 0;
		let gpuCount = 0;

		for (const line of lines) {
			const parts = line
				.split(",")
				.map((part) => Number.parseFloat(part.trim()));
			if (
				parts.length < 3 ||
				Number.isNaN(parts[0] ?? Number.NaN) ||
				Number.isNaN(parts[1] ?? Number.NaN) ||
				Number.isNaN(parts[2] ?? Number.NaN)
			) {
				continue;
			}

			totalUtilization += parts[0] ?? 0;
			totalMemoryUsedMb += parts[1] ?? 0;
			totalMemoryTotalMb += parts[2] ?? 0;
			gpuCount += 1;
		}

		if (gpuCount === 0) {
			return emptyGpuMetric;
		}

		return {
			available: true,
			utilization: +(totalUtilization / gpuCount).toFixed(2),
			memoryUsedMb: +totalMemoryUsedMb.toFixed(2),
			memoryTotalMb: +totalMemoryTotalMb.toFixed(2),
			gpuCount,
		};
	} catch {
		return emptyGpuMetric;
	}
};

const getGpuFileType = (gpuScope: GpuScope) =>
	gpuScope === "host" ? "gpu-host" : "gpu";

const readGpuUtilizationByUUID = async () => {
	const { stdout } = await execFileAsync("nvidia-smi", [
		"--query-gpu=uuid,utilization.gpu,memory.total",
		"--format=csv,noheader,nounits",
	]);

	const map = new Map<
		string,
		{
			utilization: number;
			memoryTotalMb: number;
		}
	>();

	for (const row of stdout
		.trim()
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)) {
		const [uuid, utilization, memoryTotal] = row
			.split(",")
			.map((part) => part.trim());
		if (!uuid) {
			continue;
		}
		const util = Number.parseFloat(utilization || "0");
		const total = Number.parseFloat(memoryTotal || "0");

		map.set(uuid, {
			utilization: Number.isNaN(util) ? 0 : util,
			memoryTotalMb: Number.isNaN(total) ? 0 : total,
		});
	}

	return map;
};

const isPidFromContainer = async (pid: string, containerId: string) => {
	try {
		const cgroup = await promises.readFile(`/proc/${pid}/cgroup`, "utf-8");
		return cgroup.includes(containerId);
	} catch {
		return false;
	}
};

const getContainerGpuMetric = async (
	containerId: string,
): Promise<GpuMetricValue> => {
	if (!containerId) {
		return emptyGpuMetric;
	}

	try {
		const [{ stdout: processStdout }, utilizationByUUID] = await Promise.all([
			execFileAsync("nvidia-smi", [
				"--query-compute-apps=pid,used_memory,gpu_uuid",
				"--format=csv,noheader,nounits",
			]),
			readGpuUtilizationByUUID(),
		]);

		const rows = processStdout
			.trim()
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);

		if (rows.length === 0) {
			return emptyGpuMetric;
		}

		let totalMemoryUsedMb = 0;
		const gpuUUIDs = new Set<string>();

		for (const row of rows) {
			const [pid, usedMemoryMbRaw, gpuUUID] = row
				.split(",")
				.map((part) => part.trim());

			if (!pid || !gpuUUID) {
				continue;
			}

			const belongsToContainer = await isPidFromContainer(pid, containerId);
			if (!belongsToContainer) {
				continue;
			}

			const usedMemoryMb = Number.parseFloat(usedMemoryMbRaw || "0");
			if (!Number.isNaN(usedMemoryMb)) {
				totalMemoryUsedMb += usedMemoryMb;
			}
			gpuUUIDs.add(gpuUUID);
		}

		if (gpuUUIDs.size === 0) {
			return emptyGpuMetric;
		}

		let totalUtilization = 0;
		let totalMemoryMb = 0;

		for (const uuid of gpuUUIDs) {
			const gpuMeta = utilizationByUUID.get(uuid);
			if (!gpuMeta) {
				continue;
			}
			totalUtilization += gpuMeta.utilization;
			totalMemoryMb += gpuMeta.memoryTotalMb;
		}

		if (totalMemoryMb === 0 && totalUtilization === 0) {
			return emptyGpuMetric;
		}

		return {
			available: true,
			utilization: +(totalUtilization / gpuUUIDs.size).toFixed(2),
			memoryUsedMb: +totalMemoryUsedMb.toFixed(2),
			memoryTotalMb: +totalMemoryMb.toFixed(2),
			gpuCount: gpuUUIDs.size,
		};
	} catch {
		return emptyGpuMetric;
	}
};

export const recordAdvancedStats = async (
	stats: Container,
	appName: string,
	gpuScope: GpuScope = "container",
) => {
	const { MONITORING_PATH } = paths();
	const path = `${MONITORING_PATH}/${appName}`;

	await promises.mkdir(path, { recursive: true });

	await updateStatsFile(appName, "cpu", stats.CPUPerc);
	await updateStatsFile(appName, "memory", {
		used: stats.MemUsage.split(" ")[0],
		total: stats.MemUsage.split(" ")[2],
	});

	await updateStatsFile(appName, "block", {
		readMb: stats.BlockIO.split(" ")[0],
		writeMb: stats.BlockIO.split(" ")[2],
	});

	await updateStatsFile(appName, "network", {
		inputMb: stats.NetIO.split(" ")[0],
		outputMb: stats.NetIO.split(" ")[2],
	});

	const containerId = stats.ID || "";
	const gpuMetric =
		gpuScope === "host"
			? await getNvidiaGpuMetric()
			: await getContainerGpuMetric(containerId);

	await updateStatsFile(appName, getGpuFileType(gpuScope), gpuMetric);

	if (appName === "dokploy") {
		const osutils = new OSUtils();
		const diskResult = await osutils.disk.usageByMountPoint("/");

		if (diskResult.success && diskResult.data) {
			const disk = diskResult.data;
			const diskUsage = disk.used.toGB().toFixed(2);
			const diskTotal = disk.total.toGB().toFixed(2);
			const diskUsedPercentage = disk.usagePercentage;
			const diskFree = disk.available.toGB().toFixed(2);

			await updateStatsFile(appName, "disk", {
				diskTotal: +diskTotal,
				diskUsedPercentage: +diskUsedPercentage,
				diskUsage: +diskUsage,
				diskFree: +diskFree,
			});
		}
	}
};

/**
 * Get host system statistics using node-os-utils
 * This is used when monitoring "dokploy" to show host stats instead of container stats
 */
export const getHostSystemStats = async (): Promise<Container> => {
	const osutils = new OSUtils({
		disk: {
			includeStats: true, // Enable disk I/O statistics
		},
	});

	// Get CPU usage
	const cpuResult = await osutils.cpu.usage();
	const cpuUsage = cpuResult.success ? cpuResult.data : 0;

	// Get memory info
	const memResult = await osutils.memory.info();
	let memUsedGB = 0;
	let memTotalGB = 0;
	let memUsedPercent = 0;
	if (memResult.success) {
		memTotalGB = memResult.data.total.toGB();
		memUsedGB = memResult.data.used.toGB();
		memUsedPercent = memResult.data.usagePercentage;
	}

	// Get network stats from network.overview()
	let netInputBytes = 0;
	let netOutputBytes = 0;
	const networkOverview = await osutils.network.overview();
	if (networkOverview.success) {
		netInputBytes = networkOverview.data.totalRxBytes.toBytes();
		netOutputBytes = networkOverview.data.totalTxBytes.toBytes();
	}

	// Get Block I/O from disk.stats()
	let blockReadBytes = 0;
	let blockWriteBytes = 0;
	const diskStats = await osutils.disk.stats();
	if (diskStats.success && diskStats.data.length > 0) {
		// Filter out virtual devices (loop, ram, sr, etc.) - only include real disk devices
		const excludePatterns = [/^loop/, /^ram/, /^sr\d+$/, /^fd\d+$/];
		for (const stat of diskStats.data) {
			// Skip virtual devices
			if (
				stat.device &&
				excludePatterns.some((pattern) => pattern.test(stat.device))
			) {
				continue;
			}
			// readBytes and writeBytes are DataSize objects with .toBytes() method
			blockReadBytes += stat.readBytes.toBytes();
			blockWriteBytes += stat.writeBytes.toBytes();
		}
	}

	// Format values similar to docker stats
	const formatBytes = (bytes: number): string => {
		if (bytes >= 1024 * 1024 * 1024) {
			return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GiB`;
		}
		if (bytes >= 1024 * 1024) {
			return `${(bytes / (1024 * 1024)).toFixed(2)}MiB`;
		}
		if (bytes >= 1024) {
			return `${(bytes / 1024).toFixed(2)}KiB`;
		}
		return `${bytes}B`;
	};

	// Format memory usage similar to docker stats format: "used / total"
	const memUsedFormatted = `${memUsedGB.toFixed(2)}GiB`;
	const memTotalFormatted = `${memTotalGB.toFixed(2)}GiB`;
	const memUsageFormatted = `${memUsedFormatted} / ${memTotalFormatted}`;

	// Format network I/O
	const netInputMb = netInputBytes / (1024 * 1024);
	const netOutputMb = netOutputBytes / (1024 * 1024);
	const netIOFormatted = `${netInputMb.toFixed(2)}MB / ${netOutputMb.toFixed(2)}MB`;

	// Format Block I/O
	const blockIOFormatted = `${formatBytes(blockReadBytes)} / ${formatBytes(blockWriteBytes)}`;

	// Create a stat object compatible with recordAdvancedStats
	return {
		CPUPerc: `${cpuUsage.toFixed(2)}%`,
		MemPerc: `${memUsedPercent.toFixed(2)}%`,
		MemUsage: memUsageFormatted,
		BlockIO: blockIOFormatted,
		NetIO: netIOFormatted,
		Container: "dokploy",
		ID: "host-system",
		Name: "dokploy",
	};
};

export const getAdvancedStats = async (
	appName: string,
	gpuScope: GpuScope = "container",
) => {
	return {
		cpu: await readStatsFile(appName, "cpu"),
		memory: await readStatsFile(appName, "memory"),
		disk: await readStatsFile(appName, "disk"),
		network: await readStatsFile(appName, "network"),
		block: await readStatsFile(appName, "block"),
		gpu: await readStatsFile(appName, getGpuFileType(gpuScope)),
	};
};

export const readStatsFile = async (
	appName: string,
	statType:
		| "cpu"
		| "memory"
		| "disk"
		| "network"
		| "block"
		| "gpu"
		| "gpu-host",
) => {
	try {
		const { MONITORING_PATH } = paths();
		const filePath = `${MONITORING_PATH}/${appName}/${statType}.json`;
		const data = await promises.readFile(filePath, "utf-8");
		return JSON.parse(data);
	} catch {
		return [];
	}
};

export const updateStatsFile = async (
	appName: string,
	statType:
		| "cpu"
		| "memory"
		| "disk"
		| "network"
		| "block"
		| "gpu"
		| "gpu-host",
	value: number | string | unknown,
) => {
	const { MONITORING_PATH } = paths();
	const stats = await readStatsFile(appName, statType);
	stats.push({ value, time: new Date() });

	if (stats.length > 288) {
		stats.shift();
	}

	const content = JSON.stringify(stats);
	await promises.writeFile(
		`${MONITORING_PATH}/${appName}/${statType}.json`,
		content,
	);
};

export const readLastValueStatsFile = async (
	appName: string,
	statType:
		| "cpu"
		| "memory"
		| "disk"
		| "network"
		| "block"
		| "gpu"
		| "gpu-host",
) => {
	try {
		const { MONITORING_PATH } = paths();
		const filePath = `${MONITORING_PATH}/${appName}/${statType}.json`;
		const data = await promises.readFile(filePath, "utf-8");
		const stats = JSON.parse(data);
		return stats[stats.length - 1] || null;
	} catch {
		return null;
	}
};

export const getLastAdvancedStatsFile = async (
	appName: string,
	gpuScope: GpuScope = "container",
) => {
	return {
		cpu: await readLastValueStatsFile(appName, "cpu"),
		memory: await readLastValueStatsFile(appName, "memory"),
		disk: await readLastValueStatsFile(appName, "disk"),
		network: await readLastValueStatsFile(appName, "network"),
		block: await readLastValueStatsFile(appName, "block"),
		gpu: await readLastValueStatsFile(appName, getGpuFileType(gpuScope)),
	};
};
