# 📚 Documentazione Pandom Stack

Questa directory contiene tutta la documentazione del progetto Pandom Stack, organizzata in modo logico e facilmente navigabile.

## 📋 Indice Documentazione

### 🔧 Core Documentation

| File | Descrizione |
|------|-------------|
| [api.md](api.md) | **API Endpoints** - Documentazione completa di tutti gli endpoint REST |
| [dto.md](dto.md) | **DTO Documentation** - Data Transfer Objects e validazioni |
| [database.md](database.md) | **Database Structure** - Struttura tabelle e relazioni |

### 🧪 Testing Documentation

| File | Descrizione |
|------|-------------|
| [testing.md](testing.md) | **Testing Guide** - Guida completa ai test del progetto |
| [auth-testing.md](auth-testing.md) | **Auth Testing** - Test specifici per il sistema di autenticazione |

### 🗄️ System Documentation

| File | Descrizione |
|------|-------------|
| [database-management.md](database-management.md) | **Database Management** - Gestione database, migrazioni e monitoraggio |

### 🛠️ Development Tools

| File | Descrizione |
|------|-------------|
| [pandom-postman-collection.json](pandom-postman-collection.json) | **Postman Collection** - Collection per testare le API |
| [pandom-postman-env.json](pandom-postman-env.json) | **Postman Environment** - Variabili d'ambiente per Postman |

## 🚀 Quick Start

### 1. **Setup Iniziale**
```bash
# Configura ambiente
cp backend/env.example backend/.env
# Modifica le variabili in backend/.env
```

### 2. **Avvio Sviluppo**
```bash
cd backend
npm install
npm run start:dev
```

### 3. **Test**
```bash
# Test auth
npm run test:auth

# Test database
npm run test:database

# Tutti i test
npm run test:integration
```

## 📖 Come Navigare la Documentazione

### 🔍 Per Sviluppatori
1. **Inizia con** [api.md](api.md) per capire gli endpoint disponibili
2. **Leggi** [dto.md](dto.md) per le validazioni e strutture dati
3. **Consulta** [testing.md](testing.md) per i test

### 🗄️ Per Database Administrator
1. **Inizia con** [database.md](database.md) per la struttura
2. **Leggi** [database-management.md](database-management.md) per la gestione
3. **Usa** [auth-testing.md](auth-testing.md) per testare il sistema

### 🧪 Per QA/Testing
1. **Inizia con** [testing.md](testing.md) per la strategia generale
2. **Leggi** [auth-testing.md](auth-testing.md) per test specifici
3. **Usa** [pandom-postman-collection.json](pandom-postman-collection.json) per test manuali

## 🏗️ Architettura del Progetto

```
pandom-stack/
├── docs/                   # 📚 Documentazione (questa directory)
├── backend/                # 🔧 Backend NestJS
│   ├── src/               # Codice sorgente
│   ├── tests/             # Test organizzati
│   ├── database/          # Schema e migrazioni
│   └── env.example        # Configurazione ambiente
└── frontend/              # 🎨 Frontend Angular
```

## 📝 Convenzioni di Documentazione

### 📋 Naming
- **File principali**: `*.md` (es. `api.md`, `testing.md`)
- **File di configurazione**: `*.json` (es. `pandom-postman-collection.json`)

### 🔗 Cross-References
- Tutti i file si riferiscono l'un l'altro usando link relativi
- Ogni file ha una sezione "Documentazione Correlata"

### 📊 Struttura
- **Header con emoji** per identificazione rapida
- **Tabelle** per organizzare informazioni
- **Code blocks** per esempi pratici
- **Sezioni chiare** con separatori

## 🎯 Status Implementazione

### ✅ Completamente Implementato
- **AUTH Module** - Sistema di autenticazione completo
- **DATABASE Module** - Gestione database e migrazioni
- **Testing Framework** - Test organizzati e automatizzati

### ⏳ In Sviluppo
- **PROFILE Module** - Gestione profili utente
- **SECURITY Module** - Log e privacy
- **ADMIN Module** - Gestione amministrativa

### 📋 Pianificato
- **RESILIENCE Module** - Backup e continuità operativa

## 🐛 Troubleshooting

### Problemi Comuni

1. **"File non trovato"**
   - Verifica che tutti i file siano nella directory `docs/`
   - Controlla i link relativi

2. **"Test falliscono"**
   - Consulta [testing.md](testing.md) per debug
   - Verifica configurazione ambiente

3. **"Database non si connette"**
   - Consulta [database-management.md](database-management.md)
   - Verifica variabili d'ambiente

## 🤝 Contribuire

### 📝 Aggiungere Documentazione
1. Crea file `.md` nella directory `docs/`
2. Segui le convenzioni di naming
3. Aggiungi cross-references
4. Aggiorna questo README

### 🔄 Mantenere Documentazione
1. Aggiorna documentazione quando cambi codice
2. Mantieni sincronizzati esempi e codice
3. Verifica che i link funzionino

## 📞 Supporto

Per domande o problemi:
1. Consulta la documentazione correlata
2. Controlla i log del server
3. Esegui i test per verificare funzionalità
4. Controlla la configurazione ambiente 