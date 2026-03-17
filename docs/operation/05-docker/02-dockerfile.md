---
title: "Dockerfile 编写最佳实践"
category: "运维 · Docker"
tags:
  - Docker
  - Dockerfile
  - 镜像构建
  - 多阶段构建
date: 2026-03-17
excerpt: "本文系统讲解 Dockerfile 全部指令，重点介绍多阶段构建减小镜像体积、分层缓存优化构建速度、Alpine/Distroless 基础镜像选型，以及非 root 用户运行等安全最佳实践。"
---

# Dockerfile 编写最佳实践

## 一、Dockerfile 指令详解

### 1. 基础指令

#### (1) FROM — 基础镜像

```dockerfile
# 单阶段构建
FROM node:20-alpine

# 多阶段构建（使用 AS 命名阶段）
FROM node:20-alpine AS builder
FROM node:20-alpine AS runtime

# 使用特定摘要（固定版本，更安全）
FROM node:20-alpine@sha256:abc123...
```

#### (2) RUN — 执行命令

```dockerfile
# 推荐：合并相关命令为一层（减少层数），清理缓存
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        git \
    && rm -rf /var/lib/apt/lists/*   # 清理 apt 缓存

# Alpine 包管理器
RUN apk add --no-cache curl git
```

#### (3) COPY vs ADD

| 指令 | 说明 | 推荐度 |
|------|------|-------|
| `COPY` | 简单复制文件/目录，功能单一但可预期 | ★★★★★ 首选 |
| `ADD` | 支持 URL 下载和自动解压 tar 包，但行为复杂 | ★★ 仅需解压时使用 |

```dockerfile
# 复制文件（推荐使用 --chown 指定所有者）
COPY --chown=node:node package*.json ./
COPY --chown=node:node src/ ./src/

# ADD 仅在需要自动解压 tar 时使用
ADD app.tar.gz /opt/app/
```

#### (4) WORKDIR — 工作目录

```dockerfile
# 设置工作目录（不存在时自动创建），后续 RUN/COPY/CMD 都在此目录执行
WORKDIR /app
```

#### (5) ENV — 环境变量

```dockerfile
# 在构建和运行时都可用
ENV NODE_ENV=production \
    PORT=3000 \
    LOG_LEVEL=info
```

#### (6) ARG — 构建参数

`ARG` 只在构建时有效（运行时不可见），适合版本号等构建时变量。

```dockerfile
# 声明构建参数（可设默认值）
ARG NODE_VERSION=20
ARG APP_VERSION=latest

FROM node:${NODE_VERSION}-alpine

ARG APP_VERSION   # FROM 之后需重新声明 ARG
LABEL version="${APP_VERSION}"
```

```bash
# 构建时传入参数
docker build --build-arg APP_VERSION=1.2.3 -t my-app:1.2.3 .
```

#### (7) EXPOSE — 声明端口

`EXPOSE` 仅起文档说明作用，不会自动映射端口（需要 `docker run -p` 映射）。

```dockerfile
EXPOSE 3000
EXPOSE 8080/tcp
EXPOSE 9090/udp
```

#### (8) ENTRYPOINT vs CMD

| 指令 | 说明 | 可被覆盖 |
|------|------|---------|
| `ENTRYPOINT` | 容器的主进程（固定入口） | 需 `docker run --entrypoint` |
| `CMD` | 默认参数或默认命令 | `docker run <image> <args>` 直接覆盖 |

```dockerfile
# 推荐组合：ENTRYPOINT 固定命令，CMD 提供默认参数
ENTRYPOINT ["node"]
CMD ["server.js"]
# docker run my-app           → node server.js
# docker run my-app index.js  → node index.js（CMD 被覆盖）

# 使用 exec 格式（JSON 数组）而非 shell 格式
# exec 格式：PID 1 直接是应用进程（能接收信号）
ENTRYPOINT ["node", "server.js"]   # ✅ 推荐

# shell 格式：PID 1 是 /bin/sh -c（应用无法接收 SIGTERM 信号）
ENTRYPOINT node server.js          # ❌ 不推荐
```

#### (9) LABEL — 镜像元数据

```dockerfile
LABEL maintainer="ops@example.com" \
      version="1.2.3" \
      description="My App" \
      org.opencontainers.image.source="https://github.com/example/my-app" \
      org.opencontainers.image.created="2026-03-17"
```

#### (10) USER — 运行用户

```dockerfile
# 创建非 root 用户并切换
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

#### (11) HEALTHCHECK — 健康检查

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
```

#### (12) ONBUILD — 触发器

`ONBUILD` 指令在当前镜像被用作基础镜像时，在子镜像的构建过程中执行（通常用于制作基础镜像）。

```dockerfile
# 在基础镜像中定义
ONBUILD COPY package*.json ./
ONBUILD RUN npm ci
```

## 二、多阶段构建

多阶段构建通过多个 `FROM` 指令将构建过程分阶段，最终镜像只包含运行时所需的文件，有效减小体积。

### 1. Node.js 应用多阶段构建

::: details Node.js 多阶段 Dockerfile

```dockerfile
# 文件：Dockerfile

# ─── 阶段一：安装依赖 ─────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# 先只复制依赖文件（利用缓存层）
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# ─── 阶段二：构建 ────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts    # 安装包含 devDependencies 的完整依赖

COPY . .
RUN npm run build              # TypeScript 编译、打包等构建步骤

# ─── 阶段三：生产镜像 ─────────────────────────────────────
FROM node:20-alpine AS runtime

# 安装安全更新
RUN apk add --no-cache dumb-init

WORKDIR /app

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 只从前面的阶段复制需要的文件
COPY --from=deps    --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist        ./dist
COPY --chown=appuser:appgroup package.json ./

USER appuser
EXPOSE 3000

# 使用 dumb-init 作为 PID 1，正确处理信号和僵尸进程
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

:::

### 2. Java/Maven 应用多阶段构建

::: details Java Maven 多阶段 Dockerfile

```dockerfile
# 文件：Dockerfile

# ─── 阶段一：Maven 构建 ────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

# 先复制 pom.xml 利用依赖缓存
COPY pom.xml .
RUN mvn dependency:go-offline -B   # 下载所有依赖到本地

COPY src ./src
RUN mvn -B package -DskipTests

# ─── 阶段二：运行时镜像 ────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /build/target/app.jar ./app.jar

USER appuser
EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
```

:::

### 3. 构建体积对比

| 构建方式 | 示例大小 |
|---------|---------|
| 单阶段（带 devDependencies + 源码） | ~500MB |
| 多阶段（只含 dist + 生产依赖） | ~120MB |
| 多阶段 + Alpine | ~80MB |
| 多阶段 + Distroless | ~50MB |

## 三、.dockerignore

`.dockerignore` 排除不需要发送到 Docker Daemon 的文件，减少构建上下文大小，加快构建速度，避免敏感文件被打包进镜像。

::: details 通用 .dockerignore 模板

```
# gitignore
# 文件：.dockerignore

# 版本控制
.git
.gitignore
.gitattributes

# 依赖（构建时重新安装）
node_modules
vendor

# 构建产物（使用多阶段构建时）
dist
build
target
*.class

# 环境变量和密钥
.env
.env.*
*.pem
*.key
*.crt
secrets/
credentials/

# 开发配置
.editorconfig
.eslintrc*
.prettierrc*
tsconfig.json
jest.config.*

# 文档
docs
*.md
README*
CHANGELOG*

# CI/CD
.github
.gitlab-ci.yml
Jenkinsfile

# Docker 相关
Dockerfile*
docker-compose*

# 测试
**/__tests__
**/*.test.*
**/*.spec.*
coverage/
```

:::

## 四、镜像分层缓存优化

Docker 构建时按指令顺序逐层执行，某层内容变化时，该层及之后的层都会重新构建（缓存失效）。

### 1. 缓存优化原则

**将变化频率低的指令放在前面，变化频率高的放在后面。**

::: code-group

```dockerfile [❌ 缓存利用差]
# 文件：Dockerfile（差例）
FROM node:20-alpine
WORKDIR /app

# 源代码放在前面，任何代码改动都导致后续层重建（包括 npm install）
COPY . .                        # ← 代码经常变动
RUN npm ci                      # ← 每次都重新安装，耗时
RUN npm run build
```

```dockerfile [✅ 缓存利用好]
# 文件：Dockerfile（好例）
FROM node:20-alpine
WORKDIR /app

# package.json 不经常变，先复制并安装依赖
COPY package*.json ./           # ← 只有依赖变动时才重建
RUN npm ci

# 源代码经常变，放在最后
COPY . .                        # ← 源码改动只影响此层及之后
RUN npm run build
```

:::

### 2. 利用 BuildKit 缓存挂载

BuildKit（Docker 18.09+）支持缓存挂载，避免每次重新下载包：

```dockerfile
# 启用 BuildKit 缓存挂载（npm 缓存）
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

# Maven 缓存
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B package -DskipTests
```

```bash
# 启用 BuildKit
DOCKER_BUILDKIT=1 docker build -t my-app .
# 或设置环境变量（永久启用）
export DOCKER_BUILDKIT=1
```

## 五、基础镜像选型

### 1. Alpine vs Debian vs Distroless 对比

| 基础镜像 | 大小 | Shell | 包管理器 | 适用场景 |
|---------|------|-------|---------|---------|
| `ubuntu:22.04` | ~80MB | bash | apt | 需要完整 Linux 工具集 |
| `debian:bookworm-slim` | ~30MB | bash | apt | 兼容性好，工具相对完整 |
| `alpine:3.19` | ~5MB | ash | apk | 追求极小体积，兼容性略低 |
| `gcr.io/distroless/nodejs20` | ~60MB | 无 | 无 | 最高安全性，无 Shell |
| `scratch` | 0MB | 无 | 无 | Go 等静态二进制应用 |

### 2. Alpine 注意事项

::: warning Alpine 兼容性问题
Alpine 使用 musl libc（非 glibc），可能导致以下问题：
- 某些依赖 glibc 的 npm 包（如 `bcrypt`、`sharp`）需要额外安装兼容层或使用替代包
- Node.js 在 Alpine 上的内存和性能表现与 glibc 版本有差异
- 如遇兼容问题，可改用 `node:20-slim`（基于 Debian slim）
:::

```dockerfile
# Alpine 安装额外依赖（处理 glibc 问题）
FROM node:20-alpine
RUN apk add --no-cache libc6-compat   # 部分包需要此兼容库
```

### 3. Distroless 镜像

Distroless 镜像不含包管理器、Shell 等工具，极大减少攻击面：

::: details Distroless Dockerfile 示例

```dockerfile
# 文件：Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 使用 Distroless 作为最终镜像
FROM gcr.io/distroless/nodejs20-debian12 AS runtime
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["dist/server.js"]    # distroless nodejs 镜像直接用 node 执行
```

:::

## 六、安全最佳实践

### 1. 以非 root 用户运行

::: details 创建非 root 用户的完整示例

```dockerfile
# 文件：Dockerfile（安全版本）
FROM node:20-alpine

WORKDIR /app

# 安装依赖（以 root 运行，用于安装系统包）
RUN apk add --no-cache dumb-init

# 创建应用用户和组（指定固定 UID/GID，便于 PV 权限管理）
RUN addgroup -g 1001 -S appgroup \
    && adduser -u 1001 -S appuser -G appgroup

# 复制文件并设置所有者
COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --only=production

COPY --chown=appuser:appgroup . .

# 切换到非 root 用户
USER appuser

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

:::

### 2. 最小权限原则

```dockerfile
# 只读根文件系统（配合 --read-only 运行）
# 需要写入的目录通过 VOLUME 或 tmpfs 挂载
VOLUME ["/tmp", "/app/logs", "/app/uploads"]

# 删除 SUID/SGID 位（防止权限提升）
RUN find / -perm /4000 -type f -exec chmod a-s {} + 2>/dev/null || true
```

### 3. 避免敏感信息泄露

::: danger 切勿将密钥写入 Dockerfile
以下做法会将密钥永久写入镜像层（即使后续 RUN 删除了该文件）：
```dockerfile
# ❌ 错误：密钥写入了镜像层历史
COPY .env ./
RUN source .env && npm run setup && rm .env  # 删除无效，历史层中仍有文件
```

正确做法是通过 BuildKit 的 secret 挂载传入：
```dockerfile
# ✅ 正确：使用 BuildKit secret（文件不会写入层）
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```
```bash
docker build --secret id=npmrc,src=.npmrc -t my-app .
```
:::

### 4. 固定基础镜像版本

```dockerfile
# ❌ 避免：latest 可能带来不可预期的变更
FROM node:latest

# ✅ 推荐：固定 Minor 版本
FROM node:20-alpine

# ✅ 最安全：固定到 Digest（完全不变）
FROM node:20-alpine@sha256:a3b8c12def...
```
