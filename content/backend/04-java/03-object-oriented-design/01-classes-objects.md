---
title: "类与对象"
tags:
  - Java 21
  - 面向对象
  - 类与对象
excerpt: "解释类、对象、字段、方法、实例状态与静态状态的关系，并通过商品对象辨别引用身份、对象值和状态变化。"
date: 2026-09-03
---

# 类与对象

类定义一类对象允许保存的状态和能够执行的行为，对象则是运行时按照该定义创建的具体实例。Java 变量保存对象的引用，不会把整个对象复制进变量。

## 一、类把状态和行为组成类型

`Product` 把商品数据与库存操作组织在同一个类型中。`sku`、`name` 保存商品编码和名称，`stock` 保存每个商品自己的库存；`reserve` 先检查数量再扣减库存，防止对象进入无效状态。

下面摘录本篇 `ClassesObjectsDemo.java` 中的嵌套类型声明与实例字段，省略外层类、构造器和方法。完整声明和执行入口在本篇运行示例中给出：

```java
/** 商品状态与库存操作的声明片段。 */
private static final class Product {
    private final String sku;
    private final String name;
    private int stock;
    // 构造器和库存操作方法见本篇完整程序。
}
```

| 成员 | 在对象模型中的含义 | 示例 |
|------|--------------------|------|
| 实例字段 | 每个对象各自持有的状态 | `sku`、`name`、`stock` |
| 实例方法 | 读取或改变当前对象状态的行为 | `reserve` |
| 构造器 | 建立对象开始可用时的状态 | `Product(...)` |
| 类型约束 | 阻止对象进入无效状态 | 库存不能预占为负数 |

::: tip 让状态与规则形成同一个边界

只有数据而没有行为的类容易让状态修改规则散落在调用方；只有方法而没有清晰状态归属，则很难判断行为作用于谁。面向对象设计的起点不是“所有东西都建类”，而是让有关联的状态与规则形成明确边界。

:::

## 二、对象是运行时实例

### 1. new 创建独立对象

```java
Product keyboard = new Product("SKU-1001", "机械键盘", 10);
Product anotherKeyboard = new Product("SKU-1001", "机械键盘", 10);
```

两次 `new` 创建两个独立对象。即使构造参数相同，修改 `keyboard` 的库存也不会改变 `anotherKeyboard`。构造参数相同描述的是“当前字段值相同”，不是“两个变量指向同一对象”。

### 2. 引用变量指向对象

```text
keyboard ─────────▶ Product A：stock=10
anotherKeyboard ──▶ Product B：stock=10
```

执行 `keyboard.reserve(3)` 后，只有 Product A 的 `stock` 变成 `7`。如果再执行 `Product alias = keyboard`，`alias` 与 `keyboard` 才会指向同一个对象；通过任一引用修改对象，另一引用都能观察到变化。

## 三、实例成员与静态成员

### 1. 实例成员依赖具体对象

实例方法通过隐式的 `this` 引用当前接收者。表达式 `keyboard.reserve(3)` 中，`keyboard` 指向的对象就是方法体中的 `this`。实例方法可以直接读取当前对象的实例字段。

`this.stock` 和 `stock` 在没有同名局部变量遮蔽时含义相同；构造器中常用 `this.stock = stock` 区分字段与形参。

### 2. 静态成员属于类

```java
private static int createdCount;
```

静态字段在一个类加载器定义的类型中只有一份，不随实例重复创建。它适合保存类型常量、无实例状态的工具行为，或像示例中的实例计数器一样展示共享状态。

::: warning 静态可变字段会形成进程级共享状态
把库存、当前用户或订单内容放进 `static` 字段，会让所有实例互相覆盖数据，并在并发和测试中产生隐蔽耦合。业务对象状态通常应属于实例。
:::

## 四、对象身份与对象值

### 1. == 判断引用身份

对于引用类型，`keyboard == anotherKeyboard` 检查两个引用是否指向同一个对象，不会逐字段比较内容。因此两个独立创建的商品结果为 `false`。

::: info 身份相同与业务等价不是同一判断

身份比较适合判断别名关系、检测同一个锁对象或处理枚举常量，不适合回答两个业务值是否等价。即使两个变量当前都指向 `null`，`==` 为 `true` 也只表示两者都没有对象。

:::

### 2. equals 由类型定义值语义

普通类如果没有重写 `equals`，会继承 `Object.equals` 的身份比较行为。此时即使字段相同，`keyboard.equals(anotherKeyboard)` 仍为 `false`。

::: warning 相等字段需要按业务语义选择

哪些字段共同定义“同一个值”是领域决策：商品编码值对象可能只比较标准化编码，订单实体则可能按稳定订单标识识别。不要为了让测试通过而机械比较所有字段；完整契约由本章“Object 通用契约”文章负责。

:::

## 五、类的职责边界

判断某个数据或行为是否属于一个类，可以依次检查：

1. 该字段是否描述每个实例自身的状态；
2. 该方法是否需要维护这些字段之间的约束；
3. 不经过该方法直接修改字段，是否可能破坏业务规则；
4. 类是否同时因为多个无关原因频繁变化。

`Product.reserve` 属于商品库存边界，因为它同时读取和修改库存并维护数量约束。发送短信、写数据库、生成财务报表则不是商品本身的基本行为，把它们全部塞入 `Product` 会造成职责混杂。

## 六、运行商品对象示例

完整源码保存为 `ClassesObjectsDemo.java`。其中创建两个字段值相同的商品，只修改第一个实例，并观察对象身份、默认相等性和静态计数。

关键调用如下；完整文件还包含参数校验、摘要方法和必要的 JavaDoc：

```java
Product keyboard = new Product("SKU-1001", "机械键盘", 10);
Product anotherKeyboard = new Product("SKU-1001", "机械键盘", 10);

keyboard.reserve(3);

System.out.println(keyboard.summary());
System.out.println(anotherKeyboard.summary());
System.out.println("same reference=" + (keyboard == anotherKeyboard));
System.out.println("default equals=" + keyboard.equals(anotherKeyboard));
System.out.println("created products=" + Product.createdCount());
```

新建一个空文件夹，将以下代码保存为 `ClassesObjectsDemo.java`，编码使用 UTF-8。后续编译和运行命令均在该文件夹执行。

::: details 查看 ClassesObjectsDemo 完整代码

```java [ClassesObjectsDemo.java]
/**
 * 演示类如何定义状态与行为，以及实例状态和静态状态的区别。
 */
public final class ClassesObjectsDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private ClassesObjectsDemo() {
    }

    /**
     * 示例入口。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        Product keyboard = new Product("SKU-1001", "机械键盘", 10);
        Product anotherKeyboard = new Product("SKU-1001", "机械键盘", 10);

        keyboard.reserve(3);

        System.out.println(keyboard.summary());
        System.out.println(anotherKeyboard.summary());
        System.out.println("same reference=" + (keyboard == anotherKeyboard));
        System.out.println("default equals=" + keyboard.equals(anotherKeyboard));
        System.out.println("created products=" + Product.createdCount());
    }

    /**
     * 商品类把商品数据和库存行为组织在同一个类型中。
     */
    private static final class Product {
        private static int createdCount;

        private final String sku;
        private final String name;
        private int stock;

        /**
         * 创建具有初始库存的商品。
         *
         * @param sku 商品编码，不能为空
         * @param name 商品名称，不能为空
         * @param stock 初始库存，必须大于或等于 0
         */
        private Product(String sku, String name, int stock) {
            this.sku = sku;
            this.name = name;
            this.stock = stock;
            createdCount++;
        }

        /**
         * 预占指定数量的库存。
         *
         * @param quantity 预占数量，必须大于 0 且不能超过可用库存
         */
        private void reserve(int quantity) {
            if (quantity <= 0 || quantity > stock) {
                throw new IllegalArgumentException("预占数量无效");
            }
            stock -= quantity;
        }

        /**
         * 返回适合观察示例状态的商品摘要。
         *
         * @return 商品编码、名称和当前库存
         */
        private String summary() {
            return "%s %s stock=%d".formatted(sku, name, stock);
        }

        /**
         * 返回当前进程已经创建的商品实例数量。
         *
         * @return 商品实例累计数量
         */
        private static int createdCount() {
            return createdCount;
        }
    }
}
```

:::


::: code-group

```powershell [PowerShell]

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out ClassesObjectsDemo.java
java -cp out ClassesObjectsDemo
```

```bash [bash]

mkdir -p out
javac -encoding UTF-8 -d out ClassesObjectsDemo.java
java -cp out ClassesObjectsDemo
```

:::

预期输出：

```text
SKU-1001 机械键盘 stock=7
SKU-1001 机械键盘 stock=10
same reference=false
default equals=false
created products=2
```

::: info 实例独立不代表并发计数安全

第一、二行证明实例状态独立；第三、四行分别证明引用身份和默认相等性；最后一行证明静态字段由所有实例共享。这个示例没有定义值相等性，也没有解决并发计数，不能直接作为生产商品模型。

:::

## 七、常见错误与判断方法

| 错误 | 可观察现象 | 原因与修正 |
|------|------------|------------|
| 把实例状态声明为 `static` | 创建第二个对象后第一个对象的数据也变化 | 将每个对象独有的数据改为实例字段 |
| 用 `==` 比较对象内容 | 相同字段的两个对象得到 `false` | 明确值语义并成对实现 `equals`、`hashCode` |
| 只公开字段让外部任意赋值 | 对象出现负库存等无效状态 | 使用私有字段和有业务含义的方法维护约束 |
| 一个类承担所有业务步骤 | 改动影响范围不断扩大 | 按状态所有权和变化原因拆分职责 |

规范依据可参阅 [JLS 8：Classes](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html) 与 [JLS 15.9：Class Instance Creation Expressions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.9)。
