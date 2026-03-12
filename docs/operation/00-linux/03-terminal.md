# 1.3 初识 Shell 与终端

## 终端、Shell、命令行的区别

这三个词经常混用，但含义不同：

```
┌────────────────────────────────────────┐
│  终端（Terminal Emulator）              │  ← 你看到的窗口，负责显示和输入
│  ┌──────────────────────────────────┐  │
│  │  Shell（如 bash、zsh）           │  │  ← 解释你输入的命令
│  │  ┌────────────────────────────┐  │  │
│  │  │  命令行程序（ls、git 等）   │  │  │  ← 实际执行的程序
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

- **终端（Terminal）**：图形界面程序，负责接收键盘输入、显示输出内容
- **Shell**：命令解释器，读取你输入的文本，解析并执行对应程序
- **命令行（CLI）**：以文本方式与程序交互的方式

---

## 认识提示符（Prompt）

打开终端后，你会看到类似这样的提示符：

```
john@ubuntu:~$
```

各部分含义：

```
john     @    ubuntu    :    ~      $
 ↑            ↑             ↑      ↑
用户名    主机名          当前目录  普通用户
                                   （root 用户为 #）
```

- `~` 是 home 目录的缩写，等价于 `/home/john`
- `$` 表示当前是普通用户；`#` 表示 root 用户

---

## 第一批必会命令

### 基本导航

```bash
# 显示当前所在目录（Print Working Directory）
$ pwd
/home/john

# 切换目录（Change Directory）
$ cd /etc          # 进入 /etc 目录
$ cd ~             # 回到 home 目录
$ cd ..            # 返回上一级目录
$ cd -             # 返回上一次所在目录（非常实用！）
$ cd               # 不加参数，等同于 cd ~

# 列出目录内容（List）
$ ls               # 普通列表
$ ls -l            # 详细信息（权限、大小、时间）
$ ls -a            # 包含隐藏文件（以 . 开头的文件）
$ ls -la           # 组合使用
$ ls -lh           # 以人类可读格式显示文件大小（KB、MB）
$ ls /etc          # 列出指定目录
```

`ls -l` 的输出解读：

```
drwxr-xr-x  2 john john 4096 Jan 10 09:30 Documents
-rw-r--r--  1 john john 1234 Jan 10 09:30 readme.txt
↑           ↑ ↑    ↑    ↑    ↑             ↑
文件类型      链接数 所有者 组  大小  修改时间   文件名
和权限
```

### 查看文件内容

```bash
# 输出整个文件内容
$ cat /etc/hostname
ubuntu

# 分页查看（大文件推荐，按 q 退出）
$ less /var/log/syslog

# 只看前 N 行
$ head -20 /var/log/syslog     # 前 20 行
$ head /var/log/syslog         # 默认前 10 行

# 只看后 N 行
$ tail -20 /var/log/syslog     # 后 20 行
$ tail -f /var/log/syslog      # 实时追踪新增内容（看日志神器！）
```

---

## 命令的基本语法

```
命令名  [选项]  [参数]

  ls    -la    /etc
```

**选项（Options）**的两种写法：
- 短格式：`-l`（单个字母，可以合并：`-la`）
- 长格式：`--long`、`--all`（更易读）

```bash
# 以下三种等价
$ ls -la
$ ls -l -a
$ ls --all -l
```

**获取命令帮助：**

```bash
# 查看简要帮助
$ ls --help

# 查看完整手册（按 q 退出，/ 搜索）
$ man ls

# 快速查看命令说明（需安装 tldr）
$ tldr ls
```

---

## Shell 的实用特性

### Tab 自动补全

输入命令或路径的前几个字符，按 `Tab` 键自动补全：

```bash
$ cd /et<Tab>       → cd /etc/
$ cat /etc/host<Tab> → cat /etc/hostname
```

按两次 `Tab` 显示所有可能的补全选项。

### 历史命令

```bash
# 查看历史命令
$ history
  996 ls -la
  997 cd /etc
  998 cat hostname

# 执行历史中的第 996 条
$ !996

# 执行上一条命令
$ !!

# 搜索历史命令（Ctrl + R，然后输入关键词）
# 按多次 Ctrl + R 向前搜索
```

### 通配符

```bash
# * 匹配任意字符
$ ls *.log         # 所有 .log 文件
$ ls /etc/nginx/*  # nginx 目录下所有文件

# ? 匹配单个字符
$ ls file?.txt     # 匹配 file1.txt、fileA.txt，但不匹配 file10.txt

# [abc] 匹配括号内的字符
$ ls file[123].txt # 匹配 file1.txt、file2.txt、file3.txt
```

### 管道与重定向

```bash
# 管道：将前一个命令的输出传给后一个命令
$ ls -la | grep ".log"    # 只显示 .log 文件

# 重定向输出到文件（覆盖）
$ echo "hello" > output.txt

# 追加到文件（不覆盖）
$ echo "world" >> output.txt

# 将错误信息重定向
$ ls /nonexist 2> error.log

# 同时重定向正常输出和错误
$ ls /nonexist > all.log 2>&1
```

---

## 常用快捷键

| 快捷键 | 作用 |
|--------|------|
| `Ctrl + C` | 中断当前命令 |
| `Ctrl + Z` | 将进程放到后台（暂停） |
| `Ctrl + D` | 退出当前 Shell（等同于 exit） |
| `Ctrl + L` | 清屏（等同于 clear 命令） |
| `Ctrl + A` | 光标移到行首 |
| `Ctrl + E` | 光标移到行尾 |
| `Ctrl + U` | 删除光标前的所有内容 |
| `Ctrl + K` | 删除光标后的所有内容 |
| `Ctrl + R` | 搜索历史命令 |
| `↑ / ↓` | 切换历史命令 |

---

## 查看系统基本信息

```bash
# 系统内核信息
$ uname -r          # 内核版本
$ uname -a          # 完整信息

# 发行版信息
$ cat /etc/os-release

# 系统已运行时间和负载
$ uptime
10:30:01 up 5 days,  2:10,  2 users,  load average: 0.15, 0.10, 0.08

# 当前登录用户
$ who
$ w

# 日期和时间
$ date
$ date "+%Y-%m-%d %H:%M:%S"   # 格式化输出：2024-01-10 10:30:01
```
