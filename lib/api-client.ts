/**
 * API 客户端
 * 统一的 API 调用处理
 */

const DEFAULT_API_BASE_URL = 'http://localhost:8100'
const FALLBACK_API_BASE_URL = 'http://192.168.2.121:8000'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface ApiError {
  code: string
  message: string
}

/**
 * 解析可用 API 地址列表，优先使用环境变量，其次回退到历史服务器地址
 */
function getApiBaseUrls(): string[] {
  const primaryBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
  return Array.from(new Set([primaryBaseUrl, FALLBACK_API_BASE_URL]))
}

/**
 * 通用请求函数；如果首选地址连不上，则自动回退到备用服务器
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  let lastError: unknown = null

  for (const apiBaseUrl of getApiBaseUrls()) {
    try {
      const response = await fetch(`${apiBaseUrl}${endpoint}`, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: errorData.message || response.statusText || '请求失败',
          },
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data,
      }
    } catch (error) {
      lastError = error
    }
  }

  return {
    success: false,
    error: {
      code: 'NETWORK_ERROR',
      message: lastError instanceof Error ? lastError.message : '网络请求失败',
    },
  }
}

/**
 * GET 请求
 */
export function get<T>(endpoint: string, params?: Record<string, string | number>): Promise<ApiResponse<T>> {
  const queryString = params ? new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString() : ''
  const url = queryString ? `${endpoint}?${queryString}` : endpoint
  return request<T>(url, { method: 'GET' })
}

/**
 * POST 请求
 */
export function post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT 请求
 */
export function put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PATCH 请求
 */
export function patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE 请求
 */
export function del<T>(endpoint: string): Promise<ApiResponse<T>> {
  return request<T>(endpoint, { method: 'DELETE' })
}
