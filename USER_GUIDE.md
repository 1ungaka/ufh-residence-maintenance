# User guide

## For students

### Creating an account

1. Open the portal and choose **Create your student account**.
2. Enter your full name and your university email address: your student number followed by
   `@ufh.ac.za`, for example `202412345@ufh.ac.za`.
3. Choose a password of at least 8 characters containing a letter and a number.
4. Choose your residence and type your room number, for example `B12`.
5. Press **Create account**. You are signed in straight away.

If you already have an account, use **Sign in**.

### Reporting a fault

1. Press **Log a fault** on the dashboard or in the side menu.
2. Choose what kind of problem it is - electrical, plumbing, furniture, Wi-Fi, water, heating,
   lighting, a door or lock, cleaning, or other.
3. Check that the residence and room are right. They are filled in from your profile, but you can
   change them if the fault is somewhere else in your residence.
4. Choose the urgency:
   - **High** - unsafe or unusable right now, for example no electricity or a flooding bathroom.
   - **Medium** - a real problem you can work around for a day or two.
   - **Low** - can wait for the next visit.
5. Describe the problem. Say what you have already tried; *"the light does not work, I replaced
   the bulb and it still does not switch on"* helps far more than *"light broken"*.
6. Optionally add a photo (JPG, PNG or WebP, up to 2 MB). A photo of a leaking pipe often saves a
   second visit.
7. Press **Log the fault**. You are taken to its page and it starts at **Submitted**.

### Following your request

**My requests** lists everything you have logged, newest first. Filter by category, status or
urgency using the boxes at the top.

Open any request to see:
- all the details, including who is now responsible for it,
- your photo if you added one,
- the **update history**: every step with the exact time it happened.

The statuses mean:

| Status | What it means for you |
|---|---|
| Submitted | Logged and waiting for a worker to take it |
| Assigned | A worker has taken responsibility for it |
| In Progress | The worker is busy with it |
| Completed | The work is finished |
| Closed | The request has been closed off |

Only maintenance staff can change a status, so nobody can mark your problem as fixed except the
person who did the work.

### Your profile

**Profile** shows your email, role and join date, and lets you update your name, residence and
room. Change your room here when you move, so new requests are filled in correctly.

---

## For maintenance personnel

### Logging in

Use the account issued to you by Facilities Management, for example `electrician@ufh.ac.za`.
Staff accounts are not created through the registration form.

### The dashboard

Four figures at the top: open faults, jobs assigned to you, jobs in progress, and completed
jobs. Underneath, **Next jobs by priority** shows the five most important open faults.

The order is worked out by the system: the most urgent first, and among equally urgent ones the
one that has been waiting longest. The **Priority** column shows the score behind that ordering.
The line above the table also gives the average time taken to complete a request so far.

### Taking and doing a job

1. Go to **Work queue** to see everything still needing attention. Filter by category to see
   only your trade's work.
2. Press **Open** on a request to read the location, description and photo.
3. Press **Assign to me**. The status changes to **Assigned** and your name appears on it. Once
   you have taken a job, no other worker can change it.
4. When you begin, press **Start work**. The status becomes **In Progress** and the student can
   see that someone is busy.
5. Add progress notes as you go, for example *"Checked the light fitting. Replacement bulb
   required."* The student sees these immediately - it is the main thing that stops people asking
   whether anything is happening.
6. When the work is done, press **Mark as completed**. You can attach a note describing what you
   did. The completion time is recorded automatically.
7. **Close request** afterwards if the job is fully finished with nothing to follow up.

**My jobs** shows only your own work.

### Things worth knowing

- A request can only move forward: Submitted → Assigned → In Progress → Completed → Closed. You
  cannot skip a step, which keeps the history honest.
- If a request already belongs to another worker, you can read it but not change it.
- Every action you take is written to the history with your name, your trade and the time.

---

## Messages you may see

| Message | What it means |
|---|---|
| "Please enter a valid email address." | The email is not in the right format |
| "Use your university email address: your student number followed by @ufh.ac.za." | The address is not in the university student format |
| "Password must be at least 8 characters long." | Choose a longer password |
| "Fault logged. You can follow its progress here." | The fault was saved successfully |
| "You are not authorised to perform this action." | Your role cannot do that, e.g. a student changing a status |
| "Request could not be found." | The request does not exist, or it belongs to another student |
| "Your session has expired. Please log in again." | You have been logged in for more than 8 hours |
| "This request is already assigned to ..." | Another worker took the job first |
| "Only JPG, PNG or WebP images can be uploaded." | The photo is the wrong file type |
| "Cannot reach the server. Is the backend running?" | The API is not running - start it with `npm run dev` in `backend` |

---

## Using it on a phone

The portal is designed for desktop, laptop, tablet and phone. On a small screen the side menu
becomes a scrolling row of links across the top, tables scroll sideways, and forms stack into a
single column. Everything works the same way in all sizes.
