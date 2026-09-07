import { describe, it, expect } from "vitest";
import { buildImageKey, MAX_UPLOAD_BYTES, validateImageUpload } from "../worker/lib/uploads";

describe("validateImageUpload", () => {
	it("accepts jpeg, png and webp within the size limit", () => {
		expect(validateImageUpload({ type: "image/jpeg", size: 1024 })).toEqual({ ok: true, extension: "jpg" });
		expect(validateImageUpload({ type: "image/png", size: 1024 })).toEqual({ ok: true, extension: "png" });
		expect(validateImageUpload({ type: "image/webp", size: 1024 })).toEqual({ ok: true, extension: "webp" });
	});

	it("rejects disallowed MIME types", () => {
		const result = validateImageUpload({ type: "image/svg+xml", size: 1024 });
		expect(result.ok).toBe(false);
	});

	it("rejects files over the size limit", () => {
		const result = validateImageUpload({ type: "image/png", size: MAX_UPLOAD_BYTES + 1 });
		expect(result.ok).toBe(false);
	});

	it("rejects empty files", () => {
		const result = validateImageUpload({ type: "image/png", size: 0 });
		expect(result.ok).toBe(false);
	});
});

describe("buildImageKey", () => {
	it("scopes the key by product id and uses the given extension", () => {
		const key = buildImageKey(42, "webp");
		expect(key).toMatch(/^products\/42\/[0-9a-f-]{36}\.webp$/);
	});

	it("never reuses the same key twice", () => {
		const a = buildImageKey(1, "jpg");
		const b = buildImageKey(1, "jpg");
		expect(a).not.toBe(b);
	});
});
