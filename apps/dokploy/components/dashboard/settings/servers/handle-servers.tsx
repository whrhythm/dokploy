import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Pencil, PlusIcon } from "lucide-react";
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
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

const createServerSchema = (t: (key: string) => string) =>
	z.object({
		name: z.string().min(1, {
			message: t("servers.form.validation.nameRequired"),
		}),
		description: z.string().optional(),
		ipAddress: z.string().min(1, {
			message: t("servers.form.validation.ipRequired"),
		}),
		port: z.number().optional(),
		username: z.string().optional(),
		sshKeyId: z.string().min(1, {
			message: t("servers.form.validation.sshKeyRequired"),
		}),
		serverType: z.enum(["deploy", "build"]).default("deploy"),
	});

type Schema = z.infer<ReturnType<typeof createServerSchema>>;

interface Props {
	serverId?: string;
	asButton?: boolean;
}

export const HandleServers = ({ serverId, asButton = false }: Props) => {
	const { t } = useTranslation();
	const utils = api.useUtils();
	const [isOpen, setIsOpen] = useState(false);
	const { data: canCreateMoreServers, refetch } =
		api.stripe.canCreateMoreServers.useQuery();

	const { data, refetch: refetchServer } = api.server.one.useQuery(
		{
			serverId: serverId || "",
		},
		{
			enabled: !!serverId,
		},
	);

	const { data: sshKeys } = api.sshKey.all.useQuery();
	const { mutateAsync, error, isPending, isError } = serverId
		? api.server.update.useMutation()
		: api.server.create.useMutation();
	const form = useForm({
		defaultValues: {
			description: "",
			name: "",
			ipAddress: "",
			port: 22,
			username: "root",
			sshKeyId: "",
			serverType: "deploy",
		},
		resolver: zodResolver(createServerSchema(t)),
	});

	useEffect(() => {
		form.reset({
			description: data?.description || "",
			name: data?.name || "",
			ipAddress: data?.ipAddress || "",
			port: data?.port || 22,
			username: data?.username || "root",
			sshKeyId: data?.sshKeyId || "",
			serverType: data?.serverType || "deploy",
		});
	}, [form, form.reset, form.formState.isSubmitSuccessful, data]);

	useEffect(() => {
		refetch();
	}, [isOpen]);

	const onSubmit = async (data: Schema) => {
		await mutateAsync({
			name: data.name,
			description: data.description || "",
			ipAddress: data.ipAddress?.trim() || "",
			port: data.port || 22,
			username: data.username || "root",
			sshKeyId: data.sshKeyId || "",
			serverType: data.serverType || "deploy",
			serverId: serverId || "",
		})
			.then(async (_data) => {
				await utils.server.all.invalidate();
				refetchServer();
				toast.success(
					serverId
						? t("servers.form.successUpdate")
						: t("servers.form.successCreate"),
				);
				setIsOpen(false);
			})
			.catch(() => {
				toast.error(
					serverId
						? t("servers.form.errorUpdate")
						: t("servers.form.errorCreate"),
				);
			});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			{serverId ? (
				asButton ? (
					<DialogTrigger asChild>
						<Button variant="outline" size="icon" className="h-9 w-9">
							<Pencil className="h-4 w-4" />
						</Button>
					</DialogTrigger>
				) : (
					<DropdownMenuItem
						className="w-full cursor-pointer "
						onSelect={(e) => {
							e.preventDefault();
							setIsOpen(true);
						}}
					>
						{t("servers.editServer")}
					</DropdownMenuItem>
				)
			) : (
				<DialogTrigger asChild>
					<Button className="cursor-pointer space-x-3">
						<PlusIcon className="h-4 w-4" />
						{t("servers.form.title.create")}
					</Button>
				</DialogTrigger>
			)}
			<DialogContent className="sm:max-w-3xl ">
				<DialogHeader>
					<DialogTitle>
						{serverId
							? t("servers.form.title.edit")
							: t("servers.form.title.create")}
					</DialogTitle>
					<DialogDescription>
						{serverId
							? t("servers.form.title.edit")
							: t("servers.form.title.create")}{" "}
						{t("servers.form.description")}
					</DialogDescription>
				</DialogHeader>
				<div>
					<p className="text-primary text-sm font-medium">
						{t("servers.form.vpsInfo")}
					</p>
					<ul className="list-inside list-disc pl-4 text-sm text-muted-foreground mt-4">
						<li>
							<a
								href="https://www.hostinger.com/vps-hosting?REFERRALCODE=1SIUMAURICI97"
								className="text-link underline"
							>
								{t("servers.providers.hostinger")}
							</a>
						</li>
						<li>
							<a
								href=" https://app.americancloud.com/register?ref=dokploy"
								className="text-link underline"
							>
								{t("servers.providers.americancloud")}
							</a>
						</li>
						<li>
							<a
								href="https://m.do.co/c/db24efd43f35"
								className="text-link underline"
							>
								{t("servers.providers.digitalocean")}
							</a>
						</li>
						<li>
							<a
								href="https://hetzner.cloud/?ref=vou4fhxJ1W2D"
								className="text-link underline"
							>
								{t("servers.providers.hetzner")}
							</a>
						</li>
						<li>
							<a
								href="https://www.vultr.com/?ref=9679828"
								className="text-link underline"
							>
								{t("servers.providers.vultr")}
							</a>
						</li>
						<li>
							<a
								href="https://www.linode.com/es/pricing/#compute-shared"
								className="text-link underline"
							>
								{t("servers.providers.linode")}
							</a>
						</li>
					</ul>
					<AlertBlock className="mt-4 px-4">
						{t("servers.form.vpsNote")}
					</AlertBlock>
				</div>
				{!canCreateMoreServers && (
					<AlertBlock type="warning" className="mt-4">
						{t("servers.form.upgradeRequired")}
					</AlertBlock>
				)}
				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}
				<Form {...form}>
					<form
						id="hook-form-add-server"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-4"
					>
						<div className="flex flex-col gap-4 ">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("servers.form.nameLabel")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("servers.form.namePlaceholder")}
												{...field}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("servers.form.descriptionLabel")}</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t("servers.form.descriptionPlaceholder")}
											className="resize-none"
											{...field}
										/>
									</FormControl>

									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="serverType"
							render={({ field }) => {
								const serverTypeValue = form.watch("serverType");
								return (
									<FormItem>
										<FormLabel>{t("servers.form.serverTypeLabel")}</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={t("servers.form.serverTypePlaceholder")}
												/>
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectItem value="deploy">
														{t("servers.form.deployServer")}
													</SelectItem>
													<SelectItem value="build">
														{t("servers.form.buildServer")}
													</SelectItem>
													<SelectLabel>
														{t("servers.form.serverTypeLabel")}
													</SelectLabel>
												</SelectGroup>
											</SelectContent>
										</Select>
										<FormMessage />
										{serverTypeValue === "deploy" && (
											<AlertBlock type="info" className="mt-2">
												{t("servers.form.deployInfo")}
											</AlertBlock>
										)}
										{serverTypeValue === "build" && (
											<AlertBlock type="info" className="mt-2">
												{t("servers.form.buildInfo")}
											</AlertBlock>
										)}
									</FormItem>
								);
							}}
						/>
						<FormField
							control={form.control}
							name="sshKeyId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("servers.form.sshKeyLabel")}</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={t("servers.form.sshKeyPlaceholder")}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{sshKeys?.map((sshKey) => (
													<SelectItem
														key={sshKey.sshKeyId}
														value={sshKey.sshKeyId}
													>
														{sshKey.name}
													</SelectItem>
												))}
												<SelectLabel>
													{t("servers.form.sshKeyLabel")} ({sshKeys?.length})
												</SelectLabel>
											</SelectGroup>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="ipAddress"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("servers.form.ipAddressLabel")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("servers.form.ipAddressPlaceholder")}
												{...field}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="port"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("servers.form.portLabel")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("servers.form.portDefault")}
												{...field}
												onChange={(e) => {
													const value = e.target.value;
													if (value === "") {
														field.onChange(0);
													} else {
														const number = Number.parseInt(value, 10);
														if (!Number.isNaN(number)) {
															field.onChange(number);
														}
													}
												}}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("servers.form.usernameLabel")}</FormLabel>
									<FormControl>
										<Input
											placeholder={t("servers.form.usernameDefault")}
											{...field}
										/>
									</FormControl>

									<FormMessage />
								</FormItem>
							)}
						/>
					</form>

					<DialogFooter>
						<Button
							isLoading={isPending}
							disabled={!canCreateMoreServers && !serverId}
							form="hook-form-add-server"
							type="submit"
						>
							{serverId ? t("button.edit") : t("button.create")}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
