/** Values shared by validation, the seed script and the API. */

export const CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Furniture',
  'Wi-Fi / Network',
  'Water',
  'Heating',
  'Lighting',
  'Door / Lock',
  'Cleaning / General Maintenance',
  'Other'
];

export const RESIDENCES = [
  'Student Village',
  'Residence A',
  'Residence B',
  'Wesley Residence',
  'Beda Hall',
  'Elukhanyisweni'
];

export const URGENCIES = ['Low', 'Medium', 'High'];

export const STATUSES = ['Submitted', 'Assigned', 'In Progress', 'Completed', 'Closed'];

/** Urgency weights used by the prioritisation algorithm (see ALGORITHMS.md). */
export const URGENCY_WEIGHT = { High: 3, Medium: 2, Low: 1 };

/**
 * Allowed status transitions. A request can only move forward through the
 * workflow, which keeps the history sensible and easy to explain.
 */
export const ALLOWED_TRANSITIONS = {
  Submitted: ['Assigned'],
  Assigned: ['In Progress'],
  'In Progress': ['Completed'],
  Completed: ['Closed'],
  Closed: []
};

export const OPEN_STATUSES = ['Submitted', 'Assigned', 'In Progress'];
