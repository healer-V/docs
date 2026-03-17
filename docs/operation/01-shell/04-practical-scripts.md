---
title: "Shell 实用脚本案例"
category: "运维 · Shell"
tags:
  - Shell
  - 自动化
  - 备份
  - 监控
date: 2026-03-17
excerpt: "通过数组操作、文件批量处理、日志切割、进程监控、系统健康检查等完整脚本案例，掌握 Shell 自动化运维的实战技巧，并了解 cron 定时任务集成、脚本调试方法和 getopts 参数解析。"
---

# Shell 实用脚本案例

## 一、数组操作

Shell 数组分为**索引数组**（下标从 0 开始）和**关联数组**（键值对，需 Bash 4.0+）。

### 1. 索引数组

::: details 索引数组操作示例

```bash
#!/usr/bin/env bash
# 文件：scripts/array-demo.sh

# 声明数组
servers=("web-01" "web-02" "web-03" "db-01")

# 访问元素
echo "${servers[0]}"          # web-01
echo "${servers[-1]}"         # db-01（最后一个，Bash 4.2+）

# 所有元素
echo "${servers[@]}"          # web-01 web-02 web-03 db-01

# 数组长度
echo "${#servers[@]}"         # 4

# 数组切片（从下标 1 开始取 2 个）
echo "${servers[@]:1:2}"      # web-02 web-03

# 追加元素
servers+=("cache-01")

# 删除元素（删除下标 1 的元素）
unset 'servers[1]'
echo "${servers[@]}"          # web-01 web-03 db-01 cache-01（下标 1 留空）

# 遍历（带下标）
for i in "${!servers[@]}"; do
  echo "[$i] ${servers[$i]}"
done

# 将命令输出转为数组
mapfile -t log_files < <(find /var/log -name "*.log" -maxdepth 2)
echo "找到 ${#log_files[@]} 个日志文件"
```

:::

### 2. 关联数组

::: details 关联数组操作示例

```bash
#!/usr/bin/env bash
# 文件：scripts/assoc-array-demo.sh
# 关联数组需要 Bash 4.0+

declare -A service_ports=(
  [nginx]=80
  [postgresql]=5432
  [redis]=6379
  [nodejs]=3000
)

# 访问
echo "Nginx 端口：${service_ports[nginx]}"

# 遍历键值
for service in "${!service_ports[@]}"; do
  port="${service_ports[$service]}"
  if nc -z localhost "$port" 2>/dev/null; then
    echo "[UP]   $service :$port"
  else
    echo "[DOWN] $service :$port"
  fi
done

# 动态添加
service_ports[mongodb]=27017

# 检查键是否存在
if [[ -v service_ports[nginx] ]]; then
  echo "nginx 已在端口映射中"
fi
```

:::

## 二、文件批量处理

### 1. 文件批量重命名

::: details 批量重命名脚本

```bash
#!/usr/bin/env bash
# 文件：scripts/batch-rename.sh
# 用途：将指定目录下的文件按规则批量重命名
set -euo pipefail

TARGET_DIR="${1:?用法：$0 <目录> [扩展名]}"
EXT="${2:-jpg}"
COUNT=0

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "错误：目录不存在：$TARGET_DIR" >&2
  exit 1
fi

# 将 IMG_YYYYMMDD_HHMMSS.jpg 重命名为 photo_001.jpg 格式
while IFS= read -r -d '' file; do
  dir=$(dirname "$file")
  ext="${file##*.}"
  ((COUNT++))
  new_name="${dir}/photo_$(printf '%03d' "$COUNT").${ext}"

  echo "重命名：$file → $new_name"
  mv "$file" "$new_name"
done < <(find "$TARGET_DIR" -maxdepth 1 -name "*.${EXT}" -print0 | sort -z)

echo "完成：共重命名 $COUNT 个文件"
```

:::

### 2. 批量压缩与备份

::: details 文件备份脚本

```bash
#!/usr/bin/env bash
# 文件：scripts/backup.sh
# 用途：备份指定目录，保留最近 N 份，自动清理旧备份
set -euo pipefail

# 配置区
readonly SOURCE_DIR="${1:-/opt/app}"
readonly BACKUP_DIR="/data/backups/app"
readonly KEEP_COUNT=7
readonly TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
readonly BACKUP_FILE="${BACKUP_DIR}/app_${TIMESTAMP}.tar.gz"

function log() { echo "[$(date '+%H:%M:%S')] $*"; }

# 创建备份目录
mkdir -p "$BACKUP_DIR"

log "开始备份：$SOURCE_DIR"

# 执行压缩备份
tar -czf "$BACKUP_FILE" \
  --exclude="*.log" \
  --exclude="node_modules" \
  --exclude=".git" \
  -C "$(dirname "$SOURCE_DIR")" \
  "$(basename "$SOURCE_DIR")"

backup_size=$(du -sh "$BACKUP_FILE" | cut -f1)
log "备份完成：$BACKUP_FILE（$backup_size）"

# 清理旧备份（保留最新的 KEEP_COUNT 份）
log "清理旧备份（保留最新 $KEEP_COUNT 份）..."
old_backups=$(find "$BACKUP_DIR" -name "app_*.tar.gz" | sort | head -n -"$KEEP_COUNT")
if [[ -n "$old_backups" ]]; then
  echo "$old_backups" | xargs rm -f
  log "已删除旧备份"
fi

# 列出当前备份
log "当前备份列表："
find "$BACKUP_DIR" -name "app_*.tar.gz" | sort | xargs ls -lh
```

:::

## 三、日志切割脚本

::: details 日志切割脚本

```bash
#!/usr/bin/env bash
# 文件：scripts/log-rotate.sh
# 用途：手动实现日志切割（按日期归档、压缩、清理）
set -euo pipefail

LOG_DIR="/var/log/myapp"
ARCHIVE_DIR="/var/log/myapp/archives"
MAX_DAYS=30
TODAY=$(date '+%Y%m%d')

mkdir -p "$ARCHIVE_DIR"

# 遍历所有 .log 文件
while IFS= read -r -d '' logfile; do
  filename=$(basename "$logfile" .log)
  archive="${ARCHIVE_DIR}/${filename}_${TODAY}.log.gz"

  if [[ ! -s "$logfile" ]]; then
    echo "跳过空文件：$logfile"
    continue
  fi

  # 压缩归档当前日志
  gzip -c "$logfile" > "$archive"
  echo "已归档：$logfile → $archive（$(du -sh "$archive" | cut -f1)）"

  # 清空原日志（保留文件，让应用继续写入）
  > "$logfile"

  # 发送 HUP 信号让应用重新打开日志文件（如有需要）
  # pkill -HUP myapp

done < <(find "$LOG_DIR" -maxdepth 1 -name "*.log" -print0)

# 删除超过 MAX_DAYS 天的归档
echo "清理 $MAX_DAYS 天前的归档..."
find "$ARCHIVE_DIR" -name "*.log.gz" -mtime +"$MAX_DAYS" -delete

echo "日志切割完成"
```

:::

## 四、进程监控与自动重启

::: details 进程监控脚本

```bash
#!/usr/bin/env bash
# 文件：scripts/process-watchdog.sh
# 用途：监控指定进程，若挂掉则自动重启并发送告警
set -euo pipefail

PROCESS_NAME="node"
START_CMD="/usr/bin/node /opt/app/server.js"
LOG_FILE="/var/log/watchdog.log"
MAX_RESTART=5
RESTART_INTERVAL=10

restart_count=0

function log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

function send_alert() {
  local msg="$1"
  # 发送钉钉告警（替换为你的 Webhook URL）
  curl -sf -X POST \
    -H "Content-Type: application/json" \
    -d "{\"msgtype\":\"text\",\"text\":{\"content\":\"[Watchdog] $msg\"}}" \
    "https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN" \
    > /dev/null 2>&1 || true
}

function start_process() {
  log "启动进程：$START_CMD"
  nohup $START_CMD >> /var/log/app/app.log 2>&1 &
  local pid=$!
  echo "$pid" > /var/run/myapp.pid
  log "进程已启动，PID：$pid"
}

log "Watchdog 启动，监控进程：$PROCESS_NAME"

while true; do
  if ! pgrep -x "$PROCESS_NAME" > /dev/null; then
    log "检测到进程 $PROCESS_NAME 已停止！"

    if [[ $restart_count -ge $MAX_RESTART ]]; then
      log "重启次数已达上限（$MAX_RESTART），停止监控"
      send_alert "进程 $PROCESS_NAME 反复崩溃，已达重启上限，请人工介入！"
      exit 1
    fi

    ((restart_count++))
    log "第 $restart_count 次重启（最多 $MAX_RESTART 次）"
    send_alert "进程 $PROCESS_NAME 崩溃，正在进行第 $restart_count 次重启"
    start_process
    sleep "$RESTART_INTERVAL"
  else
    # 进程正常，重置重启计数
    restart_count=0
    sleep 30
  fi
done
```

:::

## 五、系统健康检查

::: details 系统健康检查脚本

```bash
#!/usr/bin/env bash
# 文件：scripts/health-check.sh
# 用途：检查系统关键指标，生成健康报告
set -euo pipefail

# 告警阈值
readonly CPU_THRESHOLD=80
readonly MEM_THRESHOLD=85
readonly DISK_THRESHOLD=90
readonly LOAD_THRESHOLD=4.0

# 颜色输出
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'
ISSUES=()

function check_cpu() {
  local usage
  usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d',' -f1)
  usage=${usage%.*}
  if [[ $usage -ge $CPU_THRESHOLD ]]; then
    ISSUES+=("CPU 使用率过高：${usage}%（阈值 ${CPU_THRESHOLD}%）")
    echo -e "${RED}[WARN] CPU 使用率：${usage}%${NC}"
  else
    echo -e "${GREEN}[OK]   CPU 使用率：${usage}%${NC}"
  fi
}

function check_memory() {
  local total used usage
  total=$(free -m | awk '/Mem:/{print $2}')
  used=$(free -m | awk '/Mem:/{print $3}')
  usage=$(( used * 100 / total ))
  if [[ $usage -ge $MEM_THRESHOLD ]]; then
    ISSUES+=("内存使用率过高：${usage}%（${used}MB/${total}MB）")
    echo -e "${RED}[WARN] 内存使用率：${usage}% (${used}MB/${total}MB)${NC}"
  else
    echo -e "${GREEN}[OK]   内存使用率：${usage}% (${used}MB/${total}MB)${NC}"
  fi
}

function check_disk() {
  while IFS= read -r line; do
    local usage mount
    usage=$(echo "$line" | awk '{print $5}' | tr -d '%')
    mount=$(echo "$line" | awk '{print $6}')
    if [[ $usage -ge $DISK_THRESHOLD ]]; then
      ISSUES+=("磁盘 $mount 使用率过高：${usage}%")
      echo -e "${RED}[WARN] 磁盘 $mount：${usage}%${NC}"
    else
      echo -e "${GREEN}[OK]   磁盘 $mount：${usage}%${NC}"
    fi
  done < <(df -h | awk 'NR>1 && $1 ~ /^\// {print}')
}

function check_load() {
  local load1
  load1=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | tr -d ' ')
  local load_int=${load1%.*}
  if (( load_int >= ${LOAD_THRESHOLD%.*} )); then
    ISSUES+=("系统负载过高：$load1（阈值 $LOAD_THRESHOLD）")
    echo -e "${RED}[WARN] 系统负载（1min）：$load1${NC}"
  else
    echo -e "${GREEN}[OK]   系统负载（1min）：$load1${NC}"
  fi
}

echo "========================================="
echo " 系统健康检查 - $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

check_cpu
check_memory
check_disk
check_load

echo "-----------------------------------------"
if [[ ${#ISSUES[@]} -eq 0 ]]; then
  echo -e "${GREEN}系统健康，所有指标正常${NC}"
else
  echo -e "${YELLOW}发现 ${#ISSUES[@]} 个告警：${NC}"
  for issue in "${ISSUES[@]}"; do
    echo -e "${RED}  ! $issue${NC}"
  done
  exit 1
fi
```

:::

## 六、cron 定时任务集成

`cron` 是 Linux 定时任务调度器，通过 `crontab` 配置执行规则。

### 1. crontab 语法

```
分钟 小时 日 月 星期 命令
│    │    │  │  │
│    │    │  │  └─ 0-7（0 和 7 都表示周日）
│    │    │  └──── 1-12
│    │    └─────── 1-31
│    └──────────── 0-23
└───────────────── 0-59
```

| 示例表达式 | 含义 |
|-----------|------|
| `0 2 * * *` | 每天凌晨 2:00 |
| `*/5 * * * *` | 每 5 分钟 |
| `0 0 * * 0` | 每周日午夜 |
| `0 6 1 * *` | 每月 1 日早上 6:00 |
| `30 8-18/2 * * 1-5` | 工作日 8:30 到 18:30 每 2 小时 |

### 2. 实际配置示例

::: details crontab 配置示例

```bash
# 编辑当前用户的 crontab
crontab -e

# 添加以下定时任务：
# 每天凌晨 2:00 执行备份（将输出写入日志）
0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1

# 每 5 分钟检查进程
*/5 * * * * /opt/scripts/health-check.sh >> /var/log/health.log 2>&1

# 每天凌晨 1:00 切割日志
0 1 * * * /opt/scripts/log-rotate.sh >> /var/log/rotate.log 2>&1

# 确保脚本在 PATH 正确的环境下运行
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
```

:::

::: tip cron 常见陷阱
- cron 运行环境的 `PATH` 与登录 Shell 不同，脚本中应使用**绝对路径**调用命令
- 将输出重定向到日志文件（`>> log 2>&1`），否则 cron 会尝试发送邮件
- 在脚本顶部加 `export HOME=/root` 或完整的环境变量，避免依赖用户配置
:::

## 七、脚本调试技巧

### 1. set 调试选项

| 选项 | 说明 |
|------|------|
| `set -e` | 遇到错误立即退出（errexit） |
| `set -u` | 使用未定义变量时报错（nounset） |
| `set -x` | 执行前打印每条命令（xtrace） |
| `set -o pipefail` | 管道中任一命令失败则整体失败 |
| `set +x` | 关闭 xtrace |

::: details 调试示例

```bash{2-3}
#!/usr/bin/env bash
set -euo pipefail   # 生产脚本标配
# set -x            # 调试时取消注释

# 选择性开启调试
debug_section() {
  set -x
  # 需要调试的代码...
  tar -czf backup.tar.gz /opt/app
  set +x
}
```

:::

### 2. trap — 错误捕获与清理

`trap` 用于捕获信号和脚本退出事件，实现优雅清理和错误定位。

::: details trap 使用示例

```bash{5-16}
#!/usr/bin/env bash
# 文件：scripts/deploy-with-trap.sh
set -euo pipefail

# 退出时清理临时文件
TEMP_DIR=""
cleanup() {
  local exit_code=$?
  if [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]]; then
    rm -rf "$TEMP_DIR"
    echo "已清理临时目录：$TEMP_DIR"
  fi
  if [[ $exit_code -ne 0 ]]; then
    echo "脚本异常退出（退出码：$exit_code），请检查日志" >&2
  fi
}
trap cleanup EXIT

# 捕获 Ctrl+C
trap 'echo ""; echo "用户中断，正在清理..."; exit 130' INT TERM

# 脚本主体
TEMP_DIR=$(mktemp -d)
echo "使用临时目录：$TEMP_DIR"

# 模拟工作
cp -r /opt/app "$TEMP_DIR/"
echo "处理完成"
# 退出时 cleanup 函数会自动执行
```

:::

### 3. 错误定位技巧

```bash
# 打印错误发生的行号（配合 set -e 使用）
trap 'echo "第 ${LINENO} 行发生错误：$BASH_COMMAND"' ERR

# 开启调试模式运行脚本（不修改脚本）
bash -x script.sh

# 只检查语法（不执行）
bash -n script.sh
```

## 八、参数解析（getopts）

`getopts` 是 Shell 内置的标准参数解析工具，支持短选项（`-v`、`-f file`）。

::: details getopts 完整示例

```bash
#!/usr/bin/env bash
# 文件：scripts/deploy-getopts.sh
# 用法：./deploy-getopts.sh -e prod -t v1.2.3 [-v] [-h]
set -euo pipefail

# 默认值
ENV="staging"
TAG="latest"
VERBOSE=false

usage() {
  cat <<EOF
用法：$0 [选项]

选项：
  -e ENV    部署环境（dev|staging|prod），默认 staging
  -t TAG    镜像标签，默认 latest
  -v        详细输出模式
  -h        显示帮助

示例：
  $0 -e prod -t v1.2.3
  $0 -e staging -v
EOF
}

# 解析参数（选项后跟 : 表示需要参数值）
while getopts ":e:t:vh" opt; do
  case "$opt" in
    e) ENV="$OPTARG" ;;
    t) TAG="$OPTARG" ;;
    v) VERBOSE=true ;;
    h) usage; exit 0 ;;
    :) echo "错误：选项 -$OPTARG 需要参数" >&2; usage; exit 1 ;;
    \?) echo "错误：未知选项 -$OPTARG" >&2; usage; exit 1 ;;
  esac
done
shift $((OPTIND - 1))  # 移除已处理的选项，$@ 保留剩余位置参数

# 参数验证
if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
  echo "错误：无效的环境参数：$ENV（可选：dev|staging|prod）" >&2
  exit 1
fi

$VERBOSE && echo "[VERBOSE] 部署环境：$ENV，镜像标签：$TAG"

echo "开始部署到 $ENV 环境，镜像标签：$TAG"
# 实际部署逻辑...
```

:::

::: tip 长选项支持
`getopts` 只支持短选项。若需要长选项（`--env`、`--tag`），可使用 `getopt`（外部命令）或手动解析 `$@`：
```bash
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)  ENV="$2"; shift 2 ;;
    --tag)  TAG="$2"; shift 2 ;;
    --verbose) VERBOSE=true; shift ;;
    *) echo "未知参数：$1"; exit 1 ;;
  esac
done
```
:::
