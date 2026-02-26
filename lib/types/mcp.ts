/**
 * MCP 相关类型定义 - 与后端 API 对齐
 */

// ============================================================================
// MCP 服务配置类型 (MCP Service - 已安装的服务配置管理)
// ============================================================================

// MCP 服务类型
export type McpServiceType = 'stdio' | 'sse' | 'websocket'

// MCP 值类型
export type McpValueType = 'string' | 'int' | 'bool' | 'json'

// MCP 配置项
export interface McpConfigItem {
  id: number
  service_id: number
  key: string
  value: string
  value_type: McpValueType
  description: string | null
  created_at: string
  updated_at: string
}

// MCP 服务
export interface McpService {
  id: number
  name: string
  description: string | null
  service_type: McpServiceType
  command: string | null
  args: string[] | null
  url: string | null
  enabled: boolean
  timeout: number
  config_count: number
  created_at: string
  updated_at: string
  // UI 扩展字段（后端可能没有，用于前端展示）
  is_official?: boolean
  is_featured?: boolean
  is_hot?: boolean
  icon?: string
  download_count?: number
  favorite_count?: number
  tags?: string[]
  provider?: string
  version?: string
}

// MCP 服务列表响应
export interface McpServicesListResponse {
  items: McpService[]
  total: number
  page: number
  page_size: number
}

// MCP 配置列表响应
export interface McpConfigListResponse {
  items: McpConfigItem[]
  total: number
}

// MCP 筛选参数
export interface McpServicesFilterParams {
  page?: number
  page_size?: number
  enabled_only?: boolean
  service_type?: string
  sort_by?: 'name' | 'created_at' | 'download_count' | 'favorite_count'
  sort_order?: 'asc' | 'desc'
}

// MCP 服务创建数据
export interface McpServiceCreateData {
  name: string
  description?: string
  service_type: McpServiceType
  command?: string
  args?: string[]
  url?: string
  enabled?: boolean
  timeout?: number
}

// MCP 服务更新数据
export interface McpServiceUpdateData {
  name?: string
  description?: string
  service_type?: McpServiceType
  command?: string
  args?: string[]
  url?: string
  enabled?: boolean
  timeout?: number
}

// MCP 配置创建数据
export interface McpConfigCreateData {
  key: string
  value: string
  value_type?: McpValueType
  description?: string
}

// MCP 配置更新数据
export interface McpConfigUpdateData {
  value?: string
  value_type?: McpValueType
  description?: string
}

// ============================================================================
// MCP 目录类型 (MCP Catalog - 应用商店风格)
// ============================================================================

// MCP 分类
export type McpCatalogCategory =
  | 'development-tools'
  | 'api-development'
  | 'data-science'
  | 'productivity'
  | 'web-scraping'
  | 'database'
  | 'browser-automation'
  | 'collaboration'
  | 'content-management'
  | 'security-testing'

// MCP 目录条目（应用商店中的 MCP 工具）
export interface McpCatalog {
  id: number
  code: string
  name: string
  description: string | null
  category: McpCatalogCategory | null
  version: string
  homepage_url: string | null
  repository_url: string | null
  author: string | null
  license: string | null
  download_count: number
  favorite_count: number
  is_official: boolean
  is_featured: boolean
  is_hot: boolean
  tags: string[]
  icon: string | null
  created_at: string
  updated_at: string
}

// MCP 目录统计信息
export interface McpCatalogStats {
  mcp_id: number
  total_downloads: number
  total_favorites: number
  total_services: number
  active_services: number
  recent_downloads: number
}

// MCP 目录列表响应
export interface McpCatalogListResponse {
  items: McpCatalog[]
  total: number
  page: number
  page_size: number
}

// MCP 目录筛选参数
export interface McpCatalogFilterParams {
  page?: number
  page_size?: number
  category?: McpCatalogCategory
  search?: string
  is_official?: boolean
  is_featured?: boolean
  is_hot?: boolean
  sort_by?: 'name' | 'created_at' | 'download_count' | 'favorite_count'
  sort_order?: 'asc' | 'desc'
}

// MCP 目录创建数据
export interface McpCatalogCreateData {
  code: string
  name: string
  description?: string
  category?: McpCatalogCategory
  version: string
  homepage_url?: string
  repository_url?: string
  author?: string
  license?: string
  tags?: string[]
  icon?: string
}

// MCP 目录更新数据
export interface McpCatalogUpdateData {
  name?: string
  description?: string
  category?: McpCatalogCategory
  version?: string
  homepage_url?: string
  repository_url?: string
  author?: string
  license?: string
  tags?: string[]
  icon?: string
}
