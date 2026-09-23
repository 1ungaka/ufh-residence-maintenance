# Supabase: data model and security setup

The live portal (<https://ufh-residence-maintenance.vercel.app>) keeps its data in Supabase:
**Auth** for accounts, **PostgreSQL** for tickets and their history, **Storage** for fault
photos, and an **Edge Function** for email notifications. The frontend talks to Supabase
directly with the public anon key; what each user may read or change is decided by row-level
security (RLS) in the database.

`../../DATABASE.md` documents the SQLite schema of the first prototype. This page describes the
tables the live system uses.

## Data model

| Table | One row per | Fields used by the app |
|---|---|---|
| `profiles` | user (same `id` as the Supabase Auth user) | `id`, `full_name`, `role`, `student_number`, `residence_building`, `room_number` |
| `categories` | fault category (Electrical, Plumbing, ...) | `id`, `name` |
| `maintenance_tickets` | reported fault | `id`, `reported_by` → profiles, `category_id` → categories, `residence_building`, `room_number`, `urgency` (`High` / `Medium` / `Low`), `description`, `status`, `assigned_to` → profiles, `photo_url`, `created_at`, `updated_at` |
| `ticket_updates` | entry in a ticket's history | `id`, `ticket_id` → maintenance_tickets, `updated_by` → profiles, `update_message`, `created_at` |

**Ticket status** moves `logged` → `assigned` → `in_progress` → `resolved`. The app shows these
as Submitted, Assigned, In Progress and Completed.

**History entries** are free text. Status changes are saved with a small tag in front, for
example `[status:in_progress] Mario has started work on this fault.`, so the request page can
show the right heading. The tag is never shown to users. Plain notes and student comments have
no tag.

**Account role** is stored in the Auth user's `user_metadata.role`. Staff accounts may use
`maintenance`, `tradesperson`, `facilities_admin` or `staff`; the app treats all of these, and any
6-digit `@staff.ufh.ac.za` email, as maintenance staff (`frontend/src/utils/roles.js`).

### Storage

| Bucket | Holds | Path |
|---|---|---|
| `maintenance-files` | fault photos (JPEG, resized in the browser to about 1.5 MB or less) | `<user id>/<random id>.jpg` |

## One-off setup

Run these once per Supabase project.

1. **Photo uploads.** SQL Editor → paste [`storage-policies.sql`](storage-policies.sql) → Run.
   Without it every photo upload fails with *"new row violates row-level security policy"*.
2. **Reset email.** Authentication → Email Templates → Reset Password → paste
   [`reset-password-email.html`](reset-password-email.html).
3. **Reset links point at the live site.** Authentication → URL Configuration: Site URL
   `https://ufh-residence-maintenance.vercel.app`, and add
   `https://ufh-residence-maintenance.vercel.app/**` under Redirect URLs.
4. **Optional: sender name.** Authentication → Emails → SMTP Settings, so emails come from the
   university rather than "Supabase Auth".

## Security controls

| Control | Where |
|---|---|
| Passwords hashed, sessions and reset links managed | Supabase Auth |
| All traffic encrypted | HTTPS (Vercel and Supabase) |
| Only the public anon key in the frontend; never the service_role key | `frontend/src/supabaseClient.js` |
| Uploads only into the user's own Storage folder; 2 MB and image types only | `storage-policies.sql` |
| Students list only their own tickets | `RequestList.jsx`, `Dashboard.jsx` (query filter) |
| A refused change is reported as an error, not shown as success | `RequestDetail.jsx` |
| Email format and role checked before and after sign-in | `utils/emails.js`, `AuthContext.jsx` |

## Known gaps

- **Ticket RLS.** The rule "students see only their own tickets" is enforced in the app's
  queries; it should also be enforced by an RLS policy on `maintenance_tickets` so it holds for
  any client using the anon key.
- **Roles in `user_metadata`.** Users can edit their own `user_metadata`, so for production the
  role should move to `app_metadata` or a `profiles` column that only administrators can change.
