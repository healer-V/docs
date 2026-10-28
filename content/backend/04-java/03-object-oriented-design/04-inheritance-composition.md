---
title: "继承与组合"
tags:
  - Java 21
  - 继承
  - 组合
excerpt: "说明继承所表达的可替代类型关系、super 与重写规则，并通过客户和折扣案例判断何时使用继承、组合与委托。"
date: 2026-09-03
---

# 继承与组合

继承表达“子类型可以在遵守父类型契约的前提下替代父类型”，组合表达“一个对象持有另一个对象并把部分职责委托给它”。代码复用只是结果，不足以单独证明应该继承。

## 一、extends 建立子类型关系

Java 类只能直接继承一个父类；未显式写 `extends` 的普通类直接继承 `Object`。

本篇 `InheritanceCompositionDemo.java` 中，`BusinessCustomer extends Customer` 表示企业客户是客户的一种。下面只截取企业客户的标签方法；`department` 由其构造器保存，父类的 `shippingLabel()` 返回客户编号和名称，完整类声明见本篇运行示例。

```java
/**
 * 在父类标签基础上追加企业部门。
 *
 * @return 包含部门信息的配送标签
 */
@Override
protected String shippingLabel() {
    return super.shippingLabel() + "-" + department;
}
```

子类继承可访问的实例行为，但父类的 `private` 成员不能由子类直接访问；它们仍然是父类对象状态的一部分，应通过父类提供的受控行为使用。构造器不会被继承。

## 二、父类与子类的初始化

子类构造器必须先完成父类构造。若没有显式写 `super(...)` 或 `this(...)`，编译器尝试插入 `super()`：

```java
BusinessCustomer(String id, String name, String department) {
    super(id, name);
    this.department = department;
}
```

::: warning 父类构造器不要调用可重写方法

先建立父类部分，才能建立子类新增状态。但父类构造器此时不应调用可重写方法，否则动态分派可能进入尚未完成初始化的子类实现。

:::

初始化顺序可以概括为：

```text
父类实例字段与实例块
→ 父类构造器体
→ 子类实例字段与实例块
→ 子类构造器体
```

各层级的静态初始化在对应类型首次主动使用时单独完成，不是每次创建对象都执行。

## 三、重写维护父类型契约

### 1. @Override 让编译器检查意图

实例方法重写要求名称和参数匹配，返回类型相同或协变，访问权限不能更严格，受检异常不能比父方法更宽。`@Override` 能在拼写或签名不一致时立刻产生编译错误，应默认使用。

::: tip 先用 Override 核对重写意图

如果参数列表不同，源码声明的是重载而非重写，运行时多态不会进入它。检查重写问题时，应先查看编译器对 `@Override` 的错误，再核对方法签名和可见性。

:::

### 2. super 调用父类实现

`super.shippingLabel()` 适合在稳定父类行为上补充信息。如果子类必须复制父类大量内部逻辑，说明父类没有提供合适扩展点；如果每次父类改动都破坏子类，说明继承层次过于脆弱。

`super` 选择当前类直接父类中的实现，不会改变当前对象身份。调用结束后仍返回同一个子类对象的执行流程，父类方法内部可重写调用依旧可能动态分派。

### 3. final 限制扩展

::: info 开放继承意味着维护长期契约

`final` 类不能被继承，`final` 方法不能被重写。类型尚未设计并验证继承契约时，使用 `final` 可以避免外部把实现类当成扩展框架。开放继承意味着要长期维护构造、状态和方法语义，不只是去掉一个修饰符。

:::

`final` 字段与继承开放性无关：它限制字段只能赋值一次，而不是限制对象类型被继承。三个位置的 `final` 应分别按变量赋值、方法重写和类继承来理解。

## 四、可替代性是继承前提

若某方法接收 `Customer`，传入 `BusinessCustomer` 后仍应满足原有前置条件、后置条件和行为含义：

```java
void printCustomer(Customer customer) {
    System.out.println(customer.shippingLabel());
}
```

子类不能突然要求调用方提供父类不需要的额外条件，也不能把父类承诺成功的操作改为无条件失败。经典反例是把“不可调整尺寸的正方形”继承为“宽高可分别修改的矩形”：语法关系成立，但行为契约无法替代。

## 五、组合把变化隔离为协作对象

订单定价并不是“折扣策略的一种”，而是“使用某个折扣策略”：

下面截取本篇 `PricingService.quote`。构造器将传入策略保存在 `discountPolicy` 字段中，报价时再委托其 `apply` 方法；字段、构造器、接口和两种策略实现在本篇完整程序中给出。

::: details 查看策略委托片段

```java
/**
 * 使用组合的策略生成报价。
 *
 * @param originalCents 原价，必须大于或等于 0，单位为分
 * @return 折后价，单位为分
 */
private long quote(long originalCents) {
    if (originalCents < 0) {
        throw new IllegalArgumentException("原价不能为负数");
    }
    return discountPolicy.apply(originalCents);
}
```

:::

`PricingService` 通过字段持有策略，并把计算委托给策略。替换折扣规则不需要创建一棵 `VipPricingService`、`FestivalVipPricingService` 继承树，也不会把定价服务的内部实现暴露给策略。

## 六、继承与组合决策

| 判断问题 | 更倾向继承 | 更倾向组合 |
|----------|------------|------------|
| 关系含义 | 稳定的 is-a，可安全替代 | has-a / uses-a，职责协作 |
| 变化方式 | 子类型分类稳定、契约一致 | 算法或能力需要独立替换 |
| 复用内容 | 状态、实现和契约共同相关 | 只想复用一项行为 |
| 耦合程度 | 子类了解父类扩展规则 | 协作者只依赖窄接口 |
| 运行时替换 | 通常对象类型创建后固定 | 可以注入或切换协作对象 |

::: tip 根据替代关系选择继承或组合

“优先组合”不是禁止继承。`BusinessCustomer` 确实是一类客户且能履行客户契约，继承合理；折扣规则是定价服务使用的算法，组合更合理。

:::

## 七、运行客户与定价示例

完整源码保存为 `InheritanceCompositionDemo.java`。前半段通过父类型参数接收企业客户，后半段给同一定价服务注入不同策略。

```java
Customer customer = new BusinessCustomer("C-100", "华东商贸", "统一采购部");
printCustomer(customer);

PricingService regularPricing = new PricingService(new NoDiscountPolicy());
PricingService vipPricing = new PricingService(new PercentageDiscountPolicy(10));
System.out.println("regular cents=" + regularPricing.quote(10_000L));
System.out.println("vip cents=" + vipPricing.quote(10_000L));
```

新建一个空文件夹，将以下代码保存为 `InheritanceCompositionDemo.java`，编码使用 UTF-8。后续编译和运行命令均在该文件夹执行。

::: details 查看 InheritanceCompositionDemo 完整代码

```java [InheritanceCompositionDemo.java]
/**
 * 对比用于表达稳定替代关系的继承与用于替换业务策略的组合。
 */
public final class InheritanceCompositionDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private InheritanceCompositionDemo() {
    }

    /**
     * 示例入口。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        Customer customer = new BusinessCustomer("C-100", "华东商贸", "统一采购部");
        printCustomer(customer);

        PricingService regularPricing = new PricingService(new NoDiscountPolicy());
        PricingService vipPricing = new PricingService(new PercentageDiscountPolicy(10));
        System.out.println("regular cents=" + regularPricing.quote(10_000L));
        System.out.println("vip cents=" + vipPricing.quote(10_000L));
    }

    /**
     * 只依赖客户基类打印标签，验证子类能够安全替代父类。
     *
     * @param customer 任意符合 Customer 契约的客户对象
     */
    private static void printCustomer(Customer customer) {
        System.out.println("customer=" + customer.shippingLabel());
    }

    /**
     * 客户基类定义所有客户共有的稳定身份和行为。
     */
    private static class Customer {
        private final String id;
        private final String name;

        /**
         * 创建基础客户。
         *
         * @param id 客户编号，不能为空
         * @param name 客户名称，不能为空
         */
        private Customer(String id, String name) {
            this.id = id;
            this.name = name;
        }

        /**
         * 返回配送标签的基础格式。
         *
         * @return 客户编号和名称
         */
        protected String shippingLabel() {
            return id + "-" + name;
        }
    }

    /**
     * 企业客户是客户的一种，并在父类契约上补充部门信息。
     */
    private static final class BusinessCustomer extends Customer {
        private final String department;

        /**
         * 创建企业客户。
         *
         * @param id 客户编号，不能为空
         * @param name 企业名称，不能为空
         * @param department 收货部门，不能为空
         */
        private BusinessCustomer(String id, String name, String department) {
            super(id, name);
            this.department = department;
        }

        /**
         * 在父类标签基础上追加企业部门。
         *
         * @return 包含部门信息的配送标签
         */
        @Override
        protected String shippingLabel() {
            return super.shippingLabel() + "-" + department;
        }
    }

    /**
     * 折扣策略只描述可替换的定价算法。
     */
    private interface DiscountPolicy {

        /**
         * 根据原价计算折后价。
         *
         * @param originalCents 原价，必须大于或等于 0，单位为分
         * @return 折后价，单位为分
         */
        long apply(long originalCents);
    }

    /**
     * 不提供折扣的策略。
     */
    private static final class NoDiscountPolicy implements DiscountPolicy {

        /**
         * 创建无折扣策略。
         */
        private NoDiscountPolicy() {
        }

        /**
         * 原样返回订单原价。
         *
         * @param originalCents 原价，必须大于或等于 0，单位为分
         * @return 未折扣的价格
         */
        @Override
        public long apply(long originalCents) {
            return originalCents;
        }
    }

    /**
     * 按整数百分比提供折扣的策略。
     */
    private static final class PercentageDiscountPolicy implements DiscountPolicy {
        private final int percent;

        /**
         * 创建百分比折扣策略。
         *
         * @param percent 减免百分比，取值范围为 0～100
         */
        private PercentageDiscountPolicy(int percent) {
            if (percent < 0 || percent > 100) {
                throw new IllegalArgumentException("折扣百分比必须在 0～100 之间");
            }
            this.percent = percent;
        }

        /**
         * 按配置百分比计算折后价。
         *
         * @param originalCents 原价，必须大于或等于 0，单位为分
         * @return 折后价，单位为分
         */
        @Override
        public long apply(long originalCents) {
            return Math.multiplyExact(originalCents, 100L - percent) / 100L;
        }
    }

    /**
     * 定价服务通过组合持有策略，不继承具体算法。
     */
    private static final class PricingService {
        private final DiscountPolicy discountPolicy;

        /**
         * 注入当前使用的折扣策略。
         *
         * @param discountPolicy 非 null 的折扣策略
         */
        private PricingService(DiscountPolicy discountPolicy) {
            this.discountPolicy = discountPolicy;
        }

        /**
         * 使用组合的策略生成报价。
         *
         * @param originalCents 原价，必须大于或等于 0，单位为分
         * @return 折后价，单位为分
         */
        private long quote(long originalCents) {
            if (originalCents < 0) {
                throw new IllegalArgumentException("原价不能为负数");
            }
            return discountPolicy.apply(originalCents);
        }
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out InheritanceCompositionDemo.java
java -cp out InheritanceCompositionDemo
```

预期输出：

```text
customer=C-100-华东商贸-统一采购部
regular cents=10000
vip cents=9000
```

第一行证明企业客户能够通过客户契约使用；后两行证明服务结构不变时，组合不同策略即可改变报价。示例使用整数百分比说明结构，没有覆盖金额舍入和税费规则。

## 八、失败边界

| 失败信号 | 设计问题 | 调整方向 |
|----------|----------|----------|
| 子类重写大多数父类方法为“不支持” | 不满足可替代性 | 拆分契约或改用组合 |
| 为复用一个工具方法建立继承 | 类型关系虚假 | 提取协作者或静态纯函数 |
| 父类新增字段导致多个子类异常 | 子类依赖父类实现细节 | 收窄 `protected` 面，提供稳定模板点 |
| 继承层次同时编码客户、地区、活动 | 多个变化维度形成组合爆炸 | 将独立维度拆为策略或值对象 |

规范依据可参阅 [JLS 8.1.4：Superclasses and Subclasses](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.4) 与 [JLS 8.4.8：Inheritance, Overriding, and Hiding](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8)。
