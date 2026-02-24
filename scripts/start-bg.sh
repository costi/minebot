#!/usr/bin/env bash
set -e

nohup node bot.js > bot.log 2>&1 &
pid=$!
echo "$pid" > bot.pid

sleep 0.1
if ! kill -0 "$pid" 2>/dev/null; then
  echo "Bot exited early; see bot.log"
  exit 1
fi

echo "Started bot with PID $pid"
