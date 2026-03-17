---
title: "LLM 应用集成实践"
category: "AI · LLM API"
tags:
  - LLM
  - 集成
  - 最佳实践
  - 部署
date: 2026-03-17
excerpt: "覆盖 LLM 应用集成的全链路最佳实践：API 密钥安全、请求重试限流、上下文窗口管理、多模型切换、嵌入模型、视觉 API 以及费用优化策略。"
---

# LLM 应用集成实践

将 LLM API 集成到生产应用中，需要考虑的远不止"发一个请求"那么简单。本文系统梳理生产级 LLM 集成的关键环节。

## 一、API 密钥安全管理

### 1. 基本原则

::: danger API 密钥绝不能出现在代码中
不要将 API Key 硬编码在源文件、配置文件或 Git 仓库中。一旦泄露，可能导致严重的费用损失和数据安全问题。
:::

| 原则 | 实践 |
|------|------|
| 环境变量存储 | 使用 `.env` 文件本地开发，CI/CD 系统变量生产部署 |
| 最小权限 | 为不同应用创建不同的 API Key，限制权限范围 |
| 定期轮换 | 建立 Key 轮换机制，降低泄露风险 |
| 访问审计 | 监控 API Key 的使用量和调用模式 |
| 服务端代理 | 前端应用通过自己的后端中转，绝不在前端直接调用 LLM API |

### 2. 多环境密钥管理

::: details 使用 python-dotenv 管理环境变量

```python
# src/config/settings.py
import os
from dotenv import load_dotenv
from pathlib import Path

# 根据运行环境加载不同的 .env 文件
env = os.getenv("APP_ENV", "development")
env_file = Path(f".env.{env}")

if env_file.exists():
    load_dotenv(env_file)
else:
    load_dotenv(".env")  # 默认加载 .env

class Settings:
    """应用配置（从环境变量读取）"""
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    OPENAI_ORG_ID: str = os.getenv("OPENAI_ORG_ID", "")

    # 安全：启动时验证必要密钥是否存在
    def validate(self):
        missing = []
        if not self.OPENAI_API_KEY:
            missing.append("OPENAI_API_KEY")
        if missing:
            raise EnvironmentError(f"缺少必要的环境变量：{', '.join(missing)}")

settings = Settings()
settings.validate()
```

```bash
# .env（本地开发，加入 .gitignore）
OPENAI_API_KEY=sk-proj-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
APP_ENV=development

# .env.production（生产环境，通过 CI/CD 注入，不提交 Git）
OPENAI_API_KEY=<从密钥管理系统获取>
APP_ENV=production
```
:::

### 3. 使用密钥管理服务

::: details 从 AWS Secrets Manager 获取 API Key

```python
# src/config/secrets.py
import boto3
import json
from functools import lru_cache

@lru_cache(maxsize=1)  # 缓存结果，避免频繁调用 AWS API
def get_secrets() -> dict:
    """从 AWS Secrets Manager 获取 API 密钥"""
    session = boto3.session.Session()
    client = session.client(
        service_name="secretsmanager",
        region_name="ap-northeast-1"
    )
    response = client.get_secret_value(SecretId="prod/llm-api-keys")
    return json.loads(response["SecretString"])

def get_openai_key() -> str:
    return get_secrets()["OPENAI_API_KEY"]
```
:::

---

## 二、请求重试与限流

### 1. 错误类型分类

| 错误类型 | HTTP 状态码 | 是否重试 | 策略 |
|---------|-----------|---------|------|
| 速率限制 | 429 | 是 | 指数退避 + Jitter |
| 服务过载 | 503 | 是 | 指数退避 |
| 超时 | 408/504 | 是 | 固定间隔重试 |
| 认证失败 | 401 | 否 | 立即报错 |
| 参数错误 | 400 | 否 | 立即报错 |
| 内容过滤 | 400 | 否 | 调整输入 |

### 2. 指数退避实现

::: details 带指数退避的请求重试

```python
# src/llm/retry_client.py
import openai
import time
import random
import logging
from typing import Callable, TypeVar, Any
from functools import wraps

logger = logging.getLogger(__name__)
T = TypeVar("T")

def with_retry(
    max_retries: int = 5,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True
):
    """
    指数退避重试装饰器

    退避时间 = min(base_delay * (exponential_base ** attempt), max_delay)
    加入 Jitter（随机抖动）避免惊群效应
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)

                except openai.RateLimitError as e:
                    if attempt == max_retries - 1:
                        raise
                    # 优先使用 API 返回的 retry-after
                    retry_after = getattr(e, "retry_after", None)
                    delay = retry_after or min(
                        base_delay * (exponential_base ** attempt),
                        max_delay
                    )
                    if jitter:
                        delay *= (1 + random.uniform(0, 0.1))
                    logger.warning(f"速率限制，{delay:.1f}s 后重试（第 {attempt+1}/{max_retries} 次）")
                    time.sleep(delay)

                except openai.APIStatusError as e:
                    if e.status_code in (408, 503, 504):
                        if attempt == max_retries - 1:
                            raise
                        delay = base_delay * (exponential_base ** attempt)
                        logger.warning(f"服务错误 {e.status_code}，{delay:.1f}s 后重试")
                        time.sleep(delay)
                    else:
                        raise  # 不可重试的错误直接抛出

                except openai.APIConnectionError:
                    if attempt == max_retries - 1:
                        raise
                    delay = base_delay * (exponential_base ** attempt)
                    logger.warning(f"连接失败，{delay:.1f}s 后重试")
                    time.sleep(delay)

        return wrapper
    return decorator

# 使用装饰器
client = openai.OpenAI()

@with_retry(max_retries=5, base_delay=1.0)
def create_chat_completion(messages: list, model: str = "gpt-4o") -> str:
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        timeout=30  # 单次请求超时时间
    )
    return response.choices[0].message.content
```
:::

### 3. 客户端限流

::: details 令牌桶限流器

```python
# src/llm/rate_limiter.py
import time
import threading
from collections import deque

class TokenBucketRateLimiter:
    """
    令牌桶限流器，控制每分钟的请求数和 Token 数

    适用于同时限制 RPM（每分钟请求数）和 TPM（每分钟 Token 数）
    """

    def __init__(self, rpm_limit: int = 60, tpm_limit: int = 90000):
        self.rpm_limit = rpm_limit
        self.tpm_limit = tpm_limit
        self.request_times = deque()  # 请求时间窗口
        self.token_usage = deque()    # Token 用量窗口
        self.lock = threading.Lock()

    def _cleanup_old_records(self, current_time: float, window: deque):
        """清理 1 分钟前的记录"""
        while window and current_time - window[0][0] > 60:
            window.popleft()

    def acquire(self, estimated_tokens: int = 1000) -> float:
        """
        获取请求许可，如需等待则返回等待时间

        Args:
            estimated_tokens: 预估本次请求消耗的 Token 数

        Returns:
            实际等待的秒数
        """
        with self.lock:
            current_time = time.time()
            self._cleanup_old_records(current_time, self.request_times)
            self._cleanup_old_records(current_time, self.token_usage)

            wait_time = 0

            # 检查 RPM 限制
            if len(self.request_times) >= self.rpm_limit:
                oldest_request = self.request_times[0][0]
                wait_time = max(wait_time, 60 - (current_time - oldest_request))

            # 检查 TPM 限制
            current_tpm = sum(t for _, t in self.token_usage)
            if current_tpm + estimated_tokens > self.tpm_limit:
                oldest_token = self.token_usage[0][0]
                wait_time = max(wait_time, 60 - (current_time - oldest_token))

            if wait_time > 0:
                time.sleep(wait_time)
                current_time = time.time()

            self.request_times.append((current_time, 1))
            self.token_usage.append((current_time, estimated_tokens))
            return wait_time

# 使用示例
limiter = TokenBucketRateLimiter(rpm_limit=60, tpm_limit=90000)

def rate_limited_completion(messages: list) -> str:
    wait = limiter.acquire(estimated_tokens=500)
    if wait > 0:
        logger.info(f"限流等待 {wait:.1f}s")
    return create_chat_completion(messages)
```
:::

---

## 三、上下文窗口管理

### 1. 上下文溢出问题

| 模型 | 上下文窗口 | 满窗口时的行为 |
|------|-----------|--------------|
| gpt-4o | 128K tokens | 报错：context_length_exceeded |
| claude-opus-4-5 | 200K tokens | 报错：prompt is too long |
| gpt-4o-mini | 128K tokens | 同上 |

### 2. 滑动窗口策略

::: details 滑动窗口上下文管理

```python
# src/llm/context_manager.py
import tiktoken
from typing import List, Dict

class SlidingWindowContextManager:
    """
    滑动窗口上下文管理器

    保留系统提示词 + 最新的 N 条消息，丢弃最旧的消息
    """

    def __init__(
        self,
        max_tokens: int = 100000,  # 保留 28K 的输出空间
        model: str = "gpt-4o"
    ):
        self.max_tokens = max_tokens
        self.encoding = tiktoken.encoding_for_model(model)

    def count_tokens(self, messages: List[Dict]) -> int:
        """计算消息列表的 Token 数"""
        total = 3  # 基础开销
        for msg in messages:
            total += 4  # 每条消息开销
            total += len(self.encoding.encode(str(msg.get("content", ""))))
        return total

    def trim_messages(
        self,
        messages: List[Dict],
        system_prompt: str = ""
    ) -> List[Dict]:
        """
        裁剪历史消息，保持在 Token 限制内

        策略：保留 system + 从最新消息往前保留，直到接近 Token 上限
        """
        system_message = [{"role": "system", "content": system_prompt}] if system_prompt else []
        system_tokens = self.count_tokens(system_message)
        available_tokens = self.max_tokens - system_tokens

        # 从最新到最旧，依次加入，直到超出限制
        result = []
        current_tokens = 0

        for msg in reversed(messages):
            msg_tokens = self.count_tokens([msg])
            if current_tokens + msg_tokens > available_tokens:
                break
            result.insert(0, msg)
            current_tokens += msg_tokens

        return system_message + result

# 使用示例
manager = SlidingWindowContextManager(max_tokens=100000)
all_messages = [...]  # 可能很长的对话历史

trimmed = manager.trim_messages(all_messages, system_prompt="你是一个助手")
print(f"从 {len(all_messages)} 条裁剪到 {len(trimmed)} 条消息")
```
:::

### 3. 摘要压缩策略

::: details 自动摘要旧对话历史

```python
# src/llm/summary_memory.py
import openai
from typing import List, Dict

client = openai.OpenAI()

SUMMARIZE_PROMPT = """
请将以下对话历史压缩为简洁的摘要，保留关键信息和决策，丢弃闲聊内容。
摘要应不超过 200 字。

对话历史：
{conversation}
"""

def compress_old_messages(
    messages: List[Dict],
    keep_recent: int = 10,
    compress_threshold: int = 20
) -> List[Dict]:
    """
    当对话超过阈值时，将旧消息压缩为摘要

    Args:
        keep_recent: 始终保留最新的 N 条消息
        compress_threshold: 超过此数量时触发压缩
    """
    if len(messages) <= compress_threshold:
        return messages

    # 分离：待压缩的旧消息 + 保留的新消息
    old_messages = messages[:-keep_recent]
    recent_messages = messages[-keep_recent:]

    # 生成摘要
    conversation_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in old_messages
        if m["role"] != "system"
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",  # 用小模型降低摘要成本
        messages=[{
            "role": "user",
            "content": SUMMARIZE_PROMPT.format(conversation=conversation_text)
        }],
        max_tokens=300
    )

    summary = response.choices[0].message.content

    # 将摘要作为系统消息插入
    summary_message = {
        "role": "system",
        "content": f"[历史对话摘要]\n{summary}"
    }

    return [summary_message] + recent_messages
```
:::

---

## 四、多模型切换策略（Fallback）

### 1. Fallback 设计原则

当主模型不可用时，自动切换到备用模型，保障服务可用性。

::: details 多模型 Fallback 路由器

```python
# src/llm/model_router.py
import openai
import anthropic
import time
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class ModelConfig:
    provider: str          # "openai" 或 "anthropic"
    model: str             # 模型名称
    max_tokens: int = 2048
    priority: int = 0      # 数字越小优先级越高
    is_healthy: bool = True
    last_failure: float = field(default=0.0)
    failure_count: int = 0
    cooldown_seconds: int = 60  # 失败后冷却时间

class ModelRouter:
    """
    多模型路由器，支持优先级路由和自动 Fallback
    """

    MODELS = [
        ModelConfig(provider="openai", model="gpt-4o", priority=0),
        ModelConfig(provider="openai", model="gpt-4o-mini", priority=1),
        ModelConfig(provider="anthropic", model="claude-haiku-3-5", priority=2),
    ]

    def __init__(self):
        self.openai_client = openai.OpenAI()
        self.anthropic_client = anthropic.Anthropic()

    def _get_available_models(self) -> List[ModelConfig]:
        """返回当前可用的模型（过了冷却期的）"""
        current_time = time.time()
        available = []
        for model in sorted(self.MODELS, key=lambda m: m.priority):
            if not model.is_healthy:
                if current_time - model.last_failure > model.cooldown_seconds:
                    model.is_healthy = True  # 冷却后重置
                    model.failure_count = 0
                else:
                    continue
            available.append(model)
        return available

    def _call_openai(self, config: ModelConfig, messages: List[Dict]) -> str:
        response = self.openai_client.chat.completions.create(
            model=config.model,
            messages=messages,
            max_tokens=config.max_tokens,
            timeout=30
        )
        return response.choices[0].message.content

    def _call_anthropic(self, config: ModelConfig, messages: List[Dict]) -> str:
        # 转换消息格式（OpenAI → Anthropic）
        system = next((m["content"] for m in messages if m["role"] == "system"), "")
        user_messages = [m for m in messages if m["role"] != "system"]

        response = self.anthropic_client.messages.create(
            model=config.model,
            max_tokens=config.max_tokens,
            system=system,
            messages=user_messages
        )
        return response.content[0].text

    def complete(self, messages: List[Dict]) -> Optional[str]:
        """带 Fallback 的消息生成"""
        available = self._get_available_models()

        for config in available:
            try:
                logger.info(f"尝试模型：{config.provider}/{config.model}")

                if config.provider == "openai":
                    result = self._call_openai(config, messages)
                elif config.provider == "anthropic":
                    result = self._call_anthropic(config, messages)
                else:
                    continue

                # 成功后重置失败计数
                config.failure_count = 0
                return result

            except Exception as e:
                logger.warning(f"模型 {config.model} 失败: {e}")
                config.failure_count += 1
                config.last_failure = time.time()
                if config.failure_count >= 3:
                    config.is_healthy = False
                    logger.error(f"模型 {config.model} 标记为不可用，冷却 {config.cooldown_seconds}s")

        logger.error("所有模型均不可用")
        return None

router = ModelRouter()
result = router.complete([{"role": "user", "content": "你好"}])
```
:::

---

## 五、嵌入模型（Embeddings API）

### 1. 嵌入模型选型

| 模型 | 维度 | 价格（$/1M tokens） | 推荐场景 |
|------|------|-------------------|---------|
| text-embedding-3-small | 1536 | $0.02 | 一般语义搜索 |
| text-embedding-3-large | 3072 | $0.13 | 高精度检索 |
| text-embedding-ada-002 | 1536 | $0.10 | 兼容旧系统 |

::: details 嵌入向量计算与相似度搜索

```python
# src/llm/embeddings.py
import openai
import numpy as np
from typing import List

client = openai.OpenAI()

def get_embedding(text: str, model: str = "text-embedding-3-small") -> List[float]:
    """获取文本的嵌入向量"""
    text = text.replace("\n", " ")  # 换行符影响质量
    response = client.embeddings.create(input=text, model=model)
    return response.data[0].embedding

def get_embeddings_batch(
    texts: List[str],
    model: str = "text-embedding-3-small"
) -> List[List[float]]:
    """批量获取嵌入向量（一次 API 调用，效率更高）"""
    texts = [t.replace("\n", " ") for t in texts]
    response = client.embeddings.create(input=texts, model=model)
    return [item.embedding for item in response.data]

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """计算余弦相似度（-1 到 1，越接近 1 越相似）"""
    a = np.array(vec_a)
    b = np.array(vec_b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def semantic_search(
    query: str,
    documents: List[str],
    top_k: int = 3
) -> List[dict]:
    """
    语义搜索：找出与查询最相关的文档

    Returns:
        按相似度降序排列的结果列表
    """
    # 批量计算所有文档的嵌入（含查询）
    all_texts = [query] + documents
    all_embeddings = get_embeddings_batch(all_texts)

    query_embedding = all_embeddings[0]
    doc_embeddings = all_embeddings[1:]

    # 计算相似度并排序
    results = [
        {
            "document": doc,
            "similarity": cosine_similarity(query_embedding, emb),
            "index": i
        }
        for i, (doc, emb) in enumerate(zip(documents, doc_embeddings))
    ]

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:top_k]

# 使用示例
documents = [
    "Python 是一种高级编程语言，以简洁语法著称",
    "机器学习是人工智能的一个子领域",
    "向量数据库专门用于存储和检索高维向量",
    "深度学习使用多层神经网络进行特征学习",
]

results = semantic_search("什么工具适合存储 AI 嵌入向量？", documents, top_k=2)
for r in results:
    print(f"相似度: {r['similarity']:.4f} | {r['document']}")
```
:::

---

## 六、图片理解（Vision API）

::: details Vision API 多场景应用

```python
# src/llm/vision_api.py
import openai
import base64
import httpx
from pathlib import Path

client = openai.OpenAI()

def analyze_image_from_url(image_url: str, prompt: str) -> str:
    """从 URL 分析图片（适合公开图片）"""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": image_url}},
                {"type": "text", "text": prompt}
            ]
        }],
        max_tokens=1000
    )
    return response.choices[0].message.content

def analyze_local_image(image_path: str, prompt: str, detail: str = "auto") -> str:
    """
    分析本地图片

    Args:
        detail: "low"（快速廉价）/ "high"（精细贵）/ "auto"（自动选择）
    """
    suffix = Path(image_path).suffix.lower()
    mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp"}
    mime_type = mime_map.get(suffix, "image/jpeg")

    with open(image_path, "rb") as f:
        b64_image = base64.b64encode(f.read()).decode("utf-8")

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime_type};base64,{b64_image}",
                        "detail": detail
                    }
                },
                {"type": "text", "text": prompt}
            ]
        }],
        max_tokens=1500
    )
    return response.choices[0].message.content

# 典型应用场景
# 1. 错误截图分析
error_analysis = analyze_local_image(
    "error_screenshot.png",
    "分析截图中的错误信息，给出可能的原因和解决步骤。"
)

# 2. 图表数据提取
chart_data = analyze_local_image(
    "sales_chart.png",
    "提取图表中的数据，以 JSON 格式输出，包含月份和对应数值。",
    detail="high"
)

# 3. 多图对比
def compare_designs(image_paths: list, question: str) -> str:
    content = []
    for i, path in enumerate(image_paths, 1):
        with open(path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        content.append({"type": "text", "text": f"图片 {i}："})
        content.append({"type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{b64}"}})
    content.append({"type": "text", "text": question})

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": content}]
    )
    return response.choices[0].message.content
```
:::

---

## 七、语音转文本（Whisper API）

::: details Whisper API 语音识别集成

```python
# src/llm/whisper_api.py
import openai
from pathlib import Path

client = openai.OpenAI()

def transcribe_audio(
    audio_path: str,
    language: str = "zh",
    prompt: str = ""
) -> dict:
    """
    语音转文本（Whisper API）

    Args:
        audio_path: 音频文件路径（支持 mp3/mp4/wav/m4a/webm，最大 25MB）
        language: 语言代码（zh=中文，en=英文，auto=自动检测）
        prompt: 提示词，用于提高专业术语识别准确率

    Returns:
        {"text": "转录文本", "segments": [...], "language": "zh"}
    """
    with open(audio_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language=language if language != "auto" else None,
            prompt=prompt,  # 例如："这是一段关于Python编程的讲解，涉及Django、FastAPI等框架"
            response_format="verbose_json",  # 包含时间戳信息
            timestamp_granularities=["segment"]  # segment/word 级别时间戳
        )

    return {
        "text": transcript.text,
        "language": transcript.language,
        "duration": transcript.duration,
        "segments": [
            {
                "start": s.start,
                "end": s.end,
                "text": s.text
            }
            for s in (transcript.segments or [])
        ]
    }

def transcribe_large_audio(audio_path: str, chunk_size_mb: int = 20) -> str:
    """
    处理超过 25MB 的音频文件（分块转录后合并）
    需要安装 pydub：pip install pydub
    """
    from pydub import AudioSegment

    audio = AudioSegment.from_file(audio_path)
    chunk_duration_ms = chunk_size_mb * 1024 * 1024 * 8 / (128 * 1000)  # 估算按 128kbps

    chunks = []
    for i, start in enumerate(range(0, len(audio), int(chunk_duration_ms))):
        chunk = audio[start:start + int(chunk_duration_ms)]
        chunk_path = f"/tmp/chunk_{i}.mp3"
        chunk.export(chunk_path, format="mp3")
        result = transcribe_audio(chunk_path)
        chunks.append(result["text"])

    return " ".join(chunks)
```
:::

---

## 八、费用优化策略

### 1. 优化策略矩阵

| 策略 | 节省来源 | 实现复杂度 | 节省幅度 |
|------|---------|---------|---------|
| 模型降级（复杂→简单任务） | 按模型计费 | 低 | 50-95% |
| Prompt Caching | 重复 Prompt 的输入成本 | 低 | 50% 输入 |
| Batch API | 异步任务 50% 折扣 | 中 | 50% |
| 输出长度控制 | 减少输出 Token | 低 | 10-40% |
| Prompt 压缩 | 减少输入 Token | 中 | 20-70% |
| 缓存相同请求 | 避免重复调用 | 低 | 100%（命中时）|
| 嵌入模型降级 | 使用 small 代替 large | 极低 | 85% |

### 2. 请求结果缓存

::: details Redis 缓存 LLM 响应

```python
# src/llm/cache_client.py
import openai
import redis
import hashlib
import json
from typing import Optional

class CachedLLMClient:
    """带 Redis 缓存的 LLM 客户端，相同输入直接返回缓存结果"""

    def __init__(self, redis_url: str = "redis://localhost:6379", ttl: int = 3600):
        self.client = openai.OpenAI()
        self.redis = redis.from_url(redis_url)
        self.ttl = ttl  # 缓存有效期（秒）

    def _make_cache_key(self, messages: list, model: str, **kwargs) -> str:
        """生成缓存 Key（基于请求内容的 hash）"""
        content = json.dumps({
            "messages": messages,
            "model": model,
            **{k: v for k, v in kwargs.items() if k != "stream"}
        }, sort_keys=True, ensure_ascii=False)
        return f"llm:cache:{hashlib.sha256(content.encode()).hexdigest()}"

    def complete(
        self,
        messages: list,
        model: str = "gpt-4o",
        temperature: float = 0,  # 注意：temperature > 0 时缓存意义不大
        use_cache: bool = True,
        **kwargs
    ) -> str:
        # temperature > 0 时不使用缓存
        if temperature > 0:
            use_cache = False

        cache_key = self._make_cache_key(messages, model, temperature=temperature)

        # 尝试命中缓存
        if use_cache:
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)

        # 调用 API
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            **kwargs
        )
        result = response.choices[0].message.content

        # 写入缓存
        if use_cache:
            self.redis.setex(cache_key, self.ttl, json.dumps(result))

        return result

cached_client = CachedLLMClient(ttl=86400)  # 缓存 24 小时
result = cached_client.complete(
    messages=[{"role": "user", "content": "什么是 REST API？"}],
    model="gpt-4o-mini"
)
```
:::

::: tip 费用监控建议
建议为每个 LLM API 调用记录 Token 用量，按用户/功能模块/时间维度聚合，设置异常告警阈值。OpenAI 和 Anthropic 均提供用量仪表盘，也可通过各自的 Usage API 程序化获取账单数据。
:::
