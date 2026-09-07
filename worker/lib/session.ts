/** Stateless, HMAC-signed admin session cookie — no session table to manage or clean up. */
const SESSION_COOKIE_NAME = "grontals_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

interface SessionPayload {
	sub: number;
	exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
	const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
	const binary = atob(padded);
	return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function getHmacKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
		"sign",
		"verify",
	]);
}

function cookieAttributes(maxAgeSeconds: number): string {
	return `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

export async function createSessionCookie(env: Env, adminUserId: number): Promise<string> {
	const payload: SessionPayload = { sub: adminUserId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
	const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
	const key = await getHmacKey(env.ADMIN_SESSION_SECRET);
	const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));

	return `${SESSION_COOKIE_NAME}=${payloadB64}.${base64UrlEncode(new Uint8Array(signature))}; ${cookieAttributes(SESSION_TTL_SECONDS)}`;
}

export function clearSessionCookie(): string {
	return `${SESSION_COOKIE_NAME}=; ${cookieAttributes(0)}`;
}

export async function verifySessionCookie(env: Env, cookieHeader: string | null): Promise<{ adminUserId: number } | null> {
	if (!cookieHeader) return null;

	const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
	if (!match) return null;

	const [payloadB64, sigB64] = match[1].split(".");
	if (!payloadB64 || !sigB64) return null;

	// Cookie values are attacker-controlled; malformed base64/JSON must fail
	// closed (401) rather than throw (500).
	try {
		const key = await getHmacKey(env.ADMIN_SESSION_SECRET);
		const isValid = await crypto.subtle.verify(
			"HMAC",
			key,
			base64UrlDecode(sigB64),
			new TextEncoder().encode(payloadB64),
		);
		if (!isValid) return null;

		const payload: SessionPayload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
		if (typeof payload.sub !== "number" || typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
			return null;
		}

		return { adminUserId: payload.sub };
	} catch {
		return null;
	}
}
