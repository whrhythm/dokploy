"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { authClient } from "@/lib/auth-client";

const createSsoEmailSchema = (t: (key: string) => string) =>
	z.object({
		email: z
			.string()
			.min(1, t("auth.sso.validation.workEmailRequired"))
			.email(t("profile.validation.emailInvalid"))
			.transform((v) => v.trim()),
	});

type SSOEmailForm = z.infer<ReturnType<typeof createSsoEmailSchema>>;

interface SignInWithSSOProps {
	/** Content shown when SSO is collapsed (e.g. email/password form) */
	children: React.ReactNode;
}

export function SignInWithSSO({ children }: SignInWithSSOProps) {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(false);

	const form = useForm<SSOEmailForm>({
		resolver: zodResolver(createSsoEmailSchema(t)),
		defaultValues: { email: "" },
	});

	const onSubmit = async (values: SSOEmailForm) => {
		try {
			const { data, error } = await authClient.signIn.sso({
				email: values.email,
				callbackURL: "/dashboard/projects",
			});
			if (error) {
				toast.error(error.message ?? t("auth.sso.toast.signInError"));
				return;
			}
			if (data?.url) {
				window.location.href = data.url;
			}
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : t("auth.sso.toast.signInError"),
			);
		}
	};

	if (!expanded) {
		return (
			<div className="mb-4 space-y-2">
				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={() => setExpanded(true)}
				>
					<LogIn className="mr-2 size-4" />
					{t("auth.sso.signIn")}
				</Button>
				{children}
			</div>
		);
	}

	return (
		<div className="mb-4 space-y-2">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<div className="flex gap-2">
										<Input
											type="email"
											placeholder={t("auth.sso.placeholder")}
											className="flex-1"
											autoComplete="email"
											disabled={form.formState.isSubmitting}
											{...field}
										/>
										<Button
											type="submit"
											variant="outline"
											disabled={form.formState.isSubmitting}
										>
											{form.formState.isSubmitting ? (
												<Loader2 className="size-4 animate-spin" />
											) : (
												t("profile.2fa.continue")
											)}
										</Button>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<button
						type="button"
						onClick={() => setExpanded(false)}
						className="text-xs text-muted-foreground hover:underline"
					>
						{t("auth.sso.useEmailPassword")}
					</button>
				</form>
			</Form>
		</div>
	);
}
