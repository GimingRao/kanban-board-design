"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Download, Star, Trophy, Flame, Sparkles } from "lucide-react"
import type { McpCatalog } from "@/lib/types/mcp"

interface McpCatalogCardProps {
  mcp: McpCatalog
  onViewDetails: (mcp: McpCatalog) => void
}

export function McpCatalogCard({ mcp, onViewDetails }: McpCatalogCardProps) {
  const getCategoryLabel = (category: string | null) => {
    if (!category) return "未分类"
    const labels: Record<string, string> = {
      "development-tools": "开发工具",
      "api-development": "API开发",
      "data-science": "数据科学",
      "productivity": "生产力",
      "web-scraping": "网络抓取",
      "database": "数据库",
      "browser-automation": "浏览器自动化",
      "collaboration": "协作工具",
      "content-management": "内容管理",
      "security-testing": "安全测试",
    }
    return labels[category] || category
  }

  const getBadgeColor = (isOfficial: boolean, isFeatured: boolean, isHot: boolean) => {
    if (isOfficial) return "bg-accent text-accent-foreground"
    if (isFeatured) return "bg-yellow-500 text-yellow-950"
    if (isHot) return "bg-red-500 text-white"
    return "bg-secondary text-secondary-foreground"
  }

  const getBadgeIcon = (isOfficial: boolean, isFeatured: boolean, isHot: boolean) => {
    if (isOfficial) return <Sparkles className="h-3 w-3" />
    if (isFeatured) return <Trophy className="h-3 w-3" />
    if (isHot) return <Flame className="h-3 w-3" />
    return null
  }

  return (
    <Card className="group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
            {mcp.icon ? (
              <img src={mcp.icon} alt={mcp.name} className="h-10 w-10" />
            ) : (
              <span className="text-2xl">🧩</span>
            )}
          </div>
          <div className="flex gap-1">
            {(mcp.is_official || mcp.is_featured || mcp.is_hot) && (
              <Badge className={getBadgeColor(mcp.is_official, mcp.is_featured, mcp.is_hot)}>
                {getBadgeIcon(mcp.is_official, mcp.is_featured, mcp.is_hot)}
                {mcp.is_official ? "官方" : mcp.is_featured ? "精选" : "热门"}
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="line-clamp-1 text-lg">{mcp.name}</CardTitle>
        <CardDescription className="line-clamp-2">{mcp.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* 分类和版本 */}
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="text-xs">
            {getCategoryLabel(mcp.category)}
          </Badge>
          <span className="text-muted-foreground text-xs">v{mcp.version}</span>
        </div>

        {/* 标签 */}
        {mcp.tags && mcp.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mcp.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {mcp.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{mcp.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* 统计数据 */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            <span>{formatNumber(mcp.download_count)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
            <span>{formatNumber(mcp.favorite_count)}</span>
          </div>
        </div>

        {/* 作者 */}
        {mcp.author && (
          <div className="text-xs text-muted-foreground">
            作者: {mcp.author}
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button variant="default" size="sm" className="flex-1" onClick={() => onViewDetails(mcp)}>
          查看详情
        </Button>
        {mcp.homepage_url && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={mcp.homepage_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

// 格式化数字
function formatNumber(num?: number | null): string {
  const value = typeof num === "number" && Number.isFinite(num) ? num : 0
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M"
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + "K"
  }
  return value.toString()
}
