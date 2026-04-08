import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { PlusIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";
import { authClient } from "@/lib/auth-client";
import { logDevError } from "@/lib/dev-error";
import { api } from "@/utils/api";
import { getInvitationErrorMessage } from "./invitation-error-message";

const createAddInvitationSchema = (t: (key: string) => string) =>
	z.object({
		email: z
			.string()
			.min(1, t("invitations.validation.emailRequired"))
			.email({ message: t("invitations.validation.emailInvalid") }),
		role: z.enum(["member", "admin"]),
		notificationId: z.string().optional(),
	});

type AddInvitation = z.infer<ReturnType<typeof createAddInvitationSchema>>;

export const AddInvitation = () => {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const utils = api.useUtils();
	const [isLoading, setIsLoading] = useState(false);
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const { data: emailProviders } =
		api.notification.getEmailProviders.useQuery();
	const { mutateAsync: sendInvitation } = api.user.sendInvitation.useMutation();
	const [error, setError] = useState<string | null>(null);
	const { data: activeOrganization } = authClient.useActiveOrganization();
	const addInvitationSchema = useMemo(() => createAddInvitationSchema(t), [t]);

	const form = useForm<AddInvitation>({
		defaultValues: {
			email: "",
			role: "member",
			notificationId: "",
		},
		resolver: zodResolver(addInvitationSchema),
	});
	useEffect(() => {
		form.reset();
	}, [form, form.formState.isSubmitSuccessful, form.reset]);

	const onSubmit = async (data: AddInvitation) => {
		setIsLoading(true);
		const result = await authClient.organization.inviteMember({
			email: data.email.toLowerCase(),
			role: data.role,
			organizationId: activeOrganization?.id,
		});

		if (result.error) {
			setError(getInvitationErrorMessage(result.error.message, t));
		} else {
			if (!isCloud && data.notificationId) {
				await sendInvitation({
					invitationId: result.data.id,
					notificationId: data.notificationId || "",
				})
					.then(() => {
						toast.success(t("invitations.createdAndSent"));
					})
					.catch((err) => {
						logDevError("invitation-send-email", err);
						toast.error(t("invitations.error.sendFailed"));
					});
			} else {
				toast.success(t("invitations.created"));
			}
			setError(null);
			setOpen(false);
		}

		utils.organization.allInvitations.invalidate();
		setIsLoading(false);
	};
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger className="" asChild>
				<Button>
					<PlusIcon className="h-4 w-4" /> {t("invitations.addButton")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t("invitations.dialogTitle")}</DialogTitle>
					<DialogDescription>
						{t("invitations.dialogDescription")}
					</DialogDescription>
				</DialogHeader>
				{error && <AlertBlock type="error">{error}</AlertBlock>}

				<Form {...form}>
					<form
						id="hook-form-add-invitation"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-4 "
					>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => {
								return (
									<FormItem>
										<FormLabel>{t("form.email")}</FormLabel>
										<FormControl>
											<Input placeholder="email@dokploy.com" {...field} />
										</FormControl>
										<FormDescription>
											{t("invitations.emailDesc")}
										</FormDescription>
										<FormMessage />
									</FormItem>
								);
							}}
						/>

						<FormField
							control={form.control}
							name="role"
							render={({ field }) => {
								return (
									<FormItem>
										<FormLabel>{t("users.role")}</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t("users.selectRole")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="member">
													{t("user.member")}
												</SelectItem>
												<SelectItem value="admin">{t("user.admin")}</SelectItem>
											</SelectContent>
										</Select>
										<FormDescription>
											{t("invitations.roleDesc")}
										</FormDescription>
										<FormMessage />
									</FormItem>
								);
							}}
						/>

						{!isCloud && (
							<FormField
								control={form.control}
								name="notificationId"
								render={({ field }) => {
									return (
										<FormItem>
											<FormLabel>{t("invitations.emailProvider")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={t("invitations.selectEmailProvider")}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{emailProviders?.map((provider) => (
														<SelectItem
															key={provider.notificationId}
															value={provider.notificationId}
														>
															{provider.name}
														</SelectItem>
													))}
													<SelectItem value="none" disabled>
														{t("common.none")}
													</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>
												{t("invitations.emailProviderDesc")}
											</FormDescription>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
						)}
						<DialogFooter className="flex w-full flex-row">
							<Button
								isLoading={isLoading}
								form="hook-form-add-invitation"
								type="submit"
							>
								{t("button.create")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
