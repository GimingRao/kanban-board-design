"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { McpCard } from "./mcp-card"
import { McpFilterBar } from "./mcp-filter-bar"
import { McpDetailDialog } from "./mcp-detail-dialog"
import { ServiceForm } from "./service-form"
import { getMcpServices } from "@/lib/api/mcp"
import type { McpService, McpServiceType } from "@/lib/types/mcp"
import { Server, Plus } from "lucide-react"
import { toast } from "sonner"

export function McpManagement() {
  const [services, setServices] = useState<McpService[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<McpServiceType | "all">("all")
  const [selectedTag, setSelectedTag] = useState("all")
  const [enabledOnly, setEnabledOnly] = useState(false)
  const [sortBy, setSortBy] = useState("name")
  const [selectedService, setSelectedService] = useState<McpService | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<McpService | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { page: 1, page_size: 100 }
      if (selectedType !== "all") {
        params.service_type = selectedType
      }
      if (enabledOnly) {
        params.enabled_only = true
      }

      const result = await getMcpServices(params)

      if (result.success && result.data) {
        setServices(result.data.items || [])
      } else if (result.error) {
        toast.error("加载 MCP 服务列表失败", {
          description: result.error.message,
        })
      }
    } catch (error) {
      toast.error("加载 MCP 服务列表失败", {
        description: error instanceof Error ? error.message : "未知错误",
      })
    } finally {
      setLoading(false)
    }
  }

  // 加载数据
  useEffect(() => {
    loadData()
  }, [selectedType, enabledOnly])

  // 筛选服务（前端筛选）
  const filteredServices = services
    .filter((service) => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          service.name.toLowerCase().includes(query) ||
          (service.description?.toLowerCase().includes(query)) ||
          (service.command?.toLowerCase().includes(query)) ||
          (service.url?.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // 标签过滤
      if (selectedTag === "enabled" && !service.enabled) return false
      if (selectedTag === "disabled" && service.enabled) return false
      if (selectedTag === "official" && !service.is_official) return false
      if (selectedTag === "featured" && !service.is_featured) return false
      if (selectedTag === "hot" && !service.is_hot) return false

      return true
    })
    .sort((a, b) => {
      // 排序
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "created_at") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === "updated_at") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
      return 0
    })

  const handleViewDetails = (service: McpService) => {
    setSelectedService(service)
    setDetailOpen(true)
  }

  const handleFavorite = (_serviceId: number) => {
    toast.success("已添加到收藏")
  }

  const handleCreate = () => {
    setEditingService(null)
    setFormOpen(true)
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditingService(null)
    loadData()
    toast.success("MCP 服务创建成功")
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

  const hasActiveFilters = searchQuery || selectedType !== "all" || selectedTag !== "all" || enabledOnly

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">MCP 服务管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            浏览、搜索和管理 Model Context Protocol 服务器
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          添加服务
        </Button>
      </div>

      {/* 筛选栏 */}
      <McpFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        enabledOnly={enabledOnly}
        onEnabledOnlyChange={setEnabledOnly}
        sortBy={sortBy}
        onSortChange={setSortBy}
        className="mb-6"
      />

      {/* 服务网格 */}
      {filteredServices.length > 0 ? (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            显示 {filteredServices.length} 个服务，共 {services.length} 个
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredServices.map((service) => (
              <McpCard
                key={service.id}
                service={service}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Server className="h-12 w-12" />
            </EmptyMedia>
            <EmptyTitle>
              {hasActiveFilters ? "未找到匹配的 MCP 服务" : "暂无 MCP 服务"}
            </EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? "请尝试调整搜索关键词或筛选条件"
                : "开始添加您的第一个 MCP 服务器配置"}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {hasActiveFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedType("all")
                  setSelectedTag("all")
                  setEnabledOnly(false)
                }}
              >
                清除筛选
              </Button>
            ) : (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                添加服务
              </Button>
            )}
          </EmptyContent>
        </Empty>
      )}

      {/* 详情对话框 */}
      <McpDetailDialog
        service={selectedService}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onFavorite={handleFavorite}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "编辑 MCP 服务" : "添加 MCP 服务"}
            </DialogTitle>
          </DialogHeader>
          <ServiceForm
            service={editingService}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
