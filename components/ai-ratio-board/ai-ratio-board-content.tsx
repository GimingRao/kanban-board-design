"use client"

import { useEffect, useState } from "react"
import { GitCommitHorizontal, LineChart } from "lucide-react"

import {
  AiRatioBoardHeader,
  CommitsPanel,
  LeaderboardPanel,
  TrendChartPanel,
} from "@/components/ai-ratio-board"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchRepoTrend, type SummaryMetrics } from "@/lib/api"

import type { SelectedItem } from "@/components/ai-ratio-board/leaderboard-panel"

// 获取当前月份，作为页面筛选的默认值。
function getCurrentMonth(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

// 按月份偏移，生成趋势图的起止月份。
function shiftMonth(value: string, delta: number): string {
  const [y, m] = value.split("-")
  const year = Number(y)
  const month = Number(m)
  const d = new Date(year, month - 1 + delta, 1)
  const newY = d.getFullYear()
  const newM = String(d.getMonth() + 1).padStart(2, "0")
  return `${newY}-${newM}`
}

// 解析年月字符串，供接口参数复用。
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
  const [detailTab, setDetailTab] = useState<"commits" | "trend">("commits")

  // 根据当前月份同步顶部概览指标。
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
    <div className="flex h-full flex-col overflow-hidden pb-4">
      <AiRatioBoardHeader
        totals={
          totals
            ? {
                total_lines: totals.total_lines,
                ai_lines: totals.ai_lines,
                ai_ratio: totals.ai_ratio / 100,
              }
            : null
        }
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        loading={totalsLoading}
      />

      <main className="flex-1 overflow-hidden px-4 pb-2 sm:px-6">
        <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(340px,0.88fr)_minmax(0,1.42fr)]">
          <div className="flex min-h-0 flex-col">
            <LeaderboardPanel
              selectedMonth={selectedMonth}
              onSelectedItemChange={setSelectedLeaderboardItem}
            />
          </div>

          <Tabs
            value={detailTab}
            onValueChange={(value) => setDetailTab(value as "commits" | "trend")}
            className="dashboard-panel flex h-full min-h-0 flex-col overflow-hidden p-3"
          >
            <div className="flex items-center justify-between gap-3 px-1 pb-1">
              <div className="text-lg font-semibold text-foreground">详情工作区</div>
              <TabsList className="h-11 rounded-full bg-secondary/80 p-1">
                <TabsTrigger value="commits" className="rounded-full px-4">
                  <GitCommitHorizontal className="h-4 w-4" />
                  变更明细
                </TabsTrigger>
                <TabsTrigger value="trend" className="rounded-full px-4">
                  <LineChart className="h-4 w-4" />
                  趋势分析
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="commits" className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CommitsPanel
                selectedItem={selectedLeaderboardItem}
                selectedMonth={selectedMonth}
              />
            </TabsContent>

            <TabsContent value="trend" className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <TrendChartPanel
                selectedItem={selectedLeaderboardItem}
                selectedMonth={selectedMonth}
                startMonth={chartStartMonth}
                endMonth={chartEndMonth}
                onStartMonthChange={setChartStartMonth}
                onEndMonthChange={setChartEndMonth}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
