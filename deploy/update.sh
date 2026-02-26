#!/bin/bash
set -e
echo "🔄 开始更新 Kanban Board Design..."

# 设置基础目录
BASE_DIR="/opt/kanban-board-design"
cd $BASE_DIR || { echo "❌ 找不到目录 $BASE_DIR"; exit 1; }

echo "⬇️ 拉取最新代码..."
git pull
echo "✅ 代码已更新"

echo "📦 构建镜像..."
docker build -t kanban-board-design:latest . -q
echo "✅ 镜像构建完成"

echo "🔄 重启容器..."
# 尝试停止并删除旧容器，如果不存在忽略错误
docker stop kanban-board 2>/dev/null || true
docker rm kanban-board 2>/dev/null || true

# 运行新容器
docker run -d \
  --name kanban-board \
  --restart unless-stopped \
  -p 3000:3000 \
  kanban-board-design:latest

echo "✅ 更新完成！容器运行状态如下："
docker ps | grep kanban-board
