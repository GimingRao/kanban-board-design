"use client"

import { useEffect, useMemo, useState } from "react"
import { Award, Crown, Medal } from "lucide-react"

import {
  fetchUserCommits,
  type LeaderboardDto,
  type LeaderboardItemDto,
  type UserCommitsDto,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface LeaderboardProps {
  repoId: number
  repoWebUrl?: string | null
  data: LeaderboardDto | null
  loading?: boolean
  selectedMonth: string
  onMonthChange: (value: string) => void
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />
    default:
      return (
        <span className="flex h-5 w-5 items-center justify-center text-sm text-muted-foreground">
          {rank}
        </span>
      )
  }
}

function avatarFromName(name: string) {
  const trimmed = name.trim()
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?"
}

function getRecentMonths(count: number): Array<{ value: string; label: string }> {
  const result: Array<{ value: string; label: string }> = []
  const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth(), 1)

  for (let i = 0; i < count; i += 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const value = `${year}-${String(month).padStart(2, "0")}`
    const label = d.toLocaleDateString("zh-CN", { year: "numeric", month: "long" })
    result.push({ value, label })
  }

  return result
}

function parseMonth(value: string): { year: number; month: number } | null {
  const [y, m] = value.split("-")
  const year = Number(y)
  const month = Number(m)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}

function formatDateTime(value: string | null) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function Leaderboard({
  repoId,
  repoWebUrl,
  data,
  loading,
  selectedMonth,
  onMonthChange,
}: LeaderboardProps) {
  const items = data?.items ?? []

  const monthOptions = useMemo(() => {
    const recent = getRecentMonths(12)
    if (recent.some((m) => m.value === selectedMonth)) return recent

    const parsed = parseMonth(selectedMonth)
    if (!parsed) return recent
    const extraDate = new Date(parsed.year, parsed.month - 1, 1)
    const extra = {
      value: selectedMonth,
      label: extraDate.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
      }),
    }
    return [extra, ...recent]
  }, [selectedMonth])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeUser, setActiveUser] = useState<LeaderboardItemDto | null>(null)
  const [commitPage, setCommitPage] = useState(1)
  const [commitData, setCommitData] = useState<UserCommitsDto | null>(null)
  const [commitLoading, setCommitLoading] = useState(false)
  const [commitError, setCommitError] = useState<string | null>(null)

  const monthAnchor = useMemo(() => parseMonth(selectedMonth), [selectedMonth])

  useEffect(() => {
    if (!dialogOpen || !activeUser || !monthAnchor) return
    if (!Number.isFinite(repoId) || repoId <= 0) return

    let cancelled = false
    setCommitLoading(true)
    setCommitError(null)

    fetchUserCommits(repoId, activeUser.user_id, {
      year: monthAnchor.year,
      month: monthAnchor.month,
      page: commitPage,
      pageSize: 10,
    })
      .then((res) => {
        if (cancelled) return
        setCommitData(res)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "加载提交明细失败"
        setCommitError(message)
        setCommitData(null)
      })
      .finally(() => {
        if (!cancelled) setCommitLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [dialogOpen, activeUser, monthAnchor, repoId, commitPage])

  const totalPages = commitData?.total_pages ?? 0
  const canPrev = commitPage > 1
  const canNext = totalPages > 0 && commitPage < totalPages

  const openUserDialog = (user: LeaderboardItemDto) => {
    setActiveUser(user)
    setCommitPage(1)
    setDialogOpen(true)
  }

  const buildCommitUrl = (sha: string) => {
    if (!repoWebUrl) return null
    const base = repoWebUrl.replace(/\/+$/, "")
    return `${base}/-/commit/${sha}`
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              提交排行榜
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              点击某一行查看该用户当月提交明细
            </p>
          </div>

          <div className="flex min-w-[200px] items-center gap-2">
            <span className="text-xs text-muted-foreground">月份</span>
            <Select value={selectedMonth} onValueChange={onMonthChange}>
              <SelectTrigger className="h-9 w-[180px] bg-secondary/40">
                <SelectValue placeholder="选择月份" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            正在加载排行榜...
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            暂无数据
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">排名</th>
                <th className="px-6 py-3">开发者</th>
                <th className="px-6 py-3 text-right">日均新增</th>
                <th className="px-6 py-3 text-right">日均删除</th>
                <th className="px-6 py-3 text-right">提交数</th>
                <th className="px-6 py-3 text-right">新增</th>
                <th className="px-6 py-3 text-right">删除</th>
              </tr>
            </thead>
            <tbody>
              {items.map((dev, index) => (
                <tr
                  key={dev.user_id}
                  onClick={() => openUserDialog(dev)}
                  className={cn(
                    "cursor-pointer border-b border-border/50 transition-colors hover:bg-secondary/60",
                    index < 3 && "bg-secondary/20",
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex w-8 items-center justify-center">
                      {getRankIcon(dev.rank)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                          dev.rank === 1 && "bg-yellow-500/20 text-yellow-500",
                          dev.rank === 2 && "bg-gray-400/20 text-gray-400",
                          dev.rank === 3 && "bg-amber-600/20 text-amber-600",
                          dev.rank > 3 && "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {avatarFromName(dev.name)}
                      </div>
                      <span className="font-medium text-card-foreground">
                        {dev.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-sm text-card-foreground">
                      {dev.added_per_workday.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-sm text-card-foreground">
                      {dev.removed_per_workday.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-sm text-card-foreground">
                      {dev.commits.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-sm text-green-500">
                      +{dev.lines_added.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-sm text-red-500">
                      -{dev.lines_removed.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] w-[96vw] sm:!max-w-6xl lg:!max-w-7xl">
          <DialogHeader>
            <DialogTitle>
              {activeUser?.name ?? "开发者"} 的提交明细
            </DialogTitle>
            <DialogDescription>
              {selectedMonth} · 共 {commitData?.total ?? 0} 条提交
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[72vh] overflow-auto rounded-md border border-border/60">
            {commitLoading ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                正在加载提交明细...
              </div>
            ) : commitError ? (
              <div className="flex h-40 items-center justify-center px-6 text-sm text-destructive">
                {commitError}
              </div>
            ) : (commitData?.items.length ?? 0) === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                当月没有提交记录
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 whitespace-nowrap">时间</th>
                    <th className="px-4 py-3 whitespace-nowrap">SHA</th>
                    <th className="px-4 py-3 w-[55%]">提交信息</th>
                    <th className="px-4 py-3 text-right">新增</th>
                    <th className="px-4 py-3 text-right">删除</th>
                    <th className="px-4 py-3 text-right">文件数</th>
                  </tr>
                </thead>
                <tbody>
                  {commitData?.items.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {formatDateTime(c.committed_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-card-foreground">
                        {buildCommitUrl(c.commit_sha) ? (
                          <a
                            href={buildCommitUrl(c.commit_sha) as string}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline-offset-2 hover:underline"
                          >
                            {c.commit_sha.slice(0, 8)}
                          </a>
                        ) : (
                          c.commit_sha.slice(0, 8)
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[640px] whitespace-pre-wrap break-words text-card-foreground">
                        {c.message?.trim() || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-green-600">
                        +{c.additions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-red-600">
                        -{c.deletions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-card-foreground">
                        {c.files_changed.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              第 {commitPage} / {Math.max(totalPages, 1)} 页
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCommitPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev || commitLoading}
              >
                上一页
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCommitPage((p) =>
                    totalPages > 0 ? Math.min(totalPages, p + 1) : p + 1,
                  )
                }
                disabled={!canNext || commitLoading}
              >
                下一页
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
