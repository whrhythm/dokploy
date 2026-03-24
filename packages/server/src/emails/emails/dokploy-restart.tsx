import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	date: string;
};

export const DokployRestartEmail = ({
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const meta = {
		level: "Notice" as const,
		eventObject: "Dokploy",
		name: "server",
		event: "restarted",
	};
	const summaryText = "系统已完成 Dokploy 服务重启，平台控制面已恢复可用。";
	const summary = (
		<>
			系统已
			<span style={{ color: "#059669", fontWeight: 600 }}>
				完成 Dokploy 服务重启
			</span>
			，平台控制面已恢复可用。
		</>
	);
	const context = "Dokploy / server";

	return (
		<NotificationEmailTemplate
			previewText={summaryText}
			title="Dokploy 服务重启"
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[]}
				context={context}
				action="Dokploy 服务重启"
				date={date}
			/>
		</NotificationEmailTemplate>
	);
};

export default DokployRestartEmail;
