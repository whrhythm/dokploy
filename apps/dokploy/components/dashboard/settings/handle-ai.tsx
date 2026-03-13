"use client";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Check, ChevronDown, PenBoxIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
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
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";

const createSchema = (t: (key: string) => string) =>
	z.object({
		name: z.string().min(1, {
			message: t("pages.Modal.aiSettings.validation.nameRequired"),
		}),
		apiUrl: z
			.string()
			.url({ message: t("pages.Modal.aiSettings.validation.apiUrlInvalid") }),
		apiKey: z.string(),
		model: z.string().min(1, {
			message: t("pages.Modal.aiSettings.validation.modelRequired"),
		}),
		isEnabled: z.boolean(),
	});

type Schema = z.infer<ReturnType<typeof createSchema>>;

interface Props {
	aiId?: string;
}

export const HandleAi = ({ aiId }: Props) => {
	const { t } = useTranslation();
	const utils = api.useUtils();
	const [open, setOpen] = useState(false);
	const [modelPopoverOpen, setModelPopoverOpen] = useState(false);
	const [modelSearch, setModelSearch] = useState("");
	const { data, refetch } = api.ai.one.useQuery(
		{
			aiId: aiId || "",
		},
		{
			enabled: !!aiId,
		},
	);
	const { mutateAsync, isPending } = aiId
		? api.ai.update.useMutation()
		: api.ai.create.useMutation();

	const form = useForm<Schema>({
		resolver: zodResolver(createSchema(t)),
		defaultValues: {
			name: "",
			apiUrl: "",
			apiKey: "",
			model: "",
			isEnabled: true,
		},
	});

	useEffect(() => {
		if (data) {
			form.reset({
				name: data?.name ?? "",
				apiUrl: data?.apiUrl ?? "https://api.openai.com/v1",
				apiKey: data?.apiKey ?? "",
				model: data?.model ?? "",
				isEnabled: data?.isEnabled ?? true,
			});
		}
		setModelSearch("");
		setModelPopoverOpen(false);
	}, [aiId, form, data]);

	const apiUrl = form.watch("apiUrl");
	const apiKey = form.watch("apiKey");

	const isOllama = apiUrl.includes(":11434") || apiUrl.includes("ollama");
	const {
		data: models,
		isPending: isLoadingServerModels,
		error: modelsError,
	} = api.ai.getModels.useQuery(
		{
			apiUrl: apiUrl ?? "",
			apiKey: apiKey ?? "",
		},
		{
			enabled: !!apiUrl && (isOllama || !!apiKey),
		},
	);

	const onSubmit = async (data: Schema) => {
		try {
			await mutateAsync({
				...data,
				aiId: aiId || "",
			});

			utils.ai.getAll.invalidate();
			toast.success(t("settings.ai.toast.saved"));
			refetch();
			setOpen(false);
		} catch (error) {
			toast.error(t("settings.ai.toast.saveError"), {
				description:
					error instanceof Error ? error.message : t("error.unknown"),
			});
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				setOpen(isOpen);
				if (!isOpen) {
					setModelSearch("");
					setModelPopoverOpen(false);
				}
			}}
		>
			<DialogTrigger className="" asChild>
				{aiId ? (
					<Button
						variant="ghost"
						size="icon"
						className="group hover:bg-blue-500/10 "
					>
						<PenBoxIcon className="size-3.5  text-primary group-hover:text-blue-500" />
					</Button>
				) : (
					<Button className="cursor-pointer space-x-3">
						<PlusIcon className="h-4 w-4" />
						{t("settings.ai.actions.add")}
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{aiId
							? t("pages.Modal.aiSettings.titleEdit")
							: t("pages.Modal.aiSettings.titleAdd")}
					</DialogTitle>
					<DialogDescription>
						{t("pages.Modal.aiSettings.description")}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					{modelsError && (
						<AlertBlock type="error">{modelsError.message}</AlertBlock>
					)}
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("pages.Modal.aiSettings.form.name")}</FormLabel>
									<FormControl>
										<Input
											placeholder={t(
												"pages.Modal.aiSettings.form.namePlaceholder",
											)}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										{t("pages.Modal.aiSettings.form.nameHelp")}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="apiUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("pages.Modal.aiSettings.form.apiUrl")}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={t(
												"pages.Modal.aiSettings.form.apiUrlPlaceholder",
											)}
											{...field}
											onChange={(e) => {
												field.onChange(e);
												// Reset model when user changes API URL
												if (form.getValues("model")) {
													form.setValue("model", "");
												}
											}}
										/>
									</FormControl>
									<FormDescription>
										{t("pages.Modal.aiSettings.form.apiUrlHelp")}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{!isOllama && (
							<FormField
								control={form.control}
								name="apiKey"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("pages.Modal.aiSettings.form.apiKey")}
										</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder={t(
													"pages.Modal.aiSettings.form.apiKeyPlaceholder",
												)}
												autoComplete="one-time-code"
												{...field}
												onChange={(e) => {
													field.onChange(e);
													// Reset model when user changes API Key
													if (form.getValues("model")) {
														form.setValue("model", "");
													}
												}}
											/>
										</FormControl>
										<FormDescription>
											{t("pages.Modal.aiSettings.form.apiKeyHelp")}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{isLoadingServerModels && (
							<span className="text-sm text-muted-foreground">
								{t("pages.Modal.aiSettings.models.loading")}
							</span>
						)}

						{!isLoadingServerModels && !models?.length && (
							<span className="text-sm text-muted-foreground">
								{t("pages.Modal.aiSettings.models.none")}
							</span>
						)}

						{!isLoadingServerModels && models && models.length > 0 && (
							<FormField
								control={form.control}
								name="model"
								render={({ field }) => {
									const selectedModel = models.find(
										(m) => m.id === field.value,
									);
									const filteredModels = models.filter((model) =>
										model.id.toLowerCase().includes(modelSearch.toLowerCase()),
									);

									// Ensure selected model is always in the filtered list
									const displayModels =
										field.value &&
										!filteredModels.find((m) => m.id === field.value) &&
										selectedModel
											? [selectedModel, ...filteredModels]
											: filteredModels;

									return (
										<FormItem>
											<FormLabel>
												{t("pages.Modal.aiSettings.form.model")}
											</FormLabel>
											<Popover
												open={modelPopoverOpen}
												onOpenChange={setModelPopoverOpen}
											>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															className={cn(
																"w-full justify-between",
																!field.value && "text-muted-foreground",
															)}
														>
															{field.value
																? (selectedModel?.id ?? field.value)
																: t(
																		"pages.Modal.aiSettings.form.modelPlaceholder",
																	)}
															<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-[400px] p-0" align="start">
													<Command>
														<CommandInput
															placeholder={t(
																"pages.Modal.aiSettings.models.searchPlaceholder",
															)}
															value={modelSearch}
															onValueChange={setModelSearch}
														/>
														<CommandList>
															<CommandEmpty>
																{t("pages.Modal.aiSettings.models.noneFound")}
															</CommandEmpty>
															{displayModels.map((model) => {
																const isSelected = field.value === model.id;
																return (
																	<CommandItem
																		key={model.id}
																		value={model.id}
																		onSelect={() => {
																			field.onChange(model.id);
																			setModelPopoverOpen(false);
																			setModelSearch("");
																		}}
																	>
																		<Check
																			className={cn(
																				"mr-2 h-4 w-4",
																				isSelected
																					? "opacity-100"
																					: "opacity-0",
																			)}
																		/>
																		{model.id}
																	</CommandItem>
																);
															})}
														</CommandList>
													</Command>
												</PopoverContent>
											</Popover>
											<FormDescription>
												{t("pages.Modal.aiSettings.form.modelHelp")}
											</FormDescription>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
						)}

						<FormField
							control={form.control}
							name="isEnabled"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											{t("pages.Modal.aiSettings.form.enableLabel")}
										</FormLabel>
										<FormDescription>
											{t("pages.Modal.aiSettings.form.enableHelp")}
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

						<div className="flex justify-end  gap-2 pt-4">
							<Button type="submit" isLoading={isPending}>
								{aiId ? t("button.update") : t("button.create")}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
