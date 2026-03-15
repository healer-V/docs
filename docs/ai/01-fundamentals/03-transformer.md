---
title: "Transformer 架构"
category: "AI · 基础"
tags:
  - Transformer
  - 注意力机制
  - NLP
excerpt: "Transformer 通过自注意力机制实现并行计算和长距离依赖建模，是 GPT、BERT 等大语言模型的核心架构。"
date: 2026-03-15
---

# Transformer 架构

Transformer 是 Google 在 2017 年论文《Attention Is All You Need》中提出的模型架构。它完全摒弃了 RNN 的循环结构，仅依赖注意力机制（Attention Mechanism）来建模序列中元素之间的关系。凭借出色的并行能力和长距离依赖建模能力，Transformer 成为了 GPT、BERT、LLaMA 等现代大语言模型的基石。

## 一、注意力机制

### 1. 为什么需要注意力机制

在 RNN/LSTM 处理序列时，信息必须沿时间步逐个传递。当序列较长时，早期的信息在传递到后期时会逐渐衰减，导致模型难以捕捉长距离依赖。

注意力机制的核心思想是：对于序列中的每个位置，直接计算它与所有其他位置的关联强度，从而一步到位地获取全局信息，不再受距离限制。

| 对比维度 | RNN/LSTM | 注意力机制 |
|----------|----------|------------|
| 信息传递 | 逐步传递，串行 | 直接关联，并行 |
| 长距离依赖 | 容易衰减 | 无距离限制 |
| 计算方式 | 时间步串行计算 | 矩阵并行计算 |
| 训练速度 | 慢（无法并行） | 快（充分利用 GPU） |

### 2. 自注意力（Self-Attention）

自注意力是 Transformer 的核心操作。对于输入序列中的每个位置，它计算该位置与序列中所有位置（包括自身）的关联程度，然后用这些关联度对所有位置的信息做加权求和。

核心步骤：

1. **生成 Q、K、V**：将输入通过三个不同的线性变换，分别得到查询（Query）、键（Key）、值（Value）
2. **计算注意力分数**：用 Q 和 K 的点积衡量关联度
3. **缩放**：除以 √dₖ 防止点积值过大导致 Softmax 梯度消失
4. **Softmax 归一化**：将分数转换为概率分布
5. **加权求和**：用概率分布对 V 做加权求和，得到输出

核心公式：

```
Attention(Q, K, V) = softmax(Q · K^T / √dₖ) · V
```

其中：
- `Q`（Query）：当前位置的查询向量，表示"我在找什么"
- `K`（Key）：每个位置的键向量，表示"我有什么"
- `V`（Value）：每个位置的值向量，表示"我能提供什么信息"
- `dₖ`：Key 向量的维度，用于缩放

::: tip Q、K、V 的直觉理解
你可以把自注意力想象成一个搜索引擎：
- **Q（查询）**：你输入的搜索关键词
- **K（键）**：每个网页的标题和摘要
- **V（值）**：每个网页的实际内容
- 搜索过程就是用 Q 去匹配所有 K，找到最相关的，然后返回对应的 V 内容
:::

::: details 自注意力的完整计算过程
```python
# transformer_self_attention.py
import torch
import torch.nn as nn
import torch.nn.functional as F
import math


def scaled_dot_product_attention(query, key, value, mask=None):
    """
    缩放点积注意力的完整实现

    参数:
        query: (batch_size, seq_len, d_k) 查询张量
        key:   (batch_size, seq_len, d_k) 键张量
        value: (batch_size, seq_len, d_v) 值张量
        mask:  可选的掩码张量
    """
    d_k = query.size(-1)

    # 第一步：计算 Q 和 K 的点积 → 注意力分数
    # (batch, seq_len, d_k) × (batch, d_k, seq_len) → (batch, seq_len, seq_len)
    attention_scores = torch.matmul(query, key.transpose(-2, -1))  # {1}

    # 第二步：缩放（除以 √dₖ）
    attention_scores = attention_scores / math.sqrt(d_k)  # {2}

    # 第三步：应用掩码（可选，用于解码器的因果掩码）
    if mask is not None:
        attention_scores = attention_scores.masked_fill(mask == 0, float('-inf'))

    # 第四步：Softmax 归一化 → 注意力权重
    attention_weights = F.softmax(attention_scores, dim=-1)  # {3}

    # 第五步：加权求和
    output = torch.matmul(attention_weights, value)  # {4}

    return output, attention_weights


# 示例：处理一个包含 4 个词的句子
batch_size = 1
seq_len = 4        # "我 喜欢 深度 学习"
d_model = 8        # 嵌入维度

# 模拟词嵌入
torch.manual_seed(42)
word_embeddings = torch.randn(batch_size, seq_len, d_model)

# 线性变换生成 Q、K、V
W_q = nn.Linear(d_model, d_model, bias=False)
W_k = nn.Linear(d_model, d_model, bias=False)
W_v = nn.Linear(d_model, d_model, bias=False)

Q = W_q(word_embeddings)
K = W_k(word_embeddings)
V = W_v(word_embeddings)

# 计算自注意力
output, weights = scaled_dot_product_attention(Q, K, V)

print(f"输入形状:     {word_embeddings.shape}")
print(f"Q/K/V 形状:   {Q.shape}")
print(f"注意力权重:   {weights.shape}")
print(f"输出形状:     {output.shape}")

# 查看注意力权重矩阵（每个词对其他词的关注程度）
tokens = ['我', '喜欢', '深度', '学习']
print("\n注意力权重矩阵:")
print(f"{'':>6}", end='')
for t in tokens:
    print(f"{t:>8}", end='')
print()
for i, t in enumerate(tokens):
    print(f"{t:>6}", end='')
    for j in range(seq_len):
        print(f"{weights[0, i, j].item():>8.4f}", end='')
    print()
```
:::

### 3. 多头注意力（Multi-Head Attention）

单个注意力头只能关注一种类型的关系。多头注意力将 Q、K、V 分成多个头，每个头独立计算注意力，最后将所有头的输出拼接并做线性变换。这样模型能同时从不同角度关注信息。

```
MultiHead(Q, K, V) = Concat(head₁, head₂, ..., headₕ) · W_O
其中 headᵢ = Attention(Q · Wᵢ_Q, K · Wᵢ_K, V · Wᵢ_V)
```

例如在处理句子"猫坐在垫子上"时：
- **头 1** 可能关注语法关系（"猫" → "坐"）
- **头 2** 可能关注位置关系（"猫" → "垫子"）
- **头 3** 可能关注语义关系（"坐" → "垫子上"）

::: details 多头注意力实现
```python
# transformer_multi_head_attention.py
import torch
import torch.nn as nn
import math


class MultiHeadAttention(nn.Module):
    """多头注意力机制的完整实现"""

    def __init__(self, d_model=512, num_heads=8, dropout=0.1):
        super().__init__()
        assert d_model % num_heads == 0, "d_model 必须能被 num_heads 整除"

        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads  # 每个头的维度

        # Q、K、V 的线性变换（合并为一个矩阵提高效率）
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)

        # 输出线性变换
        self.W_o = nn.Linear(d_model, d_model)

        self.dropout = nn.Dropout(dropout)

    def forward(self, query, key, value, mask=None):
        batch_size = query.size(0)

        # 1. 线性变换并拆分为多个头
        # (batch, seq_len, d_model) → (batch, num_heads, seq_len, d_k)
        Q = self.W_q(query).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2) # {1}
        K = self.W_k(key).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(value).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)

        # 2. 缩放点积注意力
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))

        attention_weights = torch.softmax(scores, dim=-1)
        attention_weights = self.dropout(attention_weights)

        # 3. 加权求和
        context = torch.matmul(attention_weights, V)

        # 4. 拼接多个头的输出
        # (batch, num_heads, seq_len, d_k) → (batch, seq_len, d_model)
        context = context.transpose(1, 2).contiguous().view(batch_size, -1, self.d_model) # {2}

        # 5. 输出线性变换
        output = self.W_o(context)

        return output, attention_weights


# 使用示例
d_model = 512
num_heads = 8
seq_len = 10
batch_size = 2

mha = MultiHeadAttention(d_model=d_model, num_heads=num_heads)

# 模拟输入
x = torch.randn(batch_size, seq_len, d_model)

# 自注意力：Q、K、V 都来自同一个输入
output, weights = mha(x, x, x)

print(f"输入形状:       {x.shape}")
print(f"输出形状:       {output.shape}")
print(f"注意力权重形状: {weights.shape}")  # (batch, heads, seq_len, seq_len)
```
:::

## 二、位置编码（Positional Encoding）

### 1. 为什么需要位置编码

自注意力机制本身是置换不变的（Permutation Invariant）：打乱输入序列的顺序，输出结果不变。但语言是有顺序的，"猫吃鱼"和"鱼吃猫"的含义完全不同。位置编码就是用来为模型注入位置信息的。

### 2. 正弦余弦位置编码

原始 Transformer 使用正弦和余弦函数生成位置编码：

```
PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

其中 `pos` 是位置索引，`i` 是维度索引。

这种编码方式的优点：
- 对任意位置都能生成唯一的编码
- 相对位置信息可以通过线性变换表示
- 能泛化到训练时未见过的序列长度

::: details 位置编码实现与可视化
```python
# transformer_positional_encoding.py
import torch
import torch.nn as nn
import math
import matplotlib.pyplot as plt


class PositionalEncoding(nn.Module):
    """正弦余弦位置编码"""

    def __init__(self, d_model, max_seq_len=5000, dropout=0.1):
        super().__init__()
        self.dropout = nn.Dropout(dropout)

        # 预计算位置编码矩阵
        pe = torch.zeros(max_seq_len, d_model)
        position = torch.arange(0, max_seq_len).unsqueeze(1).float()

        # 计算除数项: 10000^(2i/d_model)
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * -(math.log(10000.0) / d_model)
        )

        # 偶数维度用 sin，奇数维度用 cos
        pe[:, 0::2] = torch.sin(position * div_term)  # {1}
        pe[:, 1::2] = torch.cos(position * div_term)  # {2}

        # 添加 batch 维度并注册为 buffer（不参与梯度计算）
        pe = pe.unsqueeze(0)
        self.register_buffer('pe', pe)

    def forward(self, x):
        """
        x: (batch_size, seq_len, d_model)
        """
        # 将位置编码加到词嵌入上
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


# 可视化位置编码
d_model = 128
max_len = 100

encoder = PositionalEncoding(d_model, max_seq_len=max_len)
pe_matrix = encoder.pe[0, :max_len, :].numpy()

plt.figure(figsize=(12, 6))
plt.imshow(pe_matrix, cmap='RdBu', aspect='auto')
plt.colorbar(label='编码值')
plt.xlabel('编码维度')
plt.ylabel('序列位置')
plt.title('位置编码矩阵可视化')
plt.savefig('positional_encoding.png', dpi=150, bbox_inches='tight')
plt.show()
```
:::

## 三、Transformer 完整架构

### 1. 编码器-解码器结构

完整的 Transformer 由编码器（Encoder）和解码器（Decoder）两部分组成：

```
输入序列 → [编码器] → 上下文表示 → [解码器] → 输出序列
```

编码器和解码器都由多层堆叠而成，每层的结构如下：

| 组件 | 编码器层 | 解码器层 |
|------|----------|----------|
| 第一个子层 | 多头自注意力 | 带掩码的多头自注意力 |
| 第二个子层 | 前馈网络 | 多头交叉注意力（Q 来自解码器，K/V 来自编码器） |
| 第三个子层 | - | 前馈网络 |
| 残差连接 | 每个子层都有 | 每个子层都有 |
| 层归一化 | 每个子层之后 | 每个子层之后 |

### 2. 前馈网络（FFN）

每个 Transformer 层中的前馈网络由两个线性变换和一个激活函数组成：

```
FFN(x) = Linear₂(GELU(Linear₁(x)))
```

通常中间层的维度是输入维度的 4 倍（如输入 512，中间层 2048）。

### 3. 残差连接与层归一化

每个子层的输出都会经过残差连接和层归一化：

```
output = LayerNorm(x + Sublayer(x))
```

- **残差连接**：将输入直接加到子层输出上，缓解深层网络的梯度消失问题
- **层归一化**：稳定训练过程，加速收敛

::: details Transformer 编码器完整实现
```python
# transformer_encoder.py
import torch
import torch.nn as nn
import math


class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, num_heads, dropout=0.1):
        super().__init__()
        self.d_k = d_model // num_heads
        self.num_heads = num_heads
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
        self.dropout = nn.Dropout(dropout)

    def forward(self, query, key, value, mask=None):
        batch_size = query.size(0)
        Q = self.W_q(query).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(key).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(value).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)

        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))
        weights = self.dropout(torch.softmax(scores, dim=-1))
        context = torch.matmul(weights, V)
        context = context.transpose(1, 2).contiguous().view(batch_size, -1, self.num_heads * self.d_k)
        return self.W_o(context)


class FeedForward(nn.Module):
    """前馈网络：两层线性变换 + GELU 激活"""

    def __init__(self, d_model, d_ff, dropout=0.1):
        super().__init__()
        self.linear1 = nn.Linear(d_model, d_ff)
        self.linear2 = nn.Linear(d_ff, d_model)
        self.dropout = nn.Dropout(dropout)
        self.activation = nn.GELU()

    def forward(self, x):
        return self.linear2(self.dropout(self.activation(self.linear1(x))))


class TransformerEncoderLayer(nn.Module):
    """单个 Transformer 编码器层"""

    def __init__(self, d_model, num_heads, d_ff, dropout=0.1):
        super().__init__()
        self.self_attention = MultiHeadAttention(d_model, num_heads, dropout)
        self.feed_forward = FeedForward(d_model, d_ff, dropout)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.dropout1 = nn.Dropout(dropout)
        self.dropout2 = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        # 子层 1：多头自注意力 + 残差连接 + 层归一化
        attention_output = self.self_attention(x, x, x, mask)
        x = self.norm1(x + self.dropout1(attention_output))  # {1}

        # 子层 2：前馈网络 + 残差连接 + 层归一化
        ff_output = self.feed_forward(x)
        x = self.norm2(x + self.dropout2(ff_output))  # {2}

        return x


class TransformerEncoder(nn.Module):
    """完整的 Transformer 编码器"""

    def __init__(self, vocab_size, d_model=512, num_heads=8,
                 d_ff=2048, num_layers=6, max_seq_len=512, dropout=0.1):
        super().__init__()

        # 词嵌入 + 位置编码
        self.token_embedding = nn.Embedding(vocab_size, d_model)
        self.position_embedding = nn.Embedding(max_seq_len, d_model)
        self.dropout = nn.Dropout(dropout)

        # 堆叠多层编码器
        self.layers = nn.ModuleList([
            TransformerEncoderLayer(d_model, num_heads, d_ff, dropout)
            for _ in range(num_layers)
        ])

        self.norm = nn.LayerNorm(d_model)
        self.d_model = d_model

    def forward(self, input_ids, mask=None):
        seq_len = input_ids.size(1)
        positions = torch.arange(seq_len, device=input_ids.device).unsqueeze(0)

        # 词嵌入 + 位置嵌入
        x = self.token_embedding(input_ids) * math.sqrt(self.d_model)
        x = x + self.position_embedding(positions)
        x = self.dropout(x)

        # 逐层编码
        for layer in self.layers:
            x = layer(x, mask)

        return self.norm(x)


# 使用示例
vocab_size = 30000
encoder = TransformerEncoder(
    vocab_size=vocab_size,
    d_model=512,
    num_heads=8,
    d_ff=2048,
    num_layers=6
)

# 模拟输入：batch_size=2, seq_len=20
input_ids = torch.randint(0, vocab_size, (2, 20))
output = encoder(input_ids)

print(f"输入形状: {input_ids.shape}")
print(f"输出形状: {output.shape}")
print(f"模型参数量: {sum(p.numel() for p in encoder.parameters()):,}")
```
:::

## 四、Transformer 的变体

### 1. GPT 系列（解码器架构）

GPT（Generative Pre-trained Transformer）只使用 Transformer 的解码器部分，采用自回归（Autoregressive）的方式生成文本：每次预测下一个 token，将预测结果作为输入继续生成。

核心特点：
- **因果掩码**：每个位置只能看到它之前的位置，不能"偷看"后面的内容
- **预训练任务**：下一个 token 预测（Next Token Prediction）
- **适用场景**：文本生成、对话、代码补全

### 2. BERT（编码器架构）

BERT（Bidirectional Encoder Representations from Transformers）只使用 Transformer 的编码器部分，采用双向注意力，能同时利用上下文信息。

核心特点：
- **双向注意力**：每个位置可以看到序列中的所有其他位置
- **预训练任务**：掩码语言模型（MLM）+ 下一句预测（NSP）
- **适用场景**：文本分类、命名实体识别、问答系统

### 3. GPT vs BERT 对比

| 对比维度 | GPT | BERT |
|----------|-----|------|
| 架构 | 解码器（Decoder-only） | 编码器（Encoder-only） |
| 注意力方向 | 单向（从左到右） | 双向（全局） |
| 预训练任务 | 下一个 token 预测 | 掩码语言模型 |
| 核心能力 | 生成（Generation） | 理解（Understanding） |
| 典型应用 | 对话、写作、代码生成 | 分类、摘要、信息抽取 |
| 推理方式 | 自回归逐 token 生成 | 一次编码整个输入 |
| 代表模型 | GPT-4、ChatGPT、LLaMA | BERT、RoBERTa、DeBERTa |

::: warning 架构选择建议
- **需要生成文本**（聊天、写作、翻译）→ 选择 GPT 类解码器架构
- **需要理解文本**（分类、情感分析、实体识别）→ 选择 BERT 类编码器架构
- **需要序列到序列**（翻译、摘要）→ 选择 T5 等编码器-解码器架构
:::

::: details GPT 风格的因果语言模型实现
```python
# transformer_causal_lm.py
import torch
import torch.nn as nn
import math


class CausalSelfAttention(nn.Module):
    """带因果掩码的自注意力（GPT 风格）"""

    def __init__(self, d_model, num_heads, max_seq_len, dropout=0.1):
        super().__init__()
        self.d_k = d_model // num_heads
        self.num_heads = num_heads

        self.qkv_proj = nn.Linear(d_model, 3 * d_model)  # Q、K、V 合并投影
        self.out_proj = nn.Linear(d_model, d_model)
        self.dropout = nn.Dropout(dropout)

        # 预计算因果掩码（下三角矩阵）
        causal_mask = torch.tril(torch.ones(max_seq_len, max_seq_len))  # {1}
        self.register_buffer('causal_mask', causal_mask.unsqueeze(0).unsqueeze(0))

    def forward(self, x):
        batch_size, seq_len, _ = x.shape

        # 一次性计算 Q、K、V
        qkv = self.qkv_proj(x)
        q, k, v = qkv.chunk(3, dim=-1)

        # 拆分为多头
        q = q.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        k = k.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        v = v.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)

        # 计算注意力分数
        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.d_k)

        # 应用因果掩码：未来位置设为 -inf
        scores = scores.masked_fill(
            self.causal_mask[:, :, :seq_len, :seq_len] == 0,
            float('-inf')
        )  # {2}

        weights = self.dropout(torch.softmax(scores, dim=-1))
        context = torch.matmul(weights, v)

        # 合并多头
        context = context.transpose(1, 2).contiguous().view(batch_size, seq_len, -1)
        return self.out_proj(context)


class GPTBlock(nn.Module):
    """GPT 的单个 Transformer 块"""

    def __init__(self, d_model, num_heads, max_seq_len, dropout=0.1):
        super().__init__()
        self.attention = CausalSelfAttention(d_model, num_heads, max_seq_len, dropout)
        self.feed_forward = nn.Sequential(
            nn.Linear(d_model, 4 * d_model),
            nn.GELU(),
            nn.Linear(4 * d_model, d_model),
            nn.Dropout(dropout),
        )
        self.ln1 = nn.LayerNorm(d_model)
        self.ln2 = nn.LayerNorm(d_model)

    def forward(self, x):
        # Pre-Norm 风格（GPT-2 之后的标准做法）
        x = x + self.attention(self.ln1(x))   # {3}
        x = x + self.feed_forward(self.ln2(x))
        return x


class MiniGPT(nn.Module):
    """简化版 GPT 模型"""

    def __init__(self, vocab_size, d_model=256, num_heads=8,
                 num_layers=6, max_seq_len=256, dropout=0.1):
        super().__init__()
        self.token_embedding = nn.Embedding(vocab_size, d_model)
        self.position_embedding = nn.Embedding(max_seq_len, d_model)
        self.dropout = nn.Dropout(dropout)

        self.blocks = nn.ModuleList([
            GPTBlock(d_model, num_heads, max_seq_len, dropout)
            for _ in range(num_layers)
        ])

        self.ln_final = nn.LayerNorm(d_model)
        self.lm_head = nn.Linear(d_model, vocab_size, bias=False)

        # 权重共享：输出层和词嵌入层共享权重
        self.lm_head.weight = self.token_embedding.weight

    def forward(self, input_ids):
        batch_size, seq_len = input_ids.shape
        positions = torch.arange(seq_len, device=input_ids.device).unsqueeze(0)

        # 词嵌入 + 位置嵌入
        x = self.token_embedding(input_ids) + self.position_embedding(positions)
        x = self.dropout(x)

        # 逐层处理
        for block in self.blocks:
            x = block(x)

        x = self.ln_final(x)

        # 输出 logits（每个位置预测下一个 token 的概率分布）
        logits = self.lm_head(x)
        return logits

    @torch.no_grad()
    def generate(self, input_ids, max_new_tokens=50, temperature=1.0):
        """自回归生成文本"""
        for _ in range(max_new_tokens):
            # 截断到最大序列长度
            context = input_ids[:, -256:]

            # 前向传播
            logits = self(context)

            # 取最后一个位置的预测
            next_token_logits = logits[:, -1, :] / temperature

            # 采样下一个 token
            probs = torch.softmax(next_token_logits, dim=-1)
            next_token = torch.multinomial(probs, num_samples=1)

            # 拼接到输入序列
            input_ids = torch.cat([input_ids, next_token], dim=1)

        return input_ids


# 使用示例
vocab_size = 10000
model = MiniGPT(
    vocab_size=vocab_size,
    d_model=256,
    num_heads=8,
    num_layers=6,
    max_seq_len=256
)

print(f"模型参数量: {sum(p.numel() for p in model.parameters()):,}")

# 模拟输入
input_ids = torch.randint(0, vocab_size, (1, 10))
logits = model(input_ids)
print(f"输入形状: {input_ids.shape}")
print(f"输出 logits 形状: {logits.shape}")  # (1, 10, vocab_size)
```
:::

## 五、Transformer 的关键设计细节

### 1. 参数规模对比

| 模型 | 参数量 | 层数 | 隐藏维度 | 注意力头数 |
|------|--------|------|----------|------------|
| BERT-Base | 110M | 12 | 768 | 12 |
| BERT-Large | 340M | 24 | 1024 | 16 |
| GPT-2 | 1.5B | 48 | 1600 | 25 |
| GPT-3 | 175B | 96 | 12288 | 96 |
| LLaMA-7B | 7B | 32 | 4096 | 32 |
| LLaMA-70B | 70B | 80 | 8192 | 64 |

### 2. 注意力复杂度

标准自注意力的计算复杂度为 O(n^2 * d)，其中 n 是序列长度，d 是维度。这意味着序列长度翻倍，计算量会翻四倍。这是 Transformer 处理超长序列的主要瓶颈。

针对这个问题，业界提出了多种高效注意力变体：

| 方法 | 复杂度 | 核心思路 |
|------|--------|----------|
| 标准注意力 | O(n^2) | 全量计算 |
| Flash Attention | O(n^2) 但更快 | 优化内存访问模式 |
| 稀疏注意力 | O(n * sqrt(n)) | 只计算部分位置的注意力 |
| 线性注意力 | O(n) | 用核方法近似 Softmax |

### 3. 现代改进

原始 Transformer 之后的重要改进：

| 改进 | 描述 | 采用模型 |
|------|------|----------|
| Pre-Norm | LayerNorm 放在子层之前而非之后 | GPT-2、LLaMA |
| RoPE | 旋转位置编码，支持长度外推 | LLaMA、Qwen |
| GQA | 分组查询注意力，减少 KV Cache | LLaMA 2 |
| SwiGLU | 更高效的激活函数 | LLaMA、PaLM |
| RMSNorm | 简化的层归一化，去掉均值中心化 | LLaMA |

::: tip 学习 Transformer 的建议
理解 Transformer 最好的方式是动手实现一个简化版本。你不需要一开始就理解所有细节，先把握住"Q/K/V 计算 → Softmax 加权 → 多头拼接"这条主线，再逐步深入位置编码、掩码、残差连接等细节。
:::

## 六、总结

本文从注意力机制出发，详细介绍了 Transformer 架构的核心组件和设计思想。关键要点回顾：

- **自注意力机制**通过 Q、K、V 的点积计算实现了任意位置之间的直接关联，解决了 RNN 的长距离依赖和并行化问题
- **多头注意力**让模型能从不同角度同时关注信息，增强了表示能力
- **位置编码**为无序的注意力机制注入了序列位置信息
- **编码器-解码器结构**通过残差连接、层归一化和前馈网络的组合，构建了强大的特征提取能力
- **GPT 和 BERT**分别代表了生成和理解两个方向，选择哪种架构取决于你的具体任务

Transformer 是理解现代 AI 技术的关键。掌握了它的原理后，你就能更深入地理解大语言模型的工作机制，为后续学习 Prompt Engineering、模型微调（Fine-tuning）和 RAG 等高级主题打下坚实基础。
