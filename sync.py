#!/usr/bin/env python3
"""
OPC Dashboard 项目同步脚本 v2
从 Share space/projects.json 读取 → 按分类写入 opc-dashboard/projects/<id>/status.json
同时生成 categories.json 供仪表盘使用
"""
import json
import os
from datetime import datetime
from pathlib import Path

BASE = Path(__file__).resolve().parent
CONFIG_FILE = BASE / "config.json"
DASHBOARD = BASE / "projects"
DATA_FILE = BASE / "data" / "categories.json"


def load_config():
    """读取 config.json，返回 dict"""
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    return {}


def get_share_path():
    """从 config.json 读取 share_space_path，展开 ~ 并返回 Path"""
    cfg = load_config()
    raw = cfg.get("share_space_path", "~/Documents/Share space/projects.json")
    return Path(os.path.expanduser(raw))


def write_empty_data():
    """写入空的 categories 和默认 agents_status"""
    agents_status = [
        {"id": "bojack",  "name": "Bojack",  "role": "协调员", "icon": "🎯", "color": "#FFAB40", "status": "idle", "task": "", "project": ""},
        {"id": "athena",  "name": "Athena",  "role": "研究员", "icon": "🔬", "color": "#00E5FF", "status": "idle", "task": "", "project": ""},
        {"id": "mercury", "name": "Mercury", "role": "作家",   "icon": "✍️", "color": "#B388FF", "status": "idle", "task": "", "project": ""},
        {"id": "codex",   "name": "Codex",   "role": "建造者", "icon": "🔨", "color": "#69F0AE", "status": "idle", "task": "", "project": ""},
    ]
    output = {"categories": [], "agents_status": agents_status}
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"  已写入空数据 → {DATA_FILE}")

# 项目分类映射
CATEGORY_MAP = {
    "p1":  {"id": "hermes",  "name": "Hermes 核心生态",   "icon": "⚕️"},
    "p2":  {"id": "hermes",  "name": "Hermes 核心生态",   "icon": "⚕️"},
    "p3":  {"id": "hermes",  "name": "Hermes 核心生态",   "icon": "⚕️"},
    "p5":  {"id": "hermes",  "name": "Hermes 核心生态",   "icon": "⚕️"},
    "p10": {"id": "hermes",  "name": "Hermes 核心生态",   "icon": "⚕️"},

    "p4":  {"id": "skills",  "name": "技能与自动化",      "icon": "🧩"},
    "p7":  {"id": "skills",  "name": "技能与自动化",      "icon": "🧩"},
    "p8":  {"id": "skills",  "name": "技能与自动化",      "icon": "🧩"},
    "p9":  {"id": "skills",  "name": "技能与自动化",      "icon": "🧩"},
    "p12": {"id": "skills",  "name": "技能与自动化",      "icon": "🧩"},
    "p13": {"id": "skills",  "name": "技能与自动化",      "icon": "🧩"},
    "p14": {"id": "skills",  "name": "技能与自动化",      "icon": "🧩"},
    "p16": {"id": "skills",  "name": "技能与自动化",      "icon": "🧩"},

    "p6":  {"id": "tools",   "name": "工具与集成",        "icon": "🔧"},
    "p11": {"id": "tools",   "name": "工具与集成",        "icon": "🔧"},
    "p15": {"id": "tools",   "name": "工具与集成",        "icon": "🔧"},

    "p17": {"id": "opc",     "name": "OPC 团队",          "icon": "👥"},
}

AGENT_MAP = {
    "hermes":      {"name": "Bojack", "color": "#FFAB40", "icon": "🎯"},
    "codex":       {"name": "Codex",  "color": "#69F0AE", "icon": "🔨"},
    "claude-code": {"name": "Claude", "color": "#B388FF", "icon": "🤖"},
}


def make_stages(total, done):
    """把任务进度映射为 4 个流水线阶段"""
    stages_def = ["规划", "开发", "审查", "验收"]
    if total == 0:
        return [{"name": s, "status": "todo"} for s in stages_def]
    ratio = done / total
    out = []
    for i, s in enumerate(stages_def):
        if i / len(stages_def) < ratio:
            out.append({"name": s, "status": "done"})
        elif i == int(ratio * len(stages_def)):
            out.append({"name": s, "status": "active"})
        else:
            out.append({"name": s, "status": "todo"})
    return out


def sync():
    SHARE = get_share_path()

    if not SHARE.exists():
        print(f"⚠ Share space 项目文件不存在: {SHARE}")
        print("  写入空数据，Dashboard 将以空白状态运行。")
        print("  如需导入项目，请将 projects.json 放到上述路径，或在 config.json 中修改 share_space_path。")
        write_empty_data()
        return

    with open(SHARE) as f:
        projects = json.load(f)

    os.makedirs(DASHBOARD, exist_ok=True)

    # 用于汇总分类统计
    cat_stats = {}

    for p in projects:
        pid = p["id"]
        cat = CATEGORY_MAP.get(pid, {"id": "other", "name": "其他", "icon": "📦"})
        total = len(p["tasks"])
        done = sum(1 for t in p["tasks"] if t.get("done"))
        progress = round(done / total * 100) if total > 0 else 0

        agents = [AGENT_MAP.get(a, {"name": a, "color": "#888", "icon": "📦"}) for a in p.get("agents", [])]

        last_task = None
        for t in reversed(p["tasks"]):
            if t.get("done"):
                last_task = t
                break

        stages = make_stages(total, done)
        # 找当前活跃阶段
        current_stage = ""
        current_stage_status = ""
        for s in stages:
            if s["status"] == "active":
                current_stage = s["name"]
                current_stage_status = "active"
                break
        if not current_stage:
            for s in reversed(stages):
                if s["status"] == "done":
                    current_stage = s["name"]
                    current_stage_status = "done"
                    break

        status = {
            "id": pid,
            "name": p["name"],
            "desc": p.get("desc", ""),
            "status": p.get("status", "active"),
            "category": cat["id"],
            "category_name": cat["name"],
            "progress": progress,
            "done": done,
            "total": total,
            "stages": stages,
            "current_stage": current_stage,
            "current_stage_status": current_stage_status,
            "agents": agents,
            "last_activity": last_task["label"] if last_task else "",
            "folder": f"projects/{pid}",
            "synced_at": datetime.now().isoformat(),
        }

        project_dir = DASHBOARD / pid
        os.makedirs(project_dir, exist_ok=True)
        with open(project_dir / "status.json", "w") as f:
            json.dump(status, f, ensure_ascii=False, indent=2)

        # 汇总分类
        if cat["id"] not in cat_stats:
            cat_stats[cat["id"]] = {**cat, "total": 0, "done": 0, "projects": []}
        cat_stats[cat["id"]]["projects"].append(status)
        cat_stats[cat["id"]]["total"] += total
        cat_stats[cat["id"]]["done"] += done

        print(f"✅ {pid} [{cat['name']}] {p['name']} ({progress}%)")

    # 写入分类汇总
    categories = []
    cat_order = ["hermes", "skills", "tools", "opc"]
    for cid in cat_order:
        if cid in cat_stats:
            s = cat_stats[cid]
            pct = round(s["done"] / s["total"] * 100) if s["total"] > 0 else 0
            categories.append({
                "id": s["id"],
                "name": s["name"],
                "icon": s["icon"],
                "project_count": len(s["projects"]),
                "total_tasks": s["total"],
                "done_tasks": s["done"],
                "progress": pct,
                "projects": s["projects"],
            })

    # 构建 Agent 状态（从活跃项目推导）
    agents_status = {
        "bojack":  {"id": "bojack",  "name": "Bojack",  "role": "协调员", "icon": "🎯", "color": "#FFAB40", "status": "idle", "task": "", "project": ""},
        "athena":  {"id": "athena",  "name": "Athena",  "role": "研究员", "icon": "🔬", "color": "#00E5FF", "status": "idle", "task": "", "project": ""},
        "mercury": {"id": "mercury", "name": "Mercury", "role": "作家",   "icon": "✍️", "color": "#B388FF", "status": "idle", "task": "", "project": ""},
        "codex":   {"id": "codex",   "name": "Codex",   "role": "建造者", "icon": "🔨", "color": "#69F0AE", "status": "idle", "task": "", "project": ""},
    }
    # 别名映射：「Claude」同时激活 Athena 和 Mercury（两者都是 Claude Code 实例）
    ALIAS_MAP = {"claude": ["athena", "mercury"]}
    for cat in categories:
        for proj in cat["projects"]:
            if proj["progress"] < 100:
                for agent in proj["agents"]:
                    agent_name_lower = agent["name"].lower()
                    matched = False
                    for aid in agents_status:
                        if agents_status[aid]["name"].lower() == agent_name_lower:
                            agents_status[aid]["status"] = "working"
                            agents_status[aid]["task"] = f'{proj["name"]} — {proj["current_stage"]}中'
                            agents_status[aid]["project"] = proj["name"]
                            matched = True
                    # 别名：例如 Claude → Athena + Mercury
                    if not matched and agent_name_lower in ALIAS_MAP:
                        for alias_aid in ALIAS_MAP[agent_name_lower]:
                            agents_status[alias_aid]["status"] = "working"
                            agents_status[alias_aid]["task"] = f'{proj["name"]} — {proj["current_stage"]}中'
                            agents_status[alias_aid]["project"] = proj["name"]

    # 写入（对象格式：{categories, agents_status}）
    output = {"categories": categories, "agents_status": list(agents_status.values())}
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n共同步 {len(projects)} 个项目 → {DASHBOARD}")
    print(f"生成 {len(categories)} 个分类 → {DATA_FILE}")

    # Legacy: inline build is no longer needed (use server.py instead)
    # To use old static build: python3 build.py


if __name__ == "__main__":
    sync()
