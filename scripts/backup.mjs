#!/usr/bin/env node
// Wrapper over `wrangler d1 export` — run before risky schema/data changes.
// Usage: npm run db:backup [-- --remote]

import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const DATABASE_NAME = "grontals-db";
const isRemote = process.argv.includes("--remote");

const backupsDir = join(process.cwd(), "backups");
mkdirSync(backupsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = join(backupsDir, `${DATABASE_NAME}-${timestamp}.sql`);

const args = [
	"d1",
	"export",
	DATABASE_NAME,
	isRemote ? "--remote" : "--local",
	"--output",
	outFile,
];

console.log(`Backing up ${DATABASE_NAME} (${isRemote ? "remote" : "local"}) -> ${outFile}`);

const result = spawnSync("npx", ["wrangler", ...args], { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
