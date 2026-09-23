# UFH Residence Maintenance Portal
## Software Documentation 

**Live site: <https://ufh-residence-maintenance.vercel.app>**

A web-based system that allows University of Fort Hare students to report maintenance problems in their residences and track the progress of their requests.
Maintenance staff can manage, assign and resolve reported issues.
The system covers two primary user roles:
- **Students** — who submit and monitor maintenance requests.
- **Maintenance Staff** — who receive, action, and resolve those requests.
This documentation is intended for developers, maintainers, evaluators, and other stakeholders who need to understand the system's purpose, structure, and functionality.


## Main Features

### Students
- Register and sign in with a UFH student email address (`202412345@ufh.ac.za`)
- Reset a forgotten password with a link sent by email
- Submit a maintenance request for their residence (Student Village, Marikana, Wesley, ZK, Taunyane, or another residence typed in)
- Select the problem category and urgency
- Add a description and an optional photo (large phone photos are resized automatically)
- View the status of submitted requests
- Follow the request history: when a tradesperson accepts the job, starts work, adds notes and completes it
- Reply with comments for the tradesperson
- See the latest updates from maintenance staff on their dashboard

### Maintenance Staff
- Sign in with a staff email (`123456@staff.ufh.ac.za`, a 6-digit staff ID)
- View the work queue, ranked by urgency and waiting time
- Filter requests by category, status and urgency
- Accept a job, with a message to the student about the visit
- Update the request status
- Add progress notes the student can see
- Mark requests as completed

### Everyone
- Contact us page with campus addresses and switchboard numbers
- Terms and conditions and a POPIA-based Privacy statement
- Works on phones as well as computers

## Request Process

```text
Student reports problem
        ↓
Request submitted
        ↓
Maintenance worker accepts the job (and tells the student when they will come)
        ↓
Work starts
        ↓
Progress updates and comments
        ↓
Request completed
```

## Technology Used

- Frontend: React + Vite
- Database, authentication and photo storage: Supabase
- Hosting: Vercel (redeploys automatically on every push to `main`)
- Email notifications: Supabase Edge Function (`supabase/functions/notify-users`)

The `backend/` folder (Node.js + Express + SQLite) is the earlier prototype API. The web app no longer uses it: the frontend talks to Supabase directly.

## Project Structure

```text
ufh-residence-maintenance/
├── frontend/          React app (see frontend/README.md)
├── supabase/          Supabase config and Edge Functions
├── docs/
│   └── supabase/      SQL policies and the password reset email template
├── backend/           earlier prototype API (not used by the web app)
├── README.md
├── DATABASE.md
├── SECURITY.md
├── ALGORITHMS.md
├── NETWORK.md
├── TESTING.md
├── ARCHITECTURE.md
├── USER_GUIDE.md
└── API.md
```

## Running the Project
### Prerequisites

Ensure you have the following installed on your machine before setting up the project:

* **[Node.js](https://nodejs.org/)** (v18.x or higher recommended - LTS version)
* **npm** (bundled automatically with Node.js)

No Supabase login or `.env` file is needed to run the app: it connects to the team's shared Supabase project by default.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open:

http://localhost:5173

The backend does not need to be running. See [frontend/README.md](frontend/README.md) for more detail, including how to point the app at a different Supabase project.

## Deployment

The frontend is deployed on Vercel from the `frontend/` folder. Every push to `main` updates the live site. Steps to set up a new deployment are in [frontend/README.md](frontend/README.md#deploying-vercel).

## Supabase Setup

One-off settings for whoever manages the Supabase project:

- **Authentication → URL Configuration:** Site URL `https://ufh-residence-maintenance.vercel.app`, and add `https://ufh-residence-maintenance.vercel.app/**` under Redirect URLs, so password reset links open the live site.
- **Authentication → Email Templates → Reset Password:** paste [docs/supabase/reset-password-email.html](docs/supabase/reset-password-email.html) for the UFH-branded email.
- **SQL Editor:** run [docs/supabase/storage-policies.sql](docs/supabase/storage-policies.sql) so students can upload fault photos.

## Documentation

More information about the database, algorithms, security, networking, testing and system design can be found in the documentation files in this project.
