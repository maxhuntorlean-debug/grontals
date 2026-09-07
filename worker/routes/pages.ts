import { getActiveProductBySlug, listActiveProducts } from "../db/products";
import { formatNok } from "../../shared/format";
import { buildOrganizationJsonLd, buildProductJsonLd } from "../lib/json-ld";
import { productImageUrl } from "../lib/images";
import { renderAdminShell } from "../templates/admin-shell";
import { renderHomeContent } from "../templates/home";
import { renderLayout, type LayoutOptions } from "../templates/layout";
import { LEGAL_PAGES } from "../templates/legal";
import { renderNotFoundContent } from "../templates/not-found";
import { renderProductContent } from "../templates/product";

function html(body: string, status = 200): Response {
	return new Response(body, { status, headers: { "content-type": "text/html; charset=UTF-8" } });
}

/** Fields every server-rendered page passes to the layout, straight from env. */
function baseLayoutFields(env: Env): Pick<LayoutOptions, "phone" | "siteUrl" | "ga4MeasurementId" | "gscVerificationMeta"> {
	return {
		phone: env.ORDER_PHONE_NUMBER,
		siteUrl: env.PUBLIC_SITE_URL,
		ga4MeasurementId: env.GA4_MEASUREMENT_ID || undefined,
		gscVerificationMeta: env.GSC_VERIFICATION_META || undefined,
	};
}

export function handleAdminPage(): Response {
	return html(renderAdminShell());
}

export async function handleHomePage(env: Env): Promise<Response> {
	const products = await listActiveProducts(env.DB);
	const content = renderHomeContent({ products, phone: env.ORDER_PHONE_NUMBER });
	return html(
		renderLayout({
			...baseLayoutFields(env),
			title: "GRØNTALS – Byggesett for store idéer",
			description: "Kompatible byggeklosser for barn og voksne. Bestill enkelt på telefon.",
			content,
			canonicalPath: "/",
			jsonLd: [buildOrganizationJsonLd(env.PUBLIC_SITE_URL, env.ORDER_PHONE_NUMBER)],
		}),
	);
}

export async function handleProductPage(env: Env, slug: string): Promise<Response> {
	const product = await getActiveProductBySlug(env.DB, slug);
	if (!product) {
		return handleNotFoundPage(env);
	}

	const title = product.seoTitle ?? `${product.name} – ${product.pieceCount ?? "?"} deler | GRØNTALS`;
	const description =
		product.seoDescription ??
		[product.name, product.pieceCount ? `${product.pieceCount} deler` : null, formatNok(product.price)]
			.filter(Boolean)
			.join(" · ");

	const mainImage = product.images[0]?.r2Key ?? product.mainImageKey;

	const content = renderProductContent({ product, phone: env.ORDER_PHONE_NUMBER });
	return html(
		renderLayout({
			...baseLayoutFields(env),
			title,
			description,
			content,
			canonicalPath: `/produkt/${product.slug}`,
			ogType: "product",
			ogImage: mainImage ? productImageUrl(mainImage) : undefined,
			jsonLd: [buildProductJsonLd(product, env.PUBLIC_SITE_URL)],
		}),
	);
}

export async function handleLegalPage(env: Env, slug: string): Promise<Response> {
	const page = LEGAL_PAGES[slug];
	if (!page) {
		return handleNotFoundPage(env);
	}

	return html(
		renderLayout({
			...baseLayoutFields(env),
			title: page.title,
			description: page.description,
			content: `<div class="container legal-page">${page.body(env.ORDER_PHONE_NUMBER)}</div>`,
			canonicalPath: `/${slug}`,
		}),
	);
}

export async function handleNotFoundPage(env: Env): Promise<Response> {
	return html(
		renderLayout({
			...baseLayoutFields(env),
			title: "Siden finnes ikke – GRØNTALS",
			description: "Siden du lette etter finnes ikke.",
			content: renderNotFoundContent(),
			canonicalPath: "/404",
		}),
		404,
	);
}
