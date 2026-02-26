/**
 * API 客户端
 * 统一的 API 调用处理
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.2.121:8000'

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
 * 通用请求函数
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

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
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : '网络请求失败',
      },
    }
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
