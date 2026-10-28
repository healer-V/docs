---
title: "服务与网络故障"
tags:
  - Linux
  - systemd
  - 网络排障
excerpt: "按服务状态、日志、监听、路由、DNS 与防火墙的顺序定位访问失败，并通过可恢复的 systemd 服务故障完成闭环验证。"
date: 2026-09-24
---

# 服务与网络故障

客户端访问失败时，服务和网络经常互相背锅。可靠排障需要固定证据顺序：先确认服务能否运行并读取日志，再确认进程监听的地址与端口，然后检查客户端到目标的路由和名称解析，最后核对主机及上游入口规则。

本文创建一个绑定 `127.0.0.1:18082` 的临时 systemd HTTP 服务，通过删除就绪文件让 `ExecStartPre` 失败。故障范围仅限本机回环地址，恢复动作和清理路径在注入前已经确定。

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可运行的 Linux/systemd 实验机。systemd 状态、journal 文本和错误码必须以隔离虚拟机的实际输出为准。
:::

## 一、证据顺序

### 1. 分层模型

| 顺序 | 证据 | 回答的问题 | 不能单独证明 |
|------|------|------------|--------------|
| 1 | `systemctl status` | 服务是否运行、最近为何失败 | 网络入口是否可达 |
| 2 | `journalctl -u` | 进程启动与运行时错误 | 当前一定仍在监听 |
| 3 | `ss -lntp` | 哪个进程监听哪个地址与端口 | 远端流量能通过防火墙 |
| 4 | `ip route get` | 客户端或服务端如何选择路径 | 下一跳一定正常 |
| 5 | `resolvectl query` | 名称解析到什么地址 | 该地址端口可用 |
| 6 | `ufw status` | 主机入口规则是否匹配 | 云安全组与中间 ACL 已允许 |

顺序并非要求每次把所有命令都执行一遍，而是防止在服务未启动时先修改 DNS 或防火墙。

### 2. 客户端错误

| 现象 | 优先检查 | 说明 |
|------|----------|------|
| 名称无法解析 | DNS | 连接尚未到达目标地址 |
| 连接被拒绝 | 服务与监听 | 目标可达，但端口没有接收者或被主动拒绝 |
| 连接超时 | 路由与入口规则 | 数据包或响应可能被丢弃 |
| HTTP `5xx` | 应用日志与上游 | TCP 和 HTTP 入口已经建立 |

客户端现象只用于选择起点，根因必须由目标侧或中间层证据确认。

## 二、实验服务

### 1. 路径与账户

```bash
test ! -e /srv/ops-lab/service-network
! systemctl cat ops-lab-web.service >/dev/null 2>&1
! ss -lnt | grep -q ':18082 '
sudo mkdir -p /srv/ops-lab/service-network/site
sudo chown -R operator:"$(id -gn operator)" /srv/ops-lab/service-network
```

三项冲突检查通过后才能继续。若服务名、目录或端口已被占用，应更换整套实验标识，不能覆盖已有对象。

### 2. 页面与就绪文件

```bash
printf 'service network path is healthy\n' \
  | tee /srv/ops-lab/service-network/site/index.html
touch /srv/ops-lab/service-network/ready
```

`ready` 由 `ExecStartPre` 检查。删除它会阻止服务启动，便于在不修改程序代码的情况下产生清晰、可恢复的失败。

### 3. 单元文件

创建 `/etc/systemd/system/ops-lab-web.service`：

::: details 查看实验服务单元

```ini
[Unit]
Description=Operations lab HTTP service
After=network.target

[Service]
Type=simple
User=operator
ExecStartPre=/usr/bin/test -f /srv/ops-lab/service-network/ready
ExecStart=/usr/bin/python3 -m http.server 18082 --bind 127.0.0.1 --directory /srv/ops-lab/service-network/site
Restart=no

[Install]
WantedBy=multi-user.target
```

:::

服务只绑定回环地址，不暴露给其他主机。`Restart=no` 防止故障注入期间反复启动，便于观察一次明确失败。

## 三、成功基线

### 1. 加载与启动

```bash
sudo systemctl daemon-reload
sudo systemd-analyze verify /etc/systemd/system/ops-lab-web.service
sudo systemctl start ops-lab-web.service
sudo systemctl is-active ops-lab-web.service
```

`verify` 无错误且服务为 `active` 才能继续。验证失败时先修正单元，不能通过连续重启掩盖错误。

### 2. 日志与监听

```bash
sudo journalctl -u ops-lab-web.service \
  --since '-2 minutes' --no-pager
sudo ss -lntp '( sport = :18082 )'
```

journal 应显示服务启动，`ss` 应显示 Python 监听 `127.0.0.1:18082`。若监听地址是 `0.0.0.0`，说明实际单元与本文不一致，应停止实验。

### 3. 应用响应

```bash
curl --noproxy '*' --connect-timeout 2 --fail --show-error \
  http://127.0.0.1:18082/
```

预期返回 `service network path is healthy`。服务、监听和应用响应三项构成成功基线。

## 四、服务故障

### 1. 注入范围

先停止服务，再删除仅用于实验的就绪文件：

```bash
sudo systemctl stop ops-lab-web.service
rm -- /srv/ops-lab/service-network/ready
sudo systemctl start ops-lab-web.service
printf 'start exit status: %s\n' "$?"
```

启动预期返回非零。`ExecStartPre` 失败发生在 HTTP 进程创建前，不会留下持续负载或未知后台进程。

### 2. 服务证据

```bash
sudo systemctl status ops-lab-web.service --no-pager
sudo journalctl -u ops-lab-web.service \
  --since '-2 minutes' --no-pager
```

状态应为 `failed`，日志应指向 `/usr/bin/test` 的前置检查失败。先取得这条直接证据，再检查监听。

### 3. 监听与客户端

```bash
! sudo ss -lntp '( sport = :18082 )' | grep -q LISTEN
curl --noproxy '*' --connect-timeout 2 --fail --show-error \
  http://127.0.0.1:18082/
```

端口应无监听，`curl` 应连接失败。此时修改 DNS 或 UFW 都不能修复服务，因为根因发生在进程启动之前。

## 五、服务恢复

### 1. 恢复对象

```bash
touch /srv/ops-lab/service-network/ready
sudo systemctl reset-failed ops-lab-web.service
sudo systemctl start ops-lab-web.service
sudo systemctl is-active ops-lab-web.service
```

恢复动作只重建就绪文件并清除 failed 状态，没有修改网络和防火墙。

### 2. 同路径复测

```bash
sudo ss -lntp '( sport = :18082 )'
curl --noproxy '*' --connect-timeout 2 --fail --show-error \
  http://127.0.0.1:18082/
sudo journalctl -u ops-lab-web.service \
  --since '-2 minutes' --no-pager
```

使用与基线完全相同的监听和请求检查。服务恢复、监听恢复、应用响应恢复三项同时成立，才能关闭故障。

::: tip 修复必须解释证据变化
本实验的根因是前置文件缺失，修复后日志不再出现前置检查失败，监听重新出现，同一 URL 恢复响应。仅执行 `restart` 而不解释这些变化，不构成排障闭环。
:::

## 六、网络分层

服务本身正常后，才继续检查本机路径、DNS 和入口规则。

### 1. 绑定范围

```bash
sudo ss -lntp '( sport = :18082 )'
ip address show dev lo
ip route get 127.0.0.1
```

监听为 `127.0.0.1` 时，只有本机可访问。远端客户端超时或拒绝是绑定设计的结果，不应通过开放防火墙解决；需要远端服务时，应在变更设计中明确绑定地址和可信来源。

### 2. 名称解析

```bash
resolvectl query localhost
getent ahosts localhost
curl --noproxy '*' --resolve ops-lab.local:18082:127.0.0.1 \
  http://ops-lab.local:18082/
```

前两条检查系统解析路径，`--resolve` 为单次请求提供映射。若 `--resolve` 成功而普通名称失败，服务与端口已经可用，问题应留在 DNS 层继续定位。

### 3. 防火墙与上游入口

```bash
sudo ufw status verbose
sudo ufw status numbered
```

UFW 规则只影响主机防火墙。服务若面向远端，还要核对云安全组、负载均衡器、路由 ACL 和客户端出口策略。没有对应系统的只读证据时，应明确标记待核对，不能推断“网络侧都正常”。

## 七、真实故障流程

### 1. 服务端

1. 记录告警时间、请求目标和客户端错误。
2. 检查服务状态与退出码，保存对应时间窗口的 journal。
3. 检查实际监听地址、端口和进程。
4. 用本机协议客户端验证应用响应。
5. 针对真实客户端地址检查返回路由。
6. 核对名称解析结果与入口规则。

### 2. 客户端

```bash
resolvectl query SERVICE_NAME
ip route get SERVICE_IP
curl --noproxy '*' --connect-timeout 3 --verbose \
  https://SERVICE_NAME:PORT/
```

命令中的服务名、地址和端口必须替换为授权测试目标。TLS 服务还要记录证书名称、有效期和握手错误；HTTP 状态码表明请求已经到达协议层，不应继续归因于纯网络不通。

### 3. 结论模板

| 项目 | 记录内容 |
|------|----------|
| 现象 | 哪个来源在什么时间访问哪个名称、地址和端口失败 |
| 直接证据 | 服务、日志、监听、路由、DNS、规则中的异常 |
| 根因 | 哪个配置、进程或依赖造成异常，证据如何对应 |
| 恢复 | 实际修改对象与风险控制 |
| 复测 | 使用同一请求与指标得到的恢复结果 |
| 遗留风险 | 尚未验证的上游、容量或长期修复 |

这套记录能把“重启后好了”转化为可复核的诊断结论。

## 八、实验清理

```bash
sudo systemctl disable --now ops-lab-web.service 2>/dev/null || true
sudo systemctl reset-failed ops-lab-web.service 2>/dev/null || true
sudo rm -- /etc/systemd/system/ops-lab-web.service
sudo systemctl daemon-reload
sudo rm -- /srv/ops-lab/service-network/site/index.html
sudo rm -- /srv/ops-lab/service-network/ready
sudo rmdir /srv/ops-lab/service-network/site
sudo rmdir /srv/ops-lab/service-network
! systemctl cat ops-lab-web.service >/dev/null 2>&1
```

最后确认单元不存在且 18082 端口没有监听。systemd 服务状态、依赖和重载机制见[systemd 服务管理](../04-processes-systemd/02-systemd-services.md)，日志查询方法见[系统日志](../04-processes-systemd/03-journalctl.md)。
