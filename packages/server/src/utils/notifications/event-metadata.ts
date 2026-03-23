export type NotificationLevel = "Notice" | "Warning";

export type NotificationTriggerSource =
	| "manual"
	| "schedule"
	| "system"
	| "webhook";

export interface NotificationActor {
	id?: string;
	name?: string | null;
	email?: string | null;
}

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
