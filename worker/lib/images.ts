/**
 * Maps an R2 object key to a servable URL. The `/images/:key` route itself
 * (proxying R2) lands in the images-pipeline stage; until then this only
 * affects seed/demo products, which have no key and fall back to the
 * placeholder.
 */
const PLACEHOLDER_IMAGE = "/placeholder-product.svg";

export function productImageUrl(r2Key: string | null): string {
	return r2Key ? `/images/${r2Key}` : PLACEHOLDER_IMAGE;
}
