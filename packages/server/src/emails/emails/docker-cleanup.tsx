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
	const summaryText =
		"系统已完成 Dokploy 服务器的 Docker 资源清理，并释放了冗余运行资源。";
	const summary = (
		<>
			系统已对 Dokploy 服务器
			<span style={{ color: "#059669", fontWeight: 600 }}>
				完成 Docker 资源清理
			</span>
			，并释放了冗余运行资源。
		</>
	);
	const context = "Dokploy / Docker / cleanup";

	return (
		<NotificationEmailTemplate
			previewText={summaryText}
			title={
				<>
					<strong>Dokploy</strong> Docker 资源清理
				</>
			}
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[{ label: "清理信息", value: message }]}
				context={context}
				action="Docker 清理完成"
				date={date}
			/>
		</NotificationEmailTemplate>
	);
};

export default DockerCleanupEmail;
