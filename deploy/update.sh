#!/bin/bash
set -e
echo "开始更新 Kanban Board Design..."

# 设置基础目录
BASE_DIR="/opt/kanban-board-design"
cd "$BASE_DIR" || { echo "找不到目录 $BASE_DIR"; exit 1; }

echo "拉取最新代码..."
git pull
echo "代码已更新"

echo "构建镜像（显示详细进度）..."
# 通过环境变量覆盖前端构建期 API 地址，默认使用 8100 端口
API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://192.168.2.121:8100}"
DOCKER_BUILDKIT=1 docker build --progress=plain \
  --build-arg NEXT_PUBLIC_API_BASE_URL="$API_BASE_URL" \
  -t kanban-board-design:latest .
echo "镜像构建完成（NEXT_PUBLIC_API_BASE_URL=$API_BASE_URL）"

echo "重启容器..."
# 尝试停止并删除旧容器，如果不存在则忽略错误
docker stop kanban-board 2>/dev/null || true
docker rm kanban-board 2>/dev/null || true

# 运行新容器
docker run -d \
  --name kanban-board \
  --restart unless-stopped \
  -p 3000:3000 \
  kanban-board-design:latest

echo "更新完成，容器状态如下："
docker ps | grep kanban-board

