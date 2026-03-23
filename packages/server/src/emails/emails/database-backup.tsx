import { buildNotificationEmailSummary } from "@dokploy/server/utils/notifications/event-metadata";
import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	projectName: string;
	applicationName: string;
	databaseType: "postgres" | "mysql" | "mongodb" | "mariadb";
	type: "error" | "success";
	errorMessage?: string;
	date: string;
};

export const DatabaseBackupEmail = ({
	projectName = "dokploy",
	applicationName = "frontend",
	databaseType = "postgres",
	type = "success",
	errorMessage,
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const meta = {
		level: type === "success" ? ("Notice" as const) : ("Warning" as const),
		eventObject: "Database",
		name: applicationName,
		event: type === "success" ? "backup succeeded" : "backup failed",
	};
	const summary = buildNotificationEmailSummary(meta);
	const action =
		type === "success" ? "database backup succeeded" : "database backup failed";

	return (
		<NotificationEmailTemplate
			previewText={summary}
			title={
				<>
					Database backup for <strong>{applicationName}</strong>
				</>
			}
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[
					{ label: "Project", value: projectName },
					{ label: "Application", value: applicationName },
					{ label: "Database Type", value: databaseType },
				]}
				reason={type === "error" ? errorMessage : undefined}
				context={`${projectName} / ${applicationName} / ${databaseType}`}
				action={action}
				date={date}
			/>
		</NotificationEmailTemplate>
	);
};

export default DatabaseBackupEmail;
