-- Tracks failed admin login attempts per IP for brute-force rate limiting.
CREATE TABLE admin_login_attempts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	ip TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_login_attempts_ip_created_at ON admin_login_attempts(ip, created_at);
