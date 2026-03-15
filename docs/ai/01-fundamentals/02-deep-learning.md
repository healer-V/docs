---
title: "深度学习基础"
category: "AI · 基础"
tags:
  - 深度学习
  - PyTorch
  - 神经网络
excerpt: "深度学习通过多层神经网络自动提取数据特征，是计算机视觉、自然语言处理等领域取得突破性进展的关键技术。"
date: 2026-03-15
---

# 深度学习基础

深度学习（Deep Learning）是机器学习的一个子领域，其核心是使用多层神经网络自动从原始数据中提取层次化的特征表示。相比传统机器学习需要手动设计特征，深度学习能端到端地完成从输入到输出的映射，在图像识别、语音处理、自然语言理解等领域取得了突破性进展。

## 一、神经网络基础

### 1. 感知机（Perceptron）

感知机是神经网络的最基本单元，模拟了生物神经元的工作方式：接收多个输入信号，加权求和后经过激活函数输出结果。

```
输入 x₁ ──→ w₁ ──┐
输入 x₂ ──→ w₂ ──┼──→ Σ(wᵢxᵢ + b) ──→ 激活函数 f ──→ 输出 y
输入 x₃ ──→ w₃ ──┘
```

数学表达：`y = f(w₁x₁ + w₂x₂ + w₃x₃ + b)`

单个感知机只能处理线性可分问题。将多个感知机按层排列、层层连接，就构成了多层感知机（MLP），也就是最基本的深度神经网络。

### 2. 网络结构

一个标准的前馈神经网络包含三类层：

| 层类型 | 位置 | 作用 |
|--------|------|------|
| 输入层（Input Layer） | 第一层 | 接收原始数据，节点数等于特征维度 |
| 隐藏层（Hidden Layer） | 中间层（1 到多层） | 提取和变换特征，层数越多特征越抽象 |
| 输出层（Output Layer） | 最后一层 | 输出预测结果，节点数取决于任务 |

::: tip 什么是"深度"
"深度"指的是网络的层数。当隐藏层数量超过 2 层时，通常称为深度神经网络（DNN）。更深的网络能学到更高层次的抽象特征，但也更难训练。
:::

### 3. 激活函数

激活函数为神经网络引入非线性，使网络能够拟合复杂的映射关系。如果没有激活函数，无论多少层的网络都等价于一个线性变换。

| 激活函数 | 公式 | 输出范围 | 优缺点 |
|----------|------|----------|--------|
| Sigmoid | 1 / (1 + e⁻ˣ) | (0, 1) | 输出可做概率解释；存在梯度消失问题 |
| Tanh | (eˣ - e⁻ˣ) / (eˣ + e⁻ˣ) | (-1, 1) | 零中心化；仍有梯度消失 |
| ReLU | max(0, x) | [0, +∞) | 计算高效，缓解梯度消失；可能出现"神经元死亡" |
| LeakyReLU | max(0.01x, x) | (-∞, +∞) | 解决 ReLU 的神经元死亡问题 |
| GELU | x * Φ(x) | (-∞, +∞) | Transformer 中常用，平滑版 ReLU |

::: warning 激活函数选择建议
- **隐藏层**：优先使用 ReLU 或其变体（LeakyReLU、GELU），训练效率高
- **输出层 - 二分类**：使用 Sigmoid，输出值解释为概率
- **输出层 - 多分类**：使用 Softmax，输出各类别的概率分布
- **输出层 - 回归**：不使用激活函数（线性输出）
:::

::: details 激活函数可视化
```python
# dl_activation_functions.py
import torch
import matplotlib.pyplot as plt
import numpy as np

x = torch.linspace(-5, 5, 200)

# 定义激活函数
activations = {
    'Sigmoid': torch.sigmoid(x),
    'Tanh': torch.tanh(x),
    'ReLU': torch.relu(x),
    'LeakyReLU': torch.nn.functional.leaky_relu(x, negative_slope=0.1),
    'GELU': torch.nn.functional.gelu(x),
}

fig, axes = plt.subplots(1, 5, figsize=(20, 4))

for idx, (name, y) in enumerate(activations.items()):
    axes[idx].plot(x.numpy(), y.numpy(), linewidth=2)
    axes[idx].set_title(name, fontsize=14)
    axes[idx].axhline(y=0, color='gray', linestyle='--', linewidth=0.5)
    axes[idx].axvline(x=0, color='gray', linestyle='--', linewidth=0.5)
    axes[idx].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('activation_functions.png', dpi=150)
plt.show()
```
:::

## 二、反向传播与梯度下降

### 1. 前向传播

前向传播是数据从输入层流向输出层的过程。每一层对输入做线性变换加激活函数：

```
第 l 层输出: aˡ = f(Wˡ · aˡ⁻¹ + bˡ)
```

最终输出层产生预测值 `ŷ`，然后用损失函数衡量 `ŷ` 与真实标签 `y` 之间的差距。

### 2. 损失函数

损失函数量化了模型预测与真实值之间的差距，是优化的目标。

| 损失函数 | 公式简述 | 适用任务 |
|----------|----------|----------|
| MSE（均方误差） | Σ(y - ŷ)² / n | 回归 |
| CrossEntropy（交叉熵） | -Σ y·log(ŷ) | 分类 |
| BCE（二元交叉熵） | -[y·log(ŷ) + (1-y)·log(1-ŷ)] | 二分类 |

### 3. 反向传播（Backpropagation）

反向传播是训练神经网络的核心算法。它利用链式法则（Chain Rule），从输出层到输入层逐层计算损失函数对每个参数的梯度，然后用梯度更新参数。

核心步骤：
1. **前向传播**：计算每一层的输出
2. **计算损失**：用损失函数衡量预测误差
3. **反向传播**：从输出层开始，逐层计算梯度 ∂L/∂W
4. **参数更新**：使用优化器根据梯度更新权重

### 4. 优化器

优化器决定了如何利用梯度来更新模型参数。

| 优化器 | 特点 | 适用场景 |
|--------|------|----------|
| SGD | 最基础，每次用小批量数据更新 | 需要精细调参时 |
| SGD + Momentum | 引入动量，加速收敛并减少震荡 | 大多数 CNN 训练 |
| Adam | 自适应学习率，结合 Momentum 和 RMSProp | 通用首选，尤其适合 NLP |
| AdamW | Adam + 权重衰减（解耦正则化） | Transformer 模型训练 |

::: tip Adam 是默认的好选择
如果你不确定使用哪个优化器，Adam 是一个稳健的起点。它自适应调整每个参数的学习率，对学习率的初始值不太敏感。常用的初始学习率为 `1e-3` 到 `3e-4`。
:::

::: details 完整训练循环：手写数字分类
```python
# dl_mnist_training.py
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

# 1. 数据准备
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.1307,), (0.3081,))  # MNIST 数据集的均值和标准差
])

train_dataset = datasets.MNIST('./data', train=True, download=True, transform=transform)
test_dataset = datasets.MNIST('./data', train=False, transform=transform)

train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=1000, shuffle=False)


# 2. 定义模型
class DigitClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()
        self.network = nn.Sequential(
            nn.Linear(28 * 28, 256),   # 输入层 → 隐藏层1
            nn.ReLU(),
            nn.Dropout(0.2),            # 防止过拟合
            nn.Linear(256, 128),        # 隐藏层1 → 隐藏层2
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 10)          # 隐藏层2 → 输出层（10 个数字类别）
        )

    def forward(self, x):
        x = self.flatten(x)
        logits = self.network(x)
        return logits


# 3. 初始化模型、损失函数、优化器
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = DigitClassifier().to(device)
criterion = nn.CrossEntropyLoss()          # 多分类交叉熵损失 # {1}
optimizer = optim.Adam(model.parameters(), lr=1e-3)  # Adam 优化器 # {2}


# 4. 训练循环
def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss = 0
    correct = 0
    total = 0

    for batch_images, batch_labels in loader:
        batch_images = batch_images.to(device)
        batch_labels = batch_labels.to(device)

        # 前向传播
        predictions = model(batch_images)
        loss = criterion(predictions, batch_labels)

        # 反向传播
        optimizer.zero_grad()   # 清除上一步的梯度
        loss.backward()         # 计算梯度
        optimizer.step()        # 更新参数

        total_loss += loss.item() * batch_images.size(0)
        correct += (predictions.argmax(dim=1) == batch_labels).sum().item()
        total += batch_images.size(0)

    return total_loss / total, correct / total


# 5. 评估函数
@torch.no_grad()
def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss = 0
    correct = 0
    total = 0

    for batch_images, batch_labels in loader:
        batch_images = batch_images.to(device)
        batch_labels = batch_labels.to(device)

        predictions = model(batch_images)
        loss = criterion(predictions, batch_labels)

        total_loss += loss.item() * batch_images.size(0)
        correct += (predictions.argmax(dim=1) == batch_labels).sum().item()
        total += batch_images.size(0)

    return total_loss / total, correct / total


# 6. 执行训练
num_epochs = 10

for epoch in range(num_epochs):
    train_loss, train_acc = train_one_epoch(
        model, train_loader, criterion, optimizer, device
    )
    test_loss, test_acc = evaluate(model, test_loader, criterion, device)

    print(
        f"Epoch {epoch+1:2d}/{num_epochs} | "
        f"训练损失: {train_loss:.4f} | 训练准确率: {train_acc:.4f} | "
        f"测试损失: {test_loss:.4f} | 测试准确率: {test_acc:.4f}"
    )
```
:::

## 三、卷积神经网络（CNN）

### 1. 核心思想

CNN 专门为处理具有网格结构的数据（如图像）而设计。它通过卷积操作提取局部特征，通过池化操作降低空间维度，最终通过全连接层输出分类结果。

CNN 的三大核心操作：

| 操作 | 作用 | 类比 |
|------|------|------|
| 卷积（Convolution） | 用滤波器扫描输入，提取局部特征 | 用放大镜逐区域检查图片 |
| 池化（Pooling） | 降低特征图的空间尺寸，减少参数 | 缩小图片但保留关键信息 |
| 全连接（Fully Connected） | 将提取的特征映射到输出类别 | 综合所有信息做出判断 |

### 2. 卷积层详解

卷积层的关键参数：

| 参数 | 说明 | 常见取值 |
|------|------|----------|
| `in_channels` | 输入通道数 | 灰度图=1，RGB图=3 |
| `out_channels` | 输出通道数（滤波器个数） | 32, 64, 128 |
| `kernel_size` | 卷积核大小 | 3x3（最常用）, 5x5 |
| `stride` | 步长 | 1（默认）, 2 |
| `padding` | 填充 | 1（保持尺寸不变时） |

输出尺寸计算公式：

```
输出大小 = (输入大小 - 卷积核大小 + 2 × padding) / stride + 1
```

### 3. 经典 CNN 架构演进

| 架构 | 年份 | 层数 | 关键创新 |
|------|------|------|----------|
| LeNet-5 | 1998 | 5 | 首个实用 CNN，手写数字识别 |
| AlexNet | 2012 | 8 | 使用 ReLU 和 Dropout，开启深度学习时代 |
| VGGNet | 2014 | 16/19 | 全部使用 3x3 小卷积核 |
| ResNet | 2015 | 50/101/152 | 残差连接，解决深层网络退化问题 |
| EfficientNet | 2019 | 可变 | 复合缩放策略，平衡宽度/深度/分辨率 |

::: details CNN 实战：CIFAR-10 图像分类
```python
# dl_cnn_cifar10.py
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader


# 数据预处理：包含数据增强
train_transform = transforms.Compose([
    transforms.RandomHorizontalFlip(),        # 随机水平翻转
    transforms.RandomCrop(32, padding=4),     # 随机裁剪
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.4914, 0.4822, 0.4465],
        std=[0.2470, 0.2435, 0.2616]
    )
])

test_transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.4914, 0.4822, 0.4465],
        std=[0.2470, 0.2435, 0.2616]
    )
])


# 定义 CNN 模型（带残差连接）
class ImageClassifier(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()

        # 特征提取部分
        self.features = nn.Sequential(
            # Block 1: 3 → 32 通道
            nn.Conv2d(3, 32, kernel_size=3, padding=1),  # {1}
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),       # 32x32 → 16x16
            nn.Dropout2d(0.25),

            # Block 2: 32 → 64 通道
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),       # 16x16 → 8x8
            nn.Dropout2d(0.25),

            # Block 3: 64 → 128 通道
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d(1),  # 全局平均池化 → 1x1 # {2}
        )

        # 分类部分
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128, 64),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(64, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x


# 训练配置
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = ImageClassifier(num_classes=10).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)

# 学习率调度器：余弦退火
scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=50)

print(f"模型参数量: {sum(p.numel() for p in model.parameters()):,}")
print(f"训练设备: {device}")
```
:::

## 四、循环神经网络（RNN）

### 1. RNN 基本结构

RNN 专门处理序列数据（如文本、时间序列、语音）。它在每个时间步接收当前输入和上一步的隐藏状态，产生新的隐藏状态和输出。

```
     h₀ ──→ [RNN Cell] ──→ h₁ ──→ [RNN Cell] ──→ h₂ ──→ [RNN Cell] ──→ h₃
              ↑                      ↑                      ↑
              x₁                     x₂                     x₃
```

核心公式：`hₜ = tanh(Wₕₕ · hₜ₋₁ + Wₓₕ · xₜ + b)`

### 2. 梯度消失问题

标准 RNN 在处理长序列时存在严重的梯度消失（或爆炸）问题：当序列很长时，反向传播中梯度会指数级衰减，导致模型无法学到长距离的依赖关系。

### 3. LSTM（长短期记忆网络）

LSTM 通过引入门控机制（Gate Mechanism）解决了梯度消失问题。它包含三个门和一个细胞状态：

| 门 | 作用 | 类比 |
|----|------|------|
| 遗忘门（Forget Gate） | 决定丢弃哪些旧信息 | 清理不再需要的记忆 |
| 输入门（Input Gate） | 决定存储哪些新信息 | 选择性记忆新知识 |
| 输出门（Output Gate） | 决定输出哪些信息 | 按需取用记忆内容 |
| 细胞状态（Cell State） | 长期记忆通道 | 一条贯穿全程的信息高速路 |

::: details LSTM 实战：股票价格趋势预测
```python
# dl_lstm_stock.py
import torch
import torch.nn as nn
import numpy as np
from torch.utils.data import Dataset, DataLoader


# 自定义时间序列数据集
class StockDataset(Dataset):
    """将时间序列数据转换为有监督学习格式"""

    def __init__(self, prices, sequence_length=30):
        self.sequence_length = sequence_length
        self.prices = torch.FloatTensor(prices)

        # 归一化到 [0, 1]
        self.min_price = self.prices.min()
        self.max_price = self.prices.max()
        self.normalized = (self.prices - self.min_price) / (self.max_price - self.min_price)

    def __len__(self):
        return len(self.prices) - self.sequence_length

    def __getitem__(self, idx):
        # 输入：前 sequence_length 天的价格
        x = self.normalized[idx:idx + self.sequence_length].unsqueeze(-1)
        # 目标：第 sequence_length + 1 天的价格
        y = self.normalized[idx + self.sequence_length]
        return x, y

    def inverse_normalize(self, value):
        return value * (self.max_price - self.min_price) + self.min_price


# LSTM 预测模型
class StockPredictor(nn.Module):
    def __init__(self, input_size=1, hidden_size=64, num_layers=2, dropout=0.2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,          # 输入形状: (batch, seq_len, features)
            dropout=dropout if num_layers > 1 else 0
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        # lstm_out: (batch, seq_len, hidden_size)
        lstm_out, (hidden, cell) = self.lstm(x) # {1}
        # 取最后一个时间步的输出
        last_output = lstm_out[:, -1, :]         # {2}
        prediction = self.fc(last_output)
        return prediction.squeeze(-1)


# 生成模拟股票数据（正弦波 + 趋势 + 噪声）
np.random.seed(42)
days = 500
trend = np.linspace(100, 150, days)
seasonal = 10 * np.sin(np.linspace(0, 8 * np.pi, days))
noise = np.random.normal(0, 2, days)
stock_prices = trend + seasonal + noise

# 准备数据
sequence_length = 30
dataset = StockDataset(stock_prices, sequence_length=sequence_length)

train_size = int(len(dataset) * 0.8)
test_size = len(dataset) - train_size
train_dataset, test_dataset = torch.utils.data.random_split(
    dataset, [train_size, test_size]
)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

# 训练配置
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = StockPredictor(input_size=1, hidden_size=64, num_layers=2).to(device)
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

# 训练
for epoch in range(50):
    model.train()
    epoch_loss = 0
    for batch_x, batch_y in train_loader:
        batch_x, batch_y = batch_x.to(device), batch_y.to(device)

        prediction = model(batch_x)
        loss = criterion(prediction, batch_y)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        epoch_loss += loss.item()

    if (epoch + 1) % 10 == 0:
        avg_loss = epoch_loss / len(train_loader)
        print(f"Epoch {epoch+1:3d} | 平均损失: {avg_loss:.6f}")
```
:::

## 五、关键训练技巧

### 1. 批归一化（Batch Normalization）

BatchNorm 对每一层的输入做归一化处理，使其分布稳定在均值为 0、方差为 1 附近。

好处：
- 加速训练收敛
- 允许使用更大的学习率
- 有轻微的正则化效果

### 2. Dropout

Dropout 在训练时随机关闭一部分神经元（设置输出为 0），迫使网络学习更鲁棒的特征。

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| 隐藏层 Dropout | 0.2 - 0.5 | 全连接层常用 0.5，卷积层常用 0.2 |
| 输入层 Dropout | 0.1 - 0.2 | 对输入做轻微扰动 |

::: warning 测试时关闭 Dropout
Dropout 只在训练阶段生效。在评估和推理时，必须调用 `model.eval()` 关闭 Dropout，否则预测结果会不稳定。
:::

### 3. 学习率调度

固定学习率往往不是最优选择。常见的学习率调度策略：

| 策略 | 行为 | 适用场景 |
|------|------|----------|
| StepLR | 每隔固定步数乘以衰减系数 | 简单任务 |
| CosineAnnealingLR | 按余弦曲线从大到小变化 | 通用场景 |
| OneCycleLR | 先升后降的超级收敛策略 | 追求快速收敛 |
| ReduceLROnPlateau | 验证指标停滞时降低学习率 | 不确定训练轮数时 |

### 4. 数据增强

数据增强通过对训练数据施加随机变换（如翻转、旋转、裁剪、颜色抖动），在不增加真实数据的情况下扩大训练集的多样性，有效减少过拟合。

::: details 常用数据增强组合
```python
# dl_data_augmentation.py
from torchvision import transforms

# 训练集数据增强
train_augmentation = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),  # 随机裁剪并缩放
    transforms.RandomHorizontalFlip(p=0.5),               # 50% 概率水平翻转
    transforms.RandomRotation(degrees=15),                 # 随机旋转 ±15°
    transforms.ColorJitter(
        brightness=0.2,   # 亮度
        contrast=0.2,     # 对比度
        saturation=0.2,   # 饱和度
        hue=0.1           # 色调
    ),
    transforms.RandomGrayscale(p=0.1),                    # 10% 概率灰度化
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
    transforms.RandomErasing(p=0.1),                      # 随机擦除
])

# 测试集不做增强，只做标准化
test_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])
```
:::

## 六、GPU 加速与模型保存

### 1. GPU 使用

PyTorch 通过 `.to(device)` 方法将张量和模型转移到 GPU 上加速计算。

::: details GPU 训练最佳实践
```python
# dl_gpu_utils.py
import torch

# 自动选择可用设备
def get_device():
    if torch.cuda.is_available():
        device = torch.device('cuda')
        print(f"使用 GPU: {torch.cuda.get_device_name(0)}")
        print(f"显存: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB")
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        device = torch.device('mps')  # Apple Silicon GPU
        print("使用 Apple MPS 加速")
    else:
        device = torch.device('cpu')
        print("使用 CPU")
    return device


device = get_device()

# 模型保存（只保存参数，不保存完整模型）
def save_checkpoint(model, optimizer, epoch, loss, filepath):
    checkpoint = {
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': loss,
    }
    torch.save(checkpoint, filepath)
    print(f"模型检查点已保存到: {filepath}")


# 模型加载
def load_checkpoint(model, optimizer, filepath, device):
    checkpoint = torch.load(filepath, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
    epoch = checkpoint['epoch']
    loss = checkpoint['loss']
    print(f"已加载检查点: epoch={epoch}, loss={loss:.4f}")
    return epoch, loss
```
:::

## 七、总结与下一步

本文介绍了深度学习的核心概念和常用技术。关键要点回顾：

- 神经网络通过多层非线性变换自动提取特征，激活函数是引入非线性的关键
- 反向传播 + 梯度下降是训练神经网络的核心机制，Adam 是默认的优化器选择
- CNN 擅长处理图像等网格数据，通过卷积提取局部特征
- RNN/LSTM 擅长处理序列数据，LSTM 的门控机制解决了长距离依赖问题
- BatchNorm、Dropout、数据增强、学习率调度是提升模型性能的重要技巧

掌握了深度学习的基础后，你可以继续学习 [Transformer 架构](./03-transformer.md)，了解当前大语言模型背后的核心技术。
