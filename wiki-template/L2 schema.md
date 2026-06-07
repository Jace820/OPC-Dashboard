# L2 — Schema：Wiki 语法规范

> 定义每层文件的格式、元数据、命名规则和链接语法。所有贡献者（人类和 Agent）必须遵守。

---

## 通用规则

### 文件名
- 小写英文 + 连字符：`agent-workflow.md` 不是 `Agent Workflow.md`
- 项目目录名与 projects.json 的 id 对应：`hermes-core/` 不是 `Hermes 核心/`
- 日期前缀仅用于 L6 raw/：`2026-06-07-websocket-research.md`

### 元数据
每个 .md 文件**头部**必须包含 YAML frontmatter：

```yaml
---
title: "页面标题"
type: concept | guide | reference | project | raw | system
layer: L3 | L4 | L5 | L6
author: bojack | athena | mercury | codex
created: 2026-06-07
updated: 2026-06-07
tags: [tag1, tag2]
status: draft | reviewed | final
---
```

### 链接语法
- **同层链接**：`[页面名](page-name.md)`
- **跨层链接**：`[L5 概念](L5 pages/concepts/xxx.md)`
- **外部引用**：`[标题](url)`
- 所有跨层链接**必须**同步记录到 L8 links.json

---

## 各层规范

### L3 system/ — 系统知识

| 字段 | 规则 |
|------|------|
| type | `system` |
| 文件名 | `{tool-name}.md` 或 `{workflow-name}.md` |
| 内容 | 一个文件描述一个工具/流程，不含项目特定信息 |
| 示例 | `codex-cli.md`, `deploy-workflow.md`, `agent-roles.md` |

```yaml
---
title: "Codex CLI 使用规范"
type: system
layer: L3
author: bojack
created: 2026-06-07
tags: [codex, cli, builder]
status: reviewed
---
```

### L4 projects/ — 项目空间

| 字段 | 规则 |
|------|------|
| type | `project` |
| 目录 | `L4 projects/{project-id}/` |
| 必须文件 | `README.md`（项目概述）, `tasks.md`（任务列表） |
| 可选文件 | `notes.md`, `decisions.md`, 任意代码文件 |
| 示例 | `L4 projects/opc-dashboard/README.md` |

```yaml
---
title: "OPC 仪表盘"
type: project
layer: L4
author: bojack
created: 2026-06-07
tags: [dashboard, web, team]
status: draft
---
```

### L5 pages/ — 知识库

| 类型 | 用途 | 文件名前缀 |
|------|------|-----------|
| `concept` | 概念解释 | `concept-` |
| `guide` | 操作指南 | `guide-` |
| `reference` | 参考信息 | `ref-` |

```yaml
---
title: "WebSocket 协议概述"
type: concept
layer: L5
author: athena
created: 2026-06-07
tags: [websocket, protocol, real-time]
status: reviewed
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/API/WebSocket"
  - "L6 raw/2026-06-07-websocket-research.md"
---
```

### L6 raw/ — 原料仓

| 字段 | 规则 |
|------|------|
| type | `raw` |
| 文件名 | `{YYYY-MM-DD}-{简短描述}.md` |
| 内容 | 原始调研记录、数据转储。不要求结构化。 |
| 提炼后 | 在 frontmatter 加 `refined_to: "L5 pages/xxx.md"` |

### L7 assets/ — 资源

| 子目录 | 用途 |
|--------|------|
| `images/` | 截图、示意图 |
| `templates/` | 可复用的 .md 模板 |
| `diagrams/` | Mermaid / Excalidraw 源文件 |

### L8 links.json — 链接图

```json
{
  "links": [
    {
      "from": "L5 pages/concept-websocket.md",
      "to": "L6 raw/2026-06-07-websocket-research.md",
      "type": "derived_from"
    },
    {
      "from": "L4 projects/opc-dashboard/README.md",
      "to": "L5 pages/concept-websocket.md",
      "type": "references"
    }
  ]
}
```

link type 可选值：`derived_from`（提炼自）、`references`（引用）、`implements`（实现）、`documents`（文档化）、`depends_on`（依赖）

### L9 CHANGELOG.md — 演进日志

```markdown
## 2026-06-07
- **Bojack**: 初始化 wiki 结构，定义 L1-L9 层级
- **Bojack**: 创建 L2 schema.md v1.0
```

格式：`- **{作者}**: {做了什么}。{为什么}（可选）`
