# Git Metrics Spec

Git 代码提交统计与开发者绩效分析功能。

## 概述

提供 Git 仓库代码提交数据的可视化统计分析，支持单仓库和多仓库聚合视图，帮助团队了解代码贡献趋势和开发者绩效。

## 功能能力

### 仓库选择
- 支持单仓库视图
- 支持所有仓库聚合视图（`repo_id = -1`）
- 仓库选择器下拉菜单

### 月度趋势图
- 时间范围选择器（开始月份 / 结束月份）
  - 最多支持 36 个月范围
  - 最近 36 个月可选
- 柱状图展示每人每工作日行数变化
  - 绿色柱：每人每工作日增加行数
  - 橙色柱：每人每工作日减少行数
- 显示模式切换
  - 全部：同时显示增加和减少
  - 仅增加：只显示增加行数
  - 仅减少：只显示减少行数
- 点击柱状图可联动选中月份
- 底部统计卡片
  - 月均每人每工作日增加
  - 月均每人每工作日减少

### 提交排行榜
- 月份选择器（最近 12 个月）
- 排序维度
  - `per_workday` - 按日均产出（默认）
  - `net` - 按净增行数
  - `added` - 按新增行数
  - `commits` - 按提交次数
- 排行榜表格列
  - 排名（前三名特殊图标：皇冠、奖牌）
  - 开发者（头像、姓名）
  - 日均新增
  - 日均删除
  - 提交数
  - 新增行数
  - 删除行数
- 点击行可查看用户提交明细弹窗
- 最多显示 20 条

### 用户提交明细弹窗
- 显示用户当月所有提交记录
- 分页显示（默认 10 条/页）
- 表格列
  - 提交时间
  - SHA（可点击链接到 Git 仓库）
  - 仓库名称（仅聚合模式显示）
  - 提交信息
  - 新增行数
  - 删除行数
  - 变更文件数
- 分页控制（上一页 / 下一页）

### 总计统计卡片
- 净增行数
- 提交次数
- 活跃用户数

## API 契约

### 仓库列表
```
GET /repos
```

**响应**: `RepoDto[]`
- `id`: number - 仓库 ID
- `name`: string - 仓库名称
- `repo_key`: string - 仓库键值
- `web_url`: string | null - Git 仓库 URL

### 月度指标
```
GET /repos/{repoId}/metrics/monthly?months={months}&year={year}&month={month}
```

**路径参数**:
- `repoId`: number - 仓库 ID（`-1` 表示所有仓库）

**查询参数**:
- `months`: number - 月份数量（1-36）
- `year`: number - 锚点年份（可选）
- `month`: number - 锚点月份（可选）

**响应**: `MonthlyMetricsDto`
- `repo_id`: number - 仓库 ID
- `months`: number - 月份数量
- `series`: `MonthlySeriesItemDto[]` - 月度数据序列
  - `month`: string - 月份（YYYY-MM 格式）
  - `total_added`: number - 总新增行数
  - `total_deleted`: number - 总删除行数
  - `net_lines`: number - 净增行数
  - `commits`: number - 提交次数
  - `active_users`: number - 活跃用户数
  - `workdays`: number - 工作日数
  - `avg_per_person`: number - 人均产出
  - `avg_per_day`: number - 日均产出
- `summary`: object
  - `avg_per_person`: number - 总人均
  - `avg_per_day`: number - 总日均

### 排行榜
```
GET /repos/{repoId}/leaderboard?period=month&months={months}&limit={limit}&sort={sort}&year={year}&month={month}
```

**路径参数**:
- `repoId`: number - 仓库 ID（`-1` 表示所有仓库）

**查询参数**:
- `period`: string - 固定为 `month`
- `months`: number - 月份数量（默认 1）
- `limit`: number - 返回条数（默认 20）
- `sort`: string - 排序方式（`net` | `added` | `commits` | `per_workday`）
- `year`: number - 锚点年份（可选）
- `month`: number - 锚点月份（可选）

**响应**: `LeaderboardDto`
- `repo_id`: number - 仓库 ID
- `period`: string - 统计周期
- `months`: number - 月份数量
- `sort`: string - 排序方式
- `workdays`: number - 工作日数
- `items`: `LeaderboardItemDto[]` - 排行榜条目
  - `rank`: number - 排名
  - `user_id`: number - 用户 ID
  - `name`: string - 用户姓名
  - `username`: string | null - Git 用户名
  - `commits`: number - 提交次数
  - `lines_added`: number - 新增行数
  - `lines_removed`: number - 删除行数
  - `net_lines`: number - 净增行数
  - `workdays`: number - 工作日数
  - `added_per_workday`: number - 日均新增
  - `removed_per_workday`: number - 日均删除

### 总计统计
```
GET /repos/{repoId}/totals?period=month&months={months}&year={year}&month={month}
```

**路径参数**:
- `repoId`: number - 仓库 ID（`-1` 表示所有仓库）

**查询参数**:
- `period`: string - 固定为 `month`
- `months`: number - 月份数量（默认 1）
- `year`: number - 锚点年份（可选）
- `month`: number - 锚点月份（可选）

**响应**: `TotalsDto`
- `repo_id`: number - 仓库 ID
- `period`: string - 统计周期
- `months`: number - 月份数量
- `total_added`: number - 总新增行数
- `total_deleted`: number - 总删除行数
- `net_lines`: number - 净增行数
- `commits`: number - 总提交次数
- `active_users`: number - 活跃用户数

### 用户提交明细
```
GET /repos/{repoId}/users/{userId}/commits?year={year}&month={month}&page={page}&page_size={pageSize}
```

**路径参数**:
- `repoId`: number - 仓库 ID（`-1` 表示所有仓库）
- `userId`: number - 用户 ID

**查询参数**:
- `year`: number - 年份
- `month`: number - 月份
- `page`: number - 页码（默认 1）
- `page_size`: number - 每页条数（默认 10）

**响应**: `UserCommitsDto`
- `repo_id`: number - 仓库 ID
- `user_id`: number - 用户 ID
- `year`: number - 年份
- `month`: number - 月份
- `page`: number - 当前页码
- `page_size`: number - 每页条数
- `total`: number - 总条数
- `total_pages`: number - 总页数
- `items`: `UserCommitItemDto[]` - 提交记录
  - `id`: number - 记录 ID
  - `commit_sha`: string - Git SHA
  - `committed_at`: string | null - 提交时间
  - `additions`: number - 新增行数
  - `deletions`: number - 删除行数
  - `files_changed`: number - 变更文件数
  - `message`: string | null - 提交信息
  - `repo_id`: number | null - 仓库 ID（仅聚合模式）
  - `repo_name`: string | null - 仓库名称（仅聚合模式）
  - `repo_web_url`: string | null - 仓库 URL（仅聚合模式）

## 技术约束

- 后端 API 地址通过环境变量 `NEXT_PUBLIC_API_BASE_URL` 配置
- 所有请求使用 `cache: no-store` 防止缓存
- API 基础路径默认为 `http://localhost:8000`
- 请求头包含 `Accept: application/json`
- 错误响应包含状态码和错误信息
