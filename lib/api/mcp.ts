/**
 * MCP API 调用函数 - 与后端 API 对齐
 */

import { get, post, patch, del, ApiResponse } from '../api-client'
import type {
  McpService,
  McpConfigItem,
  McpServicesListResponse,
  McpConfigListResponse,
  McpServicesFilterParams,
  McpServiceCreateData,
  McpServiceUpdateData,
  McpConfigCreateData,
  McpConfigUpdateData,
  McpCatalog,
  McpCatalogListResponse,
  McpCatalogFilterParams,
  McpCatalogCreateData,
  McpCatalogUpdateData,
  McpCatalogStats,
} from '../types/mcp'

const API_PREFIX = '/api/v1/mcp'
const CATALOG_PREFIX = '/api/v1/mcps'

/**
 * 获取 MCP 服务列表
 */
export async function getMcpServices(
  params?: McpServicesFilterParams
): Promise<ApiResponse<McpServicesListResponse>> {
  return get<McpServicesListResponse>(`${API_PREFIX}/services`, params as Record<string, string | number>)
}

/**
 * 获取 MCP 服务详情
 */
export async function getMcpServiceDetail(id: number): Promise<ApiResponse<McpService>> {
  return get<McpService>(`${API_PREFIX}/services/${id}`)
}

/**
 * 创建 MCP 服务
 */
export async function createMcpService(data: McpServiceCreateData): Promise<ApiResponse<McpService>> {
  return post<McpService>(`${API_PREFIX}/services`, data)
}

/**
 * 更新 MCP 服务
 */
export async function updateMcpService(
  id: number,
  data: McpServiceUpdateData
): Promise<ApiResponse<McpService>> {
  return patch<McpService>(`${API_PREFIX}/services/${id}`, data)
}

/**
 * 删除 MCP 服务
 */
export async function deleteMcpService(id: number): Promise<ApiResponse<{ message: string; id?: number }>> {
  return del<{ message: string; id?: number }>(`${API_PREFIX}/services/${id}`)
}

/**
 * 获取 MCP 服务配置列表
 */
export async function getMcpServiceConfigs(id: number): Promise<ApiResponse<McpConfigListResponse>> {
  return get<McpConfigListResponse>(`${API_PREFIX}/services/${id}/config`)
}

/**
 * 获取 MCP 服务配置详情
 */
export async function getMcpServiceConfig(serviceId: number, configId: number): Promise<ApiResponse<McpConfigItem>> {
  return get<McpConfigItem>(`${API_PREFIX}/services/${serviceId}/config/${configId}`)
}

/**
 * 创建 MCP 服务配置
 */
export async function createMcpServiceConfig(
  serviceId: number,
  data: McpConfigCreateData
): Promise<ApiResponse<McpConfigItem>> {
  return post<McpConfigItem>(`${API_PREFIX}/services/${serviceId}/config`, data)
}

/**
 * 更新 MCP 服务配置
 */
export async function updateMcpServiceConfig(
  serviceId: number,
  configId: number,
  data: McpConfigUpdateData
): Promise<ApiResponse<McpConfigItem>> {
  return patch<McpConfigItem>(`${API_PREFIX}/services/${serviceId}/config/${configId}`, data)
}

/**
 * 删除 MCP 服务配置
 */
export async function deleteMcpServiceConfig(
  serviceId: number,
  configId: number
): Promise<ApiResponse<{ message: string; id?: number }>> {
  return del<{ message: string; id?: number }>(`${API_PREFIX}/services/${serviceId}/config/${configId}`)
}

// ============================================================================
// MCP 目录 API (MCP Catalog - 应用商店风格)
// ============================================================================

/**
 * 获取 MCP 目录列表
 */
export async function getMcpCatalog(
  params?: McpCatalogFilterParams
): Promise<ApiResponse<McpCatalogListResponse>> {
  return get<McpCatalogListResponse>(CATALOG_PREFIX, params as Record<string, string | number>)
}

/**
 * 获取 MCP 目录详情
 */
export async function getMcpCatalogDetail(id: number): Promise<ApiResponse<McpCatalog>> {
  return get<McpCatalog>(`${CATALOG_PREFIX}/${id}`)
}

/**
 * 获取 MCP 目录统计信息
 */
export async function getMcpCatalogStats(id: number): Promise<ApiResponse<McpCatalogStats>> {
  return get<McpCatalogStats>(`${CATALOG_PREFIX}/${id}/stats`)
}

/**
 * 创建 MCP 目录条目
 */
export async function createMcpCatalog(data: McpCatalogCreateData): Promise<ApiResponse<McpCatalog>> {
  return post<McpCatalog>(CATALOG_PREFIX, data)
}

/**
 * 更新 MCP 目录条目
 */
export async function updateMcpCatalog(
  id: number,
  data: McpCatalogUpdateData
): Promise<ApiResponse<McpCatalog>> {
  return patch<McpCatalog>(`${CATALOG_PREFIX}/${id}`, data)
}

/**
 * 删除 MCP 目录条目
 */
export async function deleteMcpCatalog(id: number): Promise<ApiResponse<{ message: string; id?: number }>> {
  return del<{ message: string; id?: number }>(`${CATALOG_PREFIX}/${id}`)
}
