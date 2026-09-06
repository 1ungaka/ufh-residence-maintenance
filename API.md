# API reference

Base URL in development: `http://localhost:4000/api`

All responses are JSON. Except for `/health`, `/auth/login` and `/auth/register`, every endpoint
requires a token:

```
Authorization: Bearer <token>
```

## Status codes

| Code | Meaning in this API |
|---|---|
| 200 | Success |
| 201 | Something was created |
| 400 | Validation failed - the message says what to fix |
| 401 | No token, or the token is invalid or expired |
| 403 | Authenticated but not allowed to do this |
| 404 | Not found, or not yours to see |
| 409 | Conflict, e.g. the job is already taken |
| 429 | Too many login attempts |
| 500 | Unexpected server fault |

Errors always take the form `{ "error": "A readable message." }`.

---

## Health

### GET /api/health

No authentication. Used to check the server is up.

```json
{ "status": "ok", "service": "UFH Residence Maintenance Portal API" }
```

---

## Authentication

### POST /api/auth/register

Students only. Rate limited.

```json
{
  "name": "Aphiwe Ndlela",
  "email": "202412345@ufh.ac.za",
  "password": "Student123!",
  "residence": "Student Village",
  "room": "B12"
}
```

Rules: email must be a nine-digit student number followed by `@ufh.ac.za`; password at least 8
characters with a letter and a number;
residence must be one of the known residences; room matches `^[A-Z0-9-]{1,12}$`.

**201**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 8, "name": "Aphiwe Ndlela", "email": "202412345@ufh.ac.za",
            "role": "student", "trade": null, "residence": "Student Village",
            "room": "B12", "created_at": "2026-09-05 17:20:11" }
}
```

Errors: 400 validation, 409 email already registered.

### POST /api/auth/login

```json
{ "email": "202412345@ufh.ac.za", "password": "Student123!" }
```

**200** - same shape as register. **401** - `"Email or password is incorrect."`

### GET /api/auth/me

Returns the logged-in user. Used on page load to check the stored token.

### PUT /api/auth/profile

```json
{ "name": "Aphiwe Ndlela", "residence": "Residence A", "room": "A15" }
```

Students send all three fields; maintenance staff send only `name`. Email and role cannot be
changed here.

---

## Reference data

### GET /api/categories

```json
{ "categories": [ { "id": 1, "name": "Electrical" }, { "id": 2, "name": "Plumbing" } ] }
```

### GET /api/reference

Everything the forms and filters need in one call.

```json
{
  "categories": [ { "id": 1, "name": "Electrical" } ],
  "urgencies": ["Low", "Medium", "High"],
  "statuses": ["Submitted", "Assigned", "In Progress", "Completed", "Closed"]
}
```

---

## Dashboard

### GET /api/dashboard

The response depends on the caller's role.

**Student**
```json
{
  "role": "student",
  "counts": { "Submitted": 1, "Assigned": 0, "In Progress": 1, "Completed": 1,
              "Closed": 0, "total": 3, "open": 2 },
  "recent": [ { "id": 12, "category": "Electrical", "room": "B12",
                "urgency": "High", "status": "In Progress", "...": "..." } ]
}
```

**Maintenance**
```json
{
  "role": "maintenance",
  "counts": { "open": 4, "assigned_to_me": 1, "in_progress": 1,
              "completed": 2, "total": 6 },
  "average_resolution_hours": 12.4,
  "queue": [ { "id": 1, "category": "Electrical", "residence": "Student Village",
               "room": "B12", "urgency": "High", "status": "Submitted",
               "priority_score": 330, "...": "..." } ]
}
```

---

## Maintenance requests

### GET /api/requests

Returns a list. A student always receives only their own requests, whatever parameters are sent.

| Parameter | Values | Notes |
|---|---|---|
| `status` | Submitted, Assigned, In Progress, Completed, Closed | |
| `urgency` | Low, Medium, High | |
| `category_id` | integer | |
| `scope` | `open`, `mine` | Maintenance only. `open` = still needs attention, `mine` = assigned to me |
| `sort` | `newest` | Maintenance only. Default is priority order |

For maintenance callers each item includes `priority_score` and the student's name and email.

```json
{ "requests": [ { "id": 1, "category": "Electrical", "category_id": 1,
                  "residence": "Student Village", "room": "B12",
                  "description": "Room light is not working.",
                  "urgency": "High", "status": "Submitted", "has_image": false,
                  "created_at": "2026-09-04 06:12:00",
                  "updated_at": "2026-09-04 06:12:00", "completed_at": null,
                  "assigned_to": null, "assigned_name": null,
                  "assigned_trade": null, "priority_score": 330 } ] }
```

### POST /api/requests

**Students only.** Sent as `multipart/form-data` so a photo can be attached.

| Field | Required | Notes |
|---|---|---|
| `category_id` | yes | Must exist |
| `residence` | yes | From the known list |
| `room` | yes | Letters, digits, hyphens |
| `urgency` | yes | Low, Medium or High |
| `description` | yes | 10 to 1000 characters |
| `photo` | no | JPG, PNG or WebP, up to 2 MB |

The student id comes from the token, never from the form, so nobody can log a request in someone
else's name.

**201** `{ "request": { ... } }` and a first history entry is created automatically.

### GET /api/requests/:id

**200**
```json
{
  "request": { "id": 12, "...": "..." },
  "updates": [
    { "id": 30, "status": "Submitted", "comment": "Request submitted by student.",
      "created_at": "2026-09-04 10:32:00", "author_name": null, "author_trade": null },
    { "id": 31, "status": "Assigned", "comment": "Assigned to Thabo Mahlangu (Electrician).",
      "created_at": "2026-09-04 11:05:00", "author_name": "Thabo Mahlangu",
      "author_trade": "Electrician" }
  ]
}
```

**404** if it does not exist *or* belongs to another student.

### GET /api/requests/:id/image

Returns the uploaded photo as binary. Same access rule as the request itself. 404 if there is no
photo. Because it needs the Authorization header it cannot be used directly in an `<img src>`;
the frontend fetches it and creates an object URL.

### POST /api/requests/:id/assign

**Maintenance only.** No body. Sets `assigned_to` to the caller, moves the status to `Assigned`
and writes a history entry.

**200** `{ "request": {...}, "updates": [...] }`
**409** if another worker already has it. **400** if it is already finished.

### PATCH /api/requests/:id/status

**Maintenance only, and only the assigned worker.**

```json
{ "status": "In Progress", "comment": "Replacement bulb required." }
```

`comment` is optional; without it the history records *"Status changed to In Progress."*

Allowed transitions:

```
Submitted -> Assigned -> In Progress -> Completed -> Closed
```

Anything else returns 400 with, for example, *"A request cannot go from 'Submitted' to
'Completed'."* Moving to `Completed` sets `completed_at`.

**403** if the request is assigned to someone else or to nobody.

### POST /api/requests/:id/updates

**Maintenance only, and only the assigned worker.** Adds a progress note without changing the
status.

```json
{ "comment": "Checked the light fitting. Replacement bulb required." }
```

**201** `{ "request": {...}, "updates": [...] }`

---

## Permissions summary

| Endpoint | Student | Maintenance |
|---|---|---|
| `POST /auth/register` | yes | no (accounts are seeded) |
| `GET /requests` | own only | all |
| `POST /requests` | yes | no |
| `GET /requests/:id` | own only | all |
| `POST /requests/:id/assign` | no | yes |
| `PATCH /requests/:id/status` | no | assigned worker only |
| `POST /requests/:id/updates` | no | assigned worker only |
