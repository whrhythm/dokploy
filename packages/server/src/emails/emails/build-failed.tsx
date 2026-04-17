import type {
	NotificationActor,
	NotificationTriggerSource,
} from "@dokploy/server/utils/notifications/event-metadata";
import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	projectName: string;
	applicationName: string;
	applicationType: string;
	errorMessage: string;
	buildLink: string;
	date: string;
	actor?: NotificationActor;
	triggerSource?: NotificationTriggerSource;
	environmentName?: string;
};

export const BuildFailedEmail = ({
	projectName = "小智Ops",
	applicationName = "frontend",
	applicationType = "application",
	errorMessage = "Error array.length is not a function",
	buildLink = "https://xiaozhiops.com/projects/xiaozhiops-test/applications/xiaozhiops-test",
	date = "2023-05-01T00:00:00.000Z",
	actor,
	triggerSource,
	environmentName = "production",
}: TemplateProps) => {
	const meta = {
		level: "Warning" as const,
		eventObject: "Application",
		name: applicationName,
		event: "rebuild failed",
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
	const summaryText = `${actorText} 在 ${projectScope} 项目中重建应用 ${applicationName} 时发生错误，导致代码构建失败，具体错误详见后续系统报错。`;
	const summary = (
		<>
			{actorText} 在 {projectScope} 项目中
			<span style={{ color: "#DC2626", fontWeight: 600 }}>
				在重建应用时发生错误
			</span>
			，应用 <strong>{applicationName}</strong>{" "}
			的代码构建失败，具体错误详见后续系统报错。
		</>
	);

	return (
		<NotificationEmailTemplate
			previewText={summaryText}
			title={
				<>
					应用 <strong>{applicationName}</strong> 构建失败
				</>
			}
			actionHref={buildLink}
			actionLabel="查看构建详情"
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[{ label: "应用类型", value: applicationType }]}
				reason={errorMessage}
				actor={actor}
				triggerSource={triggerSource}
				context={`${projectName} / ${environmentName} / ${applicationName}`}
				action="应用重建失败"
				date={date}
			/>
		</NotificationEmailTemplate>
	);
};

export default BuildFailedEmail;
