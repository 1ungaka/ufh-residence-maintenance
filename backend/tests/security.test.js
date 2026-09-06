import test, { before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api, seedTestUsers, categoryId } from './helpers.js';
import { db } from '../src/db/index.js';

describe('Security (TC-S01 ... TC-S06)', () => {
  let tokens;
  let requestId;

  before(async () => {
    tokens = await seedTestUsers();
    const res = await api()
      .post('/api/requests')
      .set('Authorization', `Bearer ${tokens.studentToken}`)
      .send({
        category_id: categoryId('Electrical'),
        residence: 'Student Village',
        room: 'B12',
        description: 'Plug socket in the corner is sparking when used.',
        urgency: 'High'
      });
    requestId = res.body.request.id;
  });

  test('TC-S01 a protected endpoint rejects a request with no token', async () => {
    const res = await api().get('/api/requests');
    assert.equal(res.status, 401);
  });

  test('TC-S02 a forged or tampered token is rejected', async () => {
    const res = await api()
      .get('/api/requests')
      .set('Authorization', 'Bearer not.a.real.token');
    assert.equal(res.status, 401);
  });

  test('TC-S03 a student cannot change a request status', async () => {
    const res = await api()
      .patch(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${tokens.studentToken}`)
      .send({ status: 'Completed' });
    assert.equal(res.status, 403);
    const row = db.prepare('SELECT status FROM maintenance_requests WHERE id = ?').get(requestId);
    assert.equal(row.status, 'Submitted');
  });

  test('TC-S04 a student cannot assign a request', async () => {
    const res = await api()
      .post(`/api/requests/${requestId}/assign`)
      .set('Authorization', `Bearer ${tokens.studentToken}`);
    assert.equal(res.status, 403);
  });

  test('TC-S05 maintenance personnel cannot create a request on a student behalf', async () => {
    const res = await api()
      .post('/api/requests')
      .set('Authorization', `Bearer ${tokens.maintenanceToken}`)
      .send({
        category_id: categoryId('Electrical'),
        residence: 'Student Village',
        room: 'B12',
        description: 'Trying to log a request as a maintenance user.',
        urgency: 'Low'
      });
    assert.equal(res.status, 403);
  });

  test('TC-S06 SQL injection in a login field does not break the query', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: "student@ufh.ac.za' OR '1'='1", password: "anything' OR '1'='1" });
    assert.ok([400, 401].includes(res.status));
    const users = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
    assert.ok(users > 0); // the table is still intact
  });

  test('TC-S07 API responses never contain a password hash', async () => {
    const login = await api()
      .post('/api/auth/login')
      .send({ email: 'student@ufh.ac.za', password: 'Student123!' });
    assert.equal(login.status, 200);
    assert.equal(JSON.stringify(login.body).includes('password'), false);
  });
});
