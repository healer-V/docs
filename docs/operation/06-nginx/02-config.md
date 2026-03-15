---
title: "配置文件详解"
category: "运维 · Nginx"
tags:
  - Nginx
  - 配置
  - nginx.conf
excerpt: "nginx.conf 是 Nginx 的核心配置文件，理解其层级结构和常用指令是灵活配置各种服务的基础。"
date: 2026-03-15
---

# 配置文件详解

Nginx 的所有行为都由配置文件驱动。掌握 `nginx.conf` 的层级结构和常用指令，你就能灵活地配置静态托管、反向代理、负载均衡等各种服务场景。

## 一、配置文件位置

Nginx 的主配置文件路径取决于安装方式：

| 安装方式 | 配置文件路径 |
|----------|-------------|
| apt / yum 包管理器 | `/etc/nginx/nginx.conf` |
| 编译安装（默认） | `/etc/nginx/nginx.conf` 或 `/usr/local/nginx/conf/nginx.conf` |
| macOS Homebrew (Apple Silicon) | `/opt/homebrew/etc/nginx/nginx.conf` |
| macOS Homebrew (Intel) | `/usr/local/etc/nginx/nginx.conf` |
| Docker 容器内 | `/etc/nginx/nginx.conf` |

你可以通过以下命令确认当前 Nginx 使用的配置文件路径：

::: details 查看配置文件路径

```bash
# 查看编译时指定的默认路径
nginx -V 2>&1 | grep 'conf-path'
# 输出示例：--conf-path=/etc/nginx/nginx.conf

# 测试配置时也会显示路径
nginx -t
# 输出示例：
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

:::

## 二、上下文层级结构

Nginx 配置文件采用嵌套的**上下文（Context）**结构，每个上下文用花括号 `{}` 包裹，指令只能出现在它所属的上下文中。

### 1. 层级总览

```
┌─────────────────────────────────────────────────┐
│  main (全局上下文)                                │
│  ├── worker_processes  2;                        │
│  ├── error_log  /var/log/nginx/error.log;        │
│  │                                               │
│  ├── events {                                    │
│  │     worker_connections  1024;                  │
│  │   }                                           │
│  │                                               │
│  └── http {                                      │
│        ├── include  mime.types;                   │
│        ├── sendfile  on;                          │
│        │                                         │
│        ├── server {                              │
│        │     ├── listen  80;                     │
│        │     ├── server_name  example.com;       │
│        │     │                                   │
│        │     ├── location / {                    │
│        │     │     root  /var/www/html;          │
│        │     │   }                               │
│        │     │                                   │
│        │     └── location /api {                 │
│        │           proxy_pass  http://backend;   │
│        │         }                               │
│        │   }                                     │
│        │                                         │
│        └── server {                              │
│              listen  80;                         │
│              server_name  blog.example.com;      │
│            }                                     │
│      }                                           │
└─────────────────────────────────────────────────┘
```

### 2. 上下文作用域说明

| 上下文 | 包含关系 | 职责 |
|--------|----------|------|
| `main` | 最外层，包含所有其他上下文 | 全局参数：进程数、日志、PID 文件 |
| `events` | 在 `main` 内 | 连接处理模型、最大连接数 |
| `http` | 在 `main` 内 | HTTP 协议相关的全局配置 |
| `server` | 在 `http` 内 | 虚拟主机，对应一个站点 |
| `location` | 在 `server` 内 | URL 路径匹配规则 |
| `upstream` | 在 `http` 内 | 后端服务器组（负载均衡） |

::: tip
指令存在**继承关系**：在外层上下文定义的指令，如果内层没有覆盖，则自动继承外层的值。例如在 `http` 中设置了 `gzip on;`，所有 `server` 和 `location` 都会生效，除非显式设置 `gzip off;`。
:::

## 三、Main 全局上下文

全局上下文中的指令影响 Nginx 整体的运行行为，位于配置文件的最顶层。

### 1. 核心指令

| 指令 | 说明 | 推荐值 |
|------|------|--------|
| `worker_processes` | 工作进程数 | `auto`（自动匹配 CPU 核数） |
| `error_log` | 错误日志路径和级别 | `/var/log/nginx/error.log warn` |
| `pid` | PID 文件路径 | `/var/run/nginx.pid` |
| `worker_rlimit_nofile` | 单个进程可打开的最大文件数 | `65535` |

### 2. 配置示例

::: details main 上下文配置

```nginx
# /etc/nginx/nginx.conf

# 以 nginx 用户运行工作进程
user nginx;

# 自动检测 CPU 核心数，每个核心启动一个工作进程
worker_processes auto;

# 错误日志路径，级别为 warn（记录 warn 及以上级别）
error_log /var/log/nginx/error.log warn;

# 存储主进程 PID 的文件路径
pid /var/run/nginx.pid;

# 单个工作进程最大打开文件描述符数量
worker_rlimit_nofile 65535;
```

:::

::: warning
`worker_processes` 设置为 `auto` 即可应对大多数场景。手动设置时不要超过 CPU 核心数，否则会因进程上下文切换导致性能下降。
:::

## 四、Events 上下文

`events` 上下文控制 Nginx 如何处理网络连接，直接影响并发性能。

### 1. 核心指令

| 指令 | 说明 | 推荐值 |
|------|------|--------|
| `worker_connections` | 单个工作进程的最大并发连接数 | `4096` 或更高 |
| `use` | 事件驱动模型 | Linux: `epoll`，macOS: `kqueue` |
| `multi_accept` | 是否一次接受多个新连接 | `on` |
| `accept_mutex` | 是否启用连接互斥锁 | `off`（高并发建议关闭） |

::: tip
Nginx 的总并发连接数 = `worker_processes` x `worker_connections`。例如 4 个工作进程 x 4096 连接 = 最多同时处理 16384 个连接。
:::

### 2. 配置示例

::: details events 上下文配置

```nginx
events {
    # Linux 下使用 epoll 高效事件模型
    use epoll;

    # 单个工作进程最大并发连接数
    worker_connections 4096;

    # 一个工作进程同时接受多个新连接
    multi_accept on;
}
```

:::

## 五、HTTP 上下文

`http` 上下文是配置文件中最核心的部分，所有与 HTTP 服务相关的配置都在这里定义。

### 1. 基础指令

| 指令 | 说明 | 推荐值 |
|------|------|--------|
| `include` | 引入外部配置文件 | `mime.types`、`conf.d/*.conf` |
| `default_type` | 默认 MIME 类型 | `application/octet-stream` |
| `sendfile` | 使用内核文件传输，避免用户态拷贝 | `on` |
| `tcp_nopush` | 数据包积攒后一次性发送 | `on` |
| `tcp_nodelay` | 禁用 Nagle 算法，减少延迟 | `on` |
| `keepalive_timeout` | 长连接超时时间（秒） | `65` |
| `client_max_body_size` | 客户端请求体最大大小 | `50m`（根据业务调整） |

### 2. 日志格式

::: details HTTP 上下文完整配置

```nginx
http {
    # 引入 MIME 类型映射
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 自定义日志格式
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    '$request_time';

    # 访问日志路径和格式
    access_log /var/log/nginx/access.log main;

    # 高效文件传输
    sendfile    on;
    tcp_nopush  on;
    tcp_nodelay on;

    # 长连接超时
    keepalive_timeout 65;

    # 请求体大小限制（上传文件场景需调大）
    client_max_body_size 50m;

    # 引入所有站点配置
    include /etc/nginx/conf.d/*.conf;
}
```

:::

## 六、Server 块（虚拟主机）

`server` 块定义了一个虚拟主机，你可以在同一台服务器上通过不同的域名或端口托管多个站点。

### 1. 核心指令

| 指令 | 说明 | 示例 |
|------|------|------|
| `listen` | 监听端口和地址 | `80`、`443 ssl`、`[::]:80` |
| `server_name` | 域名匹配 | `example.com www.example.com` |
| `root` | 站点根目录 | `/var/www/example` |
| `index` | 默认首页文件 | `index.html index.htm` |
| `charset` | 响应字符编码 | `utf-8` |

### 2. 虚拟主机配置示例

::: details 基于域名的虚拟主机

```nginx
# /etc/nginx/conf.d/example.conf
server {
    listen 80;
    server_name example.com www.example.com;

    root /var/www/example;
    index index.html;

    charset utf-8;

    access_log /var/log/nginx/example.access.log main;
    error_log  /var/log/nginx/example.error.log warn;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

:::

::: details 基于端口的虚拟主机

```nginx
# /etc/nginx/conf.d/internal-admin.conf
server {
    listen 8080;
    server_name _;

    root /var/www/admin-panel;
    index index.html;

    # 仅允许内网访问
    allow 192.168.1.0/24;
    deny all;
}
```

:::

### 3. server_name 匹配规则

当多个 `server` 块监听同一端口时，Nginx 按以下优先级匹配 `server_name`：

| 优先级 | 匹配方式 | 示例 |
|--------|----------|------|
| 1（最高） | 精确匹配 | `server_name example.com;` |
| 2 | 前缀通配符 | `server_name *.example.com;` |
| 3 | 后缀通配符 | `server_name www.example.*;` |
| 4 | 正则表达式 | `server_name ~^(?<subdomain>.+)\.example\.com$;` |
| 5（最低） | 默认服务器 | `listen 80 default_server;` |

::: warning
如果没有任何 `server` 块匹配到请求的 `Host` 头，Nginx 会将请求交给 `default_server` 处理。如果没有显式指定 `default_server`，配置文件中第一个 `server` 块将作为默认服务器。
:::

## 七、Location 块

`location` 块用于匹配请求的 URI 路径，是 Nginx 配置中最灵活也最关键的部分。

### 1. 匹配规则

| 修饰符 | 含义 | 示例 | 说明 |
|--------|------|------|------|
| （无） | 前缀匹配 | `location /api` | 匹配以 `/api` 开头的路径 |
| `=` | 精确匹配 | `location = /` | 仅匹配 `/`，不匹配 `/index.html` |
| `~` | 正则匹配（区分大小写） | `location ~ \.php$` | 匹配 `.php` 结尾的路径 |
| `~*` | 正则匹配（不区分大小写） | `location ~* \.(jpg\|png)$` | 匹配图片后缀 |
| `^~` | 前缀匹配（优先于正则） | `location ^~ /static/` | 命中后不再检查正则 |

### 2. 匹配优先级

当多个 `location` 都能匹配同一个请求时，Nginx 按以下顺序决定使用哪个：

```
1. 精确匹配 (=)            → 命中即停止
2. 前缀匹配 (^~)           → 最长前缀命中即停止，不检查正则
3. 正则匹配 (~ 或 ~*)       → 按配置文件中的顺序，第一个命中即停止
4. 普通前缀匹配 (无修饰符)   → 使用最长前缀匹配的那个
```

::: details 匹配优先级实战示例

```nginx
server {
    listen 80;
    server_name example.com;

    # 精确匹配首页，优先级最高
    location = / {
        # 请求 / 时命中
        return 200 "exact match: /";
    }

    # ^~ 前缀匹配，优先于正则
    location ^~ /static/ {
        # 请求 /static/style.css 时命中，不再检查正则
        root /var/www;
    }

    # 正则匹配图片文件
    location ~* \.(gif|jpg|jpeg|png|svg|webp)$ {
        # 请求 /images/logo.png 时命中
        root /var/www/assets;
        expires 30d;
    }

    # 普通前缀匹配，优先级最低
    location / {
        # 以上都不匹配时的兜底
        root /var/www/html;
        index index.html;
    }
}
```

:::

::: danger
避免在 `location` 中混合使用 `root` 和 `alias`，容易产生路径拼接错误。每个 `location` 块中只使用其中一种。
:::

## 八、内置变量

Nginx 提供了丰富的内置变量，你可以在配置中直接引用它们来实现动态行为。

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `$host` | 请求的 Host 头（不含端口） | `example.com` |
| `$uri` | 当前请求的 URI（不含参数，经过 rewrite 后的） | `/api/users` |
| `$request_uri` | 原始请求 URI（含参数，未经 rewrite） | `/api/users?page=1` |
| `$remote_addr` | 客户端 IP 地址 | `192.168.1.100` |
| `$args` | 查询字符串参数 | `page=1&size=20` |
| `$scheme` | 协议类型 | `http` 或 `https` |
| `$server_name` | 匹配到的 server_name | `example.com` |
| `$request_method` | HTTP 方法 | `GET`、`POST` |
| `$content_type` | 请求的 Content-Type | `application/json` |
| `$http_user_agent` | 客户端 User-Agent | `Mozilla/5.0 ...` |
| `$http_referer` | 来源页面 URL | `https://google.com` |
| `$request_time` | 请求处理时间（秒） | `0.032` |
| `$status` | 响应状态码 | `200`、`404` |
| `$body_bytes_sent` | 发送给客户端的响应体字节数 | `1024` |

::: details 变量使用示例

```nginx
# 在日志中使用变量
log_format detailed '$remote_addr - [$time_local] '
                    '"$request_method $uri" $status '
                    'rt=$request_time '
                    'ua="$http_user_agent"';

# 在 location 中使用变量做条件判断
server {
    listen 80;
    server_name example.com;

    # 将 HTTP 请求重定向到 HTTPS
    if ($scheme = "http") {
        return 301 https://$host$request_uri;
    }

    # 根据客户端 IP 限制后台访问
    location /admin {
        if ($remote_addr !~ "^192\.168\.1\.") {
            return 403;
        }
        root /var/www/admin;
    }
}
```

:::

::: warning
Nginx 官方建议尽量避免在 `location` 内使用 `if` 指令，因为它的行为在某些场景下不符合直觉（参见 "If Is Evil" 文档）。优先使用 `map`、`try_files` 等替代方案。
:::

## 九、Include 与模块化配置

随着站点增多，将所有配置写在一个 `nginx.conf` 中会变得难以维护。Nginx 的 `include` 指令支持将配置拆分到多个文件中。

### 1. 常用 include 模式

::: details 模块化配置结构

```nginx
# /etc/nginx/nginx.conf — 主配置文件
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 引入通用配置片段
    include /etc/nginx/snippets/gzip.conf;
    include /etc/nginx/snippets/security-headers.conf;

    # 引入所有站点配置
    include /etc/nginx/conf.d/*.conf;
}
```

:::

### 2. sites-available / sites-enabled 模式

Debian/Ubuntu 系统采用分离管理模式，通过软链接控制站点的启用和禁用。

::: details 站点管理操作

```bash
# 创建站点配置
sudo vim /etc/nginx/sites-available/blog.example.com

# 启用站点（创建软链接）
sudo ln -s /etc/nginx/sites-available/blog.example.com /etc/nginx/sites-enabled/

# 禁用站点（删除软链接，不删除原文件）
sudo rm /etc/nginx/sites-enabled/blog.example.com

# 测试并重载
sudo nginx -t && sudo nginx -s reload
```

:::

### 3. 通用配置片段复用

你可以将重复使用的配置提取为独立文件，在多个 `server` 块中引入。

::: details 配置片段复用示例

```nginx
# /etc/nginx/snippets/gzip.conf — Gzip 压缩配置
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 5;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

# /etc/nginx/snippets/security-headers.conf — 安全头配置
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

```nginx
# 在 server 块中引入
server {
    listen 80;
    server_name example.com;

    include /etc/nginx/snippets/gzip.conf;
    include /etc/nginx/snippets/security-headers.conf;

    location / {
        root /var/www/example;
    }
}
```

:::

## 十、配置测试与重载

每次修改配置后，务必先测试语法再重载，确保不会因配置错误导致服务中断。

### 1. 测试配置语法

::: details 测试命令

```bash
# 测试配置语法
sudo nginx -t
# 成功输出：
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# 测试并输出完整合并后的配置（排查 include 问题）
sudo nginx -T
```

:::

### 2. 重载配置

::: details 重载命令

```bash
# 推荐：先测试再重载（一条命令完成）
sudo nginx -t && sudo nginx -s reload

# 或者使用 systemctl
sudo nginx -t && sudo systemctl reload nginx
```

:::

::: danger
永远不要在没有 `nginx -t` 测试的情况下直接执行 `nginx -s reload`。如果配置文件存在语法错误，`reload` 虽然不会停止当前服务，但新的配置不会生效，可能导致你以为修改已生效而实际上并没有。
:::
