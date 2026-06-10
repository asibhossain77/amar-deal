#!/bin/bash
cd /home/z/my-project
while true; do
  node node_modules/.bin/next dev -p 3000 2>&1 | tee -a /home/z/my-project/dev.log
  echo "[$(date)] Server crashed/restarted. Waiting 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
