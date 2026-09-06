/**
 * MAINTENANCE REQUEST PRIORITISATION ALGORITHM
 * See ALGORITHMS.md for the full write-up.
 *
 * Input:   a list of open maintenance requests (urgency + created_at).
 * Process: give each request a numeric priority score built from
 *            (1) how urgent it is, and
 *            (2) how long it has been waiting (ageing),
 *          then sort the list by that score, highest first.
 * Output:  the same requests ordered as a work queue for the maintenance team.
 *
 * Rules, in words:
 *   High urgency beats Medium beats Low.
 *   Within the same urgency, the oldest request is done first.
 *   A request that has waited a long time slowly climbs, so a Low-urgency
 *   request cannot be ignored forever (this is called ageing).
 */
import { URGENCY_WEIGHT } from '../utils/constants.js';

/** Base points per urgency level, spaced far enough apart to dominate ageing. */
const URGENCY_POINTS = { High: 300, Medium: 200, Low: 100 };

/** Ageing: one point per hour waited, capped so ageing can lift a request by
 *  at most one urgency band (99 points < the 100-point gap between bands). */
export const AGEING_POINTS_PER_HOUR = 1;
export const MAX_AGEING_POINTS = 99;

/** Parse the "YYYY-MM-DD HH:MM:SS" timestamps SQLite stores (UTC). */
export function parseTimestamp(value) {
  if (!value) return null;
  const iso = value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function hoursSince(timestamp, now = new Date()) {
  const date = parseTimestamp(timestamp);
  if (!date) return 0;
  return Math.max(0, (now.getTime() - date.getTime()) / 3600000);
}

/**
 * priorityScore = urgencyPoints + min(hoursWaiting, 99)
 * Higher score = attend to it sooner.
 */
export function priorityScore(request, now = new Date()) {
  const urgencyPoints = URGENCY_POINTS[request.urgency] ?? URGENCY_POINTS.Low;
  const ageing = Math.min(
    Math.floor(hoursSince(request.created_at, now) * AGEING_POINTS_PER_HOUR),
    MAX_AGEING_POINTS
  );
  return urgencyPoints + ageing;
}

/**
 * Sort a list of requests into the maintenance work queue.
 * Ties (same score) are broken by the older request first, then by id.
 * Returns a new array; the input is not modified.
 */
export function prioritise(requests, now = new Date()) {
  return requests
    .map((r) => ({ ...r, priority_score: priorityScore(r, now) }))
    .sort((a, b) => {
      if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
      const ageDiff = hoursSince(b.created_at, now) - hoursSince(a.created_at, now);
      if (ageDiff !== 0) return ageDiff; // older first
      return a.id - b.id;
    });
}

/** Exposed for the documentation/demo: explain a single score in plain words. */
export function explainScore(request, now = new Date()) {
  const hours = Math.floor(hoursSince(request.created_at, now));
  const ageing = Math.min(hours, MAX_AGEING_POINTS);
  return {
    urgency: request.urgency,
    urgency_weight: URGENCY_WEIGHT[request.urgency],
    urgency_points: URGENCY_POINTS[request.urgency],
    hours_waiting: hours,
    ageing_points: ageing,
    priority_score: URGENCY_POINTS[request.urgency] + ageing
  };
}
