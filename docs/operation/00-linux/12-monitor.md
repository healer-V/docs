---
title: "5.2 系统资源监控"
category: "运维 · Linux"
tags:
  - Linux
excerpt: "负载的含义： 负载 = 正在运行的进程数 + 等待 CPU 的进程数 经验法则：负载值不超过 CPU 核心数，就是健康的 us（user）：用户程序使用的 CPU sy（system）：内核使用的 CPU id（idle）：空闲 CPU，越..."
---

# 5.2 系统资源监控

## CPU 监控

### 理解负载（Load Average）

```bash
$ uptime
10:30:01 up 5 days, 2:10, 2 users, load average: 1.23, 0.98, 0.75
                                                   ↑     ↑     ↑
                                                  1分钟 5分钟 15分钟
```

**负载的含义：**

- 负载 = 正在运行的进程数 + 等待 CPU 的进程数
- **经验法则**：负载值不超过 CPU 核心数，就是健康的

```bash
# 查看 CPU 核心数
$ nproc                    # 逻辑核心数
4
$ cat /proc/cpuinfo | grep "processor" | wc -l
4

# 规则：
# 4核 CPU，负载 4.0 = 100% 利用率（刚好满载）
# 4核 CPU，负载 8.0 = 200%（过载，有进程在排队等待）
# 4核 CPU，负载 2.0 = 50%（还有余量）
```

### top / htop 中的 CPU 信息

```bash
$ top
%Cpu(s):  2.3 us,  0.5 sy,  0.0 ni, 96.8 id,  0.3 wa,  0.0 hi,  0.1 si
           ↑        ↑        ↑        ↑         ↑
          用户态   内核态    nice    空闲       等待IO
```

- `us`（user）：用户程序使用的 CPU
- `sy`（system）：内核使用的 CPU
- `id`（idle）：空闲 CPU，越高越好
- `wa`（wait）：等待磁盘 IO，高说明磁盘成为瓶颈

### vmstat - 综合监控

```bash
# 每 2 秒输出一次统计，共输出 5 次
$ vmstat 2 5
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 1  0      0 234568  81920 810240    0    0     2    15   52  120  2  1 97  0  0
 0  0      0 234440  81920 810240    0    0     0    12   48  115  1  0 99  0  0

# 列说明：
# r   等待运行的进程数（持续 > CPU核数 说明 CPU 不够用）
# b   不可中断睡眠的进程数（通常是等待 IO）
# si/so  swap 换入/换出（出现说明内存不足）
# bi/bo  块设备读/写（磁盘 IO）
# us/sy/id/wa  CPU 使用率
```

---

## 内存监控

```bash
# 查看内存使用情况
$ free -h
              total        used        free      shared  buff/cache   available
Mem:           3.8G        2.8G        228M        125M        790M        808M
Swap:          2.0G        7.6M        2.0G

# 字段说明：
# total      总内存
# used       已使用（包含 buff/cache）
# free       完全空闲
# buff/cache 缓冲/缓存（可被快速释放）
# available  实际可用内存（free + 可释放的 buff/cache）
```

::: tip available 才是真正可用的内存
`free` 显示的 `free` 列很小是正常的，Linux 会把空闲内存用作 cache。看 `available` 列判断内存是否够用。
:::

```bash
# 实时查看内存（-s 每 N 秒刷新）
$ free -h -s 2

# 查看内存详细信息
$ cat /proc/meminfo

# 找出占用内存最多的进程
$ ps aux --sort=-%mem | head -10

# 按内存排序（在 top 中按 M 键）
```

---

## 磁盘监控

```bash
# 查看磁盘空间使用情况
$ df -h
文件系统        容量  已用  可用 已用% 挂载点
/dev/sda1        20G  8.0G   11G   43% /
tmpfs           2.0G     0  2.0G    0% /dev/shm
/dev/sda2       100G   50G   45G   53% /data

# 查看指定目录的磁盘使用
$ df -h /var

# 查看目录大小（du = disk usage）
$ du -sh /var/log/           # 查看 /var/log 总大小
$ du -sh /var/log/*          # 查看 /var/log 下每个子目录的大小
$ du -h --max-depth=1 /var/  # 只展开一层

# 找出最大的目录和文件（磁盘满时必用）
$ du -h /var | sort -rh | head -20
```

### 磁盘 IO 监控

```bash
# iostat - 磁盘 IO 统计（需安装 sysstat）
$ sudo apt install sysstat
$ iostat -x 2
Device  r/s    w/s   rkB/s   wkB/s  await  svctm  %util
sda    0.50  10.20   20.00  408.00   1.23   0.45   0.48

# 列说明：
# r/s  w/s    每秒读/写请求数
# rkB/s wkB/s 每秒读/写 KB 数
# await       平均 IO 等待时间（毫秒），越低越好
# %util       磁盘繁忙程度，接近 100% 说明磁盘成为瓶颈
```

---

## 网络监控

```bash
# 查看网络接口统计
$ ip -s link show eth0

# netstat / ss：查看网络连接
# netstat 已废弃，推荐使用 ss（更快）

# 查看所有监听的端口
$ ss -tlnp
State   Recv-Q Send-Q  Local Address:Port    Peer Address:Port  Process
LISTEN  0      128     0.0.0.0:22           0.0.0.0:*          sshd
LISTEN  0      511     0.0.0.0:80           0.0.0.0:*          nginx

# 参数说明：
# -t  TCP 连接
# -u  UDP 连接
# -l  只显示监听状态
# -n  显示数字（不解析域名）
# -p  显示进程名

# 查看已建立的 TCP 连接
$ ss -tn state established

# 查看某个端口的连接数
$ ss -tn | grep ":80" | wc -l

# 实时网络流量（需安装 iftop 或 nethogs）
$ sudo apt install iftop
$ sudo iftop -i eth0           # 查看各 IP 的流量

$ sudo apt install nethogs
$ sudo nethogs eth0             # 按进程查看流量
```

---

## 综合监控工具

### nmon（推荐服务器监控）

```bash
$ sudo apt install nmon
$ nmon
# 按键选择监控项：
# c - CPU     m - Memory    d - Disk
# n - Network t - Top procs k - Kernel
```

### dstat

```bash
$ sudo apt install dstat
$ dstat
---total-cpu-usage--- -dsk/total- -net/total- ---paging-- ---system--
usr sys idl wai stl| read  writ| recv  send|  in   out | int   csw
  2   1  97   0   0|  24k  408k|  226B  880B|   0     0 |  52   120
```

---

## 监控报警脚本示例

```bash
#!/bin/bash
# monitor.sh - 简单的系统监控报警脚本

CPU_THRESHOLD=80
MEM_THRESHOLD=90
DISK_THRESHOLD=85

# 检查 CPU 使用率
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
if (( $(echo "$CPU_USAGE > $CPU_THRESHOLD" | bc -l) )); then
    echo "⚠️ CPU 使用率过高: ${CPU_USAGE}%"
fi

# 检查内存使用率
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -gt "$MEM_THRESHOLD" ]; then
    echo "⚠️ 内存使用率过高: ${MEM_USAGE}%"
fi

# 检查磁盘使用率
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
    echo "⚠️ 磁盘使用率过高: ${DISK_USAGE}%"
fi
```

---

## 快速诊断系统问题的思路

```bash
# 1. 系统整体状态
$ uptime && free -h && df -h

# 2. 是否有高 CPU 进程
$ ps aux --sort=-%cpu | head -10

# 3. 是否有高内存进程
$ ps aux --sort=-%mem | head -10

# 4. 磁盘是否满了
$ df -h | grep -v tmpfs

# 5. 有没有 D 状态（等待 IO）的进程
$ ps aux | awk '$8 ~ /^D/'

# 6. 系统日志有没有报错
$ tail -100 /var/log/syslog | grep -iE "error|warn|crit"
```
