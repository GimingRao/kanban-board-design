"use client"

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts"

const monthlyData = [
  { month: "2025-07", avgPerPerson: 2450, avgPerDay: 115 },
  { month: "2025-08", avgPerPerson: 2780, avgPerDay: 132 },
  { month: "2025-09", avgPerPerson: 2320, avgPerDay: 109 },
  { month: "2025-10", avgPerPerson: 2890, avgPerDay: 138 },
  { month: "2025-11", avgPerPerson: 3120, avgPerDay: 148 },
  { month: "2025-12", avgPerPerson: 2650, avgPerDay: 126 },
  { month: "2026-01", avgPerPerson: 2980, avgPerDay: 142 },
]

export function MonthlyStatsChart() {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">月度代码量统计</h3>
        <p className="mt-1 text-sm text-muted-foreground">人均/日均代码提交量趋势</p>
      </div>
      
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" vertical={false} />
            <XAxis 
              dataKey="month" 
              tick={{ fill: "oklch(0.45 0 0)", fontSize: 12 }}
              tickLine={{ stroke: "oklch(0.85 0 0)" }}
              axisLine={{ stroke: "oklch(0.85 0 0)" }}
            />
            <YAxis 
              tick={{ fill: "oklch(0.45 0 0)", fontSize: 12 }}
              tickLine={{ stroke: "oklch(0.85 0 0)" }}
              axisLine={{ stroke: "oklch(0.85 0 0)" }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "oklch(1 0 0)", 
                border: "1px solid oklch(0.9 0 0)",
                borderRadius: "8px",
                color: "oklch(0.15 0 0)"
              }}
              labelStyle={{ color: "oklch(0.45 0 0)" }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => <span style={{ color: "oklch(0.35 0 0)" }}>{value}</span>}
            />
            <Bar 
              dataKey="avgPerPerson" 
              name="人均代码量" 
              fill="oklch(0.55 0.2 250)" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="avgPerDay" 
              name="日均代码量" 
              fill="oklch(0.6 0.18 160)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-chart-1">2,741</p>
          <p className="text-xs text-muted-foreground">平均人均代码量</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">130</p>
          <p className="text-xs text-muted-foreground">平均日均代码量</p>
        </div>
      </div>
    </div>
  )
}
