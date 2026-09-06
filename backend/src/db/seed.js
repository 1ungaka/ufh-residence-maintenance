/**
 * Seed the database with sample residences, staff and faults so the portal can
 * be run and demonstrated immediately.
 *
 * Run:  npm run seed          (adds demo data if the database is empty)
 *       npm run reset         (wipes the tables first, then seeds again)
 *
 * The people below are invented. No real student information is used.
 */
import bcrypt from 'bcryptjs';
import { db, initSchema } from './index.js';
import { CATEGORIES } from '../utils/constants.js';

const reset = process.argv.includes('--reset');

initSchema();

if (reset) {
  db.exec(`
    DELETE FROM request_updates;
    DELETE FROM maintenance_requests;
    DELETE FROM users;
    DELETE FROM categories;
    DELETE FROM sqlite_sequence;
  `);
  console.log('Existing data cleared.');
}

const existing = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if (existing > 0) {
  console.log(`Database already contains ${existing} users. Nothing seeded.`);
  console.log('Use "npm run reset" to wipe and reseed.');
  process.exit(0);
}

/* ---------------------------------------------------------------- categories */
const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
for (const name of CATEGORIES) insertCategory.run(name);

const categoryId = (name) =>
  db.prepare('SELECT id FROM categories WHERE name = ?').get(name).id;

/* -------------------------------------------------------------------- users */
const insertUser = db.prepare(`
  INSERT INTO users (name, email, password_hash, role, trade, residence, room)
  VALUES (@name, @email, @password_hash, @role, @trade, @residence, @room)
`);

const hash = (plain) => bcrypt.hashSync(plain, 10);

// Demo people. The names are invented; no real student information is used.
const students = [
  { name: 'Aphiwe Ndlela', email: '202412345@ufh.ac.za', password: 'Student123!', residence: 'Student Village', room: 'B12' },
  { name: 'Zintle Mabaso', email: '202412678@ufh.ac.za', password: 'Student123!', residence: 'Student Village', room: 'C04' },
  { name: 'Katlego Sithole', email: '202413902@ufh.ac.za', password: 'Student123!', residence: 'Residence A', room: 'A15' }
];

const maintenance = [
  { name: 'Thabo Mahlangu', email: 'electrician@ufh.ac.za', password: 'Maintenance123!', trade: 'Electrician' },
  { name: 'Nomsa Dlamini', email: 'plumber@ufh.ac.za', password: 'Maintenance123!', trade: 'Plumber' },
  { name: 'Sipho Khumalo', email: 'network@ufh.ac.za', password: 'Maintenance123!', trade: 'Network Technician' },
  { name: 'Lerato Pule', email: 'generalmaintenance@ufh.ac.za', password: 'Maintenance123!', trade: 'General Maintenance' }
];

for (const s of students) {
  insertUser.run({
    name: s.name,
    email: s.email,
    password_hash: hash(s.password),
    role: 'student',
    trade: null,
    residence: s.residence,
    room: s.room
  });
}

for (const m of maintenance) {
  insertUser.run({
    name: m.name,
    email: m.email,
    password_hash: hash(m.password),
    role: 'maintenance',
    trade: m.trade,
    residence: null,
    room: null
  });
}

const userId = (email) => db.prepare('SELECT id FROM users WHERE email = ?').get(email).id;

/* ----------------------------------------------------------------- requests */
const insertRequest = db.prepare(`
  INSERT INTO maintenance_requests
    (student_id, category_id, residence, room, description, urgency, status,
     assigned_to, image_path, created_at, updated_at, completed_at)
  VALUES
    (@student_id, @category_id, @residence, @room, @description, @urgency, @status,
     @assigned_to, @image_path, @created_at, @updated_at, @completed_at)
`);

const insertUpdate = db.prepare(`
  INSERT INTO request_updates (request_id, maintenance_user_id, status, comment, created_at)
  VALUES (@request_id, @maintenance_user_id, @status, @comment, @created_at)
`);

/** Helper: an ISO-like timestamp N hours in the past, in the format SQLite writes. */
const hoursAgo = (h) =>
  new Date(Date.now() - h * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19);

const demoRequests = [
  {
    student: '202412345@ufh.ac.za',
    category: 'Electrical',
    residence: 'Student Village',
    room: 'B12',
    description: 'Room light is not working. The bulb was replaced but it still does not switch on.',
    urgency: 'High',
    status: 'Submitted',
    assignedTo: null,
    createdHoursAgo: 30,
    updates: [{ hoursAgo: 30, by: null, status: 'Submitted', comment: 'Request submitted by student.' }]
  },
  {
    student: '202412678@ufh.ac.za',
    category: 'Plumbing',
    residence: 'Student Village',
    room: 'C04',
    description: 'Bathroom tap is leaking continuously and water is running onto the floor.',
    urgency: 'Medium',
    status: 'In Progress',
    assignedTo: 'plumber@ufh.ac.za',
    createdHoursAgo: 20,
    completedHoursAgo: null,
    updates: [
      { hoursAgo: 20, by: null, status: 'Submitted', comment: 'Request submitted by student.' },
      { hoursAgo: 18, by: 'plumber@ufh.ac.za', status: 'Assigned', comment: 'Assigned to Nomsa Dlamini (Plumber).' },
      { hoursAgo: 17, by: 'plumber@ufh.ac.za', status: 'In Progress', comment: 'Inspected the tap. A new washer is needed from stores.' }
    ]
  },
  {
    student: '202413902@ufh.ac.za',
    category: 'Wi-Fi / Network',
    residence: 'Residence A',
    room: 'A15',
    description: 'Residence Wi-Fi is unavailable in the whole of the first floor since Monday evening.',
    urgency: 'High',
    status: 'Completed',
    assignedTo: 'network@ufh.ac.za',
    createdHoursAgo: 72,
    completedHoursAgo: 60,
    updates: [
      { hoursAgo: 72, by: null, status: 'Submitted', comment: 'Request submitted by student.' },
      { hoursAgo: 70, by: 'network@ufh.ac.za', status: 'Assigned', comment: 'Assigned to Sipho Khumalo (Network Technician).' },
      { hoursAgo: 68, by: 'network@ufh.ac.za', status: 'In Progress', comment: 'Access point on the first floor is offline. Checking the switch port.' },
      { hoursAgo: 60, by: 'network@ufh.ac.za', status: 'Completed', comment: 'Access point replaced and tested. Wi-Fi is back on the first floor.' }
    ]
  },
  {
    student: '202412345@ufh.ac.za',
    category: 'Furniture',
    residence: 'Student Village',
    room: 'B12',
    description: 'The study desk drawer is broken and cannot close.',
    urgency: 'Low',
    status: 'Submitted',
    assignedTo: null,
    createdHoursAgo: 96,
    updates: [{ hoursAgo: 96, by: null, status: 'Submitted', comment: 'Request submitted by student.' }]
  },
  {
    student: '202412678@ufh.ac.za',
    category: 'Door / Lock',
    residence: 'Student Village',
    room: 'C04',
    description: 'Room door lock does not turn properly, the door cannot be locked from outside.',
    urgency: 'High',
    status: 'Assigned',
    assignedTo: 'generalmaintenance@ufh.ac.za',
    createdHoursAgo: 6,
    updates: [
      { hoursAgo: 6, by: null, status: 'Submitted', comment: 'Request submitted by student.' },
      { hoursAgo: 4, by: 'generalmaintenance@ufh.ac.za', status: 'Assigned', comment: 'Assigned to Lerato Pule (General Maintenance).' }
    ]
  },
  {
    student: '202413902@ufh.ac.za',
    category: 'Water',
    residence: 'Residence A',
    room: 'A15',
    description: 'No hot water in the shared bathroom on the ground floor.',
    urgency: 'Medium',
    status: 'Submitted',
    assignedTo: null,
    createdHoursAgo: 48,
    updates: [{ hoursAgo: 48, by: null, status: 'Submitted', comment: 'Request submitted by student.' }]
  }
];

const seedAll = db.transaction(() => {
  for (const r of demoRequests) {
    const created = hoursAgo(r.createdHoursAgo);
    const lastUpdate = r.updates[r.updates.length - 1];
    const info = insertRequest.run({
      student_id: userId(r.student),
      category_id: categoryId(r.category),
      residence: r.residence,
      room: r.room,
      description: r.description,
      urgency: r.urgency,
      status: r.status,
      assigned_to: r.assignedTo ? userId(r.assignedTo) : null,
      image_path: null,
      created_at: created,
      updated_at: hoursAgo(lastUpdate.hoursAgo),
      completed_at: r.completedHoursAgo ? hoursAgo(r.completedHoursAgo) : null
    });

    for (const u of r.updates) {
      insertUpdate.run({
        request_id: info.lastInsertRowid,
        maintenance_user_id: u.by ? userId(u.by) : null,
        status: u.status,
        comment: u.comment,
        created_at: hoursAgo(u.hoursAgo)
      });
    }
  }
});

seedAll();

console.log('Sample data created.');
console.log('---------------------------------------------------------');
console.log('STUDENT       202412345@ufh.ac.za          / Student123!');
console.log('ELECTRICIAN   electrician@ufh.ac.za        / Maintenance123!');
console.log('PLUMBER       plumber@ufh.ac.za            / Maintenance123!');
console.log('NETWORK       network@ufh.ac.za            / Maintenance123!');
console.log('GENERAL       generalmaintenance@ufh.ac.za / Maintenance123!');
console.log('---------------------------------------------------------');
console.log('Test accounts for the seeded database. Replace them before');
console.log('the portal is opened to real users (see README).');
