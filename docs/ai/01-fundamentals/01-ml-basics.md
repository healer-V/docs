---
title: "机器学习基础"
category: "AI · 基础"
tags:
  - 机器学习
  - Python
  - Scikit-learn
excerpt: "机器学习是人工智能的核心分支，通过数据驱动的方式让计算机自动学习规律并做出预测，是理解现代 AI 技术的基石。"
date: 2026-03-15
---

# 机器学习基础

机器学习（Machine Learning，简称 ML）是人工智能最核心的分支之一。与传统编程通过显式规则解决问题不同，机器学习让计算机从数据中自动发现规律，并基于这些规律对新数据做出预测或决策。本文将带你从零开始理解机器学习的核心概念、常见算法和实战技巧。

## 一、什么是机器学习

### 1. 核心定义

机器学习的本质是：给定一组数据，让算法自动找到数据中的模式（Pattern），并用这个模式对未知数据进行预测。

用一个公式来概括：

```
输入数据 (X) → 学习算法 → 模型 (f) → 预测结果 (Y)
```

与传统编程的对比：

| 对比维度 | 传统编程 | 机器学习 |
|----------|----------|----------|
| 输入 | 数据 + 规则 | 数据 + 期望输出 |
| 输出 | 结果 | 规则（模型） |
| 核心逻辑 | 人工定义规则 | 算法自动学习规则 |
| 适用场景 | 规则明确的任务 | 规则难以显式定义的任务 |
| 典型案例 | 计算器、排序算法 | 图像识别、推荐系统 |

### 2. 机器学习的工作流程

一个完整的机器学习项目通常包含以下步骤：

1. **数据收集**：从数据库、API、文件等来源获取原始数据
2. **数据预处理**：清洗缺失值、处理异常值、特征编码、归一化
3. **特征工程**：选择、构造对预测最有价值的特征
4. **模型选择**：根据任务类型选择合适的算法
5. **模型训练**：用训练数据拟合模型参数
6. **模型评估**：用测试数据验证模型效果
7. **模型调优**：调整超参数、优化特征，提升性能
8. **部署上线**：将模型集成到生产环境

## 二、机器学习的三大类型

### 1. 监督学习（Supervised Learning）

监督学习是最常见的机器学习类型。训练数据包含输入特征（X）和对应的标签（Y），模型的目标是学习从 X 到 Y 的映射关系。

监督学习又分为两大任务：

| 任务类型 | 输出 | 典型场景 | 常见算法 |
|----------|------|----------|----------|
| 分类（Classification） | 离散类别 | 垃圾邮件检测、图像分类 | 逻辑回归、SVM、决策树 |
| 回归（Regression） | 连续数值 | 房价预测、销量预估 | 线性回归、Ridge、Lasso |

::: tip 如何区分分类和回归
看预测目标即可：如果预测的是类别（如"是/否"、"猫/狗"），就是分类；如果预测的是数值（如"价格"、"温度"），就是回归。
:::

### 2. 无监督学习（Unsupervised Learning）

无监督学习的训练数据只有输入特征（X），没有标签（Y）。模型的目标是发现数据中的隐藏结构。

常见任务包括：

- **聚类（Clustering）**：将相似的数据自动分组，如客户分群、新闻话题聚类
- **降维（Dimensionality Reduction）**：压缩数据维度，保留核心信息，如 PCA 主成分分析
- **异常检测（Anomaly Detection）**：识别偏离正常模式的数据点，如信用卡欺诈检测

### 3. 强化学习（Reinforcement Learning）

强化学习通过智能体（Agent）与环境的交互来学习最优策略。智能体根据当前状态选择动作，环境返回奖励信号，智能体的目标是最大化累积奖励。

```
智能体 → 选择动作 → 环境反馈奖励 → 更新策略 → 循环
```

典型应用场景：游戏 AI（如 AlphaGo）、机器人控制、自动驾驶决策。

## 三、常见机器学习算法

### 1. 线性回归（Linear Regression）

线性回归是最基础的回归算法，假设输入特征与输出之间存在线性关系。

核心公式：

```
y = w₁x₁ + w₂x₂ + ... + wₙxₙ + b
```

其中 `w` 是权重，`b` 是偏置项，模型通过最小化均方误差（MSE）来学习最优参数。

::: details 线性回归实战：房价预测
```python
# ml_linear_regression.py
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# 模拟房价数据：面积(平方米)、房间数、楼层
np.random.seed(42)
num_samples = 200

area = np.random.uniform(60, 200, num_samples)        # 面积
rooms = np.random.randint(1, 6, num_samples)           # 房间数
floor = np.random.randint(1, 30, num_samples)          # 楼层

# 真实房价 = 面积 * 0.8 + 房间数 * 15 + 楼层 * 0.5 + 噪声
price = area * 0.8 + rooms * 15 + floor * 0.5 + np.random.normal(0, 5, num_samples)

# 构造特征矩阵
features = np.column_stack([area, rooms, floor])

# 划分训练集和测试集（80% 训练，20% 测试）
X_train, X_test, y_train, y_test = train_test_split(
    features, price, test_size=0.2, random_state=42
)

# 创建并训练线性回归模型
model = LinearRegression()
model.fit(X_train, y_train)  # {1}

# 查看模型参数
print(f"权重系数: {model.coef_}")    # 接近 [0.8, 15, 0.5]
print(f"偏置项: {model.intercept_:.2f}")

# 在测试集上预测
y_pred = model.predict(X_test)

# 评估模型
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f"均方误差 (MSE): {mse:.2f}")
print(f"R² 分数: {r2:.4f}")  # 越接近 1 表示模型越好
```
:::

### 2. 决策树（Decision Tree）

决策树通过一系列 if-else 条件将数据逐步拆分，形成树状结构。每个内部节点代表一个特征判断，叶节点代表最终的预测结果。

决策树的优缺点：

| 优点 | 缺点 |
|------|------|
| 直观易理解，可解释性强 | 容易过拟合 |
| 不需要特征归一化 | 对数据微小变化敏感 |
| 支持分类和回归 | 单棵树的泛化能力有限 |
| 能处理数值和类别特征 | 贪心算法，非全局最优 |

::: details 决策树实战：鸢尾花分类
```python
# ml_decision_tree.py
from sklearn.datasets import load_iris
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# 加载鸢尾花数据集
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.3, random_state=42
)

# 创建决策树分类器（限制最大深度防止过拟合）
classifier = DecisionTreeClassifier(
    max_depth=3,          # 最大树深度
    min_samples_split=5,  # 分裂所需最小样本数
    random_state=42
)
classifier.fit(X_train, y_train) # {1}

# 输出树结构
tree_rules = export_text(classifier, feature_names=iris.feature_names)
print("决策树规则：")
print(tree_rules)

# 测试集评估
y_pred = classifier.predict(X_test)
print(classification_report(
    y_test, y_pred,
    target_names=iris.target_names
))
```
:::

### 3. 支持向量机（SVM）

SVM 的核心思想是找到一个超平面，将不同类别的数据尽可能分开，同时最大化分类间隔（Margin）。通过核函数（Kernel），SVM 还能处理非线性可分的数据。

常用核函数：

| 核函数 | 适用场景 | 特点 |
|--------|----------|------|
| `linear` | 线性可分数据 | 计算快，适合高维稀疏数据 |
| `rbf`（默认） | 非线性数据 | 最常用，需调节 gamma 参数 |
| `poly` | 多项式关系数据 | 需调节 degree 和 coef0 |

::: details SVM 实战：手写数字识别
```python
# ml_svm_digits.py
from sklearn.datasets import load_digits
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score

# 加载手写数字数据集（8x8 像素图片）
digits = load_digits()
X_train, X_test, y_train, y_test = train_test_split(
    digits.data, digits.target, test_size=0.2, random_state=42
)

# 特征标准化（SVM 对特征尺度敏感）
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)  # {1}
X_test_scaled = scaler.transform(X_test)         # {2}

# 使用网格搜索找到最优超参数
param_grid = {
    'C': [0.1, 1, 10],
    'gamma': ['scale', 0.01, 0.001],
    'kernel': ['rbf']
}
grid_search = GridSearchCV(SVC(), param_grid, cv=5, scoring='accuracy')
grid_search.fit(X_train_scaled, y_train)

print(f"最优参数: {grid_search.best_params_}")
print(f"交叉验证准确率: {grid_search.best_score_:.4f}")

# 测试集评估
best_model = grid_search.best_estimator_
y_pred = best_model.predict(X_test_scaled)
print(f"测试集准确率: {accuracy_score(y_test, y_pred):.4f}")
```
:::

### 4. K 近邻算法（KNN）

KNN 是一种基于实例的学习算法，不需要显式训练过程。预测时，它找到距离待预测样本最近的 K 个邻居，通过投票（分类）或取均值（回归）得出结果。

::: warning KNN 的注意事项
- **K 值选择**：K 太小容易过拟合（对噪声敏感），K 太大容易欠拟合（决策边界过于平滑）。通常通过交叉验证选取最优 K 值。
- **特征归一化**：KNN 基于距离计算，必须对特征做归一化处理，否则量纲大的特征会主导距离计算。
- **计算成本**：预测时需要计算与所有训练样本的距离，数据量大时速度较慢。
:::

::: details KNN 实战：用户信用评级
```python
# ml_knn_credit.py
import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# 模拟用户信用数据
np.random.seed(42)
num_users = 500

annual_income = np.random.uniform(30000, 200000, num_users)  # 年收入
debt_ratio = np.random.uniform(0.0, 0.8, num_users)         # 负债率
credit_history = np.random.randint(1, 20, num_users)         # 信用年限

# 信用等级：0=低, 1=中, 2=高
credit_score = (
    (annual_income > 80000).astype(int) +
    (debt_ratio < 0.4).astype(int) +
    (credit_history > 5).astype(int)
)
credit_level = np.clip(credit_score - 1, 0, 2)

features = np.column_stack([annual_income, debt_ratio, credit_history])

# 使用 Pipeline 将标准化和 KNN 组合
pipeline = Pipeline([
    ('scaler', StandardScaler()),           # 第一步：特征标准化
    ('knn', KNeighborsClassifier(n_neighbors=7))  # 第二步：KNN 分类
])

# 5 折交叉验证评估不同 K 值
for k in [3, 5, 7, 9, 11]:
    pipeline.set_params(knn__n_neighbors=k)
    scores = cross_val_score(pipeline, features, credit_level, cv=5)
    print(f"K={k:2d} | 准确率: {scores.mean():.4f} ± {scores.std():.4f}")
```
:::

## 四、模型评估指标

选择正确的评估指标对于判断模型质量至关重要。不同任务类型需要使用不同的指标。

### 1. 分类任务指标

以二分类问题为例，首先需要理解混淆矩阵（Confusion Matrix）：

| | 预测为正 | 预测为负 |
|------|----------|----------|
| **实际为正** | TP（真正例） | FN（假负例） |
| **实际为负** | FP（假正例） | TN（真负例） |

基于混淆矩阵，常用指标如下：

| 指标 | 计算公式 | 含义 | 关注场景 |
|------|----------|------|----------|
| 准确率（Accuracy） | (TP+TN) / 总数 | 整体正确率 | 类别均衡时 |
| 精确率（Precision） | TP / (TP+FP) | 预测为正中真正为正的比例 | 关注误报代价时（如垃圾邮件） |
| 召回率（Recall） | TP / (TP+FN) | 实际为正中被正确预测的比例 | 关注漏报代价时（如疾病检测） |
| F1 值 | 2 * P * R / (P+R) | 精确率和召回率的调和平均 | 需要平衡精确率和召回率时 |

::: tip 精确率 vs 召回率的取舍
在实际项目中，精确率和召回率往往此消彼长。你需要根据业务场景决定侧重点：
- **垃圾邮件检测**：更看重精确率，宁可放过一些垃圾邮件，也不要误判正常邮件
- **疾病筛查**：更看重召回率，宁可多做检查，也不能漏诊患者
:::

### 2. 回归任务指标

| 指标 | 计算方式 | 特点 |
|------|----------|------|
| MSE（均方误差） | 误差平方的均值 | 对大误差惩罚更重 |
| RMSE（均方根误差） | MSE 的平方根 | 与目标变量同量纲，直观 |
| MAE（平均绝对误差） | 误差绝对值的均值 | 对异常值不敏感 |
| R²（决定系数） | 1 - SS_res / SS_tot | 模型解释力，1 为完美 |

::: details 评估指标实战对比
```python
# ml_evaluation_metrics.py
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

# 模拟二分类结果：疾病检测场景
y_true = np.array([1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0])
y_pred = np.array([1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0])

# 混淆矩阵
cm = confusion_matrix(y_true, y_pred)
print("混淆矩阵:")
print(cm)

# 各项指标
print(f"\n准确率 (Accuracy):  {accuracy_score(y_true, y_pred):.4f}")
print(f"精确率 (Precision): {precision_score(y_true, y_pred):.4f}")
print(f"召回率 (Recall):    {recall_score(y_true, y_pred):.4f}")
print(f"F1 值 (F1-Score):   {f1_score(y_true, y_pred):.4f}")

# 完整的分类报告
print("\n完整分类报告:")
print(classification_report(
    y_true, y_pred,
    target_names=['健康', '患病']
))
```
:::

## 五、过拟合与欠拟合

### 1. 概念理解

| 问题 | 表现 | 原因 | 类比 |
|------|------|------|------|
| 欠拟合（Underfitting） | 训练集和测试集表现都差 | 模型太简单，无法捕捉数据规律 | 用一条直线拟合波浪形数据 |
| 过拟合（Overfitting） | 训练集表现好，测试集表现差 | 模型太复杂，记住了噪声 | 考试时只背答案不理解知识点 |
| 泛化良好 | 训练集和测试集表现都好 | 模型复杂度恰当 | 既能做原题也能做变形题 |

### 2. 解决欠拟合的方法

- 增加模型复杂度（如使用更深的决策树、更多特征）
- 减少正则化强度
- 添加更多有意义的特征（特征工程）

### 3. 解决过拟合的方法

- **正则化**：在损失函数中添加惩罚项，限制模型复杂度（L1 正则化、L2 正则化）
- **交叉验证**：使用 K 折交叉验证评估模型的真实泛化能力
- **减少特征**：通过特征选择去除无关或冗余特征
- **增加训练数据**：更多的数据能帮助模型学到更普适的规律
- **Early Stopping**：在验证集指标不再提升时停止训练

::: details 交叉验证实战：检测过拟合
```python
# ml_cross_validation.py
from sklearn.datasets import load_wine
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import cross_val_score, learning_curve
import numpy as np

# 加载红酒数据集
wine = load_wine()

# 对比不同深度决策树的过拟合程度
print(f"{'最大深度':>8} | {'训练集准确率':>12} | {'交叉验证准确率':>14}")
print("-" * 48)

for max_depth in [2, 4, 6, 8, 10, None]:
    tree = DecisionTreeClassifier(max_depth=max_depth, random_state=42)

    # 训练集准确率
    tree.fit(wine.data, wine.target)
    train_acc = tree.score(wine.data, wine.target)

    # 5 折交叉验证准确率
    cv_scores = cross_val_score(tree, wine.data, wine.target, cv=5)

    depth_label = str(max_depth) if max_depth else "无限制"
    print(f"{depth_label:>8} | {train_acc:>12.4f} | {cv_scores.mean():>14.4f}")
    # 当训练集准确率远高于交叉验证准确率时，说明出现了过拟合 # {1}
```
:::

## 六、数据预处理

数据预处理是机器学习项目中最耗时但也最关键的环节。模型的表现很大程度上取决于输入数据的质量。

### 1. 缺失值处理

| 处理方法 | 适用场景 | 示例 |
|----------|----------|------|
| 删除缺失行 | 缺失比例很低（<5%） | `df.dropna()` |
| 均值/中位数填充 | 数值型特征 | `SimpleImputer(strategy='mean')` |
| 众数填充 | 类别型特征 | `SimpleImputer(strategy='most_frequent')` |
| 模型预测填充 | 缺失存在规律 | 用其他特征预测缺失值 |

### 2. 特征缩放

::: warning 为什么需要特征缩放
很多算法（如 SVM、KNN、神经网络、线性回归）对特征的尺度非常敏感。如果不做缩放，取值范围大的特征会在距离或梯度计算中占主导地位，导致模型偏差。决策树和随机森林等基于树的算法不需要特征缩放。
:::

| 方法 | 公式 | 结果范围 | 适用场景 |
|------|------|----------|----------|
| Min-Max 归一化 | (x - min) / (max - min) | [0, 1] | 数据分布无明显异常值 |
| 标准化（Z-Score） | (x - mean) / std | 均值0，标准差1 | 数据近似正态分布 |

::: details 完整数据预处理流水线
```python
# ml_preprocessing_pipeline.py
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

# 模拟电商用户数据
np.random.seed(42)
num_users = 300

# 数值特征：年龄、月消费金额、登录次数
age = np.random.choice(
    [np.nan] + list(range(18, 65)), size=num_users,
    p=[0.05] + [0.95/47]*47
)
monthly_spending = np.random.uniform(100, 5000, num_users)
login_count = np.random.randint(1, 50, num_users)

# 类别特征：会员等级
membership = np.random.choice(
    ['普通', '银卡', '金卡', '钻石'], size=num_users,
    p=[0.4, 0.3, 0.2, 0.1]
)

# 目标变量：是否流失
churn_probability = (
    0.3 * (monthly_spending < 500) +
    0.2 * (login_count < 5) +
    0.1 * (membership == '普通')
)
is_churned = (np.random.random(num_users) < churn_probability).astype(int)

# 构建特征矩阵（混合数值和类别特征）
numerical_features = np.column_stack([age, monthly_spending, login_count])
categorical_features = membership.reshape(-1, 1)

features = np.column_stack([numerical_features, categorical_features])

# 定义预处理流水线
numerical_indices = [0, 1, 2]
categorical_indices = [3]

preprocessor = ColumnTransformer(
    transformers=[
        ('num', Pipeline([
            ('imputer', SimpleImputer(strategy='median')),  # 缺失值用中位数填充
            ('scaler', StandardScaler())                     # 标准化
        ]), numerical_indices),
        ('cat', Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('encoder', OneHotEncoder(handle_unknown='ignore'))  # 独热编码
        ]), categorical_indices)
    ]
)

# 完整流水线：预处理 + 模型
full_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# 交叉验证评估
scores = cross_val_score(full_pipeline, features, is_churned, cv=5)
print(f"交叉验证准确率: {scores.mean():.4f} ± {scores.std():.4f}")
```
:::

## 七、总结与下一步

本文介绍了机器学习的核心概念和常见算法。关键要点回顾：

- 机器学习分为监督学习、无监督学习和强化学习三大类
- 选择算法时需要根据数据特点和任务类型综合考量
- 模型评估不能只看准确率，需要结合具体业务场景选择合适的指标
- 数据预处理和特征工程往往比选择模型更重要
- 过拟合是最常见的问题，交叉验证是检测和解决它的核心手段

掌握了这些基础知识后，你可以继续学习 [深度学习基础](./02-deep-learning.md)，了解神经网络如何将机器学习推向更强大的阶段。
