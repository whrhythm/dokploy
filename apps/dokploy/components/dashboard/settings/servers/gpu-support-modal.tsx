import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";
import { GPUSupport } from "./gpu-support";

export const GPUSupportModal = () => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<DropdownMenuItem
					className="w-full cursor-pointer"
					onSelect={(e) => e.preventDefault()}
				>
					<span>{t("gpuSupport.modalTrigger")}</span>
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{t("gpuSupport.modalTitle")}
					</DialogTitle>
				</DialogHeader>

				<GPUSupport serverId="" />
			</DialogContent>
		</Dialog>
	);
};
