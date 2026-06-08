#!/usr/bin/env bash
set -euo pipefail

# ── OPC Dashboard 一键部署脚本 ──
# 使用项目内 .venv，不污染系统 Python
# 初始化 Wiki 记忆系统 + 前端构建 + 数据同步

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

VENV_DIR="$SCRIPT_DIR/.venv"
WIKI_DIR="$SCRIPT_DIR/wiki"
WIKI_TEMPLATE="$SCRIPT_DIR/wiki-template"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo "═══ OPC Dashboard 部署 ═══"
echo ""

# ── Step 0: 配置文件 ──
if [ ! -f config.json ]; then
    if [ -f config.example.json ]; then
        echo "→ 未找到 config.json，从 config.example.json 复制..."
        cp config.example.json config.json
        echo "  ✓ config.json 已创建（默认无 Agent）"
    fi
fi

# ── Step 1: Python 虚拟环境 ──
echo "【1】Python 环境"
if [ ! -d "$VENV_DIR" ]; then
    echo "  → 创建 .venv 虚拟环境..."
    python3 -m venv "$VENV_DIR"
else
    echo "  → .venv 已存在，跳过创建"
fi

source "$VENV_DIR/bin/activate"
echo "  → 安装 Python 依赖..."
pip install --upgrade pip -q 2>/dev/null
pip install -r requirements.txt -q
echo -e "  ${GREEN}✓${NC} Python 依赖就绪"

# ── Step 2: 前端构建 ──
echo ""
echo "【2】前端构建"
if [ -f "$FRONTEND_DIR/package.json" ]; then
    if command -v npm &>/dev/null; then
        cd "$FRONTEND_DIR"
        echo "  → 安装前端依赖..."
        npm install --silent 2>/dev/null
        echo "  → 构建生产版本..."
        npm run build --silent 2>/dev/null
        cd "$SCRIPT_DIR"
        echo -e "  ${GREEN}✓${NC} 前端构建完成 → static/"
    else
        echo -e "  ${YELLOW}⚠ npm 未安装，跳过前端构建${NC}"
        echo "    安装 Node.js 后运行: cd frontend && npm install && npm run build"
    fi
else
    echo -e "  ${YELLOW}⚠ 未找到 frontend/，跳过${NC}"
fi

# ── Step 3: Wiki 记忆系统 ──
echo ""
echo "【3】Wiki 共同记忆系统"
if [ ! -d "$WIKI_DIR" ]; then
    if [ -d "$WIKI_TEMPLATE" ]; then
        echo "  → 从 wiki-template/ 复制九层架构..."
        cp -r "$WIKI_TEMPLATE" "$WIKI_DIR"
        echo -e "  ${GREEN}✓${NC} Wiki 已初始化 → wiki/"
    else
        echo -e "  ${YELLOW}⚠ wiki-template/ 不存在，创建最小 Wiki${NC}"
        mkdir -p "$WIKI_DIR/L3 system"
        echo '{"projects": []}' > "$WIKI_DIR/L3 system/active-tasks.json"
        echo -e "  ${GREEN}✓${NC} Wiki 最小化创建 → wiki/"
    fi
else
    echo "  → Wiki 已存在，跳过初始化（保留已有数据）"
fi

# ── Step 4: 初始数据同步 ──
echo ""
echo "【4】初始数据同步"
if python3 sync.py 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} 数据同步完成"
else
    echo -e "  ${YELLOW}⚠ 同步脚本执行异常（可能 Share space 未配置）${NC}"
fi

# ── 完成 ──
echo ""
echo "═══════════════════════════════════"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo "启动 Dashboard："
echo "  .venv/bin/python3 server.py"
echo ""
PORT=$(python3 -c "import json;print(json.load(open('config.json','r')).get('port',8090))" 2>/dev/null || echo 8090)
echo "访问: http://localhost:$PORT"
echo ""
echo "可用命令："
echo "  bash verify.sh    # 运行健康检查"
echo "  python3 sync.py   # 手动同步项目数据"
