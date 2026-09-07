import { getAdminUserByUsername } from "../../db/admin-users";
import { errorJson, json } from "../../lib/http";
import { verifyPassword } from "../../lib/password";
import { isLoginRateLimited, recordFailedLoginAttempt } from "../../lib/rate-limit";
import { clearSessionCookie, createSessionCookie } from "../../lib/session";
import { loginSchema } from "../../schemas/auth";

function getClientIp(request: Request): string {
	return request.headers.get("cf-connecting-ip") ?? "unknown";
}

export async function handleAdminLogin(request: Request, env: Env): Promise<Response> {
	const ip = getClientIp(request);
	if (await isLoginRateLimited(env.DB, ip)) {
		return errorJson(429, "For mange forsøk. Prøv igjen senere.");
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return errorJson(400, "Invalid request body");
	}

	const parsed = loginSchema.safeParse(body);
	if (!parsed.success) {
		return errorJson(400, "Invalid request body");
	}

	const user = await getAdminUserByUsername(env.DB, parsed.data.username);
	if (!user || !(await verifyPassword(parsed.data.password, user.password_hash))) {
		await recordFailedLoginAttempt(env.DB, ip);
		return errorJson(401, "Feil brukernavn eller passord.");
	}

	const cookie = await createSessionCookie(env, user.id);
	return json({ ok: true }, { headers: { "set-cookie": cookie } });
}

export function handleAdminLogout(): Response {
	return json({ ok: true }, { headers: { "set-cookie": clearSessionCookie() } });
}
