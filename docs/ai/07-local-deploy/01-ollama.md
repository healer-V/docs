---
title: "Ollama 本地部署"
category: "AI · 本地部署"
tags:
  - Ollama
  - LLM
  - 本地部署
excerpt: "Ollama 提供了简单易用的命令行工具，让你能够在本地快速下载、运行和管理各种开源大语言模型。"
date: 2026-03-15
---

# Ollama 本地部署

Ollama 是一个开源的本地大语言模型运行工具，它将模型的下载、配置和推理过程封装为简洁的命令行操作。你无需手动处理模型权重文件、量化转换或复杂的环境配置，只需一条命令即可在本地运行 Llama 3、Qwen、DeepSeek 等主流开源模型。

## 一、Ollama 是什么

Ollama 的核心设计理念借鉴了 Docker——就像 Docker 让你用简单命令管理容器一样，Ollama 让你用同样简洁的方式管理本地大语言模型。

### 1. 核心特性

- **一键安装**：支持 macOS、Linux、Windows 三大平台，安装过程无需额外依赖
- **模型仓库**：内置丰富的模型库，支持一条命令拉取模型
- **自动优化**：根据硬件自动选择最佳推理方案（GPU / CPU），无需手动配置
- **REST API**：内置 HTTP 服务，兼容 OpenAI API 格式，方便集成到现有项目
- **自定义模型**：通过 Modelfile 自定义系统提示词、温度参数等配置
- **轻量高效**：资源占用低，不运行模型时几乎不消耗系统资源

### 2. 工作原理

Ollama 底层基于 `llama.cpp` 推理引擎，支持 GGUF 格式的量化模型。当你执行 `ollama run` 命令时，Ollama 会：

1. 检查本地是否已下载该模型，未下载则自动拉取
2. 将模型加载到 GPU 显存（或内存）中
3. 启动一个交互式对话会话
4. 在会话结束后自动释放资源

## 二、安装 Ollama

Ollama 支持主流操作系统，选择你的平台按照对应步骤安装即可。

### 1. macOS 安装

macOS 支持两种安装方式：

::: details 通过官网下载安装（推荐）
```bash
# 1. 访问 https://ollama.com/download 下载 macOS 版本
# 2. 打开下载的 .dmg 文件
# 3. 将 Ollama 拖入 Applications 文件夹
# 4. 首次启动时会自动安装 CLI 命令行工具

# 验证安装
ollama --version
```
:::

::: details 通过 Homebrew 安装
```bash
# 使用 Homebrew 安装
brew install ollama

# 验证安装
ollama --version
```
:::

### 2. Linux 安装

::: details 一键安装脚本
```bash
# 官方一键安装脚本（自动检测系统架构和 GPU）
curl -fsSL https://ollama.com/install.sh | sh

# 验证安装
ollama --version

# 检查服务状态
systemctl status ollama
```
:::

::: tip
Linux 安装脚本会自动检测 NVIDIA GPU 并安装对应的 CUDA 驱动支持。如果你使用 AMD GPU，需要确保已安装 ROCm 驱动。
:::

### 3. Windows 安装

::: details Windows 安装步骤
```bash
# 1. 访问 https://ollama.com/download 下载 Windows 安装包
# 2. 运行 .exe 安装程序，按向导完成安装
# 3. 安装完成后，Ollama 会以系统服务形式运行

# 打开 PowerShell 或 CMD，验证安装
ollama --version
```
:::

::: warning 注意
Windows 版本需要 Windows 10 及以上系统。如果你使用 NVIDIA GPU，确保已安装最新的 GPU 驱动（版本 >= 452.39）。
:::

## 三、模型管理

Ollama 提供了一组简洁的命令来管理本地模型，操作方式与 Docker 镜像管理非常相似。

### 1. 拉取模型

::: details 从模型仓库下载模型
```bash
# 拉取默认版本（通常是最新的量化版本）
ollama pull llama3.1

# 拉取指定参数规模的版本
ollama pull llama3.1:8b
ollama pull llama3.1:70b

# 拉取指定量化精度的版本
ollama pull llama3.1:8b-q4_0    # 4-bit 量化，速度快，显存占用低
ollama pull llama3.1:8b-q8_0    # 8-bit 量化，精度更高，显存占用更大

# 拉取其他模型
ollama pull qwen2.5:7b
ollama pull deepseek-v2:16b
ollama pull mistral:7b
```
:::

### 2. 查看已下载模型

::: details 列出本地模型
```bash
# 列出所有已下载的模型
ollama list

# 输出示例：
# NAME                    ID              SIZE      MODIFIED
# llama3.1:8b             365c0bd3c000    4.7 GB    2 days ago
# qwen2.5:7b              845dbda0ea48    4.4 GB    5 hours ago
# deepseek-v2:16b         a]f2b3c1d4e5    9.1 GB    1 day ago
```
:::

### 3. 运行模型

::: details 启动交互式对话
```bash
# 运行模型（未下载会自动拉取）
ollama run llama3.1:8b

# 进入交互模式后，直接输入问题即可
>>> 请用 TypeScript 写一个防抖函数

# 发送多行输入，使用 """ 包裹
>>> """
... 请分析以下代码的性能问题：
... const result = arr.filter(x => x > 0).map(x => x * 2).reduce((a, b) => a + b, 0)
... """

# 退出交互模式
>>> /bye
```
:::

### 4. 删除模型

::: details 删除本地模型
```bash
# 删除指定模型
ollama rm llama3.1:8b

# 删除多个模型
ollama rm mistral:7b qwen2.5:7b
```
:::

### 5. 查看模型信息

::: details 查看模型详情
```bash
# 查看模型详细信息（参数量、量化方式、模板等）
ollama show llama3.1:8b

# 查看模型的 Modelfile 配置
ollama show llama3.1:8b --modelfile
```
:::

## 四、常用模型对比

Ollama 支持数百个开源模型，以下是几个主流模型的横向对比，帮助你根据场景选择合适的模型。

### 1. 通用对话模型

| 模型 | 参数规模 | 磁盘大小 | 推荐显存 | 中文能力 | 适用场景 |
|------|----------|----------|----------|----------|----------|
| Llama 3.1 | 8B / 70B | 4.7GB / 40GB | 8GB / 48GB | 一般 | 英文为主的通用对话、代码生成 |
| Qwen 2.5 | 7B / 14B / 72B | 4.4GB / 8.5GB / 41GB | 8GB / 16GB / 48GB | 优秀 | 中文对话、知识问答、代码辅助 |
| DeepSeek V2 | 16B / 236B | 9.1GB / 130GB | 16GB / 多卡 | 优秀 | 中文推理、数学、代码 |
| Mistral | 7B | 4.1GB | 8GB | 一般 | 英文对话、指令跟随 |

### 2. 代码生成模型

| 模型 | 参数规模 | 磁盘大小 | 推荐显存 | 特点 |
|------|----------|----------|----------|------|
| CodeLlama | 7B / 13B / 34B | 3.8GB / 7.4GB / 19GB | 8GB / 16GB / 24GB | Meta 出品，基于 Llama 2 微调 |
| DeepSeek Coder V2 | 16B | 9.1GB | 16GB | 代码补全和生成能力突出 |
| Qwen 2.5 Coder | 7B / 14B | 4.4GB / 8.5GB | 8GB / 16GB | 中英文代码生成均表现良好 |

::: tip 选择建议
- 如果你主要处理**中文内容**，优先选择 Qwen 2.5 或 DeepSeek 系列
- 如果你需要**代码辅助**，推荐 DeepSeek Coder V2 或 Qwen 2.5 Coder
- 如果你的显存**只有 8GB**，选择 7B/8B 参数规模的模型即可满足大部分需求
:::

## 五、REST API 使用

Ollama 启动后默认在 `http://localhost:11434` 提供 REST API 服务，兼容 OpenAI API 格式。

### 1. 基础对话接口

::: details 使用 curl 调用对话 API
```bash
# 生成回复（流式输出）
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:7b",
  "prompt": "请解释 JavaScript 中的事件循环机制"
}'

# 生成回复（非流式，一次性返回完整结果）
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:7b",
  "prompt": "请解释 JavaScript 中的事件循环机制",
  "stream": false
}'
```
:::

### 2. 多轮对话接口

::: details 使用 Chat API 进行多轮对话
```bash
curl http://localhost:11434/api/chat -d '{
  "model": "qwen2.5:7b",
  "messages": [
    {
      "role": "system",
      "content": "你是一位资深前端工程师，擅长 Vue 和 React 开发。"
    },
    {
      "role": "user",
      "content": "Vue 3 的 ref 和 reactive 有什么区别？"
    }
  ],
  "stream": false
}'
```
:::

### 3. OpenAI 兼容接口

Ollama 提供了与 OpenAI API 兼容的端点，你可以直接用现有的 OpenAI 客户端库对接。

::: details 使用 OpenAI 兼容接口
```bash
# 兼容 OpenAI 的 /v1/chat/completions 端点
curl http://localhost:11434/v1/chat/completions -d '{
  "model": "qwen2.5:7b",
  "messages": [
    {
      "role": "user",
      "content": "用 Python 写一个快速排序算法"
    }
  ]
}'
```
:::

### 4. 常用 API 端点总结

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/generate` | POST | 单轮文本生成 |
| `/api/chat` | POST | 多轮对话 |
| `/api/embeddings` | POST | 生成文本向量（Embedding） |
| `/api/tags` | GET | 列出本地模型 |
| `/api/show` | POST | 查看模型信息 |
| `/api/pull` | POST | 拉取模型 |
| `/api/delete` | DELETE | 删除模型 |
| `/v1/chat/completions` | POST | OpenAI 兼容的对话接口 |

## 六、集成 LangChain

LangChain 原生支持 Ollama 作为 LLM 后端，你可以在 Python 或 JavaScript/TypeScript 项目中轻松集成。

### 1. Python 集成

::: details 在 Python 项目中使用 Ollama + LangChain
```python
# 安装依赖
# pip install langchain langchain-ollama

from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage

# 初始化 Ollama 模型
chat_model = ChatOllama(
    model="qwen2.5:7b",
    temperature=0.7,       # 控制生成的随机性，0-1 之间
    base_url="http://localhost:11434",  # Ollama 服务地址
)

# 单轮对话
response = chat_model.invoke([
    HumanMessage(content="请用三句话解释什么是微前端架构")
])
print(response.content)

# 多轮对话（带系统提示词）
messages = [
    SystemMessage(content="你是一位高级全栈工程师，回答问题时要给出代码示例。"),
    HumanMessage(content="如何在 NestJS 中实现 JWT 认证？"),
]
response = chat_model.invoke(messages)
print(response.content)
```
:::

### 2. JavaScript/TypeScript 集成

::: details 在 Node.js 项目中使用 Ollama + LangChain
```typescript
// 安装依赖
// npm install @langchain/ollama @langchain/core

// src/services/chatService.ts
import { ChatOllama } from "@langchain/ollama";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// 初始化 Ollama 模型
const chatModel = new ChatOllama({
  model: "qwen2.5:7b",
  temperature: 0.7,
  baseUrl: "http://localhost:11434",
});

async function askQuestion(question: string): Promise<string> {
  const response = await chatModel.invoke([
    new SystemMessage("你是一位前端技术专家，擅长 Vue 3 和 React 18。"),
    new HumanMessage(question),
  ]);
  return response.content as string;
}

// 使用示例
const answer = await askQuestion("Vue 3 中如何实现跨组件状态共享？");
console.log(answer);
```
:::

### 3. 结合 RAG 检索增强生成

::: details 使用 Ollama 搭建本地 RAG 系统
```python
# pip install langchain langchain-ollama langchain-community chromadb

from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 1. 加载文档
loader = TextLoader("./docs/project-guidelines.txt", encoding="utf-8")
documents = loader.load()

# 2. 文档分块
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
)
split_docs = text_splitter.split_documents(documents)

# 3. 使用 Ollama 生成 Embedding 并存入向量数据库
embeddings = OllamaEmbeddings(model="nomic-embed-text")
vectorstore = Chroma.from_documents(split_docs, embeddings)

# 4. 创建检索链
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
llm = ChatOllama(model="qwen2.5:7b", temperature=0)

prompt = ChatPromptTemplate.from_template("""
根据以下上下文回答问题。如果上下文中没有相关信息，请如实说明。

上下文：{context}

问题：{input}
""")

document_chain = create_stuff_documents_chain(llm, prompt)
retrieval_chain = create_retrieval_chain(retriever, document_chain)

# 5. 提问
result = retrieval_chain.invoke({"input": "项目的代码规范是什么？"})
print(result["answer"])
```
:::

## 七、自定义 Modelfile

Modelfile 类似于 Dockerfile，让你基于已有模型创建自定义配置的衍生模型。

### 1. Modelfile 语法

::: details Modelfile 常用指令
```dockerfile
# Modelfile 示例：创建一个前端开发助手

# 指定基础模型
FROM qwen2.5:7b

# 设置系统提示词
SYSTEM """
你是一位资深前端开发工程师，精通 Vue 3、React 18、TypeScript 和 Node.js。
回答问题时遵循以下规则：
1. 优先给出代码示例，代码必须可直接运行
2. 使用 TypeScript 而非 JavaScript
3. 遵循最新的最佳实践
4. 简洁明了，避免冗余解释
"""

# 设置模型参数
PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_ctx 4096

# 设置停止词
PARAMETER stop "<|im_end|>"
PARAMETER stop "<|endoftext|>"

# 设置对话模板（可选，大部分模型有默认模板）
TEMPLATE """
{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}<|im_start|>user
{{ .Prompt }}<|im_end|>
<|im_start|>assistant
"""
```
:::

### 2. 创建和使用自定义模型

::: details 基于 Modelfile 创建自定义模型
```bash
# 1. 创建 Modelfile 文件（内容如上）
# 文件路径：~/ollama-models/frontend-assistant.Modelfile

# 2. 基于 Modelfile 创建自定义模型
ollama create frontend-assistant -f ~/ollama-models/frontend-assistant.Modelfile

# 3. 运行自定义模型
ollama run frontend-assistant

# 4. 验证模型配置
ollama show frontend-assistant
```
:::

### 3. 常用参数说明

| 参数 | 默认值 | 范围 | 说明 |
|------|--------|------|------|
| `temperature` | 0.8 | 0.0 - 2.0 | 控制随机性，越低越确定，越高越有创意 |
| `top_p` | 0.9 | 0.0 - 1.0 | 核采样阈值，与 temperature 配合控制多样性 |
| `top_k` | 40 | 1 - 100 | 每步只考虑概率最高的 K 个 Token |
| `num_ctx` | 2048 | 512 - 131072 | 上下文窗口大小，影响可处理的文本长度 |
| `repeat_penalty` | 1.1 | 0.0 - 2.0 | 重复惩罚系数，防止模型生成重复内容 |
| `seed` | 随机 | 任意整数 | 固定种子可使输出可复现 |

::: warning 注意
增大 `num_ctx` 会显著增加显存占用。例如将 `num_ctx` 从 2048 增加到 8192，显存占用可能增加 2-3GB。请根据你的硬件条件合理设置。
:::

## 八、GPU 需求与性能调优

### 1. 硬件需求评估

模型的显存占用主要取决于参数量和量化精度：

| 量化精度 | 7B 模型 | 13B 模型 | 30B 模型 | 70B 模型 |
|----------|---------|----------|----------|----------|
| Q4_0（4-bit） | ~4GB | ~7.5GB | ~17GB | ~38GB |
| Q5_1（5-bit） | ~5GB | ~9.5GB | ~21GB | ~48GB |
| Q8_0（8-bit） | ~7.5GB | ~14GB | ~32GB | ~70GB |
| FP16（16-bit） | ~14GB | ~26GB | ~60GB | ~140GB |

::: tip
对于日常使用，Q4_0 量化在大多数场景下已经能提供足够好的生成质量，同时显著降低显存需求。只有在对输出精度有极高要求时，才需要考虑更高精度的量化版本。
:::

### 2. 环境变量配置

::: details 通过环境变量优化 Ollama 性能
```bash
# 指定 GPU 设备（多 GPU 环境下选择特定 GPU）
export CUDA_VISIBLE_DEVICES=0          # 使用第一块 GPU
export CUDA_VISIBLE_DEVICES=0,1        # 使用前两块 GPU

# 设置 Ollama 模型存储路径（默认 ~/.ollama/models）
export OLLAMA_MODELS=/data/ollama-models

# 修改 Ollama 服务监听地址（默认仅本机访问）
export OLLAMA_HOST=0.0.0.0:11434       # 允许局域网访问

# 设置最大并发请求数
export OLLAMA_NUM_PARALLEL=4

# 设置模型在内存中的保留时间（默认 5 分钟无请求后卸载）
export OLLAMA_KEEP_ALIVE=30m           # 保留 30 分钟

# 设置最大加载模型数量
export OLLAMA_MAX_LOADED_MODELS=2
```
:::

### 3. 性能优化建议

#### (1) GPU 推理优化

- 确保安装了最新版本的 GPU 驱动（NVIDIA 用户需要 CUDA 11.8+）
- 使用 `nvidia-smi` 监控 GPU 利用率和显存占用
- 如果显存不足，选择更低精度的量化版本（如从 Q8 降到 Q4）

#### (2) CPU 推理优化

- Ollama 在无 GPU 环境下会自动使用 CPU 推理
- CPU 推理速度较慢，建议选择 7B 及以下规模的模型
- Apple Silicon 芯片通过 Metal 加速，性能表现优于普通 CPU

#### (3) 内存管理

- 关闭不必要的后台应用，释放更多内存给模型
- 使用 `OLLAMA_KEEP_ALIVE=0` 让模型在每次请求后立即卸载，适合内存紧张的环境
- 避免同时加载多个大模型

::: details 使用 nvidia-smi 监控 GPU 状态
```bash
# 查看 GPU 状态（单次）
nvidia-smi

# 每 2 秒刷新一次 GPU 状态（持续监控）
watch -n 2 nvidia-smi

# 仅查看 GPU 利用率和显存占用
nvidia-smi --query-gpu=gpu_name,utilization.gpu,memory.used,memory.total --format=csv

# 输出示例：
# name, utilization.gpu [%], memory.used [MiB], memory.total [MiB]
# NVIDIA GeForce RTX 4090, 78 %, 18432 MiB, 24564 MiB
```
:::

### 4. 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 模型加载失败 | 显存不足 | 换用更小的模型或更低精度的量化版本 |
| 生成速度很慢 | 使用了 CPU 推理 | 检查 GPU 驱动是否正确安装 |
| 中文输出乱码 | 模型不支持中文 | 更换 Qwen 或 DeepSeek 等中文友好模型 |
| 端口被占用 | 其他服务占用 11434 | 用 `OLLAMA_HOST` 更换端口 |
| 模型下载失败 | 网络问题 | 配置代理或使用镜像源 |
| 输出重复啰嗦 | 参数未优化 | 调高 `repeat_penalty`，降低 `temperature` |

::: warning 注意
如果你在中国大陆使用 Ollama 拉取模型时遇到网络问题，可以通过设置 HTTP 代理解决：
```bash
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
ollama pull qwen2.5:7b
```
:::
