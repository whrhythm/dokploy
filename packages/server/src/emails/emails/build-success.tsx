import type {
	NotificationActor,
	NotificationTriggerSource,
} from "@dokploy/server/utils/notifications/event-metadata";
import * as React from "react";
import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	projectName: string;
	applicationName: string;
	applicationType: string;
	buildLink: string;
	date: string;
	environmentName: string;
	actor?: NotificationActor;
	triggerSource?: NotificationTriggerSource;
};

export const BuildSuccessEmail = ({
	projectName = "小智Ops",
	applicationName = "frontend",
	applicationType = "application",
	buildLink = "https://xiaozhiops.com/projects/xiaozhiops-test/applications/xiaozhiops-test",
	date = "2023-05-01T00:00:00.000Z",
	environmentName = "production",
	actor,
	triggerSource,
}: TemplateProps) => {
	const meta = {
		level: "Notice" as const,
		eventObject: "Application",
		name: applicationName,
		event: "rebuild succeeded",
	};
	const actorName = actor?.email || actor?.name || actor?.id;
	const roleLabel = actor?.role
		? {
				owner: "所有者",
				admin: "管理员",
				member: "成员",
			}[actor.role] || actor.role
		: null;
	const actorText = actorName ? `${roleLabel || "用户"} ${actorName}` : "系统";
	const projectScope = environmentName
		? `${projectName}（${environmentName}）`
		: projectName;
	const summaryText = `${actorText} 已在 ${projectScope} 项目中成功部署应用 ${applicationName}。`;
	const summary = React.createElement(
		React.Fragment,
		null,
		actorText,
		" 已在 ",
		projectScope,
		" 项目中",
		React.createElement(
			"span",
			{ style: { color: "#059669", fontWeight: 600 } },
			"成功部署",
		),
		"应用 ",
		React.createElement("strong", null, applicationName),
		"。",
	);

	return (
		<NotificationEmailTemplate
			previewText={summaryText}
			title={React.createElement(
				React.Fragment,
				null,
				"应用 ",
				React.createElement("strong", null, applicationName),
				" 部署成功",
			)}
			actionHref={buildLink}
			actionLabel="查看构建详情"
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[{ label: "应用类型", value: applicationType }]}
				actor={actor}
				triggerSource={triggerSource}
				context={`${projectName} / ${environmentName} / ${applicationName}`}
				action="应用部署成功"
				date={date}
			/>
		</NotificationEmailTemplate>
	);
};

export default BuildSuccessEmail;
