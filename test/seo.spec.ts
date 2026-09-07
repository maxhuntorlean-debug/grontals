import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../worker/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

async function callWorker(request: InstanceType<typeof IncomingRequest>): Promise<Response> {
	const ctx = createExecutionContext();
	const response = await worker.fetch(request, env, ctx);
	await waitOnExecutionContext(ctx);
	return response;
}

async function seedProduct(overrides: Partial<{ name: string; slug: string; isActive: number }> = {}): Promise<void> {
	await env.DB.prepare(
		`INSERT INTO products (name, slug, price, is_active) VALUES (?1, ?2, ?3, ?4)`,
	)
		.bind(overrides.name ?? "Sitemap-testprodukt", overrides.slug ?? "sitemap-testprodukt", 500, overrides.isActive ?? 1)
		.run();
}

describe("GET /robots.txt", () => {
	it("disallows everything when DISALLOW_INDEXING is true (the wrangler.jsonc default)", async () => {
		const response = await callWorker(new IncomingRequest("http://example.com/robots.txt"));
		expect(response.status).toBe(200);
		const body = await response.text();
		expect(body).toContain("Disallow: /");
		expect(body).not.toContain("Sitemap:");
	});

	it("allows indexing and links the sitemap when DISALLOW_INDEXING is false", async () => {
		const request = new IncomingRequest("http://example.com/robots.txt");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, { ...env, DISALLOW_INDEXING: "false" }, ctx);
		await waitOnExecutionContext(ctx);

		const body = await response.text();
		expect(body).toContain("Sitemap: ");
		expect(body).toContain("/sitemap.xml");
		expect(body).toContain("Disallow: /admin");
	});
});

describe("GET /sitemap.xml", () => {
	it("lists active products, the homepage and legal pages, but not inactive products", async () => {
		await seedProduct({ name: "Aktivt produkt", slug: "aktivt-produkt", isActive: 1 });
		await seedProduct({ name: "Skjult produkt", slug: "skjult-produkt-sitemap", isActive: 0 });

		const response = await callWorker(new IncomingRequest("http://example.com/sitemap.xml"));
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/xml");

		const body = await response.text();
		expect(body).toContain("<loc>https://grontals.YOUR-SUBDOMAIN.workers.dev/</loc>");
		expect(body).toContain("<loc>https://grontals.YOUR-SUBDOMAIN.workers.dev/om-oss</loc>");
		expect(body).toContain("<loc>https://grontals.YOUR-SUBDOMAIN.workers.dev/produkt/aktivt-produkt</loc>");
		expect(body).not.toContain("skjult-produkt-sitemap");
	});
});

describe("SEO metadata on server-rendered pages", () => {
	it("includes canonical link and Organization/WebSite JSON-LD on the homepage", async () => {
		const response = await callWorker(new IncomingRequest("http://example.com/"));
		const body = await response.text();

		expect(body).toContain('<link rel="canonical" href="https://grontals.YOUR-SUBDOMAIN.workers.dev/">');
		expect(body).toContain('"@type":"OnlineStore"');
		expect(body).toContain('"@type":"WebSite"');
	});

	it("includes canonical link, Product/BreadcrumbList JSON-LD and og:type=product on a product page", async () => {
		await seedProduct({ name: "SEO Testprodukt", slug: "seo-testprodukt", isActive: 1 });

		const response = await callWorker(new IncomingRequest("http://example.com/produkt/seo-testprodukt"));
		const body = await response.text();

		expect(body).toContain('<link rel="canonical" href="https://grontals.YOUR-SUBDOMAIN.workers.dev/produkt/seo-testprodukt">');
		expect(body).toContain('<meta property="og:type" content="product">');
		expect(body).toContain('"@type":"Product"');
		expect(body).toContain('"@type":"BreadcrumbList"');
		expect(body).toContain('"priceCurrency":"NOK"');
	});

	it("includes a canonical link on legal pages", async () => {
		const response = await callWorker(new IncomingRequest("http://example.com/kontakt"));
		const body = await response.text();
		expect(body).toContain('<link rel="canonical" href="https://grontals.YOUR-SUBDOMAIN.workers.dev/kontakt">');
	});
});

describe("optional analytics/verification hooks", () => {
	it("inject nothing and keep a strict CSP when the vars are empty (the default)", async () => {
		const response = await callWorker(new IncomingRequest("http://example.com/"));
		const body = await response.text();

		expect(body).not.toContain("googletagmanager.com");
		expect(body).not.toContain("google-site-verification");
		expect(response.headers.get("content-security-policy")).not.toContain("google");
	});

	it("inject gtag.js and the verification meta, and relax CSP, only when the vars are set", async () => {
		const request = new IncomingRequest("http://example.com/");
		const ctx = createExecutionContext();
		const analyticsEnv = { ...env, GA4_MEASUREMENT_ID: "G-TEST123", GSC_VERIFICATION_META: "verify-me" };
		const response = await worker.fetch(request, analyticsEnv as Env, ctx);
		await waitOnExecutionContext(ctx);
		const body = await response.text();

		expect(body).toContain("https://www.googletagmanager.com/gtag/js?id=G-TEST123");
		expect(body).toContain('<meta name="google-site-verification" content="verify-me">');
		expect(response.headers.get("content-security-policy")).toContain("googletagmanager.com");
	});
});
