import type { ProductDetail } from "../../shared/types";
import { absoluteUrl } from "./site-url";
import { productImageUrl } from "./images";

export function buildOrganizationJsonLd(siteUrl: string, phone: string): Record<string, unknown> {
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "OnlineStore",
				name: "GRØNTALS",
				url: absoluteUrl(siteUrl, "/"),
				telephone: phone,
			},
			{
				"@type": "WebSite",
				name: "GRØNTALS",
				url: absoluteUrl(siteUrl, "/"),
			},
		],
	};
}

export function buildProductJsonLd(product: ProductDetail, siteUrl: string): Record<string, unknown> {
	const productUrl = absoluteUrl(siteUrl, `/produkt/${product.slug}`);
	const images = product.images.length > 0 ? product.images.map((image) => absoluteUrl(siteUrl, productImageUrl(image.r2Key))) : [absoluteUrl(siteUrl, productImageUrl(product.mainImageKey))];

	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Product",
				name: product.name,
				description: product.shortDescription ?? product.description ?? undefined,
				sku: product.sku ?? undefined,
				image: images,
				...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
				offers: {
					"@type": "Offer",
					url: productUrl,
					price: String(product.price),
					priceCurrency: "NOK",
					availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
				},
			},
			{
				"@type": "BreadcrumbList",
				itemListElement: [
					{ "@type": "ListItem", position: 1, name: "Hjem", item: absoluteUrl(siteUrl, "/") },
					{ "@type": "ListItem", position: 2, name: product.name, item: productUrl },
				],
			},
		],
	};
}
