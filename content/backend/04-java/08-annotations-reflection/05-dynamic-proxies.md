---
title: "JDK 动态代理"
tags:
  - Java
  - Proxy
  - Reflection
excerpt: "使用 JDK Proxy 在订单服务接口边界记录调用顺序，完整处理返回值、目标异常与 Object 方法，并通过默认方法、自调用、非接口目标和错误返回类型验证动态代理的适用范围。"
date: 2026-09-08
---

# JDK 动态代理

JDK 动态代理在运行时创建一个实现指定接口列表的对象，并把这些接口上的方法调用交给同一个 `InvocationHandler`。它适合接口边界上的审计、Tracing 或远程调用适配；没有接口的普通类不能直接由 JDK Proxy 代理。

## 一、代理对象由接口、类加载器和处理器共同定义

`Proxy.newProxyInstance(loader, interfaces, handler)` 的三个输入分别决定代理类在哪里定义、它实现哪些类型以及调用如何处理。接口必须对指定类加载器可见，数组元素必须真的是接口，并满足非 public 接口的包与模块约束。[Proxy API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Proxy.html)

::: warning 接口代理不是目标实现类的子类

代理实例可以转换为接口类型，不是目标实现类的子类。对 `OrderServiceTarget` 的强制转换没有类型依据；需要类代理时通常要使用字节码生成方案，其构造器、final 成员和模块边界属于另一套约束。

:::

| 对象 | 责任 | 本例选择 |
|---|---|---|
| 代理接口 | 定义调用方看到的参数、返回值和 throws 契约 | `OrderService` |
| 目标对象 | 执行真实订单逻辑 | `OrderServiceTarget` |
| InvocationHandler | 拦截、记录、委托并维持接口语义 | `AuditHandler` |
| ClassLoader | 定义代理类并解析接口身份 | 使用接口自身的类加载器 |

代理接口数组的顺序也属于生成条件。框架应使用稳定、去重且可见的接口集合，不能从无序扫描结果随意拼接后依赖偶然生成类身份。

## 二、代理处理器的调用契约 {#二、invocationhandler-必须保持返回与异常契约}

### 1. 返回值必须满足接口调用点类型

处理器的 `invoke(proxy, method, args)` 返回值会成为接口调用的结果。返回对象必须能转换为声明的引用类型；基本类型返回还要求可正确拆箱。故意为 String 方法返回 Integer 时，代理调用点会抛出 `ClassCastException`。[InvocationHandler API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/InvocationHandler.html)

处理器方法声明返回 Object，只是让同一个入口承接不同接口方法，并没有取消这些方法各自的返回契约。实现通用拦截器时，应沿 Method 的返回类型检查委托或替代结果；接口要求基本类型时，返回 null 也不能代表“没有结果”。

### 2. 展开反射包装后仍遵守 throws 契约

本例使用 `Method.invoke(target, args)` 委托，因此目标异常会先被 `InvocationTargetException` 包装。处理器立即抛出 `getCause()`，让 OrderNotFoundException 以接口调用异常出现。若处理器抛出接口 throws 未声明的受检异常，调用方可能看到 `UndeclaredThrowableException`；代理不能绕过接口异常契约。

::: tip 代理日志只记录必要的诊断字段

无参数方法的 args 可能为 null。日志不应默认序列化参数、返回值或完整目标对象；本例只记录方法名和阶段，避免把订单字段意外写入日志。记录失败后仍要明确审计系统自身失败是否阻断业务，示例没有模拟外部审计存储。

:::

## 三、Object 与默认方法也会进入处理器

### 1. Object 方法维护一致的代理身份

代理上的 `equals`、`hashCode` 和 `toString` 会像接口方法一样分派给处理器，对应 Method 的声明类是 Object。处理器若在实现 `toString` 时再次拼接 proxy，或在 equals 中无条件调用 `proxy.equals`，会重新进入自身并递归。

::: info 代理身份语义需要成套验证

本例采用代理身份语义：只与自身相等，hashCode 使用代理实例身份，toString 返回固定且不含业务数据的描述。不同框架也可以定义目标身份语义，但 equals 和 hashCode 必须保持一致，并经过代理对代理、代理对目标以及集合键场景测试。

:::

### 2. 默认方法仍需要处理器选择调用方式

接口默认方法同样进入处理器。本例把 Method 调用转发给实现该接口的 target，因此继承的默认实现正常执行。需要直接选择某个代理接口默认实现时，Java 21 还提供 `InvocationHandler.invokeDefault`；多接口同签名场景必须由框架明确选择，不能依赖偶然顺序。

二者的接收者不同：委托给 target 时，执行的是目标对象适用的方法实现；直接调用代理接口的默认实现时，接收者是代理。审计、状态读取和默认方法内部的其他接口调用都需要结合这个接收者判断，不能仅凭方法带有 default 就跳过处理器逻辑。

## 四、自调用不会经过外部代理

调用方执行 `proxy.cancel(...)` 时会进入处理器，处理器随后在 target 上调用 cancel。目标内部的 `this.find(...)` 使用的接收者仍是 target，不会重新回到外部 proxy，因此日志只出现 cancel 的 before 和 after。

::: warning 目标对象自调用不会经过外部代理

这条边界同样适用于建立在代理上的事务、鉴权或重试：目标对象内部自调用不经过代理层。修复方式取决于设计，可以拆出另一个明确协作者，或确保需要拦截的调用从代理边界进入；不能靠给内部方法再加一个注解假定它会自动生效。

:::

## 五、完整订单服务代理

以下程序保存为 `src/order/DynamicProxyDemo.java`，使用 JDK 21，无第三方依赖。工厂内部创建处理器并和代理一起返回，避免观察到绑定在另一个 target 上的处理器。

在任意位置新建一个空目录作为本篇示例目录，按文中标注的相对路径创建文件并保存为 UTF-8。后续编译和运行命令都在该目录执行；文件夹不存在时先创建相应父目录。

::: details 查看DynamicProxyDemo的完整代码

```java
// src/order/DynamicProxyDemo.java
package order;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/** 验证 JDK 接口代理的转发、对象方法、异常透明性和自调用边界。 */
public final class DynamicProxyDemo {
    /** 禁止实例化命令行示例。 */
    private DynamicProxyDemo() {}

    /** 定义被代理的公开订单服务边界。 */
    interface OrderService {
        /**
         * 查询订单状态。
         *
         * @param orderNumber 非空订单编号
         * @return 稳定订单状态文本
         */
        String find(String orderNumber);

        /**
         * 取消存在的订单。
         *
         * @param orderNumber 非空订单编号
         * @return 稳定取消结果
         */
        String cancel(String orderNumber);

        /**
         * 返回接口默认调用渠道。
         *
         * @return 接口提供的默认调用渠道
         */
        default String channel() {
            return "API";
        }
    }

    /** 目标不存在时由接口实现直接抛出的非受检异常。 */
    static final class OrderNotFoundException extends RuntimeException {
        /** 序列化协议使用的稳定版本号。 */
        private static final long serialVersionUID = 1L;

        /**
         * 保存不包含客户数据的稳定错误消息。
         *
         * @param message 非空诊断消息
         */
        OrderNotFoundException(String message) {
            super(message);
        }
    }

    /** 提供真实业务结果，取消方法中的 this.find 不经过外部代理。 */
    static final class OrderServiceTarget implements OrderService {
        /** 创建无状态目标服务。 */
        OrderServiceTarget() {}

        /**
         * 返回固定订单状态，MISSING 用于触发目标异常。
         *
         * @param orderNumber 非空订单编号
         * @return 稳定订单状态文本
         * @throws OrderNotFoundException 编号为 MISSING
         */
        @Override
        public String find(String orderNumber) {
            if (Objects.equals(orderNumber, "MISSING")) {
                throw new OrderNotFoundException("order not found");
            }
            return "order=" + orderNumber + ", status=PAID";
        }

        /**
         * 先通过目标对象自身查询，再返回取消结果。
         *
         * @param orderNumber 非空订单编号
         * @return 稳定取消结果
         * @throws OrderNotFoundException 目标内部查询不到订单
         */
        @Override
        public String cancel(String orderNumber) {
            find(orderNumber);
            return "cancelled=" + orderNumber;
        }
    }

    /** 记录接口调用顺序，并明确实现 Object 三个可拦截方法。 */
    static final class AuditHandler implements InvocationHandler {
        /** 接收代理委托的真实目标对象。 */
        private final Object target;
        /** 当前示例进程内的调用阶段记录。 */
        private final List<String> events = new ArrayList<>();

        /**
         * 保存真实目标，后续只记录方法名，不记录参数或返回对象。
         *
         * @param target 实现代理接口的非 null 目标对象
         */
        AuditHandler(Object target) {
            this.target = Objects.requireNonNull(target, "target");
        }

        /**
         * 处理一次代理调用并保持目标返回值与异常语义。
         *
         * @param proxy 当前代理实例，不传入目标方法
         * @param method 被调用的接口方法或 Object 方法
         * @param arguments 实参数组；无参数方法时可能为 null
         * @return Object 方法的身份结果或目标方法返回值
         * @throws Throwable 目标抛出的原始异常，不保留 InvocationTargetException 包装
         */
        @Override
        public Object invoke(Object proxy, Method method, Object[] arguments) throws Throwable {
            if (method.getDeclaringClass() == Object.class) {
                return invokeObjectMethod(proxy, method, arguments);
            }

            events.add("before:" + method.getName());
            try {
                Object result = method.invoke(target, arguments);
                events.add("after:" + method.getName());
                return result;
            } catch (InvocationTargetException wrapper) {
                events.add("error:" + method.getName());
                throw wrapper.getCause();
            }
        }

        /**
         * 使用代理身份实现 equals、hashCode、toString，避免再次调用代理。
         *
         * @param proxy 当前代理实例
         * @param method 声明于 Object 的 equals、hashCode 或 toString
         * @param arguments equals 的单参数数组，其他方法可能为 null
         * @return 与代理身份一致的对象方法结果
         */
        private Object invokeObjectMethod(Object proxy, Method method, Object[] arguments) {
            return switch (method.getName()) {
                case "equals" -> proxy == arguments[0];
                case "hashCode" -> System.identityHashCode(proxy);
                case "toString" -> "OrderServiceProxy[target=OrderServiceTarget]";
                default -> throw new IllegalStateException("unsupported Object method");
            };
        }

        /**
         * 返回调用事件快照。
         *
         * @return 当前事件的不可修改快照
         */
        List<String> events() {
            return List.copyOf(events);
        }

        /** 清空当前进程内的调用事件；无返回值。 */
        void clearEvents() {
            events.clear();
        }
    }

    /**
     * 同时返回代理和它唯一绑定的处理器，避免测试观察错目标。
     *
     * @param <T> 代理接口类型
     * @param proxy 已通过接口类型检查的代理实例
     * @param handler 与代理唯一绑定的审计处理器
     */
    private record ProxyBinding<T>(T proxy, AuditHandler handler) {}

    /**
     * 创建只实现指定接口的 JDK 代理。
     *
     * @param interfaceType 必须是 target 实现的接口 Class
     * @param target 非 null 目标对象
     * @param <T> 代理接口类型
     * @return 同时持有代理与其唯一处理器的绑定结果
     * @throws IllegalArgumentException 类型不是接口或目标未实现接口
     */
    private static <T> ProxyBinding<T> create(Class<T> interfaceType, T target) {
        Objects.requireNonNull(interfaceType, "interfaceType");
        Objects.requireNonNull(target, "target");
        if (!interfaceType.isInterface() || !interfaceType.isInstance(target)) {
            throw new IllegalArgumentException("target must implement a proxy interface");
        }
        AuditHandler handler = new AuditHandler(target);
        Object proxy = Proxy.newProxyInstance(
                interfaceType.getClassLoader(), new Class<?>[]{interfaceType}, handler);
        return new ProxyBinding<>(interfaceType.cast(proxy), handler);
    }

    /**
     * 执行正常代理闭环，或触发一种独立失败；无返回值。
     *
     * @param args 空参数正常；missing、non-interface、wrong-return 触发失败
     */
    public static void main(String[] args) {
        OrderServiceTarget target = new OrderServiceTarget();
        ProxyBinding<OrderService> binding = create(OrderService.class, target);
        AuditHandler handler = binding.handler();
        OrderService proxy = binding.proxy();

        if (args.length > 0) {
            runFailure(args[0], target, proxy);
            return;
        }

        System.out.println(proxy.find("ORD-1001"));
        System.out.println("events=" + handler.events());
        System.out.println("default channel=" + proxy.channel());
        System.out.println("events after default=" + handler.events());
        System.out.println("identity equals self=" + proxy.equals(proxy)
                + ", equals target=" + proxy.equals(target));
        System.out.println("identity hash stable=" + (proxy.hashCode() == proxy.hashCode()));
        System.out.println("description=" + proxy);

        handler.clearEvents();
        System.out.println(proxy.cancel("ORD-1001"));
        System.out.println("self invocation events=" + handler.events());
    }

    /**
     * 触发目标异常、非接口目标或错误返回类型；无返回值。
     *
     * @param mode missing、non-interface 或 wrong-return
     * @param target 已创建的订单目标对象
     * @param proxy 已创建的正确订单代理
     */
    private static void runFailure(String mode, OrderServiceTarget target, OrderService proxy) {
        switch (mode) {
            case "missing" -> proxy.find("MISSING");
            case "non-interface" -> create(OrderServiceTarget.class, target);
            case "wrong-return" -> {
                InvocationHandler invalid = new WrongReturnHandler();
                OrderService malformed = (OrderService) Proxy.newProxyInstance(
                        OrderService.class.getClassLoader(),
                        new Class<?>[]{OrderService.class}, invalid);
                malformed.find("ORD-1001");
            }
            default -> throw new IllegalArgumentException("unknown mode: " + mode);
        }
    }

    /** 故意返回错误类型，仅用于验证代理返回值契约。 */
    private static final class WrongReturnHandler implements InvocationHandler {
        /** 创建不保存状态的错误返回处理器。 */
        WrongReturnHandler() {}

        /**
         * 对任意接口方法返回 Integer，调用 String 方法时由代理触发转换失败。
         *
         * @param proxy 当前错误代理实例
         * @param method 被调用的方法
         * @param arguments 方法实参，本故障夹具不读取
         * @return 固定 Integer，故意违反 String 返回契约
         */
        @Override
        public Object invoke(Object proxy, Method method, Object[] arguments) {
            return 1001;
        }
    }
}
```

:::

## 六、运行结果与三个失败入口

在本篇示例目录严格编译并运行：

```powershell
javac -encoding UTF-8 -Xlint:all -Xdoclint:all,-missing -Werror -d out src/order/DynamicProxyDemo.java
java -ea -cp out order.DynamicProxyDemo
```

Corretto 21.0.11 的实际输出如下：

```text
order=ORD-1001, status=PAID
events=[before:find, after:find]
default channel=API
events after default=[before:find, after:find, before:channel, after:channel]
identity equals self=true, equals target=false
identity hash stable=true
description=OrderServiceProxy[target=OrderServiceTarget]
cancelled=ORD-1001
self invocation events=[before:cancel, after:cancel]
```

前三组事件证明普通方法与默认方法都进入处理器；Object 方法按代理身份完成且没有递归；最后一行只有 cancel，没有内部 find，直接证明自调用边界。

分别执行以下命令，每条都已验证以退出码 1 结束：

```powershell
java -ea -cp out order.DynamicProxyDemo missing
java -ea -cp out order.DynamicProxyDemo non-interface
java -ea -cp out order.DynamicProxyDemo wrong-return
```

| 参数 | 顶层实测异常 | 证明范围 |
|---|---|---|
| `missing` | `OrderNotFoundException: order not found` | 处理器已展开 InvocationTargetException，调用方看到目标非受检异常 |
| `non-interface` | `IllegalArgumentException: target must implement a proxy interface` | 工厂在创建代理前拒绝普通实现类 |
| `wrong-return` | `ClassCastException: Integer cannot be cast to String` | 处理器返回值仍受接口调用点的类型契约约束 |

::: info 接口拦截示例的能力边界

本例没有实现类代理、字节码生成、事务系统或远程调用协议，也没有用耗时输出推断性能。代理层增加了一个明确调用边界；是否值得使用，应由统一拦截需求、异常契约和可测试性决定。

:::
