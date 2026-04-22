import { sendServerThresholdNotifications } from "./server-threshold";

type HostThresholdType = "CPU" | "Memory" | "Disk";

const hostAlertState = new Map<string, boolean>();

export const notifyHostThreshold = async ({
	organizationId,
	type,
	value,
	threshold,
	serverName,
	force = false,
}: {
	organizationId: string;
	type: HostThresholdType;
	value: number | null;
	threshold: number;
	serverName: string;
	force?: boolean;
}) => {
	const alertKey = `${organizationId}:${type}`;
	const wasAbove = hostAlertState.get(alertKey) ?? false;
	const isAbove = value != null ? value > threshold : false;

	if (value == null) return;

	if (isAbove && (force || !wasAbove)) {
		console.log(
			"+++++++++++++++++++++++++++++++++++++++++++++ host alert triggered",
			{
				organizationId,
				serverName,
				type,
				value,
				threshold,
				above: true,
				force,
			},
		);
		hostAlertState.set(alertKey, true);

		try {
			await sendServerThresholdNotifications(organizationId, {
				ServerType: "Dokploy",
				Type: type,
				Value: value,
				Threshold: threshold,
				Message: `${type} usage is above the configured threshold.`,
				Timestamp: new Date().toISOString(),
				Token: "host-monitoring",
				ServerName: serverName,
			});
		} catch (error) {
			console.error("Failed to send host threshold notification", error);
		}
		return;
	}

	if (!isAbove && wasAbove) {
		console.log(
			"+++++++++++++++++++++++++++++++++++++++++++++ host alert reset",
			{
				organizationId,
				serverName,
				type,
				value,
				threshold,
				above: false,
				force,
			},
		);
		hostAlertState.set(alertKey, false);
	}
};
