# UFH Residence Maintenance Portal

A web-based system that allows University of Fort Hare students to report maintenance problems in their residences and track the progress of their requests.

Maintenance staff can view reported problems, assign requests to themselves, update their progress and mark requests as completed.

## Main Features

### Students
- Register and log in using a UFH student email
- Submit a maintenance request
- Select the problem category and urgency
- Add a description and optional photo
- View the status of submitted requests
- View request history and updates

### Maintenance Staff
- Log in to the system
- View maintenance requests
- Filter requests by category and status
- Assign requests to themselves
- Update the request status
- Add progress notes
- Mark requests as completed

## Request Process

```text
Student reports problem
        ↓
Request submitted
        ↓
Maintenance worker takes request
        ↓
Work starts
        ↓
Progress updates
        ↓
Request completed
```

## Technology Used

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite
- Authentication: JWT
- Password Security: bcrypt

## Project Structure

```text
ufh-residence-maintenance/
├── backend/
├── frontend/
├── docs/
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

### Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open:

http://localhost:5173

## Documentation

More information about the database, algorithms, security, networking, testing and system design can be found in the documentation files in this project.
