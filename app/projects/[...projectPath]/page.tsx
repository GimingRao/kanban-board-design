"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { TrendChartPanel } from "@/components/ai-ratio-board"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ApiRequestError,
  fetchProjectProfile,
  fetchProjects,
  type ProjectListItemDto,
  type ProjectProfileAIRecordItemDto,
  type ProjectProfileCommitItemDto,
  type ProjectProfileDto,
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

/** 将路由中的项目路径还原为项目名。 */
function decodeProjectName(projectPath: string[] | undefined): string {
  if (!projectPath || projectPath.length === 0) return ""
  return projectPath.map((segment) => decodeURIComponent(segment)).join("/")
}

/** 统一展示日期范围文案。 */
function formatDateRangeLabel(startDate?: string | null, endDate?: string | null) {
  if (startDate && endDate) return `${startDate} 至 ${endDate}`
  if (startDate) return `${startDate} 起`
  if (endDate) return `截止 ${endDate}`
  return ""
}

/** 直接使用后端返回的提交链接，避免前端重复拼装。 */
function buildCommitUrl(commit: ProjectProfileCommitItemDto) {
  return commit.commit_url || null
}

/** 统一提交入口文案。 */
function getCommitLabel(commit: ProjectProfileCommitItemDto) {
  return commit.commit_url ? "查看提交" : "-"
}

/** 将 AI 记录状态转换为中文标签。 */
function aiStatusLabel(status: ProjectProfileAIRecordItemDto["status"]) {
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

/** 生成提交分页摘要。 */
function getCommitPaginationSummary(data: ProjectProfileDto) {
  return `第 ${data.pagination.page} / ${Math.max(data.pagination.total_pages, 1)} 页（共 ${data.pagination.total} 条）`
}

/** 生成 AI 记录分页摘要。 */
function getAiPaginationSummary(data: ProjectProfileDto) {
  return `第 ${data.ai_records_pagination.page} / ${Math.max(data.ai_records_pagination.total_pages, 1)} 页（共 ${data.ai_records_pagination.total} 条）`
}

/** 获取今天日期，用于限制趋势时间选择范围。 */
function getTodayString(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}

/** 将日期偏移指定天数，用于初始化最近一个月趋势。 */
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

/** 优先选择名称完全匹配的项目对象，避免同名前缀误命中。 */
function resolveProjectByName(projects: ProjectListItemDto[], projectName: string) {
  return projects.find((project) => project.name === projectName) ?? null
}

/** 将接口错误转换为更适合项目详情页的提示文案。 */
function getProjectPageErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError && error.status === 404) {
    return "项目不存在，或后端尚未生成该项目详情。"
  }
  if (error instanceof Error) {
    return error.message
  }
  return "加载项目详情失败"
}

/** 根据来源页签生成返回看板链接，避免项目详情返回后总是回到默认主页。 */
function buildDashboardHref(sourceTab: string | null) {
  const params = new URLSearchParams()
  params.set("tab", sourceTab || "repo-management")
  return `/?${params.toString()}`
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectPath: string[] }>()
  const searchParams = useSearchParams()
  const projectName = useMemo(() => decodeProjectName(params.projectPath), [params.projectPath])
  const dashboardHref = useMemo(
    () => buildDashboardHref(searchParams.get("sourceTab")),
    [searchParams],
  )

  const [activeTab, setActiveTab] = useState<DetailTab>("commits")
  const [commitPage, setCommitPage] = useState(1)
  const [aiPage, setAiPage] = useState(1)
  const [periodEndDate, setPeriodEndDate] = useState(getTodayString())
  const [periodStartDate, setPeriodStartDate] = useState(shiftDate(getTodayString(), -29))
  const [project, setProject] = useState<ProjectListItemDto | null>(null)
  const [data, setData] = useState<ProjectProfileDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCommitPage(1)
    setAiPage(1)
    const today = getTodayString()
    setPeriodEndDate(today)
    setPeriodStartDate(shiftDate(today, -29))
  }, [projectName])

  /** 项目详情页统一保证统计日期区间合法，避免倒置和未来日期。 */
  function handlePeriodStartDateChange(value: string) {
    const safeStart = clampToToday(value)
    setPeriodStartDate(safeStart)
    setPeriodEndDate((current) => {
      const safeCurrent = clampToToday(current)
      return compareDate(safeCurrent, safeStart) < 0 ? safeStart : safeCurrent
    })
  }

  /** 调整结束日期时同步修正开始日期，保证统计查询参数始终有效。 */
  function handlePeriodEndDateChange(value: string) {
    const safeEnd = clampToToday(value)
    setPeriodEndDate(safeEnd)
    setPeriodStartDate((current) => (compareDate(current, safeEnd) > 0 ? safeEnd : current))
  }

  /** 统一应用快捷区间，保证概览、列表和趋势使用同一时间范围。 */
  function applyPresetRange(mode: "week" | "month") {
    const today = getTodayString()
    const start = mode === "week" ? shiftDate(today, -6) : shiftDate(today, -29)
    setPeriodStartDate(start)
    setPeriodEndDate(today)
  }

  useEffect(() => {
    if (!projectName) {
      setError("项目名称无效")
      setProject(null)
      setData(null)
      return
    }

    const abortController = new AbortController()
    setLoading(true)
    setError(null)

    fetchProjects(abortController.signal)
      .then((projects) => {
        if (abortController.signal.aborted) return null
        const matchedProject = resolveProjectByName(projects, projectName)
        setProject(matchedProject)
        if (!matchedProject) {
          throw new Error("项目列表中未找到该项目，可能后端项目接口尚未上线。")
        }

        return fetchProjectProfile(
          matchedProject.id,
          {
            start_date: periodStartDate,
            end_date: periodEndDate,
            commitPage,
            commitPageSize: PAGE_SIZE,
            aiPage,
            aiPageSize: PAGE_SIZE,
          },
          abortController.signal,
        ).then((profile) => ({ matchedProject, profile }))
      })
      .then((result) => {
        if (!result || abortController.signal.aborted) return
        setProject(result.matchedProject)
        setData(result.profile)
      })
      .catch((err: unknown) => {
        if (abortController.signal.aborted) return
        setError(getProjectPageErrorMessage(err))
        setData(null)
      })
      .finally(() => {
        if (!abortController.signal.aborted) setLoading(false)
      })

    return () => {
      abortController.abort()
    }
  }, [projectName, commitPage, aiPage, periodStartDate, periodEndDate])

  const canPrevCommit = (data?.pagination.page ?? 1) > 1
  const canNextCommit = (data?.pagination.total_pages ?? 0) > (data?.pagination.page ?? 1)
  const canPrevAi = (data?.ai_records_pagination.page ?? 1) > 1
  const canNextAi =
    (data?.ai_records_pagination.total_pages ?? 0) > (data?.ai_records_pagination.page ?? 1)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={dashboardHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回看板
            </Link>
          </Button>
          <div className="text-sm text-muted-foreground">项目：{projectName || "-"}</div>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 px-6 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-foreground">统计区间</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => applyPresetRange("week")}
                  className="h-8 rounded-full bg-secondary/70 px-3 hover:bg-secondary"
                >
                  近一周
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => applyPresetRange("month")}
                  className="h-8 rounded-full bg-secondary/70 px-3 hover:bg-secondary"
                >
                  近一个月
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Input
                type="date"
                value={periodStartDate}
                max={periodEndDate}
                onChange={(event) => handlePeriodStartDateChange(event.target.value)}
                className="h-9 w-[148px] rounded-xl border-border/70 bg-card/90 px-3 shadow-none"
              />
              <span>至</span>
              <Input
                type="date"
                value={periodEndDate}
                min={periodStartDate}
                max={getTodayString()}
                onChange={(event) => handlePeriodEndDateChange(event.target.value)}
                className="h-9 w-[148px] rounded-xl border-border/70 bg-card/90 px-3 shadow-none"
              />
            </div>
          </CardContent>
        </Card>

        {loading && !data ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              正在加载项目详情...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="space-y-3 py-12 text-center">
              <div className="text-sm text-destructive">{error}</div>
              <div className="text-xs text-muted-foreground">
                前端入口和页面结构已准备完成，后端按约定提供项目接口后即可直接联调。
              </div>
            </CardContent>
          </Card>
        ) : !data ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              暂无项目数据
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{data.project.name} 的详情</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">项目名</div>
                  <div className="break-all text-sm font-medium">{data.project.name}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">仓库数量</div>
                  <div className="text-sm font-medium">{data.project.repo_count}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">活跃人数</div>
                  <div className="text-sm font-medium">{data.summary.active_users}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">统计区间</div>
                  <div className="text-sm font-medium">
                    {formatDateRangeLabel(periodStartDate, periodEndDate) || "-"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">提交数</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {data.summary.commits.toLocaleString()}
                </CardContent>
              </Card>
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
                    <CardTitle>项目明细</CardTitle>
                    <TabsList>
                      <TabsTrigger value="commits">提交内容</TabsTrigger>
                      <TabsTrigger value="ai-records">AI 记录</TabsTrigger>
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
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>时间</TableHead>
                            <TableHead>提交</TableHead>
                            <TableHead>仓库</TableHead>
                            <TableHead>作者</TableHead>
                            <TableHead className="min-w-[320px]">提交信息</TableHead>
                            <TableHead className="text-right">新增</TableHead>
                            <TableHead className="text-right">AI</TableHead>
                            <TableHead className="text-right">占比</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.recent_commits.map((commit) => {
                            const commitUrl = buildCommitUrl(commit)
                            const commitLabel = getCommitLabel(commit)

                            return (
                              <TableRow key={commit.id}>
                                <TableCell className="whitespace-nowrap text-muted-foreground">
                                  {formatDateTime(commit.committed_at)}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
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
                                </TableCell>
                                <TableCell>{commit.repo_name}</TableCell>
                                <TableCell>{commit.author?.name || "-"}</TableCell>
                                <TableCell className="max-w-[520px] whitespace-pre-wrap break-words">
                                  {commit.message || "-"}
                                </TableCell>
                                <TableCell className="text-right font-mono text-green-600">
                                  +{commit.additions.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {commit.ai_lines.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {(commit.ai_ratio * 100).toFixed(2)}%
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
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
                        该时间范围内暂无 AI 记录
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
                              <span>仓库：{record.repo_name || "-"}</span>
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
                    {project ? (
                      <TrendChartPanel
                        selectedItem={{ type: "project", id: project.id, name: project.name }}
                        startDate={periodStartDate}
                        endDate={periodEndDate}
                        onStartDateChange={handlePeriodStartDateChange}
                        onEndDateChange={handlePeriodEndDateChange}
                      />
                    ) : (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        暂无法加载项目趋势
                      </div>
                    )}
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
