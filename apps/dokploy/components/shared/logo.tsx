import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

interface Props {
	className?: string;
	logoUrl?: string;
}

export const Logo = ({ className = "size-14", logoUrl }: Props) => {
	const { t } = useTranslation();
	const resolvedLogoUrl = logoUrl?.trim();
	return (
		<img
			src={resolvedLogoUrl ? resolvedLogoUrl : "/logo.svg"}
			alt={t("logo.organization")}
			className={cn(className, "object-contain rounded-sm")}
		/>
	);
};
