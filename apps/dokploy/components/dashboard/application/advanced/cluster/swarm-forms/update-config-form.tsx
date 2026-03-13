import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { api } from "@/utils/api";

export const updateConfigFormSchema = z.object({
	Parallelism: z.coerce.number().optional(),
	Delay: z.coerce.number().optional(),
	FailureAction: z.string().optional(),
	Monitor: z.coerce.number().optional(),
	MaxFailureRatio: z.coerce.number().optional(),
	Order: z.string().optional(),
});

interface UpdateConfigFormProps {
	id: string;
	type: "postgres" | "mariadb" | "mongo" | "mysql" | "redis" | "application";
}

export const UpdateConfigForm = ({ id, type }: UpdateConfigFormProps) => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);

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

	const { mutateAsync } = mutationMap[type]
		? mutationMap[type]()
		: api.mongo.update.useMutation();

	const form = useForm<any>({
		resolver: zodResolver(updateConfigFormSchema),
		defaultValues: {
			Parallelism: undefined,
			Delay: undefined,
			FailureAction: undefined,
			Monitor: undefined,
			MaxFailureRatio: undefined,
			Order: undefined,
		},
	});

	useEffect(() => {
		if (data?.updateConfigSwarm) {
			const config = data.updateConfigSwarm;
			form.reset({
				Parallelism: config.Parallelism,
				Delay: config.Delay,
				FailureAction: config.FailureAction,
				Monitor: config.Monitor,
				MaxFailureRatio: config.MaxFailureRatio,
				Order: config.Order,
			});
		}
	}, [data, form]);

	const onSubmit = async (formData: z.infer<typeof updateConfigFormSchema>) => {
		setIsLoading(true);
		try {
			// Check if all values are empty, if so, send null to clear the database
			const hasAnyValue = Object.values(formData).some(
				(value) => value !== undefined && value !== null && value !== "",
			);

			await mutateAsync({
				applicationId: id || "",
				postgresId: id || "",
				redisId: id || "",
				mysqlId: id || "",
				mariadbId: id || "",
				mongoId: id || "",
				updateConfigSwarm: (hasAnyValue ? formData : null) as any,
			});

			toast.success(
				t("services.swarmSettings.forms.updateConfig.toast.updated"),
			);
			refetch();
		} catch {
			toast.error(
				t("services.swarmSettings.forms.updateConfig.toast.updateError"),
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="Parallelism"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t(
									"services.swarmSettings.forms.updateConfig.parallelismLabel",
								)}
							</FormLabel>
							<FormDescription>
								{t(
									"services.swarmSettings.forms.updateConfig.parallelismDescription",
								)}
							</FormDescription>
							<FormControl>
								<Input
									type="number"
									placeholder={t(
										"services.swarmSettings.forms.updateConfig.parallelismPlaceholder",
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
					name="Delay"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("services.swarmSettings.forms.updateConfig.delayLabel")}
							</FormLabel>
							<FormDescription>
								{t(
									"services.swarmSettings.forms.updateConfig.delayDescription",
								)}
							</FormDescription>
							<FormControl>
								<Input
									type="number"
									placeholder={t(
										"services.swarmSettings.forms.updateConfig.delayPlaceholder",
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
					name="FailureAction"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t(
									"services.swarmSettings.forms.updateConfig.failureActionLabel",
								)}
							</FormLabel>
							<FormDescription>
								{t(
									"services.swarmSettings.forms.updateConfig.failureActionDescription",
								)}
							</FormDescription>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"services.swarmSettings.forms.updateConfig.failureActionPlaceholder",
											)}
										/>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="pause">
										{t(
											"services.swarmSettings.forms.updateConfig.failureAction.pause",
										)}
									</SelectItem>
									<SelectItem value="continue">
										{t(
											"services.swarmSettings.forms.updateConfig.failureAction.continue",
										)}
									</SelectItem>
									<SelectItem value="rollback">
										{t(
											"services.swarmSettings.forms.updateConfig.failureAction.rollback",
										)}
									</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="Monitor"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("services.swarmSettings.forms.updateConfig.monitorLabel")}
							</FormLabel>
							<FormDescription>
								{t(
									"services.swarmSettings.forms.updateConfig.monitorDescription",
								)}
							</FormDescription>
							<FormControl>
								<Input
									type="number"
									placeholder={t(
										"services.swarmSettings.forms.updateConfig.monitorPlaceholder",
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
					name="MaxFailureRatio"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t(
									"services.swarmSettings.forms.updateConfig.maxFailureRatioLabel",
								)}
							</FormLabel>
							<FormDescription>
								{t(
									"services.swarmSettings.forms.updateConfig.maxFailureRatioDescription",
								)}
							</FormDescription>
							<FormControl>
								<Input
									type="number"
									step="0.01"
									placeholder={t(
										"services.swarmSettings.forms.updateConfig.maxFailureRatioPlaceholder",
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
					name="Order"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("services.swarmSettings.forms.updateConfig.orderLabel")}
							</FormLabel>
							<FormDescription>
								{t(
									"services.swarmSettings.forms.updateConfig.orderDescription",
								)}
							</FormDescription>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"services.swarmSettings.forms.updateConfig.orderPlaceholder",
											)}
										/>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="stop-first">
										{t(
											"services.swarmSettings.forms.updateConfig.order.stopFirst",
										)}
									</SelectItem>
									<SelectItem value="start-first">
										{t(
											"services.swarmSettings.forms.updateConfig.order.startFirst",
										)}
									</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							form.reset({
								Parallelism: undefined,
								Delay: undefined,
								FailureAction: undefined,
								Monitor: undefined,
								MaxFailureRatio: undefined,
								Order: undefined,
							});
						}}
					>
						{t("button.reset")}
					</Button>
					<Button type="submit" isLoading={isLoading}>
						{t("services.swarmSettings.forms.updateConfig.save")}
					</Button>
				</div>
			</form>
		</Form>
	);
};
