---
title: "日志轮转"
tags:
  - Linux
  - logrotate
  - 日志
excerpt: "说明活动日志、归档文件、保留数量和状态文件，通过独立 logrotate 配置验证调试、强制轮转、压缩、写入连续性及常见失败。"
date: 2026-09-24
---

# 日志轮转

持续追加的文件日志会占用越来越多磁盘空间。日志轮转把当前活动文件转换为带编号或日期的归档，并根据规则压缩和删除旧归档；它控制文件生命周期，不解释日志内容，也不等同于 systemd Journal 的存储策略。

轮转是否正确不能只看“出现了 `.1` 文件”。还要确认**活动文件仍能继续写入、归档内容完整、保留数量符合规则、状态文件记录本次处理**。本文在 `/srv/ops-lab/log-rotation` 使用独立配置与状态文件，不修改系统 logrotate 规则。

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可运行的 Linux 实验机。归档时间、文件大小和 verbose 输出必须以实际执行为准；正文描述的是预期文件关系，不冒充本机实测结果。
:::

## 一、文件日志生命周期

logrotate 根据配置和状态判断是否处理活动日志。一次轮转可能重命名或复制当前文件、创建新的活动文件、压缩更早归档并删除超出保留数量的文件。

### 1. 日志文件角色

| 对象 | 本例文件 | 验证重点 |
|------|----------|----------|
| 活动日志 | `ops-lab.log` | 轮转后仍能写入当前路径 |
| 最近归档 | `ops-lab.log.1` | 保存上一周期内容且暂不压缩 |
| 较早归档 | `ops-lab.log.2.gz`、`.3.gz` | 内容可解压读取且数量不超限 |

活动日志与归档文件承担不同职责。只看到 `.1` 文件不能证明链路正常，还必须验证应用继续写入活动路径，并检查归档内容和保留数量。

### 2. 状态文件

logrotate 使用状态文件记录各日志上次轮转时间，并通过锁避免多个进程同时更新同一状态。默认状态文件位于 `/var/lib/logrotate/status`，本文使用独立文件，确保实验不改变系统调度判断。

```text
活动日志 ops-lab.log
        ↓ 第一次轮转
ops-lab.log（继续写入） + ops-lab.log.1（最近归档）
        ↓ 后续轮转
.1（最近归档） + .2.gz、.3.gz（较早归档）
```

## 二、实验准备

实验对象必须与系统日志完全隔离。所有命令在普通用户 `operator` 会话执行，只有安装工具和创建 `/srv` 目录需要 sudo。

### 1. 工具状态

```bash
command -v logrotate
logrotate --version
apt-cache policy logrotate
```

Ubuntu 26.04 提供 `logrotate` 软件包。命令不存在时，先按[软件包管理](./01-package-management.md)的方法检查来源和安装影响，再执行 `sudo apt install logrotate`。

### 2. 路径冲突

```bash
test ! -e /srv/ops-lab/log-rotation
```

返回 `0` 才表示测试目录不存在。若路径已存在，停止并确认归属，不覆盖现有日志、配置或状态文件。

### 3. 测试日志

```bash
sudo install -d -o operator -g "$(id -gn operator)" -m 0750 /srv/ops-lab/log-rotation
printf '%s\n' 'initial-entry' > /srv/ops-lab/log-rotation/ops-lab.log
stat -c '%U %G %a %s %n' /srv/ops-lab/log-rotation/ops-lab.log
```

日志应由 `operator` 所有且包含 `initial-entry`。本篇不使用真实服务日志，避免轮转实验影响其他进程。

## 三、轮转规则

规则同时决定触发条件、保留数量、压缩策略和活动文件处理方式。本文使用 `copytruncate` 保留原活动文件的 inode，然后把它截断为零。

### 1. 配置文件

执行 `nano /srv/ops-lab/log-rotation/ops-lab.logrotate.conf` 创建配置文件，写入以下内容并保存：

```text
/srv/ops-lab/log-rotation/ops-lab.log {
    size 1
    rotate 3
    compress
    delaycompress
    copytruncate
    missingok
    notifempty
}
```

`size 1` 让非空测试日志满足大小条件；实际生产阈值必须使用 `k`、`M`、`G` 等合适单位，不应照搬 1 字节。

### 2. 保留与压缩

| 指令 | 本例作用 | 验证对象 |
|------|----------|----------|
| `rotate 3` | 最多保留三个历史归档 | `.1`、`.2.gz`、`.3.gz` |
| `compress` | 压缩较早归档 | `.gz` 文件可解压读取 |
| `delaycompress` | 延迟一轮压缩最近归档 | `.1` 保持普通文本 |
| `missingok` | 日志缺失时不报错退出 | 仅适合允许文件暂时不存在的场景 |
| `notifempty` | 空活动文件不轮转 | 防止生成无内容归档 |

### 3. copytruncate 边界

`copytruncate` 先复制活动文件，再截断原文件，适合无法重新打开日志文件的写入进程。复制与截断之间存在极短竞态，期间的新日志可能丢失。

能够响应信号或重新打开文件的应用，应优先使用重命名、`create` 与对应的 `postrotate` 通知。本文没有并发写入者，因此只用 `copytruncate` 演示文件关系，不把它作为通用生产建议。

## 四、调试检查

`--debug` 解析配置并展示决策，但不会修改日志或状态文件。真实轮转前必须先执行该步骤。

### 1. 配置解析

```bash
logrotate --debug \
  --state /srv/ops-lab/log-rotation/logrotate.status \
  /srv/ops-lab/log-rotation/ops-lab.logrotate.conf
```

预期输出包含配置文件、日志路径和轮转判断，不应出现未知指令、权限或重复规则错误。

### 2. 无变更验证

```bash
ls -la /srv/ops-lab/log-rotation
cat /srv/ops-lab/log-rotation/ops-lab.log
```

调试后仍应只有原日志和配置文件，日志内容保持 `initial-entry`。`--debug` 不更新状态文件，因此不能把它当作实际轮转。

### 3. 退出状态

```bash
echo $?
```

应紧跟调试命令读取。退出状态 `0` 表示配置解析与调试完成；非零时保留完整错误并修复配置，不使用 `--force` 跳过解析问题。

## 五、首次轮转

`--force` 忽略时间判断并强制处理匹配日志，适合隔离测试新规则。它不适合在未知系统配置上批量运行。

### 1. 执行轮转

```bash
logrotate --force --verbose \
  --state /srv/ops-lab/log-rotation/logrotate.status \
  /srv/ops-lab/log-rotation/ops-lab.logrotate.conf
```

预期输出显示复制并截断 `ops-lab.log`，同时创建独立状态文件。

### 2. 文件结果

```bash
ls -l /srv/ops-lab/log-rotation
wc -c /srv/ops-lab/log-rotation/ops-lab.log
cat /srv/ops-lab/log-rotation/ops-lab.log.1
```

活动日志应为 0 字节，`.1` 包含 `initial-entry`。如果活动文件消失或 `.1` 为空，轮转不符合本例预期，不能继续验证后续压缩。

### 3. 状态记录

```bash
cat /srv/ops-lab/log-rotation/logrotate.status
```

状态文件应包含测试日志路径和轮转时间。动态时间以实验机为准，不能将状态文件复制到其他主机作为运行记录。

## 六、连续轮转

继续写入并执行多次强制轮转，用于验证延迟压缩和三个归档的保留上限。每次写入的内容不同，便于追踪文件代际。

### 1. 后续周期

```bash
printf '%s\n' 'second-entry' >> /srv/ops-lab/log-rotation/ops-lab.log
logrotate -f -s /srv/ops-lab/log-rotation/logrotate.status /srv/ops-lab/log-rotation/ops-lab.logrotate.conf
printf '%s\n' 'third-entry' >> /srv/ops-lab/log-rotation/ops-lab.log
logrotate -f -s /srv/ops-lab/log-rotation/logrotate.status /srv/ops-lab/log-rotation/ops-lab.logrotate.conf
printf '%s\n' 'fourth-entry' >> /srv/ops-lab/log-rotation/ops-lab.log
logrotate -f -s /srv/ops-lab/log-rotation/logrotate.status /srv/ops-lab/log-rotation/ops-lab.logrotate.conf
```

三次命令都应返回 `0`。任一次失败时停止后续周期，避免归档代际与预期错位。

### 2. 归档代际

```bash
ls -l /srv/ops-lab/log-rotation/ops-lab.log*
cat /srv/ops-lab/log-rotation/ops-lab.log.1
gzip -cd /srv/ops-lab/log-rotation/ops-lab.log.2.gz
gzip -cd /srv/ops-lab/log-rotation/ops-lab.log.3.gz
```

预期 `.1` 为 `fourth-entry`，`.2.gz` 为 `third-entry`，`.3.gz` 为 `second-entry`。最早的 `initial-entry` 已超过 `rotate 3` 上限而被删除。

### 3. 写入连续性

```bash
printf '%s\n' 'fifth-entry' >> /srv/ops-lab/log-rotation/ops-lab.log
cat /srv/ops-lab/log-rotation/ops-lab.log
```

活动文件应输出 `fifth-entry`，证明截断后仍能写入原路径。这里是命令行重新打开文件的验证，不证明长期运行的应用在并发轮转时绝对不丢日志。

## 七、系统调度边界

Ubuntu 的 logrotate 软件包可以通过系统 Timer 或兼容日常任务触发。具体方式以当前安装包和单元状态为准。

### 1. 调度检查

```bash
systemctl status logrotate.timer --no-pager
systemctl list-timers --all logrotate.timer
```

如果 Timer 存在，检查下一次触发时间和最近结果。本文使用独立配置手动验证，不把测试规则放入 `/etc/logrotate.d`，因此系统 Timer 不会自动处理它。

### 2. 生产接入

正式接入通常把经过验证的规则放到系统包含目录，并由现有调度统一执行。接入前必须核对文件所有者、写入进程的重开方式、轮转周期、磁盘预算和 `postrotate` 权限。

接入后至少观察一个真实调度周期，核对 Timer 或兼容调度的结果、活动文件写入、归档内容和磁盘占用。手动 `--force` 成功不能替代自动触发验证。

### 3. Journal 边界

Journal 使用自身的持久化与保留配置，不由本文的文件规则轮转。按单元与时间查询 Journal 的方法见[系统日志与 journalctl](../04-processes-systemd/03-journalctl.md)。

```bash
journalctl --disk-usage
systemctl status systemd-journald --no-pager
```

这两条命令用于确认 Journal 占用和服务状态，不应把 `/var/log/journal` 添加到 logrotate 规则中。

## 八、轮转异常

失败时先使用 `--debug` 和 `--verbose` 保留决策证据，再检查配置、权限、状态文件和写入进程。

| 异常类型 | 定位证据 | 正确处理 |
|----------|----------|----------|
| 配置错误 | `--debug` 报告未知指令、缺失花括号或重复路径 | 修正规则并重新调试，不用强制轮转绕过语法问题 |
| 权限错误 | `--verbose` 报告无法读写日志、父目录或状态文件 | 按实际执行身份修复最小权限；不要假设 `su` 会改变脚本身份 |
| 写入中断 | 归档存在但活动日志长期为空，应用仍持有旧文件描述符 | 选择 `create`、`copytruncate` 或重开信号，并产生新日志验证活动路径 |

`prerotate` 与 `postrotate` 脚本按 logrotate 进程身份执行。规则中的 `su` 只改变日志文件处理阶段的身份，不能作为提升脚本权限的手段。

## 九、实验清理

清理前确认目录只包含本篇的日志、归档、配置和状态文件。

### 1. 对象确认

```bash
find /srv/ops-lab/log-rotation -maxdepth 1 -printf '%f\n' | sort
```

如果出现其他文件，先调查来源，不执行整目录删除。

### 2. 文件删除

```bash
rm -- /srv/ops-lab/log-rotation/ops-lab.log
rm -- /srv/ops-lab/log-rotation/ops-lab.log.1
rm -- /srv/ops-lab/log-rotation/ops-lab.log.2.gz
rm -- /srv/ops-lab/log-rotation/ops-lab.log.3.gz
rm -- /srv/ops-lab/log-rotation/logrotate.status
rm -- /srv/ops-lab/log-rotation/ops-lab.logrotate.conf
sudo rmdir -- /srv/ops-lab/log-rotation
```

不存在某个归档时，`rm` 会返回非零，应根据实际 `find` 结果删除本篇对象，不改用通配递归删除。本文不卸载 logrotate，因为它可能被系统任务使用。

本文证明了独立配置解析、强制轮转、延迟压缩、三个归档保留和活动路径继续写入。它没有证明真实应用能够安全使用 `copytruncate`，生产规则仍需结合应用的文件重开机制和磁盘预算验证。

官方依据：[Ubuntu 26.04 logrotate 软件包](https://packages.ubuntu.com/resolute/logrotate)与 [Ubuntu logrotate 手册](https://manpages.ubuntu.com/manpages/resolute/man8/logrotate.8.html)。
