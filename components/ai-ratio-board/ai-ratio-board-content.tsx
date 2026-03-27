"use client"

import { useState } from "react"
import { GitCommitHorizontal, LineChart } from "lucide-react"

import { CommitsPanel, LeaderboardPanel, TrendChartPanel } from "@/components/ai-ratio-board"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { SelectedItem } from "@/components/ai-ratio-board/leaderboard-panel"

/** 统一获取今天日期，作为默认区间结束时间和上限。 */
function getTodayString(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** 按天偏移日期，用于初始化最近 30 天默认区间。 */
function shiftDate(value: string, deltaDays: number): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  date.setDate(date.getDate() + deltaDays)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** 比较两个日期字符串，便于维护合法的起止顺序。 */
function compareDate(left: string, right: string) {
  return left.localeCompare(right)
}

/** 将日期裁剪到今天之前，避免请求未来时间。 */
function clampToToday(value: string) {
  const today = getTodayString()
  return compareDate(value, today) > 0 ? today : value
}

export function AiRatioBoardContent() {
  const today = getTodayString()
  const [startDate, setStartDate] = useState(shiftDate(today, -29))
  const [endDate, setEndDate] = useState(today)
  const [chartEndDate, setChartEndDate] = useState(today)
  const [chartStartDate, setChartStartDate] = useState(shiftDate(today, -29))
  const [selectedLeaderboardItem, setSelectedLeaderboardItem] = useState<SelectedItem | null>(null)
  const [detailTab, setDetailTab] = useState<"commits" | "trend">("commits")

  /** 调整排行榜开始日期时同步修正结束日期，确保区间始终有效。 */
  function handleStartDateChange(value: string) {
    const safeStart = clampToToday(value)
    setStartDate(safeStart)
    setEndDate((current) => {
      const safeCurrent = clampToToday(current)
      return compareDate(safeCurrent, safeStart) < 0 ? safeStart : safeCurrent
    })
  }

  /** 调整排行榜结束日期时同步修正开始日期，并限制结束日期不能超过今天。 */
  function handleEndDateChange(value: string) {
    const safeEnd = clampToToday(value)
    setEndDate(safeEnd)
    setStartDate((current) => (compareDate(current, safeEnd) > 0 ? safeEnd : current))
  }

  /** 调整趋势分析开始日期时，自动校正结束日期。 */
  function handleChartStartDateChange(value: string) {
    const safeStart = clampToToday(value)
    setChartStartDate(safeStart)
    setChartEndDate((current) => {
      const safeCurrent = clampToToday(current)
      return compareDate(safeCurrent, safeStart) < 0 ? safeStart : safeCurrent
    })
  }

  /** 调整趋势分析结束日期时，自动校正开始日期。 */
  function handleChartEndDateChange(value: string) {
    const safeEnd = clampToToday(value)
    setChartEndDate(safeEnd)
    setChartStartDate((current) => (compareDate(current, safeEnd) > 0 ? safeEnd : current))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-visible px-4 pb-2 pt-4 sm:px-6 lg:h-full lg:overflow-hidden lg:pb-4">
      <main className="flex-1 overflow-visible lg:min-h-0 lg:overflow-hidden">
        <div className="grid min-h-0 grid-cols-1 gap-4 lg:h-full lg:grid-cols-[minmax(340px,0.88fr)_minmax(0,1.42fr)]">
          <div className="flex min-h-0 flex-col">
            <LeaderboardPanel
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              onSelectedItemChange={setSelectedLeaderboardItem}
            />
          </div>

          <Tabs
            value={detailTab}
            onValueChange={(value) => setDetailTab(value as "commits" | "trend")}
            className="dashboard-panel flex min-h-0 flex-col overflow-visible p-3 lg:h-full lg:min-h-[780px] lg:overflow-hidden"
          >
            <div className="flex flex-col items-start gap-3 px-1 pb-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-lg font-semibold text-foreground">详情工作区</div>
              <TabsList className="grid h-auto w-full grid-cols-2 rounded-full bg-secondary/80 p-1 sm:inline-flex sm:h-11 sm:w-auto">
                <TabsTrigger
                  value="commits"
                  className="rounded-full px-4 text-foreground hover:text-foreground data-[state=active]:text-foreground"
                >
                  <GitCommitHorizontal className="h-4 w-4" />
                  变更明细
                </TabsTrigger>
                <TabsTrigger
                  value="trend"
                  className="rounded-full px-4 text-foreground hover:text-foreground data-[state=active]:text-foreground"
                >
                  <LineChart className="h-4 w-4" />
                  趋势分析
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="commits"
              className="mt-3 flex flex-1 flex-col overflow-visible lg:min-h-0 lg:overflow-hidden"
            >
              <CommitsPanel
                selectedItem={selectedLeaderboardItem}
                startDate={startDate}
                endDate={endDate}
              />
            </TabsContent>

            <TabsContent
              value="trend"
              className="mt-3 flex flex-1 flex-col overflow-visible lg:min-h-0 lg:overflow-hidden"
            >
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
