---
title: "Kubernetes 网络与服务"
category: "运维 · Kubernetes"
tags:
  - Kubernetes
  - Service
  - Ingress
  - 网络
date: 2026-03-17
excerpt: "本文讲解 Kubernetes 网络体系：四种 Service 类型的使用场景、基于 DNS 的服务发现、Ingress 规则配置与 TLS 终止、Nginx Ingress Controller 部署，以及 NetworkPolicy 访问控制和 CNI 插件通信原理。"
---

# Kubernetes 网络与服务

## 一、Service

Service 为一组 Pod 提供稳定的访问入口（固定 IP + DNS 名），屏蔽 Pod IP 的动态变化，并实现负载均衡。

### 1. Service 四种类型

| 类型 | 访问范围 | 说明 |
|------|---------|------|
| `ClusterIP` | 集群内部 | 默认类型，分配虚拟 IP，仅集群内可访问 |
| `NodePort` | 集群外部（Node IP） | 在每个 Node 上开放指定端口（30000-32767），外部可通过 `<NodeIP>:<NodePort>` 访问 |
| `LoadBalancer` | 集群外部（云厂商 LB） | 在 NodePort 基础上，自动创建云厂商负载均衡器（需云环境支持） |
| `ExternalName` | 集群内访问集群外 | 将 Service 映射到外部 DNS 名，无代理，用于访问集群外服务 |

### 2. ClusterIP

::: details ClusterIP Service 示例

```yaml
# 文件：manifests/service-clusterip.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-api-svc
  namespace: production
spec:
  type: ClusterIP          # 默认值，可省略
  selector:
    app: my-api            # 匹配 Pod 的 Label
  ports:
    - name: http
      protocol: TCP
      port: 80             # Service 暴露的端口
      targetPort: 3000     # 转发到 Pod 的端口（也可用容器端口名）
```

集群内通过以下方式访问：
- `my-api-svc`（同命名空间）
- `my-api-svc.production`
- `my-api-svc.production.svc.cluster.local`（完整 DNS 名）

:::

### 3. NodePort

::: details NodePort Service 示例

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-api-nodeport
spec:
  type: NodePort
  selector:
    app: my-api
  ports:
    - port: 80              # ClusterIP 监听端口
      targetPort: 3000      # Pod 端口
      nodePort: 30080       # Node 上的端口（不指定则随机分配 30000-32767）
```

外部访问：`http://<任意NodeIP>:30080`

:::

::: warning NodePort 使用建议
NodePort 适合测试和开发环境，或配合外部负载均衡器使用。生产环境直接暴露 NodePort 存在端口管理混乱和安全风险，推荐使用 LoadBalancer 或 Ingress。
:::

### 4. LoadBalancer

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-api-lb
  annotations:
    # 云厂商特定注解（以 AWS 为例）
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-internal: "false"
spec:
  type: LoadBalancer
  selector:
    app: my-api
  ports:
    - port: 80
      targetPort: 3000
```

### 5. ExternalName

```yaml
# 将集群内对 mysql-svc 的访问路由到外部数据库
apiVersion: v1
kind: Service
metadata:
  name: mysql-svc
  namespace: production
spec:
  type: ExternalName
  externalName: mysql.prod.example.com   # 外部 DNS 名
```

### 6. Endpoints

Service 通过 Endpoints 记录匹配 Pod 的 IP 列表。当 Pod 就绪时自动加入，未就绪时自动移除。

```bash
# 查看 Service 关联的 Endpoints
kubectl get endpoints my-api-svc -n production
kubectl describe endpoints my-api-svc -n production
```

手动管理 Endpoints（用于集成集群外服务）：

::: details 手动 Endpoints 示例

```yaml
# 无 selector 的 Service + 手动 Endpoints
---
apiVersion: v1
kind: Service
metadata:
  name: external-mysql
spec:
  ports:
    - port: 3306
---
apiVersion: v1
kind: Endpoints
metadata:
  name: external-mysql   # 必须与 Service 同名
subsets:
  - addresses:
      - ip: 192.168.1.100   # 外部数据库 IP
      - ip: 192.168.1.101
    ports:
      - port: 3306
```

:::

## 二、DNS 服务发现

Kubernetes 集群内置 CoreDNS，为 Service 和 Pod 提供 DNS 解析。

### 1. Service DNS 格式

```
<service-name>.<namespace>.svc.<cluster-domain>
```

常见访问方式（在 `production` namespace 中访问 `my-api-svc`）：

| 写法 | 适用场景 |
|------|---------|
| `my-api-svc` | 同命名空间内访问（最简写法） |
| `my-api-svc.production` | 跨命名空间访问 |
| `my-api-svc.production.svc.cluster.local` | 完整 FQDN，跨集群访问 |

### 2. Pod DNS 格式

StatefulSet Pod 可通过 Headless Service 的 DNS 访问：
```
<pod-name>.<headless-service>.<namespace>.svc.cluster.local
# 示例：redis-0.redis-headless.production.svc.cluster.local
```

### 3. 调试 DNS

```bash
# 创建临时 Pod 进行 DNS 调试
kubectl run dns-debug --image=busybox --rm -it --restart=Never -- sh

# 在容器内执行
nslookup my-api-svc.production
nslookup kubernetes.default.svc.cluster.local

# 查看 CoreDNS 状态
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns
```

## 三、Ingress

Ingress 是集群入口层的 HTTP/HTTPS 路由规则，将外部请求路由到集群内的 Service，支持基于主机名和路径的路由。

### 1. Ingress 规则配置

::: details 基础 Ingress 配置示例

```yaml
# 文件：manifests/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  namespace: production
  annotations:
    # Nginx Ingress Controller 专用注解
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "30"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"

spec:
  ingressClassName: nginx   # 指定使用 nginx Ingress Controller

  # TLS 配置
  tls:
    - hosts:
        - api.example.com
        - www.example.com
      secretName: example-tls-secret   # 存储证书的 Secret

  rules:
    # 基于主机名路由
    - host: api.example.com
      http:
        paths:
          - path: /v1
            pathType: Prefix
            backend:
              service:
                name: api-v1-svc
                port:
                  number: 80
          - path: /v2
            pathType: Prefix
            backend:
              service:
                name: api-v2-svc
                port:
                  number: 80

    # 另一个主机名
    - host: www.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-svc
                port:
                  number: 80
```

:::

### 2. pathType 说明

| pathType | 说明 | 示例 |
|---------|------|------|
| `Exact` | 精确匹配路径（区分大小写） | `/api` 只匹配 `/api`，不匹配 `/api/` |
| `Prefix` | 前缀匹配（按 `/` 分割） | `/api` 匹配 `/api`、`/api/users`、`/api/v1` |
| `ImplementationSpecific` | 由 Ingress Controller 决定 | - |

### 3. TLS 配置

::: details TLS Secret 与 Ingress 配置

```bash
# 手动创建 TLS Secret（从证书文件）
kubectl create secret tls example-tls-secret \
  --cert=server.crt \
  --key=server.key \
  -n production

# 使用 cert-manager 自动申请 Let's Encrypt 证书（推荐）
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
```

```yaml
# 使用 cert-manager 自动签发证书
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"   # 指定颁发者
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: api-example-com-tls   # cert-manager 自动创建此 Secret
```

:::

### 4. 路径重写

```yaml
# 将 /api/v1/users → /users（去掉前缀）
metadata:
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2

spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /api/v1(/|$)(.*)   # 捕获组 $2
            pathType: ImplementationSpecific
            backend:
              service:
                name: user-svc
                port:
                  number: 80
```

## 四、Nginx Ingress Controller

### 1. 安装 Nginx Ingress Controller

::: details Helm 安装（推荐）

```bash
# 添加 Helm 仓库
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# 安装（云环境，自动创建 LoadBalancer）
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=2 \
  --set controller.resources.requests.cpu=100m \
  --set controller.resources.requests.memory=90Mi

# 裸机环境（使用 NodePort 或 HostPort）
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=NodePort \
  --set controller.service.nodePorts.http=30080 \
  --set controller.service.nodePorts.https=30443

# 查看安装状态
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

:::

### 2. 常用注解

| 注解 | 说明 |
|------|------|
| `nginx.ingress.kubernetes.io/ssl-redirect: "true"` | HTTP 强制重定向到 HTTPS |
| `nginx.ingress.kubernetes.io/use-regex: "true"` | 路径支持正则表达式 |
| `nginx.ingress.kubernetes.io/proxy-body-size: "100m"` | 请求体最大值 |
| `nginx.ingress.kubernetes.io/limit-rps: "10"` | 限流（每秒请求数） |
| `nginx.ingress.kubernetes.io/auth-type: basic` | Basic Auth 认证 |
| `nginx.ingress.kubernetes.io/cors-allow-origin: "*"` | CORS 跨域配置 |
| `nginx.ingress.kubernetes.io/backend-protocol: HTTPS` | 后端使用 HTTPS |

## 五、NetworkPolicy

NetworkPolicy 定义 Pod 级别的网络访问控制，实现微隔离。默认所有 Pod 互通，配置 NetworkPolicy 后只允许规则中声明的流量。

::: details NetworkPolicy 配置示例

```yaml
# 文件：manifests/network-policy.yaml
# 只允许 frontend Pod 访问 backend 的 3000 端口
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-allow-frontend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend        # 此策略应用到 backend Pod

  policyTypes:
    - Ingress             # 限制入站流量

  ingress:
    # 规则一：允许 frontend Pod 访问
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 3000

    # 规则二：允许 monitoring namespace 中的 Pod 访问（Prometheus 抓取指标）
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: monitoring
      ports:
        - port: 9090

---
# 拒绝所有入站流量（配合上面的策略使用）
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}          # 匹配所有 Pod
  policyTypes:
    - Ingress              # 空 ingress 规则 = 拒绝所有入站
```

:::

::: tip NetworkPolicy 前提
NetworkPolicy 需要 CNI 插件支持才能生效（Calico、Cilium、Weave Net 等）。Flannel 默认不支持 NetworkPolicy。
:::

## 六、Pod 间通信原理（CNI）

### 1. K8s 网络模型三要求

1. 所有 Pod 都有唯一的 IP 地址
2. 同一节点的 Pod 之间可以直接通信（无需 NAT）
3. 不同节点的 Pod 之间也可以直接通信（无需 NAT）

### 2. CNI 插件对比

| CNI 插件 | 网络模式 | NetworkPolicy | 性能 | 适用场景 |
|---------|---------|--------------|------|---------|
| Flannel | Overlay（VXLAN） | 不支持 | 中 | 简单集群、学习环境 |
| Calico | BGP 路由（Underlay）| 支持 | 高 | 企业生产环境 |
| Cilium | eBPF | 支持（L4/L7） | 很高 | 高性能、需要细粒度策略 |
| Weave Net | Overlay | 支持 | 中 | 跨云/混合云场景 |

### 3. 同节点 Pod 通信流程

同一 Node 上的 Pod 通过**虚拟网桥（cni0/cbr0）**通信：

```
Pod A（eth0: 10.244.0.2）
  → veth pair → Node 网桥（cni0: 10.244.0.1）
  → veth pair → Pod B（eth0: 10.244.0.3）
```

### 4. 跨节点 Pod 通信（以 Flannel VXLAN 为例）

```
Pod A（Node1: 10.244.0.2）
  → cni0 网桥 → flannel0 → VXLAN 封包（UDP 8472）
  → Node1 eth0 → Node2 eth0
  → VXLAN 解包 → flannel0 → cni0 网桥
  → Pod B（Node2: 10.244.1.2）
```
