import { Section, Text } from "@react-email/components";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	date: string;
};

export const DokployRestartEmail = ({
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const previewText = "Your dokploy server was restarted";
	return (
		<NotificationEmailTemplate
			previewText={previewText}
			title="Dokploy Server Restart"
		>
			<Text className="text-black text-[14px] leading-[24px]">Hello,</Text>
			<Text className="text-black text-[14px] leading-[24px]">
				Your dokploy server was restarted ✅
			</Text>
			<Section className="flex text-black text-[14px]  leading-[24px] bg-[#F4F4F5] rounded-lg p-2">
				<Text className="!leading-3 font-bold">Details: </Text>
				<Text className="!leading-3">
					Date: <strong>{date}</strong>
				</Text>
			</Section>
		</NotificationEmailTemplate>
	);
};

export default DokployRestartEmail;
