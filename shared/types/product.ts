/** Domain types shared between the Worker (API/SSR) and the frontend. */

export interface Product {
	id: number;
	name: string;
	slug: string;
	sku: string | null;
	/** Whole NOK kroner, no øre (e.g. 1499 -> "1 499 kr"). */
	price: number;
	oldPrice: number | null;
	shortDescription: string | null;
	description: string | null;
	brand: string | null;
	manufacturer: string | null;
	pieceCount: number | null;
	age: string | null;
	modelSize: string | null;
	material: string | null;
	mainImageKey: string | null;
	inStock: boolean;
	isActive: boolean;
	sortOrder: number;
	seoTitle: string | null;
	seoDescription: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ProductImage {
	id: number;
	productId: number;
	r2Key: string;
	altText: string | null;
	sortOrder: number;
	createdAt: string;
}

export interface ProductSpec {
	id: number;
	productId: number;
	name: string;
	value: string;
	sortOrder: number;
}

/** Product with its images and specs, as returned by the public API. */
export interface ProductDetail extends Product {
	images: ProductImage[];
	specs: ProductSpec[];
}

/** Trimmed shape used for catalog/listing cards. */
export type ProductSummary = Pick<
	Product,
	| "id"
	| "name"
	| "slug"
	| "price"
	| "oldPrice"
	| "pieceCount"
	| "age"
	| "inStock"
	| "mainImageKey"
>;
