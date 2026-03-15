---
title: "性能优化"
category: "运维 · Nginx"
tags:
  - Nginx
  - 性能优化
  - 调优
excerpt: "通过 Worker 进程调优、Gzip 压缩、缓存策略和连接复用等手段，充分释放 Nginx 的性能潜力。"
date: 2026-03-15
---

# 性能优化

Nginx 以高性能著称，但默认配置并不能满足所有生产场景的需求。你需要根据服务器硬件资源、业务流量特征和应用架构，对 Nginx 进行针对性调优，才能充分发挥它的处理能力。

## 一、Worker 进程调优

Nginx 采用多进程架构，一个 Master 进程负责管理，多个 Worker 进程负责处理请求。合理配置 Worker 参数是性能优化的第一步。

### 1. worker_processes

`worker_processes` 决定 Nginx 启动多少个工作进程。推荐设置为 `auto`，Nginx 会自动检测 CPU 核心数并创建对应数量的 Worker 进程。

::: details worker_processes 配置示例
```nginx
# /etc/nginx/nginx.conf

# 自动匹配 CPU 核心数（推荐）
worker_processes auto;

# 也可以手动指定，例如 8 核服务器
# worker_processes 8;
```
:::

### 2. worker_cpu_affinity

在多核服务器上，你可以将 Worker 进程绑定到指定的 CPU 核心，避免进程在不同核心间频繁切换带来的缓存失效开销。

::: details CPU 亲和性配置
```nginx
# /etc/nginx/nginx.conf

# 自动绑定（Nginx 1.9.10+，推荐）
worker_cpu_affinity auto;

# 手动绑定示例（4 核服务器）
# worker_processes 4;
# worker_cpu_affinity 0001 0010 0100 1000;
```
:::

### 3. worker_connections 与 worker_rlimit_nofile

`worker_connections` 定义每个 Worker 进程能同时处理的最大连接数。理论上 Nginx 的最大并发连接数 = `worker_processes × worker_connections`。

::: details 连接数配置
```nginx
# /etc/nginx/nginx.conf

# 提升文件描述符限制（应大于 worker_connections）
worker_rlimit_nofile 65535;

events {
    # 每个 Worker 最大连接数
    worker_connections 10240;
}
```
:::

::: warning 注意
`worker_rlimit_nofile` 的值需要同时在操作系统层面调整，否则 Nginx 无法真正打开这么多文件描述符。你可以通过修改 `/etc/security/limits.conf` 来设置：

```bash
# /etc/security/limits.conf
nginx soft nofile 65535
nginx hard nofile 65535
```
:::

## 二、事件模型

Nginx 支持多种 I/O 多路复用模型，不同操作系统有不同的最优选择。

| 操作系统 | 推荐模型 | 说明 |
|----------|----------|------|
| Linux 2.6+ | `epoll` | 高效的事件通知机制，支持大量并发连接 |
| macOS / FreeBSD | `kqueue` | BSD 系统的高性能事件模型 |
| Solaris | `eventport` | Solaris 专有事件端口 |
| Windows | `select` | Windows 下唯一可用模型，性能较差 |

::: details 事件模型配置
```nginx
# /etc/nginx/nginx.conf

events {
    # Linux 服务器推荐 epoll
    use epoll;

    # macOS/FreeBSD 推荐 kqueue
    # use kqueue;

    worker_connections 10240;

    # 允许一个 Worker 同时接受多个新连接
    multi_accept on;
}
```
:::

::: tip 提示
在大多数 Linux 发行版上，Nginx 会自动选择 `epoll`，你可以省略 `use` 指令。但显式声明可以增强配置的可读性。
:::

## 三、Gzip 压缩

启用 Gzip 压缩能显著减少传输数据量，对文本类资源（HTML、CSS、JavaScript、JSON）效果尤为明显，通常可以压缩 60%–80%。

### 1. Gzip 基础配置

::: details Gzip 完整配置
```nginx{3,6,14-20}
# /etc/nginx/conf.d/gzip.conf

http {
    # 启用 Gzip 压缩
    gzip on;

    # 压缩级别：1-9，推荐 4-6（平衡压缩率与 CPU 开销）
    gzip_comp_level 5;

    # 最小压缩体积，小于此值不压缩（避免越压越大）
    gzip_min_length 1024;

    # 需要压缩的 MIME 类型
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    # 在响应头中添加 Vary: Accept-Encoding
    gzip_vary on;

    # 对代理请求也启用压缩
    gzip_proxied any;

    # 压缩使用的缓冲区
    gzip_buffers 16 8k;

    # HTTP 1.1 以上版本才压缩
    gzip_http_version 1.1;
}
```
:::

### 2. Brotli 压缩对比

Brotli 是 Google 开发的压缩算法，在相同压缩级别下比 Gzip 有更高的压缩率，但需要额外安装 `ngx_brotli` 模块。

| 特性 | Gzip | Brotli |
|------|------|--------|
| 压缩率 | 良好 | 更优（比 Gzip 高 15%–25%） |
| CPU 开销 | 较低 | 较高（尤其在高压缩级别） |
| 浏览器支持 | 所有现代浏览器 | 主流现代浏览器（需 HTTPS） |
| Nginx 模块 | 内置 | 需额外安装 `ngx_brotli` |
| 适用场景 | 通用 | 静态资源预压缩 |

::: details Brotli 配置示例
```nginx
# 需先安装 ngx_brotli 模块
# /etc/nginx/conf.d/brotli.conf

brotli on;
brotli_comp_level 6;
brotli_types
    text/plain
    text/css
    text/javascript
    application/javascript
    application/json
    application/xml
    image/svg+xml;
```
:::

## 四、连接优化

合理配置连接参数可以减少 TCP 握手开销，提升吞吐量。

### 1. Keepalive 长连接

HTTP 长连接允许在单个 TCP 连接上发送多个请求，避免频繁建立和关闭连接。

::: details Keepalive 配置
```nginx
# /etc/nginx/nginx.conf

http {
    # 长连接超时时间（秒）
    keepalive_timeout 65;

    # 单个长连接最多处理的请求数
    keepalive_requests 1000;
}
```
:::

### 2. sendfile 与 TCP 优化

`sendfile` 让内核直接将文件数据发送到网络接口，绕过用户空间，减少数据拷贝次数。

::: details TCP 优化配置
```nginx{3,6,9}
# /etc/nginx/nginx.conf

http {
    # 启用零拷贝文件传输
    sendfile on;

    # 累积数据包后一次性发送（配合 sendfile 使用）
    tcp_nopush on;

    # 禁用 Nagle 算法，减少小包延迟（适合实时性要求高的场景）
    tcp_nodelay on;
}
```
:::

::: tip sendfile、tcp_nopush、tcp_nodelay 的关系
- `sendfile on` + `tcp_nopush on`：Nginx 在发送文件时会尽量攒满一个 TCP 包再发出，提高网络利用率。
- 当最后一个数据包发送完毕，`tcp_nodelay` 生效，确保最后的小包立即发出而不等待。
- 三者搭配使用能获得最佳效果。
:::

## 五、缓冲区调优

缓冲区大小直接影响 Nginx 处理请求和转发响应的效率。

### 1. 代理缓冲区

当 Nginx 作为反向代理时，需要合理设置缓冲区来暂存后端响应。

::: details 代理缓冲区配置
```nginx
# /etc/nginx/conf.d/proxy-buffer.conf

location /api/ {
    proxy_pass http://backend_server;

    # 启用代理缓冲（默认开启）
    proxy_buffering on;

    # 读取响应头部的缓冲区大小
    proxy_buffer_size 4k;

    # 读取响应体的缓冲区数量和大小
    proxy_buffers 8 16k;

    # 繁忙时允许发送给客户端的缓冲区大小
    proxy_busy_buffers_size 32k;
}
```
:::

### 2. 客户端请求缓冲区

::: details 客户端缓冲区配置
```nginx
# /etc/nginx/nginx.conf

http {
    # 客户端请求体缓冲区大小
    client_body_buffer_size 16k;

    # 客户端请求体最大值（超出返回 413）
    client_max_body_size 50m;

    # 客户端请求头缓冲区大小
    client_header_buffer_size 1k;

    # 大请求头缓冲区
    large_client_header_buffers 4 8k;
}
```
:::

## 六、代理缓存

Nginx 的代理缓存可以将后端响应缓存到本地磁盘或内存，对于不频繁变化的接口数据，命中缓存后直接返回，无需再次请求后端。

### 1. 缓存基础配置

::: details 代理缓存完整配置
```nginx{2-4,14-22}
# /etc/nginx/nginx.conf

http {
    # 定义缓存路径和参数
    proxy_cache_path /var/cache/nginx/api_cache
        levels=1:2              # 目录层级
        keys_zone=api_cache:10m # 缓存区名称和索引内存大小
        max_size=1g             # 最大磁盘占用
        inactive=60m            # 60 分钟未访问则清除
        use_temp_path=off;      # 不使用临时路径

    server {
        listen 80;
        server_name api.example.com;

        location /api/ {
            proxy_pass http://backend_server;

            # 启用缓存
            proxy_cache api_cache;

            # 针对不同状态码设置缓存时间
            proxy_cache_valid 200 10m;
            proxy_cache_valid 404 1m;

            # 自定义缓存 Key
            proxy_cache_key "$scheme$request_method$host$request_uri";

            # 在响应头中标注缓存状态（方便调试）
            add_header X-Cache-Status $upstream_cache_status;
        }
    }
}
```
:::

### 2. 缓存清除

当后端数据更新时，你可能需要主动清除缓存。可以使用第三方模块 `ngx_cache_purge` 实现。

::: details 缓存清除配置
```nginx
# 需安装 ngx_cache_purge 模块

location ~ /purge(/.*) {
    # 限制只有内网可以清除缓存
    allow 127.0.0.1;
    allow 10.0.0.0/8;
    deny all;

    proxy_cache_purge api_cache "$scheme$request_method$host$1";
}

# 清除示例：
# curl -X PURGE http://api.example.com/purge/api/products
```
:::

## 七、浏览器缓存

通过设置合适的缓存响应头，让浏览器缓存静态资源，减少重复请求。

### 1. expires 与 Cache-Control

::: details 浏览器缓存配置
```nginx
# /etc/nginx/conf.d/cache-control.conf

server {
    listen 80;
    server_name static.example.com;

    # 图片、字体等不易变化的资源，缓存 30 天
    location ~* \.(jpg|jpeg|png|gif|ico|woff2|woff|ttf)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # CSS 和 JS（带 hash 的构建产物），缓存 1 年
    location ~* \.(css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 文件不缓存，确保用户获取最新版本
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```
:::

### 2. ETag

ETag 是一种协商缓存机制，Nginx 默认开启。浏览器在后续请求中携带 `If-None-Match` 头，服务端比对后若资源未变，返回 304 状态码。

::: details ETag 配置
```nginx
# Nginx 默认启用 ETag，通常无需额外配置
# 如果需要显式控制：

etag on;   # 启用（默认）
# etag off; # 禁用（当使用 CDN 且多台服务器 ETag 不一致时）
```
:::

## 八、速率限制

速率限制能有效防范暴力破解、CC 攻击和爬虫滥用。

### 1. 请求速率限制（limit_req）

::: details 请求速率限制配置
```nginx{3,12-14}
# /etc/nginx/nginx.conf

http {
    # 定义限速区域：按客户端 IP 限制，每秒 10 个请求
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    server {
        listen 80;
        server_name api.example.com;

        location /api/login {
            # 应用限速：允许突发 20 个请求，不延迟处理
            limit_req zone=api_limit burst=20 nodelay;

            # 限速触发时返回 429 状态码
            limit_req_status 429;

            proxy_pass http://backend_server;
        }
    }
}
```
:::

::: tip burst 与 nodelay 的区别
- `burst=20`：允许请求以突发形式排队，最多排 20 个，超出直接拒绝。
- `nodelay`：排队中的请求立即处理，而非以固定速率逐个放行。适合 API 接口场景。
- 不加 `nodelay` 时，突发请求会以 `rate` 定义的速率匀速处理，适合需要严格限速的场景。
:::

### 2. 连接数限制（limit_conn）

::: details 连接数限制配置
```nginx
# /etc/nginx/nginx.conf

http {
    # 定义连接数限制区域
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    server {
        listen 80;
        server_name download.example.com;

        location /files/ {
            # 每个 IP 最多 5 个并发连接
            limit_conn conn_limit 5;

            # 每个连接限速 500KB/s（防止单个用户占满带宽）
            limit_rate 500k;
        }
    }
}
```
:::

## 九、打开文件缓存

Nginx 处理每个请求时都需要打开文件，频繁的文件系统调用会成为瓶颈。`open_file_cache` 可以缓存文件描述符、大小和修改时间。

::: details 打开文件缓存配置
```nginx
# /etc/nginx/nginx.conf

http {
    # 缓存最多 10000 个文件信息，超过 60 秒未访问则清除
    open_file_cache max=10000 inactive=60s;

    # 每 30 秒检查一次缓存的文件是否仍然有效
    open_file_cache_valid 30s;

    # 文件在 inactive 期间至少被访问 2 次才会被缓存
    open_file_cache_min_uses 2;

    # 缓存文件错误信息（如 404）
    open_file_cache_errors on;
}
```
:::

## 十、优化清单

以下是一份 Nginx 性能优化的快速参考清单，你可以根据实际环境进行调整：

| 指令 | 推荐值 | 说明 |
|------|--------|------|
| `worker_processes` | `auto` | 自动匹配 CPU 核心数 |
| `worker_cpu_affinity` | `auto` | 自动绑定 CPU 亲和性 |
| `worker_connections` | `10240` | 每个 Worker 的最大连接数 |
| `worker_rlimit_nofile` | `65535` | 文件描述符上限 |
| `use` | `epoll` / `kqueue` | 选择最优事件模型 |
| `multi_accept` | `on` | 一次性接受所有新连接 |
| `sendfile` | `on` | 零拷贝文件传输 |
| `tcp_nopush` | `on` | 累积数据后一次性发送 |
| `tcp_nodelay` | `on` | 禁用 Nagle 算法 |
| `gzip` | `on` | 启用 Gzip 压缩 |
| `gzip_comp_level` | `5` | 压缩级别（1-9，推荐 4-6） |
| `gzip_min_length` | `1024` | 最小压缩体积 |
| `keepalive_timeout` | `65` | 长连接超时时间（秒） |
| `keepalive_requests` | `1000` | 单连接最大请求数 |
| `client_max_body_size` | `50m` | 请求体最大限制 |
| `proxy_buffer_size` | `4k` | 代理响应头缓冲区 |
| `proxy_buffers` | `8 16k` | 代理响应体缓冲区 |
| `open_file_cache` | `max=10000 inactive=60s` | 文件信息缓存 |
| `limit_req_zone` | 按业务定义 | 请求速率限制 |
| `limit_conn_zone` | 按业务定义 | 连接数限制 |

::: danger 调优注意事项
- 所有参数调整后务必通过 `nginx -t` 验证配置语法。
- 性能调优应结合压力测试（如 `wrk`、`ab`）验证效果，切勿盲目照搬参数。
- `worker_rlimit_nofile` 需要操作系统层面配合调整 `ulimit`，否则不生效。
- Gzip 压缩会增加 CPU 开销，对于已经压缩的资源（如图片、视频）不要重复压缩。
:::
