import NextDocument, {
	type DocumentContext,
	type DocumentInitialProps,
	Head,
	Html,
	Main,
	NextScript,
} from "next/document";

type DokployDocumentProps = DocumentInitialProps & {
	locale?: string;
};

export default function Document({ locale }: DokployDocumentProps) {
	return (
		<Html lang={locale ?? "zh-Hans"} className="font-sans">
			<Head>
				<link rel="icon" href="/icon.svg" />
			</Head>
			<body className="flex h-full w-full flex-col font-sans">
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}

Document.getInitialProps = async (
	ctx: DocumentContext,
): Promise<DokployDocumentProps> => {
	const initialProps = await NextDocument.getInitialProps(ctx);

	return {
		...initialProps,
		locale: ctx.locale,
	};
};
