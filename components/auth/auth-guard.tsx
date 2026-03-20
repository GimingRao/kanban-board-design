"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useCurrentUser } from "@/hooks/use-current-user"
import { BIND_WORKER_PATH, hasBoundWorkerProfile, LOGIN_PATH } from "@/lib/auth"

interface AuthGuardProps {
  children: ReactNode
  requireCompleteProfile?: boolean
}

// 保护需要登录的页面，并在资料未完成时引导用户先绑定工号。
export function AuthGuard({ children, requireCompleteProfile = true }: AuthGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, status } = useCurrentUser()

  useEffect(() => {
    if (status === "loading") return

    if (!currentUser) {
      router.replace(LOGIN_PATH)
      return
    }

    if (requireCompleteProfile && !hasBoundWorkerProfile(currentUser) && pathname !== BIND_WORKER_PATH) {
      router.replace(BIND_WORKER_PATH)
    }
  }, [currentUser, pathname, requireCompleteProfile, router, status])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        正在校验登录状态...
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  if (requireCompleteProfile && !hasBoundWorkerProfile(currentUser) && pathname !== BIND_WORKER_PATH) {
    return null
  }

  return <>{children}</>
}
