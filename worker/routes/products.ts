import { z } from "zod";
import { getActiveProductBySlug, listActiveProducts } from "../db/products";
import { errorJson, json } from "../lib/http";

const slugParamSchema = z
	.string()
	.min(1)
	.max(200)
	.regex(/^[a-z0-9-]+$/);

export async function handleListProducts(env: Env): Promise<Response> {
	const products = await listActiveProducts(env.DB);
	return json({ products });
}

export async function handleGetProduct(env: Env, rawSlug: string): Promise<Response> {
	const parsedSlug = slugParamSchema.safeParse(rawSlug);
	if (!parsedSlug.success) {
		return errorJson(400, "Invalid product slug");
	}

	const product = await getActiveProductBySlug(env.DB, parsedSlug.data);
	if (!product) {
		return errorJson(404, "Product not found");
	}

	return json({ product });
}
