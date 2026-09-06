-- UFH Residence Maintenance Portal - relational schema (SQLite)
-- Four tables: users, categories, maintenance_requests, request_updates.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('student', 'maintenance')),
  trade         TEXT,           -- maintenance only: Electrician, Plumber, ...
  residence     TEXT,           -- student only
  room          TEXT,           -- student only
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT    NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id   INTEGER NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  category_id  INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  residence    TEXT    NOT NULL,
  room         TEXT    NOT NULL,
  description  TEXT    NOT NULL,
  urgency      TEXT    NOT NULL CHECK (urgency IN ('Low', 'Medium', 'High')),
  status       TEXT    NOT NULL DEFAULT 'Submitted'
                       CHECK (status IN ('Submitted', 'Assigned', 'In Progress', 'Completed', 'Closed')),
  assigned_to  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  image_path   TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS request_updates (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id          INTEGER NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  maintenance_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status              TEXT,      -- status at the time of the update (NULL for a plain note)
  comment             TEXT    NOT NULL,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for the queries the dashboards run most often.
CREATE INDEX IF NOT EXISTS idx_requests_student  ON maintenance_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_requests_status   ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_assigned ON maintenance_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_updates_request   ON request_updates(request_id);
