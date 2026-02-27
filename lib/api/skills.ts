/**
 * Skill API 调用函数
 */

import { get, post, patch, del, ApiResponse } from '../api-client'
import type {
  Skill,
  SkillCategory,
  SkillsListResponse,
  SkillsFilterParams,
  SkillFormData,
  SkillDetailResponse,
} from '../types/skill'

const API_PREFIX = '/api/v1/skills'

/**
 * 获取技能列表
 */
export async function getSkillsList(
  params?: SkillsFilterParams
): Promise<ApiResponse<SkillsListResponse['data']>> {
  return get<SkillsListResponse['data']>(`${API_PREFIX}`, params as Record<string, string | number>)
}

/**
 * 获取技能详情
 */
export async function getSkillDetail(id: number): Promise<ApiResponse<Skill>> {
  return get<Skill>(`${API_PREFIX}/${id}`)
}

/**
 * 创建技能
 */
export async function createSkill(data: SkillFormData): Promise<ApiResponse<Skill>> {
  const payload = {
    name: data.name,
    slug: data.code,
    description: data.description,
    category: data.category_id !== undefined ? String(data.category_id) : undefined,
  }
  return post<Skill>(`${API_PREFIX}`, payload)
}

/**
 * 更新技能
 */
export async function updateSkill(
  id: number,
  data: Partial<SkillFormData>
): Promise<ApiResponse<Skill>> {
  const payload = {
    name: data.name,
    slug: data.code,
    description: data.description,
    category: data.category_id !== undefined ? String(data.category_id) : undefined,
  }
  return patch<Skill>(`${API_PREFIX}/${id}`, payload)
}

/**
 * 删除技能
 */
export async function deleteSkill(id: number): Promise<ApiResponse<void>> {
  return del<void>(`${API_PREFIX}/${id}`)
}

/**
 * 获取技能分类列表
 */
export async function getSkillCategories(): Promise<ApiResponse<SkillCategory[]>> {
  return get<SkillCategory[]>(`${API_PREFIX}/categories`)
}

/**
 * 创建技能分类
 */
export async function createSkillCategory(
  data: Omit<SkillCategory, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<SkillCategory>> {
  return post<SkillCategory>(`${API_PREFIX}/categories`, data)
}

/**
 * 更新技能分类
 */
export async function updateSkillCategory(
  id: number,
  data: Partial<Omit<SkillCategory, 'id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<SkillCategory>> {
  return patch<SkillCategory>(`${API_PREFIX}/categories/${id}`, data)
}

/**
 * 删除技能分类
 */
export async function deleteSkillCategory(id: number): Promise<ApiResponse<void>> {
  return del<void>(`${API_PREFIX}/categories/${id}`)
}
