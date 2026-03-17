---
title: "Python 基础语法"
category: "后端 · Python"
tags:
  - Python
  - 语法
  - 数据类型
  - 函数
date: 2026-03-17
---

# Python 基础语法

Python 以简洁的语法和动态类型著称，掌握其核心数据类型、控制流和函数特性是深入学习的基础。

## 一、变量与数据类型

### 1. 基本数据类型

Python 是动态类型语言，变量在赋值时自动确定类型。

| 类型 | 示例 | 说明 |
|------|------|------|
| `int` | `42`, `-7`, `0xFF` | 任意精度整数 |
| `float` | `3.14`, `1e-5` | 64 位浮点数 |
| `str` | `"hello"`, `'world'` | 不可变字符序列 |
| `bool` | `True`, `False` | `int` 的子类，`True == 1` |
| `None` | `None` | 空值单例，类似其他语言的 `null` |
| `complex` | `3+4j` | 复数 |

::: details 类型检查与转换示例

```python
# 变量赋值（无需声明类型）
age   = 25
price = 99.9
name  = "Alice"
is_vip = True
address = None

# 类型检查
print(type(age))           # <class 'int'>
print(isinstance(age, int)) # True

# 类型转换
print(int("42"))       # 42
print(float("3.14"))   # 3.14
print(str(100))        # '100'
print(bool(0))         # False（0、空字符串、空集合均为 False）
print(bool("hello"))   # True

# 整数进制字面量
binary = 0b1010  # 10（二进制）
octal  = 0o17    # 15（八进制）
hex_   = 0xFF    # 255（十六进制）
```

:::

### 2. 字符串操作

::: details 字符串常用方法示例

```python
text = "  Hello, Python World!  "

# 格式化（推荐 f-string，Python 3.6+）
user = "Alice"
score = 95.5
msg1 = f"用户 {user} 的得分是 {score:.1f}"   # 用户 Alice 的得分是 95.5
msg2 = f"{'居中':^20}"                        # 填充对齐
msg3 = f"{42:08b}"                            # 00101010（二进制，填充到 8 位）

# 传统格式化（兼容旧代码）
msg4 = "用户 %s 得分 %.1f" % (user, score)
msg5 = "用户 {} 得分 {:.1f}".format(user, score)

# 常用方法
print(text.strip())           # 去首尾空格
print(text.lower())           # 转小写
print(text.upper())           # 转大写
print(text.replace("Python", "AI"))  # 替换
print("Hello,World".split(","))       # ['Hello', 'World']
print(",".join(["a", "b", "c"]))      # a,b,c
print(text.startswith("  H"))         # True
print(text.find("Python"))            # 9（首次出现位置）
print("  spaces  ".strip())          # 'spaces'

# 切片
s = "Hello, World!"
print(s[0:5])    # Hello
print(s[-6:-1])  # World
print(s[::-1])   # !dlroW ,olleH（反转）
```

:::

## 二、列表、元组、字典、集合

### 1. 列表（list）

列表是有序、可变、允许重复的序列。

::: details 列表操作示例

```python
fruits = ["apple", "banana", "cherry"]

# 增
fruits.append("date")         # 末尾追加
fruits.insert(1, "avocado")   # 索引 1 处插入
fruits.extend(["elderberry"]) # 追加多个

# 删
fruits.remove("banana")       # 按值删除（首次出现）
last = fruits.pop()           # 弹出末尾元素
del fruits[0]                 # 按索引删除

# 查
print(fruits.index("cherry")) # 首次出现的索引
print(fruits.count("apple"))  # 出现次数
print(len(fruits))            # 长度

# 排序（就地修改）
numbers = [3, 1, 4, 1, 5, 9, 2, 6]
numbers.sort()                          # 升序
numbers.sort(reverse=True)             # 降序
numbers.sort(key=lambda x: -x)         # 自定义排序键

# 排序（返回新列表）
words = ["banana", "apple", "cherry"]
sorted_words = sorted(words, key=len)  # 按长度排序：['apple', 'banana', 'cherry']

# 切片
print(numbers[1:4])    # 索引 1~3
print(numbers[::2])    # 每隔一个
print(numbers[::-1])   # 反转
```

:::

### 2. 元组（tuple）

元组是有序、不可变的序列，通常用于存储异构数据或作为字典的键。

```python
point    = (10, 20)
rgb      = (255, 128, 0)
single   = (42,)           # 单元素元组必须有逗号

# 解包
x, y = point
r, g, b = rgb
first, *rest = [1, 2, 3, 4, 5]  # first=1, rest=[2,3,4,5]

# 命名元组（更具可读性）
from collections import namedtuple
Point = namedtuple("Point", ["x", "y"])
p = Point(x=3, y=4)
print(p.x, p.y)   # 3 4
```

### 3. 字典（dict）

字典是键值对容器，Python 3.7+ 保证插入顺序。

::: details 字典操作示例

```python
user = {"name": "Alice", "age": 25, "score": 95}

# 访问
print(user["name"])                     # Alice（键不存在则 KeyError）
print(user.get("email", "未填写"))       # 未填写（安全访问，带默认值）

# 增/改
user["email"] = "alice@example.com"
user.update({"age": 26, "city": "Beijing"})

# 删
del user["score"]
removed = user.pop("city", None)       # 删除并返回，不存在时返回 None

# 遍历
for key in user:                        # 遍历键
    print(key)
for key, value in user.items():         # 遍历键值对
    print(f"{key}: {value}")
print(list(user.keys()))
print(list(user.values()))

# 字典合并（Python 3.9+）
defaults = {"theme": "dark", "lang": "zh"}
settings = {"lang": "en", "font": "mono"}
merged = defaults | settings            # {'theme': 'dark', 'lang': 'en', 'font': 'mono'}
```

:::

### 4. 集合（set）

集合是无序、不重复的元素集，支持数学集合运算。

```python
tags_a = {"python", "backend", "api"}
tags_b = {"python", "frontend", "react"}

print(tags_a & tags_b)   # 交集：{'python'}
print(tags_a | tags_b)   # 并集：{'python', 'backend', 'api', 'frontend', 'react'}
print(tags_a - tags_b)   # 差集：{'backend', 'api'}
print(tags_a ^ tags_b)   # 对称差：{'backend', 'api', 'frontend', 'react'}

tags_a.add("devops")
tags_a.discard("missing")  # 删除（不存在时不报错）
```

## 三、控制流

### 1. 条件与循环

::: details 控制流示例

```python
# if / elif / else
score = 85
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "D"

# 三元表达式
status = "通过" if score >= 60 else "未通过"

# for 循环
for i in range(5):          # 0 1 2 3 4
    print(i)

for i in range(1, 10, 2):   # 1 3 5 7 9（步长 2）
    print(i)

for idx, val in enumerate(["a", "b", "c"], start=1):
    print(f"{idx}: {val}")  # 1: a  2: b  3: c

# while 循环
count = 0
while count < 3:
    print(count)
    count += 1

# break / continue / else
for n in range(2, 20):
    for i in range(2, n):
        if n % i == 0:
            break
    else:                   # for-else：循环正常结束（未 break）时执行
        print(f"{n} 是质数")
```

:::

## 四、函数

### 1. 参数类型

Python 函数支持位置参数、关键字参数、默认值参数、可变参数和仅关键字参数。

::: details 函数参数示例

```python
# 基本定义
def greet(name: str, greeting: str = "你好") -> str:
    """向指定用户发送问候。"""
    return f"{greeting}，{name}！"

print(greet("Alice"))                # 你好，Alice！
print(greet("Bob", "嗨"))            # 嗨，Bob！
print(greet(name="Charlie", greeting="晚上好"))  # 关键字参数

# *args：接收任意数量位置参数（元组）
def calculate_total(*prices: float) -> float:
    return sum(prices)

print(calculate_total(9.9, 29.9, 5.0))  # 44.8

# **kwargs：接收任意数量关键字参数（字典）
def create_user(name: str, **profile) -> dict:
    return {"name": name, **profile}

user = create_user("Alice", age=25, city="Beijing", vip=True)
# {'name': 'Alice', 'age': 25, 'city': 'Beijing', 'vip': True}

# 仅关键字参数（* 后的参数必须以关键字传入）
def send_email(to: str, *, subject: str, body: str) -> None:
    print(f"发送给 {to}: [{subject}] {body}")

send_email("alice@example.com", subject="测试", body="Hello")
# send_email("alice@example.com", "测试", "Hello")  # TypeError！

# 解包传参
args   = (3, 4)
kwargs = {"base": 10}
print(max(*args))              # 解包元组 → max(3, 4)
print(int("FF", **{"base": 16}))  # 解包字典 → int("FF", base=16)
```

:::

### 2. lambda 函数

`lambda` 用于创建简单的匿名函数，适合作为排序键或回调函数。

```python
# 基本语法
square = lambda x: x ** 2
add    = lambda x, y: x + y

# 实际应用
students = [
    {"name": "Alice", "score": 92},
    {"name": "Bob",   "score": 88},
    {"name": "Charlie", "score": 95},
]
# 按分数降序排列
students.sort(key=lambda s: s["score"], reverse=True)

# 与 map/filter 配合
numbers = [1, 2, 3, 4, 5, 6]
evens   = list(filter(lambda x: x % 2 == 0, numbers))  # [2, 4, 6]
doubled = list(map(lambda x: x * 2, numbers))           # [2, 4, 6, 8, 10, 12]
```

## 五、推导式

### 1. 四种推导式

推导式是 Python 简洁性的体现，用单行表达式构建集合类型。

::: details 推导式示例

```python
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# 列表推导式
squares      = [x ** 2 for x in numbers]           # [1, 4, 9, ...]
even_squares = [x ** 2 for x in numbers if x % 2 == 0]  # [4, 16, 36, 64, 100]

# 嵌套推导式（矩阵展开）
matrix   = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flattened = [cell for row in matrix for cell in row]  # [1, 2, 3, 4, 5, ...]

# 字典推导式
word_lengths = {word: len(word) for word in ["python", "java", "go"]}
# {'python': 6, 'java': 4, 'go': 2}

# 反转字典键值
original = {"a": 1, "b": 2, "c": 3}
reversed_dict = {v: k for k, v in original.items()}
# {1: 'a', 2: 'b', 3: 'c'}

# 集合推导式（自动去重）
unique_lengths = {len(word) for word in ["hi", "hey", "hello", "world"]}
# {2, 3, 5}

# 生成器表达式（惰性求值，节省内存）
# 对大数据集使用生成器而不是列表，避免一次性载入全部数据
total = sum(x ** 2 for x in range(1_000_000))  # 不会创建百万元素列表

# 生成器可以逐步消费
gen = (x ** 2 for x in range(10))
print(next(gen))  # 0
print(next(gen))  # 1
```

:::

::: tip
推导式简洁易读，但不要为了"一行流"而嵌套过深（超过两层的嵌套推导式可读性很差）。复杂逻辑优先使用普通 `for` 循环加函数封装。
:::
