import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	projectName: string;
	applicationName: string;
	environmentName?: string;
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
	projectName = "小智Ops",
	applicationName = "frontend",
	environmentName,
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
	const projectScope = environmentName
		? `${projectName}（${environmentName}）`
		: projectName;
	const summaryText =
		type === "success"
			? `系统已在 ${projectScope} 项目中完成应用 ${applicationName} 的存储卷备份。`
			: `系统在 ${projectScope} 项目中执行应用 ${applicationName} 的存储卷备份时发生错误，导致备份失败，具体错误详见后续系统报错。`;
	const summary =
		type === "success" ? (
			<>
				系统已在 {projectScope} 项目中
				<span style={{ color: "#059669", fontWeight: 600 }}>
					完成存储卷备份
				</span>
				，应用 <strong>{applicationName}</strong>。
			</>
		) : (
			<>
				系统在 {projectScope} 项目中
				<span style={{ color: "#DC2626", fontWeight: 600 }}>
					执行存储卷备份时发生错误
				</span>
				，应用 <strong>{applicationName}</strong>{" "}
				的存储卷备份失败，具体错误详见后续系统报错。
			</>
		);
	const action = type === "success" ? "存储卷备份成功" : "存储卷备份失败";

	return (
		<NotificationEmailTemplate
			previewText={summaryText}
			title={
				<>
					应用 <strong>{applicationName}</strong> 存储卷备份
				</>
			}
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[
					{ label: "存储卷", value: volumeName },
					{ label: "服务类型", value: serviceType },
					...(backupSize ? [{ label: "备份大小", value: backupSize }] : []),
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
