---
title: "实战案例"
category: "运维 · Nginx"
tags:
  - Nginx
  - 部署
  - 实战
excerpt: "通过前后端分离部署、多域名配置和 WebSocket 代理等真实场景，掌握 Nginx 在生产环境中的最佳实践。"
date: 2026-03-15
---

# 实战案例

前面的章节介绍了 Nginx 的各项功能配置，本章将这些知识融合到真实的生产场景中。你可以直接参考这些案例，根据自身业务需求进行调整。

## 一、前后端分离部署

这是最常见的 Web 应用架构：前端使用 Vue 或 React 构建的 SPA 单页应用，后端提供 Node.js API 服务。Nginx 同时承担静态文件服务和 API 反向代理的角色。

### 1. 架构说明

```
客户端 → Nginx (80/443)
            ├── /          → 静态文件（Vue/React 构建产物）
            └── /api/      → 反向代理 → Node.js (3000)
```

### 2. 完整配置

::: details Vue/React SPA + Node.js API 完整配置
```nginx{10-11,22-24,30-41,44-54}
# /etc/nginx/conf.d/webapp.conf

upstream node_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name app.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate     /etc/ssl/certs/app.example.com.pem;
    ssl_certificate_key /etc/ssl/private/app.example.com.key;

    # 前端静态文件根目录
    root /var/www/app/dist;
    index index.html;

    # ==================== Gzip 压缩 ====================
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_vary on;

    # ==================== 前端 SPA 路由 ====================
    location / {
        # 先尝试匹配文件，再尝试目录，最后回退到 index.html
        # 这是 SPA 单页应用的核心配置
        try_files $uri $uri/ /index.html;

        # 静态资源缓存（带 hash 的构建产物）
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # ==================== API 反向代理 ====================
    location /api/ {
        proxy_pass http://node_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";

        # 超时设置
        proxy_connect_timeout 10s;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
    }

    # ==================== CORS 跨域配置 ====================
    # 如果前后端同域则不需要此配置
    # 如果 API 服务自身处理了 CORS，也不需要在 Nginx 层重复配置
    location /api/public/ {
        # 允许的来源
        add_header Access-Control-Allow-Origin "https://app.example.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Access-Control-Max-Age 86400 always;

        # 处理预检请求
        if ($request_method = 'OPTIONS') {
            return 204;
        }

        proxy_pass http://node_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # HTML 不缓存
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # 健康检查
    location = /health {
        access_log off;
        return 200 "ok";
    }
}
```
:::

::: tip SPA 路由的关键
`try_files $uri $uri/ /index.html` 是 SPA 应用的核心配置。当用户直接访问 `/dashboard/settings` 时，Nginx 找不到对应的物理文件，会回退到 `index.html`，由前端路由（Vue Router / React Router）接管。
:::

## 二、多域名托管

在同一台服务器上托管多个网站，每个域名对应不同的项目。通过 Nginx 的 Server Block 实现。

### 1. 目录结构

```
/etc/nginx/
├── nginx.conf               # 主配置（include 站点配置）
├── sites-available/          # 所有站点配置
│   ├── site-a.com.conf
│   ├── site-b.com.conf
│   └── default.conf
└── sites-enabled/            # 已启用的站点（符号链接）
    ├── site-a.com.conf → ../sites-available/site-a.com.conf
    └── site-b.com.conf → ../sites-available/site-b.com.conf
```

### 2. 主配置文件

::: details nginx.conf 主配置
```nginx
# /etc/nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;

events {
    worker_connections 10240;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    gzip on;

    # 引入所有已启用的站点配置
    include /etc/nginx/sites-enabled/*.conf;
}
```
:::

### 3. 站点配置

::: details site-a.com 企业官网配置
```nginx
# /etc/nginx/sites-available/site-a.com.conf

server {
    listen 80;
    server_name site-a.com www.site-a.com;

    root /var/www/site-a;
    index index.html;

    access_log /var/log/nginx/site-a_access.log;
    error_log /var/log/nginx/site-a_error.log;

    location / {
        try_files $uri $uri/ =404;
    }

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|css|js|ico|svg)$ {
        expires 7d;
    }
}
```
:::

::: details site-b.com 博客系统配置
```nginx
# /etc/nginx/sites-available/site-b.com.conf

server {
    listen 80;
    server_name site-b.com www.site-b.com;

    root /var/www/site-b/public;
    index index.html;

    access_log /var/log/nginx/site-b_access.log;
    error_log /var/log/nginx/site-b_error.log;

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端服务
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
:::

### 4. 启用与禁用站点

::: details 站点管理命令
```bash
# 启用站点（创建符号链接）
sudo ln -s /etc/nginx/sites-available/site-a.com.conf /etc/nginx/sites-enabled/

# 禁用站点（删除符号链接）
sudo rm /etc/nginx/sites-enabled/site-a.com.conf

# 验证配置并重载
sudo nginx -t && sudo nginx -s reload
```
:::

### 5. 默认站点

::: details 默认站点配置（捕获未匹配的域名）
```nginx
# /etc/nginx/sites-available/default.conf

server {
    listen 80 default_server;
    server_name _;

    # 未匹配任何域名的请求直接返回 444（关闭连接）
    return 444;
}
```
:::

::: warning 注意
确保 `default_server` 只在一个 Server Block 中声明。如果多个 Server Block 都标记为 `default_server`，Nginx 会报错。
:::

## 三、WebSocket 代理

WebSocket 是实时应用（聊天、通知、协作编辑）的基础协议。Nginx 代理 WebSocket 需要处理协议升级和超时问题。

### 1. WebSocket 代理原理

WebSocket 连接建立过程：

```
客户端 → HTTP Upgrade 请求 → Nginx → 转发 Upgrade → 后端 WebSocket 服务
客户端 ← 101 Switching Protocols ← Nginx ← 101 响应 ← 后端 WebSocket 服务
客户端 ←→ 全双工通信 ←→ Nginx ←→ 后端 WebSocket 服务
```

### 2. 完整配置

::: details WebSocket 代理配置
```nginx{4-5,18-22,25-26}
# /etc/nginx/conf.d/chat.conf

# 定义 WebSocket 升级所需的变量映射
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

upstream ws_backend {
    server 127.0.0.1:8080;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name chat.example.com;

    ssl_certificate     /etc/ssl/certs/chat.example.com.pem;
    ssl_certificate_key /etc/ssl/private/chat.example.com.key;

    # WebSocket 代理
    location /ws/ {
        proxy_pass http://ws_backend;
        proxy_http_version 1.1;

        # 关键：传递 WebSocket 升级头
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # 超时设置：WebSocket 长连接需要较长的超时
        # 如果在此时间内没有数据传输，连接将被关闭
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # 普通 HTTP 请求
    location / {
        root /var/www/chat/dist;
        try_files $uri $uri/ /index.html;
    }
}
```
:::

### 3. 心跳保活

WebSocket 长连接容易因为中间网络设备（防火墙、负载均衡器）的空闲超时而被断开。你需要在应用层实现心跳机制。

::: details 前端心跳实现参考
```javascript
// src/utils/websocket.js

class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.heartbeatInterval = 30000; // 30 秒发送一次心跳
    this.reconnectDelay = 3000;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket 连接已建立');
      this.startHeartbeat();
    };

    this.ws.onclose = () => {
      console.log('WebSocket 连接已断开，尝试重连...');
      this.stopHeartbeat();
      setTimeout(() => this.connect(), this.reconnectDelay);
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'pong') return; // 忽略心跳响应
      this.onMessage(data);
    };
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.heartbeatInterval);
  }

  stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
  }

  onMessage(data) {
    // 业务消息处理
  }
}
```
:::

::: tip 提示
Nginx 的 `proxy_read_timeout` 默认只有 60 秒。对于 WebSocket 连接，你至少需要将其设置为心跳间隔的 2–3 倍，否则连接会被 Nginx 主动关闭。
:::

## 四、大文件上传服务

当你的应用需要支持大文件上传（如视频、设计稿），需要调整 Nginx 的缓冲和超时配置，否则上传会被截断或超时。

### 1. 核心配置

::: details 大文件上传配置
```nginx{8,11-12,20-22}
# /etc/nginx/conf.d/upload.conf

server {
    listen 443 ssl http2;
    server_name upload.example.com;

    # 允许上传的最大文件大小（根据业务需求调整）
    client_max_body_size 500m;

    # 关闭请求体缓冲，直接转发到后端（减少磁盘 I/O）
    proxy_request_buffering off;
    client_body_buffer_size 1m;

    location /upload/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # 上传超时（根据文件大小和网络带宽调整）
        proxy_connect_timeout 10s;
        proxy_read_timeout 300s;   # 5 分钟
        proxy_send_timeout 300s;

        # 临时文件目录（如果启用了缓冲）
        client_body_temp_path /var/nginx/upload_temp 1 2;
    }

    # 上传进度查询接口
    location /upload/progress/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }
}
```
:::

### 2. 分块上传说明

对于超大文件（> 1GB），建议在应用层实现分块上传，而非依赖 Nginx 一次性接收：

| 方案 | 优点 | 缺点 |
|------|------|------|
| 直接上传 | 实现简单 | 大文件易超时、失败需重传 |
| 分块上传 | 支持断点续传、进度可控 | 实现复杂度较高 |
| 对象存储直传 | 不经过 Nginx，性能最优 | 需要签名鉴权、前端改造 |

::: warning 注意
`client_max_body_size` 限制的是整个请求体的大小，而非单个文件。如果一个请求中包含多个文件，它们的总大小不能超过此限制。当请求体超过限制时，Nginx 返回 `413 Request Entity Too Large`。
:::

## 五、IP 黑白名单

通过 IP 黑白名单控制访问权限，保护后台管理系统和敏感接口。

### 1. allow/deny 指令

::: details IP 黑白名单配置
```nginx
# /etc/nginx/conf.d/admin.conf

server {
    listen 443 ssl http2;
    server_name admin.example.com;

    # 管理后台 —— 仅允许公司 IP 访问
    location / {
        # 白名单模式：先 allow，最后 deny all
        allow 10.0.0.0/8;       # 公司内网
        allow 203.0.113.50;     # 办公室外网 IP
        allow 198.51.100.0/24;  # VPN 网段
        deny all;               # 拒绝其他所有 IP

        root /var/www/admin/dist;
        try_files $uri $uri/ /index.html;
    }
}
```
:::

### 2. geo 模块实现动态黑名单

当需要维护较大的 IP 列表时，`geo` 模块比逐条 `allow/deny` 更高效。

::: details geo 模块黑名单
```nginx{3-10,18-21}
# /etc/nginx/nginx.conf

http {
    # 定义 IP 黑名单
    geo $blocked_ip {
        default 0;
        # 已知恶意 IP
        45.33.32.156   1;
        198.51.100.0/24 1;
        # 可以引用外部文件
        include /etc/nginx/conf.d/blocked_ips.conf;
    }

    server {
        listen 80;
        server_name app.example.com;

        # 如果命中黑名单，返回 403
        if ($blocked_ip) {
            return 403;
        }

        location / {
            proxy_pass http://backend;
        }
    }
}
```
:::

::: details 外部黑名单文件格式
```nginx
# /etc/nginx/conf.d/blocked_ips.conf
# 每行一个 IP 或 CIDR 网段

103.21.244.0/22  1;
104.16.0.0/12    1;
172.64.0.0/13    1;
```
:::

## 六、重定向与 URL 重写

URL 重定向和重写是网站迁移、SEO 优化和 URL 规范化的常见需求。

### 1. 301/302 重定向

::: details 常见重定向场景
```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    # ===== HTTP 强制跳转 HTTPS =====
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    # ===== www 跳转到裸域（或反过来） =====
    if ($host = 'www.example.com') {
        return 301 https://example.com$request_uri;
    }

    # ===== 旧路径永久跳转到新路径 =====
    location = /old-page {
        return 301 /new-page;
    }

    # ===== 临时跳转（维护页面） =====
    # location / {
    #     return 302 /maintenance.html;
    # }
}
```
:::

### 2. rewrite 正则重写

::: details URL 重写规则示例
```nginx
server {
    listen 443 ssl http2;
    server_name blog.example.com;

    # 移除 URL 末尾的 .html 后缀
    # /posts/hello-world.html → /posts/hello-world
    rewrite ^(/posts/.+)\.html$ $1 permanent;

    # 旧的分类 URL 重写为新格式
    # /category/123/articles → /categories/123
    rewrite ^/category/(\d+)/articles$ /categories/$1 permanent;

    # 多语言 URL 重写
    # /en/about → /about?lang=en
    rewrite ^/(en|zh|ja)/(.*)$ /$2?lang=$1 last;

    # 去除多余的斜杠
    # /posts//hello → /posts/hello
    merge_slashes on;

    location / {
        root /var/www/blog/dist;
        try_files $uri $uri/ /index.html;
    }
}
```
:::

### 3. rewrite 标志对比

| 标志 | 说明 | 使用场景 |
|------|------|----------|
| `last` | 停止当前 location 的 rewrite，重新匹配 location | 内部重写 |
| `break` | 停止 rewrite，在当前 location 内继续执行 | 不需要重新匹配时 |
| `redirect` | 返回 302 临时重定向 | 临时跳转 |
| `permanent` | 返回 301 永久重定向 | SEO 友好的永久跳转 |

::: warning 注意
避免在 `if` 中使用 `rewrite`，因为 Nginx 的 `if` 指令有诸多陷阱。优先使用 `map` + `return` 或独立的 `rewrite` 指令。
:::

## 七、蓝绿部署

蓝绿部署是一种零停机发布策略。Nginx 通过切换 upstream 指向不同版本的服务，实现无缝发布和快速回滚。

### 1. 蓝绿部署原理

```
                    ┌── Blue 环境 (v1.0) ── 端口 3001
Nginx upstream ────┤
                    └── Green 环境 (v2.0) ── 端口 3002
```

发布流程：
1. 当前流量指向 Blue 环境（v1.0）
2. 在 Green 环境部署新版本（v2.0）并完成验证
3. 将 Nginx upstream 从 Blue 切换到 Green
4. 验证新版本运行正常
5. 如有问题，立即切回 Blue 环境

### 2. 配置实现

::: details 蓝绿部署配置
```nginx{4-7,10-13,19}
# /etc/nginx/conf.d/app.conf

# Blue 环境（当前生产版本）
upstream blue_backend {
    server 127.0.0.1:3001;
    keepalive 16;
}

# Green 环境（新版本）
upstream green_backend {
    server 127.0.0.1:3002;
    keepalive 16;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;

    location / {
        # 切换部署环境：修改此处的 upstream 名称即可
        # 当前指向 Blue 环境
        proxy_pass http://blue_backend;

        # 切换到 Green 环境时，修改为：
        # proxy_pass http://green_backend;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 版本标识接口（方便验证当前指向哪个环境）
    location = /version {
        proxy_pass http://blue_backend;
        # 切换后修改为：proxy_pass http://green_backend;
    }
}
```
:::

### 3. 切换脚本

::: details 蓝绿切换脚本
```bash
#!/bin/bash
# /opt/scripts/switch-deploy.sh

NGINX_CONF="/etc/nginx/conf.d/app.conf"
CURRENT=$(grep -oP 'proxy_pass http://\K\w+_backend' "$NGINX_CONF" | head -1)

if [ "$CURRENT" = "blue_backend" ]; then
    NEW="green_backend"
    OLD="blue_backend"
else
    NEW="blue_backend"
    OLD="green_backend"
fi

echo "当前环境: $OLD → 切换到: $NEW"

# 替换 upstream 引用
sed -i "s/proxy_pass http:\/\/$OLD/proxy_pass http:\/\/$NEW/g" "$NGINX_CONF"

# 验证配置并重载
nginx -t && nginx -s reload

echo "切换完成，当前指向: $NEW"
```
:::

::: tip 更优方案
生产环境中，更推荐使用 `map` 变量或共享内存的方式动态切换，而非直接修改配置文件。你也可以结合 Consul、Nacos 等服务发现工具，实现完全自动化的蓝绿部署。
:::

## 八、生产环境检查清单

在将 Nginx 配置部署到生产环境之前，请逐项检查以下清单：

### 1. 安全检查

| 检查项 | 配置方式 | 优先级 |
|--------|----------|--------|
| 强制 HTTPS | `return 301 https://...` | 高 |
| 隐藏版本号 | `server_tokens off` | 高 |
| 安全响应头 | `X-Content-Type-Options`、`X-Frame-Options` | 高 |
| SSL 协议版本 | `ssl_protocols TLSv1.2 TLSv1.3` | 高 |
| 禁止目录列表 | `autoindex off`（默认） | 中 |
| IP 访问控制 | `allow/deny` 或 `geo` 模块 | 中 |
| 请求频率限制 | `limit_req_zone` | 中 |

### 2. 性能检查

| 检查项 | 配置方式 | 优先级 |
|--------|----------|--------|
| Worker 进程数 | `worker_processes auto` | 高 |
| Gzip 压缩 | `gzip on` + 合理的类型和级别 | 高 |
| 静态资源缓存 | `expires` + `Cache-Control` | 高 |
| 长连接 | `keepalive_timeout 65` | 高 |
| sendfile | `sendfile on` | 中 |
| 代理缓存 | `proxy_cache_path` | 中 |
| 文件打开缓存 | `open_file_cache` | 低 |

### 3. 日志与监控

| 检查项 | 配置方式 | 优先级 |
|--------|----------|--------|
| 访问日志格式 | 自定义 `log_format`（含响应时间） | 高 |
| 错误日志级别 | `error_log ... warn` | 高 |
| 日志轮转 | `logrotate` 配置 | 高 |
| 健康检查日志过滤 | `access_log off` 或条件日志 | 中 |
| 监控集成 | Nginx `stub_status` 模块 | 中 |

### 4. 高可用

| 检查项 | 配置方式 | 优先级 |
|--------|----------|--------|
| upstream 健康检查 | `max_fails` + `fail_timeout` | 高 |
| 优雅重载 | `nginx -s reload` 而非 restart | 高 |
| 配置备份 | 版本控制（Git） | 高 |
| 配置验证 | 部署前 `nginx -t` | 高 |
| 多实例部署 | Keepalived + VIP | 中 |

::: danger 上线前务必执行
```bash
# 1. 验证配置语法
sudo nginx -t

# 2. 检查配置文件权限
ls -la /etc/nginx/conf.d/

# 3. 检查 SSL 证书有效期
openssl x509 -enddate -noout -in /etc/ssl/certs/example.com.pem

# 4. 优雅重载（不中断现有连接）
sudo nginx -s reload

# 5. 验证服务状态
curl -I https://app.example.com
```
:::
