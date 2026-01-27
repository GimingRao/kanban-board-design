"use client"

import React from "react"

import { cn } from "@/lib/utils"
import { GitCommit } from "lucide-react"

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  disabled?: boolean
}

const menuItems: MenuItem[] = [
  { 
    id: "git-commits", 
    label: "Git 代码提交量", 
    icon: <GitCommit className="h-4 w-4" /> 
  },
]

interface SidebarProps {
  activeMenu: string
  onMenuChange: (menuId: string) => void
}

export function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  return (
    <aside className="flex w-56 flex-col border-r border-border bg-sidebar">
      <div className="p-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          统计类型
        </h3>
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.disabled && onMenuChange(item.id)}
              disabled={item.disabled}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activeMenu === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                item.disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}
