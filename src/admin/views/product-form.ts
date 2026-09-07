import type { ProductDetail, ProductImage } from "../../../shared/types";
import { ApiError, createProduct, deleteImage, deleteProduct, type ProductInput, updateImage, updateProduct, uploadImage } from "../api";
import { escapeHtml } from "../html";
import { resizeImageForUpload } from "../image-resize";

export interface ProductFormCallbacks {
	onBack(): void;
	onDeleted(): void;
}

interface FieldOptions {
	required?: boolean;
	full?: boolean;
	hint?: string;
	min?: number;
}

function textField(name: string, label: string, value: string, opts: FieldOptions = {}): string {
	return `
		<div class="field ${opts.full ? "field--full" : ""}">
			<label for="field-${name}">${label}${opts.required ? " *" : ""}</label>
			<input id="field-${name}" name="${name}" type="text" value="${escapeHtml(value)}" ${opts.required ? "required" : ""}>
			${opts.hint ? `<span class="field-hint">${escapeHtml(opts.hint)}</span>` : ""}
		</div>
	`;
}

function numberField(name: string, label: string, value: number | string, opts: FieldOptions = {}): string {
	return `
		<div class="field">
			<label for="field-${name}">${label}${opts.required ? " *" : ""}</label>
			<input id="field-${name}" name="${name}" type="number" value="${value === "" ? "" : escapeHtml(String(value))}" ${opts.required ? "required" : ""} ${opts.min !== undefined ? `min="${opts.min}"` : ""}>
		</div>
	`;
}

function textareaField(name: string, label: string, value: string, opts: FieldOptions = {}): string {
	return `
		<div class="field ${opts.full ? "field--full" : ""}">
			<label for="field-${name}">${label}</label>
			<textarea id="field-${name}" name="${name}">${escapeHtml(value)}</textarea>
		</div>
	`;
}

function optionalText(formData: FormData, key: string): string | undefined {
	const value = String(formData.get(key) ?? "").trim();
	return value ? value : undefined;
}

function optionalTextOrNull(formData: FormData, key: string): string | null {
	const value = String(formData.get(key) ?? "").trim();
	return value ? value : null;
}

function optionalNumberOrNull(formData: FormData, key: string): number | null {
	const raw = String(formData.get(key) ?? "").trim();
	if (!raw) return null;
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
}

export function renderProductForm(root: HTMLElement, initialProduct: ProductDetail | null, callbacks: ProductFormCallbacks): void {
	let product = initialProduct;
	let specs = (initialProduct?.specs ?? []).map((spec) => ({ name: spec.name, value: spec.value }));

	function formShell(p: ProductDetail | null): string {
		return `
			<header class="admin-header">
				<strong>GRØNTALS admin</strong>
				<button class="button button--secondary button--small" id="back-button" type="button">&larr; Tilbake til produkter</button>
			</header>
			<div class="admin-container">
				<div id="form-message"></div>
				<form class="admin-form" id="product-form" novalidate>
					<h2>${p ? "Rediger produkt" : "Nytt produkt"}</h2>
					<div class="admin-form-grid">
						${textField("name", "Navn", p?.name ?? "", { required: true, full: true })}
						${textField("slug", "Slug", p?.slug ?? "", { full: true, hint: "La stå tomt for å generere automatisk fra navnet." })}
						${textField("sku", "Artikkelnummer", p?.sku ?? "")}
						${textField("brand", "Merke", p?.brand ?? "")}
						${textField("manufacturer", "Produsent", p?.manufacturer ?? "")}
						${numberField("price", "Pris (kr)", p?.price ?? "", { required: true, min: 1 })}
						${numberField("oldPrice", "Førpris (kr)", p?.oldPrice ?? "", { min: 1 })}
						${numberField("pieceCount", "Antall deler", p?.pieceCount ?? "", { min: 1 })}
						${textField("age", "Alder", p?.age ?? "")}
						${textField("modelSize", "Mål", p?.modelSize ?? "")}
						${textField("material", "Materiale", p?.material ?? "")}
						${numberField("sortOrder", "Sortering", p?.sortOrder ?? 0)}
						${textareaField("shortDescription", "Kort beskrivelse", p?.shortDescription ?? "", { full: true })}
						${textareaField("description", "Beskrivelse", p?.description ?? "", { full: true })}
						${textField("seoTitle", "SEO-tittel", p?.seoTitle ?? "", { full: true })}
						${textareaField("seoDescription", "SEO-beskrivelse", p?.seoDescription ?? "", { full: true })}
						<div class="field field--checkbox field--full">
							<input type="checkbox" id="field-inStock" name="inStock" ${p ? (p.inStock ? "checked" : "") : "checked"}>
							<label for="field-inStock">På lager</label>
						</div>
						<div class="field field--checkbox field--full">
							<input type="checkbox" id="field-isActive" name="isActive" ${p ? (p.isActive ? "checked" : "") : "checked"}>
							<label for="field-isActive">Synlig på nettsiden</label>
						</div>
					</div>

					<h3 class="admin-section-title">Spesifikasjoner</h3>
					<div id="specs-rows"></div>
					<button class="button button--secondary button--small" id="add-spec-button" type="button">+ Legg til spesifikasjon</button>

					<h3 class="admin-section-title">Bilder</h3>
					${p ? '<div id="image-section"></div>' : '<p class="field-hint">Lagre produktet først for å kunne laste opp bilder.</p>'}

					<div class="admin-form-actions">
						<button class="button" type="submit">Lagre</button>
						<button class="button button--secondary" id="cancel-button" type="button">Avbryt</button>
						${p ? '<button class="button button--danger" id="delete-product-button" type="button" style="margin-left:auto">Slett produkt</button>' : ""}
					</div>
				</form>
			</div>
		`;
	}

	function showMessage(kind: "error" | "success", text: string): void {
		const container = root.querySelector<HTMLDivElement>("#form-message");
		if (container) {
			container.innerHTML = `<div class="admin-message admin-message--${kind}">${escapeHtml(text)}</div>`;
		}
	}

	function renderSpecsRows(): void {
		const container = root.querySelector<HTMLDivElement>("#specs-rows");
		if (!container) return;

		container.innerHTML = specs
			.map(
				(spec, index) => `
				<div class="spec-row" data-index="${index}">
					<input type="text" placeholder="Navn (f.eks. Materiale)" value="${escapeHtml(spec.name)}" data-spec-field="name">
					<input type="text" placeholder="Verdi" value="${escapeHtml(spec.value)}" data-spec-field="value">
					<button type="button" class="button button--secondary button--small" data-remove-spec aria-label="Fjern">&times;</button>
				</div>
			`,
			)
			.join("");

		for (const row of container.querySelectorAll<HTMLDivElement>(".spec-row")) {
			const index = Number(row.dataset.index);
			for (const input of row.querySelectorAll<HTMLInputElement>("input[data-spec-field]")) {
				const field = input.dataset.specField as "name" | "value";
				input.addEventListener("input", () => {
					specs[index][field] = input.value;
				});
			}
			row.querySelector<HTMLButtonElement>("[data-remove-spec]")!.addEventListener("click", () => {
				specs.splice(index, 1);
				renderSpecsRows();
			});
		}
	}

	function renderImageTiles(images: ProductImage[]): void {
		const container = root.querySelector<HTMLDivElement>("#image-tiles");
		if (!container) return;

		const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

		container.innerHTML = sorted
			.map(
				(image, index) => `
				<div class="image-tile" data-image-id="${image.id}">
					${index === 0 ? '<span class="image-tile__main-badge">Hoved</span>' : ""}
					<img src="/images/${escapeHtml(image.r2Key)}" alt="${escapeHtml(image.altText ?? "")}" loading="lazy">
					<div class="image-tile__body">
						<input type="text" placeholder="Alt-tekst" value="${escapeHtml(image.altText ?? "")}" data-alt-input>
						<div class="image-tile__row">
							<button type="button" class="button button--secondary button--small" data-move="up" ${index === 0 ? "disabled" : ""} aria-label="Flytt opp">&uarr;</button>
							<button type="button" class="button button--secondary button--small" data-move="down" ${index === sorted.length - 1 ? "disabled" : ""} aria-label="Flytt ned">&darr;</button>
							<button type="button" class="button button--danger button--small" data-remove-image>Slett</button>
						</div>
					</div>
				</div>
			`,
			)
			.join("");

		for (const tile of container.querySelectorAll<HTMLDivElement>(".image-tile")) {
			const imageId = Number(tile.dataset.imageId);

			tile.querySelector<HTMLInputElement>("[data-alt-input]")!.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement).value.trim();
				void updateImage(imageId, { altText: value || null }).catch(() => {
					showMessage("error", "Kunne ikke oppdatere alt-tekst.");
				});
			});

			tile.querySelector<HTMLButtonElement>("[data-remove-image]")!.addEventListener("click", () => void handleDeleteImage(imageId));
			tile.querySelector<HTMLButtonElement>('[data-move="up"]')?.addEventListener("click", () => void handleMoveImage(imageId, -1));
			tile.querySelector<HTMLButtonElement>('[data-move="down"]')?.addEventListener("click", () => void handleMoveImage(imageId, 1));
		}
	}

	function renderImageSection(): void {
		const container = root.querySelector<HTMLDivElement>("#image-section");
		if (!container || !product) return;

		container.innerHTML = `
			<div class="image-manager" id="image-tiles"></div>
			<label class="dropzone" id="dropzone">
				<input type="file" id="file-input" accept="image/jpeg,image/png,image/webp" multiple>
				Klikk eller dra bilder hit (JPEG, PNG eller WebP)
			</label>
		`;

		renderImageTiles(product.images);

		const dropzone = container.querySelector<HTMLLabelElement>("#dropzone")!;
		const fileInput = container.querySelector<HTMLInputElement>("#file-input")!;

		fileInput.addEventListener("change", () => {
			if (fileInput.files) void handleFiles(Array.from(fileInput.files));
			fileInput.value = "";
		});
		dropzone.addEventListener("dragover", (event) => {
			event.preventDefault();
			dropzone.classList.add("dropzone--active");
		});
		dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dropzone--active"));
		dropzone.addEventListener("drop", (event) => {
			event.preventDefault();
			dropzone.classList.remove("dropzone--active");
			if (event.dataTransfer?.files) void handleFiles(Array.from(event.dataTransfer.files));
		});
	}

	async function handleFiles(files: File[]): Promise<void> {
		if (!product) return;
		for (const file of files) {
			try {
				const { blob, filename } = await resizeImageForUpload(file);
				const image = await uploadImage(product.id, blob, filename, "");
				product.images.push(image);
				renderImageTiles(product.images);
			} catch (err) {
				showMessage("error", err instanceof ApiError ? err.message : `Kunne ikke laste opp ${file.name}.`);
			}
		}
	}

	async function handleDeleteImage(imageId: number): Promise<void> {
		if (!product) return;
		if (!window.confirm("Slette dette bildet?")) return;
		try {
			await deleteImage(imageId);
			product.images = product.images.filter((image) => image.id !== imageId);
			renderImageTiles(product.images);
		} catch {
			showMessage("error", "Kunne ikke slette bildet.");
		}
	}

	async function handleMoveImage(imageId: number, direction: -1 | 1): Promise<void> {
		if (!product) return;
		const sorted = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
		const index = sorted.findIndex((image) => image.id === imageId);
		const swapIndex = index + direction;
		if (index === -1 || swapIndex < 0 || swapIndex >= sorted.length) return;

		const a = sorted[index];
		const b = sorted[swapIndex];
		try {
			const [updatedA, updatedB] = await Promise.all([
				updateImage(a.id, { sortOrder: b.sortOrder }),
				updateImage(b.id, { sortOrder: a.sortOrder }),
			]);
			product.images = product.images.map((image) => {
				if (image.id === updatedA.id) return updatedA;
				if (image.id === updatedB.id) return updatedB;
				return image;
			});
			renderImageTiles(product.images);
		} catch {
			showMessage("error", "Kunne ikke endre rekkefølge.");
		}
	}

	async function handleDeleteProduct(): Promise<void> {
		if (!product) return;
		if (!window.confirm(`Slette "${product.name}"? Dette kan ikke angres.`)) return;
		try {
			await deleteProduct(product.id);
			callbacks.onDeleted();
		} catch {
			showMessage("error", "Kunne ikke slette produktet.");
		}
	}

	async function handleSubmit(form: HTMLFormElement): Promise<void> {
		const formData = new FormData(form);
		const name = String(formData.get("name") ?? "").trim();
		const price = Number(String(formData.get("price") ?? ""));

		if (!name) {
			showMessage("error", "Navn er påkrevd.");
			return;
		}
		if (!Number.isFinite(price) || price <= 0) {
			showMessage("error", "Pris må være et positivt tall.");
			return;
		}

		const input: ProductInput = {
			name,
			slug: optionalText(formData, "slug"),
			sku: optionalTextOrNull(formData, "sku"),
			price,
			oldPrice: optionalNumberOrNull(formData, "oldPrice"),
			shortDescription: optionalTextOrNull(formData, "shortDescription"),
			description: optionalTextOrNull(formData, "description"),
			brand: optionalTextOrNull(formData, "brand"),
			manufacturer: optionalTextOrNull(formData, "manufacturer"),
			pieceCount: optionalNumberOrNull(formData, "pieceCount"),
			age: optionalTextOrNull(formData, "age"),
			modelSize: optionalTextOrNull(formData, "modelSize"),
			material: optionalTextOrNull(formData, "material"),
			inStock: formData.get("inStock") === "on",
			isActive: formData.get("isActive") === "on",
			sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
			seoTitle: optionalTextOrNull(formData, "seoTitle"),
			seoDescription: optionalTextOrNull(formData, "seoDescription"),
			specs: specs
				.filter((spec) => spec.name.trim() && spec.value.trim())
				.map((spec, index) => ({ name: spec.name.trim(), value: spec.value.trim(), sortOrder: index })),
		};

		const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
		submitButton.disabled = true;

		try {
			const saved = product ? await updateProduct(product.id, input) : await createProduct(input);
			product = saved;
			specs = saved.specs.map((spec) => ({ name: spec.name, value: spec.value }));
			mount(product);
			showMessage("success", "Produktet er lagret.");
		} catch (err) {
			showMessage("error", err instanceof ApiError ? err.message : "Kunne ikke lagre produktet.");
			submitButton.disabled = false;
		}
	}

	function mount(p: ProductDetail | null): void {
		root.innerHTML = formShell(p);

		root.querySelector<HTMLButtonElement>("#back-button")!.addEventListener("click", callbacks.onBack);
		root.querySelector<HTMLButtonElement>("#cancel-button")!.addEventListener("click", callbacks.onBack);
		root.querySelector<HTMLButtonElement>("#add-spec-button")!.addEventListener("click", () => {
			specs.push({ name: "", value: "" });
			renderSpecsRows();
		});
		root.querySelector<HTMLButtonElement>("#delete-product-button")?.addEventListener("click", () => void handleDeleteProduct());

		const form = root.querySelector<HTMLFormElement>("#product-form")!;
		form.addEventListener("submit", (event) => {
			event.preventDefault();
			void handleSubmit(form);
		});

		renderSpecsRows();
		if (p) renderImageSection();
	}

	mount(product);
}
