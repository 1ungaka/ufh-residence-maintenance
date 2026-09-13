# Security

The Campus Maintenance Portal implements several security measures to protect user accounts, requests, uploaded files, and system data. Security is enforced primarily on the server side, ensuring that the application's rules cannot be bypassed by modifying the client-side interface or sending requests directly to the API.

## 1. Password Security

User passwords are protected using the **bcrypt** hashing algorithm before they are stored in the database.

Passwords are never stored as plain text. During registration, the password is converted into a bcrypt hash using 10 salt rounds. During login, the supplied password is compared with the stored hash using `bcrypt.compareSync()`.

**Implementation:** `backend/src/controllers/authController.js`

The application uses `bcryptjs`, a JavaScript implementation of bcrypt. It was selected because it does not require native C++ build tools, making installation easier across different development and laboratory environments.

## 2. Authentication

The system uses **JSON Web Tokens (JWT)** to authenticate users after a successful login.

A token contains the user's ID and role and is signed using a secret stored in an environment variable. Tokens expire after eight hours. Authenticated requests must provide the token using the following HTTP header:

```text
Authorization: Bearer <token>
```

The authentication middleware verifies the token's signature and expiry before retrieving the corresponding user from the database. This ensures that a token belonging to a deleted account can no longer be used and that the user's current role is
