---
title: "引用类型、数组与 null"
tags:
  - Java 21
  - 引用类型
  - 数组
  - null
excerpt: "解释引用值、对象共享、数组初始化、默认值、多维数组和浅复制，并通过可运行程序复现 NullPointerException 与数组越界错误。"
date: 2026-09-02
---

# 引用类型、数组与 null

引用类型变量保存的是引用值，不是对象内容本身。把引用变量赋给另一个变量会复制引用值，两个变量可能因此访问同一个对象；把其中一个变量重新赋值，只会改变该变量保存的引用，不会自动替换另一个变量。

## 一、引用值与对象

### 1. 变量、引用和对象是三个概念

下面的数组创建表达式会创建数组对象，并把引用值保存到变量中：

```java
int[] warehouseStocks = {3, 5, 8};
```

可以用关系图表示：

```text
变量 warehouseStocks
        │ 保存引用值
        ▼
数组对象 [3, 5, 8]
```

::: info 分别分析变量、引用与对象

变量有作用域，对象有身份和状态，引用值负责把二者连接起来。日常可以简写为“变量指向对象”，但分析参数传递、共享修改和 `null` 时应回到准确模型。

:::

### 2. 引用赋值会形成别名

```java
int[] warehouseStocks = {3, 5, 8};
int[] alias = warehouseStocks;
alias[0] = 9;
```

赋值后两个变量保存相同引用值，通过任一变量修改数组元素，都可以由另一变量观察到：

```text
warehouseStocks ─┐
                 ├──▶ 同一个数组对象 [9, 5, 8]
alias ───────────┘
```

这不是把数组内容复制了两份。需要独立数组时必须显式复制，并判断复制是浅复制还是深复制。

### 3. 重新赋值不会修改其他变量

```java
alias = new int[]{100, 200};
```

这只让 `alias` 保存新数组的引用，`warehouseStocks` 仍然保存原引用。重新赋值引用和修改对象状态是两类不同操作。

## 二、null 表示没有引用目标

引用类型可以保存特殊值 `null`：

```java
String orderNumber = null;
```

`null` 不是空字符串、数字 `0` 或一个“空对象”。通过空引用访问字段、调用实例方法、读取数组长度或访问数组元素，会抛出 `NullPointerException`。

```java
int[] stocks = null;
// int length = stocks.length; // 运行时抛出 NullPointerException
```

空值处理应由业务契约决定：

| 语义 | 处理方式 |
|------|----------|
| 参数必须存在 | 在方法边界拒绝 `null`，例如 `Objects.requireNonNull` |
| 合法但没有单个结果 | 根据 API 语义使用 `Optional`，或由明确状态类型表达 |
| 合法且结果集合为空 | 通常返回空集合或空数组，不返回 `null` |
| 尚未初始化的内部状态 | 优先通过构造过程建立完整对象，而不是长期保留 `null` |

::: warning null 检查不能替代领域建模
一个变量如果用 `null` 同时表示“未查询”“不存在”“无权限”和“查询失败”，调用方仍无法判断真实状态。应使用异常、状态对象或明确返回类型区分不同语义。
:::

## 三、数组是固定长度的引用类型

### 1. 声明、创建与初始化

Java 数组保存固定数量、声明类型兼容的元素：

```java
int[] quantities = new int[3];
String[] statuses = {"CREATED", "PAID"};
```

推荐把方括号写在类型后：`int[] quantities`。`int quantities[]` 虽然合法，但不符合主流 Java 风格。

数组创建后长度不能改变。`array.length` 是字段，不是方法：

```java
int length = quantities.length;
```

需要动态增删元素时应使用集合；数组适合长度已知、底层 API 或性能边界明确的场景。

### 2. 数组元素具有默认值

`new int[3]` 的三个元素都是 `0`，`new String[2]` 的两个元素都是 `null`。数组元素与字段一样获得默认值，而保存数组引用的局部变量本身仍必须在读取前初始化。

```java
String[] statuses = new String[2];
System.out.println(statuses[0]); // null
```

### 3. 索引范围从 0 开始

长度为 `n` 的数组，合法索引为 `0` 到 `n - 1`。访问负索引或 `array.length` 会抛出 `ArrayIndexOutOfBoundsException`。

```java
int[] stocks = {3, 5, 8};
int first = stocks[0];
int last = stocks[stocks.length - 1];
```

循环数组时通常使用 `index < array.length`，不能写成 `index <= array.length`。

## 四、多维数组实际是数组的数组

Java 的二维数组不是必须连续、规则的矩阵，而是元素类型仍为数组的数组：

```java
int[][] warehouseStocks = {
    {3, 5},
    {7, 9, 11}
};
```

两个内部数组长度可以不同，所以访问前需要分别使用 `warehouseStocks.length` 和 `warehouseStocks[row].length`。

也可以分步创建不规则数组：

```java
int[][] rows = new int[2][];
rows[0] = new int[2];
rows[1] = new int[4];
```

此时在内部数组赋值前访问 `rows[0].length` 会因为元素默认值是 `null` 而抛出 `NullPointerException`。

## 五、数组复制与浅复制

一维基本类型数组使用 `clone()` 会得到独立数组，元素值被复制：

```java
int[] original = {3, 5};
int[] copied = original.clone();
copied[0] = 9;
```

修改 `copied[0]` 不影响 `original[0]`。但对于引用元素数组或多维数组，`clone()` 只复制第一层元素中的引用值：

```text
original2d ─▶ 外层数组 A ─▶ 内层数组 X
shallow    ─▶ 外层数组 B ─▶ 内层数组 X
```

::: warning 外层副本仍可能共享内部对象

两个外层数组独立，内部数组仍共享。真正的深复制需要逐层创建新对象，并根据元素类型决定如何复制对象状态；不存在适合所有对象图的通用 `clone()` 深复制语义。

:::

## 六、引用相等与内容相等

引用类型使用 `==` 比较两个引用值是否指向同一对象：

```java
int[] left = {1, 2};
int[] right = {1, 2};
System.out.println(left == right); // false
```

::: tip 使用数组专用 API 比较内容

数组没有覆盖基于元素的 `equals`，比较数组内容应使用 `Arrays.equals`；多维数组内容比较可以使用 `Arrays.deepEquals`。

:::

```java
boolean sameContent = java.util.Arrays.equals(left, right); // true
```

普通对象的内容相等取决于该类型是否正确实现 `equals`，相关契约将在面向对象章节展开。

## 七、完整程序

将完整源码保存为 `ReferenceArrayDemo.java`。默认路径展示共享、独立复制、默认值和浅复制；启动参数 `null` 或 `bounds` 用于复现两类运行错误。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看ReferenceArrayDemo的完整代码

```java
import java.util.Arrays;

/**
 * 演示引用复制、数组默认值、浅复制和常见数组运行错误。
 */
public final class ReferenceArrayDemo {

    /**
     * 工具类不需要实例化。
     */
    private ReferenceArrayDemo() {
    }

    /**
     * 默认运行引用与数组示例；传入 null 或 bounds 可触发对应失败场景。
     *
     * @param args 可选失败模式：null 或 bounds
     */
    public static void main(String[] args) {
        if (args.length == 1) {
            runFailure(args[0]);
            return;
        }

        int[] warehouseStocks = {3, 5, 8};
        int[] alias = warehouseStocks;
        updateFirstStock(alias, 9);

        int[] independentCopy = warehouseStocks.clone();
        independentCopy[1] = 50;

        String[] statuses = new String[2];
        int[][] stockMatrix = {{1, 2}, {3, 4}};
        int[][] shallowCopy = stockMatrix.clone();
        shallowCopy[0][0] = 99;

        System.out.println("shared=" + Arrays.toString(warehouseStocks));
        System.out.println("copy=" + Arrays.toString(independentCopy));
        System.out.println("default reference=" + statuses[0]);
        System.out.println("shallow inner shared=" + stockMatrix[0][0]);

        replaceLocally(alias);
        System.out.println("after local replace=" + Arrays.toString(warehouseStocks));
    }

    /**
     * 修改调用方与当前形参共同引用的数组元素。
     *
     * @param stocks 至少包含一个元素的库存数组
     * @param newValue 要写入首个元素的新库存值
     */
    private static void updateFirstStock(int[] stocks, int newValue) {
        stocks[0] = newValue;
    }

    /**
     * 只替换局部引用副本，不会替换调用方变量保存的引用。
     *
     * @param stocks 调用方数组引用值的副本
     */
    private static void replaceLocally(int[] stocks) {
        stocks = new int[]{100, 200};
        System.out.println("local replacement=" + Arrays.toString(stocks));
    }

    /**
     * 在受控示例中触发空引用或数组越界错误。
     *
     * @param mode null 表示空引用，bounds 表示越界访问
     * @throws IllegalArgumentException 模式不受支持时抛出
     */
    private static void runFailure(String mode) {
        if ("null".equals(mode)) {
            int[] missingStocks = null;
            System.out.println(missingStocks.length);
            return;
        }
        if ("bounds".equals(mode)) {
            int[] stocks = {3, 5, 8};
            System.out.println(stocks[stocks.length]);
            return;
        }
        throw new IllegalArgumentException("支持的失败模式：null、bounds");
    }
}
```

:::

## 八、编译、运行与输出

在本篇新建的示例目录执行：

```powershell
javac -Xlint:all -encoding UTF-8 `
  -d out `
  ReferenceArrayDemo.java

java -cp out ReferenceArrayDemo
```

预期输出：

```text
shared=[9, 5, 8]
copy=[9, 50, 8]
default reference=null
shallow inner shared=99
local replacement=[100, 200]
after local replace=[9, 5, 8]
```

`shared` 证明别名修改同一数组；`copy` 证明一维基本类型数组副本独立；二维数组输出证明 `clone()` 只复制外层；局部替换没有改变调用方引用。

## 九、失败场景与定位

### 1. 空引用访问

```powershell
java -cp out ReferenceArrayDemo null
```

::: warning 从引用缺失的源头修复空指针

进程以非零状态结束，Java 21 的详细空指针消息会指出无法读取数组长度，因为局部变量为 `null`。修复重点是追踪引用为何缺失，并在创建或方法边界建立非空约束，而不是捕获异常后继续使用无效状态。

:::

### 2. 数组越界

```powershell
java -cp out ReferenceArrayDemo bounds
```

错误会包含索引 `3` 和长度 `3`。长度不是最后一个合法索引，正确末尾索引是 `length - 1`。

### 3. 复制后内部对象仍被修改

外层数组地址不同但内部状态同步变化，通常说明执行了浅复制。打印每一层对象身份或逐层修改一个元素可以定位共享发生在哪一层，然后按实际对象结构实现逐层复制。

定位时可以按以下顺序验证：

1. 使用 `original == copied` 确认外层对象是否相同；
2. 使用 `original[0] == copied[0]` 检查第一层元素是否仍共享；
3. 只修改副本中的一个内部元素，观察原对象是否同步变化；
4. 根据元素是否可变，决定逐层复制、创建不可变值或保留共享。

盲目调用更多次 `clone()` 不能自动复制任意深度的对象图，还可能破坏本应共享的身份关系。

## 十、规范依据

- [JLS 4.3：Reference Types and Values](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.3) 定义引用类型、对象和 `null` 引用。
- [JLS 10：Arrays](https://docs.oracle.com/javase/specs/jls/se21/html/jls-10.html) 定义数组类型、变量、创建、初始化和成员。
- [JLS 15.10：Array Creation and Access](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.10) 定义数组创建表达式和访问求值。
- [Java SE 21 `Arrays` API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html) 提供数组比较、复制、排序和字符串表示方法。

引用、数组和 `null` 的核心规则在 Java 8 与 Java 21 中一致；Java 21 的 `NullPointerException` 通常提供更具体的诊断消息，但程序不能依赖错误文字作为业务逻辑。
