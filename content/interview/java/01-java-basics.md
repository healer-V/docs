---
title: "Java基础面试题"
category: "面试题"
tags:
  - Java
  - 面向对象
excerpt: "围绕 Java 的类型与传参、对象相等、String 不可变、异常处理、泛型擦除、面向对象设计及 Java 21 新特性等面试题，给出准确结论、成立条件和代码表现，帮助应对机制追问。"
---

# Java基础面试题

Java 基础题考查的是语言规则能否解释代码的实际行为。回答时先确定比较的是编译期规则还是运行期行为，再说明涉及的类型、对象身份和版本差异，避免把某个 JDK 实现细节当作语言规范。

::: info 版本边界
本篇以 Java 21 LTS 为主线，题目涉及 Java 8 旧项目差异时单独标明。局部代码片段省略类声明和 `main` 方法，可放入任意 Java 21 程序的方法体内执行。
:::

## 一、类型与对象

类型题先区分基本类型与引用类型，再分析赋值、比较和装箱时实际操作的是值还是对象引用。

### 1. Java 是值传递还是引用传递？

**Java 只有值传递。** 基本类型传递的是数值副本；引用类型传递的是“引用值”的副本，调用方和被调方因此可以指向同一个对象，但不能替换调用方变量本身。

```java
/** 修改订单状态后再让参数指向新对象；无返回值，会改变共享对象。 */
static void update(StringBuilder order) {
    order.append("-paid");
    order = new StringBuilder("cancelled");
}
// 调用：var order = new StringBuilder("ORD-1"); update(order);
// order.toString() 的结果是 "ORD-1-paid"
```

方法内的 `append` 作用于共享对象，所以调用方能看到；`order = new ...` 只修改了局部参数。面试中说“对象是引用传递”会被追问：如果是引用传递，方法内重新赋值就应改变调用方变量，而 Java 不会。

参考：[JLS 21：方法调用时的参数求值](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.2)。

### 2. == 与 equals() 有什么区别，为什么重写 equals 必须重写 hashCode？

**`==` 比较基本类型的值或引用是否指向同一对象；`equals()` 比较对象的逻辑相等，默认实现等同于 `==`。** `String`、包装类和集合都重写了 `equals()`。

`hashCode()` 的约定是：两个对象 `equals()` 为真，`hashCode()` 必须相等。`HashMap`、`HashSet` 先用哈希值定位桶，再用 `equals()` 比较；只重写 `equals()` 时，两个逻辑相等的订单号对象可能落在不同桶里，`set.contains(new OrderId("A1"))` 返回 `false`，集合中也会出现“重复”元素。

| 方法 | 必须满足的约定 |
|------|----------------|
| `equals` | 自反、对称、传递、一致，与 `null` 比较返回 `false` |
| `hashCode` | 对象参与比较的字段不变时结果不变；相等对象哈希值相等 |
| 反向关系 | 哈希值相等不要求 `equals` 为真，冲突是允许的 |

::: tip 优先使用 record 表达值对象
Java 16 正式引入的 `record` 会按全部组件自动生成 `equals`、`hashCode` 和 `toString`，例如 `record OrderId(String value) {}`，可以避免手写时漏掉字段。作为 `HashMap` 键的对象不要在放入后修改参与哈希的字段。
:::

参考：[Java 21 API：Object.equals](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object))。

### 3. 为什么 Integer 127 == 127 为 true，而 128 == 128 可能为 false？

**自动装箱调用 `Integer.valueOf()`，它对 -128 到 127 的值返回缓存对象。** 两个装箱后的 127 是同一对象，`==` 为真；128 默认不在缓存范围，每次装箱得到新对象。

```java
Integer a = 127, b = 127, c = 128, d = 128;
System.out.println(a == b);      // true，命中 IntegerCache
System.out.println(c == d);      // false，默认缓存上限为 127
System.out.println(c.equals(d)); // true，比较数值
```

缓存上限可以通过 `-XX:AutoBoxCacheMax` 调大，所以 128 的结果“可能”为真，不能作为业务依据。包装类比较应使用 `equals()` 或先拆箱；另一个常见陷阱是 `Integer` 为 `null` 时参与运算，会在自动拆箱时抛出 `NullPointerException`。

参考：[Java 21 API：Integer.valueOf](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html#valueOf(int))。

### 4. String 为什么不可变，String、StringBuilder 和 StringBuffer 如何选择？

**`String` 对象创建后内容不可修改，修改操作都会返回新对象。** 不可变性让字符串可以安全地作为 `HashMap` 键、在多线程间共享，并支持字符串常量池复用字面量。

| 类型 | 可变性 | 线程安全 | 适用场景 |
|------|--------|----------|----------|
| `String` | 不可变 | 天然安全 | 常量、键、少量拼接 |
| `StringBuilder` | 可变 | 非线程安全 | 单线程循环拼接 |
| `StringBuffer` | 可变 | 方法加 `synchronized` | 遗留代码中的共享拼接，新代码很少需要 |

Java 9 起 `String` 内部从 `char[]` 改为 `byte[]` 加编码标记（Compact Strings），纯 Latin-1 文本每个字符只占 1 字节。单行的 `"a" + b + "c"` 由编译器优化，Java 9 起通过 `invokedynamic` 调用 `StringConcatFactory`；循环中反复 `+=` 仍会生成大量中间对象，应改用 `StringBuilder`。

::: warning new String("abc") 创建几个对象要看常量池状态
字面量 `"abc"` 在类加载解析后进入常量池，`new` 再在堆上创建一个新 `String`。若常量池中已有该字面量，执行这句只新建 1 个对象；首次出现时最多涉及 2 个。回答时要说明前提，不要只背“两个”。
:::

参考：[JEP 254：Compact Strings](https://openjdk.org/jeps/254)、[JEP 280：Indify String Concatenation](https://openjdk.org/jeps/280)。

## 二、面向对象与语言机制

面向对象题要落到具体规则：方法如何被选择、类和接口各承担什么职责、修饰符限制了什么。

### 1. 重载与重写有什么区别？

**重载（Overload）在编译期按参数列表选择方法，重写（Override）在运行期按对象实际类型分派。** 两者都允许同名方法，但解决的问题不同。

| 维度 | 重载 | 重写 |
|------|------|------|
| 位置 | 同一类或父子类中 | 子类覆盖父类或实现接口 |
| 签名 | 方法名相同，参数列表不同 | 方法名和参数列表相同 |
| 返回类型 | 不参与区分 | 相同或为协变子类型 |
| 访问权限 | 无要求 | 不能比父类更严格 |
| 异常 | 无要求 | 受检异常不能比父类更宽 |
| 决定时机 | 编译期静态类型 | 运行期实际类型 |

`Animal a = new Dog(); a.speak();` 执行 `Dog` 的重写方法；但 `print(Animal x)` 与 `print(Dog x)` 两个重载，传入 `a` 时选择的是 `print(Animal)`，因为重载只看变量的静态类型。`static` 方法和 `private` 方法不参与重写，子类同名静态方法只是隐藏父类方法。

参考：[JLS 21：方法重写与隐藏](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8)。

### 2. 抽象类与接口如何选择？

**接口描述能力契约，抽象类为一组有共同状态的子类提供部分实现。** Java 8 起接口可以有 `default` 和 `static` 方法，Java 9 起可以有 `private` 方法，但接口仍不能定义实例字段和构造器。

| 维度 | 抽象类 | 接口 |
|------|--------|------|
| 继承数量 | 单继承 | 一个类可实现多个接口 |
| 实例状态 | 可以有实例字段 | 只能有 `public static final` 常量 |
| 构造器 | 有，供子类调用 | 无 |
| 适用场景 | 模板方法、共享状态和初始化逻辑 | 支付、导出等可组合能力 |

订单导出可定义 `Exporter` 接口，让 CSV、Excel 实现各自格式；若多种支付渠道共享签名校验和重试状态，可以用抽象类封装公共流程，再由子类实现渠道调用。`default` 方法用于给已有接口追加方法而不破坏实现类，不应用来在接口里堆积状态逻辑。

参考：[Java 教程：接口](https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html)。

### 3. final、finally 和 finalize 有什么区别？

**三者只是拼写相近：`final` 是修饰符，`finally` 是异常处理块，`finalize()` 是已废弃的对象回收回调。**

1. `final` 修饰变量表示只能赋值一次，修饰方法表示不能重写，修饰类表示不能继承。`final List<String> items` 只限制变量重新指向，列表内容仍可修改。
2. `finally` 在 `try` 或 `catch` 结束后执行，常用于释放资源；在 `finally` 中 `return` 会覆盖 `try` 中的返回值并吞掉异常，应避免。
3. `finalize()` 执行时机不确定，可能导致对象复活和回收延迟，Java 9 标记废弃，JDK 18 起按 JEP 421 标记为待移除。资源释放应使用 `try-with-resources` 或 `Cleaner`。

参考：[JEP 421：Deprecate Finalization for Removal](https://openjdk.org/jeps/421)。

### 4. 泛型擦除是什么，会带来哪些限制？

**Java 泛型在编译期做类型检查，编译后类型参数被擦除为上界（未声明时为 `Object`），并在需要处插入强制转换。** 因此 `List<String>` 和 `List<Integer>` 运行时是同一个 `Class`。

擦除带来几个直接限制：不能 `new T()`、不能创建 `new T[]`、不能用 `instanceof List<String>` 判断参数化类型，基本类型不能作为类型参数。绕过编译检查（例如原始类型或反射）向 `List<String>` 放入 `Integer`，异常会推迟到读取并强转时才出现。

PECS 原则说明通配符的选择：只读取元素的“生产者”用 `? extends T`，只写入元素的“消费者”用 `? super T`。`Collections.copy(List<? super T> dest, List<? extends T> src)` 就是这种写法。

参考：[Java 教程：类型擦除](https://docs.oracle.com/javase/tutorial/java/generics/erasure.html)。

### 5. 反射和动态代理解决什么问题，JDK 代理与 CGLIB 有何区别？

**反射在运行期读取类结构并调用成员；动态代理在运行期生成代理类，把方法调用统一转发给增强逻辑。** Spring 的事务、AOP 和 MyBatis 的 Mapper 接口都依赖代理。

| 维度 | JDK 动态代理 | CGLIB 代理 |
|------|--------------|------------|
| 前提 | 目标实现接口 | 目标类和方法不能是 `final` |
| 实现方式 | 生成实现同一接口的类 | 生成目标类的子类 |
| 调用转发 | `InvocationHandler.invoke` | `MethodInterceptor.intercept` |

Spring Boot 2.0 起默认 `spring.aop.proxy-target-class=true`，即使有接口也优先用 CGLIB 风格的类代理。反射调用要付出访问检查和装箱成本，并受 Java 9 模块系统的强封装约束：访问 JDK 内部类的私有成员需要显式 `--add-opens`。

参考：[Java 21 API：Proxy](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Proxy.html)。

## 三、异常与资源

异常题关注两件事：调用方被要求处理什么，以及资源和异常信息是否在失败时被正确保留。

### 1. 受检异常与非受检异常有什么区别？

**受检异常（`Exception` 中除 `RuntimeException` 以外的子类）必须在编译期声明或捕获；非受检异常包括 `RuntimeException` 和 `Error`，编译器不强制处理。**

受检异常适合调用方能够有意义地恢复的情况，例如文件不存在时提示重新选择；参数非法、空指针等编程错误通常使用运行时异常。`Error` 表示 `OutOfMemoryError`、`StackOverflowError` 等 JVM 层面的严重问题，业务代码不应捕获后继续正常流程。

::: warning 捕获后不要丢弃原始异常
`catch (IOException e) { throw new OrderException("导出失败"); }` 会丢失根因。应写成 `new OrderException("导出失败", e)` 保留 cause，或至少记录完整堆栈；空 `catch` 块会让故障完全不可见。
:::

参考：[Java 教程：受检与非受检异常](https://docs.oracle.com/javase/tutorial/essential/exceptions/runtime.html)。

### 2. try-with-resources 比 finally 关闭资源好在哪里？

**`try-with-resources` 会按声明的逆序自动调用 `AutoCloseable.close()`，并把关闭时的异常作为“被抑制异常”附加到主异常上。** 手写 `finally` 时，`close()` 抛出的异常可能覆盖业务异常。

```java
try (var reader = Files.newBufferedReader(Path.of("orders.csv"))) {
    return reader.readLine();
} // reader 在离开代码块时自动关闭，无论是否发生异常
```

读取失败且关闭也失败时，抛出的是读取异常，关闭异常可通过 `e.getSuppressed()` 取得。Java 9 起可以在括号中直接使用已声明的 effectively final 资源变量。数据库连接、文件流和网络连接都应使用这种写法。

参考：[Java 教程：try-with-resources](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html)。

## 四、Java 新特性

新特性题需要说明正式发布的版本和解决的问题，并区分预览特性与正式特性。

### 1. Java 8 到 Java 21 有哪些常被追问的新特性？

**面试中最常考的是 Lambda 与 Stream、`var`、`record`、密封类、模式匹配和虚拟线程。** 下表的版本均为正式（非预览）发布版本。

| 特性 | 正式版本 | 解决的问题 |
|------|----------|------------|
| Lambda、Stream、`Optional` | Java 8 | 函数式写法和集合流水线处理 |
| 模块系统 | Java 9 | 显式依赖与强封装 |
| `var` 局部变量类型推断 | Java 10 | 减少冗长的局部变量声明 |
| `switch` 表达式 | Java 14 | `switch` 返回值，避免穿透 |
| 文本块 | Java 15 | 多行 SQL、JSON 字面量 |
| `record`、`instanceof` 模式匹配 | Java 16 | 不可变数据载体、免强转 |
| 密封类 | Java 17 | 限定可继承的子类集合 |
| `switch` 模式匹配、记录模式、虚拟线程 | Java 21 | 按类型穷尽分支、轻量线程 |

密封类配合 `switch` 模式匹配，可以让编译器检查分支是否穷尽：`sealed interface Payment permits Card, Wallet {}` 定义后，`switch (payment)` 覆盖 `Card` 和 `Wallet` 即可不写 `default`；以后新增实现类，未处理的 `switch` 会编译失败。

参考：[JEP 409：Sealed Classes](https://openjdk.org/jeps/409)、[JEP 441：Pattern Matching for switch](https://openjdk.org/jeps/441)、[JEP 444：Virtual Threads](https://openjdk.org/jeps/444)。

### 2. Stream 的中间操作为什么是惰性的，有哪些常见误用？

**中间操作（`filter`、`map` 等）只构建处理流水线，遇到终止操作（`collect`、`count` 等）才逐个元素执行。** 惰性让 `limit`、`findFirst` 这样的短路操作可以提前结束。

常见误用包括：一个 `Stream` 只能消费一次，第二次使用抛出 `IllegalStateException`；在 `map` 中修改外部集合会产生副作用，并行流下还会出现线程安全问题；`Collectors.toMap` 遇到重复键默认抛 `IllegalStateException`，需要提供合并函数。

`parallelStream()` 默认使用公共 `ForkJoinPool`，数据量小、任务含阻塞 I/O 或依赖顺序时往往不会更快，还可能占满公共线程池影响其他任务。是否使用并行流应以实际测量为准。

参考：[Java 21 API：java.util.stream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/package-summary.html)。
