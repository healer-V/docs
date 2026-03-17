---
title: "Jenkins 高级流水线实践"
category: "运维 · Jenkins"
tags:
  - Jenkins
  - Pipeline
  - Docker
  - 多分支
date: 2026-03-17
excerpt: "本文深入讲解 Jenkins 高级流水线特性：并行执行、条件控制、共享库复用、Docker Pipeline 集成、多分支 Pipeline 配置，以及在 Pipeline 中安全使用凭据和发送钉钉/邮件通知，最后介绍 Blue Ocean 可视化界面。"
---

# Jenkins 高级流水线实践

## 一、并行阶段（parallel）

并行执行可以大幅缩短流水线总耗时，适合相互独立的任务（如多平台测试、多服务同时部署）。

### 1. 基本并行语法

::: details 并行 stage 示例

```groovy
// 文件：Jenkinsfile
pipeline {
    agent any

    stages {
        stage('并行测试') {
            parallel {
                stage('单元测试') {
                    steps {
                        sh 'npm run test:unit'
                    }
                    post {
                        always { junit 'reports/unit/*.xml' }
                    }
                }

                stage('集成测试') {
                    steps {
                        sh 'npm run test:integration'
                    }
                }

                stage('E2E 测试') {
                    agent { label 'chrome' }  // 指定特定 Agent
                    steps {
                        sh 'npm run test:e2e'
                    }
                }
            }
        }

        stage('并行部署多环境') {
            parallel {
                stage('部署 US 区域') {
                    steps {
                        sh 'kubectl apply -f k8s/ --context=us-cluster'
                    }
                }
                stage('部署 EU 区域') {
                    steps {
                        sh 'kubectl apply -f k8s/ --context=eu-cluster'
                    }
                }
            }
        }
    }
}
```

:::

### 2. failFast 选项

设置 `failFast: true` 后，任意并行分支失败时立即终止其余分支，避免等待：

```groovy
stage('并行构建') {
    failFast true   // 任一失败立即停止其他分支
    parallel {
        stage('构建 AMD64') {
            steps { sh 'docker build --platform linux/amd64 -t app:amd64 .' }
        }
        stage('构建 ARM64') {
            steps { sh 'docker build --platform linux/arm64 -t app:arm64 .' }
        }
    }
}
```

## 二、条件执行（when）

`when` 指令控制 stage 在什么条件下执行，满足条件才运行该阶段。

### 1. 常用 when 条件

| 条件 | 说明 | 示例 |
|------|------|------|
| `branch` | 分支名匹配 | `branch 'main'` |
| `tag` | Tag 名匹配 | `tag 'v*'` |
| `environment` | 环境变量值匹配 | `environment name: 'ENV', value: 'prod'` |
| `expression` | Groovy 表达式为真 | `expression { params.DEPLOY == true }` |
| `not` | 取反 | `not { branch 'PR-*' }` |
| `allOf` | 所有条件都满足 | 多条件 AND |
| `anyOf` | 任一条件满足 | 多条件 OR |
| `changeRequest` | 当前构建是 PR/MR | 无参数 |
| `triggeredBy` | 触发方式判断 | `triggeredBy 'TimerTrigger'` |

::: details when 条件综合示例

```groovy
stages {
    // 只在 main 分支构建镜像
    stage('Build Image') {
        when {
            branch 'main'
        }
        steps { sh 'docker build -t app:latest .' }
    }

    // 只在打了 v* tag 时发布
    stage('Release') {
        when {
            tag pattern: 'v\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
        }
        steps { sh './scripts/release.sh' }
    }

    // 多条件组合：main 分支且非手动跳过
    stage('Deploy to Prod') {
        when {
            allOf {
                branch 'main'
                not { expression { params.SKIP_DEPLOY } }
                environment name: 'IS_RELEASE', value: 'true'
            }
        }
        steps { sh './scripts/deploy-prod.sh' }
    }

    // 默认 when 在 agent 分配之前评估（beforeAgent 可改变此行为）
    stage('Heavy Build') {
        when {
            beforeAgent true  // 先评估条件，条件不满足时不分配 Agent
            branch 'main'
        }
        agent { docker { image 'node:20' } }
        steps { sh 'npm run build:prod' }
    }
}
```

:::

## 三、共享库（Shared Library）

共享库允许将公共的 Pipeline 代码抽取到独立仓库，供多个 Jenkinsfile 复用。

### 1. 目录结构

```
jenkins-shared-library/        # 独立 Git 仓库
├── vars/                      # 全局变量/函数（可直接在 Jenkinsfile 中调用）
│   ├── deployToK8s.groovy     # 调用：deployToK8s(env: 'prod', tag: v1.0)
│   ├── sendDingTalk.groovy
│   └── dockerBuild.groovy
├── src/                       # 辅助类（Groovy 类，需 import）
│   └── com/example/ci/
│       └── Utils.groovy
└── resources/                 # 资源文件（Shell 脚本、配置模板）
    └── scripts/
        └── health-check.sh
```

### 2. 注册共享库

进入「系统管理 → 系统配置 → Global Pipeline Libraries」：

- **Name**：`common-lib`（在 Jenkinsfile 中通过此名称引用）
- **Default version**：`main`（分支名或 Tag）
- **Retrieval method**：Modern SCM → Git，填写仓库地址和凭据

### 3. 编写共享库函数

::: details vars/dockerBuild.groovy 示例

```groovy
// 文件：vars/dockerBuild.groovy
// 调用方式：dockerBuild(image: 'my-app', tag: 'v1.0', registry: 'registry.example.com')

def call(Map config) {
    def image    = config.image    ?: error('dockerBuild: image 参数必填')
    def tag      = config.tag      ?: 'latest'
    def registry = config.registry ?: 'registry.example.com'
    def fullImage = "${registry}/${image}:${tag}"

    echo "开始构建镜像：${fullImage}"

    sh """
        docker build \
          --build-arg BUILD_DATE=\$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
          --build-arg VCS_REF=${env.GIT_COMMIT?.take(8) ?: 'unknown'} \
          -t ${fullImage} .
    """

    withCredentials([usernamePassword(
        credentialsId: 'docker-registry-creds',
        usernameVariable: 'DOCKER_USER',
        passwordVariable: 'DOCKER_PASS'
    )]) {
        sh """
            echo "\$DOCKER_PASS" | docker login ${registry} -u "\$DOCKER_USER" --password-stdin
            docker push ${fullImage}
        """
    }

    return fullImage
}
```

:::

### 4. 在 Jenkinsfile 中使用共享库

::: details 使用共享库的 Jenkinsfile 示例

```groovy
// 文件：Jenkinsfile
@Library('common-lib@main') _   // 引入共享库（_ 表示导入所有 vars）

pipeline {
    agent any

    environment {
        APP_NAME = 'my-app'
        TAG      = "${BUILD_NUMBER}"
    }

    stages {
        stage('Build & Push') {
            steps {
                script {
                    // 直接调用共享库中的 dockerBuild 函数
                    def imageUrl = dockerBuild(
                        image:    env.APP_NAME,
                        tag:      env.TAG,
                        registry: 'registry.example.com'
                    )
                    env.IMAGE_URL = imageUrl
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    deployToK8s(
                        env:      'staging',
                        image:    env.IMAGE_URL,
                        replicas: 3
                    )
                }
            }
        }
    }

    post {
        failure {
            script {
                sendDingTalk(
                    title:   "构建失败：${JOB_NAME} #${BUILD_NUMBER}",
                    content: "请查看：${BUILD_URL}"
                )
            }
        }
    }
}
```

:::

## 四、Docker Pipeline

### 1. 以 Docker 容器为 Agent

::: details Docker Agent 示例

```groovy
pipeline {
    // 全局使用 Docker（所有 stage 共享同一容器）
    agent {
        docker {
            image 'node:20-alpine'
            args  '--network host -v /tmp/npm-cache:/root/.npm'
        }
    }

    stages {
        stage('Install') { steps { sh 'npm ci' } }
        stage('Test')    { steps { sh 'npm test' } }
        stage('Build')   { steps { sh 'npm run build' } }
    }
}
```

```groovy
// 每个 stage 使用不同容器
pipeline {
    agent none

    stages {
        stage('前端构建') {
            agent { docker { image 'node:20-alpine' } }
            steps { sh 'npm ci && npm run build' }
        }

        stage('后端构建') {
            agent { docker { image 'maven:3.9-eclipse-temurin-17' } }
            steps { sh 'mvn -B package -DskipTests' }
        }
    }
}
```

:::

### 2. 使用 Dockerfile 构建运行环境

```groovy
agent {
    dockerfile {
        filename 'ci/Dockerfile.build'  // 自定义 Dockerfile 路径
        additionalBuildArgs '--build-arg NODE_ENV=ci'
        args '-v /var/run/docker.sock:/var/run/docker.sock'
    }
}
```

### 3. Docker in Docker 构建镜像

::: details 在 Docker Agent 内构建并推送镜像

```groovy
stage('Build Image') {
    agent {
        docker {
            image 'docker:24-dind'
            args  '--privileged -v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
    steps {
        withCredentials([usernamePassword(
            credentialsId: 'docker-hub-creds',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
        )]) {
            sh """
                echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin
                docker build -t my-app:${BUILD_NUMBER} .
                docker push my-app:${BUILD_NUMBER}
            """
        }
    }
}
```

:::

## 五、多分支 Pipeline

多分支 Pipeline（Multibranch Pipeline）自动为每个分支/PR 创建独立的 Job，无需手动维护。

### 1. 创建多分支 Pipeline

新建 Job 时选择「Multibranch Pipeline」，配置项说明：

| 配置项 | 说明 |
|--------|------|
| Branch Sources | 选择 Git/GitHub/GitLab，配置仓库地址和凭据 |
| Discover branches | 扫描分支策略（所有分支/只有 PR/只有非 PR） |
| Discover pull requests | 发现 PR（合并后/合并前/两者） |
| Build strategies | 构建触发策略（有变更时/定时检查间隔） |
| Script Path | Jenkinsfile 路径（默认 `Jenkinsfile`） |

### 2. 分支过滤

::: details 分支过滤配置示例

在 Branch Sources 的 Behaviours 中添加「Filter by name (with wildcards)」：

```
Include: main release/* hotfix/* PR-*
Exclude: feature/wip-*
```

或使用正则（Filter by name with regular expression）：
```
^(main|develop|release/.*|PR-\d+)$
```

:::

## 六、凭据在 Pipeline 中的使用

### 1. withCredentials 步骤

`withCredentials` 是最灵活的凭据注入方式，支持多种凭据类型：

::: details withCredentials 使用示例

```groovy
steps {
    // Username + Password
    withCredentials([usernamePassword(
        credentialsId: 'docker-registry-creds',
        usernameVariable: 'REG_USER',
        passwordVariable: 'REG_PASS'
    )]) {
        sh 'echo $REG_PASS | docker login -u $REG_USER --password-stdin'
    }

    // Secret Text（单个 Token）
    withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {
        sh 'curl -H "Authorization: token $GH_TOKEN" https://api.github.com/user'
    }

    // SSH Private Key
    withCredentials([sshUserPrivateKey(
        credentialsId: 'deploy-server-key',
        keyFileVariable: 'SSH_KEY_FILE',
        usernameVariable: 'SSH_USER'
    )]) {
        sh 'ssh -i $SSH_KEY_FILE $SSH_USER@deploy.example.com "ls /opt/app"'
    }

    // 同时注入多个凭据
    withCredentials([
        usernamePassword(credentialsId: 'db-creds', usernameVariable: 'DB_USER', passwordVariable: 'DB_PASS'),
        string(credentialsId: 'slack-token', variable: 'SLACK_TOKEN')
    ]) {
        sh './scripts/deploy.sh'
    }
}
```

:::

### 2. environment 中引用凭据

```groovy
environment {
    // credentials() 会根据凭据类型自动展开
    // Secret text → 变量名即为完整值
    API_TOKEN  = credentials('api-token')

    // Username+Password → 自动创建 _USR 和 _PSW 后缀变量
    DOCKER_HUB = credentials('docker-hub-creds')
    // 使用：${DOCKER_HUB_USR} 和 ${DOCKER_HUB_PSW}
}
```

## 七、通知集成

### 1. 邮件通知

::: details 邮件通知配置

```groovy
post {
    failure {
        emailext(
            subject: "构建失败：${JOB_NAME} #${BUILD_NUMBER}",
            body: """
                <h3>构建失败通知</h3>
                <p>项目：<b>${JOB_NAME}</b></p>
                <p>构建号：#${BUILD_NUMBER}</p>
                <p>分支：${GIT_BRANCH}</p>
                <p>提交：${GIT_COMMIT?.take(8)}</p>
                <p><a href="${BUILD_URL}console">查看构建日志</a></p>
            """,
            mimeType: 'text/html',
            to: '$DEFAULT_RECIPIENTS',
            attachLog: true
        )
    }
}
```

:::

### 2. 钉钉通知

安装 DingTalk 插件并配置 Webhook 后，在流水线中使用：

::: details 钉钉通知示例

```groovy
// 在共享库或 post 块中使用
post {
    success {
        dingtalk(
            robot: 'dingtalk-robot-id',  // 机器人配置 ID
            type: 'MARKDOWN',
            title: "构建成功：${JOB_NAME}",
            text: [
                "## 构建成功 ✅",
                "**项目**：${JOB_NAME}",
                "**版本**：${BUILD_NUMBER}",
                "**分支**：${GIT_BRANCH}",
                "[查看构建](${BUILD_URL})"
            ]
        )
    }
    failure {
        dingtalk(
            robot: 'dingtalk-robot-id',
            type: 'MARKDOWN',
            title: "构建失败：${JOB_NAME}",
            atAll: true,  // @所有人
            text: [
                "## 构建失败 ❌",
                "**项目**：${JOB_NAME}",
                "[查看日志](${BUILD_URL}console)"
            ]
        )
    }
}
```

:::

## 八、Blue Ocean 可视化

Blue Ocean 提供现代化的 Pipeline 可视化界面，让构建流程一目了然。

### 1. 访问 Blue Ocean

安装 Blue Ocean 插件后，通过以下方式进入：

- Jenkins 首页左侧菜单点击「Open Blue Ocean」
- 直接访问：`http://jenkins.example.com/blue`

### 2. Blue Ocean 主要功能

| 功能 | 说明 |
|------|------|
| 流水线可视化 | 以泳道图展示各 stage 的执行状态和耗时 |
| 并行可视化 | 清晰展示并行分支的执行情况 |
| 实时日志 | 每个 step 独立折叠日志，方便定位问题 |
| 测试报告 | 集成测试结果展示，失败用例高亮显示 |
| PR 视图 | 直接在 Jenkins 中查看 PR 状态和关联的构建 |
| Pipeline 编辑器 | 可视化编辑 Jenkinsfile（基础功能） |

::: tip Blue Ocean vs 经典界面
Blue Ocean 适合查看和分析 Pipeline 执行结果，但高级配置（凭据管理、插件配置等）仍需在经典界面完成。两者可以并行使用。
:::
