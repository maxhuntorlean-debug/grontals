import type { ProductImage } from "../../shared/types";
import type { ProductImageRow } from "./mappers";
import { mapImage } from "./mappers";

/** The main image is always whichever image currently has the lowest sort_order (or none). */
async function syncMainImage(db: D1Database, productId: number): Promise<void> {
	const first = await db
		.prepare(`SELECT r2_key FROM product_images WHERE product_id = ?1 ORDER BY sort_order ASC, id ASC LIMIT 1`)
		.bind(productId)
		.first<{ r2_key: string }>();

	await db
		.prepare(`UPDATE products SET main_image_key = ?1 WHERE id = ?2`)
		.bind(first?.r2_key ?? null, productId)
		.run();
}

export async function insertProductImage(
	db: D1Database,
	productId: number,
	r2Key: string,
	altText: string | null,
): Promise<ProductImage> {
	const maxSortRow = await db
		.prepare(`SELECT COALESCE(MAX(sort_order), 0) AS maxSort FROM product_images WHERE product_id = ?1`)
		.bind(productId)
		.first<{ maxSort: number }>();
	const sortOrder = (maxSortRow?.maxSort ?? 0) + 1;

	const result = await db
		.prepare(`INSERT INTO product_images (product_id, r2_key, alt_text, sort_order) VALUES (?1, ?2, ?3, ?4)`)
		.bind(productId, r2Key, altText, sortOrder)
		.run();

	const row = await db
		.prepare(`SELECT * FROM product_images WHERE id = ?1`)
		.bind(result.meta.last_row_id)
		.first<ProductImageRow>();
	if (!row) {
		throw new Error("Image not found immediately after insert");
	}

	await syncMainImage(db, productId);
	return mapImage(row);
}

export async function getProductImageById(db: D1Database, id: number): Promise<ProductImage | null> {
	const row = await db.prepare(`SELECT * FROM product_images WHERE id = ?1`).bind(id).first<ProductImageRow>();
	return row ? mapImage(row) : null;
}

/** Deletes the DB row and returns its R2 key (caller must delete the object from R2). */
export async function deleteProductImageAndGetKey(db: D1Database, id: number): Promise<string | null> {
	const row = await db
		.prepare(`SELECT product_id, r2_key FROM product_images WHERE id = ?1`)
		.bind(id)
		.first<{ product_id: number; r2_key: string }>();
	if (!row) {
		return null;
	}

	await db.prepare(`DELETE FROM product_images WHERE id = ?1`).bind(id).run();
	await syncMainImage(db, row.product_id);
	return row.r2_key;
}

export async function updateProductImage(
	db: D1Database,
	id: number,
	updates: { altText?: string | null; sortOrder?: number },
): Promise<ProductImage | null> {
	const existing = await db
		.prepare(`SELECT product_id FROM product_images WHERE id = ?1`)
		.bind(id)
		.first<{ product_id: number }>();
	if (!existing) {
		return null;
	}

	const fields: [string, unknown][] = [];
	if (updates.altText !== undefined) fields.push(["alt_text", updates.altText]);
	if (updates.sortOrder !== undefined) fields.push(["sort_order", updates.sortOrder]);

	if (fields.length > 0) {
		const setClause = fields.map(([column], index) => `${column} = ?${index + 1}`).join(", ");
		await db
			.prepare(`UPDATE product_images SET ${setClause} WHERE id = ?${fields.length + 1}`)
			.bind(...fields.map(([, value]) => value), id)
			.run();
	}

	if (updates.sortOrder !== undefined) {
		await syncMainImage(db, existing.product_id);
	}

	return getProductImageById(db, id);
}
