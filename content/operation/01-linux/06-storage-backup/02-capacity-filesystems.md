---
title: "容量与文件系统"
tags:
  - Linux
  - 文件系统
  - 排障
excerpt: "区分文件系统块空间、inode 和目录可见占用，通过隔离 loop 文件系统复现容量耗尽、inode 耗尽及删除文件后空间未释放。"
date: 2026-09-24
---

# 容量与文件系统

应用报告 `No space left on device` 时，原因不一定是文件数据占满磁盘。文件系统还可能耗尽 inode，或者文件已经从目录删除但仍被进程打开。三种情况都可能阻止写入，却需要不同证据和恢复动作。

诊断顺序是：**先确认报错路径属于哪个文件系统，再分别检查块空间和 inode，最后解释 `df` 与 `du` 的差额**。本文使用 64 MiB loop 文件系统复现三类现象，不向系统盘写入填充数据。

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可运行的 Linux 实验机。ext4 元数据、保留块、实际可用空间和 inode 数量必须以实验机输出为准；文中百分比和失败位置只描述预期趋势。
:::

## 一、容量证据

`df`、`du` 和 inode 统计观察的是不同对象。先选对证据，才能避免把“目录很小”误判成“文件系统一定有空间”。

### 1. 命令视角

| 命令 | 观察对象 | 能回答的问题 | 不能单独证明的结论 |
|------|----------|--------------|--------------------|
| `df -h PATH` | PATH 所在文件系统的块空间 | 文件系统还剩多少可分配空间 | 哪个目录或进程占用了空间 |
| `df -i PATH` | 文件系统的 inode | 是否还能创建新文件和目录项 | 文件内容占用多少字节 |
| `du -sh PATH` | 目录树可见文件的已分配空间 | 当前目录可遍历内容占用多少 | 已删除但仍被打开的文件大小 |
| `findmnt -T PATH` | PATH 所属挂载 | 报错路径实际落在哪个文件系统 | 容量为何不足 |

### 2. inode 含义

inode 保存文件类型、权限、所有者、大小和数据块位置等元数据。每个普通文件和目录都需要 inode；大量空小文件可以在块空间仍充足时先耗尽 inode。

删除目录项通常会减少文件链接数。只有链接数归零且没有进程继续打开该文件时，内核才回收它占用的数据块。

### 3. 诊断入口

```bash
findmnt --target /var/lib/example --output SOURCE,TARGET,FSTYPE,OPTIONS
df --human-readable /var/lib/example
df --inodes /var/lib/example
du --summarize --human-readable /var/lib/example
```

真实故障时把示例路径替换为报错路径。不要从整个根目录盲目执行高开销扫描，也不要在确认文件归属前直接删除大文件。

## 二、隔离文件系统

本实验直接在 loop 设备上创建 ext4，不再建立分区，因为本篇只观察文件系统容量。设备与挂载关系的完整模型见[磁盘与挂载](./01-disks-mounts.md)。

### 1. 工具与路径

```bash
command -v losetup
command -v mkfs.ext4
command -v findmnt
command -v df
command -v du
command -v lsof
test ! -e /srv/ops-lab/capacity-lab
test ! -e /mnt/ops-lab-capacity
```

缺少 `lsof` 时先用 APT 预览并安装 Ubuntu 官方 `lsof` 包。两个 `test` 都返回 `0` 才能继续，已有路径不得覆盖。

### 2. 文件系统创建

下面的完整步骤创建 64 MiB 镜像，并把 inode 数量限制为较小值，便于在隔离环境中观察耗尽现象。

::: details 查看隔离文件系统创建命令

```bash
sudo mkdir -p /srv/ops-lab/capacity-lab
sudo chown operator:"$(id -gn operator)" /srv/ops-lab/capacity-lab
truncate --size 64M /srv/ops-lab/capacity-lab/capacity.img
OPS_LAB_CAPACITY_IMAGE=/srv/ops-lab/capacity-lab/capacity.img
OPS_LAB_CAPACITY_DEVICE=$(sudo losetup --find --show "$OPS_LAB_CAPACITY_IMAGE")
test "$(sudo losetup --noheadings --output BACK-FILE "$OPS_LAB_CAPACITY_DEVICE")" = "$OPS_LAB_CAPACITY_IMAGE"
sudo mkfs.ext4 -N 256 -L OPS_CAPACITY "$OPS_LAB_CAPACITY_DEVICE"
sudo mkdir /mnt/ops-lab-capacity
sudo mount "$OPS_LAB_CAPACITY_DEVICE" /mnt/ops-lab-capacity
sudo chown operator:"$(id -gn operator)" /mnt/ops-lab-capacity
findmnt --mountpoint /mnt/ops-lab-capacity --output SOURCE,TARGET,FSTYPE,OPTIONS
df -h /mnt/ops-lab-capacity
df -i /mnt/ops-lab-capacity
```

:::

挂载来源必须是刚创建的 loop 设备，类型必须是 ext4。`-N 256` 请求创建约 256 个 inode，实际可用数量以 `df -i` 为准。

### 3. 基线记录

```bash
df --block-size=1M /mnt/ops-lab-capacity
df --inodes /mnt/ops-lab-capacity
du --summarize --block-size=1M /mnt/ops-lab-capacity
```

记录块总量、可用量、inode 总量和目录占用。ext4 元数据及保留空间会让可用容量小于镜像文件的 64 MiB，这不是数据丢失。

## 三、块空间耗尽

块空间耗尽的特征是 `df -h` 接近 100%，而 `df -i` 仍有大量可用 inode。测试只向隔离挂载点写入。

### 1. 正常增长

```bash
dd if=/dev/zero of=/mnt/ops-lab-capacity/payload.bin bs=1M count=16 status=progress
df -h /mnt/ops-lab-capacity
df -i /mnt/ops-lab-capacity
du -sh /mnt/ops-lab-capacity
```

`df` 和 `du` 的已用空间都应明显增长，inode 只减少少量。两者数值不必完全相等，因为 `df` 包含文件系统元数据和保留空间。

### 2. 容量故障

```bash
dd if=/dev/zero of=/mnt/ops-lab-capacity/capacity-fill.bin bs=1M count=80 status=progress
printf 'dd exit status: %s\n' "$?"
df -h /mnt/ops-lab-capacity
df -i /mnt/ops-lab-capacity
```

`dd` 预期在写满前返回非零并报告 `No space left on device`。此时块使用率接近 100%，但 inode 仍未耗尽，这组证据把问题定位为空间不足。

### 3. 空间恢复

```bash
rm -- /mnt/ops-lab-capacity/capacity-fill.bin
rm -- /mnt/ops-lab-capacity/payload.bin
sync
df -h /mnt/ops-lab-capacity
```

删除两个已确认属于实验的文件后，可用块应恢复。真实系统不能仅按文件大小排序后直接删除；还要确认文件归属、保留策略和应用恢复方式。

## 四、inode 耗尽

inode 耗尽的特征是无法创建新文件，`df -i` 接近 100%，但 `df -h` 可能仍显示大量空闲块。

### 1. 小文件注入

```bash
mkdir /mnt/ops-lab-capacity/small-files
for number in $(seq 1 400); do
  : > "/mnt/ops-lab-capacity/small-files/item-$number" || break
done
printf 'created files: '
find /mnt/ops-lab-capacity/small-files -type f | wc -l
```

循环应在达到 400 前因 inode 不足停止，具体数量取决于文件系统自身已经使用的 inode。失败发生后不要继续制造文件。

### 2. 证据对照

```bash
df -h /mnt/ops-lab-capacity
df -i /mnt/ops-lab-capacity
du -sh /mnt/ops-lab-capacity/small-files
```

预期块空间仍有余量，inode 使用率接近 100%，小文件目录的字节占用却很低。只查看 `du` 会遗漏真正瓶颈。

### 3. inode 恢复

```bash
find /mnt/ops-lab-capacity/small-files -type f -delete
rmdir /mnt/ops-lab-capacity/small-files
df -i /mnt/ops-lab-capacity
```

inode 可用量应恢复。生产环境应先识别小文件生成者和保留规则，再按业务边界清理；否则文件会持续重建。

## 五、删除后仍占用

文件名从目录消失后，持有打开文件描述符的进程仍能访问数据，文件系统也不会立即回收相应块。此时常见现象是 `du` 下降而 `df` 没有同步下降。

### 1. 打开文件

下面创建一个文件，让 `tail` 持续打开它，再删除目录项。

::: details 查看删除后打开文件的故障注入

```bash
dd if=/dev/zero of=/mnt/ops-lab-capacity/held-open.log bs=1M count=20 status=none
tail -f /mnt/ops-lab-capacity/held-open.log >/dev/null &
OPS_LAB_READER_PID=$!
sleep 1
rm -- /mnt/ops-lab-capacity/held-open.log
df -h /mnt/ops-lab-capacity
du -sh /mnt/ops-lab-capacity
sudo lsof +L1 | grep '/mnt/ops-lab-capacity'
kill "$OPS_LAB_READER_PID"
wait "$OPS_LAB_READER_PID" 2>/dev/null
sync
```

:::

`lsof` 应显示链接数为 0 且名称带 `(deleted)` 的文件，并关联到 `tail` 进程。停止进程后，内核关闭最后一个文件描述符，块空间才会释放。

### 2. 恢复验证

```bash
! sudo lsof +L1 | grep '/mnt/ops-lab-capacity'
df -h /mnt/ops-lab-capacity
du -sh /mnt/ops-lab-capacity
```

打开文件记录应消失，`df` 与当前可见数据占用重新接近。真实服务优先使用正常重载、重启或日志重开机制，不直接终止未知进程。

### 3. 差额边界

`df` 与 `du` 存在小幅差额并不自动表示故障。文件系统元数据、保留块、硬链接、稀疏文件、快照和挂载遮蔽都可能影响读数；诊断必须结合文件系统类型和挂载结构。

先固定同一时间点和同一文件系统，再比较读数。差额持续扩大时，依次检查删除后打开文件、目录下的其他挂载、快照或文件系统专有保留机制，并用对应证据确认，不根据差额大小直接删除数据。

## 六、诊断顺序

| 顺序 | 命令 | 关键判断 | 下一步 |
|-----:|------|----------|--------|
| 1 | `findmnt -T PATH` | 确认报错路径所属文件系统 | 把后续命令限定到该目标 |
| 2 | `df -h PATH` | 块空间是否耗尽 | 查目录占用或保留空间 |
| 3 | `df -i PATH` | inode 是否耗尽 | 查小文件数量与生成者 |
| 4 | `du -x PATH` | 可见目录占用集中在哪里 | 核对业务归属与清理策略 |
| 5 | `lsof +L1` | 是否存在已删除但仍打开的文件 | 通过服务机制释放描述符 |

`du -x` 把扫描限制在当前文件系统，避免跨入其他挂载。大目录扫描会产生 I/O，生产环境应从明确路径开始，并结合业务低峰执行。

## 七、实验清理

清理前确保没有打开文件、当前目录不在挂载点内，并重新核对 loop 后端文件。

### 1. 归属复核

```bash
cd /
test "$(sudo losetup --noheadings --output BACK-FILE "$OPS_LAB_CAPACITY_DEVICE")" = "$OPS_LAB_CAPACITY_IMAGE"
! sudo lsof +L1 | grep '/mnt/ops-lab-capacity'
findmnt --mountpoint /mnt/ops-lab-capacity
```

后端文件和挂载来源必须仍属于本实验。验证失败时停止清理，不凭变量名推断设备。

### 2. 卸载删除

```bash
sudo umount /mnt/ops-lab-capacity
sudo losetup --detach "$OPS_LAB_CAPACITY_DEVICE"
rm -- /srv/ops-lab/capacity-lab/capacity.img
sudo rmdir -- /mnt/ops-lab-capacity
sudo rmdir -- /srv/ops-lab/capacity-lab
```

目录非空或卸载失败时先调查残留对象和占用进程，不使用递归强删或延迟卸载绕过证据。

本文通过三组故障证据区分了块空间耗尽、inode 耗尽和删除后仍占用。实验没有覆盖 LVM、容器写层、分布式存储或云盘快照，这些场景需要结合对应存储层继续定位。

官方依据：[Ubuntu df 手册](https://manpages.ubuntu.com/manpages/resolute/man1/df.1.html)、[du 手册](https://manpages.ubuntu.com/manpages/resolute/man1/du.1.html)与 [lsof 手册](https://manpages.ubuntu.com/manpages/resolute/man8/lsof.8.html)。
