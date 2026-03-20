import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import type { ReactNode } from "react";

export type NotificationEmailTemplateProps = {
	previewText: string;
	title: ReactNode;
	children: ReactNode;
	actionHref?: string;
	actionLabel?: string;
	actionHelperText?: string;
};

const LOGO_SRC =
	"https://raw.githubusercontent.com/Dokploy/dokploy/refs/heads/canary/apps/dokploy/logo.png";

export const NotificationEmailTemplate = ({
	previewText,
	title,
	children,
	actionHref,
	actionLabel = "View details",
	actionHelperText = "or copy and paste this URL into your browser:",
}: NotificationEmailTemplateProps) => {
	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind
				config={{
					theme: {
						extend: {
							colors: {
								brand: "#007291",
							},
						},
					},
				}}
			>
				<Body className="bg-white my-auto mx-auto font-sans px-2">
					<Container className="border border-solid border-[#eaeaea] rounded-lg my-[40px] mx-auto p-[20px] max-w-[465px]">
						<Section className="mt-[32px]">
							<Img
								src={LOGO_SRC}
								width="100"
								height="50"
								alt="Dokploy"
								className="my-0 mx-auto"
							/>
						</Section>
						<Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
							{title}
						</Heading>
						{children}
						{actionHref ? (
							<>
								<Section className="text-center mt-[32px] mb-[32px]">
									<Button
										href={actionHref}
										className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
									>
										{actionLabel}
									</Button>
								</Section>
								<Text className="text-black text-[14px] leading-[24px]">
									{actionHelperText}{" "}
									<Link
										href={actionHref}
										className="text-blue-600 no-underline"
									>
										{actionHref}
									</Link>
								</Text>
							</>
						) : null}
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};
