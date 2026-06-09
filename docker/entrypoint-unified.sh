#!/bin/sh
set -e

echo "🚀 Starting FastAPI backend server in background..."
cd /app/backend
# Prepend the venv bin to PATH to ensure dependencies are loaded
export PATH="/app/backend/.venv/bin:$PATH"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2 &

echo "🚀 Starting Next.js frontend server in foreground..."
cd /app/frontend
exec node server.js
