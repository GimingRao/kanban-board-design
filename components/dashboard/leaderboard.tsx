"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Award, Crown, Medal } from "lucide-react"

import { type AIRatioLeaderboardDto } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LeaderboardProps {
  repoId: number
  data: AIRatioLeaderboardDto | null
  loading?: boolean
  selectedMonth: string
  onMonthChange: (value: string) => void
}

// 根据排名展示不同图标。
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

// 用姓名首字生成简单头像。
function avatarFromName(name: string) {
  const trimmed = name.trim()
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?"
}

// 生成近 12 个月筛选项。
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

// 解析月份字符串，方便拼装跳转参数。
function parseMonth(value: string): { year: number; month: number } | null {
  const [y, m] = value.split("-")
  const year = Number(y)
  const month = Number(m)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}

// 仪表盘榜单，改为展示后端当前的 AI 用户排行榜。
export function Leaderboard({
  repoId,
  data,
  loading,
  selectedMonth,
  onMonthChange,
}: LeaderboardProps) {
  const router = useRouter()
  const items = data?.items ?? []

  const monthOptions = useMemo(() => {
    const recent = getRecentMonths(12)
    if (recent.some((m) => m.value === selectedMonth)) return recent

    const parsed = parseMonth(selectedMonth)
    if (!parsed) return recent
    const extraDate = new Date(parsed.year, parsed.month - 1, 1)
    return [
      {
        value: selectedMonth,
        label: extraDate.toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "long",
        }),
      },
      ...recent,
    ]
  }, [selectedMonth])

  // 点击排行项后，跳转到用户详情页并保留筛选上下文。
  const openUserProfile = (userId: number) => {
    const month = parseMonth(selectedMonth)
    const params = new URLSearchParams({ repoId: String(repoId) })
    if (month) {
      params.set("year", String(month.year))
      params.set("month", String(month.month))
    }
    router.push(`/users/${userId}?${params.toString()}`)
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">AI 用户排行榜</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              点击任意行可查看该用户在当前月份的详情
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
                <th className="px-6 py-3 text-right">AI 占比</th>
                <th className="px-6 py-3 text-right">AI 代码行</th>
                <th className="px-6 py-3 text-right">总代码行</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const user = item.user
                if (!user) return null

                const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
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
