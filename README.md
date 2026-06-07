<p align="center">
  <h1 align="center">OPC Dashboard</h1>
  <p align="center">
    <strong>Multi-Agent Team Collaboration Platform</strong><br>
    Real-time monitoring · One-click wiki integration · Auto workflow orchestration
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.10+-blue" alt="Python" />
  <img src="https://img.shields.io/badge/fastapi-0.115+-009688" alt="FastAPI" />
  <img src="https://img.shields.io/badge/react-18-61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="License" />
</p>

---

## What is OPC Dashboard?

A **platform** for managing AI agent teams. You add your own agents — the dashboard handles the rest:

- 🔍 **Scan & Add** — Auto-detect AI agents installed on your machine (Codex CLI, Claude Code, Aider…)
- ⚡ **One-Click Activate** — Activate an agent and it's automatically integrated into the shared wiki memory system
- 🧠 **Wiki Memory** — Each activated agent gets a memory file in the 9-layer wiki. Cross-agent knowledge sharing, zero config.
- 📡 **Real-Time Sync** — WebSocket push on every status change. No manual refresh.
- 🎨 **Dark/Light Theme** — Instant switch via CSS variables.

> **Key advantage**: When you activate an agent, the dashboard automatically writes it into the wiki memory system and updates shared config — no manual setup needed.

## Quick Start

```bash
git clone https://github.com/Jace820/OPC-Dashboard.git
cd OPC-Dashboard
cp config.example.json config.json
./setup.sh
python3 server.py
# Open http://localhost:8090
```

**Then:**
1. Open Settings (`⌘,`) → **Agent** tab → **🔍 扫描本地 Agent**
2. Click to add detected agents
3. Click **🔧 一键接入** to activate → wiki memory auto-created ✨

## How Wiki Integration Works

```
New user clones repo → setup.sh creates wiki/ structure
     ↓
User scans agents → adds to config
     ↓
Clicks "🔧 一键接入" → server auto-creates:
  wiki/L3 system/agent-{name}.md   ← agent memory file
  wiki/L3 system/active-tasks.json ← shared task queue
     ↓
Agent is now part of the workflow — 
other agents can read its memory, share tasks
```

All wiki paths are configurable in `config.json`:
```json
{ "wiki_path": "./wiki" }
```

## Features

| Feature | Description |
|---------|-------------|
| **Agent Cards** | Real-time status, role, model, provider — colorful identity badges |
| **Activate/Deactivate** | Toggle agents in/out. Deactivation auto-cleans wiki memory |
| **Settings Panel** | 6-tab slide-out: manage agents, categories, data sources, theme |
| **Project Tracking** | Expandable category→project hierarchy with progress bars |
| **WebSocket Push** | Auto-refresh on any data change (2s polling fallback) |
| **Local Scan** | Detects AI agents in PATH, venvs, homebrew — multi-strategy search |

## Architecture

```
opc-dashboard/
├── server.py              # FastAPI: REST + WebSocket + auto-sync
├── sync.py                # Project data sync engine
├── wiki-template/         # 9-layer wiki architecture (copied to wiki/ on setup)
├── setup.sh               # One-command: install + build + wiki init
├── config.example.json    # Template → copy to config.json
├── requirements.txt       # fastapi, uvicorn
├── wiki/                  # Auto-generated wiki memory (gitignored)
└── frontend/              # Vite + React
    ├── src/
    │   ├── App.jsx                    # Theme + data merge
    │   ├── hooks/useWebSocket.js      # WebSocket reconnect
    │   └── components/
    │       ├── AgentCards.jsx         # Status + activate/deactivate
    │       ├── ProjectList.jsx        # Expandable hierarchy
    │       ├── Settings.jsx           # 6-tab settings panel
    │       └── ...
    └── electron/          # Desktop app wrapper (WIP)
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/data` | Dashboard data |
| `GET` | `/api/config` | Current config |
| `POST` | `/api/config` | Update config (merge-safe) |
| `PATCH` | `/api/agent/{id}` | Update single agent field |
| `POST` | `/api/setup-agent` | Activate agent + create wiki memory |
| `POST` | `/api/deactivate-agent` | Deactivate + clean wiki |
| `GET` | `/api/scan` | Scan local AI agents |
| `WS` | `/ws` | Live data push |

## Development

```bash
cd frontend && npm install && npm run dev
```

Build: `npm run build` → output to `static/`

## License

MIT
