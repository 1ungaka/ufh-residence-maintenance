/**
 * Entries in the ticket_updates table.
 *
 * The table only has a free-text update_message column, so status changes are
 * saved with a small tag in front, e.g. "[status:in_progress] Work has started."
 * The tag is stripped before anything is shown. Older entries written before
 * the tag existed ("Job assigned and claimed.", "Status changed to ...") are
 * still recognised.
 */
const TAG = /^\[status:(\w+)\]\s*/;
const LEGACY_STATUS = /^Status changed to (.+?)\.?$/i;

export const STATUS_HEADLINE = {
  logged: 'Fault logged',
  assigned: 'Job accepted',
  in_progress: 'Work started',
  resolved: 'Completed'
};

/** What gets stored in update_message for a status change. */
export function statusMessage(status, text) {
  return `[status:${status}] ${text}`.trim();
}

/** { status, text } from a stored update_message. `status` is null for plain notes. */
export function parseUpdate(message = '') {
  const tagged = message.match(TAG);
  if (tagged) return { status: tagged[1], text: message.replace(TAG, '') };

  if (/^Job assigned and claimed\.?$/i.test(message)) return { status: 'assigned', text: '' };
  const legacy = message.match(LEGACY_STATUS);
  if (legacy) return { status: legacy[1].trim().toLowerCase().replace(/\s+/g, '_'), text: '' };

  return { status: null, text: message };
}

/** Default wording when a tradesperson changes status without writing anything. */
export function defaultStatusText(status, workerName) {
  const first = (workerName || 'A tradesperson').split(' ')[0];
  if (status === 'assigned') return `${first} has accepted this job and will be in touch about a visit.`;
  if (status === 'in_progress') return `${first} has started work on this fault.`;
  if (status === 'resolved') return 'The fault has been fixed and the job is complete.';
  return '';
}
