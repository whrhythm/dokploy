import copy from "copy-to-clipboard";
import { CopyIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AlertBlock } from "@/components/shared/alert-block";
import { CardContent } from "@/components/ui/card";
import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

interface Props {
	serverId?: string;
}

export const AddManager = ({ serverId }: Props) => {
	const { t } = useTranslation();
	const { data, isPending, error, isError } = api.cluster.addManager.useQuery({
		serverId,
	});

	return (
		<>
			<CardContent className="sm:max-w-4xl  flex flex-col gap-4 px-0">
				<DialogHeader>
					<DialogTitle>{t("cluster.Modal.addManager.title")}</DialogTitle>
					<DialogDescription>
						{t("cluster.Modal.addManager.description")}
					</DialogDescription>
				</DialogHeader>
				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}
				{isPending ? (
					<Loader2 className="w-full animate-spin text-muted-foreground" />
				) : (
					<>
						<div className="flex flex-col gap-2.5 text-sm">
							<span>{t("cluster.Modal.addManager.step1")}</span>
							<span className="bg-muted rounded-lg p-2 flex justify-between">
								curl https://get.docker.com | sh -s -- --version {data?.version}
								<button
									type="button"
									className="self-center"
									onClick={() => {
										copy(
											`curl https://get.docker.com | sh -s -- --version ${data?.version}`,
										);
										toast.success(t("cluster.copySuccess"));
									}}
								>
									<CopyIcon className="h-4 w-4 cursor-pointer" />
								</button>
							</span>
						</div>

						<div className="flex flex-col gap-2.5 text-sm">
							<span>{t("cluster.Modal.addManager.step2")}</span>

							<span className="bg-muted rounded-lg p-2  flex">
								{data?.command}
								<button
									type="button"
									className="self-start"
									onClick={() => {
										copy(data?.command || "");
										toast.success(t("cluster.copySuccess"));
									}}
								>
									<CopyIcon className="h-4 w-4 cursor-pointer" />
								</button>
							</span>
						</div>
					</>
				)}
			</CardContent>
		</>
	);
};
