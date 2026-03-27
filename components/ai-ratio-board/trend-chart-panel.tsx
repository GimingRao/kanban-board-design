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

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  fetchDepartmentTrend,
  fetchRepoTrend,
  fetchUserTrend,
  type DataPointMetric,
} from "@/lib/api"

import type { SelectedItem } from "./leaderboard-panel"

export interface TrendChartPanelProps {
  selectedItem: SelectedItem | null
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
}

/** 解析日期字符串，确保趋势筛选区间始终是合法日期。 */
function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 压缩横轴日期文案，避免趋势点过多时标签拥挤。 */
function formatAxisDate(value: string) {
  const date = parseDate(value)
  if (!date) return value
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/** 提示框中展示完整日期，便于按天查看趋势。 */
function formatTooltipDate(value: string) {
  const date = parseDate(value)
  if (!date) return value
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

/** 卡片头部显示更易读的日期范围摘要。 */
function formatRangeDate(value: string) {
  const date = parseDate(value)
  if (!date) return value
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

/** 获取今天日期，用于生成快捷区间。 */
function getTodayString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** 按天偏移日期，用于生成近一周和近一个月。 */
function shiftDate(value: string, deltaDays: number): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  date.setDate(date.getDate() + deltaDays)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function TrendChartPanel({
  selectedItem,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: TrendChartPanelProps) {
  const [dataPoints, setDataPoints] = useState<DataPointMetric[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const today = getTodayString()

  /** 根据真实日期范围加载趋势数据。 */
  useEffect(() => {
    const start = parseDate(startDate)
    const end = parseDate(endDate)
    if (!start || !end) return

    let cancelled = false
    setLoading(true)
    setError(null)

    let fetchTrend: () => Promise<{ data_points: DataPointMetric[] }>

    if (selectedItem?.type === "department") {
      fetchTrend = () =>
        fetchDepartmentTrend({
          department_id: selectedItem.id,
          start_date: startDate,
          end_date: endDate,
        })
    } else if (selectedItem?.type === "user") {
      fetchTrend = () =>
        fetchUserTrend({
          user_id: selectedItem.id,
          start_date: startDate,
          end_date: endDate,
        })
    } else {
      fetchTrend = () =>
        fetchRepoTrend({
          start_date: startDate,
          end_date: endDate,
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
  }, [selectedItem, startDate, endDate])

  /** 将趋势点转换成图表渲染结构。 */
  const chartData = useMemo(() => {
    return dataPoints.map((point) => ({
      date: point.date,
      dateLabel: formatAxisDate(point.date),
      ai_ratio: point.ai_ratio,
      total_lines: point.total_lines,
      ai_lines: point.ai_lines,
      commits_count: point.commits_count,
    }))
  }, [dataPoints])

  /** 使用累计值计算区间平均 AI 占比，避免简单均值失真。 */
  const avgRatio = useMemo(() => {
    if (dataPoints.length === 0) return 0
    const totalLines = dataPoints.reduce((sum, point) => sum + point.total_lines, 0)
    const aiLines = dataPoints.reduce((sum, point) => sum + point.ai_lines, 0)
    return totalLines > 0 ? (aiLines / totalLines) * 100 : 0
  }, [dataPoints])

  /** 趋势分析支持与左侧榜单一致的快捷区间切换。 */
  const applyPresetRange = (mode: "week" | "month") => {
    const end = today
    const start = mode === "week" ? shiftDate(end, -6) : shiftDate(end, -29)
    onStartDateChange(start)
    onEndDateChange(end)
  }

  const trendTitle = selectedItem ? `${selectedItem.name} 的日度趋势` : "当前展示全局日度趋势"

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="rounded-[1.2rem] border border-border/70 bg-secondary/20 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-foreground">统计区间</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyPresetRange("week")}
              className="h-8 rounded-full bg-card/90 px-3 hover:bg-card"
            >
              近一周
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyPresetRange("month")}
              className="h-8 rounded-full bg-card/90 px-3 hover:bg-card"
            >
              近一个月
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Input
              type="date"
              value={startDate}
              max={endDate > today ? today : endDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className="h-9 w-[148px] rounded-xl border-border/70 bg-card/90 px-3 shadow-none"
            />
            <span>至</span>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              onChange={(event) => onEndDateChange(event.target.value)}
              className="h-9 w-[148px] rounded-xl border-border/70 bg-card/90 px-3 shadow-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[1.35rem] border border-border/70 bg-card/90 p-4 lg:flex-1">
        <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">AI 占比趋势</h3>
            <p className="mt-1 text-sm text-muted-foreground">{trendTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/35 px-3 py-2 text-sm text-muted-foreground">
              统计区间：{formatRangeDate(startDate)} 至 {formatRangeDate(endDate)}
            </div>
            <div className="rounded-2xl border border-border/70 bg-accent/5 px-4 py-2">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                区间平均 AI 占比
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-accent">
                {avgRatio.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 h-[340px] lg:h-[420px]">
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
    </section>
  )
}
