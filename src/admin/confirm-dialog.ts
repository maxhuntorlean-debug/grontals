import { escapeHtml } from "./html";

export interface ConfirmOptions {
	title?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	danger?: boolean;
}

/** Styled replacement for window.confirm(), matching the admin UI's language and look. */
export function confirmDialog(message: string, options: ConfirmOptions = {}): Promise<boolean> {
	const { title = "Bekreft", confirmLabel = "Slett", cancelLabel = "Avbryt", danger = true } = options;

	return new Promise((resolve) => {
		const overlay = document.createElement("div");
		overlay.className = "confirm-overlay";
		overlay.innerHTML = `
			<div class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" tabindex="-1">
				<h2 id="confirm-dialog-title">${escapeHtml(title)}</h2>
				<p>${escapeHtml(message)}</p>
				<div class="confirm-dialog__actions">
					<button type="button" class="button button--secondary" data-action="cancel">${escapeHtml(cancelLabel)}</button>
					<button type="button" class="button ${danger ? "button--danger" : ""}" data-action="confirm">${escapeHtml(confirmLabel)}</button>
				</div>
			</div>
		`;
		document.body.append(overlay);

		const dialog = overlay.querySelector<HTMLDivElement>(".confirm-dialog")!;
		const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

		function finish(result: boolean): void {
			document.removeEventListener("keydown", onKeydown);
			overlay.remove();
			previouslyFocused?.focus();
			resolve(result);
		}

		function onKeydown(event: KeyboardEvent): void {
			if (event.key === "Escape") {
				event.preventDefault();
				finish(false);
			} else if (event.key === "Tab") {
				trapFocus(event, dialog);
			}
		}

		overlay.addEventListener("click", (event) => {
			const target = event.target as HTMLElement;
			const action = target.closest<HTMLButtonElement>("[data-action]")?.dataset.action;
			if (action === "confirm") finish(true);
			else if (action === "cancel" || target === overlay) finish(false);
		});

		document.addEventListener("keydown", onKeydown);
		dialog.focus();
	});
}

function trapFocus(event: KeyboardEvent, container: HTMLElement): void {
	const focusable = container.querySelectorAll<HTMLElement>("button:not([disabled])");
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
