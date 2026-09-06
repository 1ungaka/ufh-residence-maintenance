# Class diagram

The domain entities and the backend modules that operate on them.

```mermaid
classDiagram
  class User {
    +int id
    +string name
    +string email
    -string password_hash
    +string role
    +string trade
    +string residence
    +string room
    +string created_at
    +isStudent() bool
    +isMaintenance() bool
  }

  class Category {
    +int id
    +string name
  }

  class MaintenanceRequest {
    +int id
    +int student_id
    +int category_id
    +string residence
    +string room
    +string description
    +string urgency
    +string status
    +int assigned_to
    +string image_path
    +string created_at
    +string updated_at
    +string completed_at
    +priorityScore() int
    +canTransitionTo(status) bool
  }

  class RequestUpdate {
    +int id
    +int request_id
    +int maintenance_user_id
    +string status
    +string comment
    +string created_at
  }

  User "1" --> "0..*" MaintenanceRequest : logs
  User "0..1" --> "0..*" MaintenanceRequest : is assigned
  Category "1" --> "0..*" MaintenanceRequest : classifies
  MaintenanceRequest "1" --> "1..*" RequestUpdate : records
  User "0..1" --> "0..*" RequestUpdate : writes
```

## Backend modules

```mermaid
classDiagram
  class AuthController {
    +register(req, res)
    +login(req, res)
    +me(req, res)
    +updateProfile(req, res)
  }

  class RequestController {
    +createRequest(req, res)
    +listRequests(req, res)
    +getRequest(req, res)
    +getRequestImage(req, res)
    +assignRequest(req, res)
    +updateStatus(req, res)
    +addNote(req, res)
    +dashboard(req, res)
  }

  class UserModel {
    +create(data) User
    +findById(id) User
    +findByEmailWithHash(email) User
    +emailExists(email) bool
    +updateProfile(id, data) User
  }

  class RequestModel {
    +create(data) Request
    +findById(id) Request
    +list(filters) Request[]
    +assign(id, workerId) Request
    +setStatus(id, status) Request
    +countsByStatus(filter) Row[]
  }

  class UpdateModel {
    +add(data) Update
    +listForRequest(id) Update[]
  }

  class PriorityService {
    +priorityScore(request, now) int
    +prioritise(requests, now) Request[]
    +hoursSince(timestamp, now) float
  }

  class MetricsService {
    +statusCounts(filter) Counts
    +averageResolutionHours() float
  }

  class AuthMiddleware {
    +signToken(user) string
    +authenticate(req, res, next)
    +requireRole(roles) function
  }

  AuthController --> UserModel
  AuthController --> AuthMiddleware
  RequestController --> RequestModel
  RequestController --> UpdateModel
  RequestController --> PriorityService
  RequestController --> MetricsService
  AuthMiddleware --> UserModel
  MetricsService --> RequestModel
```

Note the direction of every arrow: controllers depend on models and services, and models depend
on the database. Nothing points back the other way, which is what keeps all the SQL in one layer
and all the authorisation rules in another.

## Frontend components

```mermaid
classDiagram
  class App {
    +RequireAuth()
    +RequireRole(role)
    +PublicOnly()
  }
  class AuthContext {
    +user
    +loading
    +login(email, password)
    +register(payload)
    +logout()
  }
  class ApiClient {
    +login()
    +listRequests(params)
    +createRequest(formData)
    +assignRequest(id)
    +updateStatus(id, status, comment)
    +addNote(id, comment)
  }
  class Layout
  class Dashboard
  class RequestList
  class SubmitRequest
  class RequestDetail
  class Profile
  class RequestTable
  class Timeline

  App --> AuthContext
  App --> Layout
  App --> Dashboard
  App --> RequestList
  App --> SubmitRequest
  App --> RequestDetail
  App --> Profile
  Dashboard --> RequestTable
  RequestList --> RequestTable
  RequestDetail --> Timeline
  Dashboard --> ApiClient
  RequestList --> ApiClient
  SubmitRequest --> ApiClient
  RequestDetail --> ApiClient
  AuthContext --> ApiClient
```
