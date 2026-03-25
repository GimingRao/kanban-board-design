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

/** 获取当前月份，作为顶部月份筛选器的默认值。 */
function getCurrentMonth(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

/** 获取今天日期，作为趋势分析结束日期的上限。 */
function getTodayString(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** 将日期偏移指定天数，用于初始化最近一个月的趋势区间。 */
function shiftDate(value: string, deltaDays: number): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  date.setDate(date.getDate() + deltaDays)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** 比较两个日期字符串，便于维护合法的起止日期。 */
function compareDate(left: string, right: string) {
  return left.localeCompare(right)
}

/** 将用户输入裁剪到今天之前，避免结束日期选择未来时间。 */
function clampToToday(value: string) {
  const today = getTodayString()
  return compareDate(value, today) > 0 ? today : value
}

/** 解析年月字符串，供顶部月份统计接口复用。 */
function parseMonth(value: string): { year: number; month: number } | null {
  const [yearText, monthText] = value.split("-")
  const year = Number(yearText)
  const month = Number(monthText)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}

/** 生成指定月份的自然月起止日期，用于月度汇总查询。 */
function getMonthDateRange(value: string) {
  const parsed = parseMonth(value)
  if (!parsed) return null
  const start = `${parsed.year}-${String(parsed.month).padStart(2, "0")}-01`
  const end = new Date(parsed.year, parsed.month, 0)
  const naturalEnd = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`
  const endDate = clampToToday(naturalEnd)
  return { start, end: endDate }
}

export function AiRatioBoardContent() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [chartEndDate, setChartEndDate] = useState(getTodayString())
  const [chartStartDate, setChartStartDate] = useState(shiftDate(getTodayString(), -29))
  const [selectedLeaderboardItem, setSelectedLeaderboardItem] = useState<SelectedItem | null>(null)
  const [totals, setTotals] = useState<SummaryMetrics | null>(null)
  const [totalsLoading, setTotalsLoading] = useState(false)
  const [detailTab, setDetailTab] = useState<"commits" | "trend">("commits")

  /** 根据当前月份同步顶部概览指标。 */
  useEffect(() => {
    const monthRange = getMonthDateRange(selectedMonth)
    if (!monthRange) return

    let cancelled = false
    setTotalsLoading(true)

    fetchRepoTrend({
      start_date: monthRange.start,
      end_date: monthRange.end,
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

  /** 调整开始日期时，自动修正结束日期并保持不超过今天。 */
  function handleChartStartDateChange(value: string) {
    const safeStart = clampToToday(value)
    setChartStartDate(safeStart)
    setChartEndDate((current) => {
      const safeCurrent = clampToToday(current)
      return compareDate(safeCurrent, safeStart) < 0 ? safeStart : safeCurrent
    })
  }

  /** 调整结束日期时，自动修正开始日期并限制结束日期最大为今天。 */
  function handleChartEndDateChange(value: string) {
    const safeEnd = clampToToday(value)
    setChartEndDate(safeEnd)
    setChartStartDate((current) => (compareDate(current, safeEnd) > 0 ? safeEnd : current))
  }

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
                startDate={chartStartDate}
                endDate={chartEndDate}
                onStartDateChange={handleChartStartDateChange}
                onEndDateChange={handleChartEndDateChange}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
