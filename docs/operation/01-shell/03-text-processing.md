---
title: "Shell 文本处理"
category: "运维 · Shell"
tags:
  - Shell
  - grep
  - sed
  - awk
  - 正则
date: 2026-03-17
excerpt: "grep、sed、awk 是 Linux 文本处理的三大利器。本文系统讲解三者的核心用法，并结合 cut、sort、uniq、wc、tr 等工具，介绍管道组合的实战技巧，帮助你高效处理日志和结构化文本。"
---

# Shell 文本处理

## 一、grep — 文本搜索

`grep` 用于在文件或标准输入中搜索匹配指定模式的行。

### 1. 常用选项

| 选项 | 说明 |
|------|------|
| `-E` | 启用扩展正则（ERE），等同于 `egrep` |
| `-P` | 启用 Perl 兼容正则（PCRE），支持 `\d`、`\s`、`?=` 等 |
| `-i` | 忽略大小写 |
| `-v` | 反向匹配（输出不匹配的行） |
| `-l` | 只输出含匹配内容的文件名 |
| `-L` | 只输出不含匹配内容的文件名 |
| `-r` / `-R` | 递归搜索目录 |
| `-n` | 显示行号 |
| `-c` | 只显示匹配行的数量 |
| `-o` | 只输出匹配的部分（非整行） |
| `-A N` | 显示匹配行后 N 行（After） |
| `-B N` | 显示匹配行前 N 行（Before） |
| `-C N` | 显示匹配行前后各 N 行（Context） |
| `--color` | 高亮匹配内容 |

### 2. 常用模式

::: details grep 搜索示例

```bash
# 在日志中搜索错误信息
grep -n "ERROR" /var/log/app/app.log

# 忽略大小写搜索
grep -i "error\|warn" /var/log/app/app.log

# 扩展正则：搜索 IP 地址
grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}" /var/log/nginx/access.log

# Perl 正则：搜索邮箱地址
grep -P "[\w.+-]+@[\w-]+\.[a-z]{2,}" config.txt

# 反向匹配：过滤掉注释行和空行
grep -Ev "^\s*#|^\s*$" /etc/nginx/nginx.conf

# 只显示匹配内容（提取 IP 地址）
grep -oE "([0-9]{1,3}\.){3}[0-9]{1,3}" /var/log/nginx/access.log | sort | uniq -c

# 递归搜索（在所有 .conf 文件中查找 server_name）
grep -r "server_name" /etc/nginx/ --include="*.conf" -l

# 显示上下文（错误日志前后各 3 行）
grep -C 3 "FATAL" /var/log/app/app.log

# 统计匹配行数
grep -c "200" /var/log/nginx/access.log
```

:::

## 二、sed — 流式编辑器

`sed` 逐行读取输入，按照脚本规则进行替换、删除、插入等操作。

### 1. 基本语法

```
sed [选项] '地址命令' 文件
```

- **地址**：指定操作哪些行，可省略（表示全部行）
  - `N`：第 N 行
  - `N,M`：第 N 到第 M 行
  - `/pattern/`：匹配 pattern 的行
  - `/start/,/end/`：从 start 到 end 之间的行
- **命令**：`s`（替换）、`d`（删除）、`i`（行前插入）、`a`（行后追加）、`p`（打印）等

### 2. 替换（s 命令）

::: details sed 替换示例

```bash
# 基本替换（替换每行第一个匹配）
sed 's/http:/https:/' urls.txt

# 全局替换（替换每行所有匹配）
sed 's/foo/bar/g' config.txt

# 忽略大小写替换
sed 's/error/ERROR/Ig' app.log

# 使用不同分隔符（路径中含 / 时很有用）
sed 's|/old/path|/new/path|g' deploy.sh

# 替换并原地修改（-i，macOS 需加空字符串备份参数）
sed -i 's/version=1.0/version=2.0/' app.properties      # Linux
sed -i '' 's/version=1.0/version=2.0/' app.properties   # macOS

# 捕获组引用（将 "2026-03-17" 改为 "17/03/2026"）
echo "2026-03-17" | sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\3\/\2\/\1/'

# 只替换第 3 个匹配
echo "a a a a" | sed 's/a/X/3'   # a a X a
```

:::

### 3. 删除、插入与多行处理

::: details sed 删除与插入示例

```bash
# 删除空行
sed '/^\s*$/d' config.txt

# 删除注释行（以 # 开头）
sed '/^\s*#/d' nginx.conf

# 删除第 2 到第 5 行
sed '2,5d' file.txt

# 在匹配行前插入内容（i 命令）
sed '/^server {/i\    # 以下为虚拟主机配置' nginx.conf

# 在匹配行后追加内容（a 命令）
sed '/listen 80;/a\    listen 443 ssl;' nginx.conf

# 多命令（用 -e 或分号分隔）
sed -e 's/foo/bar/g' -e '/^#/d' config.txt

# 多行处理：将连续多行合并（N 命令）
sed ':a; N; s/\n/ /; ba' multiline.txt
```

:::

### 4. 原地编辑备份

::: tip 原地编辑安全操作
修改重要配置文件前，建议先备份再编辑：
```bash
# 备份原文件为 .bak 后修改
sed -i.bak 's/8080/80/' /etc/nginx/nginx.conf

# 验证修改
diff /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak
```
:::

## 三、awk — 文本分析工具

`awk` 将每行按分隔符分割成字段，非常适合处理结构化文本（如日志、CSV、空格分隔的表格）。

### 1. 基本结构

```
awk 'BEGIN{初始化} /pattern/{处理} END{收尾}' 文件
```

- `$0`：整行内容
- `$1`、`$2` ...：第 1、2 个字段
- `NR`：当前行号
- `NF`：当前行字段总数
- `FS`：输入字段分隔符（默认空白字符）
- `OFS`：输出字段分隔符
- `RS`：记录分隔符（默认换行符）

### 2. 字段分割与基本操作

::: details awk 基础用法示例

```bash
# 打印第 1、7 字段（Nginx access.log 的 IP 和状态码）
awk '{print $1, $7}' /var/log/nginx/access.log

# 指定分隔符（处理 /etc/passwd）
awk -F: '{print $1, $3, $6}' /etc/passwd

# 打印最后一个字段
awk '{print $NF}' file.txt

# 打印行号
awk '{print NR": "$0}' file.txt

# 格式化输出（printf）
awk -F: '{printf "用户:%-15s UID:%-5s 家目录:%s\n", $1, $3, $6}' /etc/passwd
```

:::

### 3. 条件过滤

::: details awk 条件处理示例

```bash
# 过滤状态码为 500 的请求（第 9 字段）
awk '$9 == 500 {print $1, $7}' /var/log/nginx/access.log

# 过滤文件大小大于 1MB 的文件（ls -la 输出的第 5 字段）
ls -la /var/log/ | awk '$5 > 1048576 {print $5, $9}'

# 正则匹配过滤
awk '/ERROR|FATAL/' /var/log/app/app.log

# 字段正则匹配
awk '$1 ~ /^192\.168\./' /var/log/nginx/access.log

# 多条件
awk '$9 >= 400 && $9 < 500 {print}' /var/log/nginx/access.log
```

:::

### 4. BEGIN / END 块与数组统计

::: details awk 统计分析示例

```bash
# 统计各状态码出现次数
awk '{count[$9]++}
END {
  for (code in count)
    printf "状态码 %s：%d 次\n", code, count[code]
}' /var/log/nginx/access.log | sort -k4 -rn

# 统计每个 IP 的请求总次数
awk '{ip_count[$1]++}
END {
  for (ip in ip_count)
    print ip_count[ip], ip
}' /var/log/nginx/access.log | sort -rn | head -10

# 计算响应时间平均值（假设第 10 字段为响应时间）
awk '
BEGIN { total=0; count=0 }
$10 ~ /^[0-9]+$/ { total += $10; count++ }
END {
  if (count > 0)
    printf "平均响应时间：%.2f ms（共 %d 条）\n", total/count, count
}' /var/log/nginx/access.log
```

:::

### 5. printf 格式化输出

::: details awk printf 示例

```bash
# 生成格式化报告
df -h | awk '
NR==1 { printf "%-20s %6s %6s %6s %5s\n", $1,$2,$3,$4,$5 }
NR>1  { printf "%-20s %6s %6s %6s %5s\n", $1,$2,$3,$4,$5 }
'

# 处理 CSV 并输出 SQL 插入语句
awk -F',' '
NR>1 {
  gsub(/"/, "", $0)
  printf "INSERT INTO users (name, email) VALUES (\"%s\", \"%s\");\n", $1, $2
}' users.csv
```

:::

## 四、其他文本处理工具

### 1. cut — 字段切割

::: details cut 示例

```bash
# 按字符位置切割
cut -c1-10 file.txt         # 取每行前 10 个字符

# 按字段切割（-d 指定分隔符，-f 指定字段）
cut -d: -f1,3 /etc/passwd   # 取用户名和 UID

# 取第 3 个字段到末尾
cut -d, -f3- data.csv
```

:::

### 2. sort — 排序

::: details sort 示例

```bash
# 按字母排序（默认）
sort /etc/hosts

# 数值排序（-n）
sort -n file.txt

# 逆序（-r）
sort -rn numbers.txt

# 按第 3 字段数值排序
sort -k3 -n data.txt

# 按多字段排序（先按第 1 字段，再按第 2 字段）
sort -k1,1 -k2,2n data.txt

# 去重排序
sort -u list.txt

# 按文件大小排序（du 输出）
du -sh /var/log/* | sort -h
```

:::

### 3. uniq — 去重统计

::: details uniq 示例

```bash
# 去除相邻重复行（需先排序）
sort access.log | uniq

# 统计重复次数（-c）并按频次排序
sort access.log | uniq -c | sort -rn

# 只显示重复的行（-d）
sort access.log | uniq -d

# 只显示唯一的行（-u）
sort access.log | uniq -u
```

:::

### 4. wc — 统计行列字数

```bash
wc -l file.txt    # 行数
wc -w file.txt    # 单词数
wc -c file.txt    # 字节数
wc -m file.txt    # 字符数

# 统计日志文件行数
wc -l /var/log/nginx/access.log
```

### 5. tr — 字符转换与删除

::: details tr 示例

```bash
# 小写转大写
echo "hello world" | tr 'a-z' 'A-Z'

# 删除字符（-d）
echo "Hello, World! 123" | tr -d '[:punct:][:digit:]'  # Hello World

# 压缩连续重复字符（-s）
echo "hello    world" | tr -s ' '     # hello world

# 删除换行符（将多行合并为一行）
cat list.txt | tr '\n' ' '

# 将冒号替换为换行（展示 PATH）
echo "$PATH" | tr ':' '\n'
```

:::

### 6. paste — 合并文件列

::: details paste 示例

```bash
# 将两个文件按列合并（默认制表符分隔）
paste names.txt scores.txt

# 指定分隔符
paste -d, names.txt emails.txt > contacts.csv

# 将单列转为多列（每 3 个为一行）
paste - - - < list.txt
```

:::

## 五、管道组合技巧

### 1. 经典管道组合

::: details 实用管道组合示例

```bash
# 统计 Nginx 访问最多的 10 个 IP
awk '{print $1}' /var/log/nginx/access.log \
  | sort \
  | uniq -c \
  | sort -rn \
  | head -10

# 查找占用端口最多的进程
ss -tlnp | awk 'NR>1{print $NF}' | sort | uniq -c | sort -rn

# 提取配置文件中所有有效配置项（去掉注释和空行）
grep -Ev "^\s*(#|$)" /etc/nginx/nginx.conf \
  | sed 's/^\s*//' \
  | awk '!seen[$0]++'   # 去重

# 实时监控日志中的错误（每 5 秒统计一次）
watch -n 5 'tail -n 1000 /var/log/app/app.log | grep -c "ERROR"'

# 找出最近 1 小时内修改的日志并统计大小
find /var/log -name "*.log" -mmin -60 \
  | xargs ls -lh \
  | awk '{sum+=$5; print $5, $9} END {print "总计：" sum " bytes"}'
```

:::

### 2. 进程替换（Process Substitution）

进程替换 `<(命令)` 将命令输出作为临时文件传递，适合不支持管道的命令。

::: details 进程替换示例

```bash
# 比较两个命令的输出
diff <(sort file1.txt) <(sort file2.txt)

# 对比两台服务器的包列表
diff <(ssh server1 "dpkg -l") <(ssh server2 "dpkg -l")

# 同时读取多个来源
while IFS= read -r line; do
  echo "处理：$line"
done < <(find /opt -name "*.conf" | sort)
```

:::

::: tip 管道与 xargs
当需要将管道输出作为命令的参数（而非标准输入）时，使用 `xargs`：
```bash
# 找到所有 .bak 文件并删除
find /tmp -name "*.bak" | xargs rm -f

# 带空格的文件名需配合 -print0 和 -0
find /tmp -name "*.log" -print0 | xargs -0 gzip
```
:::
