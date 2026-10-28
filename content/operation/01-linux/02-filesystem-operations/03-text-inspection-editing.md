---
title: "文本查看与编辑"
tags:
  - Linux
  - 文本查看
  - 文本编辑
excerpt: "在隔离副本上查看、检索和编辑配置文本，并使用 diff 与退出状态复核修改和执行回退。"
date: 2026-09-24
---

# 文本查看与编辑

配置文件和日志通常以纯文本保存，但“能够打开”不等于“能够安全修改”。查看操作需要根据文件大小选择工具，检索结果需要结合退出状态判断，编辑操作必须保留原始副本并复核差异。

本文只修改 `/srv/ops-lab/text/service.conf`。示例使用 `cat`、`less`、`head`、`tail`、`grep`、终端编辑器和 `diff`，不操作真实 `/etc` 配置，也不展开正则表达式与批量文本处理语言。

::: info 验证范围
命令行为依据 [GNU Coreutils 手册](https://www.gnu.org/software/coreutils/manual/coreutils.html)、[GNU grep 手册](https://www.gnu.org/software/grep/manual/)、[GNU Diffutils 手册](https://www.gnu.org/software/diffutils/manual/)及对应 [Ubuntu 26.04 手册页](https://manpages.ubuntu.com/)核对。当前环境没有 Ubuntu 实验机，交互界面和输出标记为预期结果。
:::

## 一、测试文本与副本

所有查看和修改都围绕同一份五行配置展开。原始副本在编辑前创建，用于产生差异证据和恢复初始状态。

### 1. 文件内容

以 `operator` 登录实验机，创建受控目录与配置文件：

```bash
sudo install -d -o operator -g operator /srv/ops-lab
install -d /srv/ops-lab/text
cd /srv/ops-lab/text
printf '%s\n' 'service=inventory' 'listen=8080' 'mode=staging' 'log_level=info' 'owner=operations' > service.conf
```

先确认路径、对象类型和行数：

```bash
pwd
file -- service.conf
wc -l -- service.conf
```

预期工作目录为 `/srv/ops-lab/text`，文件类型包含文本描述，行数为 `5`。`file` 只能根据内容特征给出类型判断，不能证明配置语法正确。

### 2. 原始副本

编辑前创建独立副本，并确认两个文件内容相同：

```bash
cp -- service.conf service.conf.bak
diff -- service.conf.bak service.conf
echo $?
```

`diff` 没有输出且退出状态为 `0`，表示当前内容相同。备份与原文件位于同一磁盘，只能支持本篇回退，不能替代跨设备备份。

::: danger 不直接练习系统配置
错误修改 `/etc` 下的网络、认证或服务配置可能导致主机失联或服务无法启动。先在独立副本上完成查看、编辑、差异检查与恢复，再进入具体产品的配置流程。
:::

## 二、完整内容查看

小文件可以一次输出，长文件应使用分页器。选择工具的依据是文件规模和阅读目标，而不是固定偏好。

### 1. cat 输出

`cat` 把完整内容写到标准输出。使用 `-n` 可以显示行号：

```bash
cat -n -- service.conf
```

预期输出为：

```text
     1  service=inventory
     2  listen=8080
     3  mode=staging
     4  log_level=info
     5  owner=operations
```

`cat` 适合能够在一个屏幕内看完的小文件。对数万行日志使用 `cat` 会让目标内容快速滚出屏幕，也会向终端发送大量无关数据。

### 2. less 分页

`less` 是分页器，只读取和显示内容，不直接编辑文件：

```bash
less -N -- service.conf
```

分页界面的常用按键如下：

| 按键 | 动作 |
|------|------|
| `Space` | 向下翻页 |
| `b` | 向上翻页 |
| `/mode` | 向后搜索 `mode` |
| `n` | 跳到下一个匹配 |
| `g` / `G` | 文件开头 / 文件末尾 |
| `q` | 退出分页器 |

`less` 到达文件末尾后默认仍保持打开，需要按 `q` 返回 Shell。`Ctrl+C` 通常只中止当前搜索或跟踪动作，不是退出分页器的首选方式。

## 三、局部内容查看

排查配置或日志时，通常只需要文件开头、末尾或固定范围。局部查看可以减少无关输出，并保留明确的观察窗口。

### 1. 文件开头

`head` 默认输出前 10 行，`-n` 指定行数：

```bash
head -n 2 -- service.conf
```

预期输出为：

```text
service=inventory
listen=8080
```

文件不足指定行数时，`head` 输出实际存在的全部行，不会补齐空行。

### 2. 文件末尾

`tail` 查看文件末尾：

```bash
tail -n 2 -- service.conf
```

预期输出为：

```text
log_level=info
owner=operations
```

对持续写入的日志，`tail -f` 可以跟踪后续新增内容，并使用 `Ctrl+C` 返回 Shell。跟踪只证明文件出现新行，不证明产生日志的服务状态正常。

## 四、固定字符串检索

`grep` 根据模式选择文本行。本篇使用 `-F` 把模式按固定字符串处理，避免把配置中的符号误解释为正则语法。

### 1. 匹配位置

查找 `mode=` 所在行并显示行号：

```bash
grep -F -n -- 'mode=' service.conf
```

预期输出为：

```text
3:mode=staging
```

`-F` 表示固定字符串，`-n` 添加行号，`--` 结束选项解析。需要忽略英文大小写时可以增加 `-i`，但配置键是否区分大小写应以目标程序语义为准。

### 2. 上下文行

`-C 1` 同时显示匹配行前后各一行：

```bash
grep -F -n -C 1 -- 'mode=' service.conf
```

预期输出为：

```text
2-listen=8080
3:mode=staging
4-log_level=info
```

冒号标识匹配行，连字符标识上下文行。上下文用于理解相邻配置，不会改变文件内容。

### 3. 检索状态

`grep` 没有输出可能表示“没有匹配”，也可能表示读取失败。执行后立即检查退出状态：

```bash
grep -F -- 'mode=production' service.conf
echo $?
```

预期没有匹配文本，退出状态为 `1`。GNU `grep` 的通用状态如下：

| 状态 | 含义 | 处理方式 |
|------|------|----------|
| `0` | 至少选择一行 | 检查匹配内容是否符合目标 |
| `1` | 没有选择任何行 | 判断“无匹配”是否为允许结果 |
| `2` | 发生读取或参数错误 | 保留错误信息并修正原因 |

“无匹配”是有效查询结果，不应统一当作工具故障；自动化脚本必须根据业务目标决定状态 `1` 是否需要报错。

## 五、终端文本编辑

编辑器负责修改缓冲区并保存文件，但不会替代配置语法检查。本文只把 `mode=staging` 修改为 `mode=production`，不改动其他行。

### 1. 编辑器确认

先确认实验机已有的终端编辑器：

```bash
command -v nano
command -v vi
```

命令输出绝对路径表示对应编辑器可用。Ubuntu 环境通常至少提供一个终端编辑器；如果两条命令都没有输出，应停止编辑并核对安装基线，不要临时下载来源不明的二进制文件。

### 2. nano 编辑

存在 `nano` 时，打开测试副本：

```bash
nano service.conf
```

在 Nano 中按以下顺序操作：

1. 按 `Ctrl+W`，输入 `mode=staging` 并按 `Enter`；
2. 将 `staging` 修改为 `production`；
3. 按 `Ctrl+O` 写入文件，再按 `Enter` 确认文件名；
4. 按 `Ctrl+X` 退出编辑器。

Nano 底部的 `^` 表示 `Ctrl` 键。保存前应确认当前文件名仍是 `/srv/ops-lab/text/service.conf`。

### 3. vi 编辑

只有 `vi` 可用时，可以完成同一项最小修改：

1. 执行 `vi service.conf`；
2. 输入 `/mode=staging` 并按 `Enter` 定位目标；
3. 将光标移到 `staging` 开头，输入 `cwproduction`；
4. 按 `Esc` 返回普通模式；
5. 输入 `:wq` 并按 `Enter` 保存退出。

需要放弃未保存修改时，按 `Esc` 后输入 `:q!`。该命令只放弃当前编辑缓冲区，不会恢复编辑前已经保存到磁盘的内容。

## 六、差异复核与回退

保存文件后，必须核对实际差异。只重新打开文件不能快速证明是否误改了其他行，统一差异格式可以同时显示删除行和新增行。

### 1. 修改结果

先验证旧值消失、新值出现：

```bash
grep -F -n -- 'mode=staging' service.conf
grep -F -n -- 'mode=production' service.conf
```

第一条命令应无输出并返回 `1`，第二条命令应输出：

```text
3:mode=production
```

这组对照证明目标键已经修改，但还不能证明其他行保持不变。

### 2. 统一差异

使用 `diff -u` 比较备份与当前文件：

```bash
diff -u -- service.conf.bak service.conf
echo $?
```

差异主体应只包含以下两行变化，文件头中的时间戳会随环境变化：

```diff
-mode=staging
+mode=production
```

此时退出状态应为 `1`。对 `diff` 而言，`0` 表示文件相同，`1` 表示发现差异，`2` 表示读取或调用错误；状态 `1` 是本次验证的预期结果，不是工具执行失败。

### 3. 原始内容恢复

确认差异仅包含目标修改后，用备份覆盖测试文件并再次比较：

```bash
cp -- service.conf.bak service.conf
diff -- service.conf.bak service.conf
echo $?
```

`diff` 应无输出，退出状态为 `0`。随后确认原值已经恢复：

```bash
grep -F -n -- 'mode=staging' service.conf
```

预期输出为 `3:mode=staging`。恢复动作只适用于这个隔离副本；真实服务配置恢复后还需要执行产品自身的语法检查、重载和健康验证。

## 七、异常边界

查看或编辑失败时，应先保护原文件并判断失败类型。提高权限、改变编码或强制保存都可能扩大影响。

### 1. 权限拒绝

出现 `Permission denied` 时，先执行 `ls -l -- 文件路径` 核对对象与当前身份。不要直接用 `sudo` 启动编辑器，因为这可能创建 root 所有的临时文件或绕过原有权限边界。

正确处理取决于文件责任：实验文件应修正实验目录所有权；系统配置应通过对应变更流程取得最小授权；无权管理的文件只保留诊断信息并停止修改。

### 2. 编码与二进制内容

终端出现乱码、控制字符或 `grep` 报告二进制匹配时，不要保存覆盖。先使用 `file -- 文件路径` 取得内容类型提示，并确认目标程序要求的编码。

`file` 的判断基于特征，不保证检测结论绝对正确。未知编码转换应在副本上进行，并通过目标程序或可靠解析器验证结果。

### 3. 实验目录清理

完成恢复验证后，列出并删除本篇创建的目录：

```bash
cd /srv/ops-lab
realpath -- text
find text -mindepth 1 -maxdepth 1 -print
rm -r -- text
test ! -e text && echo cleaned
```

只有规范化路径为 `/srv/ops-lab/text`，且列表只包含 `service.conf` 与 `service.conf.bak` 时才执行删除。预期最终输出为 `cleaned`。

本文的证据链证明了测试文本可以被查看、检索、最小修改、比较和恢复。它不证明任意配置都可以直接保存上线；具体服务仍需要自己的语法验证、变更窗口和回退条件。
