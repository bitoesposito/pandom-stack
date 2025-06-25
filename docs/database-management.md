# 🗄️ Sistema Database - Documentazione Completa

Questo documento spiega l'architettura e la gestione del database nel progetto Pandom Stack.

## 🏗️ Architettura

### 📁 Struttura Directory

```
backend/
├── src/database/          # Codice TypeScript
│   ├── database.service.ts
│   ├── migration.service.ts
│   ├── database.controller.ts
│   └── database.module.ts
└── database/              # File SQL e migrazioni
    ├── schema.sql         # Schema completo
    └── migrations/        # Migrazioni del database
        └── 001_initial_schema.sql
```

### 🔧 Componenti

1. **`src/database/database.service.ts`** - Service principale per inizializzazione
2. **`src/database/migration.service.ts`** - Gestione migrazioni
3. **`src/database/database.controller.ts`** - API per gestione database
4. **`src/database/database.module.ts`** - Modulo NestJS

## 🤔 Perché SQL + TypeScript?

### ✅ Vantaggi del File SQL (`database/schema.sql`)

1. **📋 Documentazione Chiara**
   - Struttura del database visibile a tutti
   - Facile da leggere e capire
   - Versioning con Git

2. **🔧 Setup Manuale**
   - Può essere eseguito direttamente su PostgreSQL
   - Utile per DBA e amministratori
   - Backup/restore semplificato

3. **🔄 Migrazioni**
   - Base per il sistema di migrazioni
   - Tracciamento delle modifiche
   - Rollback facilitato

### ✅ Vantaggi del Service TypeScript

1. **⚙️ Inizializzazione Automatica**
   - Database si crea automaticamente
   - Admin user creato automaticamente
   - Configurazione dinamica

2. **🛡️ Sicurezza**
   - Validazione delle configurazioni
   - Gestione errori robusta
   - Logging dettagliato

3. **🔗 Integrazione NestJS**
   - Dependency injection
   - TypeORM integration
   - Environment-based config

## 🚀 Come Funziona

### 1. **Inizializzazione Automatica**

```typescript
// Nel database.service.ts
async initializeDatabase() {
  // 1. Legge schema.sql e crea le tabelle
  await this.createTablesFromSchema();
  
  // 2. Crea admin user se configurato
  await this.createAdminIfNotExists();
}
```

### 2. **Sistema di Migrazioni**

```typescript
// Nel migration.service.ts
async runMigrations() {
  // 1. Controlla migrazioni applicate
  const applied = await this.getAppliedMigrations();
  
  // 2. Trova migrazioni pendenti
  const pending = migrationFiles.filter(f => !applied.includes(f));
  
  // 3. Esegue migrazioni pendenti
  for (const migration of pending) {
    await this.runMigration(migration);
  }
}
```

## 📊 Tabelle del Database

### `user_profiles`
- **Scopo**: Profili pubblici degli utenti
- **Campi**: display_name, tags, metadata
- **Relazioni**: 1:1 con auth_users

### `auth_users`
- **Scopo**: Dati di autenticazione
- **Campi**: email, password_hash, role, tokens
- **Relazioni**: 1:1 con user_profiles

### `migrations`
- **Scopo**: Tracciamento migrazioni
- **Campi**: name, applied_at, checksum
- **Uso**: Sistema di versioning database

## 🔧 API Endpoints

### Database Management (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/database/init` | Inizializza database |
| POST | `/database/migrate` | Esegue migrazioni |
| GET | `/database/migrations` | Status migrazioni |
| GET | `/database/health` | Health check |
| GET | `/database/stats` | Statistiche database |

## 🛠️ Comandi Utili

### Inizializzazione
```bash
# Inizializza database (crea tabelle + admin)
curl -X POST http://localhost:3000/database/init \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Migrazioni
```bash
# Esegue migrazioni pendenti
curl -X POST http://localhost:3000/database/migrate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Controlla status migrazioni
curl -X GET http://localhost:3000/database/migrations \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Monitoraggio
```bash
# Health check
curl -X GET http://localhost:3000/database/health

# Statistiche
curl -X GET http://localhost:3000/database/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🔄 Workflow di Sviluppo

### 1. **Nuova Funzionalità**
```bash
# 1. Crea nuova migrazione
# (Manualmente o tramite API)

# 2. Sviluppa feature
# 3. Testa localmente
# 4. Commit e push
```

### 2. **Deploy**
```bash
# 1. Build applicazione
npm run build

# 2. Esegui migrazioni
curl -X POST /database/migrate

# 3. Verifica health
curl -X GET /database/health
```

## 🛡️ Sicurezza

### ✅ Best Practices Implementate

1. **🔐 Autenticazione**
   - Tutti gli endpoint protetti da JWT
   - Solo admin possono gestire database

2. **📝 Logging**
   - Tutte le operazioni loggate
   - Errori tracciati dettagliatamente

3. **🔄 Transazioni**
   - Migrazioni in transazioni
   - Rollback automatico in caso di errore

4. **✅ Validazione**
   - Checksum delle migrazioni
   - Controllo integrità

## 🐛 Troubleshooting

### Errori Comuni

1. **"Schema file not found"**
   - Verifica che `backend/database/schema.sql` esista
   - Controlla i permessi del file

2. **"Migration failed"**
   - Controlla i log per dettagli
   - Verifica sintassi SQL
   - Controlla permessi database

3. **"Admin creation failed"**
   - Verifica variabili d'ambiente
   - Controlla che admin non esista già

### Debug

```bash
# Abilita log dettagliati
DEBUG=database:* npm run start:dev

# Controlla status migrazioni
curl -X GET /database/migrations

# Verifica health database
curl -X GET /database/health
```

## 📈 Monitoraggio

### Metriche Disponibili

- **Utenti totali**: Numero utenti registrati
- **Utenti attivi**: Utenti con is_active = true
- **Profili**: Numero profili creati
- **Migrazioni**: Status migrazioni applicate

### Health Check

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "database": "connected",
  "test": true
}
```

## 🎯 Vantaggi di Questa Architettura

1. **🔄 Flessibilità**: SQL per setup manuale, TypeScript per automazione
2. **📚 Documentazione**: Schema sempre aggiornato e visibile
3. **🛡️ Sicurezza**: Controllo completo delle operazioni
4. **📈 Scalabilità**: Sistema di migrazioni robusto
5. **🔧 Manutenibilità**: Separazione chiara delle responsabilità
6. **👥 Collaborazione**: DBA e sviluppatori possono lavorare insieme

## 📚 Documentazione Correlata

- [API Documentation](api.md) - Documentazione completa degli endpoint
- [Testing Guide](testing.md) - Guida ai test
- [Auth Testing Guide](auth-testing.md) - Test specifici per autenticazione
- [DTO Documentation](dto.md) - Documentazione DTO e validazioni 