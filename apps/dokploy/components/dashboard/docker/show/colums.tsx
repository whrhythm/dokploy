import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShowContainerConfig } from "../config/show-container-config";
import { ShowDockerModalLogs } from "../logs/show-docker-modal-logs";
import { DockerTerminalModal } from "../terminal/docker-terminal-modal";
import type { Container } from "./show-containers";

const translateColumn = (key: string): string => {
	const translations: Record<string, string> = {
		name: "名称",
		state: "状态",
		status: "状态",
		image: "镜像",
		createdAt: "创建时间",
		ports: "端口",
		actions: "操作",
		viewLogs: "查看日志",
		terminal: "终端",
		config: "配置",
	};
	return translations[key] || key;
};

export const columns: ColumnDef<Container>[] = [
	{
		accessorKey: "name",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{translateColumn("name")}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div>{row.getValue("name")}</div>;
		},
	},
	{
		accessorKey: "state",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{translateColumn("state")}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const value = row.getValue("state") as string;
			return (
				<div className="capitalize">
					<Badge
						variant={
							value === "running"
								? "default"
								: value === "failed"
									? "destructive"
									: "secondary"
						}
					>
						{value}
					</Badge>
				</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{translateColumn("status")}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div className="capitalize">{row.getValue("status")}</div>;
		},
	},
	{
		accessorKey: "image",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{translateColumn("image")}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => <div className="lowercase">{row.getValue("image")}</div>,
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({ row }) => {
			const container = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>{translateColumn("actions")}</DropdownMenuLabel>
						<ShowDockerModalLogs
							containerId={container.containerId}
							serverId={container.serverId}
						>
							{translateColumn("viewLogs")}
						</ShowDockerModalLogs>
						<ShowContainerConfig
							containerId={container.containerId}
							serverId={container.serverId || ""}
						/>
						<DockerTerminalModal
							containerId={container.containerId}
							serverId={container.serverId || ""}
						>
							{translateColumn("terminal")}
						</DockerTerminalModal>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
