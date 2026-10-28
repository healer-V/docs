---
title: "多态与动态绑定"
tags:
  - Java 21
  - 多态
  - 动态绑定
excerpt: "区分声明类型与运行时类型，解释重写实例方法的动态分派过程，并说明向上转型、instanceof 模式匹配和错误向下转型。"
date: 2026-09-03
---

# 多态与动态绑定

多态允许调用方只依赖父类或接口契约，而由对象的运行时类型决定实际执行的重写方法。编译器先按引用的声明类型判断“能不能调用”，运行时再按对象的实际类型决定“执行哪个实现”。

## 一、声明类型与运行时类型

```java
PaymentMethod method = new CardPayment("尾号 2048");
```

| 角色 | 本例类型 | 决定的事情 |
|------|----------|------------|
| 声明类型 | `PaymentMethod` | 编译期可见的方法集合和赋值约束 |
| 运行时类型 | `CardPayment` | 重写实例方法最终执行的实现 |
| 引用值 | 指向对象的值 | 当前变量实际关联哪个对象，也可以为 `null` |

::: info 声明类型决定可调用的接口

即使 `CardPayment` 还声明了 `maskedNumber()`，通过 `PaymentMethod` 变量也不能直接调用，因为接口契约没有该方法。编译器不会因为右侧暂时写着 `new CardPayment(...)` 就放宽变量后续的类型边界。

:::

## 二、向上转型建立统一入口

子类型引用赋给父类型或接口变量叫向上转型，通常是安全的隐式转换：

```java
PaymentMethod card = new CardPayment("尾号 2048");
PaymentMethod balance = new BalancePayment(8_000L);

checkout(card, 3_500L);
checkout(balance, 2_000L);
```

`checkout` 不需要用 `if` 判断渠道，也不需要依赖两个实现类。新增合法支付实现时，调用入口可以保持不变：

```java
private static void checkout(PaymentMethod method, long amountCents) {
    System.out.println(method.pay(amountCents));
}
```

这种“调用方依赖稳定契约，实现类负责具体行为”的结构，是多态的主要工程价值。

## 三、动态方法分派

### 1. 编译阶段检查方法是否存在

编译器根据 `PaymentMethod` 查找 `pay(long)`，检查访问权限、参数转换和返回类型。如果接口没有这个方法，源码直接编译失败。

编译器还会把选定方法的返回类型写入后续表达式约束。即使所有当前实现都返回更具体类型，调用方仍只能依赖接口声明的返回契约，除非接口本身使用协变设计。

### 2. 运行阶段选择重写实现

调用 `method.pay(amountCents)` 时，JVM 根据 `method` 当前指向对象的实际类型选择最具体的重写实现：

```text
PaymentMethod 引用
├── 指向 CardPayment    → CardPayment.pay
└── 指向 BalancePayment → BalancePayment.pay
```

变量重新指向另一个实现后，同一调用表达式会执行不同实现。该机制针对重写的实例方法，不是所有同名成员都会动态选择。

## 四、不参与动态绑定的成员

| 成员形式 | 绑定依据 | 说明 |
|----------|----------|------|
| 重写实例方法 | 运行时对象类型 | 真正的动态多态 |
| 重载方法 | 编译期实参和声明类型 | 先确定具体签名，不按运行时参数重新选择 |
| 实例字段 | 引用的声明类型 | 字段可以被隐藏，但不会重写 |
| `static` 方法 | 写在调用处的类型 | 属于类型，被隐藏而非重写 |
| `private` 方法 | 声明它的类 | 子类看不到，不能重写 |
| 构造器 | `new` 指定的类型 | 构造器不继承也不重写 |

因此不要在父子类中声明同名公共字段，也不要用“子类静态方法覆盖父类静态方法”的说法。需要多态行为时，把差异表达为可重写实例方法或接口方法。

## 五、向下转型与类型检查

### 1. 显式转换只是一项运行时断言

```java
CardPayment card = (CardPayment) method;
```

::: warning 强制转换不会改变对象类型

转换不会改变对象，也不会创建新对象；它只是告诉编译器“我认为这个引用实际指向 `CardPayment`”。判断错误时，运行阶段抛出 `ClassCastException`。

:::

### 2. 类型模式与变量绑定 {#_2-instanceof-模式匹配同时检查并绑定}

```java
if (method instanceof CardPayment cardPayment) {
    System.out.println(cardPayment.maskedNumber());
}
```

Java 21 中这项 `instanceof` 模式匹配是正式特性。只有条件匹配成功的控制流范围内，模式变量 `cardPayment` 才可用；不需要再重复强制转换。

::: tip 频繁向下转型时复查公共抽象

如果业务主流程频繁向下转型再分支，通常意味着公共接口遗漏行为，或者不同类型根本不该由同一抽象处理。类型检查适合边界适配，不应替代多态设计。

:::

## 六、null 与动态调用

声明类型允许引用为 `null` 并不意味着可以调用实例方法。`method.pay(...)` 会先对接收者解引用；若 `method == null`，在选择具体实现之前就抛出 `NullPointerException`。

对必需协作者应在构造或方法边界拒绝 `null`，而不是在每个多态调用点静默跳过。空值不是一种支付方式；若业务确实需要“无操作”策略，应创建语义明确的实现并谨慎评估是否掩盖配置错误。

## 七、运行支付多态示例

完整源码保存为 `PolymorphismDemo.java`。示例通过统一接口执行银行卡和余额支付，再分别验证安全模式匹配与错误强制转换。

```java
PaymentMethod card = new CardPayment("尾号 2048");
PaymentMethod balance = new BalancePayment(8_000L);

checkout(card, 3_500L);
checkout(balance, 2_000L);

if (card instanceof CardPayment cardPayment) {
    System.out.println("masked card=" + cardPayment.maskedNumber());
}
```

新建一个空文件夹，将以下代码保存为 `PolymorphismDemo.java`，编码使用 UTF-8。后续编译和运行命令均在该文件夹执行。

::: details 查看 PolymorphismDemo 完整代码

```java [PolymorphismDemo.java]
/**
 * 演示声明类型、运行时类型、动态绑定和向下转型边界。
 */
public final class PolymorphismDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private PolymorphismDemo() {
    }

    /**
     * 示例入口。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        PaymentMethod card = new CardPayment("尾号 2048");
        PaymentMethod balance = new BalancePayment(8_000L);
        if (args.length > 0 && "invalid-cast".equals(args[0])) {
            CardPayment invalid = (CardPayment) balance;
            System.out.println(invalid.maskedNumber());
            return;
        }

        checkout(card, 3_500L);
        checkout(balance, 2_000L);

        if (card instanceof CardPayment cardPayment) {
            System.out.println("masked card=" + cardPayment.maskedNumber());
        }

        try {
            CardPayment invalid = (CardPayment) balance;
            System.out.println(invalid.maskedNumber());
        } catch (ClassCastException exception) {
            System.out.println("invalid cast=" + exception.getClass().getSimpleName());
        }
    }

    /**
     * 通过统一支付契约调用不同运行时实现。
     *
     * @param method 支付方式，运行时可以是任意实现类
     * @param amountCents 支付金额，必须大于 0，单位为分
     */
    private static void checkout(PaymentMethod method, long amountCents) {
        System.out.println(method.pay(amountCents));
    }

    /**
     * 支付方式声明调用方依赖的行为契约。
     */
    private interface PaymentMethod {

        /**
         * 执行支付并返回结果说明。
         *
         * @param amountCents 支付金额，必须大于 0，单位为分
         * @return 支付渠道和结果说明
         */
        String pay(long amountCents);
    }

    /**
     * 银行卡支付实现。
     */
    private static final class CardPayment implements PaymentMethod {
        private final String maskedNumber;

        /**
         * 创建银行卡支付方式。
         *
         * @param maskedNumber 已脱敏的银行卡描述，不能为空
         */
        private CardPayment(String maskedNumber) {
            this.maskedNumber = maskedNumber;
        }

        /**
         * 模拟银行卡支付。
         *
         * @param amountCents 支付金额，必须大于 0，单位为分
         * @return 银行卡支付结果
         */
        @Override
        public String pay(long amountCents) {
            return "card paid cents=" + amountCents;
        }

        /**
         * 返回脱敏卡号。
         *
         * @return 脱敏银行卡描述
         */
        private String maskedNumber() {
            return maskedNumber;
        }
    }

    /**
     * 余额支付实现。
     */
    private static final class BalancePayment implements PaymentMethod {
        private long balanceCents;

        /**
         * 创建余额支付方式。
         *
         * @param balanceCents 初始余额，必须大于或等于 0，单位为分
         */
        private BalancePayment(long balanceCents) {
            this.balanceCents = balanceCents;
        }

        /**
         * 在余额充足时完成扣款。
         *
         * @param amountCents 支付金额，必须大于 0 且不能超过余额
         * @return 余额支付结果
         */
        @Override
        public String pay(long amountCents) {
            if (amountCents <= 0 || amountCents > balanceCents) {
                throw new IllegalArgumentException("支付金额无效或余额不足");
            }
            balanceCents -= amountCents;
            return "balance paid cents=%d, remaining=%d".formatted(amountCents, balanceCents);
        }
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out PolymorphismDemo.java
java -cp out PolymorphismDemo
```

预期输出：

```text
card paid cents=3500
balance paid cents=2000, remaining=6000
masked card=尾号 2048
invalid cast=ClassCastException
```

前两行来自两个不同的运行时实现；第三行只在模式匹配成功后访问子类能力；最后一行由故意把余额对象转换为银行卡类型触发，并在示例边界内捕获以便观察。

需要观察未捕获异常和非零退出状态时，单独启动失败路径：

```powershell
java -cp out PolymorphismDemo invalid-cast
```

::: warning 从类型事实修复转换失败

调用栈会显示 `ClassCastException`，并同时列出 `BalancePayment` 与 `CardPayment`。修复不是捕获后继续当银行卡使用，而是删除没有事实依据的转换，或先通过模式匹配收窄类型。

:::

## 八、常见误判

| 误判 | 实际规则 | 修正方式 |
|------|----------|----------|
| 变量声明为父类型后对象变成父类 | 对象运行时类型没有改变 | 区分引用可见契约与对象实际类型 |
| 重载会按运行时参数选择 | 重载在编译期解析 | 需要动态行为时使用重写 |
| 强制转换能把对象变成另一类型 | 转换只检查实际类型是否兼容 | 先证明类型关系或重构契约 |
| 字段与静态方法也会动态分派 | 它们按声明类型或限定类型绑定 | 避免隐藏，改用实例行为 |

规范依据可参阅 [JLS 15.12：Method Invocation Expressions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12)、[JLS 5.5：Casting Contexts](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.5) 与 [JLS 15.20.2：The instanceof Operator](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.20.2)。
