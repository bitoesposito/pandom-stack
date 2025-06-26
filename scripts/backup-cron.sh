#!/bin/sh
set -e

# Script per backup automatico
# Chiama l'endpoint API del backend per creare un backup

echo "$(date): Starting automatic backup..."

# Aspetta che il backend sia pronto
sleep 10

# Chiama l'endpoint di backup
RESPONSE=$(curl -s -w "%{http_code}" -X POST http://backend:3000/resilience/backup -H "Content-Type: application/json")

# Estrai status code e response body
HTTP_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "$(date): Backup completed successfully"
    echo "$(date): Response: $RESPONSE_BODY"
else
    echo "$(date): Backup failed with HTTP code: $HTTP_CODE"
    echo "$(date): Response: $RESPONSE_BODY"
    exit 1
fi 