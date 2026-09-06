# Security

Every measure below is implemented in the code, not just described here. The file and function
are named so each one can be shown during the demonstration.

## 1. Password hashing

**Where:** `backend/src/controllers/authController.js`

Passwords are hashed with bcrypt (10 salt rounds) before they touch the database, and are only
ever compared with `bcrypt.compareSync`. The plain password exists only for the moment the
request is being handled.

```js
const passwordHash = bcrypt.hashSync(password, 10);
```

The database stores something like
`$2a$10$N9qo8uLOickgx2ZMRZoMy...` - a hash cannot be reversed into the password.

*Note:* the library used is `bcryptjs`, the pure-JavaScript implementation of the same bcrypt
algorithm. It was chosen over the native `bcrypt` package because it needs no C++ build tools,
so `npm install` works on any machine in the lab. The stored hashes are the standard bcrypt
format and are interchangeable.

**Proof:** test TC-A06 reads the row straight out of the database and asserts the stored value is
not the password and matches the bcrypt pattern.

## 2. Authentication with JWT

**Where:** `backend/src/middleware/auth.js`

On a successful login the server signs a token containing only the user id and role, using the
secret from the environment, with an 8-hour expiry. Every protected request must send it:

```
Authorization: Bearer <token>
```

`authenticate` verifies the signature and expiry, then **loads the user from the database** by
the id in the token. That second step matters: a token belonging to a deleted account stops
working immediately, and the role used for authorisation always comes from the database rather
than from the token's claims.

Changing a single character of a token invalidates the signature (test TC-S02).

## 3. Role-based access control

**Where:** `requireRole()` in `backend/src/middleware/auth.js`, applied in
`backend/src/routes/index.js`

| Endpoint | Who may call it |
|---|---|
| `POST /api/requests` | students only |
| `POST /api/requests/:id/assign` | maintenance only |
| `PATCH /api/requests/:id/status` | maintenance only |
| `POST /api/requests/:id/updates` | maintenance only |

A student attempting a status change is rejected with 403 before the controller runs
(test TC-S03), and a maintenance user cannot log a request on a student's behalf (TC-S05).

## 4. Object-level authorisation

Role checks alone are not enough: a student is allowed to read requests, but only their own.

- `GET /api/requests` adds `WHERE student_id = ?` using the id from the **token**, never a value
  from the query string.
- `GET /api/requests/:id` and `/image` load the row and compare `student_id` with the logged-in
  user. Another student's request returns **404, not 403**, so the API does not confirm whether
  that id exists.
- `PATCH .../status` and `POST .../updates` additionally require `assigned_to === req.user.id`,
  so one worker cannot edit another worker's job.
- `POST .../assign` refuses with 409 if the request already belongs to someone else.

**Proof:** TC-R05, TC-R08, TC-S03, TC-S04.

## 5. Input validation

**Where:** `backend/src/utils/validation.js`, called at the top of every controller.

Everything from the browser is checked before use: required fields, string lengths, email
format, password strength (8+ characters with a letter and a number), room numbers against
`^[A-Z0-9-]{1,12}$`, and urgency, status, residence and category against fixed allowed lists.
Student registration additionally requires the university address format - a nine-digit student
number followed by `@ufh.ac.za` - which keeps casual sign-ups out. Anything else is rejected
with a readable 400 message.

The client-side `required` attributes are convenience only. Every rule is enforced again on the
server, because a form can be bypassed with any HTTP client.

## 6. SQL injection prevention

**Where:** `backend/src/models/`

Every statement is a prepared statement with bound parameters. No user value is ever
concatenated into SQL - even the dynamic filter list builds `?` placeholders and passes the
values separately:

```js
where.push('r.status = ?');
params.push(status);
```

An input like `' OR '1'='1` is therefore treated as an ordinary string to compare against, not as
SQL (test TC-S06).

## 7. File upload validation

**Where:** `backend/src/middleware/upload.js`

- Only `image/jpeg`, `image/png` and `image/webp` are accepted, and the file extension is checked
  as well as the MIME type.
- Maximum size 2 MB (`MAX_UPLOAD_BYTES`), one file per request.
- **The server generates the stored filename** from 16 random bytes, so a malicious name such as
  `../../src/server.js` cannot escape the uploads folder.
- Files are written to `backend/uploads/`, which is **not** served as static content. The only
  way to read one is `GET /api/requests/:id/image`, which authenticates the caller and applies the
  same ownership rule as the request itself, and calls `path.basename()` before opening the file.
- If the surrounding request fails validation, the uploaded file is deleted rather than left
  orphaned.

Verified manually: uploading a `.txt` file returns *"Only JPG, PNG or WebP images can be
uploaded."*, and a second student requesting another student's photo gets 404.

## 8. Protection of secrets

`JWT_SECRET` and all other configuration come from environment variables loaded from
`backend/.env`, which is listed in `.gitignore`. Only `.env.example` is committed, holding
placeholder values. In production mode the server refuses to start without `JWT_SECRET`:

```js
if (config.env === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production.');
}
```

No API response ever contains a password hash: the model's public field list simply omits the
column (test TC-S07).

## 9. Safe error handling

**Where:** `backend/src/middleware/errorHandler.js`

Expected problems throw an `ApiError` with a friendly message and a proper status code.
Unexpected errors are logged on the server and returned to the browser as a plain *"Something
went wrong. Please try again."* - no stack traces, file paths or SQL reach the user.

Login uses one identical message for an unknown email and a wrong password, so the form cannot be
used to discover which accounts exist.

## 10. Brute-force protection

`express-rate-limit` allows 20 attempts per IP address per 15 minutes on `/auth/login` and
`/auth/register`. Further attempts get *"Too many login attempts. Please try again in a few
minutes."*

## 11. HTTP security headers and CORS

`helmet` sets `X-Content-Type-Options: nosniff`, a Content-Security-Policy, `Referrer-Policy`,
`Strict-Transport-Security` and others on every response.

CORS is restricted to the single origin in `CORS_ORIGIN` (the frontend), so a page on another
website cannot call the API from a visitor's browser. Request bodies are capped at 100 kB.

## What is deliberately not implemented

Honest scope statement for the defence:

- **No HTTPS in development.** Tokens travel in clear text on localhost. A real deployment would
  terminate TLS at a reverse proxy (see NETWORK.md).
- **The token is stored in `localStorage`**, which is readable by JavaScript running on the page.
  A production system would prefer an httpOnly cookie with CSRF protection. localStorage was
  chosen here because it keeps the authentication flow small enough to explain in a demo.
- **No password reset, no two-factor authentication, no account lockout** beyond rate limiting.
- **No audit log of logins**, only of request changes.
- Uploaded images are not re-encoded, so a valid image file containing hidden data would be
  stored as-is.
- **Email format is checked, not membership.** The portal confirms an address looks like a
  university student address; it does not verify it against the university directory, and there
  is no email confirmation step. Tying registration to the real student record, or to the
  university's single sign-on, is the first thing to add before this is opened to everyone.
