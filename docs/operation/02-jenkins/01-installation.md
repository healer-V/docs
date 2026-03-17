---
title: "Jenkins 安装与基础配置"
category: "运维 · Jenkins"
tags:
  - Jenkins
  - CI
  - 安装
  - 插件
date: 2026-03-17
excerpt: "本文介绍 Jenkins 的三种安装方式（WAR 包、Docker、包管理器），完成初始化向导后，系统讲解插件管理、JDK/Maven/NodeJS 工具配置、凭据管理以及基于角色的权限控制。"
---

# Jenkins 安装与基础配置

## 一、Jenkins 安装方式

### 1. 方式一：WAR 包安装

WAR 包方式适合快速试用，无需应用服务器，Jenkins 内置 Jetty。

::: details WAR 包安装步骤

```bash
# 下载 Jenkins WAR 包（LTS 版本）
wget https://get.jenkins.io/war-stable/latest/jenkins.war

# 启动 Jenkins（默认端口 8080）
java -jar jenkins.war --httpPort=8080

# 自定义数据目录和端口
export JENKINS_HOME=/data/jenkins
java -jar jenkins.war --httpPort=8080 --prefix=/jenkins

# 作为后台服务运行
nohup java -jar jenkins.war --httpPort=8080 > /var/log/jenkins.log 2>&1 &
```

:::

### 2. 方式二：Docker 安装（推荐）

Docker 安装方式隔离性好，版本切换方便，是本地开发和 CI 环境的首选。

::: details Docker 安装 Jenkins

```bash
# 创建数据持久化目录
mkdir -p /data/jenkins_home
chown 1000:1000 /data/jenkins_home

# 运行 Jenkins 容器
docker run -d \
  --name jenkins \
  --restart always \
  -p 8080:8080 \
  -p 50000:50000 \
  -v /data/jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts-jdk17
```

```yaml
# 文件：docker-compose.yml（推荐用于持久化管理）
version: '3.8'

services:
  jenkins:
    image: jenkins/jenkins:lts-jdk17
    container_name: jenkins
    restart: always
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - JAVA_OPTS=-Xmx2048m -Xms512m
      - TZ=Asia/Shanghai

volumes:
  jenkins_home:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/jenkins_home
```

:::

### 3. 方式三：包管理器安装

::: code-group

```bash [Ubuntu/Debian]
# 添加 Jenkins GPG 密钥和软件源
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key \
  | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/" \
  | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

# 安装
sudo apt update
sudo apt install -y openjdk-17-jre jenkins

# 启动服务
sudo systemctl enable --now jenkins
sudo systemctl status jenkins
```

```bash [CentOS/RHEL]
# 添加软件源
sudo wget -O /etc/yum.repos.d/jenkins.repo \
  https://pkg.jenkins.io/redhat-stable/jenkins.repo

sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key

# 安装
sudo dnf install -y java-17-openjdk jenkins

# 启动服务
sudo systemctl enable --now jenkins
```

:::

## 二、初始化向导

首次访问 `http://服务器IP:8080` 时，需要完成初始化向导。

### 1. 获取初始管理员密码

::: code-group

```bash [Linux 安装]
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

```bash [Docker 安装]
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

```bash [WAR 包安装]
cat ${JENKINS_HOME}/secrets/initialAdminPassword
```

:::

### 2. 初始化步骤

按以下顺序完成向导：

1. 输入初始管理员密码解锁 Jenkins
2. 选择安装插件（推荐选择「安装推荐的插件」）
3. 创建第一个管理员用户（记录好用户名和密码）
4. 配置 Jenkins URL（生产环境务必设置正确的域名或 IP）

::: tip Jenkins URL 配置
Jenkins URL 影响构建通知中的链接和 Webhook 回调地址。在「系统管理 → 系统配置 → Jenkins URL」中可以随时修改。
:::

## 三、插件管理

### 1. 必装插件清单

进入「系统管理 → 插件管理 → Available plugins」安装以下插件：

| 插件名称 | 用途 |
|---------|------|
| Git | Git 仓库集成 |
| Pipeline | 声明式/脚本式流水线 |
| Blue Ocean | 现代化 Pipeline 可视化界面 |
| Docker Pipeline | 在 Pipeline 中使用 Docker |
| Docker plugin | Jenkins Agent 使用 Docker 容器 |
| NodeJS | Node.js 工具链管理 |
| Maven Integration | Maven 构建工具集成 |
| Role-based Authorization Strategy | 基于角色的权限控制 |
| Email Extension | 增强邮件通知 |
| DingTalk | 钉钉通知 |
| Credentials Binding | 在 Pipeline 中安全使用凭据 |
| Generic Webhook Trigger | 通用 Webhook 触发器 |
| Timestamper | 构建日志添加时间戳 |

### 2. 插件离线安装

网络受限环境可从 [plugins.jenkins.io](https://plugins.jenkins.io) 下载 `.hpi` 文件后上传安装：

```
系统管理 → 插件管理 → Advanced settings → Deploy Plugin
```

### 3. 配置插件更新站点（国内镜像）

::: details 配置清华大学镜像

```
系统管理 → 插件管理 → Advanced settings → Update Site

URL 替换为：
https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/update-center.json
```

:::

## 四、系统工具配置

进入「系统管理 → 全局工具配置」配置构建所需的工具链。

### 1. JDK 配置

::: details JDK 配置步骤

在「JDK」区块点击「新增 JDK」：

- **名称**：`JDK-17`（在 Jenkinsfile 中通过此名称引用）
- **安装方式一**（自动）：勾选「自动安装」，选择版本，Jenkins 自动下载
- **安装方式二**（手动）：取消「自动安装」，填写服务器上的 JDK 路径，如 `/usr/lib/jvm/java-17-openjdk-amd64`

:::

### 2. Maven 配置

::: details Maven 配置步骤

在「Maven」区块点击「新增 Maven」：

- **名称**：`Maven-3.9`
- 勾选「自动安装」，选择版本

或手动指定已安装路径：`/usr/local/maven`

在 Jenkinsfile 中使用：
```groovy
tools {
  maven 'Maven-3.9'
}
```

:::

### 3. NodeJS 配置

::: details NodeJS 配置步骤

安装 NodeJS 插件后，在「NodeJS」区块点击「新增 NodeJS」：

- **名称**：`Node-20`
- 勾选「自动安装」，选择 Node.js 20 LTS
- **全局 npm 包**：可填写 `yarn pnpm`，构建时自动安装

在 Jenkinsfile 中使用：
```groovy
tools {
  nodejs 'Node-20'
}
```

:::

## 五、凭据管理

凭据（Credentials）用于安全存储密码、SSH 密钥、Token 等敏感信息，避免在代码中明文写入。

### 1. 添加凭据

进入「系统管理 → Credentials → System → Global credentials → Add Credentials」：

| 凭据类型 | 适用场景 |
|---------|---------|
| Username with password | Git HTTP 访问、Docker Registry 登录 |
| SSH Username with private key | Git SSH 访问、远程服务器部署 |
| Secret text | API Token、Webhook Secret |
| Secret file | kubeconfig、证书文件 |
| Certificate | P12/JKS 证书 |

### 2. 添加 SSH 私钥凭据示例

::: details 添加 SSH 私钥步骤

1. 生成 SSH 密钥对（若还没有）：
   ```bash
   ssh-keygen -t ed25519 -C "jenkins@ci" -f ~/.ssh/jenkins_ed25519 -N ""
   ```
2. 将公钥（`jenkins_ed25519.pub`）添加到 GitLab/GitHub 的 Deploy Keys
3. 在 Jenkins 中：
   - 类型：`SSH Username with private key`
   - ID：`gitlab-deploy-key`（在 Jenkinsfile 中通过此 ID 引用）
   - Username：`git`
   - Private Key：选择「Enter directly」，粘贴私钥内容

:::

## 六、用户与权限管理

### 1. 基于角色的权限控制（Role-Based）

安装 **Role-based Authorization Strategy** 插件后：

1. 进入「系统管理 → 安全 → Authorization」，选择「Role-Based Strategy」
2. 进入「系统管理 → Manage and Assign Roles」

**创建角色：**

| 角色名 | 权限说明 |
|--------|---------|
| `admin` | 全部权限 |
| `developer` | 构建、查看日志、取消构建 |
| `viewer` | 只读查看构建结果 |

**角色权限分配建议：**

::: details 常用权限项说明

| 权限 | 说明 |
|------|------|
| `Overall/Read` | 登录后能看到 Jenkins 界面（所有角色必须勾选） |
| `Job/Build` | 手动触发构建 |
| `Job/Read` | 查看 Job 和构建记录 |
| `Job/Workspace` | 查看工作目录文件 |
| `Job/Cancel` | 取消正在进行的构建 |
| `Job/Configure` | 修改 Job 配置（developer 不建议给） |
| `Job/Create`/`Delete` | 创建/删除 Job（仅 admin） |

:::

### 2. 基于项目的权限控制

在各 Job 的「配置 → 启用项目安全」中，可为单个 Job 设置独立的权限矩阵，实现不同项目组的隔离访问。

::: warning 生产环境安全建议
- 禁用匿名访问（系统管理 → 安全 → 勾选「登录后才能操作」）
- 定期审计用户权限，删除离职员工账号
- 对外部可访问的 Jenkins 启用 HTTPS，并配合 Nginx 反代
- 使用「凭据」管理所有密钥，禁止在 Jenkinsfile 中硬编码密码
:::
