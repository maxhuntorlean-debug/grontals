const GOOGLE_ANALYTICS_SOURCES = "https://www.googletagmanager.com https://*.google-analytics.com";

function buildCsp(analyticsEnabled: boolean): string {
	return [
		"default-src 'self'",
		analyticsEnabled ? `script-src 'self' ${GOOGLE_ANALYTICS_SOURCES}` : "script-src 'self'",
		// Inline <style> carries the site's critical CSS (no external stylesheet request); it's static, not user-controlled.
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self'",
		"font-src 'self'",
		analyticsEnabled ? `connect-src 'self' ${GOOGLE_ANALYTICS_SOURCES}` : "connect-src 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"object-src 'none'",
	].join("; ");
}

/** Applied to every response (see also public/_headers for static assets, which bypass the Worker). */
export function withSecurityHeaders(response: Response, env: Env): Response {
	const headers = new Headers(response.headers);
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	headers.set("X-Frame-Options", "DENY");
	headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()");
	headers.set("Content-Security-Policy", buildCsp(Boolean(env.GA4_MEASUREMENT_ID)));

	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
