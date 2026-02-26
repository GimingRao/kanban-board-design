/**
 * Skill 管理功能的模拟数据
 * 用于开发和测试
 */

import type { Skill, SkillCategory } from "@/lib/types/skill"

// ========== 模拟分类数据 ==========

export const mockCategories: SkillCategory[] = [
  {
    id: 1,
    name: "数据处理",
    parent_id: null,
    path: "/data-processing",
    description: "各类数据处理和转换技能",
    weight: 10,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "文件操作",
    parent_id: 1,
    path: "/data-processing/file-operations",
    description: "文件读写和处理操作",
    weight: 8,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    name: "数据转换",
    parent_id: 1,
    path: "/data-processing/data-transform",
    description: "数据格式转换技能",
    weight: 7,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 4,
    name: "API 调用",
    parent_id: null,
    path: "/api-calls",
    description: "HTTP API 请求相关技能",
    weight: 9,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 5,
    name: "网络请求",
    parent_id: 4,
    path: "/api-calls/network",
    description: "网络请求处理技能",
    weight: 6,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 6,
    name: "自动化",
    parent_id: null,
    path: "/automation",
    description: "自动化任务相关技能",
    weight: 8,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 7,
    name: "安全",
    parent_id: null,
    path: "/security",
    description: "安全相关技能",
    weight: 5,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 8,
    name: "日志监控",
    parent_id: null,
    path: "/logging",
    description: "日志和监控相关技能",
    weight: 4,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

// ========== 模拟技能数据 ==========

export const mockSkills: Skill[] = [
  {
    id: 1,
    code: "json-parser",
    name: "JSON 解析器",
    description: "高效的 JSON 数据解析和处理技能，支持大文件流式处理",
    category_id: 3,
    status: "active",
    tags: ["json", "解析", "数据处理"],
    download_count: 15420,
    favorite_count: 892,
    is_official: true,
    is_featured: true,
    version: "2.1.0",
    icon: "📄",
    levels: [
      {
        id: "basic",
        name: "基础",
        description: "基本的 JSON 解析功能",
        required_points: 0,
      },
      {
        id: "advanced",
        name: "高级",
        description: "支持流式处理大文件",
        required_points: 100,
      },
    ],
    category: mockCategories[2],
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-02-10T00:00:00Z",
  },
  {
    id: 2,
    code: "file-watcher",
    name: "文件监视器",
    description: "实时监视文件系统变化，支持多种事件类型",
    category_id: 2,
    status: "active",
    tags: ["文件", "监视", "自动化"],
    download_count: 8932,
    favorite_count: 456,
    is_hot: true,
    version: "1.5.2",
    icon: "👁️",
    levels: [
      {
        id: "basic",
        name: "基础",
        description: "基本的文件监视功能",
        required_points: 0,
      },
    ],
    category: mockCategories[1],
    created_at: "2024-01-20T00:00:00Z",
    updated_at: "2024-02-05T00:00:00Z",
  },
  {
    id: 3,
    code: "http-client",
    name: "HTTP 客户端",
    description: "强大的 HTTP 请求客户端，支持重试、超时、认证等功能",
    category_id: 5,
    status: "active",
    tags: ["http", "api", "网络"],
    download_count: 12580,
    favorite_count: 723,
    is_official: true,
    version: "3.0.1",
    icon: "🌐",
    levels: [
      {
        id: "basic",
        name: "基础",
        description: "基本的 HTTP 请求",
        required_points: 0,
      },
      {
        id: "authenticated",
        name: "认证",
        description: "支持多种认证方式",
        required_points: 50,
      },
      {
        id: "advanced",
        name: "高级",
        description: "完整的重试和错误处理",
        required_points: 150,
      },
    ],
    category: mockCategories[4],
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-02-12T00:00:00Z",
  },
  {
    id: 4,
    code: "csv-processor",
    name: "CSV 处理器",
    description: "CSV 文件读写和处理，支持大数据量",
    category_id: 3,
    status: "active",
    tags: ["csv", "文件", "数据处理"],
    download_count: 6234,
    favorite_count: 234,
    version: "1.2.0",
    icon: "📊",
    levels: [
      {
        id: "basic",
        name: "基础",
        description: "基本的 CSV 读写",
        required_points: 0,
      },
    ],
    category: mockCategories[2],
    created_at: "2024-01-25T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  },
  {
    id: 5,
    code: "task-scheduler",
    name: "任务调度器",
    description: "灵活的定时任务调度，支持 Cron 表达式",
    category_id: 6,
    status: "active",
    tags: ["调度", "定时", "自动化"],
    download_count: 9876,
    favorite_count: 567,
    is_featured: true,
    version: "2.3.0",
    icon: "⏰",
    levels: [
      {
        id: "basic",
        name: "基础",
        description: "简单的定时任务",
        required_points: 0,
      },
      {
        id: "cron",
        name: "Cron",
        description: "支持 Cron 表达式",
        required_points: 100,
      },
    ],
    category: mockCategories[5],
    created_at: "2024-01-18T00:00:00Z",
    updated_at: "2024-02-08T00:00:00Z",
  },
  {
    id: 6,
    code: "data-validator",
    name: "数据验证器",
    description: "强大的数据验证工具，支持多种验证规则",
    category_id: 1,
    status: "active",
    tags: ["验证", "数据", "安全"],
    download_count: 7654,
    favorite_count: 389,
    version: "1.8.0",
    icon: "✓",
    levels: [
      {
        id: "basic",
        name: "基础",
        description: "基本的数据类型验证",
        required_points: 0,
      },
      {
        id: "schema",
        name: "Schema",
        description: "支持 Schema 验证",
        required_points: 80,
      },
    ],
    category: mockCategories[0],
    created_at: "2024-01-22T00:00:00Z",
    updated_at: "2024-02-03T00:00:00Z",
  },
  {
    id: 7,
    code: "xml-parser",
    name: "XML 解析器",
    description: "XML 文档解析和处理",
    category_id: 3,
    status: "inactive",
    tags: ["xml", "解析"],
    download_count: 2345,
    favorite_count: 123,
    version: "1.0.0",
    icon: "📋",
    levels: [],
    category: mockCategories[2],
    created_at: "2024-01-12T00:00:00Z",
    updated_at: "2024-01-12T00:00:00Z",
  },
  {
    id: 8,
    code: "log-analyzer",
    name: "日志分析器",
    description: "日志文件分析和统计工具",
    category_id: 8,
    status: "active",
    tags: ["日志", "分析", "监控"],
    download_count: 4567,
    favorite_count: 234,
    is_hot: true,
    version: "1.3.0",
    icon: "📈",
    levels: [
      {
        id: "basic",
        name: "基础",
        description: "基本的日志解析",
        required_points: 0,
      },
      {
        id: "advanced",
        name: "高级",
        description: "支持多日志源关联分析",
        required_points: 120,
      },
    ],
    category: mockCategories[7],
    created_at: "2024-01-28T00:00:00Z",
    updated_at: "2024-02-06T00:00:00Z",
  },
  {
    id: 9,
    code: "rate-limiter",
    name: "速率限制器",
    description: "API 请求速率限制控制",
    category_id: 4,
    status: "active",
    tags: ["限流", "api", "安全"],
    download_count: 5432,
    favorite_count: 287,
    version: "1.1.0",
    icon: "🚦",
    levels: [],
    category: mockCategories[3],
    created_at: "2024-01-30T00:00:00Z",
    updated_at: "2024-02-02T00:00:00Z",
  },
  {
    id: 10,
    code: "base64-encoder",
    name: "Base64 编解码器",
    description: "Base64 格式的编码和解码工具",
    category_id: 1,
    status: "active",
    tags: ["base64", "编码", "解码"],
    download_count: 3210,
    favorite_count: 156,
    version: "1.0.0",
    icon: "🔤",
    levels: [],
    category: mockCategories[0],
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  },
]

// ========== 辅助函数 ==========

/**
 * 获取指定分类的技能
 */
export function getSkillsByCategory(categoryId: number): Skill[] {
  return mockSkills.filter((skill) => skill.category_id === categoryId)
}

/**
 * 根据 ID 获取技能
 */
export function getSkillById(id: number): Skill | undefined {
  return mockSkills.find((skill) => skill.id === id)
}

/**
 * 根据 ID 获取分类
 */
export function getCategoryById(id: number): SkillCategory | undefined {
  return mockCategories.find((category) => category.id === id)
}

/**
 * 获取根分类
 */
export function getRootCategories(): SkillCategory[] {
  return mockCategories.filter((category) => category.parent_id === null)
}

/**
 * 获取指定分类的子分类
 */
export function getChildCategories(parentId: number): SkillCategory[] {
  return mockCategories.filter((category) => category.parent_id === parentId)
}

/**
 * 搜索技能
 */
export function searchSkills(query: string): Skill[] {
  const lowerQuery = query.toLowerCase()
  return mockSkills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(lowerQuery) ||
      skill.code.toLowerCase().includes(lowerQuery) ||
      skill.description?.toLowerCase().includes(lowerQuery) ||
      skill.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}
