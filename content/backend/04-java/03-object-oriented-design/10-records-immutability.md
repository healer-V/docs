---
title: "Record 与不可变对象"
tags:
  - Java 21
  - Record
  - 不可变对象
excerpt: "解释 Record 自动生成的状态与值契约、紧凑构造器和浅不可变边界，并通过订单明细说明防御性复制与实体选型。"
date: 2026-09-03
---


# Record 与不可变对象

Record 是 Java 用于声明透明数据载体的特殊类，适合“全部分量共同定义值”的模型。它自动提供访问器、规范构造器、`equals`、`hashCode` 和 `toString`，但只保证分量引用不能重新赋值，不会递归冻结可变对象。


## 一、Record 声明值的组成

```java
record OrderItem(String sku, long unitPriceCents, int quantity) {
}
```

头部的三个分量决定 Record 的状态描述。编译器据此提供：

| 生成内容 | 本例形式 | 含义 |
|----------|----------|------|
| 私有 final 字段 | `sku`、`unitPriceCents`、`quantity` | 保存每个分量 |
| 公开访问器 | `sku()`、`unitPriceCents()`、`quantity()` | 名称不带 `get` 前缀 |
| 规范构造器 | `OrderItem(String, long, int)` | 按头部顺序接收全部分量 |
| 值契约 | `equals`、`hashCode` | 按全部分量比较与计算 |
| 诊断文本 | `toString` | 输出类型名、分量名和值 |

Record 隐式为 `final`，不能再被继承；它直接继承 `java.lang.Record`，可以实现接口，也可以声明静态成员、实例方法和辅助构造器。


## 二、紧凑构造器维护输入约束

紧凑构造器省略参数列表和字段赋值，构造器体结束后由编译器把参数赋给同名字段：

```java
record OrderItem(String sku, long unitPriceCents, int quantity) {
    OrderItem {
        if (sku == null || sku.isBlank()) {
            throw new IllegalArgumentException("sku 不能为空");
        }
        if (unitPriceCents < 0 || quantity <= 0) {
            throw new IllegalArgumentException("单价不能为负且数量必须大于 0");
        }
    }
}
```

::: info 紧凑构造器先标准化参数再赋值

紧凑构造器中可以重新赋值参数完成标准化，例如 `sku = sku.trim().toUpperCase()`；最终字段接收标准化结果。不能在紧凑构造器体中直接给隐式字段赋值。

:::

辅助构造器最终必须委托规范构造器，确保所有创建路径使用同一组约束。


## 三、Record 提供值语义

两个相同类型的 Record 在所有分量都相等时，`equals` 返回 `true`，相等对象也具有相同哈希码：

```java
OrderItem first = new OrderItem("SKU-1001", 1_990L, 2);
OrderItem second = new OrderItem("SKU-1001", 1_990L, 2);

System.out.println(first == second);      // false
System.out.println(first.equals(second)); // true
```

因此 Record 很适合命令参数、查询结果、坐标、金额组成或订单明细等值对象。若业务相等性只依赖部分字段，Record 头部却包含其他可变或展示字段，自动值语义可能不符合模型，需要重新设计类型而不是随意覆盖生成契约。


## 四、不可变只是浅层保证


### 1. final 分量不能阻止共享对象变化

以下 Record 的 `items` 字段不能指向另一个列表，但调用方仍能修改原列表内容：

```java
record UnsafeSummary(String orderNumber, List<OrderItem> items) {
}
```

这条限制作用在 Record 保存的引用上，没有改变引用目标的类型。外部清空原列表时，Record 仍指向同一个列表，因此访问器读出的内容也会改变；即使没有任何 Setter，状态仍然能从外部发生变化。

### 2. 防御性复制隔离列表结构

构造时执行防御性复制可切断外部可变别名：

```java
record OrderSummary(String orderNumber, List<OrderItem> items) {
    OrderSummary {
        items = List.copyOf(items);
    }
}
```

::: warning 不可修改列表仍然是浅复制

`List.copyOf` 返回不可修改列表，并拒绝 `null` 列表或 `null` 元素。但这仍是浅复制：若列表元素本身可变，外部仍可能改变元素内容。本例元素也是不可变 Record，因此整体边界更稳定。

:::

### 3. 元素和数组仍需单独判断

防御性复制要沿着可变对象边界判断。本例复制列表结构后，原列表增删不再影响摘要；若元素是可修改的订单实体，两个列表仍持有相同实体引用，实体字段变化仍会被双方观察到。是否复制元素取决于摘要需要实时视图还是创建时快照，不能仅凭列表不可修改作结论。

数组尤其容易泄漏，因为数组始终可变；作为 Record 分量时应在构造和访问两侧复制，或换用不可变值表示。数组自身的相等性也不是逐元素比较，默认 Record 值契约不会自动把数组改为内容相等；有此需求时应重新选择分量表示并明确相等规则。


## 五、值对象与实体不能混淆

| 特征 | 值对象 / Record 候选 | 实体 / 普通类候选 |
|------|----------------------|-------------------|
| 身份 | 由全部业务值定义 | 由稳定标识定义 |
| 状态 | 通常创建后不变，变化产生新值 | 生命周期内可发生受控状态迁移 |
| 相等性 | 分量相同即可相等 | 即使字段相同也可能是两个实体 |
| 典型例子 | 订单明细、坐标、日期范围 | 订单、客户、库存账户 |

把订单实体直接做成包含状态、更新时间和可变集合的 Record，会让自动 `equals/hashCode` 随业务状态变化，也难以表达封装的生命周期行为。Record 减少样板代码，不替代领域建模判断。

## 六、在 Java 8 维护线中的处理

Record 从 Java 16 成为正式特性，Java 8 源码无法编译。需要同时维护 Java 8 时，可以用 `final` 类、私有 `final` 字段、构造校验、访问器以及成对的 `equals/hashCode` 表达相同值语义。

::: warning Record 不能与 release 8 混用

不要在同一产物中直接把 `--release 8` 与 Record 混用。企业迁移可以将 Java 21 新模型放在单独模块或版本线，通过 JSON、数据库或稳定 Java 8 DTO 边界交换数据；具体多版本构建在维护线章节处理。

:::

## 七、运行订单明细示例

完整源码保存为 `RecordsImmutabilityDemo.java`。示例比较等值明细、计算小计，并在构造订单摘要后清空原可变列表，验证摘要仍保留自己的内容。

```java
List<OrderItem> mutableItems = new ArrayList<>();
mutableItems.add(keyboard);
OrderSummary summary = new OrderSummary("ORD-10001", mutableItems);
mutableItems.clear();

System.out.println("summary items=" + summary.items().size());
System.out.println("summary total=" + summary.totalCents());
```

新建一个空文件夹，将以下代码保存为 `RecordsImmutabilityDemo.java`，编码使用 UTF-8。后续编译和运行命令均在该文件夹执行。

::: details 查看 RecordsImmutabilityDemo 完整代码

```java [RecordsImmutabilityDemo.java]
import java.util.ArrayList;
import java.util.List;

/**
 * 演示 Record 的值语义、紧凑构造器和集合成员的防御性复制。
 */
public final class RecordsImmutabilityDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private RecordsImmutabilityDemo() {
    }

    /**
     * 示例入口。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        OrderItem keyboard = new OrderItem("SKU-1001", 1_990L, 2);
        OrderItem sameValue = new OrderItem("SKU-1001", 1_990L, 2);

        List<OrderItem> mutableItems = new ArrayList<>();
        mutableItems.add(keyboard);
        OrderSummary summary = new OrderSummary("ORD-10001", mutableItems);
        mutableItems.clear();

        System.out.println("item equals=" + keyboard.equals(sameValue));
        System.out.println("item subtotal=" + keyboard.subtotalCents());
        System.out.println("summary items=" + summary.items().size());
        System.out.println("summary total=" + summary.totalCents());
        System.out.println("record=" + keyboard);
    }

    /**
     * 订单明细是由全部分量共同定义的不可变值。
     *
     * @param sku 商品编码，不能为 null 或空白
     * @param unitPriceCents 商品单价，必须大于或等于 0，单位为分
     * @param quantity 商品数量，必须大于 0
     */
    private record OrderItem(String sku, long unitPriceCents, int quantity) {

        /**
         * 在字段赋值前验证所有 Record 分量。
         *
         * @param sku 商品编码，不能为 null 或空白
         * @param unitPriceCents 商品单价，必须大于或等于 0，单位为分
         * @param quantity 商品数量，必须大于 0
         */
        private OrderItem {
            if (sku == null || sku.isBlank()) {
                throw new IllegalArgumentException("sku 不能为空");
            }
            if (unitPriceCents < 0 || quantity <= 0) {
                throw new IllegalArgumentException("单价不能为负且数量必须大于 0");
            }
        }

        /**
         * 精确计算本明细小计。
         *
         * @return 明细小计，单位为分
         */
        private long subtotalCents() {
            return Math.multiplyExact(unitPriceCents, quantity);
        }
    }

    /**
     * 订单摘要在构造时复制明细列表，避免调用方后续修改内部状态。
     *
     * @param orderNumber 订单号，不能为 null 或空白
     * @param items 订单明细，不能为 null，且内部不能包含 null
     */
    private record OrderSummary(String orderNumber, List<OrderItem> items) {

        /**
         * 校验订单号并生成不可修改的明细副本。
         *
         * @param orderNumber 订单号，不能为 null 或空白
         * @param items 订单明细，不能为 null，且内部不能包含 null
         */
        private OrderSummary {
            if (orderNumber == null || orderNumber.isBlank()) {
                throw new IllegalArgumentException("订单号不能为空");
            }
            items = List.copyOf(items);
        }

        /**
         * 累加全部明细小计。
         *
         * @return 订单总额，单位为分
         */
        private long totalCents() {
            long total = 0L;
            for (OrderItem item : items) {
                total = Math.addExact(total, item.subtotalCents());
            }
            return total;
        }
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out RecordsImmutabilityDemo.java
java -cp out RecordsImmutabilityDemo
```

预期输出：

```text
item equals=true
item subtotal=3980
summary items=1
summary total=3980
record=OrderItem[sku=SKU-1001, unitPriceCents=1990, quantity=2]
```

::: tip 通过修改原输入验证防御性复制

原列表已经清空而摘要仍有一条明细，证明 `List.copyOf` 切断了列表结构的可变别名。示例没有使用 `double` 表示金额，也通过 `Math.multiplyExact` 避免整数溢出被静默忽略。

:::

## 八、常见错误

| 错误 | 结果 | 修正 |
|------|------|------|
| 把 Record 当作无规则 DTO | 仍可创建业务无效值 | 在规范或紧凑构造器维护约束 |
| 分量包含可变集合却不复制 | 外部能改变 Record 可观察状态 | 构造时防御性复制，元素也用不可变类型 |
| 用 Record 表示有独立身份的实体 | 自动值相等性随字段变化 | 使用普通类和稳定身份语义 |
| 认为 Record 没有构造器 | 无法理解校验和标准化入口 | 区分规范构造器、紧凑构造器和辅助构造器 |

规范依据可参阅 [JLS 8.10：Record Classes](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.10) 与 [Java 21 Record API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Record.html)。
