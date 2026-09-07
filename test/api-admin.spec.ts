import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import worker from "../worker/index";
import { hashPassword } from "../worker/lib/password";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

// Storage persists across `it()` blocks within a test file, so this must be
// idempotent rather than a plain INSERT (beforeEach runs it before every test).
async function seedAdmin(username: string, password: string): Promise<void> {
	const hash = await hashPassword(password);
	await env.DB.prepare(
		`INSERT INTO admin_users (username, password_hash) VALUES (?1, ?2)
		 ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash`,
	)
		.bind(username, hash)
		.run();
}

async function callWorker(request: InstanceType<typeof IncomingRequest>): Promise<Response> {
	const ctx = createExecutionContext();
	const response = await worker.fetch(request, env, ctx);
	await waitOnExecutionContext(ctx);
	return response;
}

async function loginAndGetCookie(username = "admin", password = "correct-password"): Promise<string> {
	const response = await callWorker(
		new IncomingRequest("http://example.com/api/admin/login", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ username, password }),
		}),
	);
	const setCookie = response.headers.get("set-cookie");
	if (!setCookie) throw new Error("Login did not return a session cookie");
	return setCookie.split(";")[0];
}

beforeEach(async () => {
	await seedAdmin("admin", "correct-password");
});

describe("POST /api/admin/login", () => {
	it("rejects wrong credentials", async () => {
		const response = await callWorker(
			new IncomingRequest("http://example.com/api/admin/login", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ username: "admin", password: "wrong" }),
			}),
		);
		expect(response.status).toBe(401);
		expect(response.headers.get("set-cookie")).toBeNull();
	});

	it("accepts correct credentials and sets a session cookie", async () => {
		const response = await callWorker(
			new IncomingRequest("http://example.com/api/admin/login", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ username: "admin", password: "correct-password" }),
			}),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("set-cookie")).toContain("HttpOnly");
	});

	it("rate-limits after repeated failures from the same IP", async () => {
		const makeAttempt = () =>
			callWorker(
				new IncomingRequest("http://example.com/api/admin/login", {
					method: "POST",
					headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.9" },
					body: JSON.stringify({ username: "admin", password: "wrong" }),
				}),
			);

		let lastStatus = 0;
		for (let i = 0; i < 6; i++) {
			lastStatus = (await makeAttempt()).status;
		}
		expect(lastStatus).toBe(429);
	});
});

describe("admin API auth guard", () => {
	it("rejects requests without a session cookie", async () => {
		const response = await callWorker(new IncomingRequest("http://example.com/api/admin/products"));
		expect(response.status).toBe(401);
	});

	it("rejects a tampered cookie", async () => {
		const response = await callWorker(
			new IncomingRequest("http://example.com/api/admin/products", {
				headers: { cookie: "grontals_admin_session=garbage.value" },
			}),
		);
		expect(response.status).toBe(401);
	});
});

describe("admin product CRUD", () => {
	it("creates, lists, updates and deletes a product", async () => {
		const cookie = await loginAndGetCookie();

		const createResponse = await callWorker(
			new IncomingRequest("http://example.com/api/admin/products", {
				method: "POST",
				headers: { "content-type": "application/json", cookie },
				body: JSON.stringify({ name: "Åpen Bro 500 deler", price: 999, isActive: false }),
			}),
		);
		expect(createResponse.status).toBe(201);
		const created = await createResponse.json<{ product: { id: number; slug: string; isActive: boolean } }>();
		expect(created.product.slug).toBe("apen-bro-500-deler");
		expect(created.product.isActive).toBe(false);

		const listResponse = await callWorker(
			new IncomingRequest("http://example.com/api/admin/products", { headers: { cookie } }),
		);
		const list = await listResponse.json<{ products: { id: number }[] }>();
		expect(list.products.some((p) => p.id === created.product.id)).toBe(true);

		const updateResponse = await callWorker(
			new IncomingRequest(`http://example.com/api/admin/products/${created.product.id}`, {
				method: "PUT",
				headers: { "content-type": "application/json", cookie },
				body: JSON.stringify({ price: 1200, isActive: true }),
			}),
		);
		expect(updateResponse.status).toBe(200);
		const updated = await updateResponse.json<{ product: { price: number; isActive: boolean } }>();
		expect(updated.product.price).toBe(1200);
		expect(updated.product.isActive).toBe(true);

		const deleteResponse = await callWorker(
			new IncomingRequest(`http://example.com/api/admin/products/${created.product.id}`, {
				method: "DELETE",
				headers: { cookie },
			}),
		);
		expect(deleteResponse.status).toBe(200);

		const publicResponse = await callWorker(
			new IncomingRequest("http://example.com/api/products/apen-bro-500-deler"),
		);
		expect(publicResponse.status).toBe(404);
	});

	it("suffixes the slug on collision", async () => {
		const cookie = await loginAndGetCookie();

		for (const expectedSlug of ["duplikat-navn", "duplikat-navn-2"]) {
			const response = await callWorker(
				new IncomingRequest("http://example.com/api/admin/products", {
					method: "POST",
					headers: { "content-type": "application/json", cookie },
					body: JSON.stringify({ name: "Duplikat Navn", price: 100 }),
				}),
			);
			const body = await response.json<{ product: { slug: string } }>();
			expect(body.product.slug).toBe(expectedSlug);
		}
	});

	it("rejects invalid product payloads", async () => {
		const cookie = await loginAndGetCookie();
		const response = await callWorker(
			new IncomingRequest("http://example.com/api/admin/products", {
				method: "POST",
				headers: { "content-type": "application/json", cookie },
				body: JSON.stringify({ name: "", price: -5 }),
			}),
		);
		expect(response.status).toBe(400);
	});
});

describe("admin image upload", () => {
	async function createTestProduct(cookie: string): Promise<number> {
		const response = await callWorker(
			new IncomingRequest("http://example.com/api/admin/products", {
				method: "POST",
				headers: { "content-type": "application/json", cookie },
				body: JSON.stringify({ name: "Bilde-testprodukt", price: 500 }),
			}),
		);
		const body = await response.json<{ product: { id: number } }>();
		return body.product.id;
	}

	it("uploads an image, sets it as main image, then deletes it from R2 and D1", async () => {
		const cookie = await loginAndGetCookie();
		const productId = await createTestProduct(cookie);

		const formData = new FormData();
		formData.set("file", new File([new Uint8Array([1, 2, 3, 4])], "photo.jpg", { type: "image/jpeg" }));
		formData.set("altText", "Produktbilde");

		const uploadResponse = await callWorker(
			new IncomingRequest(`http://example.com/api/admin/products/${productId}/images`, {
				method: "POST",
				headers: { cookie },
				body: formData,
			}),
		);
		expect(uploadResponse.status).toBe(201);
		const { image } = await uploadResponse.json<{ image: { id: number; r2Key: string; altText: string } }>();
		expect(image.altText).toBe("Produktbilde");

		const stored = await env.PRODUCT_IMAGES.get(image.r2Key);
		expect(stored).not.toBeNull();

		const productResponse = await callWorker(
			new IncomingRequest(`http://example.com/api/admin/products`, { headers: { cookie } }),
		);
		const { products } = await productResponse.json<{ products: { id: number; mainImageKey: string | null }[] }>();
		expect(products.find((p) => p.id === productId)?.mainImageKey).toBe(image.r2Key);

		const deleteResponse = await callWorker(
			new IncomingRequest(`http://example.com/api/admin/images/${image.id}`, { method: "DELETE", headers: { cookie } }),
		);
		expect(deleteResponse.status).toBe(200);
		expect(await env.PRODUCT_IMAGES.get(image.r2Key)).toBeNull();
	});

	it("reassigns the main image when it is deleted or reordered", async () => {
		const cookie = await loginAndGetCookie();
		const productId = await createTestProduct(cookie);

		async function upload(name: string) {
			const formData = new FormData();
			formData.set("file", new File([new Uint8Array([1])], name, { type: "image/png" }));
			const response = await callWorker(
				new IncomingRequest(`http://example.com/api/admin/products/${productId}/images`, {
					method: "POST",
					headers: { cookie },
					body: formData,
				}),
			);
			return (await response.json<{ image: { id: number; r2Key: string } }>()).image;
		}

		async function mainImageKey(): Promise<string | null> {
			const response = await callWorker(new IncomingRequest("http://example.com/api/admin/products", { headers: { cookie } }));
			const { products } = await response.json<{ products: { id: number; mainImageKey: string | null }[] }>();
			return products.find((p) => p.id === productId)?.mainImageKey ?? null;
		}

		const first = await upload("a.png");
		const second = await upload("b.png");
		expect(await mainImageKey()).toBe(first.r2Key);

		// Reordering so the second image sorts first promotes it to main.
		await callWorker(
			new IncomingRequest(`http://example.com/api/admin/images/${second.id}`, {
				method: "PUT",
				headers: { "content-type": "application/json", cookie },
				body: JSON.stringify({ sortOrder: 0 }),
			}),
		);
		expect(await mainImageKey()).toBe(second.r2Key);

		// Deleting the current main image falls back to the remaining one.
		await callWorker(
			new IncomingRequest(`http://example.com/api/admin/images/${second.id}`, { method: "DELETE", headers: { cookie } }),
		);
		expect(await mainImageKey()).toBe(first.r2Key);

		// Deleting the last image clears the main image key.
		await callWorker(
			new IncomingRequest(`http://example.com/api/admin/images/${first.id}`, { method: "DELETE", headers: { cookie } }),
		);
		expect(await mainImageKey()).toBeNull();
	});

	it("rejects disallowed file types", async () => {
		const cookie = await loginAndGetCookie();
		const productId = await createTestProduct(cookie);

		const formData = new FormData();
		formData.set("file", new File([new Uint8Array([1])], "evil.svg", { type: "image/svg+xml" }));

		const response = await callWorker(
			new IncomingRequest(`http://example.com/api/admin/products/${productId}/images`, {
				method: "POST",
				headers: { cookie },
				body: formData,
			}),
		);
		expect(response.status).toBe(400);
	});

	it("deleting a product also deletes its images from R2", async () => {
		const cookie = await loginAndGetCookie();
		const productId = await createTestProduct(cookie);

		const formData = new FormData();
		formData.set("file", new File([new Uint8Array([9, 9])], "photo.png", { type: "image/png" }));
		const uploadResponse = await callWorker(
			new IncomingRequest(`http://example.com/api/admin/products/${productId}/images`, {
				method: "POST",
				headers: { cookie },
				body: formData,
			}),
		);
		const { image } = await uploadResponse.json<{ image: { r2Key: string } }>();

		await callWorker(
			new IncomingRequest(`http://example.com/api/admin/products/${productId}`, { method: "DELETE", headers: { cookie } }),
		);

		expect(await env.PRODUCT_IMAGES.get(image.r2Key)).toBeNull();
	});
});

describe("POST /api/admin/logout", () => {
	it("clears the session cookie", async () => {
		const response = await callWorker(new IncomingRequest("http://example.com/api/admin/logout", { method: "POST" }));
		expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
	});
});
