# Documentation index

The written documentation lives in the project root:

| File | What it covers |
|---|---|
| `../README.md` | Installation, commands, demo accounts, project structure |
| `../ARCHITECTURE.md` | How the client, server and database fit together, and why |
| `../DATABASE.md` | Tables, keys, relationships, CRUD operations |
| `../SECURITY.md` | Every security control and where it is implemented |
| `../ALGORITHMS.md` | The request prioritisation algorithm |
| `../NETWORK.md` | Client-server model, HTTP, REST, ports, deployment |
| `../TESTING.md` | Test cases and results |
| `../USER_GUIDE.md` | How students and maintenance staff use the portal |
| `../API.md` | Full REST API reference |

## Final system (Supabase)

| File | What it covers |
|---|---|
| `UFH-Residence-Maintenance-Documentation.docx` / `.pdf` | **Software documentation for submission**: problem statement, solution, specifications, languages, functional and non-functional requirements, user modes, concept of operation, use case and activity diagrams, methodology, demo and testing, conclusion |
| `supabase/README.md` | Live data model, one-off Supabase setup, security controls and known gaps |
| `supabase/storage-policies.sql` | Storage policies that allow fault photo uploads |
| `supabase/reset-password-email.html` | UFH-branded password reset email template |
| `testing/final-system-tests.md` | Functional tests and user acceptance testing of the live system |

## Diagrams

All diagrams are written in Mermaid inside markdown files, so they render directly on GitHub, in
VS Code with a Mermaid extension, or at https://mermaid.live if you want to export an image for
the report or the slides.

| File | Diagram |
|---|---|
| `diagrams/use-case-diagram.md` | Use case diagram plus two written use cases |
| `diagrams/class-diagram.md` | Domain classes, backend modules, frontend components |
| `diagrams/er-diagram.md` | Entity relationship diagram |
| `diagrams/activity-diagram.md` | Activity diagram of the full request workflow |
| `diagrams/sequence-diagram.md` | Three sequence diagrams: submit, attend, view update |
| `diagrams/architecture-diagram.md` | Deployment view, backend layers, screens to endpoints |

All twelve Mermaid blocks were checked with the Mermaid parser and render without errors.

### Final system diagrams (images)

Drawn for the final Supabase version of the portal and used in the project documentation. Each
comes as an `.svg` (sharp at any size, editable) and a `.png` (for Word and slides).

| File | Diagram |
|---|---|
| `diagrams/architecture.*` | System architecture: browser, Vercel, Supabase Auth, database, Storage, Edge Function |
| `diagrams/lifecycle.*` | Request life cycle: Submitted → Assigned → In Progress → Completed |
| `diagrams/usecase.*` | Use case diagram: Student, Tradesperson, Facilities Management, Portal user |
| `diagrams/activity-log-fault.*` | Activity diagram: a student logs a fault (with optional photo) |
| `diagrams/activity-tradesperson.*` | Activity diagram: a tradesperson accepts, updates and completes a job |
| `diagrams/activity-signin.*` | Activity diagram: sign in with role check, and password reset |
