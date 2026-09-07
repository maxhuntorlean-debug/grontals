import type { Product, ProductImage, ProductSpec, ProductSummary } from "../../shared/types";

/** Raw D1 row shapes (snake_case, matches migrations/0001_init.sql). */
export interface ProductRow {
	id: number;
	name: string;
	slug: string;
	sku: string | null;
	price: number;
	old_price: number | null;
	short_description: string | null;
	description: string | null;
	brand: string | null;
	manufacturer: string | null;
	piece_count: number | null;
	age: string | null;
	model_size: string | null;
	material: string | null;
	main_image_key: string | null;
	in_stock: number;
	is_active: number;
	sort_order: number;
	seo_title: string | null;
	seo_description: string | null;
	created_at: string;
	updated_at: string;
}

export type ProductSummaryRow = Pick<
	ProductRow,
	"id" | "name" | "slug" | "price" | "old_price" | "piece_count" | "age" | "in_stock" | "main_image_key"
>;

export interface ProductImageRow {
	id: number;
	product_id: number;
	r2_key: string;
	alt_text: string | null;
	sort_order: number;
	created_at: string;
}

export interface ProductSpecRow {
	id: number;
	product_id: number;
	name: string;
	value: string;
	sort_order: number;
}

export function mapProductSummary(row: ProductSummaryRow): ProductSummary {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		price: row.price,
		oldPrice: row.old_price,
		pieceCount: row.piece_count,
		age: row.age,
		inStock: row.in_stock === 1,
		mainImageKey: row.main_image_key,
	};
}

export function mapProduct(row: ProductRow): Product {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		sku: row.sku,
		price: row.price,
		oldPrice: row.old_price,
		shortDescription: row.short_description,
		description: row.description,
		brand: row.brand,
		manufacturer: row.manufacturer,
		pieceCount: row.piece_count,
		age: row.age,
		modelSize: row.model_size,
		material: row.material,
		mainImageKey: row.main_image_key,
		inStock: row.in_stock === 1,
		isActive: row.is_active === 1,
		sortOrder: row.sort_order,
		seoTitle: row.seo_title,
		seoDescription: row.seo_description,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export function mapImage(row: ProductImageRow): ProductImage {
	return {
		id: row.id,
		productId: row.product_id,
		r2Key: row.r2_key,
		altText: row.alt_text,
		sortOrder: row.sort_order,
		createdAt: row.created_at,
	};
}

export function mapSpec(row: ProductSpecRow): ProductSpec {
	return {
		id: row.id,
		productId: row.product_id,
		name: row.name,
		value: row.value,
		sortOrder: row.sort_order,
	};
}
