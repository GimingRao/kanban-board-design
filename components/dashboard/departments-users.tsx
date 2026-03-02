"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  fetchDepartmentsTree,
  fetchDepartmentUsers,
  createDepartment,
  deleteDepartment,
  batchUpdateUsersDepartment,
  type DepartmentNodeDto,
  type DepartmentUserDto,
} from "@/lib/api"

// 未分配部门的特殊 ID
const UNASSIGNED_DEPT_ID = -1

function buildTree(nodes: DepartmentNodeDto[]) {
  const childrenMap = new Map<number | null, DepartmentNodeDto[]>()
  nodes.forEach((node) => {
    const siblings = childrenMap.get(node.parent_id) ?? []
    siblings.push(node)
    childrenMap.set(node.parent_id, siblings)
  })
  return childrenMap
}

// 计算菜单位置，确保不超出视口
function calculateMenuPosition(x: number, y: number): { left: number; top: number } {
  const menuWidth = 120
  const menuHeight = 80
  const padding = 8

  const left = Math.min(x, window.innerWidth - menuWidth - padding)
  const top = Math.min(y, window.innerHeight - menuHeight - padding)

  return { left: Math.max(padding, left), top: Math.max(padding, top) }
}

function DepartmentTree({
  selectedId,
  onSelect,
  departments,
  onDeleteDept,
  onAddSubDept,
}: {
  selectedId: number
  onSelect: (id: number) => void
  departments: DepartmentNodeDto[]
  onDeleteDept: (id: number, name: string) => void
  onAddSubDept: (parentId: number | null, parentName: string) => void
}) {
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    dept: DepartmentNodeDto
  } | null>(null)
  const [expandedDeptIds, setExpandedDeptIds] = useState<Set<number>>(new Set())

  const tree = useMemo(() => buildTree(departments), [departments])

  useEffect(() => {
    const currentIds = new Set(departments.map((dept) => dept.id))
    setExpandedDeptIds((prev) => {
      if (prev.size === 0) {
        return new Set(currentIds)
      }

      const next = new Set<number>()
      prev.forEach((id) => {
        if (currentIds.has(id)) {
          next.add(id)
        }
      })

      currentIds.forEach((id) => {
        if (!prev.has(id)) {
          next.add(id)
        }
      })

      return next
    })
  }, [departments])

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

  const handleContextMenu = (e: React.MouseEvent, dept: DepartmentNodeDto) => {
    e.preventDefault()
    e.stopPropagation()
    const position = calculateMenuPosition(e.clientX, e.clientY)
    setContextMenu({ x: position.left, y: position.top, dept })
  }

  const handleCloseMenu = useCallback(() => setContextMenu(null), [])

  useEffect(() => {
    const handleClick = () => handleCloseMenu()
    window.addEventListener("click", handleClick, { capture: true })
    return () => window.removeEventListener("click", handleClick, { capture: true } as any)
  }, [handleCloseMenu])

  const renderBranch = (parentId: number | null, depth: number) => {
    const children = tree.get(parentId)
    if (!children) return null

    return children.map((dept) => {
      const childNodes = tree.get(dept.id) ?? []
      const hasChildren = childNodes.length > 0
      const isExpanded = expandedDeptIds.has(dept.id)

      return (
        <div key={dept.id} className="flex flex-col">
          <div
            className={cn(
              "flex items-center rounded-md text-sm transition",
              depth === 0 ? "font-semibold" : "font-normal",
              selectedId === dept.id
                ? "bg-accent text-accent-foreground"
                : "text-foreground hover:bg-muted"
            )}
            style={{ paddingLeft: 12 + depth * 16 }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(dept.id)}
                className="mr-1 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted/70"
                aria-label={isExpanded ? `收起 ${dept.name}` : `展开 ${dept.name}`}
              >
                <span className="text-xs leading-none">{isExpanded ? "▾" : "▸"}</span>
              </button>
            ) : (
              <span className="mr-1 inline-flex h-6 w-6 items-center justify-center text-muted-foreground">•</span>
            )}

            <button
              type="button"
              onClick={() => onSelect(dept.id)}
              onContextMenu={(e) => handleContextMenu(e, dept)}
              className="flex-1 rounded-md px-2 py-2 text-left"
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
    <div className="space-y-1">
      {renderBranch(null, 0)}
      {contextMenu && (
        <div
          role="menu"
          aria-label="部门操作菜单"
          className="fixed z-50 min-w-[120px] rounded-lg border border-border bg-popover p-1 shadow-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            onClick={() => {
              onAddSubDept(contextMenu.dept.id, contextMenu.dept.name)
              handleCloseMenu()
            }}
            className="w-full rounded px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            role="menuitem"
          >
            添加子部门
          </button>
          <button
            type="button"
            onClick={() => {
              onDeleteDept(contextMenu.dept.id, contextMenu.dept.name)
              handleCloseMenu()
            }}
            className="w-full rounded px-3 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
            role="menuitem"
          >
            删除部门
          </button>
        </div>
      )}
    </div>
  )
}

function UserCard({
  user,
  selected,
  onSelect,
}: {
  user: DepartmentUserDto
  selected: boolean
  onSelect: (userId: number) => void
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`user-select-${user.id}`}
            checked={selected}
            onChange={() => onSelect(user.id)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
            aria-label={`选择 ${user.name}`}
          />
          <div>
            <p className="text-sm font-semibold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.title}</p>
          </div>
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
          ID {user.id}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground pl-7">{user.email}</p>
    </div>
  )
}

function AddDepartmentDialog({
  isOpen,
  onClose,
  onConfirm,
  parentName,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string) => void
  parentName?: string
}) {
  const [name, setName] = useState("")
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return

    // 聚焦到输入框
    inputRef.current?.focus()

    // ESC 键关闭
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // 点击遮罩关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
      >
        <h3 id="dialog-title" className="text-lg font-semibold text-foreground">
          {parentName ? `添加子部门到 "${parentName}"` : "添加根部门"}
        </h3>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="请输入部门名称"
          className="mt-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              onConfirm(name.trim())
            }
          }}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  deptName,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  deptName: string
}) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    // 聚焦到确认按钮
    confirmButtonRef.current?.focus()

    // ESC 键关闭
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // 点击遮罩关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <h3 id="delete-dialog-title" className="text-lg font-semibold text-foreground">确认删除</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          确定要删除部门 "{deptName}" 吗？
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          如果该部门下有子部门或用户，删除将失败。
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            取消
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}

function BatchAssignDepartmentDialog({
  isOpen,
  onClose,
  onConfirm,
  departments,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (departmentId: number | null) => void
  departments: DepartmentNodeDto[]
}) {
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const tree = useMemo(() => buildTree(departments), [departments])

  useEffect(() => {
    if (!isOpen) return

    // ESC 键关闭
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // 点击遮罩关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const renderBranch = (parentId: number | null, depth: number) => {
    const children = tree.get(parentId)
    if (!children) return null

    return children.map((dept) => (
      <div key={dept.id} className="flex flex-col">
        <button
          type="button"
          onClick={() => setSelectedDeptId(dept.id)}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
            depth === 0 ? "font-semibold" : "font-normal",
            selectedDeptId === dept.id
              ? "bg-accent text-accent-foreground"
              : "text-foreground hover:bg-muted"
          )}
          style={{ paddingLeft: 12 + depth * 16 }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          {dept.name}
        </button>
        {renderBranch(dept.id, depth + 1)}
      </div>
    ))
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-dialog-title"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <h3 id="batch-dialog-title" className="text-lg font-semibold text-foreground">批量分配部门</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          为选中的用户选择部门
        </p>

        <div className="mt-4 max-h-60 overflow-y-auto rounded-md border border-border bg-background p-2">
          {renderBranch(null, 0)}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedDeptId)}
            disabled={selectedDeptId === null}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            确认分配
          </button>
        </div>
      </div>
    </div>
  )
}

export function DepartmentsUsers() {
  const [departments, setDepartments] = useState<DepartmentNodeDto[]>([])
  const [deptUsers, setDeptUsers] = useState<DepartmentUserDto[]>([])
  const [unassignedUsers, setUnassignedUsers] = useState<DepartmentUserDto[]>([])
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUnassigned, setShowUnassigned] = useState(false)

  // 批量选择状态
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())
  const [batchAssignDialogOpen, setBatchAssignDialogOpen] = useState(false)

  // 对话框状态
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogParentId, setAddDialogParentId] = useState<number | null>(null)
  const [addDialogParentName, setAddDialogParentName] = useState<string>("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteDialogDept, setDeleteDialogDept] = useState<{
    id: number
    name: string
  } | null>(null)

  const reloadDepartments = async () => {
    try {
      const deptTree = await fetchDepartmentsTree()
      setDepartments(deptTree)
      if (deptTree.length > 0 && selectedDeptId === null) {
        setSelectedDeptId(deptTree[0].id)
        setShowUnassigned(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败")
    }
  }

  // 加载部门树和未分配部门的用户
  useEffect(() => {
    const abortController = new AbortController()

    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const [deptTree, unassignedData] = await Promise.all([
          fetchDepartmentsTree(abortController.signal),
          fetchDepartmentUsers(UNASSIGNED_DEPT_ID, abortController.signal),
        ])
        if (!abortController.signal.aborted) {
          setDepartments(deptTree)
          setUnassignedUsers(unassignedData ?? [])

          // 默认选中第一个部门
          if (deptTree.length > 0 && selectedDeptId === null) {
            setSelectedDeptId(deptTree[0].id)
            setShowUnassigned(false)
          }
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : "加载失败")
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }
    loadData()

    return () => {
      abortController.abort()
    }
  }, [])

  // 当选中部门改变时，加载该部门的用户
  useEffect(() => {
    if (selectedDeptId === null) return

    const abortController = new AbortController()

    async function loadDeptUsers() {
      try {
        const data = await fetchDepartmentUsers(selectedDeptId!, abortController.signal)
        if (!abortController.signal.aborted) {
          setDeptUsers(data ?? [])
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : "加载失败")
        }
      }
    }
    loadDeptUsers()

    return () => {
      abortController.abort()
    }
  }, [selectedDeptId])

  const handleAddDepartment = async (name: string) => {
    try {
      const data: { name: string; parent_id?: number } = { name }
      if (addDialogParentId !== null) {
        data.parent_id = addDialogParentId
      }
      await createDepartment(data)
      setAddDialogOpen(false)
      await reloadDepartments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败")
    }
  }

  const handleDeleteDepartment = async () => {
    if (!deleteDialogDept) return
    try {
      await deleteDepartment(deleteDialogDept.id)
      setDeleteDialogOpen(false)
      setDeleteDialogDept(null)

      // 如果删除的是当前选中的部门，清空选中状态
      if (selectedDeptId === deleteDialogDept.id) {
        setSelectedDeptId(null)
        setDeptUsers([])
      }

      await reloadDepartments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败")
    }
  }

  const openAddDialog = (parentId: number | null, parentName: string) => {
    setAddDialogParentId(parentId)
    setAddDialogParentName(parentName)
    setAddDialogOpen(true)
  }

  const openDeleteDialog = (id: number, name: string) => {
    setDeleteDialogDept({ id, name })
    setDeleteDialogOpen(true)
  }

  // 处理用户选择
  const handleToggleUser = (userId: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  // 处理批量分配部门
  const handleBatchAssign = async (departmentId: number | null) => {
    if (selectedUserIds.size === 0) return
    try {
      await batchUpdateUsersDepartment({
        user_ids: Array.from(selectedUserIds),
        department_id: departmentId,
      })
      setBatchAssignDialogOpen(false)
      setSelectedUserIds(new Set())

      // 重新加载数据
      const [newUnassignedUsers, newDeptUsers] = await Promise.all([
        fetchDepartmentUsers(UNASSIGNED_DEPT_ID),
        selectedDeptId ? fetchDepartmentUsers(selectedDeptId) : Promise.resolve([]),
      ])
      setUnassignedUsers(newUnassignedUsers ?? [])
      setDeptUsers(newDeptUsers ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "批量分配失败")
    }
  }

  const selectedDept = departments.find((dept) => dept.id === selectedDeptId)
  const isUnassigned = showUnassigned

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        加载中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <>
      <div className="flex h-full gap-6 overflow-hidden p-6">
        <section className="flex w-[320px] min-h-0 flex-col gap-4 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">部门树</p>
                <p className="text-xs text-muted-foreground">
                  右键点击部门管理 · 左键点击查看成员
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {departments.length}
                </span>
                <button
                  type="button"
                  onClick={() => openAddDialog(null, "")}
                  className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                  title="添加根部门"
                >
                  + 添加
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <DepartmentTree
                selectedId={selectedDeptId ?? 0}
                onSelect={(id) => {
                  setShowUnassigned(false)
                  setSelectedDeptId(id)
                }}
                departments={departments}
                onDeleteDept={openDeleteDialog}
                onAddSubDept={openAddDialog}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowUnassigned(true)
              setSelectedDeptId(UNASSIGNED_DEPT_ID)
            }}
            className={cn(
              "rounded-xl border border-border bg-card p-4 text-left transition",
              showUnassigned ? "border-accent bg-accent/50" : "hover:bg-muted/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">未分配部门</p>
                <p className="text-xs text-muted-foreground">点击查看未分配的用户</p>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                {unassignedUsers.length}
              </span>
            </div>
          </button>
        </section>

        <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-foreground">当前部门成员</p>
              <p className="text-xs text-muted-foreground">
                {isUnassigned
                  ? "未分配部门"
                  : selectedDept
                  ? selectedDept.name
                  : "未选择部门"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isUnassigned && selectedUserIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setBatchAssignDialogOpen(true)}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
                >
                  批量分配 ({selectedUserIds.size})
                </button>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-1">
                  {isUnassigned ? "未分配" : `部门 ID ${selectedDeptId}`}
                </span>
                <span className="rounded-full bg-muted px-2 py-1">{deptUsers.length} 人</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {deptUsers.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                当前部门暂无成员
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {deptUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    selected={selectedUserIds.has(user.id)}
                    onSelect={handleToggleUser}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <AddDepartmentDialog
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onConfirm={handleAddDepartment}
        parentName={addDialogParentName}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteDepartment}
        deptName={deleteDialogDept?.name ?? ""}
      />

      <BatchAssignDepartmentDialog
        isOpen={batchAssignDialogOpen}
        onClose={() => setBatchAssignDialogOpen(false)}
        onConfirm={handleBatchAssign}
        departments={departments}
      />
    </>
  )
}
