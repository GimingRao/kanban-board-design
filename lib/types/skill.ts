/**
 * Skill 相关类型定义
 */

// 技能分类
export interface SkillCategory {
  id: number
  name: string
  parent_id: number | null
  path: string
  description: string | null
  weight: number
  created_at: string
  updated_at: string
}

// 技能等级
export interface SkillLevel {
  id: string
  name: string
  description?: string
  required_points?: number
}

// 技能标签
export interface SkillTag {
  id: string
  name: string
  color?: string
}

// 技能状态
export type SkillStatus = 'active' | 'inactive' | 'deprecated'

// 技能项
export interface Skill {
  id: number
  code: string
  name: string
  category_id: number | null
  description: string | null
  levels: SkillLevel[]
  status: SkillStatus
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

// 技能列表响应
export interface SkillsListResponse {
  success: boolean
  data: {
    items: Skill[]
    total: number
    page: number
    page_size: number
  }
}

// 技能筛选参数
export interface SkillsFilterParams {
  category_id?: number
  search?: string
  status?: SkillStatus
  sort_by?: 'name' | 'created_at' | 'download_count' | 'favorite_count'
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

// 技能表单数据
export interface SkillFormData {
  code: string
  name: string
  category_id?: number
  description?: string
  levels?: SkillLevel[]
  status: SkillStatus
  tags?: string[]
}

// 技能详情响应
export interface SkillDetailResponse {
  success: boolean
  data: Skill
}
