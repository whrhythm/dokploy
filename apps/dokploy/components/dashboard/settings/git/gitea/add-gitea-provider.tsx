import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { GiteaIcon } from "@/components/icons/data-tools-icons";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
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
import {
	type GiteaProviderResponse,
	getGiteaOAuthUrl,
} from "@/utils/gitea-utils";
import { useUrl } from "@/utils/hooks/use-url";

const createSchema = (t: (key: string) => string) =>
	z.object({
		name: z.string().min(1, {
			message: t("settings.gitProviders.gitea.validation.nameRequired"),
		}),
		giteaUrl: z.string().min(1, {
			message: t("settings.gitProviders.gitea.validation.urlRequired"),
		}),
		giteaInternalUrl: z
			.union([z.string().url(), z.literal("")])
			.optional()
			.transform((v) => (v === "" ? undefined : v)),
		clientId: z.string().min(1, {
			message: t("settings.gitProviders.gitea.validation.clientIdRequired"),
		}),
		clientSecret: z.string().min(1, {
			message: t("settings.gitProviders.gitea.validation.clientSecretRequired"),
		}),
		redirectUri: z.string().min(1, {
			message: t("settings.gitProviders.gitea.validation.redirectUriRequired"),
		}),
		organizationName: z.string().optional(),
	});

type Schema = z.infer<ReturnType<typeof createSchema>>;

export const AddGiteaProvider = () => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	const urlObj = useUrl();
	const baseUrl =
		typeof urlObj === "string" ? urlObj : (urlObj as any)?.url || "";

	const { mutateAsync, error, isError } = api.gitea.create.useMutation();
	const webhookUrl = `${baseUrl}/api/providers/gitea/callback`;

	const form = useForm({
		defaultValues: {
			clientId: "",
			clientSecret: "",
			redirectUri: webhookUrl,
			name: "",
			giteaUrl: "https://gitea.com",
			giteaInternalUrl: "",
		},
		resolver: zodResolver(createSchema(t)),
	});

	const giteaUrl = form.watch("giteaUrl");

	useEffect(() => {
		form.reset({
			clientId: "",
			clientSecret: "",
			redirectUri: webhookUrl,
			name: "",
			giteaUrl: "https://gitea.com",
			giteaInternalUrl: "",
		});
	}, [form, webhookUrl, isOpen]);

	const onSubmit = async (data: Schema) => {
		try {
			// Send the form data to create the Gitea provider
			const result = (await mutateAsync({
				clientId: data.clientId,
				clientSecret: data.clientSecret,
				name: data.name,
				redirectUri: data.redirectUri,
				giteaUrl: data.giteaUrl,
				giteaInternalUrl: data.giteaInternalUrl || undefined,
				organizationName: data.organizationName,
			})) as unknown as GiteaProviderResponse;

			// Check if we have a giteaId from the response
			if (!result || !result.giteaId) {
				toast.error(t("settings.gitProviders.gitea.toast.missingId"));
				return;
			}

			// Generate OAuth URL using the shared utility
			const authUrl = getGiteaOAuthUrl(
				result.giteaId,
				data.clientId,
				data.giteaUrl,
				baseUrl,
			);

			// Open the Gitea OAuth URL
			if (authUrl !== "#") {
				window.open(authUrl, "_blank");
			} else {
				toast.error(t("settings.gitProviders.gitea.toast.configIncomplete"), {
					description: t(
						"settings.gitProviders.gitea.toast.configIncompleteDescription",
					),
				});
			}

			toast.success(t("settings.gitProviders.gitea.toast.created"));
			setIsOpen(false);
		} catch (error: unknown) {
			if (error instanceof Error) {
				toast.error(
					t("settings.gitProviders.gitea.toast.configureError", {
						message: error.message,
					}),
				);
			} else {
				toast.error(t("settings.gitProviders.toast.unknownError"));
			}
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="default"
					className="flex items-center space-x-1 bg-green-700 text-white hover:bg-green-500"
				>
					<GiteaIcon />
					<span>{t("git.gitea")}</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{t("settings.gitProviders.gitea.title")}{" "}
						<GiteaIcon className="size-5" />
					</DialogTitle>
				</DialogHeader>

				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}
				<Form {...form}>
					<form
						id="hook-form-add-gitea"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-1"
					>
						<CardContent className="p-0">
							<div className="flex flex-col gap-4">
								<p className="text-muted-foreground text-sm">
									{t("settings.gitProviders.gitea.intro")}
								</p>
								<ol className="list-decimal list-inside text-sm text-muted-foreground">
									<li className="flex flex-row gap-2 items-center">
										{t("settings.gitProviders.gitea.steps.goToSettings")}
										<Link
											href={`${giteaUrl}/user/settings/applications`}
											target="_blank"
										>
											<ExternalLink className="w-fit text-primary size-4" />
										</Link>
									</li>
									<li>{t("settings.gitProviders.gitea.steps.navigate")}</li>
									<li>
										{t("settings.gitProviders.gitea.steps.createApp")}
										<ul className="list-disc list-inside ml-4">
											<li>
												{t("settings.gitProviders.gitea.steps.exampleName")}
											</li>
											<li>
												Redirect URI:{" "}
												<span className="text-primary">{webhookUrl}</span>{" "}
											</li>
										</ul>
									</li>
									<li>
										{t("settings.gitProviders.gitea.steps.copyCredentials")}
									</li>
								</ol>
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("form.name")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t(
														"settings.gitProviders.placeholder.providerName",
													)}
													{...field}
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
											<FormLabel>
												{t("settings.gitProviders.gitea.url")}
											</FormLabel>
											<FormControl>
												<Input placeholder="https://gitea.com/" {...field} />
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
												{t(
													"settings.gitProviders.gitea.internalUrlDescription",
												)}
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="redirectUri"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("settings.gitProviders.redirectUri")}
											</FormLabel>
											<FormControl>
												<Input
													disabled
													placeholder={t("settings.gitProviders.redirectUri")}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="clientId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("settings.gitProviders.clientId")}
											</FormLabel>
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

								<Button isLoading={form.formState.isSubmitting}>
									{t("settings.gitProviders.gitea.configure")}
								</Button>
							</div>
						</CardContent>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
