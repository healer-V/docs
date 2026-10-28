---
title: "JAR 与模块系统"
tags: [Java, JAR, JPMS]
excerpt: "区分 JAR、类路径和模块路径，解释 requires、exports 与 opens，通过两个命名模块验证打包运行和反射访问失败，说明普通 JAR 与模块化迁移的边界。"
date: 2026-09-11
---


# JAR 与模块系统

JAR 是类文件、资源与元数据的归档格式；Java 模块系统 JPMS 在包之上声明依赖与封装。相同 JAR 放在类路径和模块路径上，参与的访问模型可能不同。


## 一、JAR 与启动入口

普通 JAR 可以作为库进入类路径。可执行 JAR 通过 `META-INF/MANIFEST.MF` 中的 `Main-Class` 指定启动入口，但不会自动包含所有第三方依赖。

需要外部库的应用可以把依赖放在 `lib/`，再由 Manifest 的 `Class-Path` 引用这些 JAR。`java -jar` 模式下不能指望另加普通 `-cp` 修复缺失依赖，应检查 Manifest 或选择显式类路径启动。

本文后面的两个模块只使用 JDK 标准 API。保存源码、编译并打包后，可以分别观察 JAR 内容和模块描述符，不需要先构建其他应用。真实部署中若漏带业务依赖 JAR，类路径查找或模块解析都会失败。

## 二、类路径与模块路径

| 对象 | 类路径 `--class-path` | 模块路径 `--module-path` |
|------|---------------------|-------------------------|
| 普通 JAR | 所属类加载器的未命名模块 | 作为自动模块解析 |
| 含 `module-info.class` 的 JAR | 描述符不按命名模块方式生效 | 作为显式命名模块解析 |
| 依赖 | 类路径中查找类型 | 模块图、可读性与导出包共同约束 |
| 深反射 | 仍受 Java 与目标模块访问限制 | 还需目标包满足开放条件 |

自动模块名优先使用 `Automatic-Module-Name`，否则从文件名推导。库重命名可能改变后者，因此自动模块适合作为迁移过渡，不能把偶然文件名当作稳定 API。

## 三、模块声明与封装

### 1. 可读性与导出

模型模块导出公开 API，入口模块声明读取它。下方完整示例会将两个描述符保存在各自的模块源码根，关键声明如下：

```java
// order.model/module-info.java
module order.model {
    exports order.model;
}
```

```java
// order.cli/module-info.java
module order.cli {
    requires order.model;
}
```

`requires` 建立读取关系，`exports` 允许其他模块访问指定包中的公开类型。`requires transitive` 把可读性继续传给消费者，适合公开签名确实暴露依赖类型的情况；`requires static` 表示编译需要而运行解析可以缺少，不能让实际执行到缺失类型的代码自动安全。


### 2. 深反射开放

`exports` 不开放私有字段。需要深反射时使用 `opens 包名 to 调用模块`，限定开放对象；`open module` 开放范围更广，不宜为修复一个字段访问就作为长期默认配置。

示例中的 `OrderLabel` 公开 `status()`，私有字段仍不可直接反射访问。入口的局部逻辑如下，省略导入和 `main`，完整源码在下方：

```java
OrderLabel label = new OrderLabel();
Field field = OrderLabel.class.getDeclaredField("status");
field.setAccessible(true);
System.out.println(field.get(label));
```


## 四、编译、打包与验证


### 1. 命名模块启动

安装 JDK 21，新建空目录。按下方路径建立两组模块目录并保存 UTF-8 文件；`src/` 是本篇新建的模块源码根。

将以下内容保存为 `src/order.model/module-info.java`：

```java [src/order.model/module-info.java]
/** 导出可供入口调用的订单模型，不开放私有字段反射。 */
module order.model {
    exports order.model;
}
```

将以下内容保存为 `src/order.model/order/model/OrderLabel.java`：

::: details 查看 OrderLabel.java 完整内容

```java [src/order.model/order/model/OrderLabel.java]
package order.model;


/** 提供可读状态与私有字段，用于区分 exports 和 opens。 */
public final class OrderLabel {
    private final String status = "READY";

    /** 创建固定演示状态，无外部副作用。 */
    public OrderLabel() {
    }

    /** 返回对外公开的订单状态，不修改对象。 */
    public String status() {
        return status;
    }
}
```

:::

将以下内容保存为 `src/order.cli/module-info.java`：

```java [src/order.cli/module-info.java]
/** 声明命令行入口读取订单模型模块。 */
module order.cli {
    requires order.model;
}
```

将以下内容保存为 `src/order.cli/order/cli/OrderCli.java`：

::: details 查看 OrderCli.java 完整内容

```java [src/order.cli/order/cli/OrderCli.java]
package order.cli;

import order.model.OrderLabel;
import java.lang.reflect.Field;

/** 观察命名模块正常调用与深反射的不同访问边界。 */
public final class OrderCli {
    /** 禁止实例化工具入口，无外部副作用。 */
    private OrderCli() {
    }

    /**
     * 输出模块与状态；带参数时尝试深反射，失败直接传播；无返回值。
     * @param args 无参数为公开调用；带 reflect 参数为受控封装错误
     * @throws ReflectiveOperationException 私有字段发现或访问失败
     */
    public static void main(String[] args) throws ReflectiveOperationException {
        OrderLabel label = new OrderLabel();
        System.out.println("module=" + OrderCli.class.getModule().getName());
        if (args.length == 0) {
            System.out.println("status=" + label.status());
        } else {
            Field field = OrderLabel.class.getDeclaredField("status");
            field.setAccessible(true);
            System.out.println("status=" + field.get(label));
        }
    }
}
```

:::

四份文件保存完成后，在新建目录编译并运行：

```powershell
javac --release 21 -encoding UTF-8 -d out --module-source-path src -m order.model,order.cli
java --module-path out -m order.cli/order.cli.OrderCli
```

预期输出为：

```text
module=order.cli
status=READY
```

这证明模块图已解析，入口可以通过公开 API 读取状态。下面创建两个独立模块 JAR，`jar --describe-module` 应显示模型的导出包与入口的依赖：

```powershell
New-Item -ItemType Directory -Force dist
jar --create --file dist/order-model.jar -C out/order.model .
jar --create --file dist/order-cli.jar --main-class order.cli.OrderCli -C out/order.cli .
jar --describe-module --file dist/order-cli.jar
java --module-path dist -m order.cli
```


### 2. 反射失败与限定开放

保持模型描述符不变，在相同目录触发深反射：

```powershell
java --module-path dist -m order.cli reflect
```

进程应以 `InaccessibleObjectException` 失败，错误说明模型模块没有向入口开放该包。字段存在和类可见不等于私有成员可被访问。

下列命令只为当前演示精确开放一个包，输出恢复为 `status=READY`：

```powershell
java --module-path dist --add-opens order.model/order.model=order.cli -m order.cli reflect
```

::: warning 访问开放的范围
`--add-opens` 是兼容或诊断手段，会放宽运行时封装。自有模块应先评估公开 API 或限定 `opens`；不能长期用全局开放替代依赖升级和边界设计。
:::


## 五、模块迁移边界

一个包分散到多个命名模块中可能导致解析或可读性冲突。迁移时先核对 JAR 中的包、模块名和依赖图，再处理内部 API 与深反射，不能只给每个 Maven 模块添加描述符。

`jdeps` 可以分析静态依赖，但无法完整推断拼接类名、配置驱动加载和全部反射行为。`ServiceLoader` 的命名模块消费方使用 `uses`，提供方使用 `provides ... with ...`；它解耦实现发现，也需要验证真实提供者是否随制品发布。

## 六、参考资料

- [JAR 规范](https://docs.oracle.com/en/java/javase/21/docs/specs/jar/jar.html)
- [模块声明](https://docs.oracle.com/javase/specs/jls/se21/html/jls-7.html#jls-7.7)
- [`java` 启动器](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)

以上资料分别定义归档、封装和运行参数。
