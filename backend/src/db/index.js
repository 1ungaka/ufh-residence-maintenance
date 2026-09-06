/**
 * SQLite connection.
 *
 * better-sqlite3 is synchronous, which keeps the code readable for a teaching
 * project. Every query in this project uses prepared statements with bound
 * parameters, which is our main defence against SQL injection.
 */
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (config.databaseFile !== ':memory:') {
  fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });
}

export const db = new Database(config.databaseFile);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/** Create the tables if they do not exist yet. */
export function initSchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
}

initSchema();
