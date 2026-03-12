import { File, FilePlus2, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";
import { EditPatchDialog } from "./edit-patch-dialog";
import { PatchEditor } from "./patch-editor";

interface Props {
	id: string;
	type: "application" | "compose";
}

export const ShowPatches = ({ id, type }: Props) => {
	const { t } = useTranslation();
	const [selectedFile, setSelectedFile] = useState<string | null>(null);
	const [repoPath, setRepoPath] = useState<string | null>(null);
	const [isLoadingRepo, setIsLoadingRepo] = useState(false);

	const utils = api.useUtils();

	const { data: patches, isPending: isPatchesLoading } =
		api.patch.byEntityId.useQuery({ id, type }, { enabled: !!id });

	const mutationMap = {
		application: () => api.patch.delete.useMutation(),
		compose: () => api.patch.delete.useMutation(),
	};

	const ensureRepo = api.patch.ensureRepo.useMutation();

	const togglePatch = api.patch.toggleEnabled.useMutation();

	const { mutateAsync } = mutationMap[type]
		? mutationMap[type]()
		: api.patch.delete.useMutation();

	const handleCloseEditor = () => {
		setSelectedFile(null);
		setRepoPath(null);
	};

	if (repoPath) {
		return (
			<PatchEditor
				id={id}
				type={type}
				repoPath={repoPath || ""}
				onClose={handleCloseEditor}
			/>
		);
	}

	const handleOpenEditor = async () => {
		setIsLoadingRepo(true);
		await ensureRepo
			.mutateAsync({ id, type })
			.then((result) => {
				setRepoPath(result);
			})
			.catch(() => {
				toast.error(t("services.patches.toast.createError"));
			})
			.finally(() => {
				setIsLoadingRepo(false);
			});
	};

	return (
		<Card className="bg-background">
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>{t("services.patches.title")}</CardTitle>
					<CardDescription>{t("services.patches.description")}</CardDescription>
				</div>
				{patches && patches?.length > 0 && (
					<Button onClick={handleOpenEditor} disabled={isLoadingRepo}>
						{isLoadingRepo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						<FilePlus2 className="mr-2 h-4 w-4" />
						{t("services.patches.create")}
					</Button>
				)}
			</CardHeader>
			<CardContent>
				{isPatchesLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin" />
					</div>
				) : patches?.length === 0 ? (
					<div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8">
						<div className="rounded-full bg-muted p-4">
							<FilePlus2 className="h-10 w-10 text-muted-foreground" />
						</div>
						<div className="space-y-1 text-center">
							<p className="text-sm font-medium">
								{t("services.patches.emptyTitle")}
							</p>
							<p className="max-w-sm text-sm text-muted-foreground">
								{t("services.patches.emptyDescription")}
							</p>
						</div>
						<Button onClick={handleOpenEditor} disabled={isLoadingRepo}>
							{isLoadingRepo && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							<FilePlus2 className="mr-2 h-4 w-4" />
							{t("services.patches.create")}
						</Button>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("services.patches.filePath")}</TableHead>
								<TableHead className="w-[80px]">{t("form.type")}</TableHead>
								<TableHead className="w-[100px]">
									{t("services.patches.enabled")}
								</TableHead>
								<TableHead className="w-[100px]">{t("form.actions")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{patches?.map((patch) => (
								<TableRow key={patch.patchId}>
									<TableCell className="font-mono text-sm">
										<div className="flex items-center gap-2">
											<File className="h-4 w-4 text-muted-foreground shrink-0" />
											{patch.filePath}
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={
												patch.type === "delete"
													? "destructive"
													: patch.type === "create"
														? "default"
														: "secondary"
											}
											className="font-normal"
										>
											{patch.type}
										</Badge>
									</TableCell>
									<TableCell>
										<Switch
											checked={patch.enabled}
											onCheckedChange={(checked) => {
												togglePatch
													.mutateAsync({
														patchId: patch.patchId,
														enabled: checked,
													})
													.then(() => {
														toast.success(t("services.patches.toast.updated"));
														utils.patch.byEntityId.invalidate({
															id,
															type,
														});
													})
													.catch((err) => {
														toast.error(err.message);
													})
													.finally(() => {
														setIsLoadingRepo(false);
													});
											}}
										/>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1">
											{(patch.type === "update" || patch.type === "create") && (
												<EditPatchDialog
													patchId={patch.patchId}
													entityId={id}
													type={type}
												/>
											)}
											<Button
												variant="ghost"
												size="icon"
												onClick={() => {
													mutateAsync({ patchId: patch.patchId })
														.then(() => {
															toast.success(
																t("services.patches.toast.deleted"),
															);
															utils.patch.byEntityId.invalidate({
																id,
																type,
															});
														})
														.catch((err) => {
															toast.error(err.message);
														});
												}}
												title={t("services.patches.deleteTitle")}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
};
