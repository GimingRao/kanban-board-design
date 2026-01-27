"use client"

import { useEffect, useMemo, useState } from "react"

import {
  fetchLeaderboard,
  fetchMonthlyMetrics,
  fetchRepos,
  fetchTotals,
  type LeaderboardDto,
  type MonthlyMetricsDto,
  type RepoDto,
  type TotalsDto,
} from "@/lib/api"

import { Leaderboard } from "./leaderboard"
import { MonthlyStatsChart } from "./monthly-stats-chart"
import { RepoSelector, type RepoOption } from "./repo-selector"

function getCurrentMonth(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

function parseMonth(value: string): { year: number; month: number } | null {
  const [y, m] = value.split("-")
  const year = Number(y)
  const month = Number(m)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}

function monthIndex({ year, month }: { year: number; month: number }): number {
  return year * 12 + (month - 1)
}

function shiftMonth(value: string, delta: number): string {
  const parsed = parseMonth(value)
  if (!parsed) return value
  const d = new Date(parsed.year, parsed.month - 1 + delta, 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export function DashboardContent() {
  const [repos, setRepos] = useState<RepoDto[]>([])
  const [selectedRepo, setSelectedRepo] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [chartEndMonth, setChartEndMonth] = useState(getCurrentMonth())
  const [chartStartMonth, setChartStartMonth] = useState(
    shiftMonth(getCurrentMonth(), -11),
  )

  const [monthly, setMonthly] = useState<MonthlyMetricsDto | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardDto | null>(null)
  const [totals, setTotals] = useState<TotalsDto | null>(null)

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
        // Default to the global view across all repos.
        setSelectedRepo("-1")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "Failed to load repos"
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

    // Backend caps to 36 months; clamp the range length.
    const months = Math.min(safeEndIdx - safeStartIdx + 1, 36)
    const anchorYear = Math.floor(safeEndIdx / 12)
    const anchorMonth = (safeEndIdx % 12) + 1

    let cancelled = false
    setLoadingMonthly(true)
    setError(null)

    fetchMonthlyMetrics(repoId, months, { year: anchorYear, month: anchorMonth })
      .then((monthlyData) => {
        if (cancelled) return
        setMonthly(monthlyData)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "Failed to load data"
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

  const handleChartStartChange = (value: string) => {
    setChartStartMonth(value)
    const startParsed = parseMonth(value)
    const endParsed = parseMonth(chartEndMonth)
    if (!startParsed || !endParsed) return
    if (monthIndex(startParsed) > monthIndex(endParsed)) {
      setChartEndMonth(value)
    }
  }

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
    const [yearStr, monthStr] = selectedMonth.split("-")
    const year = Number(yearStr)
    const month = Number(monthStr)
    const anchor =
      Number.isFinite(year) && Number.isFinite(month) && month >= 1 && month <= 12
        ? { year, month }
        : undefined

    let cancelled = false
    setLoadingLeaderboard(true)
    setError(null)

    Promise.all([
      fetchLeaderboard(repoId, {
        months: 1,
        limit: 20,
        sort: "per_workday",
        ...anchor,
      }),
      fetchTotals(repoId, 1, anchor),
    ])
      .then(([leaderboardData, totalsData]) => {
        if (cancelled) return
        setLeaderboard(leaderboardData)
        setTotals(totalsData)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "Failed to load data"
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
    () =>
      [
        { id: "-1", label: "所有仓库" },
        ...repos.map((repo) => ({
          id: String(repo.id),
          label: repo.repo_key || repo.name,
        })),
      ],
    [repos],
  )

  const selectedRepoLabel = useMemo(() => {
    return repoOptions.find((r) => r.id === selectedRepo)?.label ?? "未选择仓库"
  }, [repoOptions, selectedRepo])

  const selectedRepoWebUrl = useMemo(() => {
    if (selectedRepo === "-1") return null
    return repos.find((r) => String(r.id) === selectedRepo)?.web_url ?? null
  }, [repos, selectedRepo])

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-border bg-background px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">
            Git 提交指标
          </h1>
          <p className="mt-1 max-w-full truncate text-sm text-muted-foreground">
            {selectedRepo === "-1"
              ? "所有仓库的实时统计"
              : `${selectedRepoLabel} 的实时统计`}
          </p>
        </div>

        <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {totals && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md border border-border bg-secondary px-3 py-2 text-center">
                <div className="font-mono text-foreground">
                  {totals.net_lines.toLocaleString()}
                </div>
                <div className="text-muted-foreground">净增行数</div>
              </div>
              <div className="rounded-md border border-border bg-secondary px-3 py-2 text-center">
                <div className="font-mono text-foreground">
                  {totals.commits.toLocaleString()}
                </div>
                <div className="text-muted-foreground">提交次数</div>
              </div>
              <div className="rounded-md border border-border bg-secondary px-3 py-2 text-center">
                <div className="font-mono text-foreground">
                  {totals.active_users.toLocaleString()}
                </div>
                <div className="text-muted-foreground">活跃用户</div>
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
            repoWebUrl={selectedRepoWebUrl}
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

