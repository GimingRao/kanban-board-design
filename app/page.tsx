"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { DepartmentsUsers } from "@/components/dashboard/departments-users"
import { AiRatioBoardContent } from "@/components/ai-ratio-board"
import { SkillsManagement } from "@/components/skills/skills-management"
import { McpManagement } from "@/components/mcp/mcp-management"
import { McpCatalog } from "@/components/mcp-catalog/mcp-catalog"

export default function Page() {
  const [activeTab, setActiveTab] = useState("ai-ratio")

  const renderContent = () => {
    switch (activeTab) {
      case "ai-ratio":
        return <AiRatioBoardContent />
      case "dept-users":
        return <DepartmentsUsers />
      case "skills":
        return <SkillsManagement />
      case "mcp":
        return <McpManagement />
      case "mcp-catalog":
        return <McpCatalog />
      default:
        return <AiRatioBoardContent />
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="min-h-0 flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  )
}
