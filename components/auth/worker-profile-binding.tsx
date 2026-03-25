"use client"

import { useEffect, useRef, useState } from "react"

interface WorkerProfileBindingProps {
  title?: string
  description?: string
  saving?: boolean
  error?: string | null
  confirmLabel?: string
  onConfirm: (workerId: string) => void
}

// 兼容旧绑定入口：仅负责收集工号输入，不再依赖人员目录搜索。
export function WorkerProfileBinding({
  title = "绑定工号",
  description = "请输入工号完成绑定。系统会校验工号格式以及是否已被其他账号占用。",
  saving = false,
  error = null,
  confirmLabel = "绑定工号",
  onConfirm,
}: WorkerProfileBindingProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [workerId, setWorkerId] = useState("")

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 提交当前输入的工号，交由页面层统一处理绑定结果和错误提示。
  const handleConfirm = () => {
    const trimmedWorkerId = workerId.trim()
    if (!trimmedWorkerId) return
    onConfirm(trimmedWorkerId)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={workerId}
        onChange={(event) => setWorkerId(event.target.value)}
        placeholder="请输入工号，例如 001508"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="rounded-xl border border-border bg-background/50 px-4 py-3 text-sm text-muted-foreground">
        当前兼容入口已调整为直接输入工号绑定，不再搜索人员目录。
      </div>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving || !workerId.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "绑定中..." : confirmLabel}
        </button>
      </div>
    </div>
  )
}
