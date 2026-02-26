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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Search, SlidersHorizontal, X, ChevronDown, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SkillCategory } from "@/lib/types/skill"
import { useState } from "react"

// 预定义的标签分类
const TAG_CATEGORIES = [
  { id: "all", name: "全部Skill" },
  { id: "data-processing", name: "数据处理" },
  { id: "file-operations", name: "文件操作" },
  { id: "api-calls", name: "API调用" },
  { id: "network", name: "网络请求" },
  { id: "automation", name: "自动化" },
  { id: "security", name: "安全" },
  { id: "logging", name: "日志监控" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "active", label: "活跃" },
  { value: "inactive", label: "未激活" },
  { value: "deprecated", label: "已废弃" },
]

interface SkillFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedTag: string
  onTagChange: (tag: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  categories?: SkillCategory[]
  selectedCategory?: number
  onCategoryChange?: (categoryId: number | undefined) => void
  selectedStatus?: string
  onStatusChange?: (status: string) => void
  className?: string
}

export function SkillFilterBar({
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagChange,
  sortBy,
  onSortChange,
  categories = [],
  selectedCategory,
  onCategoryChange,
  selectedStatus = "all",
  onStatusChange,
  className,
}: SkillFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const sortOptions = [
    { value: "download_count", label: "热度" },
    { value: "created_at", label: "最新" },
    { value: "name", label: "名称" },
    { value: "favorite_count", label: "收藏数" },
  ]

  const hasActiveFilters =
    searchQuery ||
    selectedTag !== "all" ||
    selectedCategory !== undefined ||
    selectedStatus !== "all"

  const clearFilters = () => {
    onSearchChange("")
    onTagChange("all")
    onCategoryChange?.(undefined)
    onStatusChange?.("all")
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 主筛选栏 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索技能名称、编码或描述..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
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
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-auto gap-2",
                hasActiveFilters && "border-accent text-accent-foreground"
              )}
            >
              <Filter className="h-4 w-4" />
              筛选
              {hasActiveFilters && (
                <Badge variant="secondary" className="h-5 px-1 text-xs">
                  1+
                </Badge>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  showAdvanced && "rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
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

      {/* 高级筛选选项 */}
      <Collapsible open={showAdvanced}>
        <CollapsibleContent className="space-y-4">
          {/* 状态筛选 */}
          {onStatusChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                状态:
              </span>
              <div className="flex gap-1.5">
                {STATUS_OPTIONS.map((status) => (
                  <Badge
                    key={status.value}
                    variant={selectedStatus === status.value ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-colors whitespace-nowrap",
                      selectedStatus === status.value
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "hover:bg-secondary"
                    )}
                    onClick={() => onStatusChange(status.value)}
                  >
                    {status.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 分类筛选 */}
          {categories.length > 0 && onCategoryChange && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                分类:
              </span>
              <div className="flex gap-1.5 flex-wrap">
                <Badge
                  variant={selectedCategory === undefined ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors whitespace-nowrap",
                    selectedCategory === undefined
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-secondary"
                  )}
                  onClick={() => onCategoryChange(undefined)}
                >
                  全部分类
                </Badge>
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-colors whitespace-nowrap",
                      selectedCategory === category.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-secondary"
                    )}
                    onClick={() => onCategoryChange(category.id)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 标签筛选（始终显示） */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-sm text-muted-foreground whitespace-nowrap">标签:</span>
        <div className="flex gap-1.5">
          {TAG_CATEGORIES.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTag === tag.id ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors whitespace-nowrap",
                selectedTag === tag.id
                  ? "bg-accent text-accent-foreground hover:bg-accent/90"
                  : "hover:bg-secondary"
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
