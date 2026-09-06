# Database

SQLite, one file at `backend/database/maintenance.db`, created automatically the first time the
backend runs. The schema is in `backend/src/db/schema.sql` and the demo data in
`backend/src/db/seed.js`.

Foreign key enforcement is switched on explicitly (`PRAGMA foreign_keys = ON`), because SQLite
leaves it off by default.

## Tables

### users

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| name | TEXT | Not null |
| email | TEXT | Not null, **unique** - the login identifier |
| password_hash | TEXT | Not null, bcrypt hash. Never a plain password |
| role | TEXT | Not null, `CHECK (role IN ('student','maintenance'))` |
| trade | TEXT | Maintenance staff only: Electrician, Plumber, ... |
| residence | TEXT | Students only |
| room | TEXT | Students only |
| created_at | TEXT | Defaults to the current time |

One table holds both roles because both log in the same way and the only difference is which
columns are used and what the role allows. A separate `students` and `staff` table would have
meant two login paths for no benefit at this size.

### categories

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| name | TEXT | Not null, unique |

Seeded with: Electrical, Plumbing, Furniture, Wi-Fi / Network, Water, Heating, Lighting,
Door / Lock, Cleaning / General Maintenance, Other.

A lookup table rather than a text column, so that the category list can change without editing
every existing request, and so the dashboard can filter by category id.

### maintenance_requests

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key, shown to users as the reference number |
| student_id | INTEGER | **FK → users(id)**, ON DELETE CASCADE |
| category_id | INTEGER | **FK → categories(id)**, ON DELETE RESTRICT |
| residence | TEXT | Not null |
| room | TEXT | Not null |
| description | TEXT | Not null |
| urgency | TEXT | `CHECK (urgency IN ('Low','Medium','High'))` |
| status | TEXT | `CHECK (status IN ('Submitted','Assigned','In Progress','Completed','Closed'))`, defaults to Submitted |
| assigned_to | INTEGER | **FK → users(id)**, nullable, ON DELETE SET NULL |
| image_path | TEXT | Filename of the uploaded photo, nullable |
| created_at | TEXT | Set on insert |
| updated_at | TEXT | Set on every change |
| completed_at | TEXT | Set when the status becomes Completed |

`residence` and `room` are stored on the request rather than read from the student's profile,
because a student can move rooms and the request must keep the location where the fault actually
was.

`ON DELETE RESTRICT` on the category stops anyone deleting a category that requests still point
at. `ON DELETE SET NULL` on `assigned_to` means that if a worker's account is removed the request
survives and simply becomes unassigned again.

### request_updates

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| request_id | INTEGER | **FK → maintenance_requests(id)**, ON DELETE CASCADE |
| maintenance_user_id | INTEGER | **FK → users(id)**, nullable (null = the student's own submission entry) |
| status | TEXT | The status this update set, or null for a plain progress note |
| comment | TEXT | Not null - the text shown in the history |
| created_at | TEXT | Set on insert |

This table is the audit trail. Nothing in it is ever updated or deleted, so the history a student
reads is exactly what happened, in order.

### Indexes

`idx_requests_student`, `idx_requests_status`, `idx_requests_assigned`, `idx_updates_request` -
these cover the four queries the dashboards run most often.

## Relationships

```
users (student)  1 ----< maintenance_requests        a student logs many requests
users (worker)   1 ----< maintenance_requests        a worker is assigned many requests
categories       1 ----< maintenance_requests        a category classifies many requests
maintenance_requests 1 ----< request_updates         a request collects many updates
users (worker)   1 ----< request_updates             a worker writes many updates
```

All relationships are one-to-many. There is no many-to-many relationship in the design, which is
why no join table is needed. The ER diagram is in `docs/diagrams/er-diagram.md`.

## CRUD operations

| Operation | Where | SQL |
|---|---|---|
| **Create** user | `userModel.create` | `INSERT INTO users ...` |
| **Create** request | `requestModel.create` | `INSERT INTO maintenance_requests ...` |
| **Create** update | `updateModel.add` | `INSERT INTO request_updates ...` |
| **Read** one request | `requestModel.findById` | `SELECT ... JOIN categories JOIN users WHERE r.id = ?` |
| **Read** filtered list | `requestModel.list` | `SELECT ... WHERE` built from bound parameters |
| **Read** counts | `requestModel.countsByStatus` | `SELECT status, COUNT(*) ... GROUP BY status` |
| **Update** assignment | `requestModel.assign` | `UPDATE maintenance_requests SET assigned_to = ?, status = 'Assigned' ...` |
| **Update** status | `requestModel.setStatus` | `UPDATE maintenance_requests SET status = ?, completed_at = ... ` |
| **Update** profile | `userModel.updateProfile` | `UPDATE users SET name = ?, residence = ?, room = ?` |
| **Delete** | seed reset only | `DELETE FROM ...` in `npm run reset` |

There is deliberately no "delete request" feature: a residence department needs the record of
what was reported, and removing rows would break the history students rely on. Finished requests
are marked Closed instead.

## Transactions

The seed script wraps its inserts in a transaction (`db.transaction(...)`) so that a failure
part-way through cannot leave half a dataset behind. Status changes write two statements (update
the request, insert the history row) inside a single synchronous request handler, so a reader
cannot observe one without the other.

## Inspecting the database

```bash
cd backend
npm run reset                      # wipe and reseed
sqlite3 database/maintenance.db    # if you have the sqlite3 CLI installed
.tables
SELECT id, room, urgency, status FROM maintenance_requests;
```

Without the CLI, any SQLite browser (for example DB Browser for SQLite) will open the file, which
is useful when demonstrating that the data really is stored relationally.
