-- Tabel token RDP + sesi (jalankan sekali di D1; aman diulang).
-- Jika tabel rdp_tokens sudah dibuat sebelum kolom email ada, jalankan sekali: ALTER TABLE rdp_tokens ADD COLUMN email TEXT;  -- dan: ALTER TABLE rdp_sessions ADD COLUMN port INTEGER;
CREATE TABLE IF NOT EXISTS rdp_tokens(hash TEXT PRIMARY KEY, subject TEXT NOT NULL, login TEXT NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL, tg_id TEXT, tg_name TEXT, verified_at INTEGER, used_at INTEGER, email TEXT);
CREATE INDEX IF NOT EXISTS rdp_tokens_subject ON rdp_tokens(subject,created);
CREATE TABLE IF NOT EXISTS rdp_sessions(id TEXT PRIMARY KEY, subject TEXT NOT NULL, token_hash TEXT NOT NULL, key_hash TEXT NOT NULL, tg_id TEXT, started INTEGER NOT NULL, ends INTEGER NOT NULL, ended INTEGER, port INTEGER);
CREATE INDEX IF NOT EXISTS rdp_sessions_subject ON rdp_sessions(subject,started);
CREATE INDEX IF NOT EXISTS rdp_sessions_tg ON rdp_sessions(tg_id,started);
