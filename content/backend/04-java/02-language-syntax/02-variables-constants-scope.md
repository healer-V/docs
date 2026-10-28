---
title: "变量、常量与作用域"
tags:
  - Java 21
  - 变量
  - 作用域
excerpt: "解释 Java 局部变量、参数、字段和常量的声明、初始化、可见范围与遮蔽规则，并通过完整程序观察字段默认值和局部变量生命周期。"
date: 2026-09-02
---

# 变量、常量与作用域

变量把一个类型确定的值与名称关联起来。Java 不仅检查变量能保存什么类型，还检查它在当前位置是否可见、局部变量在读取前是否已经确定赋值，以及 `final` 变量是否被重复赋值。

## 一、变量的四种常见位置

| 种类 | 声明位置 | 初始化规则 | 作用域起点 |
|------|----------|------------|------------|
| 局部变量 | 方法体或代码块内部 | 读取前必须确定赋值 | 声明完成之后 |
| 方法参数 | 方法参数列表 | 调用时由实参初始化 | 整个方法体 |
| 实例字段 | 类体中，不含 `static` | 对象创建时获得默认值 | 按成员访问规则决定 |
| 静态字段 | 类体中，包含 `static` | 类初始化前先获得默认值 | 按成员访问规则决定 |

字段属于对象或类，局部变量属于某次方法调用。它们即使使用相同类型和名称，也具有不同的存储位置、生命周期和访问方式。

## 二、声明、初始化与赋值

### 1. 显式类型声明

变量声明至少包含类型和名称，可以在同一条语句中初始化：

```java
int itemCount = 3;
String orderNumber = "ORD-42";
```

也可以先声明后赋值，但在读取前必须覆盖所有可能执行路径：

```java
int shippingFee;
if (itemCount >= 3) {
    shippingFee = 0;
} else {
    shippingFee = 800;
}
System.out.println(shippingFee);
```

如果某个分支没有赋值，编译器不会根据“实际运行时大概会走哪个分支”放行，而是按照确定赋值规则检查所有可达路径。

### 2. var 是局部变量类型推断

Java 10 起可以在具有初始化器的局部变量上使用 `var`：

```java
var itemCount = 3;          // 推断为 int
var orderNumber = "ORD-42"; // 推断为 String
```

`var` 不是动态类型。编译器确定类型后，变量不能改存其他类型：

```java
var itemCount = 3;
// itemCount = "three"; // 编译错误
```

以下位置不能使用 `var`：

- 字段；
- 方法参数和返回类型；
- 没有初始化器的局部变量；
- 只以 `null` 作为初始化器的局部变量；
- 需要一个目标类型才能解释的独立数组初始化器或 Lambda。

::: tip 类型明显时再使用 var

`var` 适合右侧类型明显、名称能表达语义的局部变量。右侧调用链复杂或类型本身承载重要业务信息时，显式类型通常更易读。

:::

## 三、局部变量没有默认值

下面的代码不能编译：

```java
int itemCount;
System.out.println(itemCount);
```

编译器会报告变量可能尚未初始化。这样可以避免读取栈上不确定值，也迫使代码明确区分“尚未计算”和合法的 `0`。

字段和数组元素不同，它们会获得语言规定的默认值：

| 类型 | 默认值 |
|------|--------|
| 整数类型 | `0` |
| 浮点类型 | `0.0` |
| `char` | `\u0000` |
| `boolean` | `false` |
| 引用类型 | `null` |

::: warning 默认值不是业务默认值
静态字段 `processedOrders` 自动得到 `0` 只表示尚未显式赋值。订单状态、金额或库存的业务初值仍应由初始化逻辑明确建立，不能把 JVM 默认值当成领域设计。
:::

## 四、final 与常量

### 1. final 变量只能赋值一次

`final` 变量在完成赋值后不能重新赋值：

```java
final int maxItems = 100;
// maxItems = 200; // 编译错误
```

空白 `final` 可以先声明，在每条正常路径上恰好赋值一次：

```java
final int shippingFee;
if (itemCount >= 3) {
    shippingFee = 0;
} else {
    shippingFee = 800;
}
```

`final` 引用不能指向另一个对象，但对象本身是否可变取决于其类型：

```java
final int[] stocks = {3, 5};
stocks[0] = 9; // 合法：没有替换 stocks 中的引用值
// stocks = new int[]{9, 10}; // 编译错误
```

### 2. 常量通常是 static final

类级、稳定且不随对象变化的常量通常声明为：

```java
private static final int MAX_ITEMS_PER_ORDER = 100;
```

::: info static final 不一定是编译期常量

大写下划线是命名约定。并非所有 `static final` 字段都是编译期常量：只有基本类型或 `String`，并以常量表达式初始化且满足规范条件时，才具有编译期常量语义。运行时创建的对象即使引用是 `static final`，也不能据此称为编译期常量。

:::

## 五、作用域与生命周期

### 1. 代码块限定可见范围

局部变量从声明处开始，到直接包含它的代码块结束：

```java
if (itemCount > 0) {
    int reservedItems = itemCount - 1;
    System.out.println(reservedItems);
}
// System.out.println(reservedItems); // 编译错误：超出作用域
```

::: tip 把中间变量限制在使用它的范围

缩小作用域可以减少变量被误用或意外修改的机会。只在某个分支使用的中间结果，应声明在该分支内，而不是提前放到方法顶部。

:::

### 2. for 初始化变量属于循环范围

```java
for (int index = 0; index < 3; index++) {
    System.out.println(index);
}
// index 在这里不可见
```

循环变量对循环条件、更新表达式和循环体可见，离开循环后失效。需要循环结束后的统计结果时，应把结果变量声明在循环外，把仅用于迭代的索引保留在循环头。

### 3. 作用域不等于对象生命周期

作用域是源码中名称可见的区域；生命周期描述值或对象在运行时存在多久。局部引用离开作用域后，它指向的对象如果仍被其他引用持有，仍然可以存活。垃圾回收判断的是对象可达性，不是某个变量名是否还在源码作用域中。

```java
String[] sharedStatuses;
{
    String[] localStatuses = {"CREATED"};
    sharedStatuses = localStatuses;
}

// localStatuses 已超出作用域，但数组仍可通过 sharedStatuses 访问。
System.out.println(sharedStatuses[0]);
```

反过来，一个名称仍在作用域中也不保证它始终引用原对象，非 `final` 引用可以在该范围内被重新赋值。

## 六、遮蔽与重名限制

方法参数或局部变量可以遮蔽字段。下面的方法参数与静态字段同名：

```java
private static int processedOrders;

private static void recordOrder(int processedOrders) {
    System.out.println(processedOrders);
    VariablesScopeDemo.processedOrders++;
}
```

简单名称 `processedOrders` 解析为参数，`VariablesScopeDemo.processedOrders` 明确访问静态字段。实例字段被参数遮蔽时通常使用 `this.fieldName`。

Java 不允许在重叠的局部作用域中再次声明同名局部变量：

```java
int itemCount = 3;
if (itemCount > 0) {
    // int itemCount = 2; // 编译错误：重复局部变量
}
```

遮蔽有时用于构造方法参数与字段对齐，但过度重名会增加阅读成本。除标准的 `this.field = field` 模式外，优先使用能区分职责的名称。

## 七、完整程序

将完整源码保存为 `VariablesScopeDemo.java`，用于观察字段默认值、`var`、块作用域、参数遮蔽和类常量。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看VariablesScopeDemo的完整代码

```java
/**
 * 演示字段默认值、局部变量初始化、常量和代码块作用域。
 */
public final class VariablesScopeDemo {

    private static final int MAX_ITEMS_PER_ORDER = 100;
    private static int processedOrders;

    /**
     * 工具类不需要实例化。
     */
    private VariablesScopeDemo() {
    }

    /**
     * 输出不同变量的初始化方式、可见范围和最终值。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        String orderNumber = "ORD-20260902-0042";
        var itemCount = 3;

        System.out.println("field default=" + processedOrders);
        System.out.println("order=" + orderNumber + ", items=" + itemCount);

        if (itemCount > 0) {
            int reservedItems = itemCount - 1;
            System.out.println("block reserved=" + reservedItems);
        }

        recordOrder(processedOrders);
        System.out.println("outer items=" + itemCount);
        System.out.println("processed=" + processedOrders);
        System.out.println("constant=" + MAX_ITEMS_PER_ORDER);
    }

    /**
     * 记录一个已处理订单，并演示参数遮蔽同名静态字段时的显式访问。
     *
     * @param processedOrders 调用方传入的历史值，仅用于展示参数作用域
     */
    private static void recordOrder(int processedOrders) {
        System.out.println("parameter copy=" + processedOrders);
        VariablesScopeDemo.processedOrders++;
    }
}
```

:::

## 八、编译、运行与结果

在本篇新建的示例目录执行：

```powershell
javac -Xlint:all -encoding UTF-8 `
  -d out `
  VariablesScopeDemo.java

java -cp out VariablesScopeDemo
```

预期输出：

```text
field default=0
order=ORD-20260902-0042, items=3
block reserved=2
parameter copy=0
outer items=3
processed=1
constant=100
```

输出证明：静态字段先获得默认值 `0`；块内变量可以读取外层 `itemCount`，离开块后外层值仍为 `3`；参数接收字段旧值的副本，而通过类名访问的字段被递增为 `1`。

## 九、失败场景与修复

| 错误写法 | 编译表现 | 正确处理 |
|----------|----------|----------|
| 读取未初始化局部变量 | `variable ... might not have been initialized` | 在所有可达路径上先赋值 |
| 在代码块外读取块内变量 | `cannot find symbol` | 在真正需要共享的外层声明结果变量 |
| 重新赋值 `final` 变量 | `cannot assign a value to final variable` | 只初始化一次，或移除不符合语义的 `final` |
| `var value = null` | 无法推断局部变量类型 | 使用显式引用类型或提供非空、类型明确的初始化器 |
| 重叠范围重复声明局部变量 | `variable ... is already defined` | 重用已有变量或换成职责明确的新名称 |

::: warning 不要用字段绕过局部变量赋值检查

不要通过把局部变量改成字段来绕过确定赋值错误。这样会扩大状态生命周期和共享范围，并引入默认值带来的歧义；应先修正控制流，让局部结果在读取前明确赋值。

:::

## 十、规范依据

- [JLS 4.12：Variables](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12) 定义变量种类、初始值和 `final` 变量。
- [JLS 6.3：Scope of a Declaration](https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.3) 定义各种声明的作用域。
- [JLS 14.4：The local Variable Declaration Statement](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.4) 定义局部变量和 `var`。
- [JLS 16：Definite Assignment](https://docs.oracle.com/javase/specs/jls/se21/html/jls-16.html) 定义读取前确定赋值和 `final` 单次赋值规则。

Java 21 与 Java 8 都执行局部变量确定赋值和作用域规则；Java 8 不支持 `var` 局部变量类型推断，维护线代码必须写出显式类型。
