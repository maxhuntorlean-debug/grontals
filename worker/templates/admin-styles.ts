/** Admin-only rules. Layered on top of CRITICAL_CSS (reuses the same design tokens). */
export const ADMIN_CSS = `
.admin-root { min-height: 100vh; }
.admin-loading { padding: 3rem; text-align: center; color: var(--muted); }

.admin-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 1rem;
	border-bottom: 1px solid var(--border);
	background: var(--surface);
	position: sticky;
	top: 0;
	z-index: 10;
}
.admin-header strong { font-size: 1.1rem; flex-shrink: 0; }
.admin-header__actions { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end; }

.admin-container { max-width: 1000px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }

.admin-login { max-width: 360px; margin: 3rem auto; padding: 2rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.admin-login h1 { font-size: 1.3rem; margin: 0 0 1.25rem; text-align: center; }

.field { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; }
.field label { font-size: 0.9rem; font-weight: 600; }
.field input, .field textarea, .field select {
	padding: 0.6rem 0.75rem;
	border: 1px solid var(--border);
	border-radius: 8px;
	font: inherit;
	min-height: 44px;
	background: var(--surface);
	color: var(--text);
}
.field textarea { min-height: 90px; resize: vertical; }
.field--checkbox { flex-direction: row; align-items: center; gap: 0.5rem; }
.field--checkbox input { min-height: auto; width: 18px; height: 18px; }
.field-hint { color: var(--muted); font-size: 0.8rem; }

.admin-message { padding: 0.75rem 1rem; border-radius: var(--radius); margin-bottom: 1rem; font-size: 0.95rem; }
.admin-message--error { background: #fdeceb; color: var(--danger); border: 1px solid #f0b7ac; }
.admin-message--success { background: #eaf3ea; color: var(--accent); border: 1px solid #bcd8bd; }

.admin-toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }

.admin-table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.admin-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; min-width: 720px; }
.admin-table th, .admin-table td { text-align: left; padding: 0.65rem 0.75rem; border-bottom: 1px solid var(--border); white-space: nowrap; }
.admin-table tbody tr:last-child td { border-bottom: none; }
.admin-table td.wrap { white-space: normal; }
.admin-table__actions { display: flex; gap: 0.5rem; }

.status-pill { display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600; }
.status-pill--on { background: #eaf3ea; color: var(--accent); }
.status-pill--off { background: #f2ede2; color: var(--muted); }

.admin-form { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; }
.admin-form h2 { margin-top: 0; }
.admin-form-grid { display: grid; grid-template-columns: 1fr; gap: 0 1.25rem; }
@media (min-width: 720px) { .admin-form-grid { grid-template-columns: 1fr 1fr; } }
.admin-form-grid .field--full { grid-column: 1 / -1; }
.admin-form-actions { display: flex; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap; }
/* Always its own full-width row — a deliberate "danger zone" separation, and
   it sidesteps guessing a breakpoint for when it'd otherwise overflow. */
.admin-form-actions__delete { flex-basis: 100%; margin-top: 0.5rem; }
.button--secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
.button--danger { background: var(--danger); color: #fff; }
.button--small { min-height: 36px; padding: 0.4rem 0.9rem; font-size: 0.9rem; }

.admin-section-title { font-size: 1.05rem; margin: 1.75rem 0 0.75rem; }

.spec-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center; }
.spec-row input { min-width: 0; padding: 0.5rem 0.65rem; border: 1px solid var(--border); border-radius: 8px; font: inherit; min-height: 40px; }

/* auto-fit (not auto-fill): a lone tile stretches to fill the row instead of
   staying pinned to 140px with an invisible empty track beside it — which
   left too little room for the tile's three action buttons and overflowed. */
.image-manager { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin: 1rem 0; }
.image-tile { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--bg); position: relative; }
.image-tile img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; }
.image-tile__main-badge { position: absolute; top: 6px; left: 6px; background: var(--accent); color: #fff; font-size: 0.72rem; padding: 0.1rem 0.45rem; border-radius: 999px; }
.image-tile__body { padding: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem; }
.image-tile__body input { font-size: 0.8rem; padding: 0.35rem 0.5rem; border: 1px solid var(--border); border-radius: 6px; }
.image-tile__row { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.image-tile__row .button { padding-left: 0.5rem; padding-right: 0.5rem; }

.dropzone {
	/* It's a <label> (wraps the hidden file input) — inline by default, which
	   doesn't reserve space for its own padding and let content after it
	   (the Lagre/Avbryt row) render overlapping it underneath. */
	display: block;
	border: 2px dashed var(--border);
	border-radius: var(--radius);
	padding: 1.5rem;
	margin-bottom: 1rem;
	text-align: center;
	color: var(--muted);
	cursor: pointer;
}
.dropzone:hover, .dropzone--active { border-color: var(--accent); color: var(--accent); }
.dropzone input[type="file"] { display: none; }

/* Below 719px the table becomes a stack of cards (one per product) instead
   of horizontally scrolling — the header row is redundant there, so each
   cell borrows its column header back as a label via data-label. */
@media (max-width: 719px) {
	.admin-table-wrap { overflow-x: visible; border: none; background: none; }
	.admin-table { min-width: 0; }
	.admin-table thead { display: none; }
	.admin-table, .admin-table tbody, .admin-table tr, .admin-table td { display: block; width: 100%; }
	.admin-table tr {
		margin-bottom: 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		padding: 0.75rem 0.9rem;
	}
	.admin-table td {
		border: none;
		padding: 0.3rem 0;
		white-space: normal;
	}
	.admin-table td[data-label]:not([data-label=""])::before {
		content: attr(data-label);
		display: block;
		font-size: 0.75rem;
		color: var(--muted);
		font-weight: 600;
	}
	.admin-table__actions { flex-direction: row; margin-top: 0.4rem; }
}

@media (max-width: 600px) {
	.spec-row { grid-template-columns: 1fr; }
	.admin-form-actions { flex-direction: column; align-items: stretch; }
	.admin-form-actions .button { width: 100%; }
	.admin-form-actions__delete { margin-top: 0.5rem; }
}

/* Grid/flex items containing text inputs default to a content-based min-width,
   which stops them shrinking below that and overflows the row on narrow
   screens — this resets that for every such container. */
.admin-form-grid > .field,
.image-manager > .image-tile {
	min-width: 0;
}

.confirm-overlay {
	position: fixed;
	inset: 0;
	background: rgba(31, 36, 32, 0.55);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1rem;
	z-index: 100;
}
.confirm-dialog {
	background: var(--surface);
	border-radius: var(--radius);
	padding: 1.5rem;
	max-width: 380px;
	width: 100%;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}
.confirm-dialog h2 { margin: 0 0 0.5rem; font-size: 1.15rem; }
.confirm-dialog p { margin: 0 0 1.25rem; color: var(--text); }
.confirm-dialog__actions { display: flex; gap: 0.75rem; justify-content: flex-end; flex-wrap: wrap; }
.confirm-dialog__actions .button { flex: 0 0 auto; }
`;
