import { env, createExecutionContext, waitOnExecutionContext, SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../worker/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("GET /api/products", () => {
	it("lists only active products with camelCase fields", async () => {
		await env.DB.batch([
			env.DB.prepare(
				`INSERT INTO products (name, slug, price, piece_count, in_stock, is_active, sort_order)
				 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
			).bind("Sportsbil 1286 deler", "sportsbil-1286-deler", 1499, 1286, 1, 1, 1),
			env.DB.prepare(
				`INSERT INTO products (name, slug, price, piece_count, in_stock, is_active, sort_order)
				 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
			).bind("Skjult produkt", "skjult-produkt", 999, 100, 1, 0, 2),
		]);

		const request = new IncomingRequest("http://example.com/api/products");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.json<{ products: unknown[] }>();
		expect(body.products).toEqual([
			expect.objectContaining({ slug: "sportsbil-1286-deler", price: 1499, inStock: true }),
		]);
	});

	it("is reachable through the integration runtime", async () => {
		const response = await SELF.fetch("https://example.com/api/products");
		expect(response.status).toBe(200);
	});
});

describe("GET /api/products/:slug", () => {
	it("returns 404 for a well-formed but unknown slug", async () => {
		const request = new IncomingRequest("http://example.com/api/products/does-not-exist");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(404);
	});

	it("returns 400 for a malformed slug", async () => {
		const request = new IncomingRequest("http://example.com/api/products/Not_Valid!");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
	});

	it("returns product detail with images and specs", async () => {
		const insert = await env.DB.prepare(
			`INSERT INTO products (name, slug, price, piece_count, in_stock, is_active, sort_order)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
		)
			.bind("Romstasjon 1780 deler", "romstasjon-1780-deler", 1899, 1780, 0, 1, 1)
			.run();
		const productId = insert.meta.last_row_id;

		await env.DB.batch([
			env.DB.prepare(
				`INSERT INTO product_images (product_id, r2_key, alt_text, sort_order) VALUES (?1, ?2, ?3, ?4)`,
			).bind(productId, "products/romstasjon-1.webp", "Romstasjon sett forfra", 1),
			env.DB.prepare(
				`INSERT INTO product_specs (product_id, name, value, sort_order) VALUES (?1, ?2, ?3, ?4)`,
			).bind(productId, "Antall deler", "1780", 1),
		]);

		const request = new IncomingRequest("http://example.com/api/products/romstasjon-1780-deler");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.json<{ product: { images: unknown[]; specs: unknown[]; inStock: boolean } }>();
		expect(body.product.inStock).toBe(false);
		expect(body.product.images).toEqual([
			expect.objectContaining({ r2Key: "products/romstasjon-1.webp" }),
		]);
		expect(body.product.specs).toEqual([expect.objectContaining({ name: "Antall deler", value: "1780" })]);
	});

	it("does not return inactive products", async () => {
		await env.DB.prepare(
			`INSERT INTO products (name, slug, price, is_active) VALUES (?1, ?2, ?3, ?4)`,
		)
			.bind("Skjult produkt", "skjult-produkt-2", 999, 0)
			.run();

		const request = new IncomingRequest("http://example.com/api/products/skjult-produkt-2");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(404);
	});
});
