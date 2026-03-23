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
	const summaryText =
		type === "success"
			? `System completed a database backup for the application ${applicationName} in project ${projectName}.`
			: `System encountered an error while backing up the database for the application ${applicationName} in project ${projectName}, which caused the backup to fail. See Reason for details.`;
	const summary =
		type === "success" ? (
			<>
				System{" "}
				<span style={{ color: "#059669", fontWeight: 600 }}>
					successfully completed a database backup
				</span>{" "}
				for the application <strong>{applicationName}</strong> in project{" "}
				{projectName}.
			</>
		) : (
			<>
				System{" "}
				<span style={{ color: "#DC2626", fontWeight: 600 }}>
					encountered an error while backing up the database
				</span>{" "}
				for the application <strong>{applicationName}</strong> in project{" "}
				{projectName}, which caused the backup to fail. See Reason for details.
			</>
		);
	const action =
		type === "success" ? "database backup succeeded" : "database backup failed";

	return (
		<NotificationEmailTemplate
			previewText={summaryText}
			title={
				<>
					Database backup for <strong>{applicationName}</strong>
				</>
			}
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[{ label: "Database Type", value: databaseType }]}
				reason={type === "error" ? errorMessage : undefined}
				context={`${projectName} / ${applicationName} / ${databaseType}`}
				action={action}
				date={date}
			/>
		</NotificationEmailTemplate>
	);
};

export default DatabaseBackupEmail;
