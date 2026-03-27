"use client"

import { useEffect, useState } from "react"
import { Award, Crown, Medal, Search, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  fetchAIRatioDepartmentLeaderboard,
  fetchAIRatioUserLeaderboard,
  type AIRatioLeaderboardDto,
} from "@/lib/api"

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-14" />
          </div>
        </div>
      ))}
    </div>
  )
}

export type SelectedItem =
  | { type: "department"; id: number; name: string }
  | { type: "user"; id: number; name: string; departmentId?: number }

export interface LeaderboardPanelProps {
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onSelectedItemChange: (item: SelectedItem | null) => void
}

type LeaderboardTab = "department" | "user"
type DepartmentLevel = "level2" | "level3"

/** 获取今天日期，供快捷区间计算复用。 */
function getTodayString(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** 按天偏移日期，用于生成近一周和近一个月区间。 */
function shiftDate(value: string, deltaDays: number): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  date.setDate(date.getDate() + deltaDays)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** 根据排名生成不同视觉标识，强化前几名辨识度。 */
function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-amber-500" />
    case 2:
      return <Medal className="h-5 w-5 text-slate-400" />
    case 3:
      return <Award className="h-5 w-5 text-orange-500" />
    default:
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/70 text-sm font-semibold text-muted-foreground">
          {rank}
        </span>
      )
  }
}

export function LeaderboardPanel({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onSelectedItemChange,
}: LeaderboardPanelProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("department")
  const [departmentLevel, setDepartmentLevel] = useState<DepartmentLevel>("level2")
  const [data, setData] = useState<AIRatioLeaderboardDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  /** 对用户搜索做轻量防抖，减少重复请求。 */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchKeyword(searchInput.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  /** 切换筛选条件后重置分页和右侧联动选中状态。 */
  useEffect(() => {
    setPage(1)
    setSelectedKey(null)
    onSelectedItemChange(null)
  }, [startDate, endDate, activeTab, departmentLevel, searchKeyword, onSelectedItemChange])

  /** 根据当前筛选条件同步排行榜数据。 */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const fetchData =
      activeTab === "department"
        ? () =>
            fetchAIRatioDepartmentLeaderboard({
              start_date: startDate,
              end_date: endDate,
              level: departmentLevel === "level2" ? 2 : 3,
              page,
              page_size: pageSize,
            })
        : () =>
            fetchAIRatioUserLeaderboard({
              start_date: startDate,
              end_date: endDate,
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
        const message = err instanceof Error ? err.message : "加载排行榜失败"
        setError(message)
        setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeTab, startDate, endDate, departmentLevel, searchKeyword, page, pageSize])

  const totalPages = data?.pagination.total_pages ?? 0
  const canPrev = page > 1
  const canNext = totalPages > 0 && page < totalPages

  /** 快速切换常用统计区间，减少手动选择日期成本。 */
  function applyPresetRange(mode: "week" | "month") {
    const today = getTodayString()
    const start = mode === "week" ? shiftDate(today, -6) : shiftDate(today, -29)
    onStartDateChange(start)
    onEndDateChange(today)
  }

  return (
    <section className="dashboard-panel flex min-h-0 flex-col overflow-hidden lg:h-full">
      <div className="border-b border-border/70 px-4 pb-4 pt-4">
        <div className="flex flex-col gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hero-chip py-1">
              <Users className="h-3.5 w-3.5 text-accent" />
              排行榜
            </div>
            <h2 className="truncate text-lg font-semibold text-foreground">团队与个人排行</h2>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LeaderboardTab)}>
                <TabsList className="h-10 rounded-full bg-secondary/80 p-1">
                  <TabsTrigger value="department" className="rounded-full px-4">
                    部门排行榜
                  </TabsTrigger>
                  <TabsTrigger value="user" className="rounded-full px-4">
                    个人排行榜
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {activeTab === "department" ? (
                <Select
                  value={departmentLevel}
                  onValueChange={(value) => setDepartmentLevel(value as DepartmentLevel)}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-10 rounded-full border-border/70 bg-card/85 px-4 text-sm shadow-none"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="level2">二级部门</SelectItem>
                    <SelectItem value="level3">三级部门</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
            </div>

            {activeTab === "user" ? (
              <div className="relative w-full max-w-[260px]">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="搜索姓名或用户名"
                  className="h-10 rounded-full border-border/70 bg-card/85 pl-11 shadow-none"
                />
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border/70 bg-secondary/20 px-3 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-foreground">统计区间</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => applyPresetRange("week")}
                  className="h-8 rounded-full bg-card/90 px-3 hover:bg-card"
                >
                  近一周
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => applyPresetRange("month")}
                  className="h-8 rounded-full bg-card/90 px-3 hover:bg-card"
                >
                  近一个月
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(event) => onStartDateChange(event.target.value)}
                  className="h-9 w-[148px] rounded-xl border-border/70 bg-card/90 px-3 shadow-none"
                />
                <span>至</span>
                <Input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(event) => onEndDateChange(event.target.value)}
                  className="h-9 w-[148px] rounded-xl border-border/70 bg-card/90 px-3 shadow-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        {loading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 text-sm text-destructive">
            {error}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 text-sm text-muted-foreground">
            当前筛选下暂无排行榜数据
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.items.map((item, index) => {
              const name = activeTab === "department" ? item.department?.name : item.user?.name ?? "-"
              const detail = activeTab === "department" ? "查看部门提交详情" : "查看个人提交详情"
              const cardKey = `${activeTab}-${item.rank}-${name}`
              const isActive = selectedKey === cardKey

              /** 将列表项映射成右侧明细所需的选中对象。 */
              const handleSelect = () => {
                setSelectedKey(cardKey)
                if (activeTab === "department" && item.department) {
                  onSelectedItemChange({
                    type: "department",
                    id: item.department.id,
                    name: item.department.name,
                  })
                } else if (activeTab === "user" && item.user) {
                  onSelectedItemChange({
                    type: "user",
                    id: item.user.id,
                    name: item.user.name,
                    departmentId: item.user.department?.id,
                  })
                }
              }

              /** 支持键盘触发选中行为，保证列表可访问。 */
              const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  handleSelect()
                }
              }

              return (
                <div
                  key={cardKey}
                  role="button"
                  tabIndex={0}
                  aria-label={`${detail}：${name}`}
                  onClick={handleSelect}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "rounded-[1.2rem] border border-border/70 bg-card/90 p-3.5 transition-all outline-none hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-[0_18px_36px_-28px_rgba(15,23,42,0.55)] focus:ring-2 focus:ring-ring/50",
                    index < 3 && "bg-gradient-to-r from-card via-card to-accent/5",
                    isActive && "border-accent/60 ring-2 ring-accent/15",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/70">
                      {getRankIcon(item.rank)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold text-card-foreground">
                            {name}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {activeTab === "department"
                              ? "部门维度 AI 贡献排行"
                              : "个人维度 AI 贡献排行"}
                          </div>
                        </div>
                        <div className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                          {(item.metrics.ai_ratio * 100).toFixed(1)}%
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl bg-secondary/45 px-3 py-2">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                            总行数
                          </div>
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {item.metrics.total_lines.toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-secondary/45 px-3 py-2">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                            AI 行数
                          </div>
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {item.metrics.ai_lines.toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-secondary/45 px-3 py-2">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                            排名
                          </div>
                          <div className="mt-1 text-sm font-semibold text-foreground">#{item.rank}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {data && data.pagination.total > 0 && (
        <div className="flex items-center justify-between border-t border-border/70 px-4 py-3">
          <div className="text-sm text-muted-foreground">
            第 {page} / {Math.max(totalPages, 1)} 页，共 {data.pagination.total} 条
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!canPrev || loading}
              className="rounded-full border-border/70 bg-card/80 px-4"
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((current) => (totalPages > 0 ? Math.min(totalPages, current + 1) : current + 1))
              }
              disabled={!canNext || loading}
              className="rounded-full border-border/70 bg-card/80 px-4"
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
