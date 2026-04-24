import * as React from "react";
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

// 容器健康状态变化通知邮件模板
export const ContainerHealthEmail = ({
	serverName = "小智Ops Test Server",
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
	const summary = React.createElement(
		React.Fragment,
		null,
		"容器 ",
		React.createElement("strong", null, containerName),
		" 的健康状态发生变化，当前状态为",
		React.createElement(
			"span",
			{ style: { color: "#DC2626", fontWeight: 600 } },
			" ",
			currentStatus,
		),
		"。",
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
