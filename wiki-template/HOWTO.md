# Wiki 使用指南

## Agent 如何访问 Wiki

Dashboard 激活 Agent 后，自动在 `L3 system/` 创建 `agent-{name}.md`。

Agent 通过以下方式读取 Wiki：
1. 启动时检查 `L3 system/active-tasks.json`
2. 需要上下文时搜索 `L5 pages/`
3. 项目信息从 `L4 projects/` 获取

## 人类如何维护 Wiki

- **加知识**: 在 `L5 pages/` 创建对应类型的 .md 文件
- **更新链接**: 编辑 `L8 links.json`
- **记录变更**: 在 `L9 CHANGELOG.md` 追加条目
