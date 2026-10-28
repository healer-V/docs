---
title: "集合框架"
tags:
  - Java
  - 集合框架
excerpt: "用订单事件、唯一编号和数量索引建立集合选型模型，区分 Collection 与 Map、遇见顺序与排序、接口能力与修改支持，并将常用实现的成本放回具体操作场景判断。"
date: 2026-09-08
---

# 集合框架 {#集合框架整体模型}

Java 集合框架用接口表达数据关系，用实现决定保存与访问的方式。订单事件需要保留重复和先后顺序，订单编号索引需要唯一键，待处理任务需要明确出队规则；这三类数据即使包含相同编号，也不能任意交换容器。

## 一、接口表达关系，实现承担存储

`Iterable<E>` 提供遍历入口，`Collection<E>` 统一单值集合的大小、包含判断和批量操作；`Map<K, V>` 单独表达键到值的映射，不继承 Collection。Map 的键、值和条目视图能参与集合遍历，但不能把整个 Map 当作单值集合。[Collection 契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collection.html)、[Map 契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html)

Java 21 还通过 Sequenced 系列接口表达确定的遇见顺序。下面只标明关键关系，不列举全部继承边：

| 抽象 | 关键关系 | 适合表达 |
|---|---|---|
| List | 属于 SequencedCollection | 允许重复、按位置访问的序列 |
| Set | 属于 Collection | 唯一元素及成员判断 |
| SequencedSet | 同时属于 Set 和 SequencedCollection | 有确定首尾的唯一元素集合 |
| Queue | 属于 Collection | 按实现规则选择队头 |
| Deque | 同时提供 Queue 与 SequencedCollection 能力 | 双端操作 |
| Map | 独立键值抽象 | 每个键最多关联一个值 |
| SequencedMap | 扩展 Map | 映射条目的确定遇见顺序 |

::: tip 按调用方所需能力声明集合接口

`List<String> values = new ArrayList<>()` 把调用方所需能力与具体存储分开。接口足以表达需求时优先声明接口；若确实需要首尾操作，应声明 Deque 或适当的 Sequenced 接口，而不是先声明 Collection 再到处强转。

:::

## 二、把“有序”拆成具体承诺

插入顺序、访问顺序、比较排序和索引顺序是不同的规则。`LinkedHashMap` 可以按访问顺序调整条目位置；TreeMap 则按键比较排列，两者都能稳定描述顺序，却服务不同问题。

| 业务约束 | 合适起点 | 选错后的结果 |
|---|---|---|
| 记录收到的每个订单事件 | ArrayList | 改用 Set 会丢失重复事件 |
| 去重并保留首次出现顺序 | LinkedHashSet | HashSet 不承诺相同展示顺序 |
| 按订单编号查当前数量 | HashMap | List 查找需逐项扫描；键应保持稳定 |
| 按商品编码做区间查询 | TreeMap / TreeSet | 哈希查找不能直接提供范围导航 |
| 按进入顺序处理任务 | ArrayDeque | PriorityQueue 会按比较规则重新选择队头 |
| 总是处理当前最优先任务 | PriorityQueue | FIFO 无法满足动态优先级 |
| 对外返回稳定结果集合 | 独立副本或快照 | 直接返回内部集合会暴露状态 |

::: warning 遍历结果不能证明顺序契约

PriorityQueue 的队头有比较约束，但整个迭代结果不是排序列表。HashMap、HashSet 当前看起来按某种顺序输出，也不构成可依赖的承诺。顺序必须来自接口或实现的明确契约。

:::

## 三、复杂度只对具体操作成立

令 n 为元素数量。以下是常用实现的结构成本，哈希项以键分布合理为前提，数组尾部添加使用摊销口径；没有测量每次操作的实际耗时。

| 实现 | 关键操作 | 成本与前提 |
|---|---|---|
| ArrayList | get / set | O(1)；按值查找仍为 O(n) |
| ArrayList | 尾部添加 / 中间删除 | 摊销 O(1) / O(n)，扩容和引用移动影响单次成本 |
| LinkedList | 按索引访问 / 已定位游标插入 | O(n) / O(1)，后者不包含最初定位 |
| HashMap、HashSet | 键或成员查找 | 合理哈希分布下通常为 O(1)，不是最坏情况承诺 |
| TreeMap、TreeSet | 键或成员查找 | O(log n)，依赖可用且一致的比较规则 |
| ArrayDeque | 常见首尾操作 | 摊销 O(1)，按值删除需要扫描 |
| PriorityQueue | 入队、出队 / 查看队头 | O(log n) / O(1)，按指定对象删除为 O(n) |

依据分别见 [ArrayList](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html)、[LinkedList](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedList.html)、[HashMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)、[TreeMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html)、[ArrayDeque](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayDeque.html) 与 [PriorityQueue](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/PriorityQueue.html)。

::: tip 把定位成本计入集合选型

订单明细若频繁按索引读取，不能因“链表插入快”选择 LinkedList，然后在循环里反复 get(index)。需要优化时，应先确定输入规模、查找与修改比例、分配量和延迟要求，再测量；小规模演示程序不能证明生产吞吐。

:::

## 四、修改、空值和并发是独立维度

接口声明 add、remove，不代表所有实现都允许修改。固定大小数组视图允许替换却不支持增删，不可修改工厂集合拒绝写入，普通 ArrayList 支持这些操作。只读视图和独立快照的共享关系由[不可变集合与 Sequenced Collections](./09-immutable-sequenced.md)主讲。

空值规则同样需要查具体类型：HashMap 可以保存空值，ArrayDeque 拒绝 null；队列 poll 的 null 返回值又承担“当前无元素”的信号。业务允许空值时，必须设计能区分缺失和空值的查询方式，不能在所有容器上使用一套假设。

::: warning 普通集合方法不自动提供并发保证

普通集合默认不提供本例之外的并发写入保证。fail-fast 仅辅助发现错误，不承担同步；Map 的 compute 名称也不是原子事务声明。并发容器的完整实现归并发章节，本章只明确选型边界。

:::

## 五、同一组订单的四种容器结果

以下独立文件同时保留接收事件、首次出现的编号、当前数量和待处理队列，说明为何四者需要不同结构。所有订单都是本地演示数据；数量覆盖是明确的业务选择，不表示把重复事件聚合为总数量。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看CollectionModelDemo的完整代码

```java
// CollectionModelDemo.java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;

/** 对同一组订单编号选择不同容器，观察重复、顺序与键值语义。 */
public final class CollectionModelDemo {
    /** 静态入口无需创建对象；构造器不产生副作用。 */
    private CollectionModelDemo() {}

    /**
     * 验证集合选型的可观察结果；无返回值，输出局部容器内容。
     * @param args 不使用启动参数
     */
    public static void main(String[] args) {
        List<String> received = new ArrayList<>(List.of("ORD-1002", "ORD-1001", "ORD-1002"));
        Set<String> unique = new LinkedHashSet<>(received);
        Map<String, Integer> quantities = new LinkedHashMap<>();
        quantities.put("ORD-1002", 2);
        Integer previous = quantities.put("ORD-1002", 3);
        Queue<String> pending = new ArrayDeque<>(unique);
        assert received.size() == 3 && unique.size() == 2;
        assert previous == 2 && quantities.size() == 1;
        assert "ORD-1002".equals(pending.poll());
        assert "ORD-1001".equals(pending.peek());
        System.out.println("received=" + received);
        System.out.println("unique=" + unique);
        System.out.println("quantity=" + quantities.get("ORD-1002") + ", previous=" + previous);
        System.out.println("pending=" + pending);
    }
}
```

:::

以下 PowerShell 命令从本篇示例目录执行；需要 JDK 21，无第三方依赖。本例已在 Corretto 21.0.11 上通过无警告编译和断言运行。

```powershell
New-Item -ItemType Directory -Force -Path 'out' | Out-Null
javac -encoding UTF-8 -Xlint:all -Werror -d out CollectionModelDemo.java
if ($LASTEXITCODE -ne 0) { throw '示例编译失败' }
java -ea -cp out CollectionModelDemo
if ($LASTEXITCODE -ne 0) { throw '示例运行失败' }
```

实际输出如下，断言同时检查没有展示的边界：

```text
received=[ORD-1002, ORD-1001, ORD-1002]
unique=[ORD-1002, ORD-1001]
quantity=3, previous=2
pending=[ORD-1001]
```

第一行保留三次接收，第二行只保留两个编号；数量 Map 同键覆盖后返回旧值2并保存3。队列已取走首次出现的 ORD-1002，只剩 ORD-1001。断言验证的是这组容器契约，不证明其适合所有订单系统。

如果业务后来要求统计每个编号的接收次数，应增加计数映射或保留事件后聚合，不能直接把接收列表替换成 Set。若要求按紧急程度处理，应明确排序字段与同级规则，再从 FIFO 切换到优先级队列。这些都是数据语义变化，应连同验证一起调整。
