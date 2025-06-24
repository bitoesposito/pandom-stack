# 📘 API Endpoints – Auth, Profile, Security & Resilience

This documentation lists all REST endpoints organized by module, useful for a scalable, secure, and easily extensible architecture.

---

## 🔐 AUTH (`/auth`)

Authentication, registration, login, and access management.

| Method | Endpoint                  | Description                                     |
|--------|---------------------------|-------------------------------------------------|
| POST   | `/auth/register`          | Register a new user                             |
| POST   | `/auth/login`             | Login and return JWT                            |
| POST   | `/auth/logout`            | Perform logout                                  |
| GET    | `/auth/me`                | Returns logged user data                        |
| POST   | `/auth/verify`            | Verify email via token                          |
| POST   | `/auth/forgot-password`   | Send password reset link                        |
| POST   | `/auth/reset-password`    | Reset password via token                        |

---

## 👤 PROFILE (`/profile`)

Management of public or personal user profile.

| Method | Endpoint               | Description                                        |
|--------|------------------------|----------------------------------------------------|
| GET    | `/profile`             | Retrieve logged user profile                       |
| PUT    | `/profile`             | Update general profile data                        |

---

## 🛡 SECURITY (`/security`)

Tools for security, session management, and privacy.

| Method | Endpoint                    | Description                                   |
|--------|-----------------------------|-----------------------------------------------|
| GET    | `/security/logs`            | List recent activities and access             |
| GET    | `/security/download-data`   | Download personal data (GDPR compliance)      |
| DELETE | `/security/delete-account`  | Delete user account                           |

---

## ⚙️ DIGITAL RESILIENCE (`/resilience`)

Endpoints oriented towards robustness, backup, and operational continuity.

| Method | Endpoint               | Description                                       |
|--------|------------------------|---------------------------------------------------|
| GET    | `/status`              | System status (healthcheck)                       |
| GET    | `/offline-data`        | Export essential data in offline format           |

---

## �� ADMIN (`/admin`)

Administrative endpoints for user management and system oversight.

| Method | Endpoint               | Description                                       |
|--------|------------------------|---------------------------------------------------|
| GET    | `/admin/users`         | List all users                                    |
| GET    | `/admin/users/:uuid`   | View a specific user data                         |
| PATCH  | `/admin/users/:uuid`   | Modify account role/status                        |
| DELETE | `/admin/users/:uuid`   | Delete a specific user                            |

---

## 📝 Notes on similar endpoints:

- **`/auth/me`** vs **`/profile`**: `/auth/me` returns basic authentication data, `/profile` returns full profile
- **`/security/download-data`** vs **`/resilience/offline-data`**: The former for GDPR, the latter for offline backup
- **`/security/delete-account`** vs **`/admin/users/:uuid`**: The former for self-delete, the latter for administrative deletion

