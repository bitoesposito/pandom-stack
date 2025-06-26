#!/bin/sh
set -e

# Script per verifica automatica dei backup da MinIO
# Calcola checksum e verifica integrità dei file di backup

echo "$(date): Starting MinIO backup verification..."

# Configurazione
MINIO_ENDPOINT="${MINIO_ENDPOINT:-localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ROOT_USER:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_ROOT_PASSWORD:-minioadmin}"
BUCKET_NAME="${MINIO_BUCKET_NAME:-pandom-stack}"
BACKUP_PREFIX="backups/"
TEMP_DIR="/tmp/backup-verify"

# Crea directory temporanea
mkdir -p "$TEMP_DIR"

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

VERIFIED_COUNT=0
FAILED_COUNT=0

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
    
    echo "$(date): Verifying $FILE_NAME..."
    
    # Percorso completo del file
    REMOTE_PATH="minio/$BUCKET_NAME/$BACKUP_PREFIX$FILE_NAME"
    LOCAL_PATH="$TEMP_DIR/$FILE_NAME"
    CHECKSUM_PATH="$TEMP_DIR/$FILE_NAME.sha256"
    
    # Download del file
    echo "$(date): Downloading $FILE_NAME..."
    if mc cp "$REMOTE_PATH" "$LOCAL_PATH"; then
        echo "$(date): Download successful"
    else
        echo "$(date): ERROR: Failed to download $FILE_NAME"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        continue
    fi
    
    # Calcola checksum
    echo "$(date): Calculating checksum..."
    SHA256_CHECKSUM=$(sha256sum "$LOCAL_PATH" | cut -d' ' -f1)
    echo "$SHA256_CHECKSUM" > "$CHECKSUM_PATH"
    
    # Verifica se esiste già un checksum salvato
    EXISTING_CHECKSUM_PATH="minio/$BUCKET_NAME/$BACKUP_PREFIX$FILE_NAME.sha256"
    
    if mc ls "$EXISTING_CHECKSUM_PATH" >/dev/null 2>&1; then
        echo "$(date): Found existing checksum, verifying..."
        mc cp "$EXISTING_CHECKSUM_PATH" "$TEMP_DIR/existing.sha256"
        EXISTING_CHECKSUM=$(cat "$TEMP_DIR/existing.sha256" | cut -d' ' -f1)
        
        if [ "$SHA256_CHECKSUM" = "$EXISTING_CHECKSUM" ]; then
            echo "$(date): ✓ Checksum verification PASSED for $FILE_NAME"
            VERIFIED_COUNT=$((VERIFIED_COUNT + 1))
        else
            echo "$(date): ✗ Checksum verification FAILED for $FILE_NAME"
            echo "$(date):   Expected: $EXISTING_CHECKSUM"
            echo "$(date):   Actual:   $SHA256_CHECKSUM"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    else
        echo "$(date): No existing checksum found, uploading new one..."
        mc cp "$CHECKSUM_PATH" "$EXISTING_CHECKSUM_PATH"
        echo "$(date): ✓ New checksum uploaded for $FILE_NAME"
        VERIFIED_COUNT=$((VERIFIED_COUNT + 1))
    fi
    
    # Cleanup file temporanei
    rm -f "$LOCAL_PATH" "$CHECKSUM_PATH" "$TEMP_DIR/existing.sha256"
done

# Cleanup finale
rm -rf "$TEMP_DIR"

echo "$(date): Verification completed."
echo "$(date): Successfully verified: $VERIFIED_COUNT backup(s)"
echo "$(date): Failed verifications: $FAILED_COUNT backup(s)"

if [ $FAILED_COUNT -gt 0 ]; then
    echo "$(date): WARNING: Some backups failed verification!"
    exit 1
else
    echo "$(date): All backups verified successfully!"
    exit 0
fi 