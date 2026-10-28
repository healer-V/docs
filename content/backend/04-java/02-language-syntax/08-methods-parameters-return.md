---
title: "方法、参数与返回值"
tags:
  - Java 21
  - 方法
  - 参数传递
excerpt: "解释 Java 方法声明、签名、参数、返回值和调用栈，并通过基本值与引用值对照证明 Java 对所有参数都采用按值传递。"
date: 2026-09-02
---

# 方法、参数与返回值

方法用名称、参数和返回类型建立调用契约，把一段逻辑组织为可复用、可测试的单元。Java 对所有方法参数都采用按值传递：基本类型复制实际值，引用类型复制引用值。

## 一、方法声明的组成

```java
private static long calculateSubtotal(long unitPriceCents, int quantity) {
    return Math.multiplyExact(unitPriceCents, quantity);
}
```

| 部分 | 示例 | 作用 |
|------|------|------|
| 访问修饰符 | `private` | 控制方法可见范围 |
| 其他修饰符 | `static` | 方法属于类，不依赖具体实例 |
| 返回类型 | `long` | 约束正常返回结果类型 |
| 方法名 | `calculateSubtotal` | 表达职责 |
| 参数列表 | `(long ..., int ...)` | 声明输入类型、顺序和局部名称 |
| 方法体 | `{ ... }` | 实现校验、计算和返回 |

声明方法时应让名称描述结果或动作，例如 `calculateSubtotal`、`isShippable`、`findOrder`。`process`、`handle` 等宽泛名称无法说明输入如何变成结果。

## 二、方法签名与调用匹配

Java 方法签名由方法名和参数类型组成，不包含返回类型。调用时，编译器根据方法名、实参数量、顺序和类型解析目标方法。

```java
long subtotal = calculateSubtotal(1_990L, 2);
```

这里 `1_990L` 匹配第一个 `long` 参数，`2` 匹配第二个 `int` 参数。少传、多传或类型无法转换都会在编译期失败。

返回类型不能单独区分两个同名同参数方法：

```java
// int parse(String value) { ... }
// long parse(String value) { ... } // 签名重复，不能同时声明
```

同名不同参数属于方法重载；本文只建立签名边界，具体解析规则由“方法重载、可变参数与递归”文章负责。

## 三、形参、实参与局部状态

声明中的参数叫形参，调用处提供的表达式结果叫实参：

```java
int quantity = 3;
increaseLocally(quantity);
```

每次调用都会建立当前调用的参数和局部变量。方法内修改形参，不会直接修改调用方变量本身。

参数名称只在方法体内可见。调用方依赖的是参数位置和类型，不会把实参变量名传入方法。

## 四、返回值与 void

### 1. 有返回值方法必须覆盖正常路径

返回类型不是 `void` 时，每条能够正常完成的方法路径都必须返回兼容值或抛出异常：

```java
private static int normalize(int value) {
    if (value >= 0) {
        return value;
    }
    return 0;
}
```

::: warning 返回契约必须覆盖正常执行路径

遗漏负数路径的 `return` 会产生 `missing return statement` 编译错误。编译器检查的是控制流完整性，不会假设调用方只传正数。

:::

### 2. void 表示不返回结果值

`void` 方法不能向调用方返回一个 Java 值，但可以使用 `return;` 提前结束：

```java
private static void printIfPresent(String value) {
    if (value == null) {
        return;
    }
    System.out.println(value);
}
```

::: info 副作用与返回值是两种交付方式

修改对象、写文件或打印输出都是副作用，不等于方法具有返回值。调用方需要计算结果时，优先通过明确返回类型交付，而不是修改传入数组模拟“输出参数”。

:::

## 五、Java 对基本类型按值传递

```java
private static void increaseLocally(int quantity) {
    quantity++;
}

int callerQuantity = 3;
increaseLocally(callerQuantity);
```

调用时把数值 `3` 复制给形参。方法内形参变为 `4`，调用方变量仍为 `3`：

```text
调用前：callerQuantity = 3
调用时：quantity 获得值副本 3
方法内：quantity = 4
返回后：callerQuantity 仍为 3
```

需要交付新数量时应返回结果：

```java
private static int increased(int quantity) {
    return quantity + 1;
}
```

## 六、引用类型同样按值传递

### 1. 复制的是引用值

```java
int[] stocks = {3, 5};
updateFirstStock(stocks, 9);
```

方法形参获得数组引用值的副本，因此双方仍能访问同一数组对象。通过形参执行 `stocks[0] = 9` 会修改共享对象。

```text
调用方变量 stocks ──────┐
                        ├──▶ 同一个数组对象
形参 stocks（引用副本） ─┘
```

### 2. 重新赋值形参不会替换调用方引用

```java
private static void replaceLocally(int[] stocks) {
    stocks = new int[]{100, 200};
}
```

赋值只改变形参中的引用副本，调用方变量仍指向原数组。由此可以准确区分：

- 通过引用副本修改同一对象，调用方可以观察；
- 给引用副本重新赋值，调用方变量不会被替换。

::: warning Java 不存在“对象参数按引用传递”
如果参数按引用传递，方法重新赋值形参就能替换调用方变量。Java 做不到这一点，因此准确结论始终是按值传递。
:::

## 七、调用栈与方法返回

方法调用会形成调用链：

```text
main
└── buildOrderSummary
    └── calculateSubtotal
```

JVM 为每次方法调用维护栈帧，其中包含局部变量、操作数和返回信息。`calculateSubtotal` 返回后，其结果交给 `buildOrderSummary`；后者返回后，结果交给 `main`。

异常栈会按相反观察方向列出当前失败位置和调用者，断点调试器也按栈帧查看参数与局部变量。递归会为每次自调用创建新栈帧，因此深度必须受控。

## 八、参数契约与副作用

类型系统只能保证结构兼容，不能自动保证业务约束：

```java
private static long calculateSubtotal(long unitPriceCents, int quantity) {
    if (unitPriceCents < 0 || quantity <= 0) {
        throw new IllegalArgumentException("单价不能为负且数量必须大于 0");
    }
    return Math.multiplyExact(unitPriceCents, quantity);
}
```

设计方法时应明确：

| 契约 | 需要回答的问题 |
|------|----------------|
| 参数 | 是否允许 `null`、负数、空数组或超大值 |
| 返回 | 单位、空结果和对象可变性是什么 |
| 异常 | 调用方违反约束或计算失败如何表达 |
| 副作用 | 是否修改参数对象、字段、文件或外部系统 |

::: tip 让副作用在方法契约中可见

只根据输入计算返回值且不修改外部状态的方法更容易测试。必须产生副作用时，应通过方法名、文档和边界明确表达。

:::

## 九、完整程序

将完整源码保存为 `MethodsDemo.java`，对比基本值、引用值、对象修改、局部重新赋值和两层方法调用。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看MethodsDemo的完整代码

```java
import java.util.Arrays;

/**
 * 演示方法签名、返回值、调用链和 Java 的按值传递规则。
 */
public final class MethodsDemo {

    /**
     * 工具类不需要实例化。
     */
    private MethodsDemo() {
    }

    /**
     * 输出基本类型参数、引用参数和订单小计示例。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        int quantity = 3;
        int[] stocks = {3, 5};

        increaseLocally(quantity);
        updateFirstStock(stocks, 9);
        replaceLocally(stocks);

        System.out.println("caller quantity=" + quantity);
        System.out.println("caller stocks=" + Arrays.toString(stocks));
        System.out.println(buildOrderSummary("ORD-20260902-0042", 1_990L, 2));
    }

    /**
     * 增加基本类型形参的副本，不影响调用方变量。
     *
     * @param quantity 调用方数量值的副本
     */
    private static void increaseLocally(int quantity) {
        quantity++;
        System.out.println("local quantity=" + quantity);
    }

    /**
     * 通过引用值副本修改双方共同指向的数组对象。
     *
     * @param stocks 至少包含一个元素的库存数组
     * @param newValue 要写入的首个库存值
     */
    private static void updateFirstStock(int[] stocks, int newValue) {
        stocks[0] = newValue;
    }

    /**
     * 重新赋值局部引用副本，不会替换调用方变量。
     *
     * @param stocks 调用方数组引用值的副本
     */
    private static void replaceLocally(int[] stocks) {
        stocks = new int[]{100, 200};
        System.out.println("local stocks=" + Arrays.toString(stocks));
    }

    /**
     * 计算小计并格式化订单摘要，形成两层方法调用链。
     *
     * @param orderNumber 订单号，不能为空
     * @param unitPriceCents 商品单价，必须大于或等于 0，单位为分
     * @param quantity 商品数量，必须大于 0
     * @return 包含订单号和小计金额的摘要
     */
    private static String buildOrderSummary(String orderNumber, long unitPriceCents, int quantity) {
        long subtotalCents = calculateSubtotal(unitPriceCents, quantity);
        return "order=%s, subtotal cents=%d".formatted(orderNumber, subtotalCents);
    }

    /**
     * 使用精确乘法计算订单小计。
     *
     * @param unitPriceCents 商品单价，必须大于或等于 0，单位为分
     * @param quantity 商品数量，必须大于 0
     * @return 商品小计，单位为分
     * @throws IllegalArgumentException 参数不满足业务约束时抛出
     * @throws ArithmeticException 乘法结果超出 long 范围时抛出
     */
    private static long calculateSubtotal(long unitPriceCents, int quantity) {
        if (unitPriceCents < 0 || quantity <= 0) {
            throw new IllegalArgumentException("单价不能为负且数量必须大于 0");
        }
        return Math.multiplyExact(unitPriceCents, quantity);
    }
}
```

:::

## 十、编译、运行与输出

```powershell
javac -Xlint:all -g -encoding UTF-8 `
  -d out `
  MethodsDemo.java

java -cp out MethodsDemo
```

预期输出：

```text
local quantity=4
local stocks=[100, 200]
caller quantity=3
caller stocks=[9, 5]
order=ORD-20260902-0042, subtotal cents=3980
```

::: tip 用调用方状态验证按值传递

调用方数量未变，证明基本值副本独立；数组首项变为 `9`，证明引用副本访问同一对象；局部新数组没有替换调用方数组，证明引用变量本身仍按值传递。

:::

## 十一、常见失败场景

| 问题 | 阶段与表现 | 修复方式 |
|------|------------|----------|
| 少传或多传参数 | 编译期找不到适用方法 | 按声明的数量、顺序和类型传参 |
| 非 void 方法遗漏返回 | 编译期 `missing return statement` | 覆盖每条正常完成路径或明确抛出异常 |
| 期望方法修改基本变量 | 运行结果仍是原值 | 返回新值并由调用方接收 |
| 重新赋值引用形参后调用方没变 | 只替换了引用副本 | 返回新对象，或在契约允许时修改共享对象 |
| 隐含修改传入对象 | 调用后对象状态意外变化 | 文档化副作用，或改为返回新结果 |

## 十二、规范依据

- [JLS 8.4：Method Declarations](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4) 定义方法签名、参数、返回类型和方法体。
- [JLS 8.4.1：Formal Parameters](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.1) 明确形参在调用时由实参值初始化。
- [JLS 14.17：The return Statement](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.17) 定义返回语句与结果表达式。
- [JLS 15.12：Method Invocation Expressions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12) 定义方法查找、适用性和调用过程。

按值传递规则在 Java 8 和 Java 21 中完全一致。任何把 Java 描述为“基本类型按值、对象按引用”的资料都会导致错误的调用模型。
