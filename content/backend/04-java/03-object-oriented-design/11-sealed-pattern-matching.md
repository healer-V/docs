---
title: "密封类型与模式匹配"
tags:
  - Java 21
  - sealed
  - 模式匹配
excerpt: "解释 sealed 类型的封闭继承集合、三种直接子类型声明和 Java 21 switch 模式匹配，并验证支付结果的穷尽处理。"
date: 2026-09-03
---


# 密封类型与模式匹配

密封类型使用 `sealed` 明确限制允许的直接子类型。编译器知道完整层次后，Java 21 的 `switch` 模式匹配可以对类型分支执行穷尽性检查，适合表达结果、命令或语法节点等封闭代数模型。


## 一、密封层次的声明与扩展边界

密封父类型限制直接子类型，直接子类型再决定自己的分支是否继续开放。两级声明共同决定调用方到底能知道哪些类型，不能只看父接口上的 `sealed`。


### 1. sealed 声明封闭继承层次 {#一、sealed-声明封闭继承层次}

以下是本篇 `SealedPatternMatchingDemo.java` 的类型声明片段，省略外层入口类与嵌套类型的 `private` 修饰符；完整程序在后面给出。`permits` 明确列出三种允许结果：

::: details 查看支付结果类型声明

```java
sealed interface PaymentResult permits Success, Rejected, Pending {
}

record Success(String paymentId, long amountCents) implements PaymentResult {
}

record Rejected(String reason) implements PaymentResult {
}

record Pending(int retryAfterSeconds) implements PaymentResult {
}
```

:::

`permits` 列出允许的直接实现。若全部直接子类型与密封父类型位于同一源文件，编译器可以推断列表；显式写出有助于读者快速识别边界。

在命名模块中，允许的直接子类型必须位于同一模块；在未命名模块中必须位于同一包。普通第三方类不能绕过 `permits` 实现该接口。


### 2. 直接子类型必须选择开放程度 {#二、直接子类型必须选择开放程度}

密封类型的每个直接子类都必须显式选择一种状态：

| 修饰符 | 后续继承规则 | 适用场景 |
|--------|--------------|----------|
| `final` | 到此终止 | 具体结果类型，Record 隐式如此 |
| `sealed` | 继续限制下一层子类型 | 分层封闭模型 |
| `non-sealed` | 从该分支重新开放继承 | 有意保留第三方扩展点 |

::: info non-sealed 会重新开放子分支

一旦某分支为 `non-sealed`，编译器不再知道该分支下所有具体类型。父层 `switch` 仍可匹配这个已知直接分支，但不能假设其内部没有其他子类。

:::


## 二、模式匹配与分支完整性

类型模式先判断结果属于哪种形态，穷尽性检查确保每种允许形态有处理路径，守卫再细分同一种形态中的业务条件。这三项分别回答匹配、覆盖和筛选问题。


### 1. switch 类型模式按具体形态分支 {#三、switch-类型模式按具体形态分支}

Java 21 正式支持 `switch` 模式匹配和 Record 模式。以下摘录完整程序中 `describe(PaymentResult result)` 的方法体，`result` 必须非 null；三种结果类型由本篇声明：

```java
return switch (result) {
    case Success(String paymentId, long amountCents) ->
            "success id=%s cents=%d".formatted(paymentId, amountCents);
    case Rejected(String reason) -> "rejected reason=" + reason;
    case Pending(int retryAfterSeconds) -> "pending retry=" + retryAfterSeconds + "s";
};
```

::: tip 使用模式变量表达已匹配的类型

每个分支只在模式匹配时执行，模式变量的作用域限制在对应分支。这里不需要强制转换，也不需要可能吞掉新类型的 `default`。

:::


### 2. 穷尽性把遗漏变成编译错误 {#四、穷尽性把遗漏变成编译错误}

`switch` 表达式必须覆盖所有可能结果。对于密封层次，编译器根据允许子类型判断覆盖范围。可以在本篇完整程序的副本中验证新增结果带来的影响：

1. 在 `PaymentResult` 的 `permits Success, Rejected, Pending` 末尾增加 `TimedOut`。
2. 在同一个外层类中增加下面的嵌套 Record，保持两个 `switch` 方法不变。
3. 用本篇编译命令重新编译，观察 `switch` 缺少分支的错误。

```java
/** 支付超时结果；elapsedSeconds 是已等待的非负秒数。 */
private record TimedOut(int elapsedSeconds) implements PaymentResult {
}
```

编译器应报告 `the switch expression does not cover all possible input values`。只新增 Record 而不更新 `permits`，首先触发的是“子类型未获允许”，不能用它证明穷尽性检查。恢复时删除新增类型并还原 `permits`；真实业务变更则需要在各处理方法中增加有意义的分支。若直接加入 `default`，新增结果可能悄悄走入兜底逻辑。

::: warning 穷尽性检查不替代 null 策略

穷尽性不表示可以忽略 `null`。传统 `switch` 对 `null` 通常抛出 `NullPointerException`；确实允许空值时可显式写 `case null`，更推荐在输入边界建立非空契约。

:::


### 3. 模式守卫处理同类型细分 {#五、模式守卫处理同类型细分}

同一类型内部还需要条件时，可使用 `when` 守卫。下面是完整程序中 `describeWithGuard` 的方法体，金额单位为分，100000 分及以上归为大额；所有模式变量均显式命名，可直接用 Java 21 正式语法编译：

```java
return switch (result) {
    case Success(String ignoredId, long amount) when amount >= 100_000L -> "large success";
    case Success(String ignoredId, long amount) -> "success";
    case Rejected(String reason) -> "rejected: " + reason;
    case Pending(int seconds) -> "pending: " + seconds;
};
```

::: tip 先匹配带条件分支，再覆盖其余同类结果
`when` 的条件只对已经匹配到的 `Success` 判断。100000 分命中第一条分支，99999 分继续匹配第二条；`Rejected` 和 `Pending` 仍由各自的分支处理。
:::

守卫为 `false` 时，当前标签没有匹配成功，选择过程继续寻找后面的适用标签。因此“大额支付成功”分支之后仍需处理其他成功结果，不能用一个带业务条件的分支代表全部 `Success`。把不受条件限制的宽匹配放在前面，会支配后面的细分并产生编译错误；应先处理有优先级的具体条件，再处理其余同类型结果。规则见 [JLS 14.11.1](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.11.1)。


## 三、sealed 与开放接口的选择 {#六、sealed-与开放接口的选择}

| 问题 | 适合 sealed | 适合普通接口 |
|------|-------------|--------------|
| 实现集合 | 由领域模型控制且有限 | 允许插件或第三方持续扩展 |
| 调用方操作 | 经常需要穷尽处理各种结果 | 主要通过统一多态行为调用 |
| 兼容策略 | 新子类型应触发编译期修改 | 新实现不应要求修改调用方 |
| 示例 | 支付结果、表达式节点 | 支付渠道、存储适配器 |

支付渠道适合开放接口，因为企业可能新增实现；一次支付的结果形态适合密封类型，因为调用方必须明确处理成功、拒绝和处理中。


## 四、运行支付结果示例 {#七、运行支付结果示例}

完整源码保存为 `SealedPatternMatchingDemo.java`，使用的 Record 模式与 `switch` 类型模式均为 Java 21 正式特性，不需要 `--enable-preview`。

新建一个空文件夹，将以下代码保存为 `SealedPatternMatchingDemo.java`，编码使用 UTF-8。后续编译和运行命令均在该文件夹执行。

::: details 查看 SealedPatternMatchingDemo 完整代码

```java [SealedPatternMatchingDemo.java]
/**
 * 演示 sealed 层次和 Java 21 switch 模式匹配的穷尽处理。
 */
public final class SealedPatternMatchingDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private SealedPatternMatchingDemo() {
    }

    /**
     * 示例入口。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        PaymentResult[] results = {
                new Success("PAY-1101", 8_800L),
                new Rejected("余额不足"),
                new Pending(30)
        };

        for (PaymentResult result : results) {
            System.out.println(describe(result));
        }
        System.out.println("guard large=" + describeWithGuard(new Success("PAY-1102", 100_000L)));
        System.out.println("guard regular=" + describeWithGuard(new Success("PAY-1103", 99_999L)));
        System.out.println("guard rejected=" + describeWithGuard(new Rejected("余额不足")));
        System.out.println("guard pending=" + describeWithGuard(new Pending(30)));
    }

    /**
     * 对封闭结果层次进行穷尽匹配，无需 default 分支。
     *
     * @param result 非 null 的支付结果
     * @return 与具体结果类型对应的业务说明
     */
    private static String describe(PaymentResult result) {
        return switch (result) {
            case Success(String paymentId, long amountCents) ->
                    "success id=%s cents=%d".formatted(paymentId, amountCents);
            case Rejected(String reason) -> "rejected reason=" + reason;
            case Pending(int retryAfterSeconds) -> "pending retry=" + retryAfterSeconds + "s";
        };
    }

    /**
     * 在成功结果中区分大额支付，同时覆盖全部允许类型。
     *
     * @param result 非 null 的支付结果，金额单位为分
     * @return 大额、普通成功、拒绝或等待说明
     */
    private static String describeWithGuard(PaymentResult result) {
        return switch (result) {
            case Success(String ignoredId, long amount) when amount >= 100_000L -> "large success";
            case Success(String ignoredId, long amount) -> "success";
            case Rejected(String reason) -> "rejected: " + reason;
            case Pending(int seconds) -> "pending: " + seconds;
        };
    }

    /**
     * 支付结果只允许由本文件声明的三种直接实现构成。
     */
    private sealed interface PaymentResult permits Success, Rejected, Pending {
    }

    /**
     * 支付成功结果。
     *
     * @param paymentId 支付流水号
     * @param amountCents 已支付金额，单位为分
     */
    private record Success(String paymentId, long amountCents) implements PaymentResult {
    }

    /**
     * 支付明确失败结果。
     *
     * @param reason 可安全返回给调用方的拒绝原因
     */
    private record Rejected(String reason) implements PaymentResult {
    }

    /**
     * 支付处理中结果。
     *
     * @param retryAfterSeconds 建议再次查询前等待的秒数
     */
    private record Pending(int retryAfterSeconds) implements PaymentResult {
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac --release 21 -encoding UTF-8 -d out SealedPatternMatchingDemo.java
java -cp out SealedPatternMatchingDemo
```

预期输出：

```text
success id=PAY-1101 cents=8800
rejected reason=余额不足
pending retry=30s
guard large=large success
guard regular=success
guard rejected=rejected: 余额不足
guard pending=pending: 30
```

::: info 语言类型封闭不等于协议兼容

前三行分别命中三个允许子类型，后四行覆盖守卫边界及其他结果。两个方法都没有 `default`，也不需要启用预览特性。示例证明了语言层的封闭、穷尽与条件匹配，不包含跨服务 JSON 多态反序列化；外部协议仍要设计稳定类型标识与未知版本处理。

:::


## 五、Java 8 维护线与失败边界 {#八、java-8-维护线与失败边界}

Java 8 不支持 sealed、Record 或 `switch` 类型模式。维护线可使用普通接口配合访问控制、枚举标签或 Visitor 表达有限分支，但编译器无法阻止同包外部实现，也不能获得同等级的穷尽检查。

| 失败 | 编译器保护的边界 | 修正 |
|------|------------------|------|
| 未获允许的类实现 sealed 接口 | 封闭实现集合 | 加入 `permits` 并选择子类修饰符，或改为开放接口 |
| `switch` 遗漏一个允许子类型 | 穷尽结果处理 | 增加有业务含义的分支 |
| Java 21 示例使用预览语法 | 生产基线不可直接编译 | 对照 JDK 21 正式语法，不启用无关预览特性 |
| 为了穷尽给开放插件接口加 sealed | 阻断真实扩展需求 | 保持普通接口，通过多态行为调用 |

规范依据可参阅 [JLS 8.1.6：Permitted Direct Subclasses](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.6)、[JLS 14.11：switch Statements](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.11) 与 [JLS 14.30：Patterns](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.30)。
