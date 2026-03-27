"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, ChevronDown, ChevronRight, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { fetchDepartmentsTree, type DepartmentNodeDto } from "@/lib/api"

function buildChildrenMap(nodes: DepartmentNodeDto[]) {
  const childrenMap = new Map<number | null, DepartmentNodeDto[]>()
  nodes.forEach((node) => {
    const siblings = childrenMap.get(node.parent_id) ?? []
    siblings.push(node)
    childrenMap.set(node.parent_id, siblings)
  })
  return childrenMap
}

function buildNodeMap(nodes: DepartmentNodeDto[]) {
  return new Map(nodes.map((node) => [node.id, node] as const))
}

export interface DepartmentTreeSelectorProps {
  value: number | null
  onChange: (departmentId: number | null) => void
  className?: string
}

export function DepartmentTreeSelector({
  value,
  onChange,
  className,
}: DepartmentTreeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [departments, setDepartments] = useState<DepartmentNodeDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedDeptIds, setExpandedDeptIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchDepartmentsTree()
      .then((items) => {
        if (cancelled) return
        setDepartments(items)
        const expandableIds = new Set<number>()
        items.forEach((item) => {
          if (items.some((candidate) => candidate.parent_id === item.id)) {
            expandableIds.add(item.id)
          }
        })
        setExpandedDeptIds(expandableIds)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "加载部门树失败")
        setDepartments([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const childrenMap = useMemo(() => buildChildrenMap(departments), [departments])
  const nodeMap = useMemo(() => buildNodeMap(departments), [departments])
  const selectedDepartment = value !== null ? nodeMap.get(value) ?? null : null

  const toggleExpand = (deptId: number) => {
    setExpandedDeptIds((prev) => {
      const next = new Set(prev)
      if (next.has(deptId)) {
        next.delete(deptId)
      } else {
        next.add(deptId)
      }
      return next
    })
  }

  const renderBranch = (parentId: number | null, depth: number) => {
    const children = childrenMap.get(parentId)
    if (!children || children.length === 0) return null

    return children.map((dept) => {
      const childNodes = childrenMap.get(dept.id) ?? []
      const hasChildren = childNodes.length > 0
      const isExpanded = expandedDeptIds.has(dept.id)
      const isSelected = value === dept.id

      return (
        <div key={dept.id} className="flex flex-col">
          <div
            className={cn(
              "flex items-center rounded-lg text-sm transition",
              isSelected ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted",
            )}
            style={{ paddingLeft: 12 + depth * 16 }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(dept.id)}
                className="mr-1 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-background/70"
                aria-label={isExpanded ? `收起 ${dept.name}` : `展开 ${dept.name}`}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="mr-1 inline-flex h-6 w-6 items-center justify-center text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                onChange(dept.id)
                setOpen(false)
              }}
              className="flex-1 rounded-lg px-2 py-2 text-left"
            >
              {dept.name}
            </button>
          </div>

          {hasChildren && isExpanded ? renderBranch(dept.id, depth + 1) : null}
        </div>
      )
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 min-w-[220px] justify-between rounded-full border-border/70 bg-card/85 px-4 shadow-none",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm">
              {selectedDepartment?.name ?? "全部部门"}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] rounded-2xl p-3">
        <div className="flex items-center justify-between gap-2 px-1 pb-3">
          <div>
            <div className="text-sm font-semibold text-foreground">选择部门</div>
            <div className="text-xs text-muted-foreground">选择后仅展示该部门及其子部门成员</div>
          </div>
          {value !== null ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
              className="h-8 rounded-full px-3 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
              清空
            </Button>
          ) : null}
        </div>

        <div className="mb-2 rounded-xl border border-border/70 bg-secondary/20 p-1">
          <Button
            type="button"
            variant={value === null ? "secondary" : "ghost"}
            className="h-9 w-full justify-start rounded-lg px-3"
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
          >
            全部部门
          </Button>
        </div>

        <ScrollArea className="h-[320px] pr-2">
          {loading ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              正在加载部门树...
            </div>
          ) : error ? (
            <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-3 text-center text-sm text-destructive">
              {error}
            </div>
          ) : (
            <div className="space-y-1 py-1">{renderBranch(null, 0)}</div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
