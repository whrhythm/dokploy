import { Section, Text } from "@react-email/components";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	message: string;
	date: string;
};

export const DockerCleanupEmail = ({
	message = "Docker cleanup for dokploy",
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const previewText = "Docker cleanup for dokploy";
	return (
		<NotificationEmailTemplate
			previewText={previewText}
			title={
				<>
					Docker cleanup for <strong>dokploy</strong>
				</>
			}
		>
			<Text className="text-black text-[14px] leading-[24px]">Hello,</Text>
			<Text className="text-black text-[14px] leading-[24px]">
				The docker cleanup for <strong>dokploy</strong> was successful ✅
			</Text>
			<Section className="flex text-black text-[14px]  leading-[24px] bg-[#F4F4F5] rounded-lg p-2">
				<Text className="!leading-3 font-bold">Details: </Text>
				<Text className="!leading-3">
					Message: <strong>{message}</strong>
				</Text>
				<Text className="!leading-3">
					Date: <strong>{date}</strong>
				</Text>
			</Section>
		</NotificationEmailTemplate>
	);
};

export default DockerCleanupEmail;
