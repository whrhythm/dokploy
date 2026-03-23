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
	errorMessage: string;
	buildLink: string;
	date: string;
	actor?: NotificationActor;
	triggerSource?: NotificationTriggerSource;
	environmentName?: string;
};

export const BuildFailedEmail = ({
	projectName = "dokploy",
	applicationName = "frontend",
	applicationType = "application",
	errorMessage = "Error array.length is not a function",
	buildLink = "https://dokploy.com/projects/dokploy-test/applications/dokploy-test",
	date = "2023-05-01T00:00:00.000Z",
	actor,
	triggerSource,
	environmentName = "production",
}: TemplateProps) => {
	const meta = {
		level: "Warning" as const,
		eventObject: "Application",
		name: applicationName,
		event: "rebuild failed",
	};
	const actorName = actor?.email || actor?.name || actor?.id;
	const actorText = actorName ? `Administrator ${actorName}` : "System";
	const summaryText = `${actorText} encountered an error while rebuilding the application ${applicationName} in project ${projectName} (${environmentName}), which caused the code build to fail. See Reason for details.`;
	const summary = (
		<>
			{actorText}{" "}
			<span style={{ color: "#DC2626", fontWeight: 600 }}>
				encountered an error while rebuilding
			</span>{" "}
			the application <strong>{applicationName}</strong> in project{" "}
			{projectName} ({environmentName}), which caused the code build to fail.
			See Reason for details.
		</>
	);

	return (
		<NotificationEmailTemplate
			previewText={summaryText}
			title={
				<>
					Application <strong>#{applicationName}</strong> rebuild failed
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
				reason={errorMessage}
				actor={actor}
				triggerSource={triggerSource}
				context={`${projectName} / ${environmentName} / ${applicationName}`}
				action="application rebuild failed"
				date={date}
			/>
		</NotificationEmailTemplate>
	);
};

export default BuildFailedEmail;
