import test, { before, describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { api, seedTestUsers, resetDatabase, createUser } from './helpers.js';
import { db } from '../src/db/index.js';

describe('Authentication (TC-A01 ... TC-A06)', () => {
  before(async () => {
    await seedTestUsers();
  });

  test('TC-A01 a student can register with a valid university email', async () => {
    const res = await api().post('/api/auth/register').send({
      name: 'New Student',
      email: '202499001@ufh.ac.za',
      password: 'Student123!',
      residence: 'Student Village',
      room: 'D07'
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'student');
    assert.equal(res.body.user.email, '202499001@ufh.ac.za');
  });

  test('TC-A02 registration rejects a non-UFH email address', async () => {
    const res = await api().post('/api/auth/register').send({
      name: 'Outside Person',
      email: 'someone@gmail.com',
      password: 'Student123!',
      residence: 'Student Village',
      room: 'D08'
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /ufh\.ac\.za/);
  });

  test('TC-A02b registration rejects an address that is not a student number', async () => {
    const res = await api().post('/api/auth/register').send({
      name: 'Not A Number',
      email: 'aphiwe.ndlela@ufh.ac.za',
      password: 'Student123!',
      residence: 'Student Village',
      room: 'D10'
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /student number/i);
  });

  test('TC-A03 registration rejects a weak password', async () => {
    const res = await api().post('/api/auth/register').send({
      name: 'Weak Password',
      email: '202499002@ufh.ac.za',
      password: 'abc',
      residence: 'Student Village',
      room: 'D09'
    });
    assert.equal(res.status, 400);
  });

  test('TC-A04 a registered student can log in', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'student@ufh.ac.za', password: 'Student123!' });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
  });

  test('TC-A05 an incorrect password is rejected', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'student@ufh.ac.za', password: 'WrongPassword1' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Email or password is incorrect.');
  });

  test('TC-A06 passwords are stored as bcrypt hashes, never in plain text', async () => {
    resetDatabase();
    createUser({
      name: 'Hash Check',
      email: 'hash@ufh.ac.za',
      password: 'Student123!',
      role: 'student',
      residence: 'Student Village',
      room: 'B12'
    });
    const row = db.prepare('SELECT password_hash FROM users WHERE email = ?').get('hash@ufh.ac.za');
    assert.notEqual(row.password_hash, 'Student123!');
    assert.match(row.password_hash, /^\$2[aby]\$/);
    assert.ok(bcrypt.compareSync('Student123!', row.password_hash));
  });
});
