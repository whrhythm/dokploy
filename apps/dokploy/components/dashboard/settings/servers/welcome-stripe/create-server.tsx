import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
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
	});

type Schema = z.infer<ReturnType<typeof createServerSchema>>;

interface Props {
	stepper: any;
}

export const CreateServer = ({ stepper }: Props) => {
	const { t } = useTranslation();
	const { data: sshKeys } = api.sshKey.all.useQuery();
	const [isOpen, _setIsOpen] = useState(false);
	const { data: canCreateMoreServers, refetch } =
		api.stripe.canCreateMoreServers.useQuery();
	const { mutateAsync } = api.server.create.useMutation();
	const cloudSSHKey = sshKeys?.find(
		(sshKey) => sshKey.name === "dokploy-cloud-ssh-key",
	);

	const form = useForm<Schema>({
		defaultValues: {
			description: t("welcomeStripe.createServer.defaultDescription"),
			name: t("welcomeStripe.createServer.defaultName"),
			ipAddress: "",
			port: 22,
			username: "root",
			sshKeyId: cloudSSHKey?.sshKeyId || "",
		},
		resolver: zodResolver(createServerSchema(t)),
	});

	useEffect(() => {
		form.reset({
			description: t("welcomeStripe.createServer.defaultDescription"),
			name: t("welcomeStripe.createServer.defaultName"),
			ipAddress: "",
			port: 22,
			username: "root",
			sshKeyId: cloudSSHKey?.sshKeyId || "",
		});
	}, [form, form.reset, form.formState.isSubmitSuccessful, sshKeys, t]);

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
			serverType: "deploy",
		})
			.then(async (_data) => {
				toast.success(t("servers.form.successCreate"));
				stepper.next();
			})
			.catch(() => {
				toast.error(t("servers.form.errorCreate"));
			});
	};
	return (
		<Card className="bg-background flex flex-col gap-4">
			<div className="flex flex-col gap-2 pt-5 px-4">
				{!canCreateMoreServers && (
					<AlertBlock type="warning" className="mt-2">
						{t("servers.form.upgradeRequired")}{" "}
						<Link href="/dashboard/settings/billing" className="text-primary">
							{t("servers.form.upgradeAction")}
						</Link>
					</AlertBlock>
				)}
			</div>

			<CardContent className="flex flex-col">
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
							name="sshKeyId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("servers.form.sshKeyLabel")}</FormLabel>
									{!cloudSSHKey && (
										<AlertBlock>
											{t("welcomeStripe.createServer.missingSshKey")}{" "}
											<Link
												href="/dashboard/settings/ssh-keys"
												className="text-primary"
											>
												{t("welcomeStripe.createServer.missingSshKeyLink")}
											</Link>
										</AlertBlock>
									)}

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
													{t("welcomeStripe.createServer.sshKeysLabel", {
														count: sshKeys?.length ?? 0,
													})}
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
												placeholder={t(
													"welcomeStripe.createServer.ipPlaceholder",
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
							isLoading={form.formState.isSubmitting}
							disabled={!canCreateMoreServers}
							form="hook-form-add-server"
							type="submit"
						>
							{t("welcomeStripe.createServer.submit")}
						</Button>
					</DialogFooter>
				</Form>
			</CardContent>
		</Card>
	);
};
