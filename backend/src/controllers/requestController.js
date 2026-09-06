/**
 * Maintenance requests: create, list, view, assign, update status, add notes.
 *
 * Authorisation rules enforced here:
 *   - a student may only create requests for themselves
 *   - a student may only read their OWN requests
 *   - a student may never change a status or assign work
 *   - maintenance staff may read all requests (they need the location and
 *     description to do the job) and are the only ones who can assign,
 *     change a status, or add a progress note
 *   - a request can only be updated by the person it is assigned to
 */
import fs from 'node:fs';
import path from 'node:path';
import { requestModel, updateModel, categoryModel } from '../models/requestModel.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config.js';
import { discardUpload } from '../middleware/upload.js';
import { prioritise } from '../services/priority.js';
import { statusCounts, averageResolutionHours } from '../services/metrics.js';
import {
  requireString,
  requireUrgency,
  requireResidence,
  requireRoom,
  requirePositiveInt,
  requireOneOf
} from '../utils/validation.js';
import { STATUSES, URGENCIES, ALLOWED_TRANSITIONS, OPEN_STATUSES } from '../utils/constants.js';

/** Shape a database row into the JSON the frontend expects. */
function toJson(row, { includeStudent }) {
  const base = {
    id: row.id,
    category: row.category,
    category_id: row.category_id,
    residence: row.residence,
    room: row.room,
    description: row.description,
    urgency: row.urgency,
    status: row.status,
    has_image: !!row.image_path,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at,
    assigned_to: row.assigned_to,
    assigned_name: row.assigned_name,
    assigned_trade: row.assigned_trade
  };
  if (includeStudent) {
    base.student_id = row.student_id;
    base.student_name = row.student_name;
    base.student_email = row.student_email;
  }
  return base;
}

function loadRequestForUser(id, user) {
  const row = requestModel.findById(id);
  if (!row) throw ApiError.notFound();
  if (user.role === 'student' && row.student_id !== user.id) {
    // A student asking for someone else's request is told it was not found,
    // so the API does not leak which request ids exist.
    throw ApiError.notFound();
  }
  return row;
}

/* -------------------------------------------------------------- categories */

export function listCategories(req, res) {
  res.json({ categories: categoryModel.all() });
}

/* ------------------------------------------------------------------ create */

export function createRequest(req, res) {
  try {
    const categoryId = requirePositiveInt(req.body.category_id, 'category');
    if (!categoryModel.findById(categoryId)) throw ApiError.badRequest('Please choose a valid category.');

    const residence = requireResidence(req.body.residence);
    const room = requireRoom(req.body.room);
    const description = requireString(req.body.description, 'a description', { min: 10, max: 1000 });
    const urgency = requireUrgency(req.body.urgency);

    const created = requestModel.create({
      studentId: req.user.id, // taken from the token, never from the form
      categoryId,
      residence,
      room,
      description,
      urgency,
      imagePath: req.file ? req.file.filename : null
    });

    updateModel.add({
      requestId: created.id,
      maintenanceUserId: null,
      status: 'Submitted',
      comment: 'Request submitted by student.'
    });

    res.status(201).json({ request: toJson(created, { includeStudent: true }) });
  } catch (err) {
    discardUpload(req.file); // do not leave an orphan file behind
    throw err;
  }
}

/* -------------------------------------------------------------------- list */

export function listRequests(req, res) {
  const { status, urgency, category_id: categoryId, scope, sort } = req.query;

  const filters = {};
  if (status) filters.status = requireOneOf(status, STATUSES, 'status');
  if (urgency) filters.urgency = requireUrgency(urgency);
  if (categoryId) filters.categoryId = requirePositiveInt(categoryId, 'category');

  if (req.user.role === 'student') {
    filters.studentId = req.user.id; // students always see only their own
  } else if (scope === 'mine') {
    filters.assignedTo = req.user.id;
  } else if (scope === 'open') {
    filters.statusIn = OPEN_STATUSES;
  }

  let rows = requestModel.list(filters);

  // The maintenance work queue is ordered by the prioritisation algorithm.
  if (req.user.role === 'maintenance' && sort !== 'newest') {
    rows = prioritise(rows);
  }

  res.json({
    requests: rows.map((row) => ({
      ...toJson(row, { includeStudent: req.user.role === 'maintenance' }),
      ...(row.priority_score !== undefined ? { priority_score: row.priority_score } : {})
    }))
  });
}

/* ------------------------------------------------------------------ detail */

export function getRequest(req, res) {
  const id = requirePositiveInt(req.params.id, 'request');
  const row = loadRequestForUser(id, req.user);

  res.json({
    request: toJson(row, { includeStudent: true }),
    updates: updateModel.listForRequest(id)
  });
}

/* ------------------------------------------------------------------- image */

export function getRequestImage(req, res) {
  const id = requirePositiveInt(req.params.id, 'request');
  const row = loadRequestForUser(id, req.user);
  if (!row.image_path) throw ApiError.notFound('No photo was uploaded for this request.');

  // path.basename() blocks any attempt at directory traversal.
  const filePath = path.join(config.uploadDir, path.basename(row.image_path));
  if (!fs.existsSync(filePath)) throw ApiError.notFound('The photo is no longer available.');

  res.sendFile(filePath);
}

/* ------------------------------------------------------------------ assign */

export function assignRequest(req, res) {
  const id = requirePositiveInt(req.params.id, 'request');
  const row = requestModel.findById(id);
  if (!row) throw ApiError.notFound();

  if (row.assigned_to && row.assigned_to !== req.user.id) {
    throw ApiError.conflict(`This request is already assigned to ${row.assigned_name}.`);
  }
  if (['Completed', 'Closed'].includes(row.status)) {
    throw ApiError.badRequest('This request is already finished.');
  }

  const updated = requestModel.assign(id, req.user.id);
  updateModel.add({
    requestId: id,
    maintenanceUserId: req.user.id,
    status: 'Assigned',
    comment: `Assigned to ${req.user.name}${req.user.trade ? ` (${req.user.trade})` : ''}.`
  });

  res.json({
    request: toJson(updated, { includeStudent: true }),
    updates: updateModel.listForRequest(id)
  });
}

/* ------------------------------------------------------------------ status */

export function updateStatus(req, res) {
  const id = requirePositiveInt(req.params.id, 'request');
  const status = requireOneOf(req.body.status, STATUSES, 'status');
  const comment =
    req.body.comment === undefined || req.body.comment === ''
      ? null
      : requireString(req.body.comment, 'a note', { max: 500 });

  const row = requestModel.findById(id);
  if (!row) throw ApiError.notFound();

  if (row.assigned_to !== req.user.id) {
    throw ApiError.forbidden('You can only update a request that is assigned to you.');
  }
  if (!ALLOWED_TRANSITIONS[row.status].includes(status)) {
    throw ApiError.badRequest(`A request cannot go from "${row.status}" to "${status}".`);
  }

  const updated = requestModel.setStatus(id, status);
  updateModel.add({
    requestId: id,
    maintenanceUserId: req.user.id,
    status,
    comment: comment || `Status changed to ${status}.`
  });

  res.json({
    request: toJson(updated, { includeStudent: true }),
    updates: updateModel.listForRequest(id)
  });
}

/* -------------------------------------------------------------- progress note */

export function addNote(req, res) {
  const id = requirePositiveInt(req.params.id, 'request');
  const comment = requireString(req.body.comment, 'a note', { min: 3, max: 500 });

  const row = requestModel.findById(id);
  if (!row) throw ApiError.notFound();
  if (row.assigned_to !== req.user.id) {
    throw ApiError.forbidden('You can only add a note to a request that is assigned to you.');
  }

  updateModel.add({ requestId: id, maintenanceUserId: req.user.id, status: null, comment });
  requestModel.touch(id);

  res.status(201).json({
    request: toJson(requestModel.findById(id), { includeStudent: true }),
    updates: updateModel.listForRequest(id)
  });
}

/* --------------------------------------------------------------- dashboard */

export function dashboard(req, res) {
  if (req.user.role === 'student') {
    const counts = statusCounts({ studentId: req.user.id });
    const recent = requestModel
      .list({ studentId: req.user.id })
      .slice(0, 5)
      .map((row) => toJson(row, { includeStudent: false }));
    return res.json({ role: 'student', counts, recent });
  }

  const all = statusCounts();
  const mine = statusCounts({ assignedTo: req.user.id });
  const queue = prioritise(requestModel.list({ statusIn: OPEN_STATUSES }))
    .slice(0, 5)
    .map((row) => ({ ...toJson(row, { includeStudent: true }), priority_score: row.priority_score }));

  res.json({
    role: 'maintenance',
    counts: {
      open: all.open,
      assigned_to_me: mine.Assigned + mine['In Progress'],
      in_progress: all['In Progress'],
      completed: all.Completed + all.Closed,
      total: all.total
    },
    average_resolution_hours: averageResolutionHours(),
    queue
  });
}

/* -------------------------------------------------------------- reference data */

export function referenceData(req, res) {
  res.json({
    categories: categoryModel.all(),
    urgencies: URGENCIES,
    statuses: STATUSES
  });
}
