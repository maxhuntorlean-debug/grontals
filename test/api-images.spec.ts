import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../worker/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("GET /images/:key", () => {
	it("serves an uploaded object with caching headers", async () => {
		await env.PRODUCT_IMAGES.put("products/1/test.webp", new Uint8Array([1, 2, 3]), {
			httpMetadata: { contentType: "image/webp" },
		});

		const request = new IncomingRequest("http://example.com/images/products/1/test.webp");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("image/webp");
		expect(response.headers.get("cache-control")).toContain("immutable");
		expect(await response.arrayBuffer()).toEqual(new Uint8Array([1, 2, 3]).buffer);
	});

	it("returns 404 for a missing key", async () => {
		const request = new IncomingRequest("http://example.com/images/products/1/does-not-exist.webp");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(404);
	});

	it("returns 304 when If-None-Match matches the object's etag", async () => {
		const put = await env.PRODUCT_IMAGES.put("products/1/etag-test.webp", new Uint8Array([9]), {
			httpMetadata: { contentType: "image/webp" },
		});

		const request = new IncomingRequest("http://example.com/images/products/1/etag-test.webp", {
			headers: { "if-none-match": put.httpEtag },
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(304);
	});

	it("rejects keys with disallowed characters", async () => {
		const request = new IncomingRequest("http://example.com/images/..%2fsecret");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(404);
	});
});
