import { deleteProductImageAndGetKey, insertProductImage, updateProductImage } from "../../db/admin-images";
import { errorJson, json } from "../../lib/http";
import { buildImageKey, validateImageUpload } from "../../lib/uploads";
import { imageUpdateSchema } from "../../schemas/product";

function parseId(raw: string): number | null {
	const id = Number(raw);
	return Number.isInteger(id) && id > 0 ? id : null;
}

export async function handleAdminUploadImage(request: Request, env: Env, rawProductId: string): Promise<Response> {
	const productId = parseId(rawProductId);
	if (productId === null) {
		return errorJson(400, "Invalid product id");
	}

	const existing = await env.DB.prepare(`SELECT id FROM products WHERE id = ?1`).bind(productId).first<{ id: number }>();
	if (!existing) {
		return errorJson(404, "Product not found");
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return errorJson(400, "Expected multipart/form-data");
	}

	const file = formData.get("file");
	if (!(file instanceof File)) {
		return errorJson(400, "Missing file field");
	}

	const validation = validateImageUpload({ type: file.type, size: file.size });
	if (!validation.ok) {
		return errorJson(400, validation.error);
	}

	const altTextRaw = formData.get("altText");
	const altText = typeof altTextRaw === "string" && altTextRaw.trim() ? altTextRaw.trim().slice(0, 300) : null;

	const key = buildImageKey(productId, validation.extension);
	await env.PRODUCT_IMAGES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

	const image = await insertProductImage(env.DB, productId, key, altText);

	return json({ image }, { status: 201 });
}

export async function handleAdminDeleteImage(env: Env, rawId: string): Promise<Response> {
	const id = parseId(rawId);
	if (id === null) {
		return errorJson(400, "Invalid image id");
	}

	const r2Key = await deleteProductImageAndGetKey(env.DB, id);
	if (r2Key === null) {
		return errorJson(404, "Image not found");
	}

	await env.PRODUCT_IMAGES.delete(r2Key);
	return json({ ok: true });
}

export async function handleAdminUpdateImage(request: Request, env: Env, rawId: string): Promise<Response> {
	const id = parseId(rawId);
	if (id === null) {
		return errorJson(400, "Invalid image id");
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return errorJson(400, "Invalid request body");
	}

	const parsed = imageUpdateSchema.safeParse(body);
	if (!parsed.success) {
		return errorJson(400, "Invalid image data");
	}

	const image = await updateProductImage(env.DB, id, parsed.data);
	if (!image) {
		return errorJson(404, "Image not found");
	}
	return json({ image });
}
