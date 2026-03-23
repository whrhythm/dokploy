export type NotificationLevel = "Notice" | "Warning";

export interface NotificationEventMeta {
	level: NotificationLevel;
	eventObject: string;
	name: string;
	event: string;
}

export const buildNotificationEmailSubject = ({
	level,
	eventObject,
	name,
	event,
}: NotificationEventMeta) =>
	`[Dokploy ${level}] ${eventObject}#${name} ${event}`;

export const buildNotificationEmailSummary = ({
	eventObject,
	name,
	event,
}: NotificationEventMeta) => `Your ${eventObject}#${name} ${event}.`;
