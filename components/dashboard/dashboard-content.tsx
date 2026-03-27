"use client"

import { useEffect, useMemo, useState } from "react"

import {
  fetchAIRatioUserLeaderboard,
  fetchRepoTrend,
  fetchRepos,
  type AIRatioLeaderboardDto,
  type RepoDto,
  type RepoTrendResponse,
  type SummaryMetrics,
} from "@/lib/api"

import { Leaderboard } from "./leaderboard"
import { MonthlyStatsChart } from "./monthly-stats-chart"
import { RepoSelector, type RepoOption } from "./repo-selector"

export interface DashboardContentProps {
  viewType?: string
  onViewTypeChange?: (viewType: string) => void
}

/** 获取当前月份，作为趋势图默认的月度区间。 */
function getCurrentMonth(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

/** 解析 YYYY-MM 字符串，供趋势图月份范围计算复用。 */
function parseMonth(value: string): { year: number; month: number } | null {
  const [yearText, monthText] = value.split("-")
  const year = Number(yearText)
  const month = Number(monthText)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}

/** 将年月映射成线性索引，便于比较月份先后。 */
function monthIndex({ year, month }: { year: number; month: number }) {
  return year * 12 + (month - 1)
}

/** 基于指定月份做月级偏移。 */
function shiftMonth(value: string, delta: number): string {
  const parsed = parseMonth(value)
  if (!parsed) return value
  const date = new Date(parsed.year, parsed.month - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

/** 获取今天日期，限制查询区间不要落到未来。 */
function getTodayString(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}

/** 将日期偏移指定天数，用于默认展示最近一个月排行。 */
function shiftDate(value: string, deltaDays: number): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  date.setDate(date.getDate() + deltaDays)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/** 比较日期字符串，确保开始结束区间关系合法。 */
function compareDate(left: string, right: string) {
  return left.localeCompare(right)
}

/** 将月字符串转换为自然月日期范围。 */
function getMonthDateRange(value: string) {
  const parsed = parseMonth(value)
  if (!parsed) return null
  const start = `${parsed.year}-${String(parsed.month).padStart(2, "0")}-01`
  const end = new Date(parsed.year, parsed.month, 0)
  const naturalEnd = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`
  const today = getTodayString()
  return {
    start,
    end: compareDate(naturalEnd, today) > 0 ? today : naturalEnd,
  }
}

/** 统一裁剪到今天，避免日期输入超出后端允许范围。 */
function clampToToday(value: string) {
  const today = getTodayString()
  return compareDate(value, today) > 0 ? today : value
}

/** 仪表盘首页同时支持趋势按月、排行按日期区间。 */
export function DashboardContent({}: DashboardContentProps = {}) {
  const today = getTodayString()

  const [repos, setRepos] = useState<RepoDto[]>([])
  const [selectedRepo, setSelectedRepo] = useState("")
  const [selectedStartDate, setSelectedStartDate] = useState(shiftDate(today, -29))
  const [selectedEndDate, setSelectedEndDate] = useState(today)
  const [chartEndMonth, setChartEndMonth] = useState(getCurrentMonth())
  const [chartStartMonth, setChartStartMonth] = useState(shiftMonth(getCurrentMonth(), -11))

  const [monthly, setMonthly] = useState<RepoTrendResponse | null>(null)
  const [leaderboard, setLeaderboard] = useState<AIRatioLeaderboardDto | null>(null)
  const [totals, setTotals] = useState<SummaryMetrics | null>(null)

  const [loadingRepos, setLoadingRepos] = useState(true)
  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingRepos(true)
    setError(null)

    fetchRepos()
      .then((data) => {
        if (cancelled) return
        setRepos(data)
        setSelectedRepo("-1")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "加载仓库失败"
        setError(message)
      })
      .finally(() => {
        if (!cancelled) setLoadingRepos(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedRepo) return
    const repoId = Number(selectedRepo)
    if (!Number.isFinite(repoId) || repoId === 0) return

    const startParsed = parseMonth(chartStartMonth)
    const endParsed = parseMonth(chartEndMonth)
    if (!startParsed || !endParsed) return

    const safeStartIndex = Math.min(monthIndex(startParsed), monthIndex(endParsed))
    const safeEndIndex = Math.max(monthIndex(startParsed), monthIndex(endParsed))
    const safeStartMonth = `${Math.floor(safeStartIndex / 12)}-${String((safeStartIndex % 12) + 1).padStart(2, "0")}`
    const safeEndMonth = `${Math.floor(safeEndIndex / 12)}-${String((safeEndIndex % 12) + 1).padStart(2, "0")}`
    const startRange = getMonthDateRange(safeStartMonth)
    const endRange = getMonthDateRange(safeEndMonth)
    if (!startRange || !endRange) return

    let cancelled = false
    setLoadingMonthly(true)
    setError(null)

    fetchRepoTrend({
      repo_id: repoId,
      start_date: startRange.start,
      end_date: endRange.end,
    })
      .then((monthlyData) => {
        if (cancelled) return
        setMonthly(monthlyData)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "加载趋势数据失败"
        setError(message)
        setMonthly(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingMonthly(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedRepo, chartStartMonth, chartEndMonth])

  /** 起始月份不能晚于结束月份。 */
  const handleChartStartChange = (value: string) => {
    setChartStartMonth(value)
    const startParsed = parseMonth(value)
    const endParsed = parseMonth(chartEndMonth)
    if (!startParsed || !endParsed) return
    if (monthIndex(startParsed) > monthIndex(endParsed)) setChartEndMonth(value)
  }

  /** 结束月份不能早于起始月份。 */
  const handleChartEndChange = (value: string) => {
    setChartEndMonth(value)
    const startParsed = parseMonth(chartStartMonth)
    const endParsed = parseMonth(value)
    if (!startParsed || !endParsed) return
    if (monthIndex(endParsed) < monthIndex(startParsed)) setChartStartMonth(value)
  }

  /** 调整排行开始日期时同步修正结束日期。 */
  const handleStartDateChange = (value: string) => {
    const safeStart = clampToToday(value)
    setSelectedStartDate(safeStart)
    setSelectedEndDate((current) => {
      const safeCurrent = clampToToday(current)
      return compareDate(safeCurrent, safeStart) < 0 ? safeStart : safeCurrent
    })
  }

  /** 调整排行结束日期时同步修正开始日期。 */
  const handleEndDateChange = (value: string) => {
    const safeEnd = clampToToday(value)
    setSelectedEndDate(safeEnd)
    setSelectedStartDate((current) => (compareDate(current, safeEnd) > 0 ? safeEnd : current))
  }

  useEffect(() => {
    if (!selectedRepo) return
    const repoId = Number(selectedRepo)
    if (!Number.isFinite(repoId) || repoId === 0) return

    let cancelled = false
    setLoadingLeaderboard(true)
    setError(null)

    Promise.all([
      fetchAIRatioUserLeaderboard({
        repo_id: repoId,
        sort: "ai_ratio",
        start_date: selectedStartDate,
        end_date: selectedEndDate,
        page: 1,
        page_size: 20,
      }),
      fetchRepoTrend({
        repo_id: repoId,
        start_date: selectedStartDate,
        end_date: selectedEndDate,
      }),
    ])
      .then(([leaderboardData, totalsData]) => {
        if (cancelled) return
        setLeaderboard(leaderboardData)
        setTotals(totalsData.summary)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "加载排行失败"
        setError(message)
        setLeaderboard(null)
        setTotals(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingLeaderboard(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedRepo, selectedStartDate, selectedEndDate])

  const repoOptions: RepoOption[] = useMemo(
    () => [
      { id: "-1", label: "所有仓库" },
      ...repos.map((repo) => ({
        id: String(repo.id),
        label: repo.repo_key || repo.name,
      })),
    ],
    [repos],
  )

  const selectedRepoLabel = useMemo(
    () => repoOptions.find((item) => item.id === selectedRepo)?.label ?? "未选择仓库",
    [repoOptions, selectedRepo],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-border bg-background px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">Git 提交指标</h1>
          <p className="mt-1 max-w-full truncate text-sm text-muted-foreground">
            {selectedRepo === "-1" ? "所有仓库的实时统计" : `${selectedRepoLabel} 的实时统计`}
          </p>
        </div>

        <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {totals && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md border border-border bg-secondary px-3 py-2 text-center">
                <div className="font-mono text-foreground">{totals.total_lines.toLocaleString()}</div>
                <div className="text-muted-foreground">代码行数</div>
              </div>
              <div className="rounded-md border border-border bg-secondary px-3 py-2 text-center">
                <div className="font-mono text-foreground">{totals.total_commits.toLocaleString()}</div>
                <div className="text-muted-foreground">提交次数</div>
              </div>
              <div className="rounded-md border border-border bg-secondary px-3 py-2 text-center">
                <div className="font-mono text-foreground">
                  {Math.round(totals.avg_active_users).toLocaleString()}
                </div>
                <div className="text-muted-foreground">平均活跃用户</div>
              </div>
            </div>
          )}

          <RepoSelector
            selectedRepo={selectedRepo}
            onRepoChange={setSelectedRepo}
            repos={repoOptions}
            loading={loadingRepos}
          />
        </div>
      </div>

      {error && (
        <div className="border-b border-border bg-destructive/10 px-6 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        <div className="grid h-full grid-cols-1 gap-6">
          <MonthlyStatsChart
            data={monthly}
            loading={loadingMonthly}
            startMonth={chartStartMonth}
            endMonth={chartEndMonth}
            onStartMonthChange={handleChartStartChange}
            onEndMonthChange={handleChartEndChange}
          />
          <Leaderboard
            repoId={Number(selectedRepo)}
            data={leaderboard}
            loading={loadingLeaderboard}
            startDate={selectedStartDate}
            endDate={selectedEndDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
          />
        </div>
      </div>
    </div>
  )
}
