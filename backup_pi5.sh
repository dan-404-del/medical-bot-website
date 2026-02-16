#!/bin/bash

echo "=========================================="
echo "  Medical Robot App - Pi 5 Backup"
echo "=========================================="

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$APP_DIR/backups/$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

echo "📦 Backing up database..."
if [ -f "$APP_DIR/backend/database.db" ]; then
    cp "$APP_DIR/backend/database.db" "$BACKUP_DIR/"
    echo "✅ Database saved"
else
    echo "⚠ No database found"
fi

echo "📎 Backing up uploads..."
if [ -d "$APP_DIR/backend/uploads" ]; then
    cp -r "$APP_DIR/backend/uploads" "$BACKUP_DIR/"
    echo "✅ Uploads saved"
fi

echo "📝 Backing up backend code..."
cp -r "$APP_DIR/backend" "$BACKUP_DIR/backend_backup"

echo "📝 Backing up frontend code..."
cp -r "$APP_DIR/frontend" "$BACKUP_DIR/frontend_backup"

echo "=========================================="
echo "✅ BACKUP COMPLETE"
echo "📂 Location: $BACKUP_DIR"
echo "=========================================="
