# 📚 API Reference

## 📋 Panoramica API

**Pandom Stack** fornisce un'API REST completa e ben documentata per tutte le funzionalità dell'applicazione. L'API è progettata seguendo le best practices REST e include autenticazione JWT, validazione input, e gestione errori standardizzata.

## 🔐 **Autenticazione**

### **JWT Bearer Token**

Tutte le API protette richiedono un token JWT nell'header Authorization:

```http
Authorization: Bearer <jwt_token>
```

### **Ottenere un Token**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "uuid": "user-uuid",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

## 📊 **Formato Response Standard**

Tutte le API seguono un formato di response standardizzato:

```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Dati specifici dell'endpoint
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "total_pages": 10
  }
}
```

## 🚨 **Gestione Errori**

### **Formato Errori**

```json
{
  "http_status_code": 400,
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### **Codici di Stato HTTP**

| Codice | Descrizione |
|--------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `422` | Validation Error |
| `429` | Rate Limited |
| `500` | Internal Server Error |

## 🔐 **Authentication Endpoints**

### **POST /auth/register**

Registra un nuovo utente.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response:**
```json
{
  "http_status_code": 201,
  "success": true,
  "message": "User registered successfully. Please check your email for verification.",
  "data": {
    "user": {
      "uuid": "user-uuid",
      "email": "user@example.com",
      "role": "user",
      "status": "pending_verification"
    }
  }
}
```

### **POST /auth/login**

Autentica un utente esistente.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": true
}
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session_id": "session-uuid-123",
    "expires_in": 2592000,
    "user": {
      "uuid": "user-uuid",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

### **POST /auth/refresh**

Rinnova un token JWT scaduto.

**Headers:**
```http
Authorization: Bearer <refresh_token>
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

### **GET /auth/me**

Ottiene i dati dell'utente corrente.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "User data retrieved successfully",
  "data": {
    "user": {
      "uuid": "user-uuid",
      "email": "user@example.com",
      "role": "user",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastLogin": "2024-01-15T10:30:00.000Z"
    },
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

### **POST /auth/verify**

Verifica l'email dell'utente.

**Request:**
```json
{
  "token": "verification-token"
}
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "uuid": "user-uuid",
      "email": "user@example.com",
      "status": "active"
    }
  }
}
```

### **POST /auth/forgot-password**

Richiede il reset della password.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Password reset email sent successfully",
  "data": {
    "email": "user@example.com"
  }
}
```

### **POST /auth/reset-password**

Resetta la password con OTP.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "user": {
      "uuid": "user-uuid",
      "email": "user@example.com"
    }
  }
}
```

### **POST /auth/resend-verification**

Rinvia l'email di verifica.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Verification email resent successfully",
  "data": {
    "email": "user@example.com"
  }
}
```

## 👤 **User Management Endpoints**

### **GET /users/profile**

Ottiene il profilo dell'utente corrente.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "profile": {
      "uuid": "profile-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://example.com/avatar.jpg",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-01",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "US"
      },
      "preferences": {
        "language": "en",
        "timezone": "America/New_York",
        "notifications": {
          "email": true,
          "sms": false,
          "push": true
        }
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### **PUT /users/profile**

Aggiorna il profilo dell'utente.

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "preferences": {
    "language": "en",
    "timezone": "America/New_York",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    }
  }
}
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "profile": {
      "uuid": "profile-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### **POST /users/change-password**

Cambia la password dell'utente.

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "user": {
      "uuid": "user-uuid",
      "email": "user@example.com"
    }
  }
}
```

## 🛡️ **Security Endpoints**

### **GET /security/logs**

Ottiene i log di sicurezza dell'utente.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (number): Numero di pagina (default: 1)
- `limit` (number): Elementi per pagina (default: 10)
- `type` (string): Tipo di log (opzionale)
- `startDate` (string): Data inizio (ISO 8601)
- `endDate` (string): Data fine (ISO 8601)

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Security logs retrieved successfully",
  "data": {
    "logs": [
      {
        "id": "log-uuid",
        "action": "USER_LOGIN_SUCCESS",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "success": true,
        "details": {
          "device": "Desktop",
          "location": "New York, US",
          "browser": "Chrome"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    }
  }
}
```

### **GET /security/sessions**

Ottiene le sessioni attive dell'utente.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Sessions retrieved successfully",
  "data": {
    "sessions": [
      {
        "id": "session-uuid",
        "device": "Desktop",
        "browser": "Chrome",
        "ipAddress": "192.168.1.100",
        "location": "New York, US",
        "lastActivity": "2024-01-15T10:30:00.000Z",
        "isCurrent": true
      }
    ]
  }
}
```

### **DELETE /security/sessions/{sessionId}**

Termina una sessione specifica.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Session terminated successfully",
  "data": {
    "sessionId": "session-uuid"
  }
}
```

### **DELETE /security/sessions/all**

Termina tutte le sessioni tranne quella corrente.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "All sessions terminated successfully",
  "data": {
    "terminatedCount": 3
  }
}
```

### **GET /security/download-data**

Richiede l'export dei dati utente (GDPR).

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Data export initiated successfully",
  "data": {
    "downloadUrl": "https://api.pandom.com/security/downloads/user-data-user-uuid-timestamp.json",
    "expiresAt": "2024-01-16T10:30:00.000Z",
    "fileSize": "2.5 MB",
    "includes": [
      "personal_data",
      "usage_data",
      "security_logs",
      "preferences"
    ]
  }
}
```

### **GET /security/downloads/user-data-{userId}-{timestamp}.json**

Scarica i dati utente esportati.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": {
    "uuid": "user-uuid",
    "email": "user@example.com",
    "role": "user",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  },
  "security_logs": [
    {
      "action": "USER_LOGIN_SUCCESS",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "ipAddress": "192.168.1.100"
    }
  ],
  "export_info": {
    "exportedAt": "2024-01-15T10:30:00.000Z",
    "requestedBy": "user-uuid",
    "format": "JSON"
  }
}
```

### **DELETE /security/delete-account**

Elimina l'account utente (GDPR Right to Erasure).

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "confirmation": "DELETE_MY_ACCOUNT",
  "reason": "No longer need the service"
}
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Account deletion initiated successfully",
  "data": {
    "deletionScheduled": "2024-01-22T10:30:00.000Z",
    "confirmationEmail": "user@example.com"
  }
}
```

## 👨‍💼 **Admin Endpoints**

### **GET /admin/users**

Ottiene la lista degli utenti (solo admin).

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (number): Numero di pagina (default: 1)
- `limit` (number): Elementi per pagina (default: 10)
- `search` (string): Ricerca per email o nome
- `role` (string): Filtra per ruolo
- `status` (string): Filtra per status

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "uuid": "user-uuid",
        "email": "user@example.com",
        "role": "user",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "lastLogin": "2024-01-15T10:30:00.000Z",
        "profile": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    }
  }
}
```

### **GET /admin/users/{userId}**

Ottiene i dettagli di un utente specifico.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "User details retrieved successfully",
  "data": {
    "user": {
      "uuid": "user-uuid",
      "email": "user@example.com",
      "role": "user",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastLogin": "2024-01-15T10:30:00.000Z"
    },
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "address": {
        "street": "123 Main St",
        "city": "New York"
      }
    },
    "securityLogs": [
      {
        "action": "USER_LOGIN_SUCCESS",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "ipAddress": "192.168.1.100"
      }
    ]
  }
}
```

### **PUT /admin/users/{userId}/role**

Cambia il ruolo di un utente.

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "role": "moderator"
}
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "user": {
      "uuid": "user-uuid",
      "email": "user@example.com",
      "role": "moderator"
    }
  }
}
```

### **PUT /admin/users/{userId}/status**

Cambia lo status di un utente.

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "status": "suspended",
  "reason": "Violation of terms of service"
}
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "user": {
      "uuid": "user-uuid",
      "email": "user@example.com",
      "status": "suspended"
    }
  }
}
```

### **GET /admin/metrics**

Ottiene le metriche del sistema.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `period` (string): Periodo (day, week, month, year)
- `startDate` (string): Data inizio (ISO 8601)
- `endDate` (string): Data fine (ISO 8601)

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "System metrics retrieved successfully",
  "data": {
    "users": {
      "total": 1500,
      "active": 1200,
      "newThisPeriod": 50,
      "growth": 3.5
    },
    "security": {
      "loginAttempts": 2500,
      "failedLogins": 150,
      "suspiciousActivities": 5,
      "dataExports": 25
    },
    "performance": {
      "averageResponseTime": 150,
      "uptime": 99.9,
      "errorRate": 0.1
    }
  }
}
```

## 🔧 **System Endpoints**

### **GET /health**

Health check del sistema.

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "System is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "services": {
      "database": "healthy",
      
      "minio": "healthy"
    },
    "uptime": 86400
  }
}
```

### **GET /metrics**

Metriche del sistema (Prometheus format).

**Response:**
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/auth/me"} 1250
http_requests_total{method="POST",endpoint="/auth/login"} 850

# HELP http_request_duration_seconds Duration of HTTP requests
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 1000
http_request_duration_seconds_bucket{le="0.5"} 1500
http_request_duration_seconds_bucket{le="1"} 1800
```

## 📱 **File Storage Endpoints**

### **GET /storage/health**

Verifica lo stato del servizio di storage.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Storage health check successful",
  "data": {
    "status": "healthy",
    "bucket": "pandom-storage",
    "availableSpace": "1.5 GB",
    "totalFiles": 1250
  }
}
```

### **POST /storage/upload**

Carica un file nel sistema di storage.

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileId": "file-uuid",
    "filename": "document.pdf",
    "size": 1024000,
    "url": "https://storage.example.com/pandom-storage/uploads/document.pdf",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### **GET /storage/files**

Lista i file disponibili per l'utente.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "http_status_code": 200,
  "success": true,
  "message": "Files retrieved successfully",
  "data": {
    "files": [
      {
        "fileId": "file-uuid",
        "filename": "document.pdf",
        "size": 1024000,
        "url": "https://storage.example.com/pandom-storage/uploads/document.pdf",
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20
  }
}
```

## 🔄 **Rate Limiting**

L'API implementa rate limiting per proteggere da abusi:

### **Limiti Standard**
- **Autenticazione**: 5 tentativi per 15 minuti
- **API Generali**: 100 richieste per 15 minuti
- **Upload**: 10 file per ora
- **Export**: 5 export per giorno

### **Headers di Rate Limiting**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640998800
```

## 📝 **Validazione Input**

Tutti gli endpoint validano l'input secondo questi schemi:

### **Email**
- Formato email valido
- Lunghezza massima: 255 caratteri

### **Password**
- Lunghezza minima: 8 caratteri
- Deve contenere: maiuscole, minuscole, numeri, simboli

### **UUID**
- Formato UUID v4 valido

### **Date**
- Formato ISO 8601: `YYYY-MM-DDTHH:mm:ss.sssZ`

## 🔍 **Ricerca e Filtri**

Molti endpoint supportano ricerca e filtri:

### **Ricerca Testuale**
```http
GET /admin/users?search=john
```

### **Filtri**
```http
GET /admin/users?role=user&status=active
```

### **Ordinamento**
```http
GET /admin/users?sort=createdAt&order=desc
```

### **Paginazione**
```http
GET /admin/users?page=2&limit=20
```

## 📊 **Webhooks (Futuro)**

L'API supporterà webhooks per eventi importanti:

### **Eventi Supportati**
- `user.registered`
- `user.login`
- `user.profile_updated`
- `security.alert`
- `admin.action`

### **Formato Webhook**
```json
{
  "event": "user.registered",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "user": {
      "uuid": "user-uuid",
      "email": "user@example.com"
    }
  },
  "signature": "sha256=..."
}
```

---

**Pandom Stack API** - API REST completa, sicura e ben documentata per applicazioni enterprise. 