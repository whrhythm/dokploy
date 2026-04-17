import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	projectName: string;
	applicationName: string;
	environmentName?: string;
	databaseType: "postgres" | "mysql" | "mongodb" | "mariadb";
	type: "error" | "success";
	errorMessage?: string;
	date: string;
};

export const DatabaseBackupEmail = ({
	projectName = "小智Ops",
	applicationName = "frontend",
	environmentName,
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
	const projectScope = environmentName
		? `${projectName}（${environmentName}）`
		: projectName;
	const summaryText =
		type === "success"
			? `系统已在 ${projectScope} 项目中完成应用 ${applicationName} 的数据库备份。`
			: `系统在 ${projectScope} 项目中执行应用 ${applicationName} 的数据库备份时发生错误，导致备份失败，具体错误详见后续系统报错。`;
	const summary =
		type === "success" ? (
			<>
				系统已在 {projectScope} 项目中
				<span style={{ color: "#059669", fontWeight: 600 }}>
					完成数据库备份
				</span>
				，应用 <strong>{applicationName}</strong>。
			</>
		) : (
			<>
				系统在 {projectScope} 项目中
				<span style={{ color: "#DC2626", fontWeight: 600 }}>
					执行数据库备份时发生错误
				</span>
				，应用 <strong>{applicationName}</strong>{" "}
				的数据库备份失败，具体错误详见后续系统报错。
			</>
		);
	const action = type === "success" ? "数据库备份成功" : "数据库备份失败";

	return (
		<NotificationEmailTemplate
			previewText={summaryText}
			title={
				<>
					应用 <strong>{applicationName}</strong> 数据库备份
				</>
			}
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[{ label: "数据库类型", value: databaseType }]}
				reason={type === "error" ? errorMessage : undefined}
				context={`${projectName} / ${applicationName} / ${databaseType}`}
				action={action}
				date={date}
			/>
		</NotificationEmailTemplate>
	);
};

export default DatabaseBackupEmail;
