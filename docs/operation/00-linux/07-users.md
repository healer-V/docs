# 3.1 用户与用户组

## 核心概念

Linux 是多用户系统，每个文件、进程都有一个"所有者"。用户和用户组机制是权限控制的基础。

```
root（超级用户，UID=0）
├── 普通用户（UID >= 1000）
│   ├── john（UID=1000）
│   ├── alice（UID=1001）
│   └── ...
└── 系统用户（UID 1~999，通常是服务账号）
    ├── nginx（运行 nginx 服务）
    ├── mysql（运行数据库服务）
    └── ...
```

**用户组**：将多个用户归为一组，方便统一授权。每个用户都有一个**主组**，可以属于多个**附加组**。

---

## 用户信息存储在哪里

### /etc/passwd - 用户账户数据库

```bash
$ cat /etc/passwd
root:x:0:0:root:/root:/bin/bash
john:x:1000:1000:John Doe,,,:/home/john:/bin/bash
nginx:x:101:101:nginx user:/var/cache/nginx:/bin/false
```

每行字段含义（以 `:` 分隔）：

```
用户名:密码占位:UID:GID:注释:主目录:默认Shell
john  :x    :1000:1000:John Doe:/home/john:/bin/bash
```

- `x` 表示密码存在 `/etc/shadow` 中
- `UID=0` 是 root
- Shell 为 `/bin/false` 或 `/sbin/nologin` 的用户无法登录

### /etc/shadow - 加密密码数据库

```bash
# 只有 root 可以查看
$ sudo cat /etc/shadow
john:$6$salt$hash...:19000:0:99999:7:::
```

字段：`用户名:加密密码:最后修改日期:最小修改间隔:密码有效期:提前警告天数:...`

### /etc/group - 用户组数据库

```bash
$ cat /etc/group
root:x:0:
sudo:x:27:john,alice
docker:x:998:john
john:x:1000:
```

格式：`组名:密码:GID:组成员列表`

---

## 用户管理命令

### 创建用户

```bash
# 基本创建（自动创建同名主目录和主组）
$ sudo useradd -m alice

# 参数详解
$ sudo useradd \
    -m \                        # 创建主目录 /home/alice
    -d /home/alice \            # 指定主目录路径
    -s /bin/bash \              # 指定默认 Shell
    -c "Alice Smith" \          # 注释/全名
    -G sudo,docker \            # 附加组（可属于多个组）
    -u 1500 \                   # 指定 UID
    alice

# 设置密码（useradd 之后必须设置密码才能登录）
$ sudo passwd alice
New password:
Retype new password:
passwd: password updated successfully
```

### 修改用户

```bash
# 修改用户信息
$ sudo usermod -c "New Comment" alice     # 修改注释
$ sudo usermod -s /bin/zsh alice          # 修改默认 Shell
$ sudo usermod -d /data/alice alice       # 修改主目录

# 修改用户组
$ sudo usermod -g developers alice        # 修改主组
$ sudo usermod -G sudo,docker alice       # 设置附加组（替换原有）
$ sudo usermod -aG docker alice           # 追加到附加组（不替换）

# 锁定/解锁用户（禁止/允许登录）
$ sudo usermod -L alice    # Lock
$ sudo usermod -U alice    # Unlock
```

### 删除用户

```bash
# 删除用户（保留主目录）
$ sudo userdel alice

# 删除用户及其主目录
$ sudo userdel -r alice
```

### 查看用户信息

```bash
# 查看当前用户
$ whoami
john

# 查看当前用户的 UID、GID 和所属组
$ id
uid=1000(john) gid=1000(john) groups=1000(john),27(sudo),998(docker)

# 查看指定用户
$ id alice
uid=1001(alice) gid=1001(alice) groups=1001(alice),27(sudo)

# 查看所有已登录用户
$ who
john     pts/0        2024-01-10 09:00 (192.168.1.100)
alice    pts/1        2024-01-10 09:30 (192.168.1.101)

# 查看当前登录用户的活动
$ w

# 查看用户的登录历史
$ last alice
$ last -n 10    # 最近 10 条记录
```

---

## 用户组管理命令

```bash
# 创建组
$ sudo groupadd developers

# 指定 GID 创建组
$ sudo groupadd -g 2000 ops

# 修改组名
$ sudo groupmod -n devteam developers

# 删除组
$ sudo groupdel developers

# 将用户添加到组（最常用）
$ sudo gpasswd -a alice developers    # 添加
$ sudo gpasswd -d alice developers    # 从组中移除

# 查看组成员
$ getent group docker
docker:x:998:john,alice
```

---

## 切换用户

```bash
# 切换到另一个用户
$ su alice
Password:

# 切换到 root
$ su -
Password:

# su 和 su - 的区别：
# su alice     切换用户，但保留当前环境变量
# su - alice   完整切换，加载 alice 的环境（推荐）

# 以另一个用户执行命令（不切换环境）
$ sudo -u alice ls /home/alice

# 切换到 root 执行单条命令
$ sudo systemctl restart nginx
```

---

## sudo 配置

`sudo` 允许普通用户以 root 权限执行特定命令，配置文件在 `/etc/sudoers`。

```bash
# 编辑 sudoers（必须用 visudo，语法检查更安全）
$ sudo visudo

# sudoers 常见配置示例
# 格式：用户/组 主机=(以谁身份) 可执行的命令

# 允许 john 执行所有 sudo 命令
john ALL=(ALL:ALL) ALL

# 允许 sudo 组的所有用户执行所有命令
%sudo ALL=(ALL:ALL) ALL

# 免密 sudo（不推荐在生产环境使用）
john ALL=(ALL) NOPASSWD: ALL

# 只允许执行特定命令
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx
```

---

## 实际工作场景

### 场景：为新同事创建账号并授予必要权限

```bash
# 1. 创建用户
$ sudo useradd -m -s /bin/bash -c "新同事小李" lixiaoming

# 2. 设置初始密码（让他第一次登录后自行修改）
$ sudo passwd lixiaoming

# 3. 强制用户下次登录时修改密码
$ sudo chage -d 0 lixiaoming

# 4. 加入需要的组（如 docker 组）
$ sudo usermod -aG docker lixiaoming

# 5. 验证配置
$ id lixiaoming
uid=1002(lixiaoming) gid=1002(lixiaoming) groups=1002(lixiaoming),998(docker)
```

### 场景：创建服务账号（不允许登录）

```bash
# 系统服务通常有专用的低权限账号
$ sudo useradd \
    -r \                      # 创建系统账号（UID < 1000）
    -s /sbin/nologin \        # 禁止登录
    -d /var/lib/myapp \       # 数据目录作为主目录
    -c "My App Service" \
    myapp

# 将应用文件的所有者设为该账号
$ sudo chown -R myapp:myapp /var/lib/myapp
```
