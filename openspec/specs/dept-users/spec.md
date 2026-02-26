# Department & Users Spec

部门与用户管理功能。

## 概述

提供组织架构部门树管理和用户分配功能，支持无限层级部门结构，实现用户与部门的关联管理。

## 功能能力

### 部门树管理
- 树形结构展示部门层级（支持无限层级）
- 左侧部门面板
  - 部门总数统计
  - 添加根部门按钮
- 部门节点交互
  - 左键点击：选中部门，查看成员
  - 右键点击：打开上下文菜单
- 右键上下文菜单
  - 添加子部门
  - 删除部门

### 用户管理
- 查看部门成员
  - 成员总数统计
  - 用户卡片展示
    - 姓名、职位
    - 邮箱
    - 用户 ID
    - 复选框（用于批量选择）
- 查看未分配部门的用户
  - 左侧"未分配部门"卡片
  - 未分配用户数量
  - 点击切换视图
- 批量操作
  - 多选用户（复选框）
  - 批量分配部门按钮

### 添加部门对话框
- 输入部门名称
- 支持根部门和子部门
- 确认/取消操作
- 回车键快速提交
- 必填验证

### 删除确认对话框
- 显示部门名称
- 提示删除限制（有子部门或用户则删除失败）
- 确认/取消操作

### 批量分配部门对话框
- 显示选中的用户数量
- 树形部门选择器
- 单选部门
- 确认/取消操作

## API 契约

### 获取部门树
```
GET /departments/tree
```

**响应**: `DepartmentNodeDto[]`
- `id`: number - 部门 ID
- `name`: string - 部门名称
- `parent_id`: number | null - 父部门 ID（根部门为 null）

### 获取部门用户
```
GET /departments/{departmentId}/users
```

**路径参数**:
- `departmentId`: number - 部门 ID（`-1` 表示未分配部门）

**响应**: `DepartmentUserDto[]`
- `id`: number - 用户 ID
- `name`: string - 用户姓名
- `title`: string - 职位
- `email`: string - 邮箱
- `department_id`: number | null - 所属部门 ID

### 创建部门
```
POST /departments
```

**请求体**: `CreateDepartmentDto`
- `name`: string - 部门名称
- `parent_id`: number | null - 父部门 ID（可选，根部门为 null）

**响应**: `DepartmentNodeDto`
- `id`: number - 部门 ID
- `name`: string - 部门名称
- `parent_id`: number | null - 父部门 ID

### 删除部门
```
DELETE /departments/{departmentId}
```

**路径参数**:
- `departmentId`: number - 部门 ID

**响应**: `DeleteDepartmentResponseDto`
- `deleted`: boolean - 是否删除成功
- `id`: number - 部门 ID

### 更新用户信息
```
PATCH /users/{userId}
```

**路径参数**:
- `userId`: number - 用户 ID

**请求体**: `UpdateUserDto`
- `name`: string - 用户姓名（可选）
- `email`: string - 邮箱（可选）
- `department_id`: number | null - 部门 ID（可选）

**响应**: `UpdatedUserDto`
- `id`: number - 用户 ID
- `repo_id`: number - 仓库 ID
- `gitlab_user_id`: number - GitLab 用户 ID
- `username`: string - Git 用户名
- `name`: string - 用户姓名
- `email`: string - 邮箱
- `department_id`: number | null - 部门 ID

### 批量更新用户部门
```
PATCH /users/department
```

**请求体**: `BatchUpdateDepartmentDto`
- `user_ids`: number[] - 用户 ID 数组
- `department_id`: number | null - 目标部门 ID（null 表示取消分配）

**响应**: `BatchUpdateDepartmentResponseDto`
- `updated`: number - 更新的用户数量

## 技术约束

- 后端 API 地址通过环境变量 `NEXT_PUBLIC_API_BASE_URL` 配置
- 所有请求使用 `cache: no-store` 防止缓存
- API 基础路径默认为 `http://localhost:8000`
- 请求头包含 `Accept: application/json` 和 `Content-Type: application/json`（POST/PATCH）
- 错误响应包含状态码和错误信息

## 特殊约定

### 未分配部门
- `department_id = -1` 用于查询未分配部门的用户
- 专门的"未分配部门"卡片入口
- 批量分配功能仅对未分配用户可见
