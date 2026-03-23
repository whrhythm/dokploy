import type { NotificationLevel } from "@dokploy/server/utils/notifications/event-metadata";
import { Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

export interface NotificationEmailDetailsItem {
	label: string;
	value: ReactNode;
}

export interface NotificationEventContentProps {
	level: NotificationLevel;
	summary: string;
	details: NotificationEmailDetailsItem[];
	reason?: string;
}

const LEVEL_STYLES: Record<
	NotificationLevel,
	{ label: string; color: string }
> = {
	Notice: { label: "Notice", color: "#059669" },
	Warning: { label: "Warning", color: "#DC2626" },
};

export const NotificationEventContent = ({
	level,
	summary,
	details,
	reason,
}: NotificationEventContentProps) => {
	const { label, color } = LEVEL_STYLES[level];

	return (
		<>
			<Text className="text-black text-[14px] leading-[24px]">Hello,</Text>
			<Text className="text-black text-[14px] leading-[24px]">
				<span className="font-semibold" style={{ color }}>
					{label}
				</span>
				{" — "}
				{summary}
			</Text>
			<Section className="flex flex-col text-black text-[14px] leading-[24px] bg-[#F4F4F5] rounded-lg p-3 gap-1">
				<Text className="font-bold !leading-3">Details</Text>
				{details.map((detail, index) => (
					<Text key={`${detail.label}-${index}`} className="!leading-3">
						{detail.label}: <strong>{detail.value}</strong>
					</Text>
				))}
			</Section>
			{reason ? (
				<Section className="flex flex-col text-black text-[14px] leading-[24px] bg-[#FEF2F2] rounded-lg p-3 mt-4">
					<Text className="font-bold !leading-3" style={{ color }}>
						Reason
					</Text>
					<Text className="text-[12px] leading-[20px] whitespace-pre-wrap">
						{reason}
					</Text>
				</Section>
			) : null}
		</>
	);
};

export default NotificationEventContent;
