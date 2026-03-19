"use client"

import { useMemo } from "react"
import { CalendarRange, Sparkles, TrendingUp } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// 生成最近月份列表，供头部筛选器复用。
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

// 统一格式化大数字，保证概览卡片的可读性。
function formatNumber(value: number) {
  return value.toLocaleString("zh-CN")
}

export interface AiRatioBoardHeaderProps {
  totals: {
    total_lines: number
    ai_lines: number
    ai_ratio: number
  } | null
  selectedMonth: string
  onMonthChange: (month: string) => void
  loading?: boolean
}

export function AiRatioBoardHeader({
  totals,
  selectedMonth,
  onMonthChange,
  loading = false,
}: AiRatioBoardHeaderProps) {
  const monthOptions = useMemo(() => getRecentMonths(12), [])

  const metricCards = [
    {
      label: "总代码行数",
      value: totals ? formatNumber(totals.total_lines) : "--",
      hint: "当前月份累计",
    },
    {
      label: "AI 代码行数",
      value: totals ? formatNumber(totals.ai_lines) : "--",
      hint: "AI 贡献代码",
    },
    {
      label: "AI 占比",
      value: totals ? `${(totals.ai_ratio * 100).toFixed(1)}%` : "--",
      hint: "AI / 总代码",
      accent: true,
    },
  ]

  return (
    <section className="px-4 pb-3 sm:px-6">
      <div className="dashboard-panel overflow-hidden">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start lg:p-5">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="hero-chip mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  AI 代码占比看板
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                    研发贡献概览
                  </h1>
                  <span className="text-sm text-muted-foreground">
                    {totals
                      ? `本月 AI 占比 ${(totals.ai_ratio * 100).toFixed(1)}%`
                      : "正在同步本月数据"}
                  </span>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/45 px-3 py-1.5 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-accent" />
                月度趋势与排行联动查看
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {metricCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-[1.15rem] border border-border/70 bg-card/80 px-4 py-3 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.45)]"
                >
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground/90">
                    {card.label}
                  </div>
                  <div
                    className={[
                      "mt-2 text-2xl font-semibold tracking-tight sm:text-[1.75rem]",
                      card.accent ? "text-accent" : "text-foreground",
                      loading && "animate-pulse",
                    ].join(" ")}
                  >
                    {card.value}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[1.35rem] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarRange className="h-4 w-4 text-accent" />
              当前月份
            </div>
            <div className="mt-3">
              <Select value={selectedMonth} onValueChange={onMonthChange}>
                <SelectTrigger className="h-11 rounded-2xl border-border/70 bg-card/90 text-base shadow-none">
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
            <div className="mt-3 rounded-2xl border border-dashed border-border/80 bg-card/70 px-3 py-2.5">
              <p className="text-sm text-muted-foreground">切换后会同步更新排行、明细和趋势。</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
