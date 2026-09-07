import type { Product, ProductDetail } from "../../shared/types";
import { slugify } from "../../shared/slug";
import type { ProductCreateInput, ProductUpdateInput } from "../schemas/product";
import type { ProductImageRow, ProductRow, ProductSpecRow } from "./mappers";
import { mapImage, mapProduct, mapSpec } from "./mappers";

async function slugTakenByOtherProduct(db: D1Database, slug: string, excludeId: number | null): Promise<boolean> {
	const row =
		excludeId === null
			? await db.prepare(`SELECT id FROM products WHERE slug = ?1 LIMIT 1`).bind(slug).first<{ id: number }>()
			: await db
					.prepare(`SELECT id FROM products WHERE slug = ?1 AND id != ?2 LIMIT 1`)
					.bind(slug, excludeId)
					.first<{ id: number }>();
	return row !== null;
}

async function resolveUniqueSlug(db: D1Database, desiredSlug: string, excludeId: number | null): Promise<string> {
	let candidate = desiredSlug;
	let suffix = 2;
	while (await slugTakenByOtherProduct(db, candidate, excludeId)) {
		candidate = `${desiredSlug}-${suffix}`;
		suffix += 1;
	}
	return candidate;
}

async function replaceProductSpecs(
	db: D1Database,
	productId: number,
	specs: NonNullable<ProductCreateInput["specs"]>,
): Promise<void> {
	const statements = [db.prepare(`DELETE FROM product_specs WHERE product_id = ?1`).bind(productId)];
	specs.forEach((spec, index) => {
		statements.push(
			db
				.prepare(`INSERT INTO product_specs (product_id, name, value, sort_order) VALUES (?1, ?2, ?3, ?4)`)
				.bind(productId, spec.name, spec.value, spec.sortOrder ?? index),
		);
	});
	await db.batch(statements);
}

export async function listAllProductsForAdmin(db: D1Database): Promise<Product[]> {
	const { results } = await db.prepare(`SELECT * FROM products ORDER BY sort_order ASC, id ASC`).all<ProductRow>();
	return results.map(mapProduct);
}

export async function getProductByIdForAdmin(db: D1Database, id: number): Promise<ProductDetail | null> {
	const productRow = await db.prepare(`SELECT * FROM products WHERE id = ?1`).bind(id).first<ProductRow>();
	if (!productRow) {
		return null;
	}

	const [imagesResult, specsResult] = await Promise.all([
		db
			.prepare(`SELECT * FROM product_images WHERE product_id = ?1 ORDER BY sort_order ASC, id ASC`)
			.bind(id)
			.all<ProductImageRow>(),
		db
			.prepare(`SELECT * FROM product_specs WHERE product_id = ?1 ORDER BY sort_order ASC, id ASC`)
			.bind(id)
			.all<ProductSpecRow>(),
	]);

	return {
		...mapProduct(productRow),
		images: imagesResult.results.map(mapImage),
		specs: specsResult.results.map(mapSpec),
	};
}

export async function createProduct(db: D1Database, input: ProductCreateInput): Promise<ProductDetail> {
	const desiredSlug = slugify(input.slug ?? input.name);
	const slug = await resolveUniqueSlug(db, desiredSlug, null);

	const result = await db
		.prepare(
			`INSERT INTO products (
				name, slug, sku, price, old_price, short_description, description,
				brand, manufacturer, piece_count, age, model_size, material,
				in_stock, is_active, sort_order, seo_title, seo_description
			) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)`,
		)
		.bind(
			input.name,
			slug,
			input.sku ?? null,
			input.price,
			input.oldPrice ?? null,
			input.shortDescription ?? null,
			input.description ?? null,
			input.brand ?? null,
			input.manufacturer ?? null,
			input.pieceCount ?? null,
			input.age ?? null,
			input.modelSize ?? null,
			input.material ?? null,
			input.inStock ? 1 : 0,
			input.isActive ? 1 : 0,
			input.sortOrder ?? 0,
			input.seoTitle ?? null,
			input.seoDescription ?? null,
		)
		.run();

	const productId = result.meta.last_row_id as number;

	if (input.specs && input.specs.length > 0) {
		await replaceProductSpecs(db, productId, input.specs);
	}

	const created = await getProductByIdForAdmin(db, productId);
	if (!created) {
		throw new Error("Product not found immediately after insert");
	}
	return created;
}

export async function updateProduct(db: D1Database, id: number, input: ProductUpdateInput): Promise<ProductDetail | null> {
	const existing = await db.prepare(`SELECT id FROM products WHERE id = ?1`).bind(id).first<{ id: number }>();
	if (!existing) {
		return null;
	}

	const fields: [string, unknown][] = [];
	if (input.name !== undefined) fields.push(["name", input.name]);
	if (input.slug !== undefined) {
		const resolvedSlug = await resolveUniqueSlug(db, slugify(input.slug), id);
		fields.push(["slug", resolvedSlug]);
	}
	if (input.sku !== undefined) fields.push(["sku", input.sku]);
	if (input.price !== undefined) fields.push(["price", input.price]);
	if (input.oldPrice !== undefined) fields.push(["old_price", input.oldPrice]);
	if (input.shortDescription !== undefined) fields.push(["short_description", input.shortDescription]);
	if (input.description !== undefined) fields.push(["description", input.description]);
	if (input.brand !== undefined) fields.push(["brand", input.brand]);
	if (input.manufacturer !== undefined) fields.push(["manufacturer", input.manufacturer]);
	if (input.pieceCount !== undefined) fields.push(["piece_count", input.pieceCount]);
	if (input.age !== undefined) fields.push(["age", input.age]);
	if (input.modelSize !== undefined) fields.push(["model_size", input.modelSize]);
	if (input.material !== undefined) fields.push(["material", input.material]);
	if (input.inStock !== undefined) fields.push(["in_stock", input.inStock ? 1 : 0]);
	if (input.isActive !== undefined) fields.push(["is_active", input.isActive ? 1 : 0]);
	if (input.sortOrder !== undefined) fields.push(["sort_order", input.sortOrder]);
	if (input.seoTitle !== undefined) fields.push(["seo_title", input.seoTitle]);
	if (input.seoDescription !== undefined) fields.push(["seo_description", input.seoDescription]);

	if (fields.length > 0) {
		const setClause = fields.map(([column], index) => `${column} = ?${index + 1}`).join(", ");
		await db
			.prepare(`UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?${fields.length + 1}`)
			.bind(
				...fields.map(([, value]) => value),
				id,
			)
			.run();
	}

	if (input.specs !== undefined) {
		await replaceProductSpecs(db, id, input.specs);
	}

	return getProductByIdForAdmin(db, id);
}

/** Deletes the product and returns the R2 keys of its images (caller must delete them from R2). */
export async function deleteProductAndGetImageKeys(db: D1Database, id: number): Promise<string[] | null> {
	const existing = await db.prepare(`SELECT id FROM products WHERE id = ?1`).bind(id).first<{ id: number }>();
	if (!existing) {
		return null;
	}

	const { results } = await db
		.prepare(`SELECT r2_key FROM product_images WHERE product_id = ?1`)
		.bind(id)
		.all<{ r2_key: string }>();

	await db.prepare(`DELETE FROM products WHERE id = ?1`).bind(id).run();

	return results.map((row) => row.r2_key);
}
