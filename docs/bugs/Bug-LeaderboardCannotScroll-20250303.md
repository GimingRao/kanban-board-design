# Bug 分析报告：排行榜无法滑动

> **创建时间**：2026-03-03 14:00
> **状态**：🔍 分析中
> **优先级**：P2

---

## 📋 缺陷概述

### 问题描述
AI 代码占比看板页面中，红色圈出的排行榜区域（部门排行榜/个人排行榜）无法滑动查看完整列表。

### 涉及模块
- **页面**：AI 代码占比看板 (`/`)
- **组件**：排行榜面板 (Leaderboard Panel)
- **代码文件**：待定位

### 现象对比
| 项目 | 描述 |
|------|------|
| **当前现象** | 排行榜列表区域无法滚动，只能看到前几条数据 |
| **期望现象** | 排行榜列表应该可以垂直滚动，查看所有部门/用户 |

---

## 🔍 可能原因分析

### 原因 1：CSS overflow 属性设置不当
- **原因描述**：排行榜容器缺少 `overflow-y: auto` 或 `overflow: scroll` 样式
- **可能性**：⭐⭐⭐⭐⭐ 高
- **排查步骤**：
  1. 检查排行榜容器的 CSS 样式
  2. 确认是否有正确的 overflow 设置
- **判断标准**：
  - 预期：容器应有 `overflow-y: auto` 或类似设置
  - 实际：可能缺少该属性或被覆盖

### 原因 2：容器高度未正确设置
- **原因描述**：容器没有固定高度或最大高度，导致内容撑开而不是滚动
- **可能性**：⭐⭐⭐⭐ 中高
- **排查步骤**：
  1. 检查容器的高度设置
  2. 确认是否有 `max-height` 或 `height` 限制

### 原因 3：父元素阻止了滚动事件
- **原因描述**：父元素可能有 `overflow: hidden` 或其他阻止滚动的设置
- **可能性**：⭐⭐⭐ 中
- **排查步骤**：
  1. 检查父级元素的 overflow 设置
  2. 检查是否有 touch-action 等属性影响

---

## 📝 排查过程记录

### 第 1 轮排查 - 2026-03-03 14:00

**执行内容**：
- 使用 Playwright 打开页面验证问题
- 检查相关组件代码

**观察结果**：
1. 排行榜表格容器有 `overflow-auto` 设置，但父级元素存在问题
2. 层级结构分析：
   - 表格直接父容器：`flex-1 overflow-auto p-4` - overflow 正常
   - 卡片容器：`flex h-full flex-col rounded-lg border...` - **没有 overflow 限制**
   - Grid 容器：`grid h-full grid-cols-1...` - height: 590px，**没有 overflow 设置**
   - Main 容器：`flex-1 overflow-hidden p-4 sm:p-6` - **overflow: hidden**

3. 问题定位：
   - `ai-ratio-board-content.tsx` 第 94 行：`<div className="h-full min-h-0">`
   - 这个 div 包裹 LeaderboardPanel，但没有设置 `overflow-hidden` 和 `min-h-0`
   - 导致 LeaderboardPanel 的高度被撑开而不是受限滚动

**分析结论**：
左侧排行榜容器（35%宽度列）缺少 `overflow-hidden` 和正确的 `min-h-0` 设置，导致内容撑开整个布局而不是在内部滚动。

---

## ✅ 根因确认

**根因描述**：
左侧排行榜列容器（35%宽度）缺少 `overflow-hidden` 约束，导致 LeaderboardPanel 内部的表格内容撑开父容器高度，而不是在固定高度内滚动。

**根因位置**：
- 文件：`components/ai-ratio-board/ai-ratio-board-content.tsx`
- 行号：第 94 行
- 代码：`<div className="h-full min-h-0">`

---

## 🔧 修复方案

### 修复思路
在左侧排行榜列容器上添加 `overflow-hidden` 和 `min-h-0`，确保 LeaderboardPanel 内部的内容在超出高度时能够正确滚动，而不是撑开父容器。

### 代码改动
```diff
// components/ai-ratio-board/ai-ratio-board-content.tsx 第 94 行
- <div className="h-full min-h-0">
+ <div className="h-full min-h-0 overflow-hidden">
```

### 影响范围
- 仅影响 AI 代码占比看板页面的左侧排行榜区域布局
- 不影响右侧趋势图和提交明细面板
- 不影响其他页面功能

### 回归测试建议
1. 验证排行榜列表可以正常滚动查看所有部门/用户
2. 验证切换部门/个人排行榜标签后滚动仍然正常
3. 验证窗口大小变化时布局仍然正确
4. 验证选择不同月份数据加载后滚动正常

---

## 📌 备注

