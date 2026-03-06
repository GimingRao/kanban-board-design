"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { fetchUserProfile, type UserProfileCommitItemDto, type UserProfileAIRecordItemDto } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

function monthToLabel(period: string) {
  const [year, month] = period.split("-")
  if (!year || !month) return period
  return `${year}年${Number(month)}月`
}

function buildCommitUrl(commit: UserProfileCommitItemDto) {
  if (!commit.repo_web_url) return null
  return `${commit.repo_web_url.replace(/\/+$/, "")}/-/commit/${commit.commit_sha}`
}

function aiStatusLabel(status: UserProfileAIRecordItemDto["status"]) {
  if (status === "fully_matched") return "已匹配"
  if (status === "partially_matched") return "部分匹配"
  if (status === "pending") return "待匹配"
  return status || "-"
}

function formatAiTool(tool: string) {
  return tool || "-"
}

function truncatePreviewSuffix(truncated: boolean) {
  return truncated ? "\n...（已截断）" : ""
}

export default function UserProfilePage() {
  const params = useParams<{ userId: string }>()
  const searchParams = useSearchParams()

  const userId = Number(params.userId)
  const repoId = Number(searchParams.get("repoId") ?? "-1")
  const yearParam = searchParams.get("year")
  const monthParam = searchParams.get("month")

  const initialYear = yearParam ? Number(yearParam) : undefined
  const initialMonth = monthParam ? Number(monthParam) : undefined

  const [page, setPage] = useState(1)
  const [data, setData] = useState<import("@/lib/api").UserProfileDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(userId) || userId <= 0) {
      setError("用户 ID 无效")
      setData(null)
      return
    }
    if (!Number.isFinite(repoId)) {
      setError("仓库参数无效")
      setData(null)
      return
    }

    const abortController = new AbortController()
    setLoading(true)
    setError(null)

    fetchUserProfile(
      repoId,
      userId,
      {
        year: initialYear,
        month: initialMonth,
        page,
        pageSize: 10,
      },
      abortController.signal,
    )
      .then((res) => {
        if (abortController.signal.aborted) return
        setData(res)
      })
      .catch((err: unknown) => {
        if (abortController.signal.aborted) return
        const message = err instanceof Error ? err.message : "加载用户主页失败"
        setError(message)
        setData(null)
      })
      .finally(() => {
        if (!abortController.signal.aborted) setLoading(false)
      })

    return () => {
      abortController.abort()
    }
  }, [repoId, userId, initialYear, initialMonth, page])

  const canPrev = (data?.pagination.page ?? 1) > 1
  const canNext = (data?.pagination.total_pages ?? 0) > (data?.pagination.page ?? 1)
  const canPrevAi = (data?.ai_records_pagination.page ?? 1) > 1
  const canNextAi =
    (data?.ai_records_pagination.total_pages ?? 0) > (data?.ai_records_pagination.page ?? 1)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回看板
            </Link>
          </Button>
          <div className="text-sm text-muted-foreground">仓库范围：{repoId === -1 ? "全部仓库" : `Repo ${repoId}`}</div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">正在加载用户主页...</CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : !data ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">暂无用户数据</CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{data.user.name} 的主页</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">用户</div>
                  <div className="text-sm font-medium">{data.user.username}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">部门</div>
                  <div className="text-sm font-medium">{data.user.department.name}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">统计月份</div>
                  <div className="text-sm font-medium">{monthToLabel(data.period)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">提交数</div>
                  <div className="text-sm font-medium">{data.summary.commits}</div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">总代码行</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{data.summary.total_lines.toLocaleString()}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI 生成代码行</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-accent">{data.summary.ai_lines.toLocaleString()}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI 占比</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{data.summary.ai_ratio.toFixed(2)}%</CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>最近提交代码</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recent_commits.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">该时间范围暂无提交记录</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="py-2">时间</th>
                          <th className="py-2">SHA</th>
                          <th className="py-2">仓库</th>
                          <th className="py-2">提交信息</th>
                          <th className="py-2 text-right">新增</th>
                          <th className="py-2 text-right">AI</th>
                          <th className="py-2 text-right">占比</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent_commits.map((c) => {
                          const commitUrl = buildCommitUrl(c)
                          return (
                            <tr key={c.id} className="border-b border-border/50 align-top">
                              <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">{formatDateTime(c.committed_at)}</td>
                              <td className="py-2 pr-4 font-mono text-xs">
                                {commitUrl ? (
                                  <a href={commitUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                    {c.commit_sha.slice(0, 8)}
                                  </a>
                                ) : (
                                  c.commit_sha.slice(0, 8)
                                )}
                              </td>
                              <td className="py-2 pr-4 whitespace-nowrap">{c.repo_name}</td>
                              <td className="py-2 pr-4 max-w-[520px] whitespace-pre-wrap break-words">{c.message || "-"}</td>
                              <td className="py-2 pr-4 text-right font-mono text-green-600">+{c.additions.toLocaleString()}</td>
                              <td className="py-2 pr-4 text-right font-mono">{c.ai_lines.toLocaleString()}</td>
                              <td className="py-2 pr-4 text-right font-mono">{c.ai_ratio.toFixed(2)}%</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    第 {data.pagination.page} / {Math.max(data.pagination.total_pages, 1)} 页（共 {data.pagination.total} 条）
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={!canPrev || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      上一页
                    </Button>
                    <Button variant="outline" size="sm" disabled={!canNext || loading} onClick={() => setPage((p) => p + 1)}>
                      下一页
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI 代码记录</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recent_ai_records.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">该时间范围暂无 AI 代码记录</div>
                ) : (
                  <div className="space-y-3">
                    {data.recent_ai_records.map((record) => (
                      <div key={record.id} className="rounded-md border border-border/60 p-3">
                        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{formatDateTime(record.timestamp)}</span>
                          <span>Event: {record.event_id}</span>
                          <span>Tool: {formatAiTool(record.ai_tool)}</span>
                          <span>状态：{aiStatusLabel(record.status)}</span>
                          <span>新增行数：{record.lines_added_total}</span>
                        </div>
                        <div className="mb-2 text-sm">
                          <span className="text-muted-foreground">文件：</span>
                          <span className="font-mono">{record.file_path || "-"}</span>
                        </div>
                        <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap break-words">
                          {(record.diff_preview || "") + truncatePreviewSuffix(record.diff_truncated)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    第 {data.ai_records_pagination.page} / {Math.max(data.ai_records_pagination.total_pages, 1)} 页（共 {data.ai_records_pagination.total} 条）
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={!canPrevAi || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      上一页
                    </Button>
                    <Button variant="outline" size="sm" disabled={!canNextAi || loading} onClick={() => setPage((p) => p + 1)}>
                      下一页
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
