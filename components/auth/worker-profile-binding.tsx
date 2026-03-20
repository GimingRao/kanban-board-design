"use client"

import { useEffect, useRef, useState } from "react"

import { fetchWorkerProfiles, type WorkerProfileDto } from "@/lib/api"
import { cn } from "@/lib/utils"

interface WorkerProfileBindingProps {
  title?: string
  description?: string
  saving?: boolean
  error?: string | null
  confirmLabel?: string
  onConfirm: (workerId: string) => void
}

// 统一格式化部门路径，避免多个绑定入口各自维护展示逻辑。
function formatDepartmentPath(path: string[]) {
  if (path.length === 0) return "未配置部门路径"
  return path.join(" / ")
}

export function WorkerProfileBinding({
  title = "绑定工号",
  description = "请输入工号、姓名或邮箱，选择正确的员工档案后完成绑定。",
  saving = false,
  error = null,
  confirmLabel = "绑定工号",
  onConfirm,
}: WorkerProfileBindingProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [selectedProfile, setSelectedProfile] = useState<WorkerProfileDto | null>(null)
  const [results, setResults] = useState<WorkerProfileDto[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      setResults([])
      setSelectedProfile(null)
      setSearching(false)
      setSearchError(null)
      return
    }

    const abortController = new AbortController()
    const timer = window.setTimeout(() => {
      setSearching(true)
      setSearchError(null)

      fetchWorkerProfiles(
        {
          query: trimmedQuery,
          limit: 20,
        },
        abortController.signal,
      )
        .then((items) => {
          if (abortController.signal.aborted) return
          setResults(items)
          setSelectedProfile((previous) => {
            if (!previous) return previous
            return items.find((item) => item.worker_id === previous.worker_id) ?? null
          })
        })
        .catch((requestError: unknown) => {
          if (abortController.signal.aborted) return
          const message =
            requestError instanceof Error ? requestError.message : "搜索工号目录失败"
          setSearchError(message)
          setResults([])
        })
        .finally(() => {
          if (!abortController.signal.aborted) {
            setSearching(false)
          }
        })
    }, 250)

    return () => {
      abortController.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入工号、姓名或邮箱"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      {searchError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {searchError}
        </p>
      )}

      <div className="min-h-[320px] rounded-xl border border-border bg-background/50">
        {!query.trim() ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            输入关键词后显示工号目录候选项
          </div>
        ) : searching ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            正在搜索工号目录...
          </div>
        ) : results.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            未找到匹配的工号档案
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto p-2">
            <div className="space-y-2">
              {results.map((profile) => {
                const isSelected = selectedProfile?.worker_id === profile.worker_id

                return (
                  <button
                    key={profile.worker_id}
                    type="button"
                    onClick={() => setSelectedProfile(profile)}
                    className={cn(
                      "w-full rounded-lg border px-4 py-3 text-left transition",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-transparent bg-background hover:bg-muted/60",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground">{profile.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {profile.email || "未填写邮箱"}
                        </div>
                      </div>
                      <div className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
                        工号：{profile.worker_id}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      部门路径：{formatDepartmentPath(profile.department_path)}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => selectedProfile && onConfirm(selectedProfile.worker_id)}
          disabled={saving || !selectedProfile}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "绑定中..." : confirmLabel}
        </button>
      </div>
    </div>
  )
}
