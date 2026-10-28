---
title: "systemd 服务管理"
tags:
  - Linux
  - systemd
  - Ubuntu
excerpt: "以仅在本机开放的状态页为例，创建一个 systemd 服务单元，分别验证运行状态与开机启用状态，观察启动失败的证据，并按明确范围恢复和撤销实验变更。"
date: 2026-09-23
---

# systemd 服务管理

`systemd` 是 Ubuntu Server 的系统与服务管理器。一个以 `.service` 结尾的**服务单元**描述要启动的程序、运行身份及启动规则；`systemctl` 则向管理器发出启动、停止、查询等操作。服务**当前在运行**和**设置为开机启动**是两个独立状态：`start` 不等于 `enable`，`stop` 也不等于 `disable`。下文用一个只在虚拟机本机访问的小型状态页验证这两个状态。

## 一、服务单元与状态

`systemd` 读取单元文件后，根据 `[Service]` 中的 `ExecStart` 启动主进程；本例使用 `Type=exec`，使启动命令至少等到目标程序被成功执行。如果程序启动后又退出或无法进入工作目录，服务仍会失败。`[Install]` 中的 `WantedBy=multi-user.target` 则提供 `enable` 创建开机启动关联的目标，不会自行启动当前进程。具体规则见 [systemd 259 的服务单元手册](https://github.com/systemd/systemd/blob/v259/man/systemd.service.xml)与 [systemctl 手册](https://github.com/systemd/systemd/blob/v259/man/systemctl.xml)。

| 查询 | 观察对象 | 本例常见结果 | 判断 |
|------|----------|--------------|------|
| `systemctl is-active ops-lab.service` | 当前运行状态 | `active`、`inactive` 或 `failed` | 是否正在服务；失败时命令返回非零 |
| `systemctl is-enabled ops-lab.service` | 开机启用状态 | `enabled` 或 `disabled` | 是否建立开机启动关联；未启用时命令返回非零 |
| `systemctl status ops-lab.service` | 详细状态 | `Loaded`、`Active`、主进程及近期日志 | 人工定位状态变化，不用它的排版做程序解析 |

::: tip 分别查询运行与启用状态
服务可以正在运行但未设置开机启动，也可以已设置开机启动却被手动停止。检查“现在可用”时看 `is-active` 并调用服务；检查“下次启动是否自动拉起”时看 `is-enabled`。两个查询的退出码也应分别判断。
:::

## 二、创建本机演示服务

::: info 示例环境为隔离的 Ubuntu Server 虚拟机
以下命令在 **Ubuntu Server 26.04.1 LTS amd64** 的全新、可回退虚拟机中执行，使用具有 `sudo` 权限的普通登录用户及 VM 控制台；不能在生产主机执行。Ubuntu 26.04 采用 `systemd` 259 系列，安装更新会改变包的末级版本，先用 `systemctl --version` 核对实际值。示例在 `127.0.0.1:8765` 提供状态页，不向外网开放；它只演示服务管理，不是生产 Web 服务。
:::

[Ubuntu 26.04 发布说明](https://documentation.ubuntu.com/release-notes/26.04/summary-for-lts-users/)列出 `systemd` 259。实验还需要 Python 3 的 `http.server`、`curl` 和 `nano`；这三个工具若已安装，不必重复安装。Python 官方明确说明 [`http.server` 不适合生产用途](https://docs.python.org/3/library/http.server.html)，因此本例限制监听环回地址，目录只放非敏感内容。

1. 在 VM 控制台登录，核对版本和必要命令。以下均为 **Ubuntu VM 内的 Bash 命令**；`sudo` 只用于安装、写系统目录和管理系统服务。

   ```bash
   cat /etc/os-release
   systemctl --version
   command -v python3 curl nano
   ```

   观察 `VERSION_ID` 为 `26.04`、`systemctl --version` 的首行为 259 系列，并确认三个命令均有路径。若命令缺失，先在有可用软件源的 VM 内执行安装，再重新检查：

   ```bash
   sudo apt update
   sudo apt install python3 curl nano
   ```

2. 检查演示对象尚不存在，并确认 `8765` 端口没有监听进程。如果存在同名用户、目录、单元文件或端口占用，停止本示例，不覆盖已有内容；在自己的新 VM 上清理冲突或重新建立隔离环境后再执行。

   ```bash
   getent passwd opslab
   getent group opslab
   test -e /srv/ops-lab
   test -e /etc/systemd/system/ops-lab.service
   ss -ltn 'sport = :8765'
   ```

   **前四条命令返回非零**才表示同名用户、组和路径不存在；这在本步骤是期望结果，不能把所有非零退出码都视为故障。`ss` 只应显示表头，不应列出监听行。若 `getent` 以其他原因失败，先检查系统账号查询是否可用，不能直接继续创建。

3. 创建专用系统账号和静态页面。`opslab` 不允许交互登录，服务将以这个身份读取页面，而不是以 root 运行。`/srv/ops-lab/site` 是本篇自建的测试数据目录，内容只有一行非敏感文字。

   ```bash
   sudo useradd --system --user-group --no-create-home --shell /usr/sbin/nologin opslab
   sudo install -d -o opslab -g opslab -m 0755 /srv/ops-lab/site
   printf '%s\n' 'ops-lab ready' | sudo tee /srv/ops-lab/site/index.html
   sudo chmod 0644 /srv/ops-lab/site/index.html
   ```

   `id opslab` 应能查到服务身份；页面应只含 `ops-lab ready`。如果创建账号失败，先核对第 2 步是否有同名对象，不要通过删除已有账号来继续。

4. 在 VM 中执行 `sudo nano /etc/systemd/system/ops-lab.service`，创建下面的完整单元文件。粘贴后按 `Ctrl+O`、回车、`Ctrl+X` 保存并退出。`/etc/systemd/system/` 保存本地管理员创建的系统单元；`WorkingDirectory` 是启动程序前进入的目录，必须已经存在且服务用户可访问。

   ::: details 查看 ops-lab.service 完整配置

   ```ini
   [Unit]
   Description=Local operations lab status page

   [Service]
   Type=exec
   User=opslab
   WorkingDirectory=/srv/ops-lab/site
   ExecStart=/usr/bin/python3 -m http.server 8765 --bind 127.0.0.1
   Restart=no

   [Install]
   WantedBy=multi-user.target
   ```

   :::

   `Type=exec` 让缺失可执行文件之类的启动错误能直接反馈给 `start`；它**不等同于 HTTP 健康检查**。`Restart=no` 使故障保留为可观察的失败状态，避免实验进程反复重启。本例只监听本机环回地址，不需要等待外部网络。

## 三、启动、启用与核对

先验证单元语法，再通知 `systemd` 重新读取文件。`daemon-reload` **不会重启运行中的服务**；修改实际运行参数后，还需按影响范围主动 `restart`。初次创建时它尚未运行，可以直接 `start`。

1. 检查配置、加载并启动：

   ```bash
   sudo systemd-analyze verify /etc/systemd/system/ops-lab.service
   sudo systemctl daemon-reload
   sudo systemctl start ops-lab.service
   systemctl is-active ops-lab.service
   systemctl status ops-lab.service --no-pager
   curl --fail --silent --show-error http://127.0.0.1:8765/
   ```

   **预期观察（尚未在本机 Ubuntu VM 实测）：**`verify` 无针对本单元的错误，`is-active` 输出 `active`，`status` 的 `Active` 为 `active (running)`，`curl` 返回 `ops-lab ready`。`status` 中的 PID、时间和日志因环境不同而变化。若 `verify` 给出警告也要阅读内容，不能只凭退出码放行；刚启动时 `Type=exec` 不保证 HTTP 已就绪，可以短暂等待后重试请求，再核对主进程和端口占用。

2. 对照当前运行状态和开机启用状态：

   ```bash
   systemctl is-enabled ops-lab.service
   sudo systemctl enable ops-lab.service
   systemctl is-enabled ops-lab.service
   systemctl is-active ops-lab.service
   ```

   第一次 `is-enabled` **预期为 `disabled` 并返回非零**，`enable` 后预期为 `enabled`，当前服务仍为 `active`。`enable` 通过单元的 `[Install]` 段建立开机启动关联；它本身不是启动命令。

3. 再验证状态可以独立变化：

   ```bash
   sudo systemctl stop ops-lab.service
   systemctl is-active ops-lab.service
   systemctl is-enabled ops-lab.service
   sudo systemctl start ops-lab.service
   ```

   `stop` 后 **预期 `inactive` 且查询返回非零**，而 `is-enabled` 仍为 `enabled`。重新 `start` 后使用 `curl` 再请求一次，应恢复 `ops-lab ready`；不需要为了验证开机启动而重启整台 VM。若要实测开机自动拉起，可以先保留快照，再在 VM 中重启并核对两个状态，但这不是本篇核心示例的必要条件。

## 四、启动失败与恢复

服务无法进入 `WorkingDirectory` 时，启动会失败。下面只移动**本篇在全新实验 VM 创建**的目录，制造一次可逆故障；先确认备用路径不存在，不能把此步骤套用到真实服务目录。

::: danger 只操作本篇创建的目录
在 VM 控制台确认 `/srv/ops-lab/site` 是本篇测试页面，且 `/srv/ops-lab/site.off` 不存在。若路径包含其他人的数据或无法确认归属，停止实验。移动目录会让正在依赖它的服务失效，因此必须先停止演示服务，并在失败观察后立即移回原位置。
:::

1. 停止服务并暂时移走工作目录：

   ```bash
   sudo systemctl stop ops-lab.service
   test ! -e /srv/ops-lab/site.off
   sudo mv /srv/ops-lab/site /srv/ops-lab/site.off
   sudo systemctl start ops-lab.service
   ```

   最后一条命令**预期失败并返回非零**。如果 `test` 失败，不能执行后面的移动；终端逐行运行，不把这些命令无条件串成脚本。异常原因是单元指定的工作目录不存在，而不是 `enable` 状态或 HTTP 请求配置。

2. 查询状态并恢复原目录：

   ```bash
   systemctl is-failed ops-lab.service
   systemctl status ops-lab.service --no-pager
   sudo mv /srv/ops-lab/site.off /srv/ops-lab/site
   sudo systemctl reset-failed ops-lab.service
   sudo systemctl start ops-lab.service
   systemctl is-active ops-lab.service
   curl --fail --silent --show-error http://127.0.0.1:8765/
   ```

   **预期观察（未在 26.04.1 VM 实测）：**失败期间 `is-failed` 为 `failed`，`status` 给出工作目录相关的启动错误；恢复后 `is-active` 为 `active`，请求再次返回 `ops-lab ready`。`reset-failed` 清理记录的失败状态，**不会修好目录**；如果服务仍不能启动，先检查 `WorkingDirectory`、权限、Python 路径和端口占用，再查看该单元的近期日志。按时间和日志字段做系统性查询由独立的日志文章负责，此处只用 `status` 定位当前失败。

::: warning 运行中与启用状态不表示应用一定健康
`Type=exec` 只确认程序已成功执行，无法证明 HTTP 页面正确响应；`active` 也不能替代 `curl` 的实际请求。反过来，`enabled` 只表示有开机启动关联，不表示当前服务可用。对外服务还需要应用自身健康检查、权限与网络边界，这些不由本例的状态查询自动保证。
:::

## 五、撤销实验变更

确认不再需要该实验后，先停止并禁用 `ops-lab.service`，再删除**确认为本篇创建**的单元、页面和专用账号。删除前核对文件内容与目录列表；若该路径已被其他任务使用，不执行清理。以下命令仍在 VM 控制台逐行执行：

```bash
sudo systemctl disable --now ops-lab.service
sudo rm -- /etc/systemd/system/ops-lab.service
sudo systemctl daemon-reload
sudo rm -- /srv/ops-lab/site/index.html
sudo rmdir -- /srv/ops-lab/site /srv/ops-lab
sudo userdel opslab
```

`rmdir` 只删除空目录；若失败，先检查留下的文件和归属，不改用递归强删。若故障实验中目录尚处于 `site.off`，先按第四节恢复名称再清理。`userdel` 后可用 `getent group opslab` 检查同名组是否仍存在；只有确认它由本篇创建且没有其他成员时，才用 `sudo groupdel opslab` 删除。清理不卸载 Python、`curl` 或 `nano`，因为这些包可能被 VM 的其他用途使用。

这条链路用于验证单元文件、运行状态、开机启用状态和一次可恢复的启动失败；不证明生产应用健康、重启策略或外网访问。本文的命令与状态判断依据为 [Ubuntu 26.04 的 `systemd` 版本说明](https://documentation.ubuntu.com/release-notes/26.04/summary-for-lts-users/)、[systemd 259 的 `systemctl` 手册](https://github.com/systemd/systemd/blob/v259/man/systemctl.xml)和[服务单元手册](https://github.com/systemd/systemd/blob/v259/man/systemd.service.xml)。当前工作区没有可运行的 Ubuntu/systemd 实验机，**上述预期结果尚未实测，本文仍为待校准样板**；实际运行与空环境复现是进入正式内容和导航前的阻断项。
