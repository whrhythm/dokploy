import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import copy from "copy-to-clipboard";
import {
	CopyIcon,
	DownloadIcon,
	KeyRound,
	RefreshCw,
	ShieldOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { authClient } from "@/lib/auth-client";
import { api } from "@/utils/api";

const createPasswordSchema = (t: (key: string) => string) =>
	z.object({
		password: z.string().min(8, {
			message: t("profile.2fa.validation.passwordRequired"),
		}),
	});

type PasswordForm = z.infer<ReturnType<typeof createPasswordSchema>>;
type Step = "password" | "actions" | "backup-codes";

export const Configure2FA = () => {
	const { t } = useTranslation();
	const utils = api.useUtils();
	const { data: currentUser } = api.user.get.useQuery();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [step, setStep] = useState<Step>("password");
	const [password, setPassword] = useState("");
	const [backupCodes, setBackupCodes] = useState<string[]>([]);
	const [showDisableConfirm, setShowDisableConfirm] = useState(false);
	const [isDisabling, setIsDisabling] = useState(false);
	const [isRegenerating, setIsRegenerating] = useState(false);

	const form = useForm<PasswordForm>({
		resolver: zodResolver(createPasswordSchema(t)),
		defaultValues: {
			password: "",
		},
	});

	useEffect(() => {
		if (!isDialogOpen) {
			setStep("password");
			setPassword("");
			setBackupCodes([]);
			form.reset();
		}
	}, [isDialogOpen, form]);

	const handlePasswordSubmit = async (formData: PasswordForm) => {
		setIsRegenerating(true);
		try {
			// Verify password by attempting to generate backup codes
			// This validates the password and checks if 2FA is enabled
			const result = await authClient.twoFactor.generateBackupCodes({
				password: formData.password,
			});

			if (result.error) {
				form.setError("password", {
					message: t("profile.2fa.error.incorrectPassword"),
				});
				toast.error(t("profile.2fa.error.incorrectPassword"));
				return;
			}

			// If we get here, password is correct
			setPassword(formData.password);
			setStep("actions");
		} catch (error) {
			form.setError("password", {
				message:
					error instanceof Error
						? error.message
						: t("profile.2fa.error.incorrectPassword"),
			});
			toast.error(t("profile.2fa.error.incorrectPassword"));
		} finally {
			setIsRegenerating(false);
		}
	};

	const handleRegenerateBackupCodes = async () => {
		setIsRegenerating(true);
		try {
			const result = await authClient.twoFactor.generateBackupCodes({
				password,
			});

			if (result.error) {
				toast.error(t("profile.2fa.error.regenerateFailed"));
				return;
			}

			if (result.data?.backupCodes) {
				setBackupCodes(result.data.backupCodes);
				setStep("backup-codes");
				toast.success(t("profile.2fa.toast.backupRegenerated"));
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: t("profile.2fa.error.regenerateFailed"),
			);
		} finally {
			setIsRegenerating(false);
		}
	};

	const handleDisable2FA = async () => {
		setIsDisabling(true);
		try {
			const result = await authClient.twoFactor.disable({
				password,
			});

			if (result.error) {
				toast.error(t("profile.2fa.error.disableFailed"));
				return;
			}

			toast.success(t("profile.2fa.toast.disabled"));
			utils.user.get.invalidate();
			setIsDialogOpen(false);
			setShowDisableConfirm(false);
		} catch (error) {
			toast.error(t("profile.2fa.error.disableFailed"));
		} finally {
			setIsDisabling(false);
		}
	};

	const handleCloseDialog = () => {
		if (step === "backup-codes") {
			setStep("actions");
		} else {
			setIsDialogOpen(false);
		}
	};

	const handleDownloadBackupCodes = () => {
		if (!backupCodes || backupCodes.length === 0) {
			toast.error(t("profile.2fa.error.noBackupCodes"));
			return;
		}

		const backupCodesFormatted = backupCodes
			.map((code, index) => ` ${index + 1}. ${code}`)
			.join("\n");

		const date = new Date();
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const filename = `dokploy-2fa-backup-codes-${year}${month}${day}.txt`;

		const backupCodesText = t("profile.2fa.backupTemplate", {
			user: currentUser?.user?.email || t("profile.2fa.unknownUser"),
			date: date.toLocaleString(),
			codes: backupCodesFormatted,
		});

		const blob = new Blob([backupCodesText], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleCopyBackupCodes = () => {
		const date = new Date();

		const backupCodesFormatted = backupCodes
			.map((code, index) => ` ${index + 1}. ${code}`)
			.join("\n");

		const backupCodesText = t("profile.2fa.backupTemplate", {
			user: currentUser?.user?.email || t("profile.2fa.unknownUser"),
			date: date.toLocaleString(),
			codes: backupCodesFormatted,
		});

		copy(backupCodesText);
		toast.success(t("profile.2fa.toast.backupCopied"));
	};

	return (
		<>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogTrigger asChild>
					<Button variant="secondary">
						<KeyRound className="size-4 text-muted-foreground" />
						{t("profile.2fa.manage")}
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>
							{step === "password" && t("profile.2fa.verifyTitle")}
							{step === "actions" && t("profile.2fa.configTitle")}
							{step === "backup-codes" && t("profile.2fa.backupTitle")}
						</DialogTitle>
						<DialogDescription>
							{step === "password" && t("profile.2fa.verifyDescription")}
							{step === "actions" && t("profile.2fa.actionsDescription")}
							{step === "backup-codes" && t("profile.2fa.backupDescription")}
						</DialogDescription>
					</DialogHeader>

					{step === "password" && (
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(handlePasswordSubmit)}
								className="space-y-4"
							>
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("profile.2fa.password")}</FormLabel>
											<FormControl>
												<Input
													type="password"
													placeholder={t("profile.2fa.passwordPlaceholder")}
													{...field}
												/>
											</FormControl>
											<FormDescription>
												{t("profile.2fa.passwordContinue")}
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="flex justify-end gap-4">
									<Button
										type="button"
										variant="outline"
										onClick={() => setIsDialogOpen(false)}
									>
										{t("button.cancel")}
									</Button>
									<Button type="submit" isLoading={isRegenerating}>
										{t("profile.2fa.continue")}
									</Button>
								</div>
							</form>
						</Form>
					)}

					{step === "actions" && (
						<div className="space-y-4">
							<div className="grid gap-3">
								<div className="flex flex-col gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<h4 className="font-medium flex items-center gap-2">
												<RefreshCw className="size-4" />
												{t("profile.2fa.regenerateTitle")}
											</h4>
											<p className="text-sm text-muted-foreground mt-1">
												{t("profile.2fa.regenerateDesc")}
											</p>
										</div>
									</div>
									<Button
										onClick={handleRegenerateBackupCodes}
										variant="outline"
										className="w-full mt-2"
										isLoading={isRegenerating}
									>
										<RefreshCw className="size-4 mr-2" />
										{t("profile.2fa.regenerateAction")}
									</Button>
								</div>

								<div className="flex flex-col gap-2 p-4 border border-destructive/50 rounded-lg hover:bg-destructive/5 transition-colors">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<h4 className="font-medium flex items-center gap-2 text-destructive">
												<ShieldOff className="size-4" />
												{t("profile.2fa.disableTitle")}
											</h4>
											<p className="text-sm text-muted-foreground mt-1">
												{t("profile.2fa.disableDesc")}
											</p>
										</div>
									</div>
									<Button
										onClick={() => setShowDisableConfirm(true)}
										variant="destructive"
										className="w-full mt-2"
									>
										<ShieldOff className="size-4 mr-2" />
										{t("profile.2fa.disableAction")}
									</Button>
								</div>
							</div>

							<div className="flex justify-end">
								<Button
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									{t("button.close")}
								</Button>
							</div>
						</div>
					)}

					{step === "backup-codes" && (
						<div className="space-y-4">
							<div className="w-full space-y-3 border rounded-lg p-4 bg-muted/50">
								<div className="grid grid-cols-2 gap-2">
									{backupCodes.map((code, index) => (
										<code
											key={`${code}-${index}`}
											className="bg-background p-2 rounded text-sm font-mono text-center"
										>
											{code}
										</code>
									))}
								</div>
								<p className="text-sm text-muted-foreground">
									{t("profile.2fa.backupHelpFull")}
								</p>
							</div>

							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={handleDownloadBackupCodes}
									className="flex-1"
								>
									<DownloadIcon className="size-4 mr-2" />
									{t("profile.2fa.download")}
								</Button>
								<Button
									variant="outline"
									onClick={handleCopyBackupCodes}
									className="flex-1"
								>
									<CopyIcon className="size-4 mr-2" />
									{t("profile.2fa.copy")}
								</Button>
							</div>

							<div className="flex justify-end gap-4">
								<Button variant="outline" onClick={handleCloseDialog}>
									{t("profile.2fa.backToActions")}
								</Button>
								<Button onClick={() => setIsDialogOpen(false)}>
									{t("button.done")}
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={showDisableConfirm}
				onOpenChange={setShowDisableConfirm}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("profile.2fa.disableConfirmTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("profile.2fa.disableConfirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("button.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDisable2FA}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={isDisabling}
						>
							{isDisabling
								? t("profile.2fa.disabling")
								: t("profile.2fa.disableConfirmAction")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
