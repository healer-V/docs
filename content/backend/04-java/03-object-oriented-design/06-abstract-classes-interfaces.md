---
title: "抽象类与接口"
tags:
  - Java 21
  - 抽象类
  - 接口
excerpt: "比较抽象类的共享状态与模板实现、接口的行为契约和多实现能力，并通过支付处理器说明默认方法冲突与选型边界。"
date: 2026-09-03
---

# 抽象类与接口

接口主要定义调用方可依赖的行为契约，抽象类可以在单继承体系中同时提供共享状态、构造约束和部分实现。两者可以协作，但不应为了“看起来可扩展”而给每个类机械创建接口和抽象父类。

## 一、抽象类表达不完整的基类

抽象类使用 `abstract` 声明，不能直接 `new`，但可以拥有字段、构造器、普通方法、抽象方法和静态成员：

以下截取本篇 `AbstractInterfaceDemo.java` 中抽象基类的 `process` 方法。`merchantId` 由基类构造器保存，`doProcess` 是子类必须实现的抽象方法；完整声明在本篇运行示例中给出。

::: details 查看支付模板方法

```java
/**
 * 固定先校验再调用渠道实现，避免子类改变公共流程。
 *
 * @param orderNumber 订单号，不能为空
 * @param amountCents 支付金额，必须大于 0，单位为分
 * @return 包含商户和渠道结果的摘要
 */
@Override
public final String process(String orderNumber, long amountCents) {
    if (orderNumber == null || orderNumber.isBlank() || amountCents <= 0) {
        throw new IllegalArgumentException("订单号和支付金额无效");
    }
    return "merchant=%s, %s".formatted(merchantId, doProcess(orderNumber, amountCents));
}
```

:::

这里基类固定“校验后处理”的算法骨架，把渠道差异留给抽象方法。这是模板方法结构。`process` 声明为 `final`，阻止子类绕过统一校验；`doProcess` 只暴露实现差异所需的最小扩展点。

::: info 抽象类仍然参与对象初始化

抽象类构造器用于初始化基类状态，只能在子类构造过程中通过 `super(...)` 调用。抽象类本身不能实例化，不代表它不参与对象初始化。

:::

## 二、接口定义行为契约

### 1. 实现类承诺可调用的行为

```java
interface PaymentProcessor {
    String process(String orderNumber, long amountCents);
}
```

类使用 `implements` 承诺实现接口。一个类只能直接继承一个父类，却可以实现多个互相兼容的接口，因此接口适合表达跨继承层次的能力，例如 `Comparable`、`AutoCloseable`。

### 2. 接口成员的实现与状态边界

接口不是“没有任何实现的类”。默认方法可以复用行为，但接口不能因此获得每个实例独有的字段或构造过程。调用者依赖的是公开契约，接口内部的辅助实现不应变成额外调用入口。

Java 21 接口可以声明：

| 成员 | 规则 | 典型用途 |
|------|------|----------|
| 抽象实例方法 | 默认 `public abstract` | 声明实现类必须提供的行为 |
| `default` 方法 | 带方法体，可被重写 | 兼容地演进已有接口的通用行为 |
| `static` 方法 | 通过接口名调用 | 与接口概念强相关的工具入口 |
| `private` 方法 | 仅供接口内部调用 | 复用多个默认方法的实现细节 |
| 字段 | 隐式 `public static final` | 类型级共享值，不保存实例状态；不一定是编译期常量 |

接口不能声明普通实例字段和实例构造器，因此不适合承载需要统一初始化的共享可变状态。

字段是 `final` 只限制重新赋值。若接口字段引用可变对象，各实现仍可能观察到共享修改；只有满足常量表达式要求的基本类型或 `String` 字段才具有编译期常量语义。需要实例配置的支付处理器应由实现类或协作者持有配置。

## 三、共享实现与行为契约的选择

| 判断维度 | 抽象类 | 接口 |
|----------|--------|------|
| 核心目的 | 为紧密相关子类共享状态和实现 | 定义调用方依赖的行为能力 |
| 状态 | 可以有实例字段 | 不能有普通实例字段 |
| 构造 | 可以建立基类不变量 | 没有构造器 |
| 继承数量 | 只能继承一个类 | 可以实现多个兼容接口 |
| 演进约束 | 可增加受保护实现，但会耦合子类 | 新增抽象方法会破坏现有实现，默认方法需维护语义 |

支付处理器可让调用方依赖 `PaymentProcessor` 接口，同时用 `AbstractPaymentProcessor` 为本项目多个渠道共享校验和商户状态。第三方实现可以直接实现接口，不被迫继承项目基类。

## 四、接口隔离控制契约宽度

如果接口同时要求支付、退款、对账和文件导出，某些实现可能被迫抛出 `UnsupportedOperationException`。这说明调用方需要的能力没有被正确拆分。

```java
interface PaymentProcessor {
    String process(String orderNumber, long amountCents);
}

interface RefundProcessor {
    String refund(String paymentId, long amountCents);
}
```

::: tip 按调用者需要控制接口宽度

接口应围绕一个调用者角色所需的最小行为组织，而不是越小越好。把一个稳定操作拆成多个单方法接口同样会制造噪声，关键是避免调用方依赖它不使用的方法。

:::

## 五、默认方法冲突规则

当类从多个来源获得同签名默认方法时，Java 按以下原则处理：

1. 类或父类中的实例方法优先于接口默认方法；
2. 更具体的子接口默认方法优先于父接口；
3. 两个无继承关系的接口都提供同签名默认方法时，实现类必须显式重写。

本篇完整程序中，`PaymentProcessor.label()` 默认返回 `payment-processor`，`Auditable.label()` 默认返回 `auditable`。`CardPaymentProcessor` 同时继承这两个行为来源，因此显式重写如下；这里只摘录冲突处理方法，接口与父类声明保留在完整文件中。

```java
/**
 * 显式解决 PaymentProcessor 与 Auditable 的默认方法冲突。
 *
 * @return 银行卡审计处理器标签
 */
@Override
public String label() {
    return "payment-processor+card-audit";
}
```

::: warning 默认方法调用不能越过父类

若实现类直接实现两个接口，可在覆盖方法中使用 `PaymentProcessor.super.label()` 选择某个直接父接口实现。若接口已经由父类间接实现，子类不能用该语法越过父类调用接口默认方法。

:::

## 六、抽象方法与可见性

子类实现抽象方法或接口方法时，不能缩小访问权限。接口实例方法默认是 `public`，实现类即使省略修饰符看似同包可见，也会编译失败：

```java
interface Processor {
    String process();
}

// 编译失败：实现方法不能使用更弱的包访问权限
final class InvalidProcessor implements Processor {
    String process() {
        return "invalid";
    }
}
```

::: tip 用编译器检查抽象方法实现

使用 `@Override` 能让编译器核对签名与可见性。抽象类可以继续不实现接口方法，但第一个具体子类必须补齐所有未实现抽象方法。

:::

## 七、运行支付处理器示例

完整源码保存为 `AbstractInterfaceDemo.java`。调用方只持有接口，抽象父类固定处理流程，具体银行卡处理器补充渠道实现并显式处理标签冲突。

```java
PaymentProcessor processor = new CardPaymentProcessor("MERCHANT-01");
System.out.println("processor=" + processor.label());
System.out.println(processor.process("ORD-6001", 6_600L));
```

新建一个空文件夹，将以下代码保存为 `AbstractInterfaceDemo.java`，编码使用 UTF-8。后续编译和运行命令均在该文件夹执行。

::: details 查看 AbstractInterfaceDemo 完整代码

```java [AbstractInterfaceDemo.java]
/**
 * 演示接口契约、抽象基类共享流程以及默认方法冲突的显式解决。
 */
public final class AbstractInterfaceDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private AbstractInterfaceDemo() {
    }

    /**
     * 示例入口。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        PaymentProcessor processor = new CardPaymentProcessor("MERCHANT-01");
        System.out.println("processor=" + processor.label());
        System.out.println(processor.process("ORD-6001", 6_600L));
    }

    /**
     * 支付处理器接口只声明调用方需要的稳定行为。
     */
    private interface PaymentProcessor {

        /**
         * 处理指定订单的付款。
         *
         * @param orderNumber 订单号，不能为空
         * @param amountCents 支付金额，必须大于 0，单位为分
         * @return 支付结果摘要
         */
        String process(String orderNumber, long amountCents);

        /**
         * 返回处理器的默认标签。
         *
         * @return 默认处理器标签
         */
        default String label() {
            return "payment-processor";
        }
    }

    /**
     * 可审计能力提供与支付接口同签名的默认标签。
     */
    private interface Auditable {

        /**
         * 返回审计组件的默认标签。
         *
         * @return 默认审计标签
         */
        default String label() {
            return "auditable";
        }
    }

    /**
     * 抽象基类共享商户状态、校验和固定处理流程。
     */
    private abstract static class AbstractPaymentProcessor implements PaymentProcessor {
        private final String merchantId;

        /**
         * 创建绑定商户的处理器。
         *
         * @param merchantId 商户编号，不能为空
         */
        protected AbstractPaymentProcessor(String merchantId) {
            this.merchantId = merchantId;
        }

        /**
         * 固定先校验再调用渠道实现，避免子类改变公共流程。
         *
         * @param orderNumber 订单号，不能为空
         * @param amountCents 支付金额，必须大于 0，单位为分
         * @return 包含商户和渠道结果的摘要
         */
        @Override
        public final String process(String orderNumber, long amountCents) {
            if (orderNumber == null || orderNumber.isBlank() || amountCents <= 0) {
                throw new IllegalArgumentException("订单号和支付金额无效");
            }
            return "merchant=%s, %s".formatted(merchantId, doProcess(orderNumber, amountCents));
        }

        /**
         * 由具体渠道实现实际处理步骤。
         *
         * @param orderNumber 已通过校验的订单号
         * @param amountCents 已通过校验的支付金额，单位为分
         * @return 渠道处理结果
         */
        protected abstract String doProcess(String orderNumber, long amountCents);
    }

    /**
     * 银行卡处理器继承共享流程并实现支付、审计两个契约。
     */
    private static final class CardPaymentProcessor extends AbstractPaymentProcessor implements Auditable {

        /**
         * 创建银行卡处理器。
         *
         * @param merchantId 商户编号，不能为空
         */
        private CardPaymentProcessor(String merchantId) {
            super(merchantId);
        }

        /**
         * 显式解决 PaymentProcessor 与 Auditable 的默认方法冲突。
         *
         * @return 银行卡审计处理器标签
         */
        @Override
        public String label() {
            return "payment-processor+card-audit";
        }

        /**
         * 模拟银行卡渠道处理。
         *
         * @param orderNumber 已通过校验的订单号
         * @param amountCents 已通过校验的支付金额，单位为分
         * @return 银行卡渠道结果
         */
        @Override
        protected String doProcess(String orderNumber, long amountCents) {
            return "card accepted order=%s cents=%d".formatted(orderNumber, amountCents);
        }
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out AbstractInterfaceDemo.java
java -cp out AbstractInterfaceDemo
```

预期输出：

```text
processor=payment-processor+card-audit
merchant=MERCHANT-01, card accepted order=ORD-6001 cents=6600
```

第一行证明冲突标签由具体类明确决定；第二行同时包含抽象父类保存的商户信息和子类实现的渠道结果，说明共享流程与具体契约可以协作。

## 八、设计误区

| 误区 | 问题 | 判断方式 |
|------|------|----------|
| 每个实现类都配一个同名接口 | 没有替换需求却增加跳转层级 | 是否存在独立调用方契约或多个实现 |
| 接口包含大量不相关方法 | 实现类出现空实现或不支持异常 | 按调用者角色拆分能力 |
| 抽象类暴露大量 `protected` 字段 | 子类与内部表示强耦合 | 通过受控方法提供扩展点 |
| 默认方法承载关键可变状态 | 接口无法保存实例状态，语义分散 | 将状态放入实现类或组合对象 |

规范依据可参阅 [JLS 8.1.1.1：Abstract Classes](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.1.1) 与 [JLS 9：Interfaces](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html)。
