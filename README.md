<p align="center">
  <img src="https://img.shields.io/badge/OPC-Dashboard-FFAB40?style=for-the-badge" alt="OPC Dashboard" />
</p>

<h1 align="center">OPC Dashboard</h1>
<p align="center">
  <strong>Multi-Agent Team Collaboration Dashboard</strong><br>
  Real-time project tracking · Agent status monitoring · Activity timeline
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.10+-blue" alt="Python" />
  <img src="https://img.shields.io/badge/fastapi-0.115+-009688" alt="FastAPI" />
  <img src="https://img.shields.io/badge/react-18-61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="License" />
</p>

---

## Overview

A real-time dashboard for monitoring and managing multi-agent AI teams. Built for the **OPC** (Orchestrator-Planning-Coding) workflow with four specialized agents:

| Agent | Role | Runtime |
|-------|------|---------|
| 🎯 **Bojack** | Orchestrator — task decomposition, delegation, quality review | Hermes Agent |
| 🔬 **Athena** | Researcher — multi-source verification, hallucination reduction | Claude Code |
| ✍️ **Mercury** | Writer — information architecture, documentation | Claude Code |
| 🔨 **Codex** | Builder — implementation, debugging, testing, delivery | Codex CLI |

## Features

- ⚡ **Real-Time Agent Status** — Working/idle indicators with pulse animations
- 📊 **Project Categories** — Expandable two-level hierarchy with progress bars
- 🔧 **One-Click Agent Setup** — Scan local AI agents, add to team with auto wiki integration
- 🔌 **Activate/Deactivate** — Toggle agents in/out of workflow, auto-clean wiki memory
- 🎨 **Dark/Light Theme** — Instant theme switching via CSS variables
- 📡 **WebSocket Push** — Auto-refresh on project data changes (2s polling)
- ⚙️ **Settings Panel** — Manage agents, categories, data sources in a slide-out panel
- 🧠 **Wiki Integration** — Shared OPC wiki for cross-agent memory (9-layer structure)

## Quick Start

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/opc-dashboard.git
cd opc-dashboard

# 2. Setup
chmod +x setup.sh
./setup.sh

# 3. Start
python3 server.py

# 4. Open
open http://localhost:8090
```

Or with the Hermes venv:

```bash
~/.local/share/hermes-agent-venv/bin/python server.py
```

## Architecture

```
opc-dashboard/
├── server.py              # FastAPI: REST + WebSocket + auto-sync
├── sync.py                # Project data sync engine
├── requirements.txt       # Python dependencies (fastapi, uvicorn, websockets)
├── setup.sh               # One-command deployment script
├── config.example.json    # Configuration template
└── frontend/              # Vite + React
    ├── src/
    │   ├── App.jsx                    # Main layout + theme + data merge
    │   ├── hooks/useWebSocket.js      # WebSocket auto-reconnect
    │   └── components/
    │       ├── AgentCards.jsx         # Agent status cards + activate/deactivate
    │       ├── ProjectList.jsx        # Expandable project hierarchy
    │       ├── ActiveTasks.jsx        # Task cards with agent assignment
    │       └── Settings.jsx           # Settings panel (6 tabs)
    └── electron/          # Electron desktop app wrapper (WIP)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data` | Dashboard data (categories + agent status) |
| GET | `/api/config` | Current configuration |
| POST | `/api/config` | Update configuration (merge-safe) |
| PATCH | `/api/agent/{id}` | Update single agent field |
| POST | `/api/setup-agent` | Activate agent + create wiki memory |
| POST | `/api/deactivate-agent` | Deactivate agent + clean wiki |
| GET | `/api/scan` | Scan local file system for AI agents |
| WS | `/ws` | WebSocket for live data push |

## Configuration

Copy `config.example.json` to `config.json` and customize:

```json
{
  "port": 8090,
  "theme": "dark",
  "agents": {
    "bojack": { "name": "Bojack", "role": "协调员", "active": true, ... },
    "athena": { "name": "Athena", "role": "研究员", "active": true, ... },
    ...
  }
}
```

Or use the **Settings panel** (`⌘,`) to scan and manage agents interactively.

## Development

```bash
cd frontend
npm install
npm run dev      # Dev server with HMR
npm run build    # Production build → ../static/
```

## License

MIT © 2025

---

<p align="center">
  <sub>Built with taste-skill design system · Dark-themed · Agent-first UX</sub>
</p>
