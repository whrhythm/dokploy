import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { CheckIcon, ChevronsUpDown, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { GitlabIcon } from "@/components/icons/data-tools-icons";
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

const createGitlabProviderSchema = (t: (key: string) => string) =>
	z.object({
		buildPath: z.string().min(1),
		repository: z
			.object({
				repo: z
					.string()
					.min(1, t("services.compose.provider.validation.repoRequired")),
				owner: z
					.string()
					.min(1, t("services.compose.provider.validation.ownerRequired")),
				id: z.number().nullable(),
				gitlabPathNamespace: z.string().min(1),
			})
			.required(),
		branch: z
			.string()
			.min(1, t("services.compose.provider.validation.branchRequired")),
		gitlabId: z
			.string()
			.min(1, t("services.compose.provider.validation.providerRequired")),
		watchPaths: z.array(z.string()).optional(),
		enableSubmodules: z.boolean().default(false),
	});

type GitlabProvider = z.infer<ReturnType<typeof createGitlabProviderSchema>>;

interface Props {
	applicationId: string;
}

export const SaveGitlabProvider = ({ applicationId }: Props) => {
	const { t } = useTranslation();
	const { data: gitlabProviders } = api.gitlab.gitlabProviders.useQuery();
	const { data, refetch } = api.application.one.useQuery({ applicationId });
	const watchPathInputRef = useRef<HTMLInputElement>(null);

	const { mutateAsync, isPending: isSavingGitlabProvider } =
		api.application.saveGitlabProvider.useMutation();

	const form = useForm({
		defaultValues: {
			buildPath: "/",
			repository: {
				owner: "",
				repo: "",
				gitlabPathNamespace: "",
				id: null,
			},
			gitlabId: "",
			branch: "",
			watchPaths: [],
			enableSubmodules: false,
		},
		resolver: zodResolver(createGitlabProviderSchema(t)),
	});

	const repository = form.watch("repository");
	const gitlabId = form.watch("gitlabId");

	const gitlabUrl = useMemo(() => {
		const url = gitlabProviders?.find(
			(provider) => provider.gitlabId === gitlabId,
		)?.gitlabUrl;

		const normalized = url?.replace(/\/$/, "");

		return normalized || "https://gitlab.com";
	}, [gitlabId, gitlabProviders]);

	const {
		data: repositories,
		isLoading: isLoadingRepositories,
		error,
	} = api.gitlab.getGitlabRepositories.useQuery(
		{
			gitlabId,
		},
		{
			enabled: !!gitlabId,
		},
	);

	const {
		data: branches,
		fetchStatus,
		status,
	} = api.gitlab.getGitlabBranches.useQuery(
		{
			owner: repository?.owner,
			repo: repository?.repo,
			id: repository?.id || 0,
			gitlabId,
		},
		{
			enabled: !!repository?.owner && !!repository?.repo && !!gitlabId,
		},
	);

	useEffect(() => {
		if (data) {
			form.reset({
				branch: data.gitlabBranch || "",
				repository: {
					repo: data.gitlabRepository || "",
					owner: data.gitlabOwner || "",
					id: data.gitlabProjectId,
					gitlabPathNamespace: data.gitlabPathNamespace || "",
				},
				buildPath: data.gitlabBuildPath || "/",
				gitlabId: data.gitlabId || "",
				watchPaths: data.watchPaths || [],
				enableSubmodules: data.enableSubmodules ?? false,
			});
		}
	}, [form.reset, data?.applicationId, form]);

	const onSubmit = async (formData: GitlabProvider) => {
		await mutateAsync({
			gitlabBranch: formData.branch,
			gitlabRepository: formData.repository.repo,
			gitlabOwner: formData.repository.owner,
			gitlabBuildPath: formData.buildPath,
			gitlabId: formData.gitlabId,
			applicationId,
			gitlabProjectId: formData.repository.id,
			gitlabPathNamespace: formData.repository.gitlabPathNamespace,
			watchPaths: formData.watchPaths || [],
			enableSubmodules: formData.enableSubmodules,
		})
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
							name="gitlabId"
							render={({ field }) => (
								<FormItem className="md:col-span-2 flex flex-col">
									<FormLabel>
										{t("services.compose.provider.account.gitlab")}
									</FormLabel>
									<Select
										onValueChange={(value) => {
											field.onChange(value);
											form.setValue("repository", {
												owner: "",
												repo: "",
												gitlabPathNamespace: "",
												id: null,
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
														"services.compose.provider.accountPlaceholder.gitlab",
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{gitlabProviders?.map((gitlabProvider) => (
												<SelectItem
													key={gitlabProvider.gitlabId}
													value={gitlabProvider.gitlabId}
												>
													{gitlabProvider.gitProvider.name}
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
										{field.value.gitlabPathNamespace && (
											<Link
												href={`${gitlabUrl}/${field.value.gitlabPathNamespace}`}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
											>
												<GitlabIcon className="h-4 w-4" />
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
												{!gitlabId ? (
													<span className="py-6 text-center text-sm text-muted-foreground">
														{t("services.compose.provider.selectAccountFirst", {
															value: t("services.compose.provider.tabs.gitlab"),
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
														{repositories && repositories.length === 0 && (
															<CommandEmpty>
																{t("services.compose.provider.noRepositories")}
															</CommandEmpty>
														)}
														{repositories?.map((repo) => (
															<CommandItem
																value={repo.url}
																key={repo.url}
																onSelect={() => {
																	form.setValue("repository", {
																		owner: repo.owner.username as string,
																		repo: repo.name,
																		id: repo.id,
																		gitlabPathNamespace: repo.url,
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
																		repo.url === field.value.gitlabPathNamespace
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
														" w-full justify-between !bg-input",
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
												{status === "pending" && fetchStatus === "fetching" && (
													<span className="py-6 text-center text-sm text-muted-foreground">
														{t("services.compose.provider.loadingBranches")}
													</span>
												)}
												{!repository?.owner && (
													<span className="py-6 text-center text-sm text-muted-foreground">
														{t("services.compose.provider.selectRepository")}
													</span>
												)}
												<ScrollArea className="h-96">
													<CommandEmpty>
														{t("services.compose.provider.noBranches")}
													</CommandEmpty>
													<CommandGroup>
														{branches?.map((branch) => (
															<CommandItem
																value={branch.name}
																key={branch.commit.id}
																onSelect={() => {
																	form.setValue("branch", branch.name);
																}}
															>
																{branch.name}
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
										<FormMessage />
									</Popover>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="buildPath"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("services.application.provider.buildPath")}
									</FormLabel>
									<FormControl>
										<Input placeholder="/" {...field} />
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
												variant="secondary"
												onClick={() => {
													const value = watchPathInputRef.current?.value.trim();
													if (value) {
														const newPaths = [...(field.value || []), value];
														form.setValue("watchPaths", newPaths);
														if (watchPathInputRef.current) {
															watchPathInputRef.current.value = "";
														}
													}
												}}
											>
												{t("button.add")}
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
					<div className="flex w-full justify-end">
						<Button
							isLoading={isSavingGitlabProvider}
							type="submit"
							className="w-fit"
						>
							{t("button.save")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};
