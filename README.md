# Residence Maintenance - University of Fort Hare

A web application that lets a student in a university residence report a maintenance fault and
follow it until it is fixed, and lets the tradesperson who will actually do the job pick it up
and update it. There is no help desk, no supervisor and no administrator in between: the system
itself is the link between the student and the tradesperson.

Students sign in with their university email address - their student number followed by
`@ufh.ac.za`. Maintenance accounts are issued by Facilities Management rather than
self-registered.

---

## The idea in one line

```
STUDENT -> REPORTS PROBLEM -> MAINTENANCE WORKER TAKES IT -> WORKER UPDATES STATUS -> STUDENT SEES THE UPDATE
```

---

## What you need

- **Node.js 20 or 22 LTS** and npm. Check with `node -v`.
  On Node 24 the SQLite driver needs `npm install better-sqlite3@latest` in the backend folder
  first, because the pinned version has no prebuilt binary for that release.
- Nothing else. No Docker, no database server, no cloud account. The database is a single
  SQLite file created on first run.

---

## Installation and running

Open **two terminals**, one for the backend and one for the frontend.

### Terminal 1 - backend (API server, port 4000)

```bash
cd backend
npm install
cp .env.example .env      # Windows PowerShell: copy .env.example .env
npm run seed              # creates the database and the demo data
npm run dev
```

You should see `Listening on http://localhost:4000`.

### Terminal 2 - frontend (React app, port 5173)

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in a browser.

### Other useful commands

| Command | Where | What it does |
|---|---|---|
| `npm run dev` | backend | Starts the API with auto-restart on file changes |
| `npm start` | backend | Starts the API without auto-restart |
| `npm run seed` | backend | Adds demo data (does nothing if data already exists) |
| `npm run reset` | backend | Wipes all data and reseeds it |
| `npm test` | backend | Runs the 29 automated tests |
| `npm run build` | frontend | Builds the production bundle into `frontend/dist` |

---

## Sample accounts

`npm run seed` creates these accounts, along with six sample faults across all five statuses, so
the portal can be opened and demonstrated straight after installation. The people are invented
and no real student data is used. **Replace or remove them before the portal is opened to real
users** - see "Before going live" below.

| Role | Email | Password |
|---|---|---|
| Student (Student Village, room B12) | `202412345@ufh.ac.za` | `Student123!` |
| Student (Student Village, room C04) | `202412678@ufh.ac.za` | `Student123!` |
| Student (Residence A, room A15) | `202413902@ufh.ac.za` | `Student123!` |
| Electrician | `electrician@ufh.ac.za` | `Maintenance123!` |
| Plumber | `plumber@ufh.ac.za` | `Maintenance123!` |
| Network technician | `network@ufh.ac.za` | `Maintenance123!` |
| General maintenance | `generalmaintenance@ufh.ac.za` | `Maintenance123!` |

Students register themselves; the registration form requires a nine-digit student number
followed by `@ufh.ac.za`. Maintenance accounts are created by Facilities Management, which in
this build means the seed script.

---

## The workflow

1. A student signs in and logs a fault: category, residence, room, urgency, description and
   optionally a photo. It starts at **Submitted**.
2. It appears on the maintenance work queue, sorted by the prioritisation algorithm.
3. A tradesperson opens it and presses **Assign to me**. Status becomes **Assigned**.
4. They press **Start work**. Status becomes **In Progress**.
5. They add progress notes, e.g. *"Checked the light fitting. Replacement bulb required."*
6. They press **Mark as completed**. Status becomes **Completed** and the completion time is
   recorded.
7. The student opens the fault and sees every step in the history.

A request can only move forward: Submitted → Assigned → In Progress → Completed → Closed. Any
other jump is rejected by the backend.

---

## Project structure

```
ufh-residence-maintenance/
├── backend/                   Node.js + Express REST API
│   ├── src/
│   │   ├── config.js          Environment configuration
│   │   ├── app.js             Express app (middleware + routes)
│   │   ├── server.js          Starts the server
│   │   ├── db/                Connection, schema.sql, seed.js
│   │   ├── models/            All SQL lives here
│   │   ├── controllers/       Request handling and authorisation rules
│   │   ├── routes/            REST endpoints
│   │   ├── middleware/        auth, file upload, error handling
│   │   ├── services/          priority algorithm, dashboard metrics
│   │   └── utils/             validation, constants, error class
│   ├── tests/                 29 automated tests
│   ├── database/              SQLite file (created on first run)
│   └── uploads/               Uploaded photos (created on first run)
│
├── frontend/                  React + Vite single-page application
│   └── src/
│       ├── api.js             fetch wrapper for the REST API
│       ├── App.jsx            Routing and route guards
│       ├── context/           Logged-in user state
│       ├── components/        Layout, table, badges, timeline
│       ├── pages/             Login, Register, Dashboard, lists, detail, profile
│       └── styles/app.css     All styling
│
├── docs/diagrams/             Use case, class, ER, activity, sequence, architecture
├── ARCHITECTURE.md            How the parts fit together
├── DATABASE.md                Tables, relationships, CRUD
├── SECURITY.md                Every security measure and where it lives
├── ALGORITHMS.md              The prioritisation algorithm
├── NETWORK.md                 Client-server, HTTP, REST, ports, deployment
├── TESTING.md                 Test cases and results
├── USER_GUIDE.md              How to use the portal
└── API.md                     Full API reference
```

---

## The six required focus areas

| Area | Where it lives |
|---|---|
| **Algorithms** | `backend/src/services/priority.js` - urgency + ageing priority queue. See ALGORITHMS.md |
| **Database** | `backend/src/db/schema.sql`, `backend/src/models/` - 4 tables, foreign keys, full CRUD. See DATABASE.md |
| **Models** | `docs/diagrams/` - use case, class, ER, activity, sequence, architecture |
| **Software documentation** | The nine markdown documents in this folder |
| **Networks** | Client-server over HTTP, REST API on port 4000, SPA on port 5173. See NETWORK.md |
| **Security** | JWT, bcrypt, role-based access control, validation, upload rules. See SECURITY.md |

---

## Interface

The design follows the university's institutional colours - deep navy, sky blue and gold - with
Sora for headings and Inter for body text, loaded from Google Fonts with a system fallback if
the network is unavailable. Motion is used sparingly: a slow drift on the sign-in photograph,
counters that count up once on the dashboard, entries that fade into the history timeline, and
skeleton placeholders while data loads. All of it is disabled automatically for anyone who has
"reduce motion" switched on.

Photographs live in `frontend/public/images/` and can be swapped for real residence photographs
by replacing the files and keeping the names.

The emblem in the top bar is a mark drawn for this service in `components/Ui.jsx`, not the
university crest. The crest is a registered university mark: once Communications or Facilities
Management approves its use, save the file into `frontend/public/images/` and replace the
`<Emblem />` component with an `<img>` tag - nothing else needs to change.

## Before going live

1. Get written approval from Facilities Management / Residence Life before the portal is used by
   real students, and approval from Communications before the university crest is applied.
2. Delete the sample accounts and faults (`npm run reset` on an empty seed, or clear the tables)
   and issue real maintenance accounts.
3. Set a long random `JWT_SECRET` and run with `NODE_ENV=production`.
4. Serve over HTTPS behind a reverse proxy and set `CORS_ORIGIN` to the real hostname
   (see NETWORK.md).
5. Agree a data retention position with the university for the photographs students upload.

## Known limitations

See the end of ARCHITECTURE.md for the full list; the main ones are: no email or SMS
notification, no password reset, HTTP rather than HTTPS in development, SQLite instead of a
networked database server, and maintenance accounts that can only be created by the seed script.
The portal validates the format of a student email address but does not check it against the
university's own directory, so account creation is not tied to real enrolment records.
