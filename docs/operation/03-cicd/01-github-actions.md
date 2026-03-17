---
title: "GitHub Actions 实战"
category: "运维 · CI/CD"
tags:
  - CI/CD
  - GitHub Actions
  - Workflow
  - 自动化
date: 2026-03-17
excerpt: "GitHub Actions 是 GitHub 原生的 CI/CD 平台，无需额外部署。本文系统讲解 Workflow 核心概念、常用触发器、运行环境配置、官方 Action 用法、Secrets 管理、矩阵构建以及制品上传下载等实战技巧。"
---

# GitHub Actions 实战

## 一、Workflow 核心概念

GitHub Actions 通过 Workflow 文件（`.github/workflows/*.yml`）定义自动化流程，文件使用 YAML 语法。

### 1. 核心术语

| 概念 | 说明 |
|------|------|
| **Workflow** | 完整的自动化流程，由一个 YAML 文件定义 |
| **Event** | 触发 Workflow 的事件（push、PR、定时等） |
| **Job** | Workflow 中相互独立（或有依赖）的任务单元 |
| **Step** | Job 中按顺序执行的最小执行单元 |
| **Action** | Step 中调用的可复用操作（官方/第三方/自定义） |
| **Runner** | 执行 Job 的虚拟机（GitHub 托管或自托管） |

### 2. 文件位置

```
.github/
└── workflows/
    ├── ci.yml          # 持续集成
    ├── release.yml     # 发版流程
    └── codeql.yml      # 安全扫描
```

## 二、触发器（on）

### 1. 常用触发事件

::: details 各类触发器配置示例

```yaml
# 文件：.github/workflows/ci.yml
on:
  # 推送到指定分支时触发
  push:
    branches:
      - main
      - 'release/**'
    paths:
      - 'src/**'        # 只有 src 目录变更时才触发
      - 'package.json'
    paths-ignore:
      - 'docs/**'       # 文档变更时不触发
      - '*.md'

  # PR 打开/同步/重新打开时触发
  pull_request:
    branches:
      - main
      - develop
    types:
      - opened
      - synchronize
      - reopened

  # 定时触发（cron 格式，UTC 时区）
  schedule:
    - cron: '0 2 * * *'   # 每天凌晨 2:00 UTC（北京时间 10:00）

  # 手动触发（可传入参数）
  workflow_dispatch:
    inputs:
      deploy_env:
        description: '部署目标环境'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
      image_tag:
        description: '镜像标签'
        required: false
        default: 'latest'
      dry_run:
        description: '仅预演，不实际部署'
        type: boolean
        default: false

  # 发布 Release 时触发
  release:
    types: [published]

  # 其他 Workflow 完成时触发
  workflow_run:
    workflows: ['CI']
    types: [completed]
    branches: [main]
```

:::

### 2. 过滤语法说明

| 语法 | 说明 |
|------|------|
| `branches: [main]` | 精确匹配分支名 |
| `branches: ['release/**']` | 通配符匹配，`**` 匹配多级路径 |
| `branches-ignore` | 排除指定分支 |
| `paths: ['src/**']` | 只有指定路径变更时触发 |
| `tags: ['v*']` | 推送匹配的 Tag 时触发 |

## 三、运行环境（runs-on）

### 1. GitHub 托管 Runner

| 标签 | 操作系统 | 规格 |
|------|---------|------|
| `ubuntu-latest` / `ubuntu-24.04` | Ubuntu 24.04 | 4 核 16GB（免费额度） |
| `windows-latest` / `windows-2022` | Windows Server 2022 | 4 核 16GB |
| `macos-latest` / `macos-14` | macOS 14 (M1) | 3 核 7GB |

```yaml
jobs:
  build:
    runs-on: ubuntu-latest   # 单个 runner

  multi-os-test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
```

### 2. 自托管 Runner

自托管 Runner 适合需要特殊环境、更大资源或访问内网资源的场景：

```yaml
jobs:
  deploy:
    runs-on: [self-hosted, linux, x64, production]  # 自托管 Runner 标签
```

::: tip 注册自托管 Runner
在 GitHub 仓库的「Settings → Actions → Runners → New self-hosted runner」中获取注册命令，在目标服务器上执行即可。
:::

## 四、常用 Action

### 1. actions/checkout — 检出代码

```yaml
steps:
  # 基本用法（检出当前仓库当前分支）
  - uses: actions/checkout@v4

  # 完整参数
  - uses: actions/checkout@v4
    with:
      ref: ${{ github.event.pull_request.head.sha }}  # 指定分支/Tag/SHA
      fetch-depth: 0    # 0 = 完整历史（默认 1，只克隆最新提交）
      submodules: true  # 初始化子模块
      token: ${{ secrets.PAT_TOKEN }}  # 访问私有仓库
```

### 2. actions/setup-node — 配置 Node.js

```yaml
steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v4
    with:
      node-version: '20'         # 指定版本
      # 或从文件读取版本
      node-version-file: '.nvmrc'
      cache: 'npm'               # 自动缓存 npm 依赖（npm/yarn/pnpm）

  - run: npm ci
  - run: npm test
```

### 3. actions/cache — 手动缓存

::: details cache Action 详细用法

```yaml
steps:
  - uses: actions/checkout@v4

  # 缓存 npm 依赖（setup-node 已内置此功能，这里用于演示）
  - name: 缓存 node_modules
    uses: actions/cache@v4
    id: npm-cache
    with:
      path: ~/.npm
      key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        ${{ runner.os }}-node-

  - name: 安装依赖
    if: steps.npm-cache.outputs.cache-hit != 'true'
    run: npm ci

  # 缓存 Maven 本地仓库
  - name: 缓存 Maven 依赖
    uses: actions/cache@v4
    with:
      path: ~/.m2/repository
      key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
      restore-keys: ${{ runner.os }}-maven-

  # 缓存 Docker 层（配合 buildx）
  - name: 缓存 Docker 层
    uses: actions/cache@v4
    with:
      path: /tmp/.buildx-cache
      key: ${{ runner.os }}-buildx-${{ github.sha }}
      restore-keys: ${{ runner.os }}-buildx-
```

:::

## 五、环境变量与 Secrets

### 1. 环境变量作用域

```yaml
# 文件：.github/workflows/ci.yml
env:
  APP_NAME: my-app          # Workflow 级别（所有 job/step 可用）
  NODE_ENV: production

jobs:
  build:
    env:
      BUILD_MODE: release   # Job 级别（该 job 的所有 step 可用）

    steps:
      - name: Build
        env:
          OUTPUT_DIR: ./dist  # Step 级别（只在此 step 有效）
        run: npm run build
```

### 2. 使用 Secrets

Secrets 在 GitHub 仓库「Settings → Secrets and variables → Actions」中配置。

```yaml
steps:
  - name: 推送 Docker 镜像
    env:
      DOCKER_USER: ${{ secrets.DOCKER_HUB_USERNAME }}
      DOCKER_PASS: ${{ secrets.DOCKER_HUB_TOKEN }}
    run: |
      echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
      docker push my-app:latest

  - name: 部署到服务器
    run: |
      echo "${{ secrets.SSH_PRIVATE_KEY }}" > /tmp/deploy_key
      chmod 600 /tmp/deploy_key
      ssh -i /tmp/deploy_key -o StrictHostKeyChecking=no \
        deploy@${{ secrets.DEPLOY_HOST }} \
        "cd /opt/app && docker pull my-app:latest && docker compose up -d"
```

### 3. 使用 Variables（非敏感配置）

在「Settings → Secrets and variables → Actions → Variables」中添加后：

```yaml
env:
  REGISTRY_URL: ${{ vars.REGISTRY_URL }}
  DEPLOY_REGION: ${{ vars.AWS_REGION }}
```

## 六、矩阵构建（matrix）

矩阵策略可以用一个 Job 定义，自动生成多个维度的并行构建任务。

::: details 矩阵构建完整示例

```yaml
jobs:
  # 多 Node.js 版本 × 多操作系统测试
  test:
    name: 测试 Node ${{ matrix.node-version }} on ${{ matrix.os }}
    runs-on: ${{ matrix.os }}

    strategy:
      fail-fast: false  # 一个矩阵失败时不停止其他
      matrix:
        os: [ubuntu-latest, windows-latest]
        node-version: ['18', '20', '22']
        # 排除特定组合
        exclude:
          - os: windows-latest
            node-version: '18'
        # 添加额外的单独组合
        include:
          - os: ubuntu-latest
            node-version: '20'
            coverage: true   # 自定义属性，在 step 中使用

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm

      - run: npm ci

      - name: 运行测试
        run: npm test

      - name: 生成覆盖率报告
        if: ${{ matrix.coverage }}   # 只在有 coverage 属性的矩阵中运行
        run: npm run test:coverage
```

:::

## 七、Job 依赖（needs）

`needs` 声明 Job 之间的依赖关系，被依赖的 Job 成功后才执行当前 Job。

::: details Job 依赖链示例

```yaml
jobs:
  # 第一层：并行执行
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  # 第二层：依赖第一层
  build:
    needs: [lint, test]   # lint 和 test 都成功后才执行
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build

  # 第三层：依赖 build
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging    # 关联 GitHub Environment（可配置审批）
    steps:
      - run: ./scripts/deploy.sh staging

  # 最终部署：需要人工审批（在 GitHub Environment 中配置 Required reviewers）
  deploy-prod:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: ./scripts/deploy.sh production

  # 无论 build 是否成功都执行（if: always()）
  notify:
    needs: build
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: 发送通知
        run: |
          if [[ "${{ needs.build.result }}" == "success" ]]; then
            echo "构建成功，发送成功通知"
          else
            echo "构建失败，发送告警"
          fi
```

:::

## 八、制品上传与下载

### 1. 上传制品（upload-artifact）

```yaml
steps:
  - name: 构建
    run: npm run build

  - name: 上传构建产物
    uses: actions/upload-artifact@v4
    with:
      name: dist-${{ github.sha }}    # 制品名称
      path: |
        dist/
        !dist/**/*.map                # 排除 source map
      retention-days: 7              # 保留 7 天（默认 90 天）
      if-no-files-found: error       # 找不到文件时报错（error/warn/ignore）
```

### 2. 下载制品（download-artifact）

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist-files
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      # 下载上游 Job 上传的制品
      - uses: actions/download-artifact@v4
        with:
          name: dist-files
          path: ./dist

      - name: 部署
        run: rsync -avz ./dist/ deploy@server:/opt/app/dist/
```

### 3. 上传 Release Assets

::: details 发布到 GitHub Release 示例

```yaml
# 文件：.github/workflows/release.yml
on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: 构建
        run: |
          npm ci
          npm run build
          tar -czf dist.tar.gz dist/

      - name: 创建 Release 并上传资产
        uses: softprops/action-gh-release@v2
        with:
          files: |
            dist.tar.gz
            CHANGELOG.md
          generate_release_notes: true  # 自动生成 Release Notes
```

:::

::: tip GitHub Actions 免费额度
- 公开仓库：无限制免费
- 私有仓库：每月 2000 分钟（ubuntu）、500 分钟（macOS）免费
- 自托管 Runner：不消耗免费额度
:::
