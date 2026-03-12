import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { PenBoxIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

const createAddSecuritySchema = (t: (key: string) => string) =>
	z.object({
		username: z
			.string()
			.min(1, t("services.security.validation.usernameRequired")),
		password: z
			.string()
			.min(1, t("services.security.validation.passwordRequired")),
	});

type AddSecurity = z.infer<ReturnType<typeof createAddSecuritySchema>>;

interface Props {
	applicationId: string;
	securityId?: string;
	children?: React.ReactNode;
}

export const HandleSecurity = ({
	applicationId,
	securityId,
	children = <PlusIcon className="h-4 w-4" />,
}: Props) => {
	const { t } = useTranslation();
	const utils = api.useUtils();
	const [isOpen, setIsOpen] = useState(false);
	const { data, refetch } = api.security.one.useQuery(
		{
			securityId: securityId ?? "",
		},
		{
			enabled: !!securityId,
		},
	);

	const { mutateAsync, isPending, error, isError } = securityId
		? api.security.update.useMutation()
		: api.security.create.useMutation();

	const form = useForm<AddSecurity>({
		defaultValues: {
			username: "",
			password: "",
		},
		resolver: zodResolver(createAddSecuritySchema(t)),
	});

	useEffect(() => {
		form.reset({
			username: data?.username || "",
			password: data?.password || "",
		});
	}, [form, form.reset, form.formState.isSubmitSuccessful, data]);

	const onSubmit = async (data: AddSecurity) => {
		await mutateAsync({
			applicationId,
			...data,
			securityId: securityId || "",
		})
			.then(async () => {
				toast.success(
					securityId
						? t("services.security.toast.updated")
						: t("services.security.toast.created"),
				);
				await utils.application.one.invalidate({
					applicationId,
				});
				await utils.application.readTraefikConfig.invalidate({
					applicationId,
				});
				await refetch();
				setIsOpen(false);
			})
			.catch(() => {
				toast.error(
					securityId
						? t("services.security.toast.updateError")
						: t("services.security.toast.createError"),
				);
			});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{securityId ? (
					<Button
						variant="ghost"
						size="icon"
						className="group hover:bg-blue-500/10 "
					>
						<PenBoxIcon className="size-3.5  text-primary group-hover:text-blue-500" />
					</Button>
				) : (
					<Button>{children}</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("services.security.title")}</DialogTitle>
					<DialogDescription>
						{securityId
							? t("services.security.modal.updateDescription")
							: t("services.security.modal.addDescription")}
					</DialogDescription>
				</DialogHeader>
				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}

				<Form {...form}>
					<form
						id="hook-form-add-security"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-4"
					>
						<div className="flex flex-col gap-4">
							<FormField
								control={form.control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("services.security.username")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("services.security.usernamePlaceholder")}
												{...field}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("services.security.password")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("services.security.passwordPlaceholder")}
												type="password"
												{...field}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</form>

					<DialogFooter>
						<Button
							isLoading={isPending}
							form="hook-form-add-security"
							type="submit"
						>
							{securityId ? t("button.update") : t("button.create")}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
