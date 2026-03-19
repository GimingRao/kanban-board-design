"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpRight, GitCommitHorizontal, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  fetchAICommitsByDepartment,
  fetchAICommitsByUser,
  type AICommitsDto,
} from "@/lib/api"

import type { SelectedItem } from "./leaderboard-panel"

const MIN_VISIBLE_ROWS = 5
const MAX_VISIBLE_ROWS = 8
const DEFAULT_VISIBLE_ROWS = 6
const RESERVED_HEIGHT_PX = 240
const DEFAULT_ROW_HEIGHT_PX = 54

// 限制可见行数范围，避免面板在不同窗口高度下频繁抖动。
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

// 解析年月筛选值，供提交明细接口请求复用。
function parseMonth(value: string): { year: number; month: number } | null {
  const [yearText, monthText] = value.split("-")
  const year = Number(yearText)
  const month = Number(monthText)

  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null

  return { year, month }
}

// 统一格式化提交时间，保证列表展示稳定。
function formatDateTime(value: string | null) {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// 直接使用后端返回的提交链接，不再依赖 sha 拼接地址。
function getCommitUrl(item: AICommitsDto["items"][number]) {
  return item.commit.url || null
}

export interface CommitsPanelProps {
  selectedItem: SelectedItem | null
  selectedMonth: string
}

export function CommitsPanel({ selectedItem, selectedMonth }: CommitsPanelProps) {
  const router = useRouter()
  const [data, setData] = useState<AICommitsDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [visibleRows, setVisibleRows] = useState(DEFAULT_VISIBLE_ROWS)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    let rafId = 0

    // 根据当前面板高度动态计算表格行数，尽量让分页始终留在视口内。
    const updateRows = () => {
      if (!panelRef.current) return

      const panelTop = panelRef.current.getBoundingClientRect().top
      const firstRow = panelRef.current.querySelector("tbody tr") as HTMLTableRowElement | null
      const measuredRowHeight = firstRow?.getBoundingClientRect().height
      const rowHeight = measuredRowHeight && measuredRowHeight > 0 ? measuredRowHeight : DEFAULT_ROW_HEIGHT_PX
      const availableHeight = window.innerHeight - panelTop - RESERVED_HEIGHT_PX
      const rows = clamp(Math.floor(availableHeight / rowHeight), MIN_VISIBLE_ROWS, MAX_VISIBLE_ROWS)

      setVisibleRows((previous) => (previous === rows ? previous : rows))
    }

    const onResize = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }

      rafId = window.requestAnimationFrame(updateRows)
    }

    updateRows()
    window.addEventListener("resize", onResize)

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      window.removeEventListener("resize", onResize)
    }
  }, [selectedItem, selectedMonth, data])

  useEffect(() => {
    setPage(1)
  }, [visibleRows])

  // 首次选中对象或分页尺寸变化时，重新请求第一页数据。
  useEffect(() => {
    if (!selectedItem) {
      setData(null)
      return
    }

    const parsed = parseMonth(selectedMonth)
    if (!parsed) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setPage(1)

    const fetchData =
      selectedItem.type === "department"
        ? () =>
            fetchAICommitsByDepartment({
              department_id: selectedItem.id,
              year: parsed.year,
              month: parsed.month,
              page: 1,
              page_size: visibleRows,
            })
        : () =>
            fetchAICommitsByUser({
              user_id: selectedItem.id,
              year: parsed.year,
              month: parsed.month,
              page: 1,
              page_size: visibleRows,
            })

    fetchData()
      .then((result) => {
        if (cancelled) return
        setData(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "加载提交明细失败"
        setError(message)
        setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedItem, selectedMonth, visibleRows])

  // 翻页时仅更新当前页，避免重复重置已选对象。
  useEffect(() => {
    if (!selectedItem || page === 1) return

    const parsed = parseMonth(selectedMonth)
    if (!parsed) return

    let cancelled = false
    setLoading(true)
    setError(null)

    const fetchData =
      selectedItem.type === "department"
        ? () =>
            fetchAICommitsByDepartment({
              department_id: selectedItem.id,
              year: parsed.year,
              month: parsed.month,
              page,
              page_size: visibleRows,
            })
        : () =>
            fetchAICommitsByUser({
              user_id: selectedItem.id,
              year: parsed.year,
              month: parsed.month,
              page,
              page_size: visibleRows,
            })

    fetchData()
      .then((result) => {
        if (cancelled) return
        setData(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "加载提交明细失败"
        setError(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, selectedItem, selectedMonth, visibleRows])

  const totalPages = data?.pagination.total_pages ?? 0
  const canPrev = page > 1
  const canNext = totalPages > 0 && page < totalPages
  const selectionSummary =
    selectedItem?.type === "department"
      ? `部门：${selectedItem.name}`
      : selectedItem
        ? `用户：${selectedItem.name}`
        : null

  return (
    <section ref={panelRef} className="dashboard-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {selectionSummary && (
        <div className="border-b border-border/60 px-4 pb-3 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-border/70 bg-secondary/20 px-4 py-3">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <GitCommitHorizontal className="h-4 w-4 text-accent" />
              {selectionSummary}
            </div>
            <div className="text-sm text-muted-foreground">已按月份筛选当前提交记录</div>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {!selectedItem ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-secondary/20 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="mt-4 text-lg font-semibold text-foreground">等待选择查看对象</div>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              点击左侧部门或个人卡片后，这里会展示对应月份内的提交记录、AI 占比与代码增量。
            </p>
          </div>
        ) : loading ? (
          <div className="flex h-full min-h-[260px] items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-secondary/20 text-sm text-muted-foreground">
            正在加载提交明细...
          </div>
        ) : error ? (
          <div className="flex h-full min-h-[260px] items-center justify-center rounded-[1.5rem] border border-dashed border-destructive/40 bg-destructive/5 text-sm text-destructive">
            {error}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex h-full min-h-[260px] items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-secondary/20 text-sm text-muted-foreground">
            当前月份暂无提交记录
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto rounded-[1.35rem] border border-border/70 bg-card/80">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                  <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="whitespace-nowrap px-4 py-4">时间</th>
                    <th className="whitespace-nowrap px-4 py-4">链接</th>
                    <th className="whitespace-nowrap px-4 py-4">用户</th>
                    <th className="w-[40%] px-4 py-4">提交信息</th>
                    <th className="whitespace-nowrap px-4 py-4 text-right">AI 占比</th>
                    <th className="whitespace-nowrap px-4 py-4 text-right">新增行</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => {
                    const commitUrl = getCommitUrl(item)

                    return (
                      <tr
                        key={item.commit.id}
                        className="border-b border-border/50 align-top transition-colors hover:bg-secondary/20"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                          {formatDateTime(item.commit.committed_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-card-foreground">
                          {commitUrl ? (
                            <a
                              href={commitUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1.5 text-foreground transition-colors hover:border-accent/40 hover:text-accent"
                            >
                              查看提交
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-card-foreground">
                          <button
                            type="button"
                            onClick={() => router.push(`/users/${item.user.id}?repoId=-1`)}
                            className="rounded-full px-3 py-1 text-left transition-colors hover:bg-secondary/70 hover:text-primary"
                          >
                            {item.user.name}
                          </button>
                        </td>
                        <td className="max-w-[400px] whitespace-pre-wrap break-words px-4 py-4 leading-6 text-card-foreground">
                          {item.commit.message?.trim() || "-"}
                        </td>
                        <td className="px-4 py-4 text-right font-mono font-semibold text-accent">
                          {item.stats.ai_ratio.toFixed(1)}%
                        </td>
                        <td className="px-4 py-4 text-right font-mono font-semibold text-emerald-600">
                          +{item.stats.additions.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedItem && data && data.pagination.total > 0 && (
        <div className="flex items-center justify-between border-t border-border/70 px-4 py-3">
          <div className="text-sm text-muted-foreground">
            第 {page} / {Math.max(totalPages, 1)} 页
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
