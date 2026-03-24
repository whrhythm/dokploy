import type {
	NotificationActor,
	NotificationLevel,
	NotificationTriggerSource,
} from "@dokploy/server/utils/notifications/event-metadata";
import { Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

export interface NotificationEmailDetailsItem {
	label: string;
	value: ReactNode;
}

export interface NotificationEventContentProps {
	level: NotificationLevel;
	summary: ReactNode;
	details?: NotificationEmailDetailsItem[];
	reason?: string;
	actor?: NotificationActor;
	triggerSource?: NotificationTriggerSource;
	context: string;
	action: string;
	date: string;
}

const LEVEL_STYLES: Record<
	NotificationLevel,
	{ label: string; color: string }
> = {
	Notice: { label: "通知", color: "#059669" },
	Warning: { label: "警告", color: "#DC2626" },
};

const formatActor = (
	actor: NotificationActor | undefined,
	source: NotificationTriggerSource | undefined,
): string => {
	const roleLabel = actor?.role
		? {
				owner: "所有者",
				admin: "管理员",
				member: "成员",
			}[actor.role] || actor.role
		: null;

	if (actor?.name || actor?.email || actor?.id) {
		const identity = actor.name || actor.email || actor.id || "系统";
		return roleLabel ? `${identity}（${roleLabel}）` : identity;
	}
	if (source === "manual") return "系统";
	return "系统";
};

export const NotificationEventContent = ({
	level,
	summary,
	details,
	reason,
	actor,
	triggerSource,
	context,
	action,
	date,
}: NotificationEventContentProps) => {
	const { label, color } = LEVEL_STYLES[level];
	const normalizedDetails: NotificationEmailDetailsItem[] = [
		{ label: "位置", value: context },
		{ label: "状态", value: action },
		{ label: "时间", value: date },
		{
			label: "源",
			value: formatActor(actor, triggerSource),
		},
		...(details ?? []),
	];

	return (
		<>
			<Text
				style={{
					color,
					fontSize: "14px",
					lineHeight: "24px",
					margin: "0 0 8px 0",
					width: "100%",
					fontWeight: 600,
				}}
			>
				{label}
			</Text>
			<Text
				style={{
					color: "#000000",
					fontSize: "14px",
					lineHeight: "24px",
					margin: "0 0 12px 0",
					width: "100%",
				}}
			>
				{summary}
			</Text>
			<Section
				style={{
					color: "#000000",
					fontSize: "14px",
					lineHeight: "24px",
					backgroundColor: "#F4F4F5",
					borderRadius: "8px",
					padding: "12px",
					width: "100%",
				}}
			>
				<Text style={{ fontWeight: 700, margin: "0 0 10px 0" }}>详情</Text>
				<table
					width="100%"
					cellPadding={0}
					cellSpacing={0}
					role="presentation"
					style={{ tableLayout: "fixed", width: "100%" }}
				>
					<tbody>
						{normalizedDetails.map((detail, index) => (
							<tr key={`${detail.label}-${index}`}>
								<td
									style={{
										verticalAlign: "top",
										width: "112px",
										padding: "2px 8px 2px 0",
										color: "#4B5563",
										fontSize: "13px",
										wordBreak: "break-word",
										overflowWrap: "anywhere",
										wordWrap: "break-word",
									}}
								>
									{detail.label}:
								</td>
								<td
									style={{
										verticalAlign: "top",
										padding: "2px 0",
										fontSize: "14px",
										color: "#111827",
										maxWidth: "100%",
										wordBreak: "break-word",
										overflowWrap: "anywhere",
										wordWrap: "break-word",
									}}
								>
									<strong>{detail.value}</strong>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</Section>
			{reason ? (
				<Section
					style={{
						color: "#000000",
						fontSize: "14px",
						lineHeight: "24px",
						backgroundColor: "#FEF2F2",
						borderRadius: "8px",
						padding: "12px",
						marginTop: "16px",
						width: "100%",
					}}
				>
					<Text style={{ fontWeight: 700, color, margin: "0 0 8px 0" }}>
						系统报错
					</Text>
					<Text
						style={{
							fontSize: "12px",
							lineHeight: "20px",
							whiteSpace: "pre-wrap",
							wordBreak: "break-word",
							overflowWrap: "anywhere",
							wordWrap: "break-word",
							maxWidth: "100%",
							margin: "0",
						}}
					>
						{reason}
					</Text>
				</Section>
			) : null}
		</>
	);
};

export default NotificationEventContent;
