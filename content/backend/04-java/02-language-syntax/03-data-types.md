---
title: "基本数据类型"
tags:
  - Java
  - Java 21
  - 数据类型
excerpt: "解释 Java 八种基本类型的值域、字面量、整数溢出、浮点精度和 Unicode 边界，并通过可运行示例建立面向真实业务的类型选择方法。"
date: 2026-09-02
---

# 基本数据类型 {#java-基本数据类型}

Java 是静态类型语言。变量和表达式的类型在编译期已知，类型决定它可以保存哪些值、可以参与哪些运算，以及运算结果采用什么表示方式。Java 预定义了八种基本类型：`byte`、`short`、`int`、`long`、`float`、`double`、`char` 和 `boolean`。

基本类型不是对象，也不能保存 `null`。它们与 `String`、数组、自定义类等引用类型属于不同的类型体系。基本类型与引用类型之间的赋值、对象生命周期和 `null` 语义由“引用类型、数组与 null”单独负责；本文只处理八种基本类型本身。

## 一、基本类型的值模型

### 1. 八种基本类型的分类

八种基本类型可以分为整数、浮点、字符和布尔四组。其中，JLS 将 `char` 也归入整数类型，因为 `char` 保存的是一个 16 位无符号整数值，只是这个值通常被解释为 UTF-16 代码单元。

| 分类 | 类型 | 语言规定的表示或值域 | 典型用途 |
|------|------|----------------------|----------|
| 有符号整数 | `byte` | 8 位二进制补码，-128～127 | 原始字节、协议字段、小范围底层数据 |
| 有符号整数 | `short` | 16 位二进制补码，-32,768～32,767 | 受外部格式约束的 16 位整数 |
| 有符号整数 | `int` | 32 位二进制补码，-2³¹～2³¹-1 | 数量、索引、普通整数计算 |
| 有符号整数 | `long` | 64 位二进制补码，-2⁶³～2⁶³-1 | 大范围计数、毫秒时间戳 |
| 二进制浮点 | `float` | IEEE 754 binary32 | 明确要求 32 位浮点的接口或大规模数值数组 |
| 二进制浮点 | `double` | IEEE 754 binary64 | 测量值、统计值和允许近似的科学计算 |
| UTF-16 代码单元 | `char` | 0～65,535，即 `\u0000`～`\uffff` | 单个 UTF-16 代码单元、协议或底层文本处理 |
| 逻辑值 | `boolean` | `true`、`false` | 二元条件和状态判断 |

::: info 语言位宽不等于对象内存占用

表中的位数描述 Java 语言规定的数值格式或值域，不等同于“一个字段在所有 JVM 中恰好占多少字节”。例如 JLS 只规定 `boolean` 有两个值，没有规定它必须使用一位或一个字节存储；对象布局、字段对齐和数组表示属于 JVM 实现层面的问题。

:::

### 2. 基本类型变量保存值

基本类型变量保存该类型的值。把一个基本类型变量赋给另一个变量时，得到的是数值副本，修改副本不会反向修改原变量。

```java
int originalQuantity = 2;
int copiedQuantity = originalQuantity;

copiedQuantity = 5;

System.out.println(originalQuantity); // 2
System.out.println(copiedQuantity);   // 5
```

这条规则适用于参数传递：方法收到的是实参值的副本。对于基本类型，副本就是基本值本身；对于引用类型，复制的是引用值。参数传递的完整调用语义在方法章节中展开。

### 3. 默认值不适用于局部变量

实例字段、静态字段和数组元素会获得语言规定的初始值，但局部变量在读取之前必须经过确定赋值分析。

| 类型 | 字段或数组元素的初始值 |
|------|------------------------|
| `byte`、`short`、`int`、`long` | `0` |
| `float`、`double` | 正零，即 `0.0` |
| `char` | `\u0000` |
| `boolean` | `false` |

下面的 `quantity` 是局部变量，编译器不会替它填入 `0`：

```java
int quantity;
// System.out.println(quantity); // 编译错误：变量 quantity 可能尚未初始化
```

::: warning 初始值不是业务默认值
语言提供的 `0`、`false` 或 `\u0000` 只保证对象和数组初始化具有确定状态。订单数量、库存和支付状态仍应由构造逻辑显式校验，不能因为字段自动为 `0` 就把它视为合法业务值。
:::

## 二、整数类型与字面量

### 1. 二进制补码与固定值域

`byte`、`short`、`int` 和 `long` 都是有符号二进制补码整数。对一个宽度为 n 位的类型，可表示范围是 -2ⁿ⁻¹～2ⁿ⁻¹-1。负数一侧比正数一侧多一个值，因此 `Integer.MIN_VALUE` 的绝对值无法用正 `int` 表示。

```java
System.out.println(Byte.MIN_VALUE);    // -128
System.out.println(Short.MAX_VALUE);   // 32767
System.out.println(Integer.MIN_VALUE); // -2147483648
System.out.println(Long.MAX_VALUE);    // 9223372036854775807
```

Java 没有通用的无符号整数基本类型。`Byte.toUnsignedInt`、`Integer.compareUnsigned` 等 API 可以按无符号规则解释某些位模式，但变量本身仍是 `byte` 或 `int`；不要把“提供无符号运算 API”误解为“Java 新增了 unsigned 基本类型”。

### 2. 整数字面量的进制、后缀和下划线

整数可以写成十进制、十六进制、八进制或二进制。进制只影响源码表示，不改变变量最终保存的值。

```java
int decimal = 26;
int hexadecimal = 0x1a;
int octal = 032;
int binary = 0b11010;

System.out.println(decimal == hexadecimal); // true
System.out.println(decimal == octal);       // true
System.out.println(decimal == binary);      // true
```

常用字面量规则如下：

| 写法 | 规则 | 示例 |
|------|------|------|
| 十进制整数 | 无后缀时通常是 `int`，超出 `int` 正数范围需使用 `L` | `5_000_000_000L` |
| 十六进制整数 | 使用 `0x` 或 `0X` 前缀 | `0xff` |
| 二进制整数 | 使用 `0b` 或 `0B` 前缀 | `0b1111_0000` |
| 八进制整数 | 以 `0` 开头 | `0755`，业务代码中应谨慎使用 |
| `long` 后缀 | 使用 `L` 或 `l`，推荐大写 `L` 避免与数字 `1` 混淆 | `9_000_000_001L` |
| 数字分隔符 | 可在数字之间使用 `_` 提高可读性，不改变数值 | `2_147_483_647` |

十六进制、八进制和二进制字面量还可以直接表达一个完整 32 位 `int` 位模式。例如 `0xffff_ffff` 的类型是 `int`，解释为补码后数值是 `-1`：

```java
int allBitsSet = 0xffff_ffff;
System.out.println(allBitsSet); // -1
```

这类写法适合位掩码和协议处理。普通数量、金额或业务编号使用十进制更容易审查。

### 3. 小整数参与运算时会提升为 int

常量 `100` 在 `byte` 范围内，因此编译器允许把它直接赋给 `byte`。但两个 `byte` 变量执行加法时，操作数会先进行二元数值提升，结果类型是 `int`。

```java
byte left = 100;
byte right = 28;

int sum = left + right;
// byte invalidSum = left + right; // 编译错误：int 不能隐式窄化为 byte

System.out.println(sum); // 128
```

提升可以避免许多中间结果在 8 位或 16 位空间内立即回绕，但最终的 `int` 或 `long` 运算仍可能溢出。不要根据接收变量的类型推断运算精度：

```java
int dailyRequests = 1_500_000_000;

long wrongTotal = dailyRequests * 2;  // 先执行 int 乘法，再把错误结果转为 long
long correctTotal = dailyRequests * 2L; // 2L 使运算提升为 long

System.out.println(wrongTotal);   // -1294967296
System.out.println(correctTotal); // 3000000000
```

### 4. 整数溢出不会自动报错

整数运算结果超出值域时，普通 `+`、`-`、`*` 等运算不会抛出异常，也不会自动扩展类型。结果保留固定位宽内的低位，因此最大值加一会回到最小值。

```java
int overflowed = Integer.MAX_VALUE + 1;
System.out.println(overflowed); // -2147483648
```

需要把溢出作为错误处理时，使用 `Math.addExact`、`Math.subtractExact`、`Math.multiplyExact` 或 `Math.toIntExact`：

```java
try {
    int checked = Math.addExact(Integer.MAX_VALUE, 1);
    System.out.println(checked);
} catch (ArithmeticException exception) {
    System.out.println(exception.getMessage()); // integer overflow
}
```

::: warning 强制转换不能修复已经发生的溢出
表达式 `(long) (dailyRequests * 2)` 先以 `int` 完成乘法，再转换错误结果。要提升运算本身，应在运算前转换操作数，例如 `(long) dailyRequests * 2`，或使用 `2L`。
:::

## 三、浮点类型与精度

### 1. 二进制浮点数 {#_1-float-和-double-表示二进制浮点数}

`float` 对应 IEEE 754 binary32，`double` 对应 binary64。浮点值由符号、有效数字和指数共同表示，因此可以覆盖很大的数量级，但不能精确表示这个范围内的每一个实数。

| 类型 | 格式宽度 | 有效数字精度 | 约十进制有效位数 | 字面量写法 |
|------|----------|--------------|------------------|------------|
| `float` | 32 位 | 24 个二进制有效位 | 6～7 位 | `0.85F`，`F` 不可省略 |
| `double` | 64 位 | 53 个二进制有效位 | 15～16 位 | `12.75`，默认即为 `double` |

“64 位”不表示小数点后固定有 64 位，也不表示 `double` 能精确保存 15 位小数。可用精度与数值大小相关；约 15～16 位说的是整个数值的十进制有效数字。

```java
float discountRate = 0.85F;
double packageWeight = 12.75;
double scientific = 6.022_140_76e23;
```

### 2. 十进制小数通常不能被精确表示

二进制浮点使用 2 的幂表示分数。十进制 `0.1` 在二进制中是无限循环小数，只能舍入到最近的可表示值。两个近似值相加后，误差会体现在输出中：

```java
double result = 0.1 + 0.2;
System.out.println(result);        // 0.30000000000000004
System.out.println(result == 0.3); // false
```

::: warning 精确结算不能直接使用二进制浮点数

这不是随机误差，也不是 Java 输出格式的故障，而是表示模型的直接结果。比较测量值时需要根据业务误差模型选择绝对误差或相对误差，不能给所有数据套一个固定 `0.000001`。金额、税率结算等需要精确十进制语义的场景，不应直接使用 `float` 或 `double`；通常选择以最小货币单位保存的受控整数，或使用 `BigDecimal`。

:::

### 3. Infinity、NaN 和有符号零

浮点运算还包含正负无穷、NaN（Not a Number）以及正零和负零。它们与整数异常规则不同：

```java
double positiveInfinity = 1.0 / 0.0;
double notANumber = 0.0 / 0.0;

System.out.println(positiveInfinity);          // Infinity
System.out.println(notANumber);                // NaN
System.out.println(notANumber == notANumber);  // false
System.out.println(Double.isNaN(notANumber));  // true
```

浮点除以零得到无穷或 NaN，不会像整数除以零那样抛出 `ArithmeticException`。NaN 与包括自身在内的任何数做 `==` 比较都为 `false`，应使用 `Double.isNaN` 或 `Float.isNaN` 判断。

浮点溢出通常得到无穷，逐渐下溢则可能失去精度并最终变成零。接收外部计算结果时，如果业务只允许有限数，应使用 `Double.isFinite` 或 `Float.isFinite` 显式校验。

## 四、char 与 Unicode 文本

### 1. char 表示 UTF-16 代码单元

`char` 是 16 位无符号整数类型，可使用字符字面量、转义字符或 Unicode 转义表示：

```java
char grade = 'A';
char chineseCodeUnit = '中';
char lineFeed = '\n';
char unicodeA = '\u0041';

System.out.println((int) grade);    // 65
System.out.println(unicodeA == 'A'); // true
```

::: info 一个 Unicode 码点可能需要两个 char

`char` 能完整表示基本多文种平面中的单个代码单元，但 Unicode 码点范围是 U+0000～U+10FFFF。大于 U+FFFF 的补充字符在 UTF-16 中需要一对代理代码单元，因此一个 Unicode 码点可能占两个 `char`。

:::

```java
String emoji = "\uD83D\uDE00";

System.out.println(emoji.length()); // 2：UTF-16 代码单元数量
System.out.println(emoji.codePointCount(0, emoji.length())); // 1：Unicode 码点数量
```

即使按码点遍历，一个用户看到的字形也可能由多个码点组成，例如字母与组合附加符号、带肤色修饰的表情或家庭表情序列。因此：

- 协议明确要求 16 位代码单元时，可以使用 `char`；
- 普通业务文本使用 `String`；
- 按 Unicode 字符处理时，使用 `codePoints()`、`codePointAt()` 等码点 API；
- 按用户可见字形截断文本时，需要使用支持字素簇的文本库或 API，不能按 `char` 下标直接截断。

### 2. char 可以参与整数运算

因为 `char` 是整数类型，它参与算术运算时通常提升为 `int`：

```java
char letter = 'A';
int nextCodeUnit = letter + 1;

System.out.println(nextCodeUnit);        // 66
System.out.println((char) nextCodeUnit); // B
```

这只是在操作代码单元数值，不等于可靠的自然语言字符转换。大小写映射、规范化和本地化规则应使用专门的文本 API。

## 五、boolean 与条件语义

### 1. boolean 只有两个逻辑值

`boolean` 只保存 `true` 或 `false`。Java 不允许数字、字符串、对象或 `null` 隐式转换为布尔值，也不允许在数值类型与 `boolean` 之间强制转换。

```java
int stock = 3;
boolean hasStock = stock > 0;

if (hasStock) {
    System.out.println("库存可用");
}

// if (stock) { } // 编译错误：int 不能转换为 boolean
```

::: tip 把布尔条件写成明确的业务判断

与 JavaScript 不同，Java 没有 truthy 或 falsy 规则。判断数量时写 `quantity > 0`，判断引用时写 `value != null`，让条件的真实业务含义直接出现在表达式中。

:::

### 2. 二元状态不等于所有业务状态

`boolean` 适合“是或否”且语义稳定的属性，例如 `enabled`。如果一个字段实际存在“未审核、通过、拒绝”三种状态，使用两个 `boolean` 会产生非法组合，应该改用枚举或专门的状态类型。

```text
错误建模：approved=false, rejected=false  到底表示未审核还是数据缺失？
更清楚的建模：reviewStatus = PENDING | APPROVED | REJECTED
```

类型选择不仅考虑能否保存当前值，还要保证非法状态难以被表达。

## 六、面向业务选择基本类型

### 1. 先判断语义、范围和精度

| 数据 | 建议类型 | 选择依据 | 需要警惕的边界 |
|------|----------|----------|------------------|
| 订单商品数量 | `int` | 范围充足，算术和集合 API 使用方便 | 必须校验大于 0 和业务上限 |
| 全站请求累计值 | `long` | `int` 容易在长期累计中溢出 | 并发更新和最终溢出仍需处理 |
| 毫秒时间戳 | `long` | 标准 API 以长整数表达纪元毫秒 | 数值本身没有时区语义 |
| 折扣计算中的测量比例 | `double` | 允许近似且需要较大精度范围 | 明确误差和有限值校验 |
| 精确金额 | 通常不是浮点基本类型 | 需要十进制舍入和精度规则 | 可选受控的 `long` 分值或 `BigDecimal` |
| 原始文件字节 | `byte` | 与字节流和二进制格式直接对应 | Java `byte` 有符号，读取无符号字段需转换 |
| 单个 UTF-16 代码单元 | `char` | 外部协议或底层 API 明确要求 | 不等于完整 Unicode 码点或可见字形 |
| 功能是否启用 | `boolean` | 真/假语义完整且互斥 | 不适合三态或更多状态 |
| 订单编号 | 通常不是数值基本类型 | 编号用于标识而非算术 | 前导零、字母和格式演进 |

为了节省少量空间而把普通业务数量设计成 `byte` 或 `short`，通常会增加数值提升、转换和溢出成本。除非数组规模、文件格式、网络协议或外部 API 明确要求，整数业务计算优先从 `int` 开始，需要更大范围时使用 `long`。

### 2. 用整数最小单位表示金额的条件

金额可以在边界明确时使用 `long` 保存最小货币单位，例如人民币分。这样加减和比较保持精确，但方案必须同时满足：

1. 币种和最小单位固定；
2. 乘法前能够证明不会溢出；
3. 税率、折扣和汇率计算有明确舍入位置；
4. API 和数据库对单位有统一约定。

下面的方法只演示整数范围内的分值乘法，并使用 `Math.multiplyExact` 让溢出显式失败：

以下截取本篇 `PrimitiveTypesDemo.java` 的小计方法。它属于示例类，运行入口与调用数据在后面的完整程序中给出。

::: details 查看整数金额的小计方法

```java
/**
 * 计算相同商品的小计金额，金额单位为分。
 *
 * @param unitPriceCents 单价，必须大于等于 0，单位为分
 * @param quantity 商品数量，必须大于 0
 * @return 小计金额，单位为分
 * @throws IllegalArgumentException 参数不满足业务约束时抛出
 * @throws ArithmeticException 乘法结果超出 long 范围时抛出
 */
private static long calculateSubtotalCents(long unitPriceCents, int quantity) {
    if (unitPriceCents < 0 || quantity <= 0) {
        throw new IllegalArgumentException("单价不能为负且数量必须大于 0");
    }
    return Math.multiplyExact(unitPriceCents, quantity);
}
```

:::

`BigDecimal` 的构造、scale 和舍入规则属于核心 API 中的精确数值主题。这里只需建立结论：金额的类型由十进制精度和业务舍入规则决定，不能因为 `double` 范围大就选择它。

## 七、完整示例与运行结果

### 1. 可运行源码

下面的程序集中验证字面量、数值提升、溢出、浮点特殊值、UTF-16 代码单元和业务类型选择。文件路径为 `PrimitiveTypesDemo.java`。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看PrimitiveTypesDemo的完整代码

```java
// PrimitiveTypesDemo.java
/**
 * 演示 Java 21 八种基本类型的关键行为和边界。
 */
public final class PrimitiveTypesDemo {

    /**
     * 工具类不需要实例化。
     */
    private PrimitiveTypesDemo() {
    }

    /**
     * 依次执行基本类型、整数、浮点和 Unicode 验证。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        printPrimitiveValues();
        printIntegerBehavior();
        printFloatingPointBehavior();
        printUnicodeBehavior();

        long subtotalCents = calculateSubtotalCents(1_990L, 2);
        System.out.println("subtotal cents=" + subtotalCents);
    }

    /**
     * 输出八种基本类型的代表值。
     */
    private static void printPrimitiveValues() {
        byte signedByte = -128;
        short warehouseSlot = 32_000;
        int dailyRequests = 2_000_000_000;
        long totalRequests = 5_000_000_000L;
        float discountRate = 0.85F;
        double packageWeight = 12.75;
        char chineseCodeUnit = '中';
        boolean paid = true;

        System.out.println("byte=" + signedByte);
        System.out.println("short=" + warehouseSlot);
        System.out.println("int=" + dailyRequests);
        System.out.println("long=" + totalRequests);
        System.out.println("float=" + discountRate);
        System.out.println("double=" + packageWeight);
        System.out.println("char code unit=" + (int) chineseCodeUnit);
        System.out.println("boolean=" + paid);
    }

    /**
     * 验证小整数数值提升和 int 溢出行为。
     */
    private static void printIntegerBehavior() {
        byte left = 100;
        byte right = 28;
        int promotedSum = left + right;
        int overflowed = Integer.MAX_VALUE + 1;

        System.out.println("byte + byte=" + promotedSum);
        System.out.println("int overflow=" + overflowed);

        try {
            Math.addExact(Integer.MAX_VALUE, 1);
        } catch (ArithmeticException exception) {
            System.out.println("exact overflow=" + exception.getMessage());
        }
    }

    /**
     * 输出二进制浮点误差和 IEEE 754 特殊值。
     */
    private static void printFloatingPointBehavior() {
        double decimalSum = 0.1 + 0.2;
        double positiveInfinity = 1.0 / 0.0;
        double notANumber = 0.0 / 0.0;

        System.out.println("0.1 + 0.2=" + decimalSum);
        System.out.println("positive infinity=" + positiveInfinity);
        System.out.println("NaN equals itself=" + (notANumber == notANumber));
    }

    /**
     * 对比 UTF-16 代码单元数量和 Unicode 码点数量。
     */
    private static void printUnicodeBehavior() {
        String emoji = "\uD83D\uDE00";

        System.out.println("emoji code units=" + emoji.length());
        System.out.println("emoji code points="
                + emoji.codePointCount(0, emoji.length()));
    }

    /**
     * 计算相同商品的小计金额，金额单位为分。
     *
     * @param unitPriceCents 单价，必须大于等于 0，单位为分
     * @param quantity 商品数量，必须大于 0
     * @return 小计金额，单位为分
     * @throws IllegalArgumentException 参数不满足业务约束时抛出
     * @throws ArithmeticException 乘法结果超出 long 范围时抛出
     */
    private static long calculateSubtotalCents(long unitPriceCents, int quantity) {
        if (unitPriceCents < 0 || quantity <= 0) {
            throw new IllegalArgumentException("单价不能为负且数量必须大于 0");
        }
        return Math.multiplyExact(unitPriceCents, quantity);
    }
}
```

:::

### 2. 编译与运行

示例只使用 Java 标准库，要求 JDK 21。以下命令从本篇示例目录进入 Java 模块后编译源码：

::: code-group

```powershell [PowerShell]

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out PrimitiveTypesDemo.java
java -cp out PrimitiveTypesDemo
```

```bash [bash]

mkdir -p out
javac -encoding UTF-8 -d out PrimitiveTypesDemo.java
java -cp out PrimitiveTypesDemo
```

:::

### 3. 预期输出与观察点

在 OpenJDK 21.0.11 中，程序输出如下：

::: details 查看Java 基本数据类型：预期输出与观察点的完整示例与输出

```text
byte=-128
short=32000
int=2000000000
long=5000000000
float=0.85
double=12.75
char code unit=20013
boolean=true
byte + byte=128
int overflow=-2147483648
exact overflow=integer overflow
0.1 + 0.2=0.30000000000000004
positive infinity=Infinity
NaN equals itself=false
emoji code units=2
emoji code points=1
subtotal cents=3980
```

:::

输出证明了五件事：

1. 八种基本类型都有确定的值形式，`long` 和 `float` 字面量使用各自后缀；
2. 两个 `byte` 相加得到 `int` 结果 `128`，不会留在 `byte` 范围内；
3. 普通 `int` 溢出静默回绕，`Math.addExact` 才把溢出转为异常；
4. 二进制浮点会产生十进制表示误差，并支持 Infinity 和 NaN；
5. 补充字符可以由两个 UTF-16 代码单元表示，但仍只有一个 Unicode 码点。

::: info 基本类型示例的验证边界

这个示例没有证明对象内存占用、任意金额舍入或用户可见字形分割；这些问题分别需要对象布局工具、`BigDecimal` 规则和字素簇处理能力，不能从基本类型的位宽直接推导。

:::

## 八、失败场景与定位方法

### 1. 超范围字面量会在编译期失败

下面的文件故意省略 `L` 后缀，十进制字面量无法作为 `int` 表示：

::: details 查看InvalidIntegerLiteral的完整代码

```java
// InvalidIntegerLiteral.java
public final class InvalidIntegerLiteral {
    private static final long TOTAL_REQUESTS = 5_000_000_000;

    /**
     * 输出请求总量，本示例预期无法通过编译。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        System.out.println(TOTAL_REQUESTS);
    }
}
```

:::

使用英文编译器诊断便于与下列输出对照：

```powershell
javac '-J-Duser.language=en' '-J-Duser.country=US' -encoding UTF-8 `
  InvalidIntegerLiteral.java
```

关键错误为：

```text
error: integer number too large
    private static final long TOTAL_REQUESTS = 5_000_000_000;
                                               ^
```

变量声明为 `long` 不能改变字面量自身的类型。正确写法是 `5_000_000_000L`，让字面量在赋值前就按 `long` 解析。

### 2. 静默数值错误必须用业务约束发现

部分数值问题不会触发编译错误或异常，必须通过范围校验和测试暴露：

| 现象 | 原因 | 定位证据 | 处理方式 |
|------|------|----------|----------|
| 正计数突然变为负数 | `int` 加法或乘法溢出 | 记录运算前操作数；用 `Math.*Exact` 复现 | 改用合适范围并保留溢出检查 |
| 金额出现尾差 | 十进制值不能被二进制浮点精确表示 | 打印原始输入和中间结果 | 使用最小单位整数或 `BigDecimal` |
| 字符串截断后乱码或出现替换符 | 在代理对中间按 `char` 下标截断 | 比较 `length()` 与码点数量 | 按码点或字素簇边界处理 |
| 计算结果出现 Infinity 或 NaN | 浮点除零、溢出或非法运算 | `Double.isFinite`、`Double.isNaN` | 在输入和结果边界显式拒绝非法值 |
| `boolean` 无法表达真实状态 | 业务实际具有三种或更多状态 | 列出所有状态组合，寻找含糊或非法组合 | 使用枚举或状态对象 |

::: tip 类型选择的判断顺序
先写清业务语义和合法范围，再选择值域与精度足够的类型，最后设计溢出、舍入和非法输入的处理方式。只根据“数值看起来不大”或“占用空间更小”选择类型，往往会把问题推迟到生产数据增长之后。
:::

## 九、规范依据

本文的类型分类、值域、运算和 Unicode 结论以 Java SE 21 为准：

- [JLS 4.2：基本类型与值](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.2)规定八种基本类型、整数值域、浮点格式和 `boolean` 值；
- [JLS 3.10：字面量](https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html#jls-3.10)规定整数、浮点、字符和布尔字面量语法；
- [JLS 5.6：数值提升](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.6)规定一元与二元数值提升；
- [Java SE 21 Character API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Character.html)说明 UTF-16 代码单元、Unicode 码点和补充字符的 API 边界；
- [Java SE 21 Math API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html)提供检测整数溢出的 `addExact`、`multiplyExact` 和相关方法。
