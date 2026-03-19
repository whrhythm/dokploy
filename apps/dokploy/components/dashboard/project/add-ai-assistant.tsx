import { TemplateGenerator } from "@/components/dashboard/project/ai/template-generator";

interface Props {
	environmentId: string;
	projectName?: string;
	disabled?: boolean;
}

export const AddAiAssistant = ({ environmentId, disabled }: Props) => {
	return (
		<TemplateGenerator environmentId={environmentId} disabled={disabled} />
	);
};
