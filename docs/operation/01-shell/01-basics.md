---
title: "Shell 脚本基础"
category: "运维 · Shell"
tags:
  - Shell
  - Bash
  - 脚本
  - 变量
date: 2026-03-17
excerpt: "Shell 脚本是 Linux 运维自动化的核心工具。本文系统讲解 Shebang 声明、变量类型与操作、字符串处理、数值计算、交互输入以及条件测试语法，帮助你掌握脚本编写的基础能力。"
---

# Shell 脚本基础

## 一、Shebang 声明

Shebang（`#!`）是脚本文件的第一行，告诉系统用哪个解释器执行该脚本。

| Shebang | 说明 |
|---------|------|
| `#!/bin/bash` | 使用绝对路径，依赖 bash 安装在 `/bin` |
| `#!/usr/bin/env bash` | 推荐写法，通过 `env` 查找 bash，可移植性更好 |
| `#!/bin/sh` | POSIX sh，兼容性最强，但不支持 bash 扩展语法 |

::: tip 推荐写法
生产脚本优先使用 `#!/usr/bin/env bash`，并在文件头加上 `set -euo pipefail` 以启用严格模式。
:::

::: details 完整的脚本头部模板

```bash{1-3}
#!/usr/bin/env bash
# 文件：scripts/deploy.sh
# 描述：应用部署脚本
set -euo pipefail   # -e 遇错退出，-u 未定义变量报错，-o pipefail 管道任一失败则退出
IFS=$'\n\t'         # 修改字段分隔符，避免空格导致的 BUG
```

:::

## 二、变量

### 1. 变量声明与引用

Shell 变量赋值时等号两侧不能有空格，引用时使用 `$` 前缀。

::: details 变量声明与引用示例

```bash
# 普通变量（字符串默认类型）
app_name="my-app"
app_version=1.0.0

# 引用变量：推荐用 ${} 包裹，避免歧义
echo "部署 ${app_name} 版本 ${app_version}"

# 只读变量（防止被修改）
readonly MAX_RETRY=3

# 删除变量
unset app_version
```

:::

### 2. 环境变量

环境变量可被子进程继承，使用 `export` 声明。

::: details 环境变量操作示例

```bash
# 导出为环境变量
export NODE_ENV="production"
export DATABASE_URL="postgres://user:pass@localhost:5432/mydb"

# 查看所有环境变量
printenv

# 查看单个环境变量
echo $PATH
printenv HOME

# 临时设置环境变量（仅对当前命令生效）
NODE_ENV=test node app.js
```

:::

### 3. 特殊变量

Shell 内置了一系列特殊变量，用于获取脚本自身信息和上一个命令的状态。

| 变量 | 含义 |
|------|------|
| `$0` | 脚本自身的文件名 |
| `$1` ~ `$9` | 位置参数，第 1 到第 9 个命令行参数 |
| `${10}` 及以上 | 超过 9 的参数需用花括号包裹 |
| `$#` | 传入参数的总个数 |
| `$@` | 所有参数，逐个展开（推荐使用） |
| `$*` | 所有参数，合并为一个字符串 |
| `$?` | 上一条命令的退出状态码（0 表示成功） |
| `$$` | 当前 Shell 进程的 PID |
| `$!` | 最近一个后台进程的 PID |
| `$_` | 上一条命令的最后一个参数 |

::: details 特殊变量使用示例

```bash{8-10}
#!/usr/bin/env bash
# 文件：scripts/deploy.sh

echo "脚本名称：$0"
echo "第一个参数：$1"
echo "参数总数：$#"
echo "所有参数：$@"

# 检查退出状态码
ls /nonexistent 2>/dev/null
echo "上一条命令退出码：$?"   # 非 0 表示失败

echo "当前进程 PID：$$"
```

:::

## 三、字符串操作

### 1. 字符串拼接

::: details 字符串拼接示例

```bash
prefix="Hello"
name="World"

# 方式一：直接相邻
greeting="${prefix}, ${name}!"

# 方式二：使用 printf
printf -v full_msg "%s, %s!" "$prefix" "$name"

echo "$greeting"    # Hello, World!
echo "$full_msg"    # Hello, World!
```

:::

### 2. 字符串截取

| 语法 | 说明 |
|------|------|
| `${var:offset}` | 从第 offset 个字符开始截取到末尾 |
| `${var:offset:length}` | 从第 offset 个字符开始截取 length 个字符 |
| `${var#pattern}` | 从头删除最短匹配 |
| `${var##pattern}` | 从头删除最长匹配 |
| `${var%pattern}` | 从尾删除最短匹配 |
| `${var%%pattern}` | 从尾删除最长匹配 |

::: details 字符串截取示例

```bash
filepath="/var/log/nginx/access.log"

# 按位置截取
echo "${filepath:0:8}"          # /var/log
echo "${filepath:9}"            # nginx/access.log

# 删除路径前缀（获取文件名）
echo "${filepath##*/}"          # access.log

# 删除文件名（获取目录）
echo "${filepath%/*}"           # /var/log/nginx

# 删除扩展名
filename="access.log"
echo "${filename%.*}"           # access

# 获取扩展名
echo "${filename##*.}"          # log
```

:::

### 3. 字符串替换

| 语法 | 说明 |
|------|------|
| `${var/pattern/replacement}` | 替换第一个匹配 |
| `${var//pattern/replacement}` | 替换所有匹配 |
| `${var/#pattern/replacement}` | 替换开头匹配 |
| `${var/%pattern/replacement}` | 替换结尾匹配 |

::: details 字符串替换示例

```bash
url="http://example.com/api/v1"

# 替换第一个匹配
echo "${url/http/https}"        # https://example.com/api/v1

# 替换所有匹配
log_line="ERROR ERROR WARNING"
echo "${log_line//ERROR/FIXED}" # FIXED FIXED WARNING

# 大小写转换（Bash 4.0+）
str="Hello World"
echo "${str,,}"   # hello world（全小写）
echo "${str^^}"   # HELLO WORLD（全大写）
```

:::

### 4. 字符串长度

```bash
name="nginx"
echo "${#name}"   # 5
```

### 5. 默认值处理

| 语法 | 说明 |
|------|------|
| `${var:-default}` | 变量未设置或为空时，返回 default |
| `${var:=default}` | 变量未设置或为空时，赋值并返回 default |
| `${var:+value}` | 变量已设置且非空时，返回 value |
| `${var:?message}` | 变量未设置或为空时，打印 message 并退出 |

::: details 默认值处理示例

```bash
# 未设置 ENV 时使用 "development"
env="${ENV:-development}"
echo "当前环境：$env"

# 必填参数检查（未传入时退出并报错）
: "${1:?用法：$0 <deploy-target>}"

# 端口未设置时默认 8080，并赋值
: "${PORT:=8080}"
echo "监听端口：$PORT"
```

:::

## 四、数值计算

### 1. 三种计算方式对比

| 方式 | 语法示例 | 特点 |
|------|---------|------|
| `$(( ))` | `result=$((a + b))` | 推荐，内置 bash，速度最快 |
| `let` | `let result=a+b` | 无需 `$`，不能有空格 |
| `expr` | `result=$(expr $a + $b)` | 外部命令，兼容 sh，较慢 |

::: details 数值计算示例

```bash
a=10
b=3

# 推荐：$(( )) 算术扩展
echo $((a + b))     # 13
echo $((a - b))     # 7
echo $((a * b))     # 30
echo $((a / b))     # 3（整除）
echo $((a % b))     # 1（取余）
echo $((a ** b))    # 1000（幂运算）

# 自增/自减
count=0
((count++))
((count+=5))
echo $count         # 6

# let 方式
let "result = a * b + 2"
echo $result        # 32

# 浮点运算需借助 bc
echo "scale=2; 10 / 3" | bc   # 3.33
```

:::

## 五、read 交互输入

`read` 命令用于从标准输入读取用户输入，常用于交互式脚本。

| 选项 | 说明 |
|------|------|
| `-p "提示"` | 显示提示信息 |
| `-s` | 静默模式（不回显，用于密码输入） |
| `-t N` | 超时 N 秒 |
| `-n N` | 只读取 N 个字符 |
| `-r` | 禁止反斜杠转义（推荐始终加上） |
| `-a arr` | 读取到数组 |

::: details read 交互输入示例

```bash
#!/usr/bin/env bash
# 文件：scripts/interactive-deploy.sh

# 基本输入
read -rp "请输入部署目标（prod/staging）：" deploy_target

# 密码输入（不回显）
read -rsp "请输入数据库密码：" db_password
echo  # 换行

# 超时输入（5 秒无响应则使用默认值）
if read -rt 5 -p "确认部署？[y/N] " confirm; then
  [[ "$confirm" =~ ^[Yy]$ ]] || { echo "已取消"; exit 0; }
else
  echo "超时，已取消"
  exit 0
fi

# 读取到数组
read -ra servers <<< "web1 web2 web3"
echo "服务器列表：${servers[@]}"
```

:::

## 六、条件测试

### 1. `[ ]` vs `[[ ]]` 对比

| 特性 | `[ ]`（test命令） | `[[ ]]`（bash内置） |
|------|-----------------|-------------------|
| 来源 | POSIX 兼容命令 | Bash/Zsh 扩展关键字 |
| 字符串比较 | `=`、`!=` | `=`、`!=`、`=~`（正则） |
| 逻辑运算符 | `-a`、`-o` | `&&`、`\|\|` |
| 单词分割 | 变量需加引号 | 变量无需加引号 |
| 模式匹配 | 不支持 | 支持 `*`、`?` 通配 |
| 推荐度 | sh 兼容时使用 | bash 脚本首选 |

### 2. 字符串判断

::: details 字符串条件测试示例

```bash
name="nginx"
input=""

# 字符串相等
[[ "$name" == "nginx" ]] && echo "是 nginx"

# 字符串不等
[[ "$name" != "apache" ]] && echo "不是 apache"

# 检查是否为空
[[ -z "$input" ]] && echo "input 为空"

# 检查是否非空
[[ -n "$name" ]] && echo "name 非空"

# 正则匹配（=~ 右侧不加引号）
version="v1.2.3"
[[ "$version" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] && echo "版本号格式正确"

# 通配模式匹配
[[ "$name" == ng* ]] && echo "以 ng 开头"
```

:::

### 3. 数值判断

| 运算符 | 含义 |
|--------|------|
| `-eq` | 等于（equal） |
| `-ne` | 不等于（not equal） |
| `-gt` | 大于（greater than） |
| `-ge` | 大于等于（greater or equal） |
| `-lt` | 小于（less than） |
| `-le` | 小于等于（less or equal） |

::: details 数值条件测试示例

```bash
cpu_usage=85
threshold=80

if [[ $cpu_usage -gt $threshold ]]; then
  echo "CPU 告警：当前使用率 ${cpu_usage}%，超过阈值 ${threshold}%"
fi

# 数值范围判断
port=8080
if [[ $port -ge 1024 && $port -le 65535 ]]; then
  echo "端口 $port 在合法范围内"
fi
```

:::

### 4. 文件判断

| 运算符 | 含义 |
|--------|------|
| `-e file` | 文件/目录存在 |
| `-f file` | 是普通文件 |
| `-d file` | 是目录 |
| `-L file` | 是符号链接 |
| `-r file` | 可读 |
| `-w file` | 可写 |
| `-x file` | 可执行 |
| `-s file` | 文件非空（大小 > 0） |
| `-nt file` | 比指定文件新（newer than） |
| `-ot file` | 比指定文件旧（older than） |

::: details 文件条件测试示例

```bash
config_file="/etc/nginx/nginx.conf"
log_dir="/var/log/nginx"

# 检查文件存在
if [[ ! -f "$config_file" ]]; then
  echo "错误：配置文件不存在：$config_file" >&2
  exit 1
fi

# 检查目录存在，不存在则创建
if [[ ! -d "$log_dir" ]]; then
  mkdir -p "$log_dir"
  echo "已创建日志目录：$log_dir"
fi

# 检查文件是否可执行
script="/usr/local/bin/deploy.sh"
if [[ -x "$script" ]]; then
  "$script"
else
  echo "脚本无执行权限，请运行：chmod +x $script"
fi
```

:::

::: warning 变量引用注意事项
在 `[ ]` 中使用变量时，必须加双引号（`"$var"`），否则变量值含空格会导致语法错误。在 `[[ ]]` 中变量无需引号，但养成加引号的习惯有助于代码可读性。
:::
