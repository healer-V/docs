---
title: "Java 集合框架"
category: "后端 · Java"
tags:
  - Java
  - 集合
  - ArrayList
  - HashMap
date: 2026-03-17
---

# Java 集合框架

Java 集合框架（Java Collections Framework）提供了一套标准化的数据结构接口和实现类，涵盖列表、集合、队列、映射等常用容器，是日常开发中使用频率最高的 API 之一。

## 一、Collection 体系

### 1. 整体结构

`Collection` 是单值容器的根接口，下分三大子接口：

```
Collection
├── List      有序、可重复
│   ├── ArrayList
│   ├── LinkedList
│   └── Vector（已过时）
├── Set       无序（部分有序）、不可重复
│   ├── HashSet
│   ├── LinkedHashSet
│   └── TreeSet
└── Queue     队列/双端队列
    ├── LinkedList
    ├── ArrayDeque
    └── PriorityQueue
```

### 2. List 接口

`List` 保证元素的插入顺序，允许重复，支持按索引随机访问。

::: details List 常用操作示例

```java
import java.util.*;

List<String> fruits = new ArrayList<>();

// 增
fruits.add("苹果");
fruits.add("香蕉");
fruits.add(0, "橙子"); // 在索引 0 处插入

// 删
fruits.remove("香蕉");     // 按值删除
fruits.remove(0);          // 按索引删除

// 改
fruits.set(0, "葡萄");     // 替换索引 0 的元素

// 查
String first = fruits.get(0);
int idx = fruits.indexOf("葡萄");
boolean has = fruits.contains("苹果");

// 遍历（推荐 for-each 或 forEach）
fruits.forEach(System.out::println);

// 排序
List<Integer> nums = new ArrayList<>(Arrays.asList(3, 1, 4, 1, 5));
Collections.sort(nums);                          // 升序
nums.sort(Comparator.reverseOrder());            // 降序
```

:::

### 3. Set 接口

`Set` 不允许重复元素，添加时自动去重。

::: details Set 常用操作示例

```java
Set<String> set = new HashSet<>();
set.add("Java");
set.add("Python");
set.add("Java"); // 重复，添加失败，set.size() 仍为 2

// 集合运算
Set<String> setA = new HashSet<>(Arrays.asList("A", "B", "C"));
Set<String> setB = new HashSet<>(Arrays.asList("B", "C", "D"));

// 交集
Set<String> intersection = new HashSet<>(setA);
intersection.retainAll(setB); // {B, C}

// 并集
Set<String> union = new HashSet<>(setA);
union.addAll(setB); // {A, B, C, D}

// 差集
Set<String> diff = new HashSet<>(setA);
diff.removeAll(setB); // {A}
```

:::

### 4. Queue 接口

`Queue` 遵循先进先出（FIFO）原则，常用于任务排队、消息缓冲等场景。

| 操作 | 抛异常版本 | 返回特殊值版本 |
|------|-----------|---------------|
| 入队 | `add(e)` | `offer(e)` |
| 出队 | `remove()` | `poll()` |
| 查头 | `element()` | `peek()` |

::: details Queue 与 Deque 示例

```java
// 双端队列（可作栈或队列使用）
Deque<String> deque = new ArrayDeque<>();
deque.offerFirst("A"); // 头部入队
deque.offerLast("B");  // 尾部入队
deque.pollFirst();     // 头部出队

// 优先队列（按自然顺序或 Comparator 排序）
PriorityQueue<Integer> pq = new PriorityQueue<>();
pq.offer(5);
pq.offer(1);
pq.offer(3);
System.out.println(pq.poll()); // 输出：1（最小值优先）
```

:::

## 二、Map 体系

### 1. Map 接口

`Map` 存储键值对（key-value），键不可重复，值可以重复。

```
Map
├── HashMap          无序，允许 null 键/值
├── LinkedHashMap    维护插入顺序
├── TreeMap          按键自然排序或 Comparator 排序
└── Hashtable        线程安全（已过时，被 ConcurrentHashMap 替代）
```

### 2. HashMap 常用操作

::: details HashMap 操作示例

```java
Map<String, Integer> scores = new HashMap<>();

// 增/改
scores.put("Alice", 95);
scores.put("Bob", 88);
scores.putIfAbsent("Alice", 100); // 键已存在则不覆盖

// 查
int aliceScore = scores.get("Alice");          // 95
int defaultVal = scores.getOrDefault("Eve", 0); // 键不存在返回默认值 0

// 删
scores.remove("Bob");

// 遍历
for (Map.Entry<String, Integer> entry : scores.entrySet()) {
    System.out.println(entry.getKey() + " -> " + entry.getValue());
}

// Java 8+ 合并操作
scores.merge("Alice", 5, Integer::sum); // Alice 的分数 +5

// 统计词频典型写法
String[] words = {"apple", "banana", "apple", "cherry", "banana", "apple"};
Map<String, Integer> freq = new HashMap<>();
for (String word : words) {
    freq.merge(word, 1, Integer::sum);
}
// 结果：{apple=3, banana=2, cherry=1}
```

:::

## 三、ArrayList vs LinkedList

两者都实现了 `List` 接口，底层数据结构不同，适用场景各异。

| 对比项 | ArrayList | LinkedList |
|--------|-----------|------------|
| 底层结构 | 动态数组 | 双向链表 |
| 随机访问（get/set） | O(1) | O(n) |
| 头部插入/删除 | O(n)（需移位） | O(1) |
| 尾部插入 | O(1)（均摊） | O(1) |
| 中间插入/删除 | O(n) | O(n)（查找） + O(1)（操作） |
| 内存占用 | 较小（连续数组） | 较大（每个节点额外存两个指针） |
| 适用场景 | 频繁随机读取 | 频繁头尾操作、实现栈/队列 |

::: tip
绝大多数情况下优先选择 `ArrayList`。只有在确定需要频繁在头部插入/删除，且列表较大时，才考虑 `LinkedList`。
:::

## 四、HashSet vs TreeSet

| 对比项 | HashSet | TreeSet |
|--------|---------|---------|
| 底层结构 | HashMap | 红黑树 |
| 元素顺序 | 无序 | 按自然顺序或 Comparator 排序 |
| 增删查 | O(1)（均摊） | O(log n) |
| null 元素 | 允许一个 | 不允许（排序无法比较 null） |
| 适用场景 | 快速去重、成员检测 | 需要排序的唯一元素集合 |

`LinkedHashSet` 在 `HashSet` 基础上维护插入顺序，性能介于两者之间，适合需要保持插入顺序且去重的场景。

## 五、HashMap 原理

### 1. 数据结构演进

- **Java 7**：数组 + 链表（拉链法解决哈希冲突）
- **Java 8+**：数组 + 链表 + 红黑树（链表长度 ≥ 8 且数组长度 ≥ 64 时，链表转为红黑树）

### 2. 核心参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 初始容量 | 16 | 底层数组大小，必须是 2 的幂 |
| 负载因子 | 0.75 | 元素数量超过 `容量 × 负载因子` 时扩容 |
| 扩容倍数 | 2 | 每次扩容为原来的 2 倍 |
| 树化阈值 | 8 | 链表长度 ≥ 8 时考虑转为红黑树 |
| 退化阈值 | 6 | 红黑树节点数 ≤ 6 时退化为链表 |

### 3. put 流程

```
put(key, value)
  ↓
计算 key.hashCode()，再进行扰动运算得到 hash
  ↓
定位数组下标：index = hash & (capacity - 1)
  ↓
该槽位为空 → 直接放入
该槽位不为空 → 遍历链表/红黑树
  ↓
  找到相同 key（equals 为 true）→ 更新 value
  未找到 → 追加到链表尾部（Java 8 尾插法）
  ↓
检查是否需要树化 / 扩容
```

::: warning
在多线程环境下，`HashMap` 不是线程安全的。并发场景请使用 `ConcurrentHashMap`，或通过 `Collections.synchronizedMap()` 包装（性能较差）。
:::

## 六、ConcurrentHashMap

`ConcurrentHashMap` 是线程安全的高性能哈希表，Java 8 以后放弃了分段锁，改用 CAS + `synchronized` 锁住单个桶头节点，大幅提升并发性能。

::: details ConcurrentHashMap 使用示例

```java
import java.util.concurrent.*;

ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

// 原子操作：不存在则插入
map.putIfAbsent("count", 0);

// 原子累加（推荐代替 get + put）
map.compute("count", (k, v) -> v == null ? 1 : v + 1);

// 并发场景下的词频统计
map.merge("java", 1, Integer::sum);

// 批量操作（Java 8+，并行处理）
map.forEach(2, (k, v) ->
    System.out.println(k + "=" + v)); // 并行阈值为 2
```

:::

| 特性 | HashMap | ConcurrentHashMap |
|------|---------|-------------------|
| 线程安全 | 否 | 是 |
| null 键/值 | 允许 | 不允许 |
| 锁粒度 | — | 桶头节点级别 |
| 读操作加锁 | — | 不加锁（volatile 读） |

## 七、Collections 工具类

`java.util.Collections` 提供了一系列操作集合的静态工具方法。

::: details Collections 工具方法示例

```java
List<Integer> list = new ArrayList<>(Arrays.asList(3, 1, 4, 1, 5, 9, 2, 6));

Collections.sort(list);                        // 升序排序
Collections.reverse(list);                     // 反转
Collections.shuffle(list);                     // 随机打乱
Collections.swap(list, 0, 1);                  // 交换元素

int max = Collections.max(list);               // 最大值
int min = Collections.min(list);               // 最小值
int freq = Collections.frequency(list, 1);     // 元素出现次数

// 创建不可变集合（Java 9+ 推荐用 List.of/Map.of）
List<String> immutable = Collections.unmodifiableList(list);

// 线程安全包装（性能不佳，并发优先用 ConcurrentHashMap）
List<String> syncList = Collections.synchronizedList(new ArrayList<>());
```

:::

## 八、泛型基础

泛型让集合在编译期检查元素类型，避免运行时 `ClassCastException`。

### 1. 泛型类与方法

::: details 泛型示例

```java
// 泛型类
public class Pair<A, B> {
    private final A first;
    private final B second;

    public Pair(A first, B second) {
        this.first  = first;
        this.second = second;
    }

    public A getFirst()  { return first; }
    public B getSecond() { return second; }
}

// 泛型方法
public static <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}

// 使用
Pair<String, Integer> pair = new Pair<>("Alice", 25);
System.out.println(max(3, 7));       // 7
System.out.println(max("apple", "banana")); // banana
```

:::

### 2. 通配符

| 语法 | 含义 | 适用场景 |
|------|------|---------|
| `<?>` | 未知类型 | 只读，不关心具体类型 |
| `<? extends T>` | T 或 T 的子类（上界） | 读取数据（生产者） |
| `<? super T>` | T 或 T 的父类（下界） | 写入数据（消费者） |

::: tip PECS 原则
**Producer Extends, Consumer Super**：从集合中读取数据时用 `extends`，向集合写入数据时用 `super`。
:::
