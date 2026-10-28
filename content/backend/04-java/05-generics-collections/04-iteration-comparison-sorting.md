---
title: "迭代、比较与排序"
tags:
  - Java
  - Iterator
  - Comparator
excerpt: "解释 Iterable、Iterator 与 ListIterator 的游标和修改约束，区分自然顺序、外部比较和稳定排序，并用实际异常与整数溢出反例核对 fail-fast 和比较契约的边界。"
date: 2026-09-08
---

# 迭代、比较与排序

迭代负责决定如何逐个访问元素，比较负责定义元素之间的先后关系，排序则使用这种关系重新排列序列。它们不是同一个协议：集合能被遍历，不代表元素可比较；列表能排序，也不代表它始终维持排序状态。

## 一、迭代位置与修改权限

迭代过程既有“下一项在哪里”的位置状态，也有“现在允许执行哪种修改”的操作状态。删除必须与当前迭代器协调，双向游标还要区分插入位置与最近返回的元素。

### 1. 迭代入口与游标 {#一、iterable-提供入口-iterator-保存当前位置}

对 Iterable 对象使用增强 for 时，语言通过迭代器推进遍历。数组也支持增强 for，但属于语言的专门规则，数组并没有因此实现 Iterable。一个集合可以创建多份迭代器，每份保存自己的遍历位置。

Iterator 的 next 在返回当前元素时推进位置，hasNext 只判断是否还有元素。循环不能反复调用 next 当作“查看当前值”，否则会跳过数据；没有剩余元素时 next 抛出 NoSuchElementException。[Iterator API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Iterator.html)

| 调用阶段 | 合法操作与状态变化 | 错误风险 |
|---|---|---|
| 创建后，尚未 next | hasNext 判断，next 获取第一项 | 不能直接 remove |
| 一次 next 后 | 可处理返回值；支持删除的迭代器可 remove 一次 | 重复 remove 同一项违反状态约束 |
| remove 后 | next 继续移动 | 不能把删除操作当作重新读取 |
| 遍历结束 | hasNext 返回 false | 再 next 会越过边界 |

::: info 迭代器删除仍是可选能力

删除支持是可选能力。不可修改列表的迭代器仍可读取，但不会因为采用 iterator.remove 就获得修改权限。

:::

### 2. 结构修改与 fail-fast 的证据边界 {#二、结构修改与-fail-fast-的证据边界}

ArrayList 的增加、删除等结构修改会影响既有迭代器的预期状态；当前迭代器自己的 remove 会同步其状态，因此是删除最近返回元素的正确路径。增强 for 隐藏了迭代器变量，直接对正在遍历的列表 remove 很难维持这层关系。

::: warning fail-fast 异常不证明发生多线程问题

本例刻意先创建迭代器、读取一项，再通过列表 add，最后调用 iterator.next，实际得到 ConcurrentModificationException。这里没有第二个线程，异常名称不能作为“发生多线程问题”的证明。fail-fast 是尽力检测，不能依赖所有违规修改都抛异常，更不能用于保证业务正确性。[ArrayList 迭代器约束](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html)

:::

修改方案应围绕目的选择：只删除匹配项时使用当前迭代器删除；需要批量增删时收集待改动内容后统一修改；需要独立读取结果时明确复制。replace 元素与修改结构的影响也不同，应遵循具体集合和视图契约。

### 3. ListIterator 的游标位于元素之间 {#三、listiterator-的游标位于元素之间}

ListIterator 支持向前和向后移动，游标概念是“两个元素之间的位置”，不是某个永远固定的当前元素。listIterator(1) 位于索引0与1之间；add 将元素插入游标之前，随后的 next 仍返回原先位于游标后面的元素。

set 替换最近一次 next 或 previous 返回的元素，不改变大小；add 和 remove 会使“最近可替换元素”的状态失效，不能紧接着无依据地 set。这样的修改规则让一份迭代器能够协调位置和结构变化。具体状态限制见 [ListIterator API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ListIterator.html)。

示例在 ORD-1001 和 ORD-1003 之间插入 ORD-1002，然后 next 取得 ORD-1003，再用 set 替换为 ORD-1004。它明确演示了“插入点”和“最近返回元素”是两个概念，也避免在 LinkedList 上反复按索引定位。

## 二、比较关系与排序结果

排序先依赖一套一致的比较关系，再按该关系排列元素。业务的同级顺序还需要单独声明；比较器返回零与对象相等、稳定排序与固定业务顺序都不是同一个承诺。

### 1. 自然顺序与比较器 {#四、comparable-与-comparator-决定比较含义}

Comparable 属于类型的自然顺序，例如完整商品编码的字典序；Comparator 则是外部策略，同一个订单可以按优先级、金额或时间分别排列。临时报表规则不应反过来改变订单的领域相等性。

比较返回负数、零或正数，只表示先后符号，不保证恰好是 -1、0、1。有效规则需要满足符号反对称、传递性，以及“比较为零的两个元素相对第三者具有相同符号”的一致性。[Comparator 比较契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html)

| 错误规则 | 具体反例 | 修复 |
|---|---|---|
| 用两个整数相减比较 | MAX_VALUE 减 -1 溢出为负数，错误地把大值放在小值之前 | 使用 Integer.compare 或 Long.compare |
| 优先级采用循环偏好 | 规则同时规定 A先于B、B先于C、C先于A，没有线性顺序 | 定义可传递的排序键和后备键 |
| 只比较部分字段却把零当成对象相等 | 两个不同订单同优先级时比较为零 | List 排序可按此分组；TreeSet 的去重含义必须另行评估 |

::: warning 排序未报错不证明比较器正确

排序库不负责修复错误比较器，也不保证每种违反契约的输入都会被检测并抛异常。应直接验证比较关系，而不是把“排序没报错”当作契约通过。

:::

### 2. 稳定排序 {#五、稳定排序保留的是比较相等项的相对次序}

List.sort 会修改支持排序的列表，并保证比较为零的元素保留原先的相对顺序。这个“相等”来自比较器，不一定来自 equals。示例只按 priority 比较，所以同为2的 ORD-1002 和 ORD-1003 排序后仍保持原顺序。[List.sort](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html#sort(java.util.Comparator))

::: tip 用后备比较键补足业务次序

稳定排序无法创造原始输入中不存在的业务次序。输入若来自无顺序保证的容器，仅依靠稳定性仍不能获得可复现的同级展示；此时应增加订单号或入队序号作为后备键。PriorityQueue 不继承 List.sort 的稳定性承诺，需独立设计。

:::

## 三、验证遍历修改与排序契约

下面的完整程序使用显式比较器类，不依赖 Lambda；方法引用和比较器组合 API 的写法由函数式处理章节承担。源码同时提供一个与值相等一致的 ProductCode 自然顺序。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看IterationOrderingDemo的完整代码

```java
// IterationOrderingDemo.java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.ListIterator;

/** 验证迭代器状态、稳定排序与比较器错误，不依赖 Lambda 或 Stream。 */
public final class IterationOrderingDemo {
    /** 静态示例不需要实例；构造器不产生副作用。 */
    private IterationOrderingDemo() {}

    /**
     * 运行迭代与排序断言；无返回值，错误模式保留真实异常。
     * @param args 空参数正常运行；concurrent 越过迭代器修改；remove-before-next 非法删除
     */
    public static void main(String[] args) {
        List<String> statuses = new ArrayList<>(List.of("PAID", "CANCELLED", "CREATED"));
        Iterator<String> iterator = statuses.iterator();
        if (args.length > 0) {
            switch (args[0]) {
                case "concurrent" -> {
                    iterator.next();
                    statuses.add("SHIPPED");
                    iterator.next();
                }
                case "remove-before-next" -> iterator.remove();
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        while (iterator.hasNext()) {
            if ("CANCELLED".equals(iterator.next())) {
                iterator.remove();
            }
        }
        assert statuses.equals(List.of("PAID", "CREATED"));
        List<String> edits = new LinkedList<>(List.of("ORD-1001", "ORD-1003"));
        ListIterator<String> cursor = edits.listIterator(1);
        cursor.add("ORD-1002");
        assert "ORD-1003".equals(cursor.next());
        cursor.set("ORD-1004");
        assert edits.equals(List.of("ORD-1001", "ORD-1002", "ORD-1004"));

        List<Order> orders = new ArrayList<>(List.of(
                new Order("ORD-1002", 2), new Order("ORD-1001", 1), new Order("ORD-1003", 2)));
        orders.sort(new PriorityOrder());
        assert orders.get(0).number().equals("ORD-1001");
        assert orders.get(1).number().equals("ORD-1002");
        assert orders.get(2).number().equals("ORD-1003");
        assert new ProductCode("P-1001").compareTo(new ProductCode("P-1002")) < 0;
        // 故意使用相减展示溢出；真实比较器使用 Integer.compare。
        int overflow = Integer.MAX_VALUE - (-1);
        assert overflow < 0 && Integer.compare(Integer.MAX_VALUE, -1) > 0;
        System.out.println("remaining=" + statuses);
        System.out.println("cursor edits=" + edits);
        System.out.println("sorted=" + orders);
        System.out.println("overflow reverses order=" + (overflow < 0));
    }

    /**
     * 以编号和优先级描述待处理订单，数字越小优先级越高。
     * @param number 非 null 演示订单编号
     * @param priority 用于排序的优先级整数
     */
    record Order(String number, int priority) {}

    /** 仅按优先级比较；同级订单的原相对顺序由 List.sort 的稳定性保留。 */
    static final class PriorityOrder implements Comparator<Order> {
        /**
         * 比较两个订单的优先级，不通过相减实现比较。
         * @param left 非 null 左订单
         * @param right 非 null 右订单
         * @return 负数表示左订单优先，零表示同级，正数表示右订单优先
         */
        @Override
        public int compare(Order left, Order right) {
            return Integer.compare(left.priority(), right.priority());
        }
    }

    /**
     * 以完整商品编码作为自然顺序，与 Record 的值相等定义一致。
     * @param value 非 null 商品编码文本
     */
    record ProductCode(String value) implements Comparable<ProductCode> {
        /**
         * 按编码字典序比较；调用方不得传入 null。
         * @param other 非 null 商品编码
         * @return 负数、零或正数，分别表示之前、相等或之后
         */
        @Override
        public int compareTo(ProductCode other) {
            return value.compareTo(other.value);
        }
    }
}
```

:::

以下 PowerShell 命令从本篇示例目录执行；需要 JDK 21，无第三方依赖。本例已在 Corretto 21.0.11 上通过无警告编译和断言运行。

```powershell
New-Item -ItemType Directory -Force -Path 'out' | Out-Null
javac -encoding UTF-8 -Xlint:all -Werror -d out IterationOrderingDemo.java
if ($LASTEXITCODE -ne 0) { throw '示例编译失败' }
java -ea -cp out IterationOrderingDemo
if ($LASTEXITCODE -ne 0) { throw '示例运行失败' }
```

实际输出如下，断言同时检查没有展示的边界：

```text
remaining=[PAID, CREATED]
cursor edits=[ORD-1001, ORD-1002, ORD-1004]
sorted=[Order[number=ORD-1001, priority=1], Order[number=ORD-1002, priority=2], Order[number=ORD-1003, priority=2]]
overflow reverses order=true
```

::: info 溢出输出来自故意设置的反例

最后一行是故意执行错误整数相减后观察到的符号，不是生产比较器实现。真实 PriorityOrder 使用 Integer.compare，避免这一溢出路径。

:::

## 四、复现非法修改并恢复正确遍历 {#六、复现非法修改并恢复正确遍历}

完成正常编译后，分别执行两个错误入口。每个进程独立创建局部数据，不会污染另一个验证。

```powershell
java -cp out IterationOrderingDemo concurrent
if ($LASTEXITCODE -ne 1) { throw '结构修改没有按预期失败' }
java -cp out IterationOrderingDemo remove-before-next
if ($LASTEXITCODE -ne 1) { throw '非法删除没有按预期失败' }
```

第一种实际抛出 ConcurrentModificationException，定位到外部 add 后的 next；第二种实际抛出 IllegalStateException，定位到尚未 next 的 remove。修复分别是使用当前迭代器协调修改、先读取再删除。重新运行无参数入口会得到正确结果；捕获异常后继续使用同一失效迭代器不是恢复方案。
