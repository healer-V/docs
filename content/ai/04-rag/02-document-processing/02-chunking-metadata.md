---
title: "切分与元数据"
tags:
  - RAG
  - 文档切分
  - 元数据
excerpt: "以配送政策说明片段长度、语义边界、重叠与标题表格上下文的取舍，使用独立程序生成稳定片段 ID 和原文区间，验证覆盖、版本隔离以及超长区块拒绝。"
date: 2026-09-29
---

# 切分与元数据

文档切分把已解析资料组织成可以独立检索和解释的片段。元数据是伴随正文保存的身份、版本、权限来源和定位信息。有效片段既要满足输入长度限制，也要保留判断结论所需的条件。

配送规则中的“发出后 3 至 5 个工作日”和“活动期间 5 至 7 个工作日”可能同样相关。片段若丢掉标题或活动条件，模型就无法判断哪条规则适用；只把文字切成等长小段不能保证语义完整。

## 一、切分的边界

### 1. 区块与片段

区块由解析结构确定，例如段落或表格。片段是检索输入，可以组合几个相邻区块，也可以因长度限制进一步拆分区块。两者的关系取决于内容和工具约束。

| 切分依据 | 收益 | 需要处理的边界 |
|----------|------|----------------|
| 固定字符或 Token 长度 | 长度可控，实现直接 | 可能切断条件、句子或表格 |
| 段落与标题 | 保留自然结构 | 长段落仍可能超限，小段落需要组合 |
| 业务语义单元 | 条件与结论更容易一起保留 | 需要来源规则和独立质量验证 |

Token 是模型处理的文本单元，与字符数不一一对应。本例按 Python 字符串长度控制展示文字，不使用模型 Token 上限，也不把字符数当作嵌入 API 的实际计费单位。

### 2. 条件与结论

“未经审批不得退款”应作为完整规则保留。若切成“未经审批不得”和“退款”，后一个片段既缺少主语，也丢失了禁止条件。

遇到超长规则，应识别句子、条件及引用依赖再拆分，或者保留更大父级区块用于回查。直接截取前 N 个字符会丢失后续条件，不能作为完成切分的通用兜底。

::: warning 长度上限不代表最佳片段长度
最大长度只说明当前处理或模型限制。检索质量还受问题类型、区块结构和证据组织影响，应在固定测试集上比较，而不能把某个长度写成所有 RAG 的最佳值。
:::

## 二、重叠与上下文

### 1. 重叠的用途

重叠是在相邻片段中重复保留一部分内容，降低边界处信息断裂的风险。它会增加存储与检索重复，进入生成前仍需去重或合并。

本例最多重复一个末尾段落，只有标题相同且重复后仍满足长度限制时才保留。每次循环都消费一个新输入区块，避免重叠逻辑反复生成同一片段。

### 2. 标题与表格

标题路径表示区块所属的层级，例如“配送政策 → 标准配送”。它可以作为片段文字的一部分，也应独立保存，让结果展示和追踪不依赖模型自行推断。

表格中“3 至 5”只有结合列名和地区才有意义。本例把整个短表格作为原子区块，保留表头；超长表格明确拒绝。真实适配器可按行组拆分并重复表头，同时保留单位、合并单元格和脚注关系。

::: tip 补入的上下文与原文区间分开保存
标题前缀和区块间分隔符是组装内容，不一定属于一个连续原文切片。保存各个正文区间及标题路径，不能声称 `raw[start:end]` 就等于整段组装文字。
:::

## 三、片段元数据

### 1. 身份与定位

元数据应足够支持权限过滤、版本追踪和原文回查。来源许可仍由可信来源登记确定，不能由片段正文中的声明授予。

| 字段 | 本例含义 | 使用边界 |
|------|----------|----------|
| `doc_id`、`version` | 逻辑文档及其不可变版本 | 修改正文应形成可识别的新版本 |
| `chunk_id` | 当前切分结果的稳定标识 | 同文档、版本和策略下重复处理一致 |
| `tenant_id`、`source_id` | 应用绑定的归属与来源登记 | 不从正文推断权限 |
| `source`、`raw_sha256` | 原始文件名及内容摘要 | 回查必须使用匹配快照 |
| `heading_path` | 区块所属标题层级 | 重排或展示时保留条件背景 |
| `spans` | 原文中多个半开字符区间 | 从 `start` 含起点到 `end` 不含终点；不是 UTF-8 字节位置 |
| `splitter_version` | 切分规则版本 | 改规则后重新验证映射 |
| `active` | 演示片段的有效状态 | 真实授权与撤回还需当前来源检查 |

### 2. 稳定标识

稳定 ID 应基于版本内的内容或位置，而不是本次运行随机数。示例将租户、文档、版本、原文区间、组装文字和切分配置规范化后计算摘要，再构成 ID。

这个策略使相同输入和配置得到相同 ID；改变文档版本或长度配置时，ID 也改变。生产系统应统一标识策略，并保存完整元数据及唯一性约束，不把哈希短前缀当作绝对无碰撞保证。

## 四、独立切分示例

### 1. 环境与政策区块

使用 Python 3.12 标准库，在空目录创建 `chunk_policies.py`：

```powershell
mkdir policy-chunking-demo
cd policy-chunking-demo
python --version
```

输入是一份本篇直接给出的政策快照。固定行区间模拟已完成解析的区块，不重新实现通用 Markdown 解析器。程序按原文行转换字符区间，再组合段落和表格。

::: info 字符与表格限制
上限为组装文字 160 个 Python 字符，包含标题与分隔符，重叠最多一个段落。这些值只用于观察边界；区块本身超限时明确失败，不截断正文或删掉表头。
:::

### 2. 完整实现

每个正文区间都可以精确切回当前原文。完整表格保持在一个片段中，退款条件使用独立标题范围，不与配送段落拼接。

::: details 查看片段组装、稳定 ID 与九个验证用例

```python
# chunk_policies.py
import hashlib
import json
from dataclasses import dataclass


RAW_POLICY = """# Shipping policy
## Standard delivery
Dispatch occurs on business days.

Delivery takes 3 to 5 business days after dispatch.

During campaigns, delivery takes 5 to 7 business days.

| Region | Business days |
| --- | --- |
| Local | 3 to 5 |
| Remote | 5 to 7 |

## Refund conditions
Refunds require approval. Do not refund before approval.
"""


@dataclass(frozen=True)
class Block:
    """保存已解析区块的类型、标题及原文半开字符区间。"""

    kind: str
    heading_path: tuple[str, ...]
    start: int
    end: int


def fixture_blocks(raw: str) -> list[Block]:
    """按本篇固定快照的行区间构造已解析区块夹具。

    Args:
        raw: RAW_POLICY 中完整快照，不作为任意 Markdown 的解析入口。

    Returns:
        五个正文区块，包含三个配送段落、一个表格和一个退款规则段落。
    """
    lines = raw.splitlines(keepends=True)
    blocks = []
    delivery = ("Shipping policy", "Standard delivery")
    refund = ("Shipping policy", "Refund conditions")
    specifications = [(3, 3, "paragraph", delivery), (5, 5, "paragraph", delivery),
                      (7, 7, "paragraph", delivery), (9, 12, "table", delivery),
                      (15, 15, "paragraph", refund)]
    for first, last, kind, headings in specifications:
        start = sum(len(line) for line in lines[:first - 1])
        end = sum(len(line) for line in lines[:last])
        if raw[start:end].endswith("\n"):
            end -= 1
        blocks.append(Block(kind, headings, start, end))
    return blocks


def render_text(raw: str, blocks: list[Block]) -> str:
    """组装同一标题下的正文，标题前缀不冒充原文连续切片。

    Args:
        raw: 当前不可变原文快照。
        blocks: 非空且标题相同的相邻区块列表。

    Returns:
        带标题路径及段落分隔符的片段文字。
    """
    headings = " > ".join(blocks[0].heading_path)
    return headings + "\n\n" + "\n\n".join(raw[block.start:block.end] for block in blocks)


def build_chunks(
    raw: str, blocks: list[Block], version: int = 1,
    max_chars: int = 160, overlap_blocks: int = 1,
) -> list[dict]:
    """按语义区块组合片段，保留可回查范围和确定性标识。

    Args:
        raw: 非空原文快照；区间单位为 Python 字符，不是字节或 Token。
        blocks: 按原文位置排序且不交叠的区块，只支持 paragraph/table。
        version: 正整数不可变文档版本，不能是布尔值。
        max_chars: 正整数组装文字上限，包含标题与分隔符。
        overlap_blocks: 只允许 0 或 1，最多重叠一个末尾段落。

    Returns:
        元数据完整的片段列表；超长、空区块或不合法范围整体拒绝。
    """
    if (not raw.strip() or not blocks or type(version) is not int or version < 1
            or type(max_chars) is not int or max_chars < 1
            or type(overlap_blocks) is not int or overlap_blocks not in {0, 1}):
        raise ValueError("invalid chunking configuration")
    previous_end = 0
    for block in blocks:
        if (block.kind not in {"paragraph", "table"} or not block.heading_path
                or not 0 <= block.start < block.end <= len(raw)
                or block.start < previous_end or not raw[block.start:block.end].strip()):
            raise ValueError("invalid source block")
        if len(render_text(raw, [block])) > max_chars:
            raise ValueError("atomic block exceeds limit")
        previous_end = block.end
    groups = []
    current = []
    for block in blocks:
        if current and current[0].heading_path != block.heading_path:
            groups.append(current)
            current = []
        if current and len(render_text(raw, [*current, block])) > max_chars:
            groups.append(current)
            tail = current[-1:]
            carry = (overlap_blocks == 1 and tail[0].kind == "paragraph"
                     and len(render_text(raw, [*tail, block])) <= max_chars)
            current = tail if carry else []
        current = [*current, block]
    if current:
        groups.append(current)
    chunks = []
    for group in groups:
        text = render_text(raw, group)
        spans = [{"start": block.start, "end": block.end} for block in group]
        identity = {"tenant_id": "store-a", "doc_id": "shipping-policy", "version": version,
                    "spans": spans, "text": text, "splitter_version": "policy-chunker-1",
                    "max_chars": max_chars, "overlap_blocks": overlap_blocks}
        digest = hashlib.sha256(json.dumps(identity, sort_keys=True).encode("utf-8")).hexdigest()
        chunks.append({**identity, "chunk_id": f"shipping-policy:v{version}:{digest}",
                       "heading_path": list(group[0].heading_path), "source_id": "shipping-policy",
                       "source": "shipping-policy.md", "active": True,
                       "raw_sha256": hashlib.sha256(raw.encode("utf-8")).hexdigest()})
    return chunks


def run_tests() -> None:
    """验证九条长度、来源、重叠、表格及版本路径。

    Returns:
        无返回值；失败抛出断言错误，通过输出数量和片段观察结果。
    """
    blocks = fixture_blocks(RAW_POLICY)
    chunks = build_chunks(RAW_POLICY, blocks)
    assert len(chunks) == 4 and all(len(chunk["text"]) <= 160 for chunk in chunks)
    observed = set()
    occurrences = []
    for chunk in chunks:
        for span in chunk["spans"]:
            location = (span["start"], span["end"])
            observed.add(location)
            occurrences.append(location)
            assert RAW_POLICY[span["start"]:span["end"]] in chunk["text"]
    assert observed == {(block.start, block.end) for block in blocks}
    assert occurrences.count((blocks[1].start, blocks[1].end)) == 2
    table = RAW_POLICY[blocks[3].start:blocks[3].end]
    table_chunks = [chunk for chunk in chunks if table in chunk["text"]]
    assert len(table_chunks) == 1 and "| Region | Business days |" in table_chunks[0]["text"]
    refund_chunks = [chunk for chunk in chunks if "Do not refund" in chunk["text"]]
    assert len(refund_chunks) == 1 and refund_chunks[0]["heading_path"][-1] == "Refund conditions"
    assert "During campaigns" not in refund_chunks[0]["text"]
    assert chunks == build_chunks(RAW_POLICY, blocks)
    old_ids = {chunk["chunk_id"] for chunk in chunks}
    assert old_ids.isdisjoint({chunk["chunk_id"] for chunk in build_chunks(RAW_POLICY, blocks, version=2)})
    assert old_ids.isdisjoint({chunk["chunk_id"] for chunk in build_chunks(RAW_POLICY, blocks, max_chars=200)})
    try:
        build_chunks(RAW_POLICY, blocks, max_chars=30)
    except ValueError as error:
        assert str(error) == "atomic block exceeds limit"
    else:
        raise AssertionError("oversized block accepted")
    print("chunking_tests=passed cases=9")
    print(f"chunks={len(chunks)} overlapping_body_spans=1 table_chunks={len(table_chunks)}")


if __name__ == "__main__":
    run_tests()
```

:::

### 3. 执行与观察

运行当前文件：

```powershell
python chunk_policies.py
```

通过时输出：

```text
chunking_tests=passed cases=9
chunks=4 overlapping_body_spans=1 table_chunks=1
```

四个片段覆盖全部五个正文区块，一个段落在相邻配送片段中重复，表格完整保留。退款规则带自己的标题，没有混入活动配送条件；相同输入与配置生成相同 ID，版本和配置变化均得到不同 ID。

程序记录的九项检查分别是长度、区间覆盖、重叠、表格、标题条件、重复处理、版本变化、配置变化及超长拒绝。它没有计算检索召回率，不能据此判断 160 字符或一个段落重叠最适合真实资料。

## 五、排查与适用边界

| 现象 | 定位证据 | 处理 |
|------|----------|------|
| 命中结论却没有条件 | 片段正文、标题路径和区块边界 | 将条件与结论共同保留，回查父级区块 |
| 同一证据占满候选 | 多个片段共享原文区间 | 按文档版本和来源范围去重，评测重叠成本 |
| 表格数值含义不明 | 表头、单位或脚注缺失 | 按行组保留上下文，验证组装后的语义 |
| 引用与原文不一致 | 快照摘要、版本和区间单位 | 使用匹配原文，区分字符、字节和组装前缀 |
| 重复处理产生不同 ID | 随机 ID、顺序或配置漂移 | 固定标识输入，记录切分规则及配置 |
| 原子区块超限 | `atomic block exceeds limit` | 调整经验证的区块策略或限制，禁止截断后伪装成功 |

本例只组合已经解析的段落和短表格，明确拒绝过长区块。嵌套列表、表格合并单元格、跨文档引用和模型 Token 限制需要单独适配；元数据应继续跟随片段进入索引与结果回查。

## 六、参考资料

- [Python hashlib](https://docs.python.org/3.12/library/hashlib.html)：内容摘要接口。
- [解析与清洗](./01-parsing-cleaning.md)：原文快照、区块和定位边界。
- [数据来源与权限](../01-knowledge-boundary/02-data-sources-permissions.md)：可信来源及授权元数据。
- [证据组织与生成](../05-evidence-answers/01-evidence-grounded-generation.md)：片段进入模型前的去重与预算。
