import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Settings2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { NumberInput } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

const createSchema = (_t: (key: string) => string) =>
	z.object({
		host: z.object({
			thresholds: z.object({
				cpu: z.number().min(0),
				memory: z.number().min(0),
				disk: z.number().min(0),
			}),
		}),
	});

type Schema = z.infer<ReturnType<typeof createSchema>>;

export const ShowHostMonitoringSettings = () => {
	const { t } = useTranslation();
	const { data: settings } = api.settings.getWebServerSettings.useQuery();
	const { mutateAsync, isPending } =
		api.admin.updateHostMonitoring.useMutation();

	const form = useForm<Schema>({
		resolver: zodResolver(createSchema(t)),
		defaultValues: {
			host: {
				thresholds: {
					cpu: 0,
					memory: 0,
					disk: 0,
				},
			},
		},
	});

	useEffect(() => {
		form.reset({
			host: {
				thresholds: {
					cpu: settings?.metricsConfig?.host?.thresholds?.cpu ?? 0,
					memory: settings?.metricsConfig?.host?.thresholds?.memory ?? 0,
					disk: settings?.metricsConfig?.host?.thresholds?.disk ?? 0,
				},
			},
		});
	}, [form, settings]);

	const onSubmit = async (values: Schema) => {
		await mutateAsync({
			host: values.host,
		})
			.then(() => {
				toast.success(t("setupMonitoring.success"));
			})
			.catch(() => {
				toast.error(t("setupMonitoring.error"));
			});
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline">
					<Settings2 className="mr-2 h-4 w-4" />
					{t("monitoring.hostSettings")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t("monitoring.hostSettings")}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name="host.thresholds.cpu"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("setupMonitoring.hostCpuThreshold")}</FormLabel>
									<FormControl>
										<NumberInput {...field} />
									</FormControl>
									<FormDescription>
										{t("setupMonitoring.hostCpuThresholdDescription")}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="host.thresholds.memory"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("setupMonitoring.hostMemoryThreshold")}
									</FormLabel>
									<FormControl>
										<NumberInput {...field} />
									</FormControl>
									<FormDescription>
										{t("setupMonitoring.hostMemoryThresholdDescription")}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="host.thresholds.disk"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("setupMonitoring.hostDiskThreshold")}
									</FormLabel>
									<FormControl>
										<NumberInput {...field} />
									</FormControl>
									<FormDescription>
										{t("setupMonitoring.hostDiskThresholdDescription")}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end gap-2">
							<Button type="submit" isLoading={isPending}>
								{t("button.save")}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
