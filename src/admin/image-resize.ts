/**
 * Client-side resize before upload (decision from the spec: resize/convert
 * on the client via <canvas> rather than paying for Cloudflare Images).
 * Falls back to JPEG if the browser can't encode WebP via canvas.
 */
const MAX_DIMENSION = 1600;
const QUALITY = 0.85;

function supportsWebpEncoding(): boolean {
	const canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

export async function resizeImageForUpload(file: File): Promise<{ blob: Blob; filename: string }> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Canvas 2D er ikke tilgjengelig i denne nettleseren.");
	}
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();

	const useWebp = supportsWebpEncoding();
	const mimeType = useWebp ? "image/webp" : "image/jpeg";
	const extension = useWebp ? "webp" : "jpg";

	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, QUALITY));
	if (!blob) {
		throw new Error("Kunne ikke behandle bildet.");
	}

	const baseName = file.name.replace(/\.[^.]+$/, "") || "bilde";
	return { blob, filename: `${baseName}.${extension}` };
}
