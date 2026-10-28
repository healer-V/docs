---
title: "方法重载、可变参数与递归"
tags:
  - Java 21
  - 方法重载
  - 递归
excerpt: "解释编译器如何选择方法重载、可变参数为什么是数组，以及递归的终止条件和栈深边界，并复现 null 歧义与 StackOverflowError。"
date: 2026-09-02
---

# 方法重载、可变参数与递归

方法重载让同一职责接受不同参数形态，可变参数让调用方传入不定数量的同类型值，递归让方法通过调用自身处理递归结构。三者都能减少表面重复，也都可能隐藏调用歧义、参数边界和栈资源风险。

## 一、方法重载与调用选择

重载先要满足声明规则，再由编译器在调用处选择具体签名。这两步分别决定“能否同时声明”和“本次调用哪一个”，默认值和歧义也应放在这个共同模型中判断。

### 1. 方法重载的成立条件 {#一、方法重载的成立条件}

同一个类可以声明多个同名方法，只要签名中的参数类型列表不同。差异可以来自：

- 参数数量；
- 对应位置的参数类型；
- 参数类型顺序。

```java
private static String formatAmount(long amountCents) {
    return formatAmount(amountCents, "CNY");
}

private static String formatAmount(long amountCents, String currencyCode) {
    return currencyCode + " " + amountCents;
}
```

参数名称和返回类型不参与重载签名。只改参数名或只改返回类型都会形成重复声明。

重载适合表达同一概念的便利入口。不同方法承担完全不同职责时，应使用不同名称，而不是为了 API 看起来统一而重载。

### 2. 编译器如何选择重载 {#二、编译器如何选择重载}

编译器根据调用处的静态类型分阶段查找适用方法，优先避免装箱和可变参数。初学阶段可以使用下面的近似顺序理解常见调用：

1. 精确匹配和不需要装箱的固定参数方法；
2. 基本类型拓宽等允许的方法调用转换；
3. 装箱、拆箱相关的固定参数方法；
4. 可变参数方法。

```java
describeNumber(3);  // 选择 int 参数
describeNumber(3L); // 选择 long 参数
```

最终规则还会比较哪个适用方法“更具体”。不要仅依赖记忆顺序处理复杂泛型、继承和装箱组合，应查看编译结果或简化 API。

::: warning 重载选择发生在编译期
变量的运行时对象类型不会像方法重写那样重新选择静态重载。调用方变量声明类型发生变化，就可能选择不同重载，即使其中保存的是同一个对象。
:::

### 3. null 可能产生重载歧义 {#三、null-可能产生重载歧义}

假设存在两个没有继承关系的引用类型重载：

```java
private static void printValue(String value) {
}

private static void printValue(Integer value) {
}

// printValue(null); // 编译错误：两个重载都适用且无法判断谁更具体
```

::: tip 通过 API 设计减少 null 重载歧义

可以强制转换消除歧义：`printValue((String) null)`，但公开 API 如果经常要求调用方这样做，通常说明重载设计不清晰。使用不同方法名或非空参数契约更容易维护。

:::

基本类型重载与包装类型重载混合时，还要考虑自动装箱和 `null` 只能匹配引用类型。重载数量越多，新增方法破坏既有调用编译结果的风险越高。

### 4. 用重载表达默认值 {#四、用重载表达默认值}

Java 没有 JavaScript 或 Kotlin 式默认参数语法。参数较少的重载可以委托给完整版本：

```java
private static String formatAmount(long amountCents) {
    return formatAmount(amountCents, "CNY");
}
```

默认值集中在一个入口，核心实现只保留一份。重载链不应形成循环委托，否则运行时会无限递归。

当可选参数数量很多或组合复杂时，参数对象、构建器或明确配置类型通常比指数增长的重载更合适。

## 二、可变参数在方法内部是数组 {#五、可变参数在方法内部是数组}

### 1. 调用参数如何形成数组

声明 `int... values` 后，方法体把 `values` 当作 `int[]`：

```java
private static int sum(int... values) {
    int total = 0;
    for (int value : values) {
        total = Math.addExact(total, value);
    }
    return total;
}
```

调用方可以传入零个、一个或多个独立参数，也可以传入现有数组：

```java
sum();
sum(2, 3, 5);
sum(new int[]{2, 3, 5});
```

::: info 可变参数的空数组与 null 不同

未传值时得到长度为 `0` 的数组，不是 `null`。调用方显式传入 `(int[]) null` 则仍可能让方法收到 `null`，公开 API 应说明是否接受这种调用。

:::

### 2. 数组语义对签名和空值的约束

可变参数改变的是调用语法，方法内部仍接收一个数组。因而声明时不能再把同类型数组入口当作另一种签名；传入现有数组时也不能假定方法获得了独立副本，需要修改元素的 API 必须说明副作用。

可变参数声明有以下限制：

- 一个方法最多一个可变参数；
- 必须位于参数列表最后；
- `int...` 与 `int[]` 不能形成两个独立重载，因为它们具有相同签名；
- 固定参数重载可能优先于可变参数，导致调用结果不直观。

## 三、递归的正确性与资源边界

递归是否得到正确结果，取决于终止、推进和结果组合；能否在当前进程中完成，还取决于调用深度和数值范围。这两类约束需要分别证明，存在终止条件并不意味着任意输入都可接受。

### 1. 递归必须包含终止与推进 {#六、递归必须包含终止与推进}

递归方法直接或间接调用自身。安全递归至少具备：

1. **输入约束**：拒绝不支持的范围；
2. **终止条件**：某些输入不再递归；
3. **状态推进**：每次调用更接近终止条件；
4. **结果组合**：把子问题结果组合为当前结果；
5. **深度上限**：输入规模不会耗尽线程栈。

阶乘递归：

```text
factorial(5)
→ 5 × factorial(4)
→ 5 × 4 × factorial(3)
→ 5 × 4 × 3 × factorial(2)
→ 5 × 4 × 3 × 2 × factorial(1)
→ 120
```

`number <= 1` 是终止条件，`number - 1` 是推进。示例把输入限制为 `0～20`，因为 `21!` 已超出 `long` 范围。

### 2. 递归会消耗线程栈 {#七、递归会消耗线程栈}

::: warning 尾递归不能假定为常量栈空间

每次递归调用都会创建新的栈帧。没有终止条件或输入过深时，JVM 抛出 `StackOverflowError`。Java 语言与 JVM 规范不保证尾调用优化，因此尾递归也不能假定为常量栈空间。

:::

线性累加、简单重试和长列表遍历通常更适合循环。树、目录、表达式和分治算法具有天然递归结构，但仍应评估最坏深度；来自用户或外部系统的任意深度数据尤其需要限制。

`StackOverflowError` 表示当前线程栈已经耗尽，不应在原递归中捕获后继续递归。正确处理是修复终止条件、限制输入、改用显式栈或迭代算法。

## 四、完整程序 {#八、完整程序}

将完整源码保存为 `AdvancedMethodsDemo.java`。默认路径验证重载、可变参数和有界递归；参数 `stack-overflow` 只用于在独立进程中复现无限递归失败。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看AdvancedMethodsDemo的完整代码

```java
/**
 * 演示方法重载、可变参数、递归和递归终止边界。
 */
public final class AdvancedMethodsDemo {

    /**
     * 工具类不需要实例化。
     */
    private AdvancedMethodsDemo() {
    }

    /**
     * 输出重载选择、可变参数和递归结果；传入 stack-overflow 可触发受控失败。
     *
     * @param args 可选失败模式 stack-overflow
     */
    public static void main(String[] args) {
        if (args.length == 1 && "stack-overflow".equals(args[0])) {
            recurseWithoutBaseCase(0);
            return;
        }

        System.out.println("default=" + formatAmount(1_990L));
        System.out.println("explicit=" + formatAmount(1_990L, "USD"));
        System.out.println("int overload=" + describeNumber(3));
        System.out.println("long overload=" + describeNumber(3L));
        System.out.println("varargs sum=" + sum(2, 3, 5));
        System.out.println("factorial 5=" + factorial(5));
    }

    /**
     * 使用默认币种格式化金额，并委托给完整重载。
     *
     * @param amountCents 金额，单位为分
     * @return 使用 CNY 币种的金额文本
     */
    private static String formatAmount(long amountCents) {
        return formatAmount(amountCents, "CNY");
    }

    /**
     * 使用指定币种格式化金额。
     *
     * @param amountCents 金额，单位为分
     * @param currencyCode 三位币种代码
     * @return 币种和分单位金额组成的文本
     */
    private static String formatAmount(long amountCents, String currencyCode) {
        return currencyCode + " " + amountCents;
    }

    /**
     * 描述 int 重载被选择的结果。
     *
     * @param value int 数值
     * @return 包含重载类型和值的文本
     */
    private static String describeNumber(int value) {
        return "int:" + value;
    }

    /**
     * 描述 long 重载被选择的结果。
     *
     * @param value long 数值
     * @return 包含重载类型和值的文本
     */
    private static String describeNumber(long value) {
        return "long:" + value;
    }

    /**
     * 合计零个或多个整数。
     *
     * @param values 要合计的整数数组；未传参数时为空数组
     * @return 所有参数的总和
     */
    private static int sum(int... values) {
        int total = 0;
        for (int value : values) {
            total = Math.addExact(total, value);
        }
        return total;
    }

    /**
     * 递归计算 0～20 的阶乘。
     *
     * @param number 取值范围为 0～20 的整数
     * @return number 的阶乘
     * @throws IllegalArgumentException number 超出支持范围时抛出
     */
    private static long factorial(int number) {
        if (number < 0 || number > 20) {
            throw new IllegalArgumentException("number 必须在 0～20 之间");
        }
        if (number <= 1) {
            return 1;
        }
        return Math.multiplyExact(number, factorial(number - 1));
    }

    /**
     * 故意省略终止条件，用于在受控进程中证明无限递归会耗尽线程栈。
     *
     * @param depth 当前递归深度
     */
    private static void recurseWithoutBaseCase(int depth) {
        recurseWithoutBaseCase(depth + 1);
    }
}
```

:::

## 五、编译、运行与输出 {#九、编译、运行与输出}

```powershell
javac -Xlint:all -g -encoding UTF-8 `
  -d out `
  AdvancedMethodsDemo.java

java -cp out AdvancedMethodsDemo
```

预期输出：

```text
default=CNY 1990
explicit=USD 1990
int overload=int:3
long overload=long:3
varargs sum=10
factorial 5=120
```

输出证明参数较少的重载委托了默认币种，整数后缀影响静态重载选择，可变参数形成数组并参与循环，递归在终止条件处正确返回。

## 六、栈溢出复现 {#十、受控复现-stackoverflowerror}

::: danger 栈溢出只能在独立学习进程中复现

只在独立学习进程中执行，并通过较小线程栈缩短失败时间：

:::

```powershell
java -Xss256k `
  -cp out `
  AdvancedMethodsDemo `
  stack-overflow
```

关键错误类型为：

```text
Exception in thread "main" java.lang.StackOverflowError
```

调用栈会重复出现 `recurseWithoutBaseCase`。重复栈帧证明每次调用没有进入终止分支；不要在共享服务进程中运行这个故障注入。

## 七、设计边界 {#十一、设计边界}

| 能力 | 适合使用 | 应避免 |
|------|----------|--------|
| 重载 | 同一职责的不同输入形态或便利默认入口 | 用同名掩盖完全不同职责 |
| 可变参数 | 同类型、数量较少且自然成组的值 | 用它代替结构清楚的参数对象 |
| 递归 | 树、分治和递归定义结构 | 无深度上限的外部输入、简单线性处理 |

## 八、规范依据 {#十二、规范依据}

- [JLS 8.4.9：Overloading](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.9) 定义方法重载与签名关系。
- [JLS 8.4.1：Formal Parameters](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.1) 定义可变参数声明及其数组语义。
- [JLS 15.12.2：Determine Method Signature](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.2) 定义适用方法查找阶段。
- [JVMS 2.5.2：Java Virtual Machine Stacks](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5.2) 定义线程私有 JVM 栈与 `StackOverflowError` 条件。

重载、可变参数和递归在 Java 8 与 Java 21 中具有相同核心规则。本篇示例使用 `String.formatted`，Java 8 维护代码可改用 `String.format`，这不改变方法模型。
