#!/bin/bash
# Start the game server

PORT=8006
HOST=127.0.0.1
DOCS_DIR=docs
PID_FILE=.server.pid
LOG_FILE=.server.log

cd "$DOCS_DIR" || exit 1
python3 -m http.server "$PORT" --bind "$HOST" > "../$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "../$PID_FILE"
cd ..

sleep 1
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "✅ Server started (PID: $SERVER_PID)"
    exit 0
else
    echo "❌ Server failed to start"
    rm -f "$PID_FILE"
    exit 1
fi

