import * as React from "react";
import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	serverName: string;
	serverType: "Dokploy" | "Remote";
	type: "CPU" | "Memory" | "GPU" | "Disk";
	value: number;
	threshold: number;
	message: string;
	date: string;
};

export const ServerThresholdEmail = ({
	serverName = "小智Ops Host",
	serverType = "Dokploy",
	type = "CPU",
	value = 0,
	threshold = 0,
	message = "Threshold exceeded",
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const scopeLabel = serverType === "Dokploy" ? "宿主机" : "服务器";
	const summaryText = `${scopeLabel} ${serverName} 的 ${type} 使用率已超过阈值 ${threshold}%。`;
	const summary = React.createElement(
		React.Fragment,
		null,
		scopeLabel,
		" ",
		React.createElement("strong", null, serverName),
		" 的 ",
		type,
		" 使用率已超过阈值",
		React.createElement(
			"span",
			{ style: { color: "#DC2626", fontWeight: 600 } },
			` ${threshold}%`,
		),
		"。",
	);

	return React.createElement(
		NotificationEmailTemplate,
		{
			previewText: summaryText,
			title: React.createElement(
				React.Fragment,
				null,
				scopeLabel,
				" ",
				React.createElement("strong", null, type),
				" 预警",
			),
		},
		React.createElement(NotificationEventContent, {
			level: "Warning",
			summary,
			details: [
				{ label: "对象", value: serverName },
				{ label: "类型", value: type },
				{ label: "当前值", value: `${value.toFixed(2)}%` },
				{ label: "阈值", value: `${threshold.toFixed(2)}%` },
				{ label: "消息", value: message },
			],
			context: `${serverName} / ${type}`,
			action: "资源告警",
			date,
		}),
	);
};

export default ServerThresholdEmail;
