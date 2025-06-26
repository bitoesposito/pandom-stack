# 🔄 JWT Refresh Token Implementation

## Overview

The authentication system now supports JWT refresh tokens for enhanced security and better user experience. This implementation follows security best practices with token rotation and database storage.

## 🔐 Security Features

### Token Types
- **Access Token**: Short-lived (1 hour) for API requests
- **Refresh Token**: Long-lived (7 days) for obtaining new access tokens

### Security Measures
- Refresh tokens are stored in the database
- Token rotation on each refresh
- Automatic cleanup of expired tokens
- Validation against stored tokens

## 📋 API Endpoints

### POST `/auth/refresh`
Refreshes the JWT access token using a valid refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "uuid": "user-uuid",
      "email": "user@example.com",
      "role": "user",
      "is_active": true,
      "is_verified": true,
      "is_configured": true,
      "last_login_at": "2024-01-01T12:00:00.000Z"
    },
    "profile": {
      "uuid": "profile-uuid",
      "display_name": "John Doe",
      "tags": []
    }
  },
  "message": "Token refreshed successfully"
}
```

## 🔄 Flow Diagram

```
1. User Login
   ↓
2. Server generates access_token (1h) + refresh_token (7d)
   ↓
3. Server stores refresh_token in database
   ↓
4. Client stores both tokens
   ↓
5. Access token expires (after 1h)
   ↓
6. Client calls /auth/refresh with refresh_token
   ↓
7. Server validates refresh_token against database
   ↓
8. Server generates new access_token + new refresh_token
   ↓
9. Server updates stored refresh_token (rotation)
   ↓
10. Client updates stored tokens
```

## 🗄️ Database Schema

### TypeORM Entity Updates

The `User` entity has been updated with new fields for refresh token management:

```typescript
@Entity('auth_users')
export class User {
  // ... existing fields ...
  
  @Column({ name: 'refresh_token', nullable: true, type: 'text' })
  refresh_token: string | null;

  @Column({ name: 'refresh_token_expires', nullable: true, type: 'timestamp' })
  refresh_token_expires: Date | null;
}
```

### Automatic Database Updates

TypeORM will automatically handle the database schema changes when the application starts. The new columns will be added to the `auth_users` table automatically.

**Note**: No manual SQL migration is required. TypeORM's synchronization feature will add the missing columns.

## 🛡️ Security Considerations

### Token Storage
- **Frontend**: Store tokens in localStorage or secure storage
- **Backend**: Store refresh tokens in database with expiration
- **Rotation**: New refresh token issued on each refresh

### Validation
- Verify JWT signature
- Check token expiration
- Validate against stored refresh token
- Ensure user account is active

### Cleanup
- Expired refresh tokens are automatically cleared
- Database indexes optimize cleanup queries
- Regular cleanup jobs can be implemented

## 🚀 Frontend Integration

### Token Management
```typescript
// Store tokens after login
localStorage.setItem('access_token', response.data.access_token);
localStorage.setItem('refresh_token', response.data.refresh_token);

// Use access token for API calls
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
};

// Refresh token when access token expires
async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('access_token', data.data.access_token);
    localStorage.setItem('refresh_token', data.data.refresh_token);
  }
}
```

### Automatic Refresh
```typescript
// Interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await refreshToken();
        // Retry original request
        return axios.request(error.config);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## 🔧 Configuration

### Environment Variables
```env
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d
```

### Token Expiration Times
- **Access Token**: 1 hour (configurable)
- **Refresh Token**: 7 days (configurable)
- **Database Storage**: 7 days (matches refresh token)

## 🧪 Testing

### Test Cases
1. **Valid Refresh**: Should return new access and refresh tokens
2. **Expired Refresh**: Should return 401 Unauthorized
3. **Invalid Refresh**: Should return 401 Unauthorized
4. **Inactive User**: Should return 401 Unauthorized
5. **Token Rotation**: Should issue new refresh token each time

### Example Test
```typescript
describe('Refresh Token', () => {
  it('should refresh tokens successfully', async () => {
    // Login to get tokens
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    const { refresh_token } = loginResponse.body.data;
    
    // Refresh tokens
    const refreshResponse = await request(app)
      .post('/auth/refresh')
      .send({ refresh_token });
    
    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.access_token).toBeDefined();
    expect(refreshResponse.body.data.refresh_token).toBeDefined();
    expect(refreshResponse.body.data.refresh_token).not.toBe(refresh_token);
  });
});
```

## 📚 Related Documentation

- [API Documentation](api.md) - Complete API reference
- [Auth Implementation](auth.md) - Authentication system overview
- [Database Management](database-management.md) - Database operations
- [Security Best Practices](security.md) - Security guidelines 