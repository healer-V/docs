---
title: "Python 概述"
category: "后端 · Python"
tags:
  - Python
excerpt: "Python 是一种高级、解释型、通用编程语言，由 Guido van Rossum 于 1991 年发布。它以简洁优雅的语法和强大的生态系统著称，广泛应用于 Web 开发、数据科学、人工智能、自动化运维等领域。 | 特性 | 说明 | |..."
---

# Python 概述

## 一、Python 简介

Python 是一种高级、解释型、通用编程语言，由 Guido van Rossum 于 1991 年发布。它以简洁优雅的语法和强大的生态系统著称，广泛应用于 Web 开发、数据科学、人工智能、自动化运维等领域。

### 1. 核心特性

| 特性 | 说明 |
|------|------|
| 简洁易读 | 使用缩进代替花括号，代码风格统一 |
| 动态类型 | 变量无需声明类型，运行时自动推断 |
| 跨平台 | 支持 Windows、macOS、Linux |
| 丰富的标准库 | 内置大量模块，开箱即用 |
| 解释执行 | 无需编译，逐行解释运行 |
| 多范式 | 支持面向对象、函数式、过程式编程 |

### 2. Python 2 与 Python 3

::: warning
Python 2 已于 2020 年 1 月 1 日正式停止维护，所有新项目应使用 Python 3。
:::

| 对比项 | Python 2 | Python 3 |
|--------|----------|----------|
| print | `print "hello"` 语句 | `print("hello")` 函数 |
| 整数除法 | `3/2 = 1` | `3/2 = 1.5` |
| 字符串 | 默认 ASCII | 默认 Unicode |
| range | 返回列表 | 返回迭代器 |
| 维护状态 | 已停止维护 | 持续更新 |

## 二、环境搭建

### 1. 安装 Python

前往 [Python 官网](https://www.python.org/downloads/) 下载安装包，安装时勾选 **Add Python to PATH**。

::: details 验证安装
```bash
python --version
# Python 3.12.x

pip --version
# pip 24.x.x from ...
```
:::

### 2. pip 包管理器

pip 是 Python 官方的包管理工具，用于安装和管理第三方库。

::: details pip 常用命令
```bash
# 安装包
pip install requests

# 安装指定版本
pip install requests==2.31.0

# 升级包
pip install --upgrade requests

# 卸载包
pip uninstall requests

# 查看已安装的包
pip list

# 导出依赖
pip freeze > requirements.txt

# 从文件安装依赖
pip install -r requirements.txt

# 使用国内镜像源
pip install requests -i https://pypi.tuna.tsinghua.edu.cn/simple
```
:::

### 3. 虚拟环境

虚拟环境用于隔离不同项目的依赖，避免版本冲突。

::: code-group
```bash [venv（内置）]
# 创建虚拟环境
python -m venv myproject_env

# 激活（macOS/Linux）
source myproject_env/bin/activate

# 激活（Windows）
myproject_env\Scripts\activate

# 退出虚拟环境
deactivate
```

```bash [conda]
# 创建环境
conda create -n myproject python=3.12

# 激活环境
conda activate myproject

# 查看所有环境
conda env list

# 安装包
conda install numpy pandas

# 导出环境
conda env export > environment.yml

# 退出环境
conda deactivate
```
:::

::: tip
推荐每个项目使用独立的虚拟环境，项目级别用 venv 即可，数据科学项目推荐使用 conda。
:::

## 三、基础语法

### 1. 数据类型

Python 中一切皆对象，常用的基本数据类型如下：

| 类型 | 示例 | 说明 |
|------|------|------|
| `int` | `age = 25` | 整数，无大小限制 |
| `float` | `price = 9.99` | 浮点数 |
| `bool` | `is_active = True` | 布尔值 |
| `str` | `name = "Alice"` | 字符串，不可变 |
| `None` | `result = None` | 空值 |

::: details 类型操作示例
```python
# 类型检查
user_age = 25
print(type(user_age))       # <class 'int'>
print(isinstance(user_age, int))  # True

# 类型转换
score_str = "95"
score_num = int(score_str)   # 字符串转整数
ratio = float("3.14")       # 字符串转浮点数
label = str(100)             # 整数转字符串

# 字符串操作
greeting = "Hello, Python"
print(greeting.upper())      # HELLO, PYTHON
print(greeting.split(", "))  # ['Hello', 'Python']
print(greeting.replace("Python", "World"))  # Hello, World

# f-string 格式化（Python 3.6+）
username = "Alice"
login_count = 42
message = f"{username} 已登录 {login_count} 次"
```
:::

### 2. 控制流

::: details 条件判断与循环
```python
# if-elif-else
http_status = 404

if http_status == 200:
    print("请求成功")
elif http_status == 404:
    print("资源未找到")
elif http_status >= 500:
    print("服务器错误")
else:
    print(f"其他状态码: {http_status}")

# for 循环
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)

# 带索引的遍历
for index, fruit in enumerate(fruits):
    print(f"{index}: {fruit}")

# while 循环
retry_count = 0
max_retries = 3
while retry_count < max_retries:
    print(f"第 {retry_count + 1} 次尝试")
    retry_count += 1

# 列表推导式
prices = [10, 20, 30, 40, 50]
discounted = [price * 0.8 for price in prices if price > 15]
# [16.0, 24.0, 32.0, 40.0]
```
:::

### 3. 函数

::: details 函数定义与调用
```python
# 基本函数
def calculate_tax(income: float, rate: float = 0.1) -> float:
    """计算税额"""
    return income * rate

tax = calculate_tax(50000)          # 使用默认税率
tax = calculate_tax(50000, 0.15)    # 指定税率

# 多返回值
def get_user_info(user_id: int) -> tuple:
    name = "Alice"
    email = "alice@example.com"
    return name, email

username, user_email = get_user_info(1)

# *args 和 **kwargs
def create_log(level: str, *messages, **metadata):
    print(f"[{level}]", " ".join(messages))
    for key, value in metadata.items():
        print(f"  {key}: {value}")

create_log("INFO", "用户登录", "操作成功", user="Alice", ip="192.168.1.1")

# Lambda 表达式
employees = [
    {"name": "Alice", "salary": 8000},
    {"name": "Bob", "salary": 12000},
    {"name": "Charlie", "salary": 6000},
]
sorted_employees = sorted(employees, key=lambda emp: emp["salary"], reverse=True)
```
:::

## 四、数据结构

### 1. 列表（List）

列表是有序、可变的序列，允许重复元素。

::: details 列表操作
```python
# 创建与访问
task_list = ["设计", "开发", "测试", "部署"]
first_task = task_list[0]       # "设计"
last_task = task_list[-1]       # "部署"

# 切片
dev_tasks = task_list[1:3]      # ["开发", "测试"]

# 增删改
task_list.append("运维")         # 末尾添加
task_list.insert(2, "Code Review")  # 指定位置插入
task_list.remove("测试")         # 删除指定元素
removed = task_list.pop()        # 弹出末尾元素

# 常用方法
numbers = [3, 1, 4, 1, 5, 9, 2, 6]
numbers.sort()                   # 原地排序
numbers.reverse()                # 原地反转
count = numbers.count(1)        # 统计出现次数
```
:::

### 2. 元组（Tuple）

元组是有序、不可变的序列，适合存储不应被修改的数据。

::: details 元组操作
```python
# 创建
coordinates = (39.9042, 116.4074)  # 北京坐标
http_response = (200, "OK", {"content_type": "application/json"})

# 解包
latitude, longitude = coordinates
status_code, status_text, headers = http_response

# 命名元组（更推荐）
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
origin = Point(0, 0)
print(origin.x, origin.y)  # 0 0
```
:::

### 3. 字典（Dict）

字典是键值对的无序集合，键必须是不可变类型。

::: details 字典操作
```python
# 创建
user_profile = {
    "username": "alice",
    "email": "alice@example.com",
    "age": 28,
    "roles": ["admin", "editor"],
}

# 访问
email = user_profile["email"]
phone = user_profile.get("phone", "未设置")  # 安全访问，提供默认值

# 增删改
user_profile["phone"] = "13800138000"   # 添加/修改
del user_profile["age"]                  # 删除

# 遍历
for key, value in user_profile.items():
    print(f"{key}: {value}")

# 字典推导式
word_list = ["hello", "world", "python"]
word_lengths = {word: len(word) for word in word_list}
# {'hello': 5, 'world': 5, 'python': 6}

# 合并字典（Python 3.9+）
defaults = {"theme": "light", "language": "zh-CN"}
user_settings = {"theme": "dark"}
merged = defaults | user_settings  # {'theme': 'dark', 'language': 'zh-CN'}
```
:::

### 4. 集合（Set）

集合是无序、不重复的元素集，支持数学集合运算。

::: details 集合操作
```python
# 创建与去重
backend_skills = {"Python", "Java", "Go", "Python"}  # 自动去重
frontend_skills = {"JavaScript", "TypeScript", "Python"}

# 集合运算
common = backend_skills & frontend_skills       # 交集: {'Python'}
all_skills = backend_skills | frontend_skills    # 并集
only_backend = backend_skills - frontend_skills  # 差集

# 成员检测（O(1) 复杂度）
print("Python" in backend_skills)  # True
```
:::

## 五、面向对象编程

Python 支持完整的面向对象特性，包括封装、继承和多态。

::: details OOP 示例
```python
from abc import ABC, abstractmethod

# 抽象基类
class PaymentProcessor(ABC):
    @abstractmethod
    def process(self, amount: float) -> bool:
        pass

# 继承与实现
class CreditCardProcessor(PaymentProcessor):
    def __init__(self, card_number: str):
        self._card_number = card_number  # 受保护属性
        self._balance = 0.0

    @property
    def balance(self) -> float:
        """余额属性（只读）"""
        return self._balance

    def process(self, amount: float) -> bool:
        if amount <= 0:
            raise ValueError("金额必须大于零")
        self._balance += amount
        print(f"信用卡 {self._card_number[-4:]} 支付 {amount} 元")
        return True

    def __str__(self) -> str:
        return f"CreditCard(****{self._card_number[-4:]})"

    def __repr__(self) -> str:
        return f"CreditCardProcessor(card_number='{self._card_number}')"

class AlipayProcessor(PaymentProcessor):
    def __init__(self, account: str):
        self.account = account

    def process(self, amount: float) -> bool:
        print(f"支付宝 {self.account} 支付 {amount} 元")
        return True

# 使用
processors: list[PaymentProcessor] = [
    CreditCardProcessor("6222021234567890"),
    AlipayProcessor("alice@example.com"),
]

for processor in processors:
    processor.process(99.9)  # 多态调用
```
:::

::: tip
Python 3.10+ 支持 `dataclass` 装饰器，可以大幅简化数据类的定义：

```python
from dataclasses import dataclass

@dataclass
class Product:
    name: str
    price: float
    stock: int = 0
```
:::

## 六、文件操作

### 1. 文本文件读写

::: details 文件读写示例
```python
# 写入文件
with open("config.txt", "w", encoding="utf-8") as config_file:
    config_file.write("host=localhost\n")
    config_file.write("port=8080\n")

# 读取文件
with open("config.txt", "r", encoding="utf-8") as config_file:
    content = config_file.read()
    print(content)

# 逐行读取
with open("access.log", "r", encoding="utf-8") as log_file:
    for line in log_file:
        if "ERROR" in line:
            print(line.strip())

# 追加内容
with open("app.log", "a", encoding="utf-8") as log_file:
    log_file.write("2026-03-14 10:00:00 INFO 服务启动\n")
```
:::

### 2. JSON 文件操作

::: details JSON 操作示例
```python
import json

# 写入 JSON
app_config = {
    "database": {"host": "localhost", "port": 5432, "name": "myapp"},
    "redis": {"host": "localhost", "port": 6379},
    "debug": True,
}

with open("config.json", "w", encoding="utf-8") as json_file:
    json.dump(app_config, json_file, indent=2, ensure_ascii=False)

# 读取 JSON
with open("config.json", "r", encoding="utf-8") as json_file:
    loaded_config = json.load(json_file)
    db_host = loaded_config["database"]["host"]
```
:::

### 3. pathlib 路径操作

::: details pathlib 示例
```python
from pathlib import Path

# 路径操作
project_root = Path("/home/user/myproject")
config_path = project_root / "config" / "settings.json"

print(config_path.exists())       # 是否存在
print(config_path.suffix)         # .json
print(config_path.stem)           # settings
print(config_path.parent)         # /home/user/myproject/config

# 遍历目录
for py_file in project_root.rglob("*.py"):
    print(py_file)

# 创建目录
output_dir = project_root / "output"
output_dir.mkdir(parents=True, exist_ok=True)
```
:::

## 七、异常处理

Python 使用 `try-except` 机制处理异常，确保程序的健壮性。

::: details 异常处理示例
```python
import logging

logger = logging.getLogger(__name__)

# 基本异常处理
def parse_config(filepath: str) -> dict:
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            import json
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"配置文件不存在: {filepath}")
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"配置文件格式错误: {e}")
        return {}
    except Exception as e:
        logger.error(f"读取配置失败: {e}")
        raise
    finally:
        logger.info("配置读取流程结束")

# 自定义异常
class InsufficientBalanceError(Exception):
    def __init__(self, account_id: str, balance: float, amount: float):
        self.account_id = account_id
        self.balance = balance
        self.amount = amount
        super().__init__(
            f"账户 {account_id} 余额不足: 余额 {balance}, 需要 {amount}"
        )

def withdraw(account_id: str, balance: float, amount: float) -> float:
    if amount > balance:
        raise InsufficientBalanceError(account_id, balance, amount)
    return balance - amount

# 使用自定义异常
try:
    new_balance = withdraw("ACC001", 100.0, 200.0)
except InsufficientBalanceError as e:
    print(f"交易失败: {e}")
```
:::

::: warning
避免使用裸 `except:` 捕获所有异常，这会隐藏潜在的 bug。至少使用 `except Exception` 来排除系统退出类异常。
:::

## 八、装饰器与生成器

### 1. 装饰器

装饰器本质上是一个接收函数作为参数并返回新函数的高阶函数，用于在不修改原函数代码的前提下扩展其功能。

::: details 装饰器示例
```python
import functools
import time

# 计时装饰器
def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} 执行耗时: {elapsed:.4f}s")
        return result
    return wrapper

# 重试装饰器
def retry(max_attempts: int = 3, delay: float = 1.0):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts:
                        raise
                    print(f"第 {attempt} 次失败: {e}, {delay}s 后重试")
                    time.sleep(delay)
        return wrapper
    return decorator

@timer
@retry(max_attempts=3, delay=0.5)
def fetch_data(url: str) -> str:
    """模拟请求数据"""
    import random
    if random.random() < 0.5:
        raise ConnectionError("网络超时")
    return f"来自 {url} 的数据"

result = fetch_data("https://api.example.com/users")
```
:::

### 2. 生成器

生成器使用 `yield` 关键字按需生成值，适合处理大数据集或惰性计算场景。

::: details 生成器示例
```python
# 基本生成器
def read_large_file(filepath: str, chunk_size: int = 1024):
    """逐块读取大文件，避免一次性加载到内存"""
    with open(filepath, "r", encoding="utf-8") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            yield chunk

# 使用生成器逐块处理
for chunk in read_large_file("large_dataset.csv"):
    process(chunk)

# 生成器表达式
log_lines = (line.strip() for line in open("app.log"))
error_lines = (line for line in log_lines if "ERROR" in line)

# 无限序列生成器
def id_generator(prefix: str = "ID"):
    """生成唯一 ID"""
    counter = 1
    while True:
        yield f"{prefix}-{counter:06d}"
        counter += 1

gen = id_generator("ORDER")
order_id_1 = next(gen)  # ORDER-000001
order_id_2 = next(gen)  # ORDER-000002
```
:::

## 九、异步编程

Python 通过 `asyncio` 模块支持异步编程，适用于 I/O 密集型任务（网络请求、文件读写、数据库查询等）。

::: details asyncio 示例
```python
import asyncio
import aiohttp

async def fetch_url(session: aiohttp.ClientSession, url: str) -> dict:
    """异步请求单个 URL"""
    async with session.get(url) as response:
        data = await response.json()
        print(f"完成: {url} -> 状态码 {response.status}")
        return data

async def fetch_all_users():
    """并发请求多个接口"""
    urls = [
        "https://api.example.com/users/1",
        "https://api.example.com/users/2",
        "https://api.example.com/users/3",
    ]

    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for url, result in zip(urls, results):
            if isinstance(result, Exception):
                print(f"请求失败 {url}: {result}")
            else:
                print(f"用户数据: {result}")

    return results

# 运行
asyncio.run(fetch_all_users())
```
:::

::: tip
`asyncio.gather` 用于并发执行多个协程，设置 `return_exceptions=True` 可以避免单个任务失败导致全部中断。
:::

::: warning
`async/await` 只适合 I/O 密集型任务。CPU 密集型任务应使用 `multiprocessing` 或 `concurrent.futures.ProcessPoolExecutor`。
:::

## 十、常用标准库

Python 内置了功能丰富的标准库，以下是最常用的模块：

| 模块 | 用途 | 示例 |
|------|------|------|
| `os` | 操作系统交互 | `os.getenv("HOME")` |
| `sys` | 解释器相关 | `sys.argv`, `sys.exit()` |
| `json` | JSON 序列化 | `json.dumps(data)` |
| `re` | 正则表达式 | `re.findall(r"\d+", text)` |
| `datetime` | 日期时间 | `datetime.now()` |
| `pathlib` | 路径操作 | `Path("./data").mkdir()` |
| `collections` | 扩展容器 | `Counter`, `defaultdict` |
| `itertools` | 迭代工具 | `chain`, `product`, `groupby` |
| `functools` | 函数工具 | `lru_cache`, `partial`, `wraps` |
| `logging` | 日志记录 | `logging.info("msg")` |
| `unittest` | 单元测试 | `TestCase`, `assertEqual` |
| `typing` | 类型提示 | `List[str]`, `Optional[int]` |
| `hashlib` | 哈希计算 | `hashlib.sha256(data).hexdigest()` |
| `subprocess` | 子进程管理 | `subprocess.run(["ls", "-l"])` |
| `http.server` | HTTP 服务 | 快速启动静态文件服务器 |

::: details 常用标准库示例
```python
# re - 正则表达式
import re

email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
text = "联系我: alice@example.com 或 bob@test.org"
emails = re.findall(email_pattern, text)
# ['alice@example.com', 'bob@test.org']

# datetime - 日期时间
from datetime import datetime, timedelta

now = datetime.now()
deadline = now + timedelta(days=7)
formatted = deadline.strftime("%Y-%m-%d %H:%M:%S")

# collections - 扩展容器
from collections import Counter, defaultdict

# 统计词频
words = ["python", "java", "python", "go", "python", "java"]
word_count = Counter(words)
# Counter({'python': 3, 'java': 2, 'go': 1})

# 默认字典
grouped_users = defaultdict(list)
user_records = [("admin", "Alice"), ("editor", "Bob"), ("admin", "Charlie")]
for role, name in user_records:
    grouped_users[role].append(name)
# {'admin': ['Alice', 'Charlie'], 'editor': ['Bob']}

# functools.lru_cache - 缓存
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(50))  # 瞬间返回，结果已缓存
```
:::
