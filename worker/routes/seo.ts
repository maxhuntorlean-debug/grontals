import { listActiveProductsForSitemap } from "../db/products";
import { escapeHtml } from "../lib/html";
import { absoluteUrl } from "../lib/site-url";
import { LEGAL_PAGES } from "../templates/legal";

function toSitemapDate(sqliteTimestamp: string): string {
	// "2026-09-07 06:22:39" (SQLite CURRENT_TIMESTAMP) -> "2026-09-07"
	return sqliteTimestamp.slice(0, 10);
}

export async function handleSitemapXml(env: Env): Promise<Response> {
	const products = await listActiveProductsForSitemap(env.DB);

	const staticPaths = ["/", ...Object.keys(LEGAL_PAGES).map((slug) => `/${slug}`)];
	const staticEntries = staticPaths.map((path) => `\t<url>\n\t\t<loc>${escapeHtml(absoluteUrl(env.PUBLIC_SITE_URL, path))}</loc>\n\t</url>`);

	const productEntries = products.map(
		(product) =>
			`\t<url>\n\t\t<loc>${escapeHtml(absoluteUrl(env.PUBLIC_SITE_URL, `/produkt/${product.slug}`))}</loc>\n\t\t<lastmod>${toSitemapDate(product.updatedAt)}</lastmod>\n\t</url>`,
	);

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticEntries, ...productEntries].join("\n")}\n</urlset>\n`;

	return new Response(body, { headers: { "content-type": "application/xml; charset=UTF-8" } });
}

export function handleRobotsTxt(env: Env): Response {
	const body =
		env.DISALLOW_INDEXING === "true"
			? "User-agent: *\nDisallow: /\n"
			: `User-agent: *\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${absoluteUrl(env.PUBLIC_SITE_URL, "/sitemap.xml")}\n`;

	return new Response(body, { headers: { "content-type": "text/plain; charset=UTF-8" } });
}
