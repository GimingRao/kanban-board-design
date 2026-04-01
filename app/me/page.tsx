"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { AuthGuard } from "@/components/auth/auth-guard"
import { useCurrentUser } from "@/hooks/use-current-user"
import { buildUserProfileHref } from "@/lib/user-profile-navigation"

// 将历史个人主页入口统一重定向到现有用户详情页，避免重复维护两套页面。
function MeRedirectContent() {
  const router = useRouter()
  const { currentUser } = useCurrentUser()

  useEffect(() => {
    if (!currentUser?.id) return
    router.replace(buildUserProfileHref({ userId: currentUser.id, repoId: -1 }))
  }, [currentUser, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      正在跳转到个人主页...
    </div>
  )
}

export default function MyProfilePage() {
  return (
    <AuthGuard>
      <MeRedirectContent />
    </AuthGuard>
  )
}
