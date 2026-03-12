import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { PenBoxIcon } from "lucide-react";
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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

const createUpdateApplicationSchema = (t: (key: string) => string) =>
	z.object({
		name: z.string().min(1, {
			message: t("services.application.validation.nameRequired"),
		}),
		description: z.string().optional(),
	});

type UpdateApplication = z.infer<
	ReturnType<typeof createUpdateApplicationSchema>
>;

interface Props {
	applicationId: string;
}

export const UpdateApplication = ({ applicationId }: Props) => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const utils = api.useUtils();
	const { mutateAsync, error, isError, isPending } =
		api.application.update.useMutation();
	const { data } = api.application.one.useQuery(
		{
			applicationId,
		},
		{
			enabled: !!applicationId,
		},
	);
	const form = useForm<UpdateApplication>({
		defaultValues: {
			description: data?.description ?? "",
			name: data?.name ?? "",
		},
		resolver: zodResolver(createUpdateApplicationSchema(t)),
	});
	useEffect(() => {
		if (data) {
			form.reset({
				description: data.description ?? "",
				name: data.name,
			});
		}
	}, [data, form, form.reset]);

	const onSubmit = async (formData: UpdateApplication) => {
		await mutateAsync({
			name: formData.name,
			applicationId: applicationId,
			description: formData.description || "",
		})
			.then(() => {
				toast.success(t("services.application.toast.updated"));
				utils.application.one.invalidate({
					applicationId: applicationId,
				});
				setIsOpen(false);
			})
			.catch(() => {
				toast.error(t("services.application.toast.updateError"));
			})
			.finally(() => {});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="group hover:bg-blue-500/10 "
				>
					<PenBoxIcon className="size-3.5  text-primary group-hover:text-blue-500" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{t("services.application.modal.modifyTitle")}
					</DialogTitle>
					<DialogDescription>
						{t("services.application.modal.modifyDescription")}
					</DialogDescription>
				</DialogHeader>
				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}

				<div className="grid gap-4">
					<div className="grid items-center gap-4">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								id="hook-form-update-application"
								className="grid w-full gap-4 "
							>
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("form.name")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t(
														"services.application.namePlaceholder",
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
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("form.description")}</FormLabel>
											<FormControl>
												<Textarea
													placeholder={t(
														"services.application.descriptionPlaceholder",
													)}
													className="resize-none"
													{...field}
												/>
											</FormControl>

											<FormMessage />
										</FormItem>
									)}
								/>
								<DialogFooter>
									<Button
										isLoading={isPending}
										form="hook-form-update-application"
										type="submit"
									>
										{t("button.update")}
									</Button>
								</DialogFooter>
							</form>
						</Form>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
