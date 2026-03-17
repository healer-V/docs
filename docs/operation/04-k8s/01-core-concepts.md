---
title: "Kubernetes 核心概念"
category: "运维 · Kubernetes"
tags:
  - Kubernetes
  - Pod
  - Node
  - 集群
date: 2026-03-17
excerpt: "本文系统讲解 Kubernetes 的集群架构（Control Plane 与 Worker Node 各组件职责）、核心对象（Pod/Node/Namespace/Label/Selector），以及 Pod 生命周期、容器状态和三种健康检查探针的配置方法。"
---

# Kubernetes 核心概念

## 一、K8s 架构

Kubernetes 集群由**控制平面（Control Plane）**和**工作节点（Worker Node）**组成。

### 1. Control Plane 组件

Control Plane 负责集群的全局决策（如调度、扩缩容）和事件检测，通常部署在独立的 Master 节点上。

| 组件 | 职责 |
|------|------|
| **API Server** | 集群的统一入口，提供 RESTful API，所有操作（kubectl/SDK）都通过它完成；负责认证、授权和准入控制 |
| **etcd** | 分布式 KV 数据库，存储集群的全部配置和状态数据（是集群的"大脑"） |
| **Scheduler** | 监听未调度的 Pod，根据资源需求、节点亲和性等策略为 Pod 选择最合适的 Worker Node |
| **Controller Manager** | 运行各类控制器（Deployment/ReplicaSet/Node 控制器等），持续调协实际状态与期望状态 |
| **Cloud Controller Manager** | 与云平台 API 交互，管理负载均衡器、持久卷、节点等云资源 |

### 2. Worker Node 组件

Worker Node 负责运行实际的业务容器。

| 组件 | 职责 |
|------|------|
| **kubelet** | Node 上的代理，与 API Server 通信，负责启动/停止容器，报告节点和 Pod 状态 |
| **kube-proxy** | 维护 Node 上的网络规则（iptables/ipvs），实现 Service 的负载均衡和流量转发 |
| **容器运行时** | 实际运行容器的引擎，如 containerd（默认）、CRI-O，Docker（已废弃直接支持） |

### 3. 架构图示

```
          ┌──────────────── Control Plane ────────────────┐
          │                                                │
用户/CI   │   API Server ← → etcd                        │
  ↓       │       ↕                                       │
kubectl ──┤   Scheduler    Controller Manager              │
          │                                                │
          └────────────────────────────────────────────────┘
                  ↕ Watch/Update（通过 API Server）
          ┌─── Worker Node ────┐  ┌─── Worker Node ────┐
          │ kubelet            │  │ kubelet            │
          │ kube-proxy         │  │ kube-proxy         │
          │ containerd         │  │ containerd         │
          │  ┌─ Pod ─────────┐ │  │  ┌─ Pod ─────────┐ │
          │  │ Container A   │ │  │  │ Container B   │ │
          │  └───────────────┘ │  │  └───────────────┘ │
          └────────────────────┘  └────────────────────┘
```

## 二、核心对象

### 1. Pod

Pod 是 Kubernetes 中最小的可部署单元，封装一个或多个紧密关联的容器，共享网络（同一 IP）和存储（Volume）。

::: details 最简 Pod YAML

```yaml
# 文件：manifests/pod-demo.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-demo
  namespace: default
  labels:
    app: nginx
    version: "1.25"
spec:
  containers:
    - name: nginx
      image: nginx:1.25-alpine
      ports:
        - containerPort: 80
      resources:
        requests:
          cpu: "100m"
          memory: "128Mi"
        limits:
          cpu: "200m"
          memory: "256Mi"
```

:::

::: tip Pod vs 容器
Pod 不等于容器：
- 一个 Pod 通常包含一个主容器（main container）
- Sidecar 容器（日志收集、服务网格代理）与主容器共存于同一 Pod
- Init 容器在主容器启动前完成初始化工作（如数据库迁移、等待依赖就绪）
:::

### 2. Node

Node 是集群中的工作机器（物理机或虚拟机）。查看节点信息：

```bash
# 查看所有节点
kubectl get nodes -o wide

# 查看节点详细信息（包括资源容量和已分配量）
kubectl describe node <node-name>

# 查看节点上运行的 Pod
kubectl get pods --all-namespaces -o wide --field-selector spec.nodeName=<node-name>
```

### 3. Namespace

Namespace 提供集群内的软隔离，将资源分组管理，常用于区分环境（dev/staging/prod）或团队。

```bash
# 查看所有命名空间
kubectl get namespaces

# 创建命名空间
kubectl create namespace my-team

# 在指定命名空间操作（-n 简写）
kubectl get pods -n my-team

# 切换默认命名空间（避免每次加 -n）
kubectl config set-context --current --namespace=my-team
```

::: details Namespace YAML 示例

```yaml
# 文件：manifests/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-team
  labels:
    team: backend
    env: production
```

:::

### 4. Label 与 Selector

Label 是附加到对象上的键值对，用于分组和选择。Selector 根据 Label 过滤对象，是 Service、Deployment 关联 Pod 的核心机制。

```bash
# 给 Pod 打标签
kubectl label pod nginx-demo app=nginx env=prod

# 删除标签（标签名后加 -）
kubectl label pod nginx-demo env-

# 使用 Selector 过滤
kubectl get pods -l app=nginx,env=prod

# 集合运算符
kubectl get pods -l "app in (nginx, apache)"
kubectl get pods -l "env notin (dev, test)"
```

::: details Label 设计建议

推荐的 Label 命名规范（来自 Kubernetes 官方推荐标签）：

```yaml
labels:
  app.kubernetes.io/name: my-app          # 应用名称
  app.kubernetes.io/version: "1.2.3"      # 应用版本
  app.kubernetes.io/component: frontend   # 组件类型（frontend/backend/database）
  app.kubernetes.io/part-of: my-platform  # 所属平台/项目
  app.kubernetes.io/managed-by: helm      # 管理工具
```

:::

## 三、Pod 生命周期

### 1. Pod 阶段（Phase）

| Phase | 说明 |
|-------|------|
| `Pending` | Pod 已被接受，但容器尚未创建（可能在等待调度或拉取镜像） |
| `Running` | Pod 已绑定到节点，至少一个容器正在运行 |
| `Succeeded` | Pod 中所有容器已成功终止（退出码 0），常见于 Job |
| `Failed` | Pod 中所有容器已终止，且至少一个以失败状态退出 |
| `Unknown` | 无法获取 Pod 状态（通常是节点通信问题） |

```bash
# 查看 Pod 状态
kubectl get pods
kubectl describe pod <pod-name>

# 查看 Pod 日志
kubectl logs <pod-name>
kubectl logs <pod-name> -c <container-name>  # 多容器 Pod
kubectl logs <pod-name> --previous           # 崩溃重启前的日志
kubectl logs -f <pod-name>                  # 实时跟踪
```

### 2. 容器状态

每个容器有三种可能的状态：

| 状态 | 说明 |
|------|------|
| `Waiting` | 容器正在等待（拉取镜像、等待依赖、崩溃后等待重启） |
| `Running` | 容器正在运行，`startedAt` 记录启动时间 |
| `Terminated` | 容器已停止，包含退出码、原因、开始/结束时间 |

### 3. 重启策略（restartPolicy）

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| `Always` | 容器退出后总是重启（默认值） | 长期运行的服务 |
| `OnFailure` | 只有非 0 退出码才重启 | 批处理 Job |
| `Never` | 不自动重启 | 一次性任务 |

## 四、健康检查（Probe）

### 1. 三种探针对比

| 探针 | 触发时机 | 失败后果 |
|------|---------|---------|
| **livenessProbe** | 容器运行期间持续检查 | 容器被杀死并重启 |
| **readinessProbe** | 容器运行期间持续检查 | 从 Service Endpoints 中移除（不接收流量） |
| **startupProbe** | 仅在容器启动阶段检查 | 超时则杀死容器，用于保护慢启动应用 |

::: tip 探针使用建议
- **必须配置 readinessProbe**：确保 Pod 真正就绪后才接收流量，避免流量打到未启动完成的实例
- **livenessProbe 要保守**：失败会导致重启，检查逻辑要简单（只验证进程存活，不验证业务逻辑）
- **慢启动应用用 startupProbe**：给 Java 等应用足够的初始化时间，避免 livenessProbe 误判
:::

### 2. 探针检查方式

| 检查方式 | 说明 | 适用场景 |
|---------|------|---------|
| `httpGet` | HTTP GET 请求，2xx/3xx 状态码为成功 | Web 服务 |
| `tcpSocket` | TCP 连接成功即为通过 | 数据库、缓存等 TCP 服务 |
| `exec` | 在容器内执行命令，退出码 0 为成功 | 无 HTTP 端口的应用 |
| `grpc` | gRPC Health Check（需实现 gRPC 健康检查协议） | gRPC 服务 |

### 3. 完整配置示例

::: details 三种探针配置示例

```yaml
# 文件：manifests/deployment-with-probes.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: my-app:v1.2.3
          ports:
            - containerPort: 3000

          # 启动探针：给应用最多 60s 启动时间（failureThreshold × periodSeconds）
          startupProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10   # 容器启动后等待 10s 才开始检查
            periodSeconds: 5          # 每 5s 检查一次
            failureThreshold: 12      # 失败 12 次（60s）后认为启动失败

          # 就绪探针：未就绪时不接收流量
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
              httpHeaders:
                - name: Accept
                  value: application/json
            initialDelaySeconds: 5
            periodSeconds: 10
            successThreshold: 1       # 成功 1 次即认为就绪
            failureThreshold: 3       # 连续失败 3 次才标记为未就绪
            timeoutSeconds: 5         # 单次检查超时时间

          # 存活探针：失败则重启容器
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 15
            failureThreshold: 3

          # TCP 探针示例（用于数据库等服务）
          # livenessProbe:
          #   tcpSocket:
          #     port: 5432
          #   initialDelaySeconds: 15
          #   periodSeconds: 20

          # exec 探针示例
          # livenessProbe:
          #   exec:
          #     command:
          #       - /bin/sh
          #       - -c
          #       - "redis-cli ping | grep PONG"
          #   initialDelaySeconds: 10
          #   periodSeconds: 10
```

:::

### 4. 探针参数说明

| 参数 | 说明 | 默认值 |
|------|------|-------|
| `initialDelaySeconds` | 容器启动后等待多久才开始探测 | 0 |
| `periodSeconds` | 探测间隔（秒） | 10 |
| `timeoutSeconds` | 单次探测超时时间（秒） | 1 |
| `successThreshold` | 连续成功多少次才认为成功（存活/启动探针固定为 1） | 1 |
| `failureThreshold` | 连续失败多少次才采取行动 | 3 |

::: warning 常见误配
- `initialDelaySeconds` 设置太短导致探针在应用未启动时就开始检测，造成频繁重启
- `livenessProbe` 检查依赖外部服务（如数据库），外部服务故障会导致所有 Pod 同时重启，加剧故障
- 不配置 `readinessProbe`，滚动更新时新实例还未就绪就接收流量，导致用户请求报错
:::
