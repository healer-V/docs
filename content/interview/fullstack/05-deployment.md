---
title: "部署与运维面试题"
category: "面试题"
tags:
  - Docker
  - Nginx
  - CI/CD
  - 发布
excerpt: "围绕 Docker 镜像分层与多阶段构建、容器与虚拟机、Nginx 反向代理与负载均衡、SPA 路由回退、静态资源缓存、HTTPS、健康检查、蓝绿与金丝雀发布、配置与日志管理等面试题，说明部署方案的作用和失败场景。"
---

# 部署与运维面试题

全栈开发者需要把代码变成稳定运行的服务：构建可复现的产物，让流量通过反向代理到达健康的实例，并在发布出错时快速恢复。部署题考查的是每个环节出问题时会有什么现象、如何发现、怎样回退。

## 一、容器

### 1. 容器和虚拟机有什么区别？

**虚拟机通过 Hypervisor 虚拟出完整硬件，每台虚拟机运行自己的操作系统内核；容器共享宿主机内核，用 Linux 的 namespace 隔离进程、网络和文件系统视图，用 cgroups 限制 CPU 和内存。**

| 维度 | 容器 | 虚拟机 |
|------|------|--------|
| 内核 | 共享宿主机内核 | 每台独立内核 |
| 启动时间 | 秒级甚至更快 | 分钟级 |
| 镜像大小 | 通常几十到几百 MB | 通常数 GB |
| 隔离强度 | 进程级，内核漏洞可能影响所有容器 | 硬件级，更强 |

容器的轻量来自共享内核，代价是隔离较弱：在 Linux 宿主机上不能运行需要 Windows 内核的容器，容器以 root 运行且被攻破时风险更大。生产镜像应使用非 root 用户运行，多租户执行不可信代码时可使用 gVisor、Kata Containers 等强化隔离方案。

参考：[Docker：什么是容器](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/)。

### 2. Docker 镜像如何分层，如何减小镜像体积和加快构建？

**Dockerfile 中 `RUN`、`COPY`、`ADD` 等指令各生成一个只读层，镜像由这些层叠加而成；构建时某一层的输入没有变化，就复用缓存，之后的层才需要重新构建。**

所以应把变化少的步骤放在前面：先复制 `package.json` 和锁文件安装依赖，再复制源码。只修改源码时，依赖安装层直接命中缓存。多阶段构建在一个阶段中编译，最终镜像只复制运行需要的产物，不包含编译工具和源码：

::: details 查看 Node.js 应用的多阶段 Dockerfile

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

:::

这份 Dockerfile 假定项目有 `build` 脚本并输出到 `dist/server.js`。其他要点包括：用 `.dockerignore` 排除 `node_modules`、`.git` 和本地环境文件；同一个 `RUN` 中安装并清理临时文件，因为在后续层删除文件不会减小前一层的体积；不要把密钥写入镜像层，用 `docker history` 可以看到每一层的构建命令。

参考：[Docker：多阶段构建](https://docs.docker.com/build/building/multi-stage/)、[Docker：构建缓存](https://docs.docker.com/build/cache/)。

## 二、Nginx 与流量

### 1. 正向代理和反向代理有什么区别，Nginx 如何做负载均衡？

**正向代理代表客户端访问外部服务，服务端看到的是代理的地址；反向代理代表服务端接收请求，客户端只知道代理的地址，不知道后端有哪些实例。** Nginx 常作为反向代理，负责 TLS 终止、负载均衡、静态文件和限流。

| 负载均衡策略 | 配置 | 特点 |
|--------------|------|------|
| 轮询 | 默认 | 依次分配，可用 `weight` 设置权重 |
| 最少连接 | `least_conn` | 适合请求处理时间差异大的场景 |
| IP 哈希 | `ip_hash` | 同一客户端 IP 固定到同一实例 |
| 通用哈希 | `hash $request_uri consistent` | 按指定键一致性哈希，适合缓存命中 |

反向代理后，后端看到的客户端地址变成 Nginx 的地址，需要通过 `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for` 传递真实 IP，后端只信任来自已知代理的该请求头，否则客户端可以伪造它。WebSocket 代理需要额外设置 `Upgrade` 和 `Connection` 请求头。

参考：[Nginx：HTTP 负载均衡](https://nginx.org/en/docs/http/load_balancing.html)、[Nginx：WebSocket 代理](https://nginx.org/en/docs/http/websocket.html)。

### 2. SPA 部署后刷新页面为什么会 404？

**使用 History 模式的单页应用，`/orders/1001` 这样的路径只存在于前端路由中；直接访问或刷新时，浏览器向服务器请求这个路径，服务器上没有对应文件就返回 404。**

解决方法是让服务器对找不到文件的路径返回 `index.html`，由前端路由接管。Nginx 的局部配置如下：

```nginx
location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
}
```

`try_files` 依次尝试请求路径对应的文件、目录，都不存在时返回 `index.html`。这样一来，服务器对任何未知路径都返回 200，前端路由需要自己渲染 404 页面；接口路径应放在单独的 `location /api/` 中转发到后端，不能被回退到 `index.html`，否则接口错误会返回一段 HTML。

参考：[Vue Router：服务器配置示例](https://router.vuejs.org/guide/essentials/history-mode.html#Example-Server-Configurations)、[Nginx：try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)。

### 3. 前端静态资源的缓存策略应如何设置？

**带内容哈希的文件（如 `app.3f9a1c.js`）设置长期强缓存；`index.html` 不缓存或每次协商验证。** 这样发布新版本时，用户重新获取 HTML 就能拿到引用新文件名的资源，而未变化的资源继续命中缓存。

| 资源 | 响应头 | 原因 |
|------|--------|------|
| 带哈希的 JS、CSS、图片 | `Cache-Control: public, max-age=31536000, immutable` | 内容变化文件名就变化，可以永久缓存 |
| `index.html` | `Cache-Control: no-cache` | 每次向服务器验证，确保引用最新资源 |
| 无哈希的接口数据 | 按业务设置，或 `no-store` | 避免用户看到过期或他人的数据 |

`no-cache` 不是“不缓存”，而是“使用前必须验证”，配合 `ETag` 时未变化返回 304，只传输响应头。发布时应先上传新的静态资源，再更新 `index.html`，并保留旧版本资源一段时间，否则已打开旧页面的用户在懒加载路由时会请求到已删除的文件。

参考：[MDN：HTTP 缓存](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)、[web.dev：HTTP 缓存](https://web.dev/articles/http-cache)。

### 4. HTTPS 的握手过程和证书校验做了什么？

**HTTPS 是 HTTP 运行在 TLS 之上。TLS 握手中，客户端校验服务端证书确认对方身份，双方通过密钥交换协商出会话密钥，之后用对称加密传输数据。**

TLS 1.3 的完整握手只需一次往返：客户端在 `ClientHello` 中直接发送密钥交换参数，服务端返回自己的参数、证书和签名，双方即可计算出相同的会话密钥。证书校验包括：证书链能追溯到操作系统或浏览器信任的根证书，证书中的域名与访问的域名匹配，证书在有效期内且未被吊销。

部署时常见的问题有：服务器只配置了站点证书而没有中间证书，部分客户端校验失败；证书过期导致整站不可用，应使用 ACME 协议（如 Let's Encrypt）自动续期并设置到期告警；开启 HSTS（`Strict-Transport-Security`）后浏览器只用 HTTPS 访问，回退到 HTTP 前需要等待其过期时间。

参考：[RFC 8446：TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446)、[MDN：Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security)。

## 三、发布与运行

### 1. 健康检查中存活探针和就绪探针有什么区别？

**存活探针（liveness）判断进程是否需要重启，就绪探针（readiness）判断实例当前是否可以接收流量。** Kubernetes 中存活探针失败会重启容器，就绪探针失败只把实例从 Service 的后端列表中摘除。

应用启动时需要加载配置、建立数据库连接，这期间就绪探针应返回失败，避免流量提前进入；数据库暂时不可用时，就绪探针可以返回失败以摘除流量，但存活探针不应检查数据库，否则数据库故障会导致所有实例被反复重启，故障进一步扩大。存活探针只检查进程本身是否卡死。启动较慢的应用应配置启动探针（startup），在启动完成前暂停存活检查。

参考：[Kubernetes：配置存活、就绪和启动探针](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)。

### 2. 滚动发布、蓝绿发布和金丝雀发布有什么区别？

**三者都用于在不停机的情况下替换版本，区别在于新旧版本如何共存、流量如何切换。**

| 方式 | 过程 | 优点 | 代价 |
|------|------|------|------|
| 滚动发布 | 逐批用新实例替换旧实例 | 不需要额外资源 | 发布期间新旧版本同时服务，回退较慢 |
| 蓝绿发布 | 部署一套完整的新环境，一次性切换流量 | 切换和回退都很快 | 需要双倍资源 |
| 金丝雀发布 | 先把小比例流量导到新版本，观察后逐步放大 | 问题影响范围小 | 需要按比例或按用户分流的能力 |

无论哪种方式，都会有一段时间新旧版本同时运行，所以接口和数据库变更必须前后兼容。数据库字段重命名应拆成多次发布：先新增字段并双写，再迁移数据、切换读取，最后删除旧字段。金丝雀阶段要预先定义判断指标（错误率、延迟、关键业务成功率）和自动回退条件。

参考：[Kubernetes：Deployment 滚动更新](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment)、[Martin Fowler：BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)。

### 3. 配置和密钥应如何管理？

**同一份构建产物应能部署到不同环境，环境差异通过配置注入，而不是为每个环境单独构建。** 这符合十二要素应用中“配置存储在环境中”的原则。

数据库地址、第三方接口地址等通过环境变量或配置中心注入；密码、API 密钥等敏感信息存放在 Kubernetes Secret、云厂商的密钥管理服务或 Vault 中，按最小权限授权给服务读取。密钥不提交到代码仓库，一旦误提交，删除提交记录不够，必须立即在服务提供方作废并更换。

前端项目要特别注意：Vite 中以 `VITE_` 开头的环境变量、Next.js 中以 `NEXT_PUBLIC_` 开头的环境变量会在构建时写入浏览器端代码，任何用户都能看到，不能存放密钥。

参考：[The Twelve-Factor App：配置](https://12factor.net/config)、[Vite：环境变量](https://vite.dev/guide/env-and-mode.html)。

### 4. 线上服务出现故障，排查思路是什么？

**先止损再定位：确认影响范围后优先回退或摘除异常实例，恢复服务后再分析根因。**

1. **确认现象：** 通过监控确认是哪些接口、哪些地区、从什么时间开始出现错误或变慢，与告警时间附近的发布、配置变更和流量变化对照。
2. **止损：** 与最近变更相关时直接回退；单个实例异常时摘除该实例；下游依赖故障时启用降级或熔断。
3. **定位：** 按请求链路查看日志和链路追踪，用追踪 ID 串起网关、服务和数据库的记录，判断错误发生在哪一层；再看实例的 CPU、内存、连接数和慢查询。
4. **复盘：** 记录时间线、根因和改进项，例如补充告警、增加测试或调整发布流程，避免同类问题再次发生。

这个过程依赖平时的可观测性建设：结构化日志、指标监控和分布式追踪需要在故障前就已接入。OpenTelemetry 提供了统一采集这三类数据的标准。

参考：[Google SRE：有效的故障排查](https://sre.google/sre-book/effective-troubleshooting/)、[OpenTelemetry：可观测性入门](https://opentelemetry.io/docs/concepts/observability-primer/)。
