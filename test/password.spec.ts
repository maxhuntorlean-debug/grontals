import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../worker/lib/password";

describe("password hashing", () => {
	it("verifies the correct password", async () => {
		const hash = await hashPassword("correct horse battery staple");
		expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
	});

	it("rejects the wrong password", async () => {
		const hash = await hashPassword("correct horse battery staple");
		expect(await verifyPassword("wrong password", hash)).toBe(false);
	});

	it("produces a different hash (different salt) each time", async () => {
		const a = await hashPassword("same-password");
		const b = await hashPassword("same-password");
		expect(a).not.toBe(b);
	});

	it("rejects a malformed stored hash", async () => {
		expect(await verifyPassword("anything", "not-a-valid-hash")).toBe(false);
	});

	it("rejects a tampered hash", async () => {
		const hash = await hashPassword("correct horse battery staple");
		const tampered = hash.slice(0, -1) + (hash.endsWith("0") ? "1" : "0");
		expect(await verifyPassword("correct horse battery staple", tampered)).toBe(false);
	});
});
