import type { ProductDetail, ProductSummary } from "../../shared/types";
import type { ProductImageRow, ProductRow, ProductSpecRow, ProductSummaryRow } from "./mappers";
import { mapImage, mapProduct, mapProductSummary, mapSpec } from "./mappers";

export async function listActiveProducts(db: D1Database): Promise<ProductSummary[]> {
	const { results } = await db
		.prepare(
			`SELECT id, name, slug, price, old_price, piece_count, age, in_stock, main_image_key
			 FROM products
			 WHERE is_active = 1
			 ORDER BY sort_order ASC, id ASC`,
		)
		.all<ProductSummaryRow>();

	return results.map(mapProductSummary);
}

export interface SitemapProductEntry {
	slug: string;
	updatedAt: string;
}

export async function listActiveProductsForSitemap(db: D1Database): Promise<SitemapProductEntry[]> {
	const { results } = await db
		.prepare(`SELECT slug, updated_at FROM products WHERE is_active = 1 ORDER BY sort_order ASC, id ASC`)
		.all<{ slug: string; updated_at: string }>();

	return results.map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
}

export async function getActiveProductBySlug(db: D1Database, slug: string): Promise<ProductDetail | null> {
	const productRow = await db
		.prepare(`SELECT * FROM products WHERE slug = ?1 AND is_active = 1 LIMIT 1`)
		.bind(slug)
		.first<ProductRow>();

	if (!productRow) {
		return null;
	}

	const [imagesResult, specsResult] = await Promise.all([
		db
			.prepare(`SELECT * FROM product_images WHERE product_id = ?1 ORDER BY sort_order ASC, id ASC`)
			.bind(productRow.id)
			.all<ProductImageRow>(),
		db
			.prepare(`SELECT * FROM product_specs WHERE product_id = ?1 ORDER BY sort_order ASC, id ASC`)
			.bind(productRow.id)
			.all<ProductSpecRow>(),
	]);

	return {
		...mapProduct(productRow),
		images: imagesResult.results.map(mapImage),
		specs: specsResult.results.map(mapSpec),
	};
}
