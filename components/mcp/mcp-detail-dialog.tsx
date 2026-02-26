"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy, Check, Star, Share2, Server, Settings, ExternalLink, Power, PowerOff, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { McpService } from "@/lib/types/mcp"

interface McpDetailDialogProps {
  service: McpService | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onFavorite?: (serviceId: number) => void
}

export function McpDetailDialog({
  service,
  open,
  onOpenChange,
  onFavorite,
}: McpDetailDialogProps) {
  const [copied, setCopied] = useState("")

  if (!service) return null

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(""), 2000)
  }

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
        return "STDIO (标准输入输出)"
      case "sse":
        return "SSE (服务器发送事件)"
      case "websocket":
        return "WebSocket"
      default:
        return service.service_type
    }
  }

  const getInstallCommand = () => {
    if (service.service_type === "stdio" && service.command) {
      const args = service.args?.join(" ") || ""
      return `${service.command} ${args}`.trim()
    }
    return `# 配置服务类型: ${service.service_type}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary">
                {service.icon ? (
                  <img src={service.icon} alt={service.name} className="h-10 w-10" />
                ) : (
                  <Server className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl">{service.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge()}
                  <Badge variant="outline">{getServiceTypeLabel()}</Badge>
                  <Badge
                    variant={service.enabled ? "default" : "secondary"}
                    className={cn(service.enabled ? "bg-green-500 hover:bg-green-600" : "")}
                  >
                    {service.enabled ? (
                      <>
                        <Power className="h-3 w-3 mr-1 fill-current" />
                        已启用
                      </>
                    ) : (
                      <>
                        <PowerOff className="h-3 w-3 mr-1" />
                        已禁用
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onFavorite?.(service.id)}
                title="收藏"
              >
                <Star className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" title="分享">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {service.description && (
            <DialogDescription className="mt-3 text-base">
              {service.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="config">配置</TabsTrigger>
            <TabsTrigger value="advanced">高级</TabsTrigger>
            <TabsTrigger value="info">信息</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="overview" className="space-y-4 mt-0">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">服务类型</p>
                  <p className="text-sm font-medium">{getServiceTypeLabel()}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">状态</p>
                  <p className="text-sm font-medium">{service.enabled ? "已启用" : "已禁用"}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">配置项</p>
                  <p className="text-sm font-medium">{service.config_count} 个</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">超时时间</p>
                  <p className="text-sm font-medium">{service.timeout} 秒</p>
                </div>
              </div>

              {/* 服务命令/URL */}
              {service.command && (
                <div>
                  <h4 className="text-sm font-medium mb-2">启动命令</h4>
                  <div className="relative group">
                    <pre className="p-3 rounded-lg bg-muted font-mono text-sm overflow-x-auto">
                      {service.command}
                      {service.args && service.args.length > 0 && ` ${service.args.join(" ")}`}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(getInstallCommand(), "command")}
                    >
                      {copied === "command" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {service.url && (
                <div>
                  <h4 className="text-sm font-medium mb-2">服务地址</h4>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-3 py-2 rounded-lg flex-1 truncate">
                      {service.url}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(service.url!, "url")}
                    >
                      {copied === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(service.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* 标签 */}
              {service.tags && service.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 提供者 */}
              {service.provider && (
                <div>
                  <h4 className="text-sm font-medium mb-2">服务提供者</h4>
                  <p className="text-sm">{service.provider}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="config" className="space-y-4 mt-0">
              <div>
                <h4 className="text-sm font-medium mb-2">Claude Desktop 配置</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  在 Claude Desktop 配置文件中添加以下配置：
                </p>
                <div className="relative group">
                  <pre className="p-4 rounded-lg bg-muted font-mono text-sm overflow-x-auto">
{`{
  "mcpServers": {
    "${service.name}": {
      "command": "${service.command || "npx"}"${service.args ? `,
      "args": [${service.args.map(a => `"${a}"`).join(", ")}]` : ""}
    }
  }
}`}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(JSON.stringify({
                      mcpServers: {
                        [service.name]: {
                          command: service.command || "npx",
                          ...(service.args ? { args: service.args } : {})
                        }
                      }
                    }, null, 2), "claude-config")}
                  >
                    {copied === "claude-config" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">配置项 ({service.config_count})</h4>
                {service.config_count > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      该服务有 {service.config_count} 个配置项
                    </p>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      管理配置
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    该服务暂无配置项
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-0">
              <div>
                <h4 className="text-sm font-medium mb-2">高级设置</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium">超时时间</p>
                      <p className="text-xs text-muted-foreground">服务响应超时时间</p>
                    </div>
                    <Badge variant="outline">{service.timeout}秒</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium">启用状态</p>
                      <p className="text-xs text-muted-foreground">是否启用此服务</p>
                    </div>
                    <Badge variant={service.enabled ? "default" : "secondary"}>
                      {service.enabled ? "已启用" : "已禁用"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">操作</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    编辑配置
                  </Button>
                  <Button variant="outline" size="sm">
                    {service.enabled ? (
                      <>
                        <PowerOff className="h-4 w-4 mr-2" />
                        禁用服务
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-2" />
                        启用服务
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info" className="space-y-4 mt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">服务 ID</span>
                  <span className="font-mono text-sm">{service.id}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">服务名称</span>
                  <span className="text-sm">{service.name}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">服务类型</span>
                  <span className="text-sm">{service.service_type}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">创建时间</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(service.created_at)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">最后更新</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(service.updated_at)}
                  </span>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
