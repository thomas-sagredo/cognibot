#!/bin/sh
set -e

echo "🔄 Esperando que MySQL esté listo..."
# Pequeña espera extra por si el healthcheck de Docker no alcanzó
sleep 2

echo "🗄️  Inicializando base de datos y planes..."
python init_db.py

echo "🚀 Arrancando servidor FastAPI..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
