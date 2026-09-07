import { escapeHtml } from "../lib/html";
import { absoluteUrl } from "../lib/site-url";
import { CRITICAL_CSS } from "./styles";

export interface LayoutOptions {
	title: string;
	description: string;
	content: string;
	phone: string;
	siteUrl: string;
	/** Path used to build the canonical link and og:url, e.g. "/" or "/produkt/slug". */
	canonicalPath: string;
	/** Absolute or site-relative image URL for og:image / twitter:image. */
	ogImage?: string;
	ogType?: "website" | "product";
	/** JSON-LD object(s) rendered as <script type="application/ld+json"> tags. */
	jsonLd?: Record<string, unknown>[];
	/** GA4_MEASUREMENT_ID env var; gtag.js is only injected when this is non-empty. */
	ga4MeasurementId?: string;
	/** GSC_VERIFICATION_META env var (the content= value Google gives you for HTML-tag verification). */
	gscVerificationMeta?: string;
}

const NAV_LINKS = [
	{ href: "/#produkter", label: "Produkter" },
	{ href: "/#slik-bestiller-du", label: "Slik bestiller du" },
	{ href: "/kontakt", label: "Kontakt" },
];

const FOOTER_LINKS = [
	{ href: "/om-oss", label: "Om oss" },
	{ href: "/kontakt", label: "Kontakt" },
	{ href: "/personvern", label: "Personvern" },
	{ href: "/vilkar", label: "Vilkår" },
];

function renderJsonLdScript(data: Record<string, unknown>): string {
	// Prevent premature </script> termination if any field ever contains it.
	const json = JSON.stringify(data).replace(/</g, "\\u003c");
	return `<script type="application/ld+json">${json}</script>`;
}

function renderGa4Script(measurementId: string): string {
	const id = escapeHtml(measurementId);
	return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
	<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');</script>`;
}

export function renderLayout({
	title,
	description,
	content,
	phone,
	siteUrl,
	canonicalPath,
	ogImage,
	ogType = "website",
	jsonLd = [],
	ga4MeasurementId,
	gscVerificationMeta,
}: LayoutOptions): string {
	const canonicalUrl = absoluteUrl(siteUrl, canonicalPath);
	const absoluteOgImage = ogImage ? absoluteUrl(siteUrl, ogImage) : undefined;

	return `<!doctype html>
<html lang="nb">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${escapeHtml(title)}</title>
	<meta name="description" content="${escapeHtml(description)}">
	<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
	<meta property="og:site_name" content="GRØNTALS">
	<meta property="og:type" content="${escapeHtml(ogType)}">
	<meta property="og:title" content="${escapeHtml(title)}">
	<meta property="og:description" content="${escapeHtml(description)}">
	<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
	${absoluteOgImage ? `<meta property="og:image" content="${escapeHtml(absoluteOgImage)}">` : ""}
	<meta name="twitter:card" content="${absoluteOgImage ? "summary_large_image" : "summary"}">
	<meta name="twitter:title" content="${escapeHtml(title)}">
	<meta name="twitter:description" content="${escapeHtml(description)}">
	${absoluteOgImage ? `<meta name="twitter:image" content="${escapeHtml(absoluteOgImage)}">` : ""}
	${gscVerificationMeta ? `<meta name="google-site-verification" content="${escapeHtml(gscVerificationMeta)}">` : ""}
	<style>${CRITICAL_CSS}</style>
	${jsonLd.map(renderJsonLdScript).join("\n\t")}
	${ga4MeasurementId ? renderGa4Script(ga4MeasurementId) : ""}
</head>
<body>
	<a class="skip-link" href="#main-content">Hopp til innhold</a>
	<header class="site-header">
		<a class="site-header__logo" href="/">GRØNTALS</a>
		<nav class="site-nav" aria-label="Hovednavigasjon">
			${NAV_LINKS.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join("\n\t\t\t")}
			<a href="tel:${escapeHtml(phone.replace(/\s+/g, ""))}">${escapeHtml(phone)}</a>
		</nav>
	</header>
	<main id="main-content">
		${content}
	</main>
	<footer class="site-footer">
		<div class="container">
			<div>GRØNTALS &mdash; byggesett for store idéer.</div>
			<nav aria-label="Juridisk">
				${FOOTER_LINKS.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join("\n\t\t\t\t")}
			</nav>
		</div>
	</footer>
	<script type="module" src="/main.js"></script>
</body>
</html>`;
}
