"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useCurrentUser } from "@/hooks/use-current-user"
import { getPostLoginPath } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const { currentUser, status, signIn } = useCurrentUser()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("123456")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status !== "authenticated" || !currentUser) return
    router.replace(getPostLoginPath(currentUser))
  }, [currentUser, router, status])

  // 提交邮箱密码登录，并交给全局认证上下文处理后续跳转。
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error("请输入邮箱和密码")
      return
    }

    try {
      setSubmitting(true)
      await signIn(email.trim(), password)
      toast.success("登录成功")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登录失败")
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        正在检查登录状态...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(241,245,249,1)_100%)] px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-border/70 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            DevMetrics 登录
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            使用邮箱登录研发看板
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            系统会根据邮箱自动识别或创建用户。首次进入如果尚未绑定工号，会先引导你完成工号绑定。
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                登录邮箱
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                使用开发机器执行 <code>git config user.email</code> 得到的邮箱登录。
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700">
                重要提示
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                该邮箱已进行 AI 记录分析，后续请勿更改。
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                默认密码
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">默认密码为 123456。</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">登录账号</h2>
          <p className="mt-2 text-sm text-slate-500">请输入邮箱和密码继续。</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-800">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-800">
                密码
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-xl bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "登录中..." : "登录"}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
