#!/usr/bin/env bash
set -euo pipefail

# ── OPC Dashboard 验证脚本 ──
# 检查前端构建、数据同步、API 端点是否正常

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PASS=0
FAIL=0
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

check() {
    local label="$1"
    shift
    echo -n "  $label ... "
    if "$@" >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}✗${NC}"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

echo "═══ OPC Dashboard 健康检查 ═══"
echo ""

# ── 1. 前端构建 ──
echo "【1】前端构建 (npm run build)"
if [ -f frontend/package.json ]; then
    cd frontend
    check "npm run build" npm run build
    cd "$SCRIPT_DIR"
else
    echo "  ⚠ 未找到 frontend/，跳过"
fi

# ── 2. 数据同步 ──
echo ""
echo "【2】数据同步 (sync.py)"
check "python3 sync.py" python3 sync.py

# ── 3. API 端点 ──
echo ""
echo "【3】API 端点"

# 启动服务
PYTHON="${SCRIPT_DIR}/.venv/bin/python3"
if [ ! -f "$PYTHON" ]; then
    PYTHON="python3"
fi

PORT=$("$PYTHON" -c "import json;print(json.load(open('config.json')).get('port',8090))" 2>/dev/null || echo 8090)

"$PYTHON" server.py &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null; exit" EXIT

# 等待就绪
for i in $(seq 1 20); do
    if curl -s "http://localhost:$PORT/api/config" >/dev/null 2>&1; then
        break
    fi
    sleep 0.5
done

check "GET /api/config" curl -sf "http://localhost:$PORT/api/config" -o /dev/null
check "GET /api/data"   curl -sf "http://localhost:$PORT/api/data" -o /dev/null

# 验证返回的是有效 JSON
echo -n "  GET /api/config 返回 JSON ... "
if curl -s "http://localhost:$PORT/api/config" | python3 -m json.tool >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗${NC}"
    FAIL=$((FAIL + 1))
fi

echo -n "  GET /api/data 返回 JSON ... "
if curl -s "http://localhost:$PORT/api/data" | python3 -m json.tool >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗${NC}"
    FAIL=$((FAIL + 1))
fi

# POST /api/config
echo -n "  POST /api/config 保存并返回 ... "
RESP=$(curl -s -X POST "http://localhost:$PORT/api/config" -H "Content-Type: application/json" -d '{"theme":"dark"}')
if echo "$RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);assert d.get('theme')=='dark'" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗${NC}"
    FAIL=$((FAIL + 1))
fi

# 恢复配置
curl -s -X POST "http://localhost:$PORT/api/config" -H "Content-Type: application/json" \
    -d "{\"theme\":\"$(python3 -c "import json;print(json.load(open('config.json')).get('theme','light'))")\"}" >/dev/null 2>&1

# 停止服务
kill $SERVER_PID 2>/dev/null || true
trap - EXIT

# ── 结果 ──
echo ""
echo "════════════════════════"
TOTAL=$((PASS + FAIL))
echo "通过: $PASS / $TOTAL"
if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}全部通过 ✅${NC}"
    exit 0
else
    echo -e "${RED}$FAIL 项失败${NC}"
    exit 1
fi
