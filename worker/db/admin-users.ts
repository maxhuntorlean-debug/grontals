export interface AdminUserRow {
	id: number;
	username: string;
	password_hash: string;
}

export async function getAdminUserByUsername(db: D1Database, username: string): Promise<AdminUserRow | null> {
	return db
		.prepare(`SELECT id, username, password_hash FROM admin_users WHERE username = ?1`)
		.bind(username)
		.first<AdminUserRow>();
}
