import { Section, Text } from "@react-email/components";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	projectName: string;
	applicationName: string;
	volumeName: string;
	serviceType:
		| "application"
		| "postgres"
		| "mysql"
		| "mongodb"
		| "mariadb"
		| "redis"
		| "compose";
	type: "error" | "success";
	errorMessage?: string;
	backupSize?: string;
	date: string;
};

export const VolumeBackupEmail = ({
	projectName = "dokploy",
	applicationName = "frontend",
	volumeName = "app-data",
	serviceType = "application",
	type = "success",
	errorMessage,
	backupSize,
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const previewText = `Volume backup for ${applicationName} was ${type === "success" ? "successful ✅" : "failed ❌"}`;
	return (
		<NotificationEmailTemplate
			previewText={previewText}
			title={
				<>
					Volume backup for <strong>{applicationName}</strong>
				</>
			}
		>
			<Text className="text-black text-[14px] leading-[24px]">Hello,</Text>
			<Text className="text-black text-[14px] leading-[24px]">
				Your volume backup for <strong>{applicationName}</strong> was{" "}
				{type === "success"
					? "successful ✅"
					: "failed. Please check the error message below. ❌"}
				.
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
					Volume Name: <strong>{volumeName}</strong>
				</Text>
				<Text className="!leading-3">
					Service Type: <strong>{serviceType}</strong>
				</Text>
				{backupSize && (
					<Text className="!leading-3">
						Backup Size: <strong>{backupSize}</strong>
					</Text>
				)}
				<Text className="!leading-3">
					Date: <strong>{date}</strong>
				</Text>
			</Section>
			{type === "error" && errorMessage ? (
				<Section className="flex text-black text-[14px]  mt-4 leading-[24px] bg-[#F4F4F5] rounded-lg p-2">
					<Text className="!leading-3 font-bold">Reason: </Text>
					<Text className="text-[12px] leading-[24px]">
						{errorMessage || "Error message not provided"}
					</Text>
				</Section>
			) : null}
		</NotificationEmailTemplate>
	);
};

export default VolumeBackupEmail;
