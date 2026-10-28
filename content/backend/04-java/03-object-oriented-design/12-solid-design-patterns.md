---
title: "SOLID 与设计模式"
tags:
  - Java 21
  - SOLID
  - 设计模式
excerpt: "以订单定价重构为主线解释 SOLID 的判断依据，以及策略、工厂和装饰器模式解决的具体变化问题与过度设计边界。"
date: 2026-09-03
---

# SOLID 与设计模式 {#solid-原则与常见设计模式}

SOLID 是检查职责、扩展和依赖方向的五组设计原则，设计模式是对反复出现的结构问题的命名。它们用于改善具体变化，不是类越多越好，也不是在业务需求出现前预建所有抽象。

## 一、从订单定价问题出发

假设结算服务把客户判断、折扣计算、审计输出和渠道创建全部写在一个方法中：

```java
long checkout(Order order, String customerType) {
    long result;
    if ("VIP".equals(customerType)) {
        result = order.originalCents() * 85 / 100;
    } else {
        result = order.originalCents();
    }
    System.out.println("audit=" + result);
    return result;
}
```

这段代码暂时能运行，但三种变化被绑在一起：新增客户定价规则要修改条件分支，改变审计方式要修改计算方法，测试定价还会同时产生输出。重构目标不是消除所有 `if`，而是隔离已经确认会独立变化的职责。

## 二、SOLID 作为诊断问题

### 1. 单一职责原则（SRP）

一个模块应围绕一个主要变化原因。定价策略负责计算，工厂负责从客户类型选择策略，审计装饰器负责记录，结算服务负责编排。SRP 不是“一类只能有一个方法”，而是避免无关业务角色共同驱动同一模块变化。

::: tip 从独立变化来源判断职责是否混杂

判断职责是否混杂时，应查看哪些角色会提出修改：财务调整折扣公式与运维调整审计格式是两个独立变化来源。若它们每次都修改同一个类并需要共同回归，拆分才有实际价值。

:::

### 2. 开闭原则（OCP）

对已识别的变化方向，可以通过新增实现扩展，而不反复修改稳定调用方。新增企业客户定价时实现新的 `PricingPolicy`，结算服务仍调用 `calculate`。这不表示旧代码永远不能修改；错误契约和新业务仍可能要求调整抽象。

开放的维度必须明确，其他维度仍可保持封闭。本例只对定价算法开放，不为订单的每个字段或每个算术步骤创建扩展点，避免抽象面无限扩大。

### 3. 里氏替换原则（LSP）

任何 `PricingPolicy` 都必须接受契约允许的订单，并返回合法的非负应付金额。某实现若对普通订单无条件抛出“不支持”，或返回比原价更高却未在契约中说明，就不能安全替代其他策略。

替换验证应覆盖正常结果、边界值和异常类型，而不只检查能否通过编译。子类型收紧输入前置条件、削弱输出保证或改变副作用，都可能破坏调用方依赖的行为契约。

### 4. 接口隔离原则（ISP）

结算服务只需要 `calculate(Order)`，不应被迫依赖“修改策略配置、导出报表、发送短信”等方法。接口按调用者需要组织，不把所有定价相关操作塞进一个宽接口。

接口拆分后，一个实现仍可同时实现多个能力，但调用方只看见自己需要的窄视图。这样能降低无关方法变化带来的重新编译、测试替身和实现负担。

### 5. 依赖倒置原则（DIP）

高层 `CheckoutService` 依赖 `PricingPolicy` 抽象，具体策略也遵守该抽象。构造器注入只是实现依赖方向的一种方式；DIP 的核心是业务策略不被某个低层实现类锁死，不等同于必须使用 Spring 容器。

::: warning 抽象不能只是底层 API 的复制品

抽象应靠近稳定业务语言并由高层需求塑造，而不是把底层类机械提取成同名接口。如果接口只是逐项复制某个数据库或 SDK 的方法，高层依然被底层概念支配。

:::

## 三、策略模式隔离可替换算法

策略模式把同一目标的多种算法放进共同接口：

```java
interface PricingPolicy {
    long calculate(Order order);
}

final class RegularPricingPolicy implements PricingPolicy {
    @Override
    public long calculate(Order order) {
        return order.originalCents();
    }
}
```

::: info 算法需要独立变化时再引入策略

适用条件是算法确实需要独立替换、测试或组合。如果只有一条稳定公式，把它抽成接口和三个类只会增加阅读成本。简单无状态算法在函数式章节也可用函数式接口和 Lambda 表达。

:::

## 四、工厂封装创建决策

当调用方不应知道具体实现类或创建规则需要集中维护时，可以使用工厂：

```java
static PricingPolicy forCustomer(CustomerType customerType) {
    return switch (customerType) {
        case REGULAR -> new RegularPricingPolicy();
        case VIP -> new VipPricingPolicy(15);
    };
}
```

这里是简单工厂：一个方法根据封闭枚举创建策略。若不同产品族需要各自扩展创建过程，才考虑工厂方法或抽象工厂。只有一个普通构造器时直接 `new` 最清楚，不需要为了套模式添加工厂。

工厂负责创建，不应顺便执行支付、持久化订单或读取大量全局状态，否则创建边界会再次变成上帝对象。

## 五、装饰器叠加横切行为

装饰器实现与被包装对象相同的接口，并把核心行为委托给它，在调用前后补充职责：

以下截取本篇 `SolidDesignPatternsDemo.java` 中装饰器的定价方法。`delegate` 由构造器接收并保存，`Order` 与 `PricingPolicy` 的完整声明在本篇运行示例中给出。

::: details 查看审计装饰器的委托逻辑

```java
/**
 * 委托定价并记录订单与结果。
 *
 * @param order 待定价订单，不能为 null
 * @return 委托策略计算的应付金额，单位为分
 */
@Override
public long calculate(Order order) {
    long result = delegate.calculate(order);
    System.out.println("audit order=%s result=%d".formatted(order.number(), result));
    return result;
}
```

:::

::: warning 装饰器必须保留被包装对象的契约

装饰器适合审计、计时、缓存等可以围绕同一契约叠加的行为。它必须保持原契约：不能悄悄改变返回值、吞掉异常或以不同前置条件拒绝合法输入。包装层过多会使调用链难以定位，需要日志上下文和清晰装配点。

:::

## 六、其他模式的使用边界

| 模式 | 真正解决的问题 | 不应使用的情况 |
|------|----------------|----------------|
| 建造者 | 可选参数多、需要分步组装并在结束时统一校验 | 两三个明确必填参数的简单值对象 |
| 模板方法 | 同一继承族共享固定流程，只开放少量步骤 | 多个变化维度需要自由组合 |
| 观察者 | 一个事件需要通知多个独立订阅者 | 核心强一致步骤必须保证顺序与成功 |
| 适配器 | 把已有接口转换为调用方需要的契约 | 双方契约本来就能直接修改并统一 |
| 单例 | 进程内确实只能有一个且生命周期明确 | 为方便访问而隐藏全局可变状态 |

模式名称用于团队沟通结构意图，但必须同时说明失败语义、生命周期和线程安全。只画类图不定义这些边界，不能形成可用设计。

## 七、模式与原则如何协作

本例的依赖关系如下：

```text
CheckoutService ──依赖──▶ PricingPolicy
                              ▲
                  ┌───────────┼────────────────┐
                  │           │                │
           RegularPolicy  VipPolicy  AuditedPolicy ──委托──▶ 任一 Policy
                              ▲
                    PricingPolicies 工厂负责选择
```

::: tip 以行为契约验证模式是否有效

策略模式支持 OCP 和 LSP，窄接口体现 ISP，结算服务依赖抽象体现 DIP，审计装饰器让 SRP 更清楚。但这些原则不是模式自动保证的：一个返回负数的策略仍违反契约，一个读取全局变量的工厂仍会制造耦合。

:::

## 八、运行订单定价示例

完整源码保存为 `SolidDesignPatternsDemo.java`。示例由工厂创建 VIP 策略，用审计装饰器包装，再通过构造器注入结算服务。

```java
PricingPolicy policy = PricingPolicies.forCustomer(CustomerType.VIP);
PricingPolicy auditedPolicy = new AuditedPricingPolicy(policy);
CheckoutService checkout = new CheckoutService(auditedPolicy);

Order order = new Order("ORD-12001", 20_000L);
System.out.println("payable cents=" + checkout.payableCents(order));
```

新建一个空文件夹，将以下代码保存为 `SolidDesignPatternsDemo.java`，编码使用 UTF-8。后续编译和运行命令均在该文件夹执行。

::: details 查看 SolidDesignPatternsDemo 完整代码

```java [SolidDesignPatternsDemo.java]
/**
 * 通过订单定价展示依赖倒置、策略、工厂和装饰器的协作边界。
 */
public final class SolidDesignPatternsDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private SolidDesignPatternsDemo() {
    }

    /**
     * 示例入口。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        PricingPolicy policy = PricingPolicies.forCustomer(CustomerType.VIP);
        PricingPolicy auditedPolicy = new AuditedPricingPolicy(policy);
        CheckoutService checkout = new CheckoutService(auditedPolicy);

        Order order = new Order("ORD-12001", 20_000L);
        System.out.println("payable cents=" + checkout.payableCents(order));
    }

    /**
     * 客户类型用于工厂选择定价策略。
     */
    private enum CustomerType {
        REGULAR,
        VIP
    }

    /**
     * 订单只承载定价需要的稳定输入。
     *
     * @param number 订单号，不能为空
     * @param originalCents 原始金额，必须大于或等于 0，单位为分
     */
    private record Order(String number, long originalCents) {
    }

    /**
     * 定价策略是高层结算服务依赖的抽象。
     */
    private interface PricingPolicy {

        /**
         * 计算订单应付金额。
         *
         * @param order 待定价订单，不能为 null
         * @return 应付金额，单位为分
         */
        long calculate(Order order);
    }

    /**
     * 普通客户不享受折扣。
     */
    private static final class RegularPricingPolicy implements PricingPolicy {

        /**
         * 创建普通客户定价策略。
         */
        private RegularPricingPolicy() {
        }

        /**
         * 返回订单原始金额。
         *
         * @param order 待定价订单，不能为 null
         * @return 原始金额，单位为分
         */
        @Override
        public long calculate(Order order) {
            return order.originalCents();
        }
    }

    /**
     * VIP 策略按固定百分比减免。
     */
    private static final class VipPricingPolicy implements PricingPolicy {
        private final int discountPercent;

        /**
         * 创建 VIP 定价策略。
         *
         * @param discountPercent 减免百分比，取值范围为 0～100
         */
        private VipPricingPolicy(int discountPercent) {
            this.discountPercent = discountPercent;
        }

        /**
         * 计算 VIP 折后金额。
         *
         * @param order 待定价订单，不能为 null
         * @return 折后金额，单位为分
         */
        @Override
        public long calculate(Order order) {
            return Math.multiplyExact(order.originalCents(), 100L - discountPercent) / 100L;
        }
    }

    /**
     * 审计装饰器在不修改原策略的情况下补充可观察行为。
     */
    private static final class AuditedPricingPolicy implements PricingPolicy {
        private final PricingPolicy delegate;

        /**
         * 创建包装指定策略的审计装饰器。
         *
         * @param delegate 被包装的非 null 定价策略
         */
        private AuditedPricingPolicy(PricingPolicy delegate) {
            this.delegate = delegate;
        }

        /**
         * 委托定价并记录订单与结果。
         *
         * @param order 待定价订单，不能为 null
         * @return 委托策略计算的应付金额，单位为分
         */
        @Override
        public long calculate(Order order) {
            long result = delegate.calculate(order);
            System.out.println("audit order=%s result=%d".formatted(order.number(), result));
            return result;
        }
    }

    /**
     * 定价工厂集中封装“客户类型到策略”的创建规则。
     */
    private static final class PricingPolicies {

        /**
         * 工具类不需要实例化。
         */
        private PricingPolicies() {
        }

        /**
         * 为客户类型创建合适的定价策略。
         *
         * @param customerType 客户类型，不能为 null
         * @return 新的定价策略实例
         */
        private static PricingPolicy forCustomer(CustomerType customerType) {
            return switch (customerType) {
                case REGULAR -> new RegularPricingPolicy();
                case VIP -> new VipPricingPolicy(15);
            };
        }
    }

    /**
     * 结算服务只依赖定价抽象，不依赖具体折扣实现。
     */
    private static final class CheckoutService {
        private final PricingPolicy pricingPolicy;

        /**
         * 注入结算使用的定价策略。
         *
         * @param pricingPolicy 非 null 的定价策略
         */
        private CheckoutService(PricingPolicy pricingPolicy) {
            this.pricingPolicy = pricingPolicy;
        }

        /**
         * 计算订单应付金额。
         *
         * @param order 待结算订单，不能为 null
         * @return 应付金额，单位为分
         */
        private long payableCents(Order order) {
            return pricingPolicy.calculate(order);
        }
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out SolidDesignPatternsDemo.java
java -cp out SolidDesignPatternsDemo
```

预期输出：

```text
audit order=ORD-12001 result=17000
payable cents=17000
```

`20000` 分按 15% 减免得到 `17000` 分，审计层观察同一结果但不修改它。示例使用标准输出代替正式日志，只用于证明装饰调用顺序。

## 九、重构决策与停止条件

1. 先用测试或可重复输出锁定当前业务行为；
2. 列出真实变化原因，例如客户折扣与审计策略独立变化；
3. 只为已经出现的变化提取窄抽象；
4. 验证每个实现遵守相同输入、输出和失败契约；
5. 当新增类不再减少修改范围或提高可测试性时停止抽象。

| 过度设计信号 | 说明 |
|--------------|------|
| 一个实现对应一层接口、一层抽象类和一层工厂 | 没有替换点却增加结构跳转 |
| 模式名称出现在类名中但没有变化问题 | 设计由模板驱动而非业务驱动 |
| 为避免修改旧代码复制相似实现 | 误解 OCP，重复逻辑反而增加风险 |
| 所有依赖都放入全局单例 | 构造关系隐藏，测试互相污染 |

进一步核对接口、继承和委托的语言基础可参阅 [JLS 8：Classes](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html) 与 [JLS 9：Interfaces](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html)。
