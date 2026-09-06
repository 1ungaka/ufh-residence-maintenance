# Testing

## How to run the tests

```bash
cd backend
npm test
```

Result at the time of writing:

```
# tests 30
# pass 30
# fail 0
```

The tests use Node's built-in test runner (`node --test`) with `supertest` to call the API the
same way a browser would. `tests/testEnv.js` sets `NODE_ENV=test` before any other module loads,
which makes the app use an **in-memory** SQLite database - the tests never touch
`database/maintenance.db`.

> That file exists because of a real bug we hit: setting `process.env.NODE_ENV` at the top of the
> helper file was too late, since ES modules evaluate all their imports before their own
> statements, so the configuration had already read the old value and the first test run wrote
> into the real database. Moving the assignment into its own module, imported first, fixed it.

## Automated test cases

### Authentication - `tests/auth.test.js`

| ID | Description | Steps | Expected result | Actual | Status |
|---|---|---|---|---|---|
| TC-A01 | Student can register | POST `/auth/register` with a valid student-number address | 201, token returned, role `student` | As expected | Pass |
| TC-A02 | Non-university email rejected | Register with `someone@gmail.com` | 400, message names the required domain | As expected | Pass |
| TC-A02b | Non-student-number address rejected | Register with `aphiwe.ndlela@ufh.ac.za` | 400, message asks for a student number | As expected | Pass |
| TC-A03 | Weak password rejected | Register with password `abc` | 400, password rule explained | As expected | Pass |
| TC-A04 | Valid login succeeds | POST `/auth/login` with seeded credentials | 200 and a JWT | As expected | Pass |
| TC-A05 | Wrong password rejected | Login with the wrong password | 401, *"Email or password is incorrect."* | As expected | Pass |
| TC-A06 | Passwords are hashed | Read `password_hash` directly from the database | Not the plain password; matches `$2a$`; verifies with bcrypt | As expected | Pass |

### Maintenance requests - `tests/requests.test.js`

| ID | Description | Steps | Expected result | Actual | Status |
|---|---|---|---|---|---|
| TC-R01 | Student creates a request | POST `/requests` with category, residence, room, description, urgency | 201, status `Submitted` | As expected | Pass |
| TC-R02 | Request is persisted | Query the database for the new row and its updates | Row exists; one history entry with status `Submitted` | As expected | Pass |
| TC-R03 | Required fields validated | POST `/requests` with no description | 400 naming the description | As expected | Pass |
| TC-R04 | Student views own request | GET `/requests/:id` as the owner | 200 with details and history | As expected | Pass |
| TC-R05 | Student cannot view another student's request | GET the same id as a different student | 404 (existence not revealed) | As expected | Pass |
| TC-R06 | Worker sees the prioritised queue | GET `/requests?scope=open` as maintenance | 200, request present, `priority_score` set | As expected | Pass |
| TC-R07 | Worker assigns to self | POST `/requests/:id/assign` | 200, status `Assigned`, assignee name set | As expected | Pass |
| TC-R08 | Second worker cannot take over | Another worker POSTs assign on the same request | 409 conflict | As expected | Pass |
| TC-R09 | Full workflow to completion | Status → In Progress, add note, status → Completed, then read as the student | Each step 200/201; `completed_at` set; student sees 5 history entries | As expected | Pass |
| TC-R10 | Unassigned request cannot be completed | Worker PATCHes status on a request assigned to nobody | 403 | As expected | Pass |
| TC-R11 | Student dashboard totals | GET `/dashboard` as a student | 200, counts match, recent list returned | As expected | Pass |

### Security - `tests/security.test.js`

| ID | Description | Steps | Expected result | Actual | Status |
|---|---|---|---|---|---|
| TC-S01 | Protected endpoint needs a token | GET `/requests` with no Authorization header | 401 | As expected | Pass |
| TC-S02 | Tampered token rejected | GET `/requests` with `Bearer not.a.real.token` | 401 | As expected | Pass |
| TC-S03 | Student cannot change status | PATCH `/requests/:id/status` as a student | 403; status unchanged in the database | As expected | Pass |
| TC-S04 | Student cannot assign work | POST `/requests/:id/assign` as a student | 403 | As expected | Pass |
| TC-S05 | Worker cannot log a request for a student | POST `/requests` as maintenance | 403 | As expected | Pass |
| TC-S06 | SQL injection has no effect | Login with `' OR '1'='1` in both fields | 400/401; users table intact | As expected | Pass |
| TC-S07 | No password data in responses | Inspect the whole login response body | Contains no password field or hash | As expected | Pass |

### Prioritisation algorithm - `tests/priority.test.js`

| ID | Description | Steps | Expected result | Actual | Status |
|---|---|---|---|---|---|
| TC-P01 | Urgency ranks correctly | Score three requests of equal age | High > Medium > Low | As expected | Pass |
| TC-P02 | Oldest first within a band | Prioritise three High requests aged 1, 20 and 5 hours | Order 20h, 5h, 1h | As expected | Pass |
| TC-P03 | Old High beats new Medium | Prioritise a 48-hour High and a brand-new Medium | High first | As expected | Pass |
| TC-P04 | Ageing is capped | Score a 5000-hour Low against a new High | High still wins | As expected | Pass |
| TC-P05 | Input is not mutated | Prioritise an array and compare it with a copy | Unchanged | As expected | Pass |

## Manual test cases

Run these during the demonstration; each was carried out against the running application.

| ID | Description | Steps | Expected result | Actual | Status |
|---|---|---|---|---|---|
| TM-01 | Photo upload | Log in as the student, submit a request with a JPEG attached | Request created, photo shown on the detail page | Photo stored and displayed (130 KB test image) | Pass |
| TM-02 | Photo is protected | Log in as a different student and request `/api/requests/:id/image` | 404, no image bytes | As expected | Pass |
| TM-03 | Bad file type rejected | Attach a `.txt` file renamed as a photo | *"Only JPG, PNG or WebP images can be uploaded."* | As expected | Pass |
| TM-04 | Oversized file rejected | Attach an image over 2 MB | Friendly size error | As expected | Pass |
| TM-05 | Queue ordering on screen | Log in as the electrician and read the dashboard | Two High requests first, oldest leading, Low last | Order 330, 306, 300, 248, 220, 196 | Pass |
| TM-06 | Student sees the update | Worker completes a job; student refreshes the request | Status Completed, all history entries visible with times | As expected | Pass |
| TM-07 | Session expiry | Delete the token from browser storage and navigate | Redirected to login, no broken screen | As expected | Pass |
| TM-08 | Responsive layout | Open at 375 px width (phone) | Navigation becomes a scrolling row, tables scroll horizontally, forms stack | As expected | Pass |
| TM-09 | Backend unavailable | Stop the API and try to log in | *"Cannot reach the server. Is the backend running?"* | As expected | Pass |
| TM-10 | Rate limiting | Fail login 21 times quickly | 429 with *"Too many login attempts..."* | As expected | Pass |

## Interface rendering checks

The React screens were also rendered headlessly with a stubbed API to confirm they mount without
errors: the sign-in screen, the student dashboard, the staff work queue (including the priority
column and the avatar initials), the fault detail page with its history, and the "request could
not be found" state. All rendered with no React errors or warnings.

| ID | Description | Expected result | Actual | Status |
|---|---|---|---|---|
| TM-11 | Sign-in screen carries the branding and no test credentials | Hero, wordmark, no account list on screen | As expected | Pass |
| TM-12 | Dashboard counters animate once on load | Values count up to the correct totals | As expected | Pass |
| TM-13 | Reduced motion respected | With "reduce motion" on, animations are suppressed and values appear immediately | As expected | Pass |

## What is not covered

- No automated browser (end-to-end) tests; the interface checks above are render-level only.
- No load or performance testing.
- No accessibility audit, although the markup uses labels, roles and visible focus styles.
