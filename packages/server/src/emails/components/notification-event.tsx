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
	Notice: { label: "Notice", color: "#059669" },
	Warning: { label: "Warning", color: "#DC2626" },
};

const formatActor = (
	actor: NotificationActor | undefined,
	source: NotificationTriggerSource | undefined,
): string => {
	if (actor?.name || actor?.email || actor?.id) {
		return actor.name || actor.email || actor.id || "System";
	}
	if (source === "manual") return "System";
	return "System";
};

const formatTriggerSource = (
	source: NotificationTriggerSource | undefined,
): string => {
	switch (source) {
		case "manual":
			return "Manual";
		case "schedule":
			return "Schedule";
		case "webhook":
			return "Webhook";
		default:
			return "System";
	}
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
		{ label: "Context", value: context },
		{ label: "Action", value: action },
		{ label: "Date", value: date },
		{
			label: "Triggered By",
			value: formatActor(actor, triggerSource),
		},
		{
			label: "Trigger Source",
			value: formatTriggerSource(triggerSource),
		},
		...(details ?? []),
	];

	return (
		<>
			<Text
				style={{
					color: "#000000",
					fontSize: "14px",
					lineHeight: "24px",
					margin: "0 0 8px 0",
					width: "100%",
				}}
			>
				Hello,
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
				<span style={{ color, fontWeight: 600 }}>{label}</span>
				{" — "}
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
				<Text style={{ fontWeight: 700, margin: "0 0 10px 0" }}>Details</Text>
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
						Reason
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
