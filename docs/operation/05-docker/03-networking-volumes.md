---
title: "Docker 网络与数据卷"
category: "运维 · Docker"
tags:
  - Docker
  - 网络
  - Volume
  - Bridge
date: 2026-03-17
excerpt: "本文讲解 Docker 的五种网络模式特性与适用场景，重点介绍自定义 Bridge 网络实现容器间通信，以及 Bind Mount、Volume、tmpfs 三种数据挂载方式的选型与管理，最后介绍多容器数据共享方案。"
---

# Docker 网络与数据卷

## 一、Docker 网络模式

Docker 提供多种网络驱动，满足不同的容器网络需求。

### 1. 网络模式对比

| 网络模式 | 隔离性 | 性能 | 容器间通信 | 适用场景 |
|---------|-------|------|----------|---------|
| `bridge` | 中 | 中 | 同网络内可通信 | 默认，单机容器互联（最常用） |
| `host` | 无 | 最高 | 直接用 host 网络 | 高性能需求，端口大量映射 |
| `none` | 完全隔离 | - | 无网络 | 只需本地处理的任务（如数据转换） |
| `overlay` | 中 | 中 | 跨主机通信 | Docker Swarm 多节点 |
| `macvlan` | 高 | 高 | 容器直接接入物理网络 | 需要容器有独立 MAC/IP 的场景 |

### 2. bridge 网络

默认的 bridge（`docker0`）网络不支持容器间通过名称通信，推荐使用**自定义 bridge 网络**。

```bash
# 查看所有网络
docker network ls

# 查看 bridge 网络详情（包含连接的容器）
docker network inspect bridge
```

### 3. host 网络

容器直接使用宿主机网络，不做端口映射，性能最好但隔离性最差。

```bash
# 使用 host 网络运行容器（端口不需要映射）
docker run -d --network host nginx
# 直接访问 http://宿主机IP:80
```

::: warning host 网络的限制
- 只支持 Linux 宿主机（macOS/Windows Docker Desktop 不支持真正的 host 网络）
- 容器使用的端口与宿主机完全共享，存在端口冲突风险
:::

### 4. none 网络

完全禁用网络，容器只有 loopback 接口：

```bash
docker run -d --network none my-data-processor
```

## 二、自定义 Bridge 网络

自定义网络提供**容器 DNS 解析**（通过容器名通信）、更好的网络隔离，是多容器应用的标准做法。

### 1. 创建和管理自定义网络

```bash
# 创建自定义 bridge 网络
docker network create app-network

# 指定子网和网关（适合需要固定 IP 范围的场景）
docker network create \
  --driver bridge \
  --subnet 172.20.0.0/16 \
  --gateway 172.20.0.1 \
  --opt com.docker.network.bridge.name=br-app \
  app-network

# 查看网络详情
docker network inspect app-network

# 删除网络
docker network rm app-network

# 清理所有未使用的网络
docker network prune
```

### 2. 容器连接自定义网络

::: details 自定义网络容器通信示例

```bash
# 创建专用网络
docker network create backend-net

# 启动数据库（连接到自定义网络）
docker run -d \
  --name postgres \
  --network backend-net \
  -e POSTGRES_DB=myapp \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

# 启动 Redis
docker run -d \
  --name redis \
  --network backend-net \
  redis:7-alpine

# 启动 API 服务（连接到同一网络，通过容器名访问 DB 和 Redis）
docker run -d \
  --name my-api \
  --network backend-net \
  -p 3000:3000 \
  -e DB_HOST=postgres \       # 直接用容器名作为主机名
  -e DB_PORT=5432 \
  -e REDIS_URL=redis://redis:6379 \
  my-api:latest

# 验证连通性
docker exec my-api ping postgres -c 2
docker exec my-api ping redis -c 2
```

:::

### 3. 容器加入/离开网络

```bash
# 运行中的容器加入网络
docker network connect app-network my-container

# 指定别名（其他容器可通过别名访问）
docker network connect --alias db app-network postgres

# 离开网络
docker network disconnect app-network my-container
```

## 三、Volume（数据卷）类型

Docker 提供三种数据挂载方式，各有适用场景。

### 1. 三种挂载方式对比

| 类型 | 语法 | 存储位置 | 生命周期 | 适用场景 |
|------|------|---------|---------|---------|
| **Named Volume** | `-v vol-name:/path` | Docker 管理的目录 | 独立于容器 | 数据库、应用数据持久化（推荐） |
| **Bind Mount** | `-v /host/path:/container/path` | 宿主机指定目录 | 独立于容器 | 开发热重载、共享配置文件 |
| **tmpfs** | `--tmpfs /path` | 内存（RAM） | 容器停止即消失 | 敏感临时数据、高速缓存 |

```
Named Volume：  宿主机 /var/lib/docker/volumes/vol-name/_data  ↔  容器 /data
Bind Mount：    宿主机 /home/user/myapp                        ↔  容器 /app
tmpfs：         内存（RAM）                                    ↔  容器 /tmp
```

### 2. Named Volume（命名卷）

::: details Named Volume 使用示例

```bash
# 创建命名卷
docker volume create mysql-data

# 使用命名卷（推荐方式）
docker run -d \
  --name mysql \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  mysql:8.0

# 查看所有卷
docker volume ls

# 查看卷详情（包含挂载路径）
docker volume inspect mysql-data

# 删除卷
docker volume rm mysql-data

# 清理所有未使用的卷（谨慎使用！）
docker volume prune
```

:::

### 3. Bind Mount（绑定挂载）

Bind Mount 直接挂载宿主机目录，适合开发环境实时同步代码：

::: details Bind Mount 开发环境示例

```bash
# 开发模式：挂载源码目录（代码修改立即生效）
docker run -d \
  --name dev-app \
  -p 3000:3000 \
  -v "$(pwd)/src:/app/src" \
  -v "$(pwd)/package.json:/app/package.json" \
  -e NODE_ENV=development \
  my-app:dev

# 挂载配置文件（只读）
docker run -d \
  -v /etc/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine

# 挂载日志目录（方便在宿主机上查看）
docker run -d \
  -v /var/log/myapp:/app/logs \
  my-app:latest
```

:::

::: warning Bind Mount 注意事项
- 宿主机目录路径必须使用**绝对路径**
- 挂载目录会**覆盖**容器内原有内容（镜像中的文件会被隐藏）
- 生产环境数据持久化推荐用 Named Volume，而非 Bind Mount
:::

### 4. tmpfs（内存挂载）

```bash
# tmpfs 挂载（数据只在内存中，容器停止即消失）
docker run -d \
  --name secure-app \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  --tmpfs /app/cache:rw,size=256m \
  my-app:latest
```

| tmpfs 选项 | 说明 |
|-----------|------|
| `rw` / `ro` | 读写/只读 |
| `noexec` | 禁止执行二进制文件 |
| `nosuid` | 禁止 SUID 位 |
| `size=N` | 限制大小（字节/k/m/g） |

## 四、Volume 管理命令

```bash
# 查看所有卷
docker volume ls

# 过滤悬空卷（无容器引用的卷）
docker volume ls -f dangling=true

# 查看卷详细信息
docker volume inspect my-volume

# 备份卷数据（常用技巧）
docker run --rm \
  -v my-volume:/source:ro \
  -v "$(pwd)/backup":/backup \
  alpine tar czf /backup/volume-backup.tar.gz -C /source .

# 恢复卷数据
docker run --rm \
  -v my-volume:/target \
  -v "$(pwd)/backup":/backup:ro \
  alpine tar xzf /backup/volume-backup.tar.gz -C /target

# 删除指定卷
docker volume rm my-volume

# 清理所有未使用的卷
docker volume prune
docker volume prune -f   # 跳过确认
```

## 五、数据持久化方案

### 1. 生产数据库持久化

::: details PostgreSQL 持久化完整示例

```bash
# 创建数据卷
docker volume create pg-data

# 启动 PostgreSQL 并挂载数据卷
docker run -d \
  --name postgres \
  --restart unless-stopped \
  --network app-network \
  -v pg-data:/var/lib/postgresql/data \
  -v /etc/localtime:/etc/localtime:ro \
  -e POSTGRES_DB=myapp \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD_FILE=/run/secrets/pg_password \
  -p 127.0.0.1:5432:5432 \   # 只监听 localhost，不对外暴露
  postgres:16-alpine

# 数据备份
docker exec postgres pg_dumpall -U appuser \
  | gzip > "/backup/pg_$(date +%Y%m%d_%H%M%S).sql.gz"
```

:::

### 2. 只读根文件系统 + 挂载可写目录

以只读模式运行容器，提高安全性，只挂载必要的可写目录：

```bash
docker run -d \
  --name my-api \
  --read-only \                           # 根文件系统只读
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \ # 临时目录用 tmpfs
  -v app-logs:/app/logs \                 # 日志用命名卷
  -v app-uploads:/app/uploads \           # 上传目录用命名卷
  my-api:latest
```

## 六、多容器数据共享

### 1. Volume 共享（推荐）

多个容器挂载同一 Named Volume 实现数据共享：

::: details 多容器共享 Volume 示例

```bash
# 创建共享卷
docker volume create shared-uploads

# 容器 A：写入上传文件
docker run -d \
  --name api-server \
  -v shared-uploads:/app/uploads \
  my-api:latest

# 容器 B：读取并处理文件（只读挂载）
docker run -d \
  --name image-processor \
  -v shared-uploads:/data/input:ro \
  image-processor:latest

# 容器 C：Nginx 提供静态文件服务
docker run -d \
  --name file-server \
  -p 8080:80 \
  -v shared-uploads:/usr/share/nginx/html:ro \
  nginx:alpine
```

:::

### 2. Volume from（volumes-from）

从另一个容器复用其挂载的卷：

```bash
# 创建数据容器（只用于定义卷结构）
docker create --name data-store \
  -v /app/data \
  -v /app/logs \
  busybox

# 其他容器继承该容器的卷配置
docker run -d \
  --name app-server \
  --volumes-from data-store \
  my-app:latest

docker run -d \
  --name log-collector \
  --volumes-from data-store:ro \   # 只读挂载
  fluentd:latest
```

::: tip 推荐使用 Docker Compose 管理
多容器数据共享场景下，建议使用 Docker Compose 统一管理容器、网络和卷，配置更清晰，参见下一篇文章的实战案例。
:::
