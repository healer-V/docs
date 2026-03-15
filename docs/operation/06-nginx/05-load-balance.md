---
title: "负载均衡"
category: "运维 · Nginx"
tags:
  - Nginx
  - 负载均衡
  - upstream
excerpt: "Nginx 内置多种负载均衡算法，通过 upstream 模块将流量智能分发到多个后端节点，是高可用架构的基础组件。"
date: 2026-03-15
---

# 负载均衡

## 一、为什么需要负载均衡

当你的应用只部署在一台服务器上时，会面临以下问题：

- **单点故障**：服务器宕机，整个应用不可用
- **性能瓶颈**：单机资源有限，无法承受高并发流量
- **维护困难**：更新部署时必须停服，影响用户体验

负载均衡（Load Balancing）通过将流量分发到多个后端节点来解决这些问题：

| 问题 | 负载均衡如何解决 |
|------|------------------|
| 单点故障 | 某个节点宕机，自动将流量切到其他健康节点 |
| 性能瓶颈 | 多个节点共同承载流量，水平扩展能力强 |
| 维护困难 | 逐台滚动更新，用户无感知 |

---

## 二、upstream 块基本语法

Nginx 通过 `upstream` 指令定义一组后端服务器，然后在 `proxy_pass` 中引用这个组名。

::: details upstream 基本用法
```nginx
# /etc/nginx/conf.d/app.conf

# 定义后端服务器组
upstream app_backend {
    server 192.168.1.101:3000;
    server 192.168.1.102:3000;
    server 192.168.1.103:3000;
}

server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://app_backend;  # 引用 upstream 名称
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
:::

::: tip upstream 名称规范
`upstream` 的名称可以自定义，但建议使用有意义的命名（如 `api_servers`、`order_service`），方便在多个 upstream 并存时快速区分。名称中可以使用字母、数字、下划线和短横线。
:::

---

## 三、负载均衡算法

Nginx 内置多种负载均衡算法，你可以根据业务场景选择最合适的策略。

### 1. 算法对比表

| 算法 | 指令 | 原理 | 适用场景 | 是否默认 |
|------|------|------|----------|----------|
| 轮询（Round Robin） | 无需指令 | 按顺序逐一分发请求 | 后端性能一致的场景 | 是 |
| 加权轮询（Weighted） | `weight=N` | 按权重比例分发，权重越高分到的请求越多 | 后端性能不一致的场景 | 否 |
| IP 哈希（IP Hash） | `ip_hash` | 根据客户端 IP 计算哈希值，同一 IP 总是分到同一后端 | 需要会话保持的场景 | 否 |
| 最少连接（Least Conn） | `least_conn` | 将请求分发给当前活跃连接数最少的后端 | 请求处理时间差异大的场景 | 否 |
| 随机（Random） | `random` | 随机选择后端节点 | 后端数量多、请求量大的场景 | 否 |
| 一致性哈希（Hash） | `hash $key` | 根据自定义 key 计算哈希，相同 key 分到同一后端 | 缓存服务、分片场景 | 否 |

### 2. 加权轮询

当后端服务器配置不同时，性能强的机器应该分配更多请求。通过 `weight` 参数实现。

::: details 加权轮询配置
```nginx{3-5}
upstream app_backend {
    # weight 值越大，分到的请求比例越高
    server 192.168.1.101:3000 weight=5;  # 高配服务器，承担 5/8 的流量
    server 192.168.1.102:3000 weight=2;  # 中配服务器，承担 2/8 的流量
    server 192.168.1.103:3000 weight=1;  # 低配服务器，承担 1/8 的流量
}
```
:::

### 3. IP Hash 会话保持

某些应用（如使用 Session 存储登录状态的传统应用）要求同一个用户的所有请求都发到同一台后端，`ip_hash` 可以实现这一点。

::: details IP Hash 配置
```nginx{2}
upstream app_backend {
    ip_hash;  # 启用 IP 哈希
    server 192.168.1.101:3000;
    server 192.168.1.102:3000;
    server 192.168.1.103:3000;
}
```
:::

::: warning ip_hash 的局限
- 如果用户通过代理或 NAT 网关访问，大量用户可能共享同一个出口 IP，导致流量分配不均
- 当后端节点增减时，哈希结果会变化，原有的会话绑定关系会被打乱
- 使用 CDN 后，Nginx 看到的客户端 IP 可能是 CDN 节点 IP，而非真实用户 IP
:::

### 4. 最少连接

当后端请求处理时间差异较大（有的接口快、有的接口慢）时，`least_conn` 能将新请求分发给当前负载最轻的节点。

::: details 最少连接配置
```nginx{2}
upstream app_backend {
    least_conn;  # 优先分发给连接数最少的节点
    server 192.168.1.101:3000;
    server 192.168.1.102:3000;
    server 192.168.1.103:3000;
}
```
:::

---

## 四、健康检查

Nginx 开源版内置**被动健康检查**机制，通过监测后端响应来判断节点是否健康。

### 1. 被动健康检查参数

| 参数 | 默认值 | 作用 |
|------|--------|------|
| `max_fails` | 1 | 在 `fail_timeout` 时间窗口内允许的最大失败次数 |
| `fail_timeout` | 10s | 两层含义：失败计数的时间窗口 + 节点被标记为不可用后的恢复等待时间 |

::: details 健康检查配置
```nginx{3-5}
upstream app_backend {
    # 30 秒内失败 3 次，则该节点被标记为不可用，30 秒后重新尝试
    server 192.168.1.101:3000 max_fails=3 fail_timeout=30s;
    server 192.168.1.102:3000 max_fails=3 fail_timeout=30s;
    server 192.168.1.103:3000 max_fails=3 fail_timeout=30s;
}
```
:::

### 2. 工作流程

```
请求到达 → Nginx 转发到后端节点
               ↓
         后端响应失败（连接拒绝、超时等）
               ↓
         失败计数 +1
               ↓
         30 秒内累计 3 次失败
               ↓
         标记该节点为 "不可用"
               ↓
         后续 30 秒内不再向该节点转发
               ↓
         30 秒后重新尝试该节点
```

::: tip 主动健康检查
Nginx 商业版（Nginx Plus）支持主动健康检查，能定期向后端发送探测请求。如果你使用开源版，可以通过第三方模块 `nginx_upstream_check_module` 实现类似功能。
:::

---

## 五、服务器状态关键字

在 `upstream` 块中，每个 `server` 指令可以附加状态关键字来控制节点行为。

| 关键字 | 作用 | 使用场景 |
|--------|------|----------|
| `weight=N` | 设置权重，默认为 1 | 根据服务器性能分配不同比例的流量 |
| `max_fails=N` | 最大失败次数，默认为 1 | 控制健康检查的敏感度 |
| `fail_timeout=Ns` | 失败超时时间，默认 10s | 控制不可用节点的恢复间隔 |
| `backup` | 备用节点，仅当所有主节点不可用时才接收流量 | 灾备方案 |
| `down` | 标记节点为永久不可用 | 节点维护期间临时下线 |
| `max_conns=N` | 限制到该节点的最大并发连接数 | 保护性能较弱的节点 |

::: details 综合配置示例
```nginx
upstream app_backend {
    server 192.168.1.101:3000 weight=5 max_fails=3 fail_timeout=30s;  # 主节点-高配
    server 192.168.1.102:3000 weight=3 max_fails=3 fail_timeout=30s;  # 主节点-中配
    server 192.168.1.103:3000 down;                                     # 维护中，已下线
    server 192.168.1.104:3000 backup;                                   # 备用节点
}
```
:::

---

## 六、会话保持方案对比

对于需要会话保持的应用，有多种实现方式，各有优劣。

| 方案 | 实现方式 | 优点 | 缺点 |
|------|----------|------|------|
| `ip_hash` | 基于客户端 IP 哈希 | 配置简单，无需额外依赖 | NAT 环境下分配不均，节点变更会打乱绑定 |
| Cookie 亲和 | Nginx Plus 的 `sticky cookie` | 精确到浏览器级别，不受 NAT 影响 | 仅 Nginx Plus 商业版支持 |
| 后端共享 Session | 用 Redis / Memcached 存储 Session | 任何节点都能处理任何请求，真正无状态 | 需要额外部署存储服务，有轻微延迟 |
| JWT Token | 客户端携带 Token，无服务端 Session | 完全无状态，天然支持负载均衡 | Token 无法主动失效，体积较大 |

::: tip 推荐方案
现代应用优先使用 **JWT Token** 或 **Redis 共享 Session** 实现无状态化，这样任何后端节点都能处理任何请求，负载均衡策略不受限制。只有在无法改造遗留应用时，才考虑 `ip_hash` 方案。
:::

---

## 七、生产实战：三节点 Node.js 集群

下面是一个完整的生产环境配置示例，将 3 个 Node.js 实例部署在不同端口上，通过 Nginx 实现负载均衡。

### 1. 架构说明

```
用户请求 → Nginx（80/443）→ upstream（负载均衡）
                                ├→ Node.js 实例 1（:3001）
                                ├→ Node.js 实例 2（:3002）
                                └→ Node.js 实例 3（:3003）
```

### 2. 使用 PM2 启动多实例

::: details PM2 集群模式启动 3 个实例
```bash
# 安装 PM2
npm install -g pm2

# 启动 3 个实例（分别监听 3001、3002、3003）
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'order-service',
    script: './dist/main.js',
    instances: 3,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}

# 启动服务
pm2 start ecosystem.config.js
```
:::

### 3. 完整 Nginx 配置

::: details 生产环境负载均衡完整配置
```nginx{3-8,16-17,21-30}
# /etc/nginx/conf.d/order-service.conf

upstream order_service {
    least_conn;  # 使用最少连接算法

    server 127.0.0.1:3001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3003 weight=1 max_fails=3 fail_timeout=30s;

    keepalive 32;  # 保持 32 个长连接到后端，减少 TCP 握手开销
}

server {
    listen 80;
    server_name order.example.com;
    return 301 https://$host$request_uri;  # HTTP 强制跳转 HTTPS
}

server {
    listen 443 ssl http2;
    server_name order.example.com;

    ssl_certificate /etc/letsencrypt/live/order.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/order.example.com/privkey.pem;

    # 访问日志
    access_log /var/log/nginx/order-service-access.log;
    error_log /var/log/nginx/order-service-error.log;

    # API 代理
    location /api/ {
        proxy_pass http://order_service/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";  # 配合 keepalive 使用长连接
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时配置
        proxy_connect_timeout 10s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;

        # 故障转移
        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
    }

    # WebSocket 代理
    location /ws/ {
        proxy_pass http://order_service/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }

    # 前端静态资源
    location / {
        root /var/www/order-frontend/dist;
        try_files $uri $uri/ /index.html;

        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # 自定义错误页面
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /var/www/error-pages;
        internal;
    }
}
```
:::

::: warning keepalive 配置注意事项
使用 `keepalive` 指令时，必须同时设置 `proxy_http_version 1.1` 和 `proxy_set_header Connection ""`，否则 Nginx 默认使用 HTTP/1.0 和 `Connection: close`，长连接不会生效。
:::

### 4. 验证与监控

配置完成后，你可以通过以下方式验证负载均衡是否生效：

::: details 验证和监控命令
```bash
# 检查 Nginx 配置语法
sudo nginx -t

# 重新加载配置（不中断服务）
sudo nginx -s reload

# 多次请求观察后端响应（在后端日志中确认请求分发到不同节点）
for i in $(seq 1 10); do
    curl -s -o /dev/null -w "%{http_code}\n" https://order.example.com/api/health
done

# 查看 Nginx 连接状态（需要启用 stub_status 模块）
curl http://localhost/nginx_status
```
:::

::: tip 灰度发布技巧
利用 `weight` 参数可以实现简单的灰度发布：先将新版本节点的权重设为 1，其他节点设为 9，让 10% 的流量进入新版本。验证无误后逐步提升权重，直到全量切换。
:::
