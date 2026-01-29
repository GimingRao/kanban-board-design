"use client"

import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  disabled?: boolean
}

const tabs: Tab[] = [
  { id: "dashboard", label: "看板" },
  { id: "dept-users", label: "用户与部门管理" },
  { id: "skills", label: "Skills", disabled: true },
  { id: "mcp", label: "MCP", disabled: true },
]

interface HeaderProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="flex h-14 items-center border-b border-border bg-background px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <span className="font-mono text-sm font-bold text-accent-foreground">D</span>
        </div>
        <span className="font-semibold text-foreground">DevMetrics</span>
      </div>

      <nav className="ml-12 flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              "relative px-4 py-4 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
              tab.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-secondary" />
      </div>
    </header>
  )
}
