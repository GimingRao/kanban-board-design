"use client"

import { useState } from "react"
import { ServiceCard } from "@/components/mcp/service-card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { McpFilterBar } from "@/components/mcp/mcp-filter-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Server, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { McpService, McpServiceType } from "@/lib/types/mcp"

interface ServiceListProps {
  services: McpService[]
  loading: boolean
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
  onEdit: (service: McpService) => void
  page: number
  onPageChange: (page: number) => void
  pageSize: number
  total: number
}

export function ServiceList({
  services,
  loading,
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
  onEdit,
  page,
  onPageChange,
  pageSize,
  total,
}: ServiceListProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

  // Client-side filtering for search and tags
  const filteredServices = services.filter((service) => {
    // Search filter
    if (localSearchQuery) {
      const query = localSearchQuery.toLowerCase()
      const matchesSearch =
        service.name.toLowerCase().includes(query) ||
        (service.description?.toLowerCase().includes(query)) ||
        (service.command?.toLowerCase().includes(query)) ||
        (service.url?.toLowerCase().includes(query))
      if (!matchesSearch) return false
    }

    // Tag filters
    if (selectedTag === "enabled" && !service.enabled) return false
    if (selectedTag === "disabled" && service.enabled) return false
    if (selectedTag === "official" && !service.is_official) return false
    if (selectedTag === "featured" && !service.is_featured) return false
    if (selectedTag === "hot" && !service.is_hot) return false

    return true
  })

  // Client-side sorting
  const sortedServices = [...filteredServices].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name)
    } else if (sortBy === "created_at") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === "updated_at") {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    }
    return 0
  })

  const hasActiveFilters = localSearchQuery || selectedType !== "all" || selectedTag !== "all" || enabledOnly

  const clearFilters = () => {
    setLocalSearchQuery("")
    onSearchChange("")
    onTypeChange("all")
    onTagChange("all")
    onEnabledOnlyChange(false)
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Filter bar skeleton */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="rounded-xl shadow-sm">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <McpFilterBar
        searchQuery={localSearchQuery}
        onSearchChange={(query) => {
          setLocalSearchQuery(query)
          onSearchChange(query)
        }}
        selectedType={selectedType}
        onTypeChange={onTypeChange}
        selectedTag={selectedTag}
        onTagChange={onTagChange}
        enabledOnly={enabledOnly}
        onEnabledOnlyChange={onEnabledOnlyChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
      />

      {/* Results info */}
      {sortedServices.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {sortedServices.length} of {total} services
        </div>
      )}

      {/* Services Grid */}
      {sortedServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={onEdit}
            />
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Server className="h-12 w-12" />
            </EmptyMedia>
            <EmptyTitle>
              {hasActiveFilters
                ? "No matching MCP services found"
                : "No MCP services yet"}
            </EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding your first MCP server configuration"}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </EmptyContent>
        </Empty>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="icon"
                  onClick={() => onPageChange(pageNum)}
                  className="w-9 h-9"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
