---
title: "类加载与初始化"
tags: [Java, JVM, 类加载]
excerpt: "区分类加载、验证、准备、解析和初始化，使用真实输出验证父子类初始化顺序及错误状态，解释加载器身份、委派模型和常见链接异常的处理边界。"
date: 2026-09-10
---


# 类加载与初始化

类加载把二进制表示转为运行时类，初始化则执行类级别的初始化逻辑。加载完成不表示静态代码已经执行，拿到 `Class` 对象也不必然触发初始化。


## 一、加载与链接

| 阶段 | 核心职责 | 典型问题 |
|------|----------|----------|
| 加载 | 获得二进制表示、创建运行时类 | 路径、加载器可见性 |
| 验证 | 检查格式、类型与控制流约束 | 非法或不兼容的产物 |
| 准备 | 为静态字段建立存储及初始状态 | 不等同于普通静态赋值表达式已执行 |
| 解析 | 将符号引用关联到实际目标 | 依赖缺失、签名或访问不兼容 |
| 初始化 | 执行必要的静态初始化逻辑 | 配置、循环依赖与外部调用失败 |

解析可以按需要进行，不必把表格理解为应用启动时一次性完成的全局流水线。初始化需要满足相应的加载和链接前提，运行时还必须协调多个线程对同一类的初始化请求。


## 二、初始化触发


### 1. 主动使用与常量

创建实例、调用声明在类中的静态方法、读写需要初始化的静态字段，会按规则触发相关类初始化。编译期常量可能被调用方内联，因此读取一个常量不能可靠地用于触发其声明类的静态代码。

初始化类之前会先满足必要的父类型初始化约束。涉及默认方法的接口规则另有规定，不能简单归纳成“全部接口一定先初始化”或“接口永远不初始化”。


### 2. 输出顺序验证

`RuntimeLab#initialize` 先用 `Class.forName(name, false, loader)` 加载 `Child`，打印 `loaded`，随后读取 `Child.VALUE`。父子字段都通过方法计算，避免被当作编译期常量。

保存下方完整程序后，在本篇示例目录编译和运行：

在任意位置新建空目录，使用 JDK 21，将下面的文件保存到该目录。后续命令均在此目录执行。

保存为 `RuntimeLab.java`：

::: details 查看 RuntimeLab.java 完整代码

```java [RuntimeLab.java]
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;

/** 用有限工作量观察 Java 21 HotSpot；各模式独立进程执行。 */
public final class RuntimeLab {

    /** 禁止实例化命令入口。 */
    private RuntimeLab() { }
    /**
     * 执行当前观察场景并输出结果，无返回值。
     * @param args 只接受一个参数：init、identity
     * @throws Exception 参数不合法或观察失败时终止当前进程
     */
    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            throw new IllegalArgumentException("expected mode: init, identity");
        }
        switch (args[0]) {
            case "init" -> initialize();
            case "identity" -> identity();
            default -> throw new IllegalArgumentException("unknown mode");
        }
    }

    /** 验证加载不等于初始化，以及初始化错误在同一加载器内不自动重试。 */
    private static void initialize() throws ClassNotFoundException {
        Class.forName("RuntimeLab$Child", false, RuntimeLab.class.getClassLoader());
        System.out.println("loaded");
        System.out.println("value=" + Child.VALUE);
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                System.out.println(Broken.VALUE);
            } catch (LinkageError failure) {
                System.out.println(failure.getClass().getSimpleName());
            }
        }
    }

    /** 用无应用父加载器的两个加载器证明同名类具有不同运行时身份。 */
    private static void identity() throws Exception {
        URL[] locations = {Path.of("out").toUri().toURL()};
        try (var first = new URLClassLoader(locations, null);
             var second = new URLClassLoader(locations, null)) {
            Class<?> left = first.loadClass("OrderMath");
            Class<?> right = second.loadClass("OrderMath");
            System.out.println("sameName=" + left.getName().equals(right.getName()));
            System.out.println("sameClass=" + (left == right));
            System.out.println("assignable=" + left.isAssignableFrom(right));
        }
    }

    /** @param name 初始化来源，用于顺序输出。 @return 非常量值 1。 */
    private static int marker(String name) {
        System.out.println(name);
        return 1;
    }

    /** 模拟父类初始化。 */
    private static class Parent {
        static final int PARENT_VALUE = marker("parent");
    }

    /** 模拟子类主动使用触发的初始化。 */
    private static final class Child extends Parent {
        static final int VALUE = marker("child");
    }

    /** 模拟不能完成初始化的类。 */
    private static final class Broken {
        static final int VALUE = fail();

        /** 必然抛出异常，使类进入初始化错误状态。 */
        private static int fail() {
            throw new IllegalStateException("invalid static configuration");
        }
    }
}
```

:::

保存为 `OrderMath.java`：

::: details 查看 OrderMath.java 完整代码

```java [OrderMath.java]
/** 提供可反汇编和预热的订单金额计算，不包含外部状态。 */
public final class OrderMath {
    /** 禁止实例化无状态计算工具。 */
    private OrderMath() { }

    /**
     * @param priceCents 单价分，必须非负。
     * @param quantity 数量，必须为正数。
     * @return 精确金额分；非法输入或溢出时抛出异常。
     */
    public static long total(long priceCents, int quantity) {
        if (priceCents < 0 || quantity < 1) {
            throw new IllegalArgumentException("invalid order amount");
        }
        return Math.multiplyExact(priceCents, quantity);
    }
}
```

:::

使用 UTF-8 编译本篇文件：

```powershell
javac -encoding UTF-8 --release 21 -Xlint:all -Werror -d out RuntimeLab.java OrderMath.java
```


```powershell
java -cp out RuntimeLab init
```

实际输出包含初始化正常路径和同一错误类的两次访问：

```text
loaded
parent
child
value=1
ExceptionInInitializerError
NoClassDefFoundError
```

`loaded` 在父子初始化标记之前，说明加载与初始化不同。`Broken` 首次初始化抛出普通异常，被包装为 `ExceptionInInitializerError`；再次主动使用发现类已处于错误状态，得到 `NoClassDefFoundError`。

::: warning 保留首次失败
第二次出现的 `NoClassDefFoundError` 不一定表示 JAR 缺失。若原因是初始化错误，应回查首次失败的完整原因链；在同一加载器中重复调用不会自动重跑失败的初始化。
:::


## 三、加载器身份

### 1. 同名不等于同类

运行时类型身份由二进制名称和定义它的加载器共同决定。插件系统中的两个 `Order` 即使源码和全限定名一致，也可能不能互相赋值。

上方程序的 `identity` 模式创建两个隔离的 `URLClassLoader`，从同一 `out` 加载 `OrderMath`，并在结束时关闭加载器。执行及实际结果如下：

```powershell
java -cp out RuntimeLab identity
```

```text
sameName=true
sameClass=false
assignable=false
```


### 2. 委派与可见性

HotSpot 的常见应用加载器结构包含引导、平台和应用加载器。父优先委派有助于复用共同基础类型，自定义加载器和框架可以有不同策略，不能把某一种委派写成所有 JVM 的唯一加载方式。

插件需要共享接口时，应让双方通过共同可见的加载器使用同一接口类型；不要各自打包一份接口，再尝试强制类型转换。线程上下文加载器还可能影响服务发现，排障时需记录实际使用者。

## 四、失败定位

| 现象 | 优先检查 | 处理方向 |
|------|----------|----------|
| `ClassNotFoundException` | 显式加载的名称、搜索路径 | 修正加载范围 |
| `NoClassDefFoundError` | 链接依赖与首次初始化异常 | 补依赖或修复初始化原因 |
| `NoSuchMethodError` | 编译依赖与运行依赖版本 | 对齐签名和最终产物 |
| 同名类型转换失败 | 类的定义加载器 | 统一共享类型边界 |

类能否卸载还取决于加载器及相关对象是否不再被保留。缓存、线程上下文加载器和线程本地值都可能延长其生命周期；关闭 JAR 文件句柄不等于立即卸载全部类。

## 五、参考资料

- [JVMS 21 加载与链接](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html)
- [JLS 21 类初始化](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.4)
- [ClassLoader API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassLoader.html)

以上资料说明类型身份与初始化错误状态。
