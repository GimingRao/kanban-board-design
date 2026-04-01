"use client"

/** 判断日期字符串是否为可用的 YYYY-MM-DD 日期，避免把非法参数继续传给后端。 */
function isValidDateString(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return false
  return date.toISOString().slice(0, 10) === value
}

/** 获取今天的日期字符串，统一用户详情页和跳转入口的默认结束日期口径。 */
export function getTodayString(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}

/** 对日期做天数偏移，默认用于生成最近 30 天的起始日期。 */
export function shiftDate(value: string, deltaDays: number): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  date.setDate(date.getDate() + deltaDays)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/** 统一补齐用户详情页缺失的日期参数，避免后端因必填查询参数缺失而返回 422。 */
export function resolveUserProfileDateRange(startDate?: string | null, endDate?: string | null) {
  const today = getTodayString()
  const safeEndDate = isValidDateString(endDate) ? endDate : today
  const safeStartDate = isValidDateString(startDate) ? startDate : shiftDate(safeEndDate, -29)

  return {
    startDate: safeStartDate,
    endDate: safeEndDate,
  }
}

/** 统一生成带日期范围的用户详情页链接，避免不同入口遗漏必填查询参数。 */
export function buildUserProfileHref(options: {
  userId: number
  repoId?: number
  sourceTab?: string | null
  startDate?: string | null
  endDate?: string | null
}) {
  const { startDate, endDate } = resolveUserProfileDateRange(options.startDate, options.endDate)
  const params = new URLSearchParams()
  params.set("repoId", String(options.repoId ?? -1))
  params.set("start_date", startDate)
  params.set("end_date", endDate)
  if (options.sourceTab) {
    params.set("sourceTab", options.sourceTab)
  }
  return `/users/${options.userId}?${params.toString()}`
}
