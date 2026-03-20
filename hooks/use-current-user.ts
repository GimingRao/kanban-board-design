"use client"

import { useAuthContext } from "@/components/providers/auth-provider"

// 对外暴露更语义化的当前用户 Hook，减少业务组件对 Provider 实现的耦合。
export function useCurrentUser() {
  return useAuthContext()
}
