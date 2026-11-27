---
title: "Java集合面试题"
category: "面试题"
tags:
  - Java
  - 集合
  - HashMap
excerpt: "围绕 ArrayList 与 LinkedList、HashMap 的哈希定位与扩容、ConcurrentHashMap 的并发控制、有序集合和迭代器快速失败等面试题，解释数据结构、复杂度与线程安全边界。"
---

# Java集合面试题

集合题的核心是数据结构决定操作成本。回答时先说明底层结构，再推导查询、插入、删除和扩容的代价，最后讨论并发访问时会出现什么问题。

::: info 版本边界
本篇以 Java 21 的 OpenJDK 实现为准；HashMap、ConcurrentHashMap 的 Java 7 实现只在对比时说明。容量、阈值等数值来自 OpenJDK 源码常量，属于实现细节而非接口规范。
:::

## 一、List 与 Set

List 题先看随机访问和插入位置，Set 题先看去重依据和是否需要顺序。

### 1. ArrayList 与 LinkedList 如何选择？

**ArrayList 基于动态数组，按下标访问为 O(1)；LinkedList 基于双向链表，按下标访问需要遍历。** 多数业务场景应优先选择 ArrayList。

| 操作 | ArrayList | LinkedList |
|------|-----------|------------|
| `get(i)` | O(1) | O(n)，从较近一端遍历 |
| 尾部追加 | 均摊 O(1)，偶尔扩容复制 | O(1) |
| 中间插入删除 | O(n)，需要移动元素 | 定位 O(n)，修改指针 O(1) |
| 内存 | 连续数组，缓存友好 | 每个节点额外保存前后指针 |

“LinkedList 插入快”只在已经持有节点位置（例如迭代器当前位置）时成立；`add(index, e)` 仍要先遍历到该位置。链表节点分散在堆中，CPU 缓存命中率低，实际测量中 ArrayList 在大多数插入场景也不慢。需要队列或双端队列时，`ArrayDeque` 通常比 LinkedList 更合适。

参考：[Java 21 API：ArrayList](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html)。

### 2. ArrayList 如何扩容？

**无参构造的 ArrayList 先持有空数组，第一次添加时容量变为 10；之后容量不足时，新容量约为旧容量的 1.5 倍（`old + (old >> 1)`），再用 `Arrays.copyOf` 复制元素。**

扩容需要分配新数组并复制全部元素，所以已知元素数量时，使用 `new ArrayList<>(expectedSize)` 或 `ensureCapacity()` 可以避免多次复制。`remove` 不会自动缩容，大量删除后可调用 `trimToSize()` 释放多余空间。

::: warning 遍历时删除元素要用迭代器
在增强 `for` 循环中调用 `list.remove(item)` 会修改 `modCount`，下一次迭代检查到不一致时抛出 `ConcurrentModificationException`。应使用 `iterator.remove()` 或 Java 8 起的 `list.removeIf(item -> ...)`。
:::

参考：[OpenJDK：ArrayList 源码](https://github.com/openjdk/jdk21u/blob/master/src/java.base/share/classes/java/util/ArrayList.java)。

### 3. HashSet、LinkedHashSet 和 TreeSet 有什么区别？

**HashSet 基于 HashMap 去重且不保证顺序；LinkedHashSet 额外维护插入顺序；TreeSet 基于红黑树按比较结果排序。**

| 集合 | 底层结构 | 顺序 | 去重依据 | 增删查 |
|------|----------|------|----------|--------|
| `HashSet` | `HashMap` 的键 | 无保证 | `hashCode` + `equals` | 平均 O(1) |
| `LinkedHashSet` | `LinkedHashMap` | 插入顺序 | `hashCode` + `equals` | 平均 O(1) |
| `TreeSet` | `TreeMap` 红黑树 | 比较顺序 | `compareTo` 或 `Comparator` 结果为 0 | O(log n) |

TreeSet 用比较结果判断重复：若 `Comparator` 只按订单金额比较，两笔金额相同但编号不同的订单会被视为同一元素，后一笔无法加入。比较器应与 `equals` 保持一致，或补充次级比较字段。

参考：[Java 21 API：TreeSet](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeSet.html)。

## 二、HashMap

HashMap 题通常沿着“如何定位桶 → 冲突怎么处理 → 何时扩容 → 为什么线程不安全”追问，回答时按这条路径组织。

### 1. HashMap 的 put 流程是怎样的？

**HashMap 由桶数组构成，冲突元素先组成链表，链表过长时转为红黑树。** `put` 时先计算扰动后的哈希，再用 `(n - 1) & hash` 定位桶下标。

1. **计算哈希：** `hash = h ^ (h >>> 16)`，把高 16 位混入低位。容量为 2 的幂时下标只取低位，扰动可减少高位不同、低位相同的键集中冲突。
2. **懒初始化：** 桶数组在第一次 `put` 时创建，默认容量 16。
3. **定位与插入：** 桶为空直接放入；否则依次用 `hash` 和 `equals` 查找相同键，找到则覆盖值，找不到则在链表尾部追加。
4. **树化判断：** 链表长度达到 8 且数组容量不小于 64 时转为红黑树；容量小于 64 时优先扩容。
5. **扩容判断：** 元素数量超过 `容量 × 负载因子`（默认 0.75，即 16 时阈值为 12）后扩容为两倍。

`(n - 1) & hash` 等价于对 n 取模的前提是 n 为 2 的幂，这也是 `new HashMap<>(10)` 实际会被调整为 16 的原因。HashMap 允许一个 `null` 键，它的哈希值按 0 处理。

参考：[OpenJDK：HashMap 源码](https://github.com/openjdk/jdk21u/blob/master/src/java.base/share/classes/java/util/HashMap.java)。

### 2. 为什么树化阈值是 8，扩容时元素如何迁移？

**阈值 8 来自哈希分布的统计：在负载因子 0.75 且哈希良好时，桶内元素数量近似服从泊松分布，长度达到 8 的概率约为 0.00000006，不到千万分之一。** 树化主要防御哈希质量差或恶意构造的冲突，而不是常规路径。

树节点占用空间约为普通节点的两倍，所以树中元素减少到 6 以下时会退化为链表；8 和 6 之间留出间隔，避免在临界点反复转换。

扩容时容量翻倍，每个元素的新下标只取决于哈希值中新增的那一位：`(hash & oldCap) == 0` 的元素留在原下标，否则移动到“原下标 + oldCap”。Java 8 据此把一个桶拆成高低两条链并保持原有顺序，无需重新计算每个元素的哈希。

参考：[OpenJDK：HashMap 实现说明](https://github.com/openjdk/jdk21u/blob/master/src/java.base/share/classes/java/util/HashMap.java)。

### 3. HashMap 为什么线程不安全？

**HashMap 的读写和扩容都没有同步，多线程并发修改会丢失数据，并可能观察到不一致的内部状态。**

两个线程同时向同一个空桶 `put`，都判断桶为空后先后写入，后写的会覆盖先写的；`size++` 也不是原子操作，计数会偏小。Java 7 扩容时链表采用头插法，并发扩容可能形成环形链表，之后 `get` 陷入死循环；Java 8 改为尾插并保持顺序，消除了这种环，但数据丢失问题依然存在。

::: tip 并发场景直接换容器
需要并发读写时使用 `ConcurrentHashMap`；`Collections.synchronizedMap` 对每个方法加同一把锁，并发度低，复合操作（先查后写）仍需外部加锁。
:::

参考：[Java 21 API：HashMap 的同步说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)。

### 4. HashMap、Hashtable 和 LinkedHashMap 有什么区别？

**Hashtable 是 Java 1.0 的同步哈希表，不允许 `null` 键值，新代码不再使用；LinkedHashMap 在 HashMap 基础上用双向链表维护插入顺序或访问顺序。**

LinkedHashMap 构造时传入 `accessOrder = true` 后，每次访问会把节点移到链表尾部；再重写 `removeEldestEntry` 在超过容量时返回 `true`，就能得到一个简单的 LRU 缓存。它不是线程安全的，跨线程共享缓存时仍需加锁或改用 Caffeine 等缓存库。

```java
/** 容量为 maxSize 的 LRU 缓存；超过容量时淘汰最久未访问的条目。 */
class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int maxSize;
    LruCache(int maxSize) { super(16, 0.75f, true); this.maxSize = maxSize; }
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > maxSize; // 返回 true 时删除链表头部的最旧条目
    }
}
```

参考：[Java 21 API：LinkedHashMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html)。

## 三、并发集合

并发集合题要说明锁的粒度、哪些操作是原子的，以及迭代时看到的是什么数据。

### 1. ConcurrentHashMap 如何保证线程安全？

**Java 8 起，ConcurrentHashMap 对空桶使用 CAS 写入，对非空桶只锁住桶的头节点（`synchronized`），读操作基本不加锁。** 锁粒度是单个桶，不同桶的写入可以并行。

| 版本 | 结构 | 并发控制 |
|------|------|----------|
| Java 7 | `Segment` 数组 + 桶数组 | 每个 `Segment` 是一把 `ReentrantLock`，默认 16 段 |
| Java 8+ | 桶数组 + 链表 / 红黑树 | CAS + 桶头节点 `synchronized` + `volatile` 读 |

扩容时多个线程可以协助迁移不同的桶区间，迁移完成的桶放置 `ForwardingNode`，读到它的线程转到新数组查找。`size()` 通过 `baseCount` 加 `CounterCell` 数组分散计数，高并发下返回的是估计值；更推荐用 `mappingCount()` 获取 `long` 结果。

::: warning 单个方法原子，不代表组合操作原子
`if (!map.containsKey(k)) map.put(k, v)` 在并发下仍可能重复写入。应使用 `putIfAbsent`、`computeIfAbsent`、`merge` 等原子复合方法。ConcurrentHashMap 不允许 `null` 键和值，因为并发下无法区分“值为 null”与“键不存在”。
:::

参考：[Java 21 API：ConcurrentHashMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html)。

### 2. fail-fast 与 fail-safe 迭代器有什么区别？

**fail-fast 迭代器发现集合在迭代期间被结构性修改时立即抛出 `ConcurrentModificationException`；fail-safe（弱一致）迭代器不抛异常，但不保证看到最新修改。**

ArrayList、HashMap 的迭代器在创建时记录 `modCount`，每次 `next()` 时比较，不一致就失败。这只是尽力检测错误用法的机制，不能用来保证并发正确性。`CopyOnWriteArrayList` 迭代的是创建迭代器时的数组快照；`ConcurrentHashMap` 的迭代器是弱一致的，可能反映也可能不反映迭代开始后的修改。

参考：[Java 21 API：ConcurrentModificationException](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ConcurrentModificationException.html)。

### 3. CopyOnWriteArrayList 适合什么场景？

**CopyOnWriteArrayList 每次写操作都复制整个数组，读操作无锁访问当前数组。** 它适合读远多于写、元素数量不大的场景，例如监听器列表、配置白名单。

写入时加锁复制新数组、修改后替换引用，所以写的成本是 O(n) 且产生额外内存；频繁写入大列表会造成明显的 GC 压力。读线程拿到的是某一时刻的数组快照，写入后已经开始的遍历看不到新元素，业务上需要接受这种短暂不一致。

参考：[Java 21 API：CopyOnWriteArrayList](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CopyOnWriteArrayList.html)。

### 4. 常见阻塞队列有哪些，如何选择？

**阻塞队列在队列为空时阻塞取元素的线程、队列满时阻塞放元素的线程，是生产者消费者模型和线程池任务队列的基础。**

| 队列 | 结构与容量 | 特点 |
|------|------------|------|
| `ArrayBlockingQueue` | 数组，必须指定容量 | 一把锁控制读写，可选公平 |
| `LinkedBlockingQueue` | 链表，默认容量 `Integer.MAX_VALUE` | 读写两把锁，吞吐较高 |
| `SynchronousQueue` | 不存储元素 | 每个 put 必须等待一个 take |
| `PriorityBlockingQueue` | 堆，无界 | 按优先级出队 |
| `DelayQueue` | 无界 | 元素到期后才能取出，用于延时任务 |

`put`/`take` 会阻塞，`offer`/`poll` 可以立即返回或带超时返回。使用 LinkedBlockingQueue 时应显式设置容量，否则生产速度持续高于消费速度时，队列会堆积到内存耗尽。

参考：[Java 21 API：BlockingQueue](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/BlockingQueue.html)。
