---
title: "人工中断与恢复"
tags:
  - AI 应用开发
  - LangGraph
  - 人工审批
  - 持久执行
excerpt: "使用 LangGraph 的 interrupt() 在节点中暂停等待人工决定，通过 Command(resume=...) 按批准、改额、拒绝恢复，并用离线实验观察节点重新执行、副作用重复和恢复失败的处理方法。"
date: 2026-11-18
---

# 人工中断与恢复

退款、发布、删除这类动作，执行前常常需要有人先确认。审批可能几分钟后完成，也可能隔一夜；如果程序原地阻塞等待，进程重启或请求超时都会丢掉进度，等待期间还一直占着运行资源。

LangGraph 把“等人”拆成两次调用。节点调用 `interrupt()` 时，图把当前状态保存到检查点后停止运行，并把需要人看的内容交给调用方；拿到决定后，调用方用 `Command(resume=...)` 再调用一次同一个图，决定成为 `interrupt()` 的返回值，图从暂停的节点继续。两次调用之间不需要保留任何 Python 对象，只要检查点还在即可。

这里的“继续”不是从 `interrupt()` 那一行往下执行，而是把暂停的节点从第一行重新执行一遍。中断之前写日志、发通知或扣款，恢复后都会再发生一次。本文用一个虚构的退款审批图依次验证：怎样暂停，怎样按不同决定恢复，重新执行会带来哪些问题，恢复失败时怎样处理。

::: info 实验环境与边界
示例使用 Python 3.12、langgraph 1.2.22 与 langgraph-checkpoint 4.3.2，不调用模型，也不需要 API Key。接口行为依据 2026-11-18 核对的 [Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts) 与 [Persistence](https://docs.langchain.com/oss/python/langgraph/persistence) 官方文档，并在 macOS 上实际运行。检查点保存在进程内存中，进程退出后暂停的运行无法再恢复。
:::

## 一、暂停与恢复涉及的对象

### 1. interrupt() 交出载荷并等待返回值

`interrupt(value)` 在图的节点函数里调用。第一次执行到这里时，它不返回值，而是抛出框架内部的 `GraphInterrupt` 异常，让本次运行停在这个节点。传入的 `value` 称为中断载荷，是交给审批人查看的内容，例如申请编号和金额。

使用 `invoke()` 运行图时，载荷出现在返回字典的 `__interrupt__` 键下。这个键对应一个列表，每一项是一个 `Interrupt` 对象：`.value` 是载荷，`.id` 是这次中断的编号。官方文档的新示例多使用 `stream_events(..., version="v3")` 以事件流读取中断，同时说明 `invoke()` 仍然可用；本文只用 `invoke()`，以减少需要同时理解的接口。

载荷和恢复值都应当是能序列化为 JSON 的数据，例如字符串、数字、列表和字典，因为它们要随检查点保存。函数、数据库连接这类对象在内存检查点中也许能运行，换成写入磁盘或数据库的检查点实现时就可能无法保存。

### 2. 检查点与 thread_id 保存等待位置

检查点器（checkpointer）负责在图的每一步执行后保存状态。暂停时，“停在哪个节点、当时的状态是什么”都记录在检查点里；没有检查点器，就没有地方保存这些信息。检查点器在编译图时通过 `compile(checkpointer=...)` 挂上，本文使用 `InMemorySaver`，它把检查点存放在当前进程的内存中。

`thread_id` 是一次运行的标识，写在调用配置 `{"configurable": {"thread_id": ...}}` 中。同一个 `thread_id` 下的检查点组成一条历史，恢复时框架依靠它找到对应的暂停位置。示例中一张退款申请对应一个 `thread_id`，直接使用申请编号，不同申请的等待互不影响。

暂停后可以用 `graph.get_state(config)` 查看这条线程。返回对象的 `.next` 列出接下来要执行的节点：暂停在审批节点时是 `('review',)`，运行结束后是空元组 `()`。调用方据此判断某张申请是否还在等待审批。

### 3. Command(resume=...) 把决定送回节点

恢复时不再传入初始状态，而是传入 `Command(resume=决定)`，并使用与暂停时相同的 `thread_id`。框架从检查点取回状态，重新执行暂停的节点；执行到 `interrupt()` 时，这次它直接返回 `resume` 中的值，节点继续往下运行。

| 阶段 | 调用方传入 | `interrupt()` 的表现 | 线程状态 |
|------|------------|----------------------|----------|
| 首次运行 | 初始状态与 `thread_id` | 抛出中断，载荷交给调用方 | `.next` 为 `('review',)` |
| 恢复 | `Command(resume=决定)` 与同一个 `thread_id` | 返回决定 | 按节点的返回值继续执行 |
| 结束后再次恢复 | 任意 `Command(resume=...)` | 不再执行 | 实测直接返回最终状态，不报错 |

最后一行说明，对已经结束的线程重复提交决定不会触发第二次执行，但也不会给出任何提示。调用方如果需要区分“本次决定已生效”和“决定提交得太晚”，应先读取 `.next` 再提交。

## 二、退款审批示例

### 1. 创建环境

准备 Python 3.12，在自己新建的空目录 `approval-interrupt` 中运行实验。Bash 和 zsh 使用下面的命令；`python3.12` 必须指向已安装的 Python 3.12。

```bash
mkdir approval-interrupt
cd approval-interrupt
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install "langgraph==1.2.22" "langgraph-checkpoint==4.3.2"
python -c "import importlib.metadata as m; print(m.version('langgraph'), m.version('langgraph-checkpoint'))"
```

最后一条命令应显示 `1.2.22 4.3.2`。langgraph 还会自动安装 langchain-core 等依赖，本次实测为 langchain-core 1.8.2。若出现 `ModuleNotFoundError`，先确认虚拟环境已经激活，再使用同一个 `python -m pip` 安装。

Windows PowerShell 使用相同的目录和依赖，以下写法未在 Windows 上实测：

```powershell
mkdir approval-interrupt
cd approval-interrupt
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install "langgraph==1.2.22" "langgraph-checkpoint==4.3.2"
```

### 2. 编写审批图

图里只有两个节点。`review` 调用 `interrupt()` 暂停，把申请编号、金额和上一次的提示交给审批人；`refund` 向一个模拟的外部退款系统记录退款。审批人的决定是一个字典，`action` 取下面三种值之一：

| 决定 | 字典示例 | 结果 |
|------|----------|------|
| 批准 | `{"action": "approve"}` | 按原金额退款 |
| 改额 | `{"action": "edit", "amount": 80}` | 按新金额退款，新金额必须大于 0 且不超过原金额 |
| 拒绝 | `{"action": "reject"}` | 不退款，状态标记为 `rejected` |

`review` 返回 `Command(goto=..., update=...)`，在一个返回值里同时指定下一步去哪个节点和要更新的状态字段。决定不合法时，节点不抛出异常，而是把提示写进 `review_note`，再用 `goto="review"` 回到自己，让审批人看到提示后重新决定。第四节会说明抛出异常为什么麻烦。

在当前目录新建 UTF-8 文件 `refund_approval.py`，写入下面的完整代码。`REFUND_LOG` 代替真实的退款系统，用来核对每张申请最终退了多少钱、是否只退了一次。

::: details 查看 refund_approval.py 完整代码

```python [refund_approval.py]
from typing import Literal, TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt

# 模拟外部退款系统收到的指令，用来核对退款是否只发生一次。
REFUND_LOG: list[str] = []


class RefundState(TypedDict):
    """一张退款申请在图中流转的状态。"""

    request_id: str
    amount: int
    status: str
    review_note: str


def review(state: RefundState) -> Command[Literal["review", "refund", "__end__"]]:
    """暂停等待人工决定，再按决定选择下一步。

    Returns:
        批准或改额时转到 refund；拒绝时结束并标记 rejected；
        决定不合法时写入提示并回到 review，重新暂停询问。
    """
    decision = interrupt(
        {
            "request_id": state["request_id"],
            "amount": state["amount"],
            "note": state["review_note"],
        }
    )
    action = decision.get("action")
    if action == "approve":
        return Command(goto="refund")
    if action == "reject":
        return Command(goto=END, update={"status": "rejected"})
    new_amount = decision.get("amount")
    if action == "edit" and isinstance(new_amount, int) and 0 < new_amount <= state["amount"]:
        return Command(goto="refund", update={"amount": new_amount})
    return Command(goto="review", update={"review_note": f"无效决定 {decision}，请重新审批"})


def refund(state: RefundState) -> dict:
    """向模拟退款系统记录一次退款，返回更新后的状态字段。"""
    REFUND_LOG.append(f"{state['request_id']}:{state['amount']}")
    return {"status": "refunded"}


def build_graph(with_checkpointer: bool = True):
    """组装审批图，返回可调用的已编译图。

    Args:
        with_checkpointer: 为 True 时挂上内存检查点；为 False 时不保存状态，用于观察失败。
    """
    builder = StateGraph(RefundState)
    builder.add_node("review", review)
    builder.add_node("refund", refund)
    builder.add_edge(START, "review")
    builder.add_edge("refund", END)
    return builder.compile(checkpointer=InMemorySaver() if with_checkpointer else None)


def run_case(graph, request_id: str, amount: int, decisions: list[dict]) -> None:
    """用一个独立 thread_id 运行一张申请，依次提交人工决定，只打印不返回。

    Args:
        graph: build_graph() 返回的已编译图。
        request_id: 申请编号，同时用作 thread_id。
        amount: 申请退款金额，单位为元。
        decisions: 按顺序提交给 Command(resume=...) 的人工决定。
    """
    config = {"configurable": {"thread_id": request_id}}
    initial = {"request_id": request_id, "amount": amount, "status": "pending", "review_note": ""}
    result = graph.invoke(initial, config)
    for decision in decisions:
        payload = result["__interrupt__"][0].value
        print(f"[{request_id}] 暂停 {payload} next={graph.get_state(config).next}")
        result = graph.invoke(Command(resume=decision), config)
    print(f"[{request_id}] 结束 status={result['status']} amount={result['amount']}")


def main() -> None:
    """运行四张申请并打印退款记录，不返回值。"""
    graph = build_graph()
    run_case(graph, "R-1001", 120, [{"action": "approve"}])
    run_case(graph, "R-1002", 120, [{"action": "edit", "amount": 80}])
    run_case(graph, "R-1003", 120, [{"action": "reject"}])
    run_case(graph, "R-1004", 120, [{"action": "edit", "amount": 500}, {"action": "edit", "amount": 60}])
    print("退款记录", REFUND_LOG)


if __name__ == "__main__":
    main()
```

:::

`run_case()` 模拟调用方：先用初始状态启动一张申请，然后每提交一个决定之前，打印这次的中断载荷和 `.next`。四张申请分别覆盖批准、改额、拒绝，以及先交不合法金额、再交合法金额的情况。`build_graph()` 的 `with_checkpointer` 参数供第四节观察缺少检查点时的失败。

### 3. 运行与输出

```bash
python refund_approval.py
```

本次实测输出如下：

```text
[R-1001] 暂停 {'request_id': 'R-1001', 'amount': 120, 'note': ''} next=('review',)
[R-1001] 结束 status=refunded amount=120
[R-1002] 暂停 {'request_id': 'R-1002', 'amount': 120, 'note': ''} next=('review',)
[R-1002] 结束 status=refunded amount=80
[R-1003] 暂停 {'request_id': 'R-1003', 'amount': 120, 'note': ''} next=('review',)
[R-1003] 结束 status=rejected amount=120
[R-1004] 暂停 {'request_id': 'R-1004', 'amount': 120, 'note': ''} next=('review',)
[R-1004] 暂停 {'request_id': 'R-1004', 'amount': 120, 'note': "无效决定 {'action': 'edit', 'amount': 500}，请重新审批"} next=('review',)
[R-1004] 结束 status=refunded amount=60
退款记录 ['R-1001:120', 'R-1002:80', 'R-1004:60']
```

每张申请第一次 `invoke()` 都停在 `review`，打印出的载荷就是 `interrupt()` 收到的字典。R-1001 批准后按 120 元退款；R-1002 改额后按 80 元退款；R-1003 被拒绝，状态为 `rejected`，退款记录中没有它。

R-1004 第一次提交的 500 元超过原金额，节点没有退款，而是带着提示再次暂停，第二条载荷的 `note` 显示了被拒收的决定。第二次提交 60 元后才进入 `refund`。最后一行的退款记录中每张申请最多出现一次，说明三种决定和不合法输入都没有造成重复退款或漏退款。

## 三、恢复时节点从头执行

### 1. 中断前的副作用会重复

官方文档对恢复的描述是：从调用 `interrupt()` 的那个节点的开头重新执行，而不是从 `interrupt()` 所在的行继续。节点中位于 `interrupt()` 之前的代码，在首次运行时执行一次，恢复时又执行一次。

下面的程序用计数器记录每个节点函数被调用的次数，用 `NOTICES` 模拟发出的审批通知，比较四种写法：

| 场景 | 节点写法 | 要观察的现象 |
|------|----------|--------------|
| `T-unsafe` | 先发通知，再调用 `interrupt()` | 通知是否重复 |
| `T-safe` | 通知放在独立的 `notify` 节点，审批节点只负责中断 | 通知是否只发一次 |
| `T-swallow` | 用 `try/except Exception` 包住 `interrupt()` | 图是否还会暂停 |
| `T-two` | 同一节点依次调用两次 `interrupt()` | 两次答复如何对应 |

在同一目录新建 `side_effect_demo.py`：

::: details 查看 side_effect_demo.py 完整代码

```python [side_effect_demo.py]
from typing import TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt

NOTICES: list[str] = []
CALLS = {"unsafe": 0, "safe": 0, "swallow": 0, "two_step": 0}


class TicketState(TypedDict):
    """一张待审批工单的状态。"""

    ticket: str
    answer: str


def unsafe_review(state: TicketState) -> dict:
    """反例：在中断前发送通知，返回人工答复。"""
    CALLS["unsafe"] += 1
    NOTICES.append(f"unsafe:{state['ticket']}")
    return {"answer": interrupt("请审批")}


def notify(state: TicketState) -> dict:
    """修正：通知放在独立节点，执行完成后才进入审批节点，返回空更新。"""
    NOTICES.append(f"safe:{state['ticket']}")
    return {}


def safe_review(state: TicketState) -> dict:
    """修正后的审批节点只负责中断，返回人工答复。"""
    CALLS["safe"] += 1
    return {"answer": interrupt("请审批")}


def swallow_review(state: TicketState) -> dict:
    """反例：用宽泛的 except 包住 interrupt()，返回默认答复。"""
    CALLS["swallow"] += 1
    try:
        answer = interrupt("请审批")
    except Exception:
        answer = "默认通过"
    return {"answer": answer}


def two_step_review(state: TicketState) -> dict:
    """同一节点内依次请求两位审批人，返回两次答复的组合。"""
    CALLS["two_step"] += 1
    first = interrupt("第一位审批人")
    second = interrupt("第二位审批人")
    return {"answer": f"{first}|{second}"}


def build(*nodes) -> object:
    """把节点按顺序串成一条链并挂上内存检查点，返回已编译图。

    Args:
        nodes: 依次执行的节点函数，节点名取函数名。
    """
    builder = StateGraph(TicketState)
    previous = START
    for node in nodes:
        builder.add_node(node.__name__, node)
        builder.add_edge(previous, node.__name__)
        previous = node.__name__
    builder.add_edge(previous, END)
    return builder.compile(checkpointer=InMemorySaver())


def run(name: str, graph, answers: list[str]) -> None:
    """启动一次运行，每次暂停时按顺序提交一个答复，只打印不返回。

    Args:
        name: 打印用的场景名，同时用作 thread_id。
        graph: build() 返回的已编译图。
        answers: 依次交给 Command(resume=...) 的答复。
    """
    config = {"configurable": {"thread_id": name}}
    result = graph.invoke({"ticket": name, "answer": ""}, config)
    pauses = 0
    for answer in answers:
        if "__interrupt__" not in result:
            break
        pauses += 1
        result = graph.invoke(Command(resume=answer), config)
    print(f"{name}: 暂停次数={pauses} answer={result['answer']}")


def main() -> None:
    """依次运行四个场景并打印调用次数与通知记录，不返回值。"""
    run("T-unsafe", build(unsafe_review), ["approve"])
    run("T-safe", build(notify, safe_review), ["approve"])
    run("T-swallow", build(swallow_review), ["approve"])
    run("T-two", build(two_step_review), ["A", "B"])
    print("节点调用次数", CALLS)
    print("通知记录", NOTICES)


if __name__ == "__main__":
    main()
```

:::

```bash
python side_effect_demo.py
```

```text
T-unsafe: 暂停次数=1 answer=approve
T-safe: 暂停次数=1 answer=approve
T-swallow: 暂停次数=0 answer=默认通过
T-two: 暂停次数=2 answer=A|B
节点调用次数 {'unsafe': 2, 'safe': 2, 'swallow': 1, 'two_step': 3}
通知记录 ['unsafe:T-unsafe', 'unsafe:T-unsafe', 'safe:T-safe']
```

`unsafe_review` 被调用了两次，通知记录中 `unsafe:T-unsafe` 也出现了两次：第一次在暂停前发出，第二次在恢复时重新执行节点开头发出。如果这里是发短信或调用支付接口，审批人就会收到两条通知，或者产生两次扣款。

`safe_review` 同样被调用了两次，这是恢复机制的正常表现；但它在 `interrupt()` 之前没有副作用，重复执行不会造成影响。`notify` 是另一个节点，它执行完毕后结果已经写入检查点，恢复时框架从 `safe_review` 开始，不会再运行 `notify`，所以 `safe:T-safe` 只出现一次。

处理中断前的副作用有三种做法：把副作用放到 `interrupt()` 之后，恢复时才执行；把副作用拆成中断节点之前的独立节点，就像 `T-safe`；或者让副作用本身幂等，即重复执行与执行一次的结果相同，例如带上去重编号再写入外部系统。节点失败重试、进程崩溃后恢复同样会重放代码，幂等处理在本章《副作用、重放与重试》中展开。

### 2. 宽泛的异常捕获会吞掉中断

`T-swallow` 的暂停次数为 0，答复是 `默认通过`：审批节点根本没有停下，申请在没有任何人确认的情况下走完了流程。原因在于 `interrupt()` 依靠抛出 `GraphInterrupt` 让图暂停，而在 langgraph 1.2.22 中，`GraphInterrupt` 的父类链为 `GraphBubbleUp → Exception`，`except Exception` 会把它当作普通错误捕获，框架就收不到暂停信号。

::: danger 不要用 try/except Exception 包住 interrupt()
审批节点吞掉中断后，程序不会报错，而是带着默认值继续执行，审批被悄悄绕过。需要处理异常时，把 `interrupt()` 放在 `try` 块之外，或者只捕获具体的异常类型，例如网络请求的 `ConnectionError`。
:::

### 3. 同一节点的多个中断按顺序匹配

`T-two` 暂停了两次，最终答复为 `A|B`，节点函数被调用了三次：首次运行停在第一个 `interrupt()`；第一次恢复从头执行，第一个 `interrupt()` 返回 `A`，停在第二个；第二次恢复再从头执行，两个 `interrupt()` 依次返回 `A` 和 `B`。

框架为正在执行的节点保存一份恢复值列表，按 `interrupt()` 的调用顺序，第 1 次调用取第 1 个值，第 2 次调用取第 2 个值，只看位置，不看代码写在哪一行。因此，同一节点内的中断必须每次以相同顺序出现：不要用条件判断有时跳过某个 `interrupt()`，也不要在 `while True` 循环中反复调用 `interrupt()`，否则恢复值会对应到错误的问题上。

退款示例需要“答错了再问一次”，采用的是回到节点自身的写法：`review` 返回 `Command(goto="review")` 后，下一次进入 `review` 是一次新的节点执行，前一次的恢复值不会被它取到。R-1004 的输出中，第二次暂停带着新提示等待新的决定，而不是直接复用第一次的 500 元。

## 四、失败边界与恢复办法

### 1. 观察失败的程序

在同一目录新建 `failure_demo.py`。它导入 `refund_approval.py` 中的 `build_graph()`，依次触发缺少检查点、缺少或用错 `thread_id`、恢复值导致节点异常四类失败，并演示异常之后怎样让线程回到可审批的状态。

::: details 查看 failure_demo.py 完整代码

```python [failure_demo.py]
from langgraph.types import Command

from refund_approval import build_graph


def attempt(label: str, action) -> None:
    """执行一次操作，打印结果或异常类型与信息，不返回值。

    Args:
        label: 打印用的场景说明。
        action: 无参数的可调用对象，执行要观察的操作。
    """
    try:
        result = action()
        print(f"{label}: 成功 {result}")
    except Exception as error:
        print(f"{label}: {type(error).__name__}: {error}")


def main() -> None:
    """依次触发四种失败并打印结果，不返回值。"""
    initial = {"request_id": "R-2001", "amount": 120, "status": "pending", "review_note": ""}

    no_saver = build_graph(with_checkpointer=False)
    config = {"configurable": {"thread_id": "R-2001"}}
    attempt("无检查点·首次运行", lambda: "__interrupt__" in no_saver.invoke(initial, config))
    attempt("无检查点·恢复", lambda: no_saver.invoke(Command(resume={"action": "approve"}), config))

    graph = build_graph()
    attempt("缺少 thread_id", lambda: graph.invoke(initial))
    graph.invoke(initial, config)
    wrong = {"configurable": {"thread_id": "R-2999"}}
    attempt("错误 thread_id", lambda: graph.invoke(Command(resume={"action": "approve"}), wrong))

    attempt("恢复值不是字典", lambda: graph.invoke(Command(resume="approve"), config))
    attempt("再交合法决定", lambda: graph.invoke(Command(resume={"action": "approve"}), config)["status"])
    graph.update_state(config, {"review_note": "上次决定格式错误，请重新审批"})
    attempt("修正状态后继续", lambda: graph.invoke(None, config)["__interrupt__"][0].value["note"])
    attempt("重新审批", lambda: graph.invoke(Command(resume={"action": "approve"}), config)["status"])


if __name__ == "__main__":
    main()
```

:::

```bash
python failure_demo.py
```

```text
无检查点·首次运行: 成功 True
无检查点·恢复: RuntimeError: Cannot use Command(resume=...) without checkpointer
缺少 thread_id: ValueError: Checkpointer requires one or more of the following 'configurable' keys: thread_id, checkpoint_ns, checkpoint_id
错误 thread_id: KeyError: 'request_id'
恢复值不是字典: AttributeError: 'str' object has no attribute 'get'
再交合法决定: AttributeError: 'str' object has no attribute 'get'
修正状态后继续: 成功 上次决定格式错误，请重新审批
重新审批: 成功 refunded
```

### 2. 缺少检查点或 thread_id

没有检查点器时，首次运行仍然返回了 `__interrupt__`，看起来与正常情况一样；直到提交决定时才报 `RuntimeError`，因为暂停时的状态没有保存下来，恢复无从开始。只验证“能暂停”的测试发现不了这个问题，测试至少要覆盖一次完整的恢复。

挂了检查点器但调用配置里没有 `thread_id` 时，首次运行就报 `ValueError`，错误信息列出了需要的 `configurable` 键。这个错误出现得早，比较容易定位。

### 3. 错误的 thread_id 会启动新运行

用一个从未运行过的 `R-2999` 提交决定，框架找不到对应的暂停位置，把它当作一条新线程从头运行。新线程的状态是空的，`review` 读取 `state["request_id"]` 时报 `KeyError`。报错的位置和类型取决于节点代码，如果节点不读取缺失的字段，这次调用甚至可能悄悄跑出一条新的运行记录。

调用方在提交决定前，应先用 `graph.get_state(config).next` 确认这条线程确实停在审批节点；`.next` 为空时，说明 `thread_id` 写错了或流程已经结束，应拒绝这次提交，而不是直接调用 `invoke()`。

### 4. 恢复值引发异常后的处理

`review` 只检查了字典中的字段，没有检查决定本身是不是字典。提交字符串 `"approve"` 时，`decision.get` 报 `AttributeError`，节点异常结束。示例有意保留这个缺口，用来观察异常之后的状态。

接下来再提交合法的 `{"action": "approve"}`，实测仍然报同一个错误：失败的那次恢复值仍记录在这条线程的检查点中，后续恢复会先取到它。示例程序之外另行实测了两种做法：按中断编号指定恢复值，以及用 `invoke(None, config)` 直接继续，同样重现这个错误。

可行的办法是用 `graph.update_state(config, {...})` 写入一次状态更新，生成新的检查点，再调用 `invoke(None, config)` 从新检查点继续。输出中节点重新暂停，载荷的 `note` 显示刚写入的提示；随后提交合法决定，申请正常退款。

::: tip 在节点入口把非法输入转成重新询问
更稳妥的做法是不让恢复值有机会引发异常。在 `review` 中读取 `action` 之前，先检查 `isinstance(decision, dict)`，不是字典时与其他非法决定一样写入提示并回到 `review`。官方文档在“Validating human input”一节中也采用“校验失败就重新询问”的做法。
:::

## 五、验证记录与适用边界

本次验证于 2026-11-18 在 macOS 上完成，使用 Python 3.12.16、langgraph 1.2.22、langgraph-checkpoint 4.3.2 和 langchain-core 1.8.2。三段代码从新建的空目录写入后依次运行，输出与正文一致。

| 实际检查 | 观察结果 | 能证明的范围 |
|----------|----------|--------------|
| 四张申请分别批准、改额、拒绝和先错后对 | 每张申请先暂停在 `review`，结束状态与退款记录符合决定 | `interrupt()` 与 `Command(resume=...)` 能按三种决定恢复，非法决定可重新询问 |
| 中断前发通知与独立通知节点对照 | 前者通知两次，后者一次；两种审批节点都被调用两次 | 恢复会从头执行暂停的节点，已完成的前序节点不重跑 |
| `try/except Exception` 包住中断 | 暂停次数为 0，取默认值结束 | 宽泛捕获会吞掉中断信号 |
| 同一节点两次中断 | 两次暂停，两个答复按 `A`、`B` 的顺序组合，节点调用三次 | 恢复值按调用顺序匹配 |
| 无检查点、无 `thread_id`、错误 `thread_id` | 分别报 `RuntimeError`、`ValueError`、`KeyError` | 恢复依赖检查点与正确的线程标识 |
| 恢复值导致异常后再恢复 | 合法决定仍报错；`update_state()` 后可重新审批 | 异常后的恢复值会被重放，需要写入新状态才能继续 |

实验没有覆盖进程重启：`InMemorySaver` 随进程退出而清空，跨进程恢复需要写入磁盘或数据库的检查点实现，由本章《Thread 与 Checkpoint》讲解。实验也没有实现审批界面，没有处理“哪些动作必须人工确认”的风险分级，这部分属于安全与治理模块。审批记录如何绑定参数快照、防止决定被篡改或过期，可以参考 Agent 开发模块的[工具权限与人工确认](../../05-agent-development/03-permissions-isolation/01-tool-permissions-human-approval.md)。
