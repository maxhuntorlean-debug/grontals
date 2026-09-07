export function json(data: unknown, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	headers.set("content-type", "application/json; charset=UTF-8");
	return new Response(JSON.stringify(data), { ...init, headers });
}

export function errorJson(status: number, message: string): Response {
	return json({ error: message }, { status });
}
