---
title: "HTTPS 配置"
category: "运维 · Nginx"
tags:
  - Nginx
  - HTTPS
  - SSL/TLS
excerpt: "HTTPS 通过 SSL/TLS 加密保护数据传输安全，正确配置 Nginx 的 HTTPS 是生产环境部署的必备技能。"
date: 2026-03-15
---

# HTTPS 配置

## 一、HTTPS 基础

### 1. 为什么需要 HTTPS

HTTP 协议以明文传输数据，在网络传输过程中存在三大安全风险：

| 风险 | 说明 | HTTPS 如何解决 |
|------|------|----------------|
| **窃听** | 第三方可截获传输内容（密码、Cookie） | SSL/TLS 加密，传输内容不可读 |
| **篡改** | 中间人修改数据（如注入广告） | 数据完整性校验，篡改即失效 |
| **伪装** | 钓鱼网站冒充正规网站 | 数字证书验证服务器身份 |

除安全因素外，HTTPS 还是现代 Web 的基础设施要求：

- 搜索引擎对 HTTPS 站点有排名加权
- HTTP/2 协议强制要求 HTTPS
- 浏览器对 HTTP 站点标记"不安全"警告
- Service Worker、Geolocation 等 API 仅在 HTTPS 下可用

### 2. TLS 握手流程（简化版）

```
客户端                                    服务器
  │                                         │
  ├── ClientHello（支持的 TLS 版本、加密套件）──→│
  │                                         │
  │←── ServerHello（选定的版本和加密套件）─────┤
  │←── 证书（含公钥）─────────────────────────┤
  │←── ServerHelloDone ─────────────────────┤
  │                                         │
  ├── 用公钥加密预主密钥 ───────────────────→│
  ├── ChangeCipherSpec ────────────────────→│
  ├── Finished（加密验证）─────────────────→│
  │                                         │
  │←── ChangeCipherSpec ─────────────────────┤
  │←── Finished（加密验证）──────────────────┤
  │                                         │
  │←─────── 加密通信开始 ──────────────────→│
```

TLS 1.3 将握手从 2-RTT 优化到 1-RTT，首次连接速度显著提升。

---

## 二、证书类型

SSL 证书按照验证级别分为三类，选择哪种取决于你的业务需求。

| 类型 | 全称 | 验证内容 | 签发时间 | 费用 | 适用场景 |
|------|------|----------|----------|------|----------|
| **DV** | Domain Validation | 仅验证域名所有权 | 分钟级 | 免费 ~ 低 | 个人网站、博客、内部系统 |
| **OV** | Organization Validation | 验证域名 + 企业身份 | 1-3 天 | 中等 | 企业官网、电商平台 |
| **EV** | Extended Validation | 严格验证企业资质 | 1-2 周 | 较高 | 银行、金融、政府网站 |

::: tip 大多数场景 DV 证书足够
Let's Encrypt 提供免费的 DV 证书，自动签发、自动续期，对于绝大多数网站来说已经足够。OV 和 EV 证书主要面向需要展示企业身份的场景。
:::

---

## 三、Let's Encrypt 免费证书

Let's Encrypt 是一个非营利性证书颁发机构，提供免费的 DV 证书，配合 Certbot 工具可以实现全自动申请和续期。

### 1. 安装 Certbot

::: details Ubuntu / Debian 安装 Certbot
```bash
# 更新包列表
sudo apt update

# 安装 Certbot 和 Nginx 插件
sudo apt install -y certbot python3-certbot-nginx

# 验证安装
certbot --version
```
:::

::: details CentOS / Rocky Linux 安装 Certbot
```bash
# 安装 EPEL 源
sudo dnf install -y epel-release

# 安装 Certbot 和 Nginx 插件
sudo dnf install -y certbot python3-certbot-nginx

# 验证安装
certbot --version
```
:::

### 2. 申请证书

::: details 使用 Certbot 自动申请并配置
```bash
# 自动申请证书并修改 Nginx 配置（推荐）
sudo certbot --nginx -d example.com -d www.example.com

# 交互过程中 Certbot 会：
# 1. 验证你对域名的控制权（通过 HTTP-01 challenge）
# 2. 自动下载证书到 /etc/letsencrypt/live/example.com/
# 3. 自动修改 Nginx 配置，添加 SSL 相关指令
# 4. 可选择是否自动配置 HTTP → HTTPS 重定向
```
:::

::: details 仅申请证书，手动配置 Nginx
```bash
# 只申请证书，不自动修改 Nginx 配置
sudo certbot certonly --nginx -d example.com -d www.example.com

# 证书文件位置：
# 证书文件：/etc/letsencrypt/live/example.com/fullchain.pem
# 私钥文件：/etc/letsencrypt/live/example.com/privkey.pem
```
:::

### 3. 自动续期

Let's Encrypt 证书有效期为 90 天，Certbot 安装后会自动配置定时任务进行续期。

::: details 验证自动续期
```bash
# 测试续期流程（不会真正续期）
sudo certbot renew --dry-run

# 查看定时任务
sudo systemctl list-timers | grep certbot

# 手动续期（一般不需要）
sudo certbot renew
```
:::

::: warning 确保 80 端口可访问
Certbot 默认使用 HTTP-01 验证方式，需要 Let's Encrypt 服务器能通过 80 端口访问你的域名。如果 80 端口被防火墙阻止或未正确解析域名，验证会失败。
:::

---

## 四、手动配置 SSL 证书

如果你从其他 CA 机构购买了证书，或者需要精细控制 SSL 配置，可以手动配置。

::: details 手动 HTTPS 配置
```nginx{5-6,9-11}
# /etc/nginx/conf.d/app.conf
server {
    listen 443 ssl;
    server_name example.com www.example.com;

    ssl_certificate /etc/nginx/ssl/example.com/fullchain.pem;      # 完整证书链
    ssl_certificate_key /etc/nginx/ssl/example.com/privkey.pem;     # 私钥文件

    # 确保证书链完整（中间证书 + 服务器证书）
    # fullchain.pem 应包含：服务器证书 + 中间证书
    # 如果 CA 分别提供了这些文件，你需要手动拼接：
    # cat server.crt intermediate.crt > fullchain.pem

    root /var/www/html;
    index index.html;
}
```
:::

::: danger 私钥文件权限
私钥文件（`.key` 或 `privkey.pem`）必须严格控制访问权限，只有 root 和 Nginx worker 进程能读取。建议设置为 `chmod 600`，避免被其他用户或进程读取导致证书泄露。
:::

---

## 五、HTTP 强制跳转 HTTPS

配置好 HTTPS 后，你需要确保所有 HTTP 请求自动跳转到 HTTPS，避免用户通过不安全的连接访问。

::: details HTTP 301 重定向到 HTTPS
```nginx
# /etc/nginx/conf.d/app.conf

# HTTP → HTTPS 重定向
server {
    listen 80;
    server_name example.com www.example.com;

    # 301 永久重定向，搜索引擎会更新索引
    return 301 https://$host$request_uri;
}

# HTTPS 主配置
server {
    listen 443 ssl;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    root /var/www/html;
    index index.html;
}
```
:::

::: tip 为什么用 return 而不是 rewrite
`return 301` 的性能优于 `rewrite ... redirect`，因为 `return` 直接返回响应，不需要进入正则匹配。对于简单的协议跳转，始终优先使用 `return`。
:::

---

## 六、SSL/TLS 协议优化

默认的 SSL 配置可以工作，但不一定安全或高效。你需要手动调整协议版本和加密套件。

### 1. 协议版本

::: details SSL/TLS 协议版本配置
```nginx{3-4}
server {
    listen 443 ssl;
    # 只启用 TLS 1.2 和 TLS 1.3，禁用不安全的旧版本
    ssl_protocols TLSv1.2 TLSv1.3;

    # ...
}
```
:::

| 协议版本 | 安全性 | 建议 |
|----------|--------|------|
| SSLv2 / SSLv3 | 已被攻破，极不安全 | 必须禁用 |
| TLS 1.0 | 存在已知漏洞 | 应禁用 |
| TLS 1.1 | 安全性不足 | 应禁用 |
| TLS 1.2 | 安全 | 推荐启用 |
| TLS 1.3 | 最安全，性能最优 | 强烈推荐 |

### 2. 加密套件配置

::: details 推荐的加密套件配置
```nginx
server {
    listen 443 ssl;

    ssl_protocols TLSv1.2 TLSv1.3;

    # TLS 1.2 使用的加密套件（按安全强度排序）
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;

    # 优先使用服务器端的加密套件顺序
    ssl_prefer_server_ciphers on;

    # TLS 1.3 的加密套件由协议自动协商，无需手动配置
}
```
:::

::: warning 不要使用 ALL 或 HIGH
`ssl_ciphers ALL` 或 `ssl_ciphers HIGH` 会包含不安全的加密套件。始终显式指定安全的套件列表，并使用 `ssl_prefer_server_ciphers on` 确保按你定义的优先级使用。
:::

---

## 七、HSTS 安全头

HSTS（HTTP Strict Transport Security）告诉浏览器"在指定时间内，该域名只能通过 HTTPS 访问"。即使用户手动输入 `http://`，浏览器也会自动转为 `https://`。

::: details HSTS 配置
```nginx
server {
    listen 443 ssl;
    server_name example.com;

    # HSTS：浏览器在 1 年内强制使用 HTTPS
    # includeSubDomains：所有子域名也强制 HTTPS
    # preload：允许加入浏览器预加载列表
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
}
```
:::

::: danger HSTS 不可轻易撤销
一旦启用 HSTS 且 `max-age` 较长，浏览器会在该期间内强制 HTTPS。如果你的证书过期或需要回退到 HTTP，用户将无法访问你的网站。建议先用较短的 `max-age`（如 300 秒）测试，确认无误后再延长。
:::

---

## 八、OCSP Stapling

每次 TLS 握手时，浏览器需要向 CA 查询证书是否被吊销（OCSP 查询）。这个过程会增加延迟。OCSP Stapling 让 Nginx 主动向 CA 获取 OCSP 响应并缓存，然后在 TLS 握手时直接发给客户端，减少一次网络往返。

::: details OCSP Stapling 配置
```nginx{5-11}
server {
    listen 443 ssl;
    server_name example.com;

    # 启用 OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;

    # CA 根证书链（用于验证 OCSP 响应）
    # Let's Encrypt 用户使用 fullchain.pem 即可
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/fullchain.pem;

    # DNS 解析器（用于 Nginx 向 CA 发起 OCSP 请求）
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
}
```
:::

验证 OCSP Stapling 是否生效：

::: details 测试 OCSP Stapling
```bash
# 测试 OCSP Stapling 是否正常工作
openssl s_client -connect example.com:443 -status -servername example.com 2>/dev/null | grep -A 1 "OCSP Response Status"

# 正常输出应包含：
# OCSP Response Status: successful (0x0)
```
:::

---

## 九、HTTP/2 配置

HTTP/2 协议相比 HTTP/1.1 有显著的性能优势：多路复用、头部压缩、服务器推送。在 Nginx 中启用 HTTP/2 非常简单。

::: details 启用 HTTP/2
```nginx{3}
server {
    # 在 listen 指令中添加 http2 参数即可
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # 其余配置不变
}
```
:::

::: tip Nginx 版本要求
- HTTP/2 支持需要 Nginx 1.9.5 以上版本
- HTTP/2 强制要求 HTTPS，不能在 HTTP 明文连接上使用
- 从 Nginx 1.25.1 开始，`http2` 参数从 `listen` 指令中独立出来，改为 `http2 on;` 指令

如果你的 Nginx 版本较新（1.25.1+），应该这样写：
```nginx
listen 443 ssl;
http2 on;
```
:::

---

## 十、SSL Session 缓存

SSL/TLS 握手是一个计算密集的过程。通过缓存 Session，客户端后续连接可以复用之前的握手结果，跳过完整握手，显著减少延迟。

::: details SSL Session 缓存配置
```nginx
# 通常在 http 块中配置，对所有 server 生效
http {
    # 共享缓存，所有 worker 进程共用
    # SSL:10m 表示缓存名称为 SSL，大小 10MB（约可存储 4 万个 Session）
    ssl_session_cache shared:SSL:10m;

    # Session 有效期 24 小时
    ssl_session_timeout 24h;

    # 启用 Session Tickets（TLS 1.2，TLS 1.3 有自己的机制）
    ssl_session_tickets on;
}
```
:::

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| `ssl_session_cache` | `shared:SSL:10m` | 10MB 共享缓存，约 4 万个 Session |
| `ssl_session_timeout` | `24h` | 缓存 24 小时，平衡安全与性能 |
| `ssl_session_tickets` | `on` | 减少服务器端存储压力 |

---

## 十一、安全响应头

除了 HTTPS 本身，你还需要配置一些安全相关的 HTTP 响应头，防御常见的 Web 攻击。

### 1. 安全头说明

| 响应头 | 作用 | 推荐值 |
|--------|------|--------|
| `X-Frame-Options` | 防止页面被嵌入 iframe（点击劫持） | `DENY` 或 `SAMEORIGIN` |
| `X-Content-Type-Options` | 禁止浏览器猜测 MIME 类型 | `nosniff` |
| `X-XSS-Protection` | 启用浏览器 XSS 过滤器 | `1; mode=block` |
| `Content-Security-Policy` | 控制页面可加载的资源来源 | 按需配置 |
| `Referrer-Policy` | 控制 Referer 头的发送策略 | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | 控制浏览器功能（相机、麦克风等）的使用权限 | 按需配置 |

### 2. 完整安全头配置

::: details Nginx 安全响应头配置
```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # 防点击劫持
    add_header X-Frame-Options "SAMEORIGIN" always;

    # 禁止 MIME 类型嗅探
    add_header X-Content-Type-Options "nosniff" always;

    # XSS 防护
    add_header X-XSS-Protection "1; mode=block" always;

    # 内容安全策略（根据实际资源来源调整）
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: cdn.example.com;" always;

    # Referer 策略
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 权限策略
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```
:::

::: warning add_header 的作用域
Nginx 的 `add_header` 指令有一个容易忽略的特性：如果在 `location` 块中定义了任何 `add_header`，则上层（`server` 块）的 `add_header` 会全部失效。建议将安全头提取到 `snippets/security-headers.conf` 中，在每个需要的 `location` 中 `include` 引入。
:::

---

## 十二、SSL 检测与评分

配置完成后，你应该通过专业工具验证 HTTPS 配置的安全等级。

### 1. SSL Labs 在线检测

访问 [https://www.ssllabs.com/ssltest/](https://www.ssllabs.com/ssltest/)，输入你的域名，等待扫描完成。

评分等级说明：

| 等级 | 含义 |
|------|------|
| **A+** | 最高安全等级，启用了 HSTS |
| **A** | 安全配置良好 |
| **B** | 存在轻微安全隐患（如支持 TLS 1.0） |
| **C / D / F** | 存在严重安全问题，需要立即修复 |

### 2. 命令行检测

::: details 使用 openssl 和 curl 测试
```bash
# 查看证书信息
openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -dates -subject

# 查看支持的 TLS 版本
openssl s_client -connect example.com:443 -tls1_2 </dev/null 2>/dev/null | grep "Protocol"
openssl s_client -connect example.com:443 -tls1_3 </dev/null 2>/dev/null | grep "Protocol"

# 检查安全头
curl -I https://example.com 2>/dev/null | grep -iE "(strict-transport|x-frame|x-content-type|x-xss|content-security)"
```
:::

### 3. 获得 A+ 评分的完整配置

::: details 面向 A+ 评分的完整 HTTPS 配置模板
```nginx{4-7,10-16,19-26,29-34}
# /etc/nginx/conf.d/secure-app.conf

server {
    listen 80;
    server_name example.com www.example.com;
    # 强制跳转 HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    # 证书配置
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # 协议与加密套件
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;  # TLS 1.3 环境下建议关闭

    # Session 缓存
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 24h;
    ssl_session_tickets off;  # 关闭 Session Tickets 以获得前向安全性

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # 安全响应头
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 网站内容
    root /var/www/html;
    index index.html;
}
```
:::

::: tip 定期复查
SSL/TLS 安全标准在持续更新，之前安全的配置可能随着新漏洞的发现而变得不安全。建议每季度通过 SSL Labs 重新检测一次，及时更新配置。
:::
