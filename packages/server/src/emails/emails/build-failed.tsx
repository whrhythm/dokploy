import { buildNotificationEmailSummary } from "@dokploy/server/utils/notifications/event-metadata";
import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	projectName: string;
	applicationName: string;
	applicationType: string;
	errorMessage: string;
	buildLink: string;
	date: string;
};

export const BuildFailedEmail = ({
	projectName = "dokploy",
	applicationName = "frontend",
	applicationType = "application",
	errorMessage = "Error array.length is not a function",
	buildLink = "https://dokploy.com/projects/dokploy-test/applications/dokploy-test",
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const meta = {
		level: "Warning" as const,
		eventObject: "Application",
		name: applicationName,
		event: "rebuild failed",
	};
	const summary = buildNotificationEmailSummary(meta);

	return (
		<NotificationEmailTemplate
			previewText={summary}
			title={
				<>
					Application <strong>#{applicationName}</strong> rebuild failed
				</>
			}
			actionHref={buildLink}
			actionLabel="View build"
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[
					{ label: "Project", value: projectName },
					{ label: "Application", value: applicationName },
					{ label: "Type", value: applicationType },
					{ label: "Date", value: date },
				]}
				reason={errorMessage}
			/>
		</NotificationEmailTemplate>
	);
};

export default BuildFailedEmail;
