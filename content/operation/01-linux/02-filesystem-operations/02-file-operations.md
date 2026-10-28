---
title: "文件操作与查找"
tags:
  - Linux
  - 文件操作
  - find
excerpt: "在受控实验目录中创建、复制、移动和删除文件，并使用 find 按名称、类型、大小和时间限定查找范围。"
date: 2026-09-24
---

# 文件操作与查找

Linux 文件操作直接作用于路径指向的对象。`cp` 创建副本，`mv` 改变名称或位置，`rm` 删除目录项，`find` 从指定起点遍历并筛选对象。命令是否安全，取决于**起始目录、源路径、目标路径和匹配范围**是否明确。

本文只操作 `/srv/ops-lab/files` 中的测试数据。所有输出均为 Ubuntu Server 26.04.1 环境中的预期形式；当前文档生成环境没有可用的 Ubuntu 实验机，命令语义已依据 [GNU Coreutils 手册](https://www.gnu.org/software/coreutils/manual/coreutils.html)、[GNU Findutils 手册](https://www.gnu.org/software/findutils/manual/)和 [Ubuntu 26.04 Manpage Repository](https://manpages.ubuntu.com/)核对。

::: danger 删除命令没有默认回收站
`rm` 删除后不能依赖桌面回收站恢复。执行前必须显示目标、确认当前目录并限定路径；本文不组合递归与强制删除选项，也不删除 `/etc`、`/var`、`/home` 等系统目录。
:::

## 一、受控工作目录

受控目录把实验对象与系统文件分开。准备完成后，后续命令都应从同一个绝对路径开始，避免当前目录变化导致操作范围漂移。

### 1. 目录准备

在 `ops-lab` 控制台以 `operator` 登录，创建由该用户管理的实验目录：

```bash
sudo install -d -o operator -g operator /srv/ops-lab
install -d /srv/ops-lab/files
cd /srv/ops-lab/files
pwd
```

预期输出为：

```text
/srv/ops-lab/files
```

`install -d` 在这里用于创建目录；第一条命令同时设置实验目录所有者，后续文件操作不需要持续使用 `sudo`。如果 `pwd` 不是目标路径，应停止并重新进入目录。

### 2. 操作范围

每次写操作前先确认当前目录和目标状态：

```bash
pwd
find . -mindepth 1 -maxdepth 2 -print
```

初次执行时，`find` 不应输出任何对象。`-mindepth 1` 排除起点 `.`，`-maxdepth 2` 把遍历限制在两层以内。

::: tip 写操作前固定三项证据
保留 `pwd`、目标列表和即将执行的完整命令。三项证据分别说明“当前在哪里”“将影响什么”“准备怎样修改”，比只看命令名更能防止误操作。
:::

## 二、文件与目录创建

文件与目录是后续复制、移动和查找的输入。本节先建立一组规模固定、内容可核对的测试对象。

### 1. 空文件与文本文件

`touch` 会在目标不存在时创建空文件；目标已存在时，它默认更新文件时间戳，不会清空原有内容。

```bash
touch notes.txt
printf '%s\n' 'listen=8080' 'mode=staging' > app.conf
printf '%s\n' '2026-09-24 INFO service started' > access.log
ls -l -- notes.txt app.conf access.log
```

观察结果时，`notes.txt` 的大小应为 `0`，另外两个文件应大于 `0`。时间、所有者和精确字节数由实际环境决定。

`>` 用于准备本篇测试内容，会覆盖同名文件。这里只对刚创建的实验文件使用；面对已有配置文件时，应先复制备份并检查差异。

### 2. 目录层级

`mkdir` 创建目录，`-p` 允许一次创建缺失的父目录。当前实验只需要两个一级目录：

```bash
mkdir incoming archive
mv -- app.conf access.log incoming/
find . -maxdepth 2 -printf '%y %p\n'
```

预期对象如下，输出顺序可能不同：

```text
d .
d ./incoming
f ./incoming/app.conf
f ./incoming/access.log
d ./archive
f ./notes.txt
```

`find` 的 `%y` 输出对象类型：`d` 表示目录，`f` 表示普通文件。这里的列表同时证明源文件已经移动到 `incoming`。

## 三、复制与移动

复制会保留源对象并创建新对象；移动会让对象在旧路径消失、在新路径出现。两类命令都需要先判断目标是文件名还是目录。

### 1. 文件复制

将配置文件复制为备份：

```bash
cp -- incoming/app.conf archive/app.conf.bak
ls -l -- incoming/app.conf archive/app.conf.bak
```

`--` 表示选项到此结束，后续参数即使以连字符开头也按路径处理。复制成功后，源文件和备份文件应同时存在且大小一致。

当目标文件已经存在时，GNU `cp` 默认可以覆盖它。交互操作可以使用 `cp -i` 在覆盖前询问，但提示不能替代路径核对，也不适合作为无人值守脚本的唯一保护机制。

### 2. 目录复制

`cp` 默认不递归复制目录。复制目录树需要显式使用 `-R`：

```bash
cp -R -- incoming archive/incoming-copy
find archive/incoming-copy -maxdepth 1 -printf '%y %p\n'
```

结果中应包含 `archive/incoming-copy` 目录及其两个文件。目标 `archive/incoming-copy` 在复制前不存在，因此它成为新目录；如果同名目录已经存在，结果层级可能不同，执行前应先用 `ls -ld` 核对。

### 3. 重命名与移动

`mv` 使用两个路径时，可以在同一目录中重命名，也可以把对象移动到另一个目录：

```bash
mv -- notes.txt runbook.txt
mv -- runbook.txt archive/
ls -l -- archive/runbook.txt
ls -l -- notes.txt
```

第三条命令应显示 `archive/runbook.txt`；第四条命令应报告 `notes.txt` 不存在。这个成功与失败对照证明对象已经改变路径，而不是产生了额外副本。

同一文件系统内的 `mv` 通常只改变目录记录；跨文件系统移动时，GNU `mv` 需要先复制再删除源对象。跨设备操作失败时，目标可能已经出现部分结果，应核对两端状态，不能只根据源路径是否存在判断完成。

## 四、对象删除

删除操作应从影响最小的对象开始：先删除明确文件，再删除空目录，最后才处理已经列出内容的测试目录树。

### 1. 删除前核对

先显示准备删除的对象及其规范化路径：

```bash
realpath -- archive/runbook.txt
ls -ld -- archive/runbook.txt
```

预期规范化路径为：

```text
/srv/ops-lab/files/archive/runbook.txt
```

路径不在 `/srv/ops-lab/files` 下时，不执行后续删除。`realpath` 解析符号链接和相对路径后的结果，因此比只观察命令中输入的字符串更可靠。

### 2. 文件与空目录删除

删除单个文件使用 `rm`，删除空目录使用 `rmdir`：

```bash
rm -- archive/runbook.txt
mkdir archive/empty-dir
rmdir -- archive/empty-dir
find archive -maxdepth 1 -printf '%y %p\n'
```

结果中不应再出现 `runbook.txt` 和 `empty-dir`。如果 `rmdir` 报告 `Directory not empty`，说明目录仍有内容；应先列出内容，不要立即改用强制递归删除。

### 3. 递归删除边界

删除目录树前，先把全部目标列出来：

```bash
find archive/incoming-copy -mindepth 1 -print
realpath -- archive/incoming-copy
rm -r -- archive/incoming-copy
test ! -e archive/incoming-copy && echo removed
```

只有 `realpath` 位于实验目录，且 `find` 输出全部都是可丢弃副本时，才执行第三条命令。预期最终输出为 `removed`。

::: warning 递归选项扩大影响范围
`rm -r` 会遍历并删除目录内对象；`-f` 还会减少提示和部分错误。学习阶段不要组合递归与强制删除选项，更不能把未展开、为空或来源不明的变量作为目标。
:::

## 五、文件查找

`find` 的基本结构是“起始路径 + 条件 + 动作”。起始路径决定最大遍历范围，条件逐步缩小结果，`-print` 明确输出匹配路径。

### 1. 名称条件

在实验目录中查找扩展名为 `.conf` 的对象：

```bash
find /srv/ops-lab/files -maxdepth 3 -type f -name '*.conf' -print
```

预期只匹配：

```text
/srv/ops-lab/files/incoming/app.conf
```

`'*.conf'` 必须引用，避免 Shell 在 `find` 执行前先展开通配符。`-name` 区分大小写；需要忽略大小写时，GNU `find` 提供 `-iname`。

### 2. 类型条件

`-type f` 匹配普通文件，`-type d` 匹配目录。只列出实验目录下一层的目录：

```bash
find /srv/ops-lab/files -mindepth 1 -maxdepth 1 -type d -print
```

预期包含 `incoming` 和 `archive`。类型条件可以避免同名文件与目录被混在同一结果中，也应放在后续批量动作之前。

### 3. 大小与时间条件

GNU `find` 可以按大小和修改时间筛选。查找内容大于 `0` 字节的普通文件：

```bash
find /srv/ops-lab/files -type f -size +0c -print
```

结果应包含 `app.conf`、`access.log` 和配置备份，不应包含空文件。单位 `c` 表示字节；省略单位时，`find` 使用 512 字节块，结果边界会不同。

查找最近 10 分钟内修改的文件可以使用：

```bash
find /srv/ops-lab/files -type f -mmin -10 -print
```

时间结果取决于实际执行时刻和文件系统时间精度，不应把示例路径数量当作固定值。需要可重复的自动化判断时，应先明确时间窗口和主机时钟来源。

## 六、状态验证与清理

本节用最终对象清单验证所有操作，再删除整个实验副本。清理命令仍然遵守先解析路径、再展示内容、最后删除的顺序。

### 1. 目录状态

输出两层以内的最终对象：

```bash
find /srv/ops-lab/files -maxdepth 2 -printf '%y %p\n'
```

最终应保留 `incoming`、`archive`、两个源文件和 `app.conf.bak`。`notes.txt`、`runbook.txt`、`empty-dir` 与 `incoming-copy` 都不应存在。

### 2. 查找结果

对关键条件执行独立核对：

```bash
find /srv/ops-lab/files -type f -name '*.conf' -print
find /srv/ops-lab/files -type f -name '*.bak' -print
```

第一条命令证明源配置仍在 `incoming`，第二条命令证明备份位于 `archive`。查找命令成功但没有输出时，通常表示没有匹配对象，不等于 `find` 自身执行失败；应结合退出状态和条件设计判断。

### 3. 实验目录清理

清理前离开目标目录，并再次确认规范化路径：

```bash
cd /srv/ops-lab
realpath -- files
find files -mindepth 1 -maxdepth 2 -print
rm -r -- files
test ! -e files && echo cleaned
```

只有第二条命令输出 `/srv/ops-lab/files`，且第三条命令只列出本篇测试对象时，才执行删除。预期最终输出为 `cleaned`。

这一组操作证明了文件创建、复制、移动、删除与限定查找的结果，但不证明未知路径可以安全批量处理。真实变更仍需根据备份、权限和业务恢复要求重新确定边界。
