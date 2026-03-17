---
title: "Kubernetes 工作负载"
category: "运维 · Kubernetes"
tags:
  - Kubernetes
  - Deployment
  - StatefulSet
  - DaemonSet
date: 2026-03-17
excerpt: "本文讲解 Kubernetes 五种工作负载控制器：Deployment 的滚动更新、回滚和 HPA 自动扩缩容；StatefulSet 的有状态服务管理；DaemonSet 的节点守护进程；以及 Job/CronJob 的批处理任务配置，并介绍 ConfigMap、Secret 的挂载方式和资源限制策略。"
---

# Kubernetes 工作负载

## 一、Deployment

Deployment 是最常用的工作负载控制器，管理无状态应用（如 Web 服务、API），提供声明式更新、滚动发布和自动回滚能力。

### 1. 基本配置

::: details Deployment YAML 完整示例

```yaml
# 文件：manifests/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-api
  namespace: production
  labels:
    app: my-api
spec:
  replicas: 3                   # 期望副本数
  revisionHistoryLimit: 10      # 保留历史版本数（用于回滚）

  selector:
    matchLabels:
      app: my-api               # 必须与 template.metadata.labels 匹配

  # 更新策略
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1               # 更新期间最多多出 1 个 Pod
      maxUnavailable: 0         # 更新期间最多不可用 0 个 Pod（零停机）

  template:
    metadata:
      labels:
        app: my-api
        version: "1.2.3"
    spec:
      terminationGracePeriodSeconds: 30  # 优雅终止等待时间（秒）

      containers:
        - name: api
          image: registry.example.com/my-api:1.2.3
          ports:
            - containerPort: 3000

          # 环境变量
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3000"
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: password

          resources:
            requests:
              cpu: "200m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"

          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5

          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 15
```

:::

### 2. 滚动更新

```bash
# 更新镜像（最常用的触发方式）
kubectl set image deployment/my-api api=registry.example.com/my-api:1.2.4

# 通过修改 YAML 触发更新
kubectl apply -f manifests/deployment.yaml

# 强制触发滚动重启（镜像未变但需要重启，如配置变更后）
kubectl rollout restart deployment/my-api

# 查看滚动更新进度
kubectl rollout status deployment/my-api

# 暂停滚动更新（先发布少量，观察后继续）
kubectl rollout pause deployment/my-api
# 恢复
kubectl rollout resume deployment/my-api
```

### 3. 回滚

```bash
# 查看更新历史
kubectl rollout history deployment/my-api

# 查看某个版本的详情
kubectl rollout history deployment/my-api --revision=3

# 回滚到上一个版本
kubectl rollout undo deployment/my-api

# 回滚到指定版本
kubectl rollout undo deployment/my-api --to-revision=2
```

::: tip 更新注释（CHANGE-CAUSE）
执行 `kubectl apply` 时加上 `--record` 注释（已废弃）或用 annotation 记录变更原因，方便回滚时查看历史：
```bash
kubectl annotate deployment/my-api kubernetes.io/change-cause="更新至 v1.2.4，修复内存泄漏"
```
:::

### 4. HPA — 自动水平扩缩容

HPA（Horizontal Pod Autoscaler）根据 CPU/内存使用率或自定义指标自动调整 Pod 数量。

::: details HPA 配置示例

```yaml
# 文件：manifests/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-api

  minReplicas: 2    # 最小副本数
  maxReplicas: 10   # 最大副本数

  metrics:
    # 基于 CPU 使用率扩缩容
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70   # CPU 平均使用率超 70% 时扩容

    # 基于内存使用率
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

  # 扩缩容行为（防止频繁抖动）
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60    # 扩容稳定窗口（60s 内的最高负载）
      policies:
        - type: Pods
          value: 2                      # 每次最多扩 2 个 Pod
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300   # 缩容稳定窗口（5 分钟内的最低负载）
      policies:
        - type: Pods
          value: 1                      # 每次最多缩 1 个 Pod
          periodSeconds: 120
```

:::

```bash
# 查看 HPA 状态
kubectl get hpa -n production
kubectl describe hpa my-api-hpa -n production
```

## 二、StatefulSet

StatefulSet 用于管理**有状态应用**（数据库、消息队列、分布式存储），提供稳定的网络标识和有序部署/扩缩/删除。

### 1. StatefulSet 特性

| 特性 | 说明 |
|------|------|
| 稳定的 Pod 名称 | Pod 名格式为 `<name>-0`、`<name>-1`，重启后名称不变 |
| 稳定的网络标识 | 每个 Pod 有固定的 DNS 名（需配合 Headless Service） |
| 有序部署/扩容 | 按序号顺序启动（0 → 1 → 2），前一个就绪后才启动下一个 |
| 有序缩容/删除 | 按逆序删除（N → ... → 1 → 0） |
| 稳定的存储 | PVC 与 Pod 绑定，Pod 重建后自动挂载同一 PVC |

### 2. StatefulSet 配置示例

::: details StatefulSet（Redis 集群）完整示例

```yaml
# 文件：manifests/redis-statefulset.yaml
---
# Headless Service（提供稳定的 DNS 名）
apiVersion: v1
kind: Service
metadata:
  name: redis-headless
  namespace: production
spec:
  clusterIP: None   # Headless Service：不分配 ClusterIP
  selector:
    app: redis
  ports:
    - port: 6379

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: production
spec:
  serviceName: "redis-headless"   # 关联 Headless Service
  replicas: 3
  selector:
    matchLabels:
      app: redis

  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
          command: ["redis-server", "--appendonly", "yes"]
          volumeMounts:
            - name: data
              mountPath: /data

  # 为每个 Pod 自动创建独立的 PVC
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: "fast-ssd"
        resources:
          requests:
            storage: 10Gi
```

Pod DNS 格式：`redis-0.redis-headless.production.svc.cluster.local`

:::

## 三、DaemonSet

DaemonSet 确保每个（符合条件的）Node 上都运行一个 Pod 副本，适合节点级别的基础设施组件。

**典型用途：**
- 日志收集：Fluentd、Filebeat
- 监控采集：Prometheus Node Exporter
- 网络插件：Calico、Flannel
- 存储代理：Ceph CSI

::: details DaemonSet（Node Exporter）示例

```yaml
# 文件：manifests/node-exporter-daemonset.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      # 允许调度到 Master 节点（如需监控 Master）
      tolerations:
        - key: node-role.kubernetes.io/control-plane
          operator: Exists
          effect: NoSchedule

      hostNetwork: true    # 使用主机网络
      hostPID: true        # 访问主机 PID

      containers:
        - name: node-exporter
          image: prom/node-exporter:latest
          ports:
            - containerPort: 9100
              hostPort: 9100
          securityContext:
            runAsNonRoot: true
            runAsUser: 65534
          volumeMounts:
            - name: proc
              mountPath: /host/proc
              readOnly: true
            - name: sys
              mountPath: /host/sys
              readOnly: true

      volumes:
        - name: proc
          hostPath:
            path: /proc
        - name: sys
          hostPath:
            path: /sys
```

:::

## 四、Job 与 CronJob

### 1. Job — 一次性任务

Job 确保指定数量的 Pod 成功完成后退出，适合数据库迁移、批量数据处理等场景。

::: details Job 配置示例

```yaml
# 文件：manifests/db-migration-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration-v1-2-3
  namespace: production
spec:
  completions: 1          # 需要成功完成的 Pod 数
  parallelism: 1          # 最大并行 Pod 数
  backoffLimit: 3         # 失败重试次数上限
  activeDeadlineSeconds: 300  # Job 整体超时（5 分钟）
  ttlSecondsAfterFinished: 3600  # Job 完成后 1 小时自动清理

  template:
    spec:
      restartPolicy: OnFailure  # Job Pod 只能用 OnFailure 或 Never
      containers:
        - name: migrator
          image: registry.example.com/my-app:1.2.3
          command: ["node", "scripts/migrate.js"]
          env:
            - name: DB_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url
```

:::

### 2. CronJob — 定时任务

::: details CronJob 配置示例

```yaml
# 文件：manifests/backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: db-backup
  namespace: production
spec:
  schedule: "0 2 * * *"        # cron 表达式（每天凌晨 2:00 UTC）
  timeZone: "Asia/Shanghai"    # 指定时区（K8s 1.27+）
  concurrencyPolicy: Forbid    # 禁止并发执行（Allow/Forbid/Replace）
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  startingDeadlineSeconds: 600  # 启动超时（超过此时间未启动则放弃本次）

  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: registry.example.com/db-tools:latest
              command: ["/scripts/backup.sh"]
              env:
                - name: S3_BUCKET
                  value: "my-db-backups"
```

:::

## 五、ConfigMap 与 Secret

### 1. ConfigMap — 非敏感配置

::: details ConfigMap 创建与挂载示例

```yaml
# 文件：manifests/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  # 键值对形式
  LOG_LEVEL: "info"
  MAX_CONNECTIONS: "100"

  # 文件形式（多行内容）
  app.yaml: |
    server:
      port: 3000
      timeout: 30s
    database:
      pool_size: 10

  nginx.conf: |
    server {
      listen 80;
      location / {
        proxy_pass http://localhost:3000;
      }
    }
```

```yaml
# 在 Pod 中挂载 ConfigMap
spec:
  containers:
    - name: app
      env:
        # 方式一：单个键注入为环境变量
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: LOG_LEVEL

      envFrom:
        # 方式二：全部键批量注入为环境变量
        - configMapRef:
            name: app-config

      volumeMounts:
        # 方式三：挂载为文件
        - name: config-vol
          mountPath: /etc/app/config

  volumes:
    - name: config-vol
      configMap:
        name: app-config
        items:
          - key: app.yaml
            path: app.yaml      # 挂载为 /etc/app/config/app.yaml
```

:::

### 2. Secret — 敏感数据

Secret 与 ConfigMap 类似，但数据经过 Base64 编码，并在 etcd 中可配置加密存储。

::: details Secret 创建与使用示例

```bash
# 命令行创建（推荐，避免明文出现在文件中）
kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password=MyP@ssw0rd \
  -n production

# 从文件创建
kubectl create secret generic tls-cert \
  --from-file=tls.crt=server.crt \
  --from-file=tls.key=server.key

# 创建 Docker Registry 认证 Secret
kubectl create secret docker-registry harbor-creds \
  --docker-server=harbor.example.com \
  --docker-username=robot$ci \
  --docker-password=TOKEN \
  -n production
```

```yaml
# Secret YAML（值为 Base64 编码）
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  username: YWRtaW4=        # echo -n 'admin' | base64
  password: TXlQQHNzdzByZA==
```

:::

::: warning Secret 安全注意事项
- Secret 默认只是 Base64 编码，**并非加密**。生产环境应开启 etcd 静态加密，或使用 Vault/AWS Secrets Manager 等外部密钥管理系统
- 避免在版本库中提交 Secret YAML 文件，使用 Sealed Secrets 或 External Secrets Operator 管理
:::

## 六、资源请求与限制

### 1. requests 与 limits

| 字段 | 作用 |
|------|------|
| `resources.requests` | 调度时 Scheduler 保证节点有此容量，是 HPA 计算使用率的基准 |
| `resources.limits` | 容器使用上限，CPU 超限会被限速，内存超限会被 OOM Kill |

### 2. QoS 类型

Kubernetes 根据 requests 和 limits 的配置自动为 Pod 分配服务质量（QoS）等级，决定资源不足时的驱逐优先级：

| QoS 类型 | 条件 | 驱逐优先级 |
|---------|------|-----------|
| `Guaranteed` | requests == limits（CPU + 内存都设置且相等） | 最后被驱逐 |
| `Burstable` | requests < limits，或只设置了其中一个 | 中等 |
| `BestEffort` | 未设置 requests 和 limits | 最先被驱逐 |

::: details 资源配置建议

```yaml
# 生产环境推荐：Guaranteed QoS（requests = limits）
resources:
  requests:
    cpu: "500m"
    memory: "512Mi"
  limits:
    cpu: "500m"      # 与 requests 相同 → Guaranteed
    memory: "512Mi"

# 开发环境可用 Burstable
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "1000m"     # 允许短时突增
    memory: "512Mi"
```

**资源单位说明：**
- CPU：`1` = 1 核，`500m` = 0.5 核，`100m` = 0.1 核
- 内存：`Ki`（1024）、`Mi`（1024²）、`Gi`（1024³）；`K`（1000）、`M`（1000²）、`G`（1000³）

:::
