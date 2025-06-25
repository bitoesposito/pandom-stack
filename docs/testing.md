# 🧪 Test Directory Structure

Questa directory contiene tutti i test per il backend del progetto Pandom Stack.

## 📁 Struttura Directory

```
tests/
├── auth/                  # Test specifici per l'autenticazione
├── integration/           # Test di integrazione (end-to-end)
│   ├── auth.test.js      # Test integrazione per auth
│   └── database.test.js  # Test integrazione per database
├── unit/                  # Test unitari
└── fixtures/              # Dati di test e mock
    └── test-data.json    # Fixtures per test
```

## 🎯 Tipi di Test

### Unit Tests (`/unit`)
- Test di singole funzioni e metodi
- Mock delle dipendenze esterne
- Test veloci e isolati
- Esempio: test di validazione DTO, test di utility functions

### Integration Tests (`/integration`)
- Test di interazione tra moduli
- Test di endpoint API
- Test con database reale o in-memory
- Esempio: test di login completo, test di registrazione

### Auth Tests (`/auth`)
- Test specifici per il sistema di autenticazione
- Test di sicurezza e validazione
- Test di JWT e sessioni

## 🚀 Come Eseguire i Test

### Test di Integrazione
```bash
# Test auth completo
npm run test:auth

# Test database
npm run test:database

# Tutti i test di integrazione
npm run test:integration
```

### Test Unitari
```bash
# Test unitari con Jest
npm run test

# Test unitari in watch mode
npm run test:watch
```

### Test Specifici
```bash
# Test solo auth
npm run test:auth

# Test con coverage
npm run test:cov
```

## 📋 Convenzioni

1. **Naming**: `*.test.js` o `*.spec.js`
2. **Organizzazione**: Un file di test per ogni modulo
3. **Fixtures**: Dati di test in `/fixtures`
4. **Mock**: Mock objects in `/mocks`

## 🔧 Configurazione

I test utilizzano:
- **Jest** per test unitari
- **Supertest** per test API
- **node-fetch** per test di integrazione
- **TypeScript** per type checking

## 📝 Esempi

### Test di Integrazione
```javascript
// tests/integration/auth.test.js
const fetch = require('node-fetch');

describe('Auth Integration Tests', () => {
  test('should register and login user', async () => {
    // Test implementation
  });
});
```

### Test Unitario
```typescript
// tests/unit/auth.service.spec.ts
import { AuthService } from '../../src/auth/auth.service';

describe('AuthService', () => {
  test('should hash password correctly', async () => {
    // Test implementation
  });
});
```

## 📚 Documentazione Correlata

- [API Documentation](api.md) - Documentazione completa degli endpoint
- [Auth Testing Guide](auth-testing.md) - Guida specifica per test auth
- [Database Management](database-management.md) - Gestione database e migrazioni
- [DTO Documentation](dto.md) - Documentazione DTO e validazioni 