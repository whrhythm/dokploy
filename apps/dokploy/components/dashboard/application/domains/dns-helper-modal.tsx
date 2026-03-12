import { Copy, HelpCircle, Server } from "lucide-react";
import { toast } from "sonner";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";

interface Props {
	domain: {
		host: string;
		https: boolean;
		path?: string;
	};
	serverIp?: string;
}

export const DnsHelperModal = ({ domain, serverIp }: Props) => {
	const { t } = useTranslation();
	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success(t("form.copySuccess"));
	};

	return (
		<Dialog>
			<DialogTrigger>
				<Button variant="ghost" size="icon" className="group">
					<HelpCircle className="size-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Server className="size-5" />
						{t("services.domains.dnsGuide.title")}
					</DialogTitle>
					<DialogDescription>
						{t("services.domains.dnsGuide.description", {
							value: domain.host,
						})}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<AlertBlock type="info">
						{t("services.domains.dnsGuide.alert")}
					</AlertBlock>

					<div className="flex flex-col gap-6">
						<div className="rounded-lg border p-4">
							<h3 className="font-medium mb-2">
								{t("services.domains.dnsGuide.stepOneTitle")}
							</h3>
							<div className="flex flex-col gap-3">
								<p className="text-sm text-muted-foreground">
									{t("services.domains.dnsGuide.stepOneDescription")}
								</p>
								<div className="flex flex-col gap-2">
									<div className="flex items-center justify-between gap-2 bg-muted p-3 rounded-md">
										<div>
											<p className="text-sm font-medium">
												{t("services.domains.dnsGuide.typeA")}
											</p>
											<p className="text-sm">
												{t("services.domains.dnsGuide.name", {
													value: domain.host.split(".")[0],
												})}
											</p>
											<p className="text-sm">
												{t("services.domains.dnsGuide.value", {
													value:
														serverIp ||
														t("services.domains.dnsGuide.serverIpPlaceholder"),
												})}
											</p>
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => copyToClipboard(serverIp || "")}
											disabled={!serverIp}
										>
											<Copy className="size-4" />
										</Button>
									</div>
								</div>
							</div>
						</div>

						<div className="rounded-lg border p-4">
							<h3 className="font-medium mb-2">
								{t("services.domains.dnsGuide.stepTwoTitle")}
							</h3>
							<div className="flex flex-col gap-3">
								<p className="text-sm text-muted-foreground">
									{t("services.domains.dnsGuide.stepTwoDescription")}
								</p>
								<ul className="list-disc list-inside space-y-1 text-sm">
									<li>{t("services.domains.dnsGuide.waitPropagation")}</li>
									<li>
										{t("services.domains.dnsGuide.testDomain")}:{" "}
										{domain.https ? "https://" : "http://"}
										{domain.host}
										{domain.path || "/"}
									</li>
									<li>{t("services.domains.dnsGuide.lookup")}</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
