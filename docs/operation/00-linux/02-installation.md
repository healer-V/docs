---
title: "1.2 安装与环境搭建"
category: "运维 · Linux"
tags:
  - Linux
excerpt: "学 Linux 最重要的是有一个可以随意折腾的环境。以下是三种主流方案，按推荐程度排序。 WSL（Windows Subsystem for Linux）是微软官方推出的 Linux 兼容层，可以在 Windows 上直接运行真实的 Lin..."
---

# 1.2 安装与环境搭建

学 Linux 最重要的是有一个**可以随意折腾的环境**。以下是三种主流方案，按推荐程度排序。

---

## 方案一：WSL2（Windows 用户首选）

WSL（Windows Subsystem for Linux）是微软官方推出的 Linux 兼容层，可以在 Windows 上直接运行真实的 Linux 内核。

**优点：** 无需重启切换，和 Windows 共享文件系统，性能接近原生
**缺点：** 不适合学习底层网络配置

### 安装步骤

**第一步：启用 WSL2**

以管理员身份打开 PowerShell，执行：

```powershell
wsl --install
```

这一条命令会自动安装 WSL2 并下载 Ubuntu（如需其他发行版，见下方）。安装完成后重启电脑。

**第二步：设置用户名和密码**

重启后 Ubuntu 窗口会自动弹出，按提示创建 Linux 用户名和密码。

::: warning 密码输入时不会显示
Linux 的密码输入默认不回显（不显示 * 号），这是正常现象，盲打即可。
:::

**第三步（可选）：安装其他发行版**

```powershell
# 查看可用发行版
wsl --list --online

# 安装指定发行版
wsl --install -d Debian
wsl --install -d OracleLinux_9_1
```

### 常用 WSL 命令

```powershell
# 列出已安装的发行版
wsl --list --verbose

# 启动默认发行版
wsl

# 关闭所有运行中的 WSL
wsl --shutdown

# 设置默认发行版
wsl --set-default Ubuntu-22.04
```

### 文件系统互访

```bash
# 在 WSL 中访问 Windows 的 C 盘
$ ls /mnt/c/Users/

# 在 Windows 资源管理器中打开当前 WSL 目录
$ explorer.exe .
```

---

## 方案二：云服务器（最接近工作场景）

直接购买云服务器（ECS/CVM），通过 SSH 远程连接。这是最贴近实际工作的方式。

**优点：** 真实的生产环境，可以练习 SSH、防火墙、公网部署
**缺点：** 需要付费（但学生/新用户通常有免费额度）

### 推荐云平台

| 平台 | 免费方案 | 适合场景 |
|------|----------|----------|
| 阿里云 | 学生机 ¥9.5/月，新用户免费试用 | 国内访问快 |
| 腾讯云 | 新用户免费 3 个月 | 国内访问快 |
| AWS | 1年免费套餐 | 国际化场景 |
| DigitalOcean | $200 免费额度 | 操作简单 |

### SSH 连接服务器

```bash
# 基本连接
$ ssh username@服务器IP

# 指定端口（默认 22）
$ ssh -p 2222 username@服务器IP

# 使用密钥文件连接
$ ssh -i ~/.ssh/my_key.pem username@服务器IP
```

**配置 SSH 免密登录**（推荐）：

```bash
# 1. 在本地生成密钥对
$ ssh-keygen -t ed25519 -C "your_email@example.com"
# 会生成 ~/.ssh/id_ed25519（私钥）和 ~/.ssh/id_ed25519.pub（公钥）

# 2. 将公钥上传到服务器
$ ssh-copy-id username@服务器IP

# 3. 之后直接连接，无需密码
$ ssh username@服务器IP
```

---

## 方案三：虚拟机（学习底层推荐）

使用 VirtualBox 或 VMware 在本机运行完整的 Linux 虚拟机。

**优点：** 完全隔离，适合练习系统配置、内核参数等高风险操作
**缺点：** 占用资源多，启动慢

### VirtualBox 安装 Ubuntu

1. 下载 [VirtualBox](https://www.virtualbox.org/) 并安装
2. 下载 Ubuntu 22.04 LTS ISO 镜像（官网或国内镜像站）
3. 新建虚拟机 → 分配 2GB+ 内存、20GB+ 磁盘
4. 挂载 ISO，启动安装

**推荐配置：**
- 内存：4GB（最低 2GB）
- 磁盘：30GB（动态分配）
- 网络：NAT + 仅主机模式（双网卡，兼顾外网和本机互访）

---

## 终端工具推荐

无论使用哪种方式，都需要一个好用的终端工具：

| 工具 | 平台 | 特点 |
|------|------|------|
| **Windows Terminal** | Windows | 微软官方，支持 WSL，标签页管理 |
| **iTerm2** | macOS | 功能丰富，分屏、搜索、回放 |
| **Tabby** | 跨平台 | 颜值高，支持 SSH 管理 |
| **MobaXterm** | Windows | 内置 SFTP，适合连接远程服务器 |

---

## 验证环境

成功进入 Linux 终端后，执行以下命令验证环境：

```bash
# 查看系统信息
$ uname -a
Linux ubuntu 5.15.0-91-generic #101-Ubuntu SMP...

# 查看发行版详情
$ cat /etc/os-release
NAME="Ubuntu"
VERSION="22.04.3 LTS (Jammy Jellyfish)"
...

# 查看当前用户
$ whoami
john

# 查看 bash 版本
$ bash --version
GNU bash, version 5.1.16(1)-release
```

看到类似输出，说明环境准备就绪，可以开始学习了。
