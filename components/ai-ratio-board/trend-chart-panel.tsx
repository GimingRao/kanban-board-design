"use client"

import { useMemo, useEffect, useState } from "react"
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
import { fetchRepoTrend, fetchDepartmentTrend, type DataPointMetric } from "@/lib/api"

export interface TrendChartPanelProps {
  selectedItem: SelectedItem | null
  selectedMonth: string
  startMonth: string
  endMonth: string
  onStartMonthChange: (month: string) => void
  onEndMonthChange: (month: string) => void
  onMonthSelect?: (month: string) => void
}

function parseMonth(value: string): { year: number; month: number } | null {
  const [y, m] = value.split("-")
  const year = Number(y)
  const month = Number(m)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, month }
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
  const [dataPoints, setDataPoints] = useState<DataPointMetric[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取趋势数据
  useEffect(() => {
    const start = parseMonth(startMonth)
    const end = parseMonth(endMonth)
    if (!start || !end) return

    let cancelled = false
    setLoading(true)
    setError(null)

    const fetchTrend = selectedItem?.type === "department"
      ? () => fetchDepartmentTrend({
          department_id: selectedItem.id,
          start_year: start.year,
          start_month: start.month,
          end_year: end.year,
          end_month: end.month,
        })
      : () => fetchRepoTrend({
          start_year: start.year,
          start_month: start.month,
          end_year: end.year,
          end_month: end.month,
        })

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

  // 转换为图表数据格式
  const chartData = useMemo(() => {
    return dataPoints.map((dp) => ({
      month: `${dp.year}-${String(dp.month).padStart(2, "0")}`,
      ai_ratio: dp.ai_ratio,
      total_lines: dp.total_lines,
      ai_lines: dp.ai_lines,
    }))
  }, [dataPoints])

  const avgRatio = useMemo(() => {
    if (dataPoints.length === 0) return 0
    const totalLines = dataPoints.reduce((sum, dp) => sum + dp.total_lines, 0)
    const aiLines = dataPoints.reduce((sum, dp) => sum + dp.ai_lines, 0)
    return totalLines > 0 ? (aiLines / totalLines) * 100 : 0
  }, [dataPoints])

  return (
    <div className="flex min-h-[400px] flex-col rounded-lg border border-border bg-card p-6">
      <div className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              AI 代码占比趋势（按月）
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedItem ? `${selectedItem.name} 的月度趋势` : "所有仓库的月度趋势"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-[300px] flex-1">
        {loading ? (
          <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
            加载中...
          </div>
        ) : error ? (
          <div className="flex w-full items-center justify-center text-sm text-destructive">
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
            暂无趋势数据
          </div>
        ) : (
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
        )}
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
