import { Suspense } from "react"

import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"

/** 首页使用 Suspense 包裹客户端查询参数逻辑，避免构建期因 useSearchParams 触发预渲染错误。 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <DashboardPageShell />
    </Suspense>
  )
}
