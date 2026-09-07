/** Joins a configured PUBLIC_SITE_URL with a path, tolerating trailing/leading slashes. */
export function absoluteUrl(siteUrl: string, path: string): string {
	const base = siteUrl.replace(/\/+$/, "");
	const suffix = path.startsWith("/") ? path : `/${path}`;
	return `${base}${suffix}`;
}
