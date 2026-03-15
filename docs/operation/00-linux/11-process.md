---
title: "5.1 进程管理"
category: "运维 · Linux"
tags:
  - Linux
excerpt: "进程（Process）：程序的一次运行实例。每个进程都有唯一的 PID（Process ID）。 top 内的快捷键： | 键 | 作用 | |----|------| | q | 退出 | | k | 杀死进程（输入 PID） | | M..."
---

# 5.1 进程管理

## 进程基础概念

**进程（Process）**：程序的一次运行实例。每个进程都有唯一的 PID（Process ID）。

```
进程的关键属性：
PID    - 进程唯一标识符
PPID   - 父进程 PID（每个进程由某个进程创建）
UID    - 进程所属用户（决定它能访问哪些资源）
状态   - Running / Sleeping / Stopped / Zombie
优先级 - 决定 CPU 调度顺序

进程树（所有进程都源自 PID=1 的 init/systemd）：
systemd(1)
├── sshd(1234)           ← SSH 守护进程
│   └── bash(5678)       ← 你的登录 Shell
│       └── vim(9012)    ← 你启动的 Vim
├── nginx(2345)          ← Web 服务器
└── cron(3456)           ← 定时任务
```

---

## 查看进程

### ps - 进程快照

```bash
# 查看当前终端的进程
$ ps

# 查看所有进程（最常用的组合）
$ ps aux
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1 225876  9012 ?        Ss   Jan10   0:01 /sbin/init
nginx     1234  0.1  0.5  55680 20480 ?        S    09:00   0:05 nginx: worker

# ps aux 各列含义：
# USER   进程所有者
# PID    进程ID
# %CPU   CPU 使用率
# %MEM   内存使用率
# VSZ    虚拟内存大小（KB）
# RSS    实际占用内存（KB）
# STAT   进程状态（S=Sleep, R=Run, Z=Zombie, D=等待IO）
# TIME   累计使用 CPU 时间
# COMMAND 命令名

# 另一种常用格式（树形显示）
$ ps -ef
$ ps -ef --forest    # 树形结构
```

### top - 实时监控

```bash
$ top
```

```
top - 10:30:01 up 5 days, 2 users,  load average: 0.15, 0.10, 0.08
Tasks: 145 total,   1 running, 144 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.3 us,  0.5 sy,  0.0 ni, 96.8 id,  0.3 wa,  0.0 hi,  0.1 si
MiB Mem :   3934.9 total,    234.5 free,   2890.1 used,    810.3 buff/cache
MiB Swap:   2048.0 total,   2040.3 free,      7.7 used.    827.2 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1234 john      20   0  663644  45768  26048 R   3.3   1.1   0:01.23 node
 5678 root      20   0  198020  11008   8320 S   0.3   0.3   0:00.55 sshd
```

**top 内的快捷键：**

| 键 | 作用 |
|----|------|
| `q` | 退出 |
| `k` | 杀死进程（输入 PID） |
| `M` | 按内存使用排序 |
| `P` | 按 CPU 使用排序 |
| `T` | 按运行时间排序 |
| `1` | 显示每个 CPU 核心 |
| `u` | 只显示指定用户的进程 |
| `h` | 帮助 |

### htop - 更友好的 top（推荐）

```bash
# 安装
$ sudo apt install htop   # Ubuntu
$ sudo yum install htop   # CentOS

# 运行
$ htop
```

htop 有彩色界面，支持鼠标点击，可以直接选择进程操作。

---

## 终止进程

### kill 命令

```bash
# kill 发送信号给进程，不一定是"杀死"
# 格式：kill -信号 PID

# 常用信号
$ kill 1234             # 发送 SIGTERM（15），请求进程优雅退出
$ kill -15 1234         # 同上
$ kill -SIGTERM 1234    # 同上

$ kill -9 1234          # 发送 SIGKILL，强制立即终止（无法被进程捕获）
$ kill -SIGKILL 1234    # 同上

$ kill -1 1234          # 发送 SIGHUP，重新加载配置（对 nginx 等有效）
$ kill -HUP 1234

$ kill -0 1234          # 测试进程是否存在（不发送实际信号）
```

**信号速查：**

| 信号 | 编号 | 含义 |
|------|------|------|
| SIGTERM | 15 | 请求优雅终止（默认） |
| SIGKILL | 9 | 强制终止，不可被捕获 |
| SIGHUP | 1 | 挂起 / 重新加载配置 |
| SIGINT | 2 | 中断（等同于 Ctrl+C） |
| SIGSTOP | 19 | 暂停进程（不可被捕获） |
| SIGCONT | 18 | 继续被暂停的进程 |

### killall 和 pkill

```bash
# 按名称杀死进程（不需要 PID）
$ killall nginx            # 杀死所有名为 nginx 的进程
$ killall -9 java          # 强制杀死所有 java 进程

# pkill 支持正则和更多选项
$ pkill -9 -f "node app.js"    # 按完整命令行匹配
$ pkill -u alice               # 杀死 alice 用户的所有进程
```

---

## 后台运行与作业控制

### 让进程在后台运行

```bash
# 在命令后加 & 使其在后台运行
$ ./long-running-script.sh &
[1] 12345       ← [作业号] PID

# 查看后台作业
$ jobs
[1]+  Running    ./long-running-script.sh &
[2]-  Stopped    vim file.txt

# 将后台作业带回前台
$ fg %1         # 将作业 1 带回前台
$ fg            # 将最近的后台作业带回前台

# 将前台进程移到后台
# Ctrl+Z 暂停前台进程
$ vim file.txt
# 按 Ctrl+Z
[1]+  Stopped    vim file.txt

# 让暂停的作业在后台继续运行
$ bg %1
```

### nohup - 关闭终端后继续运行

```bash
# 普通后台进程会在终端关闭时收到 SIGHUP 并退出
# nohup 让进程忽略 SIGHUP

$ nohup ./app.sh &
$ nohup ./app.sh > /var/log/app.log 2>&1 &

# 输出默认写到 nohup.out，建议手动指定输出文件
```

### disown - 与当前 Shell 解除关联

```bash
# 如果已经用 & 启动了进程，可以用 disown 让它脱离当前 Shell
$ ./app.sh &
$ disown %1
```

---

## systemd：服务管理

现代 Linux（Ubuntu 16.04+、CentOS 7+）使用 `systemd` 管理系统服务。

### 服务管理常用命令

```bash
# 启动/停止/重启服务
$ sudo systemctl start nginx
$ sudo systemctl stop nginx
$ sudo systemctl restart nginx

# 重新加载配置（不停止服务，更优雅）
$ sudo systemctl reload nginx

# 查看服务状态
$ sudo systemctl status nginx
● nginx.service - A high performance web server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled)
     Active: active (running) since Wed 2024-01-10 09:00:00 UTC; 1h ago
    Process: 1234 ExecStartPre=/usr/sbin/nginx -t
   Main PID: 1235 (nginx)
      Tasks: 5 (limit: 4915)
     Memory: 12.0M

# 设置开机自启 / 禁止开机自启
$ sudo systemctl enable nginx
$ sudo systemctl disable nginx

# 查看是否设置了开机自启
$ sudo systemctl is-enabled nginx

# 查看所有服务的状态
$ sudo systemctl list-units --type=service

# 查看启动失败的服务
$ sudo systemctl --failed
```

### 查看服务日志（journalctl）

```bash
# 查看指定服务的日志
$ journalctl -u nginx

# 查看最近的日志
$ journalctl -u nginx -n 50

# 实时跟踪日志
$ journalctl -u nginx -f

# 查看某个时间段的日志
$ journalctl -u nginx --since "2024-01-10 09:00:00" --until "2024-01-10 10:00:00"

# 查看本次启动后的日志
$ journalctl -b

# 查看内核日志
$ journalctl -k
```

---

## 进程优先级

```bash
# 优先级范围：-20（最高）到 19（最低），默认 0

# 以指定优先级启动程序（nice）
$ nice -n 10 ./cpu-intensive.sh    # 低优先级运行
$ nice -n -10 ./critical.sh        # 高优先级（需要 root）

# 修改已运行进程的优先级（renice）
$ renice -n 5 -p 1234              # 修改 PID 1234 的优先级为 5
$ renice -n 5 -u john              # 修改 john 所有进程的优先级

# 在 top 中修改：按 r，输入 PID 和新的 nice 值
```
