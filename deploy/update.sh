#!/bin/bash
set -e

echo "开始更新 Kanban Board Design..."

# 使用固定部署目录，避免在错误路径执行部署命令。
BASE_DIR="/opt/kanban-board-design"
cd "$BASE_DIR" || { echo "找不到目录: $BASE_DIR"; exit 1; }

echo "拉取最新代码..."
git pull
echo "代码已更新"

echo "构建 Docker 镜像..."
# 前端 API 地址在构建期注入；启用 Nginx 后建议改为 https://api.example.com。
API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://192.168.2.121:13136/api}"
# 宿主机绑定地址默认保持对外开放；接入 Nginx 后可改为 127.0.0.1。
HOST_BIND_IP="${HOST_BIND_IP:-0.0.0.0}"

DOCKER_BUILDKIT=1 docker build --progress=plain \
  --build-arg NEXT_PUBLIC_API_BASE_URL="$API_BASE_URL" \
  -t kanban-board-design:latest .

echo "镜像构建完成 (NEXT_PUBLIC_API_BASE_URL=$API_BASE_URL)"
echo "宿主机端口绑定地址: $HOST_BIND_IP"

echo "重启容器..."
# 容器不存在时忽略错误，保证脚本可重复执行。
docker stop kanban-board 2>/dev/null || true
docker rm kanban-board 2>/dev/null || true

docker run -d \
  --name kanban-board \
  --restart unless-stopped \
  -p ${HOST_BIND_IP}:3000:3000 \
  kanban-board-design:latest

echo "更新完成，当前容器状态如下:"
docker ps | grep kanban-board
