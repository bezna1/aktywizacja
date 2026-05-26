#!/usr/bin/env bash
set -euo pipefail

BACKEND_PID_FILE="/tmp/snake_backend.pid"
FRONTEND_PID_FILE="/tmp/snake_frontend.pid"

stop_one() {
  local name="$1"
  local pid_file="$2"
  if [[ -f "$pid_file" ]] && ps -p "$(cat "$pid_file")" >/dev/null 2>&1; then
    kill "$(cat "$pid_file")" >/dev/null 2>&1 || true
    rm -f "$pid_file"
    echo "$name stopped"
  else
    rm -f "$pid_file"
    echo "$name not running"
  fi
}

stop_one "backend" "$BACKEND_PID_FILE"
stop_one "frontend" "$FRONTEND_PID_FILE"
