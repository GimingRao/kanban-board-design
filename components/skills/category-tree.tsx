"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SkillCategory } from "@/lib/types/skill"

interface CategoryTreeProps {
  categories: SkillCategory[]
  selectedCategory?: number
  onSelectCategory: (categoryId: number | undefined) => void
  className?: string
}

interface CategoryNodeProps {
  category: SkillCategory
  level: number
  selectedCategory?: number
  onSelectCategory: (categoryId: number | undefined) => void
  allCategories: SkillCategory[]
}

function CategoryNode({
  category,
  level,
  selectedCategory,
  onSelectCategory,
  allCategories,
}: CategoryNodeProps) {
  const [isOpen, setIsOpen] = useState(true)
  const hasChildren = allCategories.some((c) => c.parent_id === category.id)
  const isSelected = selectedCategory === category.id

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors group",
          isSelected
            ? "bg-accent text-accent-foreground"
            : "hover:bg-muted/50"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelectCategory(category.id)}
      >
        {hasChildren ? (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 mr-1"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(!isOpen)
                }}
              >
                {isOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        ) : (
          <span className="w-5 mr-1" />
        )}
        {isOpen ? (
          <FolderOpen className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
        ) : (
          <Folder className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
        )}
        <span className="text-sm truncate flex-1">{category.name}</span>
        {category.weight > 0 && (
          <Badge variant="outline" className="text-xs ml-auto">
            {category.weight}
          </Badge>
        )}
      </div>

      {hasChildren && isOpen && (
        <div>
          {allCategories
            .filter((c) => c.parent_id === category.id)
            .sort((a, b) => b.weight - a.weight)
            .map((child) => (
              <CategoryNode
                key={child.id}
                category={child}
                level={level + 1}
                selectedCategory={selectedCategory}
                onSelectCategory={onSelectCategory}
                allCategories={allCategories}
              />
            ))}
        </div>
      )}
    </div>
  )
}

export function CategoryTree({
  categories,
  selectedCategory,
  onSelectCategory,
  className,
}: CategoryTreeProps) {
  // 构建树形结构，找出根节点
  const rootCategories = categories
    .filter((c) => c.parent_id === null)
    .sort((a, b) => b.weight - a.weight)

  return (
    <div className={cn("space-y-1", className)}>
      {/* 全部分类 */}
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
          selectedCategory === undefined
            ? "bg-accent text-accent-foreground"
            : "hover:bg-muted/50"
        )}
        onClick={() => onSelectCategory(undefined)}
      >
        <Folder className="h-4 w-4" />
        <span className="text-sm font-medium">全部分类</span>
      </div>

      {/* 分类树 */}
      {rootCategories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          level={0}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          allCategories={categories}
        />
      ))}
    </div>
  )
}
