---
id: "a1b2c3d4-0006-4000-8000-000000000006"
type: "raw"
title: "L6 — 原料仓"
created: "2026-06-07T12:00:00+08:00"
modified: "2026-06-07T12:00:00+08:00"
status: "published"
tags: ["#raw", "#wiki"]
owner: "athena"
---

# 原料仓

调研记录、数据转储、原始笔记的存放地。Athena 负责写入，Mercury 负责提炼。

## 文件规范

| 规则 | 说明 |
|------|------|
| 文件名 | `YYYY-MM-DD-{来源}-{简述}.md` |
| 内容 | 不要求结构化，保留原始信息 |
| 来源标注 | 每个文件必须注明数据来源 |
| 提炼标记 | 提炼后添加 `refined_to` 字段 |

## 提炼流程

1. Athena 存入原始材料
2. Mercury 阅读 → 提炼关键信息 → 写入 L5 pages/
3. 在 L6 文件的 frontmatter 添加 `refined_to: "L5 pages/xxx.md"`
4. 在 L8 links.json 记录 `derived_from` 关系

## 当前原料

| 文件 | 来源 | 状态 | 提炼至 |
|------|------|------|--------|
| （待添加） | - | - | - |
