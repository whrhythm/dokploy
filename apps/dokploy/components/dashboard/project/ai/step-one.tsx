"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

export const StepOne = ({ setTemplateInfo, templateInfo }: any) => {
	const { t } = useTranslation();
	const examples = [
		t("environment.Modal.aiAssistant.examples.blog"),
		t("environment.Modal.aiAssistant.examples.portfolio"),
		t("environment.Modal.aiAssistant.examples.adBlocker"),
		t("environment.Modal.aiAssistant.examples.dashboard"),
		t("environment.Modal.aiAssistant.examples.sendgrid"),
	];
	// Get servers from the API
	const { data: servers } = api.server.withSSHKey.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const hasServers = servers && servers.length > 0;
	// Show dropdown logic based on cloud environment
	// Cloud: show only if there are remote servers (no 小智Ops option)
	// Self-hosted: show only if there are remote servers (小智Ops is default, hide if no remote servers)
	const shouldShowServerDropdown = hasServers;

	const handleExampleClick = (example: string) => {
		setTemplateInfo({ ...templateInfo, userInput: example });
	};
	return (
		<div className="flex flex-col h-full gap-4">
			<div className="">
				<div className="space-y-4 ">
					<h2 className="text-lg font-semibold">
						{t("environment.Modal.aiAssistant.stepOne.title")}
					</h2>
					<div className="space-y-2">
						<Label htmlFor="user-needs">
							{t("environment.Modal.aiAssistant.stepOne.needsLabel")}
						</Label>
						<Textarea
							id="user-needs"
							placeholder={t(
								"environment.Modal.aiAssistant.stepOne.needsPlaceholder",
							)}
							value={templateInfo?.userInput}
							onChange={(e) =>
								setTemplateInfo({ ...templateInfo, userInput: e.target.value })
							}
							className="min-h-[100px]"
						/>
					</div>

					{shouldShowServerDropdown && (
						<div className="space-y-2">
							<Label htmlFor="server-deploy">
								{t("environment.Modal.aiAssistant.stepOne.serverLabel")}
							</Label>
							<Select
								value={
									templateInfo.server?.serverId ||
									(!isCloud ? "dokploy" : undefined)
								}
								onValueChange={(value) => {
									if (value === "dokploy") {
										setTemplateInfo({
											...templateInfo,
											server: undefined,
										});
									} else {
										const server = servers?.find((s) => s.serverId === value);
										if (server) {
											setTemplateInfo({
												...templateInfo,
												server: server,
											});
										}
									}
								}}
							>
								<SelectTrigger className="w-full">
									<SelectValue
										placeholder={
											!isCloud
												? "小智Ops"
												: t("environment.serverSelect.placeholder")
										}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{!isCloud && (
											<SelectItem value="dokploy">
												<span className="flex items-center gap-2 justify-between w-full">
													<span>小智Ops</span>
													<span className="text-muted-foreground text-xs self-center">
														{t("environment.serverSelect.default")}
													</span>
												</span>
											</SelectItem>
										)}
										{servers?.map((server) => (
											<SelectItem key={server.serverId} value={server.serverId}>
												{server.name}
											</SelectItem>
										))}
										<SelectLabel>
											{t("environment.serverSelect.count", {
												count: servers?.length + (!isCloud ? 1 : 0),
											})}
										</SelectLabel>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					)}

					<div className="space-y-2">
						<Label>{t("environment.Modal.aiAssistant.stepOne.examples")}</Label>
						<div className="flex flex-wrap gap-2">
							{examples.map((example, index) => (
								<Button
									key={index}
									variant="outline"
									size="sm"
									onClick={() => handleExampleClick(example)}
								>
									{example}
								</Button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
