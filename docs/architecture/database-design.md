# 🗄️ Database Design & Schema

> **Complete database architecture documentation including schema design, table structures, relationships, and management for Pandom Stack.**

## 📋 Table of Contents

- [Database Overview](#database-overview)
- [Schema Design](#schema-design)
- [Table Structures](#table-structures)
- [Relationships](#relationships)
- [Data Types & Constraints](#data-types--constraints)
- [Indexes & Performance](#indexes--performance)
- [Migrations & Seeding](#migrations--seeding)
- [Database Management](#database-management)
- [Security Considerations](#security-considerations)

## 🏗️ Database Overview

### Technology Stack
- **Database**: PostgreSQL 17+
- **ORM**: TypeORM with TypeScript
- **Connection**: Connection pooling with automatic retry
- **Migrations**: TypeORM migrations for schema versioning
- **Seeding**: Automated data seeding for development

### Database Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ PostgreSQL  │  │   MinIO     │                          │
│  │  Database   │  │   Cache     │  │   Storage   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                │                                 │
│   Relational Data   File Storage                           │
│   User Management   Document Storage                       │
│   Audit Logging     Media Files                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   ORM LAYER                                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   TypeORM   │  │  Entities   │  │ Migrations  │        │
│  │   ORM       │  │   Models    │  │   Schema    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Schema Design

### Core Tables

| Table | Purpose | Records | Growth |
|-------|---------|---------|--------|
| `auth_users` | User authentication and management | ~10K | Medium |
| `user_profiles` | Extended user profile data | ~10K | Medium |
| `audit_logs` | Security and activity logging | ~1M | High |
| `sessions` | User session management | ~1K | High |

### Schema Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐        ┌─────────────────┐            │
│  │   auth_users    │        │  user_profiles  │            │
│  │                 │        │                 │            │
│  │ uuid (PK)       │◄───────┤ uuid (PK)       │            │
│  │ email (UQ)      │        │ tags[]          │            │
│  │ password_hash   │        │ metadata (JSONB)│            │
│  │ role (ENUM)     │        │ created_at      │            │
│  │ is_active       │        │ updated_at      │            │
│  │ is_verified     │        └─────────────────┘            │
│  │ is_configured   │                                      │
│  │ verification_   │        ┌─────────────────┐            │
│  │   token         │        │   audit_logs    │            │
│  │ reset_token     │        │                 │            │
│  │ refresh_token   │        │ id (PK)         │            │
│  │ last_login_at   │        │ user_uuid (FK)  │            │
│  │ created_at      │        │ event_type      │            │
│  │ updated_at      │        │ timestamp       │            │
│  └─────────────────┘        │ details (JSONB) │            │
│                             │ ip_address      │            │
│  ┌─────────────────┐        │ user_agent      │            │
│  │    sessions     │        └─────────────────┘            │
│  │                 │                                      │
│  │ id (PK)         │        ┌─────────────────┐            │
│  │ user_uuid (FK)  │        │   security_logs │            │
│  │ token           │        │                 │            │
│  │ expires_at      │        │ id (PK)         │            │
│  │ created_at      │        │ user_uuid (FK)  │            │
│  │ ip_address      │        │ event_type      │            │
│  │ user_agent      │        │ severity        │            │
│  └─────────────────┘        │ details (JSONB) │            │
│                             │ timestamp       │            │
│                             └─────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ Table Structures

### 1. `auth_users` Table

**Purpose**: Core user authentication and account management

```sql
CREATE TABLE auth_users (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role userrole DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_configured BOOLEAN DEFAULT false,
    verification_token TEXT,
    verification_expires TIMESTAMP,
    reset_token TEXT,
    reset_token_expiry TIMESTAMP,
    refresh_token TEXT,
    refresh_token_expires TIMESTAMP,
    last_login_at TIMESTAMP,
    profile_uuid UUID UNIQUE REFERENCES user_profiles(uuid),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features**:
- **UUID Primary Key**: Secure, globally unique identifiers
- **Email Uniqueness**: Enforced at database level
- **Role Enum**: Type-safe role management
- **Token Management**: Verification and reset tokens
- **Session Tracking**: Last login and refresh tokens
- **Profile Relationship**: One-to-one with user profiles

### 2. `user_profiles` Table

**Purpose**: Extended user profile information and metadata

```sql
CREATE TABLE user_profiles (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features**:
- **Flexible Tags**: PostgreSQL text array for categorization
- **JSONB Metadata**: Flexible schema for additional data
- **Automatic Timestamps**: Creation and update tracking
- **UUID Primary Key**: Consistent with user table

### 3. `audit_logs` Table

**Purpose**: Comprehensive audit trail for security and compliance

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_uuid UUID REFERENCES auth_users(uuid),
    event_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'info'
);
```

**Key Features**:
- **Comprehensive Logging**: All user actions tracked
- **IP Tracking**: Security monitoring
- **JSONB Details**: Flexible event data storage
- **Severity Levels**: Info, warning, error, critical

### 4. `sessions` Table

**Purpose**: User session management and tracking

```sql
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_uuid UUID REFERENCES auth_users(uuid),
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);
```

**Key Features**:
- **Session Tokens**: Secure session management
- **Expiration Tracking**: Automatic session cleanup
- **Security Monitoring**: IP and user agent tracking

## 🔗 Relationships

### Primary Relationships

```typescript
// User -> UserProfile (One-to-One)
@Entity('auth_users')
export class User {
  @OneToOne(() => UserProfile, profile => profile.user)
  @JoinColumn({ name: 'profile_uuid', referencedColumnName: 'uuid' })
  profile: UserProfile;
}

// UserProfile -> User (One-to-One)
@Entity('user_profiles')
export class UserProfile {
  @OneToOne(() => User, user => user.profile)
  user: User;
}
```

### Audit Relationships

```typescript
// Audit Logs -> User (Many-to-One)
@Entity('audit_logs')
export class AuditLog {
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'uuid' })
  user: User;
}

// Sessions -> User (Many-to-One)
@Entity('sessions')
export class Session {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'uuid' })
  user: User;
}
```

### Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    RELATIONSHIPS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    1:1    ┌─────────────┐                │
│  │   User      │◄─────────►│UserProfile  │                │
│  │             │           │             │                │
│  │ uuid (PK)   │           │ uuid (PK)   │                │
│  │ email       │           │ tags[]      │                │
│  │ role        │           │ metadata    │                │
│  └─────────────┘           └─────────────┘                │
│         │                           │                      │
│         │ 1:N                       │ 1:N                  │
│         ▼                           ▼                      │
│  ┌─────────────┐           ┌─────────────┐                │
│  │ AuditLogs   │           │  Sessions   │                │
│  │             │           │             │                │
│  │ user_uuid   │           │ user_uuid   │                │
│  │ event_type  │           │ token       │                │
│  │ timestamp   │           │ expires_at  │                │
│  └─────────────┘           └─────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Data Types & Constraints

### PostgreSQL Data Types

| Type | Usage | Example | Benefits |
|------|-------|---------|----------|
| **UUID** | Primary keys | `123e4567-e89b-12d3-a456-426614174000` | Security, uniqueness |
| **VARCHAR(255)** | Email, names | `user@example.com` | Length validation |
| **TEXT** | Long content | `Long description...` | Unlimited length |
| **TEXT[]** | Tags array | `['tag1', 'tag2']` | Array operations |
| **JSONB** | Metadata | `{"key": "value"}` | Flexible schema |
| **TIMESTAMP** | Dates | `2024-01-15 10:30:00` | Timezone support |
| **BOOLEAN** | Flags | `true/false` | Simple boolean logic |
| **ENUM** | Roles | `'admin'/'user'` | Type safety |

### Custom Types

```sql
-- User Role Enum
CREATE TYPE userrole AS ENUM ('admin', 'user');

-- Usage in tables
role userrole DEFAULT 'user'
```

### Constraints

```sql
-- Primary Key Constraints
PRIMARY KEY (uuid)

-- Unique Constraints
UNIQUE (email)
UNIQUE (profile_uuid)

-- Foreign Key Constraints
FOREIGN KEY (profile_uuid) REFERENCES user_profiles(uuid)
FOREIGN KEY (user_uuid) REFERENCES auth_users(uuid)

-- Check Constraints
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
CHECK (role IN ('admin', 'user'))
```

## ⚡ Indexes & Performance

### Primary Indexes

```sql
-- Primary Key Indexes (automatic)
CREATE INDEX ON auth_users (uuid);
CREATE INDEX ON user_profiles (uuid);

-- Unique Indexes (automatic)
CREATE UNIQUE INDEX ON auth_users (email);
CREATE UNIQUE INDEX ON auth_users (profile_uuid);
```

### Performance Indexes

```sql
-- Email lookup for authentication
CREATE INDEX idx_auth_users_email ON auth_users (email);

-- Role-based queries
CREATE INDEX idx_auth_users_role ON auth_users (role);

-- Active user queries
CREATE INDEX idx_auth_users_active ON auth_users (is_active) WHERE is_active = true;

-- Verification token lookup
CREATE INDEX idx_auth_users_verification ON auth_users (verification_token) WHERE verification_token IS NOT NULL;

-- Reset token lookup
CREATE INDEX idx_auth_users_reset ON auth_users (reset_token) WHERE reset_token IS NOT NULL;

-- Audit logs by user and time
CREATE INDEX idx_audit_logs_user_time ON audit_logs (user_uuid, timestamp DESC);

-- Sessions by user and expiration
CREATE INDEX idx_sessions_user_expires ON sessions (user_uuid, expires_at);

-- Tags search (GIN index for array operations)
CREATE INDEX idx_user_profiles_tags ON user_profiles USING GIN (tags);

-- Metadata search (GIN index for JSONB)
CREATE INDEX idx_user_profiles_metadata ON user_profiles USING GIN (metadata);
```

### Query Optimization

```sql
-- Efficient user lookup with profile
SELECT u.*, p.tags, p.metadata
FROM auth_users u
LEFT JOIN user_profiles p ON u.profile_uuid = p.uuid
WHERE u.email = $1 AND u.is_active = true;

-- Efficient audit log queries
SELECT * FROM audit_logs
WHERE user_uuid = $1
ORDER BY timestamp DESC
LIMIT 100;

-- Tag-based user search
SELECT u.* FROM auth_users u
JOIN user_profiles p ON u.profile_uuid = p.uuid
WHERE 'developer' = ANY(p.tags);
```

## 🔄 Migrations & Seeding

### TypeORM Migrations

```typescript
// Example migration: Add user profile table
export class CreateUserProfiles1234567890123 implements MigrationInterface {
    name = 'CreateUserProfiles1234567890123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user_profiles" (
                "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tags" text array NOT NULL DEFAULT '{}',
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_profiles" PRIMARY KEY ("uuid")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_profiles"`);
    }
}
```

### Database Seeding

```typescript
// Admin user seeding
export class SeedAdminUser implements DataSource {
    async run(dataSource: DataSource): Promise<void> {
        const userRepository = dataSource.getRepository(User);
        const profileRepository = dataSource.getRepository(UserProfile);

        // Create admin profile
        const profile = profileRepository.create({
            tags: ['admin', 'system'],
            metadata: {
                role: 'administrator',
                permissions: ['all']
            }
        });
        await profileRepository.save(profile);

        // Create admin user
        const user = userRepository.create({
            email: 'admin@pandom.com',
            password_hash: await bcrypt.hash('admin123', 12),
            role: UserRole.admin,
            is_active: true,
            is_verified: true,
            is_configured: true,
            profile_uuid: profile.uuid
        });
        await userRepository.save(user);
    }
}
```

### Migration Commands

```bash
# Generate new migration
npm run migration:generate -- src/database/migrations/NewMigration

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

## 🛠️ Database Management

### Connection Configuration

```typescript
// TypeORM configuration
TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, UserProfile],
        synchronize: false, // Use migrations in production
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production',
        extra: {
            max: 20, // Connection pool size
            connectionTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
        }
    }),
    inject: [ConfigService],
})
```

### Health Checks

```typescript
// Database health check
async checkDatabaseHealth(): Promise<boolean> {
    try {
        await this.dataSource.query('SELECT 1');
        return true;
    } catch (error) {
        this.logger.error('Database health check failed:', error);
        return false;
    }
}

// Table existence check
async checkTables(): Promise<boolean> {
    try {
        const result = await this.dataSource.query(`
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('auth_users', 'user_profiles')
        `);
        return parseInt(result[0].count) === 2;
    } catch (error) {
        return false;
    }
}
```

### Backup & Recovery

```bash
# Database backup
pg_dump -h localhost -U pandom_user -d pandom_db > backup.sql

# Database restore
psql -h localhost -U pandom_user -d pandom_db < backup.sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql
```

## 🔒 Security Considerations

### Data Protection

```sql
-- Encrypt sensitive columns
ALTER TABLE auth_users 
ADD COLUMN password_hash_encrypted BYTEA;

-- Row Level Security (RLS)
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON auth_users
    FOR ALL USING (uuid = current_user_id());

-- Audit triggers
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_uuid, event_type, details)
    VALUES (current_user_id(), TG_OP, row_to_json(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON auth_users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### Access Control

```sql
-- Create application user with limited privileges
CREATE USER pandom_app WITH PASSWORD 'secure_password';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE pandom_db TO pandom_app;
GRANT USAGE ON SCHEMA public TO pandom_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pandom_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pandom_app;

-- Revoke unnecessary permissions
REVOKE CREATE ON SCHEMA public FROM pandom_app;
REVOKE DROP ON SCHEMA public FROM pandom_app;
```

### Monitoring & Alerts

```sql
-- Monitor failed login attempts
SELECT COUNT(*) as failed_logins
FROM audit_logs 
WHERE event_type = 'login_failed' 
AND timestamp > NOW() - INTERVAL '1 hour';

-- Monitor suspicious activity
SELECT user_uuid, COUNT(*) as activity_count
FROM audit_logs 
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY user_uuid 
HAVING COUNT(*) > 100;

-- Clean up expired sessions
DELETE FROM sessions 
WHERE expires_at < NOW();
```

---

**Pandom Stack Database** provides a robust, secure, and scalable foundation for user management and data storage with comprehensive audit trails and performance optimization. 