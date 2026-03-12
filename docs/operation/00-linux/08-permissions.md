# 3.2 文件权限详解

## 权限模型概览

Linux 的权限基于三个维度：**谁**可以对文件做**什么操作**。

```
-  rwx  rw-  r--
↑   ↑    ↑    ↑
类型 所有者 所属组 其他人

文件类型：- 普通文件  d 目录  l 软链接
rwx：读(r=4) 写(w=2) 执行(x=1)
```

用 `ls -l` 看权限：

```bash
$ ls -l
-rwxr-xr-x 1 john sudo  8192 Jan 10 app
drwxr-x--- 2 john john  4096 Jan 10 private/
-rw-r--r-- 1 root root  1234 Jan 10 config.txt
lrwxrwxrwx 1 root root    15 Jan 10 link -> /usr/bin/python3
```

---

## 权限的含义

对**文件**和**目录**，rwx 的含义不同：

| 权限 | 对文件 | 对目录 |
|------|--------|--------|
| `r` (读) | 查看文件内容 | 列出目录内容（`ls`） |
| `w` (写) | 修改文件内容 | 在目录中创建/删除文件 |
| `x` (执行) | 将文件作为程序运行 | 进入目录（`cd`）并访问其中文件 |

::: tip 目录的 x 权限容易被忽略
即使你有目录的 `r` 权限（能 `ls` 看到文件名），如果没有 `x` 权限，也无法 `cd` 进入目录或读取里面的文件内容。
:::

---

## chmod：修改权限

### 数字模式（最常用）

将 rwx 转换为数字：`r=4`，`w=2`，`x=1`，相加得到权限值。

```
rwx = 4+2+1 = 7
rw- = 4+2+0 = 6
r-x = 4+0+1 = 5
r-- = 4+0+0 = 4
--- = 0+0+0 = 0
```

常见权限值对照：

| 数字 | 权限 | 说明 |
|------|------|------|
| `755` | `rwxr-xr-x` | 可执行文件，所有人可读可执行，只有所有者可写 |
| `644` | `rw-r--r--` | 普通文件，所有者可读写，其他人只读 |
| `700` | `rwx------` | 私有可执行文件，只有所有者能访问 |
| `600` | `rw-------` | 私有文件，只有所有者能读写（SSH 密钥文件要求此权限） |
| `777` | `rwxrwxrwx` | 所有人可读写执行（非常危险，不要在生产环境使用） |

```bash
# 设置文件权限
$ chmod 755 script.sh     # 脚本文件常用
$ chmod 644 config.txt    # 配置文件常用
$ chmod 600 ~/.ssh/id_rsa # SSH 私钥必须是 600

# 递归修改目录下所有文件
$ chmod -R 755 /var/www/html/

# 分别设置目录和文件的权限（配合 find 使用）
$ find /var/www -type d -exec chmod 755 {} \;   # 目录 755
$ find /var/www -type f -exec chmod 644 {} \;   # 文件 644
```

### 符号模式（更直观）

```bash
# 格式：chmod [ugoa][+-=][rwx] file

# u=user（所有者）  g=group（所属组）  o=other（其他人）  a=all（全部）
# + 添加权限  - 移除权限  = 设置权限

# 给所有者添加执行权限
$ chmod u+x script.sh

# 移除其他人的写权限
$ chmod o-w public.txt

# 设置组的权限为读
$ chmod g=r config.txt

# 组合操作
$ chmod u+x,g-w,o-r file.txt

# 给所有人加执行权限（常用）
$ chmod a+x script.sh
# 等同于
$ chmod +x script.sh
```

---

## chown：修改所有者和所属组

```bash
# 修改文件所有者
$ sudo chown alice file.txt

# 修改文件所有者和所属组
$ sudo chown alice:developers file.txt

# 只修改所属组
$ sudo chown :developers file.txt
# 或者用 chgrp
$ sudo chgrp developers file.txt

# 递归修改目录下所有文件
$ sudo chown -R alice:developers /var/www/project/

# 常见场景：部署 Web 应用后设置正确所有者
$ sudo chown -R www-data:www-data /var/www/html/
```

---

## 特殊权限

### SUID（Set User ID）

文件拥有 SUID 时，执行它的用户会**临时拥有文件所有者的权限**。

```bash
# 查看 SUID 文件（s 出现在所有者的执行位）
$ ls -l /usr/bin/passwd
-rwsr-xr-x 1 root root 59976 Jan 10 /usr/bin/passwd
#    ↑ s 表示 SUID

# 为什么需要：普通用户执行 passwd 时，需要修改 /etc/shadow（root 才能改）
# SUID 让 passwd 程序临时以 root 身份运行

# 设置 SUID
$ sudo chmod u+s program
$ sudo chmod 4755 program

# 查找所有 SUID 文件（安全审计）
$ find / -perm -4000 -type f 2>/dev/null
```

### SGID（Set Group ID）

- 用于文件：执行时以文件所属组的权限运行
- 用于目录：目录内新建的文件自动继承目录的所属组

```bash
# s 出现在所属组的执行位
$ ls -l /usr/bin/wall
-rwxr-sr-x 1 root tty 35048 Jan 10 /usr/bin/wall

# 目录 SGID 的实际用途：团队共享目录
$ sudo mkdir /shared
$ sudo chown :developers /shared
$ sudo chmod g+s /shared      # 设置 SGID
# 之后所有人在 /shared 中创建的文件，所属组自动设为 developers
```

### Sticky Bit

用于**目录**：目录中的文件只有**文件所有者**和 **root** 才能删除，即使其他人有写权限。

```bash
# t 出现在 other 的执行位
$ ls -ld /tmp
drwxrwxrwt 10 root root 4096 Jan 10 /tmp
#         ↑ t 表示 sticky bit

# /tmp 所有人都可以写，但只能删除自己的文件
# 设置 sticky bit
$ sudo chmod +t /shared
$ sudo chmod 1777 /shared
```

---

## umask：默认权限掩码

`umask` 决定新创建文件/目录的默认权限：

```bash
# 查看当前 umask
$ umask
0022

# umask 的工作原理：
# 文件最大权限：666（没有执行权限）
# 目录最大权限：777
# 实际权限 = 最大权限 - umask

# umask=022 时：
# 新文件：666 - 022 = 644 (rw-r--r--)
# 新目录：777 - 022 = 755 (rwxr-xr-x)

# 临时修改 umask
$ umask 027
# 新文件：666 - 027 = 640 (rw-r-----)
# 新目录：777 - 027 = 750 (rwxr-x---)

# 永久修改，添加到 ~/.bashrc 或 /etc/profile
echo "umask 027" >> ~/.bashrc
```

---

## ACL：细粒度权限控制

当标准的 rwx 三组权限不够用时（如需要给某个特定用户单独授权），使用 ACL：

```bash
# 安装 ACL 工具（Ubuntu）
$ sudo apt install acl

# 给特定用户设置权限
$ setfacl -m u:alice:rw- file.txt    # 给 alice 读写权限
$ setfacl -m g:ops:rx /var/log/      # 给 ops 组读和执行权限

# 递归设置
$ setfacl -R -m u:alice:rw /shared/project/

# 查看 ACL
$ getfacl file.txt
# file: file.txt
# owner: john
# group: john
user::rw-
user:alice:rw-    ← Alice 的特殊权限
group::r--
mask::rw-
other::r--

# 删除 ACL
$ setfacl -x u:alice file.txt    # 删除 alice 的 ACL
$ setfacl -b file.txt            # 删除所有 ACL
```

---

## 权限问题排查

```bash
# 查看文件的详细权限
$ ls -la /path/to/file
$ stat /path/to/file           # 更详细的信息

# 以某个用户身份测试权限
$ sudo -u alice cat /etc/secret.txt

# 检查目录链上的权限（逐级检查）
# 如果访问 /var/www/html/index.html 被拒绝：
$ ls -ld /
$ ls -ld /var
$ ls -ld /var/www
$ ls -ld /var/www/html
$ ls -l /var/www/html/index.html

# 常见问题：Web 服务器 403 错误
# 原因通常是 www-data 用户没有访问目录的权限
$ sudo chown -R www-data:www-data /var/www/html
$ sudo chmod -R 755 /var/www/html
```
