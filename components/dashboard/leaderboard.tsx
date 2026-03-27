"use client"

import { useRouter } from "next/navigation"
import { Award, Crown, Medal } from "lucide-react"

import { Input } from "@/components/ui/input"
import { type AIRatioLeaderboardDto } from "@/lib/api"
import { cn } from "@/lib/utils"

interface LeaderboardProps {
  repoId: number
  data: AIRatioLeaderboardDto | null
  loading?: boolean
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
}

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

/** 根据排名显示不同图标。 */
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

/** 用姓名首字生成简易头像。 */
function avatarFromName(name: string) {
  const trimmed = name.trim()
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?"
}

/** 首页榜单支持按日期区间筛选，并保持点击后上下文透传。 */
export function Leaderboard({
  repoId,
  data,
  loading,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: LeaderboardProps) {
  const router = useRouter()
  const items = data?.items ?? []

  /** 快速切换常用统计区间，减少手动选择日期成本。 */
  const applyPresetRange = (mode: "week" | "month") => {
    const today = getTodayString()
    const start = mode === "week" ? shiftDate(today, -6) : shiftDate(today, -29)
    onStartDateChange(start)
    onEndDateChange(today)
  }

  /** 点击排行项后跳转到用户详情页，并保留当前日期区间。 */
  const openUserProfile = (userId: number) => {
    const params = new URLSearchParams({ repoId: String(repoId) })
    params.set("start_date", startDate)
    params.set("end_date", endDate)
    router.push(`/users/${userId}?${params.toString()}`)
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">AI 用户排行榜</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                点击任意行可查看该用户在当前统计区间内的详情
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyPresetRange("week")}
                className="rounded-full border border-border/70 bg-secondary/40 px-3 py-2 text-xs text-foreground transition-colors hover:bg-secondary/70"
              >
                近一周
              </button>
              <button
                type="button"
                onClick={() => applyPresetRange("month")}
                className="rounded-full border border-border/70 bg-secondary/40 px-3 py-2 text-xs text-foreground transition-colors hover:bg-secondary/70"
              >
                近一个月
              </button>
              <Input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(event) => onStartDateChange(event.target.value)}
                className="h-9 w-[148px] rounded-full border-border/70 bg-secondary/40 px-4"
              />
              <span className="text-xs text-muted-foreground">至</span>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => onEndDateChange(event.target.value)}
                className="h-9 w-[148px] rounded-full border-border/70 bg-secondary/40 px-4"
              />
            </div>
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
                <th className="px-6 py-3 text-right">AI 占比</th>
                <th className="px-6 py-3 text-right">AI 代码行</th>
                <th className="px-6 py-3 text-right">总代码行</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const user = item.user
                if (!user) return null

                /** 支持键盘触发行跳转，保证表格可访问。 */
                const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    openUserProfile(user.id)
                  }
                }

                return (
                  <tr
                    key={user.id}
                    onClick={() => openUserProfile(user.id)}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    role="button"
                    aria-label={`进入 ${user.name} 的用户详情`}
                    className={cn(
                      "cursor-pointer border-b border-border/50 transition-colors hover:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset",
                      index < 3 && "bg-secondary/20",
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex w-8 items-center justify-center">{getRankIcon(item.rank)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                            item.rank === 1 && "bg-yellow-500/20 text-yellow-500",
                            item.rank === 2 && "bg-gray-400/20 text-gray-400",
                            item.rank === 3 && "bg-amber-600/20 text-amber-600",
                            item.rank > 3 && "bg-secondary text-secondary-foreground",
                          )}
                        >
                          {avatarFromName(user.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-card-foreground">{user.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {user.git_name || user.department?.name || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-sm text-accent">
                        {(item.metrics.ai_ratio * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-sm text-card-foreground">
                        {item.metrics.ai_lines.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-sm text-card-foreground">
                        {item.metrics.total_lines.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
