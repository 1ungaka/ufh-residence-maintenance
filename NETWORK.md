# Networks

## Client-server model

The portal is a client-server application. The **client** is the React app running in the
student's or worker's browser; the **server** is the Node.js/Express process holding the
database. They are separate programs that only ever communicate over HTTP.

```
  Student or worker device
  +----------------------------+
  |  Browser (client)          |
  |  React SPA                 |
  +-------------+--------------+
                |
                |  HTTP request:  POST /api/requests
                |  Authorization: Bearer <token>
                |  Content-Type:  multipart/form-data
                |
                |  HTTP response: 201 Created
                |  Content-Type:  application/json
                v
  +----------------------------+
  |  Application server        |    Node.js + Express, TCP port 4000
  |  REST API                  |
  +-------------+--------------+
                |
                |  local file access (no network hop)
                v
  +----------------------------+
  |  SQLite database file      |
  +----------------------------+
```

The diagram version is in `docs/diagrams/architecture-diagram.md`.

## Ports used in development

| Port | Process | Purpose |
|---|---|---|
| 5173 | Vite dev server | Serves the React app to the browser |
| 4000 | Express | The REST API |

Both listen on `localhost`. The Vite server is configured with `host: true`, so the app can also
be opened from a phone on the same Wi-Fi at `http://<laptop-ip>:5173` - useful for showing the
responsive layout on a real device. In that case the API address must also be reachable, so set
`VITE_API_URL=http://<laptop-ip>:4000/api` in `frontend/.env` and `CORS_ORIGIN=http://<laptop-ip>:5173`
in `backend/.env`.

## Why two servers in development

Vite rebuilds the frontend as files change; Express serves data. In production the frontend is
compiled to static files (`npm run build`) and served by any web server, so only the API process
remains. Nothing about the API changes between the two setups.

## REST API design

The API follows REST conventions: a URL identifies a resource, and the HTTP verb says what to do
with it.

| Verb | Path | Meaning |
|---|---|---|
| POST | `/api/auth/login` | Create a session (returns a token) |
| GET | `/api/requests` | Read a collection |
| POST | `/api/requests` | Create a request |
| GET | `/api/requests/12` | Read one request |
| PATCH | `/api/requests/12/status` | Partially update one request |
| POST | `/api/requests/12/updates` | Add to a sub-collection |

Status codes carry meaning: 200 OK, 201 Created, 400 validation failure, 401 not authenticated,
403 not allowed, 404 not found, 409 conflict, 429 too many attempts, 500 server fault. The
frontend reacts to them - a 401 clears the session and returns to the login page.

Requests and responses are JSON, except the create-request call, which uses
`multipart/form-data` so a photo can be attached.

## A complete request/response cycle

Student presses **Submit request**:

```
POST /api/requests HTTP/1.1
Host: localhost:4000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

category_id=1&residence=Student Village&room=B12&urgency=High
description=The light in my room is no longer working.
[optional binary photo]
```

```
HTTP/1.1 201 Created
Content-Type: application/json
Access-Control-Allow-Origin: http://localhost:5173
X-Content-Type-Options: nosniff

{"request":{"id":7,"category":"Electrical","room":"B12","urgency":"High",
            "status":"Submitted","created_at":"2026-09-05 17:20:11", ...}}
```

The browser then redirects to the request detail page, which issues
`GET /api/requests/7` and renders the result.

## CORS

The browser refuses to let a page on one origin call an API on another unless the API says it is
allowed. Because the app (port 5173) and API (port 4000) are different origins, Express replies
with `Access-Control-Allow-Origin: http://localhost:5173` and answers the browser's `OPTIONS`
preflight. Any other origin is not on the list, so a malicious page cannot use a visitor's token
against the API.

## Statelessness

The server keeps no session table. Every request carries its own JWT, which the server verifies
before doing anything. This is why the API can be restarted mid-demonstration without logging
anyone out, and why it could sit behind a load balancer with several instances.

## Deploying on a university network

A realistic deployment inside the campus network:

```
Student phone / laptop on residence Wi-Fi
        |  HTTPS (port 443)
        v
Reverse proxy (Nginx) on a university server
   - holds the TLS certificate for e.g. residence-maintenance.ufh.ac.za
   - serves the built frontend from frontend/dist
   - forwards /api/* to http://127.0.0.1:4000
        |
        v
Node.js API process (kept running by systemd or pm2)
        |
        v
Database file on the server's disk, included in the nightly backup
```

Steps that would be required:

1. Build the frontend: `npm run build`, then copy `frontend/dist` to the web root.
2. Run the API as a service with `NODE_ENV=production` and a real `JWT_SECRET`.
3. Obtain a TLS certificate so all traffic is HTTPS, and set `CORS_ORIGIN` to the public
   hostname.
4. Put the server on the campus network behind the existing firewall, reachable from residence
   Wi-Fi and the campus VPN but not from the open internet.
5. Move from SQLite to PostgreSQL if more than one residence is using it heavily, and back up the
   uploads folder along with the database.

## Testing the network layer during the demonstration

```bash
# Is the API alive?
curl http://localhost:4000/api/health

# Log in and read a token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@ufh.ac.za","password":"Student123!"}'

# Call a protected endpoint without a token - returns 401
curl -i http://localhost:4000/api/requests
```

Opening the browser's developer tools on the Network tab during a status change shows the same
thing visually: one `PATCH` request, the JSON response, and the interface updating from it.
