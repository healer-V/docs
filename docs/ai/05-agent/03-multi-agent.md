---
title: "多智能体系统设计"
category: "AI · Agent"
tags:
  - Agent
  - 多智能体
  - 协作
  - 编排
date: 2026-03-17
excerpt: "系统介绍多智能体架构的核心模式（主从/对等/流水线）、通信协议、任务协作策略、LangGraph 编排、AutoGen 框架及监督者模式的完整实践。"
---

# 多智能体系统设计

单个 Agent 的能力受限于上下文窗口和工具范围，多智能体（Multi-Agent）系统通过任务分解与协作，突破单体 Agent 的瓶颈，处理更复杂的长期任务。

## 一、多智能体架构模式

### 1. 三种核心架构

| 架构 | 结构特征 | 适用场景 | 协调方式 |
|------|---------|---------|---------|
| 主从架构（Supervisor-Worker） | 一个 Supervisor 协调多个 Worker | 任务分解、分工明确的复杂任务 | 集中式 |
| 对等架构（Peer-to-Peer） | Agent 之间直接通信协作 | 辩论、互相验证、创意生成 | 分布式 |
| 流水线架构（Pipeline） | Agent 按顺序传递结果 | 数据处理、内容生成链条 | 顺序式 |

### 2. 主从架构

```
用户请求
    ↓
Supervisor Agent（任务分解、路由、结果汇总）
    ├─→ Research Agent（信息检索与整理）
    ├─→ Analysis Agent（数据分析与建模）
    ├─→ Writing Agent（文档撰写与格式化）
    └─→ Review Agent（质量检查与校对）
```

::: details 主从架构实现示例

```python
# src/multi_agent/supervisor.py
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from typing import List, Dict, Any
import json

class WorkerAgent:
    """工作 Agent，专注于特定领域"""

    def __init__(self, name: str, role: str, tools: list):
        self.name = name
        self.role = role
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0)
        self.tools = tools

    def execute(self, task: str, context: str = "") -> str:
        """执行分配的任务"""
        messages = [
            SystemMessage(content=f"你是 {self.name}，{self.role}。请专注于完成分配的任务。"),
            HumanMessage(content=f"上下文信息：{context}\n\n任务：{task}" if context else f"任务：{task}")
        ]
        response = self.llm.invoke(messages)
        return response.content

class SupervisorAgent:
    """监督者 Agent，负责任务分解与协调"""

    SYSTEM_PROMPT = """
你是一个任务协调者，负责将用户请求分解为子任务并分配给合适的 Worker Agent。

可用的 Worker Agents：
{workers_description}

请按以下 JSON 格式输出执行计划：
{{
  "tasks": [
    {{
      "worker": "worker名称",
      "task": "具体任务描述",
      "depends_on": []  // 依赖的前置任务索引列表（空列表表示可立即执行）
    }}
  ],
  "final_synthesis": "最终如何汇总各 Worker 结果的说明"
}}
"""

    def __init__(self, workers: List[WorkerAgent]):
        self.workers = {w.name: w for w in workers}
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0)

    def _plan_tasks(self, user_request: str) -> dict:
        """生成任务执行计划"""
        workers_desc = "\n".join([
            f"- {name}: {w.role}"
            for name, w in self.workers.items()
        ])

        response = self.llm.invoke([
            SystemMessage(content=self.SYSTEM_PROMPT.format(
                workers_description=workers_desc
            )),
            HumanMessage(content=user_request)
        ])

        return json.loads(response.content)

    def run(self, user_request: str) -> str:
        """执行完整的多 Agent 协作流程"""
        plan = self._plan_tasks(user_request)
        results = {}

        # 按依赖顺序执行任务
        for i, task_info in enumerate(plan["tasks"]):
            worker_name = task_info["worker"]
            task = task_info["task"]
            depends_on = task_info.get("depends_on", [])

            # 收集前置任务的结果作为上下文
            context = "\n".join([
                f"[{plan['tasks'][j]['worker']} 的结果]\n{results[j]}"
                for j in depends_on if j in results
            ])

            if worker_name in self.workers:
                result = self.workers[worker_name].execute(task, context)
                results[i] = result

        # 汇总最终结果
        all_results = "\n\n".join([
            f"### {plan['tasks'][i]['worker']} 的输出\n{result}"
            for i, result in results.items()
        ])

        synthesis_prompt = f"""
{plan['final_synthesis']}

各 Worker 输出：
{all_results}

请综合以上结果，给出最终完整的回答。
"""
        final_response = self.llm.invoke([HumanMessage(content=synthesis_prompt)])
        return final_response.content


# 使用示例
workers = [
    WorkerAgent("研究员", "负责互联网信息检索和事实核查", tools=[web_search]),
    WorkerAgent("分析师", "负责数据分析和逻辑推理", tools=[execute_python]),
    WorkerAgent("写作者", "负责将信息整理为结构化文档", tools=[]),
]

supervisor = SupervisorAgent(workers)
result = supervisor.run("分析2025年大语言模型市场的竞争格局，给出投资建议")
```
:::

### 3. 流水线架构

::: details 内容生产流水线

```python
# src/multi_agent/pipeline.py
from dataclasses import dataclass
from typing import List, Callable, Any

@dataclass
class PipelineStage:
    """流水线中的一个处理阶段"""
    name: str
    processor: Callable[[Any], Any]
    description: str = ""

class AgentPipeline:
    """
    线性 Agent 流水线

    每个 Agent 处理前一个 Agent 的输出
    适合：内容审核 → 翻译 → 格式化 → 发布 等顺序流程
    """

    def __init__(self, stages: List[PipelineStage]):
        self.stages = stages

    def run(self, initial_input: Any) -> dict:
        """运行流水线，返回每个阶段的输出"""
        current = initial_input
        history = {"input": initial_input}

        for stage in self.stages:
            current = stage.processor(current)
            history[stage.name] = current

        history["final_output"] = current
        return history

# 内容生产流水线示例
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

def research_stage(topic: str) -> str:
    """第一阶段：信息收集"""
    return llm.invoke(f"收集关于'{topic}'的最新信息和关键数据，以要点形式列出").content

def analysis_stage(research: str) -> str:
    """第二阶段：分析整理"""
    return llm.invoke(f"基于以下信息，分析关键趋势和洞察：\n{research}").content

def writing_stage(analysis: str) -> str:
    """第三阶段：撰写文章"""
    return llm.invoke(f"基于以下分析，写一篇1000字的专业文章：\n{analysis}").content

def review_stage(article: str) -> str:
    """第四阶段：质量审核"""
    return llm.invoke(f"审核以下文章，检查事实准确性、逻辑连贯性，给出修改建议：\n{article}").content

pipeline = AgentPipeline([
    PipelineStage("research", research_stage, "信息收集"),
    PipelineStage("analysis", analysis_stage, "分析整理"),
    PipelineStage("writing", writing_stage, "内容撰写"),
    PipelineStage("review", review_stage, "质量审核"),
])

result = pipeline.run("人工智能在医疗行业的应用")
print(result["final_output"])
```
:::

---

## 二、智能体间通信协议

### 1. 消息格式标准

智能体间的通信需要标准化格式，确保消息的语义清晰、可路由。

::: details 标准化 Agent 消息协议

```python
# src/multi_agent/protocol.py
from dataclasses import dataclass, field
from typing import Any, Optional, List
from datetime import datetime
import uuid

@dataclass
class AgentMessage:
    """
    标准化 Agent 间通信消息格式

    遵循类似 Actor 模型的消息传递范式
    """
    # 路由信息
    sender_id: str          # 发送方 Agent ID
    receiver_id: str        # 接收方 Agent ID（"broadcast" 表示广播）

    # 消息内容
    message_type: str       # task/result/error/status/query
    content: Any            # 消息正文

    # 元数据
    message_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    correlation_id: Optional[str] = None  # 关联的请求消息 ID
    priority: int = 5       # 优先级（1-10，10最高）

    # 任务相关
    task_id: Optional[str] = None
    requires_response: bool = False

    def to_dict(self) -> dict:
        return {
            "message_id": self.message_id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "message_type": self.message_type,
            "content": self.content,
            "timestamp": self.timestamp,
            "correlation_id": self.correlation_id,
            "task_id": self.task_id,
        }

# 消息类型常量
class MessageType:
    TASK = "task"           # 分配任务
    RESULT = "result"       # 返回结果
    ERROR = "error"         # 报告错误
    STATUS = "status"       # 状态更新
    QUERY = "query"         # 查询信息
    BROADCAST = "broadcast" # 广播通知
```
:::

### 2. 共享状态管理

::: details 多 Agent 共享上下文状态

```python
# src/multi_agent/shared_state.py
import threading
from typing import Any, Dict, Optional
from datetime import datetime

class SharedState:
    """
    线程安全的多 Agent 共享状态存储

    用于 Agent 间共享信息，避免重复查询，实现信息汇聚
    """

    def __init__(self):
        self._state: Dict[str, Any] = {}
        self._lock = threading.RLock()
        self._history: list = []  # 状态变更历史

    def set(self, key: str, value: Any, agent_id: str = "") -> None:
        """设置状态值，记录变更历史"""
        with self._lock:
            old_value = self._state.get(key)
            self._state[key] = value
            self._history.append({
                "timestamp": datetime.now().isoformat(),
                "agent": agent_id,
                "key": key,
                "old_value": old_value,
                "new_value": value
            })

    def get(self, key: str, default: Any = None) -> Any:
        with self._lock:
            return self._state.get(key, default)

    def update(self, updates: Dict[str, Any], agent_id: str = "") -> None:
        """批量更新状态"""
        with self._lock:
            for key, value in updates.items():
                self.set(key, value, agent_id)

    def get_snapshot(self) -> Dict[str, Any]:
        """获取当前状态快照"""
        with self._lock:
            return dict(self._state)

# 使用示例：多 Agent 协作研究任务
shared = SharedState()

# Research Agent 填充信息
shared.set("topic", "量子计算", agent_id="research_agent")
shared.set("key_facts", ["量子比特", "叠加态", "纠缠"], agent_id="research_agent")

# Analysis Agent 读取并添加分析
facts = shared.get("key_facts")
shared.set("analysis", "量子计算具有指数级并行计算能力...", agent_id="analysis_agent")

# Writing Agent 汇总所有信息
snapshot = shared.get_snapshot()
```
:::

---

## 三、任务分解与协作策略

### 1. 任务分解方法

| 分解方式 | 原理 | 适用任务 |
|---------|------|---------|
| 功能分解 | 按技能领域分配（搜索/分析/写作） | 综合性研究任务 |
| 数据分解 | 按数据维度分配（不同数据源/地区） | 大规模数据处理 |
| 时间分解 | 按执行阶段顺序分配 | 有明确流程的任务 |
| 角色分解 | 按业务角色分配（产品/研发/测试） | 模拟团队协作 |

### 2. 协作一致性保障

::: details 基于投票的多 Agent 共识机制

```python
# src/multi_agent/consensus.py
from langchain_openai import ChatOpenAI
from typing import List
from collections import Counter
import json

def multi_agent_vote(
    question: str,
    n_agents: int = 5,
    threshold: float = 0.6,
    model: str = "gpt-4o"
) -> dict:
    """
    多 Agent 投票共识机制

    多个独立 Agent 同时分析问题，采用多数投票得出可信结论
    适用于：事实判断、分类决策、风险评估等需要高可靠性的场景

    Args:
        threshold: 投票通过所需的最低比例
    """
    llm = ChatOpenAI(model=model, temperature=0.7)  # 温度 > 0 增加多样性

    votes = []
    reasonings = []

    for i in range(n_agents):
        response = llm.invoke(
            f"""分析以下问题并给出判断。

            问题：{question}

            请以 JSON 格式输出：{{"answer": "你的答案", "confidence": 0-1的置信度, "reasoning": "推理过程"}}
            """
        )

        try:
            result = json.loads(response.content)
            votes.append(result["answer"])
            reasonings.append(result.get("reasoning", ""))
        except (json.JSONDecodeError, KeyError):
            votes.append(response.content.strip())

    # 统计投票
    vote_counts = Counter(votes)
    total = len(votes)
    winner, count = vote_counts.most_common(1)[0]
    confidence = count / total

    return {
        "consensus": winner,
        "confidence": confidence,
        "passed": confidence >= threshold,
        "vote_distribution": dict(vote_counts),
        "sample_reasoning": reasonings[0] if reasonings else ""
    }

result = multi_agent_vote(
    "这段代码是否存在安全漏洞？\n```python\nquery = f'SELECT * FROM users WHERE id = {user_input}'\n```",
    n_agents=5
)
print(f"共识结论：{result['consensus']}（置信度：{result['confidence']:.0%}）")
```
:::

---

## 四、LangGraph 多智能体编排

### 1. LangGraph 核心概念

LangGraph 将 Agent 工作流建模为**有状态的图**（State Graph），每个节点是一个处理步骤（可以是 LLM、工具调用或路由逻辑），边定义了节点间的跳转条件。

| 概念 | 说明 |
|------|------|
| `StateGraph` | 有状态的流程图 |
| `State` | 流程执行过程中的共享状态（TypedDict） |
| Node | 图中的处理节点（函数/Agent） |
| Edge | 节点间的连接（条件跳转或固定跳转） |
| `END` | 流程终止节点 |

::: details LangGraph 监督者模式实现

```python
# src/multi_agent/langgraph_supervisor.py
# 安装：pip install langgraph langchain-openai

from typing import TypedDict, Annotated, List, Literal
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
import json

# --- 定义共享状态 ---
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]  # 消息历史
    next_agent: str    # 下一个执行的 Agent
    final_answer: str  # 最终回答

# --- 定义 Worker Agents ---
llm = ChatOpenAI(model="gpt-4o", temperature=0)

WORKERS = ["researcher", "analyst", "writer"]

def researcher_node(state: AgentState) -> AgentState:
    """研究员：负责信息收集"""
    last_message = state["messages"][-1].content
    response = llm.invoke([
        SystemMessage(content="你是一个专业研究员，负责收集和整理信息。"),
        HumanMessage(content=last_message)
    ])
    return {
        "messages": [response],
        "next_agent": "supervisor"
    }

def analyst_node(state: AgentState) -> AgentState:
    """分析师：负责深度分析"""
    context = "\n".join([m.content for m in state["messages"][-3:]])
    response = llm.invoke([
        SystemMessage(content="你是一个数据分析师，负责深度分析和逻辑推理。"),
        HumanMessage(content=f"基于以下信息进行分析：\n{context}")
    ])
    return {
        "messages": [response],
        "next_agent": "supervisor"
    }

def writer_node(state: AgentState) -> AgentState:
    """写作者：负责最终文档"""
    context = "\n".join([m.content for m in state["messages"]])
    response = llm.invoke([
        SystemMessage(content="你是一个专业写作者，将信息整理为清晰的文档。"),
        HumanMessage(content=f"基于以下所有信息，写出最终完整的回答：\n{context}")
    ])
    return {
        "messages": [response],
        "next_agent": "END",
        "final_answer": response.content
    }

# --- 监督者节点 ---
SUPERVISOR_PROMPT = """
你是一个任务协调者。根据当前进展，决定下一步应该由哪个 Agent 执行。

可用 Agents：
- researcher: 当需要收集新信息时
- analyst: 当需要深度分析已有信息时
- writer: 当信息收集和分析完成，需要输出最终结果时
- FINISH: 当任务已经完全完成时

当前对话历史长度：{msg_count} 条消息

只输出一个词（agent名称或FINISH）：
"""

def supervisor_node(state: AgentState) -> AgentState:
    """监督者：路由决策"""
    msg_count = len(state["messages"])
    response = llm.invoke([
        SystemMessage(content=SUPERVISOR_PROMPT.format(msg_count=msg_count)),
        *state["messages"][-3:]  # 只看最近3条消息
    ])
    next_agent = response.content.strip().lower()

    if next_agent not in WORKERS and next_agent != "finish":
        next_agent = "writer"  # 默认兜底

    return {"next_agent": "END" if next_agent == "finish" else next_agent}

def route_to_agent(state: AgentState) -> str:
    """路由函数：根据 next_agent 跳转"""
    return state.get("next_agent", "END")

# --- 构建图 ---
workflow = StateGraph(AgentState)

workflow.add_node("supervisor", supervisor_node)
workflow.add_node("researcher", researcher_node)
workflow.add_node("analyst", analyst_node)
workflow.add_node("writer", writer_node)

workflow.set_entry_point("supervisor")

# 监督者 → 条件路由
workflow.add_conditional_edges(
    "supervisor",
    route_to_agent,
    {
        "researcher": "researcher",
        "analyst": "analyst",
        "writer": "writer",
        "END": END
    }
)

# Worker → 回到监督者
workflow.add_edge("researcher", "supervisor")
workflow.add_edge("analyst", "supervisor")
workflow.add_edge("writer", END)  # writer 完成后直接结束

graph = workflow.compile()

# 运行
result = graph.invoke({
    "messages": [HumanMessage(content="分析2025年AI芯片市场的竞争格局")],
    "next_agent": "",
    "final_answer": ""
})
print(result["final_answer"])
```
:::

---

## 五、AutoGen 框架介绍

### 1. AutoGen 核心概念

Microsoft AutoGen 是另一个流行的多智能体框架，提供了更简洁的多 Agent 对话接口。

| 概念 | 说明 |
|------|------|
| `ConversableAgent` | 基础可对话 Agent 类 |
| `AssistantAgent` | 预配置的 AI 助手 Agent |
| `UserProxyAgent` | 代理人类用户，可执行代码 |
| `GroupChat` | 多 Agent 群聊编排 |
| `GroupChatManager` | 群聊管理者，控制发言顺序 |

::: details AutoGen 多 Agent 群聊示例

```python
# src/multi_agent/autogen_demo.py
# 安装：pip install pyautogen

import autogen

# 配置
llm_config = {
    "config_list": [{"model": "gpt-4o", "api_key": "your_key"}],
    "temperature": 0
}

# --- 定义多个 Agent ---
# 产品经理 Agent
product_manager = autogen.AssistantAgent(
    name="ProductManager",
    system_message="你是一位产品经理，负责需求分析和功能规划。",
    llm_config=llm_config
)

# 开发工程师 Agent
developer = autogen.AssistantAgent(
    name="Developer",
    system_message="你是一位高级工程师，负责技术实现和代码设计。",
    llm_config=llm_config
)

# 测试工程师 Agent
tester = autogen.AssistantAgent(
    name="Tester",
    system_message="你是一位测试工程师，负责质量保障和测试用例设计。",
    llm_config=llm_config
)

# 代码执行代理（可以运行代码）
executor = autogen.UserProxyAgent(
    name="Executor",
    human_input_mode="NEVER",  # 不需要人工输入
    code_execution_config={
        "work_dir": "/tmp/autogen",
        "use_docker": True  # 推荐在 Docker 中执行代码
    }
)

# --- 群聊配置 ---
groupchat = autogen.GroupChat(
    agents=[product_manager, developer, tester, executor],
    messages=[],
    max_round=10,  # 最大对话轮次
    speaker_selection_method="auto"  # 自动决定下一个发言者
)

manager = autogen.GroupChatManager(
    groupchat=groupchat,
    llm_config=llm_config
)

# --- 启动群聊 ---
executor.initiate_chat(
    manager,
    message="请设计并实现一个用户登录功能，包括密码加密和JWT认证"
)
```
:::

---

## 六、智能体状态管理

### 1. 持久化 Agent 状态

::: details 基于 Redis 的 Agent 状态持久化

```python
# src/multi_agent/persistent_state.py
import redis
import json
from typing import Any, Optional
from datetime import datetime

class PersistentAgentState:
    """
    Redis 持久化 Agent 状态

    支持任务暂停、恢复和跨进程状态共享
    """

    def __init__(self, task_id: str, redis_url: str = "redis://localhost:6379"):
        self.task_id = task_id
        self.redis = redis.from_url(redis_url)
        self.key_prefix = f"agent:state:{task_id}"
        self.ttl = 86400  # 状态保留 24 小时

    def save(self, key: str, value: Any) -> None:
        """保存状态"""
        full_key = f"{self.key_prefix}:{key}"
        self.redis.set(
            full_key,
            json.dumps(value, ensure_ascii=False),
            ex=self.ttl
        )

    def load(self, key: str, default: Any = None) -> Any:
        """加载状态"""
        full_key = f"{self.key_prefix}:{key}"
        data = self.redis.get(full_key)
        return json.loads(data) if data else default

    def save_checkpoint(self, step: str, data: dict) -> None:
        """保存检查点，支持任务恢复"""
        checkpoint = {
            "step": step,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        self.save("checkpoint", checkpoint)

    def load_checkpoint(self) -> Optional[dict]:
        """加载最新检查点"""
        return self.load("checkpoint")

    def clear(self) -> None:
        """清除所有状态"""
        pattern = f"{self.key_prefix}:*"
        for key in self.redis.scan_iter(pattern):
            self.redis.delete(key)
```
:::

---

## 七、监督者模式（Supervisor Pattern）

### 1. 模式要点

监督者模式（Supervisor Pattern）是最常见的多 Agent 编排方式，核心思想是：

- Supervisor 不执行具体任务，只负责**任务分解**、**路由决策**和**结果汇总**
- Worker 专注于特定领域，输出结构化结果
- Supervisor 持有全局视角，可进行质量控制和重试

### 2. 带质量控制的监督者

::: details 含反馈循环的监督者模式

```python
# src/multi_agent/supervisor_with_feedback.py
from langchain_openai import ChatOpenAI
from typing import List, Dict, Optional
import json

class QualityControlSupervisor:
    """
    带质量控制的监督者 Agent

    对 Worker 输出进行评估，不满足要求时触发重试
    """

    QUALITY_CHECK_PROMPT = """
    评估以下 Worker 输出是否满足要求。

    任务：{task}
    Worker 输出：{output}
    评估标准：{criteria}

    以 JSON 格式输出：
    {{
        "passed": true/false,
        "score": 0-10,
        "issues": ["问题1", "问题2"],
        "improvement_suggestion": "改进建议"
    }}
    """

    def __init__(self, workers: Dict[str, callable], max_retries: int = 3):
        self.workers = workers
        self.max_retries = max_retries
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0)

    def evaluate_output(self, task: str, output: str, criteria: str) -> dict:
        """评估 Worker 输出质量"""
        response = self.llm.invoke(
            self.QUALITY_CHECK_PROMPT.format(
                task=task, output=output, criteria=criteria
            )
        )
        return json.loads(response.content)

    def execute_with_quality_control(
        self,
        worker_name: str,
        task: str,
        quality_criteria: str = "输出完整、准确、结构清晰"
    ) -> dict:
        """
        执行任务并进行质量控制，必要时重试

        Returns:
            {"output": "最终输出", "attempts": 重试次数, "passed": 是否通过质检}
        """
        worker = self.workers.get(worker_name)
        if not worker:
            return {"error": f"Worker '{worker_name}' 不存在"}

        last_output = ""
        feedback = ""

        for attempt in range(1, self.max_retries + 1):
            # 带反馈重试
            task_with_feedback = task if not feedback else \
                f"{task}\n\n[上次输出的改进建议]\n{feedback}"

            output = worker(task_with_feedback)

            # 质量检查
            eval_result = self.evaluate_output(task, output, quality_criteria)

            if eval_result.get("passed", False) or eval_result.get("score", 0) >= 7:
                return {
                    "output": output,
                    "attempts": attempt,
                    "passed": True,
                    "score": eval_result.get("score")
                }

            # 未通过，准备反馈
            feedback = eval_result.get("improvement_suggestion", "")
            last_output = output

        # 达到最大重试次数，返回最后一次输出
        return {
            "output": last_output,
            "attempts": self.max_retries,
            "passed": False,
            "note": "已达到最大重试次数"
        }
```
:::

::: tip 多智能体系统的调试建议
多 Agent 系统的调试比单 Agent 复杂得多。建议：
1. 为每个 Agent 的输入/输出添加详细日志
2. 使用 LangSmith 或自定义追踪系统记录完整调用链
3. 先用 2-3 个 Agent 验证流程，再扩展
4. 为每个 Agent 编写单元测试，再测试联动
:::
