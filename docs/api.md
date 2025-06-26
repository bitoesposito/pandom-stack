# 📘 API Endpoints – Auth, Profile, Security & Resilience

This documentation lists all REST endpoints organized by module, useful for a scalable, secure, and easily extensible architecture.

---

## 🚀 Implementation Status

### ✅ AUTH Module - FULLY IMPLEMENTED
The authentication system has been completely implemented with the following features:
- User registration with profile creation
- Secure login with JWT tokens (access + refresh tokens)
- JWT token refresh mechanism with rotation
- Password hashing with bcrypt (12 salt rounds)
- Input validation with class-validator
- JWT strategy and guards
- Password reset functionality
- Email verification system
- Secure error handling
- Refresh token storage in database for enhanced security

**Files implemented:**
- `backend/src/auth/auth.service.ts` - Complete business logic
- `backend/src/auth/auth.controller.ts` - All endpoints
- `backend/src/auth/auth.dto.ts` - Validation DTOs
- `backend/src/auth/entities/user.entity.ts` - Database entity
- `backend/src/auth/strategies/jwt.strategy.ts` - JWT authentication
- `backend/src/auth/guards/jwt-auth.guard.ts` - Route protection
- `backend/src/auth/guards/roles.guard.ts` - Role-based access control

### ✅ DATABASE Module - FULLY IMPLEMENTED
The database management system has been completely implemented with:
- Automatic database initialization
- Migration system with versioning
- Health checks and monitoring
- Admin-only database operations
- SQL schema management

**Files implemented:**
- `backend/src/database/database.service.ts` - Database initialization
- `backend/src/database/database.controller.ts` - Database API
- Database schema management with TypeORM

### ✅ PROFILE Module - FULLY IMPLEMENTED
The user profile management system has been completely implemented with:
- Profile creation and updates
- Metadata and tags support
- Validation and error handling
- Integration with user authentication

**Files implemented:**
- `backend/src/users/users.service.ts` - Profile business logic
- `backend/src/users/users.controller.ts` - Profile endpoints
- `backend/src/users/entities/user-profile.entity.ts` - Profile entity

### ✅ SECURITY Module - FULLY IMPLEMENTED
The security system has been completely implemented with:
- Security logs and audit trail
- Session management with IP/User Agent tracking
- GDPR-compliant data export
- Account deletion with admin protection
- Comprehensive audit logging

**Files implemented:**
- `backend/src/security/security.service.ts` - Security business logic
- `backend/src/security/security.controller.ts` - Security endpoints
- `backend/src/security/security.dto.ts` - Security DTOs
- `backend/src/common/services/audit.service.ts` - Audit logging system

### ✅ RESILIENCE Module - FULLY IMPLEMENTED
The resilience system has been completely implemented with:
- System health monitoring
- Service status checks (database, storage, email)
- Offline data export functionality
- System metrics and analytics
- Download endpoints for data exports

**Files implemented:**
- `backend/src/resilience/resilience.service.ts` - Resilience business logic
- `backend/src/resilience/resilience.controller.ts` - Resilience endpoints
- `backend/src/resilience/resilience.dto.ts` - Resilience DTOs

### ✅ ADMIN Module - FULLY IMPLEMENTED
The admin system has been completely implemented with:
- User management (list, suspend, delete)
- System metrics and analytics
- Audit logs viewing
- Role-based access control
- Admin protection features

**Files implemented:**
- `backend/src/admin/admin.service.ts` - Admin business logic
- `backend/src/admin/admin.controller.ts` - Admin endpoints
- `backend/src/admin/admin.dto.ts` - Admin DTOs

---

## 🔐 AUTH (`/auth`)

Authentication, registration, login, and access management.

| Method | Endpoint                | Description                                    | Status        |
|--------|-------------------------|------------------------------------------------|---------------|
| POST   | `/auth/register`        | Register a new user                            | ✅ Implemented |
| POST   | `/auth/login`           | Authenticate user and get JWT                  | ✅ Implemented |
| POST   | `/auth/refresh`         | Refresh JWT access token                       | ✅ Implemented |
| GET    | `/auth/me`              | Get current user data                          | ✅ Implemented |
| POST   | `/auth/verify`          | Verify email via token                         | ✅ Implemented |
| POST   | `/auth/resend-verification` | Resend verification email                | ✅ Implemented |
| POST   | `/auth/forgot-password` | Send password reset link                       | ✅ Implemented |
| POST   | `/auth/reset-password`  | Reset password via token                       | ✅ Implemented |

---

## 🗄️ DATABASE (`/database`)

Database management, migrations, and monitoring (Admin only).

| Method | Endpoint               | Description                                       | Status |
|--------|------------------------|---------------------------------------------------|--------|
| POST   | `/database/init`       | Initialize database (tables + admin user)         | ✅ Implemented |
| POST   | `/database/migrate`    | Run pending migrations                            | ✅ Implemented |
| GET    | `/database/migrations` | Get migration status                              | ✅ Implemented |
| GET    | `/database/health`     | Database health check                             | ✅ Implemented |
| GET    | `/database/stats`      | Database statistics                               | ✅ Implemented |

---

## 👤 PROFILE (`/profile`)

Management of public or personal user profile.

| Method | Endpoint               | Description                                        | Status |
|--------|------------------------|----------------------------------------------------|--------|
| GET    | `/profile`             | Retrieve logged user profile                       | ✅ Implemented |
| PUT    | `/profile`             | Update general profile data                        | ✅ Implemented |

---

## 🛡 SECURITY (`/security`)

Tools for security, session management, and privacy.

| Method | Endpoint                    | Description                                   | Status |
|--------|-----------------------------|-----------------------------------------------|--------|
| GET    | `/security/logs`            | List recent activities and access             | ✅ Implemented |
| GET    | `/security/sessions`        | View active sessions and tokens               | ✅ Implemented |
| GET    | `/security/download-data`   | Download personal data (GDPR compliance)      | ✅ Implemented |
| DELETE | `/security/delete-account`  | Delete user account (⚠️ cannot delete last admin) | ✅ Implemented |

**Security Features:**
- **Admin Protection**: Cannot delete the last admin user in the system
- **Audit Logging**: All security events are logged for compliance
- **Session Management**: Track active sessions with IP and User Agent
- **Data Export**: GDPR-compliant personal data export with expiration

---

## ⚙️ DIGITAL RESILIENCE (`/resilience`)

Endpoints oriented towards robustness, backup, and operational continuity.

| Method | Endpoint               | Description                                       | Status |
|--------|------------------------|---------------------------------------------------|--------|
| GET    | `/resilience/status`   | System status (healthcheck)                       | ✅ Implemented |
| POST   | `/resilience/backup`   | Create system backup                              | ✅ Implemented |
| GET    | `/resilience/backup`   | List available backups                            | ✅ Implemented |
| POST   | `/resilience/backup/:backupId/restore` | Restore system from backup (tested, works in real environment) | ✅ Implemented |

**Resilience Features:**
- **Health Monitoring**: Real-time system health checks for database, storage, and email services
- **Service Status**: Comprehensive service monitoring with status indicators (healthy/degraded/down)
- **Backup System**: Database backup using pg_dump with automatic file management
- **Restore System**: Point-in-time restore capability with backup verification (tested, works)
- **Backup Management**: List, create, and restore backups with audit logging
- **Audit Logging**: All backup operations are logged for compliance
- **Automated Backup**: Automatic backup every 6 hours via Docker containers
- **Retention Policy**: Automatic cleanup of backups older than 7 days
- **Backup Verification**: Automatic checksum calculation and file integrity verification

**Backup Strategy:**
- **Database Backup**: Full PostgreSQL dump using pg_dump
- **File Storage**: MinIO object storage with `backups/` prefix
- **Verification**: Automatic backup file validation (size, existence, checksum)
- **Restore**: Restore tested and works in real environment
- **Audit Trail**: Complete logging of backup/restore operations
- **Automation**: Docker-based cron jobs for backup, cleanup, and verification
- **Retention**: 7-day retention policy with automatic cleanup
- **Cloud Storage**: Scalable MinIO-based storage instead of local filesystem

---

## 👨‍💼 ADMIN (`/admin`)

Administrative endpoints for user management and system oversight.

| Method | Endpoint               | Description                                       | Status |
|--------|------------------------|---------------------------------------------------|--------|
| GET    | `/admin/users`         | List all users                                    | ✅ Implemented |
| PUT    | `/admin/users/:uuid/suspend` | Suspend user account                          | ✅ Implemented |
| DELETE | `/admin/users/:uuid`   | Delete a specific user                            | ✅ Implemented |
| GET    | `/admin/metrics`       | System metrics and analytics                     | ✅ Implemented |
| GET    | `/admin/audit-logs`    | View audit logs                                   | ✅ Implemented |

**Admin Features:**
- **User Management**: Complete user lifecycle management
- **System Analytics**: Real-time metrics and charts
- **Audit Trail**: Comprehensive activity logging
- **Role Protection**: Admin users cannot be suspended/deleted through admin interface

---

## 📝 Notes on similar endpoints:

- **`/auth/me`** vs **`/profile`**: `/auth/me` returns basic authentication data, `/profile` returns full profile
- **`/security/download-data`** vs **`/resilience/offline-data`**: The former for GDPR, the latter for offline backup
- **`/security/delete-account`** vs **`/admin/users/:uuid`**: The former for self-delete, the latter for administrative deletion
- **`/security/logs`**: Provides user-specific security logs and audit trail (integrated with AuditService)