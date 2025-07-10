# 📮 Postman Setup Guide

## 📋 Panoramica

Questa guida ti aiuterà a configurare Postman per testare tutte le API di **Pandom Stack**. Postman è uno strumento essenziale per testare, documentare e collaborare sulle API REST.

**Nota**: Pandom Stack utilizza **autenticazione basata su cookie** con JWT tokens httpOnly per massima sicurezza.

## 🚀 **Setup Rapido**

### **1. Download Postman**

- **Desktop App**: [Download Postman](https://www.postman.com/downloads/)
- **Web App**: [Postman Web](https://web.postman.com/)
- **Versione**: 10.0.0 o superiore raccomandata

### **2. Importazione Collection**

1. **Apri Postman**
2. **Clicca su "Import"** (pulsante in alto a sinistra)
3. **Seleziona "File"**
4. **Carica il file**: `pandom-postman-collection.json`
5. **Clicca "Import"**

### **3. Importazione Environment**

1. **Clicca su "Import"** di nuovo
2. **Seleziona "File"**
3. **Carica il file**: `pandom-postman-environment.json`
4. **Clicca "Import"**

### **4. Selezione Environment**

1. **Clicca sul dropdown** in alto a destra
2. **Seleziona**: "Pandom Stack Environment"
3. **Verifica** che l'environment sia attivo

## 🔧 **Configurazione Environment**

### **Variabili Principali**

| Variabile | Descrizione | Valore Default |
|-----------|-------------|----------------|
| `base_url` | URL base dell'API | `http://localhost:3000` |
| `user_uuid` | UUID dell'utente corrente | (vuoto - auto-popolato) |
| `admin_email` | Email amministratore | `admin@pandom.com` |
| `admin_password` | Password amministratore | `Admin123!` |
| `test_user_email` | Email utente di test | `user@example.com` |
| `test_user_password` | Password utente di test | `User123!` |
| `moderator_email` | Email moderatore | `moderator@example.com` |
| `moderator_password` | Password moderatore | `Moderator123!` |

### **Variabili di Configurazione**

| Variabile | Descrizione | Valore Default |
|-----------|-------------|----------------|
| `minio_endpoint` | Endpoint MinIO | `http://localhost:9000` |
| `minio_access_key` | Access key MinIO | `minioadmin` |
| `minio_secret_key` | Secret key MinIO | `minioadmin` |
| `database_host` | Host database | `localhost` |
| `database_port` | Porta database | `5432` |
| `email_host` | Host SMTP | `smtp.gmail.com` |
| `email_port` | Porta SMTP | `587` |

### **Configurazione per Ambienti**

#### **Development Environment**
```json
{
  "base_url": "http://localhost:3000",
  "admin_email": "admin@pandom.com",
  "admin_password": "Admin123!",
  "test_user_email": "user@example.com",
  "test_user_password": "User123!"
}
```

#### **Staging Environment**
```json
{
  "base_url": "https://staging-api.pandom.com",
  "admin_email": "admin@staging.pandom.com",
  "admin_password": "your-staging-password"
}
```

#### **Production Environment**
```json
{
  "base_url": "https://api.pandom.com",
  "admin_email": "admin@production.pandom.com",
  "admin_password": "your-production-password"
}
```

## 🔐 **Autenticazione con Cookie**

### **Autenticazione Automatica**

Pandom Stack utilizza **cookie httpOnly** per l'autenticazione:

1. **Login** imposta automaticamente i cookie
2. **Postman** invia automaticamente i cookie nelle richieste successive
3. **Nessuna gestione manuale** dei token richiesta

### **Test Script per Login**

```javascript
// Script automatico per salvare l'UUID utente
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.success && response.data) {
        pm.collectionVariables.set('user_uuid', response.data.user.uuid);
        console.log('User UUID saved:', response.data.user.uuid);
        console.log('Login successful - cookies will be automatically sent');
    }
}
```

### **Configurazione Cookie in Postman**

1. **Vai su Settings** (⚙️ in alto a destra)
2. **Seleziona "General"**
3. **Abilita "Automatically follow redirects"**
4. **Abilita "Send cookies with requests"**

## 📚 **Struttura della Collection**

### **1. Authentication**
- **Register User**: Registrazione nuovo utente
- **Login User**: Login con salvataggio automatico UUID
- **Refresh Token**: Rinnovo token (con cookie)
- **Get Current User**: Dati utente corrente
- **Check Auth Status**: Verifica stato autenticazione
- **Logout**: Logout con pulizia cookie
- **Verify Email**: Verifica email
- **Forgot Password**: Richiesta reset password
- **Reset Password**: Reset password con OTP
- **Resend Verification**: Rinvio email verifica

### **2. User Profile**
- **Get User Profile**: Profilo utente con tags e metadata
- **Update User Profile**: Aggiornamento profilo

### **3. Security**
- **Get Security Logs**: Log di sicurezza paginati
- **Get Active Sessions**: Sessioni attive
- **Terminate Session**: Termina sessione specifica
- **Terminate All Other Sessions**: Termina altre sessioni
- **Request Data Export**: Richiesta export dati (GDPR)
- **Delete Account**: Eliminazione account (GDPR)

### **4. Admin**
- **Get All Users**: Lista utenti con paginazione
- **Get All Users with Search**: Ricerca utenti
- **Delete User**: Eliminazione utente
- **Get System Metrics**: Metriche sistema
- **Get Detailed Metrics**: Metriche dettagliate
- **Get Audit Logs**: Log di audit

### **5. System**
- **Health Check**: Controllo salute sistema
- **Create Backup**: Creazione backup sistema
- **List Backups**: Lista backup disponibili
- **Restore Backup**: Ripristino da backup

### **6. File Storage**
- **Get Storage Health**: Stato servizio storage
- **Upload File**: Carica file (multipart/form-data)
- **List Files**: Lista file disponibili

## 🧪 **Workflow di Testing**

### **1. Setup Iniziale**

```bash
# 1. Avvia l'applicazione
docker-compose up -d

# 2. Verifica che sia attiva
curl http://localhost:3000/resilience/status
```

### **2. Test di Autenticazione**

1. **Esegui "Login User"** con credenziali admin
2. **Verifica** che l'UUID sia salvato automaticamente
3. **Esegui "Get Current User"** per verificare autenticazione
4. **Esegui "Check Auth Status"** per verificare stato

### **3. Test Funzionalità Utente**

1. **Get User Profile**: Verifica profilo
2. **Update User Profile**: Aggiorna tags e metadata
3. **Get Security Logs**: Verifica log sicurezza
4. **Get Active Sessions**: Verifica sessioni

### **4. Test Funzionalità Admin**

1. **Get All Users**: Lista utenti
2. **Get System Metrics**: Metriche sistema
3. **Get Audit Logs**: Log di audit

### **5. Test GDPR Compliance**

1. **Request Data Export**: Richiesta export
2. **Delete Account**: Eliminazione account

### **6. Test Sistema**

1. **Health Check**: Verifica stato sistema
2. **Create Backup**: Test backup
3. **List Backups**: Verifica backup

## 🔍 **Testing Avanzato**

### **Test con Dati Dinamici**

```javascript
// Pre-request script per dati dinamici
pm.collectionVariables.set('timestamp', new Date().toISOString());
pm.collectionVariables.set('random_id', Math.random().toString(36).substr(2, 9));
```

### **Test di Validazione**

```javascript
// Test script per validazione response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('success');
    pm.expect(response.success).to.be.true;
});
```

### **Test di Autenticazione**

```javascript
// Test script per verificare autenticazione
pm.test("User is authenticated", function () {
    const response = pm.response.json();
    pm.expect(response.data).to.have.property('user');
    pm.expect(response.data.user).to.have.property('uuid');
});
```

## 🚨 **Risoluzione Problemi**

### **Cookie non inviati**

1. **Verifica impostazioni Postman**:
   - Settings → General → "Send cookies with requests" = ON
   - Settings → General → "Automatically follow redirects" = ON

2. **Verifica dominio**:
   - Assicurati che `base_url` sia corretto
   - Cookie sono specifici per dominio

### **Errore 401 Unauthorized**

1. **Esegui login** prima di testare endpoint protetti
2. **Verifica** che i cookie siano presenti
3. **Controlla** che l'utente abbia i permessi necessari

### **Errore 403 Forbidden**

1. **Verifica ruolo utente** (admin/user/moderator)
2. **Controlla** che l'endpoint sia accessibile per il ruolo
3. **Usa credenziali admin** per testare endpoint admin

### **Errore 500 Internal Server Error**

1. **Verifica** che il backend sia attivo
2. **Controlla** i log del server
3. **Verifica** configurazione database e MinIO

## 📝 **Note Importanti**

### **Sicurezza**

- **Non condividere** le credenziali in produzione
- **Usa variabili segrete** per password e token
- **Cambia** le password di default

### **Performance**

- **Limita** il numero di richieste simultanee
- **Usa paginazione** per liste grandi
- **Monitora** i tempi di risposta

### **Best Practices**

- **Testa** sempre gli endpoint in ordine logico
- **Verifica** le risposte con test script
- **Documenta** eventuali problemi trovati
- **Usa** dati di test realistici

## 🔗 **Risorse Utili**

- [Documentazione Postman](https://learning.postman.com/)
- [API Reference Pandom Stack](./api-reference.md)
- [Architettura Sistema](../architecture/system-architecture.md)
- [Guida Sicurezza](../security/security-overview.md) 