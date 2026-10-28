---
title: "SSH 访问"
tags:
  - Linux
  - OpenSSH
  - 安全
excerpt: "完成 SSH 密钥登录、服务端配置校验与双会话验证，并通过可回退步骤避免禁用密码后失去服务器访问权限。"
date: 2026-09-24
---

# SSH 访问

SSH 远程访问包含三类对象：客户端持有私钥，服务端账户保存对应公钥，sshd 根据有效配置决定允许哪些认证方式。密钥算法足够安全并不代表迁移已经完成；只有新连接实际使用目标密钥成功登录，才能关闭旧认证通道。

本文以 Ubuntu Server 26.04.1 LTS、普通账户 `operator` 和 OpenSSH 为基线。实验需要虚拟机控制台、快照和两个相互独立的客户端终端。私钥只保存在客户端，不进入服务器配置、命令输出或文档。

::: danger 先建立密钥会话，再禁用密码认证
旧 SSH 会话必须保持在线。新会话通过密钥登录且提权能力验证完成之前，不得设置 `PasswordAuthentication no`，也不得关闭唯一的管理终端。
:::

::: warning 当前示例尚未在 Ubuntu 虚拟机执行
当前工作区没有可运行的 Linux 实验机。端口、账户、配置片段优先级和认证日志必须在隔离虚拟机中按实际值核对。
:::

## 一、认证边界

### 1. 密钥角色

| 对象 | 保存位置 | 安全边界 |
|------|----------|----------|
| 私钥 | 客户端 `~/.ssh/` 或硬件密钥 | 不上传、不共享，建议使用口令保护 |
| 公钥 | 服务端账户的 `~/.ssh/authorized_keys` | 可分发，但要限制可写权限 |
| 主机密钥 | 服务端 `/etc/ssh/ssh_host_*` | 标识服务器，不等同于用户密钥 |
| known_hosts | 客户端 `~/.ssh/known_hosts` | 记录主机身份，防止连接到冒充主机 |

用户密钥证明“客户端持有私钥”，主机密钥证明“服务端是预期主机”。首次连接出现主机指纹时，应通过控制台或可信资产记录核对，不能直接接受未知指纹。

### 2. 配置来源

Ubuntu 的 `/etc/ssh/sshd_config` 在靠前位置包含 `/etc/ssh/sshd_config.d/*.conf`。对多数指令，sshd 使用首先取得的值，因此片段文件名和主配置中的先后位置都会影响最终结果。

```bash
sudo grep -nE '^[[:space:]]*(Include|PasswordAuthentication|PubkeyAuthentication)' \
  /etc/ssh/sshd_config
sudo find /etc/ssh/sshd_config.d -maxdepth 1 -type f -name '*.conf' -print
sudo sshd -T | grep -E '^(port|passwordauthentication|pubkeyauthentication) '
```

不能只读取刚创建的片段就断言配置生效。`sshd -T` 的有效值和新连接结果才是验证依据。

## 二、访问基线

开始迁移前，记录当前连接、服务状态、监听端口和防火墙规则。任何一项不明确，都应先停止认证策略变更。

### 1. 当前连接

```bash
who
printf '%s\n' "$SSH_CONNECTION"
sudo systemctl status ssh --no-pager
sudo ss -lntp | grep sshd
```

`SSH_CONNECTION` 中最后一个字段是当前会话连接的服务端口。它必须与 `sshd -T` 和 `ss` 的结果一致；否则可能连接到了代理、端口转发或另一实例。

### 2. 配置与入口

```bash
sudo sshd -T | grep -E '^(port|listenaddress|passwordauthentication|pubkeyauthentication) '
sudo ufw status numbered
ip route get "$(printf '%s' "$SSH_CONNECTION" | awk '{print $1}')"
```

若 UFW 已启用，当前客户端来源必须被允许访问实际 SSH 端口。规则验证与远程回退方式见[主机防火墙](../07-host-networking/03-host-firewall.md)。

## 三、客户端密钥

密钥在客户端生成。下面使用 Ed25519，并以服务器用途命名，避免覆盖现有默认密钥。

### 1. 生成密钥

在客户端执行：

```bash
test ! -e ~/.ssh/ops-lab-ed25519
ssh-keygen -t ed25519 -a 64 -f ~/.ssh/ops-lab-ed25519 \
  -C 'operator@ops-lab'
```

命令会提示设置私钥口令。`-a 64` 增加私钥口令派生轮数，不改变服务端公钥格式。若终端提示目标文件已存在，应取消操作并选择新名称，不能覆盖正在使用的密钥。

### 2. 核对公钥

```bash
ssh-keygen -lf ~/.ssh/ops-lab-ed25519.pub
chmod 600 ~/.ssh/ops-lab-ed25519
chmod 644 ~/.ssh/ops-lab-ed25519.pub
```

保存公钥指纹用于服务端核对。不得运行会打印私钥内容的命令，也不要把私钥复制到服务器。

## 四、公钥部署

`ssh-copy-id` 使用现有认证方式把公钥追加到目标账户，适合从密码认证迁移。将主机名与端口替换为实验机实际值。

### 1. 安装公钥

在客户端执行：

```bash
ssh-copy-id -i ~/.ssh/ops-lab-ed25519.pub \
  -p SSH_PORT operator@SERVER_IP
```

命令成功后仍要在服务端验证权限和指纹。`ssh-copy-id` 可能报告密钥已经存在，此时应核对现有条目，而不是重复追加。

### 2. 服务端权限

在保留的旧会话中执行：

```bash
namei -l /home/operator/.ssh/authorized_keys
stat -c '%U:%G %a %n' /home/operator/.ssh \
  /home/operator/.ssh/authorized_keys
sudo -u operator ssh-keygen -lf /home/operator/.ssh/authorized_keys
```

`.ssh` 和 `authorized_keys` 必须由 `operator` 控制，且不能被其他用户写入。常用权限分别是 `700` 与 `600`；上级家目录也不能具有不安全的可写权限。

### 3. 密钥登录

从第二个客户端终端发起明确指定密钥的连接：

```bash
ssh -vv -o IdentitiesOnly=yes \
  -i ~/.ssh/ops-lab-ed25519 -p SSH_PORT operator@SERVER_IP
```

调试输出应显示提供并接受目标公钥。登录后执行 `id` 和只读的 `sudo -v`，确认账户身份与提权路径。此时旧会话仍保持在线。

## 五、关闭密码认证

只有密钥新会话已成功，才进入认证策略变更。示例使用独立片段，便于审查和回退。

### 1. 配置片段

创建 `/etc/ssh/sshd_config.d/10-ops-key-auth.conf`：

```text
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
```

这会关闭密码和键盘交互认证。若环境依赖 PAM 多因素认证、堡垒机挑战流程或一次性口令，`KbdInteractiveAuthentication no` 可能破坏登录，必须按实际认证架构调整。

### 2. 语法与有效值

```bash
sudo chmod 600 /etc/ssh/sshd_config.d/10-ops-key-auth.conf
sudo sshd -t
sudo sshd -T | grep -E '^(passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication) '
```

`sshd -t` 无输出且返回 `0` 才表示语法和密钥文件可用。有效值不符合预期时，检查主配置和所有片段的首次赋值顺序，不能通过重复写入更多配置碰运气。

### 3. 条件化配置

若配置包含 `Match`，应按目标连接条件查看最终值：

```bash
sudo sshd -T \
  -C user=operator,host=SERVER_NAME,addr=CLIENT_IP \
  | grep -E '^(passwordauthentication|pubkeyauthentication) '
```

替换主机名与客户端地址后再执行。全局 `sshd -T` 不能完整代表所有 `Match` 分支。

### 4. 重载服务

```bash
sudo systemctl reload ssh
sudo systemctl is-active ssh
sudo journalctl -u ssh --since '-2 minutes' --no-pager
```

使用 `reload` 让新连接读取配置，已有会话通常不被主动断开。服务状态必须保持 `active`，journal 中不能出现配置加载错误。

## 六、双会话验证

### 1. 密钥成功路径

再次打开一个全新客户端终端，使用目标私钥登录。不要复用已经建立的连接或 SSH 复用通道，否则无法证明新认证发生。

```bash
ssh -o ControlMaster=no -o ControlPath=none \
  -o IdentitiesOnly=yes -i ~/.ssh/ops-lab-ed25519 \
  -p SSH_PORT operator@SERVER_IP
```

登录成功后核对 `who`、`id` 与服务端认证日志，确认这是新会话。

### 2. 密码失败路径

从测试客户端强制只尝试密码认证：

```bash
ssh -o PubkeyAuthentication=no \
  -o PreferredAuthentications=password \
  -p SSH_PORT operator@SERVER_IP
```

预期服务端拒绝密码认证。若仍出现可用的密码提示并最终登录成功，说明有效配置、`Match` 条件或连接目标与预期不一致。

### 3. 服务端日志

```bash
sudo journalctl -u ssh --since '-5 minutes' --no-pager
```

日志应包含密钥成功认证和密码拒绝的对应事件。记录来源地址、账户、时间和认证方法，但不要在工单中粘贴敏感客户端信息或完整公钥。

## 七、回退与维护

### 1. 配置回退

若新会话失败，在旧会话或虚拟机控制台执行：

```bash
sudo rm -- /etc/ssh/sshd_config.d/10-ops-key-auth.conf
sudo sshd -t
sudo systemctl reload ssh
sudo sshd -T | grep -E '^(passwordauthentication|pubkeyauthentication) '
```

回退后重新测试旧认证通道。无法进入系统时使用虚拟机控制台还原快照，不要持续远程试错。

### 2. 密钥撤销

人员离开或密钥泄露时，从 `authorized_keys` 删除准确公钥，并立即用新连接验证。删除前通过指纹确认目标，不按注释文本猜测。

```bash
sudo -u operator ssh-keygen -lf /home/operator/.ssh/authorized_keys
sudoedit /home/operator/.ssh/authorized_keys
sudo -u operator ssh-keygen -lf /home/operator/.ssh/authorized_keys
```

已建立的 SSH 会话不会因删除公钥自动结束。若事件响应要求立即终止访问，还需识别并结束现有会话、轮换其他凭据并检查审计记录。

## 八、常见故障

| 现象 | 证据 | 常见原因 | 处理方向 |
|------|------|----------|----------|
| `Permission denied (publickey)` | 客户端 `-vv`、认证日志 | 公钥未安装、权限错误、账户不匹配 | 核对指纹、路径与所有者 |
| `Connection refused` | `ss`、服务状态 | sshd 未监听或端口错误 | 恢复服务与监听 |
| 连接超时 | 路由、UFW、上游规则 | 入口被丢弃或返回路径错误 | 分层检查网络入口 |
| `sshd -t` 报错 | 文件与行号 | 配置语法或主机密钥错误 | 修正后才重载 |
| 密码仍可登录 | `sshd -T -C` | 更早配置或 `Match` 覆盖 | 按解析顺序修正 |

SSH 加固的完成条件不是配置文件“看起来正确”，而是密钥新会话成功、旧认证失败、服务日志吻合，并且控制台回退路径经过核对。

