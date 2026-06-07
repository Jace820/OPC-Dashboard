#!/bin/bash
# OPC Dashboard — One-command setup
set -e

echo "╔══════════════════════════════════════╗"
echo "║   OPC Dashboard — Setup             ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt -q

# Node.js dependencies
if [ -f frontend/package.json ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install --silent && cd ..
fi

# Build frontend
if [ -f frontend/package.json ]; then
    echo "🔨 Building frontend..."
    cd frontend && npm run build && cd ..
    echo "   → static/ updated"
fi

# Initial data sync
if [ -f sync.py ]; then
    echo "📊 Running initial data sync..."
    python3 sync.py 2>/dev/null || echo "   ⚠ sync skipped (no project source configured)"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "   Start:  python3 server.py"
echo "   Open:   http://localhost:8090"
echo "   Dev:    cd frontend && npm run dev"
