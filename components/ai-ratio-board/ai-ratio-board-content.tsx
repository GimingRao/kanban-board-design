"use client"

import { useState, useEffect, useMemo } from "react"
import {
  AiRatioBoardHeader,
  LeaderboardPanel,
  TrendChartPanel,
  CommitsPanel,
} from "@/components/ai-ratio-board"
import type { SelectedItem } from "@/components/ai-ratio-board/leaderboard-panel"
import { fetchRepoTrend, type SummaryMetrics } from "@/lib/api"

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

function parseMonth(value: string): { year: number; month: number } | null {
  const [y, m] = value.split("-")
  const year = Number(y)
  const month = Number(m)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}

export function AiRatioBoardContent() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [chartStartMonth, setChartStartMonth] = useState(shiftMonth(getCurrentMonth(), -11))
  const [chartEndMonth, setChartEndMonth] = useState(getCurrentMonth())
  const [selectedLeaderboardItem, setSelectedLeaderboardItem] = useState<SelectedItem | null>(null)
  const [totals, setTotals] = useState<SummaryMetrics | null>(null)
  const [totalsLoading, setTotalsLoading] = useState(false)

  // 获取当月 totals 数据
  useEffect(() => {
    const parsed = parseMonth(selectedMonth)
    if (!parsed) return

    let cancelled = false
    setTotalsLoading(true)

    fetchRepoTrend({
      start_year: parsed.year,
      start_month: parsed.month,
      end_year: parsed.year,
      end_month: parsed.month,
    })
      .then((result) => {
        if (cancelled) return
        setTotals(result.summary)
      })
      .catch((err) => {
        if (cancelled) return
        console.error("Failed to fetch totals:", err)
        setTotals(null)
      })
      .finally(() => {
        if (!cancelled) setTotalsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedMonth])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AiRatioBoardHeader
        totals={totals ? {
          total_lines: totals.total_lines,
          ai_lines: totals.ai_lines,
          ai_ratio: totals.ai_ratio / 100, // 转换为小数
        } : null}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        loading={totalsLoading}
      />

      <main className="flex-1 overflow-hidden p-4 sm:p-6">
        <div className="grid h-full min-h-0 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-1 lg:grid-cols-[35%_65%]">
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <LeaderboardPanel
              selectedMonth={selectedMonth}
              onSelectedItemChange={setSelectedLeaderboardItem}
            />
          </div>

          <div className="flex min-h-0 flex-col gap-6 overflow-y-auto">
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
