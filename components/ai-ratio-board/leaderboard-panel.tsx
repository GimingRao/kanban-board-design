"use client"

import { useEffect, useState, useRef } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, Crown, Medal, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fetchAIRatioDepartmentLeaderboard,
  fetchAIRatioUserLeaderboard,
  type AIRatioLeaderboardDto,
} from "@/lib/api"
import { DepartmentLevelSelector } from "./department-level-selector"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function parseMonth(value: string): { year: number; month: number } | null {
  const [y, m] = value.split("-")
  const year = Number(y)
  const month = Number(m)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

export type SelectedItem =
  | { type: "department"; id: number; name: string }
  | { type: "user"; id: number; name: string; departmentId?: number }

export interface LeaderboardPanelProps {
  selectedMonth: string
  onSelectedItemChange: (item: SelectedItem | null) => void
}

type LeaderboardTab = "department" | "user"

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

export function LeaderboardPanel({
  selectedMonth,
  onSelectedItemChange,
}: LeaderboardPanelProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("department")
  const [departmentLevel, setDepartmentLevel] = useState<"level2" | "level3">("level2")
  const [data, setData] = useState<AIRatioLeaderboardDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    const el = scrollRef.current
    if (!el) return

    const canScroll = el.scrollHeight > el.clientHeight
    if (!canScroll || e.deltaY === 0) return

    el.scrollTop += e.deltaY
    e.preventDefault()
    e.stopPropagation()
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchKeyword(searchInput.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [selectedMonth, activeTab, departmentLevel, searchKeyword])

  useEffect(() => {
    const parsed = parseMonth(selectedMonth)
    if (!parsed) return

    let cancelled = false
    setLoading(true)
    setError(null)

    const fetchData =
      activeTab === "department"
        ? () =>
            fetchAIRatioDepartmentLeaderboard({
              year: parsed.year,
              month: parsed.month,
              level: departmentLevel === "level2" ? 2 : 3,
              page,
              page_size: pageSize,
            })
        : () =>
            fetchAIRatioUserLeaderboard({
              year: parsed.year,
              month: parsed.month,
              search: searchKeyword || undefined,
              page,
              page_size: pageSize,
            })

    fetchData()
      .then((result) => {
        if (cancelled) return
        setData(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "加载失败"
        setError(message)
        setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeTab, selectedMonth, departmentLevel, searchKeyword, page, pageSize])

  const totalPages = data?.pagination.total_pages ?? 0
  const canPrev = page > 1
  const canNext = totalPages > 0 && page < totalPages

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardTab)}>
          <TabsList>
            <TabsTrigger value="department">部门排行榜</TabsTrigger>
            <TabsTrigger value="user">个人排行榜</TabsTrigger>
          </TabsList>
        </Tabs>
        {activeTab === "department" && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">层级筛选:</span>
            <DepartmentLevelSelector value={departmentLevel} onChange={setDepartmentLevel} />
          </div>
        )}
        {activeTab === "user" && (
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索姓名或用户名"
              className="pl-10"
            />
          </div>
        )}
      </div>
      <div ref={scrollRef} onWheel={handleWheel} className="min-h-0 flex-1 overflow-auto p-4">
        {loading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-destructive">{error}</div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">暂无数据</div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">排名</th>
                <th className="px-4 py-3">{activeTab === "department" ? "部门" : "开发者"}</th>
                <th className="px-4 py-3 text-right">总代码行</th>
                <th className="px-4 py-3 text-right">AI 代码行</th>
                <th className="px-4 py-3 text-right">AI 占比</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => {
                const name = activeTab === "department" ? item.department?.name : item.user?.name ?? "-"
                const handleClick = () => {
                  if (activeTab === "department" && item.department) {
                    onSelectedItemChange({ type: "department", id: item.department.id, name: item.department.name })
                  } else if (activeTab === "user" && item.user) {
                    onSelectedItemChange({
                      type: "user",
                      id: item.user.id,
                      name: item.user.name,
                      departmentId: item.user.department?.id,
                    })
                  }
                }
                const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleClick()
                  }
                }
                return (
                  <tr
                    key={`${item.rank}-${activeTab}-${name}`}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    role="button"
                    aria-label={`查看 ${name} 的详情`}
                    className={cn(
                      "cursor-pointer border-b border-border/50 transition-colors hover:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset",
                      index < 3 && "bg-secondary/20",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex w-8 items-center justify-center">{getRankIcon(item.rank)}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{name}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-card-foreground">
                      {item.metrics.total_lines.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-card-foreground">
                      {item.metrics.ai_lines.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-accent">
                      {(item.metrics.ai_ratio * 100).toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      {data && data.pagination.total > 0 && (
        <div className="flex items-center justify-between border-t border-border p-4">
          <div className="text-xs text-muted-foreground">
            第 {page} / {Math.max(totalPages, 1)} 页（共 {data.pagination.total} 条）
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev || loading}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => (totalPages > 0 ? Math.min(totalPages, p + 1) : p + 1))}
              disabled={!canNext || loading}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
