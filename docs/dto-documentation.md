# 📋 DTO Documentation - Data Transfer Objects

This documentation defines all Data Transfer Objects (DTOs) used in the API endpoints, maintaining the consistent `ApiResponse<T>` structure.

---

## 🔐 AUTH Module DTOs

### Request DTOs

#### `LoginDto`
```typescript
export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/, {
    message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  password: string;
}
```

#### `RegisterDto`
```typescript
export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/, {
    message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  password: string;

  @IsString()
  @IsOptional()
  @Length(1, 100, { message: 'Display name must be between 1 and 100 characters' })
  display_name?: string;
}
```

#### `ForgotPasswordDto`
```typescript
export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
```

#### `ResetPasswordDto`
```typescript
export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/, {
    message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  password: string;
}
```

#### `VerifyEmailDto`
```typescript
export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Verification token is required' })
  token: string;
}
```

### Response DTOs

#### `LoginResponseDto`
```typescript
export interface LoginResponseDto {
  user: {
    uuid: string;
    email: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    is_configured: boolean;
    last_login_at: string;
  };
  profile?: {
    uuid: string;
    display_name: string;
    tags?: string[];
  };
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
```

#### `AuthMeResponseDto`
```typescript
export interface AuthMeResponseDto {
  user: {
    uuid: string;
    email: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    is_configured: boolean;
    last_login_at: string;
    created_at: string;
    updated_at: string;
  };
  profile?: {
    uuid: string;
    display_name: string;
    tags?: string[];
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
  };
}
```

---

## 👤 PROFILE Module DTOs

### Request DTOs

#### `UpdateProfileDto`
```typescript
export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Length(1, 100, { message: 'Display name must be between 1 and 100 characters' })
  display_name?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
```

### Response DTOs

#### `ProfileResponseDto`
```typescript
export interface ProfileResponseDto {
  uuid: string;
  display_name: string;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

---

## 🛡 SECURITY Module DTOs

### Response DTOs

#### `SecurityLogsResponseDto`
```typescript
export interface SecurityLogsResponseDto {
  logs: Array<{
    id: string;
    action: string;
    ip_address: string;
    user_agent: string;
    timestamp: string;
    success: boolean;
    details?: Record<string, any>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

#### `SessionsResponseDto`
```typescript
export interface SessionsResponseDto {
  sessions: Array<{
    id: string;
    device_info: string;
    ip_address: string;
    created_at: string;
    last_used: string;
    is_current: boolean;
  }>;
}
```

#### `DownloadDataResponseDto`
```typescript
export interface DownloadDataResponseDto {
  download_url: string;
  expires_at: string;
  file_size: number;
  format: 'json' | 'csv' | 'xml';
}
```

---

## ⚙️ RESILIENCE Module DTOs

### Response DTOs

#### `SystemStatusResponseDto`
```typescript
export interface SystemStatusResponseDto {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'healthy' | 'degraded' | 'down';
    storage: 'healthy' | 'degraded' | 'down';
    email: 'healthy' | 'degraded' | 'down';
  };
  metrics: {
    active_users: number;
    total_requests: number;
    error_rate: number;
  };
}
```

#### `OfflineDataResponseDto`
```typescript
export interface OfflineDataResponseDto {
  download_url: string;
  expires_at: string;
  data_summary: {
    profile_data: boolean;
    security_logs: boolean;
    user_preferences: boolean;
  };
  file_size: number;
  format: 'json' | 'zip';
}
```

---

## 👨‍💼 ADMIN Module DTOs

### Request DTOs

#### `UpdateUserAdminDto`
```typescript
export class UpdateUserAdminDto {
  @IsString()
  @IsOptional()
  @IsIn(['user', 'admin'], { message: 'Invalid role' })
  role?: 'user' | 'admin';

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;
}
```

### Response DTOs

#### `AdminUsersListResponseDto`
```typescript
export interface AdminUsersListResponseDto {
  users: Array<{
    uuid: string;
    email: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    is_configured: boolean;
    last_login_at?: string;
    created_at: string;
    profile?: {
      uuid: string;
      display_name: string;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

#### `AdminUserDetailResponseDto`
```typescript
export interface AdminUserDetailResponseDto {
  user: {
    uuid: string;
    email: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    is_configured: boolean;
    verification_token?: string;
    verification_expires?: string;
    reset_token?: string;
    reset_token_expiry?: string;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
  };
  profile?: {
    uuid: string;
    display_name: string;
    tags?: string[];
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
  };
  security_info: {
    total_sessions: number;
    failed_login_attempts: number;
    last_security_incident?: string;
  };
}
```

---

## 📝 Usage Examples

### Example API Response Structure

```typescript
// Success Response
{
  "http_status_code": 200,
  "success": true,
  "message": "User profile updated successfully",
  "data": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "display_name": "John Doe",
    "tags": ["developer", "typescript"],
    "metadata": { "location": "Italy" },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T12:00:00Z"
  }
}

// Error Response
{
  "http_status_code": 400,
  "success": false,
  "message": "Validation failed",
  "data": {
    "errors": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## 🔧 Implementation Notes

1. **Validation**: All DTOs use `class-validator` decorators for input validation
2. **Consistency**: All responses follow the `ApiResponse<T>` structure
3. **Security**: Sensitive data (passwords, tokens) are never returned in responses
4. **Pagination**: List endpoints include pagination metadata
5. **Optional Fields**: Profile-related fields are optional to support gradual profile completion
6. **Type Safety**: All DTOs are strongly typed for better development experience
7. **Simplified Structure**: Profile structure matches the simplified database schema
8. **Unlimited Tags**: No restrictions on the number of tags per profile 