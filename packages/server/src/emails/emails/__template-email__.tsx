import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Link,
	Section,
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

const LOGO_SRC = "https://cognitoaigo.com/images/logo.png";

export const NotificationEmailTemplate = ({
	previewText,
	title,
	children,
	actionHref,
	actionLabel = "查看详情",
	actionHelperText = "或将以下链接复制到浏览器中打开：",
}: NotificationEmailTemplateProps) => {
	return (
		<Html>
			<Head />
			<Body
				style={{
					backgroundColor: "#ffffff",
					margin: "0 auto",
					padding: "0",
					fontFamily:
						'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Noto Sans", sans-serif',
				}}
			>
				<div
					style={{
						display: "none",
						fontSize: "1px",
						lineHeight: "1px",
						maxHeight: "0",
						maxWidth: "0",
						opacity: 0,
						overflow: "hidden",
					}}
				>
					{previewText.slice(0, 40)}
				</div>
				<Container
					style={{
						border: "1px solid #eaeaea",
						borderRadius: "8px",
						margin: "40px auto",
						padding: "20px",
						maxWidth: "600px",
						width: "100%",
					}}
				>
					<Section style={{ marginTop: "32px", textAlign: "center" }}>
						<Img
							src={LOGO_SRC}
							width="480"
							height="60"
							alt="Dokploy"
							style={{ margin: "0 auto" }}
						/>
					</Section>
					<Heading
						style={{
							color: "#000000",
							fontSize: "24px",
							fontWeight: 400,
							textAlign: "center",
							padding: "0",
							margin: "30px 0",
						}}
					>
						{title}
					</Heading>
					{children}
					{actionHref ? (
						<>
							<Section
								style={{
									textAlign: "center",
									marginTop: "32px",
									marginBottom: "32px",
								}}
							>
								<Button
									href={actionHref}
									style={{
										backgroundColor: "#000000",
										borderRadius: "6px",
										color: "#ffffff",
										fontSize: "12px",
										fontWeight: 600,
										textDecoration: "none",
										textAlign: "center",
										padding: "12px 20px",
									}}
								>
									{actionLabel}
								</Button>
							</Section>
							<Text
								style={{
									color: "#000000",
									fontSize: "14px",
									lineHeight: "24px",
								}}
							>
								{actionHelperText}{" "}
								<Link
									href={actionHref}
									style={{ color: "#2563eb", textDecoration: "none" }}
								>
									{actionHref}
								</Link>
							</Text>
						</>
					) : null}
				</Container>
			</Body>
		</Html>
	);
};
