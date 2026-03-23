import { buildNotificationEmailSummary } from "@dokploy/server/utils/notifications/event-metadata";
import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	message: string;
	date: string;
};

export const DockerCleanupEmail = ({
	message = "Docker cleanup for dokploy",
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const meta = {
		level: "Notice" as const,
		eventObject: "Docker",
		name: "cleanup",
		event: "completed",
	};
	const summary = buildNotificationEmailSummary(meta);

	return (
		<NotificationEmailTemplate
			previewText={summary}
			title={
				<>
					Docker cleanup for <strong>Dokploy</strong>
				</>
			}
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[
					{ label: "Message", value: message },
					{ label: "Date", value: date },
				]}
			/>
		</NotificationEmailTemplate>
	);
};

export default DockerCleanupEmail;
