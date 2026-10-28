---
title: "异常捕获与传播"
tags:
  - Java
  - Exception
excerpt: "解释 try、catch、finally 的匹配与控制转移，沿订单导入调用链观察根因保留和收尾顺序，用返回值覆盖、清理异常与编译错误说明捕获位置和恢复策略的边界。"
date: 2026-09-08
---

# 异常捕获与传播 {#异常捕获、传播与处理策略}

异常处理把失败从发生位置交给具备处理能力的边界。捕获后正常结束、原样重抛、包装为另一异常和返回替代结果，会产生不同控制流；它们都必须对应明确的业务含义，不能统一视为“异常已处理”。

## 一、catch 按类型从左到右匹配

try 中抛出异常后，不再执行该路径尚未完成的普通语句，而是查找当前 try 的匹配 catch。按声明顺序选择第一个可接受该异常运行时类型的分支；子类型应位于父类型之前。

catch 内再次抛出的异常不会继续交给同一组后面的 catch，而是先经过当前 finally，再向外层寻找处理器。若本层没有匹配分支，也先按规则执行 finally，再继续传播。

::: tip 按处理语义决定是否合并 catch

multi-catch 用 `|` 合并共享处理逻辑的异常类型。同一组不能包含父子类型，参数不能重新赋值。减少重复代码不是合并的充分理由：输入错误与外部I/O错误即便暂时都只打印消息，重试、日志和对外响应仍可能需要不同策略。[Java 21 try 语句](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20)

:::

## 二、传播、重抛与转换的边界

在当前层没有恢复动作时，直接传播往往比“捕获、打印、再抛出”清楚。包装异常用于改变边界语义，例如把读取失败转成某笔订单导入失败，同时通过 cause 保留底层信息。

| 动作 | 控制流结果 | 需要回答的问题 |
|------|------------|----------------|
| catch 正常结束 | 当前 try-catch 继续完成 | 失败是否已经产生明确结果，还是被静默吞掉 |
| throw 同一异常对象 | 原失败继续向外传播 | 本层是否确实有必须执行的附加动作 |
| 创建新异常并保留 cause | 调用方看到新的边界语义 | 是否增加了有用上下文，而不是重复包装 |
| 只复制原消息 | 原因链断开 | 应改用接收 cause 的构造器 |
| 返回空集合或0 | 失败被转换为普通值 | 是否会与真正的空结果或零金额混淆 |

::: warning 内部异常证据不能直接作为公开响应

本例用 IllegalStateException 包装模拟I/O失败，专门验证传播；稳定业务错误码和对外响应由[自定义异常与错误设计](./03-custom-error-design.md)负责。底层异常对象和公开响应应分开处理，不能直接把完整cause或堆栈返回给外部调用方。

:::

## 三、finally 可以改变最终结果

### 1. 正常收尾保留已求出的返回值

return 会先求值返回表达式，再执行 finally。finally 正常完成时，已经选定的返回结果继续返回；修改局部int变量不会改变之前求出的数值。若返回的是对象引用，finally 对同一个对象内容的修改仍可能被调用方观察到，不能把基本类型示例外推成深度快照。

判断结果时应区分“更换局部变量保存的值”和“修改已返回引用指向的对象”。前者不会重新计算 return 表达式，后者改变的是调用方随后读取的共享对象。清理代码应围绕资源释放，避免承担这类隐蔽的业务结果修改。

### 2. finally 的控制转移 {#_2-突然完成的-finally-覆盖原控制转移}

finally 自己执行 return 或 throw 时，会替换原先的返回或抛出原因。这是语言规则，不是自动附加一个清理失败：手写 finally 抛出的新异常不会自动把旧异常放进cause或suppressed。[finally 控制转移](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.2)

| 原路径 | finally 的行为 | 最终结果 |
|--------|----------------|----------|
| return 1 | 修改局部value为2后正常结束 | 返回已经选定的1 |
| 抛IOException | 正常结束 | 继续抛IOException |
| 抛IOException | return 99 | 异常被丢弃，调用方得到99 |
| 抛IOException | 抛新IllegalStateException | 新异常替换原失败，除非手工保留原因 |

::: info finally 不提供进程故障恢复能力

finally 是语言控制流保证的一部分，不是进程强制终止、JVM退出或硬件故障下的恢复系统。管理AutoCloseable资源应优先使用[try-with-resources](./04-resource-lifecycle.md)，不要用 finally 返回来“确保任务有结果”。

:::

## 四、订单导入调用链完整验证

保存为 `ExceptionPropagationDemo.java`，使用JDK 21独立编译。事件只写内存列表，故障是明确的本地模拟；两个覆盖方法故意展示错误写法。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看ExceptionPropagationDemo的完整代码

```java
// ExceptionPropagationDemo.java
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/** 验证栈展开、cause与finally控制转移，不执行真实订单导入。 */
public final class ExceptionPropagationDemo {
    /** 仅提供静态入口。 */
    private ExceptionPropagationDemo() {}

    /**
     * 执行正常对照或故意传播失败；无返回值，打印可核对的事件。
     * @param args 空参数正常；propagate、finally-throws为故障模式
     * @throws IOException 在未被覆盖的演示路径上传播读取失败
     */
    public static void main(String[] args) throws IOException {
        List<String> events = new ArrayList<>();
        if (args.length > 0) {
            switch (args[0]) {
                case "propagate" -> importOrder(events);
                case "finally-throws" -> cleanupOverrides(true);
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        try {
            importOrder(events);
        } catch (IllegalStateException error) {
            events.add("boundary");
            assert error.getCause() instanceof IOException;
            System.out.println("cause=" + error.getCause().getClass().getSimpleName());
        }
        assert events.equals(List.of("read", "wrap", "finally", "boundary"));
        int selected = returnBeforeFinally(events);
        int masked = returnMasksFailure(true);
        assert selected == 1 && masked == 99;
        try {
            cleanupOverrides(true);
        } catch (IllegalStateException error) {
            assert error.getCause() == null;
            System.out.println("cleanup cause=" + error.getCause());
        }
        System.out.println("events=" + events);
        System.out.println("selected return=" + selected + ", masked failure=" + masked);
    }

    /**
     * 在应用边界包装模拟读取失败，同时记录finally先于外层catch执行。
     * @param events 非null且可修改的本地事件列表
     * @throws IllegalStateException 导入失败，cause保留IOException；无返回值
     */
    private static void importOrder(List<String> events) {
        try {
            events.add("read");
            throw new IOException("simulated order read failure");
        } catch (IOException error) {
            events.add("wrap");
            throw new IllegalStateException("import ORD-1001 failed", error);
        } finally {
            events.add("finally");
        }
    }

    /**
     * 证明返回表达式先求值，finally修改局部变量不替换已选定的int结果。
     * @param events 非null可修改列表，用于记录收尾动作
     * @return 1；副作用是在返回前添加finally:value=2事件
     */
    private static int returnBeforeFinally(List<String> events) {
        int value = 1;
        try {
            return value;
        } finally {
            value = 2;
            events.add("finally:value=" + value);
        }
    }

    /**
     * 故意在finally返回，展示失败被静默覆盖的错误写法。
     * @param override true覆盖异常；false继续传播IOException
     * @return 仅override为true时返回99，该值不代表导入成功
     * @throws IOException 未覆盖时的模拟导入失败
     */
    private static int returnMasksFailure(boolean override) throws IOException {
        try {
            throw new IOException("original import failure");
        } finally {
            if (override) {
                return 99;
            }
        }
    }

    /**
     * 故意让清理异常替换主异常且丢失cause；无返回值。
     * @param failCleanup true再抛出清理异常，false保留原IOException
     * @throws IOException 清理正常时传播原异常
     * @throws IllegalStateException 清理故障覆盖原异常，供反例观察
     */
    private static void cleanupOverrides(boolean failCleanup) throws IOException {
        try {
            throw new IOException("original import failure");
        } finally {
            if (failCleanup) {
                throw new IllegalStateException("cleanup replaced original failure");
            }
        }
    }
}
```

:::

在本篇示例目录执行以下PowerShell命令：

```powershell
javac -encoding UTF-8 -Xlint:all -Xdoclint:all,-missing -Werror -d out ExceptionPropagationDemo.java
java -ea -cp out ExceptionPropagationDemo
```

Corretto 21.0.11实测输出如下。正常入口主动捕获预设失败以核对规则，不代表导入真的成功。

```text
cause=IOException
cleanup cause=null
events=[read, wrap, finally, boundary, finally:value=2]
selected return=1, masked failure=99
```

read、wrap、finally、boundary的顺序证明收尾动作先于外层catch完成；cause仍为IOException。反例中的cleanup cause为null，说明单纯重新抛出清理异常不会自动保留原始读取失败。

## 五、错误入口与编译诊断

### 1. 运行时传播与主失败被覆盖

分别运行两个故障入口，均已实测非零退出。propagate包含IllegalStateException及其IOException原因；finally-throws只留下清理异常，没有原IOException原因链。

```powershell
java -ea -cp out ExceptionPropagationDemo propagate
java -ea -cp out ExceptionPropagationDemo finally-throws
```

对于propagate，应在有恢复能力的调用边界处理，或让任务明确失败。对于finally-throws，应消除会覆盖主失败的清理策略；可关闭资源使用try-with-resources，其他清理逻辑也须显式决定主次异常，而不是靠catch Throwable吞掉错误。

### 2. 编译时捕获顺序与类型组合错误

下面两份独立文件用于验证捕获声明错误。第一份保存为 `InvalidCatchOrder.java`，父类型捕获使后续子类型分支不可达：

::: details 查看InvalidCatchOrder的完整代码

```java
// InvalidCatchOrder.java
/** 故意把父类catch放在子类之前。 */
class InvalidCatchOrder {
    /** 本文件预期无法编译，较具体的catch不可达；无返回值。 */
    static void parseOrder() {
        try {
            Integer.parseInt("invalid");
        } catch (IllegalArgumentException error) {
            System.out.println("invalid input");
        } catch (NumberFormatException error) {
            System.out.println("invalid number");
        }
    }
}
```

:::

第二份保存为 `InvalidMultiCatch.java`，IOException与FileNotFoundException有继承关系，不能置于同一multi-catch：

::: details 查看InvalidMultiCatch的完整代码

```java
// InvalidMultiCatch.java
import java.io.FileNotFoundException;
import java.io.IOException;

/** 故意把父子异常合并在同一multi-catch。 */
class InvalidMultiCatch {
    /** 本文件预期无法编译，类型分支存在继承关系；无返回值。 */
    static void readOrder() {
        try {
            throw new FileNotFoundException("orders.csv");
        } catch (IOException | FileNotFoundException error) {
            System.out.println("read failed");
        }
    }
}
```

:::

分别编译，每份实测产生1处编译错误。修正时根据处理语义重排catch，或保留所需的单一父类型，而不是只改成无差别的Exception捕获。

```powershell
javac "-J-Duser.language=en" -encoding UTF-8 -d out InvalidCatchOrder.java
javac "-J-Duser.language=en" -encoding UTF-8 -d out InvalidMultiCatch.java
```

## 六、恢复策略属于业务决定

捕获位置应靠近能够作出处理决定的边界：单条导入记录不合法，可以登记失败并继续处理其他记录；全量导入的核心配置缺失，则不应继续产生半真半假的成功统计。应明确每条记录或整批操作的原子性范围。

::: warning 外部写入状态不明时不能盲目重试

重试还需要次数上限、时间预算、幂等性和失败可观察性。异常发生时不知道外部写入是否已经完成，盲目重试会带来重复操作。InterruptedException还涉及协作取消，不能简单捕获后忽略；详细任务取消语义由并发章承担。

:::

本例验证了同步调用栈、原因链和finally控制转移，没有执行实际事务、重试系统或线程取消，因此不能据此认定生产导入具备回滚能力。
