"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ExternalLink, FolderGit2, Save, Search } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { fetchRepos, type RepoDto, updateRepoProjectName } from "@/lib/api"

const UNASSIGNED_PROJECT_LABEL = "未归类"

type RepoDraftMap = Record<number, string>
type SavingStateMap = Record<number, boolean>

interface RepoGroup {
  projectName: string
  items: RepoDto[]
}

/** 统一裁剪项目名，便于搜索、分组和保存前比较。 */
function normalizeProjectName(projectName?: string | null): string {
  return projectName?.trim() ?? ""
}

/** 将空项目名统一映射为“未归类”分组标题。 */
function getProjectGroupName(projectName?: string | null): string {
  return normalizeProjectName(projectName) || UNASSIGNED_PROJECT_LABEL
}

/** 生成仓库输入框草稿，保证每一行都能独立编辑。 */
function buildDraftMap(repos: RepoDto[]): RepoDraftMap {
  return repos.reduce<RepoDraftMap>((drafts, repo) => {
    drafts[repo.id] = normalizeProjectName(repo.project_name)
    return drafts
  }, {})
}

/** 前端本地执行搜索匹配，覆盖 repo_key、name、project_name 和 web_url。 */
function matchesRepoQuery(repo: RepoDto, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  return [repo.repo_key, repo.name, repo.project_name, repo.web_url]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery))
}

/** 按 project_name 分组并稳定排序，未归类始终放在最后。 */
function groupReposByProject(repos: RepoDto[]): RepoGroup[] {
  const groups = new Map<string, RepoDto[]>()

  for (const repo of repos) {
    const groupName = getProjectGroupName(repo.project_name)
    const currentGroup = groups.get(groupName) ?? []
    currentGroup.push(repo)
    groups.set(groupName, currentGroup)
  }

  return Array.from(groups.entries())
    .map(([projectName, items]) => ({
      projectName,
      items: [...items].sort((left, right) =>
        (left.repo_key || left.name).localeCompare(right.repo_key || right.name, "zh-CN"),
      ),
    }))
    .sort((left, right) => {
      if (left.projectName === UNASSIGNED_PROJECT_LABEL) return 1
      if (right.projectName === UNASSIGNED_PROJECT_LABEL) return -1
      return left.projectName.localeCompare(right.projectName, "zh-CN")
    })
}

/** 将项目名编码为可读路径，供项目详情页路由复用。 */
function buildProjectDetailHref(projectName: string): string {
  const segments = projectName
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))

  return `/projects/${segments.join("/")}`
}

/** 为项目详情页追加来源页签参数，便于返回时恢复到仓库管理模块。 */
function buildProjectDetailHrefWithSourceTab(projectName: string): string {
  return `${buildProjectDetailHref(projectName)}?sourceTab=repo-management`
}

export function RepoManagement() {
  const [repos, setRepos] = useState<RepoDto[]>([])
  const [drafts, setDrafts] = useState<RepoDraftMap>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingRepoIds, setSavingRepoIds] = useState<SavingStateMap>({})

  /** 初始化加载仓库列表，只在页面进入时请求一次。 */
  const loadRepos = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchRepos()
      setRepos(data)
      setDrafts(buildDraftMap(data))
    } catch (error) {
      setError(error instanceof Error ? error.message : "加载仓库列表失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRepos()
  }, [])

  /** 更新单条仓库的项目名草稿，不影响其他记录。 */
  const handleDraftChange = (repoId: number, value: string) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [repoId]: value,
    }))
  }

  /** 判断当前草稿是否和后端已保存值不同，用于控制保存按钮状态。 */
  const hasDraftChanged = (repo: RepoDto) => {
    return normalizeProjectName(drafts[repo.id]) !== normalizeProjectName(repo.project_name)
  }

  /** 保存单条仓库项目名，成功后仅更新当前行数据与草稿。 */
  const handleSave = async (repo: RepoDto) => {
    const trimmedProjectName = normalizeProjectName(drafts[repo.id])
    setSavingRepoIds((currentState) => ({
      ...currentState,
      [repo.id]: true,
    }))

    try {
      const updatedRepo = await updateRepoProjectName(repo.id, {
        project_name: trimmedProjectName,
      })

      setRepos((currentRepos) =>
        currentRepos.map((currentRepo) => (currentRepo.id === repo.id ? updatedRepo : currentRepo)),
      )
      setDrafts((currentDrafts) => ({
        ...currentDrafts,
        [repo.id]: normalizeProjectName(updatedRepo.project_name),
      }))
      toast.success(`仓库 ${repo.repo_key} 保存成功`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存项目名失败")
    } finally {
      setSavingRepoIds((currentState) => ({
        ...currentState,
        [repo.id]: false,
      }))
    }
  }

  const filteredRepos = useMemo(
    () => repos.filter((repo) => matchesRepoQuery(repo, searchQuery)),
    [repos, searchQuery],
  )

  const groupedRepos = useMemo(() => groupReposByProject(filteredRepos), [filteredRepos])

  const totalAssignedRepos = useMemo(
    () => repos.filter((repo) => normalizeProjectName(repo.project_name)).length,
    [repos],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-background px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">仓库管理</h1>
            <p className="text-sm text-muted-foreground">
              维护仓库的 project_name，后续项目视图按该字段聚合
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              仓库总数 {repos.length}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              已归类 {totalAssignedRepos}
            </Badge>
          </div>
        </div>

        <div className="mt-5 max-w-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索 repo_key、name、project_name 或 web_url"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="border-b border-border bg-destructive/10 px-6 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto px-6 py-6">
        {loading ? (
          <Card>
            <CardContent className="px-6 py-14 text-center text-sm text-muted-foreground">
              正在加载仓库列表...
            </CardContent>
          </Card>
        ) : groupedRepos.length === 0 ? (
          <Card>
            <CardContent className="px-6 py-14 text-center text-sm text-muted-foreground">
              当前搜索条件下没有匹配的仓库。
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedRepos.map((group) => {
              const canOpenProject = group.projectName !== UNASSIGNED_PROJECT_LABEL

              return (
                <Card key={group.projectName} className="overflow-hidden">
                  <CardHeader className="border-b border-border/70 bg-muted/30">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <FolderGit2 className="h-5 w-5 text-primary" />
                          {group.projectName} ({group.items.length})
                        </CardTitle>
                        <CardDescription>
                          按当前 project_name 本地分组展示，单条保存后即时更新分组结果。
                        </CardDescription>
                      </div>

                      {canOpenProject ? (
                        <Button asChild variant="outline" className="w-fit">
                          <Link href={buildProjectDetailHrefWithSourceTab(group.projectName)}>
                            查看项目详情
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 px-6 py-5">
                    {group.items.map((repo) => {
                      const currentProjectName = normalizeProjectName(repo.project_name)
                      const draftProjectName = drafts[repo.id] ?? ""
                      const isSaving = Boolean(savingRepoIds[repo.id])
                      const changed = hasDraftChanged(repo)

                      return (
                        <div
                          key={repo.id}
                          className="rounded-2xl border border-border/80 bg-background p-4"
                        >
                          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="min-w-0 space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">ID {repo.id}</Badge>
                                <span className="font-medium text-foreground">
                                  {repo.repo_key || repo.name}
                                </span>
                              </div>

                              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                                <div>
                                  <span className="font-medium text-foreground">repo_key：</span>
                                  <span className="break-all">{repo.repo_key || "-"}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">name：</span>
                                  <span className="break-all">{repo.name || "-"}</span>
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="font-medium text-foreground">web_url：</span>
                                  {repo.web_url ? (
                                    <a
                                      href={repo.web_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 break-all text-primary hover:underline"
                                    >
                                      {repo.web_url}
                                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                    </a>
                                  ) : (
                                    <span>-</span>
                                  )}
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="font-medium text-foreground">
                                    当前 project_name：
                                  </span>
                                  <span>{currentProjectName || UNASSIGNED_PROJECT_LABEL}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Input
                                value={draftProjectName}
                                onChange={(event) => handleDraftChange(repo.id, event.target.value)}
                                placeholder="输入项目名，留空则清空 project_name"
                              />
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-muted-foreground">
                                  {changed ? "有未保存修改" : "已与当前值同步"}
                                </span>
                                <Button
                                  type="button"
                                  onClick={() => void handleSave(repo)}
                                  disabled={isSaving || !changed}
                                >
                                  <Save className="h-4 w-4" />
                                  {isSaving ? "保存中..." : "保存"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
