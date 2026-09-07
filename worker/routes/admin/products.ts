import {
	createProduct,
	deleteProductAndGetImageKeys,
	getProductByIdForAdmin,
	listAllProductsForAdmin,
	updateProduct,
} from "../../db/admin-products";
import { errorJson, json } from "../../lib/http";
import { productCreateSchema, productUpdateSchema } from "../../schemas/product";

function parseProductId(raw: string): number | null {
	const id = Number(raw);
	return Number.isInteger(id) && id > 0 ? id : null;
}

export async function handleAdminListProducts(env: Env): Promise<Response> {
	const products = await listAllProductsForAdmin(env.DB);
	return json({ products });
}

export async function handleAdminGetProduct(env: Env, rawId: string): Promise<Response> {
	const id = parseProductId(rawId);
	if (id === null) {
		return errorJson(400, "Invalid product id");
	}

	const product = await getProductByIdForAdmin(env.DB, id);
	if (!product) {
		return errorJson(404, "Product not found");
	}
	return json({ product });
}

export async function handleAdminCreateProduct(request: Request, env: Env): Promise<Response> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return errorJson(400, "Invalid request body");
	}

	const parsed = productCreateSchema.safeParse(body);
	if (!parsed.success) {
		return errorJson(400, "Invalid product data");
	}

	const product = await createProduct(env.DB, parsed.data);
	return json({ product }, { status: 201 });
}

export async function handleAdminUpdateProduct(request: Request, env: Env, rawId: string): Promise<Response> {
	const id = parseProductId(rawId);
	if (id === null) {
		return errorJson(400, "Invalid product id");
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return errorJson(400, "Invalid request body");
	}

	const parsed = productUpdateSchema.safeParse(body);
	if (!parsed.success) {
		return errorJson(400, "Invalid product data");
	}

	const product = await updateProduct(env.DB, id, parsed.data);
	if (!product) {
		return errorJson(404, "Product not found");
	}
	return json({ product });
}

export async function handleAdminDeleteProduct(env: Env, rawId: string): Promise<Response> {
	const id = parseProductId(rawId);
	if (id === null) {
		return errorJson(400, "Invalid product id");
	}

	const imageKeys = await deleteProductAndGetImageKeys(env.DB, id);
	if (imageKeys === null) {
		return errorJson(404, "Product not found");
	}
	if (imageKeys.length > 0) {
		await env.PRODUCT_IMAGES.delete(imageKeys);
	}

	return json({ ok: true });
}
