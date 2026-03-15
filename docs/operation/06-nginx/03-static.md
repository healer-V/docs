---
title: "静态资源服务"
category: "运维 · Nginx"
tags:
  - Nginx
  - 静态资源
  - SPA
excerpt: "Nginx 天生擅长高效地托管静态文件，是部署前端应用、图片服务和文件下载站的首选方案。"
date: 2026-03-15
---

# 静态资源服务

Nginx 基于事件驱动的异步架构，在处理静态文件请求时性能极为出色。无论是部署前端 SPA 应用、搭建图片服务，还是提供文件下载，Nginx 都是最可靠的选择。

## 一、基础静态文件托管

托管静态文件的核心是告诉 Nginx 从哪个目录读取文件。Nginx 提供了 `root` 和 `alias` 两个指令，它们的路径拼接方式不同，使用时需要注意区分。

### 1. root 与 alias 的区别

| 特性 | `root` | `alias` |
|------|--------|---------|
| 路径拼接方式 | 将 `location` 匹配的路径**追加**到 `root` 后 | 将 `location` 匹配的路径**替换**为 `alias` 的值 |
| 适用场景 | 文件目录结构与 URL 路径一致 | 文件目录结构与 URL 路径不一致 |
| 末尾斜杠 | 不要求 | **必须**以 `/` 结尾 |
| 可用上下文 | `http`、`server`、`location` | 仅 `location` |

::: details root 示例

```nginx
# /etc/nginx/conf.d/static-root.conf
server {
    listen 80;
    server_name static.example.com;

    # 使用 root：请求 /images/logo.png
    # 实际文件路径 = /var/www/static + /images/logo.png
    #              = /var/www/static/images/logo.png
    location /images/ {
        root /var/www/static;
    }
}
```

:::

::: details alias 示例

```nginx
# /etc/nginx/conf.d/static-alias.conf
server {
    listen 80;
    server_name static.example.com;

    # 使用 alias：请求 /pictures/logo.png
    # 实际文件路径 = /var/www/images/ + logo.png（location 部分被替换）
    #              = /var/www/images/logo.png
    location /pictures/ {
        alias /var/www/images/;  # 注意末尾必须加 /
    }
}
```

:::

::: warning
使用 `alias` 时，末尾必须加斜杠 `/`，否则会导致路径拼接错误。例如 `alias /var/www/images` 会把请求 `/pictures/logo.png` 解析为 `/var/www/imageslogo.png`，导致 404 错误。
:::

### 2. index 指令

当请求的 URI 以 `/` 结尾时（即请求目录），`index` 指令指定 Nginx 自动查找的默认文件。

::: details index 配置

```nginx
server {
    listen 80;
    server_name www.example.com;

    root /var/www/website;

    # Nginx 会依次查找 index.html → index.htm
    # 找到第一个存在的文件即返回
    index index.html index.htm;

    location / {
        # 请求 / 时实际返回 /var/www/website/index.html
        try_files $uri $uri/ =404;
    }
}
```

:::

## 二、部署前端 SPA 应用

Vue、React 等单页应用（SPA）使用前端路由（History 模式），所有路由都指向同一个 `index.html`，由前端 JavaScript 根据 URL 渲染对应页面。这要求 Nginx 在找不到对应文件时回退到 `index.html`。

### 1. 构建并部署

::: details 构建和部署流程

```bash
# 在项目目录执行构建（以 Vue 3 + Vite 为例）
npm run build

# 构建产物在 dist/ 目录
ls dist/
# assets/  favicon.ico  index.html

# 将构建产物复制到 Nginx 静态目录
sudo mkdir -p /var/www/my-vue-app
sudo cp -r dist/* /var/www/my-vue-app/

# 设置文件权限
sudo chown -R nginx:nginx /var/www/my-vue-app
```

:::

### 2. Nginx 配置（History 模式）

::: details SPA 部署配置

```nginx{9}
# /etc/nginx/conf.d/my-vue-app.conf
server {
    listen 80;
    server_name app.example.com;

    root /var/www/my-vue-app;
    index index.html;

    location / {
        # 关键配置：优先查找文件 → 查找目录 → 回退到 index.html
        try_files $uri $uri/ /index.html;
    }

    # 静态资源设置长缓存（Vite 构建的资源文件名包含 hash）
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

:::

::: tip
`try_files $uri $uri/ /index.html;` 是 SPA 部署的核心。它的含义是：先查找请求对应的文件，再查找对应的目录，如果都不存在，就返回 `index.html`，由前端路由接管。
:::

### 3. React 应用的 basename 配置

如果你的 React 应用部署在子路径下（如 `https://example.com/admin/`），需要额外配置：

::: details React 子路径部署

```nginx
# /etc/nginx/conf.d/react-admin.conf
server {
    listen 80;
    server_name example.com;

    location /admin/ {
        alias /var/www/react-admin/;
        index index.html;
        try_files $uri $uri/ /admin/index.html;
    }
}
```

```js
// React 路由配置中设置 basename
// src/App.jsx
import { BrowserRouter } from 'react-router-dom';

function App() {
    return (
        <BrowserRouter basename="/admin">
            {/* 路由组件 */}
        </BrowserRouter>
    );
}
```

:::

## 三、目录列表功能

`autoindex` 模块可以让 Nginx 自动生成目录文件列表，适用于文件下载站或内部资源分享。

::: details 目录列表配置

```nginx
# /etc/nginx/conf.d/downloads.conf
server {
    listen 80;
    server_name files.example.com;

    root /var/www/downloads;

    location / {
        # 开启目录列表
        autoindex on;

        # 显示文件精确大小（off 则显示近似大小如 1M、200K）
        autoindex_exact_size off;

        # 使用服务器本地时间显示文件日期
        autoindex_localtime on;

        # 可选：输出 JSON 格式（便于前端自定义渲染）
        # autoindex_format json;
    }
}
```

:::

::: warning
生产环境中不要对敏感目录开启 `autoindex`，否则可能泄露目录结构和文件信息。建议仅对特定的公开下载路径启用，并配合访问控制。
:::

## 四、MIME 类型配置

Nginx 通过 MIME 类型告诉浏览器如何处理响应内容。如果 MIME 类型配置不正确，浏览器可能会下载文件而非渲染它。

### 1. 默认配置

Nginx 自带的 `mime.types` 文件已涵盖常见文件类型。你需要确保在 `http` 上下文中引入它：

::: details MIME 类型基础配置

```nginx
http {
    # 引入预定义的 MIME 类型映射
    include /etc/nginx/mime.types;

    # 未匹配到的文件类型默认以二进制流方式下载
    default_type application/octet-stream;
}
```

:::

### 2. 自定义 MIME 类型

如果你需要托管特殊格式的文件，可以在 `types` 块中添加自定义映射：

::: details 自定义 MIME 类型

```nginx
http {
    include /etc/nginx/mime.types;

    # 添加自定义 MIME 类型
    types {
        application/wasm          wasm;
        application/manifest+json webmanifest;
        font/woff2                woff2;
    }

    default_type application/octet-stream;
}
```

:::

## 五、Gzip 压缩

Gzip 压缩可以显著减小文本类静态资源的传输体积，通常能压缩到原始大小的 30% 左右，大幅提升页面加载速度。

### 1. Gzip 配置指令

| 指令 | 说明 | 推荐值 |
|------|------|--------|
| `gzip` | 是否启用 Gzip 压缩 | `on` |
| `gzip_vary` | 在响应头中添加 `Vary: Accept-Encoding` | `on` |
| `gzip_min_length` | 最小压缩字节数，小于此值不压缩 | `1024`（1KB） |
| `gzip_comp_level` | 压缩级别，1-9，越高压缩率越高但 CPU 消耗越大 | `5` |
| `gzip_types` | 需要压缩的 MIME 类型列表 | 见下方配置 |
| `gzip_proxied` | 代理请求的压缩条件 | `any` |
| `gzip_buffers` | 压缩缓冲区大小 | `16 8k` |
| `gzip_http_version` | 最低 HTTP 版本要求 | `1.1` |
| `gzip_disable` | 对匹配的 User-Agent 禁用压缩 | `"MSIE [1-6]\."` |

### 2. 完整 Gzip 配置

::: details Gzip 压缩配置

```nginx
# /etc/nginx/snippets/gzip.conf（或直接写在 http 上下文中）

# 启用 Gzip 压缩
gzip on;

# 添加 Vary 头，告知代理服务器缓存需区分压缩与非压缩版本
gzip_vary on;

# 小于 1KB 的文件不压缩（压缩后可能反而更大）
gzip_min_length 1024;

# 压缩级别 5，兼顾压缩率和 CPU 消耗
gzip_comp_level 5;

# 压缩的 MIME 类型（text/html 默认已包含，无需重复声明）
gzip_types
    text/plain
    text/css
    text/javascript
    text/xml
    application/json
    application/javascript
    application/xml
    application/xml+rss
    application/xhtml+xml
    image/svg+xml
    font/woff2;

# 对所有代理请求启用压缩
gzip_proxied any;

# 对旧版 IE 禁用 Gzip（避免解压异常）
gzip_disable "MSIE [1-6]\.";
```

:::

::: tip
`gzip_comp_level` 设置为 5 是最佳实践。级别 1-4 压缩率提升明显但 CPU 消耗低，级别 6-9 压缩率提升微小但 CPU 消耗急剧上升。5 是性价比最高的平衡点。
:::

### 3. 预压缩（gzip_static）

如果你在构建阶段已经生成了 `.gz` 文件，可以启用 `gzip_static` 模块，直接发送预压缩文件，避免实时压缩的 CPU 开销。

::: details 预压缩配置

```nginx
server {
    listen 80;
    server_name app.example.com;

    root /var/www/app;

    location /assets/ {
        # 优先发送 .gz 预压缩文件
        gzip_static on;
        expires 1y;
    }
}
```

```bash
# Vite 构建时生成 .gz 文件（安装 vite-plugin-compression）
# vite.config.js 中配置插件后，构建产物会同时生成 .js 和 .js.gz

ls /var/www/app/assets/
# index-abc123.js
# index-abc123.js.gz    ← Nginx 会优先发送这个文件
# style-def456.css
# style-def456.css.gz
```

:::

## 六、缓存控制

合理的缓存策略可以大幅减少重复请求，加快页面加载速度。Nginx 提供 `expires` 指令和 `add_header` 两种方式设置缓存头。

### 1. 缓存策略对比

| 资源类型 | 缓存策略 | 说明 |
|----------|----------|------|
| HTML 文件 | `no-cache` 或短缓存 | 确保用户始终获取最新版本 |
| 带 hash 的 JS/CSS | 强缓存 1 年 | 文件名包含内容 hash，内容变化 hash 就变 |
| 图片/字体 | 强缓存 30 天 | 变化频率低，长缓存节省带宽 |
| API 响应 | `no-store` | 动态数据不应缓存 |

### 2. 缓存配置示例

::: details 分类缓存策略配置

```nginx
# /etc/nginx/conf.d/cache-example.conf
server {
    listen 80;
    server_name www.example.com;

    root /var/www/website;
    index index.html;

    # HTML 文件：协商缓存，每次请求都验证是否更新
    location ~* \.html$ {
        add_header Cache-Control "no-cache";
    }

    # 带 hash 的静态资源（Vite/Webpack 构建产物）：强缓存 1 年
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 图片文件：缓存 30 天
    location ~* \.(jpg|jpeg|png|gif|webp|svg|ico)$ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # 字体文件：缓存 1 年
    location ~* \.(woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        # 允许跨域加载字体
        add_header Access-Control-Allow-Origin "*";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

:::

::: tip
`immutable` 是一个重要的缓存标志，它告诉浏览器在缓存有效期内不要发送条件请求验证。对于文件名包含内容 hash 的资源（如 `index-abc123.js`），使用 `immutable` 可以彻底避免 304 请求。
:::

## 七、图片与字体服务

### 1. 图片服务配置

::: details 图片资源托管

```nginx
# /etc/nginx/conf.d/images.conf
server {
    listen 80;
    server_name img.example.com;

    root /var/www/images;

    # 图片缓存策略
    location / {
        expires 30d;
        add_header Cache-Control "public";

        # 开启高效文件传输
        sendfile on;
        tcp_nopush on;

        # 限制单个请求的传输速率（防止大文件占满带宽）
        limit_rate 2m;  # 每秒最多传输 2MB
    }
}
```

:::

### 2. 防盗链配置

防盗链可以阻止其他网站直接引用你的图片资源，节省服务器带宽。

::: details 防盗链配置

```nginx
server {
    listen 80;
    server_name img.example.com;

    root /var/www/images;

    location ~* \.(jpg|jpeg|png|gif|webp|svg)$ {
        # valid_referers 定义合法的来源
        valid_referers none blocked
            example.com
            *.example.com
            ~\.google\.com
            ~\.baidu\.com;

        # 非法来源返回 403 或自定义图片
        if ($invalid_referer) {
            return 403;
            # 或者返回一张防盗链提示图
            # rewrite ^/ /anti-hotlink.png break;
        }

        expires 30d;
    }
}
```

:::

`valid_referers` 参数说明：

| 参数 | 说明 |
|------|------|
| `none` | 允许无 Referer 头的请求（直接在浏览器地址栏输入 URL） |
| `blocked` | 允许 Referer 头被防火墙/代理删除的请求 |
| `example.com` | 允许来自指定域名的请求 |
| `*.example.com` | 允许来自子域名的请求 |
| `~\.google\.com` | 正则匹配，允许搜索引擎抓取 |

::: warning
配置防盗链时，建议保留 `none` 和 `blocked` 参数，否则用户直接在浏览器打开图片链接也会被拦截，影响正常使用。
:::

## 八、多项目部署

在同一台服务器上，你可以通过不同的 `location` 路径部署多个前端项目。

### 1. 不同路径托管不同项目

::: details 多项目配置

```nginx
# /etc/nginx/conf.d/multi-app.conf
server {
    listen 80;
    server_name www.example.com;

    # 主站（Vue 3 项目）
    location / {
        root /var/www/main-site;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后台管理（React 项目），部署在 /admin 路径下
    location /admin/ {
        alias /var/www/admin-panel/;
        index index.html;
        try_files $uri $uri/ /admin/index.html;
    }

    # 文档站点（VitePress 项目），部署在 /docs 路径下
    location /docs/ {
        alias /var/www/docs-site/;
        index index.html;
        try_files $uri $uri/ /docs/index.html;
    }

    # 所有项目共享的静态资源（公共图片、字体等）
    location /shared/ {
        alias /var/www/shared-assets/;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

:::

### 2. 不同子域名托管不同项目

如果你有多个子域名，每个子域名对应一个独立项目，推荐使用独立的 `server` 块：

::: details 子域名多项目配置

```nginx
# /etc/nginx/conf.d/main.conf — 主站
server {
    listen 80;
    server_name www.example.com example.com;

    root /var/www/main-site;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# /etc/nginx/conf.d/admin.conf — 后台管理
server {
    listen 80;
    server_name admin.example.com;

    root /var/www/admin-panel;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 仅允许公司内网访问
    allow 10.0.0.0/8;
    deny all;
}

# /etc/nginx/conf.d/api-docs.conf — API 文档
server {
    listen 80;
    server_name docs.example.com;

    root /var/www/api-docs;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

:::

::: tip
子域名方式比子路径方式更简洁，不需要处理 `basename` 和 `alias` 的路径问题。但需要提前配置好 DNS 解析，将所有子域名指向服务器 IP。可以使用泛域名解析 `*.example.com` 简化 DNS 配置。
:::

## 九、完整实战配置

以下是一个整合了静态托管、Gzip 压缩、缓存策略和防盗链的完整生产配置：

::: details 生产环境完整配置

```nginx{10,15,22,36,46}
# /etc/nginx/conf.d/production-static.conf
server {
    listen 80;
    server_name www.example.com;

    root /var/www/production-app;
    index index.html;
    charset utf-8;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 5;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # HTML 入口文件：协商缓存
    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 构建产物（带 hash）：强缓存
    location /assets/ {
        gzip_static on;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 图片资源：缓存 + 防盗链
    location ~* \.(jpg|jpeg|png|gif|webp|svg|ico)$ {
        expires 30d;
        add_header Cache-Control "public";

        valid_referers none blocked example.com *.example.com;
        if ($invalid_referer) {
            return 403;
        }
    }

    # 字体文件：长缓存 + 跨域
    location ~* \.(woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }

    # 禁止访问隐藏文件（.git, .env 等）
    location ~ /\. {
        deny all;
        return 404;
    }

    # 自定义错误页
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

:::

::: danger
生产环境务必添加 `location ~ /\. { deny all; }` 规则，防止 `.env`、`.git` 等敏感隐藏文件被意外访问。这是一个常见的安全漏洞。
:::
