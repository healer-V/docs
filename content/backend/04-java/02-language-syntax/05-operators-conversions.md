---
title: "运算符与类型转换"
tags:
  - Java 21
  - 运算符
  - 类型转换
excerpt: "解释 Java 表达式的类型、优先级和从左到右求值规则，并通过整数除法、短路逻辑、数值提升、窄化与复合赋值验证结果边界。"
date: 2026-09-02
---

# 运算符与类型转换 {#运算符、表达式与类型转换}

表达式会在特定类型规则下求值得到结果。读懂表达式不能只看运算符符号，还要同时判断操作数类型、优先级、结合方式、求值顺序和可能发生的隐式转换。

## 一、表达式具有类型和值

```java
int subtotal = 1_990 * 2;
```

`1_990 * 2` 是类型为 `int`、值为 `3980` 的表达式。赋值转换检查该结果能否存入左侧变量。

表达式可能产生值，也可能带来副作用：

```java
int current = itemCount++; // 先取得旧值，再修改 itemCount
```

::: tip 把状态修改拆成可观察的步骤

在复杂表达式中混入自增、赋值和方法调用会降低可读性。业务代码通常把状态修改拆成独立语句，让每一步的输入和结果可以观察。

:::

## 二、优先级、结合性与求值顺序

### 1. 优先级决定分组

乘除优先于加减：

```java
int result = 2 + 3 * 4; // 等价于 2 + (3 * 4)，结果 14
```

括号可以显式改变分组：

```java
int grouped = (2 + 3) * 4; // 结果 20
```

不应要求读者记住整张优先级表。只要一个表达式混合多类运算且意图不能立即看清，就应使用括号或拆分中间变量。

### 2. 操作数按从左到右求值

Java 保证运算符操作数从左到右求值。优先级决定语法分组，不会把右侧操作数的副作用提前到左侧之前。

```java
int value = first() + second();
```

`first()` 完成后才会调用 `second()`。这比某些语言提供更确定的执行顺序，但仍不应依赖难以阅读的副作用表达式。

## 三、算术运算边界

| 运算 | 运算符 | 主要边界 |
|------|--------|----------|
| 加减乘 | `+`、`-`、`*` | 整数可能静默溢出 |
| 除法 | `/` | 整数截断小数，整数除零抛异常 |
| 取余 | `%` | 结果符号和被除数相关 |
| 一元正负 | `+`、`-` | 最小整数取负仍可能溢出 |

整数除法不会自动产生小数：

```java
int quotient = 5 / 2;        // 2
double decimal = 5 / 2.0;    // 2.5
double tooLate = (double) (5 / 2); // 2.0
```

转换必须发生在整数除法之前，才能改变运算类型。整数除以 `0` 抛出 `ArithmeticException`；浮点数除以 `0.0` 按 IEEE 754 产生 Infinity 或 NaN。

## 四、比较与逻辑运算

比较表达式产生 `boolean`：

```java
boolean enoughStock = stock >= requested;
boolean sameCount = expected == actual;
```

`&&` 和 `||` 采用短路求值：

```java
boolean hasStock = stocks != null && stocks.length > 0 && stocks[0] > 0;
```

::: warning 短路条件的顺序不能随意重排

如果 `stocks == null`，后续数组访问不会执行，因此表达式安全返回 `false`。条件顺序就是安全契约，不能随意重排。

:::

布尔值也支持 `&`、`|` 和 `^`，其中 `&`、`|` 会求值两侧。它们同时是整数位运算符，适合位掩码或确实需要两侧副作用的特殊场景，不应替代普通条件中的 `&&`、`||`。

`!` 对布尔值取反。连续多次取反或包含大量否定条件时，应改用有业务含义的布尔变量名。

## 五、数值提升与拓宽转换

### 1. 小整数运算提升为 int

`byte`、`short` 和 `char` 参与大多数二元算术运算时会先提升为 `int`：

```java
byte left = 100;
short right = 28;
int total = left + right;
```

不能直接写 `byte total = left + right`，因为表达式类型是 `int`，即使当前值 `128` 还暴露了它已超出 `byte` 最大值。

### 2. 拓宽不总是保持精确值

常见自动拓宽方向为：

```text
byte → short → int → long → float → double
             char ↗
```

::: info 类型拓宽仍可能损失精度

拓宽保证目标类型覆盖源类型的数值范围方向，但 `long` 转为 `float`、`double` 时仍可能丢失低位精度。是否安全必须结合值域和精度，不应只看是否需要强制转换。

:::

## 六、窄化转换与信息丢失

从大范围类型转为小范围类型通常需要显式强制转换：

```java
long largeValue = 3_000_000_000L;
int narrowed = (int) largeValue;
```

转换结果是 `-1294967296`，不会自动抛出异常。强制转换只表示开发者要求执行转换，不表示结果通过范围验证。

需要拒绝越界值时，应先检查范围或使用标准 API：

```java
int exact = Math.toIntExact(largeValue); // 超出 int 范围时抛出 ArithmeticException
```

浮点转整数会丢弃小数部分，并对超范围和 NaN 使用规范规定的结果。金额、计数和标识转换必须设计精度与失败策略，不能靠强制转换静默接受损失。

## 七、复合赋值包含隐式转换

普通赋值不能把 `int` 表达式直接存回 `byte`：

```java
byte quantity = 100;
// quantity = quantity + 30; // 编译错误
```

复合赋值会包含隐式窄化转换：

```java
quantity += 30; // 近似等价于 quantity = (byte) (quantity + 30)
```

::: warning 复合赋值能编译不代表结果安全

结果为 `-126`。复合赋值能编译不表示结果安全；对库存、金额和容量等业务值，应使用范围足够的类型和显式溢出检查。

:::

## 八、字符串拼接受左侧结果影响

`+` 只要一侧为字符串，就进行字符串拼接，并按从左到右求值：

```java
System.out.println("total=" + 2 + 3);   // total=23
System.out.println("total=" + (2 + 3)); // total=5
```

第一条先得到字符串 `"total=2"`，再拼接 `3`。需要计算数值时使用括号或先存入数值变量，不要依赖读者猜测拼接边界。

## 九、完整程序

将完整源码保存为 `OperatorsConversionsDemo.java`。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看OperatorsConversionsDemo的完整代码

```java
/**
 * 演示运算符优先级、短路求值、数值提升和窄化转换。
 */
public final class OperatorsConversionsDemo {

    /**
     * 工具类不需要实例化。
     */
    private OperatorsConversionsDemo() {
    }

    /**
     * 输出同一组值在不同表达式和转换规则下的结果。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        printPrecedenceAndDivision();
        printShortCircuitResult();
        printNumericConversions();
    }

    /**
     * 对比运算符优先级、括号和整数除法。
     */
    private static void printPrecedenceAndDivision() {
        int precedence = 2 + 3 * 4;
        int grouped = (2 + 3) * 4;
        int integerDivision = 5 / 2;
        double decimalDivision = 5 / 2.0;

        System.out.println("precedence=" + precedence);
        System.out.println("grouped=" + grouped);
        System.out.println("integer division=" + integerDivision);
        System.out.println("decimal division=" + decimalDivision);
    }

    /**
     * 验证逻辑与会在左侧为 false 时跳过右侧数组访问。
     */
    private static void printShortCircuitResult() {
        int[] stocks = null;
        boolean hasStock = stocks != null && stocks.length > 0 && stocks[0] > 0;

        System.out.println("short circuit=" + hasStock);
    }

    /**
     * 输出二元数值提升、显式窄化和复合赋值的隐式转换结果。
     */
    private static void printNumericConversions() {
        byte left = 100;
        short right = 28;
        int promoted = left + right;

        long largeValue = 3_000_000_000L;
        int narrowed = (int) largeValue;

        byte quantity = 100;
        quantity += 30;

        System.out.println("promoted=" + promoted);
        System.out.println("narrowed=" + narrowed);
        System.out.println("compound byte=" + quantity);
    }
}
```

:::

## 十、编译、运行与输出

```powershell
javac -Xlint:all -encoding UTF-8 `
  -d out `
  OperatorsConversionsDemo.java

java -cp out OperatorsConversionsDemo
```

预期输出：

```text
precedence=14
grouped=20
integer division=2
decimal division=2.5
short circuit=false
promoted=128
narrowed=-1294967296
compound byte=-126
```

结果分别证明了优先级分组、整数除法、短路、二元数值提升、窄化截断和复合赋值的隐式转换。

## 十一、错误判断与处理

| 现象 | 原因 | 处理方式 |
|------|------|----------|
| 平均值少了小数 | 除法两侧都是整数 | 在除法前把一个操作数转换为合适浮点或精确十进制类型 |
| 条件仍抛空指针 | 空值检查放在访问之后，或使用了 `&` | 把非空判断放在短路链最左侧并使用 `&&` |
| 强转后得到负数 | 数值超出目标整数范围发生截断 | 检查范围或使用 `Math.toIntExact` |
| `byte +=` 后变负 | 复合赋值隐式窄化并溢出 | 改用范围足够的类型并检查结果 |
| 拼接结果是 `23` 而不是 `5` | 左侧已变为字符串 | 对数值表达式加括号或先计算 |

## 十二、规范依据

- [JLS 5：Conversions and Contexts](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html) 定义赋值、调用、字符串和数值转换。
- [JLS 15：Expressions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html) 定义表达式求值、运算符和从左到右规则。
- [JLS 15.7：Evaluation Order](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.7) 定义操作数和实参求值顺序。
- [JLS 15.26.2：Compound Assignment Operators](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.26.2) 定义复合赋值包含的隐式转换。

这些数值和表达式核心规则在 Java 8 与 Java 21 中基本一致。维护旧代码时仍要警惕复合赋值、整数溢出和字符串拼接，不应把它们误认为新版 Java 才存在的问题。
