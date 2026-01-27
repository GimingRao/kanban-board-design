"use client"

import { useState } from "react"
import { RepoSelector } from "./repo-selector"
import { MonthlyStatsChart } from "./monthly-stats-chart"
import { Leaderboard } from "./leaderboard"

export function DashboardContent() {
  const [selectedRepo, setSelectedRepo] = useState("1")

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Git 代码提交量</h1>
          <p className="mt-1 text-sm text-muted-foreground">查看团队代码提交统计数据</p>
        </div>
        <RepoSelector selectedRepo={selectedRepo} onRepoChange={setSelectedRepo} />
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
          <MonthlyStatsChart />
          <Leaderboard />
        </div>
      </div>
    </div>
  )
}
