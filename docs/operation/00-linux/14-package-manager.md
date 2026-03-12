# 7.1 软件包管理

Linux 通过**包管理器**来安装、更新、卸载软件，不同发行版使用不同的包管理器。

---

## APT（Debian / Ubuntu 系）

APT（Advanced Package Tool）是 Debian 系发行版的包管理工具。

### 核心概念

```
软件包（.deb 文件）
  ↓
软件源（Repository）← 存放软件包的服务器
  ↓
/etc/apt/sources.list ← 软件源配置文件
  ↓
apt ← 命令行工具，从软件源下载并安装
```

### 基本操作

```bash
# ⚠️ 操作前必须更新软件源索引（同步最新可用版本信息）
$ sudo apt update

# 升级所有已安装的软件
$ sudo apt upgrade

# 安全升级（不自动安装新软件包）
$ sudo apt upgrade --only-upgrade

# 安装软件
$ sudo apt install nginx
$ sudo apt install nginx mysql-server nodejs    # 一次安装多个

# 安装指定版本
$ sudo apt install nginx=1.18.0-0ubuntu1

# 卸载软件（保留配置文件）
$ sudo apt remove nginx

# 彻底卸载（包括配置文件）
$ sudo apt purge nginx

# 卸载并清理所有依赖
$ sudo apt autoremove

# 搜索软件包
$ apt search nginx
$ apt search "web server"

# 查看软件包信息
$ apt show nginx

# 查看已安装的软件包
$ apt list --installed
$ dpkg -l                    # 更详细
$ dpkg -l | grep nginx       # 查找特定软件

# 清理已下载的安装包缓存
$ sudo apt clean             # 清除所有缓存
$ sudo apt autoclean         # 只清除过期缓存
```

### 软件源配置

```bash
# 软件源配置文件
$ cat /etc/apt/sources.list
deb http://archive.ubuntu.com/ubuntu jammy main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu jammy-updates main restricted universe multiverse
deb http://security.ubuntu.com/ubuntu jammy-security main restricted

# 添加第三方 PPA（Personal Package Archive）
# 以 Node.js 为例
$ curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
$ sudo apt install nodejs

# 查看所有软件源（包括 /etc/apt/sources.list.d/ 下的）
$ cat /etc/apt/sources.list /etc/apt/sources.list.d/*.list 2>/dev/null
```

### 国内镜像加速（推荐）

```bash
# 将软件源替换为阿里云镜像（Ubuntu 22.04）
$ sudo sed -i 's|http://archive.ubuntu.com|http://mirrors.aliyun.com|g' /etc/apt/sources.list
$ sudo sed -i 's|http://security.ubuntu.com|http://mirrors.aliyun.com|g' /etc/apt/sources.list
$ sudo apt update
```

---

## YUM / DNF（CentOS / RHEL 系）

- CentOS 7 及以下使用 `yum`
- CentOS 8+、RHEL 8+、Rocky Linux 使用 `dnf`（DNF 是 yum 的下一代，命令基本兼容）

### 基本操作

```bash
# 更新软件源缓存
$ sudo dnf makecache      # DNF
$ sudo yum makecache      # YUM

# 安装软件
$ sudo dnf install nginx
$ sudo yum install nginx

# 安装指定版本
$ sudo dnf install nginx-1.20.2

# 更新所有软件
$ sudo dnf update
$ sudo dnf upgrade         # 与 update 基本相同

# 只更新某个软件
$ sudo dnf update nginx

# 卸载软件
$ sudo dnf remove nginx
$ sudo dnf autoremove      # 清理不再需要的依赖

# 搜索软件包
$ dnf search nginx
$ dnf search "web server"

# 查看软件包信息
$ dnf info nginx

# 查看已安装的软件包
$ dnf list installed
$ rpm -qa                  # 另一种方式
$ rpm -qa | grep nginx

# 清理缓存
$ sudo dnf clean all

# 查看软件包提供了哪些文件
$ rpm -ql nginx

# 查看文件属于哪个软件包
$ rpm -qf /etc/nginx/nginx.conf
nginx-1.20.2-1.el8.ngx.x86_64
```

### EPEL 扩展软件源

```bash
# EPEL（Extra Packages for Enterprise Linux）提供很多官方源没有的软件
$ sudo dnf install epel-release
$ sudo dnf install htop    # epel 中才有的软件
```

---

## 通用安装方式

### 从源码编译安装

```bash
# 当包管理器中没有所需版本时，从源码编译
# 以 nginx 为例：

# 1. 安装编译依赖
$ sudo apt install build-essential libpcre3-dev zlib1g-dev libssl-dev

# 2. 下载源码
$ wget http://nginx.org/download/nginx-1.24.0.tar.gz
$ tar -xzvf nginx-1.24.0.tar.gz
$ cd nginx-1.24.0

# 3. 配置（指定安装目录和启用的模块）
$ ./configure --prefix=/opt/nginx \
    --with-http_ssl_module \
    --with-http_v2_module

# 4. 编译
$ make -j$(nproc)     # -j 使用多核并行编译

# 5. 安装
$ sudo make install
```

### 使用 pip 安装 Python 包

```bash
# 安装 pip
$ sudo apt install python3-pip

# 安装 Python 包
$ pip3 install requests
$ pip3 install -r requirements.txt    # 从依赖文件安装

# 使用国内镜像
$ pip3 install requests -i https://pypi.tuna.tsinghua.edu.cn/simple/

# 查看已安装包
$ pip3 list
$ pip3 show requests

# 更新包
$ pip3 install --upgrade requests
```

### 使用 npm 安装 Node.js 包

```bash
# 全局安装（系统级）
$ sudo npm install -g pm2

# 项目安装（仅当前项目）
$ npm install express

# 使用国内镜像
$ npm config set registry https://registry.npmmirror.com
$ npm install
```

---

## 软件版本管理

### 安装多版本 Python（pyenv）

```bash
# 安装 pyenv
$ curl https://pyenv.run | bash

# 添加到 ~/.bashrc
export PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init -)"

# 安装指定版本
$ pyenv install 3.10.0
$ pyenv install 3.11.0

# 切换全局版本
$ pyenv global 3.11.0

# 在某个目录使用特定版本（.python-version 文件）
$ cd myproject
$ pyenv local 3.10.0
```

### 安装多版本 Node.js（nvm）

```bash
# 安装 nvm
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

# 安装指定版本
$ nvm install 18
$ nvm install 20

# 切换版本
$ nvm use 18
$ nvm use 20

# 设置默认版本
$ nvm alias default 20

# 查看已安装的版本
$ nvm ls
```

---

## 实用场景

### 场景：搭建 LNMP 环境（Linux+Nginx+MySQL+PHP）

```bash
# Ubuntu 22.04

# 1. 安装 Nginx
$ sudo apt update
$ sudo apt install nginx
$ sudo systemctl enable --now nginx

# 2. 安装 MySQL
$ sudo apt install mysql-server
$ sudo systemctl enable --now mysql
$ sudo mysql_secure_installation    # 安全配置向导

# 3. 安装 PHP
$ sudo apt install php8.1-fpm php8.1-mysql php8.1-cli

# 4. 验证
$ nginx -v
$ mysql --version
$ php -v
```
