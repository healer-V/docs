---
title: "Nginx 反向代理服务器"
category: "运维 · Nginx"
tags:
  - Nginx
  - 运维
  - 反向代理
excerpt: "Nginx 是高性能的 HTTP 和反向代理服务器，基于事件驱动的异步非阻塞架构，能以极低的资源消耗处理数万并发连接，是互联网最主流的 Web 服务器之一。"
date: 2026-03-17
---

# Nginx 反向代理服务器

Nginx（发音 "engine-x"）是一款高性能的 HTTP 和反向代理服务器，同时也是 IMAP/POP3/SMTP 代理服务器。凭借事件驱动、异步非阻塞的架构设计，Nginx 能以极低的资源消耗处理大量并发连接，是当前互联网最主流的 Web 服务器之一。

## 一、核心优势

| 优势 | 说明 |
|------|------|
| **高并发** | 基于事件驱动的异步架构，轻松支撑数万并发连接 |
| **低内存** | 相比 Apache，内存和 CPU 占用极低，1MB 内存可维持上千连接 |
| **反向代理** | 作为统一入口转发请求到后端服务，是微服务架构的标配 |
| **负载均衡** | 内置多种负载均衡策略，实现流量的智能分发 |
| **高可用** | 支持热部署、平滑重载配置，服务零停机升级 |
| **静态托管** | 高效托管 HTML、CSS、JS、图片等静态资源 |

::: tip Nginx vs Apache
Nginx 采用异步非阻塞 I/O 模型，每个 Worker 进程可以同时处理数千个连接；而 Apache 默认采用同步阻塞模型，每个请求独占一个线程。这使 Nginx 在高并发场景下内存占用远低于 Apache。
:::

## 二、适用场景

Nginx 适用于以下常见场景：

- **静态资源托管**：高效提供 HTML、CSS、JS、图片等文件
- **反向代理**：将请求转发到后端 API 服务（Node.js、Java、Python 等）
- **负载均衡**：将流量均匀分发到多台后端服务器
- **HTTPS 终结**：统一处理 SSL/TLS 证书，后端服务无需关心加密
- **SPA 应用部署**：配合 `try_files` 支持 Vue / React History 路由模式
- **WebSocket 代理**：透明转发 WebSocket 长连接请求
- **限流与访问控制**：防止恶意请求、保护后端服务

## 三、技术栈

| 类别 | 工具 / 说明 |
|------|-------------|
| **核心软件** | Nginx 开源版 / OpenResty（内嵌 Lua 脚本能力） |
| **证书工具** | Let's Encrypt、Certbot（免费自动续期 SSL 证书） |
| **配置语法** | Nginx 指令与上下文（main / events / http / server / location） |
| **日志分析** | GoAccess（实时分析）、ELK Stack（集中化日志） |
| **进程管理** | systemd / Supervisor（守护 Nginx 进程） |

## 四、学习路线

按以下顺序学习，可以快速从入门到生产实战：

### 1. 基础配置

1. **[安装与配置](./01-installation)**：在 Ubuntu / CentOS / macOS 上安装 Nginx，掌握启停和基本管理命令
2. **[配置文件详解](./02-config)**：理解 `nginx.conf` 的层级结构，掌握 `http`、`server`、`location` 三大上下文

### 2. 核心功能

3. **[静态资源服务](./03-static)**：配置静态文件托管，`root` vs `alias` 区别，部署 Vue / React SPA 应用
4. **[反向代理](./04-reverse-proxy)**：将请求转发到后端服务，`proxy_pass` 路径规则，解决跨域问题
5. **[负载均衡](./05-load-balance)**：配置多后端节点的流量分发策略，健康检查，会话保持

### 3. 生产必备

6. **[HTTPS 配置](./06-https)**：申请 SSL 证书、配置 TLS，使用 Certbot 自动续期
7. **[性能优化](./07-performance)**：Gzip 压缩、缓存策略、Worker 调优、连接复用
8. **[日志管理](./08-logging)**：访问日志与错误日志的配置、格式自定义、日志切割与分析

### 4. 综合实战

9. **[实战案例](./09-practice)**：前后端分离部署、多域名配置、WebSocket 代理、灰度发布

::: warning 学习前提
本系列文档假设你已具备基础的 Linux 操作能力（文件操作、权限管理、systemd 服务管理）。如尚不熟悉，建议先学习 [Linux 基础](../00-linux/index) 章节。
:::

## 五、快速上手

如果你是第一次使用 Nginx，可以按以下步骤快速启动一个静态文件服务：

::: details 5 分钟快速启动（Ubuntu）

```bash
# 1. 安装 Nginx
sudo apt update && sudo apt install nginx -y

# 2. 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx

# 3. 验证是否成功（应看到 200 状态码）
curl -I http://localhost

# 4. 查看默认配置
cat /etc/nginx/conf.d/default.conf
```

访问服务器 IP，看到 "Welcome to nginx!" 页面即表示安装成功。

:::

::: details 最简单的静态站点配置

```nginx
# /etc/nginx/conf.d/mysite.conf
server {
    listen 80;
    server_name example.com;

    root /var/www/mysite;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

修改配置后执行：

```bash
# 检查语法
sudo nginx -t

# 重载配置（不中断服务）
sudo nginx -s reload
```

:::
