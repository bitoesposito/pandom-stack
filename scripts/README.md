# 🔄 Backup Automation Scripts

Questi script gestiscono l'automazione del sistema di backup per Pandom Stack.

## 📁 File

### `backup-cron.sh`
- **Scopo**: Esegue backup automatici chiamando l'endpoint API del backend
- **Frequenza**: Ogni 6 ore (21600 secondi)
- **Funzionalità**:
  - Chiama `POST /resilience/backup`
  - Gestisce errori HTTP
  - Logga il risultato dell'operazione
  - I backup vengono salvati automaticamente su MinIO

### `cleanup-backups.sh`
- **Scopo**: Elimina backup vecchi secondo la retention policy
- **Frequenza**: Ogni 24 ore (86400 secondi)
- **Funzionalità**:
  - **Placeholder**: Attualmente è un placeholder
  - **Futuro**: Userà MinIO Client (mc) per eliminare backup vecchi
  - **Retention**: 7 giorni

### `verify-backups.sh`
- **Scopo**: Verifica l'integrità dei file di backup
- **Frequenza**: Ogni 12 ore (43200 secondi)
- **Funzionalità**:
  - **Placeholder**: Attualmente è un placeholder
  - **Futuro**: Userà MinIO Client (mc) per verificare checksum
  - **Processo**: Download temporaneo → verifica → upload checksum

## 🐳 Servizi Docker

I seguenti servizi sono configurati in `docker-compose.yml`:

### `backup-cron`
- **Immagine**: `curlimages/curl:latest`
- **Volume**: `./backend/backups:/backups` (temporaneo per file locali)
- **Comando**: Loop infinito con sleep di 6 ore

### `cleanup-backups`
- **Immagine**: `alpine:latest`
- **Volume**: `./backend/backups:/backups` (temporaneo per file locali)
- **Comando**: Loop infinito con sleep di 24 ore

### `verify-backups`
- **Immagine**: `alpine:latest`
- **Volume**: `./backend/backups:/backups` (temporaneo per file locali)
- **Comando**: Loop infinito con sleep di 12 ore

### `minio`
- **Immagine**: `minio/minio`
- **Porte**: 9000 (API), 9001 (Console)
- **Storage**: Volume Docker `minio_data`
- **Funzionalità**: Object storage per i backup

## ⚙️ Configurazione

### Variabili d'ambiente
Assicurati che le seguenti variabili siano configurate nel `.env`:
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET_NAME`

### Permessi
Rendi gli script eseguibili:
```bash
chmod +x scripts/*.sh
```

## 📊 Monitoraggio

### Logs
I servizi loggano tutte le operazioni con timestamp:
- Backup completati/falliti
- File eliminati dalla retention policy
- Verifiche checksum passate/fallite

### Endpoint API
- `GET /resilience/backup` - Lista backup disponibili su MinIO
- `POST /resilience/backup` - Crea backup e salva su MinIO
- `POST /resilience/backup/:id/restore` - Scarica da MinIO e ripristina

### MinIO Console
- **URL**: `http://localhost:9001`
- **Accesso**: Usa le credenziali da `.env`
- **Funzionalità**: Visualizza bucket, file, e gestione

## 🔧 Troubleshooting

### Backup non creati
1. Verifica che il backend sia in esecuzione
2. Controlla i logs del container `backup-cron`
3. Verifica la connettività di rete tra container
4. Controlla che MinIO sia accessibile

### MinIO non funziona
1. Verifica che il container `minio` sia in esecuzione
2. Controlla le variabili d'ambiente MinIO
3. Accedi alla console MinIO su `http://localhost:9001`
4. Verifica che il bucket esista

### Cleanup/Verify non funziona
1. Gli script sono placeholder - implementazione futura con MinIO Client
2. Per ora, la gestione è fatta tramite l'API del backend

## 📈 Metriche

- **Frequenza backup**: Ogni 6 ore
- **Retention**: 7 giorni
- **Verifica**: Ogni 12 ore
- **Storage**: MinIO object storage con prefisso `backups/`
- **Scalabilità**: MinIO permette storage illimitato

## 🚀 Implementazione Futura

### MinIO Client Integration
Per una implementazione completa, installare MinIO Client:
```bash
# In un container Alpine
apk add --no-cache curl
curl -o /usr/local/bin/mc https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x /usr/local/bin/mc
```

### Script Completi
Gli script `cleanup-backups.sh` e `verify-backups.sh` saranno aggiornati per usare `mc` per:
- Listare file in MinIO
- Scaricare file temporaneamente
- Calcolare checksum
- Eliminare file vecchi
- Uploadare checksum 