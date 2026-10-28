---
title: "Class 与反射 API"
tags:
  - Java
  - Reflection
excerpt: "使用受控类名完成 Class 加载、成员发现、构造和方法调用，消费订单规则元数据，并通过访问拒绝、成员缺失与 InvocationTargetException 区分反射基础设施失败和目标业务失败。"
date: 2026-09-08
---

# Class 与反射 API

反射把类型名、成员签名和访问检查推迟到运行时。它适合框架扩展点、序列化元数据和工具适配层；普通业务分派已经有明确接口时，直接调用能保留更完整的编译期检查和更清楚的调用关系。

## 一、Class 对象描述运行时类型

| 获取方式 | 适用场景 | 初始化行为与风险 |
|---|---|---|
| `Order.class` | 编译期已知类型 | 获得 Class 对象本身不会初始化该类 |
| `order.getClass()` | 已有非 null 对象 | 返回对象的实际运行时类，类已经因对象创建而初始化 |
| `Class.forName(name)` | 受控名称发现扩展 | 使用调用方类加载器并初始化目标类 |
| `Class.forName(name, false, loader)` | 分开发现与初始化 | 只要求加载，不因该调用主动初始化目标类 |

三参数 `forName` 允许调用方明确类加载器和初始化开关。`false` 不等于类永远不会初始化：后续构造对象、访问特定静态成员或其他主动使用仍会触发初始化。[Class.forName API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html#forName(java.lang.String,boolean,java.lang.ClassLoader))

::: danger 请求输入不能直接决定加载的类

类名不能直接来自请求参数。加载会接触类加载器可见范围、链接错误和静态初始化副作用；插件系统应从受控配置映射到允许类型，并在实例化前检查父类型或接口。本例把二进制名称固定为内部常量，只验证一项已知扩展。

:::

## 二、公开成员和声明成员是两种视图

### 1. 查询范围与访问能力分别判断

`getMethod`、`getField` 和 `getConstructor` 查找公开成员，其中方法与字段查询可以包含继承的公开成员。`getDeclaredMethod`、`getDeclaredField` 和 `getDeclaredConstructor` 只查看当前类型声明，可以找到非 public 成员，但“找到”不代表“有权调用”。

构造器不被子类继承，因此公开构造器查询也不会自动取得超类构造器。选择查询入口时，应先确定需要的是继承后的公开 API，还是某个类自己的声明集合，再处理实际调用权限。

### 2. 精确签名与调用顺序必须显式指定

方法查找必须提供精确形参类型。返回类型不参与 `getMethod(name, parameterTypes)` 的调用参数；自动装箱、可变参数和重载选择不会像普通源码调用那样替调用方推断。找不到匹配签名时抛出 `NoSuchMethodException`，不应退化成按名称选择第一个方法。

::: tip 使用显式顺序组织反射调用

使用 `getDeclaredMethods()` 的返回顺序组织业务流程也不可靠。反射 API 没有把源码声明顺序定义为通用调度契约；需要顺序时应使用显式优先级，并验证重复和冲突。

:::

## 三、构造与调用的失败阶段 {#三、构造与调用包含三类独立失败}

### 1. 发现、参数检查与目标执行分别定位

反射调用失败时，先确认目标方法是否已经执行。配置找不到成员、实参不符合签名和目标主动拒绝业务输入，需要采取不同的修正动作。

| 失败阶段 | 常见异常 | 含义与处理 |
|---|---|---|
| 类型或成员发现 | `ClassNotFoundException`、`NoSuchMethodException` | 配置、版本或签名与运行产物不一致 |
| 访问检查 | `IllegalAccessException`，深反射还可能遇到 `InaccessibleObjectException` | 调用方没有语言或模块访问能力 |
| 目标执行 | `InvocationTargetException` | 方法或构造器已经开始执行，目标抛出的异常位于 `getCause()` |
| 参数与接收者检查 | `IllegalArgumentException` | 目标对象、实参数量或运行时类型不匹配 |

`Constructor.newInstance` 和 `Method.invoke` 会把目标抛出的异常放入 `InvocationTargetException`。适配层应根据公开契约转换或重新抛出 cause，并保留原因链；把所有情况统一成“反射失败”会混淆基础设施错误与订单校验失败。[InvocationTargetException API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/InvocationTargetException.html)

### 2. 访问能力由语言与模块共同约束

::: warning 找到成员不代表有权进行深反射

`trySetAccessible()` 只能探测当前运行环境是否允许关闭语言访问检查；失败时返回 `false`。命名模块没有向调用方开放包时，深反射仍可能被拒绝，`setAccessible(true)` 则可能抛出 `InaccessibleObjectException`。公开扩展点应优先使用公开类型、构造器和方法；不能把 `--add-opens` 当作通用修复。[AccessibleObject API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/AccessibleObject.html)

:::

## 四、反射层消费订单校验元数据

本例复用[自定义注解](./02-custom-annotations.md)定义的 `OrderRule`。`invokeValidated` 先取得注解，实例化被 Class 属性约束的 `QuantityPolicy`，检查最小值和最大值，再调用目标方法。直接调用 `validate` 仍会执行方法自己的输入校验，说明注解消费层不能替代业务对象自身的有效性边界。

完整源码保存为 `src/order/ClassReflectionDemo.java`：

在任意位置新建一个空目录作为本篇示例目录，按文中标注的相对路径创建文件并保存为 UTF-8。后续编译和运行命令都在该目录执行；文件夹不存在时先创建相应父目录。

::: details 查看ClassReflectionDemo的完整代码

```java
// src/order/ClassReflectionDemo.java
package order;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/** 使用受控类型名验证 Class 获取、成员查找、反射调用和异常边界。 */
public final class ClassReflectionDemo {
    /** 受控白名单中的校验器二进制名称。 */
    private static final String VALIDATOR_TYPE = "order.ReflectiveOrderValidator";

    /** 禁止实例化命令行示例。 */
    private ClassReflectionDemo() {}

    /**
     * 执行正常反射闭环，或触发一种独立失败；无返回值。
     *
     * @param args 空参数正常；metadata、access、target、missing 触发对应失败
     * @throws ReflectiveOperationException 当类型、成员、构造或调用失败时抛出
     */
    public static void main(String[] args) throws ReflectiveOperationException {
        ClassLoader loader = ClassReflectionDemo.class.getClassLoader();
        Class<?> loaded = Class.forName(VALIDATOR_TYPE, false, loader);
        System.out.println("loaded without initialization=" + (InitializationProbe.count == 0));
        System.out.println("class sources agree=" + (loaded == ReflectiveOrderValidator.class));

        Object validator = loaded.getConstructor().newInstance();
        System.out.println("initialized after construction=" + (InitializationProbe.count == 1));
        Method validate = loaded.getMethod("validate", String.class, int.class);

        if (args.length > 0) {
            runFailure(args[0], loaded, validator, validate);
            return;
        }

        boolean inheritedPublic = hasMethodNamed(loaded.getMethods(), "toString");
        boolean declaredPrivate = hasMethodNamed(loaded.getDeclaredMethods(), "internalCode");
        System.out.println("getMethods includes inherited public=" + inheritedPublic);
        System.out.println("getDeclaredMethods includes private=" + declaredPrivate);

        CustomAnnotationsDemo.OrderRule rule = validate.getAnnotation(
                CustomAnnotationsDemo.OrderRule.class);
        System.out.println("rule=" + rule.code() + ", range="
                + rule.minQuantity() + ".." + rule.maxQuantity());
        Object result = invokeValidated(validate, validator, "ORD-1001", 2);
        System.out.println("result=" + result + ", returnType=" + result.getClass().getSimpleName());

        try {
            validate.invoke(validator, "ORD-1001", 0);
            throw new AssertionError("expected target failure");
        } catch (InvocationTargetException wrapper) {
            System.out.println("wrapper=" + wrapper.getClass().getSimpleName()
                    + ", cause=" + wrapper.getCause().getClass().getSimpleName());
        }
    }

    /**
     * 判断成员数组中是否存在指定名称，避免依赖反射返回顺序。
     *
     * @param methods 非 null Method 数组
     * @param expectedName 非 null 目标方法名
     * @return 至少存在一个同名方法时返回 true
     */
    private static boolean hasMethodNamed(Method[] methods, String expectedName) {
        for (Method method : methods) {
            if (method.getName().equals(expectedName)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 消费订单注解，先验证策略与范围，再调用公开目标方法。
     *
     * @param method 带有 OrderRule 的公开方法
     * @param target method 的非 null 目标对象
     * @param orderNumber 非空订单编号
     * @param quantity 待校验的订单数量
     * @return 目标方法的原始返回值
     * @throws ReflectiveOperationException 注解策略无法构造或目标调用失败
     * @throws IllegalArgumentException 注解缺失或数量不符合元数据契约
     */
    private static Object invokeValidated(
            Method method,
            Object target,
            String orderNumber,
            int quantity
    ) throws ReflectiveOperationException {
        CustomAnnotationsDemo.OrderRule rule = method.getAnnotation(
                CustomAnnotationsDemo.OrderRule.class);
        if (rule == null) {
            throw new IllegalArgumentException("missing OrderRule metadata");
        }
        CustomAnnotationsDemo.QuantityPolicy policy =
                rule.policy().getConstructor().newInstance();
        if (!policy.supports(quantity)
                || quantity < rule.minQuantity()
                || quantity > rule.maxQuantity()) {
            throw new IllegalArgumentException("metadata rejected quantity: " + quantity);
        }
        return method.invoke(target, orderNumber, quantity);
    }

    /**
     * 触发单一反射失败，保证三类错误不被统一包装成同一消息。
     *
     * @param mode metadata、access、target 或 missing
     * @param loaded 已由白名单名称加载但可能尚未初始化的类型
     * @param validator 已成功构造的目标对象
     * @param validate 已解析的公开校验方法
     * @throws ReflectiveOperationException 对应的访问、目标或成员查找失败
     */
    private static void runFailure(
            String mode,
            Class<?> loaded,
            Object validator,
            Method validate
    ) throws ReflectiveOperationException {
        switch (mode) {
            case "metadata" -> invokeValidated(validate, validator, "ORD-1001", 11);
            case "access" -> loaded.getDeclaredMethod("internalCode").invoke(validator);
            case "target" -> validate.invoke(validator, "ORD-1001", 0);
            case "missing" -> loaded.getMethod("validate", String.class);
            default -> throw new IllegalArgumentException("unknown mode: " + mode);
        }
    }
}

/** 保存类初始化次数，只在本地示例进程内使用。 */
final class InitializationProbe {
    /** 当前进程中校验器完成类初始化的次数。 */
    static int count;

    /** 禁止实例化共享探针。 */
    private InitializationProbe() {}
}

/** 被反射发现和调用的订单校验器。 */
class ReflectiveOrderValidator {
    static {
        InitializationProbe.count++;
    }

    /** 提供公开无参构造器，作为受控扩展点。 */
    public ReflectiveOrderValidator() {}

    /**
     * 校验订单并返回稳定结果。
     *
     * @param orderNumber 非空订单编号
     * @param quantity 1 到 10 的订单数量
     * @return 包含订单编号和数量的稳定文本
     * @throws IllegalArgumentException 输入不满足公开方法契约
     */
    @CustomAnnotationsDemo.OrderRule(code = "ORDER_VALIDATE", maxQuantity = 10)
    public String validate(String orderNumber, int quantity) {
        if (orderNumber == null || orderNumber.isBlank() || quantity < 1 || quantity > 10) {
            throw new IllegalArgumentException("order validation failed");
        }
        return "validated=" + orderNumber + ", quantity=" + quantity;
    }

    /**
     * 返回校验器内部代码。
     *
     * @return 仅供实现内部使用的代码，不属于反射扩展契约
     */
    private String internalCode() {
        return "INTERNAL";
    }
}
```

:::

## 五、编译与正常结果

在本篇示例目录执行以下 PowerShell 命令。第一份源码提供订单注解契约，第二份提供反射消费方和目标类：


将以下代码保存为 `src/order/CustomAnnotationsDemo.java`：

::: details 查看 CustomAnnotationsDemo 完整代码

```java [src/order/CustomAnnotationsDemo.java]
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


```powershell
javac -encoding UTF-8 -Xlint:all -Xdoclint:all,-missing -Werror -d out src/order/CustomAnnotationsDemo.java src/order/ClassReflectionDemo.java
java -ea -cp out order.ClassReflectionDemo
```

Corretto 21.0.11 的实际输出如下：

```text
loaded without initialization=true
class sources agree=true
initialized after construction=true
getMethods includes inherited public=true
getDeclaredMethods includes private=true
rule=ORDER_VALIDATE, range=1..10
result=validated=ORD-1001, quantity=2, returnType=String
wrapper=InvocationTargetException, cause=IllegalArgumentException
```

前三行把加载与初始化分开；随后两行证明公开继承视图和当前类声明视图不同。元数据消费方接受数量 2 后得到目标 String；直接用数量 0 调用同一方法时，反射层观察到包装异常及其业务 cause。

## 六、逐项复现失败阶段

分别执行以下命令，每条都已验证以退出码 1 结束：

```powershell
java -ea -cp out order.ClassReflectionDemo metadata
java -ea -cp out order.ClassReflectionDemo access
java -ea -cp out order.ClassReflectionDemo target
java -ea -cp out order.ClassReflectionDemo missing
```

| 参数 | 顶层实测异常 | 观察与处理 |
|---|---|---|
| `metadata` | `IllegalArgumentException: metadata rejected quantity: 11` | 消费方在目标调用前根据 1..10 拒绝输入 |
| `access` | `IllegalAccessException` | 已找到 private 方法，但没有关闭语言访问检查 |
| `target` | `InvocationTargetException`，cause 为 `IllegalArgumentException` | 目标已经执行并拒绝数量 0，适配层应保留 cause |
| `missing` | `NoSuchMethodException` | 请求的单参数签名不存在，应修正版本或配置 |

本例的访问拒绝来自普通 classpath 下的 private 成员，没有宣称已经复现命名模块的包开放失败。生产框架若需要深反射，还必须在实际模块化运行环境验证 reads、exports 与 opens；完整模块描述和打包不在本篇展开。

::: tip 反射缓存应随类加载器释放

反射元数据可以按 `Class` 缓存以避免重复查找，但缓存必须与类加载器生命周期一致。可卸载插件不应被全局强引用 Map 永久保留；适合的情况下使用 `ClassValue` 或由插件上下文持有并在卸载时清理。缓存只消除重复发现，不能绕过访问检查、参数检查或目标异常。

:::

字段、方法和父类型上的参数化声明会由同一套反射入口返回 `Type` 树，具体节点、擦除边界和实例信息限制见[泛型类型信息](./04-generic-type-information.md)。
