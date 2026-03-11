import { Loader2, PcCase, RefreshCw } from "lucide-react";
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

export const ValidateServer = ({ serverId }: Props) => {
	const { t } = useTranslation();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const { data, refetch, error, isPending, isError } =
		api.server.validate.useQuery(
			{ serverId },
			{
				enabled: !!serverId,
			},
		);
	const { data: server } = api.server.one.useQuery(
		{ serverId },
		{
			enabled: !!serverId,
		},
	);
	const isBuildServer = server?.serverType === "build";
	const _utils = api.useUtils();
	return (
		<CardContent className="p-0">
			<div className="flex flex-col gap-4">
				<Card className="bg-background">
					<CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
						<div className="flex flex-row gap-2 justify-between w-full  max-sm:flex-col">
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<PcCase className="size-5" />
									<CardTitle className="text-xl">
										{t("validateServer.title")}
									</CardTitle>
								</div>
								<CardDescription>
									{t("validateServer.description")}
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
								{t("validateServer.refresh")}
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
						{isPending ? (
							<div className="flex items-center justify-center text-muted-foreground py-4">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								<span>{t("validateServer.checking")}</span>
							</div>
						) : (
							<div className="grid w-full gap-4">
								<div className="border rounded-lg p-4">
									<h3 className="text-lg font-semibold mb-1">
										{t("validateServer.statusTitle")}
									</h3>
									<p className="text-sm text-muted-foreground mb-4">
										{isBuildServer
											? t("validateServer.statusDescriptionBuild")
											: t("validateServer.statusDescription")}
									</p>
									<div className="grid gap-2.5">
										<StatusRow
											label={t("validateServer.dockerInstalled")}
											isEnabled={data?.docker?.enabled}
											description={
												data?.docker?.enabled
													? t("validateServer.installedVersion", {
															version: data?.docker?.version,
														})
													: undefined
											}
										/>
										{!isBuildServer && (
											<StatusRow
												label={t("validateServer.rcloneInstalled")}
												isEnabled={data?.rclone?.enabled}
												description={
													data?.rclone?.enabled
														? t("validateServer.installedVersion", {
																version: data?.rclone?.version,
															})
														: undefined
												}
											/>
										)}
										<StatusRow
											label={t("validateServer.nixpacksInstalled")}
											isEnabled={data?.nixpacks?.enabled}
											description={
												data?.nixpacks?.enabled
													? t("validateServer.installedVersion", {
															version: data?.nixpacks?.version,
														})
													: undefined
											}
										/>
										<StatusRow
											label={t("validateServer.buildpacksInstalled")}
											isEnabled={data?.buildpacks?.enabled}
											description={
												data?.buildpacks?.enabled
													? t("validateServer.installedVersion", {
															version: data?.buildpacks?.version,
														})
													: undefined
											}
										/>
										<StatusRow
											label={t("validateServer.railpackInstalled")}
											isEnabled={data?.railpack?.enabled}
											description={
												data?.railpack?.enabled
													? t("validateServer.installedVersion", {
															version: data?.railpack?.version,
														})
													: undefined
											}
										/>
										{!isBuildServer && (
											<>
												<StatusRow
													label={t("validateServer.dockerSwarmInitialized")}
													isEnabled={data?.isSwarmInstalled}
													description={
														data?.isSwarmInstalled
															? t("validateServer.initialized")
															: t("validateServer.notInitialized")
													}
												/>
												<StatusRow
													label={t("validateServer.dokployNetworkCreated")}
													isEnabled={data?.isDokployNetworkInstalled}
													description={
														data?.isDokployNetworkInstalled
															? t("validateServer.created")
															: t("validateServer.notCreated")
													}
												/>
											</>
										)}
										<StatusRow
											label={t("validateServer.mainDirectoryCreated")}
											isEnabled={data?.isMainDirectoryInstalled}
											description={
												data?.isMainDirectoryInstalled
													? t("validateServer.created")
													: t("validateServer.notCreated")
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
