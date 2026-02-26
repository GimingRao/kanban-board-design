"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, Star, Download, GitBranch, Shield, User, FileText, Copy, Check } from "lucide-react"
import type { McpCatalog, McpCatalogStats } from "@/lib/types/mcp"
import { getMcpCatalogStats } from "@/lib/api/mcp"
import { toast } from "sonner"

interface McpCatalogDetailDialogProps {
  mcp: McpCatalog | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onFavorite: (mcpId: number) => void
}

export function McpCatalogDetailDialog({ mcp, open, onOpenChange, onFavorite }: McpCatalogDetailDialogProps) {
  const [stats, setStats] = useState<McpCatalogStats | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (mcp && open) {
      getMcpCatalogStats(mcp.id).then(res => {
        if (res.success && res.data) {
          setStats(res.data)
        }
      })
    }
  }, [mcp, open])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("已复制到剪贴板")
    setTimeout(() => setCopied(false), 2000)
  }

  if (!mcp) return null

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 text-accent">
                {mcp.icon ? (
                  <img src={mcp.icon} alt={mcp.name} className="h-12 w-12" />
                ) : (
                  <span className="text-3xl">🧩</span>
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl">{mcp.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  v{mcp.version}
                  {mcp.author && ` • 作者: ${mcp.author}`}
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-1">
              {mcp.is_official && (
                <Badge className="bg-accent text-accent-foreground">官方</Badge>
              )}
              {mcp.is_featured && (
                <Badge className="bg-yellow-500 text-yellow-950">精选</Badge>
              )}
              {mcp.is_hot && (
                <Badge className="bg-red-500 text-white">热门</Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="stats">统计</TabsTrigger>
            <TabsTrigger value="install">安装</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* 描述 */}
            <div>
              <h3 className="font-semibold mb-2">描述</h3>
              <p className="text-sm text-muted-foreground">
                {mcp.description || "暂无描述"}
              </p>
            </div>

            <Separator />

            {/* 分类和标签 */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">分类</h3>
                <Badge variant="outline">{getCategoryLabel(mcp.category)}</Badge>
              </div>
              <div>
                <h3 className="font-semibold mb-2">标签</h3>
                <div className="flex flex-wrap gap-2">
                  {mcp.tags && mcp.tags.length > 0 ? (
                    mcp.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">暂无标签</span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* 统计数据 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                  <Download className="h-5 w-5" />
                  {formatNumber(mcp.download_count)}
                </div>
                <div className="text-xs text-muted-foreground">下载量</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  {formatNumber(mcp.favorite_count)}
                </div>
                <div className="text-xs text-muted-foreground">收藏数</div>
              </div>
              <div className="text-center">
                <div className="text items-center justify-center gap-1 text-2xl font-bold">
                  <Shield className="h-5 w-5" />
                  {stats?.active_services || 0}
                </div>
                <div className="text-xs text-muted-foreground">活跃服务</div>
              </div>
            </div>

            <Separator />

            {/* 链接 */}
            <div className="space-y-2">
              <h3 className="font-semibold">链接</h3>
              <div className="space-y-2">
                {mcp.homepage_url && (
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <a href={mcp.homepage_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      主页
                    </a>
                  </Button>
                )}
                {mcp.repository_url && (
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <a href={mcp.repository_url} target="_blank" rel="noopener noreferrer">
                      <GitBranch className="h-4 w-4 mr-2" />
                      源码仓库
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {mcp.license && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">许可证</span>
                  <Badge variant="outline">{mcp.license}</Badge>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {stats ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">总下载量</span>
                    <span className="font-semibold">{formatNumber(stats.total_downloads)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">总收藏数</span>
                    <span className="font-semibold">{formatNumber(stats.total_favorites)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">配置服务数</span>
                    <span className="font-semibold">{stats.total_services}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">活跃服务数</span>
                    <span className="font-semibold text-green-600">{stats.active_services}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">最近下载</span>
                    <span className="font-semibold">{formatNumber(stats.recent_downloads)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                暂无统计数据
              </div>
            )}
          </TabsContent>

          <TabsContent value="install" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">配置命令</h3>
              <div className="relative">
                <pre className="rounded-lg bg-secondary p-4 text-sm overflow-x-auto">
                  <code>mcp config add {mcp.code}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => handleCopy(`mcp config add ${mcp.code}`)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">或手动配置</h3>
              <p className="text-sm text-muted-foreground mb-3">
                在 MCP 服务配置页面添加此 MCP
              </p>
              <Button variant="outline" className="w-full">
                前往 MCP 服务配置
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => onFavorite(mcp.id)}>
            <Star className="h-4 w-4 mr-2" />
            收藏
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}
