"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { TrendChartPanel } from "@/components/ai-ratio-board"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  fetchUserProfile,
  type UserProfileAIRecordItemDto,
  type UserProfileCommitItemDto,
  type UserProfileDto,
} from "@/lib/api"

const PAGE_SIZE = 10

type DetailTab = "commits" | "ai-records" | "trend"

/** 统一格式化时间，避免列表中的时间展示不一致。 */
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

/** 将 YYYY-MM 转成中文月份标签。 */
function monthToLabel(period: string) {
  const [year, month] = period.split("-")
  if (!year || !month) return period
  return `${year}年${Number(month)}月`
}

/** 直接使用后端返回的提交链接，避免前端重复拼装。 */
function buildCommitUrl(commit: UserProfileCommitItemDto) {
  return commit.commit_url || null
}

/** 统一提交入口文案，不直接暴露原始提交标识。 */
function getCommitLabel(commit: UserProfileCommitItemDto) {
  return commit.commit_url ? "查看提交" : "-"
}

/** 将 AI 记录状态翻译为中文标签。 */
function aiStatusLabel(status: UserProfileAIRecordItemDto["status"]) {
  if (status === "fully_matched") return "已匹配"
  if (status === "partially_matched") return "部分匹配"
  if (status === "pending") return "待匹配"
  return status || "-"
}

/** 统一展示 AI 工具名称。 */
function formatAiTool(tool: string) {
  return tool || "-"
}

/** 为截断的 diff 追加提示，避免误解为完整内容。 */
function truncatePreviewSuffix(truncated: boolean) {
  return truncated ? "\n...（已截断）" : ""
}

/** 兼容后端不同账号字段的展示逻辑。 */
function getUserAccountLabel(data: UserProfileDto) {
  return data.user.git_name || data.user.username || "-"
}

/** 提交分页摘要单独封装，避免模板重复。 */
function getCommitPaginationSummary(data: UserProfileDto) {
  return `第 ${data.pagination.page} / ${Math.max(data.pagination.total_pages, 1)} 页（共 ${data.pagination.total} 条）`
}

/** AI 记录分页摘要单独封装，避免模板重复。 */
function getAiPaginationSummary(data: UserProfileDto) {
  return `第 ${data.ai_records_pagination.page} / ${Math.max(data.ai_records_pagination.total_pages, 1)} 页（共 ${data.ai_records_pagination.total} 条）`
}

/** 将月份字符串向前偏移，用于默认展示近三个月趋势。 */
function shiftMonth(value: string, delta: number): string {
  const [y, m] = value.split("-")
  const year = Number(y)
  const month = Number(m)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return value
  const date = new Date(year, month - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
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
  const periodMonth =
    initialYear && initialMonth
      ? `${initialYear}-${String(initialMonth).padStart(2, "0")}`
      : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`

  const [activeTab, setActiveTab] = useState<DetailTab>("commits")
  const [commitPage, setCommitPage] = useState(1)
  const [aiPage, setAiPage] = useState(1)
  const [trendStartMonth, setTrendStartMonth] = useState(shiftMonth(periodMonth, -2))
  const [trendEndMonth, setTrendEndMonth] = useState(periodMonth)
  const [data, setData] = useState<UserProfileDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCommitPage(1)
    setAiPage(1)
    setTrendStartMonth(shiftMonth(periodMonth, -2))
    setTrendEndMonth(periodMonth)
  }, [repoId, userId, periodMonth])

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
        commitPage,
        commitPageSize: PAGE_SIZE,
        aiPage,
        aiPageSize: PAGE_SIZE,
      },
      abortController.signal,
    )
      .then((response) => {
        if (abortController.signal.aborted) return
        setData(response)
      })
      .catch((err: unknown) => {
        if (abortController.signal.aborted) return
        const message = err instanceof Error ? err.message : "加载用户详情失败"
        setError(message)
        setData(null)
      })
      .finally(() => {
        if (!abortController.signal.aborted) setLoading(false)
      })

    return () => {
      abortController.abort()
    }
  }, [repoId, userId, initialYear, initialMonth, commitPage, aiPage])

  const canPrevCommit = (data?.pagination.page ?? 1) > 1
  const canNextCommit = (data?.pagination.total_pages ?? 0) > (data?.pagination.page ?? 1)
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
          <div className="text-sm text-muted-foreground">
            仓库范围：{repoId === -1 ? "全部仓库" : `Repo ${repoId}`}
          </div>
        </div>

        {loading && !data ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              正在加载用户详情...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : !data ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              暂无用户数据
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{data.user.name} 的详情</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">账号</div>
                  <div className="text-sm font-medium">{getUserAccountLabel(data)}</div>
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
                <CardContent className="text-2xl font-semibold">
                  {data.summary.total_lines.toLocaleString()}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI 代码行</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-accent">
                  {data.summary.ai_lines.toLocaleString()}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI 占比</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {data.summary.ai_ratio.toFixed(2)}%
                </CardContent>
              </Card>
            </div>

            <Card>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DetailTab)}>
                <CardHeader className="gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle>代码明细</CardTitle>
                    <TabsList>
                      <TabsTrigger value="commits">最近提交代码</TabsTrigger>
                      <TabsTrigger value="ai-records">AI 代码记录</TabsTrigger>
                      <TabsTrigger value="trend">趋势分析</TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>
                <CardContent>
                  <TabsContent value="commits" className="mt-0">
                    {data.recent_commits.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        该时间范围内暂无提交记录
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                              <th className="py-2">时间</th>
                              <th className="py-2">提交</th>
                              <th className="py-2">仓库</th>
                              <th className="py-2">提交信息</th>
                              <th className="py-2 text-right">新增</th>
                              <th className="py-2 text-right">AI</th>
                              <th className="py-2 text-right">占比</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.recent_commits.map((commit) => {
                              const commitUrl = buildCommitUrl(commit)
                              const commitLabel = getCommitLabel(commit)
                              return (
                                <tr key={commit.id} className="border-b border-border/50 align-top">
                                  <td className="whitespace-nowrap py-2 pr-4 text-muted-foreground">
                                    {formatDateTime(commit.committed_at)}
                                  </td>
                                  <td className="py-2 pr-4 font-mono text-xs">
                                    {commitUrl ? (
                                      <a
                                        href={commitUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary hover:underline"
                                      >
                                        {commitLabel}
                                      </a>
                                    ) : (
                                      commitLabel
                                    )}
                                  </td>
                                  <td className="whitespace-nowrap py-2 pr-4">{commit.repo_name}</td>
                                  <td className="max-w-[520px] whitespace-pre-wrap break-words py-2 pr-4">
                                    {commit.message || "-"}
                                  </td>
                                  <td className="py-2 pr-4 text-right font-mono text-green-600">
                                    +{commit.additions.toLocaleString()}
                                  </td>
                                  <td className="py-2 pr-4 text-right font-mono">
                                    {commit.ai_lines.toLocaleString()}
                                  </td>
                                  <td className="py-2 pr-4 text-right font-mono">
                                    {commit.ai_ratio.toFixed(2)}%
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {getCommitPaginationSummary(data)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canPrevCommit || loading}
                          onClick={() => setCommitPage((current) => Math.max(1, current - 1))}
                        >
                          上一页
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canNextCommit || loading}
                          onClick={() => setCommitPage((current) => current + 1)}
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai-records" className="mt-0">
                    {data.recent_ai_records.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        该时间范围内暂无 AI 代码记录
                      </div>
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
                      <div className="text-xs text-muted-foreground">{getAiPaginationSummary(data)}</div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canPrevAi || loading}
                          onClick={() => setAiPage((current) => Math.max(1, current - 1))}
                        >
                          上一页
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canNextAi || loading}
                          onClick={() => setAiPage((current) => current + 1)}
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="trend" className="mt-0">
                    <TrendChartPanel
                      selectedItem={{ type: "user", id: userId, name: data.user.name }}
                      selectedMonth={data.period}
                      startMonth={trendStartMonth}
                      endMonth={trendEndMonth}
                      onStartMonthChange={setTrendStartMonth}
                      onEndMonthChange={setTrendEndMonth}
                    />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
