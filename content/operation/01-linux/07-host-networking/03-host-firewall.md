---
title: "主机防火墙"
tags:
  - Linux
  - UFW
  - 防火墙
excerpt: "使用 UFW 建立默认策略与最小放行规则，在控制台和第二会话保护下验证端口访问、规则撤销与远程恢复。"
date: 2026-09-24
---

# 主机防火墙

主机防火墙根据源地址、目标地址、协议和端口决定流量是否允许通过。它不能替代服务认证，也不会自动创建监听端口。一个入口真正可用，需要服务监听、路由可达和防火墙允许三项同时成立。

Ubuntu 使用 UFW（Uncomplicated Firewall）作为常用防火墙管理前端。本文只讲主机级最小入口控制，不展开 nftables 规则语言，也不把云安全组、负载均衡器或机房 ACL 混入同一层。

::: danger 远程启用防火墙可能中断 SSH
实验只能在有虚拟机控制台、快照和第二个客户端的隔离环境中执行。先放行当前 SSH 来源与实际端口，再启用 UFW；新会话验证成功前不得关闭旧会话。
:::

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可运行的 Linux 实验机。文中规则必须先使用 `--dry-run` 预览，并根据实验机的 SSH 端口、客户端地址和既有策略调整。
:::

## 一、规则模型

### 1. 处理对象

| 条件 | 示例 | 约束意义 |
|------|------|----------|
| 方向 | `incoming`、`outgoing` | 区分进入主机与离开主机的流量 |
| 协议 | `tcp`、`udp` | 同一端口号在不同协议中是不同入口 |
| 目标端口 | `22/tcp`、`18080/tcp` | 只开放服务实际使用的端口 |
| 来源 | 管理网段或单一客户端地址 | 缩小能够发起连接的主体 |
| 动作 | `allow`、`deny`、`reject` | 放行、丢弃或显式拒绝 |

规则应从业务入口反推：服务监听什么地址和端口，哪些来源必须访问，其他流量采用什么默认策略。不要从“常见端口列表”批量放行。

### 2. 默认策略

常见服务器基线是拒绝未明确允许的入站连接，并允许出站连接。但主机如果承担路由、容器转发或受控出口职责，这个基线可能不适用。

```bash
sudo ufw status verbose
sudo ufw status numbered
sudo ufw show added
```

开始前保存三项输出。UFW 初始通常未启用，但不能据此假定当前主机也处于未启用状态。

## 二、管理通道保护

启用或修改规则前，必须确定当前 SSH 会话的客户端地址与服务端口，不能机械放行 `22/tcp`。

### 1. 当前会话

```bash
printf '%s\n' "$SSH_CONNECTION"
OPS_CLIENT_IP=$(printf '%s' "$SSH_CONNECTION" | awk '{print $1}')
OPS_SERVER_PORT=$(printf '%s' "$SSH_CONNECTION" | awk '{print $4}')
printf 'client=%s server-port=%s\n' "$OPS_CLIENT_IP" "$OPS_SERVER_PORT"
```

`SSH_CONNECTION` 依次包含客户端地址、客户端端口、服务端地址和服务端端口。若变量为空，说明当前不是 SSH 会话，应从控制台和 sshd 有效配置中获取端口。

### 2. 服务端证据

```bash
sudo sshd -T | grep '^port '
sudo ss -lntp | grep sshd
ip route get "$OPS_CLIENT_IP"
```

三项证据应分别确认 sshd 的有效端口、实际监听和返回客户端的路由。配置值与监听不一致时，先处理 SSH 服务，不应继续启用防火墙。

::: warning 不要使用宽泛 SSH 规则掩盖信息不足
仅在受控实验网中无法固定客户端地址时，才临时按管理网段放行。生产主机应使用明确来源、跳板机或 VPN 边界，并记录规则所有者和回收条件。
:::

## 三、测试服务

使用 `0.0.0.0:18080` 建立可从另一台实验机访问的 HTTP 服务。开始前确认端口未被占用。

### 1. 启动监听

```bash
test ! -e /srv/ops-lab/firewall
! ss -lnt | grep -q ':18080 '
sudo mkdir -p /srv/ops-lab/firewall
printf 'firewall path is open\n' | sudo tee /srv/ops-lab/firewall/index.html
```

```bash
cd /srv/ops-lab/firewall
python3 -m http.server 18080 --bind 0.0.0.0 >/tmp/ops-firewall.log 2>&1 &
OPS_FIREWALL_PID=$!
sleep 1
ss -lntp '( sport = :18080 )'
```

监听必须显示为 `0.0.0.0:18080` 或实验网卡地址。若只显示 `127.0.0.1`，远端访问失败由绑定范围导致，不能归因于防火墙。

### 2. 无规则基线

当 UFW 尚未启用或基线规则允许访问时，从第二台实验机执行：

```bash
curl --noproxy '*' --connect-timeout 3 --fail http://SERVER_IP:18080/
```

`SERVER_IP` 必须替换为服务器实验网地址。成功响应建立跨主机路径基线；如果基线失败，应先排查地址、路由和监听，不能继续用防火墙规则解释。

## 四、规则预览

UFW 的 `--dry-run` 可以显示计划生成的规则，但不会改变当前状态。先预览管理入口，再预览测试端口。

### 1. SSH 放行

```bash
sudo ufw --dry-run allow proto tcp \
  from "$OPS_CLIENT_IP" to any port "$OPS_SERVER_PORT"
```

检查输出中的来源、协议与端口是否和当前会话一致。变量为空、地址不符合预期或端口不是 sshd 实际监听值时，立即停止。

### 2. 测试端口放行

将 `TEST_CLIENT_IP` 替换为第二台实验机地址：

```bash
TEST_CLIENT_IP=192.0.2.20
sudo ufw --dry-run allow proto tcp \
  from "$TEST_CLIENT_IP" to any port 18080 comment 'ops-lab-http'
```

文档测试地址只是格式示例，不能在真实环境直接使用。实际来源必须由第二台客户端的接口地址和服务器返回路由共同确认。

## 五、启用与验证

### 1. 保留 SSH

从虚拟机控制台执行实际管理规则：

```bash
sudo ufw allow proto tcp \
  from "$OPS_CLIENT_IP" to any port "$OPS_SERVER_PORT" comment 'current-ssh'
sudo ufw status numbered
```

确认规则准确后保持当前 SSH 会话在线。如果 UFW 已经启用，不要重置默认策略，直接进入测试端口规则；改变既有默认策略属于独立变更。

### 2. 首次启用

仅当基线确认 UFW 未启用，并且实验目标就是建立新的主机策略时执行：

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw enable
sudo ufw status verbose
```

启用后立即从第二个终端新建 SSH 连接。新连接失败时保留旧会话，从控制台检查规则；不要退出旧会话反复尝试。

### 3. 最小开放

```bash
sudo ufw allow proto tcp \
  from "$TEST_CLIENT_IP" to any port 18080 comment 'ops-lab-http'
sudo ufw status numbered
```

从授权客户端再次请求 `http://SERVER_IP:18080/`，预期成功。若有另一台未授权实验客户端，可用同一请求验证其失败；没有独立来源时，只能证明规则存在和授权路径可用，不能声称拒绝路径已经验证。

::: tip 规则、监听和客户端结果必须同时记录
UFW 显示 `ALLOW` 只证明规则被加载。完整验证还需要 `ss` 的监听证据，以及授权客户端的实际连接结果。
:::

## 六、撤销与恢复

### 1. 撤销测试规则

先用 `status numbered` 核对编号，再删除带 `ops-lab-http` 注释的准确规则。编号会随删除变化，每次操作前都要重新查看。

```bash
sudo ufw status numbered
sudo ufw delete allow proto tcp \
  from "$TEST_CLIENT_IP" to any port 18080
sudo ufw status numbered
```

授权客户端再次请求测试端口时应失败，而 `ss` 仍显示服务正在监听。这组对照把失败定位到入口规则，而不是服务退出。

### 2. SSH 失联恢复

若新 SSH 会话失败，在虚拟机控制台按以下顺序处理：

1. 用 `ufw status numbered` 确认管理规则是否存在且来源、端口正确。
2. 用 `ss -lntp` 确认 sshd 仍在预期端口监听。
3. 修正管理规则，再从第二客户端复测。
4. 仅在隔离实验机无法快速恢复时，临时执行 `ufw disable` 恢复入口并立即修正规则。

`ufw reset` 会删除全部规则，不属于常规恢复动作。生产环境还必须核对云安全组、上游 ACL 和变更审计，不能把主机规则视为唯一入口层。

### 3. 实验清理

```bash
kill "$OPS_FIREWALL_PID" 2>/dev/null || true
wait "$OPS_FIREWALL_PID" 2>/dev/null || true
sudo rm -- /srv/ops-lab/firewall/index.html
sudo rmdir /srv/ops-lab/firewall
rm -f -- /tmp/ops-firewall.log
! ss -lnt '( sport = :18080 )' | grep -q LISTEN
```

测试端口规则必须删除。是否保留 SSH 规则与 UFW 启用状态，取决于实验开始前记录的基线；不要为了清理实验而删除原有管理规则。

## 七、故障判断

| 现象 | 监听证据 | UFW 证据 | 诊断方向 |
|------|----------|----------|----------|
| 本机也无法访问 | 无监听 | 任意 | 服务未启动或绑定错误 |
| 本机可访问，远端超时 | 有监听 | 无放行或来源不匹配 | 主机入口规则 |
| UFW 允许但远端仍超时 | 有监听 | 有匹配规则 | 路由、云安全组或上游 ACL |
| 远端返回 HTTP 错误 | 有监听 | 已通过 | 应用或反向代理 |
| 新 SSH 失败、旧会话正常 | sshd 监听 | 管理规则可疑 | 从控制台修正规则 |

防火墙诊断应与[连接与 DNS 检查](./02-connectivity-dns.md)的接口、路由、监听证据合并，不能通过反复增大放行范围来试错。
