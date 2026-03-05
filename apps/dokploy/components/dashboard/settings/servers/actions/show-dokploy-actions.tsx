import { toast } from "sonner";
import { UpdateServerIp } from "@/components/dashboard/settings/web-server/update-server-ip";
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
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";
import { ShowModalLogs } from "../../web-server/show-modal-logs";
import { TerminalModal } from "../../web-server/terminal-modal";
import { GPUSupportModal } from "../gpu-support-modal";

export const ShowDokployActions = () => {
	const { t } = useTranslation();
	const { mutateAsync: reloadServer, isPending } =
		api.settings.reloadServer.useMutation();

	const { mutateAsync: cleanRedis } = api.settings.cleanRedis.useMutation();
	const { mutateAsync: reloadRedis } = api.settings.reloadRedis.useMutation();
	const { mutateAsync: cleanAllDeploymentQueue } =
		api.settings.cleanAllDeploymentQueue.useMutation();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild disabled={isPending}>
				<Button isLoading={isPending} variant="outline">
					{t("serverActions.server")}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="start">
				<DropdownMenuLabel>{t("serverActions.actions")}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						onClick={async () => {
							await reloadServer()
								.then(async () => {
									toast.success(t("serverActions.serverReloaded"));
								})
								.catch(() => {
									toast.success(t("serverActions.serverReloaded"));
								});
						}}
						className="cursor-pointer"
					>
						<span>{t("serverActions.reload")}</span>
					</DropdownMenuItem>
					<TerminalModal serverId="local">
						<span>{t("serverActions.terminal")}</span>
					</TerminalModal>
					<ShowModalLogs appName="dokploy">
						<DropdownMenuItem
							className="cursor-pointer"
							onSelect={(e) => e.preventDefault()}
						>
							{t("serverActions.viewLogs")}
						</DropdownMenuItem>
					</ShowModalLogs>
					<GPUSupportModal />
					<UpdateServerIp>
						<DropdownMenuItem
							className="cursor-pointer"
							onSelect={(e) => e.preventDefault()}
						>
							{t("serverActions.updateServerIp")}
						</DropdownMenuItem>
					</UpdateServerIp>

					<DropdownMenuItem
						className="cursor-pointer"
						onClick={async () => {
							await cleanRedis()
								.then(async () => {
									toast.success(t("serverActions.redisCleaned"));
								})
								.catch(() => {
									toast.error(t("serverActions.redisCleanError"));
								});
						}}
					>
						{t("serverActions.cleanRedis")}
					</DropdownMenuItem>

					<DropdownMenuItem
						className="cursor-pointer"
						onClick={async () => {
							await cleanAllDeploymentQueue()
								.then(() => {
									toast.success(t("serverActions.deploymentQueueCleaned"));
								})
								.catch(() => {
									toast.error(t("serverActions.deploymentQueueCleanError"));
								});
						}}
					>
						{t("serverActions.cleanDeploymentQueue")}
					</DropdownMenuItem>

					<DropdownMenuItem
						className="cursor-pointer"
						onClick={async () => {
							await reloadRedis()
								.then(async () => {
									toast.success(t("serverActions.redisReloaded"));
								})
								.catch(() => {
									toast.error(t("serverActions.redisReloadError"));
								});
						}}
					>
						{t("serverActions.reloadRedis")}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
