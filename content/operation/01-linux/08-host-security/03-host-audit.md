---
title: "主机审计线索"
tags:
  - Linux
  - auditd
  - 日志
excerpt: "从账户、SSH、sudo、文件状态与 auditd 规则收集主机审计证据，明确默认日志的归因能力和缺失边界。"
date: 2026-09-24
---

# 主机审计线索

主机审计的目标是回答：谁在什么时间通过什么入口执行了什么操作，系统留下了哪些可以相互印证的证据。默认日志通常能记录登录、认证和 sudo 事件，却不会自动保存每个命令、每次文件内容变化及其业务原因。

本文使用受控 SSH 登录、sudo 验证和 auditd 临时文件监控建立证据链。所有测试事件都使用专用路径和标记，实验结束后删除规则，不把高频目录监控直接带入生产环境。

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可运行的 Linux 实验机。journal 字段、audit 记录类型和日志保留时间会受发行版配置影响，文中只说明验证方法与预期关联。
:::

## 一、证据来源

### 1. 证据能力

| 来源 | 能回答的问题 | 主要盲区 |
|------|--------------|----------|
| 账户数据库 | 当前账户、UID、组和 shell | 历史状态与修改者 |
| SSH journal | 登录来源、账户、认证方法 | 登录后的全部操作 |
| sudo journal | 谁请求了提权、执行入口 | 未经 sudo 的操作、完整业务上下文 |
| 文件元数据 | 当前所有者、权限、时间 | 内容修改者与历史版本 |
| auditd | 已配置规则覆盖的系统调用与对象 | 规则启用前事件、未覆盖对象 |
| 配置管理记录 | 期望配置、审批和发布主体 | 主机外手工变更 |

日志存在不等于归因成立。时间同步、账户共享、日志完整性和规则覆盖范围都会影响结论强度。

### 2. 时间基线

```bash
timedatectl status
date --iso-8601=seconds
journalctl --list-boots
```

多台主机事件关联依赖一致时间。若 NTP 未同步，应先记录偏差，再解释不同来源日志的先后关系。

## 二、账户证据

### 1. 当前账户

```bash
getent passwd operator
id operator
getent group sudo
sudo passwd -S operator
```

这些命令描述当前状态：UID、主组、附加组、登录 shell 和密码状态。它们不能证明账户何时创建、由谁加入 sudo 组。

### 2. 登录历史

```bash
last -F -n 20
lastlog -u operator
who -u
```

`last` 依赖登录记录文件，`lastlog` 展示账户最近登录，`who` 展示当前会话。日志轮转、截断或容器环境都可能导致记录不完整。

### 3. SSH 事件

```bash
sudo journalctl -u ssh --since '-1 hour' --no-pager
sudo journalctl -u ssh --since '-1 hour' \
  | grep -E 'Accepted|Failed|Invalid user'
```

重点关联时间、来源地址、目标账户和认证方法。连续失败后成功不等于已确认攻击，也可能是用户输错凭据；需要结合来源资产、工单和会话行为判断。

## 三、提权证据

sudo 记录提权请求及其执行命令，但日志完整度由 sudoers、journal 持久化和 I/O logging 配置决定。

### 1. 受控事件

先记录测试标记，再执行无副作用的身份查询：

```bash
OPS_AUDIT_MARK="ops-audit-$(date +%s)"
logger -t ops-audit "$OPS_AUDIT_MARK begin"
sudo -k
sudo id
logger -t ops-audit "$OPS_AUDIT_MARK end"
```

`sudo -k` 清除当前时间戳，强制本次请求重新经过认证策略。`id` 只输出身份，不修改系统。

### 2. 事件查询

```bash
sudo journalctl --since '-5 minutes' \
  SYSLOG_IDENTIFIER=sudo --no-pager
sudo journalctl --since '-5 minutes' \
  SYSLOG_IDENTIFIER=ops-audit --no-pager
```

根据标记界定时间窗口，再核对 sudo 事件中的调用账户、目标账户、终端、工作目录和命令。字段缺失时应标记证据限制，不能补写推测值。

::: tip 账户身份不等于自然人身份
共享账户、共享私钥或跳板机代理会削弱个人归因。可靠审计需要唯一账户、受控凭据、时间同步和集中日志共同支持。
:::

## 四、文件状态

文件元数据适合证明“现在是什么”，哈希适合证明“内容是否与已知基线相同”，二者都不能单独证明修改者。

### 1. 元数据与哈希

```bash
stat /etc/ssh/sshd_config
sha256sum /etc/ssh/sshd_config
namei -l /etc/ssh/sshd_config
```

`stat` 显示时间戳、所有者和权限，`sha256sum` 生成当前内容摘要，`namei` 检查整条路径权限。只有预先保存且可信的哈希，才能用于比较历史状态。

### 2. 包管理基线

```bash
dpkg-query -S /usr/bin/ssh
dpkg-query -W openssh-client openssh-server
sudo debsums -s openssh-client openssh-server 2>/dev/null
```

`debsums` 可能未安装，且并非所有包都提供所有文件的校验信息。配置文件还可能合法偏离包初始内容，应结合配置管理基线判断。

## 五、auditd 监控

auditd 只能记录规则启用之后、且命中规则的事件。开始前确认组件存在、服务运行并保存当前规则。

### 1. 环境检查

```bash
command -v auditctl
command -v ausearch
sudo systemctl status auditd --no-pager
sudo auditctl -s
sudo auditctl -l
```

若命令不存在，应通过已批准的软件包流程安装 `auditd`。生产环境新增规则前必须评估事件量、磁盘容量和集中采集能力。

### 2. 实验对象

```bash
test ! -e /srv/ops-lab/audit
sudo mkdir -p /srv/ops-lab/audit
sudo touch /srv/ops-lab/audit/baseline.conf
sudo chmod 640 /srv/ops-lab/audit/baseline.conf
```

专用目录避免监控 `/etc` 等高频范围。`baseline.conf` 仅用于本篇，不包含真实配置或敏感数据。

### 3. 临时规则

```bash
sudo auditctl -w /srv/ops-lab/audit/baseline.conf \
  -p wa -k ops_audit_lab
sudo auditctl -l | grep ops_audit_lab
```

`-p wa` 监控写入和属性变化，`-k` 添加可查询键。通过 `auditctl` 添加的是运行时规则，重启后通常不会保留，适合受控实验。

## 六、变更事件

### 1. 写入与改权

```bash
printf 'PermitExample no\n' \
  | sudo tee /srv/ops-lab/audit/baseline.conf
sudo chmod 600 /srv/ops-lab/audit/baseline.conf
sudo sync
```

两次操作应分别产生写入和属性变更相关记录。事件进入日志可能有短暂延迟，查询时应包含明确时间窗口。

### 2. 按键查询

```bash
sudo ausearch -k ops_audit_lab -ts recent -i
```

重点关联同一事件中的 `SYSCALL`、`PATH`、`CWD` 和主体字段。`auid` 通常用于追踪初始登录用户，`uid` 或 `euid` 可能因 sudo 变为 root；字段含义必须结合记录类型解释。

### 3. 按文件查询

```bash
sudo ausearch -f /srv/ops-lab/audit/baseline.conf \
  -ts recent -i
```

预期能找到目标路径的写入与权限变更。若只有规则存在却没有事件，检查 auditd 状态、规则路径、时间范围和内核审计状态。

## 七、证据关联

单一来源容易产生误判，调查时应建立最小时间线。

### 1. 时间线结构

| 时间 | 主体 | 入口 | 动作 | 对象 | 证据来源 |
|------|------|------|------|------|----------|
| 登录时刻 | 账户与来源地址 | SSH | 认证成功 | 主机会话 | ssh journal |
| 提权时刻 | 登录账户 | sudo | 执行命令 | 目标账户 | sudo journal |
| 变更时刻 | `auid`、`uid` | 系统调用 | 写入或改权 | 文件路径 | audit log |
| 验证时刻 | 调查者 | 只读命令 | 哈希与元数据 | 当前文件 | 现场记录 |

时间线应保留原始时间戳与时区，不把多个来源先转换成无时区文本。无法关联的缺口应明确写出。

### 2. 结论强度

| 证据组合 | 可以支持的结论 | 不能支持的结论 |
|----------|----------------|----------------|
| SSH 成功日志 | 某账户凭据从某来源完成认证 | 一定是账户所有者本人 |
| sudo 命令日志 | 某会话请求以目标身份执行命令 | 命令产生的全部后续文件变化 |
| audit 文件事件 | 已启用规则捕获到对象访问 | 规则启用前没有发生变更 |
| 当前哈希不一致 | 当前内容偏离可信基线 | 修改时间、修改者和动机 |

审计报告应使用证据能够支持的最窄结论，避免把“未记录”写成“未发生”。

## 八、规则清理

实验结束后删除准确规则和专用目录：

```bash
sudo auditctl -W /srv/ops-lab/audit/baseline.conf \
  -p wa -k ops_audit_lab
! sudo auditctl -l | grep -q ops_audit_lab
sudo rm -- /srv/ops-lab/audit/baseline.conf
sudo rmdir /srv/ops-lab/audit
```

第二条命令必须确认规则已经消失。若生产环境需要持久规则，应按组织规范写入 `/etc/audit/rules.d/`，经容量与性能评审后加载，不应把实验规则直接转为生产基线。

systemd journal 的过滤、启动边界和持久化见[系统日志](../04-processes-systemd/03-journalctl.md)，sudo 授权边界见[sudo 权限边界](../03-users-permissions/03-sudo-boundary.md)。
