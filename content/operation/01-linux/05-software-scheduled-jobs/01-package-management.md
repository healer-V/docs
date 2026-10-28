---
title: "软件包管理"
tags:
  - Linux
  - APT
  - Ubuntu
excerpt: "说明 Ubuntu 软件源、本地索引、候选版本和安装状态，通过 hello 软件包演示变更预览、安装验证、更新评估、删除回退及常见故障处理。"
date: 2026-09-24
---

# 软件包管理

Ubuntu 使用软件包记录程序、库、配置和依赖关系，使用软件源发布可获取的软件包版本。APT（Advanced Packaging Tool）负责读取软件源、刷新本地索引、计算依赖并执行安装或删除；dpkg 负责本机 `.deb` 软件包的底层状态。

软件包操作的核心不是记住 `apt install`，而是先回答三个问题：**候选版本来自哪个软件源、APT 准备改变哪些包、执行后怎样证明程序和包状态一致**。本文在 Ubuntu Server 26.04 隔离虚拟机中安装并删除官方仓库的轻量 `hello` 包。

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可用的 Linux 实验机。包版本、下载大小和 APT 输出会随镜像及更新变化，文中只给出观察项和预期格式，不把它们写成实测结果。实验必须在可回退的虚拟机中完成。
:::

## 一、APT 软件模型

APT 的操作对象不是一个孤立的可执行文件。软件源、本地索引、软件包元数据、依赖关系和 dpkg 状态共同决定一次变更。

### 1. 软件源

软件源定义从哪里取得软件包及其元数据。Ubuntu 24.04 及以后默认使用 deb822 格式，官方仓库通常记录在 `/etc/apt/sources.list.d/ubuntu.sources`。

```bash
sudo sed -n '1,160p' /etc/apt/sources.list.d/ubuntu.sources
```

重点检查 `URIs`、`Suites`、`Components` 与签名密钥位置。本文不添加第三方软件源，也不导入来源不明的密钥。

### 2. 本地索引

本地索引是软件源元数据在当前主机上的缓存。`apt update` 刷新索引，不安装或升级软件包；索引过旧时，候选版本和依赖判断可能已经落后于仓库。

```text
软件源发布元数据
        ↓ apt update
本地主机保存软件包索引
        ↓ apt install / upgrade
APT 计算并提交依赖变更
        ↓
dpkg 写入本机软件包状态
```

### 3. 软件包状态

同一个包至少存在“仓库可用版本”和“本机已安装版本”两个维度。`apt-cache policy` 用于对照来源与候选版本，`dpkg-query` 用于读取本机状态。

| 状态 | 含义 | 主要证据 |
|------|------|----------|
| 未收录 | 当前索引没有该包 | `apt-cache policy` 无候选版本 |
| 可安装 | 索引存在候选版本，本机未安装 | `Candidate` 有值，`Installed` 为 `(none)` |
| 已安装 | dpkg 记录完整安装状态 | `Status: install ok installed` |
| 可升级 | 仓库候选版本高于本机版本 | `apt list --upgradable` 与变更预览 |
| 状态异常 | 解包或配置未完成 | `dpkg --audit`、APT 错误输出 |

## 二、变更前检查

安装前先确认发行版、软件源和目标包基线。目标已经存在时，不应把它当作本篇新安装对象并在结尾擅自删除。

### 1. 系统版本

```bash
cat /etc/os-release
apt --version
dpkg --version | head -n 1
```

预期 `VERSION_ID` 为 `26.04`，APT 与 dpkg 均能输出版本。其他发行版或 Ubuntu 版本可以使用相似命令，但源文件位置、默认仓库和候选版本不能直接套用本文结论。

### 2. 目标包基线

查询 `hello` 的仓库候选版本与本机状态：

```bash
apt-cache policy hello
dpkg-query -W -f='${db:Status-Abbrev} ${Version} ${binary:Package}\n' hello
command -v hello
```

在全新实验机上，`apt-cache policy` 应显示候选版本而 `Installed` 为 `(none)`；后两条查询预期返回非零。Ubuntu 26.04 软件包目录记录了 `hello`，但实际候选版本仍以当前索引为准。

::: danger 不删除预先存在的软件
如果 `hello` 已经安装，停止本实验并恢复干净快照，或者选择另一个已确认归属的测试包。不能为了得到“未安装”基线而删除他人安装的软件。
:::

### 3. 挂起变更

检查 dpkg 是否存在未完成配置：

```bash
sudo dpkg --audit
apt-get check
```

正常状态下两条命令不应报告待配置或依赖损坏。存在异常时应先分析上一次包操作，不把新的安装叠加到未知状态。

## 三、索引刷新

刷新索引需要访问软件源，但不会自动安装候选更新。它改变的是主机对“仓库当前提供什么”的认识。

### 1. 刷新操作

```bash
sudo apt update
```

预期输出包含各软件源的获取或命中状态，并在结尾汇总可升级包数量。任何仓库签名、发行套件或网络错误都需要处理，不能只看到部分 `Hit` 就认为索引完整。

### 2. 候选版本

刷新后再次查询测试包：

```bash
apt-cache policy hello
```

重点观察 `Installed`、`Candidate` 和版本表中的来源地址。`Candidate` 是当前策略选择的安装候选，不表示该版本已经安装。

### 3. 源配置边界

软件源错误通常表现为名称解析失败、连接超时、签名验证失败或发行套件不存在。处理顺序是检查主机时间与网络、核对源 URI 和发行版代号、确认签名配置，再重新刷新。

不要使用忽略签名校验的参数消除错误，也不要从搜索结果复制第三方密钥命令。第三方仓库接入需要独立评估供应链、版本兼容和退出方案。

## 四、安装评估

真实安装前先进行模拟。模拟不写入软件包状态，但会展示 APT 计算出的新增、升级、删除和配置动作。

### 1. 安装模拟

```bash
apt-get --simulate install hello
```

预期输出的摘要包含 `hello`，并列出 `Inst`、`Conf` 或同等动作。实际依赖数量以当前主机为准。

### 2. 影响范围

模拟结果需要逐项检查：

- 是否只新增预期软件包和必要依赖；
- 是否提出删除现有包；
- 是否替换关键库或切换软件源；
- 是否存在 held back、冲突或未配置状态；
- 下载量和新增磁盘占用是否符合变更窗口。

出现意外删除或大量核心包升级时，停止安装并调查软件源、包版本和依赖关系。

### 3. 模拟边界

模拟证明依赖求解能够形成计划，不证明下载一定成功，也不证明安装脚本、服务启动或应用功能正常。真实变更仍需要安装后的状态和功能验证。

::: warning 模拟输出不是变更结果
只有实际执行后的 dpkg 状态、命令路径、程序输出和服务状态能够证明安装完成。下载失败、磁盘不足、维护脚本报错或服务启动失败都可能让真实结果偏离模拟计划。
:::

## 五、安装验证

确认模拟范围后，在隔离虚拟机中执行交互式安装。APT 会再次展示计划并请求确认。

### 1. 软件安装

```bash
sudo apt install hello
```

预期只安装 `hello` 及当前环境必要依赖。执行前再次阅读摘要；计划与模拟结果明显不同时，应取消并重新检查索引和并发包操作。

### 2. 状态核对

```bash
dpkg-query -W -f='${Status}\n${Version}\n${binary:Package}\n' hello
apt-cache policy hello
```

第一条预期包含 `install ok installed`，版本应与 `apt-cache policy` 的 `Installed` 一致。候选版本可以与已安装版本相同，也可能因后续更新而更高。

### 3. 程序验证

```bash
command -v hello
hello
dpkg-query -S /usr/bin/hello
```

预期路径为 `/usr/bin/hello`，程序输出 `Hello, world!`，最后一条证明该文件由 `hello` 包提供。三项证据分别验证命令可发现、程序可运行和文件归属，不能互相替代。

## 六、更新边界

软件包更新可能修改共享库、服务和配置。查看更新不等于允许立即更新整台主机。

### 1. 可升级包

```bash
apt list --upgradable
```

列表只反映当前索引与已安装状态的差异。Ubuntu 的分阶段更新可能暂时保留普通更新；安全更新不采用分阶段发布。不能为了消除 held back 提示而默认绕过分阶段策略。

### 2. 升级模拟

```bash
apt-get --simulate upgrade
```

检查升级、保留和删除摘要，特别关注内核、systemd、网络、SSH 与业务服务依赖。本文只做模拟，不执行全系统 `apt upgrade`。

### 3. 维护决策

生产更新至少需要明确：受影响软件、服务重启需求、维护窗口、健康检查、回退方式和更新后验证。发行版升级是独立迁移，不属于常规软件包更新。

::: tip 交互命令与自动化命令分开
Ubuntu 官方文档将 `apt` 定位为交互式命令；非交互脚本应使用稳定接口 `apt-get` 并显式处理退出状态。自动化不能通过默认回答“是”跳过变更评审。
:::

## 七、删除与回退

删除前同样需要模拟和归属确认。`remove`、`purge` 与 `autoremove` 的影响不同。

### 1. 删除模拟

```bash
apt-get --simulate remove hello
```

结果应只移除本篇安装的测试包。出现其他包删除时，停止操作并检查依赖关系。

### 2. 软件删除

```bash
sudo apt remove hello
command -v hello
dpkg-query -W hello
```

删除成功后，后两条查询预期返回非零。`apt remove` 可以保留包的系统级配置；`--purge` 会一并删除受包管理的配置，不能把两者视为同义操作。

### 3. 依赖清理

```bash
apt-get --simulate autoremove
```

`autoremove` 会处理被标记为自动安装且不再需要的包。即使是模拟输出，也要逐项核对；本文不执行真实自动清理，避免删除实验机其他任务仍需要的依赖。

## 八、异常处理

包管理失败时先保留错误输出和当前状态，不通过删除锁文件或关闭校验继续操作。

### 1. 锁占用

`Could not get lock` 表示另一个 APT 或 dpkg 进程正在修改状态。检查进程和自动更新任务：

```bash
ps -ef | grep -E '[a]pt|[d]pkg'
systemctl list-timers --all 'apt-daily*'
```

确认合法任务后等待其结束；异常中断则根据日志和 dpkg 状态恢复。直接删除 `/var/lib/dpkg/lock*` 不能修复正在进行的事务，反而可能造成并发写入。

### 2. 软件源不可用

先记录失败 URI 与错误类型，再检查时间、DNS、路由、代理和源配置。只有部分源成功时，索引仍可能不完整；修复后重新执行 `apt update` 并确认无错误。

| 错误证据 | 优先检查 | 恢复标准 |
|----------|----------|----------|
| `Temporary failure resolving` | DNS 配置与解析结果 | 仓库域名能够解析 |
| `Connection timed out` | 路由、防火墙和代理 | 对目标仓库的连接恢复 |
| `Release file` 或签名错误 | 系统时间、发行版代号和源配置 | `apt update` 不再报告该源错误 |

### 3. 依赖异常

```bash
sudo dpkg --audit
apt-get check
```

两条命令用于识别未配置包和依赖问题，不会自动证明修复方案安全。根据具体包、上一次操作和日志制定恢复动作，不在未知状态下反复执行安装。

本文完成的闭环是：确认来源与基线、刷新索引、模拟变更、安装并验证、评估更新、删除测试包。它不授权第三方仓库接入、全系统升级或发行版迁移。

官方依据：[Ubuntu Server 软件包管理](https://ubuntu.com/server/docs/how-to/software/package-management/)、[APT 分阶段更新说明](https://documentation.ubuntu.com/server/explanation/software/about-apt-upgrade-and-phased-updates/index.html)与 [Ubuntu 26.04 `hello` 软件包记录](https://packages.ubuntu.com/resolute/hello)。
