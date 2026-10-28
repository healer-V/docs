---
title: "安全更新与基线"
tags:
  - Linux
  - APT
  - 安全更新
excerpt: "识别 Ubuntu 安全更新来源与自动更新状态，评估服务重启、内核重启和维护窗口影响，并建立可审计的更新验证流程。"
date: 2026-09-24
---

# 安全更新与基线

安全更新解决已知漏洞，但安装动作本身也会改变共享库、服务进程和内核。运维决策不能只回答“有没有可升级软件包”，还要确认更新来自哪个仓库、哪些进程需要重启、是否要求整机重启，以及业务能否在当前窗口承受影响。

Ubuntu Server 默认使用 `unattended-upgrades` 自动应用更新。自动化降低遗漏风险，却不等于零停机，也不能替代更新来源、失败日志和重启状态的检查。

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可运行的 Linux 实验机。软件包候选版本、更新数量、服务重启和 `/run/reboot-required` 状态具有时效性，必须在目标实验机执行后记录，本文不提供虚构结果。
:::

## 一、更新对象

### 1. 更新层次

| 对象 | 更新后可能发生的变化 | 主要验证 |
|------|----------------------|----------|
| 普通命令与库 | 新进程使用新文件，旧进程仍映射旧库 | 包版本、需要重启的进程 |
| 系统服务 | 服务可能自动重启或继续运行旧代码 | 服务状态、journal、业务探针 |
| 内核 | 新内核安装到磁盘，当前内核不自动切换 | `uname -r`、重启标记、启动项 |
| 引导与基础组件 | 可能影响下次启动 | 控制台、回滚介质、重启验证 |

包安装成功只证明包管理事务完成。业务健康、服务是否加载新代码、重启后能否启动，都需要独立验证。

### 2. 更新类型

Ubuntu 的安全仓库提供漏洞修复，普通 updates 仓库提供稳定更新。自动更新的来源匹配由 `Unattended-Upgrade::Allowed-Origins` 或相应 `Origins-Pattern` 决定。

```bash
apt-cache policy
grep -RhsE 'Allowed-Origins|Origins-Pattern' \
  /etc/apt/apt.conf.d/50unattended-upgrades \
  /etc/apt/apt.conf.d/*unattended-upgrades 2>/dev/null
```

输出必须结合发行版代号和实际源判断。不能仅凭文件名包含 `security` 就认定候选包一定来自安全仓库。

## 二、基线盘点

### 1. 系统与软件源

```bash
. /etc/os-release
printf '%s %s\n' "$PRETTY_NAME" "$VERSION_CODENAME"
dpkg --print-architecture
grep -RhsE '^(Types|URIs|Suites|Components):' \
  /etc/apt/sources.list /etc/apt/sources.list.d 2>/dev/null
```

记录发行版、代号、架构、仓库地址和 suite。第三方仓库具有独立信任与维护周期，应与 Ubuntu 官方更新分开评估。

### 2. 自动更新状态

```bash
systemctl status apt-daily.timer apt-daily-upgrade.timer --no-pager
systemctl list-timers 'apt-*' --all
apt-config dump | grep -E 'APT::Periodic|Unattended-Upgrade'
dpkg-query -W unattended-upgrades
```

定时器启用只说明任务会被触发；是否允许安装、最近一次是否成功，还要看配置和日志。

### 3. 更新日志

```bash
sudo tail -n 100 /var/log/unattended-upgrades/unattended-upgrades.log
sudo journalctl -u apt-daily-upgrade.service --since '-7 days' --no-pager
```

关注开始时间、实际升级包、失败原因和完成状态。日志不存在可能表示任务从未运行、日志轮转或组件未安装，不能直接解释为“没有更新”。

## 三、候选更新

更新评估应在刷新索引后进行。索引刷新会访问配置的软件源，但不会安装软件包。

### 1. 刷新索引

```bash
sudo apt-get update
apt list --upgradable
```

先确认 `apt-get update` 没有签名、证书、解析或仓库代号错误。使用过期索引做出的“没有更新”结论没有证据价值。

### 2. 模拟常规升级

```bash
sudo apt-get --simulate upgrade
```

模拟输出列出计划升级、保留和新增的软件包，不修改系统。检查是否涉及内核、OpenSSH、网络、数据库或业务运行时等高影响组件。

### 3. 模拟自动更新

```bash
sudo unattended-upgrade --dry-run --debug
```

调试输出较长，应重点查看允许的来源、候选包和拒绝原因。`--dry-run` 不安装包，但仍会读取仓库元数据与系统配置。

::: tip 分开记录“可升级”与“会自动升级”
`apt list --upgradable` 展示存在候选版本的软件包，`unattended-upgrade --dry-run` 展示自动更新策略会选择的子集。两者数量不同并不必然表示异常。
:::

## 四、影响评估

### 1. 服务重启

软件包更新可能由维护脚本自动重启服务，也可能保留旧进程等待人工处理。若安装了 `needrestart`，可以检查仍使用旧库或旧内核的对象：

```bash
if command -v needrestart >/dev/null; then
  sudo needrestart -r l
else
  printf 'needrestart is not installed\n'
fi
```

`needrestart` 的结果是运维证据，不是无条件重启列表。数据库、队列和有状态服务需要结合副本、流量切换和恢复目标安排。

### 2. 整机重启

```bash
uname -r
test -e /run/reboot-required && cat /run/reboot-required
test -e /run/reboot-required.pkgs && cat /run/reboot-required.pkgs
```

`/run/reboot-required` 存在表示系统建议重启，相关包可能记录在 `.pkgs` 文件中。文件不存在不能证明所有进程都已加载新代码，仍要结合服务与库检查。

### 3. 维护窗口

| 变更情况 | 主要风险 | 建议策略 |
|----------|----------|----------|
| 无状态服务、已有多副本 | 单实例短暂重启 | 逐实例摘流、更新、探活、恢复流量 |
| 单实例有状态服务 | 中断与恢复时间不确定 | 备份验证、停机窗口、明确回退 |
| 内核或引导组件 | 重启后无法启动 | 控制台、快照、旧内核启动项 |
| SSH 或网络组件 | 管理通道中断 | 保留控制台与第二会话 |
| 第三方运行时 | 兼容性回归 | 预发布环境回归和版本约束 |

“安全更新”描述修复目的，不代表变更风险低。紧急漏洞可能要求缩短窗口，但仍应保留最小验证和恢复路径。

## 五、自动更新配置

不要直接修改发行版提供的 `50unattended-upgrades`。本地策略应放在排序靠后的独立文件中，便于升级时保留和审计。

### 1. 周期配置

创建 `/etc/apt/apt.conf.d/52ops-periodic`，以下示例每天刷新索引并运行自动更新：

```text
APT::Periodic::Enable "1";
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

时间值单位是天。真实执行时刻还受 systemd 定时器和随机延迟影响，不应把它当成精确的维护窗口调度器。

### 2. 配置验证

```bash
sudo apt-config dump | grep -E 'APT::Periodic'
systemctl cat apt-daily-upgrade.timer
systemctl list-timers apt-daily-upgrade.timer --all
sudo unattended-upgrade --dry-run --debug
```

四项证据分别确认合并配置、定时器定义、下次触发时间和策略选包。自动更新若可能重启关键服务，还需要在应用层配置副本与探针。

### 3. 自动重启边界

`Unattended-Upgrade::Automatic-Reboot` 会在满足条件时自动重启主机。单机启用可能造成不可控停机，多副本环境也需要与编排和维护窗口协调。

::: warning 不以自动重启代替维护流程
本文不建议直接开启自动重启。先确认业务冗余、重启时间、启动验证、失败摘除和控制台恢复，才能决定是否由自动化执行。
:::

## 六、受控更新

实际安装应先在快照或可重建的预发布主机完成。以下流程展示证据顺序，不要求在生产主机直接执行。

### 1. 更新前

1. 保存候选包、当前内核和关键服务状态。
2. 验证备份可恢复，并确认控制台可用。
3. 摘除待更新实例流量或进入停机窗口。
4. 运行应用健康检查，保存成功基线。

### 2. 执行更新

若组织采用自动更新策略，可在维护窗口手工触发：

```bash
sudo unattended-upgrade --verbose
printf 'upgrade exit status: %s\n' "$?"
```

返回 `0` 后仍需检查日志和系统状态。若组织采用人工批准包清单，应使用经过评审的 `apt-get install package=version` 方案，而不是将两种流程混用。

### 3. 更新后

```bash
sudo systemctl --failed
sudo journalctl -p warning --since '-15 minutes' --no-pager
test -e /run/reboot-required && printf 'reboot required\n'
```

随后核对关键包版本、服务探针和业务请求。需要重启时，在控制台与回退能力可用的窗口执行，并在重启后检查当前内核与所有关键服务。

## 七、回退与故障

### 1. 回退边界

APT 不保证任意包都能无损降级。包格式、配置迁移和数据文件可能已经变化，因此主机级快照、可重建镜像和应用数据备份比临时执行 `apt install old-version` 更可靠。

| 故障 | 证据 | 首选恢复 |
|------|------|----------|
| 仓库签名或证书失败 | `apt-get update` 错误 | 修复时间、证书或仓库配置，不绕过校验 |
| dpkg 中断 | dpkg 错误与锁持有进程 | 确认无事务运行后修复配置状态 |
| 服务更新后不健康 | 服务日志、探针、包版本 | 摘流，按应用回退方案恢复 |
| 新内核无法启动 | 控制台、引导日志 | 启动已知可用旧内核或还原快照 |
| 自动更新长期失败 | 定时器状态与日志 | 修复根因并重新执行 dry-run |

### 2. 完成条件

一次更新只有在以下证据完整时才算结束：包事务成功，关键服务健康，旧库进程已处理，重启要求已决策，业务探针通过，失败恢复路径仍可用。单独看到“0 upgraded”或命令退出码为 `0` 都不足以覆盖这些结论。

软件包命令与仓库管理基础见[软件包管理](../05-software-scheduled-jobs/01-package-management.md)。

