import { HardDriveDownload, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

export const UpdateWebServer = () => {
	const { t } = useTranslation();
	const [updating, setUpdating] = useState(false);
	const [open, setOpen] = useState(false);

	const { mutateAsync: updateServer } = api.settings.updateServer.useMutation();

	const checkIsUpdateFinished = async () => {
		try {
			const response = await fetch("/api/health");
			if (!response.ok) {
				throw new Error(t("webServer.Modal.update.healthCheckFailed"));
			}

			toast.success(t("webServer.Modal.update.toast.updatedReload"));

			setTimeout(() => {
				// Allow seeing the toast before reloading
				window.location.reload();
			}, 2000);
		} catch {
			// Delay each request
			await new Promise((resolve) => setTimeout(resolve, 2000));
			// Keep running until it returns 200
			void checkIsUpdateFinished();
		}
	};

	const handleConfirm = async () => {
		try {
			setUpdating(true);
			await updateServer();

			// Give some time for docker service restart before starting to check status
			await new Promise((resolve) => setTimeout(resolve, 8000));

			await checkIsUpdateFinished();
		} catch (error) {
			setUpdating(false);
			console.error("Error updating server:", error);
			toast.error(t("webServer.Modal.update.toast.updateError"));
		}
	};

	return (
		<AlertDialog open={open}>
			<AlertDialogTrigger asChild>
				<Button
					className="relative w-full"
					variant="secondary"
					onClick={() => setOpen(true)}
				>
					<HardDriveDownload className="h-4 w-4" />
					<span className="absolute -right-1 -top-2 flex h-3 w-3">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
						<span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
					</span>
					{t("webServer.Modal.update.action.updateServer")}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{updating
							? t("webServer.Modal.update.confirm.updatingTitle")
							: t("webServer.Modal.update.confirm.title")}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{updating ? (
							<span className="flex items-center gap-1">
								<Loader2 className="animate-spin" />
								{t("webServer.Modal.update.confirm.updatingDesc")}
							</span>
						) : (
							<>{t("webServer.Modal.update.confirm.description")}</>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				{!updating && (
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setOpen(false)}>
							{t("button.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirm}>
							{t("button.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				)}
			</AlertDialogContent>
		</AlertDialog>
	);
};
