#!/bin/bash
# ============================================================
# Amar Deal - Server Stop Script
# এই ফাইলটি ~/amar-deal/stop.sh হিসেবে আপলোড করুন
# চালান: bash ~/amar-deal/stop.sh
# ============================================================

PORT=3000
APP_DIR="$HOME/amar-deal"

echo "🛑 Stopping Amar Deal server..."

# PID ফাইল থেকে পড়ুন
if [ -f "$APP_DIR/server.pid" ]; then
    PID=$(cat "$APP_DIR/server.pid")
    echo "📋 Found PID: $PID"
    kill -15 $PID 2>/dev/null
    sleep 2
    # যদি এখনও চলে তাহলে force kill
    if kill -0 $PID 2>/dev/null; then
        echo "⚠️ Process still running, force killing..."
        kill -9 $PID 2>/dev/null
    fi
    rm -f "$APP_DIR/server.pid"
    echo "✅ Server stopped (from PID file)"
fi

# পোর্ট থেকেও চেক করুন
EXISTING_PID=$(lsof -ti:$PORT 2>/dev/null)
if [ ! -z "$EXISTING_PID" ]; then
    echo "📋 Found process on port $PORT: $EXISTING_PID"
    kill -9 $EXISTING_PID 2>/dev/null
    echo "✅ Server stopped (from port)"
fi

echo "✅ Done! Server is stopped."
