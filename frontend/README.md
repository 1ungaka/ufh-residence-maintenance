# UFH Residence Maintenance: Frontend

React + Vite web app for the University of Fort Hare Residence Maintenance Portal.
Students log faults in their residence; maintenance tradespeople pick up the jobs
and post progress updates the student can follow.

The app talks directly to **Supabase** (sign-in, database and photo storage).
It does **not** need the `backend/` folder to be running.

## Run it

You need [Node.js](https://nodejs.org/) 18 or newer.

```bash
cd frontend
npm install
npm run dev
```

Open the address Vite prints, normally <http://localhost:5173>.

No `.env` file is needed: without one, the app connects to the team's shared
Supabase project. To use a different project, copy `.env.example` to `.env`
and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
(Supabase: Project Settings → API).

Other scripts:

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run build`   | Production build into `dist/`                 |
| `npm run preview` | Serve the production build locally            |

## Signing in

| Role                      | Email format                        | Account                              |
| ------------------------- | ----------------------------------- | ------------------------------------ |
| Student                   | `202412345@ufh.ac.za`               | Register on the sign-in page         |
| Maintenance tradesperson  | `123456@staff.ufh.ac.za` (6-digit staff ID) | Created by Facilities Management |

Pick the matching role on the sign-in page. Staff accounts need
`"role": "maintenance"` (or `tradesperson`) in their Supabase user metadata.
Forgotten passwords are reset with a 6-digit code sent by email.

## Supabase setup (one-off, for whoever manages the project)

Files in [`../docs/supabase`](../docs/supabase):

- **`storage-policies.sql`**: run in the SQL Editor so students can upload
  fault photos (fixes "new row violates row-level security policy").
- **`reset-password-email.html`**: paste into Authentication → Email
  Templates → Reset Password, so the email carries the 6-digit code and a
  link back to the portal. Set Authentication → URL Configuration → Site URL
  to the address the app runs on.

## Where things are

```text
src/
├── App.jsx              routes and sign-in guards
├── supabaseClient.js    Supabase connection
├── context/             AuthContext: sign in, register, password reset
├── pages/               one file per screen
├── components/          layout, footer, request table, shared UI pieces
├── utils/               email formats, roles, residences, photo resizing,
│                        update history, contact details, date formatting
└── styles/app.css       all styling (UFH navy and gold theme)
```

Things you are likely to edit:

- **Residences list**: `src/utils/residences.js`
- **Contact details**: `src/utils/siteInfo.js`
- **Email formats**: `src/utils/emails.js`
