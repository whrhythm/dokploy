import { buildNotificationEmailSummary } from "@dokploy/server/utils/notifications/event-metadata";
import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	projectName: string;
	applicationName: string;
	applicationType: string;
	buildLink: string;
	date: string;
	environmentName: string;
};

export const BuildSuccessEmail = ({
	projectName = "dokploy",
	applicationName = "frontend",
	applicationType = "application",
	buildLink = "https://dokploy.com/projects/dokploy-test/applications/dokploy-test",
	date = "2023-05-01T00:00:00.000Z",
	environmentName = "production",
}: TemplateProps) => {
	const meta = {
		level: "Notice" as const,
		eventObject: "Application",
		name: applicationName,
		event: "rebuild succeeded",
	};
	const summary = buildNotificationEmailSummary(meta);

	return (
		<NotificationEmailTemplate
			previewText={summary}
			title={
				<>
					Application <strong>#{applicationName}</strong> rebuild succeeded
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
					{ label: "Environment", value: environmentName },
					{ label: "Type", value: applicationType },
					{ label: "Date", value: date },
				]}
			/>
		</NotificationEmailTemplate>
	);
};

export default BuildSuccessEmail;
