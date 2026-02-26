"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { SkillCard } from "./skill-card-enhanced"
import { SkillFilterBar } from "./skill-filter-bar"
import { SkillDetailDialog } from "./skill-detail-dialog"
import { SkillFormDialog } from "./skill-form-dialog"
import { CategoryTree } from "./category-tree"
import { Pagination } from "./pagination"
import { getSkillsList, getSkillCategories } from "@/lib/api/skills"
import type { Skill, SkillCategory } from "@/lib/types/skill"
import { Package, Loader2, List, Grid } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [sortBy, setSortBy] = useState("download_count")
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [totalItems, setTotalItems] = useState(0)
  const [showCategoryTree, setShowCategoryTree] = useState(true)

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const [skillsResult, categoriesResult] = await Promise.all([
        getSkillsList({
          sort_by: sortBy as any,
          sort_order: 'desc',
          page: currentPage,
          page_size: pageSize
        }),
        getSkillCategories(),
      ])

      if (skillsResult.success && skillsResult.data) {
        setSkills(skillsResult.data.items || [])
        setTotalItems(skillsResult.data.total || 0)
      } else if (skillsResult.error) {
        toast.error("加载技能列表失败", {
          description: skillsResult.error.message,
        })
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

  useEffect(() => {
    loadData()
  }, [sortBy, currentPage])

  // 筛选技能
  const filteredSkills = skills.filter((skill) => {
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        skill.name.toLowerCase().includes(query) ||
        (skill.description?.toLowerCase().includes(query)) ||
        (skill.code?.toLowerCase().includes(query))
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

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingSkill(null)
    setFormOpen(true)
  }

  const handleDelete = async (skill: Skill) => {
    // TODO: 实现删除功能
    toast.success("删除功能待实现")
  }

  const handleFavorite = (skillId: number) => {
    toast.success("已添加到收藏")
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditingSkill(null)
    loadData()
    toast.success(editingSkill ? "技能更新成功" : "技能创建成功")
  }

  if (loading) {
    return (
      <div className="flex h-full">
        {/* 侧边栏骨架 */}
        <div className={cn(
          "w-64 border-r bg-muted/30 p-4 space-y-4",
          !showCategoryTree && "hidden"
        )}>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-40 w-full" />
        </div>

        {/* 主内容骨架 */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const hasActiveFilters = searchQuery || selectedTag !== "all" || selectedCategory !== undefined

  return (
    <div className="flex h-full">
      {/* 左侧分类树 */}
      {showCategoryTree && (
        <div className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">分类导航</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowCategoryTree(false)}
            >
              <List className="h-3 w-3" />
            </Button>
          </div>
          <CategoryTree
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      )}

      {/* 右侧主内容 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">技能管理</h1>
                {!showCategoryTree && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowCategoryTree(true)}
                    title="显示分类树"
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                浏览、搜索和管理可复用的 AI 技能模块
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleCreate}>
                <Package className="h-4 w-4 mr-2" />
                添加技能
              </Button>
            </div>
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

          {/* 技能网格/列表 */}
          {filteredSkills.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                显示 {filteredSkills.length} 个技能，共 {skills.length} 个
              </div>
              <div className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "flex flex-col gap-3"
              )}>
                {filteredSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    viewMode={viewMode}
                  />
                ))}
              </div>

              {/* 分页 */}
              {totalItems > pageSize && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalItems / pageSize)}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <Empty className="border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package className="h-10 w-10" />
                </EmptyMedia>
                <EmptyTitle>
                  {hasActiveFilters ? "未找到匹配的技能" : "暂无技能"}
                </EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? "请尝试调整搜索关键词或筛选条件"
                    : "开始添加您的第一个技能模块"}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {hasActiveFilters ? (
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
                  <Button onClick={handleCreate}>
                    <Package className="h-4 w-4 mr-2" />
                    添加技能
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          )}
        </div>
      </div>

      {/* 详情对话框 */}
      <SkillDetailDialog
        skill={selectedSkill}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onFavorite={handleFavorite}
        onEdit={handleEdit}
      />

      {/* 表单对话框 */}
      <SkillFormDialog
        skill={editingSkill}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
        categories={categories}
      />
    </div>
  )
}
