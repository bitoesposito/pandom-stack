# 📋 Database Structure

This documentation describes the main tables structure used for user management and their profiles.

---

## user_profiles

Table that stores public and customizable user profile information.

| Column         | Type         | Constraints / Default                       | Description                                      |
|----------------|--------------|--------------------------------------------|--------------------------------------------------|
| `uuid`         | UUID         | PRIMARY KEY, DEFAULT `gen_random_uuid()`   | Unique identifier for the profile                 |
| `display_name` | VARCHAR(100) |                                            | Public display name                               |
| `tags`         | TEXT[]       |                                            | Array of tags or keywords                          |
| `metadata`     | JSONB        | DEFAULT `'{}'::jsonb`                       | Flexible additional data in JSON format           |
| `created_at`   | TIMESTAMP    | NOT NULL, DEFAULT `CURRENT_TIMESTAMP`      | Creation timestamp                                |
| `updated_at`   | TIMESTAMP    | NOT NULL, DEFAULT `CURRENT_TIMESTAMP`      | Last update timestamp                             |

---

## auth_users

Table that stores authentication data and account management info.

| Column              | Type         | Constraints / Default                                   | Description                                        |
|---------------------|--------------|---------------------------------------------------------|----------------------------------------------------|
| `uuid`              | UUID         | PRIMARY KEY, DEFAULT `gen_random_uuid()`                 | Unique identifier for the user                      |
| `email`             | VARCHAR(255) | NOT NULL, UNIQUE                                        | User's email, unique                                |
| `password_hash`     | TEXT         | NOT NULL                                               | Hashed password                                    |
| `role`              | VARCHAR(20)  | NOT NULL, DEFAULT `'user'`                              | User role (e.g., user, admin)                       |
| `is_active`         | BOOLEAN      | NOT NULL, DEFAULT `TRUE`                                | Account active status                               |
| `is_verified`       | BOOLEAN      | NOT NULL, DEFAULT `FALSE`                               | Email verification status                           |
| `is_configured`     | BOOLEAN      | NOT NULL, DEFAULT `FALSE`                               | Initial setup completed status                       |
| `verification_token`| TEXT         |                                                         | Email verification token                            |
| `verification_expires` | TIMESTAMP  |                                                         | Verification token expiry                           |
| `reset_token`       | TEXT         |                                                         | Password reset token                                |
| `reset_token_expiry`| TIMESTAMP    |                                                         | Password reset token expiry                         |
| `last_login_at`     | TIMESTAMP    |                                                         | Last login timestamp                                |
| `profile_uuid`      | UUID         | UNIQUE, FOREIGN KEY REFERENCES `user_profiles(uuid)` ON DELETE SET NULL | Link to associated user profile                     |
| `created_at`        | TIMESTAMP    | NOT NULL, DEFAULT `CURRENT_TIMESTAMP`                    | Creation timestamp                                 |
| `updated_at`        | TIMESTAMP    | NOT NULL, DEFAULT `CURRENT_TIMESTAMP`                    | Last update timestamp                              |

---

## Relationships

- Each `auth_users` entry can be linked to a single `user_profiles` record via `profile_uuid`.
- If a profile is deleted, the reference in `auth_users.profile_uuid` is set to NULL (`ON DELETE SET NULL`).

---