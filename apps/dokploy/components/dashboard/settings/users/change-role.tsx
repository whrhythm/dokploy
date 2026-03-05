import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
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
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

const changeRoleSchema = z.object({
	role: z.enum(["admin", "member"]),
});

type ChangeRoleSchema = z.infer<typeof changeRoleSchema>;

interface Props {
	memberId: string;
	currentRole: "admin" | "member";
	userEmail: string;
}

export const ChangeRole = ({ memberId, currentRole, userEmail }: Props) => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const utils = api.useUtils();

	const { mutateAsync, isError, error, isPending } =
		api.organization.updateMemberRole.useMutation();

	const form = useForm<ChangeRoleSchema>({
		defaultValues: {
			role: currentRole,
		},
		resolver: zodResolver(changeRoleSchema),
	});

	useEffect(() => {
		if (isOpen) {
			form.reset({
				role: currentRole,
			});
		}
	}, [form, currentRole, isOpen]);

	const onSubmit = async (data: ChangeRoleSchema) => {
		await mutateAsync({
			memberId,
			role: data.role,
		})
			.then(async () => {
				toast.success(t("users.roleUpdated"));
				await utils.user.all.invalidate();
				setIsOpen(false);
			})
			.catch((error) => {
				toast.error(error?.message || t("users.roleUpdateError"));
			});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger className="" asChild>
				<DropdownMenuItem
					className="w-full cursor-pointer"
					onSelect={(e) => e.preventDefault()}
				>
					{t("users.changeRoleAction")}
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="max-h-[85vh] sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("users.changeRoleTitle")}</DialogTitle>
					<DialogDescription>
						{t("users.changeRoleDescription")} <strong>{userEmail}</strong>
					</DialogDescription>
				</DialogHeader>
				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}

				<Form {...form}>
					<form
						id="hook-form-change-role"
						onSubmit={form.handleSubmit(onSubmit)}
						className="w-full space-y-4"
					>
						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("users.role")}</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder={t("users.selectRole")} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="admin">{t("user.admin")}</SelectItem>
											<SelectItem value="member">{t("user.member")}</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>
										<strong>{t("user.admin")}:</strong>{" "}
										{t("users.roleDescAdmin")}
										<br />
										<strong>{t("user.member")}:</strong>{" "}
										{t("users.roleDescMember")}
										<br />
										<em className="text-muted-foreground text-xs">
											{t("users.roleNote")}
										</em>
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
				</Form>

				<DialogFooter>
					<Button
						isLoading={isPending}
						form="hook-form-change-role"
						type="submit"
					>
						{t("users.updateRole")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
