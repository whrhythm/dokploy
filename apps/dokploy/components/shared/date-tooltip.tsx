import { format, formatDistanceToNow } from "date-fns";
import { enUS, zhCN, zhTW } from "date-fns/locale";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

interface Props {
	date: string;
	children?: React.ReactNode;
	className?: string;
}

export const DateTooltip = ({ date, children, className }: Props) => {
	const { locale } = useTranslation();

	const dateLocale =
		locale === "zh-Hant" ? zhTW : locale === "zh-Hans" ? zhCN : enUS;

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger>
					<span
						className={cn(
							"flex items-center text-muted-foreground text-left",
							className,
						)}
					>
						{children}{" "}
						{formatDistanceToNow(new Date(date), {
							addSuffix: true,
							locale: dateLocale,
						})}
					</span>
				</TooltipTrigger>
				<TooltipContent>
					{format(new Date(date), "PPpp", { locale: dateLocale })}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
