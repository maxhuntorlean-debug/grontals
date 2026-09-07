import type { ProductDetail } from "../../shared/types";
import { formatNok } from "../../shared/format";
import { escapeHtml } from "../lib/html";
import { productImageUrl } from "../lib/images";

export interface ProductPageData {
	product: ProductDetail;
	phone: string;
}

export function renderProductContent({ product, phone }: ProductPageData): string {
	const gallery = product.images.length > 0 ? product.images : null;
	const mainImageSrc = gallery ? productImageUrl(gallery[0].r2Key) : productImageUrl(product.mainImageKey);

	const metaRows: [string, string][] = [
		product.sku ? ["Artikkelnummer", product.sku] : null,
		product.brand ? ["Merke", product.brand] : null,
		product.manufacturer ? ["Produsent", product.manufacturer] : null,
		product.pieceCount ? ["Antall deler", String(product.pieceCount)] : null,
		product.age ? ["Anbefalt alder", product.age] : null,
		product.modelSize ? ["Mål", product.modelSize] : null,
		product.material ? ["Materiale", product.material] : null,
	].filter((row): row is [string, string] => row !== null);

	const specRows: [string, string][] = product.specs.map((spec) => [spec.name, spec.value]);

	return `
	<nav class="breadcrumbs container" aria-label="Brødsmulesti">
		<a href="/">Hjem</a> / <span aria-current="page">${escapeHtml(product.name)}</span>
	</nav>

	<div class="container product-page" id="product-main">
		<div class="product-gallery">
			<div class="product-gallery__main">
				<img id="main-product-image" src="${escapeHtml(mainImageSrc)}" alt="${escapeHtml(product.name)}" width="700" height="700">
			</div>
			${
				gallery && gallery.length > 1
					? `<div class="product-gallery__thumbs">
				${gallery
					.map(
						(img, index) =>
							`<button type="button" class="product-gallery__thumb${index === 0 ? " is-active" : ""}" data-full-src="${escapeHtml(productImageUrl(img.r2Key))}" aria-label="Vis bilde ${index + 1} av ${gallery.length}">
					<img src="${escapeHtml(productImageUrl(img.r2Key))}" alt="" loading="lazy" width="72" height="72">
				</button>`,
					)
					.join("\n\t\t\t\t")}
			</div>`
					: ""
			}
		</div>

		<div class="product-info">
			${!product.inStock ? '<span class="badge">Utsolgt</span>' : ""}
			<h1>${escapeHtml(product.name)}</h1>
			${product.shortDescription ? `<p>${escapeHtml(product.shortDescription)}</p>` : ""}

			<div class="product-info__price">
				${formatNok(product.price)}
				${product.oldPrice ? `<s>${formatNok(product.oldPrice)}</s>` : ""}
			</div>

			<div class="product-info__cta">
				${
					product.inStock
						? `<a class="button" href="tel:${escapeHtml(phone.replace(/\s+/g, ""))}">Ring for bestilling</a>
				<p>Bestilling gjøres enkelt på telefon.</p>`
						: `<span class="button button--disabled" aria-disabled="true">Utsolgt</span>
				<p>Dette settet er midlertidig utsolgt. Ta gjerne kontakt for å høre når det kommer inn igjen.</p>`
				}
			</div>

			${
				metaRows.length > 0
					? `<table class="specs">
				<caption class="section-title" style="text-align:left">Detaljer</caption>
				<tbody>
					${metaRows.map(([name, value]) => `<tr><th scope="row">${escapeHtml(name)}</th><td>${escapeHtml(value)}</td></tr>`).join("\n\t\t\t\t\t")}
				</tbody>
			</table>`
					: ""
			}

			${
				specRows.length > 0
					? `<table class="specs">
				<caption class="section-title" style="text-align:left">Spesifikasjoner</caption>
				<tbody>
					${specRows.map(([name, value]) => `<tr><th scope="row">${escapeHtml(name)}</th><td>${escapeHtml(value)}</td></tr>`).join("\n\t\t\t\t\t")}
				</tbody>
			</table>`
					: ""
			}

			${product.description ? `<h2 class="section-title">Beskrivelse</h2><p>${escapeHtml(product.description)}</p>` : ""}
		</div>
	</div>
	`;
}
