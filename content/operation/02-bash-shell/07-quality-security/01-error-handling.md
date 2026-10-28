---
title: "Bash 错误处理"
tags:
  - Bash
  - Shell
excerpt: "解释 Bash 的退出状态如何受到条件上下文、管道和命令替换影响，用一个独立脚本对照 set -e 与 pipefail 的实际作用范围，并给出需要保留错误状态时的显式处理方式。"
date: 2026-09-23
---

# Bash 错误处理

Bash 用命令的**退出状态**表示执行结果：`0` 通常表示成功，非零表示失败或需要调用方处理的其他结果。`set -e`（`errexit`）在特定上下文中会让脚本因非零状态退出，但它**不是“任何命令失败都自动中止”的异常机制**。要判断脚本是否会继续，必须同时看失败命令所在的条件、管道和命令替换，以及调用者最终收到的状态。

## 一、`set -e` 的触发条件

在普通顺序执行中，`set -e` 遇到返回非零的简单命令，脚本会退出。条件判断却需要用非零值表示“不成立”，因此 `if` 测试、`while`/`until` 的条件、部分 `&&`/`||` 列表以及 `!` 取反中的失败，不按同一规则退出。函数如果作为条件被调用，其函数体中的 `-e` 也会受到这一上下文影响；不能仅看函数定义处是否写了 `set -e`。

| 位置 | 失败命令的状态如何使用 | 对 `set -e` 的影响 |
|------|------------------------|--------------------|
| 独立执行的 `false` | 脚本直接收到非零状态 | 当前脚本退出 |
| `if false; then ...` | 非零状态用于选择 `else` | 不因这个测试退出 |
| `false \| true` | 默认由最后的 `true` 决定管道状态 | 整条管道为 `0`，脚本继续 |
| 开启 `pipefail` 后的同一管道 | 取最右侧的非零状态 | 管道非零，脚本退出 |

这里的 `true` 和 `false` 是 Bash 提供的测试命令，分别返回 `0` 和 `1`，适合构造不会触及真实服务的最小对照。GNU Bash 5.3 的 [`set` 选项手册](https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html)列出了 `-e` 的例外；[管道手册](https://www.gnu.org/software/bash/manual/html_node/Pipelines.html)规定了默认状态与 `pipefail` 的区别。

::: warning 条件分支里的失败需要自己判断
`if` 中的非零状态本来就是分支输入，`set -e` 不会替脚本决定它是否属于可忽略错误。若检查的是必须成功的操作，应在 `else` 中报告并显式返回非零，而不是把失败留给后续步骤猜测。
:::

## 二、独立复现六种执行结果

::: info 适用 Bash 5.3 的非 POSIX 执行模式
在隔离的 Ubuntu Server 26.04.1 LTS 终端中使用 GNU Bash 5.3，普通用户即可执行；不需要 `systemd`、网络服务或 root 权限。先用 `bash --version` 核对主版本。示例显式关闭 `pipefail` 和 `inherit_errexit` 作为对照起点，随后只在对应分支改变选项；不要用 `sh failure-modes.sh`，因为 `sh` 不承诺 Bash 的全部选项语义。
:::

1. 在终端中新建一个空目录并进入。若当前目录已经有同名文件夹，改用其他**全新**名称，不覆盖已有内容。

   ```bash
   mkdir ops-lab-errors
   cd ops-lab-errors
   bash --version
   ```

   应看到 Bash 的首行版本为 `5.3` 系列。下面的脚本只读取一个模式参数并打印文字，除脚本文件本身外不会创建或删除其他数据。用终端编辑器新建 `failure-modes.sh`；例如执行 `nano failure-modes.sh` 后粘贴完整内容并保存。若当前系统没有 `nano`，可使用已安装的文本编辑器，文件名和内容保持一致。

2. 在 `failure-modes.sh` 中写入以下完整内容。`case` 根据第一个参数选择单独的执行路径，每次启动的都是新的 Bash 进程；`set -e` 在各路径中保持开启。`explicit` 分支将 `if` 得到的原始非零状态传回调用方，`substitution` 分支则观察默认非 POSIX 模式下的命令替换。

   ::: details 查看 failure-modes.sh 完整代码

   ```bash
   #!/usr/bin/env bash
   set +o pipefail
   shopt -u inherit_errexit
   set -e

   case "${1:-}" in
     direct)
       printf 'before\n'
       false
       printf 'after\n'
       ;;
     guarded)
       if false; then
         printf 'unexpected\n'
       else
         printf 'handled\n'
       fi
       printf 'after\n'
       ;;
     pipeline)
       false | true
       printf 'after pipeline\n'
       ;;
     pipefail)
       set -o pipefail
       false | true
       printf 'after pipeline\n'
       ;;
     substitution)
       result=$(false; printf 'captured\n')
       printf '%s\n' "$result"
       ;;
     explicit)
       if false; then
         printf 'unexpected\n'
       else
         status=$?
         printf 'handled failure (%d)\n' "$status" >&2
         exit "$status"
       fi
       ;;
     *)
       printf 'usage: %s direct|guarded|pipeline|pipefail|substitution|explicit\n' "$0" >&2
       exit 2
       ;;
   esac
   ```

   :::

3. 在 `ops-lab-errors` 目录逐组运行下列命令。`bash failure-modes.sh` 直接用 Bash 解释文件，不要求给文件增加可执行权限。每组第二行的 `$?` 只读取**紧邻的脚本调用**的退出状态；请在普通交互终端逐组执行，不在调用者已经启用 `set -e` 的 Shell 中一次性串联这些命令。

   ::: details 查看六组调用与状态检查命令

   ```bash
   bash failure-modes.sh direct
   printf 'status=%s\n' "$?"
   bash failure-modes.sh guarded
   printf 'status=%s\n' "$?"
   bash failure-modes.sh pipeline
   printf 'status=%s\n' "$?"
   bash failure-modes.sh pipefail
   printf 'status=%s\n' "$?"
   bash failure-modes.sh substitution
   printf 'status=%s\n' "$?"
   bash failure-modes.sh explicit
   printf 'status=%s\n' "$?"
   ```

   :::

   **预期观察（当前尚未在 Bash 5.3 环境实测）：**

   | 模式 | 可见输出 | 退出状态 | 关键原因 |
   |------|----------|----------|----------|
   | `direct` | `before`，没有 `after` | `1` | 独立的 `false` 触发退出 |
   | `guarded` | `handled`、`after` | `0` | `false` 仅用于 `if` 测试 |
   | `pipeline` | `after pipeline` | `0` | 默认取管道最后一项 `true` 的状态 |
   | `pipefail` | 没有 `after pipeline` | `1` | 开启后管道的最右侧非零状态为 `1` |
   | `substitution` | `captured` | `0` | 命令替换内的 `false` 后仍执行 `printf` |
   | `explicit` | 标准错误输出 `handled failure (1)` | `1` | `else` 保存状态并主动退出 |

   若意外看到 `unexpected` 或不同的退出状态，先核对文件内容、是否使用 `bash`、实际版本和选项，再逐个分支运行；不能仅凭表格认定当前环境与基线相同。脚本不接收输入文件，除编写脚本外没有持久副作用，复测只需重新启动对应模式。

## 三、管道与命令替换中的失败传播

管道是多个命令组成的一个执行单元。默认情况下，`false | true` 的状态由末项 `true` 决定，所以外层 `set -e` 看到的是成功。`set -o pipefail` 改为取**最右侧的非零状态**，使同样的上游失败能够作为整条管道的失败传给外层。这个选项只改变管道状态，并不会解释上游失败对业务结果是否可接受；例如无匹配与读取故障需要按具体命令分别判断。

`$(...)` 是命令替换：Bash 在子 Shell 中执行括号内命令，再用它的标准输出替换当前位置。默认的非 POSIX Bash 会在该子 Shell 中清除 `-e`；本例显式关闭 `inherit_errexit`，因此 `false` 后的 `printf` 仍执行，整个替换的最终状态是 `0`。赋值语句拿到 `captured`，外层也不会因早先的 `false` 退出。[Bash 的 `inherit_errexit` 手册](https://www.gnu.org/software/bash/manual/html_node/The-Shopt-Builtin.html)同时说明：POSIX 模式会启用此选项，行为边界随之变化。

为了单独观察这项差异，可在同一普通交互终端执行下面的命令。它启动**另一个** Bash 进程，不修改 `failure-modes.sh`；内部开启 `inherit_errexit` 后，替换中的 `false` 使子 Shell 提前退出，赋值也返回非零，外层 `set -e` 结束该进程。

```bash
bash -c 'set -e; shopt -s inherit_errexit; result=$(false; printf "late\n"); printf "%s\n" "$result"'
printf 'status=%s\n' "$?"
```

**预期观察（未实测）：**不会打印 `late`，第二行显示 `status=1`。这证明 `set -e` 的传播受 Shell 选项和执行上下文共同影响，而不是“打开后处处相同”。如果当前终端本身启用了 `set -e`，仍须在不受它影响的独立交互会话中进行状态检查。

::: tip 需要业务决策时显式检查状态
把可预期的非零状态写在 `if` 的成功与失败分支中，并在失败分支立刻保存 `$?`。本例 `explicit` 保留 `false` 的状态 `1`，而 `guarded` 明确消化该状态并返回 `0`；两者都是有意设计，不应交给 `set -e` 猜测。
:::

## 四、适用边界与撤销

`set -e` 适合作为额外的失败保护，却不能替代参数检查、具体命令的状态判断和失败后的恢复。`pipefail` 防止管道上游失败被末项的成功掩盖；它也不能判断“无匹配”是否就是业务失败。`set -u` 管未设置变量，`trap` 管退出和信号处理，都有独立规则，不能把 `set -euo pipefail` 当作脚本正确性的证明。

测试结束后，在 `ops-lab-errors` 目录核对当前路径以及 `failure-modes.sh` 确实是刚创建的文件。若目录里已有其他数据，不按下面步骤清理。确认后只删除这个文件，再退到父目录并用 `rmdir` 删除**已为空的**测试目录：

```bash
pwd
ls -la
rm -- failure-modes.sh
cd ..
rmdir -- ops-lab-errors
```

`rmdir` 只处理空目录；失败意味着仍有内容，应检查归属而不是递归强删。本文的关键行为依据为 [GNU Bash 5.3 `set` 手册](https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html)、[管道手册](https://www.gnu.org/software/bash/manual/html_node/Pipelines.html)和[`inherit_errexit` 说明](https://www.gnu.org/software/bash/manual/html_node/The-Shopt-Builtin.html)。当前仅完成资料核对与文档结构检查，**完整脚本和预期输出未在 Bash 5.3 中实测，本文仍是待校准样板**。
