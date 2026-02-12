# AI 代码占比看板重构设计文档

**日期：** 2026-02-12
**作者：** Claude Code
**状态：** 已批准

---

## 1. 概述

### 1.1 重构目标

对现有看板进行重构，聚焦于 AI 代码占比的可视化展示，提供简洁统一的用户界面。

### 1.2 核心功能

1. **排行榜部分**
   - AI 代码占比部门排行榜（支持二级/三级部门视图）
   - AI 代码占比个人排行榜

2. **明细部分**
   - 组织视图、仓库视图的代码占比变化趋势（按月分组）
   - 对应视图下的提交明细列表

### 1.3 删除范围

- 移除现有的「仓库视图」/「组织视图」切换
- 移除「部门看板」功能模块
- 移除部门用户管理相关组件
- 移除 Sidebar 侧边栏

---

## 2. 架构设计

### 2.1 技术栈

- **前端框架：** Next.js 15 (App Router)
- **UI 组件库：** shadcn/ui
- **图表库：** Recharts
- **状态管理：** React useState
- **样式：** Tailwind CSS

### 2.2 整体架构

采用**单页全量重构**方案，移除视图切换逻辑，创建统一的 AI 占比看板组件。

```
app/
├── page.tsx                          # 主页面（重写）
components/
├── ai-ratio-board/                   # 新增：AI 占比看板组件目录
│   ├── header.tsx                     # 顶部 Header
│   ├── leaderboard-panel.tsx           # 排行榜面板
│   ├── trend-chart-panel.tsx           # 趋势图面板
│   ├── commits-panel.tsx              # 提交明细面板
│   └── department-level-selector.tsx   # 部门层级选择器
lib/
└── api.ts                            # 新增 API 函数
```

### 2.3 布局设计

采用**左右分栏布局**：

```
┌─────────────────────────────────────────────────────────────────┐
│  Header（标题 + 概览统计卡片 + 月份选择器）                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌─────────────────────────────────┐  │
│  │   排行榜区域        │ │      趋势图 + 提交明细        │  │
│  │   （左侧 35%）      │ │          （右侧 65%）          │  │
│  │                     │ │                                 │  │
│  │  - 部门排行 Tab    │ │  - AI占比月度趋势图           │  │
│  │  - 个人排行 Tab    │ │  - 提交明细列表              │  │
│  │                     │ │                                 │  │
│  └─────────────────────┘ └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. API 设计

### 3.1 新增接口类型

```typescript
// AI 排行榜响应类型
export interface AIRatioLeaderboardDto {
  view: "department" | "user"
  period: string  // "2026-02"
  sort: "ai_ratio" | "ai_lines" | "total_lines"
  items: AIRatioLeaderboardItemDto[]
}

export interface AIRatioLeaderboardItemDto {
  rank: number
  department?: {
    id: number
    name: string
    path: string
    level: number
  }
  user?: {
    id: number
    name: string
    username: string
    department?: { id: number; name: string }
  }
  metrics: {
    total_lines: number
    ai_lines: number
    human_lines: number
    ai_ratio: number
  }
}

// 提交明细响应类型
export interface AICommitsDto {
  view: "department" | "repo"
  period: string
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
  items: AICommitItemDto[]
}

export interface AICommitItemDto {
  commit: {
    id: number
    sha: string
    message: string
    committed_at: string
  }
  user: {
    id: number
    name: string
    username: string
    department?: { id: number; name: string }
  }
  repo?: {
    id: number
    name: string
    web_url: string
  }
  stats: {
    additions: number
    files_changed: number
    ai_lines: number
    human_lines: number
    ai_ratio: number
  }
}
```

### 3.2 新增 API 函数

```typescript
// 获取部门排行榜
export function fetchAIRatioDepartmentLeaderboard(
  options: {
    repo_id?: number
    parent_id?: number
    level?: number
    sort?: "ai_ratio" | "ai_lines" | "total_lines"
    year: number
    month: number
    limit?: number
  }
): Promise<AIRatioLeaderboardDto>

// 获取个人排行榜
export function fetchAIRatioUserLeaderboard(
  options: {
    repo_id?: number
    department_id?: number
    sort?: "ai_ratio" | "ai_lines" | "total_lines"
    year: number
    month: number
    limit?: number
  }
): Promise<AIRatioLeaderboardDto>

// 按部门获取提交明细
export function fetchAICommitsByDepartment(
  options: {
    repo_id?: number
    department_id: number
    year: number
    month: number
    page?: number
    page_size?: number
  }
): Promise<AICommitsDto>

// 按仓库获取提交明细
export function fetchAICommitsByRepo(
  options: {
    repo_id: number
    department_id?: number
    year: number
    month: number
    page?: number
    page_size?: number
  }
): Promise<AICommitsDto>
```

### 3.3 后端 API 映射

| 前端函数 | 后端 API |
|---------|----------|
| `fetchAIRatioDepartmentLeaderboard` | `GET /leaderboards/departments` |
| `fetchAIRatioUserLeaderboard` | `GET /leaderboards/users` |
| `fetchAICommitsByDepartment` | `GET /commits/by-department` |
| `fetchAICommitsByRepo` | `GET /commits/by-repo` |

---

## 4. 组件设计

### 4.1 组件清单

| 组件名称 | 职责 | 文件路径 |
|---------|-------|---------|
| `AiRatioBoardPage` | 主页面容器，管理全局状态 | `app/page.tsx`（重写） |
| `AiRatioBoardHeader` | 顶部 Header：标题、统计卡片、筛选器 | `components/ai-ratio-board/header.tsx` |
| `LeaderboardPanel` | 排行榜面板，包含部门/个人 Tab | `components/ai-ratio-board/leaderboard-panel.tsx` |
| `TrendChartPanel` | AI 占比趋势图 | `components/ai-ratio-board/trend-chart-panel.tsx` |
| `CommitsPanel` | 提交明细列表 | `components/ai-ratio-board/commits-panel.tsx` |
| `DepartmentLevelSelector` | 部门层级选择器 | `components/ai-ratio-board/department-level-selector.tsx` |

### 4.2 AiRatioBoardHeader 组件

**结构：**
```
┌─────────────────────────────────────────────────────────────────────┐
│ AI 代码占比看板                                                 │
│ ┌───────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐       │
│ │总代码行│ │AI代码行│ │ AI占比   │ │月份选择器     │       │
│ └───────┘ └──────────┘ └──────────┘ └──────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface AiRatioBoardHeaderProps {
  totals: {
    total_lines: number
    ai_lines: number
    ai_ratio: number
  } | null
  selectedMonth: string
  onMonthChange: (month: string) => void
  loading?: boolean
}
```

### 4.3 LeaderboardPanel 组件

**结构：**
```
┌────────────────────────────────┐
│ ○ 部门排行榜  ○ 个人排行榜  │
├────────────────────────────────┤
│ ┌──────────────────────┐      │
│ │ 部门层级选择器        │      │
│ └──────────────────────┘      │
│                              │
│ 排行榜列表（可滚动）          │
│                              │
│ 排名 | 部门/用户 | AI占比  │
│   1  | Platform    | 24.5%  │
│   2  | Backend     | 18.2%  │
│   3  | Frontend    | 15.8%  │
└────────────────────────────────┘
```

**Props:**
```typescript
interface LeaderboardPanelProps {
  selectedMonth: string
  onSelectedItemChange: (item: SelectedItem) => void
}

type SelectedItem =
  | { type: "department"; id: number; name: string }
  | { type: "user"; id: number; name: string; departmentId?: number }
```

### 4.4 TrendChartPanel 组件

**结构：**
```
┌────────────────────────────────────────────────────────────────┐
│ AI 代码占比趋势（按月）                                     │
│ ┌────────┐ ┌──────────┐                                   │
│ │开始月份 │ │ 结束月份  │                                   │
│ └────────┘ └──────────┘                                   │
│                                                            │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │  ▁▂▃▅▇█  折线图                                      ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                            │
│ 平均占比: 18.5%                                            │
└────────────────────────────────────────────────────────────────┘
```

**功能：**
- 显示 AI 占比的月度变化趋势（折线图）
- 支持月份范围选择
- 点击图表中的点，更新右侧提交明细

**Props:**
```typescript
interface TrendChartPanelProps {
  selectedItem: SelectedItem | null
  selectedMonth: string
  startMonth: string
  endMonth: string
  onStartMonthChange: (month: string) => void
  onEndMonthChange: (month: string) => void
  onMonthSelect: (month: string) => void
}
```

### 4.5 CommitsPanel 组件

**结构：**
```
┌────────────────────────────────────────────────────────────────┐
│ 提交明细                                                   │
│ [部门: Platform] 或 [用户: Alice]                          │
│                                                            │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │时间      │SHA     │用户│提交信息    │AI占比│新增行    │ │
│ │02-06 10:20│8f2bd42a│Alice│feat:... │17%   │+120     │ │
│ │02-05 15:30│a3e2f1b2│Bob  │fix:...  │0%    │+50      │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                            │
│  ◀ 上一页   第 1/3 页   下一页 ▶                          │
└────────────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface CommitsPanelProps {
  selectedItem: SelectedItem | null
  selectedMonth: string
}
```

---

## 5. 数据流与状态管理

### 5.1 全局状态

```typescript
interface PageState {
  // 筛选条件
  selectedMonth: string
  chartStartMonth: string
  chartEndMonth: string

  // 当前选中的项目（来自排行榜）
  selectedLeaderboardItem: SelectedItem | null

  // 概览数据
  totals: {
    total_lines: number
    ai_lines: number
    ai_ratio: number
  } | null
}
```

### 5.2 数据流向

```
用户操作 → 更新 State → 触发 API 调用 → 更新 UI

1. 选择月份 → 更新 selectedMonth → 重新加载排行榜、趋势图、提交明细
2. 选择部门层级 → 重新加载部门排行榜
3. 切换 Tab → 重新加载对应排行榜类型
4. 点击排行榜项 → 更新 selectedLeaderboardItem → 重新加载提交明细
```

### 5.3 筛选器逻辑

| 筛选选项 | API 参数 | 说明 |
|---------|----------|------|
| 所有部门 | `level` 不传 | 显示所有部门的排行榜 |
| 二级部门 | `level=1` | 只显示 path 深度为 1 的部门 |
| 三级部门 | `level=2` | 只显示 path 深度为 2 的部门 |

---

## 6. 删除清单

### 6.1 需要删除的文件

**前端组件：**
- `components/dashboard/department-kanban-content.tsx`
- `components/dashboard/organization-view-content.tsx`
- `components/dashboard/departments-users.tsx`
- `components/dashboard/department-selector.tsx`
- `components/dashboard/sidebar.tsx`

**API 函数（lib/api.ts）：**
- `fetchDepartmentMonthlyMetrics`
- `fetchDepartmentWorkdaysMetrics`
- `fetchDepartmentDailyMetrics`
- `fetchDepartmentLeaderboard`
- `fetchDepartmentTotals`
- `fetchDepartmentUserCommits`
- `createDepartment`
- `deleteDepartment`
- `updateUser`
- `batchUpdateUsersDepartment`

### 6.2 需要修改的文件

- `app/page.tsx` - 完全重写为新的 AI 占比看板
- `lib/api.ts` - 删除旧函数，添加新 API

---

## 7. 样式与交互设计

### 7.1 配色方案

- AI 占比使用渐变色表示：高占比（绿色）→ 低占比（灰色）
- 排行榜前三名使用特殊的图标和背景色
- 图表使用醒目的主题色

### 7.2 交互细节

- 排行榜行 hover 时显示操作提示
- 点击排行榜行，提交明细面板高亮当前选中项
- 加载状态显示骨架屏
- 错误状态显示友好提示

### 7.3 响应式设计

- 桌面端（≥1024px）：左右分栏布局
- 平板端（768px-1023px）：上下分层布局
- 移动端（<768px）：单列堆叠布局

---

## 8. 错误处理与边界情况

### 8.1 错误处理

- API 调用失败时显示错误横幅
- 空数据时显示友好提示
- 网络错误支持重试

### 8.2 边界情况

- 某月份无数据时，图表显示空状态
- 部门无用户时，排行榜显示空状态
- 提交明细为空时，显示"暂无提交记录"

---

## 9. 决策日志

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 架构方案 | 单页全量重构 | 架构最简单，易于维护，用户体验统一 |
| 布局方案 | 左右分栏 | 充分利用宽屏空间，排行榜和明细同时可见 |
| 趋势图表 | 仅 AI 占比 | 需求明确，简化图表复杂度 |
| 部门层级 | 全部显示 | 支持二级/三级部门视图切换 |

---

## 10. 后续步骤

1. 创建实施计划（使用 writing-plans skill）
2. 按计划实施重构
3. 测试验证
4. 部署上线
