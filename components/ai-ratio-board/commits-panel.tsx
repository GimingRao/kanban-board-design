"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  fetchAICommitsByDepartment,
  fetchAICommitsByRepo,
  fetchAICommitsByUser,
  type AICommitsDto,
} from "@/lib/api"

import type { SelectedItem } from "./leaderboard-panel"

const MIN_VISIBLE_ROWS = 5
const MAX_VISIBLE_ROWS = 8
const DEFAULT_VISIBLE_ROWS = 6
const RESERVED_HEIGHT_PX = 220
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
  const [data, setData] = useState<AICommitsDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [visibleRows, setVisibleRows] = useState(DEFAULT_VISIBLE_ROWS)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    let rafId = 0

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

    let fetchData: () => Promise<AICommitsDto>

    if (selectedItem.type === "department") {
      fetchData = () =>
        fetchAICommitsByDepartment({
          department_id: selectedItem.id,
          year: parsed.year,
          month: parsed.month,
          page: 1,
          page_size: visibleRows,
        })
    } else if (selectedItem.type === "user") {
      fetchData = () =>
        fetchAICommitsByUser({
          user_id: selectedItem.id,
          year: parsed.year,
          month: parsed.month,
          page: 1,
          page_size: visibleRows,
        })
    } else {
      fetchData = () =>
        fetchAICommitsByRepo({
          repo_id: selectedItem.id,
          year: parsed.year,
          month: parsed.month,
          page: 1,
          page_size: visibleRows,
        })
    }

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

  useEffect(() => {
    if (!selectedItem || page === 1) return

    const parsed = parseMonth(selectedMonth)
    if (!parsed) return

    let cancelled = false
    setLoading(true)
    setError(null)

    let fetchData: () => Promise<AICommitsDto>

    if (selectedItem.type === "department") {
      fetchData = () =>
        fetchAICommitsByDepartment({
          department_id: selectedItem.id,
          year: parsed.year,
          month: parsed.month,
          page,
          page_size: visibleRows,
        })
    } else if (selectedItem.type === "user") {
      fetchData = () =>
        fetchAICommitsByUser({
          user_id: selectedItem.id,
          year: parsed.year,
          month: parsed.month,
          page,
          page_size: visibleRows,
        })
    } else {
      fetchData = () =>
        fetchAICommitsByRepo({
          repo_id: selectedItem.id,
          year: parsed.year,
          month: parsed.month,
          page,
          page_size: visibleRows,
        })
    }

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

  return (
    <div ref={panelRef} className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="text-lg font-semibold text-card-foreground">提交明细</h3>
        {selectedItem && (
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedItem.type === "department" ? `部门：${selectedItem.name}` : `用户：${selectedItem.name}`}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {!selectedItem ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            请从排行榜中选择一个项目查看提交明细
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            正在加载提交明细...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-destructive">{error}</div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">暂无提交记录</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="whitespace-nowrap px-4 py-3">时间</th>
                <th className="whitespace-nowrap px-4 py-3">提交链接</th>
                <th className="whitespace-nowrap px-4 py-3">用户</th>
                <th className="w-[40%] px-4 py-3">提交信息</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">AI 占比</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">新增行</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => {
                const commitUrl = getCommitUrl(item)

                return (
                  <tr key={item.commit.id} className="border-b border-border/50 align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDateTime(item.commit.committed_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-card-foreground">
                      {commitUrl ? (
                        <a
                          href={commitUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          查看提交
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-card-foreground">{item.user.name}</td>
                    <td className="max-w-[400px] whitespace-pre-wrap break-words px-4 py-3 text-card-foreground">
                      {item.commit.message?.trim() || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-accent">{item.stats.ai_ratio.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right font-mono text-green-600">
                      +{item.stats.additions.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedItem && data && data.pagination.total > 0 && (
        <div className="flex items-center justify-between border-t border-border p-4">
          <div className="text-xs text-muted-foreground">
            第 {page} / {Math.max(totalPages, 1)} 页
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!canPrev || loading}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => (totalPages > 0 ? Math.min(totalPages, current + 1) : current + 1))}
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
