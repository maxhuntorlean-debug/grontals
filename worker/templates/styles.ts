/**
 * Inlined critical CSS. The catalog is small (~20 products) and the whole
 * site is a handful of routes, so one small inlined stylesheet beats an
 * extra render-blocking request. Mobile-first: base rules target small
 * screens, breakpoints only add layout, never remove content.
 */
export const CRITICAL_CSS = `
:root {
	--bg: #faf8f4;
	--surface: #ffffff;
	--text: #1f2420;
	--muted: #6b6459;
	--accent: #2f5233;
	--accent-contrast: #ffffff;
	--border: #e5e0d5;
	--danger: #b3492f;
	--radius: 10px;
	color-scheme: light;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
	margin: 0;
	background: var(--bg);
	color: var(--text);
	font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
	line-height: 1.5;
}
img { max-width: 100%; display: block; }
a { color: inherit; }
.skip-link {
	position: absolute;
	left: -999px;
	top: 0;
	background: var(--accent);
	color: var(--accent-contrast);
	padding: 0.75rem 1rem;
	z-index: 100;
}
.skip-link:focus { left: 0.5rem; top: 0.5rem; border-radius: var(--radius); }

.site-header {
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
.site-header__logo { font-size: 1.25rem; font-weight: 700; letter-spacing: 0.02em; text-decoration: none; }
.site-nav { display: none; gap: 1.25rem; font-size: 0.95rem; }
.site-nav a { text-decoration: none; }
.site-nav a:hover { color: var(--accent); }
@media (min-width: 720px) { .site-nav { display: flex; } }

.container { max-width: 1100px; margin: 0 auto; padding: 0 1rem; }

.hero { padding: 2.5rem 0 2rem; text-align: center; }
.hero h1 { font-size: clamp(1.75rem, 5vw, 2.75rem); margin: 0 0 0.75rem; }
.hero p { color: var(--muted); max-width: 44ch; margin: 0 auto 1.5rem; font-size: 1.05rem; }
.button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	background: var(--accent);
	color: var(--accent-contrast);
	border: none;
	border-radius: var(--radius);
	padding: 0.85rem 1.5rem;
	font-size: 1rem;
	font-weight: 600;
	text-decoration: none;
	min-height: 44px;
	cursor: pointer;
}
.button:hover { opacity: 0.92; }
.button--outline { background: transparent; color: var(--accent); border: 1px solid var(--accent); }
.button--disabled { background: var(--border); color: var(--muted); pointer-events: none; }

.advantages {
	display: grid;
	grid-template-columns: 1fr;
	gap: 1rem;
	padding: 1.5rem 0;
}
@media (min-width: 640px) { .advantages { grid-template-columns: repeat(3, 1fr); } }
.advantage { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; }
.advantage h3 { margin: 0 0 0.4rem; font-size: 1.05rem; }
.advantage p { margin: 0; color: var(--muted); font-size: 0.95rem; }

.filters {
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	align-items: center;
	padding: 1rem 0;
}
.filters input[type="search"] {
	flex: 1 1 220px;
	padding: 0.65rem 0.9rem;
	border: 1px solid var(--border);
	border-radius: var(--radius);
	font-size: 1rem;
	min-height: 44px;
}
.filters label { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.95rem; min-height: 44px; }

.catalog {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 1.25rem;
	padding: 0.5rem 0 2.5rem;
}
.product-card {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	overflow: hidden;
	text-decoration: none;
	color: inherit;
	display: flex;
	flex-direction: column;
}
.product-card:hover { border-color: var(--accent); }
.product-card__image { aspect-ratio: 1 / 1; background: var(--bg); overflow: hidden; }
.product-card__image img { width: 100%; height: 100%; object-fit: cover; }
.product-card__body { padding: 0.9rem 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
.product-card__meta { color: var(--muted); font-size: 0.85rem; }
.product-card__price { margin-top: auto; display: flex; align-items: baseline; gap: 0.5rem; font-weight: 700; }
.product-card__price s { color: var(--muted); font-weight: 400; font-size: 0.85rem; }
.badge {
	display: inline-block;
	font-size: 0.75rem;
	font-weight: 600;
	padding: 0.15rem 0.5rem;
	border-radius: 999px;
	background: var(--danger);
	color: #fff;
	width: fit-content;
}

.breadcrumbs { padding: 1rem 0 0; font-size: 0.85rem; color: var(--muted); }
.breadcrumbs a { text-decoration: none; }
.breadcrumbs a:hover { text-decoration: underline; }

.product-page { padding: 1rem 0 3rem; display: grid; gap: 2rem; }
@media (min-width: 860px) { .product-page { grid-template-columns: 1fr 1fr; align-items: start; } }
.product-gallery__main { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; background: var(--surface); }
.product-gallery__thumbs { display: flex; gap: 0.6rem; margin-top: 0.6rem; flex-wrap: wrap; }
.product-gallery__thumbs img { width: 72px; height: 72px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border); }

.product-info h1 { font-size: clamp(1.5rem, 4vw, 2.1rem); margin: 0 0 0.5rem; }
.product-info__price { display: flex; align-items: baseline; gap: 0.75rem; font-size: 1.6rem; font-weight: 700; margin: 0.75rem 0; }
.product-info__price s { color: var(--muted); font-weight: 400; font-size: 1.05rem; }
.product-info__cta { margin: 1.25rem 0; }
.product-info__cta p { color: var(--muted); font-size: 0.9rem; margin-top: 0.5rem; }

.specs { width: 100%; border-collapse: collapse; margin-top: 1rem; }
.specs th, .specs td { text-align: left; padding: 0.5rem 0.25rem; border-bottom: 1px solid var(--border); font-size: 0.95rem; }
.specs th { color: var(--muted); font-weight: 500; width: 45%; }

.section-title { font-size: 1.4rem; margin: 2rem 0 0.5rem; }

.how-to-order { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; margin: 1rem 0 2.5rem; text-align: center; }
.how-to-order p { color: var(--muted); max-width: 50ch; margin: 0.5rem auto 1.25rem; }

.legal-page { padding: 2rem 0 3rem; max-width: 70ch; }
.legal-page h1 { font-size: 1.75rem; }
.legal-page p { color: var(--text); }
.placeholder-note { background: #fff4e5; border: 1px solid #e8c27a; border-radius: var(--radius); padding: 0.75rem 1rem; font-size: 0.9rem; margin-top: 1rem; }

.site-footer { border-top: 1px solid var(--border); padding: 2rem 1rem; margin-top: 2rem; color: var(--muted); font-size: 0.9rem; }
.site-footer nav { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.75rem; }
.site-footer a { text-decoration: none; }
.site-footer a:hover { text-decoration: underline; }

.not-found { padding: 4rem 1rem; text-align: center; }

.catalog-empty { color: var(--muted); padding: 1rem 0; }

.product-overlay { position: fixed; inset: 0; z-index: 50; }
.product-overlay__backdrop { position: absolute; inset: 0; background: rgba(31, 36, 32, 0.55); }
.product-overlay__panel {
	position: absolute;
	inset: 0;
	margin: 0 auto;
	max-width: 900px;
	background: var(--bg);
	overflow-y: auto;
	padding: 1.5rem 1rem 2rem;
}
@media (min-width: 720px) { .product-overlay__panel { inset: 2rem 2rem 2rem auto; left: 50%; transform: translateX(-50%); border-radius: var(--radius); max-height: calc(100vh - 4rem); } }
.product-overlay__close {
	position: sticky;
	top: 0;
	left: 100%;
	margin-left: auto;
	display: block;
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: 999px;
	width: 44px;
	height: 44px;
	font-size: 1.5rem;
	line-height: 1;
	cursor: pointer;
	z-index: 1;
}
.product-overlay__content { display: grid; gap: 2rem; }
@media (min-width: 640px) { .product-overlay__content { grid-template-columns: 1fr 1fr; align-items: start; } }

:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
`;
