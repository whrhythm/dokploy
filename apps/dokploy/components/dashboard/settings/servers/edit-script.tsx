import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { FileTerminal } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
import { CodeEditor } from "@/components/shared/code-editor";
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
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

interface Props {
	serverId: string;
}

const createScriptSchema = (t: (key: string) => string) =>
	z.object({
		command: z.string().min(1, {
			message: t("editScript.validation.commandRequired"),
		}),
	});

type Schema = z.infer<ReturnType<typeof createScriptSchema>>;

export const EditScript = ({ serverId }: Props) => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const { data: server } = api.server.one.useQuery(
		{
			serverId,
		},
		{
			enabled: !!serverId,
		},
	);

	const { mutateAsync, isPending } = api.server.update.useMutation();

	const { data: defaultCommand } = api.server.getDefaultCommand.useQuery(
		{
			serverId,
		},
		{
			enabled: !!serverId,
		},
	);

	const form = useForm<Schema>({
		defaultValues: {
			command: "",
		},
		resolver: zodResolver(createScriptSchema(t)),
	});

	useEffect(() => {
		if (server) {
			form.reset({
				command: server.command || defaultCommand,
			});
		}
	}, [server, defaultCommand]);

	const onSubmit = async (formData: Schema) => {
		if (server) {
			await mutateAsync({
				...server,
				command: formData.command || "",
				serverId,
			})
				.then((_data) => {
					toast.success(t("editScript.success"));
				})
				.catch(() => {
					toast.error(t("editScript.error"));
				});
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline">
					{t("editScript.trigger")}
					<FileTerminal className="size-4 text-muted-foreground" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-5xl overflow-x-hidden">
				<DialogHeader>
					<DialogTitle>{t("editScript.title")}</DialogTitle>
					<DialogDescription>{t("editScript.description")}</DialogDescription>

					<AlertBlock type="warning">{t("editScript.warning")}</AlertBlock>
				</DialogHeader>
				<div className="grid gap-4">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							id="hook-form-delete-application"
							className="grid w-full gap-4"
						>
							<FormField
								control={form.control}
								name="command"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("editScript.commandLabel")}</FormLabel>
										<FormControl className="max-h-[75vh] max-w-[60rem] overflow-y-scroll overflow-x-hidden">
											<CodeEditor
												language="shell"
												wrapperClassName="font-mono"
												{...field}
												placeholder={t("editScript.placeholder")}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</form>
					</Form>
				</div>
				<DialogFooter className="flex justify-between w-full">
					<Button
						variant="secondary"
						onClick={() => {
							form.reset({
								command: defaultCommand || "",
							});
						}}
					>
						{t("editScript.reset")}
					</Button>
					<Button
						isLoading={isPending}
						form="hook-form-delete-application"
						type="submit"
					>
						{t("editScript.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
