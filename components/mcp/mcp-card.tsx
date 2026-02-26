"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Download, ExternalLink, Server, Star, Globe, Power, PowerOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { McpService } from "@/lib/types/mcp"

interface McpCardProps {
  service: McpService
  onViewDetails: (service: McpService) => void
  onToggleEnabled?: (service: McpService) => void
  className?: string
}

export function McpCard({ service, onViewDetails, onToggleEnabled, className }: McpCardProps) {
  const getStatusBadge = () => {
    if (service.is_official) {
      return <Badge className="bg-accent text-accent-foreground">官方</Badge>
    }
    if (service.is_featured) {
      return <Badge className="bg-yellow-500 text-yellow-950">精选</Badge>
    }
    if (service.is_hot) {
      return <Badge className="bg-red-500 text-white">热门</Badge>
    }
    return null
  }

  const getServiceTypeLabel = () => {
    switch (service.service_type) {
      case "stdio":
        return "STDIO"
      case "sse":
        return "SSE"
      case "websocket":
        return "WebSocket"
      default:
        return service.service_type
    }
  }

  return (
    <Card
      className={cn(
        "group transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
        !service.enabled && "opacity-60",
        className
      )}
      onClick={() => onViewDetails(service)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
              {service.icon ? (
                <img src={service.icon} alt={service.name} className="h-8 w-8" />
              ) : (
                <Server className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg line-clamp-1">{service.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge()}
                <Badge variant="outline" className="text-xs">{getServiceTypeLabel()}</Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs gap-1",
                    service.enabled ? "text-green-500" : "text-muted-foreground"
                  )}
                >
                  {service.enabled ? (
                    <>
                      <Power className="h-2.5 w-2.5 fill-current" />
                      已启用
                    </>
                  ) : (
                    <>
                      <PowerOff className="h-2.5 w-2.5" />
                      已禁用
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <CardDescription className="line-clamp-2 min-h-[40px]">
          {service.description || '暂无描述'}
        </CardDescription>

        {/* 服务配置信息 */}
        <div className="mt-3 space-y-1">
          {service.command && (
            <div className="text-xs text-muted-foreground truncate">
              <span className="font-medium">命令:</span> {service.command}
              {service.args && service.args.length > 0 && ` ${service.args.join(' ')}`}
            </div>
          )}
          {service.url && (
            <div className="text-xs text-muted-foreground truncate">
              <span className="font-medium">URL:</span> {service.url}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">超时:</span> {service.timeout}秒
          </div>
        </div>

        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {service.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {service.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{service.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {service.provider && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <span>提供者:</span>
            <span className="font-medium">{service.provider}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {service.download_count !== undefined && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" />
                    <span>{formatCount(service.download_count)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>下载量: {service.download_count}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {service.favorite_count !== undefined && service.favorite_count > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                    <span>{formatCount(service.favorite_count)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>收藏数: {service.favorite_count}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {service.config_count > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Server className="h-3.5 w-3.5" />
                    <span>{service.config_count} 配置</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>配置项数量: {service.config_count}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex items-center gap-1">
          {service.url && (
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                window.open(service.url, '_blank')
              }}
            >
              <Globe className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails(service)
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}
