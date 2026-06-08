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
YELLOW='\033[0;33m'
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

# 检查端口是否被占用（返回 0 = 占用）
port_in_use() {
    python3 -c "
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(1)
r = s.connect_ex(('127.0.0.1', $1))
s.close()
exit(r)
" 2>/dev/null
}

# 检查现有服务是否属于当前项目
is_our_server() {
    local base_url="http://127.0.0.1:$1"
    local resp
    resp=$(curl -s "$base_url/api/config" 2>/dev/null) || return 1
    # 检查响应中包含 OPC Dashboard 的特征字段
    echo "$resp" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    # 只要有 categories 或 agents 字段，就认为是 OPC Dashboard
    assert 'categories' in d or 'agents' in d
except:
    sys.exit(1)
" 2>/dev/null
}

# 找一个可用的临时端口
find_free_port() {
    python3 -c "
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind(('127.0.0.1', 0))
port = s.getsockname()[1]
s.close()
print(port)
"
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

PYTHON="${SCRIPT_DIR}/.venv/bin/python3"
if [ ! -f "$PYTHON" ]; then
    PYTHON="python3"
fi

CONFIG_PORT=$("$PYTHON" -c "import json;print(json.load(open('config.json')).get('port',8090))" 2>/dev/null || echo 8090)
USE_TEMP_PORT=false
REUSE_EXISTING=false
KILL_ON_EXIT=true

# 检查端口占用情况
if port_in_use "$CONFIG_PORT"; then
    if is_our_server "$CONFIG_PORT"; then
        echo "  → 端口 $CONFIG_PORT 已有 OPC Dashboard 在运行，复用测试"
        PORT="$CONFIG_PORT"
        REUSE_EXISTING=true
        KILL_ON_EXIT=false
    else
        echo -e "  ${YELLOW}⚠ 端口 $CONFIG_PORT 被其他进程占用${NC}"
        PORT=$(find_free_port)
        echo "  → 使用临时端口 $PORT 进行测试"
        USE_TEMP_PORT=true
    fi
else
    PORT="$CONFIG_PORT"
fi

# 启动测试服务（如果需要）
if ! $REUSE_EXISTING; then
    "$PYTHON" server.py &
    SERVER_PID=$!
    if $USE_TEMP_PORT; then
        # 覆盖端口启动
        kill $SERVER_PID 2>/dev/null
        "$PYTHON" -c "
import uvicorn, server
uvicorn.run(server.app, host='127.0.0.1', port=$PORT)
" &
        SERVER_PID=$!
    fi
    trap "kill $SERVER_PID 2>/dev/null; exit" EXIT

    # 等待就绪
    for i in $(seq 1 20); do
        if curl -s "http://127.0.0.1:$PORT/api/config" >/dev/null 2>&1; then
            break
        fi
        sleep 0.5
    done
fi

check "GET /api/config" curl -sf "http://127.0.0.1:$PORT/api/config" -o /dev/null
check "GET /api/data"   curl -sf "http://127.0.0.1:$PORT/api/data" -o /dev/null

# 验证返回的是有效 JSON
echo -n "  GET /api/config 返回 JSON ... "
if curl -s "http://127.0.0.1:$PORT/api/config" | python3 -m json.tool >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗${NC}"
    FAIL=$((FAIL + 1))
fi

echo -n "  GET /api/data 返回 JSON ... "
if curl -s "http://127.0.0.1:$PORT/api/data" | python3 -m json.tool >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗${NC}"
    FAIL=$((FAIL + 1))
fi

# POST /api/config — 先备份完整配置，测试后完整恢复
echo -n "  POST /api/config 保存并返回 ... "

# 备份当前完整配置
CONFIG_BACKUP=$(curl -s "http://127.0.0.1:$PORT/api/config")

RESP=$(curl -s -X POST "http://127.0.0.1:$PORT/api/config" -H "Content-Type: application/json" -d '{"theme":"_verify_test_"}')
if echo "$RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);assert d.get('theme')=='_verify_test_'" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗${NC}"
    FAIL=$((FAIL + 1))
fi

# 完整恢复原始配置
if [ -n "$CONFIG_BACKUP" ]; then
    curl -s -X POST "http://127.0.0.1:$PORT/api/config" -H "Content-Type: application/json" \
        -d "$CONFIG_BACKUP" >/dev/null 2>&1
fi

# 停止测试服务（仅当我们自己启动的）
if $KILL_ON_EXIT; then
    kill $SERVER_PID 2>/dev/null || true
    trap - EXIT
else
    echo ""
    echo "  → 复用现有服务，未停止"
fi

# ── 4. 生成物隔离 ──
echo ""
echo "【4】生成物隔离 (gitignore)"

FORBIDDEN="\.venv/|\.npm-cache/|frontend/node_modules/|wiki/|data/|projects/|config\.json|__pycache__/|\.pyc$"
# 只检查未忽略的新增/修改文件，排除已暂存的删除（D = git rm --cached 的正常结果）
LEAKS=$(git status --short 2>/dev/null | grep -v "^D " | grep -E "$FORBIDDEN" || true)

echo -n "  .gitignore 规则生效（无生成物泄露）... "
if [ -z "$LEAKS" ]; then
    echo -e "${GREEN}✓${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗${NC}"
    echo "    泄露的文件:"
    echo "$LEAKS" | sed 's/^/      /'
    FAIL=$((FAIL + 1))
fi

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
