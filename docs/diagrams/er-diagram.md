# Entity relationship diagram

```mermaid
erDiagram
  USERS ||--o{ MAINTENANCE_REQUESTS : "logs (student_id)"
  USERS ||--o{ MAINTENANCE_REQUESTS : "is assigned (assigned_to)"
  CATEGORIES ||--o{ MAINTENANCE_REQUESTS : "classifies (category_id)"
  MAINTENANCE_REQUESTS ||--|{ REQUEST_UPDATES : "records (request_id)"
  USERS ||--o{ REQUEST_UPDATES : "writes (maintenance_user_id)"

  USERS {
    int id PK
    string name
    string email UK
    string password_hash
    string role
    string trade
    string residence
    string room
    string created_at
  }

  CATEGORIES {
    int id PK
    string name UK
  }

  MAINTENANCE_REQUESTS {
    int id PK
    int student_id FK
    int category_id FK
    string residence
    string room
    string description
    string urgency
    string status
    int assigned_to FK
    string image_path
    string created_at
    string updated_at
    string completed_at
  }

  REQUEST_UPDATES {
    int id PK
    int request_id FK
    int maintenance_user_id FK
    string status
    string comment
    string created_at
  }
```

## Reading the diagram

- `USERS ||--o{ MAINTENANCE_REQUESTS` twice: the same table is on both ends of two different
  relationships. A student **logs** many requests; a worker **is assigned** many requests. The
  second one is optional (`o{`) because a new request has no worker yet.
- `MAINTENANCE_REQUESTS ||--|{ REQUEST_UPDATES` uses `|{` (one-or-more) rather than `o{`: every
  request gets at least one history row the moment it is created.
- `CATEGORIES` is a lookup table, so the category list can change without editing existing
  requests.

Constraints, cascade rules and indexes are described in DATABASE.md.
