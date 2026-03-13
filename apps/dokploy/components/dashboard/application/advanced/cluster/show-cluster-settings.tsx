import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Server } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";
import { AddSwarmSettings } from "./modify-swarm-settings";

interface Props {
	id: string;
	type: "postgres" | "mariadb" | "mongo" | "mysql" | "redis" | "application";
}

const createClusterSchema = (t: (key: string) => string) =>
	z.object({
		replicas: z.number().min(1, t("services.cluster.validation.replicas")),
		registryId: z.string().optional(),
	});

type AddCommand = z.infer<ReturnType<typeof createClusterSchema>>;

export const ShowClusterSettings = ({ id, type }: Props) => {
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
	const { data: registries } = api.registry.all.useQuery();

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

	const form = useForm<AddCommand>({
		defaultValues: {
			...(type === "application" && data && "registryId" in data
				? {
						registryId: data?.registryId || "",
					}
				: {}),
			replicas: data?.replicas || 1,
		},
		resolver: zodResolver(createClusterSchema(t)),
	});

	useEffect(() => {
		if (data?.command) {
			form.reset({
				...(type === "application" && data && "registryId" in data
					? {
							registryId: data?.registryId || "",
						}
					: {}),
				replicas: data?.replicas || 1,
			});
		}
	}, [form, form.reset, form.formState.isSubmitSuccessful, data?.command]);

	const onSubmit = async (data: AddCommand) => {
		await mutateAsync({
			applicationId: id || "",
			postgresId: id || "",
			redisId: id || "",
			mysqlId: id || "",
			mariadbId: id || "",
			mongoId: id || "",
			...(type === "application"
				? {
						registryId:
							data?.registryId === "none" || !data?.registryId
								? null
								: data?.registryId,
					}
				: {}),
			replicas: data?.replicas,
		})
			.then(async () => {
				toast.success(t("services.cluster.toast.updated"));
				await refetch();
			})
			.catch(() => {
				toast.error(t("services.cluster.toast.updateError"));
			});
	};

	return (
		<Card className="bg-background">
			<CardHeader className="flex flex-row justify-between">
				<div>
					<CardTitle className="text-xl">
						{t("services.cluster.title")}
					</CardTitle>
					<CardDescription>{t("services.cluster.description")}</CardDescription>
				</div>
				<AddSwarmSettings id={id} type={type} />
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<AlertBlock type="info">
					{t("services.cluster.redeployHint")}
				</AlertBlock>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-4"
					>
						<div className="flex flex-col gap-4">
							<FormField
								control={form.control}
								name="replicas"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("services.cluster.replicas")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("services.cluster.replicasPlaceholder")}
												{...field}
												onChange={(e) => {
													const value = e.target.value;
													field.onChange(value === "" ? 0 : Number(value));
												}}
												type="number"
												value={field.value || ""}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{type === "application" && (
							<>
								{registries && registries?.length === 0 ? (
									<div className="pt-10">
										<div className="flex flex-col items-center gap-3">
											<Server className="size-8 text-muted-foreground" />
											<span className="text-base text-muted-foreground">
												{t("services.cluster.registryEmptyPrefix")}{" "}
												<Link
													href="/dashboard/settings/cluster"
													className="text-foreground"
												>
													{t("settings.cluster")}
												</Link>{" "}
												{t("services.cluster.registryEmptySuffix")}
											</span>
										</div>
									</div>
								) : (
									<>
										<FormField
											control={form.control}
											name="registryId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t("services.cluster.selectRegistry")}
													</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<SelectTrigger>
															<SelectValue
																placeholder={t(
																	"services.cluster.selectRegistryPlaceholder",
																)}
															/>
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																{registries?.map((registry) => (
																	<SelectItem
																		key={registry.registryId}
																		value={registry.registryId}
																	>
																		{registry.registryName}
																	</SelectItem>
																))}
																<SelectItem value={"none"}>
																	{t("services.cluster.none")}
																</SelectItem>
																<SelectLabel>
																	{t("services.cluster.registries", {
																		count: registries?.length,
																	})}
																</SelectLabel>
															</SelectGroup>
														</SelectContent>
													</Select>
												</FormItem>
											)}
										/>
									</>
								)}
							</>
						)}

						<div className="flex justify-end">
							<Button isLoading={isPending} type="submit" className="w-fit">
								{t("button.save")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};
