import copy from "copy-to-clipboard";
import { format, isPast } from "date-fns";
import { Loader2, Mail, MoreHorizontal, Users } from "lucide-react";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/use-translation";
import { authClient } from "@/lib/auth-client";
import { api } from "@/utils/api";
import { AddInvitation } from "./add-invitation";

export const ShowInvitations = () => {
	const { t } = useTranslation();
	const { data, isPending, refetch } =
		api.organization.allInvitations.useQuery();

	const { mutateAsync: removeInvitation } =
		api.organization.removeInvitation.useMutation();

	const getRoleLabel = (role: string) => {
		if (role === "owner") return t("user.owner");
		if (role === "admin") return t("user.admin");
		if (role === "member") return t("user.member");
		return role;
	};

	const getStatusLabel = (status: string) => {
		if (status === "pending") return t("invitations.status.pending");
		if (status === "canceled") return t("invitations.status.canceled");
		if (status === "accepted") return t("invitations.status.accepted");
		return status;
	};

	return (
		<div className="w-full">
			<Card className="h-full bg-sidebar  p-2.5 rounded-xl  max-w-5xl mx-auto">
				<div className="rounded-xl bg-background shadow-md ">
					<CardHeader className="">
						<CardTitle className="text-xl flex flex-row gap-2">
							<Mail className="size-6 text-muted-foreground self-center" />
							{t("invitations.title")}
						</CardTitle>
						<CardDescription>{t("invitations.description")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 py-8 border-t">
						{isPending ? (
							<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground min-h-[25vh]">
								<span>{t("loading")}</span>
								<Loader2 className="animate-spin size-4" />
							</div>
						) : (
							<>
								{data?.length === 0 ? (
									<div className="flex flex-col items-center gap-3  min-h-[25vh] justify-center">
										<Users className="size-8 self-center text-muted-foreground" />
										<span className="text-base text-muted-foreground">
											{t("invitations.empty")}
										</span>
										<AddInvitation />
									</div>
								) : (
									<div className="flex flex-col gap-4  min-h-[25vh]">
										<Table>
											<TableCaption>{t("invitations.caption")}</TableCaption>
											<TableHeader>
												<TableRow>
													<TableHead className="w-[100px]">
														{t("form.email")}
													</TableHead>
													<TableHead className="text-center">
														{t("users.role")}
													</TableHead>
													<TableHead className="text-center">
														{t("invitations.status")}
													</TableHead>
													<TableHead className="text-center">
														{t("invitations.expiresAt")}
													</TableHead>
													<TableHead className="text-right">
														{t("users.actions")}
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{data?.map((invitation) => {
													const isExpired = isPast(
														new Date(invitation.expiresAt),
													);
													return (
														<TableRow key={invitation.id}>
															<TableCell className="w-[100px]">
																{invitation.email}
															</TableCell>
															<TableCell className="text-center">
																<Badge
																	variant={
																		invitation.role === "owner"
																			? "default"
																			: "secondary"
																	}
																>
																	{getRoleLabel(invitation.role)}
																</Badge>
															</TableCell>
															<TableCell className="text-center">
																<Badge
																	variant={
																		invitation.status === "pending"
																			? "secondary"
																			: invitation.status === "canceled"
																				? "destructive"
																				: "default"
																	}
																>
																	{getStatusLabel(invitation.status)}
																</Badge>
															</TableCell>
															<TableCell className="text-center">
																{format(new Date(invitation.expiresAt), "PPpp")}{" "}
																{isExpired ? (
																	<span className="text-muted-foreground">
																		({t("invitations.expired")})
																	</span>
																) : null}
															</TableCell>

															<TableCell className="text-right flex justify-end">
																<DropdownMenu>
																	<DropdownMenuTrigger asChild>
																		<Button
																			variant="ghost"
																			className="h-8 w-8 p-0"
																		>
																			<span className="sr-only">
																				{t("users.openMenu")}
																			</span>
																			<MoreHorizontal className="h-4 w-4" />
																		</Button>
																	</DropdownMenuTrigger>
																	<DropdownMenuContent align="end">
																		<DropdownMenuLabel>
																			{t("users.actions")}
																		</DropdownMenuLabel>
																		{!isExpired && (
																			<>
																				{invitation.status === "pending" && (
																					<DropdownMenuItem
																						className="w-full cursor-pointer"
																						onSelect={() => {
																							copy(
																								`${origin}/invitation?token=${invitation.id}`,
																							);
																							toast.success(
																								t("invitations.copied"),
																							);
																						}}
																					>
																						{t("invitations.copyAction")}
																					</DropdownMenuItem>
																				)}

																				{invitation.status === "pending" && (
																					<DropdownMenuItem
																						className="w-full cursor-pointer"
																						onSelect={async () => {
																							const result =
																								await authClient.organization.cancelInvitation(
																									{
																										invitationId: invitation.id,
																									},
																								);

																							if (result.error) {
																								toast.error(
																									result.error.message,
																								);
																							} else {
																								toast.success(
																									t("invitations.canceled"),
																								);
																								refetch();
																							}
																						}}
																					>
																						{t("invitations.cancelAction")}
																					</DropdownMenuItem>
																				)}
																			</>
																		)}
																		<DropdownMenuItem
																			className="w-full cursor-pointer"
																			onSelect={async () => {
																				await removeInvitation({
																					invitationId: invitation.id,
																				}).then(() => {
																					refetch();
																					toast.success(
																						t("invitations.removed"),
																					);
																				});
																			}}
																		>
																			{t("invitations.removeAction")}
																		</DropdownMenuItem>
																	</DropdownMenuContent>
																</DropdownMenu>
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>

										<div className="flex flex-row gap-2 flex-wrap w-full justify-end mr-4">
											<AddInvitation />
										</div>
									</div>
								)}
							</>
						)}
					</CardContent>
				</div>
			</Card>
		</div>
	);
};
