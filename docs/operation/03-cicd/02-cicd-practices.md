---
title: "CI/CD 最佳实践"
category: "运维 · CI/CD"
tags:
  - CI/CD
  - 最佳实践
  - 部署策略
  - 安全
date: 2026-03-17
excerpt: "本文从全局视角讲解 CI/CD 体系设计：覆盖流程设计、分支策略选型、蓝绿/滚动/金丝雀等部署策略、多环境管理、制品版本规范、安全扫描集成以及回滚机制，帮助你构建高可靠的交付流水线。"
---

# CI/CD 最佳实践

## 一、CI/CD 流程设计

### 1. 完整流水线阶段

一个成熟的 CI/CD 流水线由以下阶段构成，各阶段层层把关，确保交付质量：

```
代码提交 → 触发 CI → 构建 → 测试 → 制品生成 → 部署 → 验证 → 上线
   ↑                                                           ↓
   └─────────────────────── 回滚 ←───────────────────────────┘
```

| 阶段 | 主要任务 | 目标 |
|------|---------|------|
| 代码检查 | Lint、格式检查、类型检查 | 统一代码风格，提前发现语法错误 |
| 单元测试 | Jest、JUnit、pytest | 验证函数/模块级别的逻辑正确性 |
| 集成测试 | API 测试、数据库测试 | 验证模块间协作是否正常 |
| 安全扫描 | SAST、依赖漏洞扫描 | 识别代码漏洞和高危依赖 |
| 构建制品 | Docker 镜像、JAR、ZIP | 生成可部署的不可变制品 |
| 推送制品 | 镜像仓库、制品仓库 | 集中管理，供后续环境使用 |
| 部署测试环境 | 自动部署 staging | 验证制品在真实环境的运行情况 |
| E2E 测试 | Cypress、Playwright | 验证核心业务流程端到端正确性 |
| 性能测试 | k6、JMeter | 验证响应时间和吞吐量 |
| 手动审批 | 负责人确认 | 生产部署前的人工把关 |
| 部署生产 | 蓝绿/滚动/金丝雀 | 以受控方式将新版本发布给用户 |
| 验证与监控 | 健康检查、指标监控 | 确认新版本正常运行 |

### 2. 流水线设计原则

- **快速反馈**：代码检查和单元测试应在 5 分钟内完成，越慢越难坚持
- **不可变制品**：一次构建，多环境复用同一制品（不同环境通过配置区分）
- **左移安全**：安全扫描集成在 CI 阶段，而非发布后才审计
- **渐进交付**：生产部署通过分阶段放量，控制爆炸半径
- **可观测性**：部署完成后自动检查关键指标，异常自动回滚

## 二、分支策略

### 1. Git Flow

适合版本发布周期较长、需要同时维护多个版本的项目（如传统软件产品）。

```
main ────────────────────────────────────────→ 生产代码（永远可发布）
  └─ develop ──────────────────────────────→ 集成分支
       ├─ feature/user-auth ─→ merge PR → develop
       ├─ feature/payment   ─→ merge PR → develop
       ├─ release/1.2.0 ──────────────────→ main + tag v1.2.0
       └─ hotfix/fix-login ────────────→ main + develop
```

| 分支 | 生命周期 | 说明 |
|------|---------|------|
| `main` | 永久 | 生产代码，每次合并打 Tag |
| `develop` | 永久 | 集成分支，feature 合并目标 |
| `feature/*` | 临时 | 新功能，从 develop 切出，完成后合并回 develop |
| `release/*` | 临时 | 发布准备，只允许 Bug 修复 |
| `hotfix/*` | 临时 | 紧急修复，同时合并到 main 和 develop |

::: warning Git Flow 适用场景
Git Flow 分支较多，流程繁琐，适合发版周期以周或月计的项目。对于需要每天多次部署的互联网产品，应优先考虑 Trunk-based Development。
:::

### 2. Trunk-based Development（主干开发）

适合高频发布、追求持续交付的团队。所有开发者都在 `main` 上短期分支开发，频繁合并。

```
main ──────────────────────────────────────────→ 持续部署
  ├─ feature/add-cache    （存活 < 2 天）→ merge → CI → 自动部署
  ├─ feature/fix-bug      （存活 < 1 天）→ merge → CI → 自动部署
  └─ （使用 Feature Flag 控制功能开关）
```

| 实践 | 说明 |
|------|------|
| 短生命周期分支 | feature 分支存活不超过 2 天，强制小批量提交 |
| Feature Flag | 未完成功能通过开关隐藏，代码已合并但功能未开放 |
| 强制代码审查 | PR 必须经过 Review 才能合并 |
| 高覆盖率测试 | 自动化测试是主干开发的安全网 |

## 三、部署策略

### 1. 蓝绿部署（Blue-Green Deployment）

同时维护两套完全相同的生产环境（蓝/绿），通过切换负载均衡流量实现零停机部署。

```
用户请求 → 负载均衡
                ├─→ 蓝色环境（v1.0，当前生产）  ← 当前接收流量
                └─→ 绿色环境（v2.0，新版本）    ← 部署并验证中

切换后：
用户请求 → 负载均衡
                ├─→ 蓝色环境（v1.0，热备）      ← 保留用于快速回滚
                └─→ 绿色环境（v2.0）            ← 接收全量流量
```

| 优点 | 缺点 |
|------|------|
| 切换瞬间完成，停机时间接近 0 | 需要双倍资源成本 |
| 回滚只需切换流量，速度极快 | 有状态服务（数据库）切换复杂 |
| 新版本可充分预热后再切换 | 数据库 Schema 变更需要向后兼容 |

### 2. 滚动部署（Rolling Deployment）

逐步用新版本实例替换旧版本实例，直到全部替换完成。

```
初始状态：[v1][v1][v1][v1]
第一批替换：[v2][v1][v1][v1]   → 健康检查通过后继续
第二批替换：[v2][v2][v1][v1]   → ...
第三批替换：[v2][v2][v2][v1]
完成：      [v2][v2][v2][v2]
```

::: details Kubernetes 滚动更新配置

```yaml
# 文件：k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 最多超过期望副本数 1 个（同时运行 5 个）
      maxUnavailable: 0  # 最多不可用 0 个（保证 100% 可用性）
  template:
    spec:
      containers:
        - name: app
          image: my-app:v2.0
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
```

:::

### 3. 金丝雀发布（Canary Release）

先将少量流量（如 5%）引导到新版本，监控指标正常后逐步扩大比例。

```
阶段 1：5% 流量 → v2.0，95% 流量 → v1.0  （观察 15 分钟）
阶段 2：25% 流量 → v2.0，75% 流量 → v1.0  （观察 30 分钟）
阶段 3：50% 流量 → v2.0，50% 流量 → v1.0  （观察 30 分钟）
阶段 4：100% 流量 → v2.0（全量发布）
```

::: details Nginx 实现金丝雀路由

```nginx
# 文件：/etc/nginx/conf.d/canary.conf
upstream backend_stable {
    server app-v1:3000;
}

upstream backend_canary {
    server app-v2:3000;
}

split_clients "${remote_addr}${http_x_request_id}" $upstream_pool {
    5%    backend_canary;    # 5% 流量到新版本
    *     backend_stable;    # 95% 流量到旧版本
}

server {
    location /api/ {
        proxy_pass http://$upstream_pool;
    }
}
```

:::

### 4. 三种策略对比

| 对比维度 | 蓝绿部署 | 滚动部署 | 金丝雀发布 |
|---------|---------|---------|-----------|
| 部署速度 | 快（秒级切换） | 中（逐批替换） | 慢（分阶段放量） |
| 资源成本 | 高（双倍资源） | 低（略高于正常） | 低（少量新实例） |
| 回滚速度 | 极快（切换流量） | 较慢（需重新部署） | 快（关闭新实例） |
| 风险控制 | 中（切换即全量） | 中（逐批上线） | 高（小量验证） |
| 适用场景 | 重要版本发布 | 常规迭代发布 | 高风险变更 |

## 四、环境管理

### 1. 标准环境划分

| 环境 | 缩写 | 说明 | 部署触发方式 |
|------|------|------|------------|
| 开发环境 | dev | 开发者本地或共享 dev 集群 | 手动或 Push 到 feature 分支 |
| 测试环境 | test/qa | 功能测试、BUG 验证 | PR 合并到 develop 分支自动触发 |
| 预发布环境 | staging/uat | 生产环境镜像，用于验收测试 | Push 到 release 分支自动触发 |
| 生产环境 | prod/production | 面向真实用户 | 手动审批后触发 |

### 2. 环境配置管理

::: details 多环境配置方案

不同环境使用相同制品（Docker 镜像），通过注入环境变量区分配置：

```yaml
# 文件：.github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.deploy_env }}  # 关联 GitHub Environment

    steps:
      - name: 部署
        run: |
          docker run -d \
            --name my-app \
            -e NODE_ENV=${{ vars.NODE_ENV }} \
            -e DB_HOST=${{ secrets.DB_HOST }} \
            -e REDIS_URL=${{ secrets.REDIS_URL }} \
            my-app:${{ inputs.image_tag }}
```

:::

::: tip 配置与制品分离
永远不要将配置（特别是密码）打包进镜像。通过环境变量、ConfigMap（K8s）或 Secrets Manager 在运行时注入，确保同一镜像可在任意环境运行。
:::

## 五、制品管理

### 1. 版本号规范

推荐遵循 **语义化版本（SemVer）** 规范：`MAJOR.MINOR.PATCH`

| 版本号位 | 变更场景 | 示例 |
|---------|---------|------|
| MAJOR | 不兼容的 API 变更 | `1.0.0 → 2.0.0` |
| MINOR | 向后兼容的新功能 | `1.0.0 → 1.1.0` |
| PATCH | 向后兼容的 Bug 修复 | `1.0.0 → 1.0.1` |

**镜像 Tag 命名建议：**

```bash
# 基于 Git Tag（发布版本）
my-app:v1.2.3

# 基于分支+构建号（测试版本）
my-app:develop-42
my-app:release-1.2-15

# 基于 Git Commit SHA（精确追溯）
my-app:a3b8c12

# latest 只指向最新稳定版本
my-app:latest
```

### 2. Harbor 镜像仓库

Harbor 是企业级私有镜像仓库，提供访问控制、镜像扫描、复制等功能。

::: details Harbor 基础使用

```bash
# 登录 Harbor
docker login harbor.example.com -u admin

# 推送镜像（Harbor 项目名/镜像名:Tag）
docker tag my-app:v1.2.3 harbor.example.com/backend/my-app:v1.2.3
docker push harbor.example.com/backend/my-app:v1.2.3

# 拉取镜像
docker pull harbor.example.com/backend/my-app:v1.2.3
```

Harbor 项目配置建议：
- 按团队或应用类型划分项目（如 `frontend`、`backend`、`infra`）
- 为每个项目配置漏洞扫描策略（推送时自动扫描）
- 设置镜像保留策略（保留最近 20 个 Tag，超出自动清理）

:::

## 六、安全扫描

### 1. SAST（静态应用安全测试）

静态扫描在不运行代码的情况下分析源代码，发现安全漏洞：

::: details GitHub Actions 集成 SAST

```yaml
# 文件：.github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  codeql:
    name: CodeQL 分析
    runs-on: ubuntu-latest
    permissions:
      security-events: write

    steps:
      - uses: actions/checkout@v4

      - name: 初始化 CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript, python   # 指定分析语言

      - name: 自动构建
        uses: github/codeql-action/autobuild@v3

      - name: 执行 CodeQL 分析
        uses: github/codeql-action/analyze@v3
```

:::

### 2. SCA（软件成分分析）

SCA 扫描项目依赖中的已知漏洞（CVE）：

::: details 依赖漏洞扫描示例

```yaml
jobs:
  sca:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # npm audit（Node.js 内置）
      - name: npm 依赖审计
        run: npm audit --audit-level=high

      # Trivy 扫描 Docker 镜像漏洞
      - name: Trivy 镜像扫描
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'my-app:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'   # 发现高危漏洞时失败

      - name: 上传扫描结果
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

:::

### 3. 安全扫描集成策略

| 扫描类型 | 集成位置 | 处理策略 |
|---------|---------|---------|
| SAST | PR 检查（必须通过） | CRITICAL/HIGH 阻断合并 |
| SCA | PR 检查 + 定时全量 | CRITICAL 阻断，HIGH 告警 |
| 镜像扫描 | 构建后、推送前 | CRITICAL 阻断推送 |
| 密钥泄露扫描 | Pre-commit Hook + CI | 发现即阻断 |

::: danger 密钥泄露防护
密钥一旦提交到 Git，即使删除也可能被历史记录溯源。务必：
1. 配置 `.gitignore` 排除 `.env`、`*.pem`、`*secret*` 等文件
2. 安装 `git-secrets` 或 `gitleaks` 作为 pre-commit hook 扫描密钥
3. 在 CI 中集成 Gitleaks 扫描整个提交历史
:::

## 七、回滚策略

### 1. 快速回滚方案

| 场景 | 回滚方式 | 耗时 |
|------|---------|------|
| Kubernetes Deployment | `kubectl rollout undo` | 秒级 |
| 蓝绿部署 | 切换负载均衡到旧环境 | 秒级 |
| Docker Compose | 修改镜像 Tag 后 `docker compose up -d` | 分钟级 |
| Git 代码回退 | `git revert` 后触发 CI/CD | 分钟级 |
| 数据库回滚 | 执行回滚脚本 | 视数据量而定 |

### 2. 自动回滚机制

::: details 基于健康检查的自动回滚

```yaml
# 文件：.github/workflows/deploy-with-rollback.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: 记录当前版本（用于回滚）
        id: current-version
        run: |
          CURRENT=$(kubectl get deployment my-app -o jsonpath='{.spec.template.spec.containers[0].image}')
          echo "image=$CURRENT" >> $GITHUB_OUTPUT

      - name: 部署新版本
        run: |
          kubectl set image deployment/my-app \
            app=my-app:${{ github.sha }}
          kubectl rollout status deployment/my-app --timeout=5m

      - name: 健康检查验证
        id: health-check
        run: |
          for i in $(seq 1 12); do
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.example.com/health)
            if [[ "$HTTP_CODE" == "200" ]]; then
              echo "健康检查通过"
              exit 0
            fi
            echo "第 $i 次检查失败（HTTP $HTTP_CODE），等待 10s..."
            sleep 10
          done
          echo "健康检查超时！" >&2
          exit 1

      - name: 自动回滚
        if: failure() && steps.health-check.outcome == 'failure'
        run: |
          echo "检测到部署异常，正在回滚到：${{ steps.current-version.outputs.image }}"
          kubectl rollout undo deployment/my-app
          kubectl rollout status deployment/my-app --timeout=3m
          echo "回滚完成！"

          # 发送告警
          curl -X POST "${{ secrets.DINGTALK_WEBHOOK }}" \
            -H "Content-Type: application/json" \
            -d '{"msgtype":"text","text":{"content":"[ALERT] 生产部署失败，已自动回滚！"}}'
```

:::

::: tip 数据库与回滚
数据库变更是回滚中最复杂的部分。遵循以下原则可降低风险：
- **向后兼容**：新增字段设默认值，不删除正在使用的字段
- **分阶段迁移**：先部署兼容新旧版本的代码，再做数据库变更，最后清理兼容代码
- **迁移脚本版本化**：使用 Flyway 或 Liquibase 管理数据库版本，支持回滚
:::
