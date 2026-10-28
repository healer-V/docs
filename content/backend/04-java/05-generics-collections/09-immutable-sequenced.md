---
title: "集合可变性与顺序"
tags:
  - Java
  - 集合
  - Java 21
excerpt: "区分不可修改视图、独立结构快照和浅不可变，说明工厂集合的空值与重复限制，并用 Java 21 的首尾、逆序视图和条目快照验证有序集合接口的实际边界。"
date: 2026-09-08
---


# 集合可变性与顺序 {#不可变集合与-sequenced-collections}

“不能通过这个引用修改集合”与“数据以后不会变化”是两种承诺。不可修改视图仍可观察源集合的变化，独立结构快照也可能共享可变元素。Sequenced Collections则解决确定遇见顺序的首尾访问，它不会自动改变集合的可修改性或元素可变性。


## 一、可修改性与共享关系 {#一、把可修改性、结构共享与元素共享分开}

`Collections.unmodifiableList(source)` 通过包装限制调用方写入，读取仍委托给source；`List.copyOf(source)` 提供不受源列表后续结构变化影响的结果。两者都不递归复制元素对象。[Collections.unmodifiableList](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html#unmodifiableList(java.util.List))

| 形式 | 经结果引用增删或替换 | 源列表后续结构变化 | 元素内部状态 |
|---|---|---|---|
| new ArrayList<>(source) | 支持 | 不同步 | 仍共享元素引用 |
| Collections.unmodifiableList(source) | 不支持 | 读取可见源变化 | 仍共享元素引用 |
| List.copyOf(source) | 不支持 | 不同步 | 仍共享元素引用 |
| 复制成不可变领域值后再封装 | 依外层集合契约 | 可建立独立结构 | 由领域值的字段保证 |

例如订单页码结果希望固定下来，应该复制而非仅包装内部List；管理页面希望实时读取内部列表又禁止调用方增删，则可以选择只读视图。两者是不同接口契约，没有脱离场景的统一替代关系。

::: warning 结构快照仍然可能共享可变元素

元素是StringBuilder时，即使列表来自copyOf，外部仍能append同一个对象，结果的可见文本也随之变化。“深不可变”需要对元素及其关联对象建立不可变约束；给最外层集合增加一层包装并不足够。

:::


## 二、集合工厂的输入约束 {#二、of-和-copyof-不保留所有输入特征}

Java 21中的工厂集合禁止null，并对重复输入采用不同规则。工厂返回的具体实现类和对象身份不是调用方应依赖的内容；copyOf也不保证每次新分配对象，核心承诺是结果行为。

| 工厂 | 重复输入 | 顺序与限制 |
|---|---|---|
| List.of / List.copyOf | 保留重复元素 | 保留列表顺序，拒绝null |
| Set.of | 重复元素抛IllegalArgumentException | 不承诺输入顺序 |
| Set.copyOf | 输入Collection可包含重复，相等元素只保留一份 | 不承诺保留哪一个相等实例或输入顺序 |
| Map.of / Map.ofEntries | 重复键抛IllegalArgumentException | 拒绝null键和值，不承诺输入顺序 |
| Map.copyOf | 源Map已有唯一键 | 保留映射内容，拒绝null键和值，不承诺输入顺序 |

具体契约见[List工厂](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html#unmodifiable)、[Set工厂](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html#unmodifiable)和[Map工厂](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html#unmodifiable)。

::: tip 稳定顺序与不可修改性需要同时设计

需要稳定有序且不可修改的Set时，可先用LinkedHashSet复制有序输入，再以 `Collections.unmodifiableSequencedSet` 包装，并控制对新底层集合的写入引用。仅用Set.copyOf不能同时承诺“保留输入顺序”；通过包装保留顺序也不意味着元素被深复制。

:::


## 三、有序集合的首尾、逆序与快照

首尾 API 统一访问位置，逆序视图改变观察方向，条目快照固定一次读取的键值关系。三者都与顺序有关，但对原集合修改的传播方式不同，应分别判断。


### 1. Sequenced 接口与首尾顺序 {#三、sequenced-接口统一确定的首尾顺序}

Java 21引入的SequencedCollection表示具有确定遇见顺序的集合，提供首尾获取、添加、删除及reversed视图。顺序可以来自位置、插入、访问或比较规则；“有确定顺序”不等于“能随意把元素放到任意位置”。[SequencedCollection API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SequencedCollection.html)

| 接口 | 核心关系 | 返回与修改边界 |
|---|---|---|
| SequencedCollection | 扩展Collection，List和Deque实现对应能力 | getFirst/getLast在空集合上抛异常；首尾写入是可选操作 |
| SequencedSet | 同时是Set和SequencedCollection | 元素仍唯一，集合相等性不取决于顺序 |
| SequencedMap | 扩展Map，条目具有确定遇见顺序 | firstEntry/lastEntry空时返回null；poll方法取出并删除 |

LinkedHashSet的addFirst／addLast会把已有元素移到指定端，不会增加重复项；普通add与这种显式重定位不同。TreeSet按比较关系决定位置，不能支持任意addFirst／addLast，否则会破坏排序不变量。它仍能提供首尾读取和可支持的删除。

::: info 确定首尾顺序不等于支持随机访问

这些接口没有把所有集合变成随机访问列表，SequencedSet仍没有get(index)。应根据实际需要声明接口，避免为了调用首尾方法把对象强转成某个具体实现。[SequencedSet](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SequencedSet.html)、[SequencedMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SequencedMap.html)

:::


### 2. reversed 是另一种顺序视图 {#四、reversed-是另一种顺序视图}

reversed表达相反的遇见顺序，不是将原集合原地倒置，也不是天然独立的副本。本例的ArrayList逆序视图在首端加入ORD-1004，实际会加到原列表尾端；原列表与视图仍指向同一组元素关系。

接口规定受支持的视图修改会回写底层集合，但源端其他修改是否可见还应查具体实现，不能把某一实现的动态可见性扩大到所有SequencedCollection。需要与源彻底分离的当前顺序时，可以显式复制所需视图，再决定是否封装为不可修改结果。

Map的reversed会反转条目遇见顺序，连同有序键、值、条目视图的观察方向一起变化。通过逆序Map的pollFirstEntry删除的是原Map的最后一个条目，而不是原Map最早的条目；涉及访问顺序LinkedHashMap时，还要把访问引起的位置变化纳入判断。

### 3. 条目快照与关联条目不是同一对象契约 {#五、条目快照与关联条目不是同一对象契约}

SequencedMap的firstEntry和lastEntry返回条目快照：后续修改Map不会自动更新该条目的键值关系，该条目也不支持setValue。pollFirstEntry和pollLastEntry返回移除时的条目快照。这里的快照依然是键和值引用的浅层关系，不保证键值对象内部不可变。

::: warning 条目快照与关联条目不能混用

这与[Map关联视图](./07-map.md)中的entrySet条目不同。遍历某些可修改Map得到的条目允许setValue回写，不能凭二者都实现Map.Entry就认为操作相同。需要更新原Map时，用明确的Map修改API；需要保存读取时的值，则保存快照或领域值对象。

:::


## 四、视图、快照与首尾的完整验证 {#六、视图、快照与首尾的完整验证}

以下完整程序在Java 21上运行，验证只读视图、结构快照、StringBuilder共享、逆序写回、Set重定位和Map逆序删除。订单编号、状态文本和商品数量均为本地演示数据。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看SequencedViewsDemo的完整代码

```java
// SequencedViewsDemo.java
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.SequencedCollection;
import java.util.SequencedMap;
import java.util.SequencedSet;
import java.util.Set;
import java.util.TreeSet;

/** 在 Java 21 上区分只读视图、独立结构快照、浅复制和首尾顺序视图。 */
public final class SequencedViewsDemo {
    /** 静态示例无需实例；构造器不产生副作用。 */
    private SequencedViewsDemo() {}

    /**
     * 运行共享与首尾行为断言；无返回值，失败模式直接抛出契约异常。
     * @param args 空参数正常；readonly 修改只读集合；sorted-position 强制排序集合首位；empty 读取空集合首项
     */
    public static void main(String[] args) {
        List<String> source = new ArrayList<>(List.of("ORD-1001", "ORD-1002"));
        List<String> view = Collections.unmodifiableList(source);
        List<String> snapshot = List.copyOf(source);
        if (args.length > 0) {
            switch (args[0]) {
                case "readonly" -> view.add("ORD-1003");
                case "sorted-position" -> new TreeSet<String>().addFirst("P-1001");
                case "empty" -> List.of().getFirst();
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        source.add("ORD-1003");
        assert view.size() == 3 && snapshot.size() == 2;
        List<StringBuilder> mutableElements = new ArrayList<>();
        mutableElements.add(new StringBuilder("CREATED"));
        List<StringBuilder> shallow = List.copyOf(mutableElements);
        mutableElements.getFirst().append("-PAID");
        assert shallow.getFirst().toString().equals("CREATED-PAID");
        assert Set.copyOf(List.of("P-1001", "P-1001")).size() == 1;

        SequencedCollection<String> backwards = source.reversed();
        backwards.addFirst("ORD-1004");
        assert source.getLast().equals("ORD-1004");
        assert backwards.getFirst().equals("ORD-1004");
        SequencedSet<String> codes = new LinkedHashSet<>(List.of("P-1001", "P-1002"));
        codes.addFirst("P-1002");
        assert new ArrayList<>(codes).equals(List.of("P-1002", "P-1001"));
        SequencedMap<String, Integer> stocks = new LinkedHashMap<>();
        stocks.putLast("P-1001", 1);
        stocks.putFirst("P-1002", 2);
        Map.Entry<String, Integer> first = stocks.firstEntry();
        assert first.getKey().equals("P-1002");
        Map.Entry<String, Integer> removed = stocks.reversed().pollFirstEntry();
        assert removed.getKey().equals("P-1001") && stocks.size() == 1;
        System.out.println("view size=" + view.size() + ", snapshot size=" + snapshot.size());
        System.out.println("shallow element=" + shallow.getFirst());
        System.out.println("reverse first=" + backwards.getFirst() + ", source last=" + source.getLast());
        System.out.println("repositioned=" + codes);
        System.out.println("map first=" + first + ", removed from reverse=" + removed);
    }
}
```

:::

从本篇示例目录执行以下PowerShell命令，无外部依赖。本例已在Corretto 21.0.11上通过无警告编译及断言运行，Java 8的替代方案属于维护迁移章节。

```powershell
New-Item -ItemType Directory -Force -Path 'out' | Out-Null
javac -encoding UTF-8 -Xlint:all -Werror -d out SequencedViewsDemo.java
if ($LASTEXITCODE -ne 0) { throw '示例编译失败' }
java -ea -cp out SequencedViewsDemo
if ($LASTEXITCODE -ne 0) { throw '示例运行失败' }
```

实际输出如下。源列表先添加一项，又通过逆序视图添加一项，因此最终只读视图size为4，独立结构快照仍为2。

```text
view size=4, snapshot size=2
shallow element=CREATED-PAID
reverse first=ORD-1004, source last=ORD-1004
repositioned=[P-1002, P-1001]
map first=P-1002=2, removed from reverse=P-1001=1
```

StringBuilder变化证明元素仍共享；逆序首项与原列表尾项一致证明写入方向；Map逆序删除移除了原来最后的P-1001。示例中的断言还验证Set.copyOf能接收重复输入，它没有沿用Set.of的重复拒绝规则。


## 五、可选修改与空集合的失败边界 {#七、可选修改与空集合的失败边界}

完成编译后，分别运行三种错误模式，均预期退出1。

```powershell
java -cp out SequencedViewsDemo readonly
if ($LASTEXITCODE -ne 1) { throw '只读修改未按预期失败' }
java -cp out SequencedViewsDemo sorted-position
if ($LASTEXITCODE -ne 1) { throw '排序位置修改未按预期失败' }
java -cp out SequencedViewsDemo empty
if ($LASTEXITCODE -ne 1) { throw '空集合读取未按预期失败' }
```

| 模式 | 本机异常 | 约束与处理 |
|---|---|---|
| readonly | UnsupportedOperationException | 只读包装禁止add；需要独立编辑时先复制 |
| sorted-position | UnsupportedOperationException | TreeSet不能人为指定首位；使用普通add维持排序 |
| empty | NoSuchElementException | 空List无首项；先确认非空，或按业务返回缺失结果 |

三个异常分别来自不同约束，不能都归因为“集合不可变”。本例在独立进程中创建局部数据，进程退出即结束故障；示例没有验证跨线程发布、并发一致性或任意领域对象的深复制。
