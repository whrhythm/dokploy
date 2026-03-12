import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
import { ToggleVisibilityInput } from "@/components/shared/toggle-visibility-input";
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
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

const createExternalMariadbSchema = (t: (key: string) => string) =>
	z.object({
		externalPort: z.preprocess((a) => {
			if (a !== null) {
				const parsed = Number.parseInt(z.string().parse(a), 10);
				return Number.isNaN(parsed) ? null : parsed;
			}
			return null;
		}, z
			.number()
			.gte(0, t("services.mariadb.externalPortRange"))
			.lte(65535, t("services.mariadb.externalPortRange"))
			.nullable()),
	});

type DockerProvider = z.infer<ReturnType<typeof createExternalMariadbSchema>>;

interface Props {
	mariadbId: string;
}
export const ShowExternalMariadbCredentials = ({ mariadbId }: Props) => {
	const { t } = useTranslation();
	const { data: ip } = api.settings.getIp.useQuery();
	const { data, refetch } = api.mariadb.one.useQuery({ mariadbId });
	const { mutateAsync, isPending } = api.mariadb.saveExternalPort.useMutation();
	const [connectionUrl, setConnectionUrl] = useState("");
	const getIp = data?.server?.ipAddress || ip;
	const form = useForm({
		defaultValues: {},
		resolver: zodResolver(createExternalMariadbSchema(t)),
	});

	useEffect(() => {
		if (data?.externalPort) {
			form.reset({
				externalPort: data.externalPort,
			});
		}
	}, [form.reset, data, form]);

	const onSubmit = async (values: DockerProvider) => {
		await mutateAsync({
			externalPort: values.externalPort,
			mariadbId,
		})
			.then(async () => {
				toast.success(t("services.mariadb.toast.externalPortUpdated"));
				await refetch();
			})
			.catch((error: Error) => {
				toast.error(
					error?.message || t("services.mariadb.toast.externalPortError"),
				);
			});
	};

	useEffect(() => {
		const buildConnectionUrl = () => {
			const port = form.watch("externalPort") || data?.externalPort;

			return `mariadb://${data?.databaseUser}:${data?.databasePassword}@${getIp}:${port}/${data?.databaseName}`;
		};

		setConnectionUrl(buildConnectionUrl());
	}, [
		data?.appName,
		data?.externalPort,
		data?.databasePassword,
		form,
		data?.databaseName,
		data?.databaseUser,
		getIp,
	]);
	return (
		<>
			<div className="flex w-full flex-col gap-5 ">
				<Card className="bg-background">
					<CardHeader>
						<CardTitle className="text-xl">
							{t("services.mariadb.externalCredentials")}
						</CardTitle>
						<CardDescription>
							{t("services.mariadb.externalDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex w-full flex-col gap-4">
						{!getIp && (
							<AlertBlock type="warning">
								{t("services.mariadb.externalMissingIpPrefix")}{" "}
								<Link
									href="/dashboard/settings/server"
									className="text-primary"
								>
									{data?.serverId
										? t("services.mariadb.externalMissingIpRemote")
										: t("services.mariadb.externalMissingIpLocal")}
								</Link>{" "}
								{t("services.mariadb.externalMissingIpSuffix")}
							</AlertBlock>
						)}
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex flex-col gap-4"
							>
								<div className="grid md:grid-cols-2 gap-4 ">
									<div className="md:col-span-2 space-y-4">
										<FormField
											control={form.control}
											name="externalPort"
											render={({ field }) => {
												return (
													<FormItem>
														<FormLabel>
															{t("services.mariadb.credentials.externalPort")}
														</FormLabel>
														<FormControl>
															<Input
																placeholder={t(
																	"services.mariadb.credentials.externalPortPlaceholder",
																)}
																{...field}
																value={field.value as string}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												);
											}}
										/>
									</div>
								</div>
								{!!data?.externalPort && (
									<div className="grid w-full gap-8">
										<div className="flex flex-col gap-3">
											{/* jdbc:mariadb://5.161.59.207:3306/pixel-calculate?user=mariadb&password=HdVXfq6hM7W7F1 */}
											<Label>
												{t("services.mariadb.credentials.externalHost")}
											</Label>
											<ToggleVisibilityInput value={connectionUrl} disabled />
										</div>
									</div>
								)}

								<div className="flex justify-end">
									<Button type="submit" isLoading={isPending}>
										{t("button.save")}
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</>
	);
};
