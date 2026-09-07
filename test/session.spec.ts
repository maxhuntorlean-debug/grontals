import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { clearSessionCookie, createSessionCookie, verifySessionCookie } from "../worker/lib/session";

function extractCookieValue(setCookieHeader: string): string {
	return setCookieHeader.split(";")[0];
}

describe("admin session cookie", () => {
	it("round-trips a valid session", async () => {
		const setCookie = await createSessionCookie(env, 7);
		const cookieHeader = extractCookieValue(setCookie);

		const session = await verifySessionCookie(env, cookieHeader);
		expect(session).toEqual({ adminUserId: 7 });
	});

	it("rejects a missing cookie header", async () => {
		expect(await verifySessionCookie(env, null)).toBeNull();
	});

	it("rejects a tampered signature", async () => {
		const setCookie = await createSessionCookie(env, 7);
		const cookieHeader = extractCookieValue(setCookie);
		const [name, value] = cookieHeader.split("=");
		const [payload, signature] = value.split(".");
		const tampered = `${name}=${payload}.${signature.slice(0, -1)}${signature.endsWith("A") ? "B" : "A"}`;

		expect(await verifySessionCookie(env, tampered)).toBeNull();
	});

	it("rejects a payload signed with a different secret", async () => {
		const forgedEnv = { ...env, ADMIN_SESSION_SECRET: "a-completely-different-secret" };
		const forgedCookie = extractCookieValue(await createSessionCookie(forgedEnv, 999));

		expect(await verifySessionCookie(env, forgedCookie)).toBeNull();
	});

	it("rejects garbage that isn't valid base64 without throwing", async () => {
		await expect(verifySessionCookie(env, "grontals_admin_session=garbage.value")).resolves.toBeNull();
		await expect(verifySessionCookie(env, "grontals_admin_session=not*b64!.also not b64")).resolves.toBeNull();
	});

	it("clearSessionCookie expires immediately", () => {
		expect(clearSessionCookie()).toContain("Max-Age=0");
	});
});
