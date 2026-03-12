import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

const createFormSchema = (t: (key: string) => string) =>
	z
		.object({
			rollbackActive: z.boolean(),
			rollbackRegistryId: z.string().optional(),
		})
		.superRefine((values, ctx) => {
			if (
				values.rollbackActive &&
				(!values.rollbackRegistryId || values.rollbackRegistryId === "none")
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["rollbackRegistryId"],
					message: t(
						"services.application.rollbackSettings.validation.registryRequired",
					),
				});
			}
		});

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface Props {
	applicationId: string;
	children?: React.ReactNode;
}

export const ShowRollbackSettings = ({ applicationId, children }: Props) => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const { data: application, refetch } = api.application.one.useQuery(
		{
			applicationId,
		},
		{
			enabled: !!applicationId,
		},
	);

	const { mutateAsync: updateApplication, isPending } =
		api.application.update.useMutation();

	const { data: registries } = api.registry.all.useQuery();

	const form = useForm<FormValues>({
		resolver: zodResolver(createFormSchema(t)),
		defaultValues: {
			rollbackActive: application?.rollbackActive ?? false,
			rollbackRegistryId: application?.rollbackRegistryId || "",
		},
	});

	useEffect(() => {
		if (application) {
			form.reset({
				rollbackActive: application.rollbackActive ?? false,
				rollbackRegistryId: application.rollbackRegistryId || "",
			});
		}
	}, [application, form]);

	const onSubmit = async (data: FormValues) => {
		await updateApplication({
			applicationId,
			rollbackActive: data.rollbackActive,
			rollbackRegistryId:
				data.rollbackRegistryId === "none" || !data.rollbackRegistryId
					? null
					: data.rollbackRegistryId,
		})
			.then(() => {
				toast.success(t("services.application.rollbackSettings.toast.updated"));
				setIsOpen(false);
				refetch();
			})
			.catch(() => {
				toast.error(
					t("services.application.rollbackSettings.toast.updateError"),
				);
			});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t("services.application.rollbackSettings.title")}
					</DialogTitle>
					<DialogDescription>
						{t("services.application.rollbackSettings.description")}
					</DialogDescription>
					<AlertBlock>
						{t("services.application.rollbackSettings.warning")}
					</AlertBlock>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="rollbackActive"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											{t("services.application.rollbackSettings.enable")}
										</FormLabel>
										<FormDescription>
											{t("services.application.rollbackSettings.enableHelp")}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						{form.watch("rollbackActive") && (
							<FormField
								control={form.control}
								name="rollbackRegistryId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("services.application.rollbackSettings.registry")}
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value || "none"}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"services.buildServer.selectRegistry",
														)}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectGroup>
													<SelectItem value="none">
														<span className="flex items-center gap-2">
															<span>{t("common.none")}</span>
														</span>
													</SelectItem>
													{registries?.map((registry) => (
														<SelectItem
															key={registry.registryId}
															value={registry.registryId}
														>
															{registry.registryName}
														</SelectItem>
													))}
													<SelectLabel>
														{t(
															"services.application.rollbackSettings.registries",
															{
																count: registries?.length || 0,
															},
														)}
													</SelectLabel>
												</SelectGroup>
											</SelectContent>
										</Select>
										{!registries || registries.length === 0 ? (
											<FormDescription className="text-amber-600 dark:text-amber-500">
												{t(
													"services.application.rollbackSettings.noRegistriesPrefix",
												)}{" "}
												<Link
													href="/dashboard/settings/registry"
													className="underline font-medium hover:text-amber-700 dark:hover:text-amber-400"
												>
													{t(
														"services.application.rollbackSettings.configureRegistry",
													)}
												</Link>{" "}
												{t(
													"services.application.rollbackSettings.noRegistriesSuffix",
												)}
											</FormDescription>
										) : (
											<FormDescription>
												{t(
													"services.application.rollbackSettings.registryHelp",
												)}
											</FormDescription>
										)}
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<Button type="submit" className="w-full" isLoading={isPending}>
							{t("services.application.rollbackSettings.save")}
						</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
