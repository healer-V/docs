---
title: "4.1 Vim 文本编辑器"
category: "运维 · Linux"
tags:
  - Linux
excerpt: "在没有图形界面的服务器上，Vim 几乎是唯一内置的强大编辑器。掌握 Vim 的基本操作是 Linux 运维的必备技能。 很多人第一次用 Vim 连怎么退出都不知道。这很正常。本章从最实用的操作开始讲。 Vim 的设计哲学是通过模式切换来分离..."
---

# 4.1 Vim 文本编辑器

## 为什么要学 Vim？

在没有图形界面的服务器上，Vim 几乎是唯一内置的强大编辑器。掌握 Vim 的基本操作是 Linux 运维的必备技能。

::: tip
很多人第一次用 Vim 连怎么退出都不知道。这很正常。本章从最实用的操作开始讲。
:::

---

## Vim 的三种模式

Vim 的设计哲学是通过**模式切换**来分离"输入内容"和"执行命令"这两种操作，理解模式是学习 Vim 的关键。

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   Normal（普通模式）                                  │
│   ← 默认模式，用于导航和执行命令                        │
│   ↑ Esc     ↓ i/a/o 等                              │
│                                                      │
│   Insert（插入模式）                                   │
│   ← 在此模式下输入文本                                 │
│                                                      │
│   Visual（可视模式）                                   │
│   ← 在此模式下选择文本                                 │
│   ← 在 Normal 模式下按 v 进入                         │
│                                                      │
│   Command（命令行模式）                                │
│   ← 用于保存、退出、查找替换等                          │
│   ← 在 Normal 模式下按 : 进入                         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**记住：按 `Esc` 总能回到 Normal 模式。迷失时按 `Esc`。**

---

## 最先要掌握的操作

### 打开和退出

```bash
# 打开文件
$ vim filename.txt

# 打开并跳到第 100 行
$ vim +100 filename.txt

# 打开并搜索关键词
$ vim +/keyword filename.txt
```

**退出（在 Normal 模式下）：**

| 命令 | 说明 |
|------|------|
| `:q` | 退出（文件未修改时） |
| `:q!` | 强制退出，丢弃所有修改 |
| `:w` | 保存文件 |
| `:wq` 或 `:x` | 保存并退出 |
| `ZZ` | 保存并退出（快捷键） |
| `ZQ` | 不保存退出（快捷键） |

---

## Normal 模式：移动光标

不要用方向键，用以下键位（手不离主键区，效率更高）：

### 基本移动

```
h ← 左
j ↓ 下
k ↑ 上
l → 右

0    行首（第一个字符）
^    行首（第一个非空字符）
$    行尾
gg   文件第一行
G    文件最后一行
50G  跳到第 50 行
:50  跳到第 50 行（命令行模式）
```

### 按词移动

```
w    下一个词的开头（Word）
e    当前词的结尾（End）
b    上一个词的开头（Back）

W / E / B  同上，但以空格为词的分隔符
```

### 按屏幕移动

```
Ctrl+f    向下翻一页（Forward）
Ctrl+b    向上翻一页（Back）
Ctrl+d    向下翻半页（Down）
Ctrl+u    向上翻半页（Up）

H    跳到屏幕顶部（High）
M    跳到屏幕中部（Middle）
L    跳到屏幕底部（Low）

zz   将当前行滚到屏幕中央
```

---

## 进入 Insert 模式

| 键 | 进入位置 |
|----|----------|
| `i` | 光标前（Insert） |
| `a` | 光标后（Append） |
| `I` | 行首 |
| `A` | 行尾 |
| `o` | 在当前行下方新建一行 |
| `O` | 在当前行上方新建一行 |
| `s` | 删除当前字符并进入插入模式 |
| `S` | 删除当前行并进入插入模式 |

---

## Normal 模式：编辑操作

### 删除

```
x    删除光标处的字符
X    删除光标前的字符
dd   删除当前行
D    删除从光标到行尾
dw   删除一个词
d$   删除到行尾（等同于 D）
d0   删除到行首

5dd  删除 5 行（数字前缀可用于大多数命令）
```

### 复制和粘贴

```
yy   复制当前行（Yank）
Y    复制当前行（同 yy）
yw   复制一个词
y$   复制到行尾

5yy  复制 5 行

p    粘贴到光标后（Paste）
P    粘贴到光标前

dd 然后 p  = 剪切并粘贴（移动行）
```

### 撤销和重做

```
u         撤销（Undo）
Ctrl+r    重做（Redo）
.         重复上一次操作（非常实用！）
```

### 修改

```
r    替换光标处的单个字符（不进入插入模式）
R    进入替换模式（输入内容会覆盖原有字符）
cw   删除一个词并进入插入模式（Change Word）
cc   删除整行并进入插入模式
C    删除到行尾并进入插入模式
```

---

## 搜索和替换

### 搜索

```bash
/keyword     向下搜索（Enter 确认）
?keyword     向上搜索
n            下一个匹配
N            上一个匹配
*            搜索光标所在的单词
#            反向搜索光标所在的单词

# 搜索时忽略大小写
:set ignorecase
:set ic      # 缩写
```

### 替换（命令行模式）

```bash
# 替换当前行第一个匹配
:s/old/new

# 替换当前行所有匹配
:s/old/new/g

# 替换所有行所有匹配（全局替换）
:%s/old/new/g

# 替换时逐个确认
:%s/old/new/gc

# 替换指定范围（第 10 到 20 行）
:10,20s/old/new/g

# 使用正则表达式
:%s/\bfoo\b/bar/g    # 只替换完整单词 foo
```

---

## Visual 模式：选择文本

```
v     字符选择（按字符）
V     行选择（按行）
Ctrl+v  列选择（块选择）
```

选择后可以：
- `d` 删除
- `y` 复制
- `c` 修改（删除并进入插入）
- `>` / `<` 缩进/取消缩进
- `:s/old/new/g` 只在选中范围内替换

**列选择（Ctrl+v）非常实用：**

```
Ctrl+v → 选择多行的某一列 → I → 输入内容 → Esc
→ 在多行同时添加相同内容（如添加注释 #）
```

---

## 命令行模式常用操作

```bash
# 保存
:w
:w newname.txt     # 另存为

# 读取另一个文件的内容插入到当前位置
:r otherfile.txt

# 执行 Shell 命令（不退出 Vim）
:!ls -la
:!date

# 将命令输出插入到文件
:r !date
:r !cat /etc/hosts

# 显示行号
:set number
:set nu       # 缩写
:set nonu     # 取消行号

# 显示相对行号
:set relativenumber

# 设置 Tab 宽度
:set tabstop=4
:set expandtab    # 用空格代替 Tab

# 语法高亮
:syntax on
:syntax off
```

---

## 多文件和分屏

```bash
# 打开多个文件
$ vim file1.txt file2.txt

# 在 Vim 中切换文件
:n     # 下一个文件
:prev  # 上一个文件
:ls    # 列出所有打开的文件（buffer）

# 分割窗口
:sp file2.txt     # 水平分割
:vsp file2.txt    # 垂直分割
Ctrl+w s          # 水平分割当前文件
Ctrl+w v          # 垂直分割当前文件

# 在分割窗口间移动
Ctrl+w h/j/k/l    # 方向移动
Ctrl+w w          # 轮流切换

# 关闭窗口
:q 或 Ctrl+w q
```

---

## 配置文件 ~/.vimrc

把常用配置写入 `~/.vimrc`，每次打开 Vim 自动生效：

```vim
" ~/.vimrc
" 显示行号
set number
set relativenumber

" 语法高亮
syntax on

" 缩进设置
set tabstop=4
set shiftwidth=4
set expandtab
set autoindent

" 搜索设置
set ignorecase    " 忽略大小写
set smartcase     " 如果包含大写则区分大小写
set hlsearch      " 高亮搜索结果
set incsearch     " 增量搜索

" 显示匹配括号
set showmatch

" 编码
set encoding=utf-8

" 鼠标支持
set mouse=a

" 颜色主题
colorscheme desert
```

---

## 速查表

```
[导航]
h j k l      左下上右
0 ^ $        行首/非空行首/行尾
gg G         文件头/尾
数字G        跳到第N行

[插入模式]
i a          光标前/后插入
o O          下方/上方新建行
I A          行首/行尾插入

[编辑]
x dd         删除字符/行
yy p         复制行/粘贴
u Ctrl+r     撤销/重做
. r          重复操作/替换字符

[搜索]
/word        向下搜索
n N          下一个/上一个

[命令]
:w :q :wq    保存/退出/保存退出
:q!          强制退出
:%s/a/b/g    全局替换
```
