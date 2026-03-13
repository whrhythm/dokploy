"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { ArrowRight, ListTodo, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/use-translation";
import type { AppRouter } from "@/server/api/root";
import { api } from "@/utils/api";

type QueueRow =
	inferRouterOutputs<AppRouter>["deployment"]["queueList"][number];

const stateVariants: Record<
	string,
	| "default"
	| "secondary"
	| "destructive"
	| "outline"
	| "yellow"
	| "green"
	| "red"
> = {
	pending: "secondary",
	waiting: "secondary",
	active: "yellow",
	delayed: "outline",
	completed: "green",
	failed: "destructive",
	cancelled: "outline",
	paused: "outline",
};

function formatTs(ts?: number): string {
	if (ts == null) return "—";
	const d = new Date(ts);
	return d.toLocaleString();
}

export function ShowQueueTable(props: { embedded?: boolean }) {
	const { t } = useTranslation();
	const { embedded: _embedded = false } = props;

	const getJobLabel = (row: QueueRow): string => {
		const d = row.data as {
			applicationType?: string;
			applicationId?: string;
			composeId?: string;
			previewDeploymentId?: string;
			titleLog?: string;
			type?: string;
		};
		if (!d) return String(row.id);
		const type = d.applicationType ?? "job";
		const title = d.titleLog ?? "";
		if (title) return title;
		if (d.applicationId) {
			return `${t("deployment.jobType.application")} ${d.applicationId.slice(0, 8)}…`;
		}
		if (d.composeId) {
			return `${t("deployment.jobType.compose")} ${d.composeId.slice(0, 8)}…`;
		}
		if (d.previewDeploymentId) {
			return `${t("deployment.jobType.preview")} ${d.previewDeploymentId.slice(0, 8)}…`;
		}
		const translatedType = t(`deployment.jobType.${type}`);
		const jobType =
			translatedType === `deployment.jobType.${type}` ? type : translatedType;
		return `${jobType} ${String(row.id)}`;
	};

	const { data: queueList, isLoading } = api.deployment.queueList.useQuery(
		undefined,
		{ refetchInterval: 3000 },
	);
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const utils = api.useUtils();
	const {
		mutateAsync: cancelApplicationDeployment,
		isPending: isCancellingApp,
	} = api.application.cancelDeployment.useMutation({
		onSuccess: () => void utils.deployment.queueList.invalidate(),
	});
	const {
		mutateAsync: cancelComposeDeployment,
		isPending: isCancellingCompose,
	} = api.compose.cancelDeployment.useMutation({
		onSuccess: () => void utils.deployment.queueList.invalidate(),
	});
	const isCancelling = isCancellingApp || isCancellingCompose;

	return (
		<div className="px-0">
			{isLoading ? (
				<div className="flex gap-4 w-full items-center justify-center min-h-[30vh] text-muted-foreground">
					<Loader2 className="size-4 animate-spin" />
					<span>{t("loading")}</span>
				</div>
			) : (
				<div className="rounded-md border overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("form.id")}</TableHead>
								<TableHead>{t("form.label")}</TableHead>
								<TableHead>{t("form.type")}</TableHead>
								<TableHead>{t("form.status")}</TableHead>
								<TableHead>{t("deployment.table.added")}</TableHead>
								<TableHead>{t("deployment.table.processed")}</TableHead>
								<TableHead>{t("deployment.table.finished")}</TableHead>
								<TableHead>{t("deployment.table.error")}</TableHead>
								<TableHead className="w-[100px]">{t("form.actions")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{queueList?.length ? (
								queueList.map((row) => {
									const d = row.data as Record<string, unknown>;
									const appType = d?.applicationType as string | undefined;
									const pathInfo = row.servicePath;
									const hasLink = pathInfo?.href != null;
									return (
										<TableRow key={String(row.id)}>
											<TableCell className="font-mono text-xs">
												{String(row.id)}
											</TableCell>
											<TableCell className="max-w-[200px] truncate">
												{getJobLabel(row)}
											</TableCell>
											<TableCell>{appType ?? row.name ?? "—"}</TableCell>
											<TableCell>
												<Badge variant={stateVariants[row.state] ?? "outline"}>
													{(() => {
														const translated = t(
															`deployment.queueState.${row.state}`,
														);
														return translated ===
															`deployment.queueState.${row.state}`
															? row.state
															: translated;
													})()}
												</Badge>
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{formatTs(row.timestamp)}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{formatTs(row.processedOn)}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{formatTs(row.finishedOn)}
											</TableCell>
											<TableCell className="max-w-[180px] truncate text-xs text-destructive">
												{row.failedReason ?? "—"}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1">
													{hasLink ? (
														<Button variant="ghost" size="sm" asChild>
															<Link href={pathInfo!.href!}>
																<ArrowRight className="size-4 mr-1" />
																{t("form.service")}
															</Link>
														</Button>
													) : (
														<span className="text-muted-foreground text-xs">
															—
														</span>
													)}
													{isCloud &&
														row.state === "active" &&
														(d?.applicationId != null ||
															d?.composeId != null) && (
															<Button
																variant="ghost"
																size="sm"
																className="text-destructive hover:text-destructive"
																disabled={isCancelling}
																onClick={() => {
																	const appId =
																		typeof d.applicationId === "string"
																			? d.applicationId
																			: undefined;
																	const compId =
																		typeof d.composeId === "string"
																			? d.composeId
																			: undefined;
																	if (appId) {
																		void cancelApplicationDeployment({
																			applicationId: appId,
																		});
																	} else if (compId) {
																		void cancelComposeDeployment({
																			composeId: compId,
																		});
																	}
																}}
															>
																<XCircle className="size-4 mr-1" />
																{t("button.cancel")}
															</Button>
														)}
												</div>
											</TableCell>
										</TableRow>
									);
								})
							) : (
								<TableRow>
									<TableCell colSpan={9} className="text-center py-12">
										<div className="flex flex-col items-center justify-center gap-2 text-muted-foreground min-h-[30vh]">
											<ListTodo className="size-8" />
											<p className="font-medium">{t("empty")}</p>
											<p className="text-sm">
												{t("deployment.queueDescription")}
											</p>
										</div>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
