import { ToggleVisibilityInput } from "@/components/shared/toggle-visibility-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

interface Props {
	redisId: string;
}
export const ShowInternalRedisCredentials = ({ redisId }: Props) => {
	const { t } = useTranslation();
	const { data } = api.redis.one.useQuery({ redisId });
	return (
		<>
			<div className="flex w-full flex-col gap-5 ">
				<Card className="bg-background">
					<CardHeader>
						<CardTitle className="text-xl">
							{t("services.redis.internalCredentials")}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex w-full flex-row gap-4">
						<div className="grid w-full md:grid-cols-2 gap-4 md:gap-8">
							<div className="flex flex-col gap-2">
								<Label>{t("services.redis.credentials.user")}</Label>
								<Input disabled value="default" />
							</div>
							<div className="flex flex-col gap-2">
								<Label>{t("services.redis.credentials.password")}</Label>
								<div className="flex flex-row gap-4">
									<ToggleVisibilityInput
										value={data?.databasePassword}
										disabled
									/>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<Label>{t("services.redis.credentials.internalPort")}</Label>
								<Input disabled value="6379" />
							</div>

							<div className="flex flex-col gap-2">
								<Label>{t("services.redis.credentials.internalHost")}</Label>
								<Input disabled value={data?.appName} />
							</div>

							<div className="flex flex-col gap-2 md:col-span-2">
								<Label>{t("services.redis.credentials.internalUrl")}</Label>
								<ToggleVisibilityInput
									disabled
									value={`redis://default:${data?.databasePassword}@${data?.appName}:6379`}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
};
