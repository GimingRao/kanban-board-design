"use client"

import { BarChart3, CircleDot } from "lucide-react"

import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  disabled?: boolean
  badge?: string
}

const tabs: Tab[] = [
  { id: "ai-ratio", label: "AI 代码占比" },
  { id: "dept-users", label: "用户与部门管理" },
  { id: "skills", label: "技能管理" },
  { id: "mcp-catalog", label: "MCP 市场" },
  { id: "mcp", label: "MCP 服务" },
]

interface HeaderProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  // 统一处理键盘激活行为，保证导航按钮可访问。
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, tabId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (!tabs.find((t) => t.id === tabId)?.disabled) {
        onTabChange(tabId)
      }
    }
  }

  return (
    <header className="sticky top-0 z-40 px-4 pb-4 pt-4 sm:px-6">
      <div className="glass-panel flex min-h-18 flex-col gap-4 rounded-[1.75rem] px-4 py-4 sm:px-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-foreground">DevMetrics</span>
              <span className="hero-chip hidden sm:inline-flex">
                <CircleDot className="h-3.5 w-3.5 text-accent" />
                开发效能总览
              </span>
            </div>
            <p className="truncate text-sm text-muted-foreground">代码活跃度、AI 贡献率与研发资产管理</p>
          </div>
        </div>

        <nav
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:justify-center"
          role="navigation"
          aria-label="主导航"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              disabled={tab.disabled}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-disabled={tab.disabled}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={cn(
                "relative inline-flex h-11 items-center rounded-full px-4 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                  : "bg-transparent text-muted-foreground hover:bg-secondary/90 hover:text-foreground",
                tab.disabled && "cursor-not-allowed opacity-50",
              )}
              aria-label={tab.label + (tab.badge ? ` (${tab.badge})` : "")}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.badge && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px]",
                      activeTab === tab.id
                        ? "bg-white/20 text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>

        <div className="hidden lg:flex lg:items-center lg:justify-end">
          <div className="hero-chip">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            实时数据视图
          </div>
        </div>
      </div>
    </header>
  )
}
