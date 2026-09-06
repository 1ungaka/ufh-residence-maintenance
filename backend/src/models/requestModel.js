/**
 * Data access for maintenance_requests, request_updates and categories.
 *
 * The SELECTs join users and categories so that the API can return readable
 * names (student name, category name, assignee name) instead of raw ids.
 */
import { db } from '../db/index.js';

const BASE_SELECT = `
  SELECT
    r.id, r.residence, r.room, r.description, r.urgency, r.status,
    r.image_path, r.created_at, r.updated_at, r.completed_at,
    r.student_id, r.category_id, r.assigned_to,
    c.name  AS category,
    s.name  AS student_name,
    s.email AS student_email,
    m.name  AS assigned_name,
    m.trade AS assigned_trade
  FROM maintenance_requests r
  JOIN categories c ON c.id = r.category_id
  JOIN users      s ON s.id = r.student_id
  LEFT JOIN users m ON m.id = r.assigned_to
`;

export const categoryModel = {
  all() {
    return db.prepare('SELECT id, name FROM categories ORDER BY name').all();
  },
  findById(id) {
    return db.prepare('SELECT id, name FROM categories WHERE id = ?').get(id);
  }
};

export const requestModel = {
  create({ studentId, categoryId, residence, room, description, urgency, imagePath = null }) {
    const info = db
      .prepare(
        `INSERT INTO maintenance_requests
           (student_id, category_id, residence, room, description, urgency, status, image_path)
         VALUES (?, ?, ?, ?, ?, ?, 'Submitted', ?)`
      )
      .run(studentId, categoryId, residence, room, description, urgency, imagePath);
    return requestModel.findById(info.lastInsertRowid);
  },

  findById(id) {
    return db.prepare(`${BASE_SELECT} WHERE r.id = ?`).get(id);
  },

  /**
   * Flexible listing used by both dashboards.
   * Filters are appended as bound parameters, never as string concatenation.
   */
  list({ studentId = null, assignedTo = null, status = null, categoryId = null, urgency = null, statusIn = null } = {}) {
    const where = [];
    const params = [];

    if (studentId) {
      where.push('r.student_id = ?');
      params.push(studentId);
    }
    if (assignedTo) {
      where.push('r.assigned_to = ?');
      params.push(assignedTo);
    }
    if (status) {
      where.push('r.status = ?');
      params.push(status);
    }
    if (statusIn && statusIn.length) {
      where.push(`r.status IN (${statusIn.map(() => '?').join(', ')})`);
      params.push(...statusIn);
    }
    if (categoryId) {
      where.push('r.category_id = ?');
      params.push(categoryId);
    }
    if (urgency) {
      where.push('r.urgency = ?');
      params.push(urgency);
    }

    const sql =
      BASE_SELECT +
      (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
      ' ORDER BY r.created_at DESC';

    return db.prepare(sql).all(...params);
  },

  assign(requestId, maintenanceUserId) {
    db.prepare(
      `UPDATE maintenance_requests
         SET assigned_to = ?, status = 'Assigned', updated_at = datetime('now')
       WHERE id = ?`
    ).run(maintenanceUserId, requestId);
    return requestModel.findById(requestId);
  },

  setStatus(requestId, status) {
    const completedAt = status === 'Completed' ? "datetime('now')" : 'completed_at';
    db.prepare(
      `UPDATE maintenance_requests
         SET status = ?, updated_at = datetime('now'), completed_at = ${completedAt}
       WHERE id = ?`
    ).run(status, requestId);
    return requestModel.findById(requestId);
  },

  touch(requestId) {
    db.prepare(`UPDATE maintenance_requests SET updated_at = datetime('now') WHERE id = ?`).run(
      requestId
    );
  },

  /** Counts per status, optionally limited to one student or one assignee. */
  countsByStatus({ studentId = null, assignedTo = null } = {}) {
    const where = [];
    const params = [];
    if (studentId) {
      where.push('student_id = ?');
      params.push(studentId);
    }
    if (assignedTo) {
      where.push('assigned_to = ?');
      params.push(assignedTo);
    }
    const sql =
      'SELECT status, COUNT(*) AS n FROM maintenance_requests' +
      (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
      ' GROUP BY status';
    return db.prepare(sql).all(...params);
  },

  /** Completed requests with both timestamps, used for the average resolution time. */
  completedDurations() {
    return db
      .prepare(
        `SELECT created_at, completed_at
           FROM maintenance_requests
          WHERE status IN ('Completed', 'Closed') AND completed_at IS NOT NULL`
      )
      .all();
  }
};

export const updateModel = {
  add({ requestId, maintenanceUserId = null, status = null, comment }) {
    const info = db
      .prepare(
        `INSERT INTO request_updates (request_id, maintenance_user_id, status, comment)
         VALUES (?, ?, ?, ?)`
      )
      .run(requestId, maintenanceUserId, status, comment);
    return db
      .prepare(
        `SELECT u.id, u.request_id, u.status, u.comment, u.created_at,
                u.maintenance_user_id, us.name AS author_name, us.trade AS author_trade
           FROM request_updates u
           LEFT JOIN users us ON us.id = u.maintenance_user_id
          WHERE u.id = ?`
      )
      .get(info.lastInsertRowid);
  },

  listForRequest(requestId) {
    return db
      .prepare(
        `SELECT u.id, u.status, u.comment, u.created_at,
                u.maintenance_user_id, us.name AS author_name, us.trade AS author_trade
           FROM request_updates u
           LEFT JOIN users us ON us.id = u.maintenance_user_id
          WHERE u.request_id = ?
          ORDER BY u.created_at ASC, u.id ASC`
      )
      .all(requestId);
  }
};
