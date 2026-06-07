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

# Initialize wiki structure
WIKI_PATH=$(python3 -c "import json; c=json.load(open('config.json')); print(c.get('wiki_path','./wiki'))")
if [ ! -d "$WIKI_PATH" ]; then
    echo "🧠 Initializing wiki memory system..."
    mkdir -p "$WIKI_PATH"/{L3\ system,L4\ projects,L5\ pages,L6\ raw,L7\ assets}
    echo "# Wiki Index" > "$WIKI_PATH/L1 index.md"
    echo "# Schema" > "$WIKI_PATH/L2 schema.md"
    echo "{}" > "$WIKI_PATH/L8 links.json"
    echo "# Changelog" > "$WIKI_PATH/L9 CHANGELOG.md"
    echo "# 工作流规范" > "$WIKI_PATH/L3 system/workflow.md"
    echo '{"projects": []}' > "$WIKI_PATH/L3 system/active-tasks.json"
    echo "   → Wiki ready at $WIKI_PATH"
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
