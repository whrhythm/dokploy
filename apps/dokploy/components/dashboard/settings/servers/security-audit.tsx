import { Loader2, LockKeyhole, RefreshCw } from "lucide-react";
import { useState } from "react";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";
import { StatusRow } from "./gpu-support";

interface Props {
	serverId: string;
}

export const SecurityAudit = ({ serverId }: Props) => {
	const { t } = useTranslation();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const { data, refetch, error, isPending, isError } =
		api.server.security.useQuery(
			{ serverId },
			{
				enabled: !!serverId,
			},
		);

	return (
		<CardContent className="p-0">
			<div className="flex flex-col gap-4">
				<Card className="bg-background">
					<CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
						<div className="flex flex-row gap-2 justify-between w-full  max-sm:flex-col">
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<LockKeyhole className="size-5" />
									<CardTitle className="text-xl">
										{t("securityAudit.title")}
									</CardTitle>
								</div>
								<CardDescription>
									{t("securityAudit.description")}
								</CardDescription>
							</div>
							<Button
								isLoading={isRefreshing}
								onClick={async () => {
									setIsRefreshing(true);
									await refetch();
									setIsRefreshing(false);
								}}
							>
								<RefreshCw className="size-4" />
								{t("securityAudit.refresh")}
							</Button>
						</div>
						<div className="flex items-center gap-2 w-full">
							{isError && (
								<AlertBlock type="error" className="w-full">
									{error.message}
								</AlertBlock>
							)}
						</div>
					</CardHeader>

					<CardContent className="flex flex-col gap-4">
						<AlertBlock type="info" className="w-full">
							{t("securityAudit.supportedOs")}
						</AlertBlock>
						{isPending ? (
							<div className="flex items-center justify-center text-muted-foreground py-4">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								<span>{t("securityAudit.checking")}</span>
							</div>
						) : (
							<div className="grid w-full gap-4">
								<div className="border rounded-lg p-4">
									<h3 className="text-lg font-semibold mb-1">
										{t("securityAudit.ufwTitle")}
									</h3>
									<p className="text-sm text-muted-foreground mb-4">
										{t("securityAudit.ufwDescription")}
									</p>
									<div className="grid gap-2.5">
										<StatusRow
											label={t("securityAudit.ufwInstalled")}
											isEnabled={data?.ufw?.installed}
											description={
												data?.ufw?.installed
													? t("securityAudit.installedRecommended")
													: t("securityAudit.ufwInstallWarning")
											}
										/>
										<StatusRow
											label={t("securityAudit.ufwStatus")}
											isEnabled={data?.ufw?.active}
											description={
												data?.ufw?.active
													? t("securityAudit.activeRecommended")
													: t("securityAudit.ufwEnableWarning")
											}
										/>
										<StatusRow
											label={t("securityAudit.ufwDefaultIncoming")}
											isEnabled={data?.ufw?.defaultIncoming === "deny"}
											description={
												data?.ufw?.defaultIncoming === "deny"
													? t("securityAudit.defaultDenyRecommended")
													: t("securityAudit.defaultIncomingWarning", {
															value: data?.ufw?.defaultIncoming,
														})
											}
										/>
									</div>
								</div>

								<div className="border rounded-lg p-4">
									<h3 className="text-lg font-semibold mb-1">
										{t("securityAudit.sshTitle")}
									</h3>
									<p className="text-sm text-muted-foreground mb-4">
										{t("securityAudit.sshDescription")}
									</p>
									<div className="grid gap-2.5">
										<StatusRow
											label={t("securityAudit.sshEnabled")}
											isEnabled={data?.ssh?.enabled}
											description={
												data?.ssh?.enabled
													? t("securityAudit.enabled")
													: t("securityAudit.sshEnabledWarning")
											}
										/>
										<StatusRow
											label={t("securityAudit.sshKeyAuth")}
											isEnabled={data?.ssh?.keyAuth}
											description={
												data?.ssh?.keyAuth
													? t("securityAudit.enabledRecommended")
													: t("securityAudit.sshKeyAuthWarning")
											}
										/>
										<StatusRow
											label={t("securityAudit.sshPasswordAuth")}
											isEnabled={data?.ssh?.passwordAuth === "no"}
											description={
												data?.ssh?.passwordAuth === "no"
													? t("securityAudit.disabledRecommended")
													: t("securityAudit.passwordAuthWarning")
											}
										/>
										<StatusRow
											label={t("securityAudit.usePam")}
											isEnabled={data?.ssh?.usePam === "no"}
											description={
												data?.ssh?.usePam === "no"
													? t("securityAudit.usePamDisabled")
													: t("securityAudit.usePamEnabledWarning")
											}
										/>
									</div>
								</div>

								<div className="border rounded-lg p-4">
									<h3 className="text-lg font-semibold mb-1">
										{t("securityAudit.fail2banTitle")}
									</h3>
									<p className="text-sm text-muted-foreground mb-4">
										{t("securityAudit.fail2banDescription")}
									</p>
									<div className="grid gap-2.5">
										<StatusRow
											label={t("securityAudit.installed")}
											isEnabled={data?.fail2ban?.installed}
											description={
												data?.fail2ban?.installed
													? t("securityAudit.installedRecommended")
													: t("securityAudit.fail2banInstallWarning")
											}
										/>

										<StatusRow
											label={t("securityAudit.enabled")}
											isEnabled={data?.fail2ban?.enabled}
											description={
												data?.fail2ban?.enabled
													? t("securityAudit.enabledRecommended")
													: t("securityAudit.fail2banEnableWarning")
											}
										/>
										<StatusRow
											label={t("securityAudit.active")}
											isEnabled={data?.fail2ban?.active}
											description={
												data?.fail2ban?.active
													? t("securityAudit.activeRecommended")
													: t("securityAudit.fail2banActiveWarning")
											}
										/>

										<StatusRow
											label={t("securityAudit.sshProtection")}
											isEnabled={data?.fail2ban?.sshEnabled === "true"}
											description={
												data?.fail2ban?.sshEnabled === "true"
													? t("securityAudit.enabledRecommended")
													: t("securityAudit.sshProtectionWarning")
											}
										/>

										<StatusRow
											label={t("securityAudit.sshMode")}
											isEnabled={data?.fail2ban?.sshMode === "aggressive"}
											description={
												data?.fail2ban?.sshMode === "aggressive"
													? t("securityAudit.sshModeAggressive")
													: t("securityAudit.sshModeWarning", {
															mode:
																data?.fail2ban?.sshMode ||
																t("securityAudit.notSet"),
														})
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
};
