---
title: "备份与恢复"
tags:
  - Linux
  - 备份
  - 恢复
excerpt: "从数据范围、恢复目标和一致性出发，使用 tar 与 SHA-256 创建可核验备份，并通过隔离恢复、内容比对和损坏注入证明恢复能力。"
date: 2026-09-24
---

# 备份与恢复

产生一个压缩包不等于完成备份。归档可能漏文件、在写入中途截断、与源数据处于不同时间点，或者直到故障发生才发现无法解压。备份的完成标准是：**恢复范围明确，副本完整可读，并且已经在隔离位置恢复和比对**。

本文为静态文件集创建 GNU tar 归档，用 SHA-256 校验归档传输完整性，再模拟源目录丢失并执行恢复演练。备份文件仍位于同一台实验机，只能证明流程，不能抵御整机或磁盘故障。

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可运行的 Linux 实验机。归档大小、哈希值、时间和命令输出必须以 Ubuntu Server 26.04 隔离虚拟机的实际执行为准，正文不提供伪造结果。
:::

## 一、恢复目标

备份设计从需要恢复什么以及允许损失多少开始，而不是从选择压缩命令开始。

### 1. RPO 与 RTO

RPO（Recovery Point Objective，恢复点目标）表示可接受的数据丢失时间范围；RTO（Recovery Time Objective，恢复时间目标）表示服务恢复所允许的最长时间。

| 场景 | RPO 判断 | RTO 判断 | 对备份的影响 |
|------|----------|----------|----------------|
| 每日配置归档 | 最多丢失一天配置变更 | 数小时内恢复 | 每日备份并保留变更记录 |
| 每小时业务导出 | 最多丢失一小时数据 | 一小时内可恢复 | 提高备份频率并自动验证 |
| 接近实时恢复 | 分钟级或更低 | 分钟级 | 单机 tar 通常不足，需要日志、复制或快照机制 |

目标越严格，备份频率、存储、网络和恢复自动化成本越高。RPO/RTO 是业务约束，不是备份工具自动给出的属性。

### 2. 数据范围

范围必须列出需要恢复的文件、权限、符号链接、配置和外部依赖，同时明确排除缓存、临时文件及可重新生成的数据。

本文只验证普通文件、目录、符号链接和基本权限位。ACL、扩展属性、设备文件、数据库事务、加密密钥和跨服务一致性不在本实验范围内。

### 3. 副本独立性

| 副本位置 | 能抵御的故障 | 不能抵御的故障 |
|----------|--------------|----------------|
| 同目录归档 | 单个源文件误删 | 目录、文件系统或主机故障 |
| 同机不同文件系统 | 源文件系统损坏 | 主机丢失、权限泄露、勒索软件 |
| 异机或对象存储 | 单机和单盘故障 | 同账号误删或区域级故障，取决于隔离策略 |
| 离线或不可变副本 | 在线篡改和勒索风险 | 保留策略错误或恢复流程失效 |

本篇的 `vault` 目录属于第一种，只用于验证创建与恢复链路。生产备份必须根据故障模型选择独立介质、账号、区域和保留策略。

## 二、测试数据

实验从空目录创建一个小型应用文件集。所有对象都由普通用户 `operator` 管理，不读取系统配置或真实业务数据。

### 1. 工具检查

```bash
cat /etc/os-release
tar --version | head -n 1
sha256sum --version | head -n 1
command -v diff
test ! -e /srv/ops-lab/backup-lab
```

目标环境为 Ubuntu Server 26.04，`tar` 和 `sha256sum` 使用系统提供的 GNU 实现。路径已经存在时停止，不覆盖旧备份或恢复结果。

### 2. 文件集创建

```bash
sudo mkdir -p /srv/ops-lab/backup-lab
sudo chown operator:"$(id -gn operator)" /srv/ops-lab/backup-lab
cd /srv/ops-lab/backup-lab
mkdir -p source/config source/data vault restore
printf 'listen=127.0.0.1:8080\nmode=production\n' > source/config/app.conf
chmod 0640 source/config/app.conf
printf 'order_id,amount\nA1001,128.50\nA1002,79.00\n' > source/data/orders.csv
printf 'ops-lab backup sample\n' > source/README.txt
ln -s ../config/app.conf source/data/current-config
```

配置、CSV 数据、说明文件和相对符号链接构成恢复范围。示例不包含运行中的数据库文件，避免把文件复制误写成事务一致性备份。

### 3. 源数据基线

```bash
find source -maxdepth 3 -printf '%y %m %p -> %l\n' | sort
(cd source && find . -type f -print0 | sort -z | xargs -0 sha256sum) > source.sha256
cat source.sha256
```

清单记录所有普通文件的相对路径和内容哈希，符号链接则由后续目录比对验证。备份创建后修改源文件会使归档和这份基线不再对应。

## 三、备份前检查

创建归档前需要确认一致性、容量和目标位置。工具成功退出不能弥补范围错误。

### 1. 一致性边界

静态文件在实验期间不发生写入，因此可以直接归档。真实服务如果持续写文件，必须选择适合该应用的冻结、只读、导出、数据库备份或快照机制。

::: warning 文件可复制不代表数据一致
直接复制数据库数据目录可能混合不同事务时点。应使用数据库提供的备份、日志或快照协调机制，并在恢复端验证数据库自身的一致性。
:::

### 2. 容量预估

```bash
du -sh source
df -h vault
findmnt --target vault --output SOURCE,TARGET,FSTYPE,OPTIONS
```

目标文件系统的可用空间必须覆盖当前数据、压缩中间量、保留代际和恢复演练空间。这里只验证一个小型归档，不建立生产容量公式。

### 3. 目标权限

```bash
stat -c '%U %G %a %n' vault
test -w vault
```

备份进程必须能写入目标，但不应让无关用户修改归档。生产环境还要限制删除权限，并保护加密密钥和访问凭据。

## 四、归档创建

归档文件放在源目录之外，避免把旧备份再次打入新归档。命令使用 `--directory` 让成员名保持相对路径。

### 1. 创建归档

```bash
tar --create --gzip \
  --file=/srv/ops-lab/backup-lab/vault/ops-lab.tar.gz \
  --directory=/srv/ops-lab/backup-lab/source \
  .
printf 'tar exit status: %s\n' "$?"
```

退出状态应为 `0`。归档创建期间如果有文件变化、读取失败或空间不足，必须把本次结果标记为失败，不能只因目标文件存在就继续。

### 2. 归档校验和

```bash
cd /srv/ops-lab/backup-lab/vault
sha256sum ops-lab.tar.gz > ops-lab.tar.gz.sha256
sha256sum --check ops-lab.tar.gz.sha256
```

校验应输出 `ops-lab.tar.gz: OK`。SHA-256 可以发现归档内容是否变化，但不能证明归档包含了正确范围，也不能替代访问控制和加密。

### 3. 成员清单

```bash
tar --list --verbose --gzip --file=ops-lab.tar.gz
```

清单应包含 `./config/app.conf`、`./data/orders.csv`、`./README.txt` 和符号链接，不应包含 `vault`、`restore` 或绝对路径。

## 五、归档验证

恢复前先验证归档文件完整、成员范围正确，并避免把不可信路径直接释放到生产目录。

### 1. 内容对照

```bash
tar --compare --gzip \
  --file=/srv/ops-lab/backup-lab/vault/ops-lab.tar.gz \
  --directory=/srv/ops-lab/backup-lab/source
printf 'compare exit status: %s\n' "$?"
```

源数据未变化时退出状态应为 `0`。`--compare` 对照归档成员与当前文件系统，适合发现创建后发生的内容或元数据差异，但它仍不是恢复演练。

### 2. 路径检查

```bash
tar --list --gzip --file=/srv/ops-lab/backup-lab/vault/ops-lab.tar.gz
```

来自外部的归档必须先检查成员名，再提取到新建空目录。绝对路径、`..` 越界成员或指向目录外部的可疑链接都需要阻止，不能直接以 root 身份覆盖系统路径。

### 3. 校验边界

归档校验和、成员清单和 `tar --compare` 分别证明传输内容未变、范围可见以及归档与当前源一致。只有把归档提取到空目录并验证恢复结果，才能证明读取和重建链路成立。

任一校验失败都应使当前副本退出可恢复集合。不能重新计算损坏文件的哈希后把它标记为有效，也不能用“部分文件可以读取”代替完整恢复结果。

## 六、恢复演练

演练使用 `mv` 保留原目录，再把归档恢复到独立的 `restore` 目录。这个过程不会覆盖唯一源副本。

### 1. 模拟源丢失

```bash
cd /srv/ops-lab/backup-lab
mv source source.original
test ! -e source
test -d source.original
test -z "$(find restore -mindepth 1 -print -quit)"
```

`restore` 必须为空，原数据仍完整保存在 `source.original`。如果任一条件不成立，停止提取并处理目录冲突。

### 2. 隔离提取

```bash
tar --extract --gzip \
  --file=/srv/ops-lab/backup-lab/vault/ops-lab.tar.gz \
  --directory=/srv/ops-lab/backup-lab/restore
printf 'extract exit status: %s\n' "$?"
```

退出状态应为 `0`。生产恢复应使用与备份范围匹配的身份和权限，并先恢复到隔离位置，不能在校验前覆盖当前数据。

### 3. 恢复比对

```bash
(cd restore && sha256sum --check ../source.sha256)
diff --recursive --no-dereference source.original restore
stat -c '%a %n' source.original/config/app.conf restore/config/app.conf
readlink restore/data/current-config
```

所有普通文件应输出 `OK`，`diff` 应无差异，两份配置权限都应为 `640`，符号链接目标应为 `../config/app.conf`。这四类证据共同验证内容、目录结构、权限和链接。

::: tip 恢复成功必须由消费方确认
文件级比对只证明静态对象一致。真实应用还应在隔离环境启动、读取配置、加载数据并完成业务健康检查，再决定是否切换流量或替换原目录。
:::

## 七、损坏与失败

失败演练只破坏归档副本，不修改唯一可用备份。任何校验失败都应阻止提取和切换。

### 1. 损坏注入

```bash
cp vault/ops-lab.tar.gz vault/ops-lab-corrupt.tar.gz
truncate --size 64 vault/ops-lab-corrupt.tar.gz
OPS_LAB_ARCHIVE_HASH=$(sha256sum vault/ops-lab.tar.gz | cut -d ' ' -f 1)
printf '%s  %s\n' "$OPS_LAB_ARCHIVE_HASH" vault/ops-lab-corrupt.tar.gz | sha256sum --check -
```

最后一条预期返回非零并显示 `FAILED`。损坏副本不得进入恢复步骤；应回到通过校验的可靠副本，并调查传输、存储介质或保留链路。

### 2. 空间不足

归档创建或提取前分别检查备份目标和恢复目标的文件系统容量。命令返回非零或目标出现部分文件时，保留错误证据，清理本次不完整输出后重新评估空间，不覆盖上一份有效备份。

生产任务通常先写入临时文件，完成校验后再原子重命名为正式备份名。这样可以区分“正在生成”和“已经验证”的副本。

### 3. 恢复失败

恢复命令成功退出但内容校验失败时，不切换目录。保留 `source.original`、恢复目录、命令退出状态和校验输出，定位缺失文件、权限、链接或版本差异后重新演练。

重新演练必须使用新的空目录，并从已通过归档校验的副本开始。直接在失败目录上重复提取会混合多次结果，使后续比对失去可信基线。

## 八、恢复结论

本实验可以证明当前静态文件集完成了归档、传输校验、隔离提取和内容比对，但不能证明生产灾难恢复目标已经满足。

### 1. 已验证范围

- 普通文件内容与源清单一致；
- 目录层级和符号链接一致；
- 示例配置的权限位得到保留；
- 损坏副本能够在提取前被校验拦截。

### 2. 未验证范围

- 备份没有离开当前主机和文件系统故障域；
- 没有验证数据库、ACL、扩展属性和多服务一致性；
- 没有测量大规模数据的实际 RPO、RTO 和恢复吞吐；
- 没有验证加密、不可变保留、异地复制和访问审计。

### 3. 生产准入

生产方案至少需要明确数据所有者、备份频率、保留代际、独立故障域、加密与密钥、监控告警、恢复权限和定期演练。任一项只有配置而没有恢复证据，都不能视为闭环。

准入记录应保存最近一次成功备份、最近一次恢复演练、实际恢复耗时和未覆盖对象。实际 RPO 或 RTO 超出业务目标时，应调整方案或目标，不能只提高任务执行频率而忽略恢复瓶颈。

## 九、实验清理

先保留一份最终清单，确认目录只包含本篇生成的对象，再删除实验数据。

### 1. 对象确认

```bash
cd /
find /srv/ops-lab/backup-lab -maxdepth 3 -printf '%y %p -> %l\n' | sort
realpath -- /srv/ops-lab/backup-lab
```

解析结果必须精确为 `/srv/ops-lab/backup-lab`。发现其他对象时停止，不扩大删除范围。

### 2. 目录删除

::: danger 只删除已确认的实验目录
下面的递归删除不可恢复。只有在 `realpath` 和 `find` 结果与本文对象完全一致时执行；路径不同或包含其他数据时跳过清理。
:::

```bash
sudo rm --recursive --one-file-system -- /srv/ops-lab/backup-lab
test ! -e /srv/ops-lab/backup-lab
```

本文证明了“创建备份”与“验证恢复”之间的差异。恢复演练通过后，仍需把副本迁移到符合故障模型的独立位置，并以真实业务检查验证可用性。

官方依据：[GNU tar 1.35 手册](https://www.gnu.org/software/tar/manual/tar.html)与 [Ubuntu 26.04 sha256sum 手册](https://manpages.ubuntu.com/manpages/resolute/man1/sha256sum.1.html)。
