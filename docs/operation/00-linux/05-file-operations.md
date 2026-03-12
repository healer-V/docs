# 2.2 文件与目录操作

## 创建文件和目录

```bash
# 创建空文件（或更新文件时间戳）
$ touch file.txt
$ touch file1.txt file2.txt file3.txt    # 同时创建多个

# 创建目录
$ mkdir mydir
$ mkdir dir1 dir2 dir3                   # 同时创建多个

# 创建多层目录（-p 参数，parent 的缩写）
$ mkdir -p project/src/components
# 即使 project、project/src 不存在也会一并创建

# 创建有内容的文件
$ echo "Hello Linux" > hello.txt
$ cat > config.txt << EOF
server=localhost
port=8080
EOF
```

---

## 复制：cp

```bash
# 基本格式：cp <源> <目标>
$ cp file.txt backup.txt              # 复制文件
$ cp file.txt /tmp/                   # 复制到目录（文件名不变）
$ cp file.txt /tmp/newname.txt        # 复制并重命名

# 复制目录（必须加 -r，recursive 递归）
$ cp -r mydir/ /tmp/mydir_backup

# 实用选项
$ cp -i file.txt dest.txt    # -i 交互式，目标存在时询问是否覆盖
$ cp -v file.txt dest.txt    # -v 显示复制过程（verbose）
$ cp -p file.txt dest.txt    # -p 保留原文件的权限和时间戳
$ cp -u file.txt dest.txt    # -u 只在源比目标新时才复制（update）

# 实际工作中常用的组合
$ cp -rp /etc/nginx/ /backup/nginx_$(date +%Y%m%d)/
```

---

## 移动和重命名：mv

`mv` 命令既用于移动文件，也用于重命名（本质是同一个操作）：

```bash
# 重命名文件
$ mv oldname.txt newname.txt

# 移动文件到目录
$ mv file.txt /tmp/

# 移动并重命名
$ mv file.txt /tmp/newname.txt

# 移动目录（不需要 -r，直接移动整个目录）
$ mv mydir/ /opt/mydir

# 批量重命名（结合通配符）
$ mv *.txt /backup/

# -i 交互式，目标存在时询问
$ mv -i file.txt existing.txt

# -v 显示移动过程
$ mv -v *.log /var/log/archive/
```

---

## 删除：rm

::: danger rm 没有回收站
Linux 命令行删除的文件**不会进回收站**，无法撤销。操作前请确认！
:::

```bash
# 删除文件
$ rm file.txt

# -i 删除前询问确认（养成好习惯）
$ rm -i important.txt
rm: remove regular file 'important.txt'? y

# 删除目录（必须加 -r）
$ rm -r mydir/

# 强制删除，不询问（谨慎使用）
$ rm -rf /tmp/cache/

# 常见危险操作（永远不要执行！）
# rm -rf /          ← 删除整个系统
# rm -rf /*         ← 同上
# rm -rf ~/         ← 删除自己的 home 目录
```

**安全删除的好习惯：**

```bash
# 删除前先用 ls 确认匹配的文件
$ ls *.log
access.log  error.log  debug.log

# 确认无误后再删除
$ rm *.log

# 或者用 echo rm 先预览（dry run）
$ echo rm -rf /tmp/cache/
rm -rf /tmp/cache/
```

---

## 查看文件内容

```bash
# cat：显示全部内容（小文件）
$ cat /etc/hosts

# cat 加行号
$ cat -n /etc/nginx/nginx.conf

# less：分页查看（大文件推荐）
$ less /var/log/syslog
# less 内的快捷键：
#   q        退出
#   空格/f   下一页
#   b        上一页
#   g/G      跳到开头/结尾
#   /keyword 向下搜索
#   ?keyword 向上搜索
#   n/N      下一个/上一个匹配

# head/tail：查看头尾
$ head -50 /var/log/syslog       # 前 50 行
$ tail -100 /var/log/syslog      # 最后 100 行
$ tail -f /var/log/nginx/access.log    # 实时跟踪（Ctrl+C 退出）

# 同时跟踪多个文件
$ tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

---

## 链接：软链接与硬链接

### 软链接（Symbolic Link）

类似 Windows 的快捷方式，指向目标文件的路径：

```bash
# 创建软链接：ln -s <目标> <链接名>
$ ln -s /usr/local/node/bin/node /usr/bin/node

# 查看链接
$ ls -la /usr/bin/node
lrwxrwxrwx 1 root root 28 Jan 10 node -> /usr/local/node/bin/node

# 常见用途：版本切换
$ ln -s /opt/python3.10/bin/python3 /usr/local/bin/python3
```

### 硬链接（Hard Link）

与原文件共享相同的数据块，删除其中一个不影响另一个：

```bash
# 创建硬链接
$ ln original.txt hardlink.txt

# 硬链接数会增加
$ ls -l original.txt
-rw-r--r-- 2 john john 1234 Jan 10 original.txt
#           ↑ 链接数为 2

# 硬链接的限制：
# 1. 不能跨文件系统
# 2. 不能链接到目录
```

---

## 文件压缩与归档

### tar（最常用）

```bash
# 压缩（创建 .tar.gz 归档）
# -c 创建  -z 使用gzip  -v 显示过程  -f 指定文件名
$ tar -czvf backup.tar.gz /home/john/

# 解压 .tar.gz
$ tar -xzvf backup.tar.gz

# 解压到指定目录
$ tar -xzvf backup.tar.gz -C /tmp/

# 查看归档内容（不解压）
$ tar -tzvf backup.tar.gz

# 常见后缀对应命令：
# .tar.gz 或 .tgz  → tar -xzvf
# .tar.bz2         → tar -xjvf
# .tar.xz          → tar -xJvf
# .tar             → tar -xvf
```

### zip / unzip

```bash
# 压缩为 zip
$ zip -r archive.zip mydir/

# 解压 zip
$ unzip archive.zip

# 解压到指定目录
$ unzip archive.zip -d /tmp/output

# 查看 zip 内容
$ unzip -l archive.zip
```

---

## 文件对比

```bash
# 对比两个文件的差异
$ diff file1.txt file2.txt
< 这是第3行（只在 file1 中）
---
> 这是第3行，有修改（只在 file2 中）

# 更直观的对比
$ diff -u file1.txt file2.txt    # unified 格式（类似 git diff）
$ diff -y file1.txt file2.txt    # 并排对比

# 对比目录
$ diff -r dir1/ dir2/
```

---

## 快速参考

| 操作 | 命令 |
|------|------|
| 创建文件 | `touch file.txt` |
| 创建目录 | `mkdir -p dir/subdir` |
| 复制文件 | `cp -i src dest` |
| 复制目录 | `cp -rp srcdir/ destdir/` |
| 移动/重命名 | `mv old new` |
| 删除文件 | `rm -i file` |
| 删除目录 | `rm -ri dir/` |
| 查看文件 | `less bigfile` / `cat smallfile` |
| 实时日志 | `tail -f logfile` |
| 压缩 | `tar -czvf out.tar.gz dir/` |
| 解压 | `tar -xzvf file.tar.gz` |
| 软链接 | `ln -s target linkname` |
