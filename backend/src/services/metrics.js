/**
 * Simple dashboard metrics: counts per status and the average resolution time.
 * No machine learning, just arithmetic over the rows in the database.
 */
import { requestModel } from '../models/requestModel.js';
import { STATUSES, OPEN_STATUSES } from '../utils/constants.js';
import { hoursSince, parseTimestamp } from './priority.js';

function emptyCounts() {
  return Object.fromEntries(STATUSES.map((s) => [s, 0]));
}

export function statusCounts(filter = {}) {
  const counts = emptyCounts();
  for (const row of requestModel.countsByStatus(filter)) {
    counts[row.status] = row.n;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const open = OPEN_STATUSES.reduce((sum, s) => sum + counts[s], 0);
  return { ...counts, total, open };
}

/** Average hours between created_at and completed_at for finished requests. */
export function averageResolutionHours() {
  const rows = requestModel.completedDurations();
  if (rows.length === 0) return null;
  const totalHours = rows.reduce((sum, row) => {
    const completed = parseTimestamp(row.completed_at);
    return sum + hoursSince(row.created_at, completed);
  }, 0);
  return Math.round((totalHours / rows.length) * 10) / 10;
}
