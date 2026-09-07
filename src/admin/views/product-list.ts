import type { Product } from "../../../shared/types";
import { formatNok } from "../../../shared/format";
import { deleteProduct, listProducts, logout } from "../api";
import { confirmDialog } from "../confirm-dialog";
import { escapeHtml } from "../html";

export interface ProductListCallbacks {
	onEdit(product: Product): void;
	onCreate(): void;
	onLogout(): void;
}

export async function renderProductList(root: HTMLElement, callbacks: ProductListCallbacks): Promise<void> {
	root.innerHTML = `<p class="admin-loading">Laster produkter&hellip;</p>`;

	let products: Product[];
	try {
		products = await listProducts();
	} catch {
		root.innerHTML = `<div class="admin-container"><div class="admin-message admin-message--error">Kunne ikke laste produkter.</div></div>`;
		return;
	}

	renderList(products);

	function renderList(items: Product[]): void {
		root.innerHTML = `
			<header class="admin-header">
				<strong>GRØNTALS admin</strong>
				<div class="admin-header__actions">
					<a class="button button--secondary button--small" href="/" target="_blank" rel="noopener">Se nettsiden &#8599;</a>
					<button class="button button--secondary button--small" id="logout-button" type="button">Logg ut</button>
				</div>
			</header>
			<div class="admin-container">
				<div class="admin-toolbar">
					<h1 style="margin:0">Produkter (${items.length})</h1>
					<button class="button" id="create-button" type="button">Nytt produkt</button>
				</div>
				${items.length === 0 ? '<p class="field-hint">Ingen produkter ennå. Klikk &laquo;Nytt produkt&raquo; for å legge til det første.</p>' : renderTable(items)}
			</div>
		`;

		root.querySelector<HTMLButtonElement>("#logout-button")!.addEventListener("click", () => {
			void logout().finally(callbacks.onLogout);
		});
		root.querySelector<HTMLButtonElement>("#create-button")!.addEventListener("click", callbacks.onCreate);

		for (const button of root.querySelectorAll<HTMLButtonElement>("[data-edit-id]")) {
			const product = items.find((p) => p.id === Number(button.dataset.editId));
			if (product) button.addEventListener("click", () => callbacks.onEdit(product));
		}

		for (const button of root.querySelectorAll<HTMLButtonElement>("[data-delete-id]")) {
			button.addEventListener("click", () => void handleDelete(Number(button.dataset.deleteId), button));
		}
	}

	async function handleDelete(id: number, button: HTMLButtonElement): Promise<void> {
		const product = products.find((p) => p.id === id);
		if (!product) return;
		if (!(await confirmDialog(`Slette "${product.name}"? Dette kan ikke angres.`))) return;

		button.disabled = true;
		try {
			await deleteProduct(id);
			products = products.filter((p) => p.id !== id);
			renderList(products);
		} catch {
			window.alert("Kunne ikke slette produktet.");
			button.disabled = false;
		}
	}
}

function renderTable(items: Product[]): string {
	return `
		<div class="admin-table-wrap">
			<table class="admin-table">
				<thead>
					<tr>
						<th>Navn</th>
						<th>Slug</th>
						<th>Pris</th>
						<th>Lager</th>
						<th>Synlig</th>
						<th>Sortering</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					${items.map(renderRow).join("")}
				</tbody>
			</table>
		</div>
	`;
}

function renderRow(product: Product): string {
	return `
		<tr>
			<td class="wrap" data-label="Navn">${escapeHtml(product.name)}</td>
			<td data-label="Slug">${escapeHtml(product.slug)}</td>
			<td data-label="Pris">${formatNok(product.price)}</td>
			<td data-label="Lager"><span class="status-pill ${product.inStock ? "status-pill--on" : "status-pill--off"}">${product.inStock ? "På lager" : "Utsolgt"}</span></td>
			<td data-label="Synlig"><span class="status-pill ${product.isActive ? "status-pill--on" : "status-pill--off"}">${product.isActive ? "Synlig" : "Skjult"}</span></td>
			<td data-label="Sortering">${product.sortOrder}</td>
			<td data-label="">
				<div class="admin-table__actions">
					<button class="button button--secondary button--small" type="button" data-edit-id="${product.id}">Rediger</button>
					<button class="button button--danger button--small" type="button" data-delete-id="${product.id}">Slett</button>
				</div>
			</td>
		</tr>
	`;
}
