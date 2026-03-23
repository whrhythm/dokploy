import type {
	NotificationActor,
	NotificationTriggerSource,
} from "@dokploy/server/utils/notifications/event-metadata";
import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	projectName: string;
	applicationName: string;
	applicationType: string;
	buildLink: string;
	date: string;
	environmentName: string;
	actor?: NotificationActor;
	triggerSource?: NotificationTriggerSource;
};

export const BuildSuccessEmail = ({
	projectName = "dokploy",
	applicationName = "frontend",
	applicationType = "application",
	buildLink = "https://dokploy.com/projects/dokploy-test/applications/dokploy-test",
	date = "2023-05-01T00:00:00.000Z",
	environmentName = "production",
	actor,
	triggerSource,
}: TemplateProps) => {
	const meta = {
		level: "Notice" as const,
		eventObject: "Application",
		name: applicationName,
		event: "rebuild succeeded",
	};
	const actorName = actor?.email || actor?.name || actor?.id;
	const actorText = actorName ? `Administrator ${actorName}` : "System";
	const summaryText = `${actorText} successfully deployed the application ${applicationName} in project ${projectName} (${environmentName}).`;
	const summary = (
		<>
			{actorText}{" "}
			<span style={{ color: "#059669", fontWeight: 600 }}>
				successfully deployed
			</span>{" "}
			the application <strong>{applicationName}</strong> in project{" "}
			{projectName} ({environmentName}).
		</>
	);

	return (
		<NotificationEmailTemplate
			previewText={summaryText}
			title={
				<>
					Application <strong>#{applicationName}</strong> rebuild succeeded
				</>
			}
			actionHref={buildLink}
			actionLabel="View build"
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[
					{ label: "Project", value: projectName },
					{ label: "Application", value: applicationName },
					{ label: "Environment", value: environmentName },
					{ label: "Type", value: applicationType },
				]}
				actor={actor}
				triggerSource={triggerSource}
				context={`${projectName} / ${environmentName} / ${applicationName}`}
				action="application rebuild succeeded"
				date={date}
			/>
		</NotificationEmailTemplate>
	);
};

export default BuildSuccessEmail;
