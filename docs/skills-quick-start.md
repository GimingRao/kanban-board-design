# Skill 管理功能 - 快速启动指南

## 访问页面

启动开发服务器后，访问以下 URL：

```
http://localhost:3000/skills
```

## 文件结构

```
kanban-board-design/
├── app/skills/                    # Skills 页面
│   ├── layout.tsx                 # 模块布局
│   └── page.tsx                   # 主页面
│
├── components/skills/             # Skills 组件
│   ├── index.ts                   # 组件导出
│   ├── skills-page.tsx           # 主页面组件 ⭐
│   ├── skill-list.tsx            # 列表组件
│   ├── skill-card.tsx            # 卡片组件
│   ├── skill-card-enhanced.tsx   # 增强卡片
│   ├── skill-filter-bar.tsx      # 基础筛选
│   ├── skill-filter-bar-enhanced.tsx  # 高级筛选
│   ├── skill-detail-dialog.tsx   # 详情对话框
│   ├── skill-form-dialog.tsx     # 表单对话框
│   ├── category-tree.tsx         # 分类树
│   └── pagination.tsx            # 分页
│
├── lib/
│   ├── types/skill.ts            # 类型定义
│   ├── api/skills.ts             # API 调用
│   └── mocks/skills.ts           # 模拟数据
│
└── docs/
    ├── skills-management.md      # 功能文档
    ├── skills-examples.md        # 使用示例
    └── skills-implementation-summary.md  # 实现总结
```

## 主要功能

### 1. 浏览技能
- 网格视图 / 列表视图切换
- 响应式布局
- 卡片悬停效果

### 2. 搜索筛选
- 关键词搜索（名称、编码、描述）
- 标签筛选
- 分类筛选（树形导航）
- 状态筛选（活跃/未激活/已废弃）
- 多种排序方式

### 3. 技能管理
- 创建新技能
- 编辑现有技能
- 删除技能
- 查看详情

### 4. 分类管理
- 树形分类导航
- 多层级支持
- 可折叠/展开

## 组件使用

### 完整页面

```tsx
import { SkillsPage } from "@/components/skills"

export default function Page() {
  return <SkillsPage />
}
```

### 单独使用组件

```tsx
import {
  SkillList,
  CategoryTree,
  SkillFilterBar
} from "@/components/skills"

export default function MyPage() {
  return (
    <div className="flex">
      <CategoryTree {...props} />
      <div className="flex-1">
        <SkillFilterBar {...props} />
        <SkillList {...props} />
      </div>
    </div>
  )
}
```

## API 集成

### 配置 API 基础 URL

在 `.env.local` 中设置：

```
NEXT_PUBLIC_API_BASE_URL=http://your-api-server.com
```

### API 端点

```
GET    /api/v1/skills              # 获取技能列表
GET    /api/v1/skills/:id          # 获取技能详情
POST   /api/v1/skills              # 创建技能
PATCH  /api/v1/skills/:id          # 更新技能
DELETE /api/v1/skills/:id          # 删除技能
GET    /api/v1/skills/categories   # 获取分类列表
```

## 类型定义

### Skill

```typescript
interface Skill {
  id: number
  code: string              // 技能编码（唯一）
  name: string              // 技能名称
  category_id: number | null
  description: string | null
  levels: SkillLevel[]      // 技能等级
  status: 'active' | 'inactive' | 'deprecated'
  tags: string[]            // 标签列表
  download_count?: number
  favorite_count?: number
  is_official?: boolean
  is_featured?: boolean
  is_hot?: boolean
  icon?: string             // 图标 URL 或 emoji
  version?: string
  created_at: string
  updated_at: string
  category?: SkillCategory
}
```

### SkillCategory

```typescript
interface SkillCategory {
  id: number
  name: string
  parent_id: number | null   // 父分类 ID
  path: string               // 分类路径
  description: string | null
  weight: number             // 排序权重
  created_at: string
  updated_at: string
}
```

## 开发和测试

### 使用模拟数据

```tsx
import { mockSkills, mockCategories } from "@/lib/mocks/skills"

// 直接使用模拟数据进行开发
const skills = mockSkills
const categories = mockCategories
```

### 运行验证

```bash
npm run dev
```

访问 http://localhost:3000/skills

## 常见问题

### Q: 如何自定义卡片样式？

A: `SkillCard` 组件支持 `className` prop：

```tsx
<SkillCard
  skill={skill}
  className="shadow-lg border-2"
  onViewDetails={handleView}
/>
```

### Q: 如何添加自定义筛选选项？

A: 扩展 `TAG_CATEGORIES` 数组或创建自定义筛选组件。

### Q: 如何处理大列表性能？

A: 实现虚拟滚动或使用分页组件。

### Q: 如何集成到现有页面？

A: 直接导入 `SkillsPage` 组件或使用单个子组件。

## 下一步

1. 阅读完整文档：`docs/skills-management.md`
2. 查看使用示例：`docs/skills-examples.md`
3. 了解实现细节：`docs/skills-implementation-summary.md`

## 支持

如有问题，请查看：
- 项目 README
- API 文档
- 组件源码注释
