---
title: "6.1 网络管理与诊断"
category: "运维 · Linux"
tags:
  - Linux
---

# 6.1 网络管理与诊断

## 网络基础概念

```
你的服务器的网络栈：
┌──────────────────────────────────┐
│   应用层（nginx、sshd、mysql）     │  ← 监听在某个端口
├──────────────────────────────────┤
│   传输层（TCP / UDP）             │  ← 端口号在这一层
├──────────────────────────────────┤
│   网络层（IP）                    │  ← IP 地址在这一层
├──────────────────────────────────┤
│   数据链路层（以太网）             │  ← MAC 地址在这一层
├──────────────────────────────────┤
│   物理层（网卡、网线）             │
└──────────────────────────────────┘
```

---

## 查看网络配置

```bash
# 查看所有网络接口（推荐使用 ip 命令，ifconfig 已过时）
$ ip addr show
# 或简写
$ ip a

1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536
    inet 127.0.0.1/8 scope host lo        ← 回环接口
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet 192.168.1.100/24 brd 192.168.1.255 ← 实际 IP 和子网掩码

# 查看路由表
$ ip route show
default via 192.168.1.1 dev eth0    ← 默认网关
192.168.1.0/24 dev eth0             ← 直连网段

# 查看 DNS 配置
$ cat /etc/resolv.conf
nameserver 8.8.8.8
nameserver 114.114.114.114
```

---

## 网络诊断工具

### ping - 测试连通性

```bash
# 基本用法（Ctrl+C 停止）
$ ping google.com

# 只发 4 次（-c count）
$ ping -c 4 google.com

# 指定间隔（-i，默认 1 秒）
$ ping -i 0.2 192.168.1.1    # 每 0.2 秒发一次

# 指定包大小（-s，默认 56 字节）
$ ping -s 1400 192.168.1.1

# 诊断思路：
# 能 ping 通网关    → 局域网正常
# 能 ping 通 8.8.8.8 → 互联网连通
# 能 ping IP 但不能 ping 域名 → DNS 问题
```

### traceroute - 路由追踪

```bash
# 查看数据包经过的路由节点
$ traceroute google.com
traceroute to google.com (142.250.80.46)
 1  192.168.1.1     1.234 ms    ← 家庭路由器
 2  10.0.0.1        5.678 ms    ← 运营商
 3  * * *                       ← 某节点不响应（正常）
 4  142.250.80.46  30.123 ms   ← 目标

# 使用 TCP 包（有时 UDP 被防火墙屏蔽）
$ traceroute -T -p 80 google.com

# mtr：traceroute + ping 的组合，实时刷新
$ sudo apt install mtr
$ mtr google.com
```

### curl - HTTP 请求调试

```bash
# 发起 GET 请求
$ curl https://api.example.com/users

# 查看完整的 HTTP 头信息（-I 只看头，-v 看全部）
$ curl -I https://www.google.com
$ curl -v https://api.example.com

# POST 请求
$ curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"john","age":30}' \
  https://api.example.com/users

# 带认证的请求
$ curl -H "Authorization: Bearer <token>" https://api.example.com

# 下载文件
$ curl -O https://example.com/file.zip          # 保留原文件名
$ curl -o myfile.zip https://example.com/file.zip  # 指定文件名
$ curl -L -O https://example.com/file.zip      # 跟随重定向

# 显示请求和响应头（调试常用）
$ curl -sv https://api.example.com 2>&1 | less

# 测试接口响应时间
$ curl -o /dev/null -s -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTotal: %{time_total}s\n" https://example.com

# 跳过 SSL 证书验证（测试环境）
$ curl -k https://self-signed.example.com
```

### wget - 下载文件

```bash
# 下载文件
$ wget https://example.com/file.tar.gz

# 后台下载（-b）
$ wget -b https://example.com/bigfile.tar.gz

# 断点续传（-c）
$ wget -c https://example.com/bigfile.tar.gz

# 限速（避免占满带宽）
$ wget --limit-rate=1m https://example.com/file.tar.gz

# 镜像网站（-r 递归，-l 深度）
$ wget -r -l 2 https://docs.example.com
```

### netstat / ss - 查看端口和连接

```bash
# ss 是 netstat 的现代替代品（更快）

# 查看所有监听的端口（重要！部署后用这个验证服务是否启动）
$ ss -tlnp
State  Recv-Q Send-Q  Local Address:Port  Process
LISTEN 0      128     0.0.0.0:22         sshd
LISTEN 0      511     0.0.0.0:80         nginx
LISTEN 0      128     127.0.0.1:3306     mysqld

# 查看已建立的 TCP 连接
$ ss -tn state established

# 查看某个进程的连接
$ ss -tp | grep nginx

# 查看某个端口被哪个进程占用
$ ss -tlnp | grep :80
# 或者
$ lsof -i :80
COMMAND   PID     USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
nginx   12345     root    6u  IPv4   12345      0t0  TCP *:80 (LISTEN)
```

---

## DNS 诊断

```bash
# 查询域名解析
$ nslookup google.com
$ nslookup google.com 8.8.8.8    # 指定 DNS 服务器查询

# 更详细的 DNS 查询工具
$ dig google.com
$ dig google.com @8.8.8.8        # 指定 DNS 服务器
$ dig google.com MX              # 查询 MX 记录（邮件服务器）
$ dig +short google.com           # 只显示结果

# 查看 DNS 解析路径
$ dig +trace google.com

# 本地 hosts 文件（优先于 DNS）
$ cat /etc/hosts
127.0.0.1   localhost
192.168.1.100  myserver.local
```

---

## SSH 远程连接

```bash
# 基本连接
$ ssh user@hostname
$ ssh user@192.168.1.100

# 指定端口（默认 22）
$ ssh -p 2222 user@hostname

# 使用私钥文件
$ ssh -i ~/.ssh/my_key.pem user@hostname

# SSH 端口转发（本地端口转发）
# 将本地 8080 转发到远程服务器的 localhost:3000
$ ssh -L 8080:localhost:3000 user@server
# 之后访问 http://localhost:8080 等于访问服务器的 :3000

# SSH 端口转发（远程端口转发）
# 将远程服务器的 8080 转发到本地的 localhost:3000
$ ssh -R 8080:localhost:3000 user@server

# 动态端口转发（SOCKS5 代理）
$ ssh -D 1080 user@server

# 在后台运行 SSH 隧道
$ ssh -fN -L 8080:localhost:3000 user@server
```

### SSH 配置文件

```bash
# ~/.ssh/config - 免记参数的好方法
$ cat ~/.ssh/config
Host myserver
    HostName 192.168.1.100
    User john
    Port 2222
    IdentityFile ~/.ssh/my_key.pem

Host staging
    HostName staging.example.com
    User deploy
    ForwardAgent yes

# 之后直接用别名连接
$ ssh myserver
$ ssh staging
```

---

## 防火墙管理

### UFW（Ubuntu 简化防火墙）

```bash
# 查看状态
$ sudo ufw status verbose

# 启用/禁用
$ sudo ufw enable
$ sudo ufw disable

# 允许/拒绝端口
$ sudo ufw allow 22         # 允许 SSH
$ sudo ufw allow 80/tcp     # 允许 HTTP
$ sudo ufw allow 443/tcp    # 允许 HTTPS
$ sudo ufw deny 3306        # 拒绝 MySQL 公网访问

# 允许特定 IP 访问特定端口
$ sudo ufw allow from 192.168.1.0/24 to any port 3306

# 删除规则
$ sudo ufw delete allow 80

# 查看规则列表（带编号）
$ sudo ufw status numbered

# 应用预设规则（常用服务）
$ sudo ufw allow "Nginx Full"   # HTTP + HTTPS
$ sudo ufw allow "OpenSSH"
```

### firewalld（CentOS/RHEL）

```bash
# 查看状态
$ sudo firewall-cmd --state

# 查看活动 zone 和规则
$ sudo firewall-cmd --list-all

# 永久开放端口（--permanent 使规则持久化）
$ sudo firewall-cmd --permanent --add-port=80/tcp
$ sudo firewall-cmd --permanent --add-port=443/tcp

# 添加服务
$ sudo firewall-cmd --permanent --add-service=http
$ sudo firewall-cmd --permanent --add-service=https

# 重新加载（使 --permanent 的规则生效）
$ sudo firewall-cmd --reload

# 只允许特定 IP 访问端口
$ sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.100" port port="3306" protocol="tcp" accept'
```
