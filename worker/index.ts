/**
 * Cloudflare Worker entry point: API routes + server-rendered pages.
 * Static files under /public (main.js, placeholder-product.svg, ...) are
 * served directly by the Workers Assets binding and never reach this
 * fetch handler (see public/_headers for their security headers).
 */

import { handleGetProduct, handleListProducts } from "./routes/products";
import { handleAdminPage, handleHomePage, handleLegalPage, handleNotFoundPage, handleProductPage } from "./routes/pages";
import { handleGetImage } from "./routes/images";
import { routeAdminApi } from "./routes/admin/router";
import { handleRobotsTxt, handleSitemapXml } from "./routes/seo";
import { errorJson } from "./lib/http";
import { withSecurityHeaders } from "./lib/security-headers";
import { LEGAL_PAGES } from "./templates/legal";

const PRODUCT_API_SLUG_ROUTE = /^\/api\/products\/([^/]+)$/;
const PRODUCT_PAGE_ROUTE = /^\/produkt\/([^/]+)$/;
const IMAGE_ROUTE = /^\/images\/(.+)$/;

async function route(request: Request, env: Env, url: URL): Promise<Response> {
	if (url.pathname.startsWith("/api/admin/")) {
		return routeAdminApi(request, env, url);
	}

	if (request.method !== "GET") {
		return errorJson(404, "Not found");
	}

	if (url.pathname === "/api/products") {
		return handleListProducts(env);
	}

	const productApiMatch = url.pathname.match(PRODUCT_API_SLUG_ROUTE);
	if (productApiMatch) {
		return handleGetProduct(env, productApiMatch[1]);
	}

	const imageMatch = url.pathname.match(IMAGE_ROUTE);
	if (imageMatch) {
		return handleGetImage(env, request, imageMatch[1]);
	}

	if (url.pathname === "/") {
		return handleHomePage(env);
	}

	if (url.pathname === "/sitemap.xml") {
		return handleSitemapXml(env);
	}

	if (url.pathname === "/robots.txt") {
		return handleRobotsTxt(env);
	}

	if (url.pathname === "/admin") {
		return handleAdminPage();
	}

	const productPageMatch = url.pathname.match(PRODUCT_PAGE_ROUTE);
	if (productPageMatch) {
		return handleProductPage(env, productPageMatch[1]);
	}

	const legalSlug = url.pathname.replace(/^\//, "");
	if (legalSlug in LEGAL_PAGES) {
		return handleLegalPage(env, legalSlug);
	}

	return handleNotFoundPage(env);
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		try {
			return withSecurityHeaders(await route(request, env, url), env);
		} catch (err) {
			console.error(err);
			return withSecurityHeaders(errorJson(500, "Internal server error"), env);
		}
	},
} satisfies ExportedHandler<Env>;
