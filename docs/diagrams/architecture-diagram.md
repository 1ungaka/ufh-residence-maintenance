# System architecture diagram

## Deployment view

```mermaid
flowchart TD
  subgraph client[Client device - phone, tablet or laptop]
    browser[Browser<br/>React single-page app]
  end

  subgraph server[Application server]
    vite[Vite dev server<br/>port 5173]
    express[Express REST API<br/>port 4000]
    uploads[(uploads/<br/>request photos)]
    db[(SQLite<br/>maintenance.db)]
  end

  browser -- "HTTP: load the app" --> vite
  browser -- "HTTP + JWT: REST calls to /api/*" --> express
  express -- "prepared SQL statements" --> db
  express -- "read and write image files" --> uploads
```

In production the Vite box disappears: the app is built to static files served by a reverse proxy
that also terminates HTTPS and forwards `/api/*` to the same Express process. See NETWORK.md.

## Layers inside the backend

```mermaid
flowchart TD
  req[HTTP request] --> helmet[helmet - security headers]
  helmet --> cors[CORS - only the frontend origin]
  cors --> parse[Body parser - 100 kB limit]
  parse --> routes[routes/index.js]

  routes --> rate[rate limiter<br/>login and register only]
  routes --> authmw[authenticate<br/>verify JWT, load the user]
  authmw --> role[requireRole<br/>student or maintenance]
  role --> upload[uploadPhoto<br/>type and size checks]
  upload --> ctrl[controllers<br/>validation and authorisation rules]

  ctrl --> svc[services<br/>priority algorithm, metrics]
  ctrl --> models[models<br/>all SQL, prepared statements]
  models --> db[(SQLite database)]

  ctrl --> resp[JSON response]
  ctrl -. throws ApiError .-> errh[errorHandler<br/>friendly message, no stack traces]
  errh --> resp
```

Every arrow into `models` is a prepared statement, and every arrow out of `errorHandler` is a
short readable message. Those two facts are most of SECURITY.md in one picture.

## Screens and the endpoints behind them

```mermaid
flowchart LR
  login[Login / Register] --> ep1["/auth/login, /auth/register"]
  dash[Dashboard] --> ep2["/dashboard"]
  list[My requests / All requests / My jobs] --> ep3["/requests?status,urgency,category,scope"]
  form[Submit a request] --> ep4["/reference, POST /requests"]
  detail[Request details] --> ep5["/requests/:id, /assign, /status, /updates, /image"]
  profile[Profile] --> ep6["/auth/me, PUT /auth/profile"]
```
