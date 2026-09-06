# Sequence diagrams

## 1. Student submits a request

```mermaid
sequenceDiagram
  actor Student
  participant FE as Frontend (React)
  participant API as Backend (Express)
  participant DB as Database (SQLite)

  Student->>FE: Fill in the form and press Submit
  FE->>FE: Basic form checks
  FE->>API: POST /api/requests (multipart, Bearer token)
  API->>API: authenticate - verify JWT
  API->>DB: SELECT user by id from the token
  DB-->>API: User (role = student)
  API->>API: requireRole('student'), validate every field, store the photo
  API->>DB: INSERT INTO maintenance_requests (status 'Submitted')
  DB-->>API: New request id
  API->>DB: INSERT INTO request_updates ('Request submitted by student.')
  DB-->>API: OK
  API-->>FE: 201 Created + request JSON
  FE-->>Student: Show the request page: "Your maintenance request has been submitted."
```

## 2. Worker takes the job and completes it

```mermaid
sequenceDiagram
  actor Worker as Maintenance Personnel
  participant FE as Frontend (React)
  participant API as Backend (Express)
  participant ALG as Priority service
  participant DB as Database (SQLite)

  Worker->>FE: Open the dashboard
  FE->>API: GET /api/dashboard (Bearer token)
  API->>DB: SELECT open requests + counts
  DB-->>API: Rows
  API->>ALG: prioritise(rows)
  ALG-->>API: Rows ordered by priority score
  API-->>FE: 200 OK + queue
  FE-->>Worker: Show the queue, most important first

  Worker->>FE: Press "Assign to me"
  FE->>API: POST /api/requests/1/assign
  API->>API: authenticate + requireRole('maintenance')
  API->>DB: Check nobody else holds it
  API->>DB: UPDATE request SET assigned_to, status = 'Assigned'
  API->>DB: INSERT history entry
  API-->>FE: 200 OK + updated request and history
  FE-->>Worker: Status shows Assigned

  Worker->>FE: Press "Start work", then add a note, then "Mark as completed"
  FE->>API: PATCH /api/requests/1/status {"status":"In Progress"}
  API->>API: Check assignment and that the transition is allowed
  API->>DB: UPDATE status, INSERT history entry
  API-->>FE: 200 OK
  FE->>API: POST /api/requests/1/updates {"comment":"Replacement bulb required."}
  API->>DB: INSERT history entry
  API-->>FE: 201 Created
  FE->>API: PATCH /api/requests/1/status {"status":"Completed"}
  API->>DB: UPDATE status + completed_at, INSERT history entry
  API-->>FE: 200 OK
  FE-->>Worker: Status shows Completed
```

## 3. Student sees the update

```mermaid
sequenceDiagram
  actor Student
  participant FE as Frontend (React)
  participant API as Backend (Express)
  participant DB as Database (SQLite)

  Student->>FE: Open "My requests" and select request #1
  FE->>API: GET /api/requests/1 (Bearer token)
  API->>API: authenticate
  API->>DB: SELECT request JOIN categories JOIN users
  DB-->>API: Request row
  API->>API: Ownership check - is student_id the caller?
  API->>DB: SELECT * FROM request_updates WHERE request_id = 1 ORDER BY created_at
  DB-->>API: Five history rows
  API-->>FE: 200 OK + request and history
  FE-->>Student: Status "Completed" with the full timeline of what was done and when
```

If the id had belonged to another student, the ownership check would have ended the sequence with
**404 Request could not be found** and no data would have been returned.
