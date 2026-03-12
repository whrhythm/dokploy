import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { PenBoxIcon } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { api } from "@/utils/api";
import { getGiteaOAuthUrl } from "@/utils/gitea-utils";
import { useUrl } from "@/utils/hooks/use-url";

const createFormSchema = (t: (key: string) => string) =>
	z.object({
		name: z
			.string()
			.min(1, t("settings.gitProviders.gitea.validation.nameRequired")),
		giteaUrl: z
			.string()
			.min(1, t("settings.gitProviders.gitea.validation.urlRequired")),
		giteaInternalUrl: z
			.union([z.string().url(), z.literal("")])
			.optional()
			.transform((v) => (v === "" ? undefined : v)),
		clientId: z
			.string()
			.min(1, t("settings.gitProviders.gitea.validation.clientIdRequired")),
		clientSecret: z
			.string()
			.min(1, t("settings.gitProviders.gitea.validation.clientSecretRequired")),
	});

interface Props {
	giteaId: string;
}

export const EditGiteaProvider = ({ giteaId }: Props) => {
	const { t } = useTranslation();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const {
		data: gitea,
		isLoading,
		refetch,
	} = api.gitea.one.useQuery({ giteaId });
	const { mutateAsync, isPending: isUpdating } = api.gitea.update.useMutation();
	const { mutateAsync: testConnection, isPending: isTesting } =
		api.gitea.testConnection.useMutation();
	const url = useUrl();
	const utils = api.useUtils();

	useEffect(() => {
		const { connected, error } = router.query;

		if (!router.isReady) return;

		if (connected) {
			toast.success(t("settings.gitProviders.gitea.toast.connected"), {
				description: t(
					"settings.gitProviders.gitea.toast.connectedDescription",
				),
				id: "gitea-connection-success",
			});
			refetch();
			router.replace(
				{
					pathname: router.pathname,
					query: {},
				},
				undefined,
				{ shallow: true },
			);
		}

		if (error) {
			toast.error(t("settings.gitProviders.gitea.toast.connectionFailed"), {
				description: decodeURIComponent(error as string),
				id: "gitea-connection-error",
			});
			router.replace(
				{
					pathname: router.pathname,
					query: {},
				},
				undefined,
				{ shallow: true },
			);
		}
	}, [router.query, router.isReady, refetch]);

	const form = useForm({
		resolver: zodResolver(createFormSchema(t)),
		defaultValues: {
			name: "",
			giteaUrl: "https://gitea.com",
			giteaInternalUrl: "",
			clientId: "",
			clientSecret: "",
		},
	});

	useEffect(() => {
		if (gitea) {
			form.reset({
				name: gitea.gitProvider?.name || "",
				giteaUrl: gitea.giteaUrl || "https://gitea.com",
				giteaInternalUrl: gitea.giteaInternalUrl || "",
				clientId: gitea.clientId || "",
				clientSecret: gitea.clientSecret || "",
			});
		}
	}, [gitea, form]);

	const onSubmit = async (
		values: z.infer<ReturnType<typeof createFormSchema>>,
	) => {
		await mutateAsync({
			giteaId: giteaId,
			gitProviderId: gitea?.gitProvider?.gitProviderId || "",
			name: values.name,
			giteaUrl: values.giteaUrl,
			giteaInternalUrl: values.giteaInternalUrl ?? null,
			clientId: values.clientId,
			clientSecret: values.clientSecret,
		})
			.then(async () => {
				await utils.gitProvider.getAll.invalidate();
				toast.success(t("settings.gitProviders.gitea.toast.updated"));
				await refetch();
				setOpen(false);
			})
			.catch(() => {
				toast.error(t("settings.gitProviders.gitea.toast.updateError"));
			});
	};

	const handleTestConnection = async () => {
		try {
			const result = await testConnection({ giteaId });
			toast.success(t("settings.gitProviders.gitea.toast.connectionVerified"), {
				description: result,
			});
		} catch (error: any) {
			const formValues = form.getValues();
			const authUrl =
				error.authorizationUrl ||
				getGiteaOAuthUrl(
					giteaId,
					formValues.clientId,
					formValues.giteaUrl,
					typeof url === "string" ? url : (url as any).url || "",
				);

			toast.error(t("settings.gitProviders.gitea.toast.notConnected"), {
				description:
					error.message || t("settings.gitProviders.gitea.toast.oauthRequired"),
				action:
					authUrl && authUrl !== "#"
						? {
								label: t("settings.gitProviders.gitea.authorizeNow"),
								onClick: () => window.open(authUrl, "_blank"),
							}
						: undefined,
			});
		}
	};

	if (isLoading) {
		return (
			<Button variant="ghost" size="icon" disabled>
				<PenBoxIcon className="h-4 w-4 text-muted-foreground" />
			</Button>
		);
	}

	// Function to handle dialog open state
	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="group hover:bg-blue-500/10"
				>
					<PenBoxIcon className="size-3.5 text-primary group-hover:text-blue-500" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("settings.gitProviders.gitea.editTitle")}
					</DialogTitle>
					<DialogDescription>
						{t("settings.gitProviders.gitea.editDescription")}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("form.name")}</FormLabel>
									<FormControl>
										<Input
											placeholder={t(
												"settings.gitProviders.gitea.namePlaceholder",
											)}
											{...field}
											autoFocus={false}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="giteaUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("settings.gitProviders.gitea.url")}</FormLabel>
									<FormControl>
										<Input placeholder="https://gitea.example.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="giteaInternalUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("settings.gitProviders.internalUrl")}
									</FormLabel>
									<FormControl>
										<Input
											placeholder="http://gitea:3000"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormDescription>
										{t("settings.gitProviders.gitea.internalUrlDescription")}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="clientId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("settings.gitProviders.clientId")}</FormLabel>
									<FormControl>
										<Input
											placeholder={t("settings.gitProviders.clientId")}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="clientSecret"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("settings.gitProviders.clientSecret")}
									</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder={t("settings.gitProviders.clientSecret")}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleTestConnection}
								isLoading={isTesting}
							>
								{t("settings.gitProviders.actions.testConnection")}
							</Button>

							<Button
								type="button"
								variant="outline"
								onClick={() => {
									const formValues = form.getValues();
									const authUrl = getGiteaOAuthUrl(
										giteaId,
										formValues.clientId,
										formValues.giteaUrl,
										typeof url === "string" ? url : (url as any).url || "",
									);
									if (authUrl !== "#") {
										window.open(authUrl, "_blank");
									}
								}}
							>
								{t("settings.gitProviders.gitea.connect")}
							</Button>

							<Button type="submit" isLoading={isUpdating}>
								{t("button.save")}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
