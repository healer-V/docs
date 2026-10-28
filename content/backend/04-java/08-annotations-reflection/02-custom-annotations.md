---
title: "自定义注解"
tags:
  - Java
  - Annotation
  - API 设计
excerpt: "设计一个边界清楚的订单校验注解，说明属性合法类型、默认值和常量约束，并通过严格编译、运行与 javap 元数据验证区分声明契约和消费方行为。"
date: 2026-09-08
---

# 自定义注解

自定义注解适合声明一组能够在编译产物中稳定表达的元数据。好的业务注解需要明确标记位置、保留阶段、属性含义、默认行为和消费方；它不是把任意配置对象塞进源码的替代方案。

## 一、注解属性只支持有限类型

注解元素不能带参数或类型参数，返回类型只能是以下类别之一：基本类型、`String`、`Class`、枚举、注解，以及这些类型的一维数组。声明 `List<String>`、业务对象或二维数组作为元素类型会产生编译错误，元素值也不能是 `null`。[JLS 9.6.1 注解元素](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.6.1)

| 属性形状 | 订单规则用途 | 设计要求 |
|---|---|---|
| `String code()` | 稳定规则编码 | 不保存请求参数、客户数据或可变文案 |
| `int maxQuantity()` | 数值阈值 | 文档明确单位、闭区间与合法范围 |
| `ViolationAction action()` | 有限处理策略 | 使用枚举排除拼写错误和未知字符串 |
| `Class<? extends QuantityPolicy>` | 策略实现类型 | 用上界限制实现契约，消费方仍要负责实例化失败 |
| `String[] tags()` | 零到多个稳定标签 | 返回数组，不使用集合；调用方不依赖数组可变性 |
| `ValidationWindow window()` | 结构化子配置 | 嵌套注解只保存值，不会自动校验时区和范围 |

::: info 注解值必须能写入编译产物

使用处的属性值必须能写入 Class 文件常量池和注解属性结构。字符串字面量、枚举常量、类字面量、其他注解和编译期常量可以使用；方法调用、运行时配置读取和普通对象构造不能直接作为注解值。

:::

## 二、默认值是调用方可观察的 API 契约

没有默认值的元素在每个使用位置都必须显式提供。本例要求 `code` 和 `maxQuantity`，因为遗漏二者会让规则含义不完整；`minQuantity` 默认 1，`action` 默认 `REJECT`，它们表达保守且可预测的行为。

::: warning 修改默认值可能影响已编译的调用方

注解默认值不复制进每个使用位置，而是和注解类型声明关联。修改已经发布的默认值，可能改变旧 Class 文件在新运行环境中的读取结果，因此它属于兼容性决策。读取方也不能靠“当前默认值正好是 1”猜测作者意图，应按注解版本和元素文档解释。[JLS 9.6.2 默认值](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.6.2)

:::

数值属性的 Java 类型约束不能表达 `minQuantity <= maxQuantity` 或小时范围。消费方在启动扫描、注册规则或执行前必须验证组合；发现非法声明时应报告具体类、方法和属性值，而不是在某次订单到来后静默忽略。

## 三、声明者与消费方各自负责什么

| 角色 | 责任 | 失败处理 |
|---|---|---|
| 注解声明者 | 定义目标、生命周期、属性类型、默认值和公开语义 | 通过编译和 API 评审阻止含糊契约 |
| 注解使用者 | 在具体方法上提供稳定值 | 修正缺失属性、错误目标或非法组合 |
| 元数据消费方 | 查找注解、验证属性、选择执行顺序并调用实际逻辑 | 明确跳过、阻断、降级和异常传播规则 |
| 业务方法 | 执行订单校验、提交或预览 | 不假设注解会自动保护直接调用 |

::: info 注解声明与消费执行分别验证

本篇只验证注解声明和使用形式。运行时读取及反射调用由[Class 与反射 API](./03-class-reflection.md)形成闭环。编译期 Annotation Processing 可以生成文件或错误，但不属于本章的实现范围。

:::

## 四、订单规则注解的完整声明

以下程序定义字符串、整数、枚举、Class、数组和嵌套注解属性，并在两个普通方法上使用。保存为 `src/order/CustomAnnotationsDemo.java`，使用 JDK 21，无第三方依赖。

在任意位置新建一个空目录作为本篇示例目录，按文中标注的相对路径创建文件并保存为 UTF-8。后续编译和运行命令都在该目录执行；文件夹不存在时先创建相应父目录。

::: details 查看CustomAnnotationsDemo的完整代码

```java
// src/order/CustomAnnotationsDemo.java
package order;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** 声明订单校验注解，并证明注解使用仍是普通方法调用。 */
public final class CustomAnnotationsDemo {
    /** 禁止实例化命令行示例。 */
    private CustomAnnotationsDemo() {}

    /**
     * 调用两种带注解方法；无返回值，输出普通业务结果。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        OrderApplication application = new OrderApplication();
        System.out.println(application.submit("ORD-1001", 2));
        System.out.println(application.preview("ORD-1002", 12));
        System.out.println("automatic annotation consumer=false");
    }

    /** 超出校验范围时的处理策略，只保存声明，不执行行为。 */
    public enum ViolationAction {
        /** 拒绝不满足约束的调用。 */
        REJECT,
        /** 记录越界但允许消费方继续决策。 */
        WARN
    }

    /** 可被注解属性引用的校验器类型边界。 */
    public interface QuantityPolicy {
        /**
         * 判断数量是否满足策略。
         *
         * @param quantity 待判断的订单数量
         * @return 数量满足策略时返回 true
         */
        boolean supports(int quantity);
    }

    /** 默认正数校验器，供 Class 类型属性保存稳定策略类型。 */
    public static final class PositiveQuantityPolicy implements QuantityPolicy {
        /** 创建无状态校验器。 */
        public PositiveQuantityPolicy() {}

        /**
         * 判断数量是否为正数。
         *
         * @param quantity 待判断的订单数量
         * @return quantity 大于 0 时返回 true
         */
        @Override
        public boolean supports(int quantity) {
            return quantity > 0;
        }
    }

    /** 保存允许提交订单的时间窗口。 */
    @Documented
    @Retention(RetentionPolicy.RUNTIME)
    @Target({})
    public @interface ValidationWindow {
        /**
         * 返回每日生效窗口的开始小时。
         *
         * @return 每日开始小时，合法业务值为 0 到 23
         */
        int startHour() default 0;

        /**
         * 返回每日生效窗口的结束小时。
         *
         * @return 每日结束小时，合法业务值为 1 到 24
         */
        int endHour() default 24;
    }

    /** 声明订单方法的数量约束；运行时消费者必须自行解释这些属性。 */
    @Documented
    @Retention(RetentionPolicy.RUNTIME)
    @Target(ElementType.METHOD)
    public @interface OrderRule {
        /**
         * 返回供消费者识别的规则编码。
         *
         * @return 稳定规则编码，不包含用户输入
         */
        String code();

        /**
         * 返回允许的最小订单数量。
         *
         * @return 最小允许数量，默认值为 1
         */
        int minQuantity() default 1;

        /**
         * 返回允许的最大订单数量。
         *
         * @return 最大允许数量，使用方必须显式声明
         */
        int maxQuantity();

        /**
         * 返回数量越界时的声明策略。
         *
         * @return 越界处理策略，默认拒绝
         */
        ViolationAction action() default ViolationAction.REJECT;

        /**
         * 返回负责基础数量判断的策略类型。
         *
         * @return 负责基础数量判断的类型，必须实现 QuantityPolicy
         */
        Class<? extends QuantityPolicy> policy() default PositiveQuantityPolicy.class;

        /**
         * 返回用于分类检索的标签。
         *
         * @return 用于分类检索的稳定标签数组
         */
        String[] tags() default {};

        /**
         * 返回规则生效时间窗口。
         *
         * @return 声明生效时间窗口的嵌套注解
         */
        ValidationWindow window() default @ValidationWindow;
    }

    /** 使用订单规则的普通应用服务；没有消费者时注解不改变执行流。 */
    static final class OrderApplication {
        /** 创建无状态演示服务。 */
        OrderApplication() {}

        /**
         * 提交数量处于业务范围内的订单。
         *
         * @param orderNumber 非空订单编号
         * @param quantity 正整数订单数量
         * @return 可公开的提交结果
         * @throws IllegalArgumentException 编号为空或数量不是正数
         */
        @OrderRule(code = "ORDER_SUBMIT", maxQuantity = 10, tags = {"write", "audit"})
        public String submit(String orderNumber, int quantity) {
            requireInput(orderNumber, quantity);
            return "submitted=" + orderNumber + ", quantity=" + quantity;
        }

        /**
         * 生成大订单预览，演示枚举与嵌套注解属性。
         *
         * @param orderNumber 非空订单编号
         * @param quantity 正整数订单数量
         * @return 可公开的预览结果
         * @throws IllegalArgumentException 编号为空或数量不是正数
         */
        @OrderRule(
                code = "ORDER_PREVIEW",
                maxQuantity = 20,
                action = ViolationAction.WARN,
                window = @ValidationWindow(startHour = 8, endHour = 20)
        )
        public String preview(String orderNumber, int quantity) {
            requireInput(orderNumber, quantity);
            return "preview=" + orderNumber + ", quantity=" + quantity;
        }

        /**
         * 执行与注解无关的基础输入校验；成功时无副作用。
         *
         * @param orderNumber 非空订单编号
         * @param quantity 正整数订单数量
         * @throws IllegalArgumentException 编号为空或数量不是正数
         */
        private static void requireInput(String orderNumber, int quantity) {
            if (orderNumber == null || orderNumber.isBlank() || quantity <= 0) {
                throw new IllegalArgumentException("order number and quantity must be valid");
            }
        }
    }
}
```

:::

## 五、严格编译、运行与元数据检查

在本篇示例目录执行以下 PowerShell 命令。`javap` 分别观察注解类型的默认值，以及使用位置真正写入的值。

```powershell
javac -encoding UTF-8 -Xlint:all -Xdoclint:all,-missing -Werror -d out src/order/CustomAnnotationsDemo.java
java -ea -cp out order.CustomAnnotationsDemo
javap -v -p -classpath out 'order.CustomAnnotationsDemo$OrderRule'
javap -v -p -classpath out 'order.CustomAnnotationsDemo$OrderApplication'
```

Corretto 21.0.11 的实际运行输出如下：

```text
submitted=ORD-1001, quantity=2
preview=ORD-1002, quantity=12
automatic annotation consumer=false
```

`javap -v` 在 `OrderRule` 中显示 `minQuantity` 的 `AnnotationDefault` 为 1，在 `OrderApplication` 的方法属性中显示实际的 `code` 和 `maxQuantity`：

```text
public abstract int minQuantity();
  AnnotationDefault:
    default_value: 1

RuntimeVisibleAnnotations:
  order.CustomAnnotationsDemo$OrderRule(
    code="ORDER_SUBMIT"
    maxQuantity=10
  )
```

::: warning 普通方法调用不证明注解规则生效

运行结果只来自 main 对两个方法的直接调用。它证明带注解的方法仍按普通 Java 调用执行，没有证明数量上限已经被注解自动强制实施。

:::

## 六、属性类型与取值的编译失败

以下两份故障夹具必须独立编译。第一份把 `List<String>` 作为注解元素类型：

```java
// InvalidAnnotationElementType.java
import java.util.List;

/** 故意声明不合法的 List 注解属性类型。 */
@interface InvalidAnnotationElementType {
    /** @return 本故障夹具故意使用的非法集合类型 */
    List<String> tags();
}
```

第二份调用方法产生属性值，因其不是编译期常量表达式而无法写入注解：

::: details 查看ConstantCode的完整代码

```java
// NonConstantAnnotationValue.java
/** 接受字符串常量的故障夹具注解。 */
@interface ConstantCode {
    /** @return 编译期常量编码 */
    String value();
}

/** 故意把方法调用结果写进注解值，验证常量表达式约束。 */
@ConstantCode(NonConstantAnnotationValue.loadCode())
class NonConstantAnnotationValue {
    /** @return 运行时才产生的字符串，因此不能作为注解元素值 */
    static String loadCode() {
        return "ORDER_DYNAMIC";
    }
}
```

:::

分别执行以下命令，两个进程均已验证以退出码 1 结束，并且各产生 1 处编译错误：

```powershell
javac '-J-Duser.language=en' -encoding UTF-8 -d out InvalidAnnotationElementType.java
javac '-J-Duser.language=en' -encoding UTF-8 -d out NonConstantAnnotationValue.java
```

::: tip 复杂动态配置应重新评估表达方式

第一处错误需要改用受支持的一维数组或其他合法类型；第二处错误需要传入编译期常量，运行时配置则应交给消费方通过明确配置接口读取。把所有选项做成布尔属性会迅速产生含糊组合，优先使用有语义的枚举和较小的职责边界；当注解属性已经接近一份完整业务配置时，应重新评估普通对象或配置文件是否更合适。

:::
