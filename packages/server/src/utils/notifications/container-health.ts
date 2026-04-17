import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { notifications } from "../../db/schema";
import ContainerHealthEmail from "@dokploy/server/emails/emails/container-health";
import { renderAsync } from "@react-email/components";
import { buildNotificationEmailSubject } from "./event-metadata";
import {
	sendCustomNotification,
	sendDiscordNotification,
	sendLarkNotification,
	sendPushoverNotification,
	sendEmailNotification,
	sendResendNotification,
	sendSlackNotification,
	sendTeamsNotification,
	sendTelegramNotification,
} from "./utils";

interface ContainerHealthPayload {
	Message: string;
	Timestamp: string;
	ServerName: string;
	ContainerName?: string;
	CurrentStatus?: string;
	PreviousStatus?: string;
}

export const sendContainerHealthNotifications = async (
	organizationId: string,
	payload: ContainerHealthPayload,
) => {
	const date = new Date(payload.Timestamp);
	const unixDate = ~~(Number(date) / 1000);

	const notificationList = await db.query.notifications.findMany({
		where: and(
			eq(notifications.containerHealth, true),
			eq(notifications.organizationId, organizationId),
		),
		with: {
			email: true,
			resend: true,
			discord: true,
			telegram: true,
			slack: true,
			custom: true,
			lark: true,
			pushover: true,
			teams: true,
		},
	});

	for (const notification of notificationList) {
		const {
			email,
			resend,
			discord,
			telegram,
			slack,
			custom,
			lark,
			pushover,
			teams,
		} = notification;

		if (email || resend) {
			const subject = buildNotificationEmailSubject({
				level: "Warning",
				eventObject: "容器",
				event: "健康状态变化",
			});

			const template = await renderAsync(
				ContainerHealthEmail({
					serverName: payload.ServerName,
					containerName: payload.ContainerName,
					currentStatus: payload.CurrentStatus,
					previousStatus: payload.PreviousStatus,
					message: payload.Message,
					date: date.toLocaleString(),
				}),
			).catch();

			if (email) {
				await sendEmailNotification(email, subject, template);
			}

			if (resend) {
				await sendResendNotification(resend, subject, template);
			}
		}

		if (discord) {
			const decorate = (decoration: string, text: string) =>
				`${discord.decoration ? decoration : ""} ${text}`.trim();

			await sendDiscordNotification(discord, {
				title: decorate(">", "`⚠️` Container Health Alert"),
				color: 0xff0000,
				fields: [
					{
						name: decorate("`🏷️`", "Server Name"),
						value: payload.ServerName,
						inline: true,
					},
					{
						name: decorate("`📦`", "Container"),
						value: payload.ContainerName || "Unknown",
						inline: true,
					},
					{
						name: decorate("`📅`", "Date"),
						value: `<t:${unixDate}:D>`,
						inline: true,
					},
					{
						name: decorate("`⌚`", "Time"),
						value: `<t:${unixDate}:t>`,
						inline: true,
					},
					{
						name: decorate("`🔁`", "Status"),
						value: `${payload.PreviousStatus || "unknown"} -> ${payload.CurrentStatus || "unknown"}`,
						inline: true,
					},
					{
						name: decorate("`📜`", "Message"),
						value: `\`\`\`${payload.Message}\`\`\``,
					},
				],
				timestamp: date.toISOString(),
				footer: {
					text: "Dokploy Container Health Alert",
				},
			});
		}

		if (telegram) {
			await sendTelegramNotification(
				telegram,
				`
				<b>⚠️ Container Health Alert</b>
                <b>Server Name:</b> ${payload.ServerName}
				<b>Container:</b> ${payload.ContainerName || "Unknown"}
				<b>Status:</b> ${payload.PreviousStatus || "unknown"} -> ${payload.CurrentStatus || "unknown"}
				<b>Message:</b> ${payload.Message}
				<b>Time:</b> ${date.toLocaleString()}
			`,
			);
		}

		if (slack) {
			const { channel } = slack;
			await sendSlackNotification(slack, {
				channel: channel,
				attachments: [
					{
						color: "#FF0000",
						pretext: ":warning: *Container Health Alert*",
						fields: [
							{ title: "Server Name", value: payload.ServerName, short: true },
							{
								title: "Container",
								value: payload.ContainerName || "Unknown",
								short: true,
							},
							{
								title: "Status",
								value: `${payload.PreviousStatus || "unknown"} -> ${payload.CurrentStatus || "unknown"}`,
								short: true,
							},
							{ title: "Message", value: payload.Message, short: false },
						],
						footer: "Dokploy Notification",
						ts: unixDate,
					},
				],
			});
		}

		if (custom) {
			await sendCustomNotification(custom, {
				message: payload.Message,
				type: "ContainerHealth",
				server: payload.ServerName,
				container: payload.ContainerName || "Unknown",
				currentStatus: payload.CurrentStatus || "unknown",
				previousStatus: payload.PreviousStatus || "unknown",
				timestamp: payload.Timestamp,
			});
		}

		if (lark) {
			const body = {
				msg_type: "interactive",
				card: {
					config: {
						wide_screen_mode: true,
					},
					header: {
						title: {
							tag: "plain_text",
							content: "Container Health Alert",
						},
						template: "red",
					},
					elements: [
						{
							tag: "div",
							text: {
								tag: "lark_md",
								content: `**Server:** ${payload.ServerName}\n**Container:** ${payload.ContainerName || "Unknown"}\n**Status:** ${payload.PreviousStatus || "unknown"} -> ${payload.CurrentStatus || "unknown"}\n**Message:** ${payload.Message}`,
							},
						},
					],
				},
			};
			await sendLarkNotification(lark, body);
		}

		if (pushover) {
			await sendPushoverNotification(
				pushover,
				"Container Health Alert",
				`Server: ${payload.ServerName}\nContainer: ${payload.ContainerName || "Unknown"}\nStatus: ${payload.PreviousStatus || "unknown"} -> ${payload.CurrentStatus || "unknown"}\n${payload.Message}`,
			);
		}

		if (teams) {
			const body = {
				"@type": "MessageCard",
				"@context": "https://schema.org/extensions",
				summary: "Container Health Alert",
				themeColor: "FF0000",
				title: "Container Health Alert",
				sections: [
					{
						facts: [
							{ name: "Server", value: payload.ServerName },
							{ name: "Container", value: payload.ContainerName || "Unknown" },
							{
								name: "Status",
								value: `${payload.PreviousStatus || "unknown"} -> ${payload.CurrentStatus || "unknown"}`,
							},
							{ name: "Message", value: payload.Message },
						],
					},
				],
			};
			await sendTeamsNotification(teams, body);
		}
	}
};
