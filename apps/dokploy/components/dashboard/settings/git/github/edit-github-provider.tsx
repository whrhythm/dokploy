import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { PenBoxIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { GithubIcon } from "@/components/icons/data-tools-icons";
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

const createSchema = (t: (key: string) => string) =>
	z.object({
		name: z.string().min(1, {
			message: t("settings.gitProviders.github.validation.nameRequired"),
		}),
		appName: z.string().min(1, {
			message: t("settings.gitProviders.github.validation.appNameRequired"),
		}),
	});

type Schema = z.infer<ReturnType<typeof createSchema>>;

interface Props {
	githubId: string;
}

export const EditGithubProvider = ({ githubId }: Props) => {
	const { t } = useTranslation();
	const { data: github } = api.github.one.useQuery(
		{
			githubId,
		},
		{
			enabled: !!githubId,
		},
	);
	const utils = api.useUtils();
	const [isOpen, setIsOpen] = useState(false);
	const { mutateAsync, error, isError } = api.github.update.useMutation();
	const { mutateAsync: testConnection, isPending } =
		api.github.testConnection.useMutation();
	const form = useForm<Schema>({
		defaultValues: {
			name: "",
			appName: "",
		},
		resolver: zodResolver(createSchema(t)),
	});

	useEffect(() => {
		form.reset({
			name: github?.gitProvider.name || "",
			appName: github?.githubAppName || "",
		});
	}, [form, isOpen]);

	const onSubmit = async (data: Schema) => {
		await mutateAsync({
			githubId,
			name: data.name || "",
			gitProviderId: github?.gitProviderId || "",
			githubAppName: data.appName || "",
		})
			.then(async () => {
				await utils.gitProvider.getAll.invalidate();
				toast.success(t("settings.gitProviders.github.toast.updated"));
				setIsOpen(false);
			})
			.catch(() => {
				toast.error(t("settings.gitProviders.github.toast.updateError"));
			});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="group hover:bg-blue-500/10 "
				>
					<PenBoxIcon className="size-3.5  text-primary group-hover:text-blue-500" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl ">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{t("settings.gitProviders.github.updateTitle")}{" "}
						<GithubIcon className="size-5" />
					</DialogTitle>
				</DialogHeader>

				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}
				<Form {...form}>
					<form
						id="hook-form-add-github"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-1"
					>
						<CardContent className="p-0">
							<div className="flex flex-col gap-4">
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
									name="appName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("settings.gitProviders.github.appName")}
											</FormLabel>
											<FormControl>
												<Input
													placeholder={t(
														"settings.gitProviders.github.appNamePlaceholder",
													)}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="flex w-full justify-between gap-4 mt-4">
									<Button
										type="button"
										variant={"secondary"}
										isLoading={isPending}
										onClick={async () => {
											await testConnection({
												githubId,
											})
												.then(async (message) => {
													toast.info(
														t("settings.gitProviders.toast.message", {
															message,
														}),
													);
												})
												.catch((error) => {
													toast.error(
														t("settings.gitProviders.toast.error", {
															message: error.message,
														}),
													);
												});
										}}
									>
										{t("settings.gitProviders.actions.testConnection")}
									</Button>
									<Button type="submit" isLoading={form.formState.isSubmitting}>
										{t("button.update")}
									</Button>
								</div>
							</div>
						</CardContent>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
