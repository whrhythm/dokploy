import { buildNotificationEmailSummary } from "@dokploy/server/utils/notifications/event-metadata";
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
	const summary = buildNotificationEmailSummary(meta);

	return (
		<NotificationEmailTemplate
			previewText={summary}
			title="Dokploy Server Restart"
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[{ label: "Date", value: date }]}
			/>
		</NotificationEmailTemplate>
	);
};

export default DokployRestartEmail;
