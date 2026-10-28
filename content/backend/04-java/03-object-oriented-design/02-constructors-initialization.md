---
title: "构造器与对象初始化"
tags:
  - Java 21
  - 构造器
  - 对象初始化
excerpt: "解释对象从内存分配、默认值、字段初始化器到构造器体的完整初始化顺序，并说明构造器链、默认构造器和 this 逃逸风险。"
date: 2026-09-03
---

# 构造器与对象初始化

构造器负责把刚分配的对象建立为可用状态，但字段并不是从构造器第一行才开始存在。对象初始化依次经历默认值、字段初始化器、实例初始化块和构造器体；类的静态初始化只在类型首次主动使用时执行一次。

## 一、new 表达式完成的工作

表达式 `new Product("SKU-2001")` 可以从语言层面理解为：

1. 确保 `Product` 类已经完成初始化；
2. 为新对象分配空间，并把实例字段设为类型默认值；
3. 调用所选构造器，若存在父类则先完成父类构造；
4. 按源码顺序执行当前类的实例字段初始化器和实例初始化块；
5. 执行构造器体，正常结束后返回对象引用。

“分配空间”与具体堆实现、逃逸分析等 JVM 优化不是同一个讨论层级。这里关注 Java 语言保证的初始化结果，不假设对象一定以某种物理布局存放。

## 二、字段默认值与显式初始化

### 1. 实例字段先获得默认值

在显式赋值前，实例字段已经具有默认值：数值为 `0`，`boolean` 为 `false`，引用为 `null`。这项规则只适用于字段；局部变量必须先明确赋值才能读取。

```java
final class DraftOrder {
    private int quantity;        // 初始为 0
    private String customerId;   // 初始为 null
}
```

::: warning 字段默认值不能保证对象有效

默认值保证内存不会以未定义内容暴露，但不代表业务状态有效。订单数量为 `0`、客户编号为 `null` 通常仍需在构造边界拒绝。

:::

### 2. 初始化器按源码顺序执行

实例字段初始化器与实例初始化块会合并进每条构造路径，并按它们在类中的源码顺序运行。不要依赖尚未初始化完成的后置字段，也不要把复杂外部调用塞进初始化器。

::: tip 把初始化约束集中到主构造器

初始化块适合多个构造器都必须执行、又不能直接写成字段表达式的少量逻辑；通常仍应优先把约束集中到一个主构造器。初始化位置过多会让对象状态难以追踪。

:::

## 三、构造器声明与默认构造器

构造器名称必须与类名相同，没有返回类型；写成 `void Product()` 会声明普通方法，而不是构造器。

```java
final class Product {
    private final String sku;

    Product(String sku) {
        this.sku = sku;
    }
}
```

只有当类完全没有声明构造器时，编译器才会补一个默认构造器。只要声明了任意构造器，`new Product()` 就不再自动可用。默认构造器会调用父类无参构造器；父类没有可访问的无参构造器时，子类必须显式写 `super(...)`。

## 四、this 与构造器链

### 1. this(...) 委托给本类其他构造器

```java
Product(String sku) {
    this(sku, "未命名商品");
}

Product(String sku, String name) {
    this.sku = sku;
    this.name = name;
}
```

`this(...)` 必须是构造器第一条语句，避免同一对象先执行两套不确定的初始化逻辑。它最终必须到达一个不再调用 `this(...)` 的构造器，循环委托会在编译期失败。

### 2. 构造器委托限制 {#_2-super-与-this-不能并列}

每个构造器第一步只能选择委托本类构造器或调用父类构造器。选择 `this(...)` 后，最终目标构造器仍会负责调用 `super(...)`。父类构造顺序在“继承与组合”文章中结合替代关系解释。

同时显式写 `this(...)` 和 `super(...)` 会因两者都要求位于第一条语句而无法编译。设计时应建立一条单向构造链，而不是在多个构造器中复制字段赋值与校验。

## 五、类初始化与实例初始化的区别

| 初始化 | 触发频率 | 处理成员 | 典型用途 |
|--------|----------|----------|----------|
| 类初始化 | 每个类加载器中的类型通常一次 | `static` 字段、静态初始化块 | 建立类型级常量或注册信息 |
| 实例初始化 | 每次成功执行 `new` | 实例字段、实例初始化块、构造器 | 建立每个对象自己的合法状态 |

静态初始化在首次主动使用类型前完成，并由 JVM 保证初始化同步。静态初始化失败会使类型进入错误状态，后续使用可能得到 `NoClassDefFoundError`，因此不应在静态块中执行不可靠的网络或数据库操作。

## 六、构造阶段必须建立不变量

构造器正常返回后，调用方会把对象视为可用对象。因此必填字段、数值范围和字段间关系应在构造阶段一次建立：

```java
Product(String sku, int stock) {
    if (sku == null || sku.isBlank()) {
        throw new IllegalArgumentException("sku 不能为空");
    }
    if (stock < 0) {
        throw new IllegalArgumentException("库存不能为负数");
    }
    this.sku = sku;
    this.stock = stock;
}
```

校验失败时构造器抛出异常，调用方不会得到该对象的正常引用。对于可选参数很多的场景，可使用静态工厂或建造者，但它们最终仍要收口到同一组不变量。

## 七、this 逃逸会暴露半初始化对象

构造阶段不要把 `this` 注册到全局集合、提交给其他线程，或调用可被子类重写的方法：

```java
// 错误示意：register 可能在构造器结束前使用当前对象
Product(Registry registry) {
    registry.register(this);
    this.name = "机械键盘";
}
```

::: warning 不要暴露尚未初始化完成的对象

外部代码可能观察到 `name == null` 的半初始化状态。修正方式是先完整构造，再由工厂或调用方注册；若类型需要继承，构造器尤其不应调用可重写实例方法，因为子类字段尚未完成初始化。

:::

## 八、验证初始化顺序

完整源码保存为 `InitializationDemo.java`。示例用带编号的输出观察静态字段、静态块、实例字段、实例块和两个构造器体。

下面截取本篇完整程序中的单参数构造器。它先委托双参数构造器，再输出阶段 6；`trace`、字段初始化器和被调用的构造器均由下方完整文件给出。

```java
/**
 * 使用默认名称创建商品，并委托给主构造器。
 *
 * @param sku 商品编码，不能为空
 */
private Product(String sku) {
    this(sku, "未命名商品");
    trace("6 one-argument constructor");
}
```

新建一个空文件夹，将以下代码保存为 `InitializationDemo.java`，编码使用 UTF-8。后续编译和运行命令均在该文件夹执行。

::: details 查看 InitializationDemo 完整代码

```java [InitializationDemo.java]
/**
 * 通过可观察输出展示类初始化、实例初始化和构造器链的执行顺序。
 */
public final class InitializationDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private InitializationDemo() {
    }

    /**
     * 示例入口。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        System.out.println("0 main starts");
        Product product = new Product("SKU-2001");
        System.out.println("7 ready=" + product.summary());
    }

    /**
     * 输出初始化阶段并把传入值原样返回，便于字段初始化器赋值。
     *
     * @param message 要输出并返回的阶段信息
     * @return 与入参相同的阶段信息
     */
    private static String trace(String message) {
        System.out.println(message);
        return message;
    }

    /**
     * 商品通过两个构造器展示 this(...) 委托和实例初始化顺序。
     */
    private static final class Product {
        private static final String TYPE = trace("1 static field");

        static {
            trace("2 static block");
        }

        private final String initializationMark = trace("3 instance field");
        private final String sku;
        private final String name;

        {
            trace("4 instance block");
        }

        /**
         * 使用默认名称创建商品，并委托给主构造器。
         *
         * @param sku 商品编码，不能为空
         */
        private Product(String sku) {
            this(sku, "未命名商品");
            trace("6 one-argument constructor");
        }

        /**
         * 创建完整商品对象并建立必需字段。
         *
         * @param sku 商品编码，不能为空
         * @param name 商品名称，不能为空
         */
        private Product(String sku, String name) {
            this.sku = sku;
            this.name = name;
            trace("5 two-argument constructor");
        }

        /**
         * 返回完成初始化后的状态摘要。
         *
         * @return 类型、编码、名称和初始化标记
         */
        private String summary() {
            return "%s %s %s mark=%s".formatted(TYPE, sku, name, initializationMark);
        }
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out InitializationDemo.java
java -cp out InitializationDemo
```

预期输出：

```text
0 main starts
1 static field
2 static block
3 instance field
4 instance block
5 two-argument constructor
6 one-argument constructor
7 ready=1 static field SKU-2001 未命名商品 mark=3 instance field
```

::: tip 用输出区分静态与实例初始化

编号 `1～2` 只在首次使用 `Product` 时出现；每次 `new Product(...)` 都会重新出现 `3～6`。`5` 早于 `6`，证明委托目标构造器先完成。

:::

## 九、失败现象与定位

| 现象 | 根因 | 定位与修正 |
|------|------|------------|
| `variable ... might not have been initialized` | `final` 字段并非所有构造路径都赋值 | 检查每个构造器最终到达的主构造路径 |
| `recursive constructor invocation` | `this(...)` 构造器形成循环 | 让全部便捷构造器单向委托到一个主构造器 |
| 子类构造时读到默认值 | 父类构造器调用了可重写方法 | 构造器只调用 `private`、`final` 或静态辅助方法 |
| 类型首次使用失败，之后持续不可用 | 静态初始化抛出异常 | 移除静态阶段的外部副作用，查看最初的 `ExceptionInInitializerError` |

规范依据可参阅 [JLS 8.8：Constructor Declarations](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8)、[JLS 12.4：Initialization of Classes and Interfaces](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.4) 与 [JLS 12.5：Creation of New Class Instances](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.5)。
