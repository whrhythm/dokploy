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
	const context = "Dokploy / Docker / cleanup";

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
					{ label: "Project", value: "Dokploy" },
					{ label: "Application", value: "System" },
					{ label: "Message", value: message },
				]}
				context={context}
				action="docker cleanup completed"
				date={date}
			/>
		</NotificationEmailTemplate>
	);
};

export default DockerCleanupEmail;
