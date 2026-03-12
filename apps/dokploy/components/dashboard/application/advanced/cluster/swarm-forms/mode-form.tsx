import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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

interface ModeFormProps {
	id: string;
	type: "postgres" | "mariadb" | "mongo" | "mysql" | "redis" | "application";
}

export const ModeForm = ({ id, type }: ModeFormProps) => {
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
		defaultValues: {
			type: undefined,
			Replicas: undefined,
		},
	});

	const modeType = form.watch("type");

	useEffect(() => {
		if (data?.modeSwarm) {
			const mode = data.modeSwarm;
			if (mode.Replicated) {
				form.reset({
					type: "Replicated",
					Replicas: mode.Replicated.Replicas,
				});
			} else if (mode.Global) {
				form.reset({
					type: "Global",
					Replicas: undefined,
				});
			}
		}
	}, [data, form]);

	const onSubmit = async (formData: any) => {
		setIsLoading(true);
		try {
			// If no type is selected, send null to clear the database
			if (!formData.type) {
				await mutateAsync({
					applicationId: id || "",
					postgresId: id || "",
					redisId: id || "",
					mysqlId: id || "",
					mariadbId: id || "",
					mongoId: id || "",
					modeSwarm: null,
				});
				toast.success(t("services.swarmSettings.forms.mode.toast.updated"));
				refetch();
				setIsLoading(false);
				return;
			}

			const modeData =
				formData.type === "Replicated"
					? {
							Replicated: {
								Replicas:
									formData.Replicas !== undefined && formData.Replicas !== ""
										? Number(formData.Replicas)
										: undefined,
							},
						}
					: { Global: {} };

			await mutateAsync({
				applicationId: id || "",
				postgresId: id || "",
				redisId: id || "",
				mysqlId: id || "",
				mariadbId: id || "",
				mongoId: id || "",
				modeSwarm: modeData,
			});

			toast.success(t("services.swarmSettings.forms.mode.toast.updated"));
			refetch();
		} catch {
			toast.error(t("services.swarmSettings.forms.mode.toast.updateError"));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("services.swarmSettings.forms.mode.typeLabel")}
							</FormLabel>
							<FormDescription>
								{t("services.swarmSettings.forms.mode.typeDescription")}
							</FormDescription>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue
											placeholder={t(
												"services.swarmSettings.forms.mode.typePlaceholder",
											)}
										/>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="Replicated">
										{t("services.swarmSettings.forms.mode.type.replicated")}
									</SelectItem>
									<SelectItem value="Global">
										{t("services.swarmSettings.forms.mode.type.global")}
									</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				{modeType === "Replicated" && (
					<FormField
						control={form.control}
						name="Replicas"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("services.swarmSettings.forms.mode.replicasLabel")}
								</FormLabel>
								<FormDescription>
									{t("services.swarmSettings.forms.mode.replicasDescription")}
								</FormDescription>
								<FormControl>
									<Input
										type="number"
										placeholder={t(
											"services.swarmSettings.forms.mode.replicasPlaceholder",
										)}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							form.reset({
								type: undefined,
								Replicas: undefined,
							});
						}}
					>
						{t("button.reset")}
					</Button>
					<Button type="submit" isLoading={isLoading}>
						{t("services.swarmSettings.forms.mode.save")}
					</Button>
				</div>
			</form>
		</Form>
	);
};
