import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	serverName: string;
	containerName?: string;
	currentStatus?: string;
	previousStatus?: string;
	message: string;
	date: string;
};

export const ContainerHealthEmail = ({
	serverName = "Dokploy Test Server",
	containerName = "unknown",
	currentStatus = "unknown",
	previousStatus = "unknown",
	message = "Container health changed",
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const meta = {
		level: "Warning" as const,
		eventObject: "Container",
		name: containerName,
		event: "health changed",
	};

	const summaryText = `容器 ${containerName} 的健康状态发生变化，当前状态为 ${currentStatus}。`;
	const summary = (
		<>
			容器 <strong>{containerName}</strong> 的健康状态发生变化，当前状态为
			<span style={{ color: "#DC2626", fontWeight: 600 }}>
				{" "}
				{currentStatus}
			</span>
			。
		</>
	);

	return (
		<NotificationEmailTemplate
			previewText={summaryText}
			title="容器健康状态告警"
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[
					{ label: "服务器", value: serverName },
					{ label: "容器", value: containerName },
					{ label: "当前状态", value: currentStatus },
					{ label: "之前状态", value: previousStatus },
					{ label: "消息", value: message },
				]}
				context={`${serverName} / ${containerName}`}
				action="容器健康状态变化"
				date={date}
			/>
		</NotificationEmailTemplate>
	);
};

export default ContainerHealthEmail;
