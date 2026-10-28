---
title: "磁盘与 I/O 异常"
tags:
  - Linux
  - 磁盘
  - I/O
excerpt: "区分块空间、inode、删除后占用与 I/O 延迟，使用小型 fio 文件实验和系统日志建立磁盘故障诊断链。"
date: 2026-09-24
---

# 磁盘与 I/O 异常

写入失败和写入变慢是两类问题。`No space left on device` 可能来自块空间或 inode 耗尽；目录看起来不大却无法释放空间，可能存在已删除但仍被进程打开的文件；请求延迟升高则需要检查设备队列、等待时间和内核错误。

本文先用只读证据区分容量与 I/O，再在隔离虚拟机的专用目录中执行一次 64 MiB 顺序写入和读取。实验只操作普通文件，不接触裸设备、分区表或真实业务卷。

::: danger 不对未知块设备执行写测试或 fsck
`fio --filename=/dev/...`、`dd of=/dev/...` 和对已挂载文件系统执行 `fsck` 都可能破坏数据。本文实验目标必须是新建的普通文件，并在执行前用 `test -f` 与 `findmnt` 核对路径。
:::

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可运行的 Linux 实验机。吞吐、延迟和设备利用率取决于存储介质、虚拟化与缓存策略，本文不提供虚构性能数值。
:::

## 一、故障分类

### 1. 容量与性能

| 类别 | 典型现象 | 首要证据 | 处理边界 |
|------|----------|----------|----------|
| 块空间耗尽 | 写入报告空间不足 | `df -h PATH` | 先确认文件归属，不盲删 |
| inode 耗尽 | 小文件创建失败 | `df -i PATH` | 找到生成者与保留策略 |
| 删除后仍占用 | `du` 下降但 `df` 不变 | `lsof +L1` | 正常重载或重启持有进程 |
| I/O 排队 | 延迟上升、任务处于 `D` 状态 | `iostat -xz`、PSI | 找到设备与工作负载 |
| 设备错误 | 只读挂载、重置或介质错误 | kernel journal、SMART | 保护数据并转入硬件处置 |

容量三种情形的隔离复现实验见[容量与文件系统](../06-storage-backup/02-capacity-filesystems.md)。本篇只保留排障入口，重点解释 I/O 证据。

### 2. 路径归属

```bash
findmnt --target /var/lib/example \
  --output SOURCE,TARGET,FSTYPE,OPTIONS
df -h /var/lib/example
df -i /var/lib/example
```

把示例路径替换为真实报错路径。容器挂载、bind mount 和网络文件系统可能让目录外观与实际存储设备不同，必须先找到挂载来源。

## 二、容量证据

### 1. 块与 inode

```bash
df --human-readable /var/lib/example
df --inodes /var/lib/example
du --summarize --human-readable /var/lib/example
```

`df` 观察整个文件系统，`du` 统计当前目录树可遍历的文件。二者口径不同，小幅差额并不自动表示故障。

### 2. 删除后打开

```bash
sudo lsof +L1
sudo lsof +L1 /var/lib/example 2>/dev/null
```

链接数为 0 且名称包含 `(deleted)` 的大文件会继续占用空间，直到最后一个文件描述符关闭。优先使用服务自身的日志重开或正常重启机制，不直接终止未知进程。

### 3. 安全清理

清理前至少确认文件所有者、生成机制、保留要求和恢复影响。以下操作不应作为空间告警的默认答案：

- 删除整个日志目录；
- 截断正在写入的数据库或队列文件；
- 对根目录执行无边界 `du` 扫描；
- 清除 package cache 后宣称根因已修复；
- 在未确认备份的情况下扩容或重建文件系统。

恢复空间只是止血，根因还需要解释哪个工作负载为何持续增长。

## 三、I/O 基线

### 1. 系统观察

```bash
vmstat 1 5
cat /proc/pressure/io
sudo iostat -xz 1 5
```

`vmstat` 观察阻塞任务与 CPU I/O 等待，PSI 观察任务因 I/O 停顿的时间，`iostat -xz` 展示设备吞吐、队列和延迟。单个 `%util` 值不能跨不同设备类型直接比较。

### 2. 进程观察

```bash
ps -eo pid,state,wchan:24,comm | awk '$2 ~ /D/'
sudo pidstat -d 1 5
```

`D` 表示不可中断睡眠，常见于 I/O 等待，但需要结合 `wchan`、设备指标和内核日志确认。`pidstat` 来自 `sysstat` 包，未安装时不要把缺少命令误判为没有 I/O 活动。

### 3. 内核事件

```bash
sudo journalctl -k --since '-1 hour' -p warning..alert --no-pager
sudo dmesg --level=warn,err
```

关注设备 reset、I/O error、文件系统错误、只读重新挂载和链路超时。内核错误出现时先保护数据和保存证据，不要立即反复重启或执行修复写操作。

## 四、隔离读写实验

实验目录位于普通文件系统，只验证工具和观察链路，不给存储设备定级。开始前要求至少有 1 GiB 可用空间，并确认目标文件不存在。

### 1. 空间门禁

```bash
test ! -e /srv/ops-lab/io
sudo mkdir -p /srv/ops-lab/io
sudo chown operator:"$(id -gn operator)" /srv/ops-lab/io
test "$(df --output=avail -B1 /srv/ops-lab/io | tail -1)" -gt 1073741824
test ! -e /srv/ops-lab/io/fio.bin
```

任一命令失败都应停止实验。目录如果预先存在，不能确认其内容归属，因此不得复用或清理。

### 2. 工具检查

```bash
command -v fio
command -v iostat
findmnt --target /srv/ops-lab/io \
  --output SOURCE,TARGET,FSTYPE,OPTIONS
```

缺少工具时通过批准的软件包流程安装 Ubuntu 官方 `fio` 与 `sysstat`。记录实验目录所属文件系统，避免把结果误归到另一设备。

### 3. 顺序写入

::: details 查看 64 MiB 顺序写入命令

```bash
fio --name=ops-lab-write \
  --filename=/srv/ops-lab/io/fio.bin \
  --rw=write \
  --bs=1M \
  --size=64M \
  --iodepth=1 \
  --direct=1 \
  --end_fsync=1 \
  --group_reporting
```

:::

该作业最多创建 64 MiB 普通文件，使用单队列深度并在结束时同步。重点记录带宽、完成延迟分布和错误，而不是把一次结果当成设备能力上限。

### 4. 顺序读取

::: details 查看 64 MiB 顺序读取命令

```bash
fio --name=ops-lab-read \
  --filename=/srv/ops-lab/io/fio.bin \
  --rw=read \
  --bs=1M \
  --size=64M \
  --iodepth=1 \
  --direct=1 \
  --group_reporting
```

:::

读取使用同一文件与块大小，便于对照。`direct=1` 尝试绕过页缓存，但具体支持和对齐约束由文件系统与设备决定；命令报错时应保留错误，不要改用裸设备规避。

### 5. 并行观察

fio 运行期间在另一终端执行：

```bash
sudo iostat -xz 1 10
cat /proc/pressure/io
ps -eo pid,state,wchan:24,comm | awk '$2 ~ /D/'
```

预期目标设备出现读写活动，fio 报告与 `iostat` 时间窗口大致对应。实验过短时采样可能错过峰值，应记录这一限制，不重复扩大写入量追求“漂亮数据”。

## 五、结果判断

### 1. 设备指标

| 指标 | 观察重点 | 易错结论 |
|------|----------|----------|
| `r/s`、`w/s` | 每秒请求数 | 请求多不等于吞吐一定高 |
| `rkB/s`、`wkB/s` | 数据吞吐 | 高吞吐不等于低延迟 |
| `await` | 请求平均等待时间 | 平均值可能掩盖尾延迟 |
| `aqu-sz` | 平均队列长度 | 不同设备并行能力不同 |
| `%util` | 设备处理 I/O 的时间比例 | NVMe 与多队列设备不能机械套用 100% 饱和判断 |
| I/O PSI | 任务因 I/O 停顿的比例 | 需结合业务延迟与 cgroup 范围 |

基线、告警窗口和恢复窗口必须使用相同采样口径。否则差异可能来自工具参数，而不是系统变化。

### 2. 根因路径

1. 用 `findmnt` 把故障路径映射到文件系统和设备。
2. 排除块空间、inode 与删除后打开文件。
3. 用连续采样确认队列、延迟和 PSI 是否持续异常。
4. 找到同一时间窗口的高 I/O 进程。
5. 检查内核是否报告设备或文件系统错误。
6. 结合云盘限额、阵列状态或存储服务端指标解释瓶颈。
7. 修复后用同一请求和同一指标复测。

`iostat` 高延迟证明请求等待时间增加，不直接说明是介质损坏。限速、邻居争用、同步写入、内存回写和远端存储都可能产生相似现象。

## 六、恢复与清理

### 1. 故障恢复

| 证据 | 恢复方向 | 禁止操作 |
|------|----------|----------|
| 块空间耗尽 | 按所有者和保留规则迁移或清理 | 删除未知大文件 |
| inode 耗尽 | 停止小文件生成，分批归档 | 无边界 `find -delete` |
| 删除后打开 | 正常重载或重启持有进程 | 直接 kill 关键进程 |
| 设备错误 | 摘流、只读保护、备份与硬件处置 | 对挂载卷直接 fsck |
| 性能限额 | 调整工作负载、队列或存储规格 | 用压力测试掩盖告警 |

### 2. 实验清理

```bash
test -f /srv/ops-lab/io/fio.bin
rm -- /srv/ops-lab/io/fio.bin
rmdir /srv/ops-lab/io
test ! -e /srv/ops-lab/io
```

只删除本篇创建的普通文件和空目录。若 `rmdir` 失败，先列出未知内容并停止，不得改用递归删除扩大范围。
