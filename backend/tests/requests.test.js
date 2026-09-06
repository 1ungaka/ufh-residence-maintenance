import test, { before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api, seedTestUsers, categoryId } from './helpers.js';
import { db } from '../src/db/index.js';

describe('Maintenance requests (TC-R01 ... TC-R09)', () => {
  let tokens;
  let requestId;

  before(async () => {
    tokens = await seedTestUsers();
  });

  test('TC-R01 a student can create a maintenance request', async () => {
    const res = await api()
      .post('/api/requests')
      .set('Authorization', `Bearer ${tokens.studentToken}`)
      .send({
        category_id: categoryId('Electrical'),
        residence: 'Student Village',
        room: 'B12',
        description: 'The light in my room is no longer working.',
        urgency: 'High'
      });
    assert.equal(res.status, 201);
    assert.equal(res.body.request.status, 'Submitted');
    assert.equal(res.body.request.category, 'Electrical');
    requestId = res.body.request.id;
  });

  test('TC-R02 the request is stored in the database with its first history entry', () => {
    const row = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(requestId);
    assert.ok(row);
    assert.equal(row.room, 'B12');
    const updates = db.prepare('SELECT * FROM request_updates WHERE request_id = ?').all(requestId);
    assert.equal(updates.length, 1);
    assert.equal(updates[0].status, 'Submitted');
  });

  test('TC-R03 required fields are validated', async () => {
    const res = await api()
      .post('/api/requests')
      .set('Authorization', `Bearer ${tokens.studentToken}`)
      .send({ category_id: categoryId('Plumbing'), residence: 'Student Village', room: 'B12' });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /description/i);
  });

  test('TC-R04 a student can view their own request', async () => {
    const res = await api()
      .get(`/api/requests/${requestId}`)
      .set('Authorization', `Bearer ${tokens.studentToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.request.id, requestId);
    assert.equal(res.body.updates.length, 1);
  });

  test('TC-R05 a student cannot view another student request', async () => {
    const res = await api()
      .get(`/api/requests/${requestId}`)
      .set('Authorization', `Bearer ${tokens.otherStudentToken}`);
    assert.equal(res.status, 404);
  });

  test('TC-R06 maintenance personnel can see the open request queue', async () => {
    const res = await api()
      .get('/api/requests?scope=open')
      .set('Authorization', `Bearer ${tokens.maintenanceToken}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.requests.some((r) => r.id === requestId));
    assert.ok(res.body.requests[0].priority_score > 0);
  });

  test('TC-R07 maintenance personnel can assign a request to themselves', async () => {
    const res = await api()
      .post(`/api/requests/${requestId}/assign`)
      .set('Authorization', `Bearer ${tokens.maintenanceToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.request.status, 'Assigned');
    assert.equal(res.body.request.assigned_name, 'Test Electrician');
  });

  test('TC-R08 a second worker cannot take over an assigned request', async () => {
    const res = await api()
      .post(`/api/requests/${requestId}/assign`)
      .set('Authorization', `Bearer ${tokens.plumberToken}`);
    assert.equal(res.status, 409);
  });

  test('TC-R09 the assigned worker moves the request through the workflow', async () => {
    const inProgress = await api()
      .patch(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${tokens.maintenanceToken}`)
      .send({ status: 'In Progress' });
    assert.equal(inProgress.status, 200);
    assert.equal(inProgress.body.request.status, 'In Progress');

    const note = await api()
      .post(`/api/requests/${requestId}/updates`)
      .set('Authorization', `Bearer ${tokens.maintenanceToken}`)
      .send({ comment: 'Checked the light fitting. Replacement bulb required.' });
    assert.equal(note.status, 201);

    const completed = await api()
      .patch(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${tokens.maintenanceToken}`)
      .send({ status: 'Completed', comment: 'Replaced damaged light fitting.' });
    assert.equal(completed.status, 200);
    assert.equal(completed.body.request.status, 'Completed');
    assert.ok(completed.body.request.completed_at);

    // The student sees the full history.
    const studentView = await api()
      .get(`/api/requests/${requestId}`)
      .set('Authorization', `Bearer ${tokens.studentToken}`);
    assert.equal(studentView.body.request.status, 'Completed');
    assert.equal(studentView.body.updates.length, 5);
  });

  test('TC-R10 an invalid status jump is rejected', async () => {
    const created = await api()
      .post('/api/requests')
      .set('Authorization', `Bearer ${tokens.studentToken}`)
      .send({
        category_id: categoryId('Plumbing'),
        residence: 'Student Village',
        room: 'B12',
        description: 'The bathroom tap is leaking badly.',
        urgency: 'Medium'
      });

    const res = await api()
      .patch(`/api/requests/${created.body.request.id}/status`)
      .set('Authorization', `Bearer ${tokens.maintenanceToken}`)
      .send({ status: 'Completed' });
    assert.equal(res.status, 403); // not assigned to this worker yet
  });

  test('TC-R11 the student dashboard returns counts and recent requests', async () => {
    const res = await api()
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${tokens.studentToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.role, 'student');
    assert.equal(res.body.counts.total, 2);
    assert.ok(Array.isArray(res.body.recent));
  });
});
