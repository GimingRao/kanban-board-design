"use client"

import { cn } from "@/lib/utils"
import { Crown, Medal, Award, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface Developer {
  id: string
  name: string
  avatar: string
  commits: number
  linesAdded: number
  linesRemoved: number
  trend: "up" | "down" | "same"
  rank: number
}

const developers: Developer[] = [
  {
    id: "1",
    name: "张三",
    avatar: "Z",
    commits: 156,
    linesAdded: 12450,
    linesRemoved: 3200,
    trend: "up",
    rank: 1,
  },
  {
    id: "2",
    name: "李四",
    avatar: "L",
    commits: 142,
    linesAdded: 10890,
    linesRemoved: 2800,
    trend: "up",
    rank: 2,
  },
  {
    id: "3",
    name: "王五",
    avatar: "W",
    commits: 128,
    linesAdded: 9650,
    linesRemoved: 4100,
    trend: "down",
    rank: 3,
  },
  {
    id: "4",
    name: "赵六",
    avatar: "Z",
    commits: 115,
    linesAdded: 8920,
    linesRemoved: 2100,
    trend: "same",
    rank: 4,
  },
  {
    id: "5",
    name: "钱七",
    avatar: "Q",
    commits: 98,
    linesAdded: 7450,
    linesRemoved: 1890,
    trend: "up",
    rank: 5,
  },
  {
    id: "6",
    name: "孙八",
    avatar: "S",
    commits: 89,
    linesAdded: 6780,
    linesRemoved: 2340,
    trend: "down",
    rank: 6,
  },
  {
    id: "7",
    name: "周九",
    avatar: "Z",
    commits: 76,
    linesAdded: 5890,
    linesRemoved: 1560,
    trend: "same",
    rank: 7,
  },
  {
    id: "8",
    name: "吴十",
    avatar: "W",
    commits: 65,
    linesAdded: 4920,
    linesRemoved: 980,
    trend: "up",
    rank: 8,
  },
]

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />
    default:
      return <span className="flex h-5 w-5 items-center justify-center text-sm text-muted-foreground">{rank}</span>
  }
}

function getTrendIcon(trend: "up" | "down" | "same") {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-green-500" />
    case "down":
      return <TrendingDown className="h-4 w-4 text-red-500" />
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />
  }
}

export function Leaderboard() {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border p-6">
        <h3 className="text-lg font-semibold text-card-foreground">代码提交排行榜</h3>
        <p className="mt-1 text-sm text-muted-foreground">本月代码贡献排名</p>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3">排名</th>
              <th className="px-6 py-3">开发者</th>
              <th className="px-6 py-3 text-right">提交次数</th>
              <th className="px-6 py-3 text-right">新增行数</th>
              <th className="px-6 py-3 text-right">删除行数</th>
              <th className="px-6 py-3 text-center">趋势</th>
            </tr>
          </thead>
          <tbody>
            {developers.map((dev, index) => (
              <tr 
                key={dev.id} 
                className={cn(
                  "border-b border-border/50 transition-colors hover:bg-secondary/50",
                  index < 3 && "bg-secondary/20"
                )}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(dev.rank)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                      dev.rank === 1 && "bg-yellow-500/20 text-yellow-500",
                      dev.rank === 2 && "bg-gray-400/20 text-gray-400",
                      dev.rank === 3 && "bg-amber-600/20 text-amber-600",
                      dev.rank > 3 && "bg-secondary text-secondary-foreground"
                    )}>
                      {dev.avatar}
                    </div>
                    <span className="font-medium text-card-foreground">{dev.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-mono text-sm text-card-foreground">{dev.commits}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-mono text-sm text-green-500">+{dev.linesAdded.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-mono text-sm text-red-500">-{dev.linesRemoved.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center">
                    {getTrendIcon(dev.trend)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
