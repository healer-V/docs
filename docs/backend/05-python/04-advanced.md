---
title: "Python 进阶特性"
category: "后端 · Python"
tags:
  - Python
  - 生成器
  - 协程
  - 并发
date: 2026-03-17
---

# Python 进阶特性

生成器、上下文管理器、异步编程是 Python 进阶开发的核心。掌握这些特性能让你在处理大数据、I/O 密集任务和并发场景时写出更高效、更优雅的代码。

## 一、生成器

### 1. yield 基础

生成器函数使用 `yield` 语句逐步产出值，每次调用 `next()` 时从上次暂停的位置继续执行，是实现惰性求值的核心机制。

::: details 生成器基础示例

```python
# 普通函数：一次性返回所有结果（内存开销大）
def get_squares_list(n: int) -> list[int]:
    return [i ** 2 for i in range(n)]

# 生成器函数：按需产出，内存开销极小
def get_squares_gen(n: int):
    for i in range(n):
        yield i ** 2

# 对比：处理百万数据
import sys
lst = get_squares_list(1_000_000)
gen = get_squares_gen(1_000_000)
print(sys.getsizeof(lst))  # ~8MB
print(sys.getsizeof(gen))  # ~200B（生成器对象本身）

# 手动控制生成器
gen = get_squares_gen(5)
print(next(gen))  # 0
print(next(gen))  # 1
print(next(gen))  # 4
# StopIteration 时迭代结束，for 循环自动处理此异常

# 生成器也可以接收值（send 方式）
def accumulator():
    total = 0
    while True:
        value = yield total   # yield 既产出 total，又接收外部传入的值
        if value is None:
            break
        total += value

acc = accumulator()
next(acc)           # 初始化（执行到第一个 yield）
print(acc.send(10)) # 10
print(acc.send(20)) # 30
print(acc.send(5))  # 35
```

:::

### 2. yield from

`yield from` 将生成器委托给子生成器，简化嵌套生成器的写法，同时传递 `send`/`throw` 调用。

::: details yield from 示例

```python
def flatten(nested):
    """递归展开任意嵌套的可迭代对象。"""
    for item in nested:
        if isinstance(item, (list, tuple)):
            yield from flatten(item)  # 委托给递归调用
        else:
            yield item

data = [1, [2, 3, [4, 5]], 6, [7, [8, 9]]]
print(list(flatten(data)))  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# 链接多个生成器
def chain(*iterables):
    for it in iterables:
        yield from it

result = list(chain([1, 2], (3, 4), range(5, 8)))
# [1, 2, 3, 4, 5, 6, 7]
```

:::

## 二、迭代器协议

实现 `__iter__` 和 `__next__` 两个方法即可创建自定义迭代器，与 `for` 循环、`list()`、`zip()` 等完全兼容。

::: details 自定义迭代器示例

```python
class Countdown:
    """倒计时迭代器。"""
    def __init__(self, start: int) -> None:
        self.current = start

    def __iter__(self):
        return self  # 自身就是迭代器

    def __next__(self) -> int:
        if self.current <= 0:
            raise StopIteration
        value = self.current
        self.current -= 1
        return value


for n in Countdown(5):
    print(n, end=" ")  # 5 4 3 2 1

# 无限迭代器（配合 itertools.islice 使用）
class FibonacciIterator:
    def __init__(self) -> None:
        self.a, self.b = 0, 1

    def __iter__(self):
        return self

    def __next__(self) -> int:
        value    = self.a
        self.a, self.b = self.b, self.a + self.b
        return value


import itertools
first_10_fibs = list(itertools.islice(FibonacciIterator(), 10))
# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

:::

## 三、上下文管理器

### 1. `__enter__` 与 `__exit__`

上下文管理器通过 `with` 语句确保资源的安全获取与释放，即使发生异常也能正确清理。

::: details 自定义上下文管理器示例

```python
import time
import traceback

class Timer:
    """计时上下文管理器。"""

    def __init__(self, label: str = "") -> None:
        self.label   = label
        self.elapsed = 0.0

    def __enter__(self) -> "Timer":
        self._start = time.perf_counter()
        return self  # 赋值给 as 后的变量

    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:
        self.elapsed = time.perf_counter() - self._start
        print(f"{self.label} 耗时：{self.elapsed:.4f}s")
        # 返回 True 则吞掉异常；返回 False/None 则继续向上传播
        return False


class ManagedConnection:
    """数据库连接上下文管理器（演示异常处理）。"""

    def __init__(self, dsn: str) -> None:
        self.dsn  = dsn
        self.conn = None

    def __enter__(self):
        print(f"连接到 {self.dsn}")
        self.conn = self._connect()
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            print(f"发生异常：{exc_type.__name__}: {exc_val}")
            self.conn.rollback()
        else:
            self.conn.commit()
        self.conn.close()
        print("连接已关闭")
        return False  # 不吞掉异常


# 使用
with Timer("数据处理"):
    result = sum(i ** 2 for i in range(1_000_000))

# 嵌套上下文管理器（Python 3.10+ 可用括号换行）
with (
    open("input.txt", encoding="utf-8") as fin,
    open("output.txt", "w", encoding="utf-8") as fout,
):
    fout.write(fin.read().upper())
```

:::

### 2. contextlib 简化写法

使用 `@contextmanager` 装饰器可以用生成器函数代替类来实现上下文管理器。

::: details contextlib 示例

```python
from contextlib import contextmanager, suppress

@contextmanager
def timer(label: str = ""):
    """生成器版计时上下文管理器。"""
    start = time.perf_counter()
    try:
        yield  # yield 前是 __enter__，yield 后是 __exit__
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label} 耗时：{elapsed:.4f}s")


# suppress：忽略特定异常
with suppress(FileNotFoundError):
    open("nonexistent.txt")  # 文件不存在时静默忽略

with timer("排序"):
    sorted_data = sorted(range(1_000_000), reverse=True)
```

:::

## 四、asyncio 异步编程

### 1. async/await 基础

`asyncio` 是 Python 的异步 I/O 框架，通过协程在单线程内实现高并发 I/O 操作。

::: details asyncio 基础示例

```python
import asyncio
import aiohttp   # 异步 HTTP 客户端

async def fetch_user(session: aiohttp.ClientSession, user_id: int) -> dict:
    """异步获取用户信息。"""
    url = f"https://jsonplaceholder.typicode.com/users/{user_id}"
    async with session.get(url) as response:
        return await response.json()

async def main() -> None:
    # 创建共享 Session（连接池复用）
    async with aiohttp.ClientSession() as session:

        # 串行请求（低效，等待每个请求完成才发下一个）
        for uid in range(1, 4):
            user = await fetch_user(session, uid)
            print(user["name"])

        # 并发请求（高效，同时发出所有请求）
        tasks = [fetch_user(session, uid) for uid in range(1, 11)]
        users = await asyncio.gather(*tasks)
        print(f"获取了 {len(users)} 个用户")

        # gather 处理部分失败（return_exceptions=True）
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if isinstance(r, Exception):
                print(f"请求失败：{r}")

asyncio.run(main())
```

:::

### 2. Task 与超时控制

::: details Task 与超时示例

```python
import asyncio

async def slow_operation(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"{name} 完成（耗时 {delay}s）"

async def main():
    # 创建 Task（立即调度，不等待）
    task1 = asyncio.create_task(slow_operation("任务A", 1.0), name="task-a")
    task2 = asyncio.create_task(slow_operation("任务B", 2.0), name="task-b")

    # 等待第一个完成（竞速）
    done, pending = await asyncio.wait(
        [task1, task2],
        return_when=asyncio.FIRST_COMPLETED
    )
    for t in done:
        print(f"最快完成：{t.result()}")
    for t in pending:
        t.cancel()  # 取消未完成的任务

    # 超时控制
    try:
        result = await asyncio.wait_for(
            slow_operation("慢任务", 5.0),
            timeout=2.0
        )
    except asyncio.TimeoutError:
        print("操作超时！")

asyncio.run(main())
```

:::

### 3. 异步生成器与上下文管理器

::: details 异步生成器示例

```python
import asyncio

async def async_range(n: int):
    """异步生成器：每步之间模拟异步操作。"""
    for i in range(n):
        await asyncio.sleep(0.01)  # 模拟异步 I/O
        yield i

async def main():
    # 异步 for 循环消费异步生成器
    async for value in async_range(5):
        print(value)

    # 异步推导式
    results = [v async for v in async_range(10) if v % 2 == 0]
    print(results)  # [0, 2, 4, 6, 8]

asyncio.run(main())
```

:::

## 五、threading vs multiprocessing vs asyncio

三种并发方案各有适用场景，选择错误会导致性能反而下降。

| 方案 | 并发模型 | 适用场景 | GIL 影响 |
|------|---------|---------|---------|
| `threading` | 多线程（OS 线程） | I/O 密集型（文件、网络、数据库） | 受限（同一时刻只有一个线程执行 Python 字节码） |
| `multiprocessing` | 多进程 | CPU 密集型（计算、图像处理、机器学习） | 不受限（每个进程有独立 GIL） |
| `asyncio` | 协程（单线程事件循环） | 高并发 I/O（大量网络请求、WebSocket） | 不涉及（单线程） |

::: details 三种方案对比示例

```python
import threading
import multiprocessing
import asyncio
import time

# CPU 密集任务（适合 multiprocessing）
def cpu_task(n: int) -> int:
    return sum(i ** 2 for i in range(n))

# I/O 密集任务（适合 threading 或 asyncio）
def io_task(name: str) -> None:
    time.sleep(1)  # 模拟 I/O 等待
    print(f"{name} 完成")

# threading：I/O 密集场景
threads = [threading.Thread(target=io_task, args=(f"任务{i}",)) for i in range(5)]
for t in threads: t.start()
for t in threads: t.join()  # 等待所有线程完成

# multiprocessing：CPU 密集场景
with multiprocessing.Pool(processes=4) as pool:
    results = pool.map(cpu_task, [1_000_000] * 4)
print(f"总计：{sum(results)}")

# ThreadPoolExecutor / ProcessPoolExecutor（推荐接口）
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

with ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(io_task, f"任务{i}") for i in range(10)]
    # future.result() 获取结果

with ProcessPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(cpu_task, [500_000] * 4))
```

:::

::: warning
Python 的 GIL（全局解释器锁）决定了同一时刻只有一个线程执行 Python 字节码。多线程对 CPU 密集任务没有加速效果，甚至因锁竞争而变慢。CPU 密集任务必须使用 `multiprocessing`。
:::

## 六、类型注解

### 1. typing 模块

Python 3.5+ 引入类型注解，提供静态类型检查（需配合 mypy）和更好的 IDE 支持。

::: details 类型注解示例

```python
from typing import Optional, Union, Any, TypeVar, Generic, Callable, Awaitable
from collections.abc import Sequence, Mapping, Iterator

# 基本注解
def greet(name: str, times: int = 1) -> str:
    return (f"Hello, {name}! " * times).strip()

# Optional（可以是指定类型或 None）
def find_user(user_id: int) -> Optional[dict]:
    # Python 3.10+ 可写 dict | None
    ...

# Union（多种类型之一）
def process(data: Union[str, bytes, list]) -> str:
    # Python 3.10+ 可写 str | bytes | list
    ...

# 泛型
T = TypeVar("T")

def first(items: Sequence[T]) -> Optional[T]:
    return items[0] if items else None

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()


# Python 3.9+ 内置泛型（无需 from typing import List, Dict）
def count_words(text: str) -> dict[str, int]:
    words = text.lower().split()
    return {word: words.count(word) for word in set(words)}

# 回调类型
Handler = Callable[[str, int], bool]

def register_handler(event: str, handler: Handler) -> None:
    ...

# TypedDict：为字典提供结构类型（Python 3.8+）
from typing import TypedDict

class UserProfile(TypedDict):
    name:  str
    age:   int
    email: str

def create_profile(name: str, age: int) -> UserProfile:
    return {"name": name, "age": age, "email": ""}
```

:::

::: tip
类型注解在运行时不做强制检查，仅供 IDE（PyCharm、VS Code）和静态分析工具（mypy、pyright）使用。在 FastAPI 等框架中，类型注解还会被用于自动数据校验和文档生成。
:::
