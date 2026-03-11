import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";
import { ShowNodes } from "./show-nodes";

interface Props {
	serverId: string;
}

export const ShowNodesModal = ({ serverId }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const { t } = useTranslation();

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<DropdownMenuItem
					className="w-full cursor-pointer "
					onSelect={(e) => e.preventDefault()}
				>
					{t("cluster.Modal.showNodes.trigger")}
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="min-w-[70vw]">
				<div className="grid w-full gap-1">
					<ShowNodes serverId={serverId} />
				</div>
			</DialogContent>
		</Dialog>
	);
};
