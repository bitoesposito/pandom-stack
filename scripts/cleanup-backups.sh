#!/bin/sh
set -e

# Script per cleanup automatico dei backup da MinIO
# Elimina backup più vecchi di 7 giorni

echo "$(date): Starting MinIO backup cleanup..."

# Configurazione
MINIO_ENDPOINT="${MINIO_ENDPOINT:-localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ROOT_USER:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_ROOT_PASSWORD:-minioadmin}"
BUCKET_NAME="${MINIO_BUCKET_NAME:-pandom-stack}"
BACKUP_PREFIX="backups/"
RETENTION_DAYS=7

# Calcola la data di cutoff (7 giorni fa)
CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)

echo "$(date): MinIO Endpoint: $MINIO_ENDPOINT"
echo "$(date): Bucket: $BUCKET_NAME"
echo "$(date): Cutoff date: $CUTOFF_DATE"

# Installa MinIO Client se non presente
if ! command -v mc &> /dev/null; then
    echo "$(date): Installing MinIO Client..."
    apk add --no-cache curl
    curl -o /usr/local/bin/mc https://dl.min.io/client/mc/release/linux-amd64/mc
    chmod +x /usr/local/bin/mc
fi

# Configura MinIO Client
mc alias set minio http://$MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# Lista tutti i backup
echo "$(date): Listing backup files..."
BACKUP_FILES=$(mc ls minio/$BUCKET_NAME/$BACKUP_PREFIX 2>/dev/null | grep "\.sql$" || true)

if [ -z "$BACKUP_FILES" ]; then
    echo "$(date): No backup files found"
    exit 0
fi

echo "$(date): Found backup files:"
echo "$BACKUP_FILES"

# Conta file prima del cleanup
BEFORE_COUNT=$(echo "$BACKUP_FILES" | wc -l)
DELETED_COUNT=0

# Processa ogni file
echo "$BACKUP_FILES" | while read -r line; do
    if [ -z "$line" ]; then
        continue
    fi
    
    # Estrai nome file dalla riga di output di mc ls
    FILE_NAME=$(echo "$line" | awk '{print $5}')
    
    if [ -z "$FILE_NAME" ]; then
        continue
    fi
    
    # Estrai timestamp dal nome file (formato: backup-2025-06-26T06-24-20-123Z.sql)
    TIMESTAMP=$(echo "$FILE_NAME" | sed 's/backup-\(.*\)\.sql/\1/')
    
    if [ -z "$TIMESTAMP" ]; then
        echo "$(date): Warning: Could not parse timestamp from $FILE_NAME"
        continue
    fi
    
    # Converti timestamp in data
    FILE_DATE=$(echo "$TIMESTAMP" | cut -d'T' -f1)
    
    echo "$(date): Checking $FILE_NAME (date: $FILE_DATE)"
    
    # Confronta date
    if [ "$FILE_DATE" \< "$CUTOFF_DATE" ]; then
        echo "$(date): Deleting old backup: $FILE_NAME"
        mc rm "minio/$BUCKET_NAME/$BACKUP_PREFIX$FILE_NAME"
        DELETED_COUNT=$((DELETED_COUNT + 1))
    else
        echo "$(date): Keeping recent backup: $FILE_NAME"
    fi
done

echo "$(date): Cleanup completed. Deleted $DELETED_COUNT old backup(s)."
echo "$(date): Remaining backups:"
mc ls minio/$BUCKET_NAME/$BACKUP_PREFIX 2>/dev/null | grep "\.sql$" || echo "No backups remaining" 