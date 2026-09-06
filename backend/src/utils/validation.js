/**
 * Small hand-written validation helpers.
 *
 * Every value that arrives from a browser is validated here before it reaches
 * the database layer: type, length, and (where relevant) membership of a fixed
 * list of allowed values.
 */
import { ApiError } from './ApiError.js';
import { URGENCIES, RESIDENCES } from './constants.js';
import { config } from '../config.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireString(value, field, { min = 1, max = 255 } = {}) {
  if (typeof value !== 'string' || value.trim().length < min) {
    throw ApiError.badRequest(`Please provide ${field}.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw ApiError.badRequest(`${field} must be ${max} characters or fewer.`);
  }
  return trimmed;
}

export function requireEmail(value) {
  const email = requireString(value, 'an email address', { max: 120 }).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw ApiError.badRequest('Please enter a valid email address.');
  }
  return email;
}

/**
 * Student accounts must use the university address format: a student number
 * followed by the university domain, e.g. 202412345@ufh.ac.za.
 */
export function requireStudentEmail(value) {
  const email = requireEmail(value);
  const pattern = new RegExp(`^\\d{9}@${config.studentEmailDomain.replace(/\./g, '\\.')}$`);
  if (!pattern.test(email)) {
    throw ApiError.badRequest(
      `Use your university email address: your student number followed by @${config.studentEmailDomain}.`
    );
  }
  return email;
}

/**
 * Password policy: at least 8 characters, containing a
 * letter and a number. Kept deliberately simple but not trivial.
 */
export function requirePassword(value) {
  if (typeof value !== 'string' || value.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters long.');
  }
  if (value.length > 100) {
    throw ApiError.badRequest('Password must be 100 characters or fewer.');
  }
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    throw ApiError.badRequest('Password must contain at least one letter and one number.');
  }
  return value;
}

export function requireOneOf(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw ApiError.badRequest(`Please choose a valid ${field}.`);
  }
  return value;
}

export function requireUrgency(value) {
  return requireOneOf(value, URGENCIES, 'urgency');
}

export function requireResidence(value) {
  const residence = requireString(value, 'a residence', { max: 80 });
  return requireOneOf(residence, RESIDENCES, 'residence');
}

/** Room numbers such as B12, C04, A15-2. Letters, digits and a hyphen only. */
export function requireRoom(value) {
  const room = requireString(value, 'a room number', { max: 12 }).toUpperCase();
  if (!/^[A-Z0-9-]{1,12}$/.test(room)) {
    throw ApiError.badRequest('Room number may contain letters, numbers and hyphens only.');
  }
  return room;
}

export function requirePositiveInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw ApiError.badRequest(`Please choose a valid ${field}.`);
  }
  return n;
}
