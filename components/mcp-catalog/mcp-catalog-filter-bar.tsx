"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, SlidersHorizontal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { McpCatalogCategory } from "@/lib/types/mcp"

interface McpCatalogFilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedCategory: McpCatalogCategory | "all"
  onCategoryChange: (value: McpCatalogCategory | "all") => void
  selectedTag: string
  onTagChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
  className?: string
}

const CATEGORIES = [
  { value: "all", label: "全部分类" },
  { value: "development-tools", label: "开发工具" },
  { value: "api-development", label: "API开发" },
  { value: "data-science", label: "数据科学" },
  { value: "productivity", label: "生产力" },
  { value: "web-scraping", label: "网络抓取" },
  { value: "database", label: "数据库" },
  { value: "browser-automation", label: "浏览器自动化" },
  { value: "collaboration", label: "协作工具" },
  { value: "content-management", label: "内容管理" },
  { value: "security-testing", label: "安全测试" },
]

const TAGS = [
  { value: "all", label: "全部标签" },
  { value: "自动化", label: "自动化" },
  { value: "数据处理", label: "数据处理" },
  { value: "API", label: "API" },
  { value: "数据库", label: "数据库" },
  { value: "浏览器", label: "浏览器" },
  { value: "文件操作", label: "文件操作" },
  { value: "网络请求", label: "网络请求" },
  { value: "AI", label: "AI" },
  { value: "安全", label: "安全" },
]

const SORT_OPTIONS = [
  { value: "download_count", label: "按下载量" },
  { value: "favorite_count", label: "按收藏数" },
  { value: "created_at", label: "按创建时间" },
  { value: "name", label: "按名称" },
]

export function McpCatalogFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  sortBy,
  onSortChange,
  className,
}: McpCatalogFilterBarProps) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        {/* 搜索框 */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索 MCP..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 分类选择 */}
        <Select value={selectedCategory} onValueChange={(v) => onCategoryChange(v as typeof selectedCategory)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 排序选择 */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 标签筛选 */}
      <div className="flex flex-wrap gap-2 mt-3">
        {TAGS.map((tag) => (
          <Badge
            key={tag.value}
            variant={selectedTag === tag.value ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onTagChange(tag.value)}
          >
            {tag.label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
