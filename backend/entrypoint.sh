#!/bin/bash
set -e

echo "🚀 Iniciando Backend Django REST — Gestão Docente..."

# Garante compatibilidade entre MYSQL_HOST e DB_HOST
TARGET_HOST="${MYSQL_HOST:-${DB_HOST:-mysql_db}}"
TARGET_PORT="${MYSQL_PORT:-${DB_PORT:-3306}}"

if [ "$DB_ENGINE" = "mysql" ]; then
    echo "⏳ Aguardando banco de dados MySQL ($TARGET_HOST:$TARGET_PORT)..."
    while ! nc -z "$TARGET_HOST" "$TARGET_PORT"; do
      sleep 1
    done
    echo "✅ Banco de dados MySQL conectado!"
fi

echo "📦 Executando migrações do banco de dados..."
python manage.py migrate --noinput

echo "🎨 Coletando arquivos estáticos..."
python manage.py collectstatic --noinput --clear || true

echo "🔥 Iniciando servidor Gunicorn na porta 8000..."
exec gunicorn core.wsgi:application \
    --name gestaodocente_api \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --threads 2 \
    --timeout 120 \
    --log-level info \
    --access-logfile - \
    --error-logfile -
