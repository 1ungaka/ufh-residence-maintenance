/**
 * Data access for the users table.
 * Every statement is parameterised - user input is never concatenated into SQL.
 */
import { db } from '../db/index.js';

const PUBLIC_FIELDS = 'id, name, email, role, trade, residence, room, created_at';

export const userModel = {
  create({ name, email, passwordHash, role, trade = null, residence = null, room = null }) {
    const info = db
      .prepare(
        `INSERT INTO users (name, email, password_hash, role, trade, residence, room)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(name, email, passwordHash, role, trade, residence, room);
    return userModel.findById(info.lastInsertRowid);
  },

  /** Includes the password hash - only used by the login flow. */
  findByEmailWithHash(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findById(id) {
    return db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(id);
  },

  emailExists(email) {
    return !!db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
  },

  updateProfile(id, { name, residence, room }) {
    db.prepare(
      `UPDATE users SET name = ?, residence = ?, room = ? WHERE id = ?`
    ).run(name, residence, room, id);
    return userModel.findById(id);
  }
};
