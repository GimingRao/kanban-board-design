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
