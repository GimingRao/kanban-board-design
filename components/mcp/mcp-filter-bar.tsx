"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, SlidersHorizontal, X, ToggleLeft, ToggleRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { McpServiceType } from "@/lib/types/mcp"

// MCP 服务类型选项
const MCP_TYPE_OPTIONS: { value: McpServiceType | "all"; label: string }[] = [
  { value: "all", label: "全部类型" },
  { value: "stdio", label: "STDIO" },
  { value: "sse", label: "SSE" },
  { value: "websocket", label: "WebSocket" },
]

// 预定义的标签筛选
const TAG_FILTERS = [
  { id: "all", name: "全部服务" },
  { id: "enabled", name: "已启用" },
  { id: "disabled", name: "已禁用" },
  { id: "official", name: "官方MCP" },
  { id: "featured", name: "精选MCP" },
  { id: "hot", name: "热门MCP" },
]

interface McpFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedType: McpServiceType | "all"
  onTypeChange: (type: McpServiceType | "all") => void
  selectedTag: string
  onTagChange: (tag: string) => void
  enabledOnly: boolean
  onEnabledOnlyChange: (enabled: boolean) => void
  sortBy: string
  onSortChange: (sort: string) => void
  className?: string
}

export function McpFilterBar({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedTag,
  onTagChange,
  enabledOnly,
  onEnabledOnlyChange,
  sortBy,
  onSortChange,
  className,
}: McpFilterBarProps) {
  const sortOptions = [
    { value: "name", label: "名称" },
    { value: "created_at", label: "最新创建" },
    { value: "updated_at", label: "最近更新" },
  ]

  const hasActiveFilters = searchQuery || selectedType !== "all" || selectedTag !== "all" || enabledOnly

  const clearFilters = () => {
    onSearchChange("")
    onTypeChange("all")
    onTagChange("all")
    onEnabledOnlyChange(false)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 搜索和排序栏 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索 MCP 服务名称或描述..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={(value) => onTypeChange(value as McpServiceType | "all")}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="服务类型" />
          </SelectTrigger>
          <SelectContent>
            {MCP_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={enabledOnly ? "default" : "outline"}
          size="sm"
          onClick={() => onEnabledOnlyChange(!enabledOnly)}
          className="gap-2"
        >
          {enabledOnly ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          仅已启用
        </Button>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={clearFilters}
            title="清除筛选"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 标签筛选 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-sm text-muted-foreground whitespace-nowrap">筛选:</span>
        <div className="flex gap-1.5">
          {TAG_FILTERS.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTag === tag.id ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors whitespace-nowrap",
                selectedTag === tag.id ? "bg-accent text-accent-foreground hover:bg-accent/90" : "hover:bg-secondary"
              )}
              onClick={() => onTagChange(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
