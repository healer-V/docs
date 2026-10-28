---
title: "文件系统与路径"
tags:
  - Linux
  - Ubuntu
  - 文件系统
excerpt: "解释 Linux 目录树、工作目录、绝对与相对路径、路径规范化及文件对象类型，并通过只读命令建立可验证的路径定位与错误判断方法。"
date: 2026-09-24
---

# 文件系统与路径

Linux 将文件、目录、设备和内核接口组织在一棵从 `/` 开始的目录树中。程序使用**路径**定位树中的对象：以 `/` 开头的是绝对路径，从根目录开始解析；不以 `/` 开头的是相对路径，从进程的当前工作目录开始解析。

路径只负责定位对象，不决定对象类型。`/etc` 指向目录，`/etc/hostname` 通常指向普通文件，`/bin` 在现代 Ubuntu 中通常是符号链接，`/dev/null` 则是字符设备。判断路径时需要依次确认解析起点、路径组成、最终对象类型和错误位置。

::: info 示例环境与验证范围
命令面向 Ubuntu Server 26.04.1 LTS、64 位 x86 环境和普通用户 `operator`，只读取系统对象或改变当前 Shell 的工作目录。当前文档生成环境没有可复用的 Ubuntu 实验机，因此输出按照官方语义给出预期结构，不声明已经在目标系统实测；发布前应在对应镜像中复核目录、符号链接和本地化输出。
:::

执行示例前，应能按照[终端与命令帮助](../01-system-foundation/03-terminal-help.md)识别命令、参数、标准输出与退出状态。

## 一、Linux 目录树

目录树为路径提供统一的命名空间。数据可以来自系统盘、其他文件系统或内核生成的虚拟接口，但挂载完成后都通过同一棵树中的路径访问。

### 1. 根目录

根目录写作 `/`，是通常情况下绝对路径的解析起点。路径 `/etc/hostname` 表示先从 `/` 找到 `etc` 目录，再在其中找到 `hostname`。路径分隔符 `/` 用于分开相邻组成部分，不能作为普通文件名的一部分。

下面的简化目录树只用于说明层级关系，不代表 Ubuntu 根目录的完整内容：

```text
/
├── etc
│   └── hostname
├── home
│   └── operator
├── usr
└── var
```

根目录 `/` 与管理员账号 `root` 的家目录 `/root` 是两个不同对象。为了固定预期输出的语言，下面使用 `LC_ALL=C` 临时要求 `stat` 输出英文类型名称：

```bash
LC_ALL=C stat --format='%n : %F' / /root
```

两个路径都应指向目录：

```text
/ : directory
/root : directory
```

区别在于层级和职责：`/` 是整棵目录树的起点，`/root` 是根目录下名为 `root` 的子目录。路径解析不能越过根目录，因此 `/..` 仍然指向 `/`。Linux 的逐级解析规则可查阅 [`path_resolution(7)`](https://man7.org/linux/man-pages/man7/path_resolution.7.html)。

### 2. 顶层目录

顶层目录按照数据职责划分系统内容。Ubuntu 遵循 [Filesystem Hierarchy Standard](https://documentation.ubuntu.com/project/how-ubuntu-is-made/concepts/filesystem-hierarchy-standard/)（FHS，文件系统层次结构标准），但实际目录、符号链接和内容仍由发行版版本与已安装软件决定。

| 目录 | 主要职责 | 判断边界 |
|------|----------|----------|
| `/etc` | 当前主机的系统与服务配置 | 配置通常与主机相关，不存放普通程序二进制文件 |
| `/home`、`/root` | 普通用户与管理员的家目录 | 家目录位置来自账号配置，不等于当前工作目录 |
| `/usr` | 发行版提供的程序、库和共享数据 | 通常由软件包管理，不作为临时工作区 |
| `/var` | 日志、缓存、队列和应用状态等可变数据 | 内容会在系统运行期间持续变化 |
| `/run`、`/tmp` | 运行时状态与临时文件 | 生命周期和清理策略不同，不能存放唯一副本 |
| `/srv` | 当前主机对外提供的服务数据 | 是否使用及内部结构由服务约定决定 |
| `/dev` | 设备对象 | 路径存在不表示可以安全读写对应设备 |
| `/proc`、`/sys` | 进程、内核与设备的虚拟接口 | 外观类似文件树，内容由内核动态生成 |

[FHS 3.0](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index)还定义了 `/boot`、`/media`、`/mnt` 和 `/opt` 等目录的职责。FHS 是跨发行版的基础约定，不保证每台主机存在全部可选目录，也不替代当前系统的实际状态。

Ubuntu 24.04 LTS 起采用合并后的 `/usr` 布局，`/bin`、`/sbin` 和 `/lib` 通常是指向 `/usr` 中对应目录的符号链接。可以读取当前主机确认，而不能根据旧版目录图推断：

```bash
ls -ld /bin /sbin /lib
readlink /bin
```

在目标基线中，前三个条目的类型应为符号链接，`readlink /bin` 通常输出 `usr/bin`。具体时间、所有者和链接形式以主机结果为准；Ubuntu 的合并背景可参考 [Usrmerge implementation](https://documentation.ubuntu.com/rockcraft/1.19/explanation/usrmerge/)。

::: tip 单一目录树不等于单一磁盘
多个磁盘、网络存储和虚拟文件系统可以连接到目录树中的不同位置。路径描述对象在命名空间中的位置，不直接说明数据位于哪块设备；设备、文件系统与挂载点的关系由存储章节负责。
:::

## 二、工作目录与家目录

当前工作目录和用户家目录都可能出现在提示符中，但两者承担不同职责。当前工作目录决定相对路径从哪里开始；家目录是账号的默认个人目录，Bash 可以把 `~` 展开为该位置。

### 1. 当前工作目录

每个进程都有当前工作目录。Shell 启动命令时，子进程通常继承 Shell 的当前工作目录；`cd` 改变当前 Shell 的工作目录，`pwd` 输出当前位置的绝对路径。

下面依次进入用户家目录和 `/etc`，并在结束前回到用户家目录：

```bash
cd /home/operator
pwd
cd /etc
pwd
cd /home/operator
pwd
```

预期输出只来自三次 `pwd`；成功的 `cd` 通常没有文字输出：

```text
/home/operator
/etc
/home/operator
```

这组结果证明工作目录属于当前 Shell 会话的状态，而不是终端窗口显示出来的一段装饰文字。提示符可能缩短或隐藏路径，执行相对路径前应使用 `pwd` 取得真实起点。

### 2. 用户家目录

家目录由用户账号信息定义。Ubuntu 通常把普通用户 `operator` 的家目录设置为 `/home/operator`，管理员账号 `root` 的家目录通常是 `/root`；两者都不是目录树的根目录 `/`。

在 Bash 中，未引用的 `~` 会在命令执行前展开为当前用户的家目录。下面同时观察目录切换和展开结果：

```bash
cd ~
pwd
printf '%s\n' ~
printf '%s\n' '~'
```

普通用户 `operator` 的预期输出为：

```text
/home/operator
/home/operator
~
```

最后一行仍然是 `~`，因为单引号阻止了 Bash 的波浪号展开。这说明 `~` 不是内核路径解析规则，也不是目录树中的特殊名称，而是 Shell 在调用命令前执行的文本展开。完整规则见 [Bash Tilde Expansion](https://www.gnu.org/software/bash/manual/html_node/Tilde-Expansion.html)。

::: warning 家目录不能代替当前目录
用户登录后通常从家目录开始，但执行 `cd` 后当前工作目录会改变，家目录不会改变。相对路径始终以当前工作目录为起点，不能因为提示符出现 `~` 就假定后续命令仍在家目录执行。
:::

## 三、路径类型

路径由一个或多个名称组成，相邻名称使用 `/` 分隔。绝对路径与相对路径的差异只在解析起点；当两种写法最终指向同一个对象时，对该对象执行的读取结果应一致。

### 1. 绝对路径

绝对路径以 `/` 开头，从根目录逐级解析，不依赖当前工作目录。例如 `/etc/hostname` 的解析起点固定为 `/`，切换到 `/home/operator` 或 `/var` 都不会改变它的目标。

使用 `realpath -e` 要求路径中的所有组成部分真实存在，并输出规范化后的绝对路径；随后使用 `stat` 查看对象类型：

```bash
realpath -e /etc/hostname
LC_ALL=C stat --format='%n : %F' /etc/hostname
```

标准 Ubuntu 安装中的预期结果为：

```text
/etc/hostname
/etc/hostname : regular file
```

这组结果证明路径能够定位一个普通文件，但不证明当前用户可以修改它。对象的读取、写入和执行权限属于另外的判断维度。

### 2. 相对路径

相对路径不以 `/` 开头，从当前工作目录开始解析。`.` 表示当前目录，`..` 表示父目录；在根目录中继续使用 `..` 仍然停留在根目录。

下面从三个不同工作目录定位同一个 `/etc/hostname`：

```bash
cd /home/operator
realpath -e ../../etc/hostname
cd /var
realpath -e ../etc/hostname
cd /
realpath -e etc/hostname
```

三次 `realpath` 都应输出：

```text
/etc/hostname
/etc/hostname
/etc/hostname
```

每次输入的相对路径不同，是因为起点不同；最终结果相同，是因为三条路径经过规范化后都到达同一对象。绝对路径适合表达固定系统位置，相对路径适合在起点明确的工作目录中表达邻近对象。

如果当前目录是 `/home/operator`，相对路径 `etc/hostname` 会尝试定位 `/home/operator/etc/hostname`，而不是 `/etc/hostname`：

```bash
cd /home/operator
realpath -e etc/hostname
echo $?
```

当该路径不存在时，`realpath` 应报告 `No such file or directory`，退出状态为非零。这个失败首先说明相对路径没有解析到现有对象，不能据此判断 `/etc/hostname` 的权限。

### 3. 路径规范化

路径规范化将输入转换为没有多余 `/`、`.`、`..` 和未解析符号链接的绝对路径。GNU `realpath` 默认允许最后一个组成部分不存在，不同实现的默认行为也可能不同，因此本文显式使用 `-e`，要求所有组成部分存在。详细语义见 [GNU Coreutils `realpath`](https://www.gnu.org/software/coreutils/manual/html_node/realpath-invocation.html)。

下面两条写法包含不同的中间组成部分，但规范化结果相同：

```bash
realpath -e /etc/../etc/hostname
realpath -e /./etc/hostname
```

预期输出为：

```text
/etc/hostname
/etc/hostname
```

`realpath -e` 还会跟随符号链接，因此规范化结果可能与输入文本明显不同。例如在采用合并 `/usr` 布局的 Ubuntu 中，`realpath -e /bin` 通常输出 `/usr/bin`。

::: tip 规范路径只回答定位结果
规范化能够证明不同写法最终指向哪里，不能证明文件内容正确、权限满足业务要求或底层存储健康。完成定位后，还需要根据操作目标继续检查对象类型、权限或内容。
:::

## 四、文件对象类型

路径名是对象的入口，不是类型声明。Linux 在文件元数据中记录对象类型；文件扩展名可以帮助人类识别用途，却不能决定内核把对象视为普通文件、目录还是设备。

### 1. 普通文件与目录

普通文件保存字节数据，目录保存名称与文件对象之间的关联。`stat` 可以读取对象类型和其他元数据，`ls -ld` 的第一列首字符则用 `-` 表示普通文件、用 `d` 表示目录。

```bash
LC_ALL=C stat --format='%n : %F' /etc/hostname /etc
ls -ld /etc/hostname /etc
```

`stat` 的预期类型结果为：

```text
/etc/hostname : regular file
/etc : directory
```

`ls -ld` 用于查看这两个路径指向的对象本身。此处只观察第一列的首字符和行末路径；所有者、用户组与权限位由用户与权限章节完整解释。

### 2. 符号链接

符号链接是一种保存目标路径的特殊文件。访问链接时，大多数操作会继续解析其目标；检查链接本身时，则需要避免自动跟随。GNU `stat` 默认显示链接本身，增加 `-L` 后显示链接目标。

在 Ubuntu 26.04 的合并 `/usr` 布局中，可以对 `/bin` 比较两种结果：

```bash
LC_ALL=C stat --format='%n : %F' /bin
LC_ALL=C stat -L --format='%n : %F' /bin
readlink /bin
```

预期结构为：

```text
/bin : symbolic link
/bin : directory
usr/bin
```

第一行说明 `/bin` 这个目录项是符号链接，第二行说明链接最终指向目录，第三行显示链接中保存的目标文本。目标 `usr/bin` 是相对路径，应从符号链接所在的根目录 `/` 继续解析，因此最终位置是 `/usr/bin`。

符号链接目标可以不存在，这种状态称为悬空链接。路径解析遇到悬空链接时也可能报告 `No such file or directory`，不能只检查输入路径的最后一个名称。

### 3. 特殊文件

Linux 还使用路径表示设备和进程间通信端点。`inode(7)` 定义的主要文件类型包括普通文件、目录、符号链接、字符设备、块设备、套接字和 FIFO；完整类型说明见 [`inode(7)`](https://man7.org/linux/man-pages/man7/inode.7.html)。

| 类型 | `ls -l` 首字符 | 常见位置或用途 |
|------|----------------|----------------|
| 字符设备 | `c` | `/dev/null`、终端等字节流设备接口 |
| 块设备 | `b` | `/dev` 下的磁盘设备，实际名称取决于硬件与虚拟化环境 |
| 套接字 | `s` | 服务在本机创建的通信端点，路径随服务配置变化 |
| FIFO | `p` | 具有路径名称的管道，用于进程间传递字节流 |

`/proc` 和 `/sys` 是虚拟文件系统，其中的条目可能显示为普通文件或目录，但内容由内核动态生成，并不等同于磁盘上的普通数据文件。下面只读取类型，不读取设备内容：

```bash
LC_ALL=C stat --format='%n : %F' /dev/null /proc/version
```

预期类型为：

```text
/dev/null : character special file
/proc/version : regular file
```

::: warning 不要用读取内容测试未知对象
“可以通过路径访问”不表示对象适合使用文本工具读取。块设备、字符设备、套接字和 FIFO 具有各自的 I/O 语义；确认类型和用途之前，不要对未知特殊文件执行写入，也不要使用 `sudo` 绕过拒绝结果。
:::

## 五、路径解析错误

Linux 从解析起点开始，按照 `/` 分隔的组成部分逐级查找。错误文字反映解析在哪类条件下停止，但同一句错误可能由不同层级触发，因此需要保留当前目录、原始输入和对象类型作为证据。

### 1. 路径不存在

路径中的任意组成部分不存在时，系统会返回 `ENOENT`，常见文字是 `No such file or directory`。错误既可能来自最后一个名称拼写错误，也可能来自上级目录缺失或符号链接目标不存在。

下面故意把 `hostname` 拼写成 `hostnmae`，只读取一个不存在的路径：

```bash
cd /home/operator
ls -ld /etc/hostnmae
echo $?
```

关键结果应包含错误文字和非零退出状态：

```text
ls: cannot access '/etc/hostnmae': No such file or directory
2
```

这个结果只证明 `/etc/hostnmae` 没有解析到对象。定位时按以下顺序保留证据：

1. 相对路径先执行 `pwd`，确认解析起点；
2. 从左到右检查名称、大小写和 `/` 分隔位置；
3. 使用 `ls -ld` 查看最后一个已知存在的上级目录；
4. 使用 `realpath -e` 验证完整路径是否存在；
5. 路径包含符号链接时，使用 `readlink` 检查链接保存的目标。

如果中间组成部分存在但不是目录，继续向下解析还会得到 `Not a directory`。这与名称完全不存在是不同条件，不能统一改写路径或直接提权处理。

### 2. 权限不足

路径组成部分存在，但当前进程没有搜索某一级目录的权限时，系统会返回 `EACCES`，常见文字是 `Permission denied`。最终对象存在但当前操作不被允许，也可能出现相同文字。

| 错误文字 | 首要含义 | 优先证据 |
|----------|----------|----------|
| `No such file or directory` | 组成部分或链接目标不存在 | `pwd`、原始路径、`realpath -e`、`readlink` |
| `Not a directory` | 中间组成部分不是目录 | 逐级使用 `stat` 或 `ls -ld` 检查类型 |
| `Permission denied` | 目录搜索或目标操作权限不足 | 当前身份、上级目录权限、目标对象权限 |

权限错误出现后，应先记录执行身份并检查路径各级目录，不要立即添加 `sudo`。提权会改变证据和访问条件，可能把路径错误暂时隐藏为成功；完整的所有者、用户组、权限位和 `sudo` 边界由用户与权限章节负责。

::: tip 路径问题的判断顺序
先判断输入是绝对路径还是相对路径；相对路径再确认当前工作目录。路径存在时继续识别最终对象类型，路径失败时根据错误文字检查缺失组成部分、非目录对象或搜索权限。这个顺序能够把“找不到路径”和“无权访问”分成不同证据链。
:::

从三个工作目录执行的 `realpath -e` 结果已经证明，不同相对路径可以定位同一个文件；`stat` 与链接示例进一步证明，相同的路径形式可以指向不同类型的对象。这些只读证据足以判断目录树中的位置与类型，但不覆盖挂载关系、权限配置和文件修改操作。
