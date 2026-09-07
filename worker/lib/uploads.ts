/** MIME types accepted for product photos, mapped to their R2 key extension. */
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export type ImageValidationResult = { ok: true; extension: string } | { ok: false; error: string };

export function validateImageUpload(file: { type: string; size: number }): ImageValidationResult {
	const extension = ALLOWED_IMAGE_TYPES[file.type];
	if (!extension) {
		return { ok: false, error: "Ugyldig filtype. Tillatt: JPEG, PNG, WebP." };
	}
	if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
		return { ok: false, error: `Filen er for stor. Maks ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.` };
	}
	return { ok: true, extension };
}

/** Unique R2 key; never derived from the client-supplied filename (avoids path traversal / collisions). */
export function buildImageKey(productId: number, extension: string): string {
	return `products/${productId}/${crypto.randomUUID()}.${extension}`;
}
