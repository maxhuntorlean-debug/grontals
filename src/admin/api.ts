import type { Product, ProductDetail, ProductImage } from "../../shared/types";

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
	}
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
	const response = await fetch(input, { ...init, credentials: "same-origin" });

	if (!response.ok) {
		let message = `Feil (${response.status})`;
		try {
			const body = (await response.json()) as { error?: string };
			if (typeof body.error === "string") message = body.error;
		} catch {
			// no JSON body; keep the generic message
		}
		throw new ApiError(response.status, message);
	}

	if (response.status === 204) {
		return undefined as T;
	}
	return response.json() as Promise<T>;
}

const jsonHeaders = { "content-type": "application/json" };

export function checkSession(): Promise<void> {
	return request("/api/admin/me");
}

export function login(username: string, password: string): Promise<void> {
	return request("/api/admin/login", {
		method: "POST",
		headers: jsonHeaders,
		body: JSON.stringify({ username, password }),
	});
}

export function logout(): Promise<void> {
	return request("/api/admin/logout", { method: "POST" });
}

export async function listProducts(): Promise<Product[]> {
	const data = await request<{ products: Product[] }>("/api/admin/products");
	return data.products;
}

export async function getProduct(id: number): Promise<ProductDetail> {
	const data = await request<{ product: ProductDetail }>(`/api/admin/products/${id}`);
	return data.product;
}

export interface ProductSpecInput {
	name: string;
	value: string;
	sortOrder: number;
}

export interface ProductInput {
	name: string;
	slug?: string;
	sku?: string | null;
	price: number;
	oldPrice?: number | null;
	shortDescription?: string | null;
	description?: string | null;
	brand?: string | null;
	manufacturer?: string | null;
	pieceCount?: number | null;
	age?: string | null;
	modelSize?: string | null;
	material?: string | null;
	inStock: boolean;
	isActive: boolean;
	sortOrder: number;
	seoTitle?: string | null;
	seoDescription?: string | null;
	specs?: ProductSpecInput[];
}

export async function createProduct(input: ProductInput): Promise<ProductDetail> {
	const data = await request<{ product: ProductDetail }>("/api/admin/products", {
		method: "POST",
		headers: jsonHeaders,
		body: JSON.stringify(input),
	});
	return data.product;
}

export async function updateProduct(id: number, input: Partial<ProductInput>): Promise<ProductDetail> {
	const data = await request<{ product: ProductDetail }>(`/api/admin/products/${id}`, {
		method: "PUT",
		headers: jsonHeaders,
		body: JSON.stringify(input),
	});
	return data.product;
}

export async function deleteProduct(id: number): Promise<void> {
	await request(`/api/admin/products/${id}`, { method: "DELETE" });
}

export async function uploadImage(productId: number, file: Blob, filename: string, altText: string): Promise<ProductImage> {
	const formData = new FormData();
	formData.set("file", file, filename);
	if (altText) formData.set("altText", altText);

	const data = await request<{ image: ProductImage }>(`/api/admin/products/${productId}/images`, {
		method: "POST",
		body: formData,
	});
	return data.image;
}

export async function deleteImage(id: number): Promise<void> {
	await request(`/api/admin/images/${id}`, { method: "DELETE" });
}

export async function updateImage(id: number, updates: { altText?: string | null; sortOrder?: number }): Promise<ProductImage> {
	const data = await request<{ image: ProductImage }>(`/api/admin/images/${id}`, {
		method: "PUT",
		headers: jsonHeaders,
		body: JSON.stringify(updates),
	});
	return data.image;
}
