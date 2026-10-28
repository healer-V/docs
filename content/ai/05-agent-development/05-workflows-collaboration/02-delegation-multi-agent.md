---
title: "委派与多 Agent"
tags:
  - Agent
  - 委派
  - OpenAI API
excerpt: "解释委派契约、上下文最小化和协作拓扑，使用两个独立专家循环查询订单与配送政策，验证工具范围、共享预算和失败传播，并提供原生 Responses 在线执行入口及证据验收。"
date: 2026-09-29
---

# 委派与多 Agent

委派把一个明确子任务交给独立执行者，并约定输入、能力、输出和结束条件。多 Agent 协作允许执行者分别维护模型上下文与动作循环；角色名称不同或重复请求同一个模型，并不自动形成清楚的责任边界。

工单 `CASE-1042` 的订单事实和配送政策可以由两个专家分别调查。订单专家只读取 `ORD-2048`，政策专家只读取标准配送政策；管理者保留工单身份和总体目标，收到可核对的结构化事实后再决定如何合并。

## 一、委派契约

### 1. 子任务与结果

子任务不能只有“帮我处理”这种宽泛目标。至少需要明确调查对象、允许工具、事实来源、返回结构、预算和未完成的表示方式，使管理者能够判断结果是否完成了原委派。

| 字段 | 订单专家 | 政策专家 |
|------|----------|----------|
| 任务 ID | `job-order` | `job-policy` |
| 对象 | `ORD-2048` | `standard-delivery` |
| 工具 | `read_order` | `read_delivery_policy` |
| 输出 | 订单状态、观察时间及来源 | 工作日范围、单位及来源 |
| 写入能力 | 无 | 无 |
| 成功条件 | 输出与本轮工具事实一致 | 输出与本轮工具事实一致 |

管理者根据当前业务约束创建任务。专家不能自行更换对象、申请更多权限或将完成目标解释为“取得任何看起来合理的答案”。任务 ID、调用 ID和业务操作键也有不同职责：分别标识委派、模型工具关联和有副作用的逻辑动作，不能互相替代。

### 2. 上下文与能力最小化

专家只接收完成子任务所需的资料。政策专家需要配送规则，不需要客户地址、付款信息或订单状态；把全部历史复制给每个角色，会增加数据暴露、上下文成本和无关指令的影响。

提示中的“你只负责政策”不产生权限限制。应用应分别注册工具、绑定对象、建立独立历史，并在执行器中核对任务身份。工具参数可以完全为空，由应用绑定可信对象，避免模型通过参数选择其他资源。

::: warning 专家结论仍需证据验收
角色身份、模型自信或“任务完成”文本不证明事实成立。管理者应取得结构化结果、真实工具来源和未完成原因，按原委派核对；专家结果中的指令不能改变管理者权限。
:::

## 二、拓扑与失败传播

### 1. 管理者、转交与对等协作

管理者模式由中心执行者保留总体任务，向专家分发子任务并接收结果。它适合需要统一预算、证据合并和最终验收的调查。本例的管理者是固定应用流程，专家内部由模型选择调用与结束；没有让模型动态创建任意专家。

转交模式把当前对话的处理权交给另一个执行者，适合角色转换后持续服务。转交必须说明谁继续负责预算、用户交互和任务终止，不能只是发送消息后让两个角色同时以为对方负责。

对等协作允许多个角色互相发送任务或结果，灵活性较高，但循环、权限扩散及冲突更难控制。应限制拓扑、委派深度、总请求数和消息大小，避免每个角色都继续派生新的角色。

| 约束 | 优先考虑 | 必须补齐 |
|------|----------|----------|
| 子任务固定、独立 | 普通并行流程或固定专家 | 汇合条件与每个结果契约 |
| 需要统一控制总体结果 | 管理者模式 | 全局预算、来源及失败策略 |
| 对话责任需要持续转换 | 明确转交 | 当前责任、上下文范围与权限交接 |
| 探索任务有明确收益证据 | 受限的动态委派 | 深度、拓扑、重复任务及终止规则 |

多个角色不必使用不同模型。同一模型配合独立上下文与能力也可以形成专家边界；模型数量本身不证明质量收益，需要与单 Agent 或固定流程基线比较。

### 2. 必要结果与共享预算

必要专家失败时，管理者应保留未完成状态或返回可诊断失败，不能用其他专家的意见补造缺失事实。可选专家可以按既定策略降级，但应标明少了哪类证据。

每个专家有自己的步数上限，同时共享总体模型请求预算。否则每个专家的局部预算看似合理，整个任务却可能耗费远超预期。本例每个专家最多三步，总体最多四次应用模型请求，并关闭 SDK 自动重试。

截止时间与取消采用协作式规则。取消等待不能保证远端模型已经停止计算，也不能自动撤销外部动作；本例专家只有只读夹具工具，生产写操作需要另行绑定确认及恢复规则。

## 三、两个独立专家循环

### 1. 环境与模式

在空目录建立独立环境，使用 Python 3.12 与 OpenAI Python SDK 3.19.2，命令为 PowerShell：

```powershell
mkdir agent-delegation-demo
cd agent-delegation-demo
python --version
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install "openai==3.19.2"
```

默认运行使用明确的模型响应替身，验证动作、结果和失败分支，不需要密钥。`--live` 模式使用原生 Responses 调用真实模型；订单和政策工具仍为本文给出的虚构本地资料，不连接真实业务服务。

模型及端点须支持函数工具与结构化输出。本文沿用已验证兼容端点的 `gpt-6-luna` 演示选择，读者可通过 `OPENAI_MODEL` 指定实际有权限的模型；不据此承诺所有账号或兼容服务都支持同样行为。

### 2. 完整实现

创建 `delegated_agents.py`。两个专家分别维护历史，只能查询绑定对象。模型函数调用与工具结果保持 `call_id` 关联，下一轮同时携带模型输出项及工具结果；最终事实必须与本轮实际读取一致。

管理者只有在两个必要专家都通过验收时返回完成。示例的共享预算仅在同一个事件循环中更新，没有跨进程租约或分布式预算功能。

::: details 查看专家循环、共享预算、离线故障与在线入口

```python
# delegated_agents.py
import asyncio
import json
import os
import sys
from dataclasses import dataclass
from types import SimpleNamespace

DATA = {
    "order": {"resource_id": "ORD-2048", "state": "in_transit",
              "observed_at": "2026-09-29T10:00:00Z", "source": "orders/ORD-2048@7"},
    "policy": {"resource_id": "standard-delivery", "min_days": 3, "max_days": 5,
               "unit": "business_day", "source": "shipping-policy@1:delivery"},
}
TOOL_NAMES = {"order": "read_order", "policy": "read_delivery_policy"}


@dataclass(frozen=True)
class Task:
    """应用签发的固定子任务，可信身份不进入模型参数。"""
    job_id: str
    role: str
    tenant_id: str
    resource_id: str


@dataclass
class Budget:
    """单事件循环中的应用请求计数器，SDK 内部重试另行关闭。"""
    limit: int
    used: int = 0

    async def take(self):
        """原子增加当前事件循环中的请求数。

        Returns:
            无返回值；耗尽时抛出 RuntimeError，期间没有 await 让出计数操作。
        """
        if type(self.limit) is not int or not 1 <= self.limit <= 6:
            raise ValueError("invalid_budget")
        if self.used >= self.limit:
            raise RuntimeError("model_budget_exhausted")
        self.used += 1


def tool_definition(task):
    """为绑定对象建立唯一只读工具，无模型可填写的对象字段。

    Args:
        task: 管理者建立的 order 或 policy 子任务。
    Returns:
        Responses 函数工具配置；不暴露其他角色能力。
    """
    return {"type": "function", "name": TOOL_NAMES[task.role],
            "description": "读取当前任务绑定对象的事实；只读，参数必须为空对象。",
            "parameters": {"type": "object", "properties": {}, "required": [], "additionalProperties": False},
            "strict": True}


def output_format(task):
    """为当前角色的最终事实建立最小 JSON Schema。

    Args:
        task: 角色已经校验的子任务。
    Returns:
        text.format 配置；Schema 之外仍需事实和授权校验。
    """
    fields = {name: {"type": "integer" if type(value) is int else "string"}
              for name, value in DATA[task.role].items()}
    return {"type": "json_schema", "name": task.role + "_facts", "strict": True,
            "schema": {"type": "object", "properties": fields,
                       "required": list(fields), "additionalProperties": False}}


def read_bound_resource(task, name, arguments, allowed_ids):
    """执行本地只读夹具，并拒绝跨角色工具或对象参数。

    Args:
        task: 应用持有的可信子任务。
        name: 模型建议的精确工具名称。
        arguments: 已解析参数，必须是空 dict。
        allowed_ids: 当前角色允许的资源 ID 集合，来自应用。
    Returns:
        当前角色的事实副本；范围不符时抛出 PermissionError。
    """
    if task.tenant_id != "shop-a" or task.resource_id not in allowed_ids:
        raise PermissionError("resource_scope")
    if name != TOOL_NAMES[task.role]:
        raise PermissionError("tool_scope")
    if type(arguments) is not dict or arguments:
        raise ValueError("bound_resource_has_no_arguments")
    result = DATA[task.role]
    if result["resource_id"] != task.resource_id:
        raise ValueError("resource_binding")
    return dict(result)


async def specialist(task, requester, budget, allowed_ids):
    """维护独立模型历史，执行一次绑定读取并验收最终事实。

    Args:
        task: 可信子任务，只允许 order 与 policy 角色。
        requester: 异步 responses.create 方法或本文的明确替身。
        budget: 同一管理者共享的应用请求预算。
        allowed_ids: 应用提供的当前角色资源集合。
    Returns:
        带任务 ID、角色、事实及步数的结果；未验收则抛出明确异常。
    """
    if task.role not in DATA or task.tenant_id != "shop-a" or task.resource_id not in allowed_ids:
        raise PermissionError("task_scope")
    history = [
        {"role": "developer", "content": "你是只读调查专家。必须先调用唯一工具取得绑定对象事实。"
         "之后输出与工具结果字段和值完全一致的 JSON，不增加说明，不重复查询，不使用其他工具。"},
        {"role": "user", "content": json.dumps({"resource_id": task.resource_id,
          "goal": "取得当前订单事实" if task.role == "order" else "取得标准配送规则"}, ensure_ascii=False)},
    ]
    evidence = None
    for step in range(1, 4):
        await budget.take()
        response = await requester(model=os.environ.get("OPENAI_MODEL", "gpt-6-luna"), input=history,
                                   tools=[tool_definition(task)], text={"format": output_format(task)},
                                   parallel_tool_calls=False, max_output_tokens=700, store=False)
        if response.status != "completed":
            raise ValueError("model_not_completed")
        items = [item if isinstance(item, dict) else item.model_dump(mode="json", exclude_none=True)
                 for item in response.output]
        calls = [item for item in items if item.get("type") == "function_call"]
        if calls:
            if len(calls) != 1 or evidence is not None or response.output_text.strip():
                raise ValueError("unexpected_tool_sequence")
            call = calls[0]
            if not isinstance(call.get("call_id"), str) or not call["call_id"]:
                raise ValueError("missing_call_id")
            raw = call.get("arguments")
            if not isinstance(raw, str) or len(raw.encode("utf-8")) > 1024:
                raise ValueError("invalid_arguments")
            evidence = read_bound_resource(task, call.get("name"), json.loads(raw), allowed_ids)
            history.extend(items)
            history.append({"type": "function_call_output", "call_id": call["call_id"],
                            "output": json.dumps(evidence, ensure_ascii=False)})
            continue
        if evidence is None:
            raise ValueError("completion_without_evidence")
        candidate = json.loads(response.output_text)
        if (type(candidate) is not dict or set(candidate) != set(evidence) or
                any(type(candidate[key]) is not type(value) or candidate[key] != value
                    for key, value in evidence.items())):
            raise ValueError("final_fact_conflict")
        return {"job_id": task.job_id, "role": task.role, "facts": candidate,
                "model_steps": step, "tool_calls": 1}
    raise RuntimeError("specialist_step_limit")


async def manage(requesters, allowed_by_role, limit=4, deadline=0.2):
    """执行两个必要专家，失败时不以局部结果冒充完成。

    Args:
        requesters: order、policy 到异步请求入口的固定映射。
        allowed_by_role: 两个角色的可信资源集合。
        limit: 1 至 6 的严格整数总体请求上限，默认四次。
        deadline: 正数秒数，离线默认 0.2，在线示例使用 90。
    Returns:
        completed 和两个验收结果，或失败状态及已使用预算。
    """
    if type(deadline) not in (int, float) or not 0 < deadline <= 120:
        raise ValueError("invalid_deadline")
    tasks = [Task("job-order", "order", "shop-a", "ORD-2048"),
             Task("job-policy", "policy", "shop-a", "standard-delivery")]
    budget = Budget(limit)
    try:
        async with asyncio.timeout(deadline):
            async with asyncio.TaskGroup() as group:
                running = [group.create_task(specialist(task, requesters[task.role], budget,
                                                       allowed_by_role[task.role])) for task in tasks]
            return {"status": "completed", "results": [item.result() for item in running], "requests": budget.used}
    except TimeoutError:
        return {"status": "failed", "reason": "deadline", "requests": budget.used}
    except ExceptionGroup:
        return {"status": "failed", "reason": "specialist_failed", "requests": budget.used}


class FixtureRequester:
    """明确的模型响应替身，验证控制协议，不代表模型能力。"""

    def __init__(self, role, mode="normal"):
        """准备当前角色与故障模式。

        Args:
            role: order 或 policy 的固定测试角色。
            mode: normal、early、wrong_tool、extra_argument、bad_final 或 timeout。
        Returns:
            无返回值；保存测试请求和取消观察。
        """
        self.role, self.mode = role, mode
        self.inputs = []
        self.cancelled = False

    async def __call__(self, **kwargs):
        """模拟两步工具协议，必要时注入失败。

        Args:
            kwargs: specialist 构造的 SDK 请求字段，记录 input 以检查上下文最小化。
        Returns:
            明确的 completed 响应替身；timeout 模式等待外部取消。
        """
        self.inputs.append(json.loads(json.dumps(kwargs["input"])))
        try:
            if self.mode == "timeout":
                await asyncio.Event().wait()
            await asyncio.sleep(0)
        except asyncio.CancelledError:
            self.cancelled = True
            raise
        if len(self.inputs) == 1 and self.mode != "early":
            name = "propose_refund" if self.mode == "wrong_tool" else TOOL_NAMES[self.role]
            args = '{"order_id":"ORD-9999"}' if self.mode == "extra_argument" else "{}"
            return SimpleNamespace(status="completed", output=[{"type": "function_call", "name": name,
                                   "arguments": args, "call_id": "call-" + self.role}], output_text="")
        facts = dict(DATA[self.role])
        if self.mode == "bad_final":
            facts["source"] = "invented-source"
        return SimpleNamespace(status="completed", output=[], output_text=json.dumps(facts))


async def run_checks():
    """验证独立上下文、权限、伪完成、总体预算与必要专家失败。

    Returns:
        无返回值；断言通过后输出离线验证结果。
    """
    allowed = {"order": frozenset({"ORD-2048"}), "policy": frozenset({"standard-delivery"})}
    requesters = {role: FixtureRequester(role) for role in DATA}
    result = await manage(requesters, allowed)
    assert result["status"] == "completed" and result["requests"] == 4
    assert len(result["results"]) == 2 and all(item["model_steps"] == 2 for item in result["results"])
    assert "ORD-2048" not in json.dumps(requesters["policy"].inputs)
    assert "standard-delivery" not in json.dumps(requesters["order"].inputs)
    for mode in ("early", "wrong_tool", "extra_argument", "bad_final"):
        failed = await manage({"order": FixtureRequester("order", mode), "policy": FixtureRequester("policy")}, allowed)
        assert failed["status"] == "failed" and failed["reason"] == "specialist_failed"
    insufficient = await manage({role: FixtureRequester(role) for role in DATA}, allowed, limit=3)
    assert insufficient["status"] == "failed" and insufficient["requests"] == 3
    blocked = {"order": frozenset(), "policy": allowed["policy"]}
    denied = await manage({role: FixtureRequester(role) for role in DATA}, blocked)
    assert denied["status"] == "failed"
    slow = FixtureRequester("order", "timeout")
    timed = await manage({"order": slow, "policy": FixtureRequester("policy")}, allowed, deadline=0.01)
    assert timed["reason"] == "deadline" and slow.cancelled
    print("delegation_checks=passed")
    print("roles=2 shared_requests=4 cross_role_context=absent partial_success=rejected")


async def run_live():
    """用原生 SDK 执行同一专家循环，工具数据仍为本文夹具。

    Returns:
        无返回值；验收通过后输出角色、来源与请求数量，不输出密钥或端点。
    """
    from openai import AsyncOpenAI
    if not os.environ.get("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY required")
    allowed = {"order": frozenset({"ORD-2048"}), "policy": frozenset({"standard-delivery"})}
    async with AsyncOpenAI(timeout=30.0, max_retries=0) as client:
        result = await manage({role: client.responses.create for role in DATA}, allowed, deadline=90)
    if result["status"] != "completed":
        raise RuntimeError(result["reason"])
    print("delegation_live=passed roles=2 requests=" + str(result["requests"]))
    for item in result["results"]:
        print(item["role"] + " source=" + item["facts"]["source"])


if __name__ == "__main__":
    try:
        asyncio.run(run_live() if "--live" in sys.argv else run_checks())
    except Exception as error:
        # 对外仅报告异常类型，避免 SDK 错误文本携带自定义端点或请求资料。
        print("delegation_failed=" + type(error).__name__)
        raise SystemExit(1)
```

:::

### 3. 离线与在线执行

先验证确定性分支：

```powershell
.\.venv\Scripts\python.exe delegated_agents.py
```

通过时输出如下：

```text
delegation_checks=passed
roles=2 shared_requests=4 cross_role_context=absent partial_success=rejected
```

检查包含越权工具、额外对象参数、无证据完成、虚构来源、共享预算耗尽及必要专家超时。政策历史中没有订单号，订单历史中没有政策对象，证明当前夹具按职责分配上下文。

准备有权限的测试项目密钥及模型后，可执行在线模式。下面输入只进入当前进程环境，不写入文件；使用自定义 `OPENAI_BASE_URL` 时，先确认它是获授权且支持 Responses 的服务：

```powershell
$taskApiSecret = Read-Host "测试项目密钥" -AsSecureString
$env:OPENAI_API_KEY = [System.Net.NetworkCredential]::new("", $taskApiSecret).Password
$env:OPENAI_MODEL = "gpt-6-luna"
.\.venv\Scripts\python.exe delegated_agents.py --live
```

在线模式只发送本文虚构的任务和工具事实。成功输出角色及经过验收的来源；请求数受四次总体预算限制。认证失败、模型不支持工具或结构化输出、提前结束及事实不一致都会返回非零退出码，应先检查配置或能力，不能取消事实验收来获取“完成”。

2026-09-29 使用上述 SDK、模型标识与当前兼容端点实际执行，输出为：

```text
delegation_live=passed roles=2 requests=4
order source=orders/ORD-2048@7
policy source=shipping-policy@1:delivery
```

::: info 在线调用与业务接入分别验证
模型调用成功可以证明当前端点下的两个独立工具循环及事实验收。订单与政策工具仍是本地夹具，不证明真实身份、订单服务、数据刷新或生产权限已经接入。
:::

## 四、委派失败与回退

| 现象 | 观察依据 | 处理 |
|------|----------|------|
| 专家不断新增子任务 | 委派深度与任务身份 | 限定允许角色和派生规则，耗尽时停止 |
| 角色收到过多资料 | 每个初始上下文与工具集合 | 按职责最小化，不复制全量用户历史 |
| 部分成功被当作总成功 | 必要角色终态与验收记录 | 明确缺失结果，返回失败或约定降级 |
| 专家使用其他角色工具 | 调用名称与执行器范围 | 在执行前拒绝，不依赖提示声明 |
| 总成本超出局部预估 | 全局模型请求、工具请求和重试 | 共享预算，保留失败时的已用计数 |

多专家架构只有在职责拆分确实带来质量、隔离或维护收益时才值得采用。需要比较同样任务下的单流程或单 Agent 基线，确认新增上下文、请求和合并成本可以接受。

## 五、参考资料

- [OpenAI Function calling](https://developers.openai.com/api/docs/guides/function-calling)：模型动作、应用执行及工具结果关联。
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)：本例最终事实的结构化输出。
- [Python TaskGroup](https://docs.python.org/3.12/library/asyncio-task.html#task-groups)：必要异步任务的等待与失败传播。
- [工作流编排](./01-workflow-orchestration.md)：固定分支及汇合条件。
- [沙箱与凭据边界](../03-permissions-isolation/02-sandbox-credential-boundaries.md)：角色提示不能代替执行环境与秘密隔离。
