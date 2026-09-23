/**
 * University email formats.
 *   Students:                 <student number>@ufh.ac.za
 *   Maintenance tradespeople: <6-digit staff ID>@staff.ufh.ac.za
 */
const STUDENT_EMAIL = /^[^\s@]+@ufh\.ac\.za$/;
const STAFF_EMAIL = /^\d{6}@staff\.ufh\.ac\.za$/;

export const EMAIL_PLACEHOLDER = {
  student: '202412345@ufh.ac.za',
  maintenance: '123456@staff.ufh.ac.za'
};

export function normaliseEmail(email) {
  return email.trim().toLowerCase();
}

/** 'student', 'maintenance', or null if it matches neither format. */
export function roleForEmail(email) {
  const clean = normaliseEmail(email);
  if (STAFF_EMAIL.test(clean)) return 'maintenance';
  if (STUDENT_EMAIL.test(clean)) return 'student';
  return null;
}

/**
 * Error message for an email that doesn't fit the chosen role, or '' if it is fine.
 * Leaving `role` out accepts either format (used by password reset).
 */
export function emailError(email, role) {
  const actual = roleForEmail(email);

  if (!role) {
    return actual ? '' : 'Use your university email: 202412345@ufh.ac.za for students, or 123456@staff.ufh.ac.za for staff.';
  }
  if (actual === role) return '';

  if (role === 'student') {
    return actual === 'maintenance'
      ? 'That is a staff email. Choose "Maintenance tradesperson" above to sign in with it.'
      : 'Use your student email, for example 202412345@ufh.ac.za.';
  }
  if (normaliseEmail(email).endsWith('@staff.ufh.ac.za')) {
    return 'Staff emails start with your 6-digit staff ID, for example 123456@staff.ufh.ac.za.';
  }
  return actual === 'student'
    ? 'That is a student email. Choose "Student" above to sign in with it.'
    : 'Use your staff email: your 6-digit staff ID followed by @staff.ufh.ac.za.';
}
