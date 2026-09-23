# Final system tests

Tests of the live Supabase version of the portal
(<https://ufh-residence-maintenance.vercel.app>). The automated tests for the first prototype's
Node.js API are in [`../../TESTING.md`](../../TESTING.md).

## Functional tests

| ID | Test | Expected result | Result |
|---|---|---|---|
| T-01 | Sign in as Student with a staff email (`123456@staff.ufh.ac.za`) | Refused before contacting the server, with a message to choose Maintenance tradesperson | Pass |
| T-02 | Email format checks: 8 examples (valid and invalid, both roles, mixed case) | Each accepted or rejected with the correct message | Pass (8/8) |
| T-03 | Sign in with a role that does not match the account | Signed out again with a clear message; the wrong dashboard is never shown | Pass |
| T-04 | Staff account whose role is `tradesperson` rather than `maintenance` | Recognised as staff and given the work queue | Pass |
| T-05 | Attach a 9 MB, 4000×3000 photo | Resized to 1600×1200, about 0.5 MB, before upload | Pass (520 KB) |
| T-06 | Attach a file that is not an image | "That file is not a photo" message | Pass |
| T-07 | Student opens My requests | Only their own requests are listed | Pass (after fix) |
| T-08 | Tradesperson adds a progress note | Note text shown in the history with name and time | Pass (after fix) |
| T-09 | Open the site at 375 px phone width | No sideways scrolling; buttons and cards fit | Pass |
| T-10 | Open `/reset-password` directly on the live site | App loads (no 404) and explains the link has expired | Pass |
| T-11 | Production build before every commit | Build completes with no errors | Pass |

## User acceptance testing

Group members used the system as students and as tradespeople and reported what did not work or
did not feel right. Each piece of feedback led to a change:

| Feedback from testing | Improvement made |
|---|---|
| "I can't tell the portal whether I am a student or a tradesperson." | Role choice on the sign-in page, with separate email formats and a role check |
| "It says invalid login credentials and there is no way to reset my password." | Forgot password with an emailed reset link, and a clear "email and password do not match" message |
| "I chose tradesperson but it says my account is a tradesperson." | Staff roles were stored under different names; one shared role rule now recognises all of them |
| "Photo upload fails and it only allows 2 MB." | Photos resized automatically; storage policy lets students upload to their own folder |
| "The history only shows names and dates, not what the tradesperson wrote." | History shows every note, message and status change; student comments and dashboard updates added |
| "The residences listed are wrong." | List replaced with Student Village, Marikana, Wesley, ZK and Taunyane, plus Other with a typed name |
| "The half-and-half sign-in page looks like every other site." | Redesigned as a full-screen campus photo wall with a centred card |
| "I don't want a code, just a link." | Password reset changed to a link-only flow with a UFH-branded email |
| "The sign-in card is too small and the photos are hard to see." | Larger card, lighter overlay so the photos show, and a subtle 3D tilt |
| "The emergency numbers on Contact us are not part of this project." | Removed; Contact us shows campus addresses and switchboards only |
