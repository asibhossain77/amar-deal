#!/bin/bash
cd /home/z/my-project
while true; do
  if ! curl -s -o /dev/null http://localhost:3000 2>/dev/null; then
    echo "[$(date)] Restarting server..." >> /home/z/my-project/dev.log
    pkill -f "next dev" 2>/dev/null
    sleep 2
    node node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
    sleep 8
  fi
  sleep 5
done
