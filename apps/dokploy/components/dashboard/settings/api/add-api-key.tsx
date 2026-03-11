import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import copy from "copy-to-clipboard";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CodeEditor } from "@/components/shared/code-editor";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

const createFormSchema = (t: (key: string) => string) =>
	z.object({
		name: z.string().min(1, {
			message: t("apiKeys.validation.nameRequired"),
		}),
		prefix: z.string().optional(),
		expiresIn: z.number().nullable(),
		organizationId: z.string().min(1, {
			message: t("apiKeys.validation.organizationRequired"),
		}),
		// Rate limiting fields
		rateLimitEnabled: z.boolean().optional(),
		rateLimitTimeWindow: z.number().nullable(),
		rateLimitMax: z.number().nullable(),
		// Request limiting fields
		remaining: z.number().nullable().optional(),
		refillAmount: z.number().nullable().optional(),
		refillInterval: z.number().nullable().optional(),
	});

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

const EXPIRATION_OPTIONS = [
	{ labelKey: "apiKeys.expiration.never", value: "0" },
	{ labelKey: "apiKeys.expiration.oneDay", value: String(60 * 60 * 24) },
	{ labelKey: "apiKeys.expiration.sevenDays", value: String(60 * 60 * 24 * 7) },
	{
		labelKey: "apiKeys.expiration.thirtyDays",
		value: String(60 * 60 * 24 * 30),
	},
	{
		labelKey: "apiKeys.expiration.ninetyDays",
		value: String(60 * 60 * 24 * 90),
	},
	{ labelKey: "apiKeys.expiration.oneYear", value: String(60 * 60 * 24 * 365) },
];

const TIME_WINDOW_OPTIONS = [
	{ labelKey: "apiKeys.timeWindow.oneMinute", value: String(60 * 1000) },
	{ labelKey: "apiKeys.timeWindow.fiveMinutes", value: String(5 * 60 * 1000) },
	{
		labelKey: "apiKeys.timeWindow.fifteenMinutes",
		value: String(15 * 60 * 1000),
	},
	{
		labelKey: "apiKeys.timeWindow.thirtyMinutes",
		value: String(30 * 60 * 1000),
	},
	{ labelKey: "apiKeys.timeWindow.oneHour", value: String(60 * 60 * 1000) },
	{ labelKey: "apiKeys.timeWindow.oneDay", value: String(24 * 60 * 60 * 1000) },
];

const REFILL_INTERVAL_OPTIONS = [
	{ labelKey: "apiKeys.refillInterval.oneHour", value: String(60 * 60 * 1000) },
	{
		labelKey: "apiKeys.refillInterval.sixHours",
		value: String(6 * 60 * 60 * 1000),
	},
	{
		labelKey: "apiKeys.refillInterval.twelveHours",
		value: String(12 * 60 * 60 * 1000),
	},
	{
		labelKey: "apiKeys.refillInterval.oneDay",
		value: String(24 * 60 * 60 * 1000),
	},
	{
		labelKey: "apiKeys.refillInterval.sevenDays",
		value: String(7 * 24 * 60 * 60 * 1000),
	},
	{
		labelKey: "apiKeys.refillInterval.thirtyDays",
		value: String(30 * 24 * 60 * 60 * 1000),
	},
];

export const AddApiKey = () => {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [newApiKey, setNewApiKey] = useState("");
	const { refetch } = api.user.get.useQuery();
	const { data: organizations } = api.organization.all.useQuery();
	const createApiKey = api.user.createApiKey.useMutation({
		onSuccess: (data) => {
			if (!data) return;

			setNewApiKey(data.key);
			setOpen(false);
			setShowSuccessModal(true);
			form.reset();
			void refetch();
		},
		onError: () => {
			toast.error(t("apiKeys.toast.createError"));
		},
	});

	const form = useForm<FormValues>({
		resolver: zodResolver(createFormSchema(t)),
		defaultValues: {
			name: "",
			prefix: "",
			expiresIn: null,
			organizationId: "",
			rateLimitEnabled: false,
			rateLimitTimeWindow: null,
			rateLimitMax: null,
			remaining: null,
			refillAmount: null,
			refillInterval: null,
		},
	});

	const rateLimitEnabled = form.watch("rateLimitEnabled");

	const onSubmit = async (values: FormValues) => {
		createApiKey.mutate({
			name: values.name,
			expiresIn: values.expiresIn || undefined,
			prefix: values.prefix || undefined,
			metadata: {
				organizationId: values.organizationId,
			},
			// Rate limiting
			rateLimitEnabled: values.rateLimitEnabled,
			rateLimitTimeWindow: values.rateLimitTimeWindow || undefined,
			rateLimitMax: values.rateLimitMax || undefined,
			// Request limiting
			remaining: values.remaining || undefined,
			refillAmount: values.refillAmount || undefined,
			refillInterval: values.refillInterval || undefined,
		});
	};

	return (
		<>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button>{t("apiKeys.actions.generateNew")}</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-xl max-h-[90vh]">
					<DialogHeader>
						<DialogTitle>{t("apiKeys.Modal.create.title")}</DialogTitle>
						<DialogDescription>
							{t("apiKeys.Modal.create.description")}
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("apiKeys.form.name")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("apiKeys.form.namePlaceholder")}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="prefix"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("apiKeys.form.prefix")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("apiKeys.form.prefixPlaceholder")}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="expiresIn"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("apiKeys.form.expiration")}</FormLabel>
										<Select
											value={field.value?.toString() || "0"}
											onValueChange={(value) =>
												field.onChange(Number.parseInt(value, 10))
											}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"apiKeys.form.expirationPlaceholder",
														)}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{EXPIRATION_OPTIONS.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{t(option.labelKey)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="organizationId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("apiKeys.form.organization")}</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={t(
															"apiKeys.form.organizationPlaceholder",
														)}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{organizations?.map((org) => (
													<SelectItem key={org.id} value={org.id}>
														{org.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Rate Limiting Section */}
							<div className="space-y-4 rounded-lg border p-4">
								<h3 className="text-lg font-medium">
									{t("apiKeys.rateLimit.title")}
								</h3>
								<FormField
									control={form.control}
									name="rateLimitEnabled"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
											<div className="space-y-0.5">
												<FormLabel>
													{t("apiKeys.rateLimit.enableLabel")}
												</FormLabel>
												<FormDescription>
													{t("apiKeys.rateLimit.enableDescription")}
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

								{rateLimitEnabled && (
									<>
										<FormField
											control={form.control}
											name="rateLimitTimeWindow"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("apiKeys.rateLimit.timeWindow")}
													</FormLabel>
													<Select
														value={field.value?.toString()}
														onValueChange={(value) =>
															field.onChange(Number.parseInt(value, 10))
														}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue
																	placeholder={t(
																		"apiKeys.rateLimit.timeWindowPlaceholder",
																	)}
																/>
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{TIME_WINDOW_OPTIONS.map((option) => (
																<SelectItem
																	key={option.value}
																	value={option.value}
																>
																	{t(option.labelKey)}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormDescription>
														{t("apiKeys.rateLimit.timeWindowDescription")}
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="rateLimitMax"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("apiKeys.rateLimit.maxRequests")}
													</FormLabel>
													<FormControl>
														<Input
															type="number"
															placeholder={t(
																"apiKeys.rateLimit.maxRequestsPlaceholder",
															)}
															value={field.value?.toString() ?? ""}
															onChange={(e) =>
																field.onChange(
																	e.target.value
																		? Number.parseInt(e.target.value, 10)
																		: null,
																)
															}
														/>
													</FormControl>
													<FormDescription>
														{t("apiKeys.rateLimit.maxRequestsDescription")}
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									</>
								)}
							</div>

							{/* Request Limiting Section */}
							<div className="space-y-4 rounded-lg border p-4">
								<h3 className="text-lg font-medium">
									{t("apiKeys.requestLimit.title")}
								</h3>
								<FormField
									control={form.control}
									name="remaining"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("apiKeys.requestLimit.totalLabel")}
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder={t(
														"apiKeys.requestLimit.totalPlaceholder",
													)}
													value={field.value?.toString() ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number.parseInt(e.target.value, 10)
																: null,
														)
													}
												/>
											</FormControl>
											<FormDescription>
												{t("apiKeys.requestLimit.totalDescription")}
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="refillAmount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("apiKeys.requestLimit.refillAmount")}
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder={t(
														"apiKeys.requestLimit.refillAmountPlaceholder",
													)}
													value={field.value?.toString() ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number.parseInt(e.target.value, 10)
																: null,
														)
													}
												/>
											</FormControl>
											<FormDescription>
												{t("apiKeys.requestLimit.refillAmountDescription")}
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="refillInterval"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("apiKeys.requestLimit.refillInterval")}
											</FormLabel>
											<Select
												value={field.value?.toString()}
												onValueChange={(value) =>
													field.onChange(Number.parseInt(value, 10))
												}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"apiKeys.requestLimit.refillIntervalPlaceholder",
															)}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{REFILL_INTERVAL_OPTIONS.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{t(option.labelKey)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>
												{t("apiKeys.requestLimit.refillIntervalDescription")}
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="flex justify-end gap-3 pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => setOpen(false)}
								>
									{t("button.cancel")}
								</Button>
								<Button type="submit">{t("apiKeys.actions.generate")}</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>{t("apiKeys.Modal.success.title")}</DialogTitle>
						<DialogDescription>
							{t("apiKeys.Modal.success.description")}
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4 space-y-4">
						<CodeEditor
							className="font-mono text-sm break-all"
							language="properties"
							value={newApiKey}
							readOnly
						/>
						<div className="flex justify-end gap-3">
							<Button
								onClick={() => {
									copy(newApiKey);
									toast.success(t("apiKeys.toast.copied"));
								}}
							>
								{t("apiKeys.actions.copy")}
							</Button>
							<Button
								variant="outline"
								onClick={() => setShowSuccessModal(false)}
							>
								{t("button.close")}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
