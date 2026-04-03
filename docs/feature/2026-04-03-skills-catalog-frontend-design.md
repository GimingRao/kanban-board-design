# Skills 目录页前端设计文档

**日期：** 2026-04-03
**作者：** Codex
**状态：** 待实现

---

## 1. 概述

### 1.1 背景

当前希望将 `/Users/giming/ai_work_space/page/index.html` 中的 Skills 管理页面接入现有前端系统，但不在本地系统中存储具体 Skill 内容。

Skill 的真实内容统一存放在 GitLab 仓库中，系统仅维护 Skills 的索引信息，并提供跳转到 GitLab 仓库目录或 `SKILL.md` 的能力。

### 1.2 目标

前端新增一个独立的 Skills 目录页，支持：

1. 展示 Skill 列表
2. 按关键词和标签筛选
3. 查看 Skill 基本信息
4. 复制安装命令
5. 跳转到 GitLab 仓库查看 Skill 目录或 `SKILL.md`

### 1.3 非目标

本期不包含：

- 在系统内渲染完整 `SKILL.md` 内容
- 在系统内上传或编辑 Skill 内容
- 技能包下载
- 本地文件存储或对象存储管理
- 复杂版本历史对比

---

## 2. 页面定位

Skills 页定位为“技能目录入口页”，而不是“技能内容托管页”。

系统负责：

- 展示技能索引信息
- 提供检索与筛选
- 提供 GitLab 跳转入口

GitLab 仓库负责：

- 存储真实 Skill 内容
- 展示 `SKILL.md`
- 管理目录结构、历史版本和变更记录

---

## 3. 信息架构

### 3.1 页面结构

建议新增独立页面路由：

- `app/skills/page.tsx`

页面整体结构：

1. 顶部 Header
2. Hero 区域
3. 搜索框
4. 标签筛选区
5. Skills 列表
6. Skill 详情弹窗

### 3.2 详情弹窗调整

原始 HTML 中的详情弹窗包含 `概览` 和 `Skills.md` 两个 Tab。

本次改造后建议调整为：

1. `概览`
2. `仓库链接`

其中：

- `概览` 展示描述、标签、版本、更新时间、安装命令
- `仓库链接` 展示：
  - GitLab 仓库链接
  - Skill 目录链接
  - `SKILL.md` 链接

不再在弹窗内直接展示 markdown 正文。

---

## 4. 交互设计

### 4.1 列表页交互

支持以下行为：

1. 输入关键词筛选 Skill 名称
2. 点击标签 Chip 筛选
3. 点击 Skill 行打开详情弹窗

### 4.2 弹窗交互

弹窗中保留以下操作：

1. `复制安装命令`
2. `查看仓库`
3. `查看 SKILL.md`

移除原型中的：

1. `下载压缩包`
2. 内嵌 markdown 阅读

### 4.3 导航入口

建议在现有顶部导航中新增一个 Skills 入口，点击后跳转到：

- `/skills`

如果暂时不希望改动首页 Tab，也可先通过直接路由访问，后续再补入口。

---

## 5. 前端数据模型

建议在 `lib/api.ts` 中新增 DTO：

```ts
export interface SkillListItemDto {
  id: number
  slug: string
  name: string
  description: string
  version: string
  author_name: string
  install_command?: string | null
  tags: string[]
  updated_at: string
  gitlab_repo_url: string
  gitlab_tree_url: string
  gitlab_skill_doc_url?: string | null
}

export interface SkillDetailDto extends SkillListItemDto {
  repo_path?: string | null
}
```

### 5.1 页面字段映射

原型字段与接口字段映射如下：

| 原型字段 | 接口字段 |
| --- | --- |
| `name` | `name` |
| `desc` | `description` |
| `version` | `version` |
| `date` | `updated_at` |
| `tags` | `tags` |
| `command` | `install_command` |

原型中的 `downloads` 本期建议移除，避免为了这个字段增加额外统计逻辑。

---

## 6. API 使用方案

### 6.1 列表接口

```ts
export function fetchSkills(options?: {
  keyword?: string
  tag?: string
  page?: number
  page_size?: number
}): Promise<{
  items: SkillListItemDto[]
  total: number
  page: number
  page_size: number
}>
```

### 6.2 详情接口

```ts
export function fetchSkillDetail(slug: string): Promise<SkillDetailDto>
```

### 6.3 页面加载策略

建议：

1. 页面首屏请求列表接口
2. 详情弹窗打开时再请求详情接口

这样可避免首页一次性拉取过多字段。

---

## 7. 组件拆分建议

建议新增以下组件：

```text
app/
└── skills/
    └── page.tsx

components/
└── skills/
    ├── skills-page.tsx
    ├── skills-toolbar.tsx
    ├── skills-list.tsx
    ├── skill-list-item.tsx
    └── skill-detail-dialog.tsx
```

职责建议：

- `skills-page.tsx`
  页面容器，负责数据拉取与状态管理
- `skills-toolbar.tsx`
  搜索框与标签筛选
- `skills-list.tsx`
  列表容器
- `skill-list-item.tsx`
  单个 Skill 条目
- `skill-detail-dialog.tsx`
  详情弹窗与跳转动作

---

## 8. 样式改造建议

原始 HTML 为一套独立视觉稿，建议在 React 化时保留其主要视觉特点：

- 暖色浅底背景
- 卡片式玻璃感面板
- 圆角标签与按钮
- Hero 区域的安装命令展示

但应做以下收敛：

1. 统一接入现有项目样式体系
2. 避免大段内联 CSS，拆分为可维护的 Tailwind 类
3. 弹窗和按钮尽量复用现有 UI 组件

---

## 9. 状态管理建议

本页面交互较轻，使用 `useState` 即可。

建议状态包括：

- `keyword`
- `activeTag`
- `selectedSkillSlug`
- `detailOpen`
- `skills`
- `skillsLoading`
- `detail`
- `detailLoading`

不需要引入额外状态管理库。

---

## 10. 异常与空态

需要覆盖以下前端状态：

1. 列表加载中
2. 列表为空
3. 列表加载失败
4. 详情加载失败
5. `gitlab_skill_doc_url` 缺失

当 `gitlab_skill_doc_url` 缺失时，弹窗中仍允许用户点击“查看仓库”，并隐藏“查看 SKILL.md”按钮。

---

## 11. 实施步骤

建议按以下顺序实现：

1. 新增 `/skills` 页面路由与静态 mock 数据
2. 将原始 HTML 拆分为 React 组件
3. 接入列表接口
4. 接入详情接口
5. 增加 GitLab 跳转与复制安装命令
6. 在全站导航中补充 Skills 入口

---

## 12. 验收标准

前端完成后，应满足：

1. 可访问 `/skills` 页面
2. 可按关键词和标签筛选
3. 可打开 Skill 详情弹窗
4. 可复制安装命令
5. 可跳转 GitLab 仓库目录
6. 可跳转 `SKILL.md`
7. 当后端无数据时页面具备清晰空态

