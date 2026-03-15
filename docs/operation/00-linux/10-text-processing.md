---
title: "4.2 文本处理三剑客：grep / sed / awk"
category: "运维 · Linux"
tags:
  - Linux
excerpt: "服务器运维中，大量工作是分析日志、处理配置文件、提取数据。grep、sed、awk 是完成这类工作的核心工具，熟练掌握后效率会大幅提升。 grep 用于在文件中搜索匹配的行，是最常用的文本工具之一。 sed（Stream Editor）逐行..."
---

# 4.2 文本处理三剑客：grep / sed / awk

服务器运维中，大量工作是分析日志、处理配置文件、提取数据。`grep`、`sed`、`awk` 是完成这类工作的核心工具，熟练掌握后效率会大幅提升。

---

## grep：搜索文本内容

`grep` 用于在文件中**搜索匹配的行**，是最常用的文本工具之一。

### 基本用法

```bash
# 在文件中搜索
$ grep "error" /var/log/syslog

# 搜索多个文件
$ grep "error" /var/log/*.log

# 递归搜索目录
$ grep -r "TODO" ./src/

# 忽略大小写（-i）
$ grep -i "error" /var/log/syslog

# 显示行号（-n）
$ grep -n "error" /var/log/syslog
45:Jan 10 error occurred in module
123:Jan 11 critical error detected

# 只显示匹配的文件名（-l）
$ grep -l "nginx" /etc/nginx/*.conf

# 显示不匹配的行（-v，invert）
$ grep -v "^#" /etc/nginx/nginx.conf    # 过滤掉注释行
$ grep -v "^$" config.txt               # 过滤掉空行
```

### 控制输出范围

```bash
# 显示匹配行及其后 N 行（-A，After）
$ grep -A 3 "ERROR" app.log
# 找到 ERROR 的行，并显示后 3 行（查看错误上下文）

# 显示匹配行及其前 N 行（-B，Before）
$ grep -B 3 "ERROR" app.log

# 显示匹配行前后各 N 行（-C，Context）
$ grep -C 5 "Exception" app.log
```

### 正则表达式

```bash
# 基本正则（grep 默认）
$ grep "^error" file      # 以 error 开头的行
$ grep "error$" file      # 以 error 结尾的行
$ grep "err.r" file       # . 匹配任意字符
$ grep "err*" file        # * 匹配前一字符零次或多次

# 扩展正则（grep -E 或 egrep）
$ grep -E "error|warning" /var/log/syslog    # 匹配 error 或 warning
$ grep -E "[0-9]{3}" file                     # 匹配三位数字
$ grep -E "^(WARN|ERROR):" app.log           # 匹配以 WARN 或 ERROR 开头

# Perl 正则（grep -P）
$ grep -P "\d{4}-\d{2}-\d{2}" log            # 匹配日期格式
```

### 实用场景

```bash
# 统计匹配行数（-c）
$ grep -c "ERROR" /var/log/app.log
42

# 查看 nginx 访问日志中的 5xx 错误
$ grep -E " 5[0-9]{2} " /var/log/nginx/access.log

# 查找 SSH 爆破记录
$ grep "Failed password" /var/log/auth.log | grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" | sort | uniq -c | sort -rn | head

# 在代码中查找函数定义
$ grep -rn "function login" ./src/ --include="*.js"

# 过滤进程列表
$ ps aux | grep nginx | grep -v grep
```

---

## sed：流编辑器

`sed`（Stream Editor）逐行处理文本，适合**批量替换**和**自动化编辑**。

### 基本语法

```
sed [选项] '命令' 文件
```

默认情况下 `sed` 不修改原文件，只是输出处理结果。

### 替换：s 命令（最常用）

```bash
# 格式：s/查找/替换/[标志]
# 替换每行的第一个匹配
$ sed 's/foo/bar/' file.txt

# 替换每行所有匹配（g 标志，global）
$ sed 's/foo/bar/g' file.txt

# 忽略大小写（i 标志）
$ sed 's/foo/bar/gi' file.txt

# 替换第 2 个匹配（数字标志）
$ sed 's/foo/bar/2' file.txt

# 直接修改原文件（-i 选项）⚠️ 操作不可逆
$ sed -i 's/foo/bar/g' file.txt

# 修改原文件并备份（-i.bak 在修改前备份为 .bak）
$ sed -i.bak 's/foo/bar/g' file.txt

# 使用不同的分隔符（当内容含有 / 时）
$ sed 's|/old/path|/new/path|g' file.txt
$ sed 's#http://old#http://new#g' file.txt
```

### 行操作

```bash
# 删除行（d 命令）
$ sed '5d' file.txt              # 删除第 5 行
$ sed '5,10d' file.txt           # 删除第 5 到 10 行
$ sed '/^#/d' file.txt           # 删除以 # 开头的行（注释行）
$ sed '/^$/d' file.txt           # 删除空行

# 打印指定行（-n 和 p 命令组合，-n 禁止默认输出）
$ sed -n '5p' file.txt           # 只打印第 5 行
$ sed -n '5,10p' file.txt        # 打印第 5 到 10 行
$ sed -n '/error/p' file.txt     # 打印含 error 的行

# 在指定行后插入（a 命令，append）
$ sed '5a\新插入的行' file.txt

# 在指定行前插入（i 命令，insert）
$ sed '5i\新插入的行' file.txt

# 替换整行（c 命令，change）
$ sed '5c\整行替换的内容' file.txt
```

### 多命令执行

```bash
# 用 -e 执行多个命令
$ sed -e 's/foo/bar/g' -e 's/baz/qux/g' file.txt

# 用分号分隔（某些系统）
$ sed 's/foo/bar/g; s/baz/qux/g' file.txt
```

### 实战场景

```bash
# 批量修改配置文件中的 IP 地址
$ sed -i 's/192\.168\.1\.100/10\.0\.0\.1/g' config.txt

# 删除文件中的注释行和空行
$ sed -e '/^#/d' -e '/^$/d' nginx.conf

# 提取文件的第 10 到 20 行
$ sed -n '10,20p' bigfile.log > extract.log

# 在每行开头添加序号（结合行号变量）
$ sed = file.txt | sed 'N;s/\n/\t/'

# 修改 nginx 配置中的端口号
$ sed -i 's/listen 80;/listen 8080;/g' /etc/nginx/nginx.conf
```

---

## awk：文本分析和提取

`awk` 把每行文本按分隔符切割成**字段**，然后对每行执行程序。适合处理**结构化数据**（日志、CSV 等）。

### 核心概念

```bash
# 基本语法
awk '[条件] { 动作 }' 文件

# awk 的字段变量
# $0  整行内容
# $1  第 1 个字段
# $2  第 2 个字段
# $NF 最后一个字段（NF = Number of Fields）
```

### 基本用法

```bash
# 打印文件每行的第 1 和第 3 个字段（默认以空格分隔）
$ awk '{print $1, $3}' /etc/passwd

# 指定分隔符（-F），打印用户名和默认 Shell
$ awk -F: '{print $1, $7}' /etc/passwd
root /bin/bash
john /bin/bash
nginx /bin/false

# 打印最后一个字段
$ awk '{print $NF}' file.txt

# 打印整行
$ awk '{print $0}' file.txt   # 等同于 cat

# 带格式的输出（printf）
$ awk -F: '{printf "用户: %-15s Shell: %s\n", $1, $7}' /etc/passwd
用户: root            Shell: /bin/bash
用户: john            Shell: /bin/bash
```

### 条件过滤

```bash
# 只处理满足条件的行
$ awk '$3 > 1000 {print $1, $3}' /etc/passwd    # 打印 UID > 1000 的用户

# 正则匹配
$ awk '/error/ {print}' app.log                  # 包含 error 的行
$ awk '!/^#/ {print}' config.txt                 # 不以 # 开头的行

# 按字段匹配
$ awk -F: '$7 == "/bin/bash" {print $1}' /etc/passwd   # 使用 bash 的用户
```

### 内置变量

```bash
# NR：当前行号（Number of Record）
$ awk '{print NR, $0}' file.txt    # 给每行加行号

# NF：当前行字段数（Number of Fields）
$ awk '{print NF, $0}' file.txt

# FS：输入字段分隔符（Field Separator），等同于 -F
# OFS：输出字段分隔符（Output Field Separator）
$ awk 'BEGIN{OFS=","} {print $1,$2,$3}' file.txt

# FILENAME：当前处理的文件名
$ awk '{print FILENAME, NR, $0}' *.log
```

### BEGIN 和 END

```bash
# BEGIN：在处理任何行之前执行（初始化）
# END：处理完所有行后执行（汇总）

# 统计文件总行数和总字段数
$ awk 'BEGIN{lines=0; fields=0} {lines++; fields+=NF} END{print "行数:", lines, "字段数:", fields}' file.txt

# 计算 nginx 访问日志中的请求总大小
$ awk '{sum += $10} END {print "总大小:", sum/1024/1024 "MB"}' /var/log/nginx/access.log
```

### 实战场景

```bash
# 统计 nginx 访问日志中各状态码的数量
$ awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn
    8523 200
     342 304
      89 404
      12 500

# 找出访问量最大的 IP 前 10 名
$ awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# 提取 CSV 文件的特定列（第 2 和第 4 列）
$ awk -F',' '{print $2, $4}' data.csv

# 计算某列的平均值（如第 5 列）
$ awk '{sum+=$5; count++} END{print "平均值:", sum/count}' data.txt

# 将空格分隔的文件转为逗号分隔
$ awk '{$1=$1; OFS=","; $1=$1; print}' file.txt

# 过滤重复行（类似 uniq，但不要求连续重复）
$ awk '!seen[$0]++' file.txt
```

---

## 组合使用

三剑客的真正威力在于**组合使用**：

```bash
# 从 nginx 日志中提取访问量前 10 的接口路径
$ awk '{print $7}' /var/log/nginx/access.log \
  | sed 's/?.*$//' \                              # 去掉查询参数
  | sort \
  | uniq -c \
  | sort -rn \
  | head -10

# 找出 /etc 下所有文件中包含特定 IP 的配置
$ grep -rl "10.0.0.1" /etc/ | xargs awk '/10.0.0.1/{print FILENAME": "$0}'

# 批量修改多个配置文件中的域名
$ find /etc/nginx -name "*.conf" -exec sed -i 's/old.domain.com/new.domain.com/g' {} \;
```
