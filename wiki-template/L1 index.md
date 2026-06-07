# L1 — OPC Wiki 总入口

> 多 Agent 共享记忆仓库。不止是笔记库，更是多个 profile 协作的公共大脑。

## 快速导航

| 层级 | 定位 | 入口 |
|------|------|------|
| **L2** | 语法：页面规范、元数据约定 | [L2 schema.md](L2%20schema.md) |
| **L3** | 系统：Agent 工作流、工具约定 | [L3 system/](L3%20system/) |
| **L4** | 项目：每个项目的独立空间 | [L4 projects/](L4%20projects/) |
| **L5** | 知识：概念、指南、参考 | [L5 pages/](L5%20pages/) |
| **L6** | 原料：未加工的调研记录 | [L6 raw/](L6%20raw/) |
| **L7** | 资源：图片、图表、模板 | [L7 assets/](L7%20assets/) |
| **L8** | 链接：跨层关系图 | [L8 links.json](L8%20links.json) |
| **L9** | 日志：谁改了什么规则、为什么 | [L9 CHANGELOG.md](L9%20CHANGELOG.md) |

## 怎么找东西

1. **我知道关键词** → 搜索 L5 pages/（概念库）
2. **我知道是哪个项目** → 进 L4 projects/<项目名>/
3. **我想看某个 Agent 怎么工作** → 看 L3 system/
4. **我想看原始材料** → 看 L6 raw/
5. **我不知道在哪** → 看 L8 links.json 找关联

## 怎么加东西

1. 先看 [L2 schema.md](L2%20schema.md) — 确认你要加的类型和格式
2. 按类型放到对应层级
3. 如果有跨层引用，更新 [L8 links.json](L8%20links.json)
4. 如果是规则变更，记入 [L9 CHANGELOG.md](L9%20CHANGELOG.md)

## 当前状态

- 项目数：见 L4 projects/
- 知识页数：见 L5 pages/
- 最近变更：见 L9 CHANGELOG.md
- **使用说明**：见 [HOWTO.md](HOWTO.md)
