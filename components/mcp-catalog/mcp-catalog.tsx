"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { McpCatalogCard } from "./mcp-catalog-card"
import { McpCatalogFilterBar } from "./mcp-catalog-filter-bar"
import { McpCatalogDetailDialog } from "./mcp-catalog-detail-dialog"
import { getMcpCatalog, createMcpCatalog } from "@/lib/api/mcp"
import type { McpCatalog, McpCatalogCategory } from "@/lib/types/mcp"
import { Package, Sparkles, Flame, Trophy, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function McpCatalog() {
  const [mcps, setMcps] = useState<McpCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<McpCatalogCategory | "all">("all")
  const [selectedTag, setSelectedTag] = useState("all")
  const [sortBy, setSortBy] = useState("download_count")
  const [selectedMcp, setSelectedMcp] = useState<McpCatalog | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "official" | "featured" | "hot">("all")
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    code: "",
    name: "",
    version: "1.0.0",
    description: "",
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getMcpCatalog({
        sort_by: sortBy as any,
        sort_order: 'desc',
      })

      if (result.success && result.data) {
        setMcps(result.data.items || [])
      }
    } catch (error) {
      toast.error("加载 MCP 目录失败", {
        description: error instanceof Error ? error.message : "未知错误",
      })
    } finally {
      setLoading(false)
    }
  }

  // 加载数据
  useEffect(() => {
    loadData()
  }, [sortBy])

  // 筛选 MCP
  const filteredMcps = mcps.filter((mcp) => {
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        mcp.name.toLowerCase().includes(query) ||
        (mcp.description?.toLowerCase().includes(query)) ||
        (mcp.author?.toLowerCase().includes(query))
      if (!matchesSearch) return false
    }

    // 分类过滤
    if (selectedCategory !== "all" && mcp.category !== selectedCategory) {
      return false
    }

    // 标签过滤
    if (selectedTag !== "all") {
      const matchesTag = mcp.tags?.some((tag) =>
        tag.toLowerCase().includes(selectedTag.toLowerCase())
      )
      if (!matchesTag) return false
    }

    // Tab 过滤
    if (activeTab === "official" && !mcp.is_official) return false
    if (activeTab === "featured" && !mcp.is_featured) return false
    if (activeTab === "hot" && !mcp.is_hot) return false

    return true
  })

  // 获取各分区数据
  const officialMcps = mcps.filter((mcp) => mcp.is_official)
  const featuredMcps = mcps.filter((mcp) => mcp.is_featured)
  const hotMcps = [...mcps].sort((a, b) => b.download_count - a.download_count).slice(0, 5)

  const handleViewDetails = (mcp: McpCatalog) => {
    setSelectedMcp(mcp)
    setDetailOpen(true)
  }

  const handleFavorite = (_mcpId: number) => {
    toast.success("已添加到收藏")
  }

  const handleSubmitMcp = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("请填写必填项", {
        description: "编码和名称不能为空",
      })
      return
    }

    setSubmitting(true)
    try {
      const result = await createMcpCatalog({
        code: form.code.trim(),
        name: form.name.trim(),
        version: form.version.trim() || "1.0.0",
        description: form.description.trim() || null,
      })

      if (result.success) {
        toast.success("MCP 提交成功")
        setSubmitOpen(false)
        setForm({ code: "", name: "", version: "1.0.0", description: "" })
        await loadData()
      } else if (result.error) {
        toast.error("MCP 提交失败", {
          description: result.error.message,
        })
      }
    } catch (error) {
      toast.error("MCP 提交失败", {
        description: error instanceof Error ? error.message : "未知错误",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">MCP 市场</h1>
          <p className="text-sm text-muted-foreground mt-1">
            浏览和发现 Model Context Protocol 工具
          </p>
        </div>
        <Button onClick={() => setSubmitOpen(true)}>
          <Package className="h-4 w-4 mr-2" />
          提交 MCP
        </Button>
      </div>

      {/* 分类 Tab 和筛选栏 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            全部
          </TabsTrigger>
          <TabsTrigger value="official" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Sparkles className="h-4 w-4 mr-1.5" />
            官方
          </TabsTrigger>
          <TabsTrigger value="featured" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Trophy className="h-4 w-4 mr-1.5" />
            精选
          </TabsTrigger>
          <TabsTrigger value="hot" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Flame className="h-4 w-4 mr-1.5" />
            热门
          </TabsTrigger>
        </TabsList>

        {/* 筛选栏 */}
        <McpCatalogFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          sortBy={sortBy}
          onSortChange={setSortBy}
          className="mt-4"
        />
      </Tabs>

      {/* 热门排行榜 */}
      {activeTab === "all" && hotMcps.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-card/50">
          <h3 className="flex items-center gap-2 font-semibold text-foreground mb-3">
            <Flame className="h-5 w-5 text-orange-500" />
            热门排行榜 TOP 5
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {hotMcps.map((mcp, index) => (
              <div
                key={mcp.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/50 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleViewDetails(mcp)}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{mcp.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatNumber(mcp.download_count)} 下载
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MCP 网格 */}
      {filteredMcps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMcps.map((mcp) => (
            <McpCatalogCard
              key={mcp.id}
              mcp={mcp}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package className="h-12 w-12" />
            </EmptyMedia>
            <EmptyTitle>
              {searchQuery || selectedCategory !== "all" || selectedTag !== "all" || activeTab !== "all"
                ? "未找到匹配的 MCP"
                : "暂无 MCP"}
            </EmptyTitle>
            <EmptyDescription>
              {searchQuery || selectedCategory !== "all" || selectedTag !== "all" || activeTab !== "all"
                ? "请尝试调整搜索关键词或筛选条件"
                : "MCP 市场即将上线，敬请期待"}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {searchQuery || selectedCategory !== "all" || selectedTag !== "all" || activeTab !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                  setSelectedTag("all")
                  setActiveTab("all")
                }}
              >
                清除筛选
              </Button>
            ) : (
              <Button onClick={() => setSubmitOpen(true)}>
                <Package className="h-4 w-4 mr-2" />
                提交 MCP
              </Button>
            )}
          </EmptyContent>
        </Empty>
      )}

      {/* 详情对话框 */}
      <McpCatalogDetailDialog
        mcp={selectedMcp}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onFavorite={handleFavorite}
      />

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>提交 MCP</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mcp-code">编码</Label>
              <Input
                id="mcp-code"
                placeholder="例如：my-mcp-tool"
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mcp-name">名称</Label>
              <Input
                id="mcp-name"
                placeholder="例如：My MCP Tool"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mcp-version">版本</Label>
              <Input
                id="mcp-version"
                placeholder="例如：1.0.0"
                value={form.version}
                onChange={(e) => setForm((prev) => ({ ...prev, version: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mcp-desc">描述</Label>
              <Textarea
                id="mcp-desc"
                placeholder="描述这个 MCP 的用途"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)} disabled={submitting}>
              取消
            </Button>
            <Button onClick={handleSubmitMcp} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
