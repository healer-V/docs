---
title: "Python 面向对象编程"
category: "后端 · Python"
tags:
  - Python
  - OOP
  - 类
  - 装饰器
date: 2026-03-17
---

# Python 面向对象编程

Python 是多范式语言，完整支持面向对象编程。通过类、继承、魔术方法和装饰器，可以构建优雅的抽象层次，满足从简单数据容器到复杂框架的各类需求。

## 一、类与实例

### 1. 基本定义

::: details 类定义与实例化示例

```python
class BankAccount:
    """银行账户类，演示 Python OOP 基础。"""

    # 类变量：所有实例共享
    interest_rate = 0.03
    _instance_count = 0

    def __init__(self, owner: str, balance: float = 0.0) -> None:
        """初始化账户。"""
        # 实例变量：每个实例独立
        self.owner   = owner
        self._balance = balance      # 约定 _ 前缀为"受保护"属性
        self.__account_id = self._generate_id()  # __ 前缀触发名称修饰（mangling）
        BankAccount._instance_count += 1

    def _generate_id(self) -> str:
        return f"ACC{BankAccount._instance_count + 1:06d}"

    def deposit(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError(f"存款金额必须为正数，收到：{amount}")
        self._balance += amount

    def withdraw(self, amount: float) -> None:
        if amount > self._balance:
            raise ValueError("余额不足")
        self._balance -= amount

    def get_balance(self) -> float:
        return self._balance

    def __str__(self) -> str:
        """用户友好的字符串表示，print() 时调用。"""
        return f"账户[{self.owner}] 余额：¥{self._balance:.2f}"

    def __repr__(self) -> str:
        """开发者调试用的精确表示，交互式解释器中调用。"""
        return f"BankAccount(owner={self.owner!r}, balance={self._balance!r})"


# 使用
account = BankAccount("Alice", 1000.0)
account.deposit(500.0)
print(account)       # 账户[Alice] 余额：¥1500.00
print(repr(account)) # BankAccount(owner='Alice', balance=1500.0)
```

:::

### 2. 类方法与静态方法

::: details 类方法 vs 静态方法示例

```python
class Temperature:
    def __init__(self, celsius: float) -> None:
        self.celsius = celsius

    # 实例方法：第一个参数是 self（实例）
    def to_fahrenheit(self) -> float:
        return self.celsius * 9 / 5 + 32

    # 类方法：第一个参数是 cls（类本身），可访问/修改类状态
    @classmethod
    def from_fahrenheit(cls, fahrenheit: float) -> "Temperature":
        """替代构造方法，从华氏度创建实例。"""
        return cls((fahrenheit - 32) * 5 / 9)

    @classmethod
    def from_kelvin(cls, kelvin: float) -> "Temperature":
        return cls(kelvin - 273.15)

    # 静态方法：不接收 self 或 cls，是与类相关的纯函数
    @staticmethod
    def is_valid_celsius(value: float) -> bool:
        return -273.15 <= value <= 1e6

    def __repr__(self) -> str:
        return f"Temperature({self.celsius:.2f}°C)"


t1 = Temperature(100)
t2 = Temperature.from_fahrenheit(212)
t3 = Temperature.from_kelvin(373.15)

print(t1)  # Temperature(100.00°C)
print(t2)  # Temperature(100.00°C)
print(Temperature.is_valid_celsius(-300))  # False
```

:::

### 3. 属性装饰器（@property）

`@property` 让方法以属性的方式访问，实现受控的读写逻辑，同时保持调用方的接口简洁。

::: details @property 示例

```python
class Circle:
    def __init__(self, radius: float) -> None:
        self._radius = radius  # 存储为私有变量

    @property
    def radius(self) -> float:
        """读取半径。"""
        return self._radius

    @radius.setter
    def radius(self, value: float) -> None:
        """设置半径，带合法性校验。"""
        if value < 0:
            raise ValueError(f"半径不能为负数：{value}")
        self._radius = value

    @radius.deleter
    def radius(self) -> None:
        del self._radius

    @property
    def area(self) -> float:
        """面积是计算属性，只读。"""
        import math
        return math.pi * self._radius ** 2

    @property
    def diameter(self) -> float:
        return self._radius * 2

    @diameter.setter
    def diameter(self, value: float) -> None:
        self.radius = value / 2  # 复用 radius 的 setter 校验逻辑


c = Circle(5)
print(c.radius)    # 5（像属性一样访问，无括号）
print(c.area)      # 78.53...
c.radius = 10      # 像属性一样赋值，内部调用 setter
c.radius = -1      # ValueError: 半径不能为负数：-1
```

:::

## 二、继承与多重继承

### 1. 单继承

::: details 继承示例

```python
class Animal:
    def __init__(self, name: str, age: int) -> None:
        self.name = name
        self.age  = age

    def speak(self) -> str:
        raise NotImplementedError("子类必须实现 speak 方法")

    def describe(self) -> str:
        return f"{self.name}（{self.age} 岁）说：{self.speak()}"


class Dog(Animal):
    def __init__(self, name: str, age: int, breed: str) -> None:
        super().__init__(name, age)  # 调用父类 __init__
        self.breed = breed

    def speak(self) -> str:
        return "汪汪！"

    def fetch(self) -> str:
        return f"{self.name} 去捡球了！"


class Cat(Animal):
    def speak(self) -> str:
        return "喵～"


dog = Dog("旺财", 3, "柴犬")
print(dog.describe())  # 旺财（3 岁）说：汪汪！

# isinstance 检查继承关系
print(isinstance(dog, Dog))    # True
print(isinstance(dog, Animal)) # True
print(issubclass(Dog, Animal)) # True
```

:::

### 2. 多重继承与 MRO

Python 支持多重继承，方法解析顺序（MRO）遵循 C3 线性化算法，`__mro__` 属性可查看解析顺序。

::: details 多重继承示例

```python
class Flyable:
    def fly(self) -> str:
        return "我可以飞"

class Swimmable:
    def swim(self) -> str:
        return "我可以游泳"

class Duck(Animal, Flyable, Swimmable):
    def speak(self) -> str:
        return "嘎嘎！"


duck = Duck("唐老鸭", 5)
print(duck.describe())  # 唐老鸭（5 岁）说：嘎嘎！
print(duck.fly())       # 我可以飞
print(duck.swim())      # 我可以游泳

# 查看 MRO
print(Duck.__mro__)
# (<class 'Duck'>, <class 'Animal'>, <class 'Flyable'>, <class 'Swimmable'>, <class 'object'>)
```

:::

::: tip
多重继承存在菱形继承问题，使用 `super()` 配合 MRO 可以正确协同调用父类方法。实际项目中应谨慎使用多重继承，优先考虑组合（Mixin 模式）。
:::

## 三、魔术方法

魔术方法（Dunder Methods）让自定义类与 Python 内置操作无缝集成。

### 1. 常用魔术方法一览

| 方法 | 触发时机 |
|------|---------|
| `__init__` | 实例化时 |
| `__str__` | `str(obj)` / `print(obj)` |
| `__repr__` | `repr(obj)` / 交互式解释器 |
| `__len__` | `len(obj)` |
| `__getitem__` | `obj[key]` |
| `__setitem__` | `obj[key] = value` |
| `__delitem__` | `del obj[key]` |
| `__contains__` | `item in obj` |
| `__iter__` | `for item in obj` |
| `__next__` | `next(obj)` |
| `__eq__` | `obj == other` |
| `__lt__` | `obj < other` |
| `__add__` | `obj + other` |
| `__enter__` / `__exit__` | `with obj:` 语句 |

::: details 魔术方法综合示例

```python
class ShoppingCart:
    """购物车：演示常用魔术方法。"""

    def __init__(self) -> None:
        self._items: dict[str, float] = {}  # {商品名: 价格}

    def add(self, item: str, price: float) -> None:
        self._items[item] = price

    # len(cart) → 购物车商品数量
    def __len__(self) -> int:
        return len(self._items)

    # cart[item] → 获取商品价格
    def __getitem__(self, item: str) -> float:
        return self._items[item]

    # cart[item] = price → 设置商品价格
    def __setitem__(self, item: str, price: float) -> None:
        self._items[item] = price

    # del cart[item] → 删除商品
    def __delitem__(self, item: str) -> None:
        del self._items[item]

    # "iPhone" in cart → 成员检测
    def __contains__(self, item: str) -> bool:
        return item in self._items

    # for item in cart → 可迭代
    def __iter__(self):
        return iter(self._items)

    # cart1 + cart2 → 合并购物车
    def __add__(self, other: "ShoppingCart") -> "ShoppingCart":
        merged = ShoppingCart()
        merged._items = {**self._items, **other._items}
        return merged

    def __str__(self) -> str:
        total = sum(self._items.values())
        items = "\n".join(f"  {k}: ¥{v:.2f}" for k, v in self._items.items())
        return f"购物车（共 {len(self)} 件，总计 ¥{total:.2f}）:\n{items}"


cart = ShoppingCart()
cart.add("iPhone 15", 7999.0)
cart["AirPods"] = 1299.0

print(len(cart))                # 2
print("iPhone 15" in cart)      # True
print(cart["AirPods"])          # 1299.0

for item in cart:
    print(item)                 # iPhone 15 / AirPods

print(cart)
```

:::

## 四、dataclass

`dataclass` 装饰器（Python 3.7+）自动生成 `__init__`、`__repr__`、`__eq__` 等方法，大幅减少数据类的样板代码。

::: details dataclass 示例

```python
from dataclasses import dataclass, field
from typing import Optional
import datetime

@dataclass
class Product:
    name:     str
    price:    float
    category: str
    stock:    int = 0
    tags:     list[str] = field(default_factory=list)  # 可变默认值必须用 field
    created:  datetime.date = field(default_factory=datetime.date.today)

    # 可以添加自定义方法
    def is_available(self) -> bool:
        return self.stock > 0

    def discount(self, rate: float) -> float:
        return self.price * (1 - rate)


@dataclass(frozen=True)   # 不可变（冻结），可作为字典键
class Point:
    x: float
    y: float

    def distance_to(self, other: "Point") -> float:
        return ((self.x - other.x) ** 2 + (self.y - other.y) ** 2) ** 0.5


# 使用
p = Product(name="MacBook Pro", price=12999.0, category="Electronics")
print(p)  # Product(name='MacBook Pro', price=12999.0, ...)

origin = Point(0, 0)
target = Point(3, 4)
print(target.distance_to(origin))  # 5.0
```

:::

## 五、装饰器

装饰器是接收函数并返回函数的高阶函数，用于在不修改原函数代码的前提下增加功能。

### 1. 函数装饰器

::: details 装饰器示例

```python
import functools
import time
import logging

logger = logging.getLogger(__name__)

# 计时装饰器
def timeit(func):
    @functools.wraps(func)  # 保留原函数的 __name__、__doc__ 等元信息
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} 耗时：{elapsed:.4f}s")
        return result
    return wrapper

# 带参数的装饰器
def retry(max_attempts: int = 3, delay: float = 1.0):
    """重试装饰器：失败时自动重试。"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts:
                        raise
                    logger.warning(f"{func.__name__} 第 {attempt} 次失败：{e}，将在 {delay}s 后重试")
                    time.sleep(delay)
        return wrapper
    return decorator

# 使用
@timeit
@retry(max_attempts=3, delay=0.5)
def fetch_data(url: str) -> dict:
    """从远程 API 获取数据。"""
    import urllib.request
    with urllib.request.urlopen(url, timeout=5) as response:
        import json
        return json.loads(response.read())
```

:::

### 2. 类装饰器

::: details 类装饰器示例

```python
class Singleton:
    """单例装饰器：确保类只有一个实例。"""

    def __init__(self, cls):
        self._cls      = cls
        self._instance = None
        functools.update_wrapper(self, cls)

    def __call__(self, *args, **kwargs):
        if self._instance is None:
            self._instance = self._cls(*args, **kwargs)
        return self._instance


@Singleton
class DatabaseConfig:
    def __init__(self, host: str, port: int) -> None:
        self.host = host
        self.port = port
        print(f"初始化数据库配置：{host}:{port}")


cfg1 = DatabaseConfig("localhost", 5432)  # 输出：初始化数据库配置：localhost:5432
cfg2 = DatabaseConfig("other-host", 3306) # 无输出（已有实例）
print(cfg1 is cfg2)  # True（同一个实例）
```

:::

::: warning
装饰器叠加时，执行顺序是从内到外（离函数最近的先执行）。多个装饰器组合时要注意顺序对行为的影响。
:::
