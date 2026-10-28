---
title: "用户与用户组"
tags:
  - Linux
  - 用户管理
  - 用户组
excerpt: "说明 UID、GID、主组和附加组的关系，并在隔离账号上完成创建、查询、停用与清理。"
date: 2026-09-24
---

# 用户与用户组

Linux 使用数值用户标识（UID）和组标识（GID）判断进程身份与文件归属。用户名和组名便于人员阅读，内核实际保存和比较的是数值标识。一个用户有一个主组，也可以属于多个附加组。

本文只管理 `labreader`、`labowner` 和 `labops` 三个测试身份。账号变更依据 [Ubuntu Server 用户管理文档](https://ubuntu.com/server/docs/how-to/security/user-management/)及 Ubuntu 26.04 对应手册页核对；当前环境没有 Ubuntu 实验机，输出为预期形式。

::: danger 保留独立管理入口
创建、停用或删除账号前，保留另一个已经验证可用的管理员控制台和虚拟机快照。不要修改当前登录的 `operator`、`root` 或真实业务账号。
:::

## 一、身份模型

用户、组与进程共同构成访问判断的身份输入。账号数据库负责把名称解析为 UID 和 GID，进程启动后携带相应身份访问系统对象。

### 1. UID 与用户名

UID 是用户的稳定数值标识。UID `0` 具有超级用户语义，普通人员账号在 Ubuntu 中通常从 `1000` 开始，但实际范围由系统配置决定，不能只按数值猜测账号用途。

查询当前用户和指定用户身份：

```bash
whoami
id
getent passwd operator
```

`id` 同时显示 UID、主 GID 和附加组；`getent passwd` 通过 Name Service Switch（NSS）查询身份来源，不局限于直接读取 `/etc/passwd`。

### 2. 主组与附加组

每个用户只有一个主组。创建文件时，主组通常参与决定新文件的组归属；附加组用于让同一用户获得其他组授予的访问能力。

```text
labreader
├─ 主组：labreader
└─ 附加组：labops

labowner
├─ 主组：labowner
└─ 附加组：labops
```

组成员变更只影响新创建的登录会话或进程。已经运行的 Shell 不会自动刷新其附加组列表，应重新登录或启动新的目标用户进程进行验证。

### 3. 本地身份记录

本地用户和组分别记录在 `/etc/passwd` 与 `/etc/group`，密码哈希及期限信息记录在受保护的 `/etc/shadow`。普通查询优先使用 `getent`、`id` 和 `passwd -S`，不需要直接读取密码数据库。

| 查询 | 说明 |
|------|------|
| `getent passwd 用户名` | 查询用户记录及其 UID、主 GID、家目录和登录 Shell |
| `getent group 组名` | 查询组记录及显式成员 |
| `id 用户名` | 汇总用户的 UID、主组和附加组 |
| `passwd -S 用户名` | 查看密码状态摘要 |

`/etc/group` 的成员列表只展示附加成员，不能据此判断用户的主组。需要完整结果时使用 `id 用户名`。

## 二、创建前检查

账号名称和 UID 可能已经被其他服务使用。创建前必须查询名称冲突，并确认本篇的测试家目录不存在。

### 1. 名称冲突

执行以下查询：

```bash
getent passwd labreader
getent passwd labowner
getent group labops
```

全新实验机中，这三条命令应没有输出并返回非零状态。任一名称已有记录时，停止创建并调查现有用途；不要复用或删除来源不明的身份。

### 2. 家目录状态

检查预期家目录：

```bash
ls -ld -- /home/labreader /home/labowner
```

预期报告路径不存在。目录已存在但账号不存在时，可能是历史遗留数据；应先核对所有者、内容和保留要求，不能让新账号自动继承旧数据。

## 三、测试身份创建

Ubuntu 推荐使用 `adduser` 和 `addgroup` 管理交互式本地身份。本文禁用测试账号密码，只通过管理员执行身份验证命令。

### 1. 用户组创建

创建共享测试组：

```bash
sudo addgroup labops
getent group labops
```

预期记录包含组名与系统分配的 GID，例如：

```text
labops:x:<GID>:
```

GID 是动态值，不应复制示例数字。只有需要与外部系统对齐时才手工指定 UID 或 GID，并在创建前检查冲突。

### 2. 用户创建

创建两个带独立家目录、但没有可用密码的测试用户：

```bash
sudo adduser --disabled-password --gecos 'Lab Reader' labreader
sudo adduser --disabled-password --gecos 'Lab Owner' labowner
```

`--disabled-password` 表示不设置可用于密码登录的密码。它不自动禁止 SSH 公钥、计划任务或管理员以该身份启动进程，因此不能把“密码不可用”等同于“账号完全停用”。

### 3. 附加组成员

把两个用户加入 `labops`：

```bash
sudo adduser labreader labops
sudo adduser labowner labops
id labreader
id labowner
```

两个 `id` 结果都应包含附加组 `labops`，主组仍分别是 `labreader` 和 `labowner`。添加附加组不会替换主组。

## 四、身份核验

账号创建成功需要同时验证名称解析、数值标识、组成员关系和目标身份进程，不能只看命令没有报错。

### 1. 账号记录

查看 NSS 返回的用户记录：

```bash
getent passwd labreader
getent passwd labowner
getent group labops
```

用户记录由冒号分隔，依次包含用户名、密码占位、UID、主 GID、说明、家目录和登录 Shell。不要解析或展示 `/etc/shadow` 中的密码哈希。

### 2. 目标身份进程

管理员可以在不建立交互登录的情况下运行只读身份查询：

```bash
sudo -u labreader -- id
sudo -u labowner -- id
```

输出中的有效用户应与目标账号一致，并包含 `labops`。这证明新进程取得了当前 NSS 配置中的组列表；它不证明账号能够通过密码或 SSH 登录。

### 3. 家目录归属

检查家目录所有者与权限：

```bash
ls -ld -- /home/labreader /home/labowner
```

两个目录应分别归对应用户及其主组所有。Ubuntu 新版本通常为新家目录使用私有模式，但实际值受 `/etc/adduser.conf` 影响，应以输出为准。

## 五、账号停用

停用需要区分密码认证、账号期限和已经运行的会话。只锁定密码不能终止现有进程，也不能阻止已配置的 SSH 公钥认证。

### 1. 密码状态

查看两个测试账号的密码状态：

```bash
sudo passwd -S labreader
sudo passwd -S labowner
```

使用 `--disabled-password` 创建的账号应显示锁定状态，状态字段通常为 `L`。`passwd -l` 只锁定密码字段；根据 Ubuntu 官方说明，用户仍可能通过其他认证令牌进入系统。

### 2. 账号期限

为 `labreader` 设置过去的到期日期，使新账号会话被账号期限拒绝：

```bash
sudo usermod --expiredate 1 labreader
sudo chage -l labreader
```

`chage -l` 应显示账号已过期。恢复账号期限使用：

```bash
sudo usermod --expiredate -1 labreader
sudo chage -l labreader
```

恢复期限不会解锁密码，也不会自动恢复被移除的 SSH 密钥或访问组。停用真实账号时还要检查现有会话、计划任务、服务进程和远程身份源。

::: warning 密码锁定不是完整停用
`passwd -l` 只影响密码认证。完整停用方案需要根据实际入口处理 SSH 公钥、现有会话、外部身份源和后台任务；这些入口不能通过一个本地密码状态推断。
:::

## 六、测试身份清理

删除身份前应确认没有进程和需要保留的文件归属于该 UID。本文账号只用于当前实验，因此可以连同测试家目录清理。

### 1. 进程检查

查询测试用户进程：

```bash
ps -u labreader -o pid,user,comm
ps -u labowner -o pid,user,comm
```

除标题行外不应存在输出。发现进程时，先确认它由哪个实验步骤创建并正常结束，不要直接删除仍承载任务的账号。

### 2. 用户删除

删除测试账号及其家目录：

```bash
sudo deluser --remove-home labreader
sudo deluser --remove-home labowner
```

`--remove-home` 只适合已经确认可丢弃的测试数据。生产账号的家目录、邮件和其他归属文件需要先归档或迁移，不能机械删除。

### 3. 用户组删除

账号删除后清理共享组并复核结果：

```bash
sudo delgroup labops
getent passwd labreader
getent passwd labowner
getent group labops
```

最后三条查询均应没有输出。删除名称记录不代表磁盘中不存在原 UID 拥有的其他文件；真实账号退役还需要按记录的数值 UID 查找和处理遗留对象。

本篇完成了本地测试身份的创建、组成员配置、状态核验、期限停用与清理。LDAP、Active Directory、PAM 策略和 SSH 认证分别具有独立的身份来源与控制面，不能由本地账号结果替代。
