import type { ProductDetail } from "../../shared/types";
import { checkSession, getProduct } from "./api";
import { renderLogin } from "./views/login";
import { renderProductForm } from "./views/product-form";
import { renderProductList } from "./views/product-list";

const root = document.getElementById("admin-root");
if (root) {
	void bootstrap(root);
}

async function bootstrap(root: HTMLElement): Promise<void> {
	try {
		await checkSession();
		showList(root);
	} catch {
		showLogin(root);
	}
}

function showLogin(root: HTMLElement): void {
	renderLogin(root, () => showList(root));
}

function showList(root: HTMLElement): void {
	void renderProductList(root, {
		onCreate: () => showForm(root, null),
		onEdit: (product) => void openEditForm(root, product.id),
		onLogout: () => showLogin(root),
	});
}

async function openEditForm(root: HTMLElement, id: number): Promise<void> {
	root.innerHTML = `<p class="admin-loading">Laster produkt&hellip;</p>`;
	try {
		const detail = await getProduct(id);
		showForm(root, detail);
	} catch {
		root.innerHTML = `<div class="admin-container"><div class="admin-message admin-message--error">Kunne ikke laste produktet.</div></div>`;
	}
}

function showForm(root: HTMLElement, product: ProductDetail | null): void {
	renderProductForm(root, product, {
		onBack: () => showList(root),
		onDeleted: () => showList(root),
	});
}
