const DEFAULT_API_BASE_URL = "http://localhost:8100"
const FALLBACK_API_BASE_URL = "http://192.168.2.121:8000"

export const AUTH_ERROR_EVENT = "app:auth-error"

export interface AuthErrorDetail {
  status: number
  code?: string
  message?: string
}

export class ApiRequestError extends Error {
  status: number
  code?: string
  payload?: unknown

  // 统一封装接口错误，便于页面层按状态码和业务码做跳转。
  constructor(status: number, message: string, options?: { code?: string; payload?: unknown }) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
    this.code = options?.code
    this.payload = options?.payload
  }
}

// 在浏览器环境抛出统一鉴权事件，供认证 Provider 处理跳转。
function notifyAuthError(detail: AuthErrorDetail) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<AuthErrorDetail>(AUTH_ERROR_EVENT, { detail }))
}

// 解析可用 API 地址列表，优先使用环境变量，其次回退到历史服务器地址。
function getApiBaseUrls(): string[] {
  const primaryBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || DEFAULT_API_BASE_URL

  return Array.from(new Set([primaryBaseUrl, FALLBACK_API_BASE_URL]))
}

// 执行请求；如果首选地址连不上，则自动回退到备用后端地址。
async function requestJson<T>(
  path: string,
  init: RequestInit,
  signal?: AbortSignal,
): Promise<T> {
  const apiBaseUrls = getApiBaseUrls()
  let lastError: unknown = null

  for (const apiBaseUrl of apiBaseUrls) {
    try {
      const res = await fetch(`${apiBaseUrl}${path}`, {
        ...init,
        credentials: "include",
        signal,
      })

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || ""
        const payload = contentType.includes("application/json")
          ? await res.json().catch(() => null)
          : await res.text().catch(() => "")
        const message =
          (typeof payload === "object" &&
            payload !== null &&
            "message" in payload &&
            typeof payload.message === "string" &&
            payload.message) ||
          (typeof payload === "string" && payload) ||
          res.statusText ||
          "Request failed"
        const code =
          typeof payload === "object" &&
          payload !== null &&
          "code" in payload &&
          typeof payload.code === "string"
            ? payload.code
            : undefined

        if (res.status === 401 || (res.status === 403 && code === "PROFILE_INCOMPLETE")) {
          notifyAuthError({
            status: res.status,
            code,
            message,
          })
        }

        throw new ApiRequestError(res.status, message, { code, payload })
      }

      if (res.status === 204) {
        return undefined as T
      }

      return (await res.json()) as T
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error
      }
      // 已收到后端的 HTTP 响应时直接抛出业务错误，避免被备用地址的网络错误覆盖。
      if (error instanceof ApiRequestError) {
        throw error
      }
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed")
}

// 发起 GET 请求，并在连接失败时自动尝试备用服务器。
async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return requestJson<T>(
    path,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
    signal,
  )
}

// 发起 POST 请求，并在连接失败时自动尝试备用服务器。
async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return requestJson<T>(
    path,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    },
    signal,
  )
}

// 发起 DELETE 请求，并在连接失败时自动尝试备用服务器。
async function deleteJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return requestJson<T>(
    path,
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
    },
    signal,
  )
}

// 发起 PATCH 请求，并在连接失败时自动尝试备用服务器。
async function patchJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return requestJson<T>(
    path,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    },
    signal,
  )
}

function monthAnchorQuery(anchor?: { year?: number; month?: number }): string {
  if (!anchor?.year || !anchor?.month) return ""
  return `&year=${anchor.year}&month=${anchor.month}`
}

// 统一拼接开始/结束日期查询参数，供支持特定时间范围的接口复用。
function dateRangeQuery(range?: { start_date?: string; end_date?: string }): string {
  const params = new URLSearchParams()
  if (range?.start_date) params.set("start_date", range.start_date)
  if (range?.end_date) params.set("end_date", range.end_date)
  const query = params.toString()
  return query ? `&${query}` : ""
}

export interface RepoDto {
  id: number
  name: string
  repo_key: string
  web_url?: string | null
}

export interface MonthlySeriesItemDto {
  month: string
  total_added: number
  total_deleted: number
  net_lines: number
  commits: number
  active_users: number
  workdays: number
  avg_per_person: number
  avg_per_day: number
}

export interface MonthlyMetricsDto {
  repo_id: number
  months: number
  series: MonthlySeriesItemDto[]
  summary: {
    avg_per_person: number
    avg_per_day: number
  }
}

export interface LeaderboardItemDto {
  rank: number
  user_id: number
  name: string
  username?: string | null
  commits: number
  lines_added: number
  lines_removed: number
  net_lines: number
  workdays: number
  added_per_workday: number
  removed_per_workday: number
  department_id?: number | null
  department_name?: string | null
}

export interface LeaderboardDto {
  repo_id: number
  period: string
  months: number
  sort: string
  workdays: number
  items: LeaderboardItemDto[]
}

export interface TotalsDto {
  repo_id: number
  period: string
  months: number
  total_added: number
  total_deleted: number
  net_lines: number
  commits: number
  active_users: number
}

export interface UserCommitItemDto {
  id: number
  commit_sha: string
  committed_at: string | null
  additions: number
  deletions: number
  files_changed: number
  message?: string | null
  repo_id?: number
  repo_name?: string | null
  repo_web_url?: string | null
}

export interface UserCommitsDto {
  repo_id: number
  user_id: number
  year: number
  month: number
  page: number
  page_size: number
  total: number
  total_pages: number
  items: UserCommitItemDto[]
}

export interface UserProfileCommitItemDto {
  id: number
  commit_sha?: string | null
  commit_url?: string | null
  committed_at: string | null
  additions: number
  deletions: number
  files_changed: number
  message: string
  ai_lines: number
  human_lines: number
  ai_ratio: number
  repo_id: number
  repo_name: string
  repo_web_url?: string | null
}

export interface UserProfileAIRecordItemDto {
  id: number
  event_id: string
  ai_tool: string
  timestamp: string | null
  file_path: string
  status: "pending" | "partially_matched" | "fully_matched" | string
  lines_added_total: number
  diff_preview: string
  diff_truncated: boolean
}

export interface UserProfileDto {
  repo_id: number
  user: {
    id: number
    name: string
    username?: string | null
    git_name?: string | null
    department: {
      id: number | null
      name: string
    }
  }
  period: string
  summary: {
    commits: number
    total_lines: number
    ai_lines: number
    human_lines: number
    ai_ratio: number
  }
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
  recent_commits: UserProfileCommitItemDto[]
  ai_records_pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
  recent_ai_records: UserProfileAIRecordItemDto[]
}

export function fetchRepos(): Promise<RepoDto[]> {
  return getJson<RepoDto[]>("/repos")
}

export function fetchMonthlyMetrics(
  repoId: number,
  months = 12,
  anchor?: { year?: number; month?: number },
): Promise<MonthlyMetricsDto> {
  return getJson<MonthlyMetricsDto>(
    `/repos/${repoId}/metrics/monthly?months=${months}${monthAnchorQuery(anchor)}`,
  )
}

export function fetchLeaderboard(
  repoId: number,
  options?: {
    months?: number
    limit?: number
    sort?: "net" | "added" | "commits" | "per_workday"
    year?: number
    month?: number
    department_id?: number | null
  },
): Promise<LeaderboardDto> {
  const months = options?.months ?? 1
  const limit = options?.limit ?? 20
  const sort = options?.sort ?? "per_workday"
  const departmentId = options?.department_id
  const departmentQuery = departmentId !== undefined ? `&department_id=${departmentId}` : ""
  return getJson<LeaderboardDto>(
    `/repos/${repoId}/leaderboard?period=month&months=${months}&limit=${limit}&sort=${sort}${monthAnchorQuery(
      options,
    )}${departmentQuery}`,
  )
}

export function fetchTotals(
  repoId: number,
  months = 1,
  anchor?: { year?: number; month?: number },
): Promise<TotalsDto> {
  return getJson<TotalsDto>(
    `/repos/${repoId}/totals?period=month&months=${months}${monthAnchorQuery(anchor)}`,
  )
}

export function fetchUserCommits(
  repoId: number,
  userId: number,
  options: { year: number; month: number; page?: number; pageSize?: number },
  signal?: AbortSignal,
): Promise<UserCommitsDto> {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 10
  return getJson<UserCommitsDto>(
    `/repos/${repoId}/users/${userId}/commits?year=${options.year}&month=${options.month}&page=${page}&page_size=${pageSize}`,
    signal,
  )
}

export function fetchUserProfile(
  repoId: number,
  userId: number,
  options?: {
    year?: number
    month?: number
    start_date?: string
    end_date?: string
    page?: number
    pageSize?: number
    commitPage?: number
    commitPageSize?: number
    aiPage?: number
    aiPageSize?: number
  },
  signal?: AbortSignal,
): Promise<UserProfileDto> {
  const params = new URLSearchParams()
  if (options?.year) params.set("year", String(options.year))
  if (options?.month) params.set("month", String(options.month))
  if (options?.start_date) params.set("start_date", options.start_date)
  if (options?.end_date) params.set("end_date", options.end_date)
  if (options?.page) params.set("page", String(options.page))
  if (options?.pageSize) params.set("page_size", String(options.pageSize))
  if (options?.commitPage) params.set("commit_page", String(options.commitPage))
  if (options?.commitPageSize) params.set("commit_page_size", String(options.commitPageSize))
  if (options?.aiPage) params.set("ai_page", String(options.aiPage))
  if (options?.aiPageSize) params.set("ai_page_size", String(options.aiPageSize))
  const query = params.toString()
  return getJson<UserProfileDto>(
    `/repos/${repoId}/users/${userId}/profile${query ? `?${query}` : ""}`,
    signal,
  )
}

export interface DepartmentNodeDto {
  id: number
  name: string
  parent_id: number | null
  path: string
}

export interface DepartmentUserDto {
  id: number
  name: string
  email: string
  department_id: number | null
  worker_id?: string | null
}

export interface DepartmentUsersDto {
  department_id: number
  users: DepartmentUserDto[]
}

export interface WorkerProfileDto {
  worker_id: string
  name: string
  email: string
  department_path: string[]
}

export interface CurrentUserDto {
  id: number
  name?: string | null
  email?: string | null
  git_name?: string | null
  worker_id?: string | null
  status?: string | null
  must_change_password?: boolean
  has_bound_worker_profile?: boolean
  login_hint?: string | null
  created?: boolean
}

export interface ApiEnvelopeDto<T> {
  code: string
  message: string
  data: T
}

export interface LoginResolutionRequiredDto {
  worker_id: string
}

export interface LoginCandidateDto {
  id: number
  name?: string | null
  email?: string | null
  git_name?: string | null
  has_commits: boolean
  commit_count: number
  last_commit_at?: string | null
}

export interface LoginCandidatesDto {
  items: LoginCandidateDto[]
}

export interface ResolveLoginDto {
  worker_id: string
  password: string
  action: "claim_existing" | "create_new"
  candidate_user_id?: number
}

// 认证相关接口统一走 /api/v1 前缀，避免与现有业务接口路径混淆。
const AUTH_API_PREFIX = "/api/v1/auth"

// 兼容后端统一返回的 code/message/data 包装结构。
function unwrapApiEnvelope<T>(response: ApiEnvelopeDto<T>): T {
  return response.data
}

export function fetchDepartmentsTree(signal?: AbortSignal): Promise<DepartmentNodeDto[]> {
  return getJson<DepartmentNodeDto[]>("/departments/tree", signal)
}

export function fetchDepartmentUsers(
  departmentId: number,
  signal?: AbortSignal,
): Promise<DepartmentUserDto[]> {
  return getJson<DepartmentUserDto[]>(`/departments/${departmentId}/users`, signal)
}

export function createDepartment(
  data: { name: string; parent_id?: number | null },
  signal?: AbortSignal,
): Promise<DepartmentNodeDto> {
  return postJson<DepartmentNodeDto>("/departments", data, signal)
}

export function deleteDepartment(
  departmentId: number,
  signal?: AbortSignal,
): Promise<{ success: boolean }> {
  return deleteJson<{ success: boolean }>(`/departments/${departmentId}`, signal)
}

export function batchUpdateUsersDepartment(
  data: { user_ids: number[]; department_id: number | null },
  signal?: AbortSignal,
): Promise<{ updated: number }> {
  return patchJson<{ updated: number }>("/users/department", data, signal)
}

export function fetchWorkerProfiles(
  params: { query?: string; limit?: number },
  signal?: AbortSignal,
): Promise<WorkerProfileDto[]> {
  const searchParams = new URLSearchParams()
  if (params.query?.trim()) {
    searchParams.set("query", params.query.trim())
  }
  if (params.limit) {
    searchParams.set("limit", String(params.limit))
  }
  const query = searchParams.toString()
  return getJson<{ items: WorkerProfileDto[] }>(
    `/worker-profiles${query ? `?${query}` : ""}`,
    signal,
  ).then((response) => response.items ?? [])
}

export function bindUserWorkerProfile(
  userId: number,
  data: { worker_id: string },
  signal?: AbortSignal,
): Promise<DepartmentUserDto> {
  return patchJson<DepartmentUserDto>(`/users/${userId}/worker-profile`, data, signal)
}

export function login(
  data: { worker_id: string; password: string },
  signal?: AbortSignal,
): Promise<CurrentUserDto> {
  return postJson<ApiEnvelopeDto<CurrentUserDto>>(`${AUTH_API_PREFIX}/login`, data, signal).then(
    unwrapApiEnvelope,
  )
}

// 搜索尚未绑定工号的历史账号，供登录分流页认领旧账号使用。
export function searchLoginCandidates(
  query: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<LoginCandidateDto[]> {
  const searchParams = new URLSearchParams()
  if (query.trim()) {
    searchParams.set("query", query.trim())
  }
  searchParams.set("limit", String(limit))
  const searchQuery = searchParams.toString()

  return getJson<ApiEnvelopeDto<LoginCandidatesDto>>(
    `${AUTH_API_PREFIX}/login/candidates${searchQuery ? `?${searchQuery}` : ""}`,
    signal,
  ).then((response) => response.data.items ?? [])
}

// 在工号未绑定时执行认领旧账号或直接新建账号，并返回已登录用户信息。
export function resolveLogin(
  data: ResolveLoginDto,
  signal?: AbortSignal,
): Promise<CurrentUserDto> {
  return postJson<ApiEnvelopeDto<CurrentUserDto>>(
    `${AUTH_API_PREFIX}/login/resolve`,
    data,
    signal,
  ).then(unwrapApiEnvelope)
}

export function logout(signal?: AbortSignal): Promise<{ success: boolean }> {
  return postJson<{ success: boolean }>(`${AUTH_API_PREFIX}/logout`, {}, signal)
}

export function fetchCurrentUser(signal?: AbortSignal): Promise<CurrentUserDto> {
  return getJson<ApiEnvelopeDto<CurrentUserDto>>(`${AUTH_API_PREFIX}/me`, signal).then(
    unwrapApiEnvelope,
  )
}

export function bindCurrentUserWorkerProfile(
  data: { worker_id: string },
  signal?: AbortSignal,
): Promise<CurrentUserDto> {
  return patchJson<ApiEnvelopeDto<CurrentUserDto>>(
    `${AUTH_API_PREFIX}/me/worker-profile`,
    data,
    signal,
  ).then(unwrapApiEnvelope)
}

export function changeCurrentUserPassword(
  data: { current_password: string; new_password: string },
  signal?: AbortSignal,
): Promise<{ success: boolean; require_relogin?: boolean }> {
  return postJson<{ success: boolean; require_relogin?: boolean }>(
    `${AUTH_API_PREFIX}/me/change-password`,
    data,
    signal,
  )
}

export function fetchMyProfile(
  options?: {
    year?: number
    month?: number
    start_date?: string
    end_date?: string
    page?: number
    pageSize?: number
  },
  signal?: AbortSignal,
): Promise<UserProfileDto> {
  const params = new URLSearchParams()
  if (options?.year) params.set("year", String(options.year))
  if (options?.month) params.set("month", String(options.month))
  if (options?.start_date) params.set("start_date", options.start_date)
  if (options?.end_date) params.set("end_date", options.end_date)
  if (options?.page) params.set("page", String(options.page))
  if (options?.pageSize) params.set("page_size", String(options.pageSize))
  const query = params.toString()
  return getJson<UserProfileDto>(`${AUTH_API_PREFIX}/me/profile${query ? `?${query}` : ""}`, signal)
}

export interface AIRatioLeaderboardDto {
  view: "department" | "user"
  period: string
  sort: "ai_ratio" | "ai_lines" | "total_lines"
  items: AIRatioLeaderboardItemDto[]
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
}

export interface AIRatioLeaderboardItemDto {
  rank: number
  department?: {
    id: number
    name: string
    path: string
    level: number
  }
  user?: {
    id: number
    name: string
    git_name?: string | null
    department?: { id: number; name: string }
  }
  metrics: {
    total_lines: number
    ai_lines: number
    human_lines: number
    ai_ratio: number
  }
}

export interface AICommitsDto {
  view: "department" | "repo"
  period: string
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
  items: AICommitItemDto[]
}

export interface AICommitItemDto {
  commit: {
    id: number
    sha: string
    message: string
    committed_at: string
    url?: string | null
  }
  user: {
    id: number
    name: string
    username: string
    department?: { id: number; name: string }
  }
  repo?: {
    id: number
    name: string
    web_url: string
  }
  stats: {
    additions: number
    files_changed: number
    ai_lines: number
    human_lines: number
    ai_ratio: number
  }
}

export function fetchAIRatioDepartmentLeaderboard(
  options: {
    repo_id?: number
    parent_id?: number
    level?: number
    sort?: "ai_ratio" | "ai_lines" | "total_lines"
    year?: number
    month?: number
    start_date?: string
    end_date?: string
    page?: number
    page_size?: number
  },
): Promise<AIRatioLeaderboardDto> {
  const repoId = options.repo_id ?? -1
  const page = options.page ?? 1
  const pageSize = options.page_size ?? 20
  const sort = options.sort ?? "ai_ratio"
  const levelQuery = options.level !== undefined ? `&level=${options.level}` : ""
  const parentQuery = options.parent_id !== undefined ? `&parent_id=${options.parent_id}` : ""

  return getJson<AIRatioLeaderboardDto>(
    `/leaderboards/departments?repo_id=${repoId}&sort=${sort}&page=${page}&page_size=${pageSize}${dateRangeQuery(
      options,
    )}${monthAnchorQuery(options)}${levelQuery}${parentQuery}`,
  )
}

export function fetchAIRatioUserLeaderboard(
  options: {
    repo_id?: number
    department_id?: number
    sort?: "ai_ratio" | "ai_lines" | "total_lines"
    year?: number
    month?: number
    start_date?: string
    end_date?: string
    page?: number
    page_size?: number
  },
): Promise<AIRatioLeaderboardDto> {
  const repoId = options.repo_id ?? -1
  const page = options.page ?? 1
  const pageSize = options.page_size ?? 20
  const sort = options.sort ?? "ai_ratio"
  const deptQuery =
    options.department_id !== undefined && options.department_id !== null
      ? `&department_id=${options.department_id}`
      : ""

  return getJson<AIRatioLeaderboardDto>(
    `/leaderboards/users?repo_id=${repoId}&sort=${sort}&page=${page}&page_size=${pageSize}${dateRangeQuery(
      options,
    )}${monthAnchorQuery(options)}${deptQuery}`,
  )
}

export function fetchAICommitsByDepartment(
  options: {
    repo_id?: number
    department_id: number
    year?: number
    month?: number
    start_date?: string
    end_date?: string
    page?: number
    page_size?: number
  },
): Promise<AICommitsDto> {
  const repoId = options.repo_id ?? -1
  const page = options.page ?? 1
  const pageSize = options.page_size ?? 20

  return getJson<AICommitsDto>(
    `/commits/by-department?repo_id=${repoId}&department_id=${options.department_id}&page=${page}&page_size=${pageSize}${dateRangeQuery(
      options,
    )}${monthAnchorQuery(options)}`,
  )
}

export function fetchAICommitsByRepo(
  options: {
    repo_id: number
    department_id?: number
    year?: number
    month?: number
    start_date?: string
    end_date?: string
    page?: number
    page_size?: number
  },
): Promise<AICommitsDto> {
  const page = options.page ?? 1
  const pageSize = options.page_size ?? 20
  const deptQuery = options.department_id !== undefined ? `&department_id=${options.department_id}` : ""

  return getJson<AICommitsDto>(
    `/commits/by-repo?repo_id=${options.repo_id}&page=${page}&page_size=${pageSize}${dateRangeQuery(
      options,
    )}${monthAnchorQuery(options)}${deptQuery}`,
  )
}

export function fetchAICommitsByUser(
  options: {
    repo_id?: number
    user_id: number
    year?: number
    month?: number
    start_date?: string
    end_date?: string
    page?: number
    page_size?: number
  },
): Promise<AICommitsDto> {
  const repoId = options.repo_id ?? -1
  const page = options.page ?? 1
  const pageSize = options.page_size ?? 20

  return getJson<AICommitsDto>(
    `/commits/by-user?repo_id=${repoId}&user_id=${options.user_id}&page=${page}&page_size=${pageSize}${dateRangeQuery(
      options,
    )}${monthAnchorQuery(options)}`,
  )
}

export interface DataPointMetric {
  year: number
  month: number
  day: number
  date: string
  total_lines: number
  ai_lines: number
  human_lines: number
  ai_ratio: number
  commits_count: number
  active_users: number
  workdays: number
}

export interface SummaryMetrics {
  total_lines: number
  ai_lines: number
  human_lines: number
  ai_ratio: number
  total_commits: number
  avg_active_users: number
}

export interface RepoTrendResponse {
  entity: {
    type: "repo"
    id: number
    name: string
  }
  period: {
    start: string
    end: string
  }
  data_points: DataPointMetric[]
  summary: SummaryMetrics
}

export interface DepartmentTrendResponse {
  entity: {
    type: "department"
    id: number
    name: string
  }
  period: {
    start: string
    end: string
  }
  data_points: DataPointMetric[]
  summary: SummaryMetrics
}

export interface UserTrendResponse {
  entity: {
    type: "user"
    id: number
    name: string
    department_name: string
  }
  period: {
    start: string
    end: string
  }
  data_points: DataPointMetric[]
  summary: SummaryMetrics
}

export function fetchRepoTrend(
  options: {
    repo_id?: number
    start_date: string
    end_date: string
  },
): Promise<RepoTrendResponse> {
  const repoId = options.repo_id ?? -1
  return getJson<RepoTrendResponse>(
    `/metrics/repos/trend?repo_id=${repoId}&start_date=${options.start_date}&end_date=${options.end_date}`,
  )
}

export function fetchDepartmentTrend(
  options: {
    department_id: number
    start_date: string
    end_date: string
  },
): Promise<DepartmentTrendResponse> {
  return getJson<DepartmentTrendResponse>(
    `/metrics/departments/trend?department_id=${options.department_id}&start_date=${options.start_date}&end_date=${options.end_date}`,
  )
}

export function fetchUserTrend(
  options: {
    user_id: number
    repo_id?: number
    start_date: string
    end_date: string
  },
): Promise<UserTrendResponse> {
  const repoId = options.repo_id ?? -1
  return getJson<UserTrendResponse>(
    `/metrics/users/trend?user_id=${options.user_id}&repo_id=${repoId}&start_date=${options.start_date}&end_date=${options.end_date}`,
  )
}
