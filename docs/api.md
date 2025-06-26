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
- `backend/src/database/migration.service.ts` - Migration management
- `backend/src/database/database.controller.ts` - Database API
- `backend/database/schema.sql` - Database schema
- `backend/database/migrations/` - Migration files

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
| GET    | `/profile`             | Retrieve logged user profile                       | ⏳ Pending |
| PUT    | `/profile`             | Update general profile data                        | ⏳ Pending |

---

## 🛡 SECURITY (`/security`)

Tools for security, session management, and privacy.

| Method | Endpoint                    | Description                                   | Status |
|--------|-----------------------------|-----------------------------------------------|--------|
| GET    | `/security/logs`            | List recent activities and access             | ⏳ Pending |
| GET    | `/security/download-data`   | Download personal data (GDPR compliance)      | ⏳ Pending |
| DELETE | `/security/delete-account`  | Delete user account                           | ⏳ Pending |

---

## ⚙️ DIGITAL RESILIENCE (`/resilience`)

Endpoints oriented towards robustness, backup, and operational continuity.

| Method | Endpoint               | Description                                       | Status |
|--------|------------------------|---------------------------------------------------|--------|
| GET    | `/status`              | System status (healthcheck)                       | ⏳ Pending |
| GET    | `/offline-data`        | Export essential data in offline format           | ⏳ Pending |

---

## 👨‍💼 ADMIN (`/admin`)

Administrative endpoints for user management and system oversight.

| Method | Endpoint               | Description                                       | Status |
|--------|------------------------|---------------------------------------------------|--------|
| GET    | `/admin/users`         | List all users                                    | ⏳ Pending |
| GET    | `/admin/users/:uuid`   | View a specific user data                         | ⏳ Pending |
| PATCH  | `/admin/users/:uuid`   | Modify account role/status                        | ⏳ Pending |
| DELETE | `/admin/users/:uuid`   | Delete a specific user                            | ⏳ Pending |

---

## 📝 Notes on similar endpoints:

- **`/auth/me`** vs **`/profile`**: `/auth/me` returns basic authentication data, `/profile` returns full profile
- **`/security/download-data`** vs **`/resilience/offline-data`**: The former for GDPR, the latter for offline backup
- **`/security/delete-account`** vs **`/admin/users/:uuid`**: The former for self-delete, the latter for administrative deletion

---

## 🧪 Testing

### 📁 Test Organization

```
backend/tests/
├── auth/                  # Auth-specific tests
├── integration/           # Integration tests
│   ├── auth.test.js      # Auth integration tests
│   └── database.test.js  # Database integration tests
├── unit/                  # Unit tests
└── fixtures/              # Test data
    └── test-data.json    # Test fixtures
```

### 🚀 How to Test

1. **Setup Database**: 
   ```bash
   # Copy environment file
   cp backend/env.example backend/.env
   # Configure variables in .env
   ```

2. **Start Server**: 
   ```bash
   cd backend
   npm run start:dev
   ```

3. **Run Tests**:
   ```bash
   # Auth tests
   npm run test:auth
   
   # Database tests
   npm run test:database
   
   # All integration tests
   npm run test:integration
   
   # Unit tests
   npm run test:unit
   ```

### 📋 Test Commands

| Command | Description |
|---------|-------------|
| `npm run test:auth` | Test authentication system |
| `npm run test:database` | Test database operations |
| `npm run test:integration` | Run all integration tests |
| `npm run test:unit` | Run unit tests with Jest |
| `npm run test:cov` | Run tests with coverage |

## 📚 Documentazione Correlata

- [Testing Guide](testing.md) - Guida completa ai test
- [Auth Testing Guide](auth-testing.md) - Test specifici per autenticazione
- [Database Management](database-management.md) - Gestione database e migrazioni
- [DTO Documentation](dto.md) - Documentazione DTO e validazioni