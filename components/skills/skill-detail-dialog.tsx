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
import { Copy, Check, Star, Share2, Download, ArrowLeft, Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Skill } from "@/lib/types/skill"

interface SkillDetailDialogProps {
  skill: Skill | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onFavorite?: (skillId: number) => void
  onEdit?: (skill: Skill) => void
}

export function SkillDetailDialog({
  skill,
  open,
  onOpenChange,
  onFavorite,
  onEdit,
}: SkillDetailDialogProps) {
  const [copied, setCopied] = useState(false)

  if (!skill) return null

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusBadge = () => {
    if (skill.is_official) {
      return <Badge className="bg-accent text-accent-foreground">官方</Badge>
    }
    if (skill.is_featured) {
      return <Badge className="bg-yellow-500 text-yellow-950">精选</Badge>
    }
    if (skill.is_hot) {
      return <Badge className="bg-red-500 text-white">热门</Badge>
    }
    return null
  }

  const getInstallCommand = () => {
    return `npx @anthropic-ai/skill-cli install ${skill.code}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary">
                {skill.icon ? (
                  <img src={skill.icon} alt={skill.name} className="h-10 w-10" />
                ) : (
                  <span className="text-4xl">🧩</span>
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl">{skill.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge()}
                  {skill.version && (
                    <Badge variant="outline">{skill.version}</Badge>
                  )}
                  <Badge
                    variant={skill.status === "active" ? "default" : "secondary"}
                  >
                    {skill.status === "active" ? "活跃" : "未激活"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(skill)}
                  title="编辑"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => onFavorite?.(skill.id)}
                title="收藏"
              >
                <Star className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" title="分享">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {skill.description && (
            <DialogDescription className="mt-3 text-base">
              {skill.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="install">安装</TabsTrigger>
            <TabsTrigger value="levels">等级</TabsTrigger>
            <TabsTrigger value="stats">统计</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="overview" className="space-y-4 mt-0">
              {/* 统计数据 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                  <Download className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">下载量</p>
                    <p className="text-lg font-semibold">{skill.download_count?.toLocaleString() || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                  <Star className="h-5 w-5 text-muted-foreground fill-yellow-500 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">收藏数</p>
                    <p className="text-lg font-semibold">{skill.favorite_count?.toLocaleString() || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                  <div className="h-5 w-5 rounded-full bg-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">状态</p>
                    <p className="text-lg font-semibold capitalize">{skill.status}</p>
                  </div>
                </div>
              </div>

              {/* 标签 */}
              {skill.tags && skill.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {skill.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 分类 */}
              {skill.category && (
                <div>
                  <h4 className="text-sm font-medium mb-2">所属分类</h4>
                  <Badge variant="outline">{skill.category.name}</Badge>
                </div>
              )}
            </TabsContent>

            <TabsContent value="install" className="space-y-4 mt-0">
              <div>
                <h4 className="text-sm font-medium mb-2">安装命令</h4>
                <div className="relative group">
                  <pre className="p-4 rounded-lg bg-muted font-mono text-sm overflow-x-auto">
                    {getInstallCommand()}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(getInstallCommand())}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">配置说明</h4>
                <p className="text-sm text-muted-foreground">
                  安装完成后，请在配置文件中添加以下配置：
                </p>
                <div className="relative group mt-2">
                  <pre className="p-4 rounded-lg bg-muted font-mono text-sm overflow-x-auto">
                    {`{
  "skills": {
    "${skill.code}": {
      "enabled": true,
      "level": "basic"
    }
  }
}`}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(`{\n  "skills": {\n    "${skill.code}": {\n      "enabled": true,\n      "level": "basic"\n    }\n  }\n}`)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="levels" className="space-y-4 mt-0">
              {skill.levels && skill.levels.length > 0 ? (
                <div className="space-y-3">
                  {skill.levels.map((level, index) => (
                    <div
                      key={level.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium capitalize">{level.name}</h5>
                          {level.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {level.description}
                            </p>
                          )}
                        </div>
                        {level.required_points && (
                          <Badge variant="outline">{level.required_points} 积分</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  该技能暂无等级定义
                </p>
              )}
            </TabsContent>

            <TabsContent value="stats" className="space-y-4 mt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">技能编码</span>
                  <span className="font-mono text-sm">{skill.code}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">创建时间</span>
                  <span className="text-sm">{new Date(skill.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm">最后更新</span>
                  <span className="text-sm">{new Date(skill.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
