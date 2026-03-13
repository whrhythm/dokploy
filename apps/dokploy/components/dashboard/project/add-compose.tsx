import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { CircuitBoard, HelpCircle } from "lucide-react";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/use-translation";
import { slugify } from "@/lib/slug";
import { api } from "@/utils/api";

const createAddComposeSchema = (t: (key: string) => string) =>
	z.object({
		composeType: z.enum(["docker-compose", "stack"]).optional(),
		name: z.string().min(1, {
			message: t("environment.Modal.addCompose.validation.nameRequired"),
		}),
		appName: z
			.string()
			.min(1, {
				message: t("environment.Modal.addCompose.validation.appNameRequired"),
			})
			.regex(/^[a-z](?!.*--)([a-z0-9-]*[a-z])?$/, {
				message: t("environment.Modal.addCompose.validation.appNameInvalid"),
			}),
		description: z.string().optional(),
		serverId: z.string().optional(),
	});

type AddCompose = z.infer<ReturnType<typeof createAddComposeSchema>>;

interface Props {
	environmentId: string;
	projectName?: string;
}

export const AddCompose = ({ environmentId, projectName }: Props) => {
	const { t } = useTranslation();
	const utils = api.useUtils();
	const [visible, setVisible] = useState(false);
	const slug = slugify(projectName);
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const { data: servers } = api.server.withSSHKey.useQuery();
	const { mutateAsync, isPending, error, isError } =
		api.compose.create.useMutation();

	// Get environment data to extract projectId
	const { data: environment } = api.environment.one.useQuery({ environmentId });

	const hasServers = servers && servers.length > 0;
	// Show dropdown logic based on cloud environment
	// Cloud: show only if there are remote servers (no Dokploy option)
	// Self-hosted: show only if there are remote servers (Dokploy is default, hide if no remote servers)
	const shouldShowServerDropdown = hasServers;

	const form = useForm<AddCompose>({
		defaultValues: {
			name: "",
			description: "",
			composeType: "docker-compose",
			appName: `${slug}-`,
		},
		resolver: zodResolver(createAddComposeSchema(t)),
	});

	useEffect(() => {
		form.reset();
	}, [form, form.reset, form.formState.isSubmitSuccessful]);

	const onSubmit = async (data: AddCompose) => {
		await mutateAsync({
			name: data.name,
			description: data.description,
			environmentId,
			composeType: data.composeType,
			appName: data.appName,
			serverId: data.serverId === "dokploy" ? undefined : data.serverId,
		})
			.then(async () => {
				toast.success(t("environment.Modal.addCompose.toast.created"));
				setVisible(false);
				// Invalidate the project query to refresh the environment data
				await utils.environment.one.invalidate({
					environmentId,
				});
			})
			.catch(() => {
				toast.error(t("environment.Modal.addCompose.toast.error"));
			});
	};

	return (
		<Dialog open={visible} onOpenChange={setVisible}>
			<DialogTrigger className="w-full">
				<DropdownMenuItem
					className="w-full cursor-pointer space-x-3"
					onSelect={(e) => e.preventDefault()}
				>
					<CircuitBoard className="size-4 text-muted-foreground" />
					<span>Compose</span>
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>{t("environment.Modal.addCompose.title")}</DialogTitle>
					<DialogDescription>
						{t("environment.Modal.addCompose.description")}
					</DialogDescription>
				</DialogHeader>
				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}

				<Form {...form}>
					<form
						id="hook-form"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-4"
					>
						<div className="flex flex-col gap-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("environment.Modal.addCompose.form.name")}
										</FormLabel>
										<FormControl>
											<Input
												placeholder={t(
													"environment.Modal.addCompose.form.namePlaceholder",
												)}
												{...field}
												onChange={(e) => {
													const val = e.target.value || "";
													const serviceName = slugify(val.trim());
													form.setValue("appName", `${slug}-${serviceName}`);
													field.onChange(val);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						{shouldShowServerDropdown && (
							<FormField
								control={form.control}
								name="serverId"
								render={({ field }) => (
									<FormItem>
										<TooltipProvider delayDuration={0}>
											<Tooltip>
												<TooltipTrigger asChild>
													<FormLabel className="break-all w-fit flex flex-row gap-1 items-center">
														{t("environment.serverSelect.label")}
														{!isCloud
															? t("environment.serverSelect.optionalSuffix")
															: ""}
														<HelpCircle className="size-4 text-muted-foreground" />
													</FormLabel>
												</TooltipTrigger>
												<TooltipContent
													className="z-[999] w-[300px]"
													align="start"
													side="top"
												>
													<span>{t("environment.serverSelect.help")}</span>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>

										<Select
											onValueChange={field.onChange}
											defaultValue={
												field.value || (!isCloud ? "dokploy" : undefined)
											}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={
														!isCloud
															? "Dokploy"
															: t("environment.serverSelect.placeholder")
													}
												/>
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{!isCloud && (
														<SelectItem value="dokploy">
															<span className="flex items-center gap-2 justify-between w-full">
																<span>Dokploy</span>
																<span className="text-muted-foreground text-xs self-center">
																	{t("environment.serverSelect.default")}
																</span>
															</span>
														</SelectItem>
													)}
													{servers?.map((server) => (
														<SelectItem
															key={server.serverId}
															value={server.serverId}
														>
															<span className="flex items-center gap-2 justify-between w-full">
																<span>{server.name}</span>
																<span className="text-muted-foreground text-xs self-center">
																	{server.ipAddress}
																</span>
															</span>
														</SelectItem>
													))}
													<SelectLabel>
														{t("environment.serverSelect.count", {
															count: servers?.length + (!isCloud ? 1 : 0),
														})}
													</SelectLabel>
												</SelectGroup>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						<FormField
							control={form.control}
							name="appName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("environment.Modal.addCompose.form.appName")}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={t(
												"environment.Modal.addCompose.form.appNamePlaceholder",
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
							name="composeType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("environment.Modal.addCompose.form.composeType")}
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"environment.Modal.addCompose.form.composeTypePlaceholder",
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="docker-compose">
												Docker Compose
											</SelectItem>
											<SelectItem value="stack">
												{t(
													"environment.Modal.addCompose.form.composeTypeStack",
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
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("environment.Modal.addCompose.form.description")}
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t(
												"environment.Modal.addCompose.form.descriptionPlaceholder",
											)}
											className="resize-none"
											{...field}
										/>
									</FormControl>

									<FormMessage />
								</FormItem>
							)}
						/>
					</form>

					<DialogFooter>
						<Button isLoading={isPending} form="hook-form" type="submit">
							{t("button.create")}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
