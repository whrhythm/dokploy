import { Split, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DialogAction } from "@/components/shared/dialog-action";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";
import { HandleRedirect } from "./handle-redirect";

interface Props {
	applicationId: string;
}

export const ShowRedirects = ({ applicationId }: Props) => {
	const { t } = useTranslation();
	const { data, refetch } = api.application.one.useQuery(
		{
			applicationId,
		},
		{ enabled: !!applicationId },
	);

	const { mutateAsync: deleteRedirect, isPending: isRemoving } =
		api.redirects.delete.useMutation();

	const utils = api.useUtils();

	return (
		<Card className="bg-background">
			<CardHeader className="flex flex-row justify-between flex-wrap gap-4">
				<div>
					<CardTitle className="text-xl">
						{t("services.redirects.title")}
					</CardTitle>
					<CardDescription>
						{t("services.redirects.description")}
					</CardDescription>
				</div>

				{data && data?.redirects.length > 0 && (
					<HandleRedirect applicationId={applicationId}>
						{t("services.redirects.add")}
					</HandleRedirect>
				)}
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{data?.redirects.length === 0 ? (
					<div className="flex w-full flex-col items-center justify-center gap-3 pt-10">
						<Split className="size-8 text-muted-foreground" />
						<span className="text-base text-muted-foreground">
							{t("services.redirects.empty")}
						</span>
						<HandleRedirect applicationId={applicationId}>
							{t("services.redirects.add")}
						</HandleRedirect>
					</div>
				) : (
					<div className="flex flex-col pt-2">
						<div className="flex flex-col gap-6">
							{data?.redirects.map((redirect) => (
								<div key={redirect.redirectId}>
									<div className="flex w-full flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-10 border rounded-lg p-4">
										<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 flex-col gap-4 sm:gap-8">
											<div className="flex flex-col gap-1">
												<span className="font-medium">
													{t("services.redirects.regex")}
												</span>
												<span className="text-sm text-muted-foreground">
													{redirect.regex}
												</span>
											</div>
											<div className="flex flex-col gap-1">
												<span className="font-medium">
													{t("services.redirects.replacement")}
												</span>
												<span className="text-sm text-muted-foreground">
													{redirect.replacement}
												</span>
											</div>
											<div className="flex flex-col gap-1">
												<span className="font-medium">
													{t("services.redirects.permanent")}
												</span>
												<span className="text-sm text-muted-foreground">
													{redirect.permanent
														? t("common.yes")
														: t("common.no")}
												</span>
											</div>
										</div>
										<div className="flex flex-row gap-4">
											<HandleRedirect
												redirectId={redirect.redirectId}
												applicationId={applicationId}
											/>

											<DialogAction
												title={t("services.redirects.deleteTitle")}
												description={t("services.redirects.deleteDescription")}
												type="destructive"
												onClick={async () => {
													await deleteRedirect({
														redirectId: redirect.redirectId,
													})
														.then(() => {
															refetch();
															utils.application.readTraefikConfig.invalidate({
																applicationId,
															});
															toast.success(
																t("services.redirects.toast.deleted"),
															);
														})
														.catch(() => {
															toast.error(
																t("services.redirects.toast.deleteError"),
															);
														});
												}}
											>
												<Button
													variant="ghost"
													size="icon"
													className="group hover:bg-red-500/10"
													isLoading={isRemoving}
												>
													<Trash2 className="size-4 text-primary group-hover:text-red-500" />
												</Button>
											</DialogAction>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
