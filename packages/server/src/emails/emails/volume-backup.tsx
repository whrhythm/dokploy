import { buildNotificationEmailSummary } from "@dokploy/server/utils/notifications/event-metadata";
import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	projectName: string;
	applicationName: string;
	volumeName: string;
	serviceType:
		| "application"
		| "postgres"
		| "mysql"
		| "mongodb"
		| "mariadb"
		| "redis"
		| "compose";
	type: "error" | "success";
	errorMessage?: string;
	backupSize?: string;
	date: string;
};

export const VolumeBackupEmail = ({
	projectName = "dokploy",
	applicationName = "frontend",
	volumeName = "app-data",
	serviceType = "application",
	type = "success",
	errorMessage,
	backupSize,
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const meta = {
		level: type === "success" ? ("Notice" as const) : ("Warning" as const),
		eventObject: "Volume",
		name: volumeName,
		event: type === "success" ? "backup succeeded" : "backup failed",
	};
	const summary = buildNotificationEmailSummary(meta);

	return (
		<NotificationEmailTemplate
			previewText={summary}
			title={
				<>
					Volume backup for <strong>{applicationName}</strong>
				</>
			}
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[
					{ label: "Project", value: projectName },
					{ label: "Application", value: applicationName },
					{ label: "Volume", value: volumeName },
					{ label: "Service Type", value: serviceType },
					...(backupSize ? [{ label: "Backup Size", value: backupSize }] : []),
					{ label: "Date", value: date },
				]}
				reason={type === "error" ? errorMessage : undefined}
			/>
		</NotificationEmailTemplate>
	);
};

export default VolumeBackupEmail;
