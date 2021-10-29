import Head from "next/head";

export interface SEOProps {
	title?: string;
	description?: string;
	keywords?: string[];
}

const SEO: React.FC<SEOProps> = ({ title, description, keywords }) => (
	<Head>
		<title>Apollo{title && ` | ${title}`}</title>
		<meta name="description" content={description} />
		<meta name="keywords" content={keywords?.join(", ")} />

		<meta property="og:type" content="website" />
		<meta property="og:title" content={title} />
		<meta property="og:description" content={description} />
		<meta property="og:site_name" content="" />

		<meta name="twitter:card" content="summary" />
		<meta name="twitter:title" content={title} />
		<meta name="twitter:description" content={description} />
		<meta name="twitter:site_name" content="" />
		<meta name="twitter:creator" content="" />
	</Head>
);

SEO.defaultProps = {
	title: "Untitled Page",
	description: "Apollo is an AI-enhanced Discord moderation assistant with a powerful online dashboard. Syke we haven't got shit yet lmao",
	keywords: [
		"discord",
		"discord-bot",
		"dashboard",
		"apollo",
		"moderator",
		"moderation",
		"bot",
		"server",
		"guild"
	]
}

export default SEO;
