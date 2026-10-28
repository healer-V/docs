---
title: "主机网络配置"
tags:
  - Linux
  - Netplan
  - 网络
excerpt: "建立接口、地址、路由与 DNS 的主机网络模型，使用 Netplan 虚拟接口完成可回退的配置、验证与清理实验。"
date: 2026-09-24
---

# 主机网络配置

Linux 主机能否访问网络，取决于一条连续链路：接口处于可用状态，接口拥有匹配网段的地址，路由表能够选择下一跳，名称解析器能够把域名转换为地址。排查或改动配置时，应分别验证这四个对象，不能把“网卡亮着”当成网络已经可用。

本文以 Ubuntu Server 26.04.1 LTS 为基线，使用 Netplan 创建一个不承载真实流量的 dummy 虚拟接口。实验不会修改默认路由和生产 DNS；涉及真实网卡时，只给出变更门禁，不提供可直接套用的地址与网关。

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可运行的 Linux 实验机。命令、配置语法和预期状态依据 Ubuntu 与 Netplan 官方资料整理，实际接口名、渲染器和输出必须在隔离虚拟机中核对。
:::

## 一、网络对象

主机网络配置不是一个单独的 IP 地址，而是由多个相互依赖的对象组成。先明确对象，再判断故障落在哪一层。

### 1. 接口与地址

| 对象 | 作用 | 关键证据 | 常见异常 |
|------|------|----------|----------|
| 接口 | 连接物理或虚拟网络 | `ip -brief link` | `DOWN`、接口不存在 |
| 地址 | 标识本机在某个网段中的位置 | `ip -4 address` | 地址缺失、前缀长度错误、重复地址 |
| 路由 | 决定目标流量从哪个接口和下一跳发出 | `ip route` | 无默认路由、下一跳不可达、优先级错误 |
| DNS | 把名称解析为地址 | `resolvectl status` | 无 DNS 服务器、搜索域错误、解析超时 |

接口为 `UP` 只说明管理状态已启用。没有可用地址时，它不能完成三层通信；拥有地址但没有到目标的路由时，内核仍不知道把数据包发往哪里。

### 2. 路由选择

路由表按目标前缀选择最具体的匹配项。默认路由 `default` 只在没有更具体路由时使用，因此不能仅凭“存在默认网关”判断所有目标都走该网关。

```bash
ip route
ip route get 1.1.1.1
ip route get 192.0.2.10
```

`ip route get` 展示内核对一个具体目标的选择结果，包括出口接口、下一跳和源地址。它证明的是本机选路结果，不证明下一跳或远端服务一定可达。

### 3. DNS 边界

DNS 只负责名称到地址的解析。通过 IP 可以访问而域名失败，才应重点检查解析；IP 与域名都失败时，应先确认接口、地址和路由。

::: tip 先区分地址问题与名称问题
诊断时分别保留“按 IP 访问”和“按名称访问”的结果。名称解析成功不代表目标端口已监听，解析失败也不代表网络接口故障。
:::

## 二、当前状态

Ubuntu Server 通常由 Netplan 描述持久配置，再交给 `systemd-networkd` 或 NetworkManager 应用。内核当前状态与配置文件是两类证据：前者说明现在如何运行，后者说明重启或重新应用后希望如何运行。

### 1. 运行状态

```bash
ip -brief link
ip -brief -4 address
ip route
resolvectl status
```

先记录承载管理连接的接口、地址、默认路由和 DNS 服务器。远程操作时还要记录当前 SSH 会话使用的本地与远端地址，避免误改管理链路。

```bash
printf '%s\n' "$SSH_CONNECTION"
ip route get "$(printf '%s' "$SSH_CONNECTION" | awk '{print $1}')"
```

第二条命令仅适用于 SSH 会话。输出中的出口接口就是返回当前客户端流量所依赖的路径，修改它之前必须准备虚拟机控制台。

### 2. Netplan 配置

```bash
sudo netplan get
sudo netplan status --all
sudo find /etc/netplan -maxdepth 1 -type f -name '*.yaml' -print
```

`netplan get` 展示合并后的配置，`netplan status --all` 展示当前网络状态。多个 YAML 文件会共同参与合并，后加载文件可能覆盖同名键；不要只查看一个文件就断定最终配置。

::: warning 不要直接改动未知来源的配置
云镜像可能由 cloud-init 生成 Netplan 文件，管理平台也可能持续下发配置。先确认文件来源与维护边界，再决定修改生成源还是新增本地覆盖文件。
:::

## 三、隔离配置

dummy 接口是只存在于本机的虚拟接口，适合验证 Netplan 语法和状态变化。示例使用文档测试网段 `192.0.2.0/24` 中的 `/32` 地址，不设置默认路由和 DNS，因此不会接管真实出口。

### 1. 前置检查

实验要求从虚拟机控制台操作，并在开始前创建快照。确认接口名与配置文件均未被占用：

```bash
test ! -e /etc/netplan/90-ops-lab-dummy.yaml
! ip link show ops-lab-dummy
sudo netplan get network.renderer
```

前两条命令返回成功后才能继续。若对象已经存在，应停止实验并查明所有者，不能覆盖或删除未知配置。

### 2. 配置文件

创建 `/etc/netplan/90-ops-lab-dummy.yaml`：

```yaml
network:
  version: 2
  renderer: networkd
  dummy-devices:
    ops-lab-dummy:
      addresses:
        - 192.0.2.10/32
```

示例显式使用 `networkd`。如果基线显示主机由 NetworkManager 管理，不能直接照搬；应在同类隔离虚拟机中验证渲染器对 dummy 接口的支持和合并结果。

### 3. 语法检查

```bash
sudo chmod 600 /etc/netplan/90-ops-lab-dummy.yaml
sudo netplan generate
sudo netplan get ethernets
sudo netplan get dummy-devices
```

`netplan generate` 返回 `0` 才表示配置可以生成后端文件。它不验证地址冲突、远端连通性或 DNS 是否可用；生成成功不能替代应用后的检查。

## 四、安全应用

`netplan try` 会临时应用配置，并要求在超时前确认；未确认时尝试回退。它降低了远程失联风险，但官方文档明确提示回退存在已知边界，因此仍需要控制台和快照。

### 1. 限时试用

在虚拟机控制台执行：

```bash
sudo netplan try --timeout 60
```

出现确认提示后先不要确认，另开终端执行验证。若真实变更涉及 SSH 链路，还应从第二个客户端建立新会话，旧会话保持不关闭。

### 2. 状态验证

```bash
ip -brief link show ops-lab-dummy
ip -4 address show dev ops-lab-dummy
ip route get 192.0.2.10
sudo netplan status ops-lab-dummy
```

预期接口为 `UP` 或 `UNKNOWN`，并持有 `192.0.2.10/32`。到本机该地址的选路应指向 `ops-lab-dummy`。四项证据一致后，返回 `netplan try` 的终端确认配置。

::: tip 应用门禁
真实网卡变更必须同时满足：控制台可用、旧会话保留、新会话能够登录、默认路由正确、DNS 可解析。缺少任一项都不应确认变更。
:::

### 3. 超时回退

为了验证回退，可在快照保护下再次运行 `netplan try` 并等待超时，不输入确认。超时后检查：

```bash
ip -4 address show dev ops-lab-dummy
sudo netplan get dummy-devices
```

运行状态应回到试用前状态，而配置文件仍在磁盘上。若接口或地址没有恢复，应从控制台执行已验证的旧配置，必要时还原虚拟机快照。

## 五、真实网卡变更

真实网卡的地址、网关与 DNS 来自所在网络，不能从教程推导。变更前应由网络规划、云平台配置或 DHCP 租约提供准确参数。

### 1. 变更清单

| 检查项 | 必须记录的内容 | 失败处理 |
|--------|----------------|----------|
| 管理路径 | 当前客户端地址、主机地址、出口接口 | 保留控制台与旧会话 |
| 地址参数 | 地址、前缀、是否允许并存 | 不确定时停止变更 |
| 路由参数 | 网关、目标网段、metric | 从控制台恢复旧文件 |
| DNS 参数 | 服务器、搜索域、解析测试名 | 先恢复旧解析配置 |
| 回退对象 | 原文件、快照、恢复命令 | 变更前实际核对可用性 |

### 2. 验证顺序

1. 使用 `netplan generate` 检查语法。
2. 从控制台运行 `netplan try`，保留旧 SSH 会话。
3. 检查接口、地址和对当前客户端的返回路由。
4. 从第二个客户端建立新 SSH 会话。
5. 分别验证 IP 连通性、名称解析和业务端口。
6. 所有证据通过后再确认配置。

这套顺序把“配置能够解析”“内核状态正确”“管理通道仍可使用”分开验证，避免单一命令成功掩盖其他层的失败。

## 六、清理与排错

### 1. 实验清理

从控制台删除实验配置并重新应用：

```bash
sudo rm -- /etc/netplan/90-ops-lab-dummy.yaml
sudo netplan generate
sudo netplan apply
! ip link show ops-lab-dummy
```

最后一条命令返回成功表示接口已不存在。若仍存在，检查是否有其他 Netplan 文件或手工命令创建了同名接口，不能盲目执行 `ip link delete`。

### 2. 故障判断

| 现象 | 首要证据 | 常见原因 | 恢复方向 |
|------|----------|----------|----------|
| `netplan generate` 报错 | 错误行号与键名 | YAML 缩进或字段无效 | 修正文件，不应用 |
| 接口不存在 | `ip link`、`netplan status` | 渲染器未接管、名称错误 | 核对合并配置与后端服务 |
| 地址存在但目标不可达 | `ip route get TARGET` | 路由或下一跳错误 | 恢复原路由，核对网关 |
| IP 可达但域名失败 | `resolvectl query NAME` | DNS 服务器或搜索域错误 | 恢复原 DNS 配置 |
| SSH 新会话失败 | 第二客户端结果、journal | 返回路由、防火墙或 sshd 问题 | 保持旧会话，从控制台回退 |

网络故障必须沿接口、地址、路由、解析和服务入口逐层收集证据。[连接与 DNS 检查](./02-connectivity-dns.md)给出这条诊断链的可复现实验。

