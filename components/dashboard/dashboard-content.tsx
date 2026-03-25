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

// 获取当前月份，作为筛选器默认值。
function getCurrentMonth(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

// 解析 YYYY-MM 字符串，供接口参数和区间计算复用。
function parseMonth(value: string): { year: number; month: number } | null {
  const [y, m] = value.split("-")
  const year = Number(y)
  const month = Number(m)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}

// 把年月映射成线性索引，便于比较区间先后。
function monthIndex({ year, month }: { year: number; month: number }): number {
  return year * 12 + (month - 1)
}

// 基于指定月份做月级偏移。
function shiftMonth(value: string, delta: number): string {
  const parsed = parseMonth(value)
  if (!parsed) return value
  const d = new Date(parsed.year, parsed.month - 1 + delta, 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

/** 将月份字符串转换为自然月日期范围，供趋势接口复用。 */
/** 获取今天日期，用于限制当前月汇总查询不要落到未来日期。*/
function getTodayString(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}

/** 比较两个日期字符串，便于将自然月结束日裁剪到今天。*/
function compareDate(left: string, right: string) {
  return left.localeCompare(right)
}

function getMonthDateRange(value: string) {
  const parsed = parseMonth(value)
  if (!parsed) return null
  const start = `${parsed.year}-${String(parsed.month).padStart(2, "0")}-01`
  const end = new Date(parsed.year, parsed.month, 0)
  const naturalEnd = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`
  const endDate = compareDate(naturalEnd, getTodayString()) > 0 ? getTodayString() : naturalEnd
  return { start, end: endDate }
}

// 仪表盘主页，适配后端最新的趋势接口与 AI 排行榜接口。
export function DashboardContent({}: DashboardContentProps = {}) {
  const [repos, setRepos] = useState<RepoDto[]>([])
  const [selectedRepo, setSelectedRepo] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
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

    const startIdx = monthIndex(startParsed)
    const endIdx = monthIndex(endParsed)
    const safeStartIdx = Math.min(startIdx, endIdx)
    const safeEndIdx = Math.max(startIdx, endIdx)
    const safeStartMonth = `${Math.floor(safeStartIdx / 12)}-${String((safeStartIdx % 12) + 1).padStart(2, "0")}`
    const safeEndMonth = `${Math.floor(safeEndIdx / 12)}-${String((safeEndIdx % 12) + 1).padStart(2, "0")}`
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

  // 起始月份不能晚于结束月份。
  const handleChartStartChange = (value: string) => {
    setChartStartMonth(value)
    const startParsed = parseMonth(value)
    const endParsed = parseMonth(chartEndMonth)
    if (!startParsed || !endParsed) return
    if (monthIndex(startParsed) > monthIndex(endParsed)) {
      setChartEndMonth(value)
    }
  }

  // 结束月份不能早于起始月份。
  const handleChartEndChange = (value: string) => {
    setChartEndMonth(value)
    const startParsed = parseMonth(chartStartMonth)
    const endParsed = parseMonth(value)
    if (!startParsed || !endParsed) return
    if (monthIndex(endParsed) < monthIndex(startParsed)) {
      setChartStartMonth(value)
    }
  }

  useEffect(() => {
    if (!selectedRepo) return
    const repoId = Number(selectedRepo)
    if (!Number.isFinite(repoId) || repoId === 0) return

    const monthRange = getMonthDateRange(selectedMonth)
    if (!monthRange) return

    let cancelled = false
    setLoadingLeaderboard(true)
    setError(null)

    Promise.all([
      fetchAIRatioUserLeaderboard({
        repo_id: repoId,
        sort: "ai_ratio",
        year: Number(selectedMonth.split("-")[0]),
        month: Number(selectedMonth.split("-")[1]),
        page: 1,
        page_size: 20,
      }),
      fetchRepoTrend({
        repo_id: repoId,
        start_date: monthRange.start,
        end_date: monthRange.end,
      }),
    ])
      .then(([leaderboardData, totalsData]) => {
        if (cancelled) return
        setLeaderboard(leaderboardData)
        setTotals(totalsData.summary)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "加载排行榜失败"
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
  }, [selectedRepo, selectedMonth])

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
    () => repoOptions.find((r) => r.id === selectedRepo)?.label ?? "未选择仓库",
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
            onMonthSelect={setSelectedMonth}
          />
          <Leaderboard
            repoId={Number(selectedRepo)}
            data={leaderboard}
            loading={loadingLeaderboard}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
      </div>
    </div>
  )
}
