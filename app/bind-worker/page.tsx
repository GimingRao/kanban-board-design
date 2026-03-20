"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AuthGuard } from "@/components/auth/auth-guard"
import { WorkerProfileBinding } from "@/components/auth/worker-profile-binding"
import { useCurrentUser } from "@/hooks/use-current-user"
import { bindCurrentUserWorkerProfile } from "@/lib/api"
import { hasBoundWorkerProfile } from "@/lib/auth"

export default function BindWorkerPage() {
  const router = useRouter()
  const { currentUser, setCurrentUser, signOut } = useCurrentUser()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (hasBoundWorkerProfile(currentUser)) {
      router.replace("/")
    }
  }, [currentUser, router])

  // 绑定当前登录用户的工号，成功后更新上下文并进入首页。
  const handleBindWorkerProfile = async (workerId: string) => {
    try {
      setSaving(true)
      setSaveError(null)
      const updatedUser = await bindCurrentUserWorkerProfile({ worker_id: workerId })
      setCurrentUser(updatedUser)
      toast.success("工号绑定成功")
      router.replace("/")
    } catch (error) {
      const message = error instanceof Error ? error.message : "绑定工号失败"
      setSaveError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGuard requireCompleteProfile={false}>
      <div className="min-h-screen bg-[linear-gradient(160deg,_rgba(248,250,252,1)_0%,_rgba(240,253,244,1)_100%)] px-4 py-10">
        <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-border/70 bg-white/90 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                首次登录
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                绑定你的工号
              </h1>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {currentUser?.name || currentUser?.email || "当前账号"} 尚未完成工号绑定。绑定后才能进入首页并查看个人统计。
              </p>
            </div>

            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              退出登录
            </button>
          </div>

          <div className="mt-6">
            <WorkerProfileBinding
              description="请搜索并选择正确的员工档案，确认后完成当前登录账号与工号的绑定。"
              saving={saving}
              error={saveError}
              confirmLabel="确认绑定"
              onConfirm={handleBindWorkerProfile}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
