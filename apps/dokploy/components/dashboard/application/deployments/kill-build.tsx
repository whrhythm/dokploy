import { Scissors } from "lucide-react";
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

interface Props {
	id: string;
	type: "application" | "compose";
}

export const KillBuild = ({ id, type }: Props) => {
	const { t } = useTranslation();
	const { mutateAsync, isPending } =
		type === "application"
			? api.application.killBuild.useMutation()
			: api.compose.killBuild.useMutation();

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="outline" className="w-fit" isLoading={isPending}>
					{t("services.deployments.killBuild.button")}
					<Scissors className="size-4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("services.deployments.killBuild.confirmTitle")}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("services.deployments.killBuild.confirmDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("button.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={async () => {
							await mutateAsync({
								applicationId: id || "",
								composeId: id || "",
							})
								.then(() => {
									toast.success(
										t("services.deployments.killBuild.toast.success"),
									);
								})
								.catch((err) => {
									toast.error(err.message);
								});
						}}
					>
						{t("button.confirm")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
