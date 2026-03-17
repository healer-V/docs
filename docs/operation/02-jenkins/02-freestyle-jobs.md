---
title: "Jenkins Job 与 Pipeline"
category: "运维 · Jenkins"
tags:
  - Jenkins
  - Job
  - Pipeline
  - Jenkinsfile
date: 2026-03-17
excerpt: "本文讲解 Jenkins 自由风格 Job 的配置要点，以及 Pipeline 的核心概念、Declarative 与 Scripted 语法对比、Jenkinsfile 基本结构和常用指令，帮助你从 GUI 配置过渡到代码化 CI/CD 管理。"
---

# Jenkins Job 与 Pipeline

## 一、自由风格 Job

自由风格（Freestyle）Job 是 Jenkins 最基础的项目类型，通过 Web 界面点击配置，适合简单的构建任务。

### 1. 基本配置

新建 Job 时选择「Freestyle project」，主要配置区块如下：

| 配置区块 | 说明 |
|---------|------|
| General | 项目描述、构建策略（保留最近 N 次） |
| Source Code Management | 配置 SCM，选择 Git 并填写仓库地址和凭据 |
| Build Triggers | 触发方式（定时/SCM 轮询/Webhook） |
| Build Environment | 构建前准备（注入凭据、设置环境变量） |
| Build Steps | 实际执行的构建命令 |
| Post-build Actions | 构建后操作（归档、发送通知、触发下游 Job） |

### 2. SCM 配置

::: details Git SCM 配置说明

在「Source Code Management → Git」中填写：

- **Repository URL**：`git@gitlab.example.com:team/my-app.git`
- **Credentials**：选择已添加的 SSH 凭据
- **Branches to build**：`*/main`（构建主分支）或 `*/${BRANCH_NAME}`（参数化）

**Additional Behaviours（高级）常用选项：**

- `Clean before checkout`：每次构建前清理工作目录
- `Shallow clone`：只克隆最近 N 次提交，加速大仓库构建
- `Sparse Checkout paths`：只检出指定目录

:::

### 3. 构建触发器

| 触发方式 | 配置说明 |
|---------|---------|
| 定时构建 | Cron 表达式，如 `H 2 * * *`（每天凌晨 2 点，`H` 表示哈希散列避免并发） |
| Poll SCM | 定时轮询 Git 仓库，有新提交则触发，如 `H/5 * * * *`（每 5 分钟检查一次） |
| GitHub hook | 通过 GitHub Webhook 实时触发（需在 GitHub 仓库配置 Payload URL） |
| 触发远程构建 | 生成 Token，外部系统通过 HTTP 请求触发 |

::: tip Webhook 配置
Webhook 比 Poll SCM 更实时且节省资源。GitLab/GitHub Webhook URL 格式：
```
http://jenkins.example.com/github-webhook/     # GitHub
http://jenkins.example.com/gitlab-webhook/     # GitLab（需安装 GitLab 插件）
```
:::

### 4. 参数化构建

勾选「This project is parameterized」，常用参数类型：

| 参数类型 | 适用场景 |
|---------|---------|
| String Parameter | 文本输入，如 `IMAGE_TAG`、`DEPLOY_ENV` |
| Choice Parameter | 下拉选择，如环境 `dev/staging/prod` |
| Boolean Parameter | 勾选框，如是否执行数据库迁移 |
| Git Parameter | 动态获取分支/Tag 列表供选择 |
| File Parameter | 上传文件 |

::: details 构建步骤（Shell 命令）示例

```bash
#!/bin/bash
# 在 Build Steps → Execute shell 中配置
set -euo pipefail

echo "构建参数："
echo "  环境：$DEPLOY_ENV"
echo "  镜像标签：$IMAGE_TAG"
echo "  Git 分支：$GIT_BRANCH"
echo "  Git Commit：${GIT_COMMIT:0:8}"

# 安装依赖
npm ci --prefer-offline

# 执行测试
npm test

# 构建镜像
docker build -t "registry.example.com/my-app:${IMAGE_TAG}" .
docker push "registry.example.com/my-app:${IMAGE_TAG}"

echo "构建完成：registry.example.com/my-app:${IMAGE_TAG}"
```

:::

## 二、Pipeline 概念

Pipeline 以代码的形式定义 CI/CD 流程（Jenkinsfile），存储在代码仓库中，具备版本控制、可复用、易维护等优势。

### 1. Declarative vs Scripted Pipeline

| 对比项 | Declarative（声明式） | Scripted（脚本式） |
|--------|---------------------|----------------|
| 语法风格 | 结构化，有严格的块结构 | 灵活，完整 Groovy DSL |
| 学习曲线 | 低，适合初学者 | 较高，需了解 Groovy |
| 语法检查 | 支持 Lint 检查 | 运行时才能发现错误 |
| 条件/循环 | 通过 `when`/`script` 块 | 直接使用 Groovy 语法 |
| 推荐场景 | 大多数标准 CI/CD 流程 | 需要复杂逻辑的流程 |
| **推荐度** | ★★★★★ | ★★★ |

### 2. 创建 Pipeline Job

新建 Job 时选择「Pipeline」，在「Pipeline」配置区块中：

- **Definition**：选择 `Pipeline script from SCM`
- **SCM**：Git，填写仓库地址和凭据
- **Script Path**：`Jenkinsfile`（默认）或自定义路径如 `ci/Jenkinsfile`

## 三、Jenkinsfile 基本结构

### 1. Declarative Pipeline 完整结构

::: details 声明式 Jenkinsfile 完整示例

```groovy{1-5}
// 文件：Jenkinsfile（项目根目录）
pipeline {
    // 指定运行环境（任意 Agent）
    agent any

    // 构建选项
    options {
        timestamps()                    // 日志添加时间戳
        timeout(time: 30, unit: 'MINUTES')  // 整体超时 30 分钟
        buildDiscarder(logRotator(numToKeepStr: '10'))  // 保留最近 10 次构建
        disableConcurrentBuilds()       // 禁止并发构建
    }

    // 工具链（需在全局工具配置中预先定义）
    tools {
        nodejs 'Node-20'
        maven  'Maven-3.9'
    }

    // 环境变量
    environment {
        APP_NAME    = 'my-app'
        REGISTRY    = 'registry.example.com'
        IMAGE_NAME  = "${REGISTRY}/${APP_NAME}"
        DEPLOY_ENV  = "${params.DEPLOY_ENV ?: 'staging'}"
        // 从凭据注入（会自动遮盖敏感值）
        DOCKER_CREDS = credentials('docker-registry-creds')
    }

    // 参数定义
    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['staging', 'prod'], description: '部署目标环境')
        string(name: 'IMAGE_TAG',  defaultValue: 'latest', description: '镜像标签')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: '跳过测试')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.IMAGE_TAG = params.IMAGE_TAG == 'latest' ? env.GIT_SHORT : params.IMAGE_TAG
                }
                echo "构建版本：${env.IMAGE_TAG}"
            }
        }

        stage('Install') {
            steps {
                sh 'npm ci --prefer-offline'
            }
        }

        stage('Test') {
            when {
                expression { !params.SKIP_TESTS }
            }
            steps {
                sh 'npm test -- --coverage'
            }
            post {
                always {
                    // 归档测试报告（需安装 JUnit 插件）
                    junit 'coverage/junit.xml'
                }
            }
        }

        stage('Build') {
            steps {
                sh "npm run build"
                sh "docker build -t ${IMAGE_NAME}:${env.IMAGE_TAG} ."
            }
        }

        stage('Push') {
            steps {
                sh """
                    echo '${DOCKER_CREDS_PSW}' | docker login ${REGISTRY} -u '${DOCKER_CREDS_USR}' --password-stdin
                    docker push ${IMAGE_NAME}:${env.IMAGE_TAG}
                    docker tag  ${IMAGE_NAME}:${env.IMAGE_TAG} ${IMAGE_NAME}:latest
                    docker push ${IMAGE_NAME}:latest
                """
            }
        }

        stage('Deploy') {
            steps {
                sshagent(['deploy-server-key']) {
                    sh """
                        ssh deploy@deploy.example.com \
                          "docker pull ${IMAGE_NAME}:${env.IMAGE_TAG} && \
                           docker stop ${APP_NAME} || true && \
                           docker rm   ${APP_NAME} || true && \
                           docker run -d --name ${APP_NAME} \
                             -p 3000:3000 \
                             --restart always \
                             ${IMAGE_NAME}:${env.IMAGE_TAG}"
                    """
                }
            }
        }
    }

    // 全局 post 处理（所有 stage 执行后）
    post {
        success {
            echo "构建成功：${APP_NAME}:${env.IMAGE_TAG} 已部署到 ${DEPLOY_ENV}"
        }
        failure {
            echo "构建失败！请查看日志定位问题"
        }
        always {
            // 清理工作目录
            cleanWs()
        }
    }
}
```

:::

### 2. 常用指令速查

#### (1) agent 指令

```groovy
// 在 master/任意 agent 上运行
agent any

// 在特定标签的 agent 上运行
agent { label 'linux && docker' }

// 不分配 agent（必须在每个 stage 单独指定）
agent none

// 使用 Docker 容器作为运行环境
agent {
    docker {
        image 'node:20-alpine'
        args  '-v /tmp:/tmp'
    }
}
```

#### (2) environment 指令

```groovy
environment {
    // 静态值
    APP_ENV = 'production'

    // 引用其他变量
    IMAGE_TAG = "${APP_NAME}-${BUILD_NUMBER}"

    // 从 Credentials 注入（自动遮盖）
    DB_PASSWORD = credentials('prod-db-password')   // Secret text → 字符串
    DEPLOY_KEY  = credentials('deploy-ssh-key')     // SSH Key → 包含 _USR/_PSW
}
```

#### (3) sh / bat 指令

```groovy
// Linux/macOS：执行 Shell 命令
sh 'echo Hello'

// 多行命令（用三引号）
sh """
    cd /opt/app
    git pull
    npm install
"""

// 捕获命令输出
def version = sh(script: 'cat package.json | jq -r .version', returnStdout: true).trim()

// 忽略失败（returnStatus）
def exitCode = sh(script: 'docker stop old-container', returnStatus: true)

// Windows：执行 bat 命令
bat 'dir'
```

#### (4) checkout 与 git 指令

```groovy
// 检出当前 Pipeline 绑定的 SCM（最常用）
checkout scm

// 检出指定仓库
checkout([
    $class: 'GitSCM',
    branches: [[name: '*/main']],
    userRemoteConfigs: [[
        url: 'git@gitlab.example.com:team/my-app.git',
        credentialsId: 'gitlab-deploy-key'
    ]]
])

// 简化写法（需 git 指令）
git branch: 'main',
    credentialsId: 'gitlab-deploy-key',
    url: 'git@gitlab.example.com:team/my-app.git'
```

#### (5) archiveArtifacts 指令

```groovy
// 归档构建产物（构建历史中可下载）
archiveArtifacts artifacts: 'dist/**/*', fingerprint: true

// 归档多种类型
archiveArtifacts artifacts: '**/*.jar, **/*.war', excludes: '**/test*.jar'
```

#### (6) post 条件说明

| 条件 | 触发时机 |
|------|---------|
| `always` | 无论结果如何，始终执行 |
| `success` | 所有 stage 成功后执行 |
| `failure` | 任意 stage 失败后执行 |
| `unstable` | 构建状态为不稳定（如测试失败但继续）时执行 |
| `aborted` | 构建被取消时执行 |
| `changed` | 与上一次构建结果不同时执行 |
| `fixed` | 上次失败，本次成功时执行 |
| `regression` | 上次成功，本次失败时执行 |

## 四、Jenkins 内置环境变量

Pipeline 中可直接使用以下内置变量：

| 变量 | 说明 |
|------|------|
| `BUILD_NUMBER` | 当前构建序号（如 `42`） |
| `BUILD_ID` | 构建 ID（同 `BUILD_NUMBER`） |
| `BUILD_URL` | 当前构建的访问 URL |
| `JOB_NAME` | Job 名称（含文件夹路径） |
| `JOB_BASE_NAME` | Job 基础名称（不含文件夹） |
| `WORKSPACE` | 工作目录绝对路径 |
| `GIT_BRANCH` | 当前 Git 分支（如 `origin/main`） |
| `GIT_COMMIT` | 完整 Git Commit SHA |
| `JENKINS_URL` | Jenkins 服务 URL |
| `NODE_NAME` | 执行构建的 Agent 名称 |

::: tip 查看所有变量
在 Pipeline 中执行以下步骤可查看当前构建的全部环境变量：
```groovy
steps {
    sh 'printenv | sort'
}
```
:::
