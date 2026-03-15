---
title: "反向代理"
category: "运维 · Nginx"
tags:
  - Nginx
  - 反向代理
  - proxy_pass
excerpt: "反向代理是 Nginx 最核心的功能之一，通过将客户端请求转发到后端服务，实现服务隐藏、跨域解决和统一入口管理。"
date: 2026-03-15
---

# 反向代理

## 一、正向代理与反向代理

代理（Proxy）是网络中一个非常重要的概念，但正向代理和反向代理的工作方向完全相反，理解两者的区别是掌握 Nginx 代理的第一步。

### 1. 正向代理

正向代理代表**客户端**发起请求。客户端知道自己要访问的目标服务器是谁，但无法直接访问（比如被防火墙拦截），于是通过代理服务器"代替自己"去请求。

```
客户端 → 正向代理服务器 → 目标服务器
（你）   （VPN / 代理工具）  （Google）
```

典型场景：科学上网、企业内网代理、匿名访问。

### 2. 反向代理

反向代理代表**服务端**接收请求。客户端并不知道最终处理请求的是哪台后端服务器，它只和 Nginx 通信，由 Nginx 决定将请求转发给谁。

```
客户端 → 反向代理（Nginx） → 后端服务 A / B / C
（用户）  （统一入口）        （真正处理请求的服务）
```

典型场景：负载均衡、服务隐藏、统一 HTTPS 终结、跨域解决。

### 3. 对比总结

| 对比项 | 正向代理 | 反向代理 |
|--------|----------|----------|
| 代理方 | 客户端 | 服务端 |
| 客户端是否知道真实服务器 | 知道 | 不知道 |
| 服务端是否知道真实客户端 | 不知道 | 通过 Header 获取 |
| 典型软件 | Shadowsocks、Squid | Nginx、HAProxy |
| 核心目的 | 帮客户端突破限制 | 帮服务端分发和保护 |

---

## 二、基本 proxy_pass 配置

`proxy_pass` 是 Nginx 反向代理的核心指令，它告诉 Nginx 把匹配到的请求转发到哪个后端地址。

::: details 最简单的反向代理配置
```nginx
# /etc/nginx/conf.d/app.conf
server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;  # 转发到本机 3000 端口的 Node.js 服务
    }
}
```
:::

当用户访问 `http://app.example.com` 时，Nginx 接收请求后将其转发到本机的 3000 端口，再把后端的响应原封不动地返回给用户。

---

## 三、proxy_pass 末尾斜杠的区别

::: warning 这是新手最容易踩的坑
`proxy_pass` 指令中 URL 末尾是否带 `/`，会直接影响转发后的路径拼接方式，配置错误会导致 404。
:::

### 1. 不带末尾斜杠

```nginx
location /api {
    proxy_pass http://127.0.0.1:3000;
}
```

请求 `/api/users` → 后端收到 `/api/users`（原始路径完整保留）。

### 2. 带末尾斜杠

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000/;
}
```

请求 `/api/users` → 后端收到 `/users`（`/api/` 前缀被剥离）。

### 3. 完整对比

| 配置写法 | 请求路径 | 后端收到的路径 |
|----------|----------|----------------|
| `proxy_pass http://backend` | `/api/users` | `/api/users` |
| `proxy_pass http://backend/` | `/api/users` | `/users` |
| `proxy_pass http://backend/v2` | `/api/users` | `/v2users` |
| `proxy_pass http://backend/v2/` | `/api/users` | `/v2/users` |

::: tip 经验法则
如果你希望后端收到的路径和客户端请求一致，就**不加斜杠**。如果你希望剥离 location 前缀，就用 `proxy_pass http://backend/` 带上斜杠。
:::

---

## 四、代理请求头设置

Nginx 在转发请求时，默认会修改或丢弃一些 HTTP 头部信息。为了让后端服务正确识别客户端信息，你需要手动设置代理头。

### 1. 常用代理头

| 头部字段 | 作用 | 推荐配置 |
|----------|------|----------|
| `Host` | 告诉后端请求的原始域名 | `proxy_set_header Host $host;` |
| `X-Real-IP` | 传递客户端真实 IP | `proxy_set_header X-Real-IP $remote_addr;` |
| `X-Forwarded-For` | 记录完整的代理链 IP | `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` |
| `X-Forwarded-Proto` | 告诉后端原始请求协议 | `proxy_set_header X-Forwarded-Proto $scheme;` |

### 2. 标准代理头配置模板

::: details 推荐抽取为公共文件复用
```nginx
# /etc/nginx/snippets/proxy-headers.conf
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port $server_port;
```
:::

在 server 或 location 中使用 `include` 引入：

::: details 引用公共代理头配置
```nginx
# /etc/nginx/conf.d/app.conf
server {
    listen 80;
    server_name app.example.com;

    location / {
        include snippets/proxy-headers.conf;  # 引入公共头配置
        proxy_pass http://127.0.0.1:3000;
    }
}
```
:::

---

## 五、代理到 Node.js / Express / NestJS 后端

前后端分离架构中，Nginx 作为反向代理将 API 请求转发到 Node.js 后端是最常见的部署方式。

### 1. 代理到 Express 服务

::: details Express 反向代理完整配置
```nginx{7-13}
# /etc/nginx/conf.d/express-app.conf
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "";  # 启用 HTTP/1.1 长连接
    }
}
```
:::

### 2. 代理到 NestJS 服务

NestJS 默认监听 3000 端口，配置方式与 Express 一致，但生产环境通常需要配合 PM2 进程管理。

::: details NestJS 反向代理配置
```nginx
# /etc/nginx/conf.d/nestjs-app.conf
server {
    listen 80;
    server_name api.example.com;

    # API 接口代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Swagger 文档代理
    location /docs {
        proxy_pass http://127.0.0.1:3000/docs;
        proxy_set_header Host $host;
    }
}
```
:::

---

## 六、多路径代理到不同后端

实际项目中，通常前端和后端部署在不同端口甚至不同服务器上，Nginx 可以根据请求路径将流量分发到不同的后端。

::: details 前后端分离典型代理配置
```nginx{8-9,14-20,23-26}
# /etc/nginx/conf.d/fullstack-app.conf
server {
    listen 80;
    server_name www.example.com;

    # 前端 SPA 应用（Vue / React 打包产物）
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;  # SPA 路由回退
    }

    # 后端 API 接口
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    # 静态资源上传服务
    location /uploads/ {
        proxy_pass http://127.0.0.1:8080/uploads/;
        proxy_set_header Host $host;
    }
}
```
:::

::: tip 路径匹配优先级
Nginx 的 `location` 匹配遵循优先级规则：精确匹配 `=` > 前缀匹配 `^~` > 正则匹配 `~` / `~*` > 普通前缀匹配。当多个 location 都能匹配时，优先级高的生效。
:::

---

## 七、WebSocket 代理

WebSocket 是基于 HTTP 协议升级的全双工通信协议。由于连接建立过程需要 HTTP Upgrade 机制，Nginx 代理 WebSocket 时需要额外配置。

### 1. WebSocket 握手流程

```
客户端 → HTTP 请求（Upgrade: websocket）→ Nginx → 后端
客户端 ← HTTP 101 Switching Protocols  ← Nginx ← 后端
客户端 ←→ WebSocket 全双工通信 ←→ Nginx ←→ 后端
```

### 2. Nginx WebSocket 代理配置

::: details WebSocket 代理完整配置
```nginx{8-12}
# /etc/nginx/conf.d/websocket.conf
server {
    listen 80;
    server_name ws.example.com;

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;                    # 必须使用 HTTP/1.1
        proxy_set_header Upgrade $http_upgrade;     # 传递 Upgrade 头
        proxy_set_header Connection "upgrade";      # 设置 Connection 为 upgrade
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        proxy_read_timeout 86400s;  # WebSocket 长连接，超时设为 24 小时
        proxy_send_timeout 86400s;
    }
}
```
:::

::: warning 超时设置很重要
WebSocket 是长连接，如果不调大 `proxy_read_timeout`，Nginx 会在默认 60 秒后断开空闲连接。对于聊天、实时通知等场景，建议设为 `86400s`（24 小时）或更长。
:::

---

## 八、超时配置

当后端服务响应较慢或网络不稳定时，合理的超时配置可以避免请求长时间挂起，同时也不会因为设置太短导致正常请求被中断。

### 1. 超时指令说明

| 指令 | 默认值 | 作用 |
|------|--------|------|
| `proxy_connect_timeout` | 60s | 与后端建立 TCP 连接的超时时间 |
| `proxy_read_timeout` | 60s | 等待后端返回响应的超时时间（两次读操作之间的间隔） |
| `proxy_send_timeout` | 60s | 向后端发送请求体的超时时间（两次写操作之间的间隔） |
| `proxy_next_upstream_timeout` | 0（无限制） | 尝试下一个 upstream 服务器的总超时时间 |

### 2. 推荐配置

::: details 生产环境超时配置示例
```nginx
# /etc/nginx/conf.d/app.conf
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;

        # 超时设置
        proxy_connect_timeout 10s;   # 连接超时缩短，快速发现后端不可用
        proxy_read_timeout 60s;      # 普通 API 60 秒足够
        proxy_send_timeout 60s;

        # 文件上传接口单独设置更长超时
    }

    location /api/upload {
        proxy_pass http://127.0.0.1:3000;
        proxy_connect_timeout 10s;
        proxy_read_timeout 300s;     # 上传可能需要更长时间
        proxy_send_timeout 300s;

        client_max_body_size 100m;   # 允许上传最大 100MB 文件
    }
}
```
:::

---

## 九、错误处理

当后端服务不可用或返回错误时，Nginx 可以拦截错误响应并展示自定义错误页面，提升用户体验。

### 1. proxy_intercept_errors

::: details 自定义错误页面配置
```nginx{9-14}
# /etc/nginx/conf.d/app.conf
server {
    listen 80;
    server_name app.example.com;

    # 自定义错误页面
    error_page 502 503 504 /50x.html;
    error_page 404 /404.html;

    location = /50x.html {
        root /var/www/error-pages;
        internal;  # 仅限内部跳转访问
    }

    location = /404.html {
        root /var/www/error-pages;
        internal;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_intercept_errors on;  # 拦截后端返回的错误响应
    }
}
```
:::

### 2. 后端故障时自动切换

结合 `proxy_next_upstream` 指令，当某个后端返回错误时，Nginx 可以自动尝试下一个后端节点。

::: details 后端故障自动切换配置
```nginx
upstream backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://backend;
        proxy_next_upstream error timeout http_502 http_503;  # 遇到这些错误时切换节点
        proxy_next_upstream_tries 2;      # 最多尝试 2 个节点
        proxy_next_upstream_timeout 10s;  # 切换总超时 10 秒
    }
}
```
:::

---

## 十、通过 Nginx 代理解决跨域

前端开发中，浏览器的同源策略会阻止跨域请求。虽然后端可以配置 CORS 头，但通过 Nginx 统一处理跨域更加优雅，且不需要修改后端代码。

### 1. 方案一：Nginx 添加 CORS 头

::: details Nginx 统一添加 CORS 响应头
```nginx{7-17}
# /etc/nginx/conf.d/api.conf
server {
    listen 80;
    server_name api.example.com;

    location /api/ {
        # CORS 头配置
        add_header Access-Control-Allow-Origin "https://www.example.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Max-Age 86400 always;

        # 处理 OPTIONS 预检请求
        if ($request_method = 'OPTIONS') {
            return 204;
        }

        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
:::

::: danger 不要使用 Access-Control-Allow-Origin: *
如果你的接口需要携带 Cookie（`credentials: include`），`Access-Control-Allow-Origin` 不能设为 `*`，必须指定具体域名。否则浏览器会直接拒绝响应。
:::

### 2. 方案二：同域代理避免跨域

更推荐的方式是让前端和 API 共用同一个域名，通过不同路径区分，从根本上避免跨域问题。

::: details 同域代理消除跨域
```nginx
# /etc/nginx/conf.d/app.conf
server {
    listen 80;
    server_name www.example.com;

    # 前端页面 —— 同域
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 接口 —— 同域不同路径，无跨域问题
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
:::

::: tip 最佳实践
生产环境中推荐使用**同域代理方案**，它不仅彻底消除跨域问题，还避免了 OPTIONS 预检请求带来的额外开销，同时简化了 Cookie 和认证的处理。
:::
