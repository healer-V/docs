---
title: "资源管理与自动关闭"
tags:
  - Java
  - IO
excerpt: "说明资源所有权、AutoCloseable 与 try-with-resources 的关闭规则，通过可运行程序观察初始化失败、逆序关闭、主异常和 suppressed 异常，避免资源泄漏和诊断信息丢失。"
date: 2026-09-08
---

# 资源管理与自动关闭 {#资源生命周期与-try-with-resources}

资源生命周期描述资源何时获得、由谁使用、何时释放。文件句柄、套接字和响应流占用的资源并不等同于普通堆内存；失去 Java 引用不能作为及时释放它们的保证。订单导入即使读取失败，也需要关闭已经成功打开的输入流。

## 一、明确资源所有权

创建资源的方法通常负责关闭，除非 API 明确将所有权交给调用方。接收外部传入的流时，不能凭借“方法已经执行完”就自动关闭，否则会破坏调用方后续操作。

| API 形态 | 应明确的契约 | 常见错误 |
|------|------|------|
| 方法内部打开文件并返回解析结果 | 返回前关闭文件 | 只在成功分支关闭 |
| 方法返回打开的响应流 | 调用方负责关闭 | 以为返回对象后服务端自动释放本地连接资源 |
| 方法接收调用方的流 | 约定是否借用，借用时不关闭 | 工具方法擅自关闭共享输出 |
| 外层流包装底层流 | 按包装类契约管理完整链路 | 关闭顺序错误或丢失初始化中途获得的底层资源 |

::: info AutoCloseable 不保证关闭幂等性

`AutoCloseable` 为 try-with-resources 提供关闭入口，其 `close()` 可以声明受检异常，具体实现可以收窄。它不强制重复关闭无副作用；`Closeable` 则约定已关闭的流再次关闭不产生效果。不能由“实现了 AutoCloseable”推导出线程安全或幂等性。[AutoCloseable](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html)、[Closeable](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Closeable.html)

:::

## 二、初始化与关闭的执行规则

### 1. 成功获得的资源按逆序关闭

try-with-resources 从左到右初始化资源，离开主体时从右到左关闭成功初始化且不为 null 的资源。主体正常结束、return 或抛出异常都会触发这套关闭流程。Java 21 也允许将已有的 final 或 effectively final 资源变量放入资源列表。

例如先获得 A，再用 A 创建 B，逆序关闭可以让 B 先完成依赖 A 的收尾。若 B 初始化失败，主体不会开始，但已经获得的 A 仍进入关闭流程；未成功取得的 B 不会作为资源列表中的对象调用 close。

::: warning 构造失败前取得的资源仍需负责释放

如果 B 的构造方法内部已经打开了其他资源，却在返回前失败，外层 try 不会自动取得那个未返回的 B 对象并关闭它。构造或工厂内部必须对自己已经取得的部分资源负责。这与“成功初始化的 A 会被关闭”是两个不同的责任边界。[JLS 21：try-with-resources](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.3)

:::

### 2. 主失败与关闭失败分别保留

关闭失败不会使更早获得的资源跳过关闭。多个异常需要区分主异常与伴随异常，否则订单读取错误容易被关闭错误掩盖。

| 失败位置 | 最终传播的主异常 | suppressed 内容 |
|------|------|------|
| 主体失败，关闭成功 | 主体异常 | 无 |
| 主体失败，B 和 A 关闭均失败 | 主体异常 | B 关闭异常、A 关闭异常 |
| 主体成功，B 和 A 关闭均失败 | B 关闭异常 | A 关闭异常 |
| B 初始化失败，A 关闭失败 | B 初始化异常 | A 关闭异常 |

## 三、观察主异常与关闭顺序

以下完整程序使用 Java 21，在内存事件列表中模拟资源状态。它证明语言层面的执行顺序和异常保留规则；真实文件与网络资源是否成功释放仍取决于具体实现。示例的 close 先标记已释放再报告错误，重复关闭只处理一次。

保存为 `ResourceLifecycleDemo.java`：

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看ResourceLifecycleDemo的完整代码

```java
// ResourceLifecycleDemo.java
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/** 用可观察资源验证初始化、关闭和异常保留顺序，不占用真实文件句柄。 */
public final class ResourceLifecycleDemo {
    /** 禁止实例化命令行示例。 */
    private ResourceLifecycleDemo() {}

    /** 记录一次资源的使用与释放；幂等关闭是本实现额外提供的契约。 */
    private static final class Resource implements AutoCloseable {
        private final String name;
        private final List<String> events;
        private final boolean failClose;
        private boolean closed;

        /**
         * 创建已成功获得的模拟资源。
         * @param name 非空资源标识
         * @param events 当前场景独占、非空的事件列表
         * @param failClose 是否在释放状态完成后报告关闭错误
         */
        private Resource(String name, List<String> events, boolean failClose) {
            this.name = name;
            this.events = events;
            this.failClose = failClose;
            events.add("open:" + name);
        }

        /** 使用已打开资源；关闭后拒绝操作，无返回值。 */
        private void use() {
            if (closed) {
                throw new IllegalStateException("closed:" + name);
            }
            events.add("use:" + name);
        }

        /** 标记释放并记录一次关闭；本例重复关闭无副作用，无返回值。 */
        @Override
        public void close() throws IOException {
            if (!closed) {
                closed = true;
                events.add("close:" + name);
                if (failClose) {
                    throw new IOException("close:" + name);
                }
            }
        }
    }

    /**
     * 模拟资源初始化，失败分支尚未取得任何资源。
     * @param name 非空资源标识
     * @param events 当前场景独占的非空事件列表
     * @param failOpen true表示在返回资源前失败
     * @param failClose true表示资源关闭后报告错误
     * @return 成功获得的资源；初始化失败时抛出IOException
     */
    private static Resource open(String name, List<String> events,
                                 boolean failOpen, boolean failClose) throws IOException {
        if (failOpen) {
            events.add("open-failed:" + name);
            throw new IOException("open:" + name);
        }
        return new Resource(name, events, failClose);
    }

    /**
     * 执行双资源场景，刻意使多个阶段失败以观察语言规则。
     * @param mode normal、body-close、close-only或init-failure
     * @param events 非空事件列表，调用后包含初始化、使用和关闭事件
     */
    private static void scenario(String mode, List<String> events) throws IOException {
        boolean failClose = !mode.equals("normal");
        try (Resource first = open("A", events, false, failClose);
             Resource second = open("B", events, mode.equals("init-failure"), failClose)) {
            first.use();
            second.use();
            if (mode.equals("body-close")) {
                throw new IOException("body");
            }
        }
    }

    /** 执行正常及组合失败观察；指定参数时让对应异常离开入口。 */
    public static void main(String[] args) throws IOException {
        if (args.length > 0) {
            if (args[0].equals("use-after-close")) {
                Resource resource = open("A", new ArrayList<>(), false, false);
                resource.close();
                resource.use();
            } else {
                scenario(args[0], new ArrayList<>());
            }
            return;
        }
        for (String mode : List.of("normal", "body-close", "close-only", "init-failure")) {
            List<String> events = new ArrayList<>();
            try {
                scenario(mode, events);
                assert mode.equals("normal");
                System.out.println(mode + ": " + events);
            } catch (IOException failure) {
                List<String> suppressed = new ArrayList<>();
                for (Throwable secondary : failure.getSuppressed()) {
                    suppressed.add(secondary.getMessage());
                }
                String primary = mode.equals("body-close") ? "body"
                        : mode.equals("close-only") ? "close:B" : "open:B";
                assert failure.getMessage().equals(primary);
                assert suppressed.equals(mode.equals("init-failure")
                        ? List.of("close:A") : List.of("close:B", "close:A").subList(
                                mode.equals("close-only") ? 1 : 0, 2));
                System.out.println(mode + ": primary=" + failure.getMessage()
                        + ", suppressed=" + suppressed + ", events=" + events);
            }
        }
    }
}
```

:::

在本篇示例目录执行以下 PowerShell 命令。启用断言后，主异常或 suppressed 顺序不符合预期会直接失败：

```powershell
javac -encoding UTF-8 -d out ResourceLifecycleDemo.java
java -ea -cp out ResourceLifecycleDemo
```

实际输出中，init-failure 没有 use 事件，也没有 close:B，因为 B 从未初始化成功：

```text
normal: [open:A, open:B, use:A, use:B, close:B, close:A]
body-close: primary=body, suppressed=[close:B, close:A], events=[open:A, open:B, use:A, use:B, close:B, close:A]
close-only: primary=close:B, suppressed=[close:A], events=[open:A, open:B, use:A, use:B, close:B, close:A]
init-failure: primary=open:B, suppressed=[close:A], events=[open:A, open-failed:B, close:A]
```

## 四、从失败输出判断资源问题

下面三条命令应分别执行，每条都预期以非零退出码结束。它们展示异常离开调用入口时的真实形式：

```powershell
java -ea -cp out ResourceLifecycleDemo body-close
java -ea -cp out ResourceLifecycleDemo init-failure
java -ea -cp out ResourceLifecycleDemo use-after-close
```

| 参数 | 观察到的异常 | 原因与处理 |
|------|------|------|
| body-close | IOException: body，堆栈包含两项 Suppressed | 主体失败后关闭也失败；记录完整异常对象，不只记录 message |
| init-failure | IOException: open:B，包含 close:A 的 Suppressed | B 初始化未完成；检查 B 的初始化原因，同时保留 A 释放时的证据 |
| use-after-close | IllegalStateException: closed:A | 使用期已经结束；调整调用顺序或重新获得独立资源 |

::: warning cause 与 suppressed 不能互相替代

`cause` 表示异常的因果链，`suppressed` 保存同一次控制流中被保留的次要失败。两者不能互相替代：把所有关闭失败设置为 cause 会混淆原始故障与清理故障。异常转换时如何保存原因见[异常捕获与传播](./02-catching-propagation.md)。

:::

## 五、释放资源与持久化结果的边界

自动调用 close 不等于文件已满足业务持久化要求，也不等于远端请求已经成功。缓冲流的 flush、文件系统持久化和网络协议确认属于不同层次；关闭失败必须根据对应 API 和业务状态判断是否需要重试，不能盲目重放一笔订单写入。

::: tip 把资源关闭责任放在明确的所有者处

资源应在最后一次使用后尽快释放。把大量打开的流保存进集合，等整个导入任务完成后再关闭，会让资源数量随批次增长。若返回惰性结果仍依赖打开的文件，必须把关闭责任暴露给调用方；如果只返回已经解析完成的不可变数据，则应在方法内部关闭资源。[Path 与 Files](./05-path-files.md)中的目录流和[字节流与字符流](./06-byte-character-streams.md)中的包装流分别展示真实 API 的生命周期。

:::
