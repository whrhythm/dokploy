import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/use-translation";

export const ToggleAutoCheckUpdates = ({ disabled }: { disabled: boolean }) => {
	const { t } = useTranslation();
	const [enabled, setEnabled] = useState<boolean>(
		localStorage.getItem("enableAutoCheckUpdates") === "true",
	);

	const handleToggle = (checked: boolean) => {
		setEnabled(checked);
		localStorage.setItem("enableAutoCheckUpdates", String(checked));
	};

	return (
		<div className="flex items-center gap-4">
			<Switch
				checked={enabled}
				onCheckedChange={handleToggle}
				id="autoCheckUpdatesToggle"
				disabled={disabled}
			/>
			<Label className="text-primary" htmlFor="autoCheckUpdatesToggle">
				{t("webServer.Modal.update.autoCheckUpdates")}
			</Label>
		</div>
	);
};
