/** Date/label helpers shared by several screens. */

/** Accepts ISO timestamps from Supabase and "YYYY-MM-DD HH:MM:SS" (treated as UTC). */
export function parseTimestamp(value) {
  if (!value) return null;
  const iso = value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** e.g. "10 Aug 2026, 11:05" */
export function formatDateTime(value) {
  const date = parseTimestamp(value);
  if (!date) return '-';
  return date.toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** e.g. "10 Aug 2026" */
export function formatDate(value) {
  const date = parseTimestamp(value);
  if (!date) return '-';
  return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** e.g. "2 days ago" */
export function timeAgo(value) {
  const date = parseTimestamp(value);
  if (!date) return '';
  const hours = (Date.now() - date.getTime()) / 3600000;
  if (hours < 1) return 'less than an hour ago';
  if (hours < 24) return `${Math.floor(hours)} hour${Math.floor(hours) === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** Hours as a readable duration, used for the average resolution time. */
export function formatHours(hours) {
<<<<<<< HEAD
  if (!hours) return 'no completed requests yet';
  if (hours < 24) return `${Math.max(1, Math.round(hours))} hours`;
=======
  if (hours === null || hours === undefined) return 'no completed requests yet';
  if (hours < 1) return 'under an hour';
  if (hours < 24) return `${Math.round(hours)} hour${Math.round(hours) === 1 ? '' : 's'}`;
>>>>>>> e1ffca59a6f9db1e59e2fd35f5a3ed2d7d7cf2fd
  return `${(hours / 24).toFixed(1)} days`;
}
