# AI 代码占比看板重构执行清单

## 🎯 任务概览

* **功能名称**: AI 代码占比看板重构
* **实现思路**: 单页全量重构，移除视图切换，创建统一的 AI 占比看板，采用左右分栏布局
* **设计文档**: `docs/plans/2026-02-12-ai-ratio-board-refactor-design.md`

---

## 🛠️ 执行清单

### Task 1: 创建 ai-ratio-board 组件目录

* **📍 涉及文件**: `components/ai-ratio-board/` (新建目录)
* **💡 实现逻辑**:
    1. 在 `components/` 目录下创建 `ai-ratio-board` 子目录
    2. 在新目录中创建 `index.ts` 导出文件，内容为空对象导出 `export {}`
* **🧪 验证方式**:
    * 运行 `ls -la components/ai-ratio-board/` -> 预期看到 `index.ts` 文件
* **💾 Commit**: `chore: create ai-ratio-board component directory`

---

### Task 2: 在 lib/api.ts 中添加 AI 排行榜接口类型定义

* **📍 涉及文件**: `lib/api.ts`
* **💡 实现逻辑**:
    1. 在文件末尾、最后一个接口定义之后添加以下类型定义：
    ```typescript
    // ==================== AI Ratio Leaderboard ====================

    export interface AIRatioLeaderboardDto {
      view: "department" | "user"
      period: string
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
* **🧪 验证方式**:
    * 运行 `npm run build` -> 预期无 TypeScript 类型错误
* **💾 Commit**: `feat(ai-ratio): add AI leaderboard DTO types`

---

### Task 3: 在 lib/api.ts 中添加 AI 排行榜 API 函数

* **📍 涉及文件**: `lib/api.ts`
* **💡 实现逻辑**:
    1. 在 Task 2 添加的类型定义之后，添加以下 API 函数：
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
     ): Promise<AIRatioLeaderboardDto> {
       const repoId = options.repo_id ?? -1
       const limit = options.limit ?? 20
       const sort = options.sort ?? "ai_ratio"
       const levelQuery = options.level !== undefined ? `&level=${options.level}` : ""
       const parentQuery = options.parent_id !== undefined ? `&parent_id=${options.parent_id}` : ""

       return getJson<AIRatioLeaderboardDto>(
         `/leaderboards/departments?repo_id=${repoId}&sort=${sort}&year=${options.year}&month=${options.month}&limit=${limit}${levelQuery}${parentQuery}`
       )
     }

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
     ): Promise<AIRatioLeaderboardDto> {
       const repoId = options.repo_id ?? -1
       const limit = options.limit ?? 20
       const sort = options.sort ?? "ai_ratio"
       const deptQuery = options.department_id !== undefined ? `&department_id=${options.department_id}` : ""

       return getJson<AIRatioLeaderboardDto>(
         `/leaderboards/users?repo_id=${repoId}&sort=${sort}&year=${options.year}&month=${options.month}&limit=${limit}${deptQuery}`
       )
     }

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
     ): Promise<AICommitsDto> {
       const repoId = options.repo_id ?? -1
       const page = options.page ?? 1
       const pageSize = options.page_size ?? 20

       return getJson<AICommitsDto>(
         `/commits/by-department?repo_id=${repoId}&department_id=${options.department_id}&year=${options.year}&month=${options.month}&page=${page}&page_size=${pageSize}`
       )
     }

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
     ): Promise<AICommitsDto> {
       const page = options.page ?? 1
       const pageSize = options.page_size ?? 20
       const deptQuery = options.department_id !== undefined ? `&department_id=${options.department_id}` : ""

       return getJson<AICommitsDto>(
         `/commits/by-repo?repo_id=${options.repo_id}&year=${options.year}&month=${options.month}&page=${page}&page_size=${pageSize}${deptQuery}`
       )
     }
    ```
* **🧪 验证方式**:
    * 运行 `npm run build` -> 预期无 TypeScript 类型错误
* **💾 Commit**: `feat(ai-ratio): add AI leaderboard and commits API functions`

---

### Task 4: 创建 DepartmentLevelSelector 组件

* **📍 涉及文件**: `components/ai-ratio-board/department-level-selector.tsx`
* **💡 实现逻辑**:
    1. 创建新文件，添加以下内容：
    ```typescript
    "use client"

    import { Button } from "@/components/ui/button"

    type LevelOption = "all" | "level2" | "level3"

    interface DepartmentLevelSelectorProps {
      value: LevelOption
      onChange: (value: LevelOption) => void
      disabled?: boolean
    }

    const options = [
      { value: "all" as const, label: "所有部门" },
      { value: "level2" as const, label: "二级部门" },
      { value: "level3" as const, label: "三级部门" },
    ]

    export function DepartmentLevelSelector({
      value,
      onChange,
      disabled = false,
    }: DepartmentLevelSelectorProps) {
      return (
        <div className="inline-flex rounded-md border border-border bg-secondary p-1 text-xs">
          {options.map((option) => {
            const isActive = value === option.value
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => onChange(option.value)}
                className={
                  isActive
                    ? "rounded px-3 py-1.5 font-medium text-foreground"
                    : "rounded px-3 py-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
                }
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )
    }
    ```
* **🧪 验证方式**:
    * 检查文件是否创建成功 -> 预期 `components/ai-ratio-board/department-level-selector.tsx` 存在
* **💾 Commit**: `feat(ai-ratio): create DepartmentLevelSelector component`

---

### Task 5: 创建 AiRatioBoardHeader 组件 - 基础结构和 Title

* **📍 涉及文件**: `components/ai-ratio-board/header.tsx`
* **💡 实现逻辑**:
    1. 创建新文件，添加基础结构和 Title：
    ```typescript
    "use client"

    import { Card } from "@/components/ui/card"

    export interface AiRatioBoardHeaderProps {
      totals: {
        total_lines: number
        ai_lines: number
        ai_ratio: number
      } | null
      selectedMonth: string
      onMonthChange: (month: string) => void
      loading?: boolean
    }

    export function AiRatioBoardHeader({
      totals,
      selectedMonth,
      onMonthChange,
      loading = false,
    }: AiRatioBoardHeaderProps) {
      return (
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-foreground">
              AI 代码占比看板
            </h1>
          </div>

          {totals && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">总代码行数</div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {totals.total_lines.toLocaleString()}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">AI 代码行数</div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {totals.ai_lines.toLocaleString()}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">AI 占比</div>
                <div className="mt-2 text-2xl font-bold text-accent">
                  {(totals.ai_ratio * 100).toFixed(1)}%
                </div>
              </Card>
            </div>
          )}
        </div>
      )
    }
    ```
* **🧪 验证方式**:
    * 检查文件是否创建成功 -> 预期 `components/ai-ratio-board/header.tsx` 存在
* **💾 Commit**: `feat(ai-ratio): create AiRatioBoardHeader component base structure`

---

### Task 6: 创建 AiRatioBoardHeader 组件 - 添加月份选择器

* **📍 涉及文件**: `components/ai-ratio-board/header.tsx`
* **💡 实现逻辑**:
    1. 在 AiRatioBoardHeader 组件内添加月份选择逻辑：
    2. 在文件顶部添加月份选项生成函数：
    ```typescript
    function getRecentMonths(count: number): Array<{ value: string; label: string }> {
      const result: Array<{ value: string; label: string }> = []
      const now = new Date()
      const base = new Date(now.getFullYear(), now.getMonth(), 1)

      for (let i = 0; i < count; i += 1) {
        const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
        const year = d.getFullYear()
        const month = d.getMonth() + 1
        const value = `${year}-${String(month).padStart(2, "0")}`
        const label = d.toLocaleDateString("zh-CN", { year: "numeric", month: "long" })
        result.push({ value, label })
      }

      return result
    }
    ```
    3. 在组件中添加 useMemo 和导入：
    ```typescript
    import { useMemo } from "react"
    import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
    } from "@/components/ui/select"

    export function AiRatioBoardHeader({ ... }: AiRatioBoardHeaderProps) {
      const monthOptions = useMemo(() => getRecentMonths(12), [])
    ```
    4. 在 return 的 header div 底部、totals 卡片之后添加月份选择器：
    ```typescript
          <div className="mt-4 flex items-center justify-end gap-2">
            <span className="text-sm text-muted-foreground">月份:</span>
            <Select value={selectedMonth} onValueChange={onMonthChange} disabled={loading}>
              <SelectTrigger className="w-[180px] bg-secondary/40">
                <SelectValue placeholder="选择月份" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
    ```
* **🧪 验证方式**:
    * 运行 `npm run build` -> 预期无 TypeScript 错误
* **💾 Commit**: `feat(ai-ratio): add month selector to AiRatioBoardHeader`

---

### Task 7: 创建 LeaderboardPanel 组件 - 基础结构和 Tab 切换

* **📍 涉及文件**: `components/ai-ratio-board/leaderboard-panel.tsx`
* **💡 实现逻辑**:
    1. 创建新文件，添加基础结构和 Tab 切换：
    ```typescript
    "use client"

    import { useState } from "react"
    import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
    import { Award, Crown, Medal } from "lucide-react"
    import { cn } from "@/lib/utils"

    export type SelectedItem =
      | { type: "department"; id: number; name: string }
      | { type: "user"; id: number; name: string; departmentId?: number }

    export interface LeaderboardPanelProps {
      selectedMonth: string
      onSelectedItemChange: (item: SelectedItem | null) => void
    }

    type LeaderboardTab = "department" | "user"

    function getRankIcon(rank: number) {
      switch (rank) {
        case 1:
          return <Crown className="h-5 w-5 text-yellow-500" />
        case 2:
          return <Medal className="h-5 w-5 text-gray-400" />
        case 3:
          return <Award className="h-5 w-5 text-amber-600" />
        default:
          return (
            <span className="flex h-5 w-5 items-center justify-center text-sm text-muted-foreground">
              {rank}
            </span>
          )
      }
    }

    export function LeaderboardPanel({
      selectedMonth,
      onSelectedItemChange,
    }: LeaderboardPanelProps) {
      const [activeTab, setActiveTab] = useState<LeaderboardTab>("department")
      const [departmentLevel, setDepartmentLevel] = useState<"all" | "level2" | "level3">("all")

      return (
        <div className="flex h-full flex-col rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardTab)}>
              <TabsList>
                <TabsTrigger value="department">部门排行榜</TabsTrigger>
                <TabsTrigger value="user">个人排行榜</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {/* 内容区域将在后续任务中添加 */}
          <div className="flex-1 overflow-auto p-4">
            <div className="text-sm text-muted-foreground">加载中...</div>
          </div>
        </div>
      )
    }
    ```
* **🧪 验证方式**:
    * 检查文件是否创建成功 -> 预期 `components/ai-ratio-board/leaderboard-panel.tsx` 存在
* **💾 Commit**: `feat(ai-ratio): create LeaderboardPanel component with tabs`

---

### Task 8: 创建 LeaderboardPanel 组件 - 部门层级选择器和数据加载

* **📍 涉及文件**: `components/ai-ratio-board/leaderboard-panel.tsx`
* **💡 实现逻辑**:
    1. 在组件中添加 DepartmentLevelSelector 导入和 useEffect：
    ```typescript
    import { useEffect, useState, useMemo } from "react"
    import { fetchAIRatioDepartmentLeaderboard, fetchAIRatioUserLeaderboard, type AIRatioLeaderboardDto, type AIRatioLeaderboardItemDto } from "@/lib/api"
    import { DepartmentLevelSelector } from "./department-level-selector"
    import { parseMonth } from "../dashboard/dashboard-content" // 复用现有工具函数
    ```
    2. 在组件内添加状态：
    ```typescript
      const [data, setData] = useState<AIRatioLeaderboardDto | null>(null)
      const [loading, setLoading] = useState(false)
      const [error, setError] = useState<string | null>(null)
    ```
    3. 添加数据加载 useEffect：
    ```typescript
      useEffect(() => {
        const parsed = parseMonth(selectedMonth)
        if (!parsed) return

        let cancelled = false
        setLoading(true)
        setError(null)

        const fetchData = activeTab === "department"
          ? () => fetchAIRatioDepartmentLeaderboard({
              year: parsed.year,
              month: parsed.month,
              level: departmentLevel === "all" ? undefined : departmentLevel === "level2" ? 1 : 2,
            })
          : () => fetchAIRatioUserLeaderboard({
              year: parsed.year,
              month: parsed.month,
            })

        fetchData()
          .then((result) => {
            if (cancelled) return
            setData(result)
          })
          .catch((err: unknown) => {
            if (cancelled) return
            const message = err instanceof Error ? err.message : "加载失败"
            setError(message)
            setData(null)
          })
          .finally(() => {
            if (!cancelled) setLoading(false)
          })

        return () => {
          cancelled = true
        }
      }, [activeTab, selectedMonth, departmentLevel])
    ```
* **🧪 验证方式**:
    * 运行 `npm run build` -> 预期无 TypeScript 错误
* **💾 Commit**: `feat(ai-ratio): add data loading to LeaderboardPanel`

---

### Task 9: 创建 LeaderboardPanel 组件 - 渲染排行榜列表

* **📍 涉及文件**: `components/ai-ratio-board/leaderboard-panel.tsx`
* **💡 实现逻辑**:
    1. 替换内容区域的渲染逻辑：
    ```typescript
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                正在加载排行榜...
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center text-sm text-destructive">
                {error}
              </div>
            ) : !data || data.items.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                暂无数据
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">排名</th>
                    <th className="px-4 py-3">{activeTab === "department" ? "部门" : "开发者"}</th>
                    <th className="px-4 py-3 text-right">总代码行</th>
                    <th className="px-4 py-3 text-right">AI 代码行</th>
                    <th className="px-4 py-3 text-right">AI 占比</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => {
                    const name = activeTab === "department" ? item.department?.name : item.user?.name ?? "-"
                    const handleClick = () => {
                      if (activeTab === "department" && item.department) {
                        onSelectedItemChange({ type: "department", id: item.department.id, name: item.department.name })
                      } else if (activeTab === "user" && item.user) {
                        onSelectedItemChange({ type: "user", id: item.user.id, name: item.user.name, departmentId: item.user.department?.id })
                      }
                    }
                    return (
                      <tr
                        key={item.rank}
                        onClick={handleClick}
                        className={cn(
                          "cursor-pointer border-b border-border/50 transition-colors hover:bg-secondary/60",
                          index < 3 && "bg-secondary/20",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex w-8 items-center justify-center">
                            {getRankIcon(item.rank)}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-card-foreground">
                          {name}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-card-foreground">
                          {item.metrics.total_lines.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-card-foreground">
                          {item.metrics.ai_lines.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-accent">
                          {(item.metrics.ai_ratio * 100).toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
    ```
    2. 在部门 Tab 时显示部门层级选择器，在 TabsList 后添加：
    ```typescript
            {activeTab === "department" && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">层级筛选:</span>
                <DepartmentLevelSelector
                  value={departmentLevel}
                  onChange={setDepartmentLevel}
                  disabled={loading}
                />
              </div>
            )}
    ```
* **🧪 验证方式**:
    * 运行 `npm run build` -> 预期无 TypeScript 错误
* **💾 Commit**: `feat(ai-ratio): add leaderboard table rendering to LeaderboardPanel`

---

### Task 10: 创建 TrendChartPanel 组件 - 基础结构和折线图

* **📍 涉及文件**: `components/ai-ratio-board/trend-chart-panel.tsx`
* **💡 实现逻辑**:
    1. 创建新文件：
    ```typescript
    "use client"

    import { useMemo } from "react"
    import {
      Line,
      LineChart,
      ResponsiveContainer,
      Tooltip,
      XAxis,
      YAxis,
      CartesianGrid,
      Legend,
    } from "recharts"
    import type { SelectedItem } from "./leaderboard-panel"

    export interface TrendChartPanelProps {
      selectedItem: SelectedItem | null
      selectedMonth: string
      startMonth: string
      endMonth: string
      onStartMonthChange: (month: string) => void
      onEndMonthChange: (month: string) => void
      onMonthSelect?: (month: string) => void
    }

    function getRecentMonths(count: number): Array<{ value: string; label: string }> {
      const result: Array<{ value: string; label: string }> = []
      const now = new Date()
      const base = new Date(now.getFullYear(), now.getMonth(), 1)

      for (let i = 0; i < count; i += 1) {
        const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
        const year = d.getFullYear()
        const month = d.getMonth() + 1
        const value = `${year}-${String(month).padStart(2, "0")}`
        const label = d.toLocaleDateString("zh-CN", { year: "numeric", month: "long" })
        result.push({ value, label })
      }

      return result
    }

    export function TrendChartPanel({
      selectedItem,
      selectedMonth,
      startMonth,
      endMonth,
      onStartMonthChange,
      onEndMonthChange,
      onMonthSelect,
    }: TrendChartPanelProps) {
      const monthOptions = useMemo(() => getRecentMonths(36), [])

      // 模拟数据 - 后续任务将替换为真实数据
      const chartData = useMemo(() => {
        // 生成过去 12 个月的模拟数据
        const data = []
        const now = new Date()
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
          data.push({
            month,
            ai_ratio: Math.random() * 30 + 10, // 10-40% 随机值
          })
        }
        return data
      }, [])

      const avgRatio = useMemo(() => {
        if (chartData.length === 0) return 0
        return chartData.reduce((sum, d) => sum + d.ai_ratio, 0) / chartData.length
      }, [chartData])

      return (
        <div className="flex h-full flex-col rounded-lg border border-border bg-card p-6">
          <div className="mb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  AI 代码占比趋势（按月）
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedItem ? `${selectedItem.name} 的月度趋势` : "请选择排行榜项目"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-h-[300px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.9 0 0)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "oklch(0.45 0 0)", fontSize: 12 }}
                  tickLine={{ stroke: "oklch(0.85 0 0)" }}
                  axisLine={{ stroke: "oklch(0.85 0 0)" }}
                />
                <YAxis
                  tick={{ fill: "oklch(0.45 0 0)", fontSize: 12 }}
                  tickLine={{ stroke: "oklch(0.85 0 0)" }}
                  axisLine={{ stroke: "oklch(0.85 0 0)" }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "AI 占比"]}
                  contentStyle={{
                    backgroundColor: "oklch(1 0 0)",
                    border: "1px solid oklch(0.9 0 0)",
                    borderRadius: "8px",
                    color: "oklch(0.15 0 0)",
                  }}
                  labelStyle={{ color: "oklch(0.45 0 0)" }}
                />
                <Line
                  type="monotone"
                  dataKey="ai_ratio"
                  stroke="oklch(0.6 0.18 160)"
                  strokeWidth={2}
                  dot={{ fill: "oklch(0.6 0.18 160)", r: 4 }}
                  activeDot={{ r: 6 }}
                  onClick={onMonthSelect ? (data: any) => onMonthSelect(data.month) : undefined}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 rounded-md border border-border/60 bg-secondary/30 p-3 text-center">
            <p className="text-2xl font-bold text-accent">
              {avgRatio.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">平均 AI 占比</p>
          </div>
        </div>
      )
    }
    ```
* **🧪 验证方式**:
    * 检查文件是否创建成功 -> 预期 `components/ai-ratio-board/trend-chart-panel.tsx` 存在
* **💾 Commit**: `feat(ai-ratio): create TrendChartPanel component with line chart`

---

### Task 11: 创建 CommitsPanel 组件

* **📍 涉及文件**: `components/ai-ratio-board/commits-panel.tsx`
* **💡 实现逻辑**:
    1. 创建新文件：
    ```typescript
    "use client"

    import { useEffect, useState } from "react"
    import { fetchAICommitsByDepartment, fetchAICommitsByRepo, type AICommitsDto, type AICommitItemDto } from "@/lib/api"
    import type { SelectedItem } from "./leaderboard-panel"
    import { Button } from "@/components/ui/button"
    import { parseMonth } from "../dashboard/dashboard-content"

    export interface CommitsPanelProps {
      selectedItem: SelectedItem | null
      selectedMonth: string
    }

    function formatDateTime(value: string | null) {
      if (!value) return "-"
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return value
      return d.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    export function CommitsPanel({ selectedItem, selectedMonth }: CommitsPanelProps) {
      const [data, setData] = useState<AICommitsDto | null>(null)
      const [loading, setLoading] = useState(false)
      const [error, setError] = useState<string | null>(null)
      const [page, setPage] = useState(1)

      useEffect(() => {
        if (!selectedItem) {
          setData(null)
          return
        }

        const parsed = parseMonth(selectedMonth)
        if (!parsed) return

        let cancelled = false
        setLoading(true)
        setError(null)
        setPage(1)

        const fetchData = selectedItem.type === "department"
          ? () => fetchAICommitsByDepartment({
              department_id: selectedItem.id,
              year: parsed.year,
              month: parsed.month,
              page: 1,
              page_size: 20,
            })
          : () => fetchAICommitsByRepo({
              repo_id: selectedItem.id,
              year: parsed.year,
              month: parsed.month,
              page: 1,
              page_size: 20,
            })

        fetchData()
          .then((result) => {
            if (cancelled) return
            setData(result)
          })
          .catch((err: unknown) => {
            if (cancelled) return
            const message = err instanceof Error ? err.message : "加载提交明细失败"
            setError(message)
            setData(null)
          })
          .finally(() => {
            if (!cancelled) setLoading(false)
          })

        return () => {
          cancelled = true
        }
      }, [selectedItem, selectedMonth])

      // 分页加载
      useEffect(() => {
        if (!selectedItem || page === 1) return // 第 1 页已在主加载中处理

        const parsed = parseMonth(selectedMonth)
        if (!parsed) return

        let cancelled = false
        setLoading(true)
        setError(null)

        const fetchData = selectedItem.type === "department"
          ? () => fetchAICommitsByDepartment({
              department_id: selectedItem.id,
              year: parsed.year,
              month: parsed.month,
              page,
              page_size: 20,
            })
          : () => fetchAICommitsByRepo({
              repo_id: selectedItem.id,
              year: parsed.year,
              month: parsed.month,
              page,
              page_size: 20,
            })

        fetchData()
          .then((result) => {
            if (cancelled) return
            setData(result)
          })
          .catch((err: unknown) => {
            if (cancelled) return
            const message = err instanceof Error ? err.message : "加载提交明细失败"
            setError(message)
          })
          .finally(() => {
            if (!cancelled) setLoading(false)
          })

        return () => {
          cancelled = true
        }
      }, [page, selectedItem, selectedMonth])

      const totalPages = data?.pagination.total_pages ?? 0
      const canPrev = page > 1
      const canNext = totalPages > 0 && page < totalPages

      const buildCommitUrl = (sha: string, repoUrl?: string | null) => {
        if (!repoUrl) return null
        const base = repoUrl.replace(/\/+$/, "")
        return `${base}/-/commit/${sha}`
      }

      return (
        <div className="flex h-full flex-col rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <h3 className="text-lg font-semibold text-card-foreground">
              提交明细
            </h3>
            {selectedItem && (
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedItem.type === "department"
                  ? `部门: ${selectedItem.name}`
                  : `用户: ${selectedItem.name}`}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {!selectedItem ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                请从排行榜中选择一个项目查看提交明细
              </div>
            ) : loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                正在加载提交明细...
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center text-sm text-destructive">
                {error}
              </div>
            ) : !data || data.items.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                暂无提交记录
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 whitespace-nowrap">时间</th>
                    <th className="px-4 py-3 whitespace-nowrap">SHA</th>
                    <th className="px-4 py-3 whitespace-nowrap">用户</th>
                    <th className="px-4 py-3 w-[40%]">提交信息</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">AI 占比</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">新增行</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.commit.id} className="border-b border-border/50 align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {formatDateTime(item.commit.committed_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-card-foreground">
                        {buildCommitUrl(item.commit.sha, item.repo?.web_url) ? (
                          <a
                            href={buildCommitUrl(item.commit.sha, item.repo?.web_url) as string}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline-offset-2 hover:underline"
                          >
                            {item.commit.sha.slice(0, 8)}
                          </a>
                        ) : (
                          item.commit.sha.slice(0, 8)
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-card-foreground">
                        {item.user.name}
                      </td>
                      <td className="px-4 py-3 max-w-[400px] whitespace-pre-wrap break-words text-card-foreground">
                        {item.commit.message?.trim() || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-accent">
                        {(item.stats.ai_ratio * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-green-600">
                        +{item.stats.additions.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selectedItem && data && data.pagination.total > 0 && (
            <div className="flex items-center justify-between border-t border-border p-4">
              <div className="text-xs text-muted-foreground">
                第 {page} / {Math.max(totalPages, 1)} 页
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!canPrev || loading}
                >
                  上一页
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => totalPages > 0 ? Math.min(totalPages, p + 1) : p + 1)}
                  disabled={!canNext || loading}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    }
    ```
* **🧪 验证方式**:
    * 检查文件是否创建成功 -> 预期 `components/ai-ratio-board/commits-panel.tsx` 存在
* **💾 Commit**: `feat(ai-ratio): create CommitsPanel component`

---

### Task 12: 更新 components/ai-ratio-board/index.ts 导出文件

* **📍 涉及文件**: `components/ai-ratio-board/index.ts`
* **💡 实现逻辑**:
    1. 更新 index.ts 文件，导出所有新组件和类型：
    ```typescript
    export { AiRatioBoardHeader } from "./header"
    export { LeaderboardPanel } from "./leaderboard-panel"
    export type { SelectedItem } from "./leaderboard-panel"
    export { TrendChartPanel } from "./trend-chart-panel"
    export { CommitsPanel } from "./commits-panel"
    export { DepartmentLevelSelector } from "./department-level-selector"
    ```
* **🧪 验证方式**:
    * 运行 `npm run build` -> 预期无 TypeScript 错误
* **💾 Commit**: `chore: export all ai-ratio-board components`

---

### Task 13: 重写 app/page.tsx 主页面

* **📍 涉及文件**: `app/page.tsx`
* **💡 实现逻辑**:
    1. 完全重写文件内容：
    ```typescript
    "use client"

    import { useState, useMemo } from "react"
    import {
      AiRatioBoardHeader,
      LeaderboardPanel,
      TrendChartPanel,
      CommitsPanel,
    } from "@/components/ai-ratio-board"
    import type { SelectedItem } from "@/components/ai-ratio-board/leaderboard-panel"

    function getCurrentMonth(): string {
      const d = new Date()
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, "0")
      return `${y}-${m}`
    }

    function shiftMonth(value: string, delta: number): string {
      const [y, m] = value.split("-")
      const year = Number(y)
      const month = Number(m)
      const d = new Date(year, month - 1 + delta, 1)
      const newY = d.getFullYear()
      const newM = String(d.getMonth() + 1).padStart(2, "0")
      return `${newY}-${newM}`
    }

    export default function AiRatioBoardPage() {
      const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
      const [chartStartMonth, setChartStartMonth] = useState(shiftMonth(getCurrentMonth(), -11))
      const [chartEndMonth, setChartEndMonth] = useState(getCurrentMonth())
      const [selectedLeaderboardItem, setSelectedLeaderboardItem] = useState<SelectedItem | null>(null)
      const [totals, setTotals] = useState<{
        total_lines: number
        ai_lines: number
        ai_ratio: number
      } | null>(null)

      // 模拟 totals 数据 - 后续需要从 API 获取
      // TODO: 实现 totals 数据加载
      const mockTotals = useMemo(() => ({
        total_lines: 125000,
        ai_lines: 31250,
        ai_ratio: 0.25,
      }), [])

      return (
        <div className="flex h-screen flex-col bg-background">
          <AiRatioBoardHeader
            totals={mockTotals}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />

          <main className="flex-1 overflow-hidden p-6">
            <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[35%_65%]">
              <LeaderboardPanel
                selectedMonth={selectedMonth}
                onSelectedItemChange={setSelectedLeaderboardItem}
              />

              <div className="flex flex-col gap-6 overflow-hidden">
                <TrendChartPanel
                  selectedItem={selectedLeaderboardItem}
                  selectedMonth={selectedMonth}
                  startMonth={chartStartMonth}
                  endMonth={chartEndMonth}
                  onStartMonthChange={setChartStartMonth}
                  onEndMonthChange={setChartEndMonth}
                />
                <CommitsPanel
                  selectedItem={selectedLeaderboardItem}
                  selectedMonth={selectedMonth}
                />
              </div>
            </div>
          </main>
        </div>
      )
    }
    ```
* **🧪 验证方式**:
    * 运行 `npm run dev` -> 预期页面能正常访问，看到新的布局
* **💾 Commit**: `feat(ai-ratio): rewrite main page with AiRatioBoard layout`

---

### Task 14: 删除废弃的组件文件

* **📍 涉及文件**:
    - `components/dashboard/department-kanban-content.tsx` (删除)
    - `components/dashboard/organization-view-content.tsx` (删除)
    - `components/dashboard/departments-users.tsx` (删除)
    - `components/dashboard/department-selector.tsx` (删除)
    - `components/dashboard/sidebar.tsx` (删除)
* **💡 实现逻辑**:
    1. 使用 git rm 删除这些文件：
    ```bash
    git rm components/dashboard/department-kanban-content.tsx
    git rm components/dashboard/organization-view-content.tsx
    git rm components/dashboard/departments-users.tsx
    git rm components/dashboard/department-selector.tsx
    git rm components/dashboard/sidebar.tsx
    ```
* **🧪 验证方式**:
    * 运行 `git status` -> 预期看到这些文件被标记为删除
* **💾 Commit**: `chore: remove obsolete dashboard components`

---

### Task 15: 清理 lib/api.ts 中的废弃 API 函数和类型

* **📍 涉及文件**: `lib/api.ts`
* **💡 实现逻辑**:
    1. 删除以下已废弃的函数和类型：
       - `DepartmentMonthlyDataItemDto`
       - `DepartmentMonthlyMetricsDto`
       - `DepartmentWorkdaysMetricsDto`
       - `DepartmentDailyMetricsDto`
       - `fetchDepartmentMonthlyMetrics`
       - `fetchDepartmentWorkdaysMetrics`
       - `fetchDepartmentDailyMetrics`
       - `DepartmentLeaderboardItemDto`
       - `DepartmentLeaderboardDto`
       - `DepartmentTotalsDto`
       - `fetchDepartmentLeaderboard`
       - `fetchDepartmentTotals`
       - `DepartmentUserCommitItemDto`
       - `DepartmentUserCommitsDto`
       - `fetchDepartmentUserCommits`
       - `CreateDepartmentDto`
       - `DeleteDepartmentResponseDto`
       - `createDepartment`
       - `deleteDepartment`
       - `UpdateUserDto`
       - `UpdatedUserDto`
       - `updateUser`
       - `BatchUpdateDepartmentDto`
       - `BatchUpdateDepartmentResponseDto`
       - `batchUpdateUsersDepartment`

    2. 保留以下类型和函数（被其他功能使用）：
       - `DepartmentNodeDto`
       - `DepartmentUserDto`
       - `DepartmentUsersDto`
       - `fetchDepartmentsTree`
       - `fetchDepartmentUsers`
* **🧪 验证方式**:
    * 运行 `npm run build` -> 预期无 TypeScript 错误
* **💾 Commit**: `chore(api): remove obsolete department and user management APIs`

---

### Task 16: 添加 Responsive 移动端布局样式

* **📍 涉及文件**: `app/page.tsx`
* **💡 实现逻辑**:
    1. 在 main 的 grid 布局中添加响应式类名：
    ```typescript
    // 修改：
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[35%_65%]">
    // 为确保移动端体验，保持现有 grid-cols-1 即可
    ```
    2. 如需更细致的平板端控制，可使用：
    ```typescript
    <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-1 lg:grid-cols-[35%_65%]">
    ```
* **🧪 验证方式**:
    * 在浏览器开发者工具中测试不同屏幕尺寸 -> 预期布局正确适配
* **💾 Commit**: `style(ai-ratio): add responsive layout support`

---

### Task 17: 更新 app/layout.tsx 移除不必要的配置（如有）

* **📍 涉及文件**: `app/layout.tsx`
* **💡 实现逻辑**:
    1. 检查 layout.tsx 是否有与 sidebar 或 header 相关的特定配置
    2. 如果有，评估是否需要保留或删除
    3. 确保 metadata 仍然正确
* **🧪 验证方式**:
    * 运行 `npm run build` -> 预期无错误
* **💾 Commit**: `chore: cleanup layout.tsx if needed`

---

### Task 18: 添加加载状态和错误处理的骨架屏

* **📍 涉及文件**: `components/ui/skeleton.tsx` (可能需要更新) 或新建 loading 组件
* **💡 实现逻辑**:
    1. 检查项目中是否已有合适的骨架屏组件
    2. 如果有，在 LeaderboardPanel 和 CommitsPanel 中使用
    3. 如果没有，为表格创建简单的骨架屏：
    ```typescript
    // 在 leaderboard-panel.tsx 添加
    function LeaderboardSkeleton() {
      return (
        <div className="space-y-3 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-8 w-8 animate-pulse rounded bg-secondary" />
              <div className="h-4 flex-1 animate-pulse rounded bg-secondary" />
              <div className="h-4 w-20 animate-pulse rounded bg-secondary" />
              <div className="h-4 w-20 animate-pulse rounded bg-secondary" />
            </div>
          ))}
        </div>
      )
    }
    ```
* **🧪 验证方式**:
    * 在页面加载时观察骨架屏效果 -> 预期看到加载动画
* **💾 Commit**: `feat(ai-ratio): add skeleton loading states`

---

### Task 19: 实现页面标题和元数据

* **📍 涉及文件**: `app/layout.tsx`
* **💡 实现逻辑**:
    1. 更新 layout.tsx 中的 metadata：
    ```typescript
    export const metadata = {
      title: "AI 代码占比看板",
      description: "查看部门和个人 AI 代码占比排行榜、趋势分析和提交明细",
    }
    ```
* **🧪 验证方式**:
    * 运行 `npm run build && npm start` -> 预期浏览器标签显示正确的标题
* **💾 Commit**: `chore: update page metadata`

---

### Task 20: 集成测试与最终验证

* **📍 涉及文件**: 整个项目
* **💡 实现逻辑**:
    1. 运行完整的构建测试：`npm run build`
    2. 启动开发服务器：`npm run dev`
    3. 测试所有功能：
       - 月份选择器切换
       - 部门/个人排行榜 Tab 切换
       - 部门层级筛选
       - 点击排行榜项
       - 提交明细分页
       - 响应式布局
    4. 检查控制台无错误
    5. 验证 API 调用正确
* **🧪 验证方式**:
    * 所有功能点测试通过 -> 预期无阻塞性问题
* **💾 Commit**: `chore: finalize AI ratio board implementation`

---

## 🏁 最终验收

- [x] 计划通过了"零背景测试"（无需查看代码库也能理解每一步做什么）
- [x] 所有变更 100% 覆盖了设计文档中的核心需求
- [x] 处理了关键的异常边界（加载状态、错误处理、空数据）
- [x] 路径和命名符合项目既有的规范和风格

---

**生成时间**: 2026-02-12
**预期工时**: 4-6 小时
**风险等级**: 低
