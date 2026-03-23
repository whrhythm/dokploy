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
	const summaryText =
		type === "success"
			? `System completed a volume backup for the application ${applicationName} in project ${projectName}.`
			: `System encountered an error while backing up the volume for the application ${applicationName} in project ${projectName}, which caused the backup to fail. See Reason for details.`;
	const summary =
		type === "success" ? (
			<>
				System{" "}
				<span style={{ color: "#059669", fontWeight: 600 }}>
					successfully completed a volume backup
				</span>{" "}
				for the application <strong>{applicationName}</strong> in project{" "}
				{projectName}.
			</>
		) : (
			<>
				System{" "}
				<span style={{ color: "#DC2626", fontWeight: 600 }}>
					encountered an error while backing up the volume
				</span>{" "}
				for the application <strong>{applicationName}</strong> in project{" "}
				{projectName}, which caused the backup to fail. See Reason for details.
			</>
		);
	const action =
		type === "success" ? "volume backup succeeded" : "volume backup failed";

	return (
		<NotificationEmailTemplate
			previewText={summaryText}
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
				]}
				reason={type === "error" ? errorMessage : undefined}
				context={`${projectName} / ${applicationName} / ${volumeName}`}
				action={action}
				date={date}
			/>
		</NotificationEmailTemplate>
	);
};

export default VolumeBackupEmail;
