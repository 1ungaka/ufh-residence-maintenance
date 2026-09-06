/**
 * Test helpers. testEnv.js sets NODE_ENV=test, which makes config.js use an
 * in-memory SQLite database, so the tests never touch the real database file.
 */
import './testEnv.js'; // MUST be the first import: sets NODE_ENV=test
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { db } from '../src/db/index.js';
import { createApp } from '../src/app.js';
import { CATEGORIES } from '../src/utils/constants.js';

export const app = createApp();
export const api = () => request(app);

export function resetDatabase() {
  db.exec(`
    DELETE FROM request_updates;
    DELETE FROM maintenance_requests;
    DELETE FROM users;
    DELETE FROM categories;
  `);
  const insert = db.prepare('INSERT INTO categories (name) VALUES (?)');
  for (const name of CATEGORIES) insert.run(name);
}

export function createUser({ name, email, password, role, trade = null, residence = null, room = null }) {
  const info = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, trade, residence, room)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(name, email, bcrypt.hashSync(password, 4), role, trade, residence, room);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
}

export async function login(email, password) {
  const res = await api().post('/api/auth/login').send({ email, password });
  return res.body.token;
}

export function categoryId(name) {
  return db.prepare('SELECT id FROM categories WHERE name = ?').get(name).id;
}

/** Standard fixture: one student, one second student, one electrician. */
export async function seedTestUsers() {
  resetDatabase();
  createUser({
    name: 'Test Student',
    email: 'student@ufh.ac.za',
    password: 'Student123!',
    role: 'student',
    residence: 'Student Village',
    room: 'B12'
  });
  createUser({
    name: 'Other Student',
    email: 'other@ufh.ac.za',
    password: 'Student123!',
    role: 'student',
    residence: 'Residence A',
    room: 'A15'
  });
  createUser({
    name: 'Test Electrician',
    email: 'electrician@ufh.ac.za',
    password: 'Maintenance123!',
    role: 'maintenance',
    trade: 'Electrician'
  });
  createUser({
    name: 'Test Plumber',
    email: 'plumber@ufh.ac.za',
    password: 'Maintenance123!',
    role: 'maintenance',
    trade: 'Plumber'
  });

  return {
    studentToken: await login('student@ufh.ac.za', 'Student123!'),
    otherStudentToken: await login('other@ufh.ac.za', 'Student123!'),
    maintenanceToken: await login('electrician@ufh.ac.za', 'Maintenance123!'),
    plumberToken: await login('plumber@ufh.ac.za', 'Maintenance123!')
  };
}
