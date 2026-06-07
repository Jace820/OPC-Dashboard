---
id: "a1b2c3d4-0007-4000-8000-000000000007"
type: "system"
title: "L7 — 资源层"
created: "2026-06-07T12:00:00+08:00"
modified: "2026-06-07T12:00:00+08:00"
status: "published"
tags: ["#assets", "#wiki"]
owner: "bojack"
---

# 资源层

静态资源：图片、模板、图表源文件。不包含 .md 内容。

## 子目录

| 子目录 | 用途 | 文件类型 |
|--------|------|----------|
| [images/](images/) | 截图、示意图、照片 | .png .jpg .svg .webp |
| [templates/](templates/) | 可复用的 .md 模板 | .md |
| [diagrams/](diagrams/) | Mermaid / Excalidraw / Draw.io 源文件 | .mmd .excalidraw .drawio |

## 命名规范

`{类型}-{描述}.{扩展名}`，如：
- `screenshot-dashboard-v2.png`
- `diagram-architecture.mmd`
- `template-project-readme.md`

## 引用方式

在 .md 文件中使用相对路径：
```markdown
![架构图](L7 assets/diagrams/diagram-architecture.png)
```
