---
title: "文件与目录权限"
tags:
  - Linux
  - 文件权限
  - chmod
excerpt: "解释所有者、所属组与其他用户的 rwx 权限，并通过三个测试身份验证文件和目录的允许与拒绝结果。"
date: 2026-09-24
---

# 文件与目录权限

每个 Linux 文件都记录所有者 UID、所属组 GID 和三组访问权限。进程访问对象时，内核根据进程身份选择**所有者、所属组、其他用户**中的一组权限，再判断读、写或执行请求是否允许。

本文创建 `labowner`、`labreader`、`laboutside` 和 `labops` 测试身份，只操作 `/srv/ops-lab/permissions`。权限语义依据 [GNU Coreutils 文件权限手册](https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html)和 [Ubuntu Server 用户管理文档](https://ubuntu.com/server/docs/how-to/security/user-management/)核对，输出为 Ubuntu 26.04.1 的预期形式。

## 一、权限对象

权限判断同时依赖文件元数据、进程身份和完整路径上的目录权限。只查看目标文件一行权限，不能解释所有访问失败。

### 1. 所有者、所属组与其他用户

长格式权限可以拆成四部分：

```text
- rw- r-- ---  labowner labops report.txt
│  │   │   │      │       │
│  │   │   │      │       └─ 所属组
│  │   │   │      └─ 所有者
│  │   │   └─ 其他用户权限
│  │   └─ 所属组权限
│  └─ 所有者权限
└─ 对象类型
```

如果进程 UID 等于文件所有者 UID，内核使用所有者权限；否则，如果进程属于文件组，使用组权限；其余情况使用其他用户权限。三组权限不会为同一次访问自动合并。

### 2. 文件权限语义

| 权限 | 普通文件上的含义 |
|------|------------------|
| `r` | 读取文件内容 |
| `w` | 修改文件内容 |
| `x` | 请求把文件作为程序执行 |

文件的删除权限不由文件自身的 `w` 决定，而由父目录的写和搜索权限决定。因此，只读文件仍可能被拥有父目录写权限的用户删除。

### 3. 目录权限语义

| 权限 | 目录上的含义 |
|------|--------------|
| `r` | 读取目录项名称列表 |
| `w` | 创建、删除或重命名目录项 |
| `x` | 搜索目录并访问已知名称的子对象 |

目录缺少 `x` 时，即使拥有 `r`、能够看到部分名称，也不能正常进入目录或访问其中对象。路径上的每一级父目录都需要相应搜索权限。

## 二、测试身份与目录

实验使用一个文件所有者、一个同组读取者和一个组外用户。开始前确认同名身份不存在，并保留管理员控制台。

### 1. 身份创建

确认名称没有冲突后创建测试身份：

```bash
sudo addgroup labops
sudo adduser --disabled-password --gecos 'Lab Owner' labowner
sudo adduser --disabled-password --gecos 'Lab Reader' labreader
sudo adduser --disabled-password --gecos 'Lab Outside' laboutside
sudo adduser labowner labops
sudo adduser labreader labops
```

使用 `id labowner`、`id labreader` 和 `id laboutside` 核对：前两个用户应属于 `labops`，`laboutside` 不属于该组。

### 2. 目录与文件

创建由 `labowner:labops` 管理的测试目录和文件：

```bash
sudo install -d -o labowner -g labops -m 0750 /srv/ops-lab/permissions
sudo -u labowner -- sh -c "printf '%s\n' 'status=ready' > /srv/ops-lab/permissions/report.txt"
sudo chown labowner:labops /srv/ops-lab/permissions/report.txt
sudo chmod 0640 /srv/ops-lab/permissions/report.txt
```

`0750` 让目录所有者可读写搜索、组成员可读和搜索、其他用户无权访问；`0640` 让文件所有者可读写、组成员只读、其他用户无权访问。

### 3. 元数据核对

```bash
ls -ld -- /srv/ops-lab/permissions
ls -l -- /srv/ops-lab/permissions/report.txt
stat -c '%A %a %U %G %n' -- /srv/ops-lab/permissions/report.txt
```

关键结果应为：

```text
-rw-r----- 640 labowner labops /srv/ops-lab/permissions/report.txt
```

时间、链接数和精确排版会变化，权限数值、所有者、所属组和路径必须一致。

## 三、访问结果

三个身份对同一对象执行相同读取命令，可以证明内核选择了哪一组权限。测试使用 `sudo -u` 启动目标用户进程，不需要设置测试密码。

### 1. 所有者访问

```bash
sudo -u labowner -- cat /srv/ops-lab/permissions/report.txt
```

预期输出 `status=ready`。`labowner` 匹配文件所有者，因此使用 `rw-` 这一组权限。

### 2. 所属组访问

```bash
sudo -u labreader -- cat /srv/ops-lab/permissions/report.txt
```

预期同样输出 `status=ready`。`labreader` 不是所有者，但属于 `labops`，因此使用组权限 `r--`。

尝试追加内容应被拒绝：

```bash
sudo -u labreader -- sh -c "printf '%s\n' 'changed=yes' >> /srv/ops-lab/permissions/report.txt"
```

预期出现 `Permission denied`，原文件仍只有 `status=ready`。读取允许和写入拒绝共同证明组权限不是全有或全无。

### 3. 其他用户访问

```bash
sudo -u laboutside -- cat /srv/ops-lab/permissions/report.txt
```

预期报告 `Permission denied`。`laboutside` 既不是所有者，也不属于 `labops`，因此使用其他用户权限 `---`。

::: tip 用目标身份复测
`ls -l` 只能显示配置的权限位；是否允许访问必须用目标用户进程实际请求。测试命令、错误文本和退出状态应一起保存。
:::

## 四、权限修改

`chmod` 修改访问模式，`chown` 修改所有者和所属组。权限修改只作用于明确目标，不应为了排障直接递归放宽整个目录树。

### 1. 符号模式

符号模式由用户类别、操作符和权限组成：

```text
u  所有者    g  所属组    o  其他用户    a  全部
+  添加      -  移除      =  精确设置
r  读取      w  写入      x  执行或搜索
```

为组添加写权限，再用 `labreader` 验证：

```bash
sudo chmod g+w /srv/ops-lab/permissions/report.txt
sudo -u labreader -- sh -c "printf '%s\n' 'changed=yes' >> /srv/ops-lab/permissions/report.txt"
tail -n 2 /srv/ops-lab/permissions/report.txt
```

预期第二行出现 `changed=yes`。完成验证后恢复组只读：

```bash
sudo chmod g-w /srv/ops-lab/permissions/report.txt
```

### 2. 数字模式

数字模式用 `r=4`、`w=2`、`x=1` 表示每组权限之和：

| 数值 | 权限 | 常见含义 |
|------|------|----------|
| `7` | `rwx` | 读、写、执行或搜索 |
| `6` | `rw-` | 读写 |
| `5` | `r-x` | 读取并执行或搜索 |
| `4` | `r--` | 只读 |
| `0` | `---` | 无普通权限 |

恢复本文基线：

```bash
sudo chmod 0750 /srv/ops-lab/permissions
sudo chmod 0640 /srv/ops-lab/permissions/report.txt
```

前导 `0` 明确表示八进制模式。数字写法简洁，但必须能够解释每一位，不能把 `777` 当作通用修复。

### 3. 所有者与所属组

调整归属使用 `chown`：

```bash
sudo chown labowner:labops /srv/ops-lab/permissions/report.txt
```

普通用户通常只能把文件组改为自己所属的组，修改所有者需要适当特权。归属变化可能影响后续权限判断，修改后应重新执行 `stat` 和目标身份访问测试。

## 五、目录搜索权限

目录 `x` 表示搜索已知名称的能力。它是权限排障中最常被忽略的条件，需要单独做允许与拒绝对照。

### 1. 搜索权限移除

把组目录权限从 `r-x` 改为 `r--`：

```bash
sudo chmod 0740 /srv/ops-lab/permissions
sudo -u labreader -- ls /srv/ops-lab/permissions
sudo -u labreader -- cat /srv/ops-lab/permissions/report.txt
```

目录读取可能显示名称，但访问文件应报告 `Permission denied`。组成员缺少目录搜索权限，无法穿过该路径到达文件。

### 2. 搜索权限恢复

恢复目录组搜索权限并复测：

```bash
sudo chmod 0750 /srv/ops-lab/permissions
sudo -u labreader -- cat /srv/ops-lab/permissions/report.txt
```

预期再次输出文件内容。只修改目标文件权限无法修复父目录搜索权限，路径链必须逐级检查。

### 3. 路径权限检查

从根目录到目标逐级查看：

```bash
ls -ld -- / /srv /srv/ops-lab /srv/ops-lab/permissions
ls -l -- /srv/ops-lab/permissions/report.txt
```

出现访问拒绝时，应先找到第一层缺少搜索权限的目录，而不是立即给文件或整个目录树增加所有人权限。

## 六、默认创建权限

新对象的初始权限由程序请求的基础模式与进程 `umask` 共同决定。`umask` 清除相应权限位，不会为文件自动增加执行权限。

### 1. umask 读取

```bash
umask
```

常见输出 `0022` 表示清除组和其他用户的写权限。以基础模式 `0666` 的普通文件为例，结果通常为 `0644`；以 `0777` 的目录为例，结果通常为 `0755`。

### 2. 创建结果

在目标用户上下文中创建对象并检查：

```bash
sudo -u labowner -- touch /srv/ops-lab/permissions/new-file
sudo -u labowner -- mkdir /srv/ops-lab/permissions/new-dir
stat -c '%a %n' /srv/ops-lab/permissions/new-file /srv/ops-lab/permissions/new-dir
```

实际结果还受 `sudo` 环境、应用显式模式和默认 ACL 影响。不要只根据交互 Shell 的 `umask` 推断服务进程创建的文件权限。

## 七、实验清理

清理前恢复权限，确保管理员能够删除测试对象，然后删除账号和组。

### 1. 对象清理

```bash
sudo chmod 0750 /srv/ops-lab/permissions
sudo rm -r -- /srv/ops-lab/permissions
test ! -e /srv/ops-lab/permissions && echo cleaned
```

预期输出 `cleaned`。目标必须精确等于本篇实验目录，不得替换为更高层路径。

### 2. 身份清理

```bash
sudo deluser --remove-home labowner
sudo deluser --remove-home labreader
sudo deluser --remove-home laboutside
sudo delgroup labops
```

最后使用 `getent passwd` 和 `getent group` 确认测试身份不再存在。

本文证明了所有者、组和其他用户权限如何影响同一文件，并展示了目录搜索权限的独立作用。ACL、SUID、SGID 和 sticky bit 属于扩展权限机制，不应在基本 `rwx` 判断尚未闭合时用于绕过问题。
