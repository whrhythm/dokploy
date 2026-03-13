import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { InfoIcon, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	createConverter,
	NumberInputWithSteps,
} from "@/components/ui/number-input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

const CPU_STEP = 0.25;
const MEMORY_STEP_MB = 256;

const formatNumber = (value: number, decimals = 2): string =>
	Number.isInteger(value) ? String(value) : value.toFixed(decimals);

const cpuConverter = createConverter(1_000_000_000, (cpu) =>
	cpu <= 0 ? "" : `${formatNumber(cpu)} CPU`,
);

const memoryConverter = createConverter(1024 * 1024, (mb) => {
	if (mb <= 0) return "";
	return mb >= 1024
		? `${formatNumber(mb / 1024)} GB`
		: `${formatNumber(mb)} MB`;
});

const createUlimitSchema = (
	t: (key: string, options?: Record<string, unknown>) => string,
) =>
	z.object({
		Name: z.string().min(1, t("services.resources.validation.nameRequired")),
		Soft: z.coerce
			.number()
			.int()
			.min(-1, t("services.resources.validation.minValue", { value: -1 })),
		Hard: z.coerce
			.number()
			.int()
			.min(-1, t("services.resources.validation.minValue", { value: -1 })),
	});

const createAddResourcesSchema = (
	t: (key: string, options?: Record<string, unknown>) => string,
) =>
	z.object({
		memoryReservation: z.string().optional(),
		cpuLimit: z.string().optional(),
		memoryLimit: z.string().optional(),
		cpuReservation: z.string().optional(),
		ulimitsSwarm: z.array(createUlimitSchema(t)).optional(),
	});

const ULIMIT_PRESETS = [
	{ value: "nofile", labelKey: "services.resources.ulimits.preset.nofile" },
	{ value: "nproc", labelKey: "services.resources.ulimits.preset.nproc" },
	{ value: "memlock", labelKey: "services.resources.ulimits.preset.memlock" },
	{ value: "stack", labelKey: "services.resources.ulimits.preset.stack" },
	{ value: "core", labelKey: "services.resources.ulimits.preset.core" },
	{ value: "cpu", labelKey: "services.resources.ulimits.preset.cpu" },
	{ value: "data", labelKey: "services.resources.ulimits.preset.data" },
	{ value: "fsize", labelKey: "services.resources.ulimits.preset.fsize" },
	{ value: "locks", labelKey: "services.resources.ulimits.preset.locks" },
	{ value: "msgqueue", labelKey: "services.resources.ulimits.preset.msgqueue" },
	{ value: "nice", labelKey: "services.resources.ulimits.preset.nice" },
	{ value: "rtprio", labelKey: "services.resources.ulimits.preset.rtprio" },
	{
		value: "sigpending",
		labelKey: "services.resources.ulimits.preset.sigpending",
	},
];

export type ServiceType =
	| "postgres"
	| "mongo"
	| "redis"
	| "mysql"
	| "mariadb"
	| "application";

interface Props {
	id: string;
	type: ServiceType | "application";
}

type AddResources = z.infer<ReturnType<typeof createAddResourcesSchema>>;

export const ShowResources = ({ id, type }: Props) => {
	const { t } = useTranslation();
	const queryMap = {
		postgres: () =>
			api.postgres.one.useQuery({ postgresId: id }, { enabled: !!id }),
		redis: () => api.redis.one.useQuery({ redisId: id }, { enabled: !!id }),
		mysql: () => api.mysql.one.useQuery({ mysqlId: id }, { enabled: !!id }),
		mariadb: () =>
			api.mariadb.one.useQuery({ mariadbId: id }, { enabled: !!id }),
		application: () =>
			api.application.one.useQuery({ applicationId: id }, { enabled: !!id }),
		mongo: () => api.mongo.one.useQuery({ mongoId: id }, { enabled: !!id }),
	};
	const { data, refetch } = queryMap[type]
		? queryMap[type]()
		: api.mongo.one.useQuery({ mongoId: id }, { enabled: !!id });

	const mutationMap = {
		postgres: () => api.postgres.update.useMutation(),
		redis: () => api.redis.update.useMutation(),
		mysql: () => api.mysql.update.useMutation(),
		mariadb: () => api.mariadb.update.useMutation(),
		application: () => api.application.update.useMutation(),
		mongo: () => api.mongo.update.useMutation(),
	};

	const { mutateAsync, isPending } = mutationMap[type]
		? mutationMap[type]()
		: api.mongo.update.useMutation();

	const form = useForm({
		defaultValues: {
			cpuLimit: "",
			cpuReservation: "",
			memoryLimit: "",
			memoryReservation: "",
			ulimitsSwarm: [],
		},
		resolver: zodResolver(createAddResourcesSchema(t)),
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "ulimitsSwarm",
	});

	useEffect(() => {
		if (data) {
			form.reset({
				cpuLimit: data?.cpuLimit || undefined,
				cpuReservation: data?.cpuReservation || undefined,
				memoryLimit: data?.memoryLimit || undefined,
				memoryReservation: data?.memoryReservation || undefined,
				ulimitsSwarm: data?.ulimitsSwarm || [],
			});
		}
	}, [data, form, form.reset]);

	const onSubmit = async (formData: AddResources) => {
		await mutateAsync({
			mongoId: id || "",
			postgresId: id || "",
			redisId: id || "",
			mysqlId: id || "",
			mariadbId: id || "",
			applicationId: id || "",
			cpuLimit: formData.cpuLimit || null,
			cpuReservation: formData.cpuReservation || null,
			memoryLimit: formData.memoryLimit || null,
			memoryReservation: formData.memoryReservation || null,
			ulimitsSwarm:
				formData.ulimitsSwarm && formData.ulimitsSwarm.length > 0
					? formData.ulimitsSwarm
					: null,
		})
			.then(async () => {
				toast.success(t("services.resources.toast.updated"));
				await refetch();
			})
			.catch(() => {
				toast.error(t("services.resources.toast.updateError"));
			});
	};

	return (
		<Card className="bg-background">
			<CardHeader>
				<CardTitle className="text-xl">
					{t("services.resources.title")}
				</CardTitle>
				<CardDescription>{t("services.resources.description")}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<AlertBlock type="info">{t("services.resources.alert")}</AlertBlock>
				<Form {...form}>
					<form
						id="hook-form"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-8 "
					>
						<div className="grid w-full md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="memoryLimit"
								render={({ field }) => {
									return (
										<FormItem>
											<div
												className="flex items-center gap-2"
												onClick={(e) => e.preventDefault()}
											>
												<FormLabel>
													{t("services.resources.memoryLimit")}
												</FormLabel>
												<TooltipProvider>
													<Tooltip delayDuration={0}>
														<TooltipTrigger>
															<InfoIcon className="h-4 w-4 text-muted-foreground" />
														</TooltipTrigger>
														<TooltipContent>
															<p>
																{t("services.resources.tooltips.memoryLimit")}
															</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</div>
											<FormControl>
												<NumberInputWithSteps
													value={field.value}
													onChange={field.onChange}
													placeholder={t(
														"services.resources.placeholders.memoryLimit",
													)}
													step={MEMORY_STEP_MB}
													converter={memoryConverter}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
							<FormField
								control={form.control}
								name="memoryReservation"
								render={({ field }) => (
									<FormItem>
										<div
											className="flex items-center gap-2"
											onClick={(e) => e.preventDefault()}
										>
											<FormLabel>
												{t("services.resources.memoryReservation")}
											</FormLabel>
											<TooltipProvider>
												<Tooltip delayDuration={0}>
													<TooltipTrigger>
														<InfoIcon className="h-4 w-4 text-muted-foreground" />
													</TooltipTrigger>
													<TooltipContent>
														<p>
															{t(
																"services.resources.tooltips.memoryReservation",
															)}
														</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</div>
										<FormControl>
											<NumberInputWithSteps
												value={field.value}
												onChange={field.onChange}
												placeholder={t(
													"services.resources.placeholders.memoryReservation",
												)}
												step={MEMORY_STEP_MB}
												converter={memoryConverter}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="cpuLimit"
								render={({ field }) => {
									return (
										<FormItem>
											<div
												className="flex items-center gap-2"
												onClick={(e) => e.preventDefault()}
											>
												<FormLabel>
													{t("services.resources.cpuLimit")}
												</FormLabel>
												<TooltipProvider>
													<Tooltip delayDuration={0}>
														<TooltipTrigger>
															<InfoIcon className="h-4 w-4 text-muted-foreground" />
														</TooltipTrigger>
														<TooltipContent>
															<p>{t("services.resources.tooltips.cpuLimit")}</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</div>
											<FormControl>
												<NumberInputWithSteps
													value={field.value}
													onChange={field.onChange}
													placeholder={t(
														"services.resources.placeholders.cpuLimit",
													)}
													step={CPU_STEP}
													converter={cpuConverter}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
							<FormField
								control={form.control}
								name="cpuReservation"
								render={({ field }) => {
									return (
										<FormItem>
											<div
												className="flex items-center gap-2"
												onClick={(e) => e.preventDefault()}
											>
												<FormLabel>
													{t("services.resources.cpuReservation")}
												</FormLabel>
												<TooltipProvider>
													<Tooltip delayDuration={0}>
														<TooltipTrigger>
															<InfoIcon className="h-4 w-4 text-muted-foreground" />
														</TooltipTrigger>
														<TooltipContent>
															<p>
																{t(
																	"services.resources.tooltips.cpuReservation",
																)}
															</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</div>
											<FormControl>
												<NumberInputWithSteps
													value={field.value}
													onChange={field.onChange}
													placeholder={t(
														"services.resources.placeholders.cpuReservation",
													)}
													step={CPU_STEP}
													converter={cpuConverter}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
						</div>

						{/* Ulimits Section */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<FormLabel className="text-base">
										{t("services.resources.ulimits.title")}
									</FormLabel>
									<TooltipProvider>
										<Tooltip delayDuration={0}>
											<TooltipTrigger>
												<InfoIcon className="h-4 w-4 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="max-w-xs">
												<p>{t("services.resources.ulimits.tooltip")}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										append({ Name: "nofile", Soft: 65535, Hard: 65535 })
									}
								>
									<Plus className="h-4 w-4 mr-1" />
									{t("services.resources.ulimits.add")}
								</Button>
							</div>

							{fields.length > 0 && (
								<div className="space-y-3">
									{fields.map((field, index) => (
										<div
											key={field.id}
											className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30"
										>
											<FormField
												control={form.control}
												name={`ulimitsSwarm.${index}.Name`}
												render={({ field }) => (
													<FormItem className="flex-1">
														<FormLabel className="text-xs">
															{t("services.resources.ulimits.type")}
														</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue
																		placeholder={t(
																			"services.resources.ulimits.placeholder",
																		)}
																	/>
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{ULIMIT_PRESETS.map((preset) => (
																	<SelectItem
																		key={preset.value}
																		value={preset.value}
																	>
																		{t(preset.labelKey)}
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
												name={`ulimitsSwarm.${index}.Soft`}
												render={({ field }) => (
													<FormItem className="w-32">
														<FormLabel className="text-xs">
															{t("services.resources.ulimits.softLimit")}
														</FormLabel>
														<FormControl>
															<Input
																type="number"
																min={-1}
																placeholder={t(
																	"services.resources.ulimits.limitPlaceholder",
																)}
																{...field}
																value={
																	typeof field.value === "number"
																		? field.value
																		: ""
																}
																onChange={(e) =>
																	field.onChange(Number(e.target.value))
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name={`ulimitsSwarm.${index}.Hard`}
												render={({ field }) => (
													<FormItem className="w-32">
														<FormLabel className="text-xs">
															{t("services.resources.ulimits.hardLimit")}
														</FormLabel>
														<FormControl>
															<Input
																type="number"
																min={-1}
																placeholder={t(
																	"services.resources.ulimits.limitPlaceholder",
																)}
																{...field}
																value={
																	typeof field.value === "number"
																		? field.value
																		: ""
																}
																onChange={(e) =>
																	field.onChange(Number(e.target.value))
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="mt-6 text-destructive hover:text-destructive"
												onClick={() => remove(index)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							)}

							{fields.length === 0 && (
								<p className="text-sm text-muted-foreground">
									{t("services.resources.ulimits.empty", {
										value: t("services.resources.ulimits.add"),
									})}
								</p>
							)}
						</div>

						<div className="flex w-full justify-end">
							<Button isLoading={isPending} type="submit">
								{t("button.save")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};
