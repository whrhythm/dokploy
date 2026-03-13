import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { CheckIcon, ChevronsUpDown, Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { GiteaIcon } from "@/components/icons/data-tools-icons";
import { AlertBlock } from "@/components/shared/alert-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import type { Repository } from "@/utils/gitea-utils";

const createGiteaProviderSchema = (t: (key: string) => string) =>
	z.object({
		composePath: z.string().min(1),
		repository: z
			.object({
				repo: z
					.string()
					.min(1, t("services.compose.provider.validation.repoRequired")),
				owner: z
					.string()
					.min(1, t("services.compose.provider.validation.ownerRequired")),
			})
			.required(),
		branch: z
			.string()
			.min(1, t("services.compose.provider.validation.branchRequired")),
		giteaId: z
			.string()
			.min(1, t("services.compose.provider.validation.providerRequired")),
		watchPaths: z.array(z.string()).optional(),
		enableSubmodules: z.boolean().default(false),
	});

type GiteaProvider = z.infer<ReturnType<typeof createGiteaProviderSchema>>;

interface Props {
	composeId: string;
}

export const SaveGiteaProviderCompose = ({ composeId }: Props) => {
	const { t } = useTranslation();
	const { data: giteaProviders } = api.gitea.giteaProviders.useQuery();
	const { data, refetch } = api.compose.one.useQuery({ composeId });
	const { mutateAsync, isPending: isSavingGiteaProvider } =
		api.compose.update.useMutation();
	const watchPathInputRef = useRef<HTMLInputElement>(null);

	const form = useForm({
		defaultValues: {
			composePath: "./docker-compose.yml",
			repository: {
				owner: "",
				repo: "",
			},
			giteaId: "",
			branch: "",
			watchPaths: [],
			enableSubmodules: false,
		},
		resolver: zodResolver(createGiteaProviderSchema(t)),
	});

	const repository = form.watch("repository");
	const giteaId = form.watch("giteaId");

	const { data: giteaUrl } = api.gitea.getGiteaUrl.useQuery(
		{ giteaId },
		{
			enabled: !!giteaId,
		},
	);

	const {
		data: repositories,
		isLoading: isLoadingRepositories,
		error,
	} = api.gitea.getGiteaRepositories.useQuery<Repository[]>(
		{
			giteaId,
		},
		{
			enabled: !!giteaId,
		},
	);

	const {
		data: branches,
		fetchStatus,
		status,
	} = api.gitea.getGiteaBranches.useQuery(
		{
			owner: repository?.owner,
			repositoryName: repository?.repo,
			giteaId: giteaId,
		},
		{
			enabled: !!repository?.owner && !!repository?.repo && !!giteaId,
		},
	);

	useEffect(() => {
		if (data) {
			form.reset({
				branch: data.giteaBranch || "",
				repository: {
					repo: data.giteaRepository || "",
					owner: data.giteaOwner || "",
				},
				composePath: data.composePath || "./docker-compose.yml",
				giteaId: data.giteaId || "",
				watchPaths: data.watchPaths || [],
				enableSubmodules: data.enableSubmodules ?? false,
			});
		}
	}, [form.reset, data?.composeId, form]);

	const onSubmit = async (data: GiteaProvider) => {
		await mutateAsync({
			giteaBranch: data.branch,
			giteaRepository: data.repository.repo,
			giteaOwner: data.repository.owner,
			composePath: data.composePath,
			giteaId: data.giteaId,
			composeId,
			sourceType: "gitea",
			composeStatus: "idle",
			watchPaths: data.watchPaths,
			enableSubmodules: data.enableSubmodules,
		} as any)
			.then(async () => {
				toast.success(t("services.compose.provider.toast.saved"));
				await refetch();
			})
			.catch(() => {
				toast.error(t("services.compose.provider.toast.saveError"));
			});
	};

	return (
		<div>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="grid w-full gap-4 py-3"
				>
					{error && <AlertBlock type="error">{error?.message}</AlertBlock>}

					<div className="grid md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="giteaId"
							render={({ field }) => (
								<FormItem className="md:col-span-2 flex flex-col">
									<FormLabel>
										{t("services.compose.provider.account.gitea")}
									</FormLabel>
									<Select
										onValueChange={(value) => {
											field.onChange(value);
											form.setValue("repository", {
												owner: "",
												repo: "",
											});
											form.setValue("branch", "");
										}}
										defaultValue={field.value}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"services.compose.provider.accountPlaceholder.gitea",
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{giteaProviders?.map((giteaProvider) => (
												<SelectItem
													key={giteaProvider.giteaId}
													value={giteaProvider.giteaId}
												>
													{giteaProvider.gitProvider.name}
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
							name="repository"
							render={({ field }) => (
								<FormItem className="md:col-span-2 flex flex-col">
									<div className="flex items-center justify-between">
										<FormLabel>
											{t("services.compose.provider.repository")}
										</FormLabel>
										{field.value.owner && field.value.repo && (
											<Link
												href={`${giteaUrl}/${field.value.owner}/${field.value.repo}`}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
											>
												<GiteaIcon className="h-4 w-4" />
												<span>
													{t("services.compose.provider.viewRepository")}
												</span>
											</Link>
										)}
									</div>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													className={cn(
														"w-full justify-between !bg-input",
														!field.value && "text-muted-foreground",
													)}
												>
													{!field.value.owner
														? t("services.compose.provider.selectRepository")
														: isLoadingRepositories
															? t(
																	"services.compose.provider.loadingRepositories",
																)
															: (repositories?.find(
																	(repo) => repo.name === field.value.repo,
																)?.name ??
																t(
																	"services.compose.provider.selectRepository",
																))}
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="p-0" align="start">
											<Command>
												<CommandInput
													placeholder={t(
														"services.compose.provider.searchRepository",
													)}
													className="h-9"
												/>
												{!giteaId ? (
													<span className="py-6 text-center text-sm text-muted-foreground">
														{t("services.compose.provider.selectAccountFirst", {
															value: t("services.compose.provider.tabs.gitea"),
														})}
													</span>
												) : isLoadingRepositories ? (
													<span className="py-6 text-center text-sm">
														{t("services.compose.provider.loadingRepositories")}
													</span>
												) : null}
												<CommandEmpty>
													{t("services.compose.provider.noRepositories")}
												</CommandEmpty>
												<ScrollArea className="h-96">
													<CommandGroup>
														{repositories?.map((repo) => (
															<CommandItem
																key={repo.url}
																value={repo.name}
																onSelect={() => {
																	form.setValue("repository", {
																		owner: repo.owner.username,
																		repo: repo.name,
																	});
																	form.setValue("branch", "");
																}}
															>
																<span className="flex items-center gap-2">
																	<span>{repo.name}</span>
																	<span className="text-muted-foreground text-xs">
																		{repo.owner.username}
																	</span>
																</span>
																<CheckIcon
																	className={cn(
																		"ml-auto h-4 w-4",
																		repo.name === field.value.repo
																			? "opacity-100"
																			: "opacity-0",
																	)}
																/>
															</CommandItem>
														))}
													</CommandGroup>
												</ScrollArea>
											</Command>
										</PopoverContent>
									</Popover>
									{form.formState.errors.repository && (
										<p className={cn("text-sm font-medium text-destructive")}>
											{t(
												"services.compose.provider.validation.repositoryRequired",
											)}
										</p>
									)}
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="branch"
							render={({ field }) => (
								<FormItem className="block w-full">
									<FormLabel>{t("form.branch")}</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													className={cn(
														"w-full justify-between !bg-input",
														!field.value && "text-muted-foreground",
													)}
												>
													{status === "pending" && fetchStatus === "fetching"
														? t("services.compose.provider.loadingBranches")
														: field.value
															? branches?.find(
																	(branch) => branch.name === field.value,
																)?.name
															: t("services.compose.provider.selectBranch")}
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="p-0" align="start">
											<Command>
												<CommandInput
													placeholder={t(
														"services.compose.provider.searchBranch",
													)}
													className="h-9"
												/>
												<CommandEmpty>
													{t("services.compose.provider.noBranches")}
												</CommandEmpty>
												<ScrollArea className="h-96">
													<CommandGroup>
														{branches?.map((branch) => (
															<CommandItem
																key={branch.name}
																value={branch.name}
																onSelect={() =>
																	form.setValue("branch", branch.name)
																}
															>
																<span className="flex items-center gap-2">
																	{branch.name}
																</span>
																<CheckIcon
																	className={cn(
																		"ml-auto h-4 w-4",
																		branch.name === field.value
																			? "opacity-100"
																			: "opacity-0",
																	)}
																/>
															</CommandItem>
														))}
													</CommandGroup>
												</ScrollArea>
											</Command>
										</PopoverContent>
									</Popover>
									{form.formState.errors.branch && (
										<p className={cn("text-sm font-medium text-destructive")}>
											{t("services.compose.provider.validation.branchRequired")}
										</p>
									)}
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="composePath"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("services.compose.provider.composePath")}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={t(
												"services.compose.provider.composePathPlaceholder",
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
							name="watchPaths"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<div className="flex items-center gap-2">
										<FormLabel>
											{t("services.compose.provider.watchPaths")}
										</FormLabel>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger>
													<div className="size-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
														?
													</div>
												</TooltipTrigger>
												<TooltipContent>
													<p>
														{t("services.compose.provider.watchPathsHelpShort")}
													</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>
									<div className="flex flex-wrap gap-2 mb-2">
										{field.value?.map((path, index) => (
											<Badge key={index} variant="secondary">
												{path}
												<X
													className="ml-1 size-3 cursor-pointer"
													onClick={() => {
														const newPaths = [...(field.value || [])];
														newPaths.splice(index, 1);
														form.setValue("watchPaths", newPaths);
													}}
												/>
											</Badge>
										))}
									</div>
									<FormControl>
										<div className="flex gap-2">
											<Input
												placeholder={t(
													"services.compose.provider.watchPathPlaceholder",
												)}
												ref={watchPathInputRef}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														const input = e.currentTarget;
														const value = input.value.trim();
														if (value) {
															const newPaths = [...(field.value || []), value];
															form.setValue("watchPaths", newPaths);
															input.value = "";
														}
													}
												}}
											/>
											<Button
												type="button"
												variant="outline"
												size="icon"
												onClick={() => {
													const path = watchPathInputRef.current?.value.trim();
													if (path) {
														field.onChange([...(field.value || []), path]);
														if (watchPathInputRef.current) {
															watchPathInputRef.current.value = "";
														}
													}
												}}
											>
												<Plus className="size-4" />
											</Button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="enableSubmodules"
							render={({ field }) => (
								<FormItem className="flex items-center space-x-2">
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormLabel className="!mt-0">
										{t("services.compose.provider.enableSubmodules")}
									</FormLabel>
								</FormItem>
							)}
						/>
					</div>

					<div className="flex justify-end">
						<Button type="submit" isLoading={isSavingGiteaProvider}>
							{t("button.save")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};
