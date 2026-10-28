---
title: "磁盘与挂载"
tags:
  - Linux
  - 文件系统
  - 挂载
excerpt: "解释块设备、分区、文件系统和挂载点的对应关系，通过文件支持的 loop 设备完成分区、格式化、挂载、UUID 配置验证及安全清理。"
date: 2026-09-24
---

# 磁盘与挂载

Linux 不能把一块新磁盘直接当作普通目录使用。内核先识别块设备，管理员再按需要建立分区和文件系统，最后把文件系统挂载到目录；应用访问的是挂载点下的路径，而不是设备节点本身。

存储操作最危险的错误不是命令语法错误，而是**把正确命令作用到了错误设备**。本文使用 128 MiB 镜像文件创建可丢弃的 loop 设备，只在确认设备与镜像文件一一对应后执行分区和格式化。

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可运行的 Linux 实验机。设备名、UUID、扇区范围和命令输出必须以 Ubuntu Server 26.04 隔离虚拟机的实际结果为准，正文只给出验证方法和预期关系。
:::

## 一、存储对象关系

一次挂载至少涉及设备、文件系统和目录三个层次。分区不是所有场景都必需，但它是普通磁盘最常见的空间边界。

### 1. 对象职责

| 对象 | 示例 | 负责内容 |
|------|------|----------|
| 镜像文件 | `ops-lab-disk.img` | 为实验提供可删除的后端空间 |
| 块设备 | `/dev/loopN` | 向内核提供按块读写的设备接口 |
| 分区 | `/dev/loopNp1` | 划分设备上的连续空间范围 |
| 文件系统 | ext4 | 组织目录、文件、权限和空闲空间 |
| 挂载点 | `/mnt/ops-lab-storage` | 把文件系统接入目录树 |

设备节点、分区和挂载点不是同义词。删除挂载点目录不会擦除文件系统；格式化分区却会重建文件系统元数据并破坏原有数据。

### 2. 关系链路

```text
ops-lab-disk.img
        ↓ losetup
/dev/loopN（块设备）
        ↓ GPT 分区表
/dev/loopNp1（分区）
        ↓ mkfs.ext4
ext4 文件系统（UUID）
        ↓ mount
/mnt/ops-lab-storage（挂载点）
```

`lsblk` 从设备视角展示父子关系和文件系统信息，`findmnt` 从挂载视角展示来源、目标和选项。两个命令回答的问题不同，排查时应交叉使用。

### 3. 设备名与 UUID

`/dev/loopN` 中的编号由当前空闲设备决定，重新关联后可能变化。真实磁盘的 `/dev/sdX`、`/dev/nvmeXnY` 也可能因硬件发现顺序变化，因此持久挂载通常使用文件系统 UUID。

UUID 标识文件系统，不标识挂载目录。重新格式化会生成新的 UUID，原有持久挂载记录也必须随之更新。

## 二、实验前检查

实验必须在可回退的 Ubuntu Server 26.04 虚拟机中执行，并保持当前终端直到清理结束。后续变量只在当前 Shell 会话有效。

### 1. 工具状态

```bash
cat /etc/os-release
command -v losetup
command -v lsblk
command -v parted
command -v mkfs.ext4
command -v blkid
command -v findmnt
command -v partprobe
```

缺少工具时，先用 APT 预览并安装 `mount`、`util-linux`、`parted` 或 `e2fsprogs` 中对应的软件。安装方法和变更边界见[软件包管理](../05-software-scheduled-jobs/01-package-management.md)。

### 2. 路径冲突

```bash
test ! -e /srv/ops-lab/storage-lab
test ! -e /mnt/ops-lab-storage
findmnt --mountpoint /mnt/ops-lab-storage
```

前两条返回 `0` 且最后一条返回非零，才表示路径未被占用。任一路径已存在时先确认归属，不覆盖目录、镜像或既有挂载。

### 3. 系统盘边界

```bash
findmnt --noheadings --output SOURCE,TARGET,FSTYPE /
lsblk --output NAME,TYPE,SIZE,FSTYPE,MOUNTPOINTS
```

记录根文件系统来源及其父设备。本文后续只允许操作由 `ops-lab-disk.img` 新建的 loop 设备，输出中出现系统盘、根分区或已有数据盘时立即停止。

::: danger 格式化会破坏目标文件系统
`mkfs.ext4` 只能作用于已经验证后端文件为 `/srv/ops-lab/storage-lab/ops-lab-disk.img` 的 loop 分区。不得把示例变量替换成猜测的 `/dev/sdb`、`/dev/vdb` 或 NVMe 设备名。
:::

## 三、回环设备

loop 设备把普通文件映射成块设备，适合在隔离虚拟机中练习分区和文件系统操作。删除镜像即可丢弃实验数据，但前提是先卸载并解除设备关联。

### 1. 镜像文件

```bash
sudo mkdir -p /srv/ops-lab/storage-lab
sudo chown operator:"$(id -gn operator)" /srv/ops-lab/storage-lab
truncate --size 128M /srv/ops-lab/storage-lab/ops-lab-disk.img
stat -c '%U %G %s %n' /srv/ops-lab/storage-lab/ops-lab-disk.img
```

文件大小应为 `134217728` 字节，所有者应为 `operator`。`truncate` 创建的是实验后端文件，不会接触虚拟机的其他块设备。

### 2. 设备关联

```bash
OPS_LAB_IMAGE=/srv/ops-lab/storage-lab/ops-lab-disk.img
OPS_LAB_DEVICE=$(sudo losetup --find --show --partscan "$OPS_LAB_IMAGE")
printf 'loop device: %s\n' "$OPS_LAB_DEVICE"
sudo losetup --list --output NAME,SIZE,BACK-FILE | grep -F "$OPS_LAB_IMAGE"
```

`OPS_LAB_DEVICE` 应为新分配的 `/dev/loopN`，列表中的 `BACK-FILE` 必须是本篇镜像。没有唯一匹配时停止，不执行分区命令。

### 3. 关联复核

```bash
test "$(sudo losetup --noheadings --output BACK-FILE "$OPS_LAB_DEVICE")" = "$OPS_LAB_IMAGE"
test "$(findmnt --noheadings --output SOURCE /)" != "$OPS_LAB_DEVICE"
lsblk --output NAME,TYPE,SIZE,FSTYPE,MOUNTPOINTS "$OPS_LAB_DEVICE"
```

三条命令都成功才进入分区步骤。此时设备应为 `loop` 类型、容量约 128 MiB，并且没有文件系统和挂载点。

## 四、分区与文件系统

GPT 分区表记录分区范围，ext4 文件系统建立在分区内部。`parted` 的文件系统类型参数只标记分区用途，不会代替 `mkfs.ext4` 创建文件系统。

### 1. GPT 分区

```bash
sudo parted --script "$OPS_LAB_DEVICE" mklabel gpt
sudo parted --script "$OPS_LAB_DEVICE" mkpart OPS_LAB ext4 1MiB 100%
sudo partprobe "$OPS_LAB_DEVICE"
sudo udevadm settle
```

从 1 MiB 开始可以保留 GPT 元数据并满足常见对齐要求。分区完成后使用设备事实发现分区名，不假设一定是固定的 `/dev/loop0p1`。

### 2. 分区识别

```bash
lsblk --paths --output NAME,PKNAME,TYPE,SIZE "$OPS_LAB_DEVICE"
OPS_LAB_PARTITION=$(lsblk --list --noheadings --paths --output NAME,TYPE "$OPS_LAB_DEVICE" | awk '$2 == "part" {print $1}')
test -b "$OPS_LAB_PARTITION"
test "$(lsblk --noheadings --output PKNAME "$OPS_LAB_PARTITION")" = "$(basename "$OPS_LAB_DEVICE")"
printf 'partition: %s\n' "$OPS_LAB_PARTITION"
```

变量必须只包含一个分区路径。为空、包含多行或父设备不一致时，重新检查 `lsblk` 和分区表，不继续格式化。

### 3. ext4 格式化

格式化前再次核对后端文件、父设备和当前挂载状态：

```bash
test "$(sudo losetup --noheadings --output BACK-FILE "$OPS_LAB_DEVICE")" = "$OPS_LAB_IMAGE"
test "$(lsblk --noheadings --output PKNAME "$OPS_LAB_PARTITION")" = "$(basename "$OPS_LAB_DEVICE")"
! findmnt --source "$OPS_LAB_PARTITION"
sudo mkfs.ext4 -L OPS_LAB "$OPS_LAB_PARTITION"
sudo blkid "$OPS_LAB_PARTITION"
```

`blkid` 应显示 `TYPE="ext4"`、`LABEL="OPS_LAB"` 和新生成的 UUID。格式化输出中的块数量、inode 数量和 UUID 以实际执行为准。

## 五、挂载验证

挂载把文件系统接入目录树。挂载成功不等于普通用户可写，文件系统根目录最初通常由 root 所有。

### 1. 挂载关系

```bash
sudo mkdir /mnt/ops-lab-storage
sudo mount "$OPS_LAB_PARTITION" /mnt/ops-lab-storage
findmnt --mountpoint /mnt/ops-lab-storage --output SOURCE,TARGET,FSTYPE,OPTIONS
lsblk --fs "$OPS_LAB_DEVICE"
```

`findmnt` 的来源应为实验分区，目标为 `/mnt/ops-lab-storage`，类型为 ext4。`lsblk --fs` 应在同一分区显示相同 UUID 和挂载点。

### 2. 写入权限

```bash
sudo chown operator:"$(id -gn operator)" /mnt/ops-lab-storage
printf 'mounted-storage-ok\n' > /mnt/ops-lab-storage/write-check.txt
stat -c '%U %G %a %s %n' /mnt/ops-lab-storage/write-check.txt
cat /mnt/ops-lab-storage/write-check.txt
```

文件应由 `operator` 创建并输出 `mounted-storage-ok`。这证明当前身份可以经挂载点访问文件系统，不证明磁盘具有冗余、备份或故障恢复能力。

### 3. 挂载遮蔽

目录在挂载前已有内容时，挂载不会删除它们，但会在当前挂载期间把它们遮蔽。卸载后旧内容会重新出现，因此生产挂载点应在挂载前确认为空，并用 `findmnt` 判断实际来源。

::: tip 用 findmnt 判断当前来源
不要只根据路径存在或 `ls` 输出推断挂载成功。`findmnt --mountpoint` 直接读取内核挂载表，能够区分普通目录和真正的挂载点。
:::

## 六、UUID 配置

本节使用独立 fstab 文件验证 UUID 记录和挂载行为，不修改 `/etc/fstab`。loop 设备关联不会跨重启自动恢复，因此本实验不能冒充真实磁盘的开机持久挂载。

### 1. 配置生成

```bash
OPS_LAB_UUID=$(sudo blkid --match-tag UUID --output value "$OPS_LAB_PARTITION")
OPS_LAB_FSTAB=/srv/ops-lab/storage-lab/ops-lab.fstab
printf 'UUID=%s /mnt/ops-lab-storage ext4 defaults,nofail 0 2\n' "$OPS_LAB_UUID" | tee "$OPS_LAB_FSTAB"
cat "$OPS_LAB_FSTAB"
```

UUID 必须与 `blkid` 输出完全一致。`nofail` 表示设备缺失时不把它作为启动硬失败，但不会修复错误 UUID，也不会保证依赖该目录的业务可以正常运行。

### 2. 配置校验

```bash
findmnt --verify --tab-file "$OPS_LAB_FSTAB"
findmnt --fstab --evaluate --tab-file "$OPS_LAB_FSTAB" --output SOURCE,TARGET,FSTYPE,OPTIONS
```

校验应无解析错误，求值后的来源应指向实验分区。`findmnt --verify` 是配置检查，不会证明设备在下次启动时一定存在。

### 3. 配置挂载

```bash
sudo umount /mnt/ops-lab-storage
! findmnt --mountpoint /mnt/ops-lab-storage
sudo mount --fstab "$OPS_LAB_FSTAB" --target /mnt/ops-lab-storage
findmnt --mountpoint /mnt/ops-lab-storage --output SOURCE,TARGET,FSTYPE,OPTIONS
cat /mnt/ops-lab-storage/write-check.txt
```

重新挂载后，来源、类型和文件内容应与直接挂载时一致。真实磁盘写入 `/etc/fstab` 前还要保留控制台或快照回退，并在维护窗口验证卸载、重新挂载和启动行为。

## 七、卸载与清理

清理顺序必须与创建顺序相反：先停止访问，再卸载文件系统，最后解除 loop 关联并删除镜像。

### 1. 占用检查

```bash
cd /
sudo fuser --mount /mnt/ops-lab-storage
findmnt --mountpoint /mnt/ops-lab-storage
```

`fuser` 没有输出时通常表示没有进程占用；有输出时先识别并正常停止对应进程。不要用延迟卸载掩盖未知占用。

### 2. 解除关联

```bash
sudo umount /mnt/ops-lab-storage
! findmnt --mountpoint /mnt/ops-lab-storage
sudo losetup --detach "$OPS_LAB_DEVICE"
test -z "$(sudo losetup --associated "$OPS_LAB_IMAGE")"
```

最后一条返回 `0`，表示反向查询已找不到镜像关联。如果变量因终端关闭而丢失，先用 `sudo losetup --associated /srv/ops-lab/storage-lab/ops-lab-disk.img` 重新确认唯一设备，不凭记忆输入 loop 编号。

### 3. 文件清理

```bash
rm -- /srv/ops-lab/storage-lab/ops-lab.fstab
rm -- /srv/ops-lab/storage-lab/ops-lab-disk.img
sudo rmdir -- /mnt/ops-lab-storage
sudo rmdir -- /srv/ops-lab/storage-lab
```

`rmdir` 只删除空目录。目录非空时先调查对象来源，不改用递归强删。

## 八、常见失败

| 现象 | 主要证据 | 处理方式 |
|------|----------|----------|
| 分区节点未出现 | `lsblk` 没有 `part` 子项 | 重新执行 `partprobe`、`udevadm settle` 并检查分区表 |
| `wrong fs type` | `blkid` 类型与挂载命令不一致 | 核对目标分区和文件系统，不重复格式化未知设备 |
| `target is busy` | `fuser --mount` 显示占用进程 | 离开挂载目录并停止使用该路径的进程 |
| UUID 找不到 | `blkid` 与 fstab 记录不一致 | 更新配置中的 UUID，重新执行 `findmnt --verify` |
| 挂载后无法写入 | `stat` 显示文件系统根目录归 root | 按业务身份设置最小所有权和权限，不使用全局可写权限 |

本文证明了镜像文件、loop 设备、分区、ext4 文件系统、UUID 和挂载点之间的对应关系。它没有验证真实磁盘故障、RAID、LVM 或开机阶段的依赖顺序。

官方依据：[Ubuntu 26.04 losetup 手册](https://manpages.ubuntu.com/manpages/resolute/man8/losetup.8.html)、[parted 手册](https://manpages.ubuntu.com/manpages/resolute/man8/parted.8.html)与 [mount 手册](https://manpages.ubuntu.com/manpages/resolute/man8/mount.8.html)。
