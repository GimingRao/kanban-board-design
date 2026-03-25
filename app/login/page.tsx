"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, IdCard, KeyRound, Search, ShieldCheck, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCurrentUser } from "@/hooks/use-current-user"
import {
  ApiRequestError,
  resolveLogin,
  searchLoginCandidates,
  type CurrentUserDto,
  type LoginCandidateDto,
  type LoginResolutionRequiredDto,
} from "@/lib/api"
import { getPostLoginPath } from "@/lib/auth"

type LoginViewMode = "form" | "resolution"

// 从登录分流错误中提取工号，确保前端展示与后端返回保持一致。
function getResolutionWorkerId(error: ApiRequestError, fallbackWorkerId: string) {
  const payload = error.payload
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    payload.data &&
    typeof payload.data === "object" &&
    "worker_id" in payload.data &&
    typeof payload.data.worker_id === "string"
  ) {
    return (payload.data as LoginResolutionRequiredDto).worker_id
  }
  return fallbackWorkerId
}

// 统一格式化最近提交时间，避免列表中重复处理日期展示逻辑。
function formatLastCommitAt(value?: string | null) {
  if (!value) return "暂无提交记录"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

// 登录或认领成功后统一写入用户状态，并跳转到登录后的正确页面。
function finishLogin(
  user: CurrentUserDto,
  setCurrentUser: (user: CurrentUserDto | null) => void,
  router: ReturnType<typeof useRouter>,
) {
  setCurrentUser(user)
  router.replace(getPostLoginPath(user))
}

export default function LoginPage() {
  const router = useRouter()
  const { currentUser, setCurrentUser, status, signIn } = useCurrentUser()
  const [viewMode, setViewMode] = useState<LoginViewMode>("form")
  const [workerId, setWorkerId] = useState("")
  const [password, setPassword] = useState("123456")
  const [submitting, setSubmitting] = useState(false)
  const [candidateQuery, setCandidateQuery] = useState("")
  const [candidates, setCandidates] = useState<LoginCandidateDto[]>([])
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null)
  const [searchingCandidates, setSearchingCandidates] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [resolutionSubmitting, setResolutionSubmitting] = useState<"claim_existing" | "create_new" | null>(null)

  // 已登录用户直接跳转，避免停留在登录页。
  useEffect(() => {
    if (status !== "authenticated" || !currentUser) return
    router.replace(getPostLoginPath(currentUser))
  }, [currentUser, router, status])

  // 仅在认领模式下搜索历史账号，并在输入变化时做轻量防抖。
  useEffect(() => {
    if (viewMode !== "resolution") {
      setCandidates([])
      setSelectedCandidateId(null)
      setSearchingCandidates(false)
      setSearchError(null)
      return
    }

    const trimmedQuery = candidateQuery.trim()
    if (!trimmedQuery) {
      setCandidates([])
      setSelectedCandidateId(null)
      setSearchingCandidates(false)
      setSearchError(null)
      return
    }

    const abortController = new AbortController()
    const timer = window.setTimeout(() => {
      setSearchingCandidates(true)
      setSearchError(null)

      searchLoginCandidates(trimmedQuery, 20, abortController.signal)
        .then((items) => {
          if (abortController.signal.aborted) return
          setCandidates(items)
          setSelectedCandidateId((previous) =>
            previous && items.some((item) => item.id === previous) ? previous : null,
          )
        })
        .catch((requestError: unknown) => {
          if (abortController.signal.aborted) return
          setCandidates([])
          setSelectedCandidateId(null)
          setSearchError(requestError instanceof Error ? requestError.message : "搜索历史账号失败")
        })
        .finally(() => {
          if (!abortController.signal.aborted) {
            setSearchingCandidates(false)
          }
        })
    }, 250)

    return () => {
      abortController.abort()
      window.clearTimeout(timer)
    }
  }, [candidateQuery, viewMode])

  // 提交工号和密码登录；若后端要求分流，则切换到认领/新建视图。
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!workerId.trim() || !password.trim()) {
      toast.error("请输入工号和密码")
      return
    }

    try {
      setSubmitting(true)
      await signIn(workerId.trim(), password)
      toast.success("登录成功")
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        error.status === 409 &&
        error.code === "LOGIN_RESOLUTION_REQUIRED"
      ) {
        setViewMode("resolution")
        setWorkerId(getResolutionWorkerId(error, workerId.trim()))
        toast.message("该工号尚未绑定账号。开发人员请认领 Git 账号，非开发人员可直接创建账号")
        return
      }

      toast.error(error instanceof Error ? error.message : "登录失败")
    } finally {
      setSubmitting(false)
    }
  }

  // 认领选中的历史账号，并在成功后完成登录态初始化。
  const handleClaimExisting = async () => {
    if (!selectedCandidateId) {
      toast.error("请先选择要认领的历史账号")
      return
    }

    try {
      setResolutionSubmitting("claim_existing")
      const user = await resolveLogin({
        worker_id: workerId.trim(),
        password,
        action: "claim_existing",
        candidate_user_id: selectedCandidateId,
      })
      toast.success("账号认领成功")
      finishLogin(user, setCurrentUser, router)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "认领历史账号失败")
    } finally {
      setResolutionSubmitting(null)
    }
  }

  // 在没有可认领历史账号时，直接创建当前工号对应的新账号。
  const handleCreateNew = async () => {
    try {
      setResolutionSubmitting("create_new")
      const user = await resolveLogin({
        worker_id: workerId.trim(),
        password,
        action: "create_new",
      })
      toast.success("新账号创建成功")
      finishLogin(user, setCurrentUser, router)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建新账号失败")
    } finally {
      setResolutionSubmitting(null)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-sm text-muted-foreground">
        正在检查登录状态...
      </div>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#eef6ff_0%,#f8fbf4_42%,#fffaf0_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-5rem] h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-[-6rem] top-16 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute bottom-[-7rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-200/25 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:36px_36px] opacity-40" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/88 p-6 shadow-[0_30px_90px_-42px_rgba(15,23,42,0.44)] backdrop-blur-xl sm:p-8">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-100/70 blur-2xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/90 px-3 py-1 text-xs font-medium text-slate-600">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                安全登录
              </div>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">
                {viewMode === "form" ? "登录账号" : "认领 Git 账号或创建账号"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                {viewMode === "form"
                  ? "输入工号和密码继续访问。若工号尚未绑定账号，页面会继续引导你完成后续操作。"
                  : "开发人员可搜索并认领历史 Git 账号；非开发人员如无须关联 Git 提交，可直接创建账号。"}
              </p>

              {viewMode === "form" ? (
                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="workerId" className="text-sm font-medium text-slate-800">
                      工号
                    </label>
                    <div className="relative">
                      <IdCard className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="workerId"
                        type="text"
                        autoComplete="username"
                        value={workerId}
                        onChange={(event) => setWorkerId(event.target.value)}
                        placeholder="请输入工号"
                        className="h-13 rounded-2xl border-slate-200 bg-slate-50/85 pl-11 pr-4 text-slate-900 shadow-none transition-all focus-visible:border-emerald-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="password" className="text-sm font-medium text-slate-800">
                        密码
                      </label>
                      <span className="text-xs text-slate-400">默认 123456</span>
                    </div>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-13 rounded-2xl border-slate-200 bg-slate-50/85 pl-11 pr-4 text-slate-900 shadow-none transition-all focus-visible:border-emerald-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-13 w-full rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.8)] transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    {submitting ? "登录中..." : "进入研发看板"}
                  </Button>
                </form>
              ) : (
                <div className="mt-8 space-y-5">
                  <div className="rounded-[1.4rem] border border-emerald-200/80 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                    当前工号 <span className="font-semibold">{workerId}</span> 尚未绑定账号。开发人员请先认领 Git 账号，非开发人员可直接创建账号。
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="candidateQuery" className="text-sm font-medium text-slate-800">
                      搜索 Git 账号
                    </label>
                    <p className="text-xs leading-6 text-slate-500">
                      开发人员可使用Git邮箱或 Git 名称搜索；邮箱可通过 <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">git config user.email</code>{" "}
                      获取。
                    </p>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="candidateQuery"
                        type="text"
                        value={candidateQuery}
                        onChange={(event) => setCandidateQuery(event.target.value)}
                        placeholder="开发人员请输入Git邮箱或 Git 名称搜索账号"
                        className="h-13 rounded-2xl border-slate-200 bg-slate-50/85 pl-11 pr-4 text-slate-900 shadow-none transition-all focus-visible:border-emerald-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100"
                      />
                    </div>
                  </div>

                  {searchError ? (
                    <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {searchError}
                    </div>
                  ) : null}

                  <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 p-3">
                    {!candidateQuery.trim() ? (
                      <div className="flex min-h-52 items-center justify-center px-4 text-center text-sm text-slate-500">
                        开发人员输入Git邮箱或 Git 名称后，系统会展示可认领的历史 Git 账号；非开发人员可直接创建账号。
                      </div>
                    ) : searchingCandidates ? (
                      <div className="flex min-h-52 items-center justify-center px-4 text-center text-sm text-slate-500">
                        正在搜索历史账号...
                      </div>
                    ) : candidates.length === 0 ? (
                      <div className="flex min-h-52 items-center justify-center px-4 text-center text-sm text-slate-500">
                        暂未找到可认领的 Git 账号。若你不是开发人员，或确认没有自己的旧账号，可直接创建新账号。
                      </div>
                    ) : (
                      <div className="max-h-96 space-y-3 overflow-y-auto p-1">
                        {candidates.map((candidate) => {
                          const isSelected = selectedCandidateId === candidate.id

                          return (
                            <button
                              key={candidate.id}
                              type="button"
                              onClick={() => setSelectedCandidateId(candidate.id)}
                              className={`w-full rounded-[1.35rem] border px-4 py-4 text-left transition ${
                                isSelected
                                  ? "border-emerald-300 bg-white shadow-[0_16px_36px_-28px_rgba(16,185,129,0.55)]"
                                  : "border-transparent bg-white/80 hover:border-slate-200 hover:bg-white"
                              }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-slate-900">
                                    {candidate.name || "未命名账号"}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {candidate.email || "未填写邮箱"}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    Git 名称：{candidate.git_name || "未填写"}
                                  </div>
                                </div>
                                {candidate.has_commits ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                    <BadgeCheck className="size-3.5" />
                                    检测到历史提交，建议认领
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                                    暂无历史提交
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
                                <div className="rounded-xl bg-slate-50 px-3 py-2">
                                  累计提交次数：{candidate.commit_count}
                                </div>
                                <div className="rounded-xl bg-slate-50 px-3 py-2">
                                  最近提交时间：{formatLastCommitAt(candidate.last_commit_at)}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      disabled={resolutionSubmitting !== null || !selectedCandidateId}
                      onClick={handleClaimExisting}
                      className="h-12 rounded-2xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      {resolutionSubmitting === "claim_existing" ? "认领中..." : "认领所选账号"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={resolutionSubmitting !== null}
                      onClick={handleCreateNew}
                      className="h-12 rounded-2xl border-slate-300 text-sm font-semibold text-slate-800"
                    >
                      <UserPlus className="mr-2 size-4" />
                      {resolutionSubmitting === "create_new" ? "创建中..." : "非开发人员直接创建账号"}
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    disabled={resolutionSubmitting !== null}
                    onClick={() => setViewMode("form")}
                    className="h-11 w-full rounded-2xl text-sm text-slate-600 hover:bg-slate-100"
                  >
                    返回修改工号或密码
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
