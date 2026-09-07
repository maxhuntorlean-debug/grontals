import { CRITICAL_CSS } from "./styles";
import { ADMIN_CSS } from "./admin-styles";

/**
 * The /admin route is a thin, unauthenticated HTML shell. Auth is enforced
 * entirely by the API (every /api/admin/* call requires the session cookie);
 * admin.js checks GET /api/admin/me on load and renders the login form or
 * the dashboard accordingly. No SEO concerns here, so plain CSR is fine
 * (unlike the public storefront, which needs SSR for crawlability).
 */
export function renderAdminShell(): string {
	return `<!doctype html>
<html lang="nb">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Admin – GRØNTALS</title>
	<meta name="robots" content="noindex, nofollow">
	<style>${CRITICAL_CSS}${ADMIN_CSS}</style>
</head>
<body>
	<div id="admin-root" class="admin-root">
		<p class="admin-loading">Laster&hellip;</p>
	</div>
	<script type="module" src="/admin.js"></script>
</body>
</html>`;
}
