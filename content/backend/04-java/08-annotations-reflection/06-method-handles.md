---
title: "Method Handle"
tags:
  - Java
  - MethodHandle
  - MethodType
excerpt: "使用 Lookup 和 MethodType 查找、绑定并调用订单格式化方法，对照 invokeExact、invoke 与 asType 的适配边界，并通过越权查找、错误签名、调用点类型错误和目标异常验证失败语义。"
date: 2026-09-08
---

# Method Handle {#method-handle-与类型化调用}

Method Handle 是对方法、构造器、字段访问或类似底层操作的类型化可执行引用。它把目标签名保存在 `MethodType` 中，并在查找时完成访问检查；调用仍可能因调用点类型、参数转换或目标方法自身失败而终止。

## 一、Lookup 决定可以创建哪些句柄

`MethodHandles.lookup()` 返回以调用类为查找主体的 Lookup，能够创建该主体按字节码访问规则本来就有权访问的直接句柄。它是一项访问能力，不应存入不可信代码可取得的位置。`publicLookup()` 权限较低，只能访问无条件导出包中的 public 类型和 public 成员。[MethodHandles API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/invoke/MethodHandles.html)

| Lookup 来源 | 本例结果 | 使用边界 |
|---|---|---|
| `MethodHandles.lookup()` | 外部类与嵌套类属于同一 nest，可查找嵌套类 private 方法 | 不代表可以访问任意其他类的 private 成员 |
| `MethodHandles.publicLookup()` | 查找 public 类的 private 方法失败 | 适合只依赖公开 API 的调用边界 |
| `MethodHandles.privateLookupIn(target, callerLookup)` | 条件满足时取得面向目标类的私有查找能力 | 受模块可读性和包开放约束，不能无条件越权 |

::: danger 传递句柄也在传递访问能力

Lookup 创建句柄时检查权限，句柄一旦成功创建便携带这项能力。把强权限句柄或 Lookup 交给外部插件，相当于把相应访问能力交给它；调用方必须限制来源和生命周期。

:::

## 二、MethodType 是精确的方法描述符

MethodType 由一个返回类型和有序参数类型列表组成，不包含方法名。查找虚方法时传给 `findVirtual` 的 MethodType 描述声明方法的返回值与显式形参；成功得到的句柄类型还会在最前面包含接收者类型。[MethodType API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/invoke/MethodType.html)

本例查找 `String format(Order, int)`：

```java
MethodType signature = MethodType.methodType(String.class, Order.class, int.class);
MethodHandle handle = lookup.findVirtual(OrderFormatter.class, "format", signature);
```

结果句柄的类型是 `(OrderFormatter, Order, int)String`。`bindTo(formatter)` 固定第一个接收者参数后，类型变为 `(Order, int)String`。查找时把 Order 错写成 Object 不会选择一个“最接近”的重载，而是抛出 `NoSuchMethodException`。

## 三、调用点类型与适配规则

句柄自身有固定的 MethodType，调用表达式还会形成自己的类型描述符。精确调用要求两者相同，适配调用则允许在规则范围内建立转换。

### 1. invokeExact 的调用点类型 {#三、invokeexact-的返回上下文也是调用点类型}

`invokeExact` 要求调用点的参数类型和返回类型与句柄完全一致。返回类型由直接作用于调用表达式的显式转换确定；没有该转换时，普通表达式使用 Object，作为独立表达式语句则使用 void。赋值目标不会像泛型目标类型推断那样自动提供所需返回类型。[MethodHandle API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/invoke/MethodHandle.html)

因此，目标返回 String 时，`Object result = handle.invokeExact(...)` 的调用点返回 Object，会触发 `WrongMethodTypeException`。在参数类型已经一致的前提下，`Object result = (String) handle.invokeExact(...)` 则先用 String 描述符完成精确调用，再把结果赋给 Object 变量；不能只看等号左侧判断调用是否精确。

### 2. 句柄类型适配 {#_2-invoke-与-astype-在转换规则内适配}

`invoke` 允许按 `asType` 规则进行方法调用转换，例如把 Object 引用检查转换为 Order、把 Integer 拆箱为 int，并把 String 返回值扩展为 Object。转换仍然可能因 null 拆箱、引用类型错误或不可支持的基本类型转换失败。

::: tip 在注册阶段固定并验证调用类型

显式调用 `asType(newType)` 会先生成一个具有新类型的适配句柄，之后可以对新句柄使用 `invokeExact`。这适合在框架注册阶段验证并缓存调用形状，比在每次业务调用中临时猜测转换更容易审计。它不会执行任意业务转换，例如字符串解析、币种换算或对象映射仍需明确代码。

:::

## 四、目标异常不会增加反射包装层

`MethodHandle.invokeExact` 和 `invoke` 的签名允许抛出 Throwable。目标方法抛出的 IllegalArgumentException 会直接到达调用方，不会自动包装为 `InvocationTargetException`；这与 `Method.invoke` 的失败形状不同。

框架适配层仍需维护自己的公开 throws 契约。直接异常不表示可以吞掉类型或堆栈，也不表示所有 Throwable 都应该转换为同一个运行时异常。目标、查找、访问和类型错误应在日志与测试中分开识别。

::: info 动态调用 API 不能代替性能基准

Method Handle 具有供 JVM 优化的调用模型，但 API 选择本身不能证明它在某个业务场景中一定比反射更快。性能结论需要固定调用形状、预热和 JMH 等受控测量；本篇只验证功能和类型边界。

:::

## 五、完整类型化调用程序

以下程序保存为 `src/order/MethodHandlesDemo.java`，使用 JDK 21，无第三方依赖。

在任意位置新建一个空目录作为本篇示例目录，按文中标注的相对路径创建文件并保存为 UTF-8。后续编译和运行命令都在该目录执行；文件夹不存在时先创建相应父目录。

::: details 查看MethodHandlesDemo的完整代码

```java
// src/order/MethodHandlesDemo.java
package order;

import java.lang.invoke.MethodHandle;
import java.lang.invoke.MethodHandles;
import java.lang.invoke.MethodType;

/** 验证 Lookup 权限、MethodType、精确调用和受控类型适配。 */
public final class MethodHandlesDemo {
    /** 禁止实例化命令行示例。 */
    private MethodHandlesDemo() {}

    /**
     * 保存格式化需要的订单数据。
     *
     * @param orderNumber 非空订单编号
     */
    public record Order(String orderNumber) {}

    /** 提供公开格式化方法和不可公开查找的内部方法。 */
    public static final class OrderFormatter {
        /** 创建无状态格式化器。 */
        public OrderFormatter() {}

        /**
         * 按给定宽度生成稳定订单文本。
         *
         * @param order 非 null 订单，编号不能为 INVALID
         * @param width 正整数显示宽度
         * @return 包含编号和宽度的格式化文本
         * @throws IllegalArgumentException 订单或宽度不满足契约
         */
        public String format(Order order, int width) {
            if (order == null || order.orderNumber().equals("INVALID") || width <= 0) {
                throw new IllegalArgumentException("invalid format input");
            }
            return "order=" + order.orderNumber() + ", width=" + width;
        }

        /**
         * 返回实现内部编码，只有具备私有访问能力的 Lookup 才能查找。
         *
         * @param orderNumber 非空订单编号
         * @return 稳定内部编码
         */
        private String internalCode(String orderNumber) {
            return "INTERNAL:" + orderNumber;
        }
    }

    /**
     * 执行精确与可适配调用，或触发一种独立失败；无返回值。
     *
     * @param args 空参数正常；wrong-type、access、missing、target 触发失败
     * @throws Throwable Method Handle 查找或目标调用产生的原始失败
     */
    public static void main(String[] args) throws Throwable {
        MethodHandles.Lookup lookup = MethodHandles.lookup();
        MethodType signature = MethodType.methodType(String.class, Order.class, int.class);
        MethodHandle handle = lookup.findVirtual(OrderFormatter.class, "format", signature);
        OrderFormatter formatter = new OrderFormatter();
        Order order = new Order("ORD-1001");

        if (args.length > 0) {
            runFailure(args[0], lookup, handle, formatter, order);
            return;
        }

        System.out.println("handle type=" + handle.type());
        String exact = (String) handle.invokeExact(formatter, order, 18);
        System.out.println("exact=" + exact);

        MethodHandle bound = handle.bindTo(formatter);
        Object flexible = bound.invoke((Object) order, Integer.valueOf(20));
        System.out.println("invoke adapted=" + flexible + ", boundType=" + bound.type());

        MethodType genericType = MethodType.methodType(
                Object.class, Object.class, Integer.class);
        MethodHandle adapted = bound.asType(genericType);
        Object explicit = adapted.invokeExact((Object) order, Integer.valueOf(22));
        System.out.println("asType exact=" + explicit + ", adaptedType=" + adapted.type());

        MethodHandle internal = lookup.findVirtual(
                OrderFormatter.class,
                "internalCode",
                MethodType.methodType(String.class, String.class));
        String code = (String) internal.invokeExact(formatter, "ORD-1001");
        System.out.println("caller lookup private access=" + code);
    }

    /**
     * 触发调用点类型、访问、签名查找或目标方法失败；无返回值。
     *
     * @param mode wrong-type、access、missing 或 target
     * @param lookup 以当前类为访问主体的 Lookup
     * @param handle 类型为 (OrderFormatter, Order, int)String 的句柄
     * @param formatter 非 null 目标对象
     * @param order 合法订单参数
     * @throws Throwable 对应查找或调用产生的原始失败
     */
    private static void runFailure(
            String mode,
            MethodHandles.Lookup lookup,
            MethodHandle handle,
            OrderFormatter formatter,
            Order order
    ) throws Throwable {
        switch (mode) {
            case "wrong-type" -> {
                Object ignored = handle.invokeExact(formatter, order, 18);
                System.out.println(ignored);
            }
            case "access" -> MethodHandles.publicLookup().findVirtual(
                    OrderFormatter.class,
                    "internalCode",
                    MethodType.methodType(String.class, String.class));
            case "missing" -> lookup.findVirtual(
                    OrderFormatter.class,
                    "format",
                    MethodType.methodType(String.class, Object.class, int.class));
            case "target" -> {
                String ignored = (String) handle.invokeExact(
                        formatter, new Order("INVALID"), 18);
                System.out.println(ignored);
            }
            default -> throw new IllegalArgumentException("unknown mode: " + mode);
        }
    }
}
```

:::

## 六、编译与正常调用结果

在本篇示例目录执行以下 PowerShell 命令：

```powershell
javac -encoding UTF-8 -Xlint:all -Xdoclint:all,-missing -Werror -d out src/order/MethodHandlesDemo.java
java -ea -cp out order.MethodHandlesDemo
```

Corretto 21.0.11 的实际输出如下：

```text
handle type=(OrderFormatter,Order,int)String
exact=order=ORD-1001, width=18
invoke adapted=order=ORD-1001, width=20, boundType=(Order,int)String
asType exact=order=ORD-1001, width=22, adaptedType=(Object,Integer)Object
caller lookup private access=INTERNAL:ORD-1001
```

第一、三、四行分别展示原句柄、绑定句柄与显式适配句柄的类型。最后一行只证明当前调用类作为 nestmate 的 Lookup 可以访问其嵌套类私有成员，不把该能力扩大到任意调用方。

## 七、四种失败保持各自语义

分别执行以下命令，每条都已验证以退出码 1 结束：

```powershell
java -ea -cp out order.MethodHandlesDemo wrong-type
java -ea -cp out order.MethodHandlesDemo access
java -ea -cp out order.MethodHandlesDemo missing
java -ea -cp out order.MethodHandlesDemo target
```

| 参数 | 顶层实测异常 | 失败位置 |
|---|---|---|
| `wrong-type` | `WrongMethodTypeException` | 句柄返回 String，调用表达式没有显式转换，描述符返回 Object，精确类型不一致 |
| `access` | `IllegalAccessException` | publicLookup 无权查找 private internalCode |
| `missing` | `NoSuchMethodException` | 查找要求 `(Object, int)String`，目标只声明 `(Order, int)String` |
| `target` | `IllegalArgumentException: invalid format input` | 签名与权限均成功，目标方法直接拒绝 INVALID |

::: tip 按查找、权限、类型和业务区分失败

这些入口把配置错误、权限错误、调用点错误与业务输入错误分开。调用代码应在注册阶段验证可预知的 Lookup 和 MethodType 问题，在执行阶段保留目标异常契约；不能用捕获 Throwable 后返回 null 的方式把所有失败伪装成“未找到订单”。

:::

Method Handle 负责一个已知目标的类型化动态调用，不会自行创建接口代理或定义拦截顺序；需要统一拦截接口调用时参见[JDK 动态代理](./05-dynamic-proxies.md)。
