"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"

import {
  AUTH_ERROR_EVENT,
  ApiRequestError,
  fetchCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  type AuthErrorDetail,
  type CurrentUserDto,
} from "@/lib/api"
import { BIND_WORKER_PATH, getPostLoginPath, isBindWorkerPath, isPublicPath, LOGIN_PATH } from "@/lib/auth"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  currentUser: CurrentUserDto | null
  status: AuthStatus
  refreshCurrentUser: () => Promise<CurrentUserDto | null>
  setCurrentUser: (user: CurrentUserDto | null) => void
  signIn: (email: string, password: string) => Promise<CurrentUserDto>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// 统一管理当前登录用户与鉴权跳转，避免页面层重复拉取用户状态。
export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUserDto | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")

  // 拉取当前登录用户，并把 401/403 状态归一到上下文中。
  const refreshCurrentUser = async () => {
    try {
      const user = await fetchCurrentUser()
      setCurrentUser(user)
      setStatus("authenticated")
      return user
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        setCurrentUser(null)
        setStatus("unauthenticated")
        return null
      }
      if (
        error instanceof ApiRequestError &&
        error.status === 403 &&
        error.code === "PROFILE_INCOMPLETE"
      ) {
        setStatus("authenticated")
        return currentUser
      }
      throw error
    }
  }

  useEffect(() => {
    let cancelled = false

    refreshCurrentUser()
      .catch(() => {
        if (cancelled) return
        setCurrentUser(null)
        setStatus("unauthenticated")
      })
      .finally(() => {
        if (cancelled) return
        setStatus((previous) => (previous === "loading" ? "unauthenticated" : previous))
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    // 监听 API 层抛出的统一鉴权事件，集中处理重定向。
    const handleAuthError = (event: Event) => {
      const detail = (event as CustomEvent<AuthErrorDetail>).detail
      if (!detail) return

      if (detail.status === 401) {
        setCurrentUser(null)
        setStatus("unauthenticated")
        if (!isPublicPath(pathname)) {
          router.replace(LOGIN_PATH)
        }
        return
      }

      if (detail.status === 403 && detail.code === "PROFILE_INCOMPLETE") {
        setStatus("authenticated")
        if (!isBindWorkerPath(pathname)) {
          router.replace(BIND_WORKER_PATH)
        }
      }
    }

    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError as EventListener)
    return () => {
      window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError as EventListener)
    }
  }, [pathname, router])

  // 登录成功后更新上下文，并按工号绑定状态跳转到对应页面。
  const signIn = async (email: string, password: string) => {
    const user = await apiLogin({ email, password })
    setCurrentUser(user)
    setStatus("authenticated")
    router.replace(getPostLoginPath(user))
    return user
  }

  // 退出登录后清空本地状态，并统一回到登录页。
  const signOut = async () => {
    try {
      await apiLogout()
    } finally {
      setCurrentUser(null)
      setStatus("unauthenticated")
      router.replace(LOGIN_PATH)
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      status,
      refreshCurrentUser,
      setCurrentUser,
      signIn,
      signOut,
    }),
    [currentUser, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 读取当前登录用户上下文，供页面与组件复用。
export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider")
  }
  return context
}
