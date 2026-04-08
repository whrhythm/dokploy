type TranslateFn = (
	key: string,
	params?: Record<string, string | number>,
) => string;

const MEMBER_EXISTS_ERRORS = [
	"user is already a member of this organization",
	"already a member of this organization",
];

const INVITATION_EXISTS_ERRORS = [
	"user is already invited to this organization",
	"already invited to this organization",
	"already has a pending invitation",
];

export const getInvitationErrorMessage = (
	message: string | null | undefined,
	t: TranslateFn,
) => {
	if (!message) {
		return t("invitations.error.generic");
	}

	const normalizedMessage = message.toLowerCase();

	if (
		MEMBER_EXISTS_ERRORS.some((errorText) =>
			normalizedMessage.includes(errorText),
		)
	) {
		return t("invitations.error.alreadyMember");
	}

	if (
		INVITATION_EXISTS_ERRORS.some((errorText) =>
			normalizedMessage.includes(errorText),
		)
	) {
		return t("invitations.error.alreadyInvited");
	}

	return t("invitations.error.generic");
};
