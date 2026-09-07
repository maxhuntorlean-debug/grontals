import { errorJson } from "../lib/http";

const KEY_PATTERN = /^[a-zA-Z0-9/_.-]{1,300}$/;

export async function handleGetImage(env: Env, request: Request, rawKey: string): Promise<Response> {
	if (!KEY_PATTERN.test(rawKey)) {
		return errorJson(404, "Not found");
	}

	const object = await env.PRODUCT_IMAGES.get(rawKey);
	if (!object) {
		return errorJson(404, "Not found");
	}

	const ifNoneMatch = request.headers.get("if-none-match");
	if (ifNoneMatch && ifNoneMatch === object.httpEtag) {
		return new Response(null, { status: 304 });
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set("etag", object.httpEtag);
	headers.set("cache-control", "public, max-age=31536000, immutable");

	return new Response(object.body, { headers });
}
