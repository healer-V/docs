---
title: "Set"
tags:
  - Java
  - Set
  - 相等性
excerpt: "解释 HashSet、LinkedHashSet 与 TreeSet 如何分别利用哈希相等、遇见顺序和比较等价表达唯一性，用商品编码和金额例验证去重、集合运算、可变元素与空值边界。"
date: 2026-09-08
---

# Set

`Set<E>` 用于表达“某个元素是否属于集合”，不保留重复次数，也不提供按下标取值的能力。选择 Set 前先确定业务如何判定同一个元素：商品编码相同、所有字段相同，还是某个排序键相同，这些规则不能混为一谈。

## 一、唯一性依赖可用的相等契约

Set 的基本相等要求以元素的 equals 关系为基础；两个集合是否相等与迭代先后无关。HashSet 借助哈希定位候选，再依据相等关系查找或去重。相等对象必须有相同 hashCode，不同对象可以发生哈希冲突，冲突不等于重复。[Set 契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html)、[HashSet 实现约束](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashSet.html)

`add` 返回true表示加入了此前不存在的元素，false表示集合未因本次加入改变。成员判断和删除分别使用contains和remove；没有索引API意味着“第一个”只能来自额外的顺序契约，不能凭HashSet的一次遍历结果推断。

::: tip 按业务唯一性选择稳定的相等契约

Object 的默认相等性不会自动按商品字段比较。实体若按引用身份区分，即使两份内容看起来一致，加入哈希集合仍可保留两项；按商品编码去重时，应使用稳定编码或正确实现值相等的对象。完整对象契约见[Object 通用契约](../03-object-oriented-design/07-object-contract.md)。

:::

## 二、Set 实现对比 {#二、hashset、linkedhashset-和-treeset-的区别}

实现选择会同时改变定位规则和遇见顺序。表格用于先选候选，之后还要核对顺序维护以及“比较为零”的业务含义，不能只比较操作复杂度。

| 实现 | 去重或定位规则 | 顺序与主要成本 | 场景 |
|---|---|---|---|
| HashSet | hashCode 与 equals | 不保证迭代顺序；哈希分散时常见操作为常数成本 | 快速成员判断 |
| LinkedHashSet | 保留哈希相等规则 | 通常按首次加入顺序遇见元素，另维护链接 | 去重后稳定展示 |
| TreeSet | 自然顺序或 Comparator；比较为零视作同一位置 | 自动排序，基本查找增删 O(log n) | 范围和邻近元素查询 |

### 1. 顺序维护与范围查询

对已有 LinkedHashSet 元素再次普通 add，不会把它移动到最后。Java 21 的显式 addFirst、addLast 可以调整位置，属于[首尾顺序操作](./09-immutable-sequenced.md)，不能把“普通add不移动”扩大到所有方法。[LinkedHashSet 契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashSet.html)

HashSet 遍历成本还与底层容量有关，不应通过无限增大初始容量追求更快。TreeSet 的 ceiling 返回大于等于目标的最小元素，lower 返回严格小于目标的最大元素；没有匹配时返回null。它们适合商品编码区间查询，但结果含义仍以比较规则为准。[TreeSet API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeSet.html)

### 2. 比较为零不一定意味着 equals 为真 {#三、比较为零不一定意味着-equals-为真}

`new BigDecimal("2.0")` 与 `new BigDecimal("2.00")` 数值比较为零，但equals不同。放入HashSet会保留两项，按自然顺序放入TreeSet只保留一项。这个反例说明不能把TreeSet简单理解为“把HashSet排一下序”。

::: warning 比较为零可能丢失不同订单

若比较器只按订单优先级比较，两份不同订单也会比较为零，TreeSet会把其中一份当作重复。需要保留所有订单时，应使用List排序；需要按订单唯一性建立排序集合时，应选能与领域相等性一致的完整比较键。详细比较契约见[迭代、比较与排序](./04-iteration-comparison-sorting.md)。

:::

排序集合的顺序应与equals一致，才能遵守Set的一般契约。故意采用不一致规则时，必须理解它对contains、集合比较与跨实现运算的影响；不能因为当前业务数据没碰到重复比较键，就断言模型安全。

## 三、可变元素会让已有索引失效 {#四、可变元素会让已有索引失效}

元素进入HashSet后，修改参与equals或hashCode的字段，就破坏了集合建立索引时的前提。对象引用仍在集合中，不代表后续contains能按新哈希定位到它。以下完整示例在本机观察到“遍历仍有元素，contains却为false”，并通过新集合重新索引恢复当前值的可查找性。

::: tip 改变标识前先移除旧索引

正式处理应优先避免可变键；必须改变标识时，在修改前通过旧契约移除，再修改并重新加入。已经污染的集合应依据可信数据重新构建，并检查修改后出现的重复与业务冲突。示例的重建只验证单个元素，不能证明任意受污染业务数据都能无损恢复。

:::

TreeSet同样要求参与排序的字段在集合存储期间保持稳定。改变字段不会自动重新定位已有节点，故障不只存在于哈希结构。Set规范对元素相等性改变后的行为不提供正常使用保证，示例结果是诊断证据而非可利用技巧。

## 四、集合运算与工厂约束 {#五、集合运算与工厂约束}

对左集合先复制，再进行运算，可以避免意外修改调用方的数据。选择LinkedHashSet复制有序输入，结果保留左侧的遇见顺序；若输入来自无序集合，复制不能恢复丢失的业务顺序。

| 目标 | 在独立结果上执行 | 对重复次数的影响 |
|---|---|---|
| 并集 | addAll(right) | 只保留唯一元素 |
| 交集 | retainAll(right) | 仅保留右侧包含的元素 |
| 差集 | removeAll(right) | 移除右侧包含的元素 |

`Set.of` 拒绝重复元素并拒绝null；`Set.copyOf` 可以把包含重复项的Collection转成集合，不保证保留哪一个相等实例，也不承诺输入顺序。HashSet和LinkedHashSet可以保存一个null；自然排序TreeSet拒绝null，显式比较器是否接受null要单独说明。

::: warning 集合去重不能表达购买数量

不要把Set当成购买数量模型。两个相同商品条目如果分别代表两次购买，去重会丢失数量语义，应该用明细列表或明确的数量映射。

:::

## 五、三种等价关系的完整示例 {#六、三种等价关系的完整示例}

下面文件同时验证首次出现顺序、金额比较等价、成员交集和可变标识风险。订单商品编码与金额均为演示输入；可变标识类只用于故障注入。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看SetEqualityDemo的完整代码

```java
// SetEqualityDemo.java
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

/** 对照哈希相等、比较等价与插入顺序，并复现可变元素破坏查找的风险。 */
public final class SetEqualityDemo {
    /** 静态示例无需实例；构造器不产生副作用。 */
    private SetEqualityDemo() {}

    /**
     * 验证三种 Set 的实际行为；无返回值，错误模式保留工厂异常。
     * @param args 空参数正常；duplicate 创建重复 Set；null 创建含空值 Set
     */
    public static void main(String[] args) {
        if (args.length > 0) {
            switch (args[0]) {
                case "duplicate" -> Set.of("P-1001", "P-1001");
                case "null" -> Set.of("P-1001", null);
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        Set<String> firstSeen = new LinkedHashSet<>(List.of("P-1002", "P-1001", "P-1002"));
        assert !firstSeen.add("P-1002");
        assert new java.util.ArrayList<>(firstSeen).equals(List.of("P-1002", "P-1001"));
        Set<BigDecimal> hashPrices = new HashSet<>(List.of(new BigDecimal("2.0"), new BigDecimal("2.00")));
        Set<BigDecimal> treePrices = new TreeSet<>(hashPrices);
        assert hashPrices.size() == 2 && treePrices.size() == 1;

        TreeSet<String> catalog = new TreeSet<>(List.of("P-1001", "P-1002", "P-1003"));
        assert catalog.ceiling("P-1002").equals("P-1002");
        assert catalog.lower("P-1002").equals("P-1001");
        Set<String> selected = new LinkedHashSet<>(firstSeen);
        selected.retainAll(Set.of("P-1001", "P-1003"));
        assert selected.equals(Set.of("P-1001"));

        MutableProduct product = new MutableProduct(1);
        Set<MutableProduct> unsafe = new HashSet<>();
        unsafe.add(product);
        product.code = 2; // 故意修改参与哈希的字段；违反存储期间键稳定的约束。
        boolean foundAfterChange = unsafe.contains(product);
        assert !foundAfterChange; // 记录本机实现的故障证据，不把违规后的行为当作接口保证。
        Set<MutableProduct> rebuilt = new HashSet<>(unsafe);
        assert rebuilt.contains(product);
        System.out.println("first seen=" + firstSeen);
        System.out.println("price counts: hash=" + hashPrices.size() + ", tree=" + treePrices.size());
        System.out.println("intersection=" + selected);
        System.out.println("mutable lookup=" + foundAfterChange + ", rebuilt=" + rebuilt.contains(product));
    }

    /** 仅用于故障注入的可变商品标识；正式存储应改用不可变标识。 */
    static final class MutableProduct {
        private int code;

        /**
         * 创建故意可变的标识；无返回值，保存演示编码。
         * @param code 正整数演示编码，本例使用1和2
         */
        MutableProduct(int code) { this.code = code; }

        /**
         * 按当前编码判断相等；编码变化会改变相等关系。
         * @param other 任意对象，允许 null
         * @return 同类型且当前编码相同返回 true
         */
        @Override
        public boolean equals(Object other) {
            return other instanceof MutableProduct product && code == product.code;
        }

        /** 返回当前编码的哈希值；改变编码会让已有索引过时。 */
        @Override
        public int hashCode() { return code; }
    }
}
```

:::

在本篇示例目录执行以下 PowerShell 命令，需要 JDK 21，无外部依赖。源码已在 Corretto 21.0.11 上通过编译及断言运行。

```powershell
New-Item -ItemType Directory -Force -Path 'out' | Out-Null
javac -encoding UTF-8 -Xlint:all -Werror -d out SetEqualityDemo.java
if ($LASTEXITCODE -ne 0) { throw '示例编译失败' }
java -ea -cp out SetEqualityDemo
if ($LASTEXITCODE -ne 0) { throw '示例运行失败' }
```

本机实际输出：

```text
first seen=[P-1002, P-1001]
price counts: hash=2, tree=1
intersection=[P-1001]
mutable lookup=false, rebuilt=true
```

金额两种计数是规则不同造成的；没有输出HashSet的具体遍历顺序，避免把偶然排列写入断言。可变标识从1改为2后本机查询失败，新HashSet重新建索引后查询成功，但正式代码仍应改用稳定标识。

## 六、重复工厂参数与空元素的失败证据 {#七、重复工厂参数与空元素的失败证据}

完成正常编译后运行以下模式，每个模式独立退出1。

```powershell
java -cp out SetEqualityDemo duplicate
if ($LASTEXITCODE -ne 1) { throw '重复元素没有按预期失败' }
java -cp out SetEqualityDemo null
if ($LASTEXITCODE -ne 1) { throw '空元素没有按预期失败' }
```

duplicate实际抛出IllegalArgumentException，原因是Set.of收到两个相同P-1001；null实际抛出NullPointerException，原因是工厂禁止空元素。需主动去重时使用满足业务要求的构建方式，空元素则在输入边界拒绝。不要捕获后返回空Set掩盖非法商品数据。
