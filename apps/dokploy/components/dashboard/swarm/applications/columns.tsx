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
import { ShowDockerModalStackLogs } from "../../docker/logs/show-docker-modal-stack-logs";

export interface ApplicationList {
	ID: string;
	Image: string;
	Mode: string;
	Name: string;
	Ports: string;
	Replicas: string;
	CurrentState: string;
	DesiredState: string;
	Error: string;
	Node: string;
	serverId: string;
}

let _globalT: ((key: string) => string) | null = null;

const translateColumn = (key: string): string => {
	const t = _globalT;
	if (t) {
		const translations: Record<string, string> = {
			id: t("swarm.table.id"),
			name: t("swarm.table.name"),
			image: t("swarm.table.image"),
			mode: t("swarm.table.mode"),
			currentState: t("swarm.table.currentState"),
			desiredState: t("swarm.table.desiredState"),
			replicas: t("swarm.table.replicas"),
			ports: t("swarm.table.ports"),
			errors: t("swarm.table.errors"),
			logs: t("swarm.table.logs"),
			actions: t("swarm.table.actions"),
			openMenu: t("swarm.table.openMenu"),
		};
		return translations[key] || key;
	}
	const translations: Record<string, string> = {
		id: "ID",
		name: "名称",
		image: "镜像",
		mode: "模式",
		currentState: "当前状态",
		desiredState: "期望状态",
		replicas: "副本数",
		ports: "端口",
		errors: "错误",
		logs: "日志",
		actions: "操作",
		openMenu: "Open menu",
	};
	return translations[key] || key;
};

export const setColumnsTranslator = (t: (key: string) => string) => {
	_globalT = t;
};

export const columns: ColumnDef<ApplicationList>[] = [
	{
		accessorKey: "ID",
		accessorFn: (row) => row.ID,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{translateColumn("id")}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div>{row.getValue("ID")}</div>;
		},
	},
	{
		accessorKey: "Name",
		accessorFn: (row) => row.Name,
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
			return <div>{row.getValue("Name")}</div>;
		},
	},
	{
		accessorKey: "Image",
		accessorFn: (row) => row.Image,
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
		cell: ({ row }) => {
			return <div>{row.getValue("Image")}</div>;
		},
	},
	{
		accessorKey: "Mode",
		accessorFn: (row) => row.Mode,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{translateColumn("mode")}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div>{row.getValue("Mode")}</div>;
		},
	},
	{
		accessorKey: "CurrentState",
		accessorFn: (row) => row.CurrentState,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{translateColumn("currentState")}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const value = row.getValue("CurrentState") as string;
			const valueStart = value.startsWith("Running")
				? "Running"
				: value.startsWith("Shutdown")
					? "Shutdown"
					: value;
			return (
				<div className="capitalize">
					<Badge
						variant={
							valueStart === "Running"
								? "default"
								: value === "Shutdown"
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
		accessorKey: "DesiredState",
		accessorFn: (row) => row.DesiredState,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{translateColumn("desiredState")}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div>{row.getValue("DesiredState")}</div>;
		},
	},

	{
		accessorKey: "Replicas",
		accessorFn: (row) => row.Replicas,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{translateColumn("replicas")}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div>{row.getValue("Replicas")}</div>;
		},
	},

	{
		accessorKey: "Ports",
		accessorFn: (row) => row.Ports,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{translateColumn("ports")}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div>{row.getValue("Ports")}</div>;
		},
	},
	{
		accessorKey: "Errors",
		accessorFn: (row) => row.Error,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{translateColumn("errors")}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div className="w-[10rem]">{row.getValue("Errors")}</div>;
		},
	},
	{
		accessorKey: "Logs",
		accessorFn: (row) => row.Error,
		header: () => {
			return <span>{translateColumn("logs")}</span>;
		},
		cell: ({ row }) => {
			return (
				<span className="w-[10rem]">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">{translateColumn("openMenu")}</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>
								{translateColumn("actions")}
							</DropdownMenuLabel>
							<ShowDockerModalStackLogs
								containerId={row.original.ID}
								serverId={row.original.serverId}
							>
								{translateColumn("logs")}
							</ShowDockerModalStackLogs>
						</DropdownMenuContent>
					</DropdownMenu>
				</span>
			);
		},
	},
];
