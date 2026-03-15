---
title: "安装与配置"
category: "运维 · Nginx"
tags:
  - Nginx
  - 安装
  - Linux
excerpt: "在主流 Linux 发行版和 macOS 上安装 Nginx，掌握启动、停止、重载等基本管理命令，是运维 Nginx 的第一步。"
date: 2026-03-15
---

# 安装与配置

Nginx 支持多种安装方式，你可以根据操作系统和使用场景选择最合适的方案。本文将带你从零开始完成 Nginx 的安装、验证和基本管理操作。

## 一、包管理器安装

包管理器安装是最简便的方式，适合绝大多数生产和开发环境。不同操作系统对应不同的包管理工具。

### 1. Ubuntu / Debian

Ubuntu 和 Debian 使用 `apt` 包管理器，Nginx 已收录在官方软件源中。

::: details 安装步骤

```bash
# 更新软件源索引
sudo apt update

# 安装 Nginx
sudo apt install nginx -y

# 确认安装成功
nginx -v
# 输出示例：nginx version: nginx/1.24.0
```

:::

如果你需要安装最新的稳定版本，可以添加 Nginx 官方源：

::: details 添加 Nginx 官方源

```bash
# 安装依赖
sudo apt install curl gnupg2 ca-certificates lsb-release -y

# 导入官方签名密钥
curl -fsSL https://nginx.org/keys/nginx_signing.key | sudo gpg --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg

# 添加官方稳定版源
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/ubuntu $(lsb_release -cs) nginx" | sudo tee /etc/apt/sources.list.d/nginx.list

# 更新并安装
sudo apt update
sudo apt install nginx -y
```

:::

### 2. CentOS / RHEL

CentOS 7 使用 `yum`，CentOS 8+ 和 RHEL 8+ 使用 `dnf`，操作基本一致。

::: details yum 安装（CentOS 7）

```bash
# 安装 EPEL 源（Nginx 在 EPEL 仓库中）
sudo yum install epel-release -y

# 安装 Nginx
sudo yum install nginx -y

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx
```

:::

::: details dnf 安装（CentOS 8+ / RHEL 8+）

```bash
# 安装 Nginx
sudo dnf install nginx -y

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx
```

:::

### 3. macOS

macOS 使用 Homebrew 安装，适合本地开发和测试。

::: details brew 安装

```bash
# 安装 Nginx
brew install nginx

# 启动 Nginx（前台运行）
nginx

# 或者使用 brew 管理服务（后台运行）
brew services start nginx
```

:::

::: tip
macOS 通过 Homebrew 安装的 Nginx，默认配置文件位于 `/opt/homebrew/etc/nginx/nginx.conf`（Apple Silicon）或 `/usr/local/etc/nginx/nginx.conf`（Intel），默认监听 `8080` 端口而非 `80`。
:::

## 二、编译安装

当你需要定制模块或使用官方源中没有的第三方模块时，可以选择从源码编译安装。

### 1. 下载源码

::: details 下载并解压

```bash
# 下载 Nginx 源码包
cd /usr/local/src
sudo wget https://nginx.org/download/nginx-1.24.0.tar.gz

# 解压
sudo tar -zxvf nginx-1.24.0.tar.gz
cd nginx-1.24.0
```

:::

### 2. 安装编译依赖

::: details 安装依赖库

```bash
# Ubuntu / Debian
sudo apt install build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev libgd-dev -y

# CentOS / RHEL
sudo yum install gcc gcc-c++ pcre pcre-devel zlib zlib-devel openssl openssl-devel gd gd-devel -y
```

:::

### 3. 配置编译选项

`./configure` 命令用于指定安装路径和启用的模块。以下是常用编译选项：

| 选项 | 说明 |
|------|------|
| `--prefix=/etc/nginx` | 指定安装根目录 |
| `--sbin-path=/usr/sbin/nginx` | 指定可执行文件路径 |
| `--conf-path=/etc/nginx/nginx.conf` | 指定配置文件路径 |
| `--with-http_ssl_module` | 启用 HTTPS 支持 |
| `--with-http_v2_module` | 启用 HTTP/2 支持 |
| `--with-http_gzip_static_module` | 启用预压缩静态文件支持 |
| `--with-http_realip_module` | 获取客户端真实 IP（反向代理场景） |
| `--with-http_stub_status_module` | 启用状态监控页 |
| `--with-stream` | 启用 TCP/UDP 代理（四层负载均衡） |

::: details 编译并安装

```bash
# 配置编译参数
./configure \
  --prefix=/etc/nginx \
  --sbin-path=/usr/sbin/nginx \
  --modules-path=/usr/lib64/nginx/modules \
  --conf-path=/etc/nginx/nginx.conf \
  --error-log-path=/var/log/nginx/error.log \
  --http-log-path=/var/log/nginx/access.log \
  --pid-path=/var/run/nginx.pid \
  --with-http_ssl_module \
  --with-http_v2_module \
  --with-http_gzip_static_module \
  --with-http_realip_module \
  --with-http_stub_status_module

# 编译
make -j$(nproc)

# 安装
sudo make install
```

:::

::: warning
编译安装的 Nginx 不会自动创建 systemd 服务文件，你需要手动编写 `.service` 文件才能使用 `systemctl` 管理。
:::

## 三、Docker 安装

Docker 安装适合容器化部署场景，可以快速启动一个隔离的 Nginx 实例。

### 1. 基本运行

::: details docker run 启动 Nginx

```bash
# 拉取官方镜像
docker pull nginx:stable

# 启动容器，将宿主机 80 端口映射到容器 80 端口
docker run -d \
  --name my-nginx \
  -p 80:80 \
  nginx:stable
```

:::

### 2. 挂载配置和静态文件

实际使用中，你通常需要挂载自定义配置文件和静态资源目录。

::: details 挂载卷启动

```bash
docker run -d \
  --name my-nginx \
  -p 80:80 \
  -p 443:443 \
  -v /home/deploy/nginx/conf/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /home/deploy/nginx/conf.d:/etc/nginx/conf.d:ro \
  -v /home/deploy/www:/usr/share/nginx/html:ro \
  -v /home/deploy/nginx/logs:/var/log/nginx \
  --restart always \
  nginx:stable
```

:::

常用 Docker 运行选项说明：

| 选项 | 说明 |
|------|------|
| `-d` | 后台运行容器 |
| `--name my-nginx` | 指定容器名称 |
| `-p 80:80` | 宿主机端口:容器端口映射 |
| `-v 宿主机路径:容器路径:ro` | 挂载卷，`ro` 表示只读 |
| `--restart always` | 容器异常退出或 Docker 重启时自动恢复 |

## 四、验证安装

无论使用哪种方式安装，安装完成后都需要验证 Nginx 是否正常工作。

### 1. 查看版本信息

::: details 版本验证命令

```bash
# 查看版本号
nginx -v
# 输出：nginx version: nginx/1.24.0

# 查看版本号和编译参数
nginx -V
# 输出包含 configure arguments 等详细信息
```

:::

### 2. 访问默认页面

::: details 使用 curl 测试

```bash
# 确保 Nginx 已启动
sudo systemctl start nginx

# 请求默认页面
curl -I http://localhost
# 正常响应示例：
# HTTP/1.1 200 OK
# Server: nginx/1.24.0
# Content-Type: text/html
```

:::

如果你在远程服务器上操作，确保防火墙已放行 80 端口：

::: details 防火墙放行

```bash
# Ubuntu (ufw)
sudo ufw allow 'Nginx Full'

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

:::

## 五、服务管理命令

Nginx 提供了两种管理方式：原生信号命令和 systemctl 服务管理。

### 1. Nginx 原生命令

| 命令 | 说明 |
|------|------|
| `nginx` | 启动 Nginx |
| `nginx -s stop` | 快速停止（立即终止进程） |
| `nginx -s quit` | 优雅停止（处理完当前请求后退出） |
| `nginx -s reload` | 重新加载配置（不中断服务） |
| `nginx -s reopen` | 重新打开日志文件（日志切割时使用） |
| `nginx -t` | 测试配置文件语法是否正确 |
| `nginx -T` | 测试配置并输出完整配置内容 |
| `nginx -c /path/to/nginx.conf` | 指定配置文件启动 |

::: tip
修改配置后，养成先执行 `nginx -t` 测试语法再 `nginx -s reload` 的习惯，可以避免因配置错误导致服务中断。
:::

### 2. systemctl 管理

对于通过包管理器安装的 Nginx，推荐使用 `systemctl` 进行服务管理。

| 命令 | 说明 |
|------|------|
| `sudo systemctl start nginx` | 启动服务 |
| `sudo systemctl stop nginx` | 停止服务 |
| `sudo systemctl restart nginx` | 重启服务（先停后起） |
| `sudo systemctl reload nginx` | 重载配置（不中断连接） |
| `sudo systemctl enable nginx` | 设置开机自启动 |
| `sudo systemctl disable nginx` | 取消开机自启动 |
| `sudo systemctl status nginx` | 查看服务状态 |

::: details 查看服务状态示例

```bash
sudo systemctl status nginx
# 输出示例：
# ● nginx.service - A high performance web server and a reverse proxy server
#    Loaded: loaded (/lib/systemd/system/nginx.service; enabled)
#    Active: active (running) since Sat 2026-03-15 10:00:00 CST
#   Process: 1234 ExecStart=/usr/sbin/nginx (code=exited, status=0/SUCCESS)
#  Main PID: 1235 (nginx)
#     Tasks: 3 (limit: 4915)
#    Memory: 5.2M
```

:::

## 六、目录结构

了解安装后的目录结构，有助于你快速定位配置文件、日志和静态资源。

### 1. 核心目录

以包管理器安装为例，Nginx 的文件分布如下：

| 路径 | 说明 |
|------|------|
| `/etc/nginx/` | 配置文件根目录 |
| `/etc/nginx/nginx.conf` | 主配置文件 |
| `/etc/nginx/conf.d/` | 自定义配置目录（推荐在此放置站点配置） |
| `/etc/nginx/sites-available/` | 可用站点配置（Debian/Ubuntu） |
| `/etc/nginx/sites-enabled/` | 已启用站点配置（通过软链接启用） |
| `/etc/nginx/mime.types` | MIME 类型映射文件 |
| `/var/log/nginx/` | 日志目录 |
| `/var/log/nginx/access.log` | 访问日志 |
| `/var/log/nginx/error.log` | 错误日志 |
| `/usr/share/nginx/html/` | 默认静态资源目录 |
| `/usr/sbin/nginx` | Nginx 可执行文件 |

### 2. 配置目录详解

::: details 查看配置目录结构

```bash
tree /etc/nginx/
# /etc/nginx/
# ├── conf.d/
# │   └── default.conf        # 默认站点配置
# ├── fastcgi_params           # FastCGI 参数
# ├── mime.types                # MIME 类型定义
# ├── modules-enabled/         # 已启用的动态模块
# ├── nginx.conf                # 主配置文件
# ├── sites-available/         # 可用站点配置
# │   └── default              # 默认站点
# └── sites-enabled/           # 已启用站点（软链接）
#     └── default -> ../sites-available/default
```

:::

::: warning
不要直接修改 `/etc/nginx/sites-enabled/` 中的文件。正确做法是在 `sites-available/` 中编辑，然后通过软链接启用：`sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/`。
:::

## 七、第一次访问

完成安装后，在浏览器中输入服务器 IP 地址或 `http://localhost`，你应该能看到 Nginx 的默认欢迎页面，显示 "Welcome to nginx!" 字样。

这个页面由 `/usr/share/nginx/html/index.html` 提供，对应的配置位于 `/etc/nginx/conf.d/default.conf` 或 `/etc/nginx/sites-enabled/default`。

::: details 默认站点配置内容

```nginx
# /etc/nginx/conf.d/default.conf
server {
    listen       80;
    server_name  localhost;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```

:::

::: tip
看到欢迎页面后，说明 Nginx 已成功安装并正常运行。接下来你可以学习配置文件的详细语法，开始部署自己的站点。
:::
