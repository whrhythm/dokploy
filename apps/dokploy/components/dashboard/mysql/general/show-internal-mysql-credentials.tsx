import { ToggleVisibilityInput } from "@/components/shared/toggle-visibility-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/utils/api";

interface Props {
	mysqlId: string;
}
export const ShowInternalMysqlCredentials = ({ mysqlId }: Props) => {
	const { t } = useTranslation();
	const { data } = api.mysql.one.useQuery({ mysqlId });
	return (
		<>
			<div className="flex w-full flex-col gap-5 ">
				<Card className="bg-background">
					<CardHeader>
						<CardTitle className="text-xl">
							{t("services.mysql.internalCredentials")}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex w-full flex-row gap-4">
						<div className="grid w-full md:grid-cols-2 gap-4 md:gap-8">
							<div className="flex flex-col gap-2">
								<Label>{t("services.mysql.credentials.user")}</Label>
								<Input disabled value={data?.databaseUser} />
							</div>
							<div className="flex flex-col gap-2">
								<Label>{t("services.mysql.credentials.databaseName")}</Label>
								<Input disabled value={data?.databaseName} />
							</div>
							<div className="flex flex-col gap-2">
								<Label>{t("services.mysql.credentials.password")}</Label>
								<div className="flex flex-row gap-4">
									<ToggleVisibilityInput
										disabled
										value={data?.databasePassword}
									/>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<Label>{t("services.mysql.credentials.rootPassword")}</Label>
								<div className="flex flex-row gap-4">
									<ToggleVisibilityInput
										disabled
										value={data?.databaseRootPassword}
									/>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<Label>{t("services.mysql.credentials.internalPort")}</Label>
								<Input disabled value="3306" />
							</div>

							<div className="flex flex-col gap-2">
								<Label>{t("services.mysql.credentials.internalHost")}</Label>
								<Input disabled value={data?.appName} />
							</div>

							<div className="flex flex-col gap-2 md:col-span-2">
								<Label>{t("services.mysql.credentials.internalUrl")}</Label>
								<ToggleVisibilityInput
									disabled
									value={`mysql://${data?.databaseUser}:${data?.databasePassword}@${data?.appName}:3306/${data?.databaseName}`}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
};
