#!/usr/bin/env bash
set -euo pipefail

# ── OPC Dashboard 一键部署脚本 ──
# 使用项目内 .venv，不污染系统 Python

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

VENV_DIR="$SCRIPT_DIR/.venv"

echo "═══ OPC Dashboard 部署 ═══"
echo ""

# ── Step 1: 创建虚拟环境 ──
if [ ! -d "$VENV_DIR" ]; then
    echo "→ 创建 .venv 虚拟环境..."
    python3 -m venv "$VENV_DIR"
else
    echo "→ .venv 已存在，跳过创建"
fi

# ── Step 2: 激活并安装依赖 ──
echo "→ 安装 Python 依赖（仅项目内）..."
source "$VENV_DIR/bin/activate"
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo ""
echo "✅ 部署完成！"
echo ""
echo "启动 Dashboard："
echo "  source .venv/bin/activate && python3 server.py"
echo ""
echo "或直接："
echo "  .venv/bin/python3 server.py"
echo ""
echo "访问: http://localhost:$(python3 -c "import json;print(json.load(open('config.json','r')).get('port',8090))")"
