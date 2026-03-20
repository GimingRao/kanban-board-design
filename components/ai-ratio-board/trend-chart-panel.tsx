"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  fetchDepartmentTrend,
  fetchRepoTrend,
  fetchUserTrend,
  type DataPointMetric,
} from "@/lib/api"

import type { SelectedItem } from "./leaderboard-panel"

export interface TrendChartPanelProps {
  selectedItem: SelectedItem | null
  selectedMonth: string
  startMonth: string
  endMonth: string
  onStartMonthChange: (month: string) => void
  onEndMonthChange: (month: string) => void
}

/** 解析月份字符串，统一复用给趋势查询参数。 */
function parseMonth(value: string): { year: number; month: number } | null {
  const [y, m] = value.split("-")
  const year = Number(y)
  const month = Number(m)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}

/** 将日维度日期缩短为月-日，减少横轴拥挤。 */
function formatAxisDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/** 提示框里展示完整的中文日期。 */
function formatTooltipDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export function TrendChartPanel({
  selectedItem,
  selectedMonth,
  startMonth,
  endMonth,
  onStartMonthChange,
  onEndMonthChange,
}: TrendChartPanelProps) {
  const [dataPoints, setDataPoints] = useState<DataPointMetric[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** 根据当前选中的对象加载按日趋势数据。 */
  useEffect(() => {
    const start = parseMonth(startMonth)
    const end = parseMonth(endMonth)
    if (!start || !end) return

    let cancelled = false
    setLoading(true)
    setError(null)

    let fetchTrend: () => Promise<{ data_points: DataPointMetric[] }>

    if (selectedItem?.type === "department") {
      fetchTrend = () =>
        fetchDepartmentTrend({
          department_id: selectedItem.id,
          start_year: start.year,
          start_month: start.month,
          end_year: end.year,
          end_month: end.month,
        })
    } else if (selectedItem?.type === "user") {
      fetchTrend = () =>
        fetchUserTrend({
          user_id: selectedItem.id,
          start_year: start.year,
          start_month: start.month,
          end_year: end.year,
          end_month: end.month,
        })
    } else {
      fetchTrend = () =>
        fetchRepoTrend({
          start_year: start.year,
          start_month: start.month,
          end_year: end.year,
          end_month: end.month,
        })
    }

    fetchTrend()
      .then((result) => {
        if (cancelled) return
        setDataPoints(result.data_points)
      })
      .catch((err) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "加载趋势数据失败"
        setError(message)
        setDataPoints([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedItem, startMonth, endMonth])

  /** 将后端趋势点转换为图表直接消费的数据结构。 */
  const chartData = useMemo(() => {
    return dataPoints.map((dp) => ({
      date: dp.date,
      dateLabel: formatAxisDate(dp.date),
      ai_ratio: dp.ai_ratio,
      total_lines: dp.total_lines,
      ai_lines: dp.ai_lines,
      commits_count: dp.commits_count,
    }))
  }, [dataPoints])

  /** 使用整个区间的累计值计算更稳定的平均 AI 占比。 */
  const avgRatio = useMemo(() => {
    if (dataPoints.length === 0) return 0
    const totalLines = dataPoints.reduce((sum, dp) => sum + dp.total_lines, 0)
    const aiLines = dataPoints.reduce((sum, dp) => sum + dp.ai_lines, 0)
    return totalLines > 0 ? (aiLines / totalLines) * 100 : 0
  }, [dataPoints])

  const trendTitle = selectedItem ? `${selectedItem.name} 的日度趋势` : "当前展示全局日度趋势"

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div className="rounded-[1.35rem] border border-border/70 bg-card/90 p-4">
        <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">AI 占比趋势</h3>
            <p className="mt-1 text-sm text-muted-foreground">{trendTitle}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-secondary/35 px-3 py-2 text-sm text-muted-foreground">
            当前对齐月份：{selectedMonth}
          </div>
        </div>

        <div className="mt-4 h-[260px]">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-secondary/20 text-sm text-muted-foreground">
              正在加载趋势...
            </div>
          ) : error ? (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-destructive/5 text-sm text-destructive">
              {error}
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-secondary/20 text-sm text-muted-foreground">
              当前区间暂无趋势数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="color-mix(in oklch, var(--border) 88%, white)"
                  vertical={false}
                />
                <XAxis
                  dataKey="dateLabel"
                  minTickGap={18}
                  tick={{ fill: "oklch(0.52 0.02 248)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "oklch(0.52 0.02 248)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: number, _name, item) => [
                    `${value.toFixed(1)}%`,
                    `${item.payload.ai_lines.toLocaleString()} / ${item.payload.total_lines.toLocaleString()} 行`,
                  ]}
                  labelFormatter={(_label, payload) => {
                    const point = payload?.[0]?.payload as { date?: string } | undefined
                    return `日期：${point?.date ? formatTooltipDate(point.date) : _label}`
                  }}
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.96)",
                    border: "1px solid rgba(201,208,220,0.7)",
                    borderRadius: "18px",
                    color: "oklch(0.24 0.02 248)",
                    boxShadow: "0 20px 40px -28px rgba(15,23,42,0.42)",
                  }}
                  labelStyle={{ color: "oklch(0.52 0.02 248)" }}
                />
                <Line
                  type="monotone"
                  dataKey="ai_ratio"
                  stroke="oklch(0.65 0.16 196)"
                  strokeWidth={3}
                  dot={{ fill: "oklch(0.65 0.16 196)", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        <div className="rounded-[1.35rem] border border-border/70 bg-card/90 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">开始月份</div>
          <input
            type="month"
            value={startMonth}
            onChange={(e) => onStartMonthChange(e.target.value)}
            className="mt-3 h-11 w-full rounded-2xl border border-border/70 bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>

        <div className="rounded-[1.35rem] border border-border/70 bg-card/90 p-4">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">结束月份</div>
          <input
            type="month"
            value={endMonth}
            onChange={(e) => onEndMonthChange(e.target.value)}
            className="mt-3 h-11 w-full rounded-2xl border border-border/70 bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>

        <div className="rounded-[1.35rem] border border-border/70 bg-secondary/35 p-5">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">区间平均 AI 占比</div>
          <div className="mt-3 text-4xl font-semibold tracking-tight text-accent">{avgRatio.toFixed(1)}%</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            现在趋势按天展示，更适合观察短期波动和异常峰值。
          </p>
        </div>
      </div>
    </div>
  )
}
