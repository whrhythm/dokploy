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
import { useTranslation } from "@/hooks/use-translation";

interface Props {
	title?: string | React.ReactNode;
	description?: string | React.ReactNode;
	onClick: () => void;
	children?: React.ReactNode;
	disabled?: boolean;
	type?: "default" | "destructive";
}

export const DialogAction = ({
	onClick,
	children,
	description,
	title,
	disabled,
	type,
}: Props) => {
	const { t } = useTranslation();
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{title ?? "Are you absolutely sure?"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{description ?? "This action cannot be undone."}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("button.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						disabled={disabled}
						onClick={onClick}
						variant={type ?? "destructive"}
					>
						{t("button.confirm")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
