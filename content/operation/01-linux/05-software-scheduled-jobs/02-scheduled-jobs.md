---
title: "定时任务"
tags:
  - Linux
  - systemd
  - Timer
excerpt: "说明 systemd Timer 的触发关系、日历表达式、运行身份和环境，通过受控服务验证真实触发、Journal 证据、权限失败及禁用清理。"
date: 2026-09-24
---

# 定时任务

定时任务把“何时触发”与“执行什么”分开管理。在 systemd 中，`.timer` 单元负责计算下一次触发时间，匹配的 `.service` 单元负责运行命令；Timer 到期并不直接执行任意 Shell 文本。

可靠的定时任务需要同时验证四件事：**触发时间正确、服务以预期身份运行、工作目录和环境明确、结果与失败能够被观察**。本文使用 systemd 259 创建每分钟触发一次的隔离任务，只更新 `/srv/ops-lab/scheduled-jobs/last-run` 并向 Journal 输出身份和环境。

::: warning 当前示例尚未在 systemd 实验机执行
当前工作区没有可运行的 Ubuntu/systemd 虚拟机。Timer 的动态时间、Invocation ID 和 Journal 时间戳必须在实际实验机上取得，本文只给出预期状态与判断方法。
:::

## 一、Timer 执行模型

Timer 只负责激活单元。默认情况下，`ops-lab-schedule.timer` 激活同名的 `ops-lab-schedule.service`；服务完成后回到非活动状态，等待下一次激活。

### 1. 单元关系

```text
ops-lab-schedule.timer
        ↓ 到达触发时间
systemd 激活同名单元
        ↓
ops-lab-schedule.service
        ↓
命令以配置的身份和环境执行
```

Timer 到期时，如果目标服务仍处于活动状态，systemd 不会为它再启动一个并发实例。因此任务执行时间、触发间隔和服务状态必须一起评估。

### 2. 日历时间

`OnCalendar=` 使用 systemd 日历表达式描述墙上时钟时间。本文使用 `*-*-* *:*:00`，表示每分钟的第 0 秒。

```bash
systemd-analyze calendar '*-*-* *:*:00'
```

预期输出包含规范化表达式和下一次触发时间。先用该命令验证表达式，比启用 Timer 后等待错误时间更容易发现配置问题。

### 3. 精度与补偿

`AccuracySec=` 表示触发允许的时间窗口，默认通常为 1 分钟。本文为了缩短实验等待设置为 `1s`，生产任务应根据时效和资源唤醒成本选择更宽的合理值。

`Persistent=true` 会在 Timer 再次激活时补偿停机期间错过的日历触发。本文显式使用 `false`，避免启动实验机后立即补跑；是否补偿必须根据任务是否可重复、是否过期和是否存在副作用决定。

## 二、实验边界

实验使用普通登录用户 `operator` 运行任务。系统管理员只负责创建目录、安装单元和控制 systemd。

### 1. 版本与身份

```bash
systemctl --version
id operator
command -v touch printenv id
```

预期 systemd 为 259 系列，`operator` 存在，三个程序均返回绝对路径。用户不存在或命令路径不同，需要先修正环境，不能把单元中的身份和路径留给运行时猜测。

### 2. 对象冲突

```bash
test ! -e /etc/systemd/system/ops-lab-schedule.service
test ! -e /etc/systemd/system/ops-lab-schedule.timer
test ! -e /srv/ops-lab/scheduled-jobs
```

三条命令均返回 `0` 才表示对象未被占用。任何路径已存在时，先调查归属，不覆盖同名服务或数据。

### 3. 工作目录

```bash
sudo install -d -o operator -g "$(id -gn operator)" -m 0750 /srv/ops-lab/scheduled-jobs
sudo stat -c '%U %G %a %n' /srv/ops-lab/scheduled-jobs
```

目录所有者应为 `operator`，模式为 `750`。服务将以普通身份在该目录执行，不需要 root 写入权限。

## 三、服务单元

服务单元声明实际动作、运行身份、工作目录和环境。使用 `Type=oneshot` 表示命令全部成功结束后，本次任务完成。

### 1. 单元配置

使用 `sudo nano /etc/systemd/system/ops-lab-schedule.service` 创建以下文件。

::: details 查看 ops-lab-schedule.service 完整配置

```ini
[Unit]
Description=Operations lab scheduled task

[Service]
Type=oneshot
User=operator
WorkingDirectory=/srv/ops-lab/scheduled-jobs
Environment=OPS_LAB_MODE=timer
ExecStart=/usr/bin/touch /srv/ops-lab/scheduled-jobs/last-run
ExecStart=/usr/bin/printenv OPS_LAB_MODE
ExecStart=/usr/bin/id
```

:::

三条 `ExecStart` 按顺序执行；任一命令失败，本次服务失败，后续命令不再运行。`printenv` 与 `id` 的输出默认进入 Journal，形成环境和身份证据。

### 2. 配置检查

```bash
sudo systemd-analyze verify /etc/systemd/system/ops-lab-schedule.service
sudo systemctl daemon-reload
```

`verify` 不应报告本单元的语法或路径错误。`daemon-reload` 只重新读取单元，不会自动运行服务。

### 3. 手动验证

```bash
sudo systemctl start ops-lab-schedule.service
systemctl show ops-lab-schedule.service -p ActiveState -p SubState -p Result
sudo stat -c '%U %G %y %n' /srv/ops-lab/scheduled-jobs/last-run
journalctl -u ops-lab-schedule.service -n 10 --no-pager
```

预期 `Result=success`，服务完成后通常为 `inactive/dead`，状态文件所有者为 `operator`。Journal 应包含 `timer` 以及 `operator` 对应的 UID、GID 信息。手动成功证明服务动作可执行，但尚未证明 Timer 会触发。

## 四、Timer 单元

Timer 使用与服务相同的基本名称，使默认激活关系无需额外 `Unit=` 配置。

### 1. Timer 配置

使用 `sudo nano /etc/systemd/system/ops-lab-schedule.timer` 创建以下文件：

```ini
[Unit]
Description=Run operations lab task every minute

[Timer]
OnCalendar=*-*-* *:*:00
AccuracySec=1s
Persistent=false

[Install]
WantedBy=timers.target
```

单元只在实验期间每分钟触发。生产任务不得直接照搬高频周期，应根据业务时效、执行时间、失败重试和资源成本设计。

### 2. 组合检查

```bash
sudo systemd-analyze verify /etc/systemd/system/ops-lab-schedule.service
sudo systemd-analyze verify /etc/systemd/system/ops-lab-schedule.timer
systemd-analyze calendar '*-*-* *:*:00'
```

两份单元都应通过语法检查，日历解析结果应显示下一分钟边界。表达式正确不代表系统时钟正确，还需用 `timedatectl` 检查时间、时区和同步状态。

### 3. 启用状态

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ops-lab-schedule.timer
systemctl is-enabled ops-lab-schedule.timer
systemctl is-active ops-lab-schedule.timer
```

预期 Timer 同时为 `enabled` 和 `active`。`enabled` 表示建立开机启动关联，`active` 表示当前已经等待触发，两者仍是独立状态。

## 五、触发验证

定时任务必须等待一次真实日历触发，而不是只手动启动服务。最长等待时间约为一分钟加精度窗口。

### 1. 下一次触发

```bash
systemctl list-timers --all ops-lab-schedule.timer
systemctl status ops-lab-schedule.timer --no-pager
```

`NEXT` 应为下一分钟边界附近，`LEFT` 随时间递减。`LAST` 在首次触发前可能为空，触发后应出现最近执行时间。

### 2. 文件证据

等待一次触发后查询状态文件：

```bash
sudo stat -c '%U %G %y %n' /srv/ops-lab/scheduled-jobs/last-run
```

修改时间应晚于 Timer 启用时间，所有者仍为 `operator`。如果文件早已存在，只看“文件存在”无法证明本次触发，必须比较时间。

### 3. 日志证据

```bash
journalctl -u ops-lab-schedule.service --since '-3 min' -o short-iso --no-pager
systemctl show ops-lab-schedule.service -p Result -p ExecMainStatus
```

日志应显示由 Timer 激活的服务运行记录、环境值 `timer` 和 `operator` 身份。`Result=success`、退出状态 `0` 与状态文件时间共同证明本次触发完成。

## 六、权限失败

手动命令成功但调度失败时，常见原因是服务身份无法访问路径。下面在启用 Timer 前或临时停止 Timer 后制造一次可恢复的权限拒绝。

### 1. 故障注入

```bash
sudo systemctl stop ops-lab-schedule.timer
sudo rm -- /srv/ops-lab/scheduled-jobs/last-run
sudo chown root:root /srv/ops-lab/scheduled-jobs
sudo chmod 0755 /srv/ops-lab/scheduled-jobs
sudo systemctl start ops-lab-schedule.service
```

先删除 `last-run`，避免文件所有者仍为 `operator` 时 `touch` 只更新时间而掩盖目录权限问题。最后一条预期失败，因为 `operator` 对目录没有写权限，无法重新创建文件。如果命令成功，应检查目录 ACL 和实际服务身份，不继续假设故障成立。

### 2. 失败证据

```bash
systemctl show ops-lab-schedule.service -p ActiveState -p Result -p ExecMainStatus
journalctl -u ops-lab-schedule.service -n 20 --no-pager
sudo stat -c '%U %G %a %n' /srv/ops-lab/scheduled-jobs
```

预期 `Result` 为失败，Journal 包含 `Permission denied` 或等价错误，目录所有者为 root。三项证据把失败收敛到服务身份与目录权限。

### 3. 权限恢复

```bash
sudo chown operator:"$(id -gn operator)" /srv/ops-lab/scheduled-jobs
sudo chmod 0750 /srv/ops-lab/scheduled-jobs
sudo systemctl reset-failed ops-lab-schedule.service
sudo systemctl start ops-lab-schedule.service
sudo systemctl start ops-lab-schedule.timer
```

恢复后服务应成功，Timer 重新进入等待状态。`reset-failed` 只清理失败记录，不会修复目录权限。

## 七、禁用与清理

禁用 Timer 后不会再产生新触发，但已经运行的服务需要单独确认。清理前先核对单元和目录确实属于本篇实验。

### 1. 停止触发

```bash
sudo systemctl disable --now ops-lab-schedule.timer
systemctl is-active ops-lab-schedule.timer
systemctl is-enabled ops-lab-schedule.timer
```

后两条命令预期返回非零。再等待一个原周期，状态文件修改时间不应变化。

### 2. 删除单元

```bash
sudo systemctl reset-failed ops-lab-schedule.service
sudo rm -- /etc/systemd/system/ops-lab-schedule.timer
sudo rm -- /etc/systemd/system/ops-lab-schedule.service
sudo systemctl daemon-reload
```

先定点清理本示例服务的失败记录，再删除单元文件。`daemon-reload` 让 systemd 忘记已删除文件，不会改变其他服务的失败状态。

### 3. 删除数据

```bash
sudo rm -- /srv/ops-lab/scheduled-jobs/last-run
sudo rmdir -- /srv/ops-lab/scheduled-jobs
```

`rmdir` 只删除空目录。如果存在其他文件，先调查来源，不改用递归强删。

## 八、调度异常

Timer 没有按预期运行时，按时间、Timer、服务和资源四层检查，避免只重复启动。

### 1. 时间异常

```bash
timedatectl
systemd-analyze calendar '*-*-* *:*:00'
```

核对当前时间、时区、时钟同步和下一次计算结果。墙上时钟错误会直接改变 `OnCalendar` 触发时刻。

### 2. Timer 异常

```bash
systemctl status ops-lab-schedule.timer --no-pager
systemctl list-timers --all ops-lab-schedule.timer
```

确认单元已加载、当前为 active、存在下一次触发。只有 enabled 但未 active 时，不会在当前会话中等待触发。

### 3. 服务异常

检查目标服务的 `Result`、Journal、身份、绝对路径、工作目录和资源权限。Timer 触发成功而服务失败，问题位于执行阶段，不应修改日历表达式掩盖失败。

本文证明了 Timer 到服务的激活关系、日历解析、普通用户身份、真实触发、权限失败和禁用清理。cron 是另一套兼容调度入口，不在本文与 systemd Timer 混合配置。

官方依据：[systemd 259 Timer 单元手册](https://github.com/systemd/systemd/blob/v259/man/systemd.timer.xml)、[时间表达式手册](https://github.com/systemd/systemd/blob/v259/man/systemd.time.xml)与 [systemd-analyze 手册](https://github.com/systemd/systemd/blob/v259/man/systemd-analyze.xml)。
