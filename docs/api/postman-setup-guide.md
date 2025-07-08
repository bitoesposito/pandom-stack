# 📮 Postman Setup Guide

## 📋 Panoramica

Questa guida ti aiuterà a configurare Postman per testare tutte le API di **Pandom Stack**. Postman è uno strumento essenziale per testare, documentare e collaborare sulle API REST.

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
| `access_token` | Token JWT per autenticazione | (vuoto - auto-popolato) |
| `refresh_token` | Token di refresh | (vuoto - auto-popolato) |
| `user_uuid` | UUID dell'utente corrente | (vuoto - auto-popolato) |
| `admin_email` | Email amministratore | `admin@pandom.com` |
| `admin_password` | Password amministratore | `admin123` |
| `test_user_email` | Email utente di test | `user@example.com` |
| `test_user_password` | Password utente di test | `password123` |

### **Configurazione per Ambienti**

#### **Development Environment**
```json
{
  "base_url": "http://localhost:3000",
  "admin_email": "admin@pandom.com",
  "admin_password": "admin123"
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

## 🔐 **Autenticazione Automatica**

### **Login Automatico**

La collection include script automatici per:

1. **Salvare i token** dopo il login
2. **Auto-refresh** dei token scaduti
3. **Gestione sessioni** automatica

### **Test Script per Login**

```javascript
// Script automatico per salvare i token
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.success && response.data.access_token) {
        pm.collectionVariables.set('access_token', response.data.access_token);
        pm.collectionVariables.set('refresh_token', response.data.refresh_token);
        pm.collectionVariables.set('user_uuid', response.data.user.uuid);
        console.log('Tokens saved successfully');
    }
}
```

## 📚 **Struttura della Collection**

### **1. Authentication**
- **Register User**: Registrazione nuovo utente
- **Login User**: Login con salvataggio automatico token
- **Refresh Token**: Rinnovo token scaduto
- **Get Current User**: Dati utente corrente
- **Verify Email**: Verifica email
- **Forgot Password**: Richiesta reset password
- **Reset Password**: Reset password con OTP
- **Resend Verification**: Rinvio email verifica

### **2. User Management**
- **Get User Profile**: Profilo utente
- **Update User Profile**: Aggiornamento profilo
- **Change Password**: Cambio password

### **3. Security**
- **Get Security Logs**: Log di sicurezza
- **Get Active Sessions**: Sessioni attive
- **Terminate Session**: Termina sessione specifica
- **Terminate All Sessions**: Termina tutte le sessioni
- **Request Data Export**: Richiesta export dati (GDPR)
- **Download User Data**: Download dati utente
- **Delete Account**: Eliminazione account (GDPR)

### **4. Admin**
- **Get All Users**: Lista utenti
- **Get User Details**: Dettagli utente specifico
- **Update User Role**: Cambio ruolo utente
- **Update User Status**: Cambio status utente
- **Get System Metrics**: Metriche sistema

### **5. System**
- **Health Check**: Controllo salute sistema
- **System Metrics**: Metriche Prometheus

### **6. Offline**
- **Get Sync Status**: Stato sincronizzazione
- **Force Sync**: Forza sincronizzazione
- **Get Sync Progress**: Progresso sincronizzazione

## 🧪 **Workflow di Testing**

### **1. Setup Iniziale**

```bash
# 1. Avvia l'applicazione
docker-compose up -d

# 2. Verifica che sia attiva
curl http://localhost:3000/health
```

### **2. Test di Autenticazione**

1. **Esegui "Login User"** con credenziali admin
2. **Verifica** che i token siano salvati automaticamente
3. **Esegui "Get Current User"** per verificare autenticazione

### **3. Test Funzionalità Utente**

1. **Get User Profile**: Verifica profilo
2. **Update User Profile**: Aggiorna profilo
3. **Get Security Logs**: Verifica log sicurezza
4. **Get Active Sessions**: Verifica sessioni

### **4. Test Funzionalità Admin**

1. **Get All Users**: Lista utenti
2. **Get System Metrics**: Metriche sistema
3. **Update User Role**: Cambio ruolo

### **5. Test GDPR Compliance**

1. **Request Data Export**: Richiesta export
2. **Download User Data**: Download dati
3. **Delete Account**: Eliminazione account

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

pm.test("Response has data field", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('data');
});
```

### **Test di Performance**

```javascript
// Test script per performance
pm.test("Response time is less than 200ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(200);
});
```

## 🚨 **Troubleshooting**

### **Problemi Comuni**

#### **1. Token Non Salvati**
```javascript
// Verifica script di login
console.log('Response:', pm.response.json());
console.log('Tokens saved:', pm.collectionVariables.get('access_token'));
```

#### **2. CORS Errors**
- **Verifica** che l'applicazione sia in esecuzione
- **Controlla** la configurazione CORS nel backend
- **Usa** Postman desktop invece di web

#### **3. Rate Limiting**
- **Aspetta** 15 minuti tra le richieste
- **Verifica** headers di rate limiting
- **Usa** credenziali diverse per test paralleli

#### **4. Token Scaduti**
```javascript
// Auto-refresh script
const token = pm.collectionVariables.get('access_token');
if (token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            console.log('Token expired, attempting refresh...');
        }
    } catch (e) {
        console.log('Invalid token format');
    }
}
```

### **Debug Postman**

1. **Console**: View → Show Postman Console
2. **Network**: Monitor → Network
3. **Logs**: View → Show Postman Console

## 📊 **Monitoraggio e Metriche**

### **Test Automation**

```javascript
// Collection runner script
const newman = require('newman');

newman.run({
    collection: require('./pandom-postman-collection.json'),
    environment: require('./pandom-postman-environment.json'),
    reporters: ['cli', 'json'],
    iterationCount: 1
}, function (err) {
    if (err) { throw err; }
    console.log('Collection run complete!');
});
```

### **CI/CD Integration**

```yaml
# GitHub Actions example
- name: Run API Tests
  run: |
    npm install -g newman
    newman run docs/pandom-postman-collection.json \
      -e docs/pandom-postman-environment.json \
      --reporters cli,json \
      --reporter-json-export results.json
```

## 🔒 **Sicurezza**

### **Best Practices**

1. **Non committare** token nei repository
2. **Usa environment** separati per ogni ambiente
3. **Ruota** credenziali regolarmente
4. **Monitora** accessi e tentativi di login

### **Credenziali Sicure**

```json
{
  "admin_password": "{{$randomPassword}}",
  "test_user_password": "{{$randomPassword}}"
}
```

## 📚 **Risorse Aggiuntive**

### **Documentazione Postman**
- [Postman Learning Center](https://learning.postman.com/)
- [Postman API](https://www.postman.com/postman/workspace/postman-public-workspace/documentation/12959542-c8142d51-e97c-46b6-bd77-52bb66712c9a)

### **Script Utili**
- [Postman Scripts Collection](https://github.com/postmanlabs/newman)
- [Postman Examples](https://www.postman.com/collection/detail/705-7d4b0e5c-5c5c-5c5c-5c5c-5c5c5c5c5c5c)

---

**Pandom Stack Postman Collection** - Testa tutte le API in modo efficiente e sicuro. 