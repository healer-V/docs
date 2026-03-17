---
title: "Shell 流程控制"
category: "运维 · Shell"
tags:
  - Shell
  - if
  - for
  - while
  - case
date: 2026-03-17
excerpt: "流程控制是 Shell 脚本的骨架。本文涵盖 if/elif/else 条件分支、case 模式匹配、for/while/until 循环、break/continue 控制，以及函数的定义、局部变量、返回值和函数库复用技巧。"
---

# Shell 流程控制

## 一、条件分支

### 1. if / elif / else

`if` 语句根据命令的退出状态码（0 为真，非 0 为假）决定执行分支。

::: details if/elif/else 完整示例

```bash{6-16}
#!/usr/bin/env bash
# 文件：scripts/check-service.sh

service_name="${1:?用法：$0 <service-name>}"
port="${2:-80}"

if systemctl is-active --quiet "$service_name"; then
  echo "[OK] $service_name 正在运行"
elif [[ $port -lt 1024 ]]; then
  echo "[WARN] $service_name 未运行，且使用特权端口 $port（需 root 权限启动）"
else
  echo "[ERROR] $service_name 未运行"
  systemctl start "$service_name" && echo "已尝试启动"
fi
```

:::

::: tip 单行简写
对于简单的条件执行，可使用 `&&`（成功执行）和 `||`（失败执行）简化写法：
```bash
[[ -d /tmp/build ]] || mkdir -p /tmp/build
[[ -f config.yaml ]] && echo "配置文件存在"
```
:::

### 2. case...esac

`case` 适合多分支模式匹配，比多层 `if-elif` 更清晰。模式支持通配符 `*`、`?`、`[...]` 和 `|`（或）。

::: details case...esac 示例

```bash
#!/usr/bin/env bash
# 文件：scripts/manage.sh

action="${1:-help}"

case "$action" in
  start)
    echo "启动服务..."
    systemctl start nginx
    ;;
  stop)
    echo "停止服务..."
    systemctl stop nginx
    ;;
  restart | reload)
    echo "重启/重载服务..."
    systemctl restart nginx
    ;;
  status)
    systemctl status nginx
    ;;
  --help | -h | help)
    echo "用法：$0 {start|stop|restart|reload|status}"
    ;;
  *)
    echo "未知操作：$action" >&2
    echo "运行 '$0 help' 查看帮助" >&2
    exit 1
    ;;
esac
```

:::

## 二、循环

### 1. for 循环

#### (1) 遍历列表

::: details for 遍历列表示例

```bash
#!/usr/bin/env bash
# 文件：scripts/deploy-servers.sh

# 遍历固定列表
servers=("web-01" "web-02" "web-03")
for server in "${servers[@]}"; do
  echo "正在部署到：$server"
  ssh "deploy@${server}" "cd /app && git pull && pm2 restart all"
done

# 遍历命令输出
for pid in $(pgrep nginx); do
  echo "Nginx 进程 PID：$pid"
done

# 遍历文件（正确方式：防止文件名含空格）
for logfile in /var/log/nginx/*.log; do
  [[ -f "$logfile" ]] || continue
  echo "处理日志：$logfile（$(wc -l < "$logfile") 行）"
done
```

:::

#### (2) C 风格 for 循环

::: details C 风格循环示例

```bash
# 基本计数循环
for ((i = 1; i <= 5; i++)); do
  echo "第 $i 次重试..."
  sleep 1
done

# 倒计时
for ((count = 10; count >= 1; count--)); do
  printf "\r等待 %2d 秒..." "$count"
  sleep 1
done
echo "执行！"

# 步长为 2
for ((i = 0; i <= 20; i += 2)); do
  echo -n "$i "
done
echo
```

:::

#### (3) 使用 seq 生成序列

```bash
# 生成 1 到 10 的序列
for i in $(seq 1 10); do echo $i; done

# 带步长
for i in $(seq 0 5 100); do echo $i; done

# 带前导零（适合文件命名）
for i in $(seq -w 1 10); do echo "backup-$i.tar.gz"; done
```

### 2. while 循环

`while` 在条件为真时持续执行，适合读取文件、轮询等场景。

::: details while 循环示例

```bash
#!/usr/bin/env bash
# 文件：scripts/watch-log.sh

# 逐行读取文件（最安全的方式）
while IFS= read -r line; do
  echo "处理：$line"
done < /var/log/app/error.log

# 轮询等待服务就绪
max_wait=60
elapsed=0
while ! curl -sf http://localhost:8080/health > /dev/null 2>&1; do
  if [[ $elapsed -ge $max_wait ]]; then
    echo "错误：服务在 ${max_wait}s 内未就绪" >&2
    exit 1
  fi
  echo "等待服务启动... (${elapsed}s)"
  sleep 2
  ((elapsed += 2))
done
echo "服务已就绪！"

# 无限循环（监控场景）
while true; do
  free_mem=$(free -m | awk '/Mem:/{print $4}')
  echo "$(date '+%H:%M:%S') 可用内存：${free_mem}MB"
  sleep 5
done
```

:::

### 3. until 循环

`until` 与 `while` 相反，在条件为假时持续执行（当条件变为真时停止）。

::: details until 循环示例

```bash
# 等待文件出现
target_file="/tmp/deploy.lock"
until [[ -f "$target_file" ]]; do
  echo "等待部署锁文件..."
  sleep 2
done
echo "检测到部署锁文件，继续执行"

# 等待端口开放
until nc -z localhost 5432 2>/dev/null; do
  echo "等待 PostgreSQL 启动..."
  sleep 1
done
echo "PostgreSQL 已就绪"
```

:::

### 4. break 与 continue

| 命令 | 说明 |
|------|------|
| `break` | 跳出当前循环 |
| `break N` | 跳出 N 层嵌套循环 |
| `continue` | 跳过本次迭代，进入下一次 |
| `continue N` | 跳过 N 层嵌套循环的本次迭代 |

::: details break/continue 示例

```bash
#!/usr/bin/env bash
# 文件：scripts/find-server.sh

# 找到第一个可用服务器后停止
for server in web-01 web-02 web-03; do
  if ping -c 1 -W 1 "$server" &>/dev/null; then
    echo "找到可用服务器：$server"
    break
  fi
  echo "$server 不可达，尝试下一个..."
done

# 跳过不符合条件的文件
for file in /var/log/*.log; do
  # 跳过大于 100MB 的文件
  size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
  if [[ $size -gt 104857600 ]]; then
    echo "跳过大文件：$file"
    continue
  fi
  echo "处理：$file"
done
```

:::

## 三、函数

### 1. 函数定义与调用

Shell 函数有两种定义语法，推荐使用 `function` 关键字加花括号的方式以提高可读性。

::: details 函数定义与调用示例

```bash{4-12}
#!/usr/bin/env bash
# 文件：scripts/utils.sh

# 推荐写法（function 关键字）
function log_info() {
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[INFO]  $timestamp $*"
}

function log_error() {
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[ERROR] $timestamp $*" >&2
}

# 兼容写法（无 function 关键字）
check_root() {
  if [[ $EUID -ne 0 ]]; then
    log_error "此脚本需要 root 权限运行"
    exit 1
  fi
}

# 函数调用
log_info "脚本启动"
check_root
log_info "权限检查通过"
```

:::

### 2. 局部变量（local）

函数内部应始终用 `local` 声明变量，避免污染全局作用域。

::: details local 局部变量示例

```bash
# 全局变量（函数外定义）
app_name="my-app"

function deploy() {
  # 局部变量，只在函数内有效
  local deploy_dir="/opt/${app_name}"
  local timestamp
  timestamp=$(date '+%Y%m%d_%H%M%S')
  local backup_name="${app_name}_${timestamp}.tar.gz"

  echo "部署目录：$deploy_dir"
  echo "备份文件：$backup_name"
}

deploy
# deploy_dir 在函数外不可访问
echo "deploy_dir: '${deploy_dir:-未定义}'"   # 输出：未定义
```

:::

### 3. 返回值

Shell 函数的 `return` 只能返回 0-255 的整数（退出状态码），返回字符串需借助命令替换或全局变量。

::: details 函数返回值示例

```bash{6,16}
#!/usr/bin/env bash
# 文件：scripts/deploy-helpers.sh

# 返回状态码（0=成功，非0=失败）
function check_disk_space() {
  local required_mb="${1:-500}"
  local available_mb
  available_mb=$(df -m /var | awk 'NR==2{print $4}')

  if [[ $available_mb -lt $required_mb ]]; then
    echo "磁盘空间不足：需要 ${required_mb}MB，可用 ${available_mb}MB" >&2
    return 1
  fi
  return 0
}

# 返回字符串（通过命令替换捕获）
function get_latest_version() {
  local repo_path="${1:?必须提供仓库路径}"
  local version
  version=$(git -C "$repo_path" describe --tags --abbrev=0 2>/dev/null)
  echo "${version:-unknown}"   # echo 的输出会被调用方捕获
}

# 调用示例
if check_disk_space 1000; then
  echo "磁盘空间充足"
else
  echo "磁盘空间不足，终止部署"
  exit 1
fi

version=$(get_latest_version /opt/my-app)
echo "最新版本：$version"
```

:::

::: warning return vs exit
- `return`：从函数返回，继续执行调用方的后续代码
- `exit`：终止整个脚本进程（包括调用方）
- 在函数内应使用 `return`，只有在需要终止整个脚本时才用 `exit`
:::

### 4. 函数库复用

将通用函数提取到独立的库文件，通过 `source`（或 `.`）引入。

::: details 函数库复用示例

```bash
# 文件：lib/common.sh（函数库）
#!/usr/bin/env bash

# 防止重复加载
[[ -n "${_COMMON_LOADED:-}" ]] && return 0
_COMMON_LOADED=1

readonly LOG_DIR="/var/log/scripts"

function log_info()  { echo "[INFO]  $(date '+%H:%M:%S') $*"; }
function log_warn()  { echo "[WARN]  $(date '+%H:%M:%S') $*" >&2; }
function log_error() { echo "[ERROR] $(date '+%H:%M:%S') $*" >&2; }

function ensure_dir() {
  local dir="$1"
  [[ -d "$dir" ]] || mkdir -p "$dir"
}
```

```bash
# 文件：scripts/deploy.sh（主脚本）
#!/usr/bin/env bash
set -euo pipefail

# 获取脚本所在目录（兼容符号链接）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 引入函数库（推荐使用绝对路径）
source "${SCRIPT_DIR}/../lib/common.sh"

log_info "开始部署..."
ensure_dir "/opt/app/releases"
log_info "部署完成"
```

:::

::: tip 函数库最佳实践
- 使用防重复加载守卫（`[[ -n "${_LOADED}" ]]`）避免重复 source
- 库文件中不执行任何操作，只定义函数和常量
- 将 `readonly` 常量集中在库文件顶部统一管理
:::
