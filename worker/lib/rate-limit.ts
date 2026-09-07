const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS_PER_WINDOW = 5;
const CLEANUP_AFTER_DAYS = 1;

/** Brute-force guard for POST /api/admin/login, backed by D1 (no KV needed for this traffic volume). */
export async function isLoginRateLimited(db: D1Database, ip: string): Promise<boolean> {
	const row = await db
		.prepare(
			`SELECT COUNT(*) AS count FROM admin_login_attempts
			 WHERE ip = ?1 AND created_at > datetime('now', ?2)`,
		)
		.bind(ip, `-${WINDOW_MINUTES} minutes`)
		.first<{ count: number }>();

	return (row?.count ?? 0) >= MAX_ATTEMPTS_PER_WINDOW;
}

export async function recordFailedLoginAttempt(db: D1Database, ip: string): Promise<void> {
	await db.batch([
		db.prepare(`INSERT INTO admin_login_attempts (ip) VALUES (?1)`).bind(ip),
		db.prepare(`DELETE FROM admin_login_attempts WHERE created_at < datetime('now', ?1)`).bind(
			`-${CLEANUP_AFTER_DAYS} days`,
		),
	]);
}
