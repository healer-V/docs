---
title: "嵌套类与匿名类"
tags:
  - Java 21
  - 嵌套类
  - 匿名类
excerpt: "比较静态嵌套类、成员内部类、局部类和匿名类的作用域与状态捕获方式，并说明隐式外部引用带来的生命周期边界。"
date: 2026-09-03
---

# 嵌套类与匿名类

Java 可以在一个类或方法内部声明其他类。嵌套位置用于表达协作范围，不代表继承关系。成员类是否带 `static` 决定它是否关联外部实例；局部类和匿名类还要判断声明处是否为静态上下文。

## 一、四种嵌套形式

| 形式 | 声明位置 | 是否关联外部实例 | 典型用途 |
|------|----------|----------------------|----------|
| 静态嵌套类 | 类体内，带 `static` | 否 | 只服务外部类型的辅助值或建造器 |
| 成员内部类 | 类体内，不带 `static` | 是 | 与某个外部对象强绑定的协作者 |
| 局部类 | 方法或代码块内 | 普通局部类声明在静态上下文中时没有；在实例上下文中时有关联 | 只在局部算法中复用的小型类型 |
| 匿名类 | `new` 表达式中 | 对声明处的外部类，按静态或实例上下文判断 | 一次性实现接口或扩展类 |

嵌套类拥有自己的类型和成员。把类写在另一个类里，不会自动获得“子类”关系，也不会让所有实例共享同一个嵌套对象。

这里讨论普通局部类；局部 Record 和枚举隐式为静态。静态方法中的局部类可以捕获有效 final 的局部变量，但不能隐式使用外部对象的实例字段。这个边界由声明上下文决定，不能只看方法体有没有读取某个字段。语言中的外部实例关联也不等于特定编译器一定生成某个隐藏字段，规则见 [JLS 8.1.3](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.3)。

## 二、静态嵌套类不依赖外部对象

本篇 `NestedClassesDemo.java` 将 `Snapshot` 声明为 `Order` 的静态嵌套类。下面是其 `main` 方法中的调用片段，构造器与摘要方法均在本篇完整文件中给出：

```java
Order.Snapshot snapshot = new Order.Snapshot("ORD-8001", 12_800L);
System.out.println(snapshot.summary());
```

静态嵌套类通过 `Outer.Nested` 命名，可以直接访问外部类的静态成员，但访问实例状态必须显式接收 `Order` 对象或所需字段。它不会因为声明位置而持有外部实例，因此通常是辅助类型的默认选择。

::: info 私有嵌套类型不会向包外公开

`private` 嵌套类可以把实现细节限制在外部类内部；外部类与嵌套类之间可以访问彼此私有成员，但这不等于向包外公开。

:::

## 三、成员内部类绑定外部实例

下面的调用片段放在本篇完整程序的 `main` 中。`Order` 接收订单号和金额，`Auditor` 接收操作来源；两者的构造器均保留在完整文件中：

```java
Order order = new Order("ORD-8001", 12_800L);
Order.Auditor auditor = order.new Auditor("checkout");
System.out.println(auditor.audit());
```

`Auditor` 的每个实例都关联创建它的 `Order`。`Order.this` 可显式引用外部对象，普通 `this` 指向内部类对象。没有外部实例就不能创建该成员内部类。

::: warning 内部对象会延长外部对象生命周期

本例的 `Auditor.audit()` 会读取 `Order.this.number`，需要保留关联的订单对象。若长生命周期缓存保存这个审计器，订单也会继续可达。协作者不需要持续访问外部对象时，应改为静态嵌套类并只传入必要数据。

:::

## 四、局部类捕获有效 final 变量

局部类只在声明它的块内可见，可以读取外部实例成员，也可以捕获局部变量或参数，但被捕获变量必须是 `final` 或“有效 final”——初始化后没有再次赋值。

以下摘录 `Order.printLabel`，其中 `number` 来自外部订单，`status` 来自本次方法调用。外层 `Order` 的字段和构造器见本篇完整程序：

::: details 查看局部类捕获片段

```java
/**
 * 在方法作用域中声明局部类并捕获有效 final 参数。
 *
 * @param status 本次打印使用的状态文本，方法内不再修改
 */
private void printLabel(String status) {
    /** 局部标签类只服务当前方法。 */
    final class Label {
        /**
         * 组合订单号和捕获的状态。
         * @return 订单状态标签
         */
        private String text() {
            return number + ":" + status;
        }
    }
    System.out.println("local=" + new Label().text());
}
```

:::

局部变量存活在方法调用中，而局部类对象可能在方法返回后继续存在。Java 捕获的是该次调用中的值，不允许之后重新赋值，以免形成“到底观察哪一次局部变量”的不稳定语义。引用本身不可重新赋值，不代表引用对象不可变。

## 五、匿名类表达一次性实现

匿名类在创建对象时直接声明实现，没有可引用的类名。以下是本篇 `Order.submit()` 的方法体片段，`number` 来自当前订单实例；调用方取得 `Runnable` 后再执行 `run()`：

```java
return new Runnable() {
    /** 打印匿名类捕获的外部订单号。 */
    @Override
    public void run() {
        System.out.println("anonymous submit=" + number);
    }
};
```

匿名类可以声明字段、方法和初始化块，但不能显式声明普通构造器。逻辑较长、需要多次创建或具有独立业务名称时，应提取为命名类。

::: info 匿名类与 Lambda 的语义不同

单抽象方法接口常可使用 Lambda 简化，但两者的 `this`、类型身份和成员声明能力不同。Lambda 的完整语义由函数式编程章节负责；此处不要把匿名类理解为 Lambda 的纯语法展开。

:::

## 六、作用域、遮蔽与可读性

内部类成员、外部类成员和局部变量可能同名。可用 `this.field` 指当前内部对象，用 `Outer.this.field` 指关联外部对象，但大量限定名通常表明职责边界不清。

::: tip 按协作范围决定是否嵌套类型

嵌套层级原则上不宜过深。类型只被一个外部类使用并与其概念紧密相关时才嵌套；多个模块共同使用的领域类型应成为顶级类，而不是为了减少文件数量塞入一个“总类”。

:::

## 七、运行四种嵌套类型示例

完整源码保存为 `NestedClassesDemo.java`。示例分别创建静态快照、订单审计器、局部标签和匿名提交任务。

```java
Order order = new Order("ORD-8001", 12_800L);
Order.Snapshot snapshot = new Order.Snapshot(order.number, order.totalCents);
Order.Auditor auditor = order.new Auditor("checkout");

System.out.println(snapshot.summary());
System.out.println(auditor.audit());
order.printLabel("PAID");
order.submit().run();
```

新建一个空文件夹，将以下代码保存为 `NestedClassesDemo.java`，编码使用 UTF-8。后续编译和运行命令均在该文件夹执行。

::: details 查看 NestedClassesDemo 完整代码

```java [NestedClassesDemo.java]
/**
 * 演示静态嵌套类、成员内部类、局部类和匿名类的状态捕获差异。
 */
public final class NestedClassesDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private NestedClassesDemo() {
    }

    /**
     * 示例入口。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        Order order = new Order("ORD-8001", 12_800L);
        Order.Snapshot snapshot = new Order.Snapshot(order.number, order.totalCents);
        Order.Auditor auditor = order.new Auditor("checkout");

        System.out.println(snapshot.summary());
        System.out.println(auditor.audit());
        order.printLabel("PAID");
        order.submit().run();
    }

    /**
     * 订单外部类提供四种嵌套类型的承载上下文。
     */
    private static final class Order {
        private final String number;
        private final long totalCents;

        /**
         * 创建订单。
         *
         * @param number 订单号，不能为空
         * @param totalCents 订单总额，必须大于或等于 0，单位为分
         */
        private Order(String number, long totalCents) {
            this.number = number;
            this.totalCents = totalCents;
        }

        /**
         * 在方法作用域中声明局部类并捕获有效 final 参数。
         *
         * @param status 本次打印使用的状态文本，方法内不再修改
         */
        private void printLabel(String status) {
            /**
             * 局部标签类只服务当前方法。
             */
            final class Label {

                /**
                 * 组合订单号和捕获的状态。
                 *
                 * @return 订单状态标签
                 */
                private String text() {
                    return number + ":" + status;
                }
            }
            System.out.println("local=" + new Label().text());
        }

        /**
         * 返回捕获当前订单实例的匿名任务。
         *
         * @return 执行时打印当前订单号的 Runnable
         */
        private Runnable submit() {
            return new Runnable() {
                /**
                 * 打印匿名类捕获的外部订单号。
                 */
                @Override
                public void run() {
                    System.out.println("anonymous submit=" + number);
                }
            };
        }

        /**
         * 静态嵌套快照只保存显式传入的数据，不持有外部订单实例。
         */
        private static final class Snapshot {
            private final String number;
            private final long totalCents;

            /**
             * 创建订单快照。
             *
             * @param number 快照中的订单号
             * @param totalCents 快照中的订单总额，单位为分
             */
            private Snapshot(String number, long totalCents) {
                this.number = number;
                this.totalCents = totalCents;
            }

            /**
             * 返回快照摘要。
             *
             * @return 订单号和总额快照
             */
            private String summary() {
                return "snapshot=%s cents=%d".formatted(number, totalCents);
            }
        }

        /**
         * 成员内部审计器隐式关联创建它的订单实例。
         */
        private final class Auditor {
            private final String operator;

            /**
             * 创建订单审计器。
             *
             * @param operator 操作来源，不能为空
             */
            private Auditor(String operator) {
                this.operator = operator;
            }

            /**
             * 读取关联订单的私有字段并生成审计文本。
             *
             * @return 操作来源与订单号
             */
            private String audit() {
                return "operator=%s order=%s".formatted(operator, Order.this.number);
            }
        }
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out NestedClassesDemo.java
java -cp out NestedClassesDemo
```

预期输出：

```text
snapshot=ORD-8001 cents=12800
operator=checkout order=ORD-8001
local=ORD-8001:PAID
anonymous submit=ORD-8001
```

快照只输出构造时显式传入的数据；其余三种形式都访问了当前订单号或方法参数。示例同步执行匿名任务，没有覆盖跨线程生命周期和异常传播。

## 八、失败边界与选择

| 现象 | 原因 | 修正 |
|------|------|------|
| `an enclosing instance ... is required` | 在没有外部对象时创建成员内部类 | 使用 `outer.new Inner()` 或改为静态嵌套类 |
| `local variables referenced ... must be final or effectively final` | 捕获后又给局部变量赋值 | 重新设计状态归属，不用可变局部变量通信 |
| 缓存一个小监听器却保留大对象图 | 内部类隐式持有外部实例 | 改为静态嵌套类并显式传入最小数据 |
| 匿名类包含大量业务分支 | 一次性语法承载了独立职责 | 提取有名称、可测试的实现类 |

规范依据可参阅 [JLS 8.1.3：Inner Classes and Enclosing Instances](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.3)、[JLS 14.3：Local Class Declarations](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.3) 与 [JLS 15.9.5：Anonymous Class Declarations](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.9.5)。
