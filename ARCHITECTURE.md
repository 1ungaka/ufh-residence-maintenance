# Architecture

## Overview

The portal is a classic three-tier web application: a browser-based client, an application
server, and a database.

```
+---------------------------+
|  Client (browser)         |   React single-page app, port 5173 in development
|  Student or worker        |
+------------+--------------+
             | HTTP requests carrying a JWT in the Authorization header
             v
+---------------------------+
|  Application server       |   Node.js + Express REST API, port 4000
|  Routing, authorisation,  |
|  validation, algorithm    |
+------------+--------------+
             | SQL through prepared statements
             v
+---------------------------+
|  Database                 |   SQLite file: backend/database/maintenance.db
+---------------------------+
```

The full picture, including where each security control sits, is in
`docs/diagrams/architecture-diagram.md`.

## Why these choices

| Decision | Reason |
|---|---|
| React + Vite | Component reuse (one request table serves both roles), instant reload while developing, one command to run |
| Node.js + Express | Same language on both sides, small readable route files, no build step on the server |
| SQLite | A real relational database with foreign keys, but it is one file - nothing to install, easy to hand in and easy to demonstrate |
| JWT | Stateless authentication: the server does not keep session state, which keeps the code short and makes the request/response cycle easy to explain |
| Plain CSS | No framework to explain; every rule in the stylesheet is ours, which also makes matching the university's navy, sky-blue and gold identity straightforward |

## Backend layers

Requests flow through the backend in one direction, which keeps each file's job clear:

```
routes/  ->  middleware/  ->  controllers/  ->  models/  ->  database
                              services/
```

- **routes/index.js** maps a URL and HTTP verb to a controller function and declares which
  middleware must run first (`authenticate`, `requireRole`, `uploadPhoto`).
- **middleware/** contains the cross-cutting concerns: verifying the token, loading the user,
  checking the role, accepting an uploaded file, and converting any thrown error into a clean
  JSON response.
- **controllers/** hold the application rules: who may do what, which status changes are legal,
  what the response should contain. Controllers never write SQL.
- **models/** contain every SQL statement in the project. Each one is a prepared statement with
  bound parameters.
- **services/** hold logic that is neither routing nor storage: the prioritisation algorithm and
  the dashboard metrics.

An error thrown anywhere in that chain is caught by `errorHandler`, which sends a short readable
message to the browser and keeps the technical detail in the server log.

## Frontend structure

- `App.jsx` declares the routes and wraps them in guards. `RequireAuth` redirects anyone without
  a session to the login page; `RequireRole` keeps students out of maintenance-only screens.
  These guards are for usability only - the backend enforces the same rules independently.
- `context/AuthContext.jsx` holds the logged-in user. On page load it checks the stored token
  against `GET /auth/me`, so an expired token logs the person out instead of showing a broken
  screen. Any 401 from the API fires a `ufh:session-expired` event that clears the user.
- `api.js` is the only file that talks to the network. Every call attaches the token and turns a
  failure into a readable message.
- `pages/` are the screens; `components/` are the shared pieces (layout and navigation, request
  table, status badges, update timeline).

One page often serves both roles. `Dashboard.jsx` renders a student or maintenance view from the
same endpoint, and `RequestList.jsx` is used for "My requests", "All requests" and "My assigned
jobs" with different parameters. This keeps the app to seven screens instead of twenty.

## Request lifecycle example

A worker pressing **Start work** on request 12:

1. The browser sends `PATCH /api/requests/12/status` with `{"status":"In Progress"}` and the
   Authorization header.
2. `authenticate` verifies the token signature and expiry, then loads the user from the database.
3. `requireRole('maintenance')` confirms the role. A student's token stops here with 403.
4. `updateStatus` in the controller validates the status value, loads the request, checks that it
   is assigned to this worker, and checks that In Progress is a legal next step from Assigned.
5. The model runs two statements: update the request row, insert a row into `request_updates`.
6. The controller responds with the updated request and its full history.
7. React replaces the page state, so the new status and the new history entry appear at once.

## Data flow for the student's view

The student's browser never queries the database directly and never receives another student's
data. `GET /api/requests` adds `WHERE student_id = ?` from the token; `GET /api/requests/:id`
returns 404 (not 403) for another student's request, so the API does not reveal which request
ids exist.

## Current limitations

- **No notifications.** The student must open the portal to see an update; there is no email or
  SMS.
- **No password reset.** There is no mail server, so a forgotten password means a new account.
- **HTTP in development.** HTTPS would be terminated by a reverse proxy in a real deployment
  (see NETWORK.md).
- **SQLite, single server.** Fine for a residence-sized workload and for the demonstration, but a
  production deployment across several residences would move to PostgreSQL.
- **Maintenance accounts are seeded.** There is no screen for creating a staff account, because
  adding one would have meant adding an administrator role that the workflow deliberately avoids.
  Facilities Management would need a small internal tool, or a line in the seed script, to issue
  accounts.
- **Registration checks the email format, not the student record.** See SECURITY.md.
- **No scheduled jobs.** Ageing is calculated when the queue is requested, not by a background
  task.
- **Photos are stored on the server's disk**, so the uploads folder must be backed up separately
  from the database file.
