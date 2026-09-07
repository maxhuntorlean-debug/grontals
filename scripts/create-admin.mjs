#!/usr/bin/env node
// Creates or updates an admin_users row with a securely hashed password.
// Usage: node scripts/create-admin.mjs <username> <password> [--remote]
//
// Uses the same PBKDF2-SHA256 format as worker/lib/password.ts (Node's
// webcrypto implements the identical Web Crypto API), so hashes created
// here verify correctly against the deployed Worker.

import { webcrypto as crypto } from "node:crypto";
import { spawnSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATABASE_NAME = "grontals-db";
const ITERATIONS = 100_000;

const [, , username, password, ...rest] = process.argv;
const isRemote = rest.includes("--remote");

if (!username || !password) {
	console.error("Usage: node scripts/create-admin.mjs <username> <password> [--remote]");
	process.exit(1);
}

function toHex(buffer) {
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

async function hashPassword(plain) {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(plain), "PBKDF2", false, [
		"deriveBits",
	]);
	const hash = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
		keyMaterial,
		256,
	);
	return `pbkdf2$${ITERATIONS}$${toHex(salt.buffer)}$${toHex(hash)}`;
}

const hash = await hashPassword(password);
const escapedUsername = username.replace(/'/g, "''");
const sql = `INSERT INTO admin_users (username, password_hash) VALUES ('${escapedUsername}', '${hash}')\nON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash;\n`;

const tmpFile = join(process.cwd(), ".create-admin.tmp.sql");
writeFileSync(tmpFile, sql, "utf8");

try {
	const args = ["d1", "execute", DATABASE_NAME, isRemote ? "--remote" : "--local", "--file", tmpFile];
	console.log(`Setting admin user "${username}" (${isRemote ? "remote" : "local"})...`);
	const result = spawnSync("npx", ["wrangler", ...args], { stdio: "inherit", shell: true });
	process.exit(result.status ?? 1);
} finally {
	unlinkSync(tmpFile);
}
