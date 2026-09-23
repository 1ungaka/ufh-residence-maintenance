# UFH Residence Maintenance: Frontend

React + Vite web app for the University of Fort Hare Residence Maintenance Portal.
Students log faults in their residence; maintenance tradespeople pick up the jobs
and post progress updates the student can follow.

**Live site: <https://ufh-residence-maintenance.vercel.app>**

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

## Deploying (Vercel)

1. On [vercel.com/new](https://vercel.com/new), sign in with GitHub and import
   `ufh-residence-maintenance`.
2. Set **Root Directory** to `frontend`. Everything else is picked up from
   `vercel.json` (Vite build, and a rewrite so links like `/reset-password`
   open the app instead of a 404).
3. Deploy. Every push to `main` redeploys automatically.
4. In Supabase → Authentication → URL Configuration, set **Site URL** to the
   Vercel address and add `https://<your-app>.vercel.app/reset-password` under
   **Redirect URLs**, so reset links come back to the live site.

## Signing in

| Role                      | Email format                        | Account                              |
| ------------------------- | ----------------------------------- | ------------------------------------ |
| Student                   | `202412345@ufh.ac.za`               | Register on the sign-in page         |
| Maintenance tradesperson  | `123456@staff.ufh.ac.za` (6-digit staff ID) | Created by Facilities Management |

Pick the matching role on the sign-in page. Staff accounts need
`"role": "maintenance"` (or `tradesperson`) in their Supabase user metadata.
Forgotten passwords are reset with a link sent by email.

## Supabase setup (one-off, for whoever manages the project)

Files in [`../docs/supabase`](../docs/supabase):

- **`storage-policies.sql`**: run in the SQL Editor so students can upload
  fault photos (fixes "new row violates row-level security policy").
- **`reset-password-email.html`**: paste into Authentication → Email
  Templates → Reset Password, so the email is UFH-branded and its button
  links straight to the portal. Set Authentication → URL Configuration →
  Site URL to the address the app runs on, and add
  `<that address>/reset-password` under Redirect URLs.

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
