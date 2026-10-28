---
title: "沙箱与凭据边界"
tags:
  - AI Agent
  - 沙箱
  - 凭据代理
excerpt: "按文件、进程、网络和凭据识别 Agent 执行环境的信任边界，比较函数工具、受限计算与凭据代理，通过独立反例验证工作目录及环境变量不构成完整隔离。"
date: 2026-09-29
---

# 沙箱与凭据边界

沙箱是由操作系统、虚拟化或受控运行平台实施的执行边界，用于限制不可信代码能够读取的文件、启动的进程、访问的网络和消耗的资源。权限决定动作是否允许，沙箱限制代码实际能触及什么，两者共同约束 Agent。

客服 Agent 查询订单时，可以使用应用注册的函数工具；确实需要执行资料处理代码时，再配置对应受限环境。应用控制器、业务凭据和确认记录应放在不可信执行代码无法直接读取或修改的位置。

## 一、控制器与执行环境

### 1. 分离信任边界

控制器负责身份、预算、确认和工具分派，执行环境只接收当前任务所需输入。执行环境的输出仍需验证，不能因为来自沙箱就视为可信业务事实。

| 位置 | 保存或执行的内容 | 边界 |
|------|------------------|------|
| 可信应用 | 当前身份、确认记录、业务操作键、凭据代理 | 不允许模型生成代码直接读写 |
| 受限执行环境 | 获准的输入文件、临时处理代码和结果 | 只拥有当前任务需要的文件与能力 |
| 业务服务 | 权威订单和提议记录 | 以独立身份、对象授权及幂等规则验收 |

把控制器与不可信代码放在同一个 Python 进程中，代码通常仍能访问同进程状态。名称前加下划线、隐藏类属性或约定“不读取密钥”都不产生操作系统隔离。

### 2. 执行方式的选择

| 方式 | 适用条件 | 主要边界与成本 |
|------|----------|----------------|
| 注册函数工具 | 订单查询等已知小型能力 | 应用控制参数与业务接口，减少任意执行入口 |
| 受限容器或进程环境 | 需要文件处理和脚本执行 | 配置挂载、身份、网络和资源；容器仍需正确约束 |
| 虚拟机或隔离计算平台 | 不可信工作负载需要更强隔离 | 单独计算环境及生命周期成本，仍需权限与凭据策略 |

选择后必须验证真实执行边界，不能从名称中推断安全。以 `cwd` 切换目录，或者使用 Python 的 `-I` 隔离导入模式，都不会自动限制操作系统文件读取。

## 二、文件、进程与网络

### 1. 文件和挂载

挂载是把宿主或存储中的目录暴露给执行环境。输入目录尽量只读，输出目录只暴露当前任务的工作区；读写权限还应由运行身份和实际文件系统配置落实。

| 场景 | 执行侧需要落实的条件 | 验证证据 |
|------|----------------------|----------|
| 读取资料 | 仅暴露获授权快照，输入只读 | 可读当前资料，无法读取其他任务资料 |
| 写输出 | 只允许当前任务输出范围 | 范围外写入失败，输出大小受限 |
| 路径包含 `..` 或符号链接 | 在真实文件边界判断最终目标 | 链接指向范围外时仍被拒绝 |
| 任务之间共享环境 | 分离工作区与身份，或重置隔离环境 | 新任务不能读取旧任务文件 |

应用层路径校验有用，但如果代码能直接调用文件 API，它仍可能绕过只在工具入口执行的路径检查。允许任意代码的环境需要独立系统边界。

::: danger 不暴露宿主控制接口
具有宿主控制权限的套接字、管理接口或高权限挂载会显著扩大执行环境能力。部署受限环境时应检查这些入口，不能仅凭“在容器内运行”判定宿主不可访问。
:::

### 2. 进程与资源

进程限制应覆盖运行身份、允许的能力、子孙进程及退出后清理。只对父进程设置等待超时，不等于所有子孙进程已经结束，也不等于提交的外部动作被撤销。

资源策略至少明确 CPU、内存、进程数、磁盘、输出大小与总运行时间。它们由执行平台提供可执行约束；Prompt 中写“少用资源”不能保证限制成立。

### 3. 网络出口

网络出口是执行代码访问外部或其他服务的通道。按任务限制目的地、协议和请求能力，避免任意 URL 成为业务代理的输入。

代理应检查实际目的地，包括重定向和解析后的地址，并处理内网、回环及云元数据等不应访问的范围。允许一个主机也不代表允许所有接口、任意方法或无限响应内容。

::: warning 文件隔离与网络隔离分别验证
不能读取宿主文件，不代表不能把已有输入发送到外部地址。应同时测试获准服务可达、非批准目的地不可达，并记录规则实施在哪个进程或网络边界。
:::

## 三、凭据与代理

### 1. 环境变量的可见性

凭据是调用服务所需的密钥、令牌或身份材料。环境变量可以用于配置，但同一执行进程通常能够读取自己的环境变量；把真实密钥注入不可信代码所在环境，就已经扩大了密钥的可见范围。

只从最终文本中删除密钥，无法撤销代码已经读取或使用的能力。应分别限制凭据类型、有效期、权限范围和注入位置，同时避免把凭据写进日志、镜像和产物。

### 2. 可信业务代理

凭据代理由可信服务持有凭据，接收经过授权的业务请求，再调用固定服务并返回必要字段。模型或脚本只提出订单号，不能选择任意目标地址、请求头或身份令牌。

```text
受限代码 → 业务请求与可信任务身份 → 代理检查对象与操作
  → 代理为批准目的地提供凭据 → 业务服务 → 公开结果
```

代理不能成为新的任意请求入口。除了目的地，还需限制租户、对象、方法、参数和响应，并保留不含凭据的关联记录。函数工具可以直接把这一职责放在应用执行器中。

::: tip 凭据存储与凭据暴露分别判断
密钥最初保存在秘密管理服务，不代表使用时仍不可见。如果随后把它注入不可信进程，代码依然可以读取；判断边界应追踪实际使用位置。
:::

## 四、可运行边界反例

### 1. 环境与安全范围

使用 Python 3.12 标准库，在空目录创建 `boundary_checks.py`：

```powershell
mkdir execution-boundary-demo
cd execution-boundary-demo
python --version
```

程序只创建自己的临时文件和子进程，不访问真实凭据或外部服务。它使用固定演示令牌模拟环境传递，并用假的订单接口检查代理参数。

::: info 本程序验证反例与接口策略
程序不是沙箱实现，没有配置文件系统、进程或网络隔离。它证明工作目录的边界不足、环境变量在子进程中可见，以及固定代理可以拒绝越界参数；这些用例不能证明部署环境已安全隔离。
:::

### 2. 完整实现

探针从工作区读取本次临时目录中的父级文件，展示 `cwd` 不构成文件限制。代理夹具只返回订单事实，不返回令牌，也不接收任意目的地。

::: details 查看工作目录、演示环境与代理边界七个用例

```python
# boundary_checks.py
import json
import os
import subprocess
import sys
from dataclasses import dataclass, replace
from pathlib import Path
from tempfile import TemporaryDirectory


PROBE = """import json, os
from pathlib import Path
print(json.dumps({
    "outside_readable": Path("../outside.txt").read_text(encoding="utf-8") == "temporary-demo-data",
    "token_visible": os.environ.get("DEMO_SERVICE_TOKEN") == "demo-only-token"
}))
"""


@dataclass(frozen=True)
class BrokerContext:
    """表示可信代理获得的固定任务身份，不从模型请求中读取。"""

    tenant_id: str
    order_ids: frozenset[str]


def run_probe(workspace: Path, environment: dict[str, str]) -> dict:
    """运行受控探针观察 cwd 与显式环境传递，不执行用户代码。

    Args:
        workspace: 本次临时目录中的工作区，父目录只含本程序演示文件。
        environment: 显式环境映射，只包含运行必需项与可选的固定演示令牌。

    Returns:
        两个布尔观察值；子进程失败或超过 5 秒向调用方抛出异常。
    """
    result = subprocess.run([sys.executable, "-I", "-c", PROBE], cwd=workspace,
                            env=environment, capture_output=True, text=True,
                            check=True, timeout=5)
    return json.loads(result.stdout)


def query_order(context: BrokerContext, arguments: dict) -> dict:
    """模拟固定订单代理，授权后只返回公开字段，不接收目的地或凭据。

    Args:
        context: 应用认证上下文，仅允许演示租户 store-a 的已授权订单。
        arguments: 只能包含字符串 order_id，不接受 URL、令牌或任意请求头。

    Returns:
        固定订单事实；越界参数或未授权对象分别抛出 ValueError/PermissionError。
    """
    if (not isinstance(arguments, dict) or set(arguments) != {"order_id"}
            or type(arguments["order_id"]) is not str):
        raise ValueError("unexpected_arguments")
    if context.tenant_id != "store-a" or arguments["order_id"] not in context.order_ids:
        raise PermissionError("permission_denied")
    if arguments["order_id"] != "ORD-2048":
        raise LookupError("demonstration order not found")
    return {"order_id": "ORD-2048", "status": "in_transit", "source": "orders-fixture"}


def run_tests() -> None:
    """验证七条受控反例与代理策略，不读取真实秘密或访问网络。

    Returns:
        无返回值；失败抛出断言错误，通过输出边界观察值并清理临时文件。
    """
    # Windows 子进程保留系统目录配置，不复制当前进程中的业务凭据。
    minimum_environment = {}
    for name in ("SYSTEMROOT", "WINDIR"):
        if name in os.environ:
            minimum_environment[name] = os.environ[name]
    with TemporaryDirectory(prefix="execution-boundary-") as directory:
        root = Path(directory)
        workspace = root / "work"
        workspace.mkdir()
        (root / "outside.txt").write_text("temporary-demo-data", encoding="utf-8")
        clean = run_probe(workspace, minimum_environment)
        assert clean["outside_readable"] is True
        inherited = run_probe(workspace, {**minimum_environment, "DEMO_SERVICE_TOKEN": "demo-only-token"})
        assert inherited["token_visible"] is True
        assert clean["token_visible"] is False and clean["outside_readable"] is True

        context = BrokerContext("store-a", frozenset({"ORD-2048"}))
        result = query_order(context, {"order_id": "ORD-2048"})
        assert set(result) == {"order_id", "status", "source"}
        assert "token" not in json.dumps(result)
        try:
            query_order(replace(context, order_ids=frozenset()), {"order_id": "ORD-2048"})
        except PermissionError as error:
            assert str(error) == "permission_denied"
        else:
            raise AssertionError("unauthorized order accepted")
        for extra in ({"url": "https://unapproved.invalid"}, {"token": "request-secret"}):
            try:
                query_order(context, {"order_id": "ORD-2048", **extra})
            except ValueError as error:
                assert str(error) == "unexpected_arguments"
            else:
                raise AssertionError("extra proxy argument accepted")
        print("boundary_tests=passed cases=7")
        print(f"cwd_confines_files={not clean['outside_readable']} inherited_demo_token_visible={inherited['token_visible']}")
        print(f"filtered_demo_token_visible={clean['token_visible']} broker_returns_credentials=False")


if __name__ == "__main__":
    run_tests()
```

:::

### 3. 执行与观察

运行当前程序：

```powershell
python boundary_checks.py
```

通过时输出：

```text
boundary_tests=passed cases=7
cwd_confines_files=False inherited_demo_token_visible=True
filtered_demo_token_visible=False broker_returns_credentials=False
```

即使指定 `cwd` 且使用 `-I`，探针仍读取到本次测试父目录文件。显式传入演示令牌后，子进程可以看到它；移除令牌只修复环境传递渠道，没有形成文件隔离。代理的四项检查验证成功结果、对象拒绝及两种额外参数拒绝。

代理函数与测试在同进程内，只是接口策略夹具。真实凭据代理必须放在不可信代码无法直接访问的可信位置，并结合认证、目的地限制和执行平台规则部署。

## 五、验证与清理

### 1. 部署证据

针对实际运行平台，应使用受控测试验证下列边界，再开放相应能力。禁止使用真实密钥或客户资料验证外泄路径。

| 边界 | 正常路径 | 拒绝与恢复证据 |
|------|----------|----------------|
| 文件 | 读取当前获准输入，写入当前输出 | 范围外文件、链接目标和其他任务文件不可访问 |
| 进程 | 执行允许任务并正常退出 | 超时、子孙进程和资源超额被处理 |
| 网络 | 获准业务目的地可达 | 非批准地址及重定向目的地被阻断 |
| 凭据 | 代理代表任务访问固定业务能力 | 执行代码不获得实际秘密，越权对象被拒绝 |
| 生命周期 | 只交付验证后的必要产物 | 取消与失败后回收进程、工作区及临时身份 |

本篇没有实际部署容器、虚拟机或网络代理，因此不声称这些隔离策略已经通过实测。设计证据是威胁场景、执行条件和边界反例，适用于选择与验收实际平台。

### 2. 失败与处置

发现范围外读取、网络出口失效或秘密暴露时，应停止相关能力，保留脱敏执行证据，并核对受影响身份与动作。凭据需要按风险撤销或轮换，不能仅删除当前输出中的字符串。

任务结束后回收环境和临时权限，产物按来源及内容复核后交付。保留的调试记录要有权限及保留时间；持久工作区应防止后续任务读到前次资料。

## 六、参考资料

- [OpenAI Sandbox security](https://developers.openai.com/api/docs/guides/agents-api/environments/security)：隔离计算、网络与凭据代理的职责。
- [Python subprocess](https://docs.python.org/3.12/library/subprocess.html)：`cwd`、显式环境及进程执行行为。
- [Python 命令行 `-I`](https://docs.python.org/3.12/using/cmdline.html#cmdoption-I)：隔离导入模式的实际范围。
- [工具权限与人工确认](./01-tool-permissions-human-approval.md)：应用授权与具体动作确认。
- [执行器与错误](../02-tool-execution/02-executors-errors.md)：单次调用的校验、超时及取消边界。
