#!/bin/bash
# ============================================================
# Amar Deal - cPanel Startup Script
# এই ফাইলটি ~/amar-deal/start.sh হিসেবে আপলোড করুন
# তারপর Terminal এ চালান: bash ~/amar-deal/start.sh
# ============================================================

# ⚠️ আপনার cPanel ইউজারনেম এখানে দিন
CPANEL_USER="your_cpanel_username"

# পোর্ট নম্বর (3000 ডিফল্ট)
PORT=3000

# প্রজেক্ট ডিরেক্টরি
APP_DIR="/home/$CPANEL_USER/amar-deal"
STANDALONE_DIR="$APP_DIR/.next/standalone"

echo "=========================================="
echo "  🚀 Amar Deal - Server Start Script"
echo "=========================================="
echo ""

# চেক করুন আগের কোনো প্রসেস চলছে কিনা
echo "🔍 Checking for existing processes on port $PORT..."
EXISTING_PID=$(lsof -ti:$PORT 2>/dev/null)
if [ ! -z "$EXISTING_PID" ]; then
    echo "⚠️ Found existing process on port $PORT (PID: $EXISTING_PID)"
    echo " Killing old process..."
    kill -9 $EXISTING_PID 2>/dev/null
    sleep 2
    echo "✅ Old process killed"
fi

# চেক করুন standalone বিল্ড আছে কিনা
if [ ! -d "$STANDALONE_DIR" ]; then
    echo "❌ Standalone build not found at: $STANDALONE_DIR"
    echo "📝 Please run 'npm run build' first"
    exit 1
fi

# .env ফাইল চেক
if [ ! -f "$APP_DIR/.env" ]; then
    echo "❌ .env file not found at: $APP_DIR/.env"
    echo "📝 Please create .env file first"
    exit 1
fi

echo "📁 App Directory: $APP_DIR"
echo "📁 Standalone: $STANDALONE_DIR"
echo "🌐 Port: $PORT"
echo ""

# Node.js চেক
NODE_CMD=""
if command -v node &> /dev/null; then
    NODE_CMD="node"
    echo "✅ Node.js found: $(node --version)"
elif [ -f "/home/$CPANEL_USER/nodevenv/amar-deal/18/bin/node" ]; then
    NODE_CMD="/home/$CPANEL_USER/nodevenv/amar-deal/18/bin/node"
    echo "✅ Node.js found (cPanel venv): $($NODE_CMD --version)"
else
    echo "❌ Node.js not found!"
    echo "📝 Install Node.js from cPanel or ask your hosting provider"
    exit 1
fi

# ডাটাবেজ চেক
DB_FILE="$APP_DIR/db/custom.db"
if [ ! -f "$DB_FILE" ]; then
    echo "⚠️ Database not found. Creating..."
    mkdir -p "$APP_DIR/db"
    cd "$APP_DIR"
    npx prisma db push 2>/dev/null || echo "⚠️ Could not create database"
fi

echo ""
echo "🔄 Starting server..."

# ==========================================
# পদ্ধতি ১: nohup দিয়ে (সবচেয়ে সহজ)
# ==========================================
cd "$APP_DIR"

# .env লোড করুন
export $(grep -v '^#' .env | xargs)

# Server চালু করুন nohup দিয়ে (ব্যাকগ্রাউন্ডে)
nohup $NODE_CMD app.js > "$APP_DIR/logs/server.log" 2>&1 &
SERVER_PID=$!

echo "✅ Server started with PID: $SERVER_PID"
echo "📋 Log file: $APP_DIR/logs/server.log"
echo ""

# ৫ সেকেন্ড অপেক্ষা করুন সার্ভার স্টার্ট হওয়ার জন্য
echo "⏳ Waiting for server to start..."
sleep 5

# চেক করুন সার্ভার রান হচ্ছে কিনা
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server is running successfully!"
    echo "🌐 Visit: https://yourdomain.com"
else
    echo "❌ Server failed to start. Check logs:"
    echo "📋 $APP_DIR/logs/server.log"
    cat "$APP_DIR/logs/server.log" 2>/dev/null
fi

echo ""
echo "=========================================="
echo "  Useful Commands:"
echo "=========================================="
echo "  View logs:    tail -f $APP_DIR/logs/server.log"
echo "  Stop server:  kill $SERVER_PID"
echo "  Check status: lsof -i:$PORT"
echo "  Restart:      bash $APP_DIR/start.sh"
echo "=========================================="

# PID ফাইলে সেভ করুন (পরে স্টপ করতে সুবিধার জন্য)
echo $SERVER_PID > "$APP_DIR/server.pid"
