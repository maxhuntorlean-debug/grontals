import { errorJson } from "../lib/http";
import { verifySessionCookie } from "../lib/session";

export async function requireAdmin(request: Request, env: Env): Promise<{ adminUserId: number } | Response> {
	const session = await verifySessionCookie(env, request.headers.get("cookie"));
	if (!session) {
		return errorJson(401, "Unauthorized");
	}
	return session;
}
