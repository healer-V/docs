---
title: "Map"
tags:
  - Java
  - Map
  - HashMap
excerpt: "用商品库存映射说明键唯一性、空值与缺失、计算式更新和关联视图，比较哈希、插入、访问及键排序语义，并通过实际故障验证可变键和回调结构修改的风险。"
date: 2026-09-08
---

# Map

`Map<K, V>` 保存键到值的映射，同一逻辑键最多对应一个值。它适合按商品编码定位当前库存，但不会自动保留每次库存变化历史；同键put通常覆盖旧映射，业务若需要审计事件，应另建事件记录。

## 一、查询结果必须区分缺失和空值

HashMap允许null键和值，因此get返回null有两种含义：没有键，或者键存在但值为null。containsKey可以区分这两种状态，getOrDefault则只在没有映射时返回默认值，不会把显式null换成默认值。[Map 查询契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html#getOrDefault(java.lang.Object,V))

| 初始状态 | get(key) | containsKey(key) | getOrDefault(key, 0) |
|---|---|---|---|
| 无该键 | null | false | 0 |
| 键映射为null | null | true | null |
| 键映射为20 | 20 | true | 20 |

::: warning 默认值查询不能消除显式 null

把这类get结果直接拆箱成int会引入NullPointerException。可以在业务边界禁止空值，也可以显式处理“无映射”和“已知但尚无数量”的状态；不要仅凭getOrDefault就宣称消除了所有空值。

:::

put返回旧值，remove(key)返回被移除值；两者返回null时也可能存在相同歧义。remove(key, expected)与replace(key, old, new)表达条件修改，但普通Map没有因此获得跨线程原子性承诺。

## 二、实现决定键的比较与条目顺序

| 实现 | 键的查找依据 | 顺序 | 使用边界 |
|---|---|---|---|
| HashMap | hashCode与equals | 不保证遇见顺序 | 哈希分散时查询通常为常数成本 |
| LinkedHashMap | 保留哈希键语义 | 默认插入顺序，也可配置访问顺序 | get等访问会改变访问顺序模式下的位置 |
| TreeMap | 自然顺序或Comparator | 按键排序 | 比较为零会视为同一键，基本操作O(log n) |
| EnumMap | 同一种枚举类型 | 枚举声明顺序 | 适合有限状态键，不适合任意字符串标识 |

::: info 访问顺序映射仍不具备完整缓存能力

访问顺序LinkedHashMap把最近被访问的条目移到后面；它本身不会自动限制数量，也不是已经完成容量淘汰、过期和并发控制的缓存。此时读取get都能调整顺序，正在遍历时也应注意其结构影响。[LinkedHashMap 顺序说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html)

:::

TreeMap的ceilingKey、floorKey分别用于不小于、不大于目标的边界查询，subMap可以表达键区间。比较为零与equals不一致时，两个领域上不同的键仍可能互相覆盖；顺序选择必须连同唯一性一起设计。[TreeMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html)

## 三、键稳定性是哈希查找的前提

HashMap按加入时的哈希值组织条目。若键的可变字段参与equals/hashCode，改变字段后不会自动重建索引。示例把可变List作为键，先保存P-1001，再把列表元素替换成P-1002，本机containsKey找不到仍保存在表内的键。

::: tip 优先使用内部状态也稳定的键

这与[Set的可变元素风险](./06-set.md)属于同一种索引前提；Map中表现为键无法定位到值。只把键引用声明成final没有用，因为final不限制对象内部状态。优先使用字符串标识、枚举或组成字段也不可变的值对象。

:::

需要变更键时，先在旧键仍有效时移除旧映射，再以新的稳定键保存；若已经破坏索引，从可信数据重建并检查重复键冲突。本例重建HashMap证明了当前条目可重新索引，不代表任意错误数据都能无损恢复。[Map 可变键约束](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html)

## 四、计算更新按返回值决定映射变化

### 1. 当前值决定是否计算，返回值决定如何更新

计算式方法把“根据当前状态产生新值”的过程封装成回调，并不把整个业务操作变成事务。回调应计算并返回结果，不能同时向正在操作的Map增删其他条目。下表区分null的触发与返回语义。

| 方法 | 何时调用计算函数 | 函数返回null的效果 |
|---|---|---|
| computeIfAbsent | 缺失或当前值为null | 不建立新的非空映射；原先的null映射仍可存在 |
| computeIfPresent | 当前值非null | 移除当前映射 |
| compute | 无论键是否存在，旧值可为null | 移除已有映射或维持缺失 |
| merge | 旧值非null时合并；否则直接使用传入的非null值 | 合并结果为null时移除映射 |

putIfAbsent也将显式null值视为可写入状态，与containsKey的真假不等价。merge提供的待合并值不能为null，即使底层HashMap允许空值；“实现允许null”不能代替每个方法的参数约束。[Map 计算方法](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html#compute(K,java.util.function.BiFunction))

### 2. 回调只计算当前键的新值

示例用实现Function和BiFunction的显式类作为回调对象，不依赖Lambda语法。DefaultStock只返回演示值20，AddQuantities使用Math.addExact合并数量，RemoveQuantity通过返回null请求删除。回调可抛异常，例如整数相加溢出；调用方仍须按业务边界决定失败处理。

以数量合并为例，先判断旧值是否存在，存在时把旧值与新增量交给合并函数，函数返回的值才成为新的映射。把“返回新数量”和“另外修改多个库存键”混在回调中，会使失败边界不清；后者需要独立的业务协调，不能依赖这个计算入口完成回滚。

::: warning 计算更新方法不自动保证原子性

普通Map默认方法不保证同步或原子性，HashMap也不适合无同步并发写。并发容器的计算契约由各自实现定义，本章不将这些结论外推到ConcurrentHashMap。

:::

## 五、Map 的关联视图 {#五、keyset、values、entryset-是关联视图}

### 1. 支持的修改会回写映射

同时读取键和值时，可以遍历entrySet，避免每次只取键再查找一次。视图不是副本：经支持的keySet删除会移除原Map条目，values删除会移除对应映射中的一项，entry.setValue可替换支持该操作的条目值。

视图一般不允许通过add新增键或值，因为单独一个键或值不能决定完整映射。删除却有足够信息：移除一个已有键就确定了要删除的映射，所以“不能添加”与“可以删除”并不矛盾。

### 2. 条目来源决定是否关联原 Map

不同来源的Map.Entry修改能力不同：HashMap当前条目的setValue支持回写，Map.entry返回的条目不可修改，SequencedMap.firstEntry返回的是独立且不可修改的条目快照，不能混用。

需要把条目带出当前遍历阶段时，应明确复制为自己的数据对象或稳定条目；不要依赖已删除条目引用的后续行为。只读快照由[不可变集合与Sequenced Collections](./09-immutable-sequenced.md)主讲。

## 六、库存更新与顺序的完整示例

以下独立程序在本地验证空映射、计算更新、视图回写、访问顺序、键排序和可变键。演示数量不来自实际库存系统，DefaultStock的固定值仅用于验证API调用。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看MapContractsDemo的完整代码

```java
// MapContractsDemo.java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.BiFunction;
import java.util.function.Function;

/** 验证空映射、计算更新、关联视图以及插入、访问和键排序三种顺序。 */
public final class MapContractsDemo {
    /** 静态入口无需实例；构造器不产生副作用。 */
    private MapContractsDemo() {}

    /**
     * 验证 Map 状态变化；无返回值，失败模式展示真实异常且不写外部状态。
     * @param args 空参数正常；null-unbox 对空值拆箱；compute-side-effect 回调修改同一 Map
     */
    public static void main(String[] args) {
        Map<String, Integer> stocks = new LinkedHashMap<>();
        stocks.put("P-1001", null);
        stocks.put("P-1002", 8);
        if (args.length > 0) {
            switch (args[0]) {
                case "null-unbox" -> {
                    int quantity = stocks.get("P-1001");
                    System.out.println(quantity);
                }
                case "compute-side-effect" -> stocks.computeIfAbsent("P-1003", new Function<String, Integer>() {
                    /**
                     * 故意修改正在执行计算的 Map，用于观察结构修改检测。
                     * @param code 缺失的演示商品编码
                     * @return 尝试写入的新数量；实现应在应用结果前检测到结构修改
                     */
                    @Override
                    public Integer apply(String code) {
                        stocks.put("P-1009", 99);
                        return 3;
                    }
                });
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        assert stocks.containsKey("P-1001");
        assert stocks.getOrDefault("P-1001", 0) == null;
        assert stocks.getOrDefault("P-9999", 0) == 0;
        stocks.computeIfAbsent("P-1001", new DefaultStock());
        stocks.merge("P-1002", 2, new AddQuantities());
        assert stocks.get("P-1001") == 20 && stocks.get("P-1002") == 10;
        System.out.println("updated=" + stocks);

        stocks.keySet().remove("P-1002");
        assert !stocks.containsKey("P-1002");
        Map.Entry<String, Integer> entry = stocks.entrySet().iterator().next();
        entry.setValue(21);
        assert stocks.get("P-1001") == 21;
        System.out.println("after view edit=" + stocks);

        Map<String, Integer> accesses = new LinkedHashMap<>(16, 0.75f, true);
        accesses.put("P-1002", 2);
        accesses.put("P-1001", 1);
        accesses.get("P-1002");
        assert new ArrayList<>(accesses.keySet()).equals(List.of("P-1001", "P-1002"));
        TreeMap<String, Integer> sorted = new TreeMap<>(stocks);
        sorted.put("P-1000", 1);
        assert sorted.firstKey().equals("P-1000");
        System.out.println("access order=" + accesses.keySet());
        System.out.println("sorted keys=" + sorted.keySet());

        List<String> mutableKey = new ArrayList<>(List.of("P-1001"));
        Map<List<String>, Integer> index = new HashMap<>();
        index.put(mutableKey, 20);
        mutableKey.set(0, "P-1002"); // 故意破坏键的哈希稳定性，只用于本机故障验证。
        boolean found = index.containsKey(mutableKey);
        assert !found;
        Map<List<String>, Integer> rebuilt = new HashMap<>(index);
        assert rebuilt.containsKey(mutableKey);
        System.out.println("mutable key lookup=" + found + ", rebuilt=" + rebuilt.containsKey(mutableKey));

        Map<String, Integer> removal = new HashMap<>(stocks);
        removal.compute("P-1001", new RemoveQuantity());
        assert !removal.containsKey("P-1001");
    }

    /** 示例缺失值计算器；只计算返回值，不修改其外部 Map。 */
    static final class DefaultStock implements Function<String, Integer> {
        /**
         * 提供固定演示库存；只用于验证计算回调，不代表真实库存查询。
         * @param code 非 null 的演示商品编码
         * @return 固定演示值20
         */
        @Override
        public Integer apply(String code) { return 20; }
    }

    /** 用返回 null 表达移除映射，不在回调中修改 Map。 */
    static final class RemoveQuantity implements BiFunction<String, Integer, Integer> {
        /**
         * 清除指定数量映射的计算结果。
         * @param code 非 null 演示商品编码
         * @param previous 旧数量，允许 null
         * @return null，使 compute 移除已有映射或保持缺失
         */
        @Override
        public Integer apply(String code, Integer previous) { return null; }
    }

    /** 合并两个非空数量，使用精确相加避免静默溢出。 */
    static final class AddQuantities implements BiFunction<Integer, Integer, Integer> {
        /**
         * 计算新的演示数量，不修改外部容器。
         * @param current 已有非 null 数量
         * @param added 非 null 增量；相加溢出时抛出 ArithmeticException
         * @return 两个整数的精确和
         */
        @Override
        public Integer apply(Integer current, Integer added) {
            return Math.addExact(current, added);
        }
    }
}
```

:::

在本篇示例目录执行以下 PowerShell 命令；需要 JDK 21，无第三方依赖。本例已在 Corretto 21.0.11 上实际编译运行。

```powershell
New-Item -ItemType Directory -Force -Path 'out' | Out-Null
javac -encoding UTF-8 -Xlint:all -Werror -d out MapContractsDemo.java
if ($LASTEXITCODE -ne 0) { throw '示例编译失败' }
java -ea -cp out MapContractsDemo
if ($LASTEXITCODE -ne 0) { throw '示例运行失败' }
```

本机实际输出：

```text
updated={P-1001=20, P-1002=10}
after view edit={P-1001=21}
access order=[P-1001, P-1002]
sorted keys=[P-1000, P-1001]
mutable key lookup=false, rebuilt=true
```

P-1001的null映射经computeIfAbsent变为20，P-1002经merge从8变成10；keySet删除与entry.setValue改写了原Map。访问顺序把最近get的P-1002放到最后，TreeMap则按键排列。额外断言确认compute返回null会移除已有映射。

## 七、空值拆箱与回调副作用的失败证据

完成正常编译后，分别执行两种错误入口。

```powershell
java -cp out MapContractsDemo null-unbox
if ($LASTEXITCODE -ne 1) { throw '空值拆箱未按预期失败' }
java -cp out MapContractsDemo compute-side-effect
if ($LASTEXITCODE -ne 1) { throw '回调结构修改未按预期失败' }
```

null-unbox实际抛出NullPointerException，定位到对显式null库存的拆箱；应区分缺失和空值或在模型中禁止空库存。compute-side-effect实际抛出ConcurrentModificationException，源头是在computeIfAbsent回调内put了P-1009。

::: warning 回调异常不会自动回滚副作用

回调中已经执行的外部或容器副作用不会因异常自动回滚，不能把这次检测当成事务机制。修复是先在回调之外完成必要准备，让回调只产生当前键的新值；之后重新建立可信状态再重试。示例每次启动都创建新的局部Map，因此进程退出即可结束本次故障。

:::
