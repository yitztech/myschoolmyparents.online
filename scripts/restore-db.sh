#!/bin/sh
# Restauración de base de datos PostgreSQL (MySchoolMyParents)
set -e

BACKUP_FILE="$1"
CONTAINER_NAME="${DB_CONTAINER:-msm-db-dev}"
DB_USER="${POSTGRES_USER:-msm}"
DB_NAME="${POSTGRES_DB:-myschoolmyparents}"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Uso: sh scripts/restore-db.sh <ruta/al/archivo.dump>"
  exit 1
fi

echo "⚠️  Restaurando $BACKUP_FILE en el contenedor $CONTAINER_NAME..."
cat "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner || true

echo "✅ Restauración finalizada."
