/**
 * Skill 管理组件使用示例
 *
 * 本文件展示了如何使用 Skill 管理的各个组件
 */

import { useState } from "react"
import {
  SkillList,
  SkillCard,
  CategoryTree,
  Pagination,
  SkillFilterBar,
  SkillDetailDialog,
  SkillFormDialog,
} from "@/components/skills"
import type { Skill, SkillCategory } from "@/lib/types/skill"

// ========== 示例 1: 使用 SkillList 组件 ==========

export function SkillListExample() {
  const [skills, setSkills] = useState<Skill[]>([
    {
      id: 1,
      code: "data-processor",
      name: "数据处理器",
      description: "高效处理各类数据格式",
      category_id: 1,
      status: "active",
      tags: ["数据处理", "自动化"],
      download_count: 1250,
      favorite_count: 89,
      is_official: true,
      version: "1.0.0",
      levels: [],
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
  ])

  const handleViewDetails = (skill: Skill) => {
    console.log("查看详情:", skill)
  }

  const handleEdit = (skill: Skill) => {
    console.log("编辑:", skill)
  }

  const handleDelete = (skill: Skill) => {
    console.log("删除:", skill)
  }

  return (
    <div>
      {/* 网格视图 */}
      <SkillList
        skills={skills}
        viewMode="grid"
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 列表视图 */}
      <SkillList
        skills={skills}
        viewMode="list"
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}

// ========== 示例 2: 使用 CategoryTree 组件 ==========

export function CategoryTreeExample() {
  const [categories] = useState<SkillCategory[]>([
    {
      id: 1,
      name: "数据处理",
      parent_id: null,
      path: "/data-processing",
      description: "各类数据处理技能",
      weight: 10,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
    {
      id: 2,
      name: "文件操作",
      parent_id: 1,
      path: "/data-processing/file-ops",
      description: "文件读写操作",
      weight: 5,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
  ])

  const [selectedCategory, setSelectedCategory] = useState<number>()

  return (
    <div className="w-64 p-4">
      <CategoryTree
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <p>当前选中分类: {selectedCategory ?? "全部"}</p>
    </div>
  )
}

// ========== 示例 3: 使用 Pagination 组件 ==========

export function PaginationExample() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const totalItems = 150

  return (
    <div className="p-4">
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalItems / pageSize)}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}

// ========== 示例 4: 使用 SkillFilterBar 组件 ==========

export function SkillFilterBarExample() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("all")
  const [sortBy, setSortBy] = useState("download_count")
  const [selectedCategory, setSelectedCategory] = useState<number>()

  const categories: SkillCategory[] = []

  return (
    <div className="p-4">
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
      />
    </div>
  )
}

// ========== 示例 5: 使用 SkillDetailDialog 组件 ==========

export function SkillDetailDialogExample() {
  const [open, setOpen] = useState(false)
  const [skill, setSkill] = useState<Skill | null>(null)

  const sampleSkill: Skill = {
    id: 1,
    code: "example-skill",
    name: "示例技能",
    description: "这是一个示例技能",
    category_id: 1,
    status: "active",
    tags: ["示例", "测试"],
    download_count: 100,
    favorite_count: 10,
    version: "1.0.0",
    levels: [
      {
        id: "basic",
        name: "基础",
        description: "基础等级",
        required_points: 0,
      },
    ],
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  }

  return (
    <>
      <button onClick={() => { setSkill(sampleSkill); setOpen(true) }}>
        查看详情
      </button>

      <SkillDetailDialog
        skill={skill}
        open={open}
        onOpenChange={setOpen}
        onFavorite={(id) => console.log("收藏:", id)}
        onEdit={(s) => console.log("编辑:", s)}
      />
    </>
  )
}

// ========== 示例 6: 使用 SkillFormDialog 组件 ==========

export function SkillFormDialogExample() {
  const [open, setOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)

  const categories: SkillCategory[] = []

  const handleSuccess = () => {
    console.log("保存成功")
    setOpen(false)
  }

  return (
    <>
      <button onClick={() => { setEditingSkill(null); setOpen(true) }}>
        创建新技能
      </button>

      <SkillFormDialog
        skill={editingSkill}
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
        categories={categories}
      />
    </>
  )
}

// ========== 示例 7: 完整的技能管理页面 ==========

export function CompleteSkillManagementExample() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

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

  const handleDelete = (skill: Skill) => {
    if (confirm(`确定要删除技能 "${skill.name}" 吗？`)) {
      setSkills(skills.filter((s) => s.id !== skill.id))
    }
  }

  return (
    <div className="flex h-screen">
      {/* 左侧分类树 */}
      <div className="w-64 border-r p-4">
        <CategoryTree
          categories={categories}
          onSelectCategory={(id) => console.log("选择分类:", id)}
        />
      </div>

      {/* 右侧主内容 */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 筛选栏 */}
        <SkillFilterBar
          searchQuery=""
          onSearchChange={(q) => console.log("搜索:", q)}
          selectedTag="all"
          onTagChange={(tag) => console.log("标签:", tag)}
          sortBy="download_count"
          onSortChange={(sort) => console.log("排序:", sort)}
          categories={categories}
        />

        {/* 技能列表 */}
        <SkillList
          skills={skills}
          viewMode="grid"
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* 分页 */}
        <Pagination
          currentPage={1}
          totalPages={10}
          pageSize={12}
          totalItems={120}
          onPageChange={(page) => console.log("页面:", page)}
        />

        {/* 添加技能按钮 */}
        <button onClick={handleCreate}>添加技能</button>
      </div>

      {/* 详情对话框 */}
      <SkillDetailDialog
        skill={selectedSkill}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onFavorite={(id) => console.log("收藏:", id)}
        onEdit={handleEdit}
      />

      {/* 表单对话框 */}
      <SkillFormDialog
        skill={editingSkill}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false)
          // 重新加载数据
        }}
        categories={categories}
      />
    </div>
  )
}

// ========== 示例 8: 自定义 SkillCard ==========

export function CustomSkillCardExample() {
  const skill: Skill = {
    id: 1,
    code: "custom",
    name: "自定义技能卡片",
    description: "使用自定义样式的技能卡片",
    category_id: 1,
    status: "active",
    tags: ["自定义"],
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  }

  return (
    <div className="p-4">
      <SkillCard
        skill={skill}
        viewMode="grid"
        onViewDetails={(s) => console.log("查看:", s)}
        className="shadow-lg border-2"
      />
    </div>
  )
}
