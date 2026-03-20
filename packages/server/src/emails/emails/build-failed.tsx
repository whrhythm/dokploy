import { Section, Text } from "@react-email/components";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	projectName: string;
	applicationName: string;
	applicationType: string;
	errorMessage: string;
	buildLink: string;
	date: string;
};

export const BuildFailedEmail = ({
	projectName = "dokploy",
	applicationName = "frontend",
	applicationType = "application",
	errorMessage = "Error array.length is not a function",
	buildLink = "https://dokploy.com/projects/dokploy-test/applications/dokploy-test",
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const previewText = `Build failed for ${applicationName}`;
	return (
		<NotificationEmailTemplate
			previewText={previewText}
			title={
				<>
					Build failed for <strong>{applicationName}</strong>
				</>
			}
			actionHref={buildLink}
			actionLabel="View build"
		>
			<Text className="text-black text-[14px] leading-[24px]">Hello,</Text>
			<Text className="text-black text-[14px] leading-[24px]">
				Your build for <strong>{applicationName}</strong> failed. Please check
				the error message below.
			</Text>
			<Section className="flex text-black text-[14px]  leading-[24px] bg-[#F4F4F5] rounded-lg p-2">
				<Text className="!leading-3 font-bold">Details: </Text>
				<Text className="!leading-3">
					Project Name: <strong>{projectName}</strong>
				</Text>
				<Text className="!leading-3">
					Application Name: <strong>{applicationName}</strong>
				</Text>
				<Text className="!leading-3">
					Application Type: <strong>{applicationType}</strong>
				</Text>
				<Text className="!leading-3">
					Date: <strong>{date}</strong>
				</Text>
			</Section>
			<Section className="flex text-black text-[14px]  mt-4 leading-[24px] bg-[#F4F4F5] rounded-lg p-2">
				<Text className="!leading-3 font-bold">Reason: </Text>
				<Text className="text-[12px] leading-[24px]">{errorMessage}</Text>
			</Section>
		</NotificationEmailTemplate>
	);
};

export default BuildFailedEmail;
