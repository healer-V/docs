---
title: "系统日志与 journalctl"
tags:
  - Linux
  - journalctl
  - systemd
excerpt: "说明 systemd Journal 的单元、启动轮次与时间过滤，通过 ops-lab.service 启动失败演示日志查询、证据关联、恢复复测及常见查询异常。"
date: 2026-09-24
---

# 系统日志与 journalctl

systemd Journal 以结构化字段保存内核、服务管理器和应用提交的日志。`journalctl` 是查询这些记录的入口，它不会自动判断根因；运维人员需要用**单元、启动轮次和时间范围**缩小结果，再把日志与服务状态、配置和文件权限关联。

本文沿用 [`systemd 服务管理`](./02-systemd-services.md) 中的 `ops-lab.service`，制造一次可逆的工作目录缺失故障。示例适用于 Ubuntu Server 26.04 的 systemd 259，查询选项依据 [systemd 259 journalctl 手册](https://github.com/systemd/systemd/blob/v259/man/journalctl.xml)与 [Journal 字段手册](https://github.com/systemd/systemd/blob/v259/man/systemd.journal-fields.xml)。

::: warning 当前输出为待实测格式
当前工作区没有可运行的 Ubuntu/systemd 实验机。本文给出的服务状态、日志内容与时间戳是根据 systemd 259 行为整理的预期格式，不能冒充真实执行记录；在正式实验机上应以实际字段和错误消息完成校准。
:::

## 一、Journal 模型

Journal 的每条记录由消息正文和多个字段组成。过滤条件作用于字段，而不是依赖终端中某一行固定排版。

### 1. 日志记录

常见字段包括时间、主机、进程标识、优先级、消息来源和正文。systemd 管理的服务还会附带 `_SYSTEMD_UNIT` 等可信字段，使查询能够限定到具体单元。

| 字段 | 表示内容 | 诊断用途 |
|------|----------|----------|
| `MESSAGE` | 日志正文 | 阅读直接错误与应用消息 |
| `PRIORITY` | syslog 优先级 | 筛选错误、警告或普通信息 |
| `_SYSTEMD_UNIT` | 记录所属系统单元 | 隔离特定服务日志 |
| `_PID` | 产生日志的进程 PID | 关联同一次进程运行 |
| `_BOOT_ID` | 当前启动轮次标识 | 隔离重启前后的记录 |

以下划线开头的字段通常由 Journal 根据接收上下文附加，应用不能任意伪造这些可信字段。

### 2. 单元范围

`-u` 或 `--unit=` 按 systemd 单元过滤：

```bash
journalctl -u ops-lab.service --no-pager
```

单元名必须准确。省略 `.service` 时，某些命令可能补全后缀，但排障记录应保留完整名称，避免与其他单元类型混淆。

### 3. 启动轮次

`-b` 限定某次系统启动。没有参数时表示当前启动；`-b -1` 表示上一次启动，前提是 Journal 保留了对应历史记录。

```bash
journalctl --list-boots --no-pager
journalctl -u ops-lab.service -b --no-pager
```

若系统使用易失存储或历史已轮转，上一次启动可能不可查询。`--list-boots` 的实际结果比“机器曾经重启过”的记忆更可靠。

## 二、查询基线

制造故障前先保存正常状态和近期日志。基线用于区分原有告警与本次操作产生的新记录。

### 1. 服务条件

本篇要求实验机中已经存在下列演示对象：

| 对象 | 预期值 |
|------|--------|
| 单元 | `/etc/systemd/system/ops-lab.service` |
| 运行用户 | `opslab` |
| 工作目录 | `/srv/ops-lab/site` |
| 启动命令 | Python HTTP 服务，监听 `127.0.0.1:8765` |

如果对象尚未创建，先按 [`systemd 服务管理`](./02-systemd-services.md) 完成创建与正常启动，再回到本篇。不要在名称冲突或目录归属不明的主机上继续实验。

### 2. 正常状态

依次检查单元状态、工作目录和 HTTP 响应：

```bash
systemctl is-active ops-lab.service
systemctl show ops-lab.service -p ActiveState -p SubState -p Result
sudo stat -c '%U %G %a %n' /srv/ops-lab/site
curl --fail --silent --show-error http://127.0.0.1:8765/
```

预期 `is-active` 输出 `active`，`ActiveState=active`、`SubState=running`、`Result=success`，请求返回 `ops-lab ready`。任一条件不成立时，应先恢复服务正常状态，不能把已有故障混入本次日志实验。

### 3. 近期日志

查看当前启动轮次内最近 20 条单元日志，并使用 ISO 风格时间：

```bash
journalctl -u ops-lab.service -b -n 20 -o short-iso --no-pager
```

输出通常包含 systemd 的启动消息和 Python HTTP 服务的访问记录。`-n 20` 限制显示数量，不表示只查询 20 秒或 20 分钟。

## 三、范围过滤

日志量较大时，先组合单元、启动轮次和时间，再决定是否增加优先级或字段过滤。直接浏览全系统 Journal 容易把其他服务的错误当成本次根因。

### 1. 最近记录

```bash
journalctl -u ops-lab.service -n 10 -o short-iso --no-pager
```

该查询适合快速查看尾部记录，但服务高频输出时，真正的启动错误可能已经被后续消息挤出范围。此时应改用明确时间窗口。

### 2. 当前启动

```bash
journalctl -u ops-lab.service -b -o short-iso --no-pager
```

`-b` 排除以前启动轮次中的同名单元记录。调查重启前故障时则应先用 `--list-boots` 确认历史，再显式选择 `-b -1` 或对应启动偏移。

### 3. 时间窗口

`--since` 与 `--until` 接受绝对时间和 systemd 支持的相对时间表达式。调查刚发生的实验故障可以先查询最近五分钟：

```bash
journalctl -u ops-lab.service --since '-5 min' --until 'now' -o short-iso --no-pager
```

生产事件应记录带时区的准确时间，并根据主机时区解释。相对时间会随执行时刻变化，不适合作为长期事件证据。

::: tip 先限定范围再搜索正文
服务名和启动轮次是结构化边界，时间是事件边界。先用这三项缩小记录，再检查 `MESSAGE`，比在全系统日志中搜索一个通用词更不容易产生误判。
:::

## 四、故障复现

本次故障只移动演示服务的工作目录。操作前必须确认路径内容与备用路径状态，并保留可直接登录实验机的控制台。

### 1. 路径确认

```bash
sudo find /srv/ops-lab/site -maxdepth 1 -printf '%U %G %m %p\n'
test ! -e /srv/ops-lab/site.off
```

结果只应包含本实验的 `site` 目录和 `index.html`。如果 `site.off` 已存在，或目录中出现其他业务文件，停止操作并查明归属。

### 2. 目录故障

先停止服务，再移动工作目录并记录故障开始时间：

```bash
sudo systemctl stop ops-lab.service
date --iso-8601=seconds
sudo mv /srv/ops-lab/site /srv/ops-lab/site.off
sudo systemctl start ops-lab.service
```

保存 `date` 输出。最后一条命令预期返回非零，因为单元无法进入配置的 `WorkingDirectory`。如果 `start` 意外成功，不继续假设故障成立，应立即检查单元实际配置和进程工作目录。

### 3. 状态证据

```bash
systemctl is-failed ops-lab.service
systemctl show ops-lab.service -p ActiveState -p SubState -p Result
systemctl status ops-lab.service --no-pager
```

预期 `is-failed` 输出 `failed`，`ActiveState=failed`，`Result` 为非成功结果。`status` 适合人工查看当前状态和近期日志，但它会截断历史，脚本也不应解析其视觉排版。

## 五、根因定位

根因判断需要形成证据链：服务在同一时间进入失败状态，Journal 记录启动阶段错误，配置中的工作目录同时不存在。

### 1. 单元日志

查询当前启动轮次最近 30 条记录：

```bash
journalctl -u ops-lab.service -b -n 30 -o short-iso --no-pager
```

预期能看到与启动失败对应的 systemd 记录，内容通常指向更改工作目录阶段或执行阶段失败。具体措辞、错误码和 PID 取决于 systemd 版本及环境，应保留原始输出，不把本文的概括文本当作实际日志。

### 2. 详细字段

`verbose` 输出显示一条记录的结构化字段，适合确认单元、PID、优先级和启动轮次：

```bash
journalctl -u ops-lab.service -b -n 5 -o verbose --no-pager
```

重点核对 `_SYSTEMD_UNIT=ops-lab.service`、`_BOOT_ID`、`PRIORITY` 与 `MESSAGE`。字段缺失不一定表示伪造或损坏，不同来源能够提供的上下文不同。

### 3. 文件证据

```bash
sudo systemctl cat ops-lab.service
sudo test ! -d /srv/ops-lab/site
echo $?
sudo stat -c '%U %G %a %n' /srv/ops-lab/site.off
```

`systemctl cat` 应显示 `WorkingDirectory=/srv/ops-lab/site`；目录不存在检查应返回 `0`；备用目录仍应由 `opslab` 管理。三项事实与同一时间的启动日志相互支持，才能把根因定位为工作目录被移动。

::: warning 日志消息不是唯一证据
相同的“启动失败”可能由路径不存在、目录搜索权限不足、可执行文件缺失或安全策略拒绝引起。必须回到单元配置和实际文件状态验证，不能只凭一条消息修改权限或删除文件。
:::

## 六、恢复复测

恢复动作必须先修复资源，再清理失败状态并重新启动。`reset-failed` 只清除 systemd 记录的失败状态，不会创建目录或修复权限。

### 1. 目录恢复

```bash
sudo test ! -e /srv/ops-lab/site
sudo mv /srv/ops-lab/site.off /srv/ops-lab/site
sudo stat -c '%U %G %a %n' /srv/ops-lab/site
```

如果原路径已经出现新对象，不得覆盖；先调查其来源。恢复后的目录应保持原有所有者、所属组和模式。

### 2. 服务恢复

```bash
sudo systemctl reset-failed ops-lab.service
sudo systemctl start ops-lab.service
systemctl is-active ops-lab.service
curl --fail --silent --show-error http://127.0.0.1:8765/
```

预期状态恢复为 `active`，HTTP 请求返回 `ops-lab ready`。如果仍失败，重新查询本次启动产生的新日志，不要反复执行 `reset-failed` 掩盖变化。

### 3. 日志复核

```bash
journalctl -u ops-lab.service --since '-5 min' -o short-iso --no-pager
```

结果应同时保留故障记录和后续成功启动记录。Journal 是追加式事件记录，恢复服务不会删除之前的错误；验证目标是确认错误不再继续出现，并找到时间更晚的成功状态。

## 七、查询异常

“没有查到日志”不等于服务没有发生事件。先检查查询条件和读取权限，再判断日志是否未写入或已被轮转。

### 1. 单元名称

使用下列命令确认 systemd 认识的准确单元名：

```bash
systemctl status ops-lab.service --no-pager
systemctl list-units --type=service --all | grep -F 'ops-lab'
```

模板单元、用户单元和系统单元具有不同名称或管理器范围。系统服务不要误用 `journalctl --user`，用户服务则需要在对应用户管理器中查询。

### 2. 时间与启动轮次

```bash
timedatectl
journalctl --list-boots --no-pager
```

先确认主机当前时间、时区和可用启动轮次。时间窗口写错、时区理解错误或把 `-b` 限定在错误轮次，都会产生空结果。

### 3. 读取权限

普通用户看到的 Journal 范围受系统配置和组权限约束。查询结果明显不完整时，可以在已获授权的实验环境用 `sudo journalctl ...` 对照，但不要为了方便随意把账号长期加入高权限日志组。

```bash
id
sudo journalctl -u ops-lab.service -b -n 20 --no-pager
```

若提权后出现记录，问题是读取范围而非服务没有日志；应按组织授权策略提供最小只读权限。若两者都为空，再检查服务是否真正由该 systemd 管理器启动、日志是否进入其他目标以及持久化和轮转配置。

本文建立的查询顺序是：**确认单元和正常基线，限定启动轮次与时间，复现故障，关联状态、日志和文件证据，恢复后再次查询**。`journalctl` 提供证据，不替代对配置和资源状态的验证。
