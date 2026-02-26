"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, ExternalLink, Star, Edit, Trash2, MoreVertical, Power, PowerOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Skill } from "@/lib/types/skill"

interface SkillCardProps {
  skill: Skill
  onViewDetails: (skill: Skill) => void
  onEdit?: (skill: Skill) => void
  onDelete?: (skill: Skill) => void
  viewMode?: "grid" | "list"
  className?: string
}

export function SkillCard({
  skill,
  onViewDetails,
  onEdit,
  onDelete,
  viewMode = "grid",
  className,
}: SkillCardProps) {
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

  const handleCardClick = () => {
    onViewDetails(skill)
  }

  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "group transition-all hover:shadow-md cursor-pointer",
          skill.status === "inactive" && "opacity-60",
          className
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* 图标 */}
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary shrink-0">
              {skill.icon ? (
                <img src={skill.icon} alt={skill.name} className="h-8 w-8" />
              ) : (
                <span className="text-2xl">🧩</span>
              )}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{skill.name}</h3>
                {getStatusBadge()}
                {skill.version && (
                  <Badge variant="outline" className="text-xs shrink-0">{skill.version}</Badge>
                )}
                <Badge
                  variant={skill.status === "active" ? "default" : "secondary"}
                  className="text-xs shrink-0"
                >
                  {skill.status === "active" ? (
                    <>
                      <Power className="h-2.5 w-2.5 mr-1 fill-current" />
                      活跃
                    </>
                  ) : (
                    <>
                      <PowerOff className="h-2.5 w-2.5 mr-1" />
                      未激活
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {skill.description || '暂无描述'}
              </p>
              <div className="flex items-center gap-3 mt-2">
                {skill.download_count !== undefined && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {formatCount(skill.download_count)}
                  </span>
                )}
                {skill.favorite_count !== undefined && skill.favorite_count > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    {formatCount(skill.favorite_count)}
                  </span>
                )}
                {skill.category && (
                  <span className="text-xs text-muted-foreground">
                    分类: {skill.category.name}
                  </span>
                )}
              </div>
            </div>

            {/* 标签 */}
            {skill.tags && skill.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-w-xs shrink-0">
                {skill.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {skill.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{skill.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails(skill)
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(skill)}>
                      <Edit className="h-4 w-4 mr-2" />
                      编辑
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(skill)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "group transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
        skill.status === "inactive" && "opacity-60",
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
              {skill.icon ? (
                <img src={skill.icon} alt={skill.name} className="h-8 w-8" />
              ) : (
                <span className="text-2xl">🧩</span>
              )}
            </div>
            <div>
              <CardTitle className="text-lg line-clamp-1">{skill.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {getStatusBadge()}
                {skill.version && (
                  <Badge variant="outline" className="text-xs">{skill.version}</Badge>
                )}
                <Badge
                  variant={skill.status === "active" ? "default" : "secondary"}
                  className="text-xs gap-1"
                >
                  {skill.status === "active" ? (
                    <>
                      <Power className="h-2.5 w-2.5 fill-current" />
                      活跃
                    </>
                  ) : (
                    <>
                      <PowerOff className="h-2.5 w-2.5" />
                      未激活
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(skill)}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(skill)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <CardDescription className="line-clamp-2 min-h-[40px]">
          {skill.description || '暂无描述'}
        </CardDescription>

        {/* 技能编码 */}
        <div className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 rounded px-2 py-1">
          {skill.code}
        </div>

        {skill.tags && skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {skill.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {skill.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{skill.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {skill.download_count !== undefined && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" />
                    <span>{formatCount(skill.download_count)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>下载量: {skill.download_count}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {skill.favorite_count !== undefined && skill.favorite_count > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                    <span>{formatCount(skill.favorite_count)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>收藏数: {skill.favorite_count}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails(skill)
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
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
