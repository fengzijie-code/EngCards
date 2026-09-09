#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.word-wind/vite.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "未找到运行记录，Word Wind 当前未通过启动.sh启动。"
  exit 0
fi

SERVER_PID="$(cat "$PID_FILE")"

if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "运行记录已过期，已清理。"
  rm -f "$PID_FILE"
  exit 0
fi

kill -TERM -- "-$SERVER_PID" 2>/dev/null || kill -TERM "$SERVER_PID"

for _ in {1..20}; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    rm -f "$PID_FILE"
    echo "Word Wind 已关闭。"
    exit 0
  fi
  sleep 0.2
done

kill -KILL -- "-$SERVER_PID" 2>/dev/null || kill -KILL "$SERVER_PID"
rm -f "$PID_FILE"
echo "Word Wind 已强制关闭。"
