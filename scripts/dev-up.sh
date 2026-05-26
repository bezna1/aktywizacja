#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_PID_FILE="/tmp/snake_backend.pid"
FRONTEND_PID_FILE="/tmp/snake_frontend.pid"
BACKEND_LOG="/tmp/snake_backend.log"
FRONTEND_LOG="/tmp/snake_frontend.log"

start_backend() {
  if [[ -f "$BACKEND_PID_FILE" ]] && ps -p "$(cat "$BACKEND_PID_FILE")" >/dev/null 2>&1; then
    echo "backend already running (pid $(cat "$BACKEND_PID_FILE"))"
    return
  fi

  (
    cd "$BACKEND_DIR"
    nohup "$ROOT_DIR/.venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port 8000 >"$BACKEND_LOG" 2>&1 &
    echo $! >"$BACKEND_PID_FILE"
  )

  sleep 2
  code="$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/health || true)"
  if [[ "$code" != "200" ]]; then
    echo "backend start failed (health=$code)"
    tail -n 40 "$BACKEND_LOG" || true
    exit 1
  fi
  echo "backend running: http://127.0.0.1:8000 (pid $(cat "$BACKEND_PID_FILE"))"
}

start_frontend() {
  if [[ -f "$FRONTEND_PID_FILE" ]] && ps -p "$(cat "$FRONTEND_PID_FILE")" >/dev/null 2>&1; then
    echo "frontend already running (pid $(cat "$FRONTEND_PID_FILE"))"
    return
  fi

  (
    cd "$FRONTEND_DIR"
    nohup npm run dev >"$FRONTEND_LOG" 2>&1 &
    echo $! >"$FRONTEND_PID_FILE"
  )

  sleep 3
  frontend_url="$(rg -o "http://localhost:[0-9]+" "$FRONTEND_LOG" | tail -n 1 || true)"
  if [[ -z "$frontend_url" ]]; then
    echo "frontend start failed (no localhost URL in log)"
    tail -n 40 "$FRONTEND_LOG" || true
    exit 1
  fi

  code="$(curl -s -o /dev/null -w "%{http_code}" "$frontend_url" || true)"
  if [[ "$code" != "200" ]]; then
    echo "frontend start failed ($frontend_url -> $code)"
    tail -n 40 "$FRONTEND_LOG" || true
    exit 1
  fi
  echo "frontend running: $frontend_url (pid $(cat "$FRONTEND_PID_FILE"))"
}

start_backend
start_frontend
