"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ServiceList } from "@/components/mcp/service-list"
import { ServiceForm } from "@/components/mcp/service-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Server } from "lucide-react"
import { toast } from "sonner"
import { getMcpServices } from "@/lib/api/mcp"
import type { McpService, McpServiceType } from "@/lib/types/mcp"

export default function McpPage() {
  const searchParams = useSearchParams()
  const [services, setServices] = useState<McpService[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [selectedType, setSelectedType] = useState<McpServiceType | "all">(
    (searchParams.get("type") as McpServiceType | "all") || "all"
  )
  const [selectedTag, setSelectedTag] = useState(searchParams.get("tag") || "all")
  const [enabledOnly, setEnabledOnly] = useState(searchParams.get("enabled") === "true")
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "name")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [total, setTotal] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<McpService | null>(null)

  // Load MCP services
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const params: Record<string, string | number> = {
          page,
          page_size: pageSize,
          sort_by: sortBy as any,
          sort_order: "desc",
        }

        if (selectedType !== "all") {
          params.service_type = selectedType
        }
        if (enabledOnly) {
          params.enabled_only = "true"
        }

        const result = await getMcpServices(params)

        if (result.success && result.data) {
          setServices(result.data.items || [])
          setTotal(result.data.total || 0)
        } else if (result.error) {
          toast.error("Failed to load MCP services", {
            description: result.error.message,
          })
        }
      } catch (error) {
        toast.error("Failed to load MCP services", {
          description: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedType, enabledOnly, sortBy, page, pageSize])

  const handleCreateService = () => {
    setEditingService(null)
    setFormOpen(true)
  }

  const handleEditService = (service: McpService) => {
    setEditingService(service)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingService(null)
  }

  const handleServiceSaved = () => {
    setFormOpen(false)
    setEditingService(null)
    // Reload data
    window.location.reload()
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MCP Service Management</h1>
          <p className="text-muted-foreground mt-1">
            Browse, search, and manage Model Context Protocol servers
          </p>
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2" onClick={handleCreateService}>
              <Plus className="h-5 w-5" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit MCP Service" : "Add New MCP Service"}
              </DialogTitle>
            </DialogHeader>
            <ServiceForm
              service={editingService}
              onSuccess={handleServiceSaved}
              onCancel={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Service List */}
      <ServiceList
        services={services}
        loading={loading}
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
        onEdit={handleEditService}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        total={total}
      />
    </div>
  )
}
