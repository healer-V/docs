---
title: "连接与 DNS 检查"
tags:
  - Linux
  - DNS
  - 网络排障
excerpt: "按接口、地址、路由、监听、DNS 与应用响应分层检查连接故障，并用本机 HTTP 服务验证各类证据的边界。"
date: 2026-09-24
---

# 连接与 DNS 检查

“访问失败”不是一个根因。连接建立前，主机必须选出接口、源地址和路由；目标主机必须有进程监听对应地址与端口；使用域名时还要先完成解析。任何一层失败，客户端都可能只显示超时或连接错误。

本文使用绑定在 `127.0.0.1:18080` 的本机 HTTP 服务建立可控基线，再分别制造“无监听”和“名称无法解析”。本地回环流量不经过外部网络，适合先学会识别证据，但不能代替跨主机链路验证。

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可运行的 Linux 实验机。文中输出只描述应观察的字段和结果类型，不代表实际执行记录。
:::

## 一、分层证据

诊断应从本机状态向目标服务推进。上一层证据成立，才能把问题范围缩小到下一层。

### 1. 检查顺序

| 层次 | 核心问题 | 命令 | 成功证据 |
|------|----------|------|----------|
| 接口 | 出口接口是否可用 | `ip -brief link` | 接口存在且管理状态可用 |
| 地址 | 是否有合适源地址 | `ip -brief address` | 接口持有预期网段地址 |
| 路由 | 内核如何到达目标 | `ip route get TARGET` | 出口、下一跳、源地址合理 |
| 监听 | 目标端口是否由进程接收 | `ss -lntp` | 地址与端口匹配 |
| DNS | 名称能否解析 | `resolvectl query NAME` | 返回地址与预期一致 |
| 应用 | 协议是否正常响应 | `curl` 等协议客户端 | 状态码、响应体或握手正确 |

每个命令只证明一部分事实。例如 `ss` 能证明本机监听，不能证明远端防火墙允许访问；`ping` 有响应也不能证明 TCP 端口开放。

### 2. 错误语义

| 客户端现象 | 通常指向 | 仍需排除 |
|------------|----------|----------|
| `Connection refused` | 目标可达但该地址和端口无监听，或入口主动拒绝 | 服务刚退出、防火墙 reject |
| 连接超时 | 数据包或响应被丢弃 | 路由、ACL、防火墙、目标负载 |
| `Could not resolve host` | 名称解析失败 | 拼写、搜索域、DNS 服务器 |
| HTTP `5xx` | 已到达应用或代理 | 上游依赖、应用内部错误 |

客户端错误是定位入口，不是最终结论。最终根因必须由服务端状态、网络状态或解析记录补充证明。

## 二、本机服务基线

示例目录与端口只用于本篇。开始前确认目标不存在且端口空闲。

### 1. 服务启动

```bash
test ! -e /srv/ops-lab/connectivity
! ss -lnt | grep -q ':18080 '
sudo mkdir -p /srv/ops-lab/connectivity
printf 'network path is healthy\n' | sudo tee /srv/ops-lab/connectivity/index.html
```

启动 Python 标准库 HTTP 服务，并保存仅对当前 shell 有效的进程号：

```bash
cd /srv/ops-lab/connectivity
python3 -m http.server 18080 --bind 127.0.0.1 >/tmp/ops-connectivity.log 2>&1 &
OPS_CONNECTIVITY_PID=$!
sleep 1
kill -0 "$OPS_CONNECTIVITY_PID"
```

如果 `kill -0` 失败，应先查看日志，不要继续后面的诊断实验。

### 2. 监听与响应

```bash
ss -lntp '( sport = :18080 )'
curl --noproxy '*' --fail --show-error http://127.0.0.1:18080/
```

`ss` 应显示 `127.0.0.1:18080` 处于 `LISTEN`，`curl` 应输出 `network path is healthy`。绑定到回环地址意味着只有本机客户端能访问；从其他主机失败是预期边界，不应误判为服务异常。

::: tip 先建立成功基线
故障注入前必须保存一次成功的监听与响应证据。没有基线时，无法判断失败由注入动作产生，还是环境原本就不满足条件。
:::

## 三、无监听故障

停止服务可以稳定复现连接拒绝，并验证客户端错误与服务端监听状态的对应关系。

### 1. 停止进程

```bash
kill "$OPS_CONNECTIVITY_PID"
wait "$OPS_CONNECTIVITY_PID" 2>/dev/null
! ss -lnt '( sport = :18080 )' | grep -q LISTEN
```

最后一条命令应返回成功，表示端口上没有监听者。如果仍有监听，说明其他进程占用了端口，必须先识别 PID 和所有者。

### 2. 观察失败

```bash
curl --noproxy '*' --connect-timeout 2 --fail --show-error \
  http://127.0.0.1:18080/
printf 'curl exit status: %s\n' "$?"
```

预期 `curl` 返回非零并报告无法连接或连接被拒绝。此时回环接口和本地路由仍正常，直接证据是端口没有监听。

### 3. 恢复验证

```bash
python3 -m http.server 18080 --bind 127.0.0.1 >/tmp/ops-connectivity.log 2>&1 &
OPS_CONNECTIVITY_PID=$!
sleep 1
curl --noproxy '*' --fail --show-error http://127.0.0.1:18080/
```

响应恢复证明故障由监听进程停止导致。若仍失败，依次检查进程是否存活、日志内容和端口状态。

## 四、路由检查

本机到不同目标可能使用不同接口、网关和源地址。必须针对实际目标查询路由，不能只查看默认路由。

### 1. 具体目标

```bash
ip route get 127.0.0.1
ip route get 192.0.2.1
```

第一条应指向本地回环路径。第二条使用文档测试地址，只用于观察本机选路；即使返回了一条路由，也不表示该地址存在或可达。

### 2. 跨主机诊断

对真实目标执行 `ip route get TARGET_IP`，核对出口接口、下一跳和源地址，再用受限超时探测：

```bash
ping -c 3 -W 1 TARGET_IP
curl --connect-timeout 3 --verbose http://TARGET_IP:PORT/
```

示例中的 `TARGET_IP` 和 `PORT` 必须替换为已授权的测试目标。ICMP 可能被禁用，因此 ping 失败不能单独证明主机离线；业务协议探测更接近实际访问路径。

## 五、DNS 检查

名称解析应与 TCP 连接分开验证。先查询名称得到什么地址，再验证该地址上的目标端口。

### 1. 解析器状态

```bash
resolvectl status
resolvectl query localhost
getent ahosts localhost
```

`resolvectl status` 展示各链路使用的 DNS 服务器和搜索域，`resolvectl query` 展示 systemd-resolved 的查询结果，`getent` 则经过系统名称服务配置。两者结果不一致时，应检查 `/etc/nsswitch.conf`、本地 hosts 记录和解析器链路。

### 2. 可控名称失败

`.invalid` 是保留的无效顶级域，适合验证解析失败，不需要依赖一个可能后来被注册的随机域名。

```bash
resolvectl query ops-lab.invalid
printf 'resolvectl exit status: %s\n' "$?"
curl --noproxy '*' --connect-timeout 2 http://ops-lab.invalid:18080/
```

两条查询都应失败，且 `curl` 的错误应发生在名称解析阶段。该现象与前一节的“地址已知但没有监听”不同。

### 3. 绕过 DNS 验证服务

`curl --resolve` 可以为一次请求临时指定名称与地址映射，不修改系统 DNS：

```bash
curl --noproxy '*' --fail --show-error \
  --resolve ops-lab.local:18080:127.0.0.1 \
  http://ops-lab.local:18080/
```

若请求成功，说明 TCP 监听和 HTTP 服务正常，原始名称失败应继续定位 DNS。该命令只适合诊断，不应替代正确的 DNS 配置。

## 六、诊断闭环

### 1. 证据记录

一次可复核的网络排障至少记录以下信息：

| 证据 | 记录重点 |
|------|----------|
| 时间与目标 | 发生时间、源主机、目标名称、地址、端口 |
| 本机状态 | 接口、地址、具体目标路由 |
| 解析结果 | 查询名称、返回地址、使用的 DNS 链路 |
| 服务状态 | 服务管理器状态、journal、监听地址与端口 |
| 客户端结果 | 超时、拒绝、TLS 或 HTTP 状态 |
| 恢复结果 | 修复动作与同一请求的复测结果 |

证据按同一时间窗口收集，避免把重启前的监听状态和重启后的客户端结果拼成一条错误链路。

### 2. 判断矩阵

| 路由 | 解析 | 监听 | 应用请求 | 诊断方向 |
|------|------|------|----------|----------|
| 正常 | 不适用 | 无 | 拒绝 | 启动或修复服务 |
| 正常 | 失败 | 未验证 | 名称错误 | 修复 DNS 后再测端口 |
| 异常 | 任意 | 未知 | 超时 | 先修复本机选路或网关 |
| 正常 | 正常 | 有 | `5xx` | 检查应用和上游依赖 |
| 正常 | 正常 | 有 | 远端超时 | 检查入口防火墙与中间路径 |

防火墙属于监听之外的入口控制层。[主机防火墙](./03-host-firewall.md)使用同一测试端口展示规则验证与回退方式。

## 七、实验清理

```bash
kill "$OPS_CONNECTIVITY_PID" 2>/dev/null || true
wait "$OPS_CONNECTIVITY_PID" 2>/dev/null || true
sudo rm -- /srv/ops-lab/connectivity/index.html
sudo rmdir /srv/ops-lab/connectivity
rm -f -- /tmp/ops-connectivity.log
! ss -lnt '( sport = :18080 )' | grep -q LISTEN
```

删除范围仅限本篇创建的目录和日志。最后确认端口不再监听；如果仍有进程占用，应识别它而不是继续删除其他文件。
