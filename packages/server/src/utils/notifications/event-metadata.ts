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
	role?: string | null;
}

export interface NotificationEventMeta {
	level: NotificationLevel;
	eventObject: string;
	name?: string;
	event: string;
}

export const buildNotificationEmailSubject = ({
	level,
	eventObject,
	name,
	event,
}: NotificationEventMeta) => {
	const levelLabel = level === "Notice" ? "通知" : "警告";
	return `[小智Ops ${levelLabel}] ${eventObject}${name ? `#${name}` : ""} ${event}`;
};

export const buildNotificationEmailSummary = ({
	eventObject,
	name,
	event,
}: NotificationEventMeta) => `${eventObject}${name ? `#${name}` : ""}${event}`;
