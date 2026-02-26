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
import { SkillCard } from "./skill-card"
import { SkillFilterBar } from "./skill-filter-bar"
import { SkillDetailDialog } from "./skill-detail-dialog"
import { getSkillsList, getSkillCategories } from "@/lib/api/skills"
import type { Skill, SkillCategory } from "@/lib/types/skill"
import { Package, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SkillsManagement() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [sortBy, setSortBy] = useState("download_count")
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [skillsResult, categoriesResult] = await Promise.all([
          getSkillsList({ sort_by: sortBy as any, sort_order: 'desc' }),
          getSkillCategories(),
        ])

        if (skillsResult.success && skillsResult.data) {
          setSkills(skillsResult.data.items || [])
        }
        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data)
        }
      } catch (error) {
        toast.error("加载技能列表失败", {
          description: error instanceof Error ? error.message : "未知错误",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [sortBy])

  // 筛选技能
  const filteredSkills = skills.filter((skill) => {
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        skill.name.toLowerCase().includes(query) ||
        (skill.description?.toLowerCase().includes(query))
      if (!matchesSearch) return false
    }

    // 标签过滤
    if (selectedTag !== "all") {
      const matchesTag = skill.tags?.some((tag) =>
        tag.toLowerCase().includes(selectedTag.toLowerCase())
      )
      if (!matchesTag) return false
    }

    // 分类过滤
    if (selectedCategory !== undefined && skill.category_id !== selectedCategory) {
      return false
    }

    return true
  })

  const handleViewDetails = (skill: Skill) => {
    setSelectedSkill(skill)
    setDetailOpen(true)
  }

  const handleFavorite = (skillId: number) => {
    toast.success("已添加到收藏")
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
          <h1 className="text-2xl font-bold">技能管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            浏览、搜索和管理可复用的 AI 技能模块
          </p>
        </div>
        <Button>
          <Package className="h-4 w-4 mr-2" />
          添加技能
        </Button>
      </div>

      {/* 筛选栏 */}
      <SkillFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        sortBy={sortBy}
        onSortChange={setSortBy}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        className="mb-6"
      />

      {/* 技能网格 */}
      {filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
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
              {searchQuery || selectedTag !== "all" || selectedCategory
                ? "未找到匹配的技能"
                : "暂无技能"}
            </EmptyTitle>
            <EmptyDescription>
              {searchQuery || selectedTag !== "all" || selectedCategory
                ? "请尝试调整搜索关键词或筛选条件"
                : "开始添加您的第一个技能模块"}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {searchQuery || selectedTag !== "all" || selectedCategory ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedTag("all")
                  setSelectedCategory(undefined)
                }}
              >
                清除筛选
              </Button>
            ) : (
              <Button>
                <Package className="h-4 w-4 mr-2" />
                添加技能
              </Button>
            )}
          </EmptyContent>
        </Empty>
      )}

      {/* 详情对话框 */}
      <SkillDetailDialog
        skill={selectedSkill}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onFavorite={handleFavorite}
      />
    </div>
  )
}
