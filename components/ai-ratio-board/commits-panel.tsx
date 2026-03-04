"use client"

import { useEffect, useState } from "react"
import { fetchAICommitsByDepartment, fetchAICommitsByRepo, fetchAICommitsByUser, type AICommitsDto, type AICommitItemDto } from "@/lib/api"
import type { SelectedItem } from "./leaderboard-panel"
import { Button } from "@/components/ui/button"

function parseMonth(value: string): { year: number; month: number } | null {
  const [y, m] = value.split("-")
  const year = Number(y)
  const month = Number(m)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}

export interface CommitsPanelProps {
  selectedItem: SelectedItem | null
  selectedMonth: string
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

export function CommitsPanel({ selectedItem, selectedMonth }: CommitsPanelProps) {
  const [data, setData] = useState<AICommitsDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

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
      fetchData = () => fetchAICommitsByDepartment({
        department_id: selectedItem.id,
        year: parsed.year,
        month: parsed.month,
        page: 1,
        page_size: 20,
      })
    } else if (selectedItem.type === "user") {
      fetchData = () => fetchAICommitsByUser({
        user_id: selectedItem.id,
        year: parsed.year,
        month: parsed.month,
        page: 1,
        page_size: 20,
      })
    } else {
      fetchData = () => fetchAICommitsByRepo({
        repo_id: selectedItem.id,
        year: parsed.year,
        month: parsed.month,
        page: 1,
        page_size: 20,
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
  }, [selectedItem, selectedMonth])

  // 分页加载
  useEffect(() => {
    if (!selectedItem || page === 1) return // 第 1 页已在主加载中处理

    const parsed = parseMonth(selectedMonth)
    if (!parsed) return

    let cancelled = false
    setLoading(true)
    setError(null)

    let fetchData: () => Promise<AICommitsDto>

    if (selectedItem.type === "department") {
      fetchData = () => fetchAICommitsByDepartment({
        department_id: selectedItem.id,
        year: parsed.year,
        month: parsed.month,
        page,
        page_size: 20,
      })
    } else if (selectedItem.type === "user") {
      fetchData = () => fetchAICommitsByUser({
        user_id: selectedItem.id,
        year: parsed.year,
        month: parsed.month,
        page,
        page_size: 20,
      })
    } else {
      fetchData = () => fetchAICommitsByRepo({
        repo_id: selectedItem.id,
        year: parsed.year,
        month: parsed.month,
        page,
        page_size: 20,
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
  }, [page, selectedItem, selectedMonth])

  const totalPages = data?.pagination.total_pages ?? 0
  const canPrev = page > 1
  const canNext = totalPages > 0 && page < totalPages

  const buildCommitUrl = (sha: string, repoUrl?: string | null) => {
    if (!repoUrl) return null
    const base = repoUrl.replace(/\/+$/, "")
    return `${base}/-/commit/${sha}`
  }

  return (
    <div className="flex min-h-[300px] flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          提交明细
        </h3>
        {selectedItem && (
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedItem.type === "department"
              ? `部门: ${selectedItem.name}`
              : `用户: ${selectedItem.name}`}
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
          <div className="flex h-full items-center justify-center text-sm text-destructive">
            {error}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            暂无提交记录
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 whitespace-nowrap">时间</th>
                <th className="px-4 py-3 whitespace-nowrap">SHA</th>
                <th className="px-4 py-3 whitespace-nowrap">用户</th>
                <th className="px-4 py-3 w-[40%]">提交信息</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">AI 占比</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">新增行</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.commit.id} className="border-b border-border/50 align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDateTime(item.commit.committed_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-card-foreground">
                    {buildCommitUrl(item.commit.sha, item.repo?.web_url) ? (
                      <a
                        href={buildCommitUrl(item.commit.sha, item.repo?.web_url) as string}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {item.commit.sha.slice(0, 8)}
                      </a>
                    ) : (
                      item.commit.sha.slice(0, 8)
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-card-foreground">
                    {item.user.name}
                  </td>
                  <td className="px-4 py-3 max-w-[400px] whitespace-pre-wrap break-words text-card-foreground">
                    {item.commit.message?.trim() || "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-accent">
                    {item.stats.ai_ratio.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-green-600">
                    +{item.stats.additions.toLocaleString()}
                  </td>
                </tr>
              ))}
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev || loading}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => totalPages > 0 ? Math.min(totalPages, p + 1) : p + 1)}
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
