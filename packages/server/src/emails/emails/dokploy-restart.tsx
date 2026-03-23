import { NotificationEventContent } from "../components/notification-event";
import { NotificationEmailTemplate } from "./__template-email__";

export type TemplateProps = {
	date: string;
};

export const DokployRestartEmail = ({
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const meta = {
		level: "Notice" as const,
		eventObject: "Dokploy",
		name: "server",
		event: "restarted",
	};
	const summaryText =
		"System restarted the Dokploy service, and the platform control plane is available again.";
	const summary = (
		<>
			System{" "}
			<span style={{ color: "#059669", fontWeight: 600 }}>
				successfully restarted
			</span>{" "}
			the Dokploy service, and the platform control plane is available again.
		</>
	);
	const context = "Dokploy / server";

	return (
		<NotificationEmailTemplate
			previewText={summaryText}
			title="Dokploy Server Restart"
		>
			<NotificationEventContent
				level={meta.level}
				summary={summary}
				details={[
					{ label: "Project", value: "Dokploy" },
					{ label: "Application", value: "Dokploy Server" },
				]}
				context={context}
				action="dokploy server restarted"
				date={date}
			/>
		</NotificationEmailTemplate>
	);
};

export default DokployRestartEmail;
