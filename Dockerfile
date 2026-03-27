# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base

ARG ALPINE_MIRROR=mirrors.ustc.edu.cn
ARG NPM_REGISTRY=https://registry.npmmirror.com

ENV npm_config_registry=${NPM_REGISTRY}

# 安装运行时兼容依赖，并预先激活固定版本的 pnpm，避免后续阶段重复下载
RUN sed -i "s/dl-cdn.alpinelinux.org/${ALPINE_MIRROR}/g" /etc/apk/repositories \
  && apk add --no-cache libc6-compat \
  && corepack enable \
  && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app

# 仅复制依赖清单，尽可能稳定命中依赖缓存层
FROM base AS deps

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# 依赖层直接产出 node_modules，避免 builder 阶段每次重新链接整个依赖树
RUN --mount=type=cache,target=/root/.npm \
  --mount=type=cache,target=/root/.local/share/pnpm/store \
  --mount=type=cache,target=/usr/local/share/.cache/yarn \
  if [ -f pnpm-lock.yaml ]; then pnpm config set registry ${NPM_REGISTRY} && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn config set registry ${NPM_REGISTRY} && yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm config set registry ${NPM_REGISTRY} && npm ci; \
  else echo "Lockfile not found." && npm config set registry ${NPM_REGISTRY} && npm install; \
  fi

# 构建阶段在依赖层之后再复制业务代码，避免源码变更导致下载缓存失效
FROM base AS builder

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY --from=deps /app/node_modules ./node_modules

COPY . .

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8100
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# 复用包管理器缓存执行前端构建，降低多次 build 的成本
RUN --mount=type=cache,target=/root/.npm \
  --mount=type=cache,target=/root/.local/share/pnpm/store \
  --mount=type=cache,target=/usr/local/share/.cache/yarn \
  if [ -f pnpm-lock.yaml ]; then pnpm run build; \
  elif [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  else npm run build; \
  fi

# 生产镜像只保留 Next.js standalone 产物与静态资源，缩小体积并减少无关文件
FROM node:22-alpine AS runner

ARG ALPINE_MIRROR=mirrors.ustc.edu.cn

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN sed -i "s/dl-cdn.alpinelinux.org/${ALPINE_MIRROR}/g" /etc/apk/repositories \
  && apk add --no-cache libc6-compat \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
