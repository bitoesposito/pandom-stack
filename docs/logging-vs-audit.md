# 📝 Logger Service vs Audit Service

## Overview

Il sistema implementa due servizi di logging distinti con scopi diversi:

- **LoggerService**: Logging tecnico dell'applicazione
- **AuditService**: Logging di sicurezza e attività utente

## 🔧 Logger Service (Tecnico)

### Scopo
Logging di debug, errori, performance e informazioni tecniche dell'applicazione.

### Cosa traccia
- Errori di sistema
- Performance e timing
- Debug information
- Log di sviluppo
- Errori di validazione
- Problemi di connessione database

### Esempio di log
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "context": "DatabaseService",
  "metadata": {
    "error": "Connection timeout",
    "retry_count": 3
  }
}
```

### Uso
```typescript
// Nel service
this.logger.error('Failed to send email', error);
this.logger.info('User registered', { email: 'user@example.com' });
this.logger.debug('Processing request', { path: '/auth/login' });
```

## 🛡️ Audit Service (Sicurezza)

### Scopo
Tracciamento di eventi di sicurezza e attività degli utenti per compliance e sicurezza.

### Cosa traccia
- **Autenticazione**: Login/logout, tentativi falliti
- **Autorizzazione**: Accesso a risorse, cambi permessi
- **Dati sensibili**: Download, export, modifiche
- **Attività sospette**: Brute force, accessi anomali
- **Operazioni amministrative**: Cambi ruoli, eliminazioni

### Esempio di audit log
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "event_type": "USER_LOGIN_SUCCESS",
  "user_id": "user-uuid",
  "user_email": "user@example.com",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "session_id": "session-uuid",
  "status": "SUCCESS",
  "details": {
    "login_method": "password",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### Uso
```typescript
// Nel service di autenticazione
await this.auditService.logLoginSuccess(user.uuid, user.email, ipAddress);
await this.auditService.logLoginFailed(email, ipAddress, userAgent, 'Invalid password');
await this.auditService.logPasswordReset(user.uuid, user.email);
```

## 📊 Confronto Dettagliato

| Aspetto | Logger Service | Audit Service |
|---------|----------------|---------------|
| **Scopo** | Debug e monitoraggio tecnico | Sicurezza e compliance |
| **Target** | Sviluppatori e DevOps | Security team e auditori |
| **Frequenza** | Molto alta (ogni operazione) | Media (solo eventi rilevanti) |
| **Retention** | Breve termine (giorni/settimane) | Lungo termine (mesi/anni) |
| **Sensibilità** | Può contenere dati tecnici | Contiene dati personali |
| **Compliance** | Non richiesto | GDPR, SOX, PCI-DSS |
| **Ricerca** | Per debugging | Per investigazioni |

## 🗂️ Organizzazione File

### Logger Service
```
logs/
├── log.txt          # Log generali dell'applicazione
├── error.log        # Solo errori
└── debug.log        # Log di debug
```

### Audit Service
```
logs/
├── audit.log        # Eventi di sicurezza
├── auth.log         # Eventi di autenticazione
└── admin.log        # Operazioni amministrative
```

## 🔍 Tipi di Eventi Audit

### Eventi di Autenticazione
- `USER_LOGIN_SUCCESS` - Login riuscito
- `USER_LOGIN_FAILED` - Login fallito
- `USER_LOGOUT` - Logout utente
- `USER_REGISTER` - Registrazione nuovo utente
- `USER_VERIFY_EMAIL` - Verifica email
- `USER_RESET_PASSWORD` - Reset password

### Eventi di Sicurezza
- `ACCOUNT_LOCKED` - Account bloccato
- `ACCOUNT_UNLOCKED` - Account sbloccato
- `SUSPICIOUS_ACTIVITY` - Attività sospetta
- `BRUTE_FORCE_ATTEMPT` - Tentativo brute force

### Eventi di Accesso Dati
- `DATA_ACCESS` - Accesso a dati
- `DATA_DOWNLOAD` - Download dati
- `DATA_EXPORT` - Export dati

### Eventi Amministrativi
- `USER_ROLE_CHANGED` - Cambio ruolo utente
- `USER_STATUS_CHANGED` - Cambio stato utente
- `USER_DELETED` - Eliminazione utente

## 🚀 Integrazione nel Sistema

### Nel Modulo Common
```typescript
@Module({
  providers: [AuditService, LoggerService],
  exports: [AuditService, LoggerService],
})
export class CommonModule {}
```

### Nel Service di Autenticazione
```typescript
constructor(
  private readonly auditService: AuditService,
  private readonly logger: Logger,
) {}
```

### Esempio di Uso Combinato
```typescript
async login(credentials: LoginDto): Promise<ApiResponseDto<any>> {
  try {
    // Log tecnico
    this.logger.debug('Processing login request', { email: credentials.email });
    
    // Validazione e autenticazione
    const user = await this.authenticateUser(credentials);
    
    // Audit log di sicurezza
    await this.auditService.logLoginSuccess(user.uuid, user.email, ipAddress);
    
    // Log tecnico di successo
    this.logger.info('Login successful', { userId: user.uuid });
    
    return response;
  } catch (error) {
    // Log tecnico dell'errore
    this.logger.error('Login failed', error);
    
    // Audit log di sicurezza
    await this.auditService.logLoginFailed(credentials.email, ipAddress, userAgent, error.message);
    
    throw error;
  }
}
```

## 📋 Best Practices

### Logger Service
- ✅ Usa livelli appropriati (DEBUG, INFO, WARN, ERROR)
- ✅ Includi context e metadata rilevanti
- ✅ Non loggare dati sensibili
- ✅ Usa log strutturati (JSON)

### Audit Service
- ✅ Logga sempre eventi di sicurezza
- ✅ Includi IP address e user agent
- ✅ Mantieni retention a lungo termine
- ✅ Cripta dati sensibili se necessario
- ✅ Implementa rotazione log

## 🔐 Sicurezza

### Protezione Log
- **Accesso**: Solo personale autorizzato
- **Crittografia**: Log sensibili criptati
- **Backup**: Backup regolari dei log
- **Integrità**: Prevenzione tampering

### Compliance
- **GDPR**: Right to be forgotten
- **SOX**: Audit trail per operazioni finanziarie
- **PCI-DSS**: Logging accessi a dati di pagamento
- **HIPAA**: Audit trail per dati sanitari

## 📚 Documentazione Correlata

- [API Documentation](api.md) - Documentazione API
- [Security Best Practices](security.md) - Linee guida sicurezza
- [Database Management](database-management.md) - Gestione database 