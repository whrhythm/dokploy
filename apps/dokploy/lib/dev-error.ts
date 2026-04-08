export const logDevError = (context: string, error: unknown) => {
	if (process.env.NODE_ENV === "development") {
		console.error(`[${context}]`, error);
	}
};
