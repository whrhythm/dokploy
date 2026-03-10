import { toast } from "sonner";
import { AlertBlock } from "@/components/shared/alert-block";
import { DialogAction } from "@/components/shared/dialog-action";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHealthCheckAfterMutation } from "@/hooks/use-health-check-after-mutation";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";
import { EditTraefikEnv } from "../../web-server/edit-traefik-env";
import { ManageTraefikPorts } from "../../web-server/manage-traefik-ports";
import { ShowModalLogs } from "../../web-server/show-modal-logs";

interface Props {
	serverId?: string;
}
export const ShowTraefikActions = ({ serverId }: Props) => {
	const { t } = useTranslation();
	const { mutateAsync: reloadTraefik, isPending: reloadTraefikIsLoading } =
		api.settings.reloadTraefik.useMutation();

	const { mutateAsync: toggleDashboard, isPending: toggleDashboardIsLoading } =
		api.settings.toggleDashboard.useMutation();

	const { data: haveTraefikDashboardPortEnabled, refetch: refetchDashboard } =
		api.settings.haveTraefikDashboardPortEnabled.useQuery({
			serverId,
		});

	const {
		execute: executeWithHealthCheck,
		isExecuting: isHealthCheckExecuting,
	} = useHealthCheckAfterMutation({
		initialDelay: 5000,
		pollInterval: 4000,
		successMessage: t("traefikActions.dashboardUpdated"),
		onSuccess: () => {
			refetchDashboard();
		},
	});

	const {
		execute: executeReloadWithHealthCheck,
		isExecuting: isReloadHealthCheckExecuting,
	} = useHealthCheckAfterMutation({
		initialDelay: 5000,
		pollInterval: 4000,
		successMessage: t("traefikActions.reloaded"),
	});

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				asChild
				disabled={
					reloadTraefikIsLoading ||
					toggleDashboardIsLoading ||
					isHealthCheckExecuting ||
					isReloadHealthCheckExecuting
				}
			>
				<Button
					isLoading={
						reloadTraefikIsLoading ||
						toggleDashboardIsLoading ||
						isHealthCheckExecuting ||
						isReloadHealthCheckExecuting
					}
					variant="outline"
				>
					{t("dashboard.traefik")}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="start">
				<DropdownMenuLabel>{t("traefikActions.actions")}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						onClick={async () => {
							try {
								await executeReloadWithHealthCheck(() =>
									reloadTraefik({ serverId }),
								);
							} catch (error) {
								const errorMessage =
									(error as Error)?.message || t("traefikActions.reloadError");
								toast.error(errorMessage);
							}
						}}
						className="cursor-pointer"
						disabled={isReloadHealthCheckExecuting}
					>
						<span>{t("traefikActions.reload")}</span>
					</DropdownMenuItem>
					<ShowModalLogs
						appName="dokploy-traefik"
						serverId={serverId}
						type="standalone"
					>
						<DropdownMenuItem
							onSelect={(e) => e.preventDefault()}
							className="cursor-pointer"
						>
							{t("serverActions.viewLogs")}
						</DropdownMenuItem>
					</ShowModalLogs>
					<EditTraefikEnv serverId={serverId}>
						<DropdownMenuItem
							onSelect={(e) => e.preventDefault()}
							className="cursor-pointer"
						>
							<span>{t("traefikActions.modifyEnvironment")}</span>
						</DropdownMenuItem>
					</EditTraefikEnv>

					<DialogAction
						title={
							haveTraefikDashboardPortEnabled
								? t("traefikActions.disableDashboardTitle")
								: t("traefikActions.enableDashboardTitle")
						}
						description={
							<div className="space-y-4">
								<AlertBlock type="warning">
									{t("traefikActions.warning")}
								</AlertBlock>
								<p>
									{t("traefikActions.togglePrompt")}{" "}
									{haveTraefikDashboardPortEnabled
										? t("traefikActions.disable")
										: t("traefikActions.enable")}{" "}
									{t("traefikActions.dashboard")}
								</p>
							</div>
						}
						onClick={async () => {
							try {
								await executeWithHealthCheck(() =>
									toggleDashboard({
										enableDashboard: !haveTraefikDashboardPortEnabled,
										serverId: serverId,
									}),
								);
							} catch (error) {
								const errorMessage =
									(error as Error)?.message || t("traefikActions.toggleError");
								toast.error(errorMessage);
							}
						}}
						disabled={toggleDashboardIsLoading || isHealthCheckExecuting}
						type="default"
					>
						<DropdownMenuItem
							onSelect={(e) => e.preventDefault()}
							className="w-full cursor-pointer space-x-3"
						>
							<span>
								{haveTraefikDashboardPortEnabled
									? t("traefikActions.disable")
									: t("traefikActions.enable")}{" "}
								{t("traefikActions.dashboard")}
							</span>
						</DropdownMenuItem>
					</DialogAction>
					<ManageTraefikPorts serverId={serverId}>
						<DropdownMenuItem
							onSelect={(e) => e.preventDefault()}
							className="cursor-pointer"
						>
							<span>{t("traefikPorts.title")}</span>
						</DropdownMenuItem>
					</ManageTraefikPorts>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
