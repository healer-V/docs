---
title: "日志管理"
category: "运维 · Nginx"
tags:
  - Nginx
  - 日志
  - 监控
excerpt: "Nginx 的访问日志和错误日志是排查问题、分析流量和监控性能的核心数据来源。"
date: 2026-03-15
---

# 日志管理

日志是 Nginx 运维中不可或缺的一环。无论是排查线上故障、分析用户行为，还是监控服务性能，你都需要依赖完善的日志配置。Nginx 提供了访问日志（Access Log）和错误日志（Error Log）两种日志体系，支持灵活的格式自定义和输出控制。

## 一、访问日志

访问日志记录了每一个客户端请求的详细信息，是流量分析和问题定位的第一手数据。

### 1. access_log 指令

`access_log` 指令用于指定日志文件路径和使用的日志格式。

::: details 基础访问日志配置
```nginx
# /etc/nginx/nginx.conf

http {
    # 使用默认的 combined 格式
    access_log /var/log/nginx/access.log combined;

    # 也可以关闭访问日志（不推荐在生产环境使用）
    # access_log off;
}
```
:::

### 2. 默认的 combined 格式

Nginx 内置的 `combined` 格式与 Apache 的日志格式兼容，包含了最常用的请求信息：

::: details combined 格式定义
```nginx
# Nginx 内置定义，无需手动声明
log_format combined '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent"';
```
:::

输出示例：

```
192.168.1.100 - - [15/Mar/2026:10:30:15 +0800] "GET /api/products HTTP/1.1" 200 1256 "https://shop.example.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
```

## 二、自定义日志格式

默认的 `combined` 格式无法满足所有需求。你可以通过 `log_format` 指令定义自己的日志格式，添加响应时间、上游延迟等关键指标。

### 1. 常用日志变量

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `$remote_addr` | 客户端 IP 地址 | `192.168.1.100` |
| `$time_local` | 本地时间 | `15/Mar/2026:10:30:15 +0800` |
| `$request` | 完整请求行 | `GET /api/products HTTP/1.1` |
| `$status` | HTTP 响应状态码 | `200` |
| `$body_bytes_sent` | 响应体大小（字节） | `1256` |
| `$http_referer` | 来源页面 URL | `https://shop.example.com/` |
| `$http_user_agent` | 客户端 User-Agent | `Mozilla/5.0 ...` |
| `$request_time` | 请求处理总耗时（秒） | `0.038` |
| `$upstream_response_time` | 上游服务器响应耗时（秒） | `0.035` |
| `$upstream_addr` | 上游服务器地址 | `127.0.0.1:3000` |
| `$request_length` | 请求总长度（含头部） | `512` |
| `$connection` | 连接序号 | `1234` |
| `$connection_requests` | 当前连接上的请求数 | `3` |

### 2. 自定义格式示例

::: details 包含性能指标的自定义格式
```nginx{3-8}
# /etc/nginx/nginx.conf

http {
    log_format main_ext '$remote_addr - $remote_user [$time_local] '
                        '"$request" $status $body_bytes_sent '
                        '"$http_referer" "$http_user_agent" '
                        'rt=$request_time urt=$upstream_response_time '
                        'ua=$upstream_addr';

    access_log /var/log/nginx/access.log main_ext;
}
```
:::

输出示例：

```
192.168.1.100 - - [15/Mar/2026:10:30:15 +0800] "POST /api/orders HTTP/1.1" 201 384 "https://shop.example.com/cart" "Mozilla/5.0 ..." rt=0.125 urt=0.120 ua=127.0.0.1:3000
```

## 三、JSON 格式日志

如果你使用 ELK（Elasticsearch + Logstash + Kibana）、Loki 或其他日志分析平台，JSON 格式的日志更容易被解析和索引。

::: details JSON 格式日志配置
```nginx{3-18}
# /etc/nginx/nginx.conf

http {
    log_format json_log escape=json
        '{'
            '"time": "$time_iso8601",'
            '"remote_addr": "$remote_addr",'
            '"request_method": "$request_method",'
            '"request_uri": "$request_uri",'
            '"status": $status,'
            '"body_bytes_sent": $body_bytes_sent,'
            '"http_referer": "$http_referer",'
            '"http_user_agent": "$http_user_agent",'
            '"request_time": $request_time,'
            '"upstream_response_time": "$upstream_response_time",'
            '"upstream_addr": "$upstream_addr",'
            '"server_name": "$server_name"'
        '}';

    access_log /var/log/nginx/access.json json_log;
}
```
:::

输出示例：

```json
{
  "time": "2026-03-15T10:30:15+08:00",
  "remote_addr": "192.168.1.100",
  "request_method": "POST",
  "request_uri": "/api/orders",
  "status": 201,
  "body_bytes_sent": 384,
  "http_referer": "https://shop.example.com/cart",
  "http_user_agent": "Mozilla/5.0 ...",
  "request_time": 0.125,
  "upstream_response_time": "0.120",
  "upstream_addr": "127.0.0.1:3000",
  "server_name": "api.example.com"
}
```

::: tip 提示
`escape=json` 参数（Nginx 1.11.8+）会自动转义 JSON 特殊字符，避免日志解析出错。
:::

## 四、错误日志

错误日志记录 Nginx 运行过程中遇到的问题，包括配置错误、上游连接失败和权限问题等。

### 1. error_log 指令

::: details 错误日志配置
```nginx
# /etc/nginx/nginx.conf

# 全局错误日志
error_log /var/log/nginx/error.log warn;

# 也可以在 server 或 location 中单独设置
server {
    listen 80;
    server_name api.example.com;
    error_log /var/log/nginx/api_error.log error;
}
```
:::

### 2. 日志级别

错误日志有 8 个级别，从上到下严重程度递增，配置某一级别后，该级别及更严重的日志都会被记录。

| 级别 | 说明 | 适用场景 |
|------|------|----------|
| `debug` | 调试信息，最详细 | 开发/排查疑难问题（需编译时启用） |
| `info` | 一般信息 | 开发环境 |
| `notice` | 正常但值得关注的事件 | 测试环境 |
| `warn` | 警告信息 | **生产环境推荐** |
| `error` | 处理请求时的错误 | 生产环境（仅关注错误） |
| `crit` | 严重错误 | 关键告警 |
| `alert` | 需要立即处理的问题 | 紧急告警 |
| `emerg` | 系统不可用 | 灾难级告警 |

::: warning 注意
`debug` 级别需要在编译 Nginx 时加上 `--with-debug` 参数。生产环境建议使用 `warn` 或 `error` 级别，避免日志量过大影响磁盘 I/O。
:::

## 五、条件日志

在高流量场景下，你可能希望过滤掉某些无意义的请求日志（如健康检查、静态资源请求），减少日志量。

### 1. 使用 map 过滤日志

::: details 过滤健康检查和静态文件日志
```nginx{3-8,14}
# /etc/nginx/nginx.conf

http {
    # 定义条件变量：匹配需要排除的请求
    map $request_uri $loggable {
        ~*^/health     0;   # 健康检查接口
        ~*^/ping       0;   # 探活接口
        ~*\.(gif|ico)$ 0;   # 小图标文件
        default        1;   # 其他请求正常记录
    }

    server {
        listen 80;

        # 当 $loggable 为 0 时不记录日志
        access_log /var/log/nginx/access.log combined if=$loggable;
    }
}
```
:::

### 2. 按状态码过滤

::: details 仅记录错误请求日志
```nginx
http {
    map $status $log_errors_only {
        ~^[23] 0;    # 2xx 和 3xx 不记录
        default 1;   # 4xx 和 5xx 记录
    }

    server {
        access_log /var/log/nginx/error_requests.log combined if=$log_errors_only;
    }
}
```
:::

## 六、日志轮转

Nginx 不会自动分割日志文件。在高流量服务器上，日志文件可能增长到数 GB 甚至数十 GB，影响磁盘空间和日志分析效率。你需要配置 `logrotate` 来定期轮转日志。

### 1. logrotate 配置

::: details logrotate 配置文件
```bash
# /etc/logrotate.d/nginx

/var/log/nginx/*.log {
    daily                # 每天轮转
    missingok            # 日志不存在时不报错
    rotate 30            # 保留 30 天
    compress             # 压缩旧日志
    delaycompress        # 延迟一天压缩（方便查看昨天的日志）
    notifempty           # 空文件不轮转
    create 0644 nginx nginx  # 新文件权限
    sharedscripts        # 所有日志轮转完后统一执行脚本

    postrotate
        # 向 Nginx 发送 USR1 信号，重新打开日志文件
        [ -f /var/run/nginx.pid ] && kill -USR1 $(cat /var/run/nginx.pid)
    endscript
}
```
:::

### 2. 信号机制

Nginx 使用信号来控制日志文件的重新打开：

| 信号 | 命令 | 说明 |
|------|------|------|
| `USR1` | `kill -USR1 $(cat /var/run/nginx.pid)` | 重新打开日志文件 |
| `HUP` | `nginx -s reload` | 重新加载配置 |

::: tip 提示
轮转日志的关键步骤是：先将旧文件重命名，然后发送 `USR1` 信号让 Nginx 打开新文件。如果顺序颠倒，可能导致日志丢失。
:::

## 七、按 Server/Location 配置日志

你可以为不同的虚拟主机或路径配置独立的日志文件，便于分类管理和分析。

### 1. 按 Server 分离日志

::: details 按虚拟主机分离日志
```nginx
# /etc/nginx/conf.d/shop.conf
server {
    listen 80;
    server_name shop.example.com;

    access_log /var/log/nginx/shop_access.log main_ext;
    error_log /var/log/nginx/shop_error.log warn;

    # ...
}

# /etc/nginx/conf.d/admin.conf
server {
    listen 80;
    server_name admin.example.com;

    access_log /var/log/nginx/admin_access.log main_ext;
    error_log /var/log/nginx/admin_error.log warn;

    # ...
}
```
:::

### 2. 按 Location 配置日志

::: details 按路径分离日志
```nginx
server {
    listen 80;
    server_name api.example.com;

    # API 请求使用详细日志格式
    location /api/ {
        access_log /var/log/nginx/api_access.log json_log;
        proxy_pass http://backend_server;
    }

    # 静态文件使用简单格式
    location /static/ {
        access_log /var/log/nginx/static_access.log combined;
        root /var/www;
    }

    # 健康检查关闭日志
    location = /health {
        access_log off;
        return 200 "ok";
    }
}
```
:::

## 八、关闭特定路径的日志

对于高频但低价值的请求（如健康检查、favicon），关闭日志可以减少磁盘 I/O。

::: details 关闭特定路径日志
```nginx
server {
    listen 80;
    server_name app.example.com;

    # 健康检查 —— 关闭访问日志
    location = /health {
        access_log off;
        return 200 "ok";
    }

    # favicon —— 关闭日志且不报 404 错误
    location = /favicon.ico {
        access_log off;
        log_not_found off;
        return 204;
    }

    # robots.txt
    location = /robots.txt {
        access_log off;
        log_not_found off;
    }
}
```
:::

## 九、日志分析工具

拥有了完善的日志之后，你还需要高效的工具来分析它们。

### 1. GoAccess 实时报告

GoAccess 是一个终端下的实时日志分析工具，支持生成 HTML 报告。

::: details GoAccess 使用示例
```bash
# 安装 GoAccess
# Ubuntu/Debian
sudo apt install goaccess

# CentOS/RHEL
sudo yum install goaccess

# 终端实时分析
goaccess /var/log/nginx/access.log --log-format=COMBINED

# 生成 HTML 报告
goaccess /var/log/nginx/access.log \
    --log-format=COMBINED \
    -o /var/www/html/report.html \
    --real-time-html
```
:::

### 2. awk 快速统计

当你不需要安装额外工具时，`awk` 可以完成大部分日志统计需求。

::: details awk 日志分析命令集
```bash
# 统计 Top 10 访问 IP
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# 统计 HTTP 状态码分布
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# 统计每小时请求量
awk '{print substr($4, 2, 14)}' /var/log/nginx/access.log | sort | uniq -c

# 查找响应时间超过 1 秒的慢请求（需使用 main_ext 格式）
awk -F'rt=' '{if($2+0 > 1) print $0}' /var/log/nginx/access.log

# 统计请求量最大的 URL（Top 20）
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# 统计特定时间段的 5xx 错误
awk '$9 ~ /^5/ && $4 ~ /15\/Mar\/2026:1[0-2]/' /var/log/nginx/access.log
```
:::

## 十、实战分析场景

### 1. 定位慢请求

当用户反馈接口响应慢时，你可以通过日志快速定位瓶颈所在。

::: details 慢请求分析
```bash
# 找出响应时间 Top 10 的请求（需使用包含 request_time 的日志格式）
awk -F'rt=' '{split($2,a," "); print a[1], $1}' /var/log/nginx/access.log \
    | sort -rn | head -10

# 分析某个接口的响应时间分布
awk '/POST \/api\/orders/ {
    match($0, /rt=([0-9.]+)/, arr);
    if(arr[1]+0 < 0.1) fast++;
    else if(arr[1]+0 < 0.5) normal++;
    else if(arr[1]+0 < 1) slow++;
    else very_slow++;
}
END {
    print "< 100ms:", fast;
    print "100-500ms:", normal;
    print "500ms-1s:", slow;
    print "> 1s:", very_slow;
}' /var/log/nginx/access.log
```
:::

### 2. 异常流量检测

::: details 异常流量分析
```bash
# 检测短时间内请求量异常的 IP（每分钟超过 100 次）
awk '{print $1, substr($4, 2, 17)}' /var/log/nginx/access.log \
    | sort | uniq -c | sort -rn \
    | awk '$1 > 100 {print}'

# 查找疑似爬虫的 User-Agent
awk -F'"' '{print $6}' /var/log/nginx/access.log \
    | sort | uniq -c | sort -rn | head -20

# 统计 404 错误最多的 URL
awk '$9 == 404 {print $7}' /var/log/nginx/access.log \
    | sort | uniq -c | sort -rn | head -10
```
:::

::: danger 生产环境注意
- 日志文件务必配置 logrotate 轮转，避免磁盘写满导致服务中断。
- JSON 格式日志虽然方便解析，但体积比普通格式大 30%–50%，注意磁盘空间。
- 敏感信息（如用户 Token、密码参数）不应出现在日志中，必要时使用 `map` 脱敏处理。
:::
