import { Section, Text } from "@react-email/components";
import * as React from "react";
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
	const typeLabel =
		type === "CPU"
			? "CPU 使用率"
			: type === "Memory"
				? "内存使用率"
				: type === "Disk"
					? "磁盘使用率"
					: "GPU 使用率";
	const summaryText = `${scopeLabel} ${serverName} 的 ${typeLabel} 已超过阈值 ${threshold}%。当前值 ${value.toFixed(2)}%。`;
	const titleNode = React.createElement(
		React.Fragment,
		null,
		scopeLabel,
		" ",
		React.createElement("strong", null, typeLabel),
		" 预警",
	);
	const recommendation =
		type === "CPU"
			? "建议检查高负载进程、容器和系统调度。"
			: type === "Memory"
				? "建议检查内存占用高的进程或容器。"
				: "建议检查磁盘占用和日志/缓存清理。";

	return (
		<NotificationEmailTemplate previewText={summaryText} title={titleNode}>
			<Section style={{ padding: "0 24px", marginTop: "8px" }}>
				<Text
					style={{
						color: "#111827",
						fontSize: "15px",
						lineHeight: "24px",
						margin: "0 0 16px 0",
					}}
				>
					{scopeLabel} <strong>{serverName}</strong> 的 {typeLabel} 已超过阈值。
				</Text>

				<Section
					style={{
						backgroundColor: "#FEF2F2",
						borderRadius: "8px",
						padding: "16px",
						marginBottom: "16px",
					}}
				>
					<Text
						style={{
							color: "#991B1B",
							fontSize: "14px",
							lineHeight: "24px",
							margin: 0,
						}}
					>
						当前值 {value.toFixed(2)}% / 阈值 {threshold.toFixed(2)}%
					</Text>
				</Section>

				<Section
					style={{
						backgroundColor: "#F4F4F5",
						borderRadius: "8px",
						padding: "16px",
						marginBottom: "16px",
					}}
				>
					<Text
						style={{
							color: "#111827",
							fontSize: "14px",
							lineHeight: "24px",
							margin: "0 0 8px 0",
							fontWeight: 700,
						}}
					>
						告警详情
					</Text>
					<table
						width="100%"
						cellPadding={0}
						cellSpacing={0}
						role="presentation"
					>
						<tbody>
							<tr>
								<td
									style={{ color: "#6B7280", width: "120px", padding: "2px 0" }}
								>
									主机
								</td>
								<td style={{ color: "#111827", padding: "2px 0" }}>
									{serverName}
								</td>
							</tr>
							<tr>
								<td
									style={{ color: "#6B7280", width: "120px", padding: "2px 0" }}
								>
									类型
								</td>
								<td style={{ color: "#111827", padding: "2px 0" }}>
									{typeLabel}
								</td>
							</tr>
							<tr>
								<td
									style={{ color: "#6B7280", width: "120px", padding: "2px 0" }}
								>
									当前值
								</td>
								<td style={{ color: "#111827", padding: "2px 0" }}>
									{value.toFixed(2)}%
								</td>
							</tr>
							<tr>
								<td
									style={{ color: "#6B7280", width: "120px", padding: "2px 0" }}
								>
									阈值
								</td>
								<td style={{ color: "#111827", padding: "2px 0" }}>
									{threshold.toFixed(2)}%
								</td>
							</tr>
						</tbody>
					</table>
				</Section>

				<Section style={{ padding: "0 2px", marginTop: "4px" }}>
					<Text
						style={{
							color: "#4B5563",
							fontSize: "13px",
							lineHeight: "22px",
							margin: "0 0 8px 0",
						}}
					>
						{recommendation}
					</Text>
					<Text
						style={{
							color: "#6B7280",
							fontSize: "12px",
							lineHeight: "20px",
							margin: 0,
						}}
					>
						消息：{message}
						<br />
						时间：{date}
					</Text>
				</Section>
			</Section>
		</NotificationEmailTemplate>
	);
};

export default ServerThresholdEmail;
