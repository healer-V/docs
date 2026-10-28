---
title: "CPU 与内存异常"
tags:
  - Linux
  - CPU
  - 内存
excerpt: "区分系统负载、CPU 饱和与内存压力，使用受限 stress-ng 实验关联进程、运行队列、交换和 PSI 证据。"
date: 2026-09-24
---

# CPU 与内存异常

负载升高不等于 CPU 一定耗尽，内存使用率高也不等于必须立即释放缓存。Linux 负载包含正在运行和不可中断等待的任务；内存需要结合 `MemAvailable`、交换活动与内存压力判断，而不是只看 `free` 列或单个百分比。

本文在隔离虚拟机中使用 `stress-ng` 创建单 CPU 工作线程和 128 MiB 内存负载，每个实验最多运行 20 秒。实验不模拟生产容量，也不用于得出调优参数。

::: danger 不在生产主机执行压力注入
即使工作线程和时间受限，压力工具仍会与业务争用 CPU、内存和调度资源。只能在有快照、没有业务负载的实验机中执行，并始终保留停止命令。
:::

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可运行的 Linux 实验机。负载值、调度延迟和 PSI 指标受 CPU 数量、内存容量与虚拟化环境影响，本文只定义观察方法和预期趋势。
:::

## 一、资源指标

### 1. CPU 与负载

| 指标 | 含义 | 判断边界 |
|------|------|----------|
| load average | 1、5、15 分钟内可运行与不可中断任务的平均数量 | 必须结合逻辑 CPU 数和任务状态 |
| `%us` | 用户态 CPU 时间 | 可能来自业务计算或失控循环 |
| `%sy` | 内核态 CPU 时间 | 可能来自系统调用、中断或驱动 |
| `%wa` | CPU 空闲但等待 I/O 的时间 | 不是磁盘利用率，需结合 I/O 证据 |
| 运行队列 | 等待获得 CPU 的可运行任务 | 持续大于可用 CPU 数才具有压力意义 |

单核主机负载 1 与 16 核主机负载 1 的含义不同。短时峰值也不等于持续饱和，应至少观察连续样本与对应进程。

### 2. 内存与交换

| 指标 | 含义 | 判断边界 |
|------|------|----------|
| `MemAvailable` | 估算无需交换即可供新程序使用的内存 | 比单看 `MemFree` 更接近可用能力 |
| page cache | 用于缓存文件数据，可在需要时回收 | 占用高不自动表示泄漏 |
| swap used | 已换出的匿名页数量 | 非零不等于当前仍在频繁交换 |
| `si` / `so` | 每秒换入与换出 | 持续活动说明内存回收压力 |
| memory PSI | 任务因内存资源受阻的时间比例 | 应与业务延迟和回收事件关联 |

内存异常需要回答两个问题：系统是否正在承受回收或交换压力，哪个进程的常驻内存或分配行为与时间窗口一致。

## 二、系统基线

在任何注入前保存硬件容量、当前负载和压力指标。

### 1. 容量与运行状态

```bash
nproc
uptime
free -h
swapon --show
vmstat 1 5
```

`vmstat` 的首行通常是启动以来平均值，后续行才是采样间隔。重点观察运行队列 `r`、阻塞任务 `b`、交换 `si/so`、I/O 等待 `wa` 和 CPU 空闲 `id`。

### 2. 压力指标

```bash
cat /proc/pressure/cpu
cat /proc/pressure/memory
cat /proc/pressure/io
```

PSI（Pressure Stall Information，压力停顿信息）中的 `some` 表示至少部分任务因资源受阻，`full` 表示所有非空闲任务同时受阻。CPU 通常只有 `some` 行；内存与 I/O 可以同时提供 `some` 和 `full`。

### 3. 进程快照

```bash
ps -eo pid,ppid,state,ni,pcpu,pmem,rss,vsz,comm \
  --sort=-pcpu | head -n 15
ps -eo pid,ppid,state,ni,pcpu,pmem,rss,vsz,comm \
  --sort=-rss | head -n 15
```

`RSS` 是当前驻留物理内存，`VSZ` 是虚拟地址空间，两者不能互相替代。瞬时 `ps` 快照可能错过短任务，持续问题应配合多次采样或监控时序数据。

## 三、CPU 压力

### 1. 前置条件

```bash
command -v stress-ng
pgrep -a stress-ng || true
uptime
```

缺少工具时，通过批准的软件包流程安装 Ubuntu 官方 `stress-ng`。若已有 `stress-ng` 进程，应先识别其所有者和用途，不能叠加实验。

### 2. 有界注入

```bash
stress-ng --cpu 1 --timeout 20s --metrics-brief &
OPS_CPU_STRESS_PID=$!
```

该命令只创建一个 CPU 工作线程，并由 `--timeout` 自动终止。紧急停止命令是 `kill "$OPS_CPU_STRESS_PID"`。

### 3. 同步观察

在另一个终端执行：

```bash
vmstat 1 10
ps -eo pid,state,pcpu,pmem,comm --sort=-pcpu | head
cat /proc/pressure/cpu
```

预期 `stress-ng` 出现在 CPU 排序前列，用户态 CPU 增长；运行队列变化取决于虚拟机 CPU 数量。多核系统只有一个工作线程时，总 CPU 不会全部饱和。

### 4. 恢复验证

```bash
wait "$OPS_CPU_STRESS_PID"
! pgrep -x stress-ng
vmstat 1 5
cat /proc/pressure/cpu
```

进程应在 20 秒后退出，CPU 使用回落。PSI 的累计值不会清零，比较时应关注短窗口平均值的变化，而不是期待 `total` 恢复为零。

## 四、内存压力

内存注入前必须确认可用内存明显高于 128 MiB，并预留系统与 SSH 会话空间。下面的门禁要求至少有 512 MiB `MemAvailable`。

### 1. 容量门禁

```bash
free -h
awk '/MemAvailable/ {print; if ($2 < 524288) exit 1}' /proc/meminfo
printf 'capacity gate: %s\n' "$?"
```

门禁非零时取消实验。512 MiB 只是本实验的最低安全条件，不是生产容量标准；主机已经有交换抖动、OOM 或业务告警时也不得注入。

### 2. 有界注入

```bash
stress-ng --vm 1 --vm-bytes 128M --vm-keep \
  --timeout 20s --metrics-brief &
OPS_MEMORY_STRESS_PID=$!
```

该命令由一个工作线程分配并访问 128 MiB 内存，20 秒后自动退出。紧急停止仍使用 `kill "$OPS_MEMORY_STRESS_PID"`。

### 3. 同步观察

```bash
free -h
vmstat 1 10
ps -eo pid,state,rss,vsz,pmem,comm --sort=-rss | head
cat /proc/pressure/memory
```

预期 `MemAvailable` 与缓存分布发生变化，`stress-ng` 的 RSS 上升。拥有充足内存时，`si/so` 和 memory PSI 可能仍接近零；这表示分配发生了，但没有形成明显内存压力。

### 4. 恢复验证

```bash
wait "$OPS_MEMORY_STRESS_PID"
! pgrep -x stress-ng
free -h
vmstat 1 5
```

进程退出后，其匿名内存应被回收。page cache 不需要为了“让 free 好看”而手工清空；强制丢弃缓存会破坏性能基线。

## 五、异常定位

### 1. CPU 路径

1. 用监控时间线确认告警是瞬时还是持续。
2. 比较负载与逻辑 CPU 数，检查运行队列和不可中断任务。
3. 找到同一窗口内 CPU 占用最高的进程和线程。
4. 区分用户态、内核态、I/O 等待和虚拟化 steal 时间。
5. 使用应用日志、请求量和调用链解释进程为何繁忙。
6. 修复后用同一指标窗口复测。

负载高但 CPU 空闲时，应关注 `D` 状态任务和 I/O；CPU 很高但负载不高时，可能只有少数线程在多核主机上计算。

### 2. 内存路径

```bash
ps -eo pid,ppid,rss,vsz,pmem,state,comm --sort=-rss | head -n 20
sudo journalctl -k --since '-1 hour' \
  | grep -Ei 'out of memory|oom-killer|killed process'
```

先看可用内存、交换活动和 PSI，再找高 RSS 进程。内核日志出现 OOM 记录时，要记录被杀进程、触发 cgroup 和当时内存状态，不能只重启服务后清除现场。

### 3. 容器与 cgroup

容器内看到的资源上限可能小于主机总量。进程因 cgroup 限制被杀时，主机 `free` 仍可能有大量可用内存。

```bash
systemd-cgls
systemd-cgtop --iterations=3
```

使用容器平台时还要检查对应 cgroup 的 `memory.current`、`memory.max` 和事件计数。主机指标与容器指标必须按同一资源边界解释。

## 六、判断矩阵

| 现象 | CPU 证据 | 内存证据 | 诊断方向 |
|------|----------|----------|----------|
| 负载高、CPU 高 | 运行队列持续增长 | 无明显压力 | 计算热点或线程竞争 |
| 负载高、CPU 空闲 | `b` 或 `D` 状态任务 | 任意 | I/O 或内核等待 |
| 内存占用高、无交换活动 | CPU 正常 | `MemAvailable` 充足、PSI 低 | 可能是正常缓存或稳定工作集 |
| `si/so` 持续、PSI 升高 | 系统态可能升高 | 可用内存低 | 内存压力与回收抖动 |
| 进程突然消失 | 任意 | 内核出现 OOM 记录 | OOM 或 cgroup 限制 |

资源排障的结论应包含时间窗口、资源边界、目标进程和恢复复测。单张 `top` 截图无法证明长期趋势，也不能说明触发原因。

