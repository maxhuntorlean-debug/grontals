/**
 * Progressive enhancement only. Every link here already works as a plain
 * `<a href>` rendered server-side — this script just makes product links
 * open in an overlay on top of the catalog instead of a full navigation,
 * and adds a client-side catalog filter. If this script fails to load or
 * run, the site still works exactly the same via normal navigation.
 */

initCatalogFilter();
initProductOverlay();

function initCatalogFilter(): void {
	const catalog = document.getElementById("catalog");
	const searchEl = document.getElementById("catalog-search");
	const inStockEl = document.getElementById("catalog-instock-only");
	if (!(catalog instanceof HTMLElement) || !(searchEl instanceof HTMLInputElement) || !(inStockEl instanceof HTMLInputElement)) {
		return;
	}
	const search: HTMLInputElement = searchEl;
	const inStockOnly: HTMLInputElement = inStockEl;

	const cards = Array.from(catalog.querySelectorAll<HTMLAnchorElement>(".product-card"));
	let emptyMessage: HTMLParagraphElement | null = null;

	function applyFilter(): void {
		const query = search.value.trim().toLowerCase();
		const onlyInStock = inStockOnly.checked;
		let visible = 0;

		for (const card of cards) {
			const matches = (!query || (card.dataset.name ?? "").includes(query)) && (!onlyInStock || card.dataset.inStock === "1");
			card.hidden = !matches;
			if (matches) visible += 1;
		}

		if (visible === 0) {
			if (!emptyMessage) {
				emptyMessage = document.createElement("p");
				emptyMessage.className = "catalog-empty";
				emptyMessage.textContent = catalog!.dataset.emptyText ?? "Ingen treff.";
				catalog!.after(emptyMessage);
			}
		} else {
			emptyMessage?.remove();
			emptyMessage = null;
		}
	}

	search.addEventListener("input", applyFilter);
	inStockOnly.addEventListener("change", applyFilter);
}

const PRODUCT_PATH = /^\/produkt\/[^/]+$/;

function initProductOverlay(): void {
	const overlay = document.createElement("div");
	overlay.className = "product-overlay";
	overlay.hidden = true;
	overlay.innerHTML = `
		<div class="product-overlay__backdrop" data-close></div>
		<div class="product-overlay__panel" role="dialog" aria-modal="true" tabindex="-1">
			<button type="button" class="product-overlay__close" data-close aria-label="Lukk">&times;</button>
			<div class="product-overlay__content"></div>
		</div>
	`;
	document.body.append(overlay);

	const panel = overlay.querySelector<HTMLDivElement>(".product-overlay__panel")!;
	const contentEl = overlay.querySelector<HTMLDivElement>(".product-overlay__content")!;

	let triggerEl: HTMLElement | null = null;
	let pushedState = false;

	async function openFromUrl(url: string): Promise<void> {
		const response = await fetch(url);
		if (!response.ok) {
			window.location.assign(url);
			return;
		}
		const doc = new DOMParser().parseFromString(await response.text(), "text/html");
		const main = doc.getElementById("product-main");
		if (!main) {
			window.location.assign(url);
			return;
		}

		contentEl.innerHTML = main.innerHTML;
		if (doc.title) document.title = doc.title;
		overlay.hidden = false;
		document.body.style.overflow = "hidden";
		panel.focus();
		document.addEventListener("keydown", onKeydown);
	}

	function closeOverlay(): void {
		overlay.hidden = true;
		document.body.style.overflow = "";
		document.removeEventListener("keydown", onKeydown);
		triggerEl?.focus();
		triggerEl = null;
	}

	function onKeydown(event: KeyboardEvent): void {
		if (event.key === "Escape") {
			if (pushedState) history.back();
			else closeOverlay();
			return;
		}
		if (event.key === "Tab") trapFocus(event, panel);
	}

	overlay.addEventListener("click", (event) => {
		if ((event.target as HTMLElement).closest("[data-close]")) {
			if (pushedState) history.back();
			else closeOverlay();
		}
	});

	document.addEventListener("click", (event) => {
		if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
		if (!link || link.origin !== window.location.origin || !PRODUCT_PATH.test(link.pathname)) {
			return;
		}

		event.preventDefault();
		triggerEl = link;
		history.pushState({ overlay: true }, "", link.href);
		pushedState = true;
		void openFromUrl(link.href);
	});

	window.addEventListener("popstate", (event) => {
		if (event.state?.overlay && PRODUCT_PATH.test(window.location.pathname)) {
			pushedState = true;
			void openFromUrl(window.location.href);
		} else {
			pushedState = false;
			if (!overlay.hidden) closeOverlay();
		}
	});
}

function trapFocus(event: KeyboardEvent, container: HTMLElement): void {
	const focusable = container.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
	if (focusable.length === 0) return;
	const first = focusable[0];
	const last = focusable[focusable.length - 1];

	if (event.shiftKey && document.activeElement === first) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && document.activeElement === last) {
		event.preventDefault();
		first.focus();
	}
}
