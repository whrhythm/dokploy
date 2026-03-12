import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
	Ban,
	CheckCircle2,
	Hammer,
	RefreshCcw,
	Rocket,
	Terminal,
} from "lucide-react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { ShowBuildChooseForm } from "@/components/dashboard/application/build/show";
import { ShowProviderForm } from "@/components/dashboard/application/general/generic/show";
import { DialogAction } from "@/components/shared/dialog-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";
import { DockerTerminalModal } from "../../settings/web-server/docker-terminal-modal";

interface Props {
	applicationId: string;
}

export const ShowGeneralApplication = ({ applicationId }: Props) => {
	const router = useRouter();
	const { t } = useTranslation();
	const { data, refetch } = api.application.one.useQuery(
		{
			applicationId,
		},
		{ enabled: !!applicationId },
	);
	const { mutateAsync: update } = api.application.update.useMutation();
	const { mutateAsync: start, isPending: isStarting } =
		api.application.start.useMutation();
	const { mutateAsync: stop, isPending: isStopping } =
		api.application.stop.useMutation();

	const { mutateAsync: deploy } = api.application.deploy.useMutation();

	const { mutateAsync: reload, isPending: isReloading } =
		api.application.reload.useMutation();

	const { mutateAsync: redeploy } = api.application.redeploy.useMutation();

	return (
		<>
			<Card className="bg-background">
				<CardHeader>
					<CardTitle className="text-xl">
						{t("services.application.deploySettings")}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-row gap-4 flex-wrap">
					<TooltipProvider delayDuration={0} disableHoverableContent={false}>
						<DialogAction
							title={t("services.application.actions.deploy.title")}
							description={t("services.application.actions.deploy.description")}
							type="default"
							onClick={async () => {
								await deploy({
									applicationId: applicationId,
								})
									.then(() => {
										toast.success(t("services.application.toast.deployed"));
										refetch();
										router.push(
											`/dashboard/project/${data?.environment.projectId}/environment/${data?.environmentId}/services/application/${applicationId}?tab=deployments`,
										);
									})
									.catch(() => {
										toast.error(t("services.application.toast.deployError"));
									});
							}}
						>
							<Button
								variant="default"
								isLoading={data?.applicationStatus === "running"}
								className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
							>
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="flex items-center">
											<Rocket className="size-4 mr-1" />
											{t("button.deploy")}
										</div>
									</TooltipTrigger>
									<TooltipPrimitive.Portal>
										<TooltipContent sideOffset={5} className="z-[60]">
											<p>{t("services.application.actions.deploy.hint")}</p>
										</TooltipContent>
									</TooltipPrimitive.Portal>
								</Tooltip>
							</Button>
						</DialogAction>
						<DialogAction
							title={t("services.application.actions.reload.title")}
							description={t("services.application.actions.reload.description")}
							type="default"
							onClick={async () => {
								await reload({
									applicationId: applicationId,
									appName: data?.appName || "",
								})
									.then(() => {
										toast.success(t("services.application.toast.reloaded"));
										refetch();
									})
									.catch(() => {
										toast.error(t("services.application.toast.reloadError"));
									});
							}}
						>
							<Button
								variant="secondary"
								isLoading={isReloading}
								className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
							>
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="flex items-center">
											<RefreshCcw className="size-4 mr-1" />
											{t("button.reload")}
										</div>
									</TooltipTrigger>
									<TooltipPrimitive.Portal>
										<TooltipContent sideOffset={5} className="z-[60]">
											<p>{t("services.application.actions.reload.hint")}</p>
										</TooltipContent>
									</TooltipPrimitive.Portal>
								</Tooltip>
							</Button>
						</DialogAction>
						<DialogAction
							title={t("services.application.actions.rebuild.title")}
							description={t(
								"services.application.actions.rebuild.description",
							)}
							type="default"
							onClick={async () => {
								await redeploy({
									applicationId: applicationId,
								})
									.then(() => {
										toast.success(t("services.application.toast.rebuilt"));
										refetch();
									})
									.catch(() => {
										toast.error(t("services.application.toast.rebuildError"));
									});
							}}
						>
							<Button
								variant="secondary"
								isLoading={data?.applicationStatus === "running"}
								className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
							>
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="flex items-center">
											<Hammer className="size-4 mr-1" />
											{t("button.rebuild")}
										</div>
									</TooltipTrigger>
									<TooltipPrimitive.Portal>
										<TooltipContent sideOffset={5} className="z-[60]">
											<p>{t("services.application.actions.rebuild.hint")}</p>
										</TooltipContent>
									</TooltipPrimitive.Portal>
								</Tooltip>
							</Button>
						</DialogAction>

						{data?.applicationStatus === "idle" ? (
							<DialogAction
								title={t("services.application.actions.start.title")}
								description={t(
									"services.application.actions.start.description",
								)}
								type="default"
								onClick={async () => {
									await start({
										applicationId: applicationId,
									})
										.then(() => {
											toast.success(t("services.application.toast.started"));
											refetch();
										})
										.catch(() => {
											toast.error(t("services.application.toast.startError"));
										});
								}}
							>
								<Button
									variant="secondary"
									isLoading={isStarting}
									className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
								>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center">
												<CheckCircle2 className="size-4 mr-1" />
												{t("button.start")}
											</div>
										</TooltipTrigger>
										<TooltipPrimitive.Portal>
											<TooltipContent sideOffset={5} className="z-[60]">
												<p>{t("services.application.actions.start.hint")}</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						) : (
							<DialogAction
								title={t("services.application.actions.stop.title")}
								description={t("services.application.actions.stop.description")}
								onClick={async () => {
									await stop({
										applicationId: applicationId,
									})
										.then(() => {
											toast.success(t("services.application.toast.stopped"));
											refetch();
										})
										.catch(() => {
											toast.error(t("services.application.toast.stopError"));
										});
								}}
							>
								<Button
									variant="destructive"
									isLoading={isStopping}
									className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
								>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center">
												<Ban className="size-4 mr-1" />
												{t("button.stop")}
											</div>
										</TooltipTrigger>
										<TooltipPrimitive.Portal>
											<TooltipContent sideOffset={5} className="z-[60]">
												<p>{t("services.application.actions.stop.hint")}</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						)}
					</TooltipProvider>
					<DockerTerminalModal
						appName={data?.appName || ""}
						serverId={data?.serverId || ""}
					>
						<Button
							variant="outline"
							className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2"
						>
							<Terminal className="size-4 mr-1" />
							{t("services.application.actions.openTerminal")}
						</Button>
					</DockerTerminalModal>
					<div className="flex flex-row items-center gap-2 rounded-md px-4 py-2 border">
						<span className="text-sm font-medium">
							{t("application.autodeploy")}
						</span>
						<Switch
							aria-label={t("services.application.actions.toggleAutodeploy")}
							checked={data?.autoDeploy || false}
							onCheckedChange={async (enabled) => {
								await update({
									applicationId,
									autoDeploy: enabled,
								})
									.then(async () => {
										toast.success(
											t("services.application.toast.autodeployUpdated"),
										);
										await refetch();
									})
									.catch(() => {
										toast.error(
											t("services.application.toast.autodeployError"),
										);
									});
							}}
							className="flex flex-row gap-2 items-center data-[state=checked]:bg-primary"
						/>
					</div>

					<div className="flex flex-row items-center gap-2 rounded-md px-4 py-2 border">
						<span className="text-sm font-medium">
							{t("services.application.cleanCache")}
						</span>
						<Switch
							aria-label={t("services.application.actions.toggleCleanCache")}
							checked={data?.cleanCache || false}
							onCheckedChange={async (enabled) => {
								await update({
									applicationId,
									cleanCache: enabled,
								})
									.then(async () => {
										toast.success(
											t("services.application.toast.cleanCacheUpdated"),
										);
										await refetch();
									})
									.catch(() => {
										toast.error(
											t("services.application.toast.cleanCacheError"),
										);
									});
							}}
							className="flex flex-row gap-2 items-center data-[state=checked]:bg-primary"
						/>
					</div>
				</CardContent>
			</Card>
			<ShowProviderForm applicationId={applicationId} />
			<ShowBuildChooseForm applicationId={applicationId} />
		</>
	);
};
