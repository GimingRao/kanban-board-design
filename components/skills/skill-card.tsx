"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Download, ExternalLink, Star } from "lucide-react"
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

export function SkillCard({ skill, onViewDetails, onEdit, onDelete, viewMode = "grid", className }: SkillCardProps) {
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

  return (
    <Card
      className={cn(
        "group transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
        className
      )}
      onClick={() => onViewDetails(skill)}
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
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge()}
                {skill.version && (
                  <Badge variant="outline" className="text-xs">{skill.version}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <CardDescription className="line-clamp-2 min-h-[40px]">
          {skill.description || '暂无描述'}
        </CardDescription>

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
