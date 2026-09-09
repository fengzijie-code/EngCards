#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$SCRIPT_DIR/.word-wind"
PID_FILE="$RUNTIME_DIR/vite.pid"
LOG_FILE="$RUNTIME_DIR/vite.log"
PORT="${1:-5173}"

if ! command -v npm >/dev/null 2>&1; then
  echo "未找到 npm，请先安装 Node.js。" >&2
  exit 1
fi

if [[ -f "$PID_FILE" ]]; then
  EXISTING_PID="$(cat "$PID_FILE")"
  if kill -0 "$EXISTING_PID" 2>/dev/null; then
    echo "Word Wind 已在运行，PID: $EXISTING_PID"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

if [[ ! -d "$SCRIPT_DIR/node_modules" ]]; then
  echo "正在安装依赖..."
  (cd "$SCRIPT_DIR" && npm install --no-package-lock)
fi

mkdir -p "$RUNTIME_DIR"

if command -v setsid >/dev/null 2>&1; then
  (
    cd "$SCRIPT_DIR"
    exec setsid npm run dev -- --host 127.0.0.1 --port "$PORT" --strictPort
  ) >"$LOG_FILE" 2>&1 &
else
  (
    cd "$SCRIPT_DIR"
    exec npm run dev -- --host 127.0.0.1 --port "$PORT" --strictPort
  ) >"$LOG_FILE" 2>&1 &
fi

SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

sleep 1
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "启动失败，日志：$LOG_FILE" >&2
  rm -f "$PID_FILE"
  exit 1
fi

echo "Word Wind 已启动：http://127.0.0.1:$PORT"
echo "PID: $SERVER_PID"
echo "日志：$LOG_FILE"
echo
read -r -p "按 Enter 关闭此窗口（服务仍会继续运行）..."
