---
id: "a1b2c3d4-0003-4000-8000-000000000020"
type: "system"
title: "标准工作流"
created: "2026-06-07T12:00:00+08:00"
modified: "2026-06-07T12:00:00+08:00"
status: "published"
tags: ["#system", "#workflow"]
owner: "bojack"
---

# 标准工作流

OPC 团队处理任务的默认流程。Bojack 负责调度，各 Agent 按职责执行。

## 通用流程

```
用户意图
  → Bojack 拆解任务
    → 并行分派
      ├── Athena: 调研/查证
      ├── Mercury: 写作/整理
      └── Codex: 编码/工具
    → Bojack 审查收拢
  → 交付用户
```

## 任务类型与分派

| 任务类型 | 主 Agent | 协作 Agent |
|----------|----------|-----------|
| 调研分析 | Athena | 需工具时 → Codex |
| 知识整理 | Mercury | 需原材料时 → Athena |
| 功能编码 | Codex | - |
| 项目管理 | Bojack | 全体 |
| 规则变更 | Bojack | 通知全体 |

## 质量节点

在每个 Agent 产出后，Bojack 必须执行以下检查再交付：

1. **Athena 产出** → 来源是否可靠？矛盾是否可见？
2. **Mercury 产出** → 结构是否清晰？引用是否完整？
3. **Codex 产出** → 代码是否通过测试？风格是否一致？

## 中断与异常

| 情况 | 处理 |
|------|------|
| 产出不符合质量标准 | Bojack 退回原 Agent 修正 |
| 任务需要澄清 | Bojack 主动向用户确认 |
| 阻塞（缺信息/权限） | Bojack 记录阻塞原因，暂停该分支 |
| 规则冲突 | Bojack 召集相关 Agent 讨论，决定后更新 L2 schema.md |
