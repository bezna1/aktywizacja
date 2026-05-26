#!/usr/bin/env bash
set -euo pipefail

BACKEND_PID_FILE="/tmp/snake_backend.pid"
FRONTEND_PID_FILE="/tmp/snake_frontend.pid"
FRONTEND_LOG="/tmp/snake_frontend.log"

show_one() {
  local name="$1"
  local pid_file="$2"
  if [[ -f "$pid_file" ]] && ps -p "$(cat "$pid_file")" >/dev/null 2>&1; then
    echo "$name: running (pid $(cat "$pid_file"))"
  else
    echo "$name: stopped"
  fi
}

show_one "backend" "$BACKEND_PID_FILE"
show_one "frontend" "$FRONTEND_PID_FILE"

backend_code="$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/health || true)"
echo "backend health: $backend_code"

frontend_url="$(rg -o "http://localhost:[0-9]+" "$FRONTEND_LOG" 2>/dev/null | tail -n 1 || true)"
if [[ -n "$frontend_url" ]]; then
  frontend_code="$(curl -s -o /dev/null -w "%{http_code}" "$frontend_url" || true)"
  echo "frontend url: $frontend_url ($frontend_code)"
else
  echo "frontend url: unknown"
fi
