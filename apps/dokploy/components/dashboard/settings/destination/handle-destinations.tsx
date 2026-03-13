import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { PenBoxIcon, PlusIcon } from "lucide-react";
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
	DialogFooter,
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
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import { S3_PROVIDERS } from "./constants";

const createDestinationSchema = (t: (key: string) => string) =>
	z.object({
		name: z.string().min(1, t("s3Destinations.validation.nameRequired")),
		provider: z
			.string()
			.min(1, t("s3Destinations.validation.providerRequired")),
		accessKeyId: z
			.string()
			.min(1, t("s3Destinations.validation.accessKeyRequired")),
		secretAccessKey: z
			.string()
			.min(1, t("s3Destinations.validation.secretKeyRequired")),
		bucket: z.string().min(1, t("s3Destinations.validation.bucketRequired")),
		region: z.string(),
		endpoint: z
			.string()
			.min(1, t("s3Destinations.validation.endpointRequired")),
		serverId: z.string().optional(),
	});

type AddDestination = z.infer<ReturnType<typeof createDestinationSchema>>;

interface Props {
	destinationId?: string;
}

export const HandleDestinations = ({ destinationId }: Props) => {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const utils = api.useUtils();
	const { data: servers } = api.server.withSSHKey.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();

	const { mutateAsync, isError, error, isPending } = destinationId
		? api.destination.update.useMutation()
		: api.destination.create.useMutation();

	const { data: destination } = api.destination.one.useQuery(
		{
			destinationId: destinationId || "",
		},
		{
			enabled: !!destinationId,
			refetchOnWindowFocus: false,
		},
	);
	const {
		mutateAsync: testConnection,
		isPending: isPendingConnection,
		error: connectionError,
		isError: isErrorConnection,
	} = api.destination.testConnection.useMutation();

	const form = useForm<AddDestination>({
		defaultValues: {
			provider: "",
			accessKeyId: "",
			bucket: "",
			name: "",
			region: "",
			secretAccessKey: "",
			endpoint: "",
		},
		resolver: zodResolver(createDestinationSchema(t)),
	});
	useEffect(() => {
		if (destination) {
			form.reset({
				name: destination.name,
				provider: destination.provider || "",
				accessKeyId: destination.accessKey,
				secretAccessKey: destination.secretAccessKey,
				bucket: destination.bucket,
				region: destination.region,
				endpoint: destination.endpoint,
			});
		} else {
			form.reset();
		}
	}, [form, form.reset, form.formState.isSubmitSuccessful, destination]);

	const onSubmit = async (data: AddDestination) => {
		await mutateAsync({
			provider: data.provider || "",
			accessKey: data.accessKeyId,
			bucket: data.bucket,
			endpoint: data.endpoint,
			name: data.name,
			region: data.region,
			secretAccessKey: data.secretAccessKey,
			destinationId: destinationId || "",
		})
			.then(async () => {
				toast.success(
					destinationId
						? t("s3Destinations.updated")
						: t("s3Destinations.created"),
				);
				await utils.destination.all.invalidate();
				if (destinationId) {
					await utils.destination.one.invalidate({ destinationId });
				}
				setOpen(false);
			})
			.catch(() => {
				toast.error(
					destinationId
						? t("s3Destinations.updateError")
						: t("s3Destinations.createError"),
				);
			});
	};

	const handleTestConnection = async (serverId?: string) => {
		const result = await form.trigger([
			"provider",
			"accessKeyId",
			"secretAccessKey",
			"bucket",
			"endpoint",
		]);

		if (!result) {
			const errors = form.formState.errors;
			const errorFields = Object.entries(errors)
				.map(([field, error]) => `${field}: ${error?.message}`)
				.filter(Boolean)
				.join("\n");

			toast.error(t("s3Destinations.validation.fillRequired"), {
				description: errorFields,
			});
			return;
		}

		if (isCloud && !serverId) {
			toast.error(t("s3Destinations.validation.selectServer"));
			return;
		}

		const provider = form.getValues("provider");
		const accessKey = form.getValues("accessKeyId");
		const secretKey = form.getValues("secretAccessKey");
		const bucket = form.getValues("bucket");
		const endpoint = form.getValues("endpoint");
		const region = form.getValues("region");

		const connectionString = `:s3,provider=${provider},access_key_id=${accessKey},secret_access_key=${secretKey},endpoint=${endpoint}${region ? `,region=${region}` : ""}:${bucket}`;

		await testConnection({
			provider,
			accessKey,
			bucket,
			endpoint,
			name: "Test",
			region,
			secretAccessKey: secretKey,
			serverId,
		})
			.then(() => {
				toast.success(t("s3Destinations.testSuccess"));
			})
			.catch((e) => {
				toast.error(t("s3Destinations.testError"), {
					description: t("s3Destinations.testErrorDetail", {
						value: e.message,
						command: `rclone ls ${connectionString}`,
					}),
				});
			});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger className="" asChild>
				{destinationId ? (
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
						{t("s3Destinations.addButton")}
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{destinationId
							? t("s3Destinations.Modal.form.title.update")
							: t("s3Destinations.Modal.form.title.add")}
					</DialogTitle>
					<DialogDescription>
						{t("s3Destinations.Modal.form.description")}
					</DialogDescription>
				</DialogHeader>
				{(isError || isErrorConnection) && (
					<AlertBlock type="error" className="w-full">
						{connectionError?.message || error?.message}
					</AlertBlock>
				)}

				<Form {...form}>
					<form
						id="hook-form-destination-add"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-4 "
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => {
								return (
									<FormItem>
										<FormLabel>{t("s3Destinations.form.name")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("s3Destinations.form.namePlaceholder")}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
						<FormField
							control={form.control}
							name="provider"
							render={({ field }) => {
								return (
									<FormItem>
										<FormLabel>{t("s3Destinations.form.provider")}</FormLabel>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"s3Destinations.form.providerPlaceholder",
															)}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{S3_PROVIDERS.map((s3Provider) => (
														<SelectItem
															key={s3Provider.key}
															value={s3Provider.key}
														>
															{s3Provider.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								);
							}}
						/>

						<FormField
							control={form.control}
							name="accessKeyId"
							render={({ field }) => {
								return (
									<FormItem>
										<FormLabel>
											{t("s3Destinations.form.accessKeyId")}
										</FormLabel>
										<FormControl>
											<Input
												placeholder={t(
													"s3Destinations.form.accessKeyIdPlaceholder",
												)}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
						<FormField
							control={form.control}
							name="secretAccessKey"
							render={({ field }) => (
								<FormItem>
									<div className="space-y-0.5">
										<FormLabel>
											{t("s3Destinations.form.secretAccessKey")}
										</FormLabel>
									</div>
									<FormControl>
										<Input
											placeholder={t(
												"s3Destinations.form.secretAccessKeyPlaceholder",
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
							name="bucket"
							render={({ field }) => (
								<FormItem>
									<div className="space-y-0.5">
										<FormLabel>{t("s3Destinations.form.bucket")}</FormLabel>
									</div>
									<FormControl>
										<Input
											placeholder={t("s3Destinations.form.bucketPlaceholder")}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="region"
							render={({ field }) => (
								<FormItem>
									<div className="space-y-0.5">
										<FormLabel>{t("s3Destinations.form.region")}</FormLabel>
									</div>
									<FormControl>
										<Input
											placeholder={t("s3Destinations.form.regionPlaceholder")}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="endpoint"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("s3Destinations.form.endpoint")}</FormLabel>
									<FormControl>
										<Input
											placeholder={t("s3Destinations.form.endpointPlaceholder")}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>

					<DialogFooter
						className={cn(
							isCloud ? "!flex-col" : "flex-row",
							"flex w-full  !justify-between gap-4",
						)}
					>
						{isCloud ? (
							<div className="flex flex-col gap-4 border p-2 rounded-lg">
								<span className="text-sm text-muted-foreground">
									{t("s3Destinations.Modal.test.help")}
								</span>
								<FormField
									control={form.control}
									name="serverId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("s3Destinations.form.serverOptional")}
											</FormLabel>
											<FormControl>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<SelectTrigger className="w-full">
														<SelectValue
															placeholder={t(
																"s3Destinations.form.serverPlaceholder",
															)}
														/>
													</SelectTrigger>
													<SelectContent>
														<SelectGroup>
															<SelectLabel>
																{t("s3Destinations.form.servers")}
															</SelectLabel>
															{servers?.map((server) => (
																<SelectItem
																	key={server.serverId}
																	value={server.serverId}
																>
																	{server.name}
																</SelectItem>
															))}
															<SelectItem value={"none"}>
																{t("common.none")}
															</SelectItem>
														</SelectGroup>
													</SelectContent>
												</Select>
											</FormControl>

											<FormMessage />
										</FormItem>
									)}
								/>
								<Button
									type="button"
									variant={"secondary"}
									isLoading={isPendingConnection}
									onClick={async () => {
										await handleTestConnection(form.getValues("serverId"));
									}}
								>
									{t("s3Destinations.Modal.test.button")}
								</Button>
							</div>
						) : (
							<Button
								isLoading={isPendingConnection}
								type="button"
								variant="secondary"
								onClick={async () => {
									await handleTestConnection();
								}}
							>
								{t("s3Destinations.Modal.test.button")}
							</Button>
						)}

						<Button
							isLoading={isPending}
							form="hook-form-destination-add"
							type="submit"
						>
							{destinationId ? t("button.update") : t("button.create")}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
