import { Settings } from "lucide-react";
import { useState } from "react";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import {
	EndpointSpecForm,
	HealthCheckForm,
	LabelsForm,
	ModeForm,
	NetworkForm,
	PlacementForm,
	RestartPolicyForm,
	RollbackConfigForm,
	StopGracePeriodForm,
	UpdateConfigForm,
} from "./swarm-forms";

type MenuItem = {
	id: string;
	label: string;
	description: string;
	docDescription: string;
};

const menuItems = (t: (key: string) => string): MenuItem[] => [
	{
		id: "health-check",
		label: t("services.swarmSettings.menu.healthCheck"),
		description: t("services.swarmSettings.menu.healthCheckDescription"),
		docDescription: t("services.swarmSettings.menu.healthCheckDoc"),
	},
	{
		id: "restart-policy",
		label: t("services.swarmSettings.menu.restartPolicy"),
		description: t("services.swarmSettings.menu.restartPolicyDescription"),
		docDescription: t("services.swarmSettings.menu.restartPolicyDoc"),
	},
	{
		id: "placement",
		label: t("services.swarmSettings.menu.placement"),
		description: t("services.swarmSettings.menu.placementDescription"),
		docDescription: t("services.swarmSettings.menu.placementDoc"),
	},
	{
		id: "update-config",
		label: t("services.swarmSettings.menu.updateConfig"),
		description: t("services.swarmSettings.menu.updateConfigDescription"),
		docDescription: t("services.swarmSettings.menu.updateConfigDoc"),
	},
	{
		id: "rollback-config",
		label: t("services.swarmSettings.menu.rollbackConfig"),
		description: t("services.swarmSettings.menu.rollbackConfigDescription"),
		docDescription: t("services.swarmSettings.menu.rollbackConfigDoc"),
	},
	{
		id: "mode",
		label: t("services.swarmSettings.menu.mode"),
		description: t("services.swarmSettings.menu.modeDescription"),
		docDescription: t("services.swarmSettings.menu.modeDoc"),
	},
	{
		id: "network",
		label: t("services.swarmSettings.menu.network"),
		description: t("services.swarmSettings.menu.networkDescription"),
		docDescription: t("services.swarmSettings.menu.networkDoc"),
	},
	{
		id: "labels",
		label: t("services.swarmSettings.menu.labels"),
		description: t("services.swarmSettings.menu.labelsDescription"),
		docDescription: t("services.swarmSettings.menu.labelsDoc"),
	},
	{
		id: "stop-grace-period",
		label: t("services.swarmSettings.menu.stopGracePeriod"),
		description: t("services.swarmSettings.menu.stopGracePeriodDescription"),
		docDescription: t("services.swarmSettings.menu.stopGracePeriodDoc"),
	},
	{
		id: "endpoint-spec",
		label: t("services.swarmSettings.menu.endpointSpec"),
		description: t("services.swarmSettings.menu.endpointSpecDescription"),
		docDescription: t("services.swarmSettings.menu.endpointSpecDoc"),
	},
];

const hasStopGracePeriodSwarm = (
	value: unknown,
): value is { stopGracePeriodSwarm: bigint | number | string | null } =>
	typeof value === "object" &&
	value !== null &&
	"stopGracePeriodSwarm" in value;

interface Props {
	id: string;
	type: "postgres" | "mariadb" | "mongo" | "mysql" | "redis" | "application";
}

export const AddSwarmSettings = ({ id, type }: Props) => {
	const { t } = useTranslation();
	const items = menuItems(t);
	const [activeMenu, setActiveMenu] = useState<string>("health-check");
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="secondary" className="cursor-pointer w-fit">
					<Settings className="size-4 text-muted-foreground" />
					{t("services.swarmSettings.trigger")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-6xl max-h-[85vh]">
				<DialogHeader>
					<DialogTitle>{t("pages.Modal.swarmSettings.title")}</DialogTitle>
					<DialogDescription>
						{t("pages.Modal.swarmSettings.description")}
					</DialogDescription>
				</DialogHeader>
				<div>
					<AlertBlock type="info">
						{t("services.swarmSettings.warning")}
					</AlertBlock>
				</div>

				<div className="flex gap-4 h-[60vh] py-4">
					{/* Left Column - Menu */}
					<div className="w-64 flex-shrink-0 border-r pr-4 overflow-y-auto">
						<nav className="space-y-1">
							<TooltipProvider>
								{items.map((item) => (
									<Tooltip key={item.id}>
										<TooltipTrigger asChild>
											<button
												type="button"
												onClick={() => setActiveMenu(item.id)}
												className={cn(
													"w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
													activeMenu === item.id
														? "bg-primary text-primary-foreground"
														: "hover:bg-muted",
												)}
											>
												<div className="font-medium">{item.label}</div>
												<div className="text-xs opacity-80">
													{item.description}
												</div>
											</button>
										</TooltipTrigger>
										<TooltipContent side="right" className="max-w-xs">
											<p className="text-xs">{item.docDescription}</p>
										</TooltipContent>
									</Tooltip>
								))}
							</TooltipProvider>
						</nav>
					</div>

					{/* Right Column - Form */}
					<div className="flex-1 overflow-y-auto">
						{activeMenu === "health-check" && (
							<HealthCheckForm id={id} type={type} />
						)}
						{activeMenu === "restart-policy" && (
							<RestartPolicyForm id={id} type={type} />
						)}
						{activeMenu === "placement" && (
							<PlacementForm id={id} type={type} />
						)}
						{activeMenu === "update-config" && (
							<UpdateConfigForm id={id} type={type} />
						)}
						{activeMenu === "rollback-config" && (
							<RollbackConfigForm id={id} type={type} />
						)}
						{activeMenu === "mode" && <ModeForm id={id} type={type} />}
						{activeMenu === "network" && <NetworkForm id={id} type={type} />}
						{activeMenu === "labels" && <LabelsForm id={id} type={type} />}
						{activeMenu === "stop-grace-period" && (
							<StopGracePeriodForm id={id} type={type} />
						)}
						{activeMenu === "endpoint-spec" && (
							<EndpointSpecForm id={id} type={type} />
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
