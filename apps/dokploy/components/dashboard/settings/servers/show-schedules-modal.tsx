import { useState } from "react";
import { ShowSchedules } from "@/components/dashboard/application/schedules/show-schedules";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";

interface Props {
	serverId: string;
}

export const ShowSchedulesModal = ({ serverId }: Props) => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<DropdownMenuItem
					className="w-full cursor-pointer "
					onSelect={(e) => e.preventDefault()}
				>
					{t("schedule.show")}
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="sm:max-w-5xl  ">
				<ShowSchedules id={serverId} scheduleType="server" />
			</DialogContent>
		</Dialog>
	);
};
