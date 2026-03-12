# 2.3 文件查找与搜索

## find：功能最强的文件查找

`find` 实时遍历目录树，功能强大但速度相对较慢。

### 基本语法

```
find <搜索路径> <条件> [<动作>]
```

### 按名称查找

```bash
# 在 /etc 下查找名为 nginx.conf 的文件
$ find /etc -name "nginx.conf"
/etc/nginx/nginx.conf

# 使用通配符（注意要加引号）
$ find /var/log -name "*.log"

# 不区分大小写
$ find /home -iname "readme*"

# 只查找文件（-type f）
$ find /etc -type f -name "*.conf"

# 只查找目录（-type d）
$ find /home -type d

# 查找软链接（-type l）
$ find /usr/bin -type l
```

### 按时间查找

```bash
# 查找最近 7 天内修改过的文件（-mtime: modify time）
$ find /var/log -mtime -7 -type f

# 查找 7 天前修改的文件
$ find /var/log -mtime +7 -type f

# 查找恰好 7 天前修改的文件
$ find /var/log -mtime 7 -type f

# 时间参数说明：
# -mtime  修改内容的时间
# -atime  最后访问时间
# -ctime  属性变更时间（权限、所有者等）
# -newer file  比指定文件更新
```

### 按大小查找

```bash
# 查找大于 100MB 的文件
$ find / -type f -size +100M

# 查找小于 1KB 的文件
$ find /etc -type f -size -1k

# 单位：c(字节) k(KB) M(MB) G(GB)

# 实际用途：找出占用磁盘空间的大文件
$ find / -type f -size +500M 2>/dev/null
```

### 按权限和所有者查找

```bash
# 查找属于特定用户的文件
$ find /home -user john

# 查找特定权限的文件
$ find /etc -perm 644     # 精确匹配 644
$ find /etc -perm -644    # 至少有这些权限

# 查找 SUID 文件（安全审计常用）
$ find / -perm -4000 -type f 2>/dev/null

# 查找所有者不存在的文件（孤立文件）
$ find / -nouser 2>/dev/null
```

### 对查找结果执行操作

```bash
# -exec：对每个找到的文件执行命令
# {} 代表当前文件，\; 表示命令结束
$ find /tmp -name "*.tmp" -exec rm {} \;

# -delete：直接删除（比 -exec rm 更高效）
$ find /tmp -name "*.tmp" -mtime +7 -delete

# 查找并统计行数
$ find . -name "*.js" -exec wc -l {} \;

# 查找并复制到某个目录
$ find . -name "*.conf" -exec cp {} /backup/ \;

# 使用 xargs（处理大量文件时更高效）
$ find . -name "*.log" | xargs rm
$ find . -name "*.py" | xargs grep "TODO"
```

### 多条件组合

```bash
# AND（默认）：两个条件都满足
$ find /etc -name "*.conf" -size +1k

# OR：满足其中一个条件（-o 或 -or）
$ find . -name "*.jpg" -o -name "*.png"

# NOT：不满足条件（! 或 -not）
$ find . -not -name "*.log"
$ find . ! -name "*.log"

# 复杂组合（用括号分组，括号需要转义）
$ find . \( -name "*.jpg" -o -name "*.png" \) -size +1M
```

---

## locate：快速查找文件名

`locate` 基于数据库搜索，速度极快，但数据库不是实时更新的（通常每天自动更新一次）。

```bash
# 安装（Ubuntu）
$ sudo apt install mlocate

# 手动更新数据库
$ sudo updatedb

# 查找文件
$ locate nginx.conf
/etc/nginx/nginx.conf
/usr/share/doc/nginx/nginx.conf.example

# 不区分大小写
$ locate -i readme

# 只显示实际存在的文件（排除已删除的）
$ locate -e nginx.conf

# 限制结果数量
$ locate -l 10 "*.log"
```

**find vs locate 的选择：**

| 场景 | 推荐 |
|------|------|
| 需要实时结果 | `find` |
| 按属性（大小、时间、权限）过滤 | `find` |
| 只知道文件名，快速查找 | `locate` |
| 大范围搜索整个文件系统 | `locate`（更快） |

---

## which / whereis：查找命令位置

```bash
# 查找命令的可执行文件路径
$ which python3
/usr/bin/python3

$ which nginx
/usr/sbin/nginx

# 查找命令的二进制文件、源码和手册
$ whereis nginx
nginx: /usr/sbin/nginx /usr/lib/nginx /etc/nginx /usr/share/nginx /usr/share/man/man8/nginx.8.gz

# 查看命令是内置命令还是外部程序
$ type cd
cd is a shell builtin

$ type ls
ls is aliased to `ls --color=auto`

$ type nginx
nginx is /usr/sbin/nginx
```

---

## 实战场景

### 场景1：清理旧日志

```bash
# 删除 /var/log 下超过 30 天的 .log 文件
$ find /var/log -name "*.log" -mtime +30 -type f -delete

# 先预览（不实际删除）
$ find /var/log -name "*.log" -mtime +30 -type f -ls
```

### 场景2：找出占用磁盘的大文件

```bash
# 查找大于 100MB 的文件并排序
$ find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null | sort -k5 -rh | head -20
```

### 场景3：批量修改文件权限

```bash
# 将某目录下所有 .sh 文件加上可执行权限
$ find ./scripts -name "*.sh" -exec chmod +x {} \;
```

### 场景4：查找包含特定内容的文件

```bash
# 在当前目录的所有 .conf 文件中查找包含 "port 80" 的文件
$ find . -name "*.conf" -exec grep -l "port 80" {} \;

# 或者用 grep 的 -r（推荐，更简洁）
$ grep -r "port 80" --include="*.conf" .
```
