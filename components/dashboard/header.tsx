"use client"

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
  { id: "skills", label: "技能管理", disabled: true, badge: "即将推出" },
  { id: "mcp", label: "MCP 服务", disabled: true, badge: "即将推出" },
]

interface HeaderProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, tabId: string) => {
    // 支持 Enter 和 Space 键激活
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (!tabs.find(t => t.id === tabId)?.disabled) {
        onTabChange(tabId)
      }
    }
  }

  return (
    <header className="flex h-14 items-center border-b border-border bg-background px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <span className="font-mono text-sm font-bold text-accent-foreground">D</span>
        </div>
        <span className="font-semibold text-foreground">DevMetrics</span>
      </div>

      <nav className="ml-12 flex items-center gap-1" role="navigation" aria-label="主导航">
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
              "relative px-4 py-4 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
              tab.disabled && "cursor-not-allowed opacity-50"
            )}
            aria-label={tab.label + (tab.badge ? ` (${tab.badge})` : "")}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.badge && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {tab.badge}
                </span>
              )}
            </span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" aria-hidden="true" />
            )}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-secondary" aria-hidden="true" />
      </div>
    </header>
  )
}
