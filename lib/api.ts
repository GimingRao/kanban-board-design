const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000"

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Request failed: ${res.status} ${res.statusText} ${text}`)
  }

  return (await res.json()) as T
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Request failed: ${res.status} ${res.statusText} ${text}`)
  }

  return (await res.json()) as T
}

async function deleteJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Request failed: ${res.status} ${res.statusText} ${text}`)
  }

  return (await res.json()) as T
}

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Request failed: ${res.status} ${res.statusText} ${text}`)
  }

  return (await res.json()) as T
}

function monthAnchorQuery(anchor?: { year?: number; month?: number }): string {
  if (!anchor?.year || !anchor?.month) return ""
  return `&year=${anchor.year}&month=${anchor.month}`
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
  // Present in global repo_id=-1 mode.
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
  },
): Promise<LeaderboardDto> {
  const months = options?.months ?? 1
  const limit = options?.limit ?? 20
  const sort = options?.sort ?? "per_workday"
  return getJson<LeaderboardDto>(
    `/repos/${repoId}/leaderboard?period=month&months=${months}&limit=${limit}&sort=${sort}${monthAnchorQuery(
      options,
    )}`,
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
): Promise<UserCommitsDto> {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 10
  return getJson<UserCommitsDto>(
    `/repos/${repoId}/users/${userId}/commits?year=${options.year}&month=${options.month}&page=${page}&page_size=${pageSize}`,
  )
}

// ==================== Departments & Users ====================

export interface DepartmentNodeDto {
  id: number
  name: string
  parent_id: number | null
}

export interface DepartmentUserDto {
  id: number
  name: string
  title: string
  email: string
  department_id: number | null
}

export interface DepartmentUsersDto {
  department_id: number
  users: DepartmentUserDto[]
}

export function fetchDepartmentsTree(): Promise<DepartmentNodeDto[]> {
  return getJson<DepartmentNodeDto[]>("/departments/tree")
}

export function fetchDepartmentUsers(
  departmentId: number,
): Promise<DepartmentUserDto[]> {
  return getJson<DepartmentUserDto[]>(`/departments/${departmentId}/users`)
}

export interface CreateDepartmentDto {
  name: string
  parent_id?: number | null
}

export interface DeleteDepartmentResponseDto {
  deleted: boolean
  id: number
}

export function createDepartment(
  data: CreateDepartmentDto,
): Promise<DepartmentNodeDto> {
  return postJson<DepartmentNodeDto>("/departments", data)
}

export function deleteDepartment(
  departmentId: number,
): Promise<DeleteDepartmentResponseDto> {
  return deleteJson<DeleteDepartmentResponseDto>(`/departments/${departmentId}`)
}

export interface UpdateUserDto {
  name?: string
  email?: string
  department_id?: number | null
}

export interface UpdatedUserDto {
  id: number
  repo_id: number
  gitlab_user_id: number
  username: string
  name: string
  email: string
  department_id: number | null
}

export function updateUser(
  userId: number,
  data: UpdateUserDto,
): Promise<UpdatedUserDto> {
  return patchJson<UpdatedUserDto>(`/users/${userId}`, data)
}

export interface BatchUpdateDepartmentDto {
  user_ids: number[]
  department_id: number | null
}

export interface BatchUpdateDepartmentResponseDto {
  updated: number
}

export function batchUpdateUsersDepartment(
  data: BatchUpdateDepartmentDto,
): Promise<BatchUpdateDepartmentResponseDto> {
  return patchJson<BatchUpdateDepartmentResponseDto>("/users/department", data)
}
