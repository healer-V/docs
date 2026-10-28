---
title: "注解与元注解"
tags:
  - Java
  - Annotation
excerpt: "解释 Java 注解的元数据角色，对照 Target 与三种保留策略，并通过运行时读取和 javap 输出验证继承、重复注解及注解不会自动执行业务逻辑的边界。"
date: 2026-09-08
---

# 注解与元注解

Java 注解为声明或类型使用位置附加结构化元数据。编译器、字节码工具或运行时代码决定是否读取以及如何解释这些数据；注解实例本身不会调用方法、校验订单或创建代理。

## 一、元注解限定声明的使用范围

注解类型使用 `@interface` 声明，注解元素采用无参数方法的语法。`@Target` 指定注解可出现的位置，`@Retention` 指定信息保留到哪个阶段，`@Documented` 决定 JavaDoc 是否默认展示，`@Inherited` 和 `@Repeatable` 则改变特定查询或书写方式。

| 元注解 | 直接作用 | 不代表的行为 |
|---|---|---|
| `@Target` | 限制声明上下文或类型上下文 | 不检查被标记元素的业务值 |
| `@Retention` | 决定源码、Class 文件与运行时反射的可见范围 | 不决定哪个处理器会消费注解 |
| `@Documented` | 让公开 API 文档包含该注解 | 不改变编译和运行语义 |
| `@Inherited` | 允许类查询沿超类链寻找类级注解 | 不沿接口、字段或方法传播 |
| `@Repeatable` | 允许同一位置多次书写同一种注解 | 不合并多条规则的业务含义 |

常见 `ElementType` 中，`TYPE` 面向类、接口、枚举和注解声明，`METHOD` 面向方法声明，`FIELD` 面向字段声明，`PARAMETER` 面向形参声明，`RECORD_COMPONENT` 面向 Record 组件。`TYPE_USE` 可以标记类型出现的位置，`TYPE_PARAMETER` 则标记类型参数声明。没有声明 `@Target` 的注解可用于所有声明上下文，但不能因此用于类型上下文。[JLS 9.6.4.1 Target](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.6.4.1)

`@Target` 是编译约束。把只允许用于方法的注解放到字段上，编译器会拒绝，而不是等到反射读取时忽略错误位置。

## 二、三种保留策略对应不同观察入口

| RetentionPolicy | 源码中存在 | Class 文件中存在 | 运行时反射可读 | 典型消费方 |
|---|---:|---:|---:|---|
| `SOURCE` | 是 | 否 | 否 | 编译器检查、源码工具 |
| `CLASS` | 是 | 是 | 否 | 字节码扫描、构建工具 |
| `RUNTIME` | 是 | 是 | 是 | 运行时框架和应用代码 |

::: tip 按消费阶段选择注解保留策略

没有显式 `@Retention` 时，默认策略是 `CLASS`。运行时需要通过 `AnnotatedElement` 读取的业务注解必须显式选择 `RUNTIME`；只需要源码检查的注解不应为了“以后也许有用”扩大到运行时。局部变量声明上的注解和类型使用注解还存在不同的 Class 文件保留规则，应依据实际目标位置判断，不能只看策略枚举名称。[JLS 9.6.4.2 Retention](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.6.4.2)

:::

反射看不到 `CLASS` 不等于它没有进入编译产物。`javap -v` 会把运行时可见注解列在 `RuntimeVisibleAnnotations`，把保留在 Class 文件但运行时不可见的声明注解列在 `RuntimeInvisibleAnnotations`。`SOURCE` 不应出现在目标 Class 文件中。

## 三、继承与重复注解改变的是查询语义

### 1. 继承查询只沿规定的超类链

`@Inherited` 只影响类级注解的反射查询。当子类没有直接声明该注解时，`Class.getAnnotation` 和相关查询可以沿超类链查找；`getDeclaredAnnotation` 仍只看当前类。实现一个带注解接口不会让实现类自动获得该注解，方法覆盖也不会自动继承父方法注解。[Inherited API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/annotation/Inherited.html)

因此，注解“写在谁身上”和“从谁的查询入口可取得”是两个问题。诊断子类为何拿到一项策略时，应先检查子类直接声明，再检查该注解是否允许继承以及超类链上的声明；不能直接在实现接口上寻找同名注解，就认定 Java 查询应自动返回它。

### 2. 重复注解通过按类型查询展开

重复注解需要一个容器注解。容器的 `value()` 必须返回重复注解数组，目标和保留策略还要满足语言规范的兼容关系。读取时使用 `getAnnotationsByType` 获得展开后的结果，避免让业务代码依赖编译器选择的容器存储形式。[JLS 9.6.3 Repeatable](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.6.3)

当一项规则从只声明一次变成声明多次时，消费方应仍取得一组规则逐项解释。若只使用返回单个注解的查询入口，就不能把它当作完整的重复声明读取方式；展开元数据之后的执行顺序和冲突处理仍由消费方决定。
::: warning 框架合并规则不等于 Java 反射规则

框架可以在 Java 默认规则之外实现接口搜索、组合注解或元注解合并。这些属于具体框架的消费协议，不能反推为 Java 反射本身的行为。

:::

## 四、完整程序对照四种查询结果

下面的程序把三种保留策略放在同一个订单策略类上，同时验证超类继承、接口边界和重复方法注解。保存为 `src/order/AnnotationsMetaDemo.java`，使用 JDK 21，无第三方依赖。

在任意位置新建一个空目录作为本篇示例目录，按文中标注的相对路径创建文件并保存为 UTF-8。后续编译和运行命令都在该目录执行；文件夹不存在时先创建相应父目录。

::: details 查看AnnotationsMetaDemo的完整代码

```java
// src/order/AnnotationsMetaDemo.java
package order;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Repeatable;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.reflect.Method;
import java.util.Arrays;

/** 对照注解目标、保留策略、继承查询与重复注解的默认语义。 */
public final class AnnotationsMetaDemo {
    /** 禁止实例化命令行示例。 */
    private AnnotationsMetaDemo() {}

    /** 只保留在源码中的类级规则。 */
    @Target(ElementType.TYPE)
    @Retention(RetentionPolicy.SOURCE)
    private @interface SourceRule {
        /**
         * 返回仅供源码工具使用的规则编码。
         *
         * @return 供源码工具识别的稳定规则编码
         */
        String value();
    }

    /** 写入 Class 文件但不提供给运行时反射的类级规则。 */
    @Target(ElementType.TYPE)
    @Retention(RetentionPolicy.CLASS)
    private @interface ClassRule {
        /**
         * 返回写入 Class 文件的规则编码。
         *
         * @return 供字节码工具识别的稳定规则编码
         */
        String value();
    }

    /** 可由运行时反射读取，并沿超类链查询的类级规则。 */
    @Documented
    @Inherited
    @Target(ElementType.TYPE)
    @Retention(RetentionPolicy.RUNTIME)
    private @interface RuntimeRule {
        /**
         * 返回运行时消费者读取的规则编码。
         *
         * @return 供运行时消费者识别的稳定规则编码
         */
        String value();
    }

    /** 保存同一方法上的多条校验标签。 */
    @Documented
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    private @interface OrderChecks {
        /**
         * 返回编译器汇总的重复校验标签。
         *
         * @return 编译器写入容器的校验标签数组
         */
        OrderCheck[] value();
    }

    /** 允许同一方法声明多次的订单校验标签。 */
    @Documented
    @Repeatable(OrderChecks.class)
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    private @interface OrderCheck {
        /**
         * 返回单条订单校验标签。
         *
         * @return 稳定校验标签，不接受订单输入原文
         */
        String value();
    }

    /** 声明三种保留策略并提供重复方法注解。 */
    @SourceRule("SOURCE_ONLY")
    @ClassRule("CLASS_FILE")
    @RuntimeRule("ORDER_POLICY")
    private static class OrderPolicy {
        /** 创建无状态基础策略。 */
        OrderPolicy() {}

        /**
         * 执行普通订单校验；注解不会自行调用此方法。
         *
         * @param orderNumber 非空订单编号
         * @return 编号以 ORD- 开头时返回 true
         */
        @OrderCheck("PREFIX")
        @OrderCheck("NON_EMPTY")
        boolean validate(String orderNumber) {
            return orderNumber != null && orderNumber.startsWith("ORD-");
        }
    }

    /** 沿超类继承 RuntimeRule，但不会获得声明注解。 */
    private static final class PriorityOrderPolicy extends OrderPolicy {
        /** 创建用于继承查询的优先策略。 */
        PriorityOrderPolicy() {}
    }

    /** 用于证明 Inherited 不沿接口实现关系传播。 */
    @RuntimeRule("ORDER_CONTRACT")
    private interface OrderContract {}

    /** 实现带注解接口，但类查询不会自动取得接口注解。 */
    private static final class OrderContractImpl implements OrderContract {
        /** 创建用于接口继承边界检查的实现。 */
        OrderContractImpl() {}
    }

    /**
     * 输出四组可核对结果；无返回值，也不会触发外部处理器。
     *
     * @param args 启动参数，本示例不使用
     * @throws ReflectiveOperationException 当固定演示方法不存在时抛出
     */
    public static void main(String[] args) throws ReflectiveOperationException {
        Class<OrderPolicy> policyType = OrderPolicy.class;
        System.out.println("source runtime-visible=" + policyType.isAnnotationPresent(SourceRule.class));
        System.out.println("class runtime-visible=" + policyType.isAnnotationPresent(ClassRule.class));
        System.out.println("runtime value=" + policyType.getAnnotation(RuntimeRule.class).value());

        Class<PriorityOrderPolicy> childType = PriorityOrderPolicy.class;
        System.out.println("inherited value=" + childType.getAnnotation(RuntimeRule.class).value());
        System.out.println("inherited declared=" + (childType.getDeclaredAnnotation(RuntimeRule.class) != null));
        System.out.println("interface inherited="
                + OrderContractImpl.class.isAnnotationPresent(RuntimeRule.class));

        Method method = policyType.getDeclaredMethod("validate", String.class);
        String[] checks = Arrays.stream(method.getAnnotationsByType(OrderCheck.class))
                .map(OrderCheck::value)
                .toArray(String[]::new);
        System.out.println("repeatable checks=" + Arrays.toString(checks));

        boolean result = new OrderPolicy().validate("ORD-1001");
        System.out.println("ordinary method result=" + result + ", automatic consumer=false");
    }
}
```

:::

## 五、编译、运行与字节码验证

::: info 字节码检查命令需要保留单引号

在本篇示例目录执行以下 PowerShell 命令。第一条同时启用编译告警、JavaDoc 检查和 `-Werror`；`javap` 的类型名包含 `$`，因此使用单引号避免 PowerShell 变量展开。

:::

```powershell
javac -encoding UTF-8 -Xlint:all -Xdoclint:all,-missing -Werror -d out src/order/AnnotationsMetaDemo.java
java -ea -cp out order.AnnotationsMetaDemo
javap -v -p -classpath out 'order.AnnotationsMetaDemo$OrderPolicy'
```

Corretto 21.0.11 的实际运行输出如下：

```text
source runtime-visible=false
class runtime-visible=false
runtime value=ORDER_POLICY
inherited value=ORDER_POLICY
inherited declared=false
interface inherited=false
repeatable checks=[PREFIX, NON_EMPTY]
ordinary method result=true, automatic consumer=false
```

同一次编译后的 `javap -v` 关键片段如下。输出中没有 `SourceRule`；`ClassRule` 和 `RuntimeRule` 分别位于不可见、可见属性中。

```text
RuntimeVisibleAnnotations:
  order.AnnotationsMetaDemo$RuntimeRule(
    value="ORDER_POLICY"
  )
RuntimeInvisibleAnnotations:
  order.AnnotationsMetaDemo$ClassRule(
    value="CLASS_FILE"
  )
```

运行结果还证明了三个不同判断：继承查询能取得超类注解，声明查询不能；接口注解不会传播到实现类；重复注解按书写顺序展开。最后一行是普通方法显式调用的结果，运行期间没有任何注解处理器。

## 六、错误目标与设计边界

下面是独立的编译错误文件 `InvalidAnnotationTarget.java`，不能和正常示例一起作为成功构建输入：

::: details 查看MethodOnlyRule的完整代码

```java
// InvalidAnnotationTarget.java
import java.lang.annotation.ElementType;
import java.lang.annotation.Target;

/** 只允许标记方法的故障夹具注解。 */
@Target(ElementType.METHOD)
@interface MethodOnlyRule {}

/** 故意把方法注解放到字段上，验证 Target 编译约束。 */
class InvalidAnnotationTarget {
    @MethodOnlyRule
    private String orderNumber;
}
```

:::

执行以下命令已验证退出码为 1，并产生 1 处错误：

```powershell
javac '-J-Duser.language=en' -encoding UTF-8 -d out InvalidAnnotationTarget.java
```

```text
InvalidAnnotationTarget.java:10: error: annotation interface not applicable to this kind of declaration
1 error
```

::: tip 注解设计从消费方契约倒推

注解设计应从消费阶段倒推最小目标和最短生命周期。需要运行时读取时采用 `RUNTIME`，只做字节码分析时采用 `CLASS`；是否继承、如何合并以及失败时是否阻断订单，都必须由消费方契约明确。自定义业务属性及默认值的设计由[自定义注解](./02-custom-annotations.md)负责。

:::
