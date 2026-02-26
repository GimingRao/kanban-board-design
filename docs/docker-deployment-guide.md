# Kanban Board Design Docker 部署指南

> 使用 Docker 快速部署看板前端应用到 192.168.2.121 服务器

---

## 📋 准备工作

开始前，请确认：

- [ ] 服务器已安装 Docker (`docker --version`)
- [ ] 服务器已安装 Git (`git --version`)
- [ ] 有 Git 仓库访问权限

**检查现有环境（以 121 服务器为例）：**

```bash
# 检查 Docker
docker --version
docker-compose --version
```

---

## 🖥️ 首次部署

### 第一步：克隆代码

```bash
# 假设将代码部署到 /opt/kanban-board-design
# 克隆仓库（请替换为实际的仓库地址）
git clone <你的仓库地址> /opt/kanban-board-design

# 进入目录
cd /opt/kanban-board-design
```

### 第二步：准备配置文件

该前端项目使用 Next.js，如果需要环境变量，请创建 `.env.production` 或在 Docker 中通过参数传递。

```bash
# 如果需要环境变量，创建文件
# nano .env.production
```

### 第三步：构建 Docker 镜像

该应用使用多阶段构建来优化镜像大小。

```bash
cd /opt/kanban-board-design
docker build -t kanban-board-design:latest .
```

构建过程可能需要几分钟，取决于服务器网络情况（首次构建需要下载基础 Node.js 镜像）。

### 第四步：启动容器

```bash
# 启动容器
docker run -d \
  --name kanban-board \
  --restart unless-stopped \
  -p 3000:3000 \
  kanban-board-design:latest
```

**参数说明：**

| 参数 | 说明 |
|------|------|
| `-d` | 后台运行 |
| `--name kanban-board` | 容器名称 |
| `--restart unless-stopped` | 自动重启，除非手动停止 |
| `-p 3000:3000` | 端口映射：`宿主机端口:容器端口` |

*注：如果 3000 端口在宿主机已被占用，可修改映射，如 `-p 8080:3000`*

### 第五步：验证部署

```bash
# 检查容器状态
docker ps | grep kanban-board

# 查看日志
docker logs kanban-board

# 测试访问
curl http://localhost:3000
```

如果服务器正常运行，可以在浏览器中访问 `http://192.168.2.121:3000` 即可看到看板应用。

---

## 🔄 日常更新

当有代码更新时，可以直接使用一键部署脚本，或者按以下步骤手动操作：

```bash
cd /opt/kanban-board-design

# 1. 拉取最新代码
git pull

# 2. 重新构建镜像
docker build -t kanban-board-design:latest .

# 3. 停止并删除旧容器
docker stop kanban-board
docker rm kanban-board

# 4. 启动新容器
docker run -d \
  --name kanban-board \
  --restart unless-stopped \
  -p 3000:3000 \
  kanban-board-design:latest
```

---

## 🚀 一键更新脚本

如果尚未创建脚本，你可以执行位于 `deploy/update.sh` 的脚本（已包含在代码库中），或手动创建：

```bash
# 赋予执行权限
chmod +x deploy/update.sh

# 运行更新
./deploy/update.sh
```

---

## 🔧 常用命令

| 操作 | 命令 |
|------|------|
| 查看容器状态 | `docker ps -a \| grep kanban-board` |
| 查看日志 | `docker logs -f kanban-board` |
| 重启容器 | `docker restart kanban-board` |
| 停止容器 | `docker stop kanban-board` |
| 进入容器 | `docker exec -it kanban-board sh` |
| 查看镜像 | `docker images \| grep kanban-board` |

---

## ❌ 故障排查

### 容器启动失败，提示 "address already in use" (端口被占用)

```bash
# 查看占用 3000 端口的进程
sudo netstat -tlnp | grep 3000

# 解决方法：修改 Docker 运行时的端口映射
docker run -d --name kanban-board -p 3001:3000 kanban-board-design:latest
```

### 镜像构建失败

```bash
# 清理缓存重新构建
docker system prune -f
docker build --no-cache -t kanban-board-design:latest .
```

### 查看详细错误日志

```bash
docker logs kanban-board
```

---

**文档版本**: v1.0 (Docker Deployment)
**最后更新**: 2026-02-26
