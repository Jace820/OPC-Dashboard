#!/bin/bash
# OPC Dashboard — One-command setup
set -e

echo "╔══════════════════════════════════════╗"
echo "║   OPC Dashboard — Setup             ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Config
if [ ! -f config.json ]; then
    echo "📝 Creating config.json from template..."
    cp config.example.json config.json
fi

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

# Initialize wiki structure from template
if [ ! -d "wiki" ]; then
    echo "🧠 Initializing wiki memory system from template..."
    if [ -d "wiki-template" ]; then
        cp -r wiki-template wiki
        echo "   → Wiki ready (9-layer architecture)"
    else
        mkdir -p wiki/L3\ system
        echo '{"projects": []}' > wiki/L3\ system/active-tasks.json
        echo "   → Wiki ready (minimal)"
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "   Start:  python3 server.py"
echo "   Open:   http://localhost:8090"
echo ""
echo "   Next steps:"
echo "   1. Start server: python3 server.py"
echo "   2. Open Settings → Agent → 扫描本地 Agent"
echo "   3. Add agents → 一键接入 → 自动激活 wiki 记忆"
