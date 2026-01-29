"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { DepartmentsUsers } from "@/components/dashboard/departments-users"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [activeMenu, setActiveMenu] = useState("git-commits")

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 overflow-hidden">
        {activeTab === "dashboard" && (
          <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />
        )}

        <main className="flex-1 overflow-hidden">
          {activeTab === "dashboard" && activeMenu === "git-commits" && (
            <DashboardContent />
          )}

          {activeTab === "dept-users" && (
            <DepartmentsUsers />
          )}

          {activeTab === "skills" && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>Skills 功能即将上线...</p>
            </div>
          )}

          {activeTab === "mcp" && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>MCP 功能即将上线...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
