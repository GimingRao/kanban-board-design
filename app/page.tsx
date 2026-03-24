"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Header } from "@/components/dashboard/header"
import { DepartmentsUsers } from "@/components/dashboard/departments-users"
import { AiRatioBoardContent } from "@/components/ai-ratio-board"

export default function Page() {
  const [activeTab, setActiveTab] = useState("ai-ratio")

  const renderContent = () => {
    switch (activeTab) {
      case "ai-ratio":
        return <AiRatioBoardContent />
      case "dept-users":
        return <DepartmentsUsers />
      default:
        return <AiRatioBoardContent />
    }
  }

  return (
    <AuthGuard>
      <div className="flex h-screen flex-col bg-background">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="min-h-0 flex-1 overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </AuthGuard>
  )
}
