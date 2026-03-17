---
title: "Kubernetes 存储管理"
category: "运维 · Kubernetes"
tags:
  - Kubernetes
  - PV
  - PVC
  - StorageClass
date: 2026-03-17
excerpt: "本文讲解 Kubernetes 存储体系：从临时 Volume 到 PV/PVC 持久化存储，再到 StorageClass 动态供给，涵盖 NFS 存储配置、Helm 基础使用，以及命名空间资源配额管理。"
---

# Kubernetes 存储管理

## 一、Volume 类型

Volume 是 Pod 中容器可以挂载的存储，其生命周期与 Pod 绑定（而非容器）。

### 1. 常用 Volume 类型对比

| 类型 | 持久性 | 跨节点 | 适用场景 |
|------|-------|-------|---------|
| `emptyDir` | Pod 删除即消失 | 否 | 容器间临时共享数据、缓存 |
| `hostPath` | Node 上持久存在 | 否 | 访问节点文件系统（DaemonSet 常用） |
| `configMap` | 配置存储 | 是 | 挂载配置文件 |
| `secret` | 敏感数据存储 | 是 | 挂载证书、密码文件 |
| `persistentVolumeClaim` | 持久 | 视 PV 类型 | 数据库、有状态应用持久化数据 |
| `nfs` | 持久 | 是 | 共享文件存储 |
| `projected` | - | - | 将多种 Volume 合并挂载到同一目录 |

### 2. emptyDir — 临时共享存储

::: details emptyDir 使用示例

```yaml
# 文件：manifests/sidecar-pod.yaml
# 主容器产生日志，sidecar 容器采集日志
apiVersion: v1
kind: Pod
metadata:
  name: app-with-log-sidecar
spec:
  volumes:
    - name: shared-logs
      emptyDir: {}          # 默认使用磁盘；改为 emptyDir: {medium: Memory} 则使用内存（tmpfs）

  containers:
    # 主容器：写入日志
    - name: app
      image: my-app:latest
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app

    # Sidecar：收集日志发送到日志系统
    - name: log-collector
      image: fluentd:latest
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app
          readOnly: true
```

:::

### 3. hostPath — 挂载节点目录

::: details hostPath 使用示例

```yaml
# 访问 Node 上的 Docker Socket（常见于 CI/CD Agent）
apiVersion: v1
kind: Pod
metadata:
  name: docker-agent
spec:
  containers:
    - name: agent
      image: docker:24
      volumeMounts:
        - name: docker-sock
          mountPath: /var/run/docker.sock
  volumes:
    - name: docker-sock
      hostPath:
        path: /var/run/docker.sock
        type: Socket    # 可选类型：File/Directory/FileOrCreate/DirectoryOrCreate/Socket/BlockDevice
```

:::

::: danger hostPath 安全风险
hostPath 允许容器访问宿主机文件系统，存在安全隐患（容器逃逸风险）。生产环境中应通过 PodSecurityPolicy 或 OPA 限制其使用范围。
:::

## 二、PersistentVolume（PV）

PV 是集群中由管理员预先配置（或动态供给）的持久化存储资源，独立于 Pod 的生命周期。

### 1. PV 配置示例

::: details 静态 PV 配置（NFS）

```yaml
# 文件：manifests/pv-nfs.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-pv-001
  labels:
    storage-type: nfs
    tier: standard
spec:
  capacity:
    storage: 50Gi

  accessModes:
    - ReadWriteMany       # RWX：多节点同时读写（NFS 支持）

  persistentVolumeReclaimPolicy: Retain    # 释放后保留数据（Delete 则删除，Recycle 已废弃）

  storageClassName: nfs-standard           # 与 PVC 的 storageClassName 匹配

  nfs:
    server: 192.168.1.200                  # NFS 服务器地址
    path: /data/k8s-volumes/pv-001         # NFS 导出路径
    readOnly: false
```

:::

### 2. 访问模式（accessModes）

| 模式 | 缩写 | 说明 |
|------|------|------|
| `ReadWriteOnce` | RWO | 单个节点读写（最常用） |
| `ReadOnlyMany` | ROX | 多节点只读 |
| `ReadWriteMany` | RWX | 多节点读写（需 NFS/CephFS 等支持） |
| `ReadWriteOncePod` | RWOP | 只允许单个 Pod 读写（K8s 1.22+） |

### 3. 回收策略（reclaimPolicy）

| 策略 | 说明 | 推荐场景 |
|------|------|---------|
| `Retain` | PVC 删除后 PV 保留，状态变为 `Released`，需手动清理后才能被再次绑定 | 生产数据，防止误删 |
| `Delete` | PVC 删除时同步删除 PV 及底层存储（云盘等）| 临时数据、StorageClass 动态供给 |
| `Recycle` | 已废弃，不推荐使用 | - |

## 三、PersistentVolumeClaim（PVC）

PVC 是用户对存储的请求，类似于 Pod 消耗 CPU/内存资源，PVC 消耗 PV 资源。

::: details PVC 创建与 Pod 挂载示例

```yaml
# 文件：manifests/pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-data-pvc
  namespace: production
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: nfs-standard    # 匹配 PV 的 storageClassName；设为 "" 则使用静态绑定
  resources:
    requests:
      storage: 20Gi
  # 通过 selector 选择特定 PV（可选）
  # selector:
  #   matchLabels:
  #     storage-type: nfs
```

```yaml
# 文件：manifests/mysql-deployment.yaml
# 在 Deployment 中挂载 PVC
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:8.0
          env:
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mysql-secret
                  key: root-password
          ports:
            - containerPort: 3306
          volumeMounts:
            - name: mysql-storage
              mountPath: /var/lib/mysql
      volumes:
        - name: mysql-storage
          persistentVolumeClaim:
            claimName: mysql-data-pvc    # 引用 PVC 名称
```

:::

```bash
# 查看 PV 和 PVC 状态
kubectl get pv
kubectl get pvc -n production

# PVC 状态说明：
# Pending：未找到匹配的 PV 或 StorageClass 正在供给
# Bound：已绑定到 PV（正常状态）
# Lost：绑定的 PV 丢失（数据可能丢失）
```

## 四、StorageClass — 动态供给

StorageClass 允许管理员定义存储类型，用户创建 PVC 时自动供给（provisioning）PV，无需手动预创建。

### 1. StorageClass 配置

::: details StorageClass 示例（云厂商）

```yaml
# 文件：manifests/storageclass.yaml

# AWS EBS（gp3）
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"   # 设为默认 StorageClass
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  throughput: "125"
  iops: "3000"
  encrypted: "true"
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer   # 延迟绑定，直到 Pod 调度确定后再供给（推荐）
allowVolumeExpansion: true               # 允许扩容
```

```yaml
# 阿里云 ACK CSI 云盘
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: alicloud-disk-ssd
provisioner: diskplugin.csi.alibabacloud.com
parameters:
  type: cloud_ssd
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

:::

### 2. 使用 StorageClass 动态供给

PVC 指定 `storageClassName` 后，无需预创建 PV，系统自动供给：

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data
  namespace: production
spec:
  accessModes: [ReadWriteOnce]
  storageClassName: fast-ssd    # 指向上面定义的 StorageClass
  resources:
    requests:
      storage: 10Gi             # 自动创建 10Gi 的 EBS 卷
```

## 五、NFS 存储配置

NFS 是最常用的自托管共享存储方案，适合不在云环境或需要 ReadWriteMany 的场景。

### 1. 安装 NFS 服务端

::: details NFS 服务端配置

```bash
# Ubuntu/Debian
apt install -y nfs-kernel-server

# 创建共享目录
mkdir -p /data/nfs-share
chmod 777 /data/nfs-share

# 配置导出
cat >> /etc/exports << EOF
/data/nfs-share  192.168.1.0/24(rw,sync,no_subtree_check,no_root_squash)
EOF

# 生效并启动
exportfs -ra
systemctl enable --now nfs-server

# 查看导出列表
exportfs -v
```

:::

### 2. 使用 NFS Subdir External Provisioner（动态供给）

::: details Helm 安装 NFS Provisioner

```bash
helm repo add nfs-subdir-external-provisioner \
  https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/

helm install nfs-provisioner \
  nfs-subdir-external-provisioner/nfs-subdir-external-provisioner \
  --namespace nfs-system \
  --create-namespace \
  --set nfs.server=192.168.1.200 \
  --set nfs.path=/data/nfs-share \
  --set storageClass.name=nfs-client \
  --set storageClass.defaultClass=false \
  --set storageClass.reclaimPolicy=Retain
```

:::

## 六、Helm 基础

Helm 是 Kubernetes 的包管理器，将一组 K8s 资源打包为 Chart，实现一键部署和版本管理。

### 1. 核心概念

| 概念 | 说明 |
|------|------|
| Chart | Helm 包，包含一组 K8s 资源模板和默认值 |
| Repository | Chart 仓库，类似 npm registry |
| Release | Chart 在集群中的一次安装实例，可多次安装同一 Chart（不同 Release 名） |
| Values | 用于自定义 Chart 的配置参数（覆盖 defaults.yaml） |

### 2. 常用命令

::: details Helm 常用命令速查

```bash
# 仓库管理
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add stable  https://charts.helm.sh/stable
helm repo update
helm repo list

# 搜索 Chart
helm search repo nginx
helm search hub redis   # 在 Artifact Hub 搜索

# 查看 Chart 信息
helm show chart bitnami/mysql
helm show values bitnami/mysql   # 查看所有可配置参数

# 安装 Release
helm install my-mysql bitnami/mysql \
  --namespace production \
  --create-namespace \
  --set auth.rootPassword=MyP@ssw0rd \
  --set primary.persistence.size=20Gi

# 使用自定义 values 文件安装（推荐）
helm install my-mysql bitnami/mysql \
  -f mysql-values.yaml \
  -n production

# 查看已安装的 Release
helm list -n production
helm list --all-namespaces

# 查看 Release 详情
helm status my-mysql -n production

# 升级 Release
helm upgrade my-mysql bitnami/mysql \
  -f mysql-values.yaml \
  -n production \
  --atomic       # 升级失败自动回滚
  --timeout 5m   # 超时时间

# 回滚
helm rollback my-mysql 1 -n production   # 回滚到版本 1
helm history my-mysql -n production      # 查看历史版本

# 卸载
helm uninstall my-mysql -n production
```

:::

### 3. 自定义 values 文件示例

::: details mysql-values.yaml 示例

```yaml
# 文件：helm-values/mysql-values.yaml
auth:
  rootPassword: "MyP@ssw0rd"
  database: "myapp"
  username: "appuser"
  password: "AppP@ss123"

primary:
  persistence:
    enabled: true
    storageClass: "fast-ssd"
    size: 20Gi

  resources:
    requests:
      cpu: 250m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi

metrics:
  enabled: true   # 开启 Prometheus 指标
```

:::

## 七、命名空间资源配额

ResourceQuota 限制命名空间可以使用的资源总量，防止单个团队/应用耗尽集群资源。

### 1. ResourceQuota 配置

::: details ResourceQuota 示例

```yaml
# 文件：manifests/resource-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    # 计算资源
    requests.cpu: "10"          # 所有 Pod 的 CPU requests 总和不超过 10 核
    requests.memory: 20Gi       # 内存 requests 总和
    limits.cpu: "20"
    limits.memory: 40Gi

    # 对象数量限制
    count/pods: "50"            # 最多 50 个 Pod
    count/services: "20"
    count/persistentvolumeclaims: "30"
    count/deployments.apps: "20"
    count/secrets: "50"
    count/configmaps: "50"

    # 存储配额
    requests.storage: 500Gi
    fast-ssd.storageclass.storage.k8s.io/requests.storage: 200Gi  # 指定 StorageClass 的存储配额
```

:::

### 2. LimitRange — 默认资源限制

LimitRange 为命名空间中的容器设置默认的资源请求/限制，确保所有 Pod 都有合理的资源配置：

::: details LimitRange 示例

```yaml
# 文件：manifests/limit-range.yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: production
spec:
  limits:
    # 容器默认限制
    - type: Container
      default:             # 未指定 limits 时的默认值
        cpu: "500m"
        memory: "256Mi"
      defaultRequest:      # 未指定 requests 时的默认值
        cpu: "100m"
        memory: "128Mi"
      max:                 # 允许的最大值
        cpu: "4"
        memory: "4Gi"
      min:                 # 允许的最小值
        cpu: "50m"
        memory: "64Mi"

    # Pod 整体限制
    - type: Pod
      max:
        cpu: "8"
        memory: "8Gi"

    # PVC 大小限制
    - type: PersistentVolumeClaim
      max:
        storage: 100Gi
      min:
        storage: 1Gi
```

:::

```bash
# 查看配额使用情况
kubectl describe resourcequota production-quota -n production
kubectl get limitrange -n production
```
