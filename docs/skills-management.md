# Skill 管理功能

## 概述

Skill 管理功能提供了完整的 AI 技能模块管理界面，支持技能的浏览、搜索、筛选、创建、编辑和删除操作。

## 功能特性

### 1. 技能列表展示
- **网格视图**: 响应式网格布局，支持多种屏幕尺寸
- **列表视图**: 紧凑的列表布局，展示更多详细信息
- **视图切换**: 用户可以在网格和列表视图之间自由切换

### 2. 搜索与筛选
- **关键词搜索**: 支持按技能名称、编码和描述搜索
- **标签筛选**: 预定义标签类别快速筛选
- **分类筛选**: 树形分类导航，支持多层级分类
- **状态筛选**: 按活跃、未激活、已废弃状态筛选
- **排序选项**: 支持按热度、最新、名称、收藏数排序

### 3. 技能详情
- **完整信息展示**: 技能编码、版本、状态等详细信息
- **统计数据显示**: 下载量、收藏数等统计数据
- **等级管理**: 支持多等级技能配置
- **安装指导**: 提供安装命令和配置说明

### 4. 技能管理
- **创建技能**: 完整的技能创建表单
- **编辑技能**: 修改现有技能信息
- **删除技能**: 删除不再需要的技能
- **标签管理**: 为技能添加多个标签
- **等级配置**: 配置技能的不同等级

### 5. 分页功能
- **灵活分页**: 可配置每页显示数量
- **页面导航**: 快速跳转到指定页面
- **总数显示**: 显示总记录数和当前范围

## 文件结构

```
app/skills/
├── layout.tsx          # Skills 模块布局
└── page.tsx            # Skills 主页面

components/skills/
├── index.ts                        # 组件导出索引
├── skills-page.tsx                 # 技能管理主页面组件
├── skill-list.tsx                  # 技能列表组件
├── skill-card.tsx                  # 技能卡片组件
├── skill-card-enhanced.tsx         # 增强版技能卡片
├── skill-filter-bar.tsx            # 基础筛选栏
├── skill-filter-bar-enhanced.tsx   # 增强版筛选栏
├── skill-form-dialog.tsx           # 技能表单对话框
├── skill-detail-dialog.tsx         # 技能详情对话框
├── category-tree.tsx               # 分类树组件
└── pagination.tsx                  # 分页组件
```

## API 集成

所有组件都已集成后端 API，API 端点为 `/api/v1/skills/*`：

### 技能相关 API
- `GET /api/v1/skills` - 获取技能列表
- `GET /api/v1/skills/:id` - 获取技能详情
- `POST /api/v1/skills` - 创建新技能
- `PATCH /api/v1/skills/:id` - 更新技能
- `DELETE /api/v1/skills/:id` - 删除技能

### 分类相关 API
- `GET /api/v1/skills/categories` - 获取分类列表
- `POST /api/v1/skills/categories` - 创建分类
- `PATCH /api/v1/skills/categories/:id` - 更新分类
- `DELETE /api/v1/skills/categories/:id` - 删除分类

## 使用方法

### 基础使用

```tsx
import { SkillsPage } from "@/components/skills"

export default function Page() {
  return <SkillsPage />
}
```

### 单独使用组件

```tsx
import { SkillList } from "@/components/skills"

function MyComponent() {
  const skills = [...] // 你的技能数据

  return (
    <SkillList
      skills={skills}
      viewMode="grid"
      onViewDetails={(skill) => console.log(skill)}
      onEdit={(skill) => console.log("Edit", skill)}
      onDelete={(skill) => console.log("Delete", skill)}
    />
  )
}
```

### 使用分类树

```tsx
import { CategoryTree } from "@/components/skills"

function MyComponent() {
  const categories = [...] // 你的分类数据

  return (
    <CategoryTree
      categories={categories}
      selectedCategory={selectedId}
      onSelectCategory={setSelectedId}
    />
  )
}
```

## 设计系统

所有组件都基于项目的设计系统构建：

- **UI 框架**: Radix UI + Tailwind CSS
- **卡片样式**: `rounded-xl shadow-sm`
- **响应式设计**: 支持移动端、平板和桌面端
- **主题支持**: 支持亮色和暗色主题
- **动画效果**: 平滑的过渡和悬停效果

## 参考设计

界面设计参考了 [MCP Market](https://mcpmarket.com/zh) 的卡片设计风格，包括：
- 卡片布局和间距
- 徽章和标签样式
- 悬停效果和交互反馈
- 空状态和加载状态

## 类型定义

```typescript
interface Skill {
  id: number
  code: string
  name: string
  category_id: number | null
  description: string | null
  levels: SkillLevel[]
  status: 'active' | 'inactive' | 'deprecated'
  tags: string[]
  download_count?: number
  favorite_count?: number
  is_official?: boolean
  is_featured?: boolean
  is_hot?: boolean
  icon?: string
  version?: string
  created_at: string
  updated_at: string
  category?: SkillCategory
}

interface SkillCategory {
  id: number
  name: string
  parent_id: number | null
  path: string
  description: string | null
  weight: number
  created_at: string
  updated_at: string
}
```

## 未来扩展

计划添加的功能：
- 技能版本管理
- 技能依赖关系图
- 批量导入/导出
- 技能使用统计
- 技能评分和评论
