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

const EXPECTED_HEADERS = {
	"x-content-type-options": "nosniff",
	"referrer-policy": "strict-origin-when-cross-origin",
	"x-frame-options": "DENY",
};

describe("security headers", () => {
	it("are present on HTML pages", async () => {
		const response = await callWorker(new IncomingRequest("http://example.com/"));
		for (const [name, value] of Object.entries(EXPECTED_HEADERS)) {
			expect(response.headers.get(name)).toBe(value);
		}
		expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
		expect(response.headers.get("permissions-policy")).toContain("geolocation=()");
	});

	it("are present on JSON API responses", async () => {
		const response = await callWorker(new IncomingRequest("http://example.com/api/products"));
		expect(response.headers.get("x-content-type-options")).toBe("nosniff");
		expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
	});

	it("are present on 404 and error responses", async () => {
		const response = await callWorker(new IncomingRequest("http://example.com/does-not-exist"));
		expect(response.status).toBe(404);
		expect(response.headers.get("x-frame-options")).toBe("DENY");
	});

	it("are present on unauthenticated admin API responses", async () => {
		const response = await callWorker(new IncomingRequest("http://example.com/api/admin/products"));
		expect(response.status).toBe(401);
		expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
	});
});
