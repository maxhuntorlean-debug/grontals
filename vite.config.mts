import { defineConfig } from "vite";

// Builds the client scripts (public site enhancement + admin SPA) into
// public/*.js, which the Worker serves as static assets (see wrangler.jsonc
// "assets"). Two independent entries, plain ES module output — no shared
// chunk since neither imports from the other.
export default defineConfig({
	publicDir: false,
	build: {
		outDir: "public",
		emptyOutDir: false,
		rollupOptions: {
			input: {
				main: "src/main.ts",
				admin: "src/admin/main.ts",
			},
			output: {
				format: "es",
				entryFileNames: "[name].js",
			},
		},
	},
});
