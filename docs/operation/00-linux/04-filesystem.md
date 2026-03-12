# 2.1 文件系统与目录结构

## Linux 目录结构

Linux 只有一棵目录树，根节点是 `/`（根目录）。不同的磁盘、分区都挂载在这棵树的某个节点上。

```
/
├── bin/        → 基础命令（ls、cp、mv...）
├── boot/       → 启动相关文件（内核、引导程序）
├── dev/        → 设备文件（硬盘、USB、终端...）
├── etc/        → 系统配置文件
├── home/       → 用户主目录
│   ├── alice/  → 用户 alice 的目录
│   └── bob/    → 用户 bob 的目录
├── lib/        → 共享库文件
├── media/      → 可移动设备挂载点（U盘、光盘）
├── mnt/        → 临时挂载点
├── opt/        → 第三方软件安装目录
├── proc/       → 内核和进程的虚拟文件系统（内存中）
├── root/       → root 用户的主目录
├── run/        → 运行时数据（进程ID文件等）
├── sbin/       → 系统管理命令（需要 root 权限）
├── srv/        → 服务数据目录
├── sys/        → 内核设备信息（虚拟文件系统）
├── tmp/        → 临时文件（重启后清空）
├── usr/        → 用户程序和数据
│   ├── bin/    → 用户命令（大多数命令都在这里）
│   ├── lib/    → 库文件
│   ├── local/  → 本地安装的软件
│   └── share/  → 共享数据（文档、图标...）
└── var/        → 可变数据（日志、数据库、邮件...）
    ├── log/    → 系统日志
    ├── www/    → Web 服务器文件
    └── spool/  → 队列数据（打印、邮件...）
```

---

## 重点目录详解

### `/etc` - 配置文件的家

几乎所有软件的配置文件都放在这里：

```bash
/etc/
├── passwd          # 用户账户信息
├── shadow          # 用户密码（加密存储）
├── group           # 用户组信息
├── hostname        # 主机名
├── hosts           # 本地 DNS 解析
├── fstab           # 文件系统挂载配置
├── crontab         # 系统级定时任务
├── ssh/            # SSH 服务配置
│   └── sshd_config # SSH 服务端配置
├── nginx/          # Nginx 配置
│   └── nginx.conf
└── systemd/        # 服务管理配置
    └── system/
```

```bash
# 查看本机 hosts 配置
$ cat /etc/hosts
127.0.0.1   localhost
127.0.1.1   ubuntu

# 查看所有用户
$ cat /etc/passwd
root:x:0:0:root:/root:/bin/bash
john:x:1000:1000:John,,,:/home/john:/bin/bash
```

### `/var/log` - 日志都在这里

出了问题先看日志，这是排查问题的第一步：

```bash
/var/log/
├── syslog          # 系统综合日志（Ubuntu）
├── messages        # 系统综合日志（CentOS）
├── auth.log        # 认证和授权日志（SSH 登录记录）
├── kern.log        # 内核日志
├── dmesg           # 硬件启动日志
├── apt/            # APT 包管理日志
└── nginx/          # Nginx 访问和错误日志
    ├── access.log
    └── error.log
```

```bash
# 查看最近的系统日志
$ tail -100 /var/log/syslog

# 查看 SSH 登录失败记录
$ grep "Failed password" /var/log/auth.log

# 实时查看 nginx 错误日志
$ tail -f /var/log/nginx/error.log
```

### `/proc` - 进程和内核的"窗口"

`/proc` 是一个虚拟文件系统，不占用磁盘空间，内容由内核实时生成：

```bash
# 查看 CPU 信息
$ cat /proc/cpuinfo

# 查看内存信息
$ cat /proc/meminfo

# 查看系统负载（1分钟、5分钟、15分钟的平均值）
$ cat /proc/loadavg
0.10 0.15 0.08 1/356 12345

# 查看进程 1234 的详细信息
$ ls /proc/1234/
$ cat /proc/1234/cmdline    # 启动命令
$ cat /proc/1234/status     # 进程状态
```

---

## 文件类型

Linux 中的文件类型，通过 `ls -l` 第一个字符识别：

| 字符 | 类型 | 示例 |
|------|------|------|
| `-` | 普通文件 | `/etc/hosts` |
| `d` | 目录 | `/home/john/` |
| `l` | 符号链接（软链接） | `/bin → /usr/bin` |
| `b` | 块设备 | `/dev/sda` |
| `c` | 字符设备 | `/dev/tty` |
| `p` | 管道文件 | FIFO |
| `s` | 套接字文件 | `.sock` 文件 |

```bash
# 查看文件类型（更直观）
$ file /etc/hosts
/etc/hosts: ASCII text

$ file /bin/ls
/bin/ls: ELF 64-bit LSB pie executable, x86-64...

$ file /dev/sda
/dev/sda: block special (8/0)
```

---

## 路径：绝对路径 vs 相对路径

**绝对路径**：从根目录 `/` 开始的完整路径

```bash
$ cat /home/john/Documents/readme.txt
$ cd /var/log/nginx
```

**相对路径**：相对于当前目录的路径

```bash
# 假设当前在 /home/john
$ cat Documents/readme.txt      # 相当于 /home/john/Documents/readme.txt
$ cd ../bob                      # 相当于 /home/bob
```

**特殊路径符号：**

| 符号 | 含义 |
|------|------|
| `.` | 当前目录 |
| `..` | 上级目录 |
| `~` | 当前用户的 home 目录 |
| `-` | 上一次所在目录（配合 `cd` 使用） |

```bash
$ cp ./config.json ~/backup/    # 将当前目录的 config.json 复制到 home/backup
$ cd -                          # 回到上一个目录
```

---

## 磁盘挂载概念

Linux 中访问硬盘、U盘，需要先**挂载**到目录树的某个节点：

```bash
# 查看已挂载的文件系统
$ df -h
文件系统        容量  已用  可用 已用% 挂载点
/dev/sda1        20G   8G   11G   43% /
tmpfs           2.0G   0  2.0G    0% /dev/shm
/dev/sda2       100G  50G   45G   53% /data

# 查看磁盘分区
$ lsblk
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sda      8:0    0   20G  0 disk
├─sda1   8:1    0   19G  0 part /
└─sda2   8:2    0    1G  0 part [SWAP]

# 手动挂载（需要 root）
# mount <设备> <挂载点>
$ mount /dev/sdb1 /mnt/usb

# 卸载
$ umount /mnt/usb
```

---

## 小结

| 目录 | 记忆要点 |
|------|----------|
| `/etc` | 配置文件，改配置来这里 |
| `/var/log` | 日志文件，出问题来这里 |
| `/home` | 用户文件，个人数据在这里 |
| `/tmp` | 临时文件，重启即清空 |
| `/proc` | 进程和内核信息，只读的虚拟文件 |
| `/usr/bin` | 大多数用户命令的存放位置 |
| `/opt` | 第三方软件（如 JDK、IDEA）的安装位置 |
