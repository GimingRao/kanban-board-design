import type { CurrentUserDto } from "@/lib/api"

export const LOGIN_PATH = "/login"
export const BIND_WORKER_PATH = "/bind-worker"
export const ME_PATH = "/me"
export const HOME_PATH = "/"

// 统一判断当前用户是否已经完成工号绑定。
export function hasBoundWorkerProfile(user: CurrentUserDto | null | undefined) {
  if (!user) return false
  return Boolean(user.has_bound_worker_profile || user.worker_id)
}

// 统一计算登录后的落点，避免页面各自复制状态判断。
export function getPostLoginPath(user: CurrentUserDto | null | undefined) {
  if (!user) return LOGIN_PATH
  return hasBoundWorkerProfile(user) ? HOME_PATH : BIND_WORKER_PATH
}

// 判断当前路由是否允许未登录访问。
export function isPublicPath(pathname: string) {
  return pathname === LOGIN_PATH
}

// 判断当前路由是否是仅允许资料未完成用户进入的页面。
export function isBindWorkerPath(pathname: string) {
  return pathname === BIND_WORKER_PATH
}
