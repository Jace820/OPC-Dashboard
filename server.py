#!/usr/bin/env python3
"""
OPC Dashboard — FastAPI server
Serves static files, REST API, WebSocket push, and auto-sync from Share space.
"""
import json
import os
import time
import asyncio
import subprocess
import sys
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

BASE = Path(__file__).resolve().parent
DATA_FILE = BASE / "data" / "categories.json"
STATIC_DIR = BASE / "static"
CONFIG_FILE = BASE / "config.json"
SHARE_PROJECTS = Path.home() / "Documents" / "Share space" / "projects.json"
SYNC_SCRIPT = BASE / "sync.py"

# Load config
def load_config():
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    return {"port": 8090, "host": "0.0.0.0", "theme": "dark"}

def get_wiki_path():
    """从 config 读取 wiki 路径，默认 ./wiki"""
    cfg = load_config()
    wiki_path = cfg.get("wiki_path", "./wiki")
    if wiki_path.startswith("./") or wiki_path.startswith("../"):
        return (BASE / wiki_path).resolve()
    return Path(wiki_path).expanduser().resolve()


def _init_wiki_structure(wiki_base: Path):
    """从 wiki-template/ 复制完整的九层 wiki 架构"""
    template = BASE / "wiki-template"
    if template.exists():
        import shutil
        for item in template.iterdir():
            dest = wiki_base / item.name
            if item.is_dir():
                if not dest.exists():
                    shutil.copytree(item, dest)
            else:
                if not dest.exists():
                    shutil.copy2(item, dest)
        print(f"✅ Wiki 结构已从模板初始化: {wiki_base}")
    else:
        # 降级：最小化创建
        wiki_base.mkdir(parents=True, exist_ok=True)
        (wiki_base / "L3 system").mkdir(parents=True, exist_ok=True)
        (wiki_base / "L3 system" / "active-tasks.json").write_text('{"projects": []}', encoding="utf-8")
        print(f"⚠ Wiki 模板未找到，最小化创建: {wiki_base}")


config = load_config()

app = FastAPI(title="OPC Dashboard")

# ── Connection Manager ──
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: str):
        for ws in self.active[:]:
            try:
                await ws.send_text(message)
            except Exception:
                self.disconnect(ws)

manager = ConnectionManager()

# ── REST API ──
@app.get("/api/data")
async def get_data():
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    return {"categories": [], "agents_status": []}


@app.get("/api/config")
async def get_config():
    return load_config()


@app.post("/api/config")
async def save_config(data: dict):
    """合并保存：不覆盖未传入的字段（如 agents），防止误删。"""
    current = load_config()
    # 深度合并一级 key
    for key, value in data.items():
        if key == "agents":
            # agents 只更新传入的，不删除已有的
            if isinstance(value, dict) and "agents" in current:
                current["agents"].update(value)
            else:
                current["agents"] = value
        elif key == "categories":
            if isinstance(value, list):
                current["categories"] = value
        else:
            current[key] = value
    CONFIG_FILE.write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding="utf-8")
    global config
    config = current


@app.get("/api/scan")
async def scan_agents():
    """
    扫描本地可用的 AI Agent。
    
    检测策略（按优先级）：
    1. shutil.which — PATH 中的命令（最可靠）
    2. 已知路径 — 独立 venv / pipx / homebrew
    3. subprocess 试运行 — 最后手段
    
    为什么 Aider 之前没被扫到：
    - 安装在 ~/aider_env/ 独立 venv，不在系统 PATH 中
    - shutil.which() 只查 PATH，不查自定义路径
    - 解决方案：通用化路径搜索 + 添加已知安装位置
    """
    import shutil, subprocess

    def find_command(name, extra_paths=None):
        """多策略查找命令：PATH → 已知路径 → 试运行"""
        # 1. PATH
        cmd = shutil.which(name)
        if cmd: return cmd
        # 2. 已知路径
        paths = extra_paths or []
        paths += [
            Path.home() / ".local" / "bin" / name,
            Path.home() / "bin" / name,
            Path.home() / f"{name}_env" / "bin" / name,
            Path(f"/opt/homebrew/bin/{name}"),
            Path(f"/usr/local/bin/{name}"),
        ]
        for p in paths:
            if p.exists():
                return str(p)
        # 3. 试运行
        try:
            subprocess.run([name, "--version"], capture_output=True, timeout=5)
            return name
        except: pass
        return None

    found = []

    # 获取 Hermes 当前使用的模型
    hermes_model = "deepseek-v4-pro"
    hermes_config = Path.home() / ".hermes" / "config.yaml"
    if hermes_config.exists():
        try:
            import yaml
            with open(hermes_config) as f:
                hc = yaml.safe_load(f)
            if isinstance(hc.get("model"), dict):
                hermes_model = hc["model"].get("default", hermes_model)
        except: pass

    # 检测清单 — 按名称检测本地 AI Agent
    # 用户可以通过 config.json 自定义更多 Agent

    # Codex — OpenAI Codex CLI
    if find_command("codex"):
        found.append({"id": "codex", "name": "Codex", "role": "建造者",
                       "icon": "🔨", "color": "#69F0AE", "type": "agent",
                       "runtime": "Codex CLI", "model": "deepseek-v4-pro", "provider": "DeepSeek (ccswitch)",
                       "status": "可用"})

    # Claude Code — Athena & Mercury 的运行时
    if find_command("claude"):
        found.append({"id": "claude-athena", "name": "Athena", "role": "研究员",
                       "icon": "🔬", "color": "#00E5FF", "type": "agent",
                       "runtime": "Claude Code", "model": "deepseek-v4-flash", "provider": "DeepSeek (ccswitch)",
                       "status": "可用"})
        found.append({"id": "claude-mercury", "name": "Mercury", "role": "写手",
                       "icon": "✍️", "color": "#B388FF", "type": "agent",
                       "runtime": "Claude Code", "model": "deepseek-v4-flash", "provider": "DeepSeek (ccswitch)",
                       "status": "可用"})

    # Aider — 独立 venv 安装，不用硬编码路径，由 find_command 通用搜索
    if find_command("aider"):
        found.append({"id": "aider", "name": "Aider", "role": "结对编程",
                       "icon": "🤝", "color": "#FF6B6B", "type": "agent",
                       "runtime": "Aider CLI", "model": "auto-detect", "provider": "用户配置",
                       "status": "可用"})

    # ── 扩展点：添加更多 Agent ──
    # if find_command("agent-name"):
    #     found.append({...})

    return {"agents": found}


@app.post("/api/setup-agent")
async def setup_agent(data: dict):
    """一键激活 Agent：写入 wiki 记忆 + 加入工作流"""
    agent_id = data.get("id", "")
    agent_name = data.get("name", "")

    cfg = load_config()
    if agent_id not in cfg.get("agents", {}):
        return {"status": "error", "message": "Agent 不存在"}

    # 标记为激活
    cfg["agents"][agent_id]["active"] = True
    CONFIG_FILE.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")

    # Wiki 路径（可配置）
    wiki_base = get_wiki_path()
    wiki_system = wiki_base / "L3 system"

    # 首次使用时自动初始化 wiki 结构
    if not wiki_base.exists():
        _init_wiki_structure(wiki_base)

    wiki_system.mkdir(parents=True, exist_ok=True)
    agent_file = wiki_system / f"agent-{agent_id}.md"
    agent_file.write_text(f"""---
title: "{agent_name} — OPC 团队成员"
type: system
layer: L3
author: bojack
created: {__import__('datetime').datetime.now().isoformat()}
tags: [agent, {agent_id}]
status: active
---

# {agent_name}

OPC 团队正式成员。已接入 wiki 共同记忆系统。

## 权限
- 读：L1-L9 全部层级
- 写：L4 projects, L5 pages, L6 raw
- 查：cache.json 先行

## 工作流
遵守 L3 system/workflow.md 的协作规范。
""", encoding="utf-8")

    # 如果是 Claude Code agent，更新 CLAUDE.md
    claude_config = Path.home() / ".claude" / "CLAUDE.md"
    if claude_config.exists():
        content = claude_config.read_text()
        marker = f"## Agent: {agent_name}"
        if marker not in content:
            content += f"\n\n{marker}\nOPC 团队成员。通过 active-tasks.json 接收任务。\n"
            claude_config.write_text(content)

    return {"status": "ok", "message": f"{agent_name} 已激活，wiki 记忆系统已接入"}


@app.patch("/api/agent/{agent_id}")
async def update_agent(agent_id: str, data: dict):
    """更新单个 Agent 的配置字段（model, provider, desc, active 等）"""
    cfg = load_config()
    if agent_id not in cfg.get("agents", {}):
        raise HTTPException(status_code=404, detail="Agent 不存在")

    agent = cfg["agents"][agent_id]
    # 只更新传入的字段，不覆盖整个 agent
    allowed = {"name", "role", "icon", "color", "model", "provider", "desc", "active"}
    for key, value in data.items():
        if key in allowed:
            agent[key] = value

    CONFIG_FILE.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"status": "ok", "agent_id": agent_id, "agent": agent}


@app.post("/api/deactivate-agent")
async def deactivate_agent(data: dict):
    """退出 Agent：标记 inactive + 清理 wiki + 清理 CLAUDE.md"""
    agent_id = data.get("id", "")

    cfg = load_config()
    if agent_id not in cfg.get("agents", {}):
        raise HTTPException(status_code=404, detail="Agent 不存在")

    agent = cfg["agents"][agent_id]
    if not agent.get("active", False):
        return {"ok": True, "agent_id": agent_id, "message": "Agent 已经是未激活状态"}

    # 标记为未激活
    agent["active"] = False
    CONFIG_FILE.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")

    agent_name = agent.get("name", agent_id)

    # 删除 wiki L3 system/ 下的 agent 文件
    wiki_base = get_wiki_path()
    wiki_system = wiki_base / "L3 system"
    if wiki_system.exists():
        for md_file in wiki_system.glob(f"agent-{agent_id}*.md"):
            try:
                md_file.unlink()
            except OSError:
                pass

    # 从 CLAUDE.md 中移除对应 agent 的行
    claude_config = Path.home() / ".claude" / "CLAUDE.md"
    if claude_config.exists():
        lines = claude_config.read_text(encoding="utf-8").splitlines()
        filtered = [
            line for line in lines
            if agent_id not in line and agent_name not in line
        ]
        claude_config.write_text("\n".join(filtered) + "\n", encoding="utf-8")

    return {"ok": True, "agent_id": agent_id, "message": "Agent deactivated and wiki cleaned"}


# ── WebSocket ──
@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception:
        manager.disconnect(ws)

# ── Auto-Sync Engine ──
_sync_lock = asyncio.Lock()
_last_projects_mtime = None
_last_data_mtime = None


async def run_sync():
    """Run sync.py and update data/categories.json."""
    async with _sync_lock:
        try:
            proc = await asyncio.create_subprocess_exec(
                sys.executable, str(SYNC_SCRIPT),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()
            if proc.returncode == 0 and DATA_FILE.exists():
                return True
        except Exception:
            pass
        return False


async def watch_files():
    """Monitor projects.json AND data/categories.json. Auto-sync + broadcast."""
    global _last_projects_mtime, _last_data_mtime
    while True:
        await asyncio.sleep(2)

        # 1. Check Share space projects.json for external changes
        if SHARE_PROJECTS.exists():
            try:
                pmtime = os.stat(SHARE_PROJECTS).st_mtime
                if _last_projects_mtime is None:
                    _last_projects_mtime = pmtime
                elif pmtime != _last_projects_mtime:
                    _last_projects_mtime = pmtime
                    # projects.json changed → auto-sync
                    if await run_sync():
                        _last_data_mtime = os.stat(DATA_FILE).st_mtime
                        await manager.broadcast("refresh")
            except OSError:
                pass

        # 2. Also watch data/categories.json (for direct edits or sync.py runs)
        if DATA_FILE.exists():
            try:
                dmtime = os.stat(DATA_FILE).st_mtime
                if _last_data_mtime is None:
                    _last_data_mtime = dmtime
                elif dmtime != _last_data_mtime:
                    _last_data_mtime = dmtime
                    await manager.broadcast("refresh")
            except OSError:
                pass


@app.on_event("startup")
async def startup():
    asyncio.create_task(watch_files())

# ── Root → index.html ──
@app.get("/")
async def root():
    return FileResponse(STATIC_DIR / "index.html")

# ── Static files ──
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8090)
