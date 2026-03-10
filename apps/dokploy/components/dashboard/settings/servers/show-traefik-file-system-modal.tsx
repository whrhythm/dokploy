import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";
import { ShowTraefikSystem } from "../../file-system/show-traefik-system";

interface Props {
	serverId: string;
}

export const ShowTraefikFileSystemModal = ({ serverId }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const { t } = useTranslation();

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<DropdownMenuItem
					className="w-full cursor-pointer "
					onSelect={(e) => e.preventDefault()}
				>
					{t("traefik.Modal.fileSystem.trigger")}
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="sm:max-w-7xl  ">
				<ShowTraefikSystem serverId={serverId} />
			</DialogContent>
		</Dialog>
	);
};
