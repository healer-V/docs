---
title: "BigInteger 与 BigDecimal"
tags:
  - Java 21
  - BigInteger
  - BigDecimal
  - 金额
excerpt: "解释任意精度整数和十进制数的表示、构造、运算、scale、比较与舍入规则，并通过订单金额计算复现无限小数除法失败。"
date: 2026-09-03
---

# BigInteger 与 BigDecimal

`BigInteger` 表示超出基本整数范围的任意精度整数，`BigDecimal` 表示任意精度十进制数。两者都是不可变对象，运算必须接收返回值；金额计算还必须明确构造来源、舍入时机和 `scale`。

## 一、BigInteger 避免固定宽度溢出

`long` 最大值约为 9.22 × 10¹⁸，超过范围后普通算术会回绕。`BigInteger` 根据数值大小扩展内部表示：

```java
BigInteger value = BigInteger.valueOf(2).pow(100);
System.out.println(value);
```

结果 `1267650600228229401496703205376` 无法放入 `long`。常用运算不是 `+ - * /`，而是方法：

| 运算 | API | 说明 |
|------|-----|------|
| 加法 | `add` | 返回新 `BigInteger` |
| 减法 | `subtract` | 结果可以为负 |
| 乘法 | `multiply` | 大数成本随位数增长 |
| 整除 | `divide` | 除数为零时抛出异常 |
| 余数 | `remainder` | 符号语义需结合业务确认 |
| 幂 | `pow` | 指数必须为非负 `int` |
| 比较 | `compareTo` | 返回负数、0 或正数 |

::: warning 任意精度仍然受到计算资源限制

“任意精度”不等于无限资源。攻击者提供极长数字或巨大指数可能消耗大量内存和 CPU，外部输入仍要限制长度、范围和运算复杂度。

:::

## 二、BigDecimal 的值与尺度 {#二、bigdecimal-的值由整数和-scale-组成}

`BigDecimal` 可理解为“任意精度整数 × 10 的负 scale 次方”。

| 文本 | 未缩放值 | scale | 数学值 |
|------|----------|-------|--------|
| `"19.90"` | `1990` | 2 | 19.90 |
| `"10.0"` | `100` | 1 | 10.0 |
| `"10.00"` | `1000` | 2 | 10.00 |

`scale` 不只是显示格式，也参与 `equals`。财务模型应决定金额是否统一两位小数、利率保留多少位，以及中间计算何时允许更高精度。

## 三、从准确来源构造十进制数

### 1. 优先使用字符串或精确整数

```java
BigDecimal price = new BigDecimal("19.90");
BigDecimal quantity = BigDecimal.valueOf(3);
```

字符串直接描述期望十进制值；`valueOf(long)` 同样精确。数据库 DECIMAL、JSON 金额文本和配置值应尽量保持十进制来源。

### 2. 不要直接传入 double

```java
new BigDecimal(0.1)
```

::: warning 十进制构造无法恢复已有浮点误差

`0.1` 先成为不能精确表示该十进制值的二进制 `double`，构造器会忠实保存这个近似值，得到很长的小数。必须从已有 `double` 转换时，`BigDecimal.valueOf(0.1)` 会使用 `Double.toString` 的规范十进制文本，通常得到期望的 `0.1`，但原始计算中的精度损失无法恢复。

:::

## 四、十进制运算与舍入

构造来源决定输入是否准确，运算方法决定结果如何表示，舍入规则决定哪些精度可以丢弃。三个边界必须保持一致：准确构造不能补救后续过早舍入，不可变对象也不会自动保存运算结果。

### 1. 所有算术都会返回新对象 {#四、所有算术都会返回新对象}

```java
BigDecimal price = new BigDecimal("19.90");
price.multiply(BigDecimal.valueOf(3));
System.out.println(price); // 仍为 19.90
```

必须接收结果：

```java
BigDecimal subtotal = price.multiply(BigDecimal.valueOf(3));
```

加减运算会根据操作数确定结果 `scale`，乘法的 `scale` 通常相加。不能只看数学值，还要检查最终接口所需的小数位数。

### 2. 除法必须处理无限小数 {#五、除法必须处理无限小数}

`1 / 3` 没有有限十进制表示，直接调用无舍入版本会抛出 `ArithmeticException`：

```java
BigDecimal result = BigDecimal.ONE.divide(new BigDecimal("3"));
```

调用方必须给出结果精度或 `MathContext`：

```java
BigDecimal result = BigDecimal.TEN.divide(
        new BigDecimal("3"),
        2,
        RoundingMode.HALF_UP
); // 3.33
```

舍入不是技术默认值，而是业务规则。税费、银行计息、商品展示可能分别要求 `HALF_UP`、`HALF_EVEN`、向下截断或禁止舍入，应在领域边界命名并测试。

带 `scale` 的除法重载限定小数位数；`MathContext` 则限定整个结果的有效数字位数。例如“保留两位小数”和“保留两位有效数字”对较大的金额会产生不同结果，不能把两个参数都解释成“小数精度”。应先写清结算规则，再选择对应重载。

::: tip 在业务规定的结算点统一舍入

过早对每个中间步骤保留两位会累计误差。通常保留足够中间精度，在业务规定的结算点统一舍入；发票逐行舍入等规则例外必须显式实现。

:::

## 五、数值比较与表示相等 {#六、equals-与-compareto-语义不同}

### 1. 数学值比较与表示相等

```java
BigDecimal first = new BigDecimal("10.0");
BigDecimal second = new BigDecimal("10.00");

first.equals(second);    // false：值和 scale 都必须相同
first.compareTo(second); // 0：数学值相同
```

业务只关心金额大小时使用 `compareTo`：

```java
if (amount.compareTo(BigDecimal.ZERO) < 0) {
    throw new IllegalArgumentException("金额不能为负数");
}
```

`BigDecimal` 的自然顺序与 `equals` 不完全一致，用作 `HashSet`、`HashMap` 键或跨系统相等比较前应统一 `scale`。

### 2. 去尾零与固定尺度的用途不同

`stripTrailingZeros` 会改变 `scale`。例如 `600.0` 去除尾随零后可表示为 `6E+2`，其 `scale` 为 -2；数值为零时返回 `BigDecimal.ZERO`，其 `scale` 为 0。因此它不能作为固定保留两位小数的格式化工具。具体规则见 [stripTrailingZeros API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html#stripTrailingZeros())。

固定尺度用于表达接口或结算契约，应通过 `setScale` 明确建立，并在需要减少小数位时给出舍入规则。去尾零用于消除表示中的冗余零，不会替业务选择币种或小数位；序列化文本与集合键都应使用各自已约定的表示方式。

## 六、金额对象需要明确币种和尺度 {#七、金额对象需要明确币种和尺度}

单独的 `BigDecimal` 不能说明币种、合法小数位和舍入规则。生产模型通常应组合：

- 金额数值；
- ISO 币种代码或 `Currency`；
- 允许的 scale；
- 运算与舍入策略；
- 序列化和数据库列约束。

另一种方式是使用 `long` 保存最小货币单位，例如人民币分。它计算快且尺度明确，但仍有范围上限，不适合不同小数位币种或利率中间结果。选型应由业务表示范围决定。

## 七、运行订单金额示例 {#八、运行订单金额示例}

完整源码保存为 `BigNumbersDemo.java`。三件单价 19.90 的商品按应付比例 0.85 计算，在结算点使用 `HALF_UP` 保留两位。


将以下代码保存为 `BigNumbersDemo.java`：

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看 BigNumbersDemo 完整代码

```java [BigNumbersDemo.java]
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;

/**
 * 演示 BigInteger 大整数、BigDecimal 金额、scale、比较和舍入规则。
 */
public final class BigNumbersDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private BigNumbersDemo() {
    }

    /**
     * 输出大整数、精确金额与十进制构造差异；可选参数触发无限小数除法失败。
     *
     * @param args 传入 divide-without-rounding 时复现 ArithmeticException
     */
    public static void main(String[] args) {
        if (args.length > 0 && "divide-without-rounding".equals(args[0])) {
            System.out.println(BigDecimal.ONE.divide(new BigDecimal("3")));
            return;
        }

        BigInteger huge = BigInteger.valueOf(2).pow(100);
        BigDecimal unitPrice = new BigDecimal("19.90");
        BigDecimal payable = calculatePayable(unitPrice, 3, new BigDecimal("0.85"));
        BigDecimal scaleOne = new BigDecimal("10.0");
        BigDecimal scaleTwo = new BigDecimal("10.00");

        System.out.println("2^100=" + huge);
        System.out.println("subtotal=" + unitPrice.multiply(BigDecimal.valueOf(3)));
        System.out.println("payable=" + payable);
        System.out.println("double constructor=" + new BigDecimal(0.1));
        System.out.println("valueOf double=" + BigDecimal.valueOf(0.1));
        System.out.println("equals with scale=" + scaleOne.equals(scaleTwo));
        System.out.println("compare with scale=" + scaleOne.compareTo(scaleTwo));
        System.out.println("10 / 3=" + BigDecimal.TEN.divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP));
    }

    /**
     * 计算数量小计和折扣，并按人民币分使用四舍五入保留两位小数。
     *
     * @param unitPrice 非负商品单价
     * @param quantity 正整数商品数量
     * @param multiplier 0～1 之间的应付比例，例如 0.85 表示支付原价的 85%
     * @return scale 为 2 的应付金额
     */
    private static BigDecimal calculatePayable(
            BigDecimal unitPrice,
            int quantity,
            BigDecimal multiplier
    ) {
        if (unitPrice.signum() < 0 || quantity <= 0
                || multiplier.compareTo(BigDecimal.ZERO) < 0
                || multiplier.compareTo(BigDecimal.ONE) > 0) {
            throw new IllegalArgumentException("金额、数量或应付比例无效");
        }
        return unitPrice
                .multiply(BigDecimal.valueOf(quantity))
                .multiply(multiplier)
                .setScale(2, RoundingMode.HALF_UP);
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out BigNumbersDemo.java
java -cp out BigNumbersDemo
```

预期输出：

```text
2^100=1267650600228229401496703205376
subtotal=59.70
payable=50.75
double constructor=0.1000000000000000055511151231257827021181583404541015625
valueOf double=0.1
equals with scale=false
compare with scale=0
10 / 3=3.33
```

原始乘积为 `50.7450`，按指定规则得到 `50.75`。直接从 `double` 构造产生的长小数也证明问题发生在输入表示边界。

运行未指定舍入的失败路径：

```powershell
java -cp out BigNumbersDemo divide-without-rounding
```

::: warning 舍入异常不能用返回零掩盖

进程以非零状态结束并报告 `ArithmeticException: Non-terminating decimal expansion`。修复需要选择业务认可的 scale 和 `RoundingMode`，不能只捕获异常后返回零。

:::

## 八、Java 8 维护线与常见错误 {#九、java-8-维护线与常见错误}

Java 8 已包含本文使用的 `BigInteger`、`BigDecimal` 和 `RoundingMode` 核心能力，金额算法可以保持一致。维护时重点核对数据库驱动返回的 scale、JSON 序列化格式和历史 `double` 转换，而不是寻找新版本替代 API。

| 错误 | 后果 | 修正 |
|------|------|------|
| `new BigDecimal(double)` | 保存二进制近似值 | 使用字符串或 `valueOf` |
| 忽略运算返回值 | 原对象完全不变 | 接收每一步新结果 |
| 除法不指定舍入 | 无限小数直接抛异常 | 使用明确 scale 与舍入模式 |
| 金额用 `equals` 比数学值 | scale 不同导致不相等 | 统一 scale 或使用 `compareTo` |
| 每一步都保留两位 | 累计舍入误差 | 在规定结算点舍入 |
| 不限制大数输入 | CPU 和内存资源耗尽 | 限制字符长度、指数和运算规模 |

规范依据可参阅 [Java 21 BigInteger API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigInteger.html)、[BigDecimal API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html) 与 [RoundingMode API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/RoundingMode.html)。
