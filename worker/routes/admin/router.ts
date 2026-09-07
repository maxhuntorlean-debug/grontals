import { requireAdmin } from "../../middleware/admin-auth";
import { errorJson, json } from "../../lib/http";
import { handleAdminLogin, handleAdminLogout } from "./auth";
import { handleAdminDeleteImage, handleAdminUpdateImage, handleAdminUploadImage } from "./images";
import {
	handleAdminCreateProduct,
	handleAdminDeleteProduct,
	handleAdminGetProduct,
	handleAdminListProducts,
	handleAdminUpdateProduct,
} from "./products";

const PRODUCT_ID_ROUTE = /^\/api\/admin\/products\/(\d+)$/;
const PRODUCT_IMAGES_ROUTE = /^\/api\/admin\/products\/(\d+)\/images$/;
const IMAGE_ID_ROUTE = /^\/api\/admin\/images\/(\d+)$/;

/** Handles everything under /api/admin/*. Login and logout are the only unauthenticated routes. */
export async function routeAdminApi(request: Request, env: Env, url: URL): Promise<Response> {
	if (url.pathname === "/api/admin/login" && request.method === "POST") {
		return handleAdminLogin(request, env);
	}
	if (url.pathname === "/api/admin/logout" && request.method === "POST") {
		return handleAdminLogout();
	}

	const session = await requireAdmin(request, env);
	if (session instanceof Response) {
		return session;
	}

	if (url.pathname === "/api/admin/me" && request.method === "GET") {
		return json({ ok: true });
	}

	if (url.pathname === "/api/admin/products" && request.method === "GET") {
		return handleAdminListProducts(env);
	}
	if (url.pathname === "/api/admin/products" && request.method === "POST") {
		return handleAdminCreateProduct(request, env);
	}

	const productIdMatch = url.pathname.match(PRODUCT_ID_ROUTE);
	if (productIdMatch && request.method === "GET") {
		return handleAdminGetProduct(env, productIdMatch[1]);
	}
	if (productIdMatch && request.method === "PUT") {
		return handleAdminUpdateProduct(request, env, productIdMatch[1]);
	}
	if (productIdMatch && request.method === "DELETE") {
		return handleAdminDeleteProduct(env, productIdMatch[1]);
	}

	const productImagesMatch = url.pathname.match(PRODUCT_IMAGES_ROUTE);
	if (productImagesMatch && request.method === "POST") {
		return handleAdminUploadImage(request, env, productImagesMatch[1]);
	}

	const imageIdMatch = url.pathname.match(IMAGE_ID_ROUTE);
	if (imageIdMatch && request.method === "DELETE") {
		return handleAdminDeleteImage(env, imageIdMatch[1]);
	}
	if (imageIdMatch && request.method === "PUT") {
		return handleAdminUpdateImage(request, env, imageIdMatch[1]);
	}

	return errorJson(404, "Not found");
}
