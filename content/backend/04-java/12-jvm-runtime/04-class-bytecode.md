---
title: "Class 文件与字节码"
tags: [Java, 字节码, javap]
excerpt: "使用订单金额方法的真实反汇编结果解释 Class 版本、常量池、方法描述符、局部变量槽和指令控制流，区分泛型签名、调试信息与运行时链接错误。"
date: 2026-09-10
---


# Class 文件与字节码

Class 文件是 JVM 接收的二进制格式，描述类身份、继承关系、字段、方法和属性。字节码只是其中方法 `Code` 属性的一部分，文件还包含链接与验证需要的元数据。


## 一、文件结构

| 部分 | 作用 | 阅读时的重点 |
|------|------|--------------|
| 魔数与版本 | 识别格式和最低运行能力 | Java 21 普通 Class 的主版本为 65 |
| 常量池 | 字符串、类型和成员等符号信息 | 索引指向哪个类或方法 |
| 类与成员表 | 类关系、字段和方法声明 | 名称、访问标记、描述符 |
| 属性 | 代码、签名、注解和调试信息等 | 信息是否存在、由谁消费 |

常量池里的方法引用通常先以符号表达，再按链接规则解析；它不是一张预先填好全部机器地址的表。编译产物包含什么，必须检查实际文件，不能只看源码注解或编译选项名称。


## 二、反汇编订单方法

`OrderMath.java` 的 `total` 校验单价非负、数量为正，再调用 `Math.multiplyExact` 返回金额分。使用 JDK 21，在该目录执行：

在任意位置新建空目录，使用 JDK 21，将下面的文件保存到该目录。后续命令均在此目录执行。

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
javac -encoding UTF-8 --release 21 -Xlint:all -Werror -d out OrderMath.java
```


```powershell
javap -classpath out -c -s -verbose OrderMath
```


### 1. 描述符与槽位

实际输出中与签名有关的字段如下：

```text
major version: 65
public static long total(long, int);
  descriptor: (JI)J
  flags: (0x0009) ACC_PUBLIC, ACC_STATIC
  Code:
    stack=4, locals=3, args_size=2
```

描述符中 `J` 表示 `long`、`I` 表示 `int`，括号前后分别是参数和返回类型。两个参数占三个局部变量槽位，不能根据 `args_size=2` 推断 `locals` 也必须等于 2。

泛型的 `Signature` 属性与描述符承担不同职责。类型擦除后的描述符服务于调用链接，泛型信息可供编译器和反射读取；是否保留某项元数据还受编译与后处理工具影响。


### 2. 指令与分支

校验通过后的完整返回路径是以下四条实际指令，之前的分支跳向偏移 21：

```text
21: lload_0
22: iload_2
23: invokestatic  #14  // Method java/lang/Math.multiplyExact:(JI)J
26: lreturn
```

`lload_0` 和 `iload_2` 把两个局部值压入操作数栈，`invokestatic` 消费参数并得到结果，`lreturn` 将 `long` 返回调用者。指令偏移是字节码位置，不是源码行号。

非法输入走 `new`、构造器调用和 `athrow` 路径；乘法溢出则由被调用方法抛出异常。这两条失败路径不能因为最终都“没有返回金额”而合并成同一个原因。


## 三、调用与验证

| 指令 | 常见用途 | 需要避免的简化 |
|------|----------|----------------|
| `invokestatic` | 静态方法 | 静态绑定不等于无需加载与初始化 |
| `invokevirtual` | 实例虚方法 | 实际执行仍可能被 JIT 内联 |
| `invokeinterface` | 接口调用 | 接口不是固定增加一次远程跳转 |
| `invokespecial` | 构造器等特殊调用 | 不等同于所有实例方法调用 |
| `invokedynamic` | 按引导协议建立调用点 | 不等同于反射调用 |

验证器会检查类型、控制流和栈状态等约束。随意修改字节码可能触发 `VerifyError`，更新依赖后签名不兼容则可能产生 `NoSuchMethodError`；两者应按发生阶段分别处理。

::: warning 反编译结果不是原始源码
反编译器根据产物重建可读表达，不能恢复所有局部名称、注释和写法。判断编译目标与方法链接时，保留 `javap` 输出作为更直接的证据。
:::


## 四、版本与调试信息

较旧 JVM 无法加载高于其支持范围的普通 Class，单独修改文件头不能消除新指令、API 和验证差异。应使用适当的 `--release` 编译，并在目标运行时执行测试。

源码行号、局部变量名和方法参数名也是不同信息。异常栈中的行号依赖相应调试信息；需要反射读取真实参数名时，应检查 `-parameters` 与 `MethodParameters`，不能用“带调试信息”笼统代替。

::: tip 检查实际交付物
分析时对最终 JAR 中的类反汇编。源码、IDE 缓存与部署产物可能不一致，只有对应版本的产物能解释当前链接失败。
:::

## 五、参考资料

- [JVMS 21 Class 格式](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html)
- [指令集](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html)
- [javap 命令](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javap.html)

以上资料是结构与反汇编的依据。
