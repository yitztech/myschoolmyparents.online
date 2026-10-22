#!/bin/sh
# Backup de base de datos PostgreSQL (MySchoolMyParents)
set -e

BACKUP_DIR="${BACKUP_DIR:-backups/db}"
CONTAINER_NAME="${DB_CONTAINER:-msm-db-dev}"
DB_USER="${POSTGRES_USER:-msm}"
DB_NAME="${POSTGRES_DB:-myschoolmyparents}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/msm_backup_${DATE}.dump"

mkdir -p "$BACKUP_DIR"

echo "📦 Creando backup de PostgreSQL desde contenedor $CONTAINER_NAME..."
docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$BACKUP_FILE"

# Generar checksum SHA-256
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$BACKUP_FILE" > "${BACKUP_FILE}.sha256"
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$BACKUP_FILE" > "${BACKUP_FILE}.sha256"
fi

echo "✅ Backup generado con éxito: $BACKUP_FILE"
