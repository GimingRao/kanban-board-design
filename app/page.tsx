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
      {/* 移动端允许页面自然撑高滚动，桌面端继续保持整屏仪表盘布局。 */}
      <div className="flex min-h-screen flex-col bg-background lg:h-screen">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-visible lg:min-h-0 lg:overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </AuthGuard>
  )
}
