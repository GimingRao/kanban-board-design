"use client"

import { useMemo, useState } from "react"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { RepoTrendResponse } from "@/lib/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MonthlyStatsChartProps {
  data: RepoTrendResponse | null
  loading?: boolean
  startMonth: string
  endMonth: string
  onStartMonthChange: (value: string) => void
  onEndMonthChange: (value: string) => void
  onMonthSelect?: (value: string) => void
}

// 生成最近月份选项，供趋势筛选使用。
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

// 趋势图组件，改为消费仓库趋势接口返回的数据点。
export function MonthlyStatsChart({
  data,
  loading,
  startMonth,
  endMonth,
  onStartMonthChange,
  onEndMonthChange,
  onMonthSelect,
}: MonthlyStatsChartProps) {
  const [mode, setMode] = useState<"both" | "total" | "ai">("both")

  const chartData = useMemo(
    () =>
      data?.data_points.map((item) => ({
        month: `${item.year}-${String(item.month).padStart(2, "0")}`,
        totalLinesPerPersonPerWorkday:
          item.active_users > 0 && item.workdays > 0
            ? item.total_lines / (item.active_users * item.workdays)
            : 0,
        aiLinesPerPersonPerWorkday:
          item.active_users > 0 && item.workdays > 0
            ? item.ai_lines / (item.active_users * item.workdays)
            : 0,
      })) ?? [],
    [data],
  )

  const monthOptions = useMemo(() => getRecentMonths(36), [])

  const avgTotalLinesPerPersonPerWorkday =
    chartData.length > 0
      ? chartData.reduce((sum, item) => sum + item.totalLinesPerPersonPerWorkday, 0) /
        chartData.length
      : 0

  const avgAiLinesPerPersonPerWorkday =
    chartData.length > 0
      ? chartData.reduce((sum, item) => sum + item.aiLinesPerPersonPerWorkday, 0) /
        chartData.length
      : 0

  // 点击柱状图后，把对应月份回传给父组件作为榜单筛选。
  const handleBarClick = (entry: unknown) => {
    if (!onMonthSelect) return
    const month = (entry as { payload?: { month?: string } })?.payload?.month
    if (month) onMonthSelect(month)
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-6">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">人均工作日代码行趋势</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              按月统计总代码行与 AI 代码行的人均工作日表现
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">开始</span>
              <Select value={startMonth} onValueChange={onStartMonthChange}>
                <SelectTrigger className="h-8 w-[150px] bg-secondary/40">
                  <SelectValue placeholder="开始月份" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={`start-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">结束</span>
              <Select value={endMonth} onValueChange={onEndMonthChange}>
                <SelectTrigger className="h-8 w-[150px] bg-secondary/40">
                  <SelectValue placeholder="结束月份" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={`end-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="inline-flex rounded-md border border-border bg-secondary p-1 text-xs">
              {[
                { key: "both", label: "全部" },
                { key: "total", label: "总代码行" },
                { key: "ai", label: "AI 代码行" },
              ].map((item) => {
                const active = mode === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMode(item.key as typeof mode)}
                    className={
                      active
                        ? "rounded px-2 py-1 font-medium text-foreground"
                        : "rounded px-2 py-1 text-muted-foreground hover:text-foreground"
                    }
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-[300px] flex-1">
        {loading ? (
          <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
            正在加载图表...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
            暂无数据
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" vertical={false} />
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
              />
              <Tooltip
                formatter={(value: number, name: string) => [Number(value).toFixed(2), name]}
                contentStyle={{
                  backgroundColor: "oklch(1 0 0)",
                  border: "1px solid oklch(0.9 0 0)",
                  borderRadius: "8px",
                  color: "oklch(0.15 0 0)",
                }}
                labelStyle={{ color: "oklch(0.45 0 0)" }}
              />
              <Legend wrapperStyle={{ paddingTop: "12px" }} />
              {(mode === "both" || mode === "total") && (
                <Bar
                  dataKey="totalLinesPerPersonPerWorkday"
                  name="人均工作日总代码行"
                  fill="oklch(0.6 0.18 160)"
                  radius={[4, 4, 0, 0]}
                  onClick={handleBarClick}
                />
              )}
              {(mode === "both" || mode === "ai") && (
                <Bar
                  dataKey="aiLinesPerPersonPerWorkday"
                  name="人均工作日 AI 代码行"
                  fill="oklch(0.62 0.2 30)"
                  radius={[4, 4, 0, 0]}
                  onClick={handleBarClick}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div className="w-full rounded-md border border-border/60 bg-secondary/30 p-3 text-center">
          <p className="text-2xl font-bold text-accent">
            {avgTotalLinesPerPersonPerWorkday.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground">月均人均工作日总代码行</p>
        </div>
        <div className="w-full rounded-md border border-border/60 bg-secondary/30 p-3 text-center">
          <p className="text-2xl font-bold text-chart-1">
            {avgAiLinesPerPersonPerWorkday.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground">月均人均工作日 AI 代码行</p>
        </div>
      </div>
    </div>
  )
}
