import dynamic from "next/dynamic";
import type React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";
export const DockerLogsId = dynamic(
	() =>
		import("@/components/dashboard/docker/logs/docker-logs-id").then(
			(e) => e.DockerLogsId,
		),
	{
		ssr: false,
	},
);

interface Props {
	containerId: string;
	children?: React.ReactNode;
	serverId?: string | null;
}

export const ShowDockerModalStackLogs = ({
	containerId,
	children,
	serverId,
}: Props) => {
	const { t } = useTranslation();

	return (
		<Dialog>
			<DialogTrigger asChild>
				<DropdownMenuItem
					className="w-full cursor-pointer space-x-3"
					onSelect={(e) => e.preventDefault()}
				>
					{children}
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="sm:max-w-7xl">
				<DialogHeader>
					<DialogTitle>{t("docker.Modal.logs.title")}</DialogTitle>
					<DialogDescription>
						{t("docker.Modal.logs.description", { id: containerId })}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4 pt-2.5">
					<DockerLogsId
						containerId={containerId || ""}
						serverId={serverId}
						runType="swarm"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
};
