"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
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

/** 统一格式化时间展示，避免列表中的时间样式不一致。 */
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

/** 将后端返回的月份字符串转成人类可读标签。 */
function monthToLabel(period: string) {
  const [year, month] = period.split("-")
  if (!year || !month) return period
  return `${year}年${Number(month)}月`
}

/** 统一展示日期区间文案，便于所有页面保持同一口径。 */
function formatDateRangeLabel(startDate?: string | null, endDate?: string | null) {
  if (startDate && endDate) return `${startDate} 至 ${endDate}`
  if (startDate) return `${startDate} 起`
  if (endDate) return `截止 ${endDate}`
  return ""
}

/** 优先使用查询参数中的日期区间，兼容后端仍返回月份 period 的旧结构。 */
function getPeriodLabel(data: UserProfileDto, startDate?: string | null, endDate?: string | null) {
  const rangeLabel = formatDateRangeLabel(startDate, endDate)
  return rangeLabel || monthToLabel(data.period)
}

/** 直接使用后端返回的提交链接，避免前端重复拼装。 */
function buildCommitUrl(commit: UserProfileCommitItemDto) {
  return commit.commit_url || null
}

/** 统一提交入口文案。 */
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

/** 统一显示 AI 工具名称。 */
function formatAiTool(tool: string) {
  return tool || "-"
}

/** 为截断 diff 追加提示，避免误解为完整内容。 */
function truncatePreviewSuffix(truncated: boolean) {
  return truncated ? "\n...（已截断）" : ""
}

/** 兼容不同账号字段的展示逻辑。 */
function getUserAccountLabel(data: UserProfileDto) {
  return data.user.git_name || data.user.username || "-"
}

/** 生成提交分页摘要。 */
function getCommitPaginationSummary(data: UserProfileDto) {
  return `第 ${data.pagination.page} / ${Math.max(data.pagination.total_pages, 1)} 页（共 ${data.pagination.total} 条）`
}

/** 生成 AI 记录分页摘要。 */
function getAiPaginationSummary(data: UserProfileDto) {
  return `第 ${data.ai_records_pagination.page} / ${Math.max(data.ai_records_pagination.total_pages, 1)} 页（共 ${data.ai_records_pagination.total} 条）`
}

/** 获取今天日期，限制趋势分析的结束日期不能超过当前自然日。 */
function getTodayString(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}

/** 将日期偏移指定天数，用于默认展示最近一个月趋势。 */
function shiftDate(value: string, deltaDays: number): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  date.setDate(date.getDate() + deltaDays)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/** 比较两个日期字符串，确保趋势区间关系始终正确。 */
function compareDate(left: string, right: string) {
  return left.localeCompare(right)
}

/** 将日期裁剪到今天之前，避免误选未来日期。 */
function clampToToday(value: string) {
  const today = getTodayString()
  return compareDate(value, today) > 0 ? today : value
}

/** 根据来源页签生成返回看板链接，避免用户详情返回后丢失原始模块上下文。 */
function buildDashboardHref(sourceTab: string | null) {
  const params = new URLSearchParams()
  params.set("tab", sourceTab || "ai-ratio")
  return `/?${params.toString()}`
}

export default function UserProfilePage() {
  const params = useParams<{ userId: string }>()
  const searchParams = useSearchParams()

  const userId = Number(params.userId)
  const repoId = Number(searchParams.get("repoId") ?? "-1")
  const startDate = searchParams.get("start_date")
  const endDate = searchParams.get("end_date")
  const sourceTab = searchParams.get("sourceTab")

  const [activeTab, setActiveTab] = useState<DetailTab>("commits")
  const [commitPage, setCommitPage] = useState(1)
  const [aiPage, setAiPage] = useState(1)
  const [trendEndDate, setTrendEndDate] = useState(getTodayString())
  const [trendStartDate, setTrendStartDate] = useState(shiftDate(getTodayString(), -29))
  const [data, setData] = useState<UserProfileDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const periodLabel = useMemo(
    () => (data ? getPeriodLabel(data, startDate, endDate) : formatDateRangeLabel(startDate, endDate)),
    [data, endDate, startDate],
  )
  const dashboardHref = useMemo(() => buildDashboardHref(sourceTab), [sourceTab])

  useEffect(() => {
    setCommitPage(1)
    setAiPage(1)
    const today = getTodayString()
    setTrendEndDate(today)
    setTrendStartDate(shiftDate(today, -29))
  }, [repoId, userId, startDate, endDate])

  /** 用户详情页同样保证趋势日期区间合法，避免出现倒置和未来日期。 */
  function handleTrendStartDateChange(value: string) {
    const safeStart = clampToToday(value)
    setTrendStartDate(safeStart)
    setTrendEndDate((current) => {
      const safeCurrent = clampToToday(current)
      return compareDate(safeCurrent, safeStart) < 0 ? safeStart : safeCurrent
    })
  }

  /** 调整结束日期时同步修正开始日期，保证趋势图始终可查询。 */
  function handleTrendEndDateChange(value: string) {
    const safeEnd = clampToToday(value)
    setTrendEndDate(safeEnd)
    setTrendStartDate((current) => (compareDate(current, safeEnd) > 0 ? safeEnd : current))
  }

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
        start_date: startDate ?? undefined,
        end_date: endDate ?? undefined,
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
  }, [repoId, userId, startDate, endDate, commitPage, aiPage])

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
            <Link href={dashboardHref}>
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
                  <div className="text-xs text-muted-foreground">统计区间</div>
                  <div className="text-sm font-medium">{periodLabel || "-"}</div>
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
                  {(data.summary.ai_ratio * 100).toFixed(2)}%
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
                                    {(commit.ai_ratio * 100).toFixed(2)}%
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
                      startDate={trendStartDate}
                      endDate={trendEndDate}
                      onStartDateChange={handleTrendStartDateChange}
                      onEndDateChange={handleTrendEndDateChange}
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
