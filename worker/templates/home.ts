import type { ProductSummary } from "../../shared/types";
import { formatNok } from "../../shared/format";
import { escapeHtml } from "../lib/html";
import { productImageUrl } from "../lib/images";

function renderProductCard(product: ProductSummary): string {
	const meta = [product.pieceCount ? `${product.pieceCount} deler` : null, product.age]
		.filter(Boolean)
		.join(" · ");

	return `<a class="product-card" href="/produkt/${escapeHtml(product.slug)}" data-name="${escapeHtml(product.name.toLowerCase())}" data-in-stock="${product.inStock ? "1" : "0"}">
		<div class="product-card__image">
			<img src="${escapeHtml(productImageUrl(product.mainImageKey))}" alt="" loading="lazy" width="400" height="400">
		</div>
		<div class="product-card__body">
			${!product.inStock ? '<span class="badge">Utsolgt</span>' : ""}
			<strong>${escapeHtml(product.name)}</strong>
			${meta ? `<span class="product-card__meta">${escapeHtml(meta)}</span>` : ""}
			<span class="product-card__price">
				${formatNok(product.price)}
				${product.oldPrice ? `<s>${formatNok(product.oldPrice)}</s>` : ""}
			</span>
		</div>
	</a>`;
}

export interface HomePageData {
	products: ProductSummary[];
	phone: string;
}

export function renderHomeContent({ products, phone }: HomePageData): string {
	return `
	<section class="hero container">
		<h1>Byggesett for store idéer</h1>
		<p>Kompatible byggeklosser for barn og voksne &mdash; kjøretøy, slott, romstasjoner og mer. Bestilling gjøres enkelt på telefon.</p>
		<a class="button" href="tel:${escapeHtml(phone.replace(/\s+/g, ""))}">Ring for bestilling</a>
	</section>

	<section class="advantages container" aria-label="Fordeler">
		<div class="advantage">
			<h3>Kompatible byggeklosser</h3>
			<p>Fungerer sammen med de fleste store byggeklossmerker på markedet.</p>
		</div>
		<div class="advantage">
			<h3>Enkel bestilling</h3>
			<p>Ingen konto eller betalingsløsning &mdash; bare ring, så ordner vi resten.</p>
		</div>
		<div class="advantage">
			<h3>Nøye utvalgte sett</h3>
			<p>Alle sett er valgt for god byggekvalitet og tydelig deleliste.</p>
		</div>
	</section>

	<section class="container" id="produkter">
		<div class="filters">
			<input type="search" id="catalog-search" placeholder="Søk etter produkt&hellip;" aria-label="Søk i produkter">
			<label><input type="checkbox" id="catalog-instock-only"> Kun på lager</label>
		</div>
		<div class="catalog" id="catalog" data-empty-text="Ingen produkter matcher søket.">
			${products.map(renderProductCard).join("\n")}
		</div>
	</section>

	<section class="container" id="slik-bestiller-du">
		<div class="how-to-order">
			<h2 class="section-title" style="margin-top:0">Slik bestiller du</h2>
			<p>Bestilling gjøres enkelt på telefon. Ring oss, så hjelper vi deg med å finne riktig sett og avtale levering.</p>
			<a class="button" href="tel:${escapeHtml(phone.replace(/\s+/g, ""))}">${escapeHtml(phone)}</a>
		</div>
	</section>
	`;
}
