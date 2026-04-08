import { CheckCircle2, Cpu, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertBlock } from "@/components/shared/alert-block";
import { DialogAction } from "@/components/shared/dialog-action";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { logDevError } from "@/lib/dev-error";
import { api } from "@/utils/api";

interface GPUSupportProps {
	serverId?: string;
}

export function GPUSupport({ serverId }: GPUSupportProps) {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const utils = api.useContext();

	const {
		data: gpuStatus,
		isLoading: isChecking,
		refetch,
	} = api.settings.checkGPUStatus.useQuery(
		{ serverId },
		{
			enabled: serverId !== undefined,
		},
	);

	const setupGPU = api.settings.setupGPU.useMutation({
		onMutate: () => {
			setIsLoading(true);
		},
		onSuccess: async () => {
			toast.success(t("gpuSupport.enableSuccess"));
			setIsLoading(false);
			await utils.settings.checkGPUStatus.invalidate({ serverId });
		},
		onError: (err) => {
			logDevError("gpu-enable", err);
			toast.error(t("gpuSupport.enableError"));
			setIsLoading(false);
		},
	});

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await utils.settings.checkGPUStatus.invalidate({ serverId });
			await refetch();
		} catch (err) {
			logDevError("gpu-refresh", err);
			toast.error(t("gpuSupport.refreshError"));
		} finally {
			setIsRefreshing(false);
		}
	};
	useEffect(() => {
		handleRefresh();
	}, []);

	const handleEnableGPU = async () => {
		if (serverId === undefined) {
			toast.error(t("gpuSupport.noServerError"));
			return;
		}

		try {
			await setupGPU.mutateAsync({ serverId });
		} catch (err) {
			logDevError("gpu-enable-mutate", err);
			// Error handling is done in mutation's onError
		}
	};

	return (
		<CardContent className="p-0">
			<div className="flex flex-col gap-4">
				<Card className="bg-background">
					<CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
						<div className="flex flex-row gap-2 justify-between w-full items-end max-sm:flex-col">
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<Cpu className="size-5" />
									<CardTitle className="text-xl">
										{t("gpuSupport.title")}
									</CardTitle>
								</div>
								<CardDescription>{t("gpuSupport.description")}</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<DialogAction
									title={t("gpuSupport.enableTitle")}
									description={t("gpuSupport.enableDescription")}
									onClick={handleEnableGPU}
								>
									<Button
										isLoading={isLoading}
										disabled={isLoading || serverId === undefined || isChecking}
									>
										{isLoading
											? t("loading")
											: gpuStatus?.swarmEnabled
												? t("gpuSupport.reconfigureButton")
												: t("gpuSupport.enableButton")}
									</Button>
								</DialogAction>
								<Button
									size="icon"
									onClick={handleRefresh}
									disabled={isChecking || isRefreshing}
								>
									<RefreshCw
										className={`h-5 w-5 ${isChecking || isRefreshing ? "animate-spin" : ""}`}
									/>
								</Button>
							</div>
						</div>
					</CardHeader>

					<CardContent className="flex flex-col gap-4">
						<AlertBlock type="info">
							<div className="font-medium mb-2">
								{t("gpuSupport.systemRequirements")}
							</div>
							<ul className="list-disc list-inside text-sm space-y-1">
								<li>{t("gpuSupport.requirements.hardware")}</li>
								<li>{t("gpuSupport.requirements.drivers")}</li>
								<li>{t("gpuSupport.requirements.runtime")}</li>
								<li>{t("gpuSupport.requirements.privileges")}</li>
								<li>{t("gpuSupport.requirements.cuda")}</li>
							</ul>
						</AlertBlock>

						{isChecking ? (
							<div className="flex items-center justify-center text-muted-foreground py-4">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								<span>{t("gpuSupport.checking")}</span>
							</div>
						) : (
							<div className="grid gap-4">
								{/* Prerequisites Section */}
								<div className="border rounded-lg p-4">
									<h3 className="text-lg font-semibold mb-1">
										{t("gpuSupport.prerequisitesTitle")}
									</h3>
									<p className="text-sm text-muted-foreground mb-4">
										{t("gpuSupport.prerequisitesDescription")}
									</p>
									<div className="grid gap-2.5">
										<StatusRow
											label={t("gpuSupport.nvidiaDriver")}
											isEnabled={gpuStatus?.driverInstalled}
											description={
												gpuStatus?.driverVersion
													? t("gpuSupport.installedVersion", {
															version: gpuStatus.driverVersion,
														})
													: t("gpuSupport.notInstalled")
											}
										/>
										<StatusRow
											label={t("gpuSupport.gpuModel")}
											value={gpuStatus?.gpuModel || t("gpuSupport.notDetected")}
											showIcon={false}
										/>
										<StatusRow
											label={t("gpuSupport.gpuMemory")}
											value={
												gpuStatus?.memoryInfo || t("gpuSupport.notAvailable")
											}
											showIcon={false}
										/>
										<StatusRow
											label={t("gpuSupport.availableGpus")}
											value={gpuStatus?.availableGPUs || 0}
											showIcon={false}
										/>
										<StatusRow
											label={t("gpuSupport.cudaSupport")}
											isEnabled={gpuStatus?.cudaSupport}
											description={
												gpuStatus?.cudaVersion
													? t("gpuSupport.availableVersion", {
															version: gpuStatus.cudaVersion,
														})
													: t("gpuSupport.notAvailable")
											}
										/>
										<StatusRow
											label={t("gpuSupport.containerRuntime")}
											isEnabled={gpuStatus?.runtimeInstalled}
											description={
												gpuStatus?.runtimeInstalled
													? t("gpuSupport.installed")
													: t("gpuSupport.notInstalled")
											}
										/>
									</div>
								</div>

								{/* Configuration Status */}
								<div className="border rounded-lg p-4">
									<h3 className="text-lg font-semibold mb-1">
										{t("gpuSupport.swarmStatusTitle")}
									</h3>
									<p className="text-sm text-muted-foreground mb-4">
										{t("gpuSupport.swarmStatusDescription")}
									</p>
									<div className="grid gap-2.5">
										<StatusRow
											label={t("gpuSupport.runtimeConfiguration")}
											isEnabled={gpuStatus?.runtimeConfigured}
											description={
												gpuStatus?.runtimeConfigured
													? t("gpuSupport.defaultRuntime")
													: t("gpuSupport.notDefaultRuntime")
											}
										/>
										<StatusRow
											label={t("gpuSupport.swarmGpuSupport")}
											isEnabled={gpuStatus?.swarmEnabled}
											description={
												gpuStatus?.swarmEnabled
													? t("gpuSupport.enabledResources", {
															count: gpuStatus.gpuResources,
															suffix: gpuStatus.gpuResources !== 1 ? "s" : "",
														})
													: t("gpuSupport.notEnabled")
											}
										/>
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</CardContent>
	);
}

interface StatusRowProps {
	label: string;
	isEnabled?: boolean;
	description?: string;
	value?: string | number;
	showIcon?: boolean;
}

export function StatusRow({
	label,
	isEnabled,
	description,
	value,
	showIcon = true,
}: StatusRowProps) {
	const { t } = useTranslation();
	return (
		<div className="flex items-center justify-between">
			<span className="text-sm">{label}</span>
			<div className="flex items-center gap-2">
				{showIcon ? (
					<>
						<span
							className={`text-sm ${isEnabled ? "text-green-500" : "text-red-500"}`}
						>
							{description ||
								(isEnabled
									? t("gpuSupport.installed")
									: t("gpuSupport.notInstalled"))}
						</span>
						{isEnabled ? (
							<CheckCircle2 className="size-4 text-green-500" />
						) : (
							<XCircle className="size-4 text-red-500" />
						)}
					</>
				) : (
					<span className="text-sm text-muted-foreground">{value}</span>
				)}
			</div>
		</div>
	);
}
