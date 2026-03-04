"use client"

import { useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

  return (
    <div className="border-b border-border bg-background px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            AI 代码占比看板
          </h1>
          {totals && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="rounded-md border border-border/70 bg-secondary/30 px-3 py-1.5">
                <div className="text-xs text-muted-foreground">总代码行数</div>
                <div className="text-lg font-semibold text-foreground">
                  {totals.total_lines.toLocaleString()}
                </div>
              </div>
              <div className="rounded-md border border-border/70 bg-secondary/30 px-3 py-1.5">
                <div className="text-xs text-muted-foreground">AI 代码行数</div>
                <div className="text-lg font-semibold text-foreground">
                  {totals.ai_lines.toLocaleString()}
                </div>
              </div>
              <div className="rounded-md border border-border/70 bg-secondary/30 px-3 py-1.5">
                <div className="text-xs text-muted-foreground">AI 占比</div>
                <div className="text-lg font-semibold text-accent">
                  {(totals.ai_ratio * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">月份:</span>
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="h-9 w-[170px] bg-secondary/40">
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
  )
}
