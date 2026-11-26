---
title: "Token 与上下文窗口"
tags:
  - AI 应用开发
  - Token
  - 上下文窗口
excerpt: "说明模型按 Token 而不是按字读写文字，Token 数随语言和编码变化；上下文窗口限制一次请求的总容量，输入、对话历史和回答都要放进去，并说明超出容量时的两种结果和处理方法。"
date: 2026-11-26
---

# Token 与上下文窗口

调用模型时经常会遇到两个数字：一篇文章“有多少 Token”，一个模型“上下文窗口有多大”。前者说明一段文字在模型眼里有多长，后者说明一次请求最多能装多少内容。两者都直接影响能不能调用成功和要花多少钱：模型服务按 Token 计费，内容超过窗口时请求会失败或回答被截断。

## 一、Token 是什么

### 1. 模型按 Token 读写文字

模型并不是一个字一个字地读文字。文字进入模型之前，会先被一个叫分词器的程序切成一个个片段，每个片段在词表里有一个编号，模型处理的是这串编号。这样的片段就叫 Token。

例如 `Hello world!` 会被切成 `Hello`、` world`、`!` 三个 Token（第二个片段带着前面的空格）。常见的单词通常是一个 Token，少见的词会被切成几段，一个汉字可能是一个 Token，也可能被切成多段。模型写回答时同样是一个 Token 一个 Token 地往外写，[生成过程与参数](./02-generation-process-parameters.md) 会讲这个过程。

### 2. 字数不等于 Token 数

Token 数由分词器的切分规则决定，所以和字数没有固定换算关系：

- **语言不同，比例不同。** 同样的意思，中文和英文切出的 Token 数可能差很多。
- **规则不同，结果不同。** 切分规则叫做编码，不同模型可能使用不同编码，同一句话在两种编码下的 Token 数可能不一样。
- **一个符号可能占多个 Token。** 一个 Emoji 在屏幕上只占一个位置，却可能被切成两个 Token。

::: warning 不要用固定比例估算 Token
“一个汉字等于一个 Token”“字数除以四”这类换算只在个别文本上碰巧接近。需要准确数字时，用对应的编码去数，或者看模型服务返回的实际用量。
:::

## 二、动手数一数 Token

### 1. 准备环境

OpenAI 开源了它使用的分词器 tiktoken，可以在本地直接数 Token。下面在新建的空目录中安装它：

```bash
mkdir token-window
cd token-window
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install "tiktoken==0.12.0"
export TIKTOKEN_CACHE_DIR="$PWD/.tokenizer-cache"
python -c "import sys, tiktoken; print(sys.version.split()[0], tiktoken.__version__)"
```

最后一条命令应显示 `3.12.x 0.12.0`。如果提示 `ModuleNotFoundError`，说明虚拟环境没有激活，重新执行 `source .venv/bin/activate` 后再安装。Windows 用 `py -3.12 -m venv .venv` 和 `.venv\Scripts\Activate.ps1` 创建并激活环境，这两条命令未经实测。

::: info 首次运行需要联网
tiktoken 第一次使用某种编码时，会从官方地址下载词表并缓存到 `TIKTOKEN_CACHE_DIR` 指定的目录，之后不再联网。程序如果卡住或报网络错误，先检查网络。本实验只在本地数 Token，不调用模型，也不需要 API Key。
:::

### 2. 编写并运行程序

在当前目录新建 UTF-8 编码的 `count_tokens.py`。程序用两种编码 `cl100k_base` 和 `o200k_base`，分别数一段英文、一段中文和一个 Emoji 的字符数与 Token 数，再列出英文那段被切成了哪些片段。这两个名字是编码的名称，不是模型的名称。

::: details 查看 count_tokens.py 完整代码

```python [count_tokens.py]
import tiktoken

TEXTS = ["Hello world!", "你好，世界！", "😊"]


def show(encoding_name: str) -> None:
    """按指定编码打印每段文字的字符数和 Token 数，并打印第一段文字被切成的片段。"""
    encoding = tiktoken.get_encoding(encoding_name)
    print(f"编码 {encoding_name}")
    for text in TEXTS:
        tokens = encoding.encode(text)
        print(f"  {text!r}: 字符 {len(text)} 个，Token {len(tokens)} 个")
    ids = encoding.encode(TEXTS[0])
    pieces = [encoding.decode([token_id]) for token_id in ids]
    print(f"  {TEXTS[0]!r} 的片段 {pieces}，编号 {ids}")


if __name__ == "__main__":
    show("cl100k_base")
    show("o200k_base")
```

:::

在激活了虚拟环境的同一目录中运行：

```bash
python count_tokens.py
```

2026-11-26 在 macOS、Python 3.12.16、tiktoken 0.12.0 上运行，退出码为 0，实际输出如下：

```text
编码 cl100k_base
  'Hello world!': 字符 12 个，Token 3 个
  '你好，世界！': 字符 6 个，Token 7 个
  '😊': 字符 1 个，Token 2 个
  'Hello world!' 的片段 ['Hello', ' world', '!']，编号 [9906, 1917, 0]
编码 o200k_base
  'Hello world!': 字符 12 个，Token 3 个
  '你好，世界！': 字符 6 个，Token 4 个
  '😊': 字符 1 个，Token 1 个
  'Hello world!' 的片段 ['Hello', ' world', '!']，编号 [13225, 2375, 0]
```

### 3. 从结果看到什么

`你好，世界！` 只有 6 个字符，在 `cl100k_base` 下却是 7 个 Token，在 `o200k_base` 下是 4 个。文字没变，变的只是编码。所以数 Token 之前，要先确认目标模型用的是哪种编码；用错编码，数出来的结果就不准。

Emoji `😊` 在屏幕上是一个符号，在 `cl100k_base` 下占 2 个 Token。片段那一行则说明 Token 和单词并不一一对应：` world` 带着前面的空格，`!` 单独成为一个 Token。同一个片段在两种编码里的编号也不同，编号只在各自的词表里有意义。

## 三、上下文窗口装的是什么

### 1. 一次请求的全部内容

上下文窗口是一次请求最多能使用的 Token 总数。OpenAI 的 [Conversation state 指南](https://developers.openai.com/api/docs/guides/conversation-state) 说明，这个总数同时包括输入和输出；对会先“思考”再回答的推理模型，思考用掉的 Token 也算在里面。

“输入”也不只是用户最后发的那句话。一次请求里通常包含：

- 说明任务的指令；
- 用户当前的问题；
- 之前的对话记录，包括模型之前的回答；
- 程序额外附上的资料，例如查到的订单信息或文档段落。

所以经常出现这种情况：用户只发了一句很短的话，请求却超出了窗口。原因往往是对话记录越积越长，或者附上的资料太多。

### 2. 要给回答留出空间

模型读完输入后还要写回答，回答也占窗口。因此一次请求要满足：

```text
输入的 Token 数 + 回答的 Token 数 ≤ 上下文窗口
```

假设一个模型的窗口是 8,192 个 Token，你希望回答最多 1,024 个 Token，那么输入最多只能用 8,192 − 1,024 = 7,168 个 Token。窗口不能全部拿来放输入。这里的数字只是示例，真实模型的窗口大小要查模型的说明页，同一模型的不同版本也可能不同。

回答最多用多少 Token，可以在请求里设置上限；模型本身也有一个单次最多能输出多少的上限。推理模型的思考过程同样计入输出：屏幕上的回答只有一句话，实际可能已经用掉了上千个输出 Token。

### 3. 装得下不等于用得好

窗口大小只说明能装多少，不说明模型能把里面的每段内容都用好。把大量无关资料塞进窗口，模型仍可能漏看关键信息，费用也随 Token 数增加。另外，窗口只属于这一次请求：模型不会记得上一次请求的内容，对话要连续，就得由程序把历史记录再次放进请求，做法见 [会话状态模式](../../03-prompt-context/04-conversation-state/01-state-management-modes.md)。

## 四、超出容量时会怎样

超出容量有两种情况，处理方法不同：

| 情况 | 表现 | 处理方法 |
|------|------|----------|
| 输入太长 | 请求直接报错，模型没有开始回答 | 删掉无关的历史和资料，再重新数 Token |
| 回答写到上限 | 请求返回了内容，但回答写到一半就停了 | 提高回答上限，或者把任务拆小 |

第二种情况更隐蔽。OpenAI 的 [Reasoning 指南](https://developers.openai.com/api/docs/guides/reasoning) 说明，生成的 Token 达到窗口或请求设置的上限时，响应的 `status` 是 `incomplete`，`incomplete_details.reason` 是 `max_output_tokens`；推理模型甚至可能在写出任何可见文字之前就用完上限，输入和思考的费用照样产生。所以拿到回答后要先检查状态，不能因为返回了一段文字就当作已经完成。怎样读取响应状态，在 [Responses API 调用](../03-minimal-application/02-responses-api-call.md) 中实际演示。

## 五、常见误解

### 1. 本地数出的就是请求的 Token 数

本地程序只数了传给它的那段文字。真实请求里还有区分“谁说的话”的格式标记、附带的工具说明等内容，它们也占 Token。本地计数适合提前粗略判断会不会超限；准确的用量以模型服务在响应中返回的 `usage` 为准，费用也按它计算。

### 2. 太长就截掉后面的 Token

直接截掉超出的部分，可能把“请勿退款”截成“请勿”，也可能把一个汉字切成半个，变成乱码。需要缩短内容时，应该按完整的消息、段落或记录删减，优先删掉和当前任务无关的部分，删完后重新计数。

本文实验验证的是本地分词：在 tiktoken 0.12.0 的两种编码下，三段固定文字的字符数、Token 数和切分片段。它没有调用模型，不代表任何模型的窗口大小或实际计费，超限的两种表现依据官方文档说明，本文没有实际触发。
