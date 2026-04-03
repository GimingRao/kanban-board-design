"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { AiRatioBoardContent } from "@/components/ai-ratio-board"
import { AuthGuard } from "@/components/auth/auth-guard"
import { DepartmentsUsers } from "@/components/dashboard/departments-users"
import { Header } from "@/components/dashboard/header"
import { RepoManagement } from "@/components/dashboard/repo-management"

const DEFAULT_TAB = "ai-ratio"
const VALID_TABS = new Set(["ai-ratio", "dept-users", "repo-management"])

/** 从地址栏参数中解析首页标签，避免详情页返回后丢失原始模块上下文。 */
function resolveDashboardTab(tab: string | null) {
  return tab && VALID_TABS.has(tab) ? tab : DEFAULT_TAB
}

/** 根据当前激活页签渲染首页主体内容。 */
function renderDashboardContent(activeTab: string) {
  switch (activeTab) {
    case "ai-ratio":
      return <AiRatioBoardContent />
    case "dept-users":
      return <DepartmentsUsers />
    case "repo-management":
      return <RepoManagement />
    default:
      return <AiRatioBoardContent />
  }
}

export function DashboardPageShell() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromQuery = useMemo(() => resolveDashboardTab(searchParams.get("tab")), [searchParams])
  const [activeTab, setActiveTab] = useState(tabFromQuery)

  useEffect(() => {
    setActiveTab(tabFromQuery)
  }, [tabFromQuery])

  /** 切换首页页签时同步更新地址栏，保证刷新和返回都能恢复到原来的模块。 */
  function handleTabChange(tabId: string) {
    setActiveTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tabId)
    router.replace(`/?${params.toString()}`, { scroll: false })
  }

  return (
    <AuthGuard>
      {/* 允许页面在桌面端按内容自然撑高，避免明细区域被固定视口裁切后无法继续向下滚动。 */}
      <div className="flex min-h-screen flex-col bg-background">
        <Header activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="flex-1 overflow-visible">{renderDashboardContent(activeTab)}</main>
      </div>
    </AuthGuard>
  )
}
