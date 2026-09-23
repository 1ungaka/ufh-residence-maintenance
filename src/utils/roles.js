/**
 * Supabase accounts store their role in user_metadata.role. Staff accounts have
 * been created with a few different values over time, so every screen should
 * go through portalRole() rather than comparing the raw value.
 */
import { roleForEmail } from './emails.js';

const STAFF_ROLES = ['maintenance', 'tradesperson', 'facilities_admin', 'staff'];

/**
 * 'maintenance' for any staff account, otherwise 'student'.
 * A 6-digit @staff.ufh.ac.za email also counts as staff, whatever the metadata says.
 */
export function portalRole(user) {
  const raw = String(user?.user_metadata?.role || '').trim().toLowerCase();
  if (STAFF_ROLES.includes(raw)) return 'maintenance';
  if (user?.email && roleForEmail(user.email) === 'maintenance') return 'maintenance';
  return 'student';
}

export function isStaff(user) {
  return portalRole(user) === 'maintenance';
}
