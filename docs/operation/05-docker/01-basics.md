---
title: "Docker 基础概念与操作"
category: "运维 · Docker"
tags:
  - Docker
  - 容器
  - 镜像
  - 基础
date: 2026-03-17
excerpt: "本文介绍 Docker 的核心架构（Daemon/Client/Registry），通过对比表厘清容器与虚拟机的本质区别，系统讲解镜像和容器的完整命令集，以及 docker run 的常用参数，帮助你快速掌握 Docker 的日常操作。"
---

# Docker 基础概念与操作

## 一、Docker 架构

Docker 采用客户端-服务端（C/S）架构，三个核心组件协同工作。

### 1. 核心组件

| 组件 | 说明 |
|------|------|
| **Docker Client** | 用户交互的命令行工具（`docker`），将命令发送给 Daemon |
| **Docker Daemon（dockerd）** | 后台进程，负责管理镜像、容器、网络和存储卷 |
| **Docker Registry** | 镜像仓库，存储和分发镜像（Docker Hub / Harbor / 云厂商镜像服务） |

```
用户 → docker CLI → Docker Daemon（本地或远程）→ 镜像仓库（拉取/推送镜像）
                            ↓
                    容器运行时（containerd）
                            ↓
                      OCI 运行时（runc）
                            ↓
                        Linux 内核
                    （Namespace + Cgroup）
```

### 2. 核心概念

| 概念 | 说明 |
|------|------|
| **Image（镜像）** | 只读的分层文件系统，是容器的模板，包含应用代码、运行时和依赖 |
| **Container（容器）** | 镜像的运行实例，在镜像层之上加一层可写层 |
| **Layer（层）** | 镜像由多个只读层叠加而成，每条 Dockerfile 指令创建一层 |
| **Registry** | 存储镜像的仓库，Docker Hub 是最大的公共 Registry |
| **Volume** | 持久化存储，独立于容器生命周期 |
| **Network** | 容器间通信的网络模型 |

## 二、容器 vs 虚拟机

| 对比维度 | 容器 | 虚拟机 |
|---------|------|-------|
| 隔离级别 | 进程级隔离（Namespace + Cgroup） | 硬件级隔离（Hypervisor） |
| 启动时间 | 秒级（甚至毫秒级） | 分钟级 |
| 镜像大小 | MB 级（Alpine 仅 5MB） | GB 级 |
| 资源开销 | 极低（共享宿主机内核） | 较高（每个 VM 独立内核） |
| 安全隔离 | 较弱（共享内核，有逃逸风险） | 强（完全隔离） |
| 可移植性 | 极强（只需有 Docker 即可运行） | 较强（依赖 Hypervisor） |
| 密度 | 单机可运行数十至数百个 | 单机通常数十个 |
| 适用场景 | 微服务、CI/CD、云原生 | 强隔离需求、多OS、传统应用 |

::: tip 容器不是虚拟机
容器共享宿主机的 Linux 内核，通过 Namespace 实现进程/网络/文件系统隔离，通过 Cgroup 限制资源使用。这使得容器极为轻量，但也意味着安全性弱于 VM。
:::

## 三、镜像命令

### 1. 拉取与查看

```bash
# 拉取镜像（不指定 Tag 默认 latest）
docker pull nginx
docker pull nginx:1.25-alpine
docker pull registry.example.com/my-app:v1.2.3  # 私有仓库

# 列出本地镜像
docker images
docker images --filter "dangling=true"   # 查看悬空镜像（无 Tag 的旧层）

# 查看镜像构建历史（层信息）
docker history nginx:1.25-alpine

# 查看镜像详细信息（JSON 格式）
docker inspect nginx:1.25-alpine

# 搜索 Docker Hub 上的镜像
docker search nginx --limit 5
```

### 2. Tag 与推送

```bash
# 给镜像打 Tag
docker tag my-app:latest registry.example.com/team/my-app:v1.2.3
docker tag my-app:latest registry.example.com/team/my-app:latest

# 登录私有仓库
docker login registry.example.com -u username

# 推送镜像
docker push registry.example.com/team/my-app:v1.2.3
docker push registry.example.com/team/my-app:latest

# 登出
docker logout registry.example.com
```

### 3. 构建镜像

```bash
# 基本构建（. 为构建上下文目录）
docker build -t my-app:v1.0 .

# 指定 Dockerfile 路径
docker build -f ci/Dockerfile.prod -t my-app:prod .

# 传入构建参数（与 ARG 配合）
docker build \
  --build-arg NODE_VERSION=20 \
  --build-arg APP_ENV=production \
  -t my-app:v1.0 .

# 不使用缓存构建
docker build --no-cache -t my-app:latest .

# 多平台构建（需启用 buildx）
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t registry.example.com/my-app:v1.0 \
  --push .
```

### 4. 清理镜像

```bash
# 删除指定镜像
docker rmi nginx:latest
docker rmi <image-id>

# 强制删除（即使有容器依赖）
docker rmi -f nginx:latest

# 清理悬空镜像
docker image prune

# 清理所有未使用的镜像（包括无容器引用的）
docker image prune -a

# 清理所有未使用资源（镜像+容器+网络+卷）
docker system prune -a --volumes
```

## 四、容器命令

### 1. 运行与管理

```bash
# 基本运行
docker run nginx

# 后台运行
docker run -d nginx

# 指定名称
docker run -d --name my-nginx nginx

# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 查看容器详细信息
docker inspect my-nginx

# 查看容器资源使用（实时）
docker stats
docker stats my-nginx --no-stream   # 只获取一次快照

# 查看容器端口映射
docker port my-nginx
```

### 2. 启动、停止与删除

```bash
# 停止容器（发送 SIGTERM，等 10s 后发 SIGKILL）
docker stop my-nginx
docker stop -t 30 my-nginx   # 等待 30s 优雅停止

# 强制停止（直接发 SIGKILL）
docker kill my-nginx

# 启动已停止的容器
docker start my-nginx

# 重启容器
docker restart my-nginx

# 删除容器（必须先停止）
docker rm my-nginx

# 强制删除运行中的容器
docker rm -f my-nginx

# 删除所有已停止的容器
docker container prune

# 停止并删除所有容器
docker ps -aq | xargs docker rm -f
```

### 3. 进入容器与执行命令

```bash
# 进入运行中的容器（交互式 Shell）
docker exec -it my-nginx bash
docker exec -it my-nginx sh   # 无 bash 时用 sh（如 Alpine 镜像）

# 在容器内执行单条命令
docker exec my-nginx nginx -t                  # 检查 nginx 配置
docker exec my-nginx cat /etc/nginx/nginx.conf

# 以 root 权限进入（调试非 root 容器）
docker exec -it -u root my-nginx bash
```

### 4. 日志查看

```bash
# 查看容器日志
docker logs my-nginx

# 实时跟踪日志
docker logs -f my-nginx

# 显示最近 100 行
docker logs --tail 100 my-nginx

# 显示时间戳
docker logs -t my-nginx

# 从指定时间后的日志
docker logs --since "2026-03-17T10:00:00" my-nginx
docker logs --since 1h my-nginx   # 最近 1 小时
```

### 5. 文件拷贝

```bash
# 从容器复制文件到本地
docker cp my-nginx:/etc/nginx/nginx.conf ./nginx.conf

# 从本地复制文件到容器
docker cp ./nginx.conf my-nginx:/etc/nginx/nginx.conf
```

## 五、docker run 常用参数

### 1. 参数速查表

| 参数 | 简写 | 说明 | 示例 |
|------|------|------|------|
| `--detach` | `-d` | 后台运行 | `-d` |
| `--publish` | `-p` | 端口映射 `宿主机:容器` | `-p 8080:80` |
| `--volume` | `-v` | 数据卷挂载 | `-v /data:/app/data` |
| `--env` | `-e` | 设置环境变量 | `-e NODE_ENV=prod` |
| `--env-file` | - | 从文件读取环境变量 | `--env-file .env` |
| `--name` | - | 指定容器名称 | `--name my-nginx` |
| `--network` | - | 指定网络 | `--network my-net` |
| `--restart` | - | 重启策略 | `--restart always` |
| `--rm` | - | 容器退出后自动删除 | `--rm` |
| `--interactive` | `-i` | 保持 STDIN 开启 | `-i` |
| `--tty` | `-t` | 分配伪终端 | `-t`（通常 `-it` 一起用） |
| `--user` | `-u` | 指定运行用户 | `-u 1000:1000` |
| `--workdir` | `-w` | 设置工作目录 | `-w /app` |
| `--cpus` | - | 限制 CPU 核数 | `--cpus 0.5` |
| `--memory` | `-m` | 限制内存 | `-m 512m` |
| `--memory-swap` | - | 内存+Swap 上限 | `--memory-swap 1g` |
| `--read-only` | - | 只读根文件系统 | `--read-only` |
| `--hostname` | `-h` | 容器主机名 | `-h web-01` |
| `--link` | - | 链接到另一容器（已不推荐，用自定义网络替代） | - |

### 2. 重启策略说明

| 策略 | 说明 |
|------|------|
| `no` | 不自动重启（默认） |
| `on-failure[:N]` | 非 0 退出码时重启，可指定最大重试次数 |
| `always` | 无论如何都重启（Docker Daemon 重启时也会启动容器） |
| `unless-stopped` | 类似 always，但手动停止的容器 Daemon 重启后不会启动 |

### 3. 完整示例

::: details 运行一个完整的 Web 应用容器

```bash
docker run -d \
  --name my-api \
  --hostname api-server \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /data/app/uploads:/app/uploads \
  -v /data/app/logs:/app/logs \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DB_HOST=postgres \
  --env-file /etc/myapp/.env \
  --network app-network \
  --cpus 1 \
  --memory 512m \
  --memory-swap 512m \
  --user 1001:1001 \
  --read-only \
  --tmpfs /tmp \
  --health-cmd "curl -f http://localhost:3000/health || exit 1" \
  --health-interval 30s \
  --health-timeout 5s \
  --health-retries 3 \
  registry.example.com/my-api:v1.2.3
```

:::

::: tip `-it` 与 `-d` 的区别
- `-it`：交互模式，适合需要终端交互的场景（如调试容器、运行 Shell）
- `-d`：后台模式，适合服务类容器长期运行
- 两者不要同时使用于生产服务容器
:::
