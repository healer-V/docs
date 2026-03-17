---
title: "Docker Compose 实战"
category: "运维 · Docker"
tags:
  - Docker
  - Compose
  - 多容器
  - 编排
date: 2026-03-17
excerpt: "Docker Compose 是多容器应用的本地编排工具。本文讲解 Compose 文件的完整结构与服务配置选项，列举常用命令速查，介绍多环境配置技巧，最后以 Web + DB + Redis + Nginx 的生产级 Compose 实战案例收尾。"
---

# Docker Compose 实战

## 一、Compose 文件结构

`docker-compose.yml` 是 Compose 的核心配置文件，使用 YAML 定义多容器应用的服务、网络和卷。

### 1. 顶层结构

```yaml
# 文件：docker-compose.yml
services:       # 服务定义（必填）
  service-a:
    ...
  service-b:
    ...

networks:       # 自定义网络（可选，不写则使用默认网络）
  app-net:
    ...

volumes:        # 命名卷定义（可选）
  data-vol:
    ...

configs:        # 配置文件（Docker Swarm / Compose v2）
  ...

secrets:        # 敏感数据（Docker Swarm / Compose v2）
  ...
```

::: tip version 字段
Compose v2（`docker compose` 命令）已不再需要 `version` 字段，新项目无需填写。旧版本的 `version: '3.8'` 写法仍然有效但已过时。
:::

## 二、服务配置详解

### 1. image 与 build

```yaml
services:
  # 方式一：使用已有镜像
  nginx:
    image: nginx:1.25-alpine

  # 方式二：从 Dockerfile 构建
  api:
    build:
      context: ./api              # 构建上下文目录
      dockerfile: Dockerfile.prod # 指定 Dockerfile（默认 Dockerfile）
      args:
        NODE_ENV: production
        APP_VERSION: 1.2.3
      target: runtime             # 多阶段构建的目标阶段
    image: registry.example.com/my-api:latest  # 构建后的镜像名（push 时使用）
```

### 2. ports — 端口映射

```yaml
services:
  web:
    ports:
      - "80:80"              # 宿主机:容器（字符串格式，推荐加引号）
      - "443:443"
      - "127.0.0.1:5432:5432"  # 只绑定 localhost，不对外暴露
      - target: 3000         # 长格式（更清晰）
        host_ip: "0.0.0.0"
        published: "8080"
        protocol: tcp
```

### 3. volumes — 数据卷挂载

```yaml
services:
  db:
    volumes:
      # 命名卷（需在顶层 volumes 声明）
      - db-data:/var/lib/postgresql/data

      # Bind Mount（宿主机路径:容器路径）
      - ./config/postgresql.conf:/etc/postgresql/postgresql.conf:ro

      # 短格式（Bind Mount）
      - /host/logs:/app/logs

      # tmpfs
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 134217728   # 128MB

volumes:
  db-data:              # 声明命名卷（docker 自动创建）
    driver: local

  nfs-vol:              # 使用外部 NFS 卷
    driver: local
    driver_opts:
      type: nfs
      o: addr=192.168.1.200,rw
      device: ":/data/myapp"
```

### 4. environment 与 env_file

```yaml
services:
  api:
    environment:
      # 键值对格式
      NODE_ENV: production
      PORT: "3000"
      # 只写键名（从宿主机环境变量继承）
      DATABASE_URL:

    # 从文件读取环境变量
    env_file:
      - .env              # 通用环境变量
      - .env.production   # 环境特定变量（后面的文件会覆盖前面的）
```

### 5. depends_on — 启动顺序与健康检查

```yaml
services:
  api:
    depends_on:
      db:
        condition: service_healthy   # 等待 db 健康检查通过后再启动（推荐）
      redis:
        condition: service_started   # 只等待 redis 容器启动（不等健康检查）

  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 3
```

::: warning depends_on 的局限性
`depends_on` 只控制**启动顺序**，不等待服务完全就绪。推荐配合 `condition: service_healthy` 和 `healthcheck` 使用，确保依赖服务真正可用后再启动当前服务。
:::

### 6. restart — 重启策略

```yaml
services:
  api:
    restart: unless-stopped   # no / always / on-failure / unless-stopped
```

### 7. networks — 网络配置

```yaml
services:
  api:
    networks:
      - frontend-net
      - backend-net

  db:
    networks:
      - backend-net      # 只在后端网络，前端无法直接访问

networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
    internal: true       # 内部网络，无法访问外部
```

### 8. deploy — 部署配置（Swarm 模式）

```yaml
services:
  api:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
        reservations:
          cpus: "0.1"
          memory: 128M
      restart_policy:
        condition: on-failure
        max_attempts: 3
```

## 三、常用命令

### 1. 启动与停止

```bash
# 启动所有服务（后台运行）
docker compose up -d

# 只启动指定服务（及其依赖）
docker compose up -d api nginx

# 强制重新构建镜像后启动
docker compose up -d --build

# 停止并删除容器（保留卷和网络）
docker compose down

# 停止并删除容器、卷、网络（清除所有数据！）
docker compose down -v

# 停止并删除容器、自定义网络
docker compose down --remove-orphans
```

### 2. 状态查看

```bash
# 查看服务状态
docker compose ps

# 查看所有容器（包括停止的）
docker compose ps -a

# 实时查看所有服务日志
docker compose logs -f

# 查看指定服务日志
docker compose logs -f api

# 查看最近 100 行日志
docker compose logs --tail 100 api
```

### 3. 执行命令与调试

```bash
# 在运行中的容器内执行命令
docker compose exec api bash
docker compose exec db psql -U appuser -d myapp

# 启动一个临时容器执行命令（用完即删）
docker compose run --rm api node scripts/migrate.js

# 查看各服务的端口映射
docker compose port api 3000
```

### 4. 构建与推送

```bash
# 只构建镜像（不启动）
docker compose build

# 构建指定服务
docker compose build api

# 强制不使用缓存构建
docker compose build --no-cache api

# 推送所有服务镜像到 Registry
docker compose push

# 拉取所有服务的最新镜像
docker compose pull
```

### 5. 伸缩服务

```bash
# 将 api 服务扩展到 3 个实例
docker compose up -d --scale api=3

# 缩减到 1 个实例
docker compose up -d --scale api=1
```

## 四、多环境配置

### 1. .env 文件

`docker compose` 默认读取同目录的 `.env` 文件，文件中定义的变量在 `docker-compose.yml` 中通过 `${VAR_NAME}` 引用：

::: details .env 与 docker-compose.yml 配合示例

```bash
# 文件：.env
COMPOSE_PROJECT_NAME=myapp
NODE_IMAGE=node:20-alpine
REGISTRY=registry.example.com
APP_VERSION=latest
DB_PASSWORD=localdev123
REDIS_PASSWORD=
```

```yaml
# 文件：docker-compose.yml
services:
  api:
    image: ${REGISTRY}/my-api:${APP_VERSION}
    environment:
      - DB_PASSWORD=${DB_PASSWORD}
```

```bash
# 使用指定 env 文件
docker compose --env-file .env.staging up -d
```

:::

### 2. Override 文件

`docker-compose.override.yml` 会自动合并到 `docker-compose.yml`，适合本地开发配置覆盖：

::: details Override 文件结构示例

```yaml
# 文件：docker-compose.yml（基础配置，提交到 Git）
services:
  api:
    image: registry.example.com/my-api:${APP_VERSION:-latest}
    restart: unless-stopped
    networks:
      - app-net
    environment:
      NODE_ENV: production
```

```yaml
# 文件：docker-compose.override.yml（本地开发覆盖，加入 .gitignore）
services:
  api:
    build: ./api              # 本地构建而非拉取镜像
    volumes:
      - ./api/src:/app/src    # 热重载
    ports:
      - "3000:3000"           # 暴露调试端口
    environment:
      NODE_ENV: development
      DEBUG: "app:*"
    restart: "no"             # 开发时不自动重启
```

```yaml
# 文件：docker-compose.prod.yml（生产配置，手动指定）
services:
  api:
    deploy:
      replicas: 3
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"
```

```bash
# 本地开发（自动合并 override.yml）
docker compose up -d

# 生产部署（指定 prod 配置）
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

:::

## 五、实战案例：Web + DB + Redis + Nginx

以下是一个包含 Node.js API、PostgreSQL、Redis 和 Nginx 反向代理的完整 Compose 配置：

::: details 完整生产级 Compose 配置

```yaml
# 文件：docker-compose.yml
services:

  # ─── Nginx 反向代理 ──────────────────────────────────────
  nginx:
    image: nginx:1.25-alpine
    container_name: nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - app-static:/usr/share/nginx/html:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx-logs:/var/log/nginx
    depends_on:
      api:
        condition: service_healthy
    networks:
      - frontend-net
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 5s
      retries: 3

  # ─── Node.js API ─────────────────────────────────────────
  api:
    build:
      context: ./api
      target: runtime
    container_name: api
    restart: unless-stopped
    expose:
      - "3000"              # 不对外暴露，只在内部网络通信
    volumes:
      - app-uploads:/app/uploads
      - app-logs:/app/logs
    environment:
      NODE_ENV: production
      PORT: "3000"
      DB_HOST: postgres
      DB_PORT: "5432"
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASS: ${DB_PASS}
      REDIS_URL: redis://:${REDIS_PASS}@redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - frontend-net
      - backend-net
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:3000/health || exit 1"]
      interval: 30s
      timeout: 5s
      start_period: 30s
      retries: 3

  # ─── PostgreSQL ──────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: postgres
    restart: unless-stopped
    volumes:
      - pg-data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d:ro   # 初始化 SQL 脚本
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
      TZ: Asia/Shanghai
    networks:
      - backend-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      start_period: 20s
      retries: 5
    # 不对外暴露端口（安全）
    # 如需本地调试：ports: ["127.0.0.1:5432:5432"]

  # ─── Redis ───────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: redis
    restart: unless-stopped
    command: >
      redis-server
      --requirepass ${REDIS_PASS}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
    volumes:
      - redis-data:/data
    networks:
      - backend-net
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASS}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

# ─── 网络 ──────────────────────────────────────────────────
networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
    internal: true   # 内部网络，DB/Redis 无法访问外网

# ─── 数据卷 ─────────────────────────────────────────────────
volumes:
  pg-data:
    driver: local
  redis-data:
    driver: local
  app-uploads:
    driver: local
  app-logs:
    driver: local
  app-static:
    driver: local
  nginx-logs:
    driver: local
```

:::

::: details 对应的 .env 文件

```bash
# 文件：.env（不提交到 Git）
COMPOSE_PROJECT_NAME=myapp

DB_NAME=myapp
DB_USER=appuser
DB_PASS=SecureP@ssw0rd123

REDIS_PASS=RedisP@ss456

APP_VERSION=v1.2.3
```

:::

::: details Nginx 配置（conf.d/app.conf）

```nginx
# 文件：nginx/conf.d/app.conf
upstream api_backend {
    server api:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # 静态文件
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }
}
```

:::

```bash
# 启动整个应用栈
docker compose up -d

# 查看所有服务状态
docker compose ps

# 查看各服务日志
docker compose logs -f

# 停止并清理（保留数据卷）
docker compose down

# 升级 API 版本（只重建 api 服务）
APP_VERSION=v1.2.4 docker compose up -d --no-deps api
```
