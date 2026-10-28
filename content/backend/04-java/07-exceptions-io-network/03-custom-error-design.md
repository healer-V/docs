---
title: "自定义异常与错误设计"
tags:
  - Java
  - Exception
excerpt: "以订单导入说明稳定错误码、技术异常转换、原因链和安全响应如何分工，使用完整程序验证输入失败、数据源故障和逐行部分失败，明确错误类型与事务恢复的边界。"
date: 2026-09-08
---

# 自定义异常与错误设计

自定义异常用来表达调用方需要识别的失败语义。订单数量非法、读取源不可用和适配器内部状态错误需要不同处理，不能全部包装成“订单导入失败”后返回相同结果，也不必为每个方法建立独立异常类。

## 一、按处理责任选择错误模型

新异常类型的价值是让调用方能够采取不同动作，或隔离底层实现。若只有简单参数越界且没有新的处理责任，IllegalArgumentException已经足够；若需要跨层传递稳定的订单导入语义，则可以设计应用异常。

| 情况 | 推荐表达 | 原因 |
|------|----------|------|
| 明确违反参数约束 | 标准参数异常或输入错误结果 | 不必建立只有名称不同的异常层次 |
| 调用方需要识别业务拒绝 | 领域错误类型或稳定错误码 | 能区分修正输入与系统故障 |
| I/O失败跨越适配器边界 | 应用异常保留cause | 调用方不必依赖具体存储实现 |
| 批量处理中多条可预期失败 | 成功计数与逐项错误列表 | 单次throw无法表示完整批次结果 |
| 编程不变量被破坏 | 保留真实系统失败 | 不应伪装为普通坏记录继续处理 |

::: info 异常继承关系不自动决定事务结果

继承Exception还是RuntimeException，决定调用方是否被编译器强制捕获或声明；不能由“业务异常”四个字直接决定。示例采用RuntimeException，让应用入口集中处理；没有接入事务框架，因此不能声称该类型自动触发事务回滚。[Exception](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Exception.html)、[RuntimeException](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/RuntimeException.html)

:::

## 二、稳定错误码与内部诊断分开

::: tip 让错误码表达稳定的应用语义

错误码承担机器可识别的稳定语义，消息负责解释，不应让客户端解析中文或英文句子决定分支。错误码应属于应用问题，例如SOURCE_UNAVAILABLE；HTTP状态、数据库错误号和存储路径分别属于传输或技术层。

:::

| 字段 | 当前例子的用途 | 边界 |
|------|----------------|------|
| code | INVALID_QUANTITY或SOURCE_UNAVAILABLE | 可读消息调整时，不随意改变机器语义 |
| 内部message | 演示订单编号与当前错误码 | 只放允许进入内部诊断的数据 |
| cause | 原IOException或输入异常 | 保留原因对象，避免只复制消息 |
| 公开message | 明确允许返回的说明 | 不自动使用cause.toString或堆栈 |
| 行号 | 定位批量输入中失败条目 | 不保存整行原始数据以替代必要上下文 |

应用异常接收cause的构造器保留底层诊断；公开响应通过ErrorView单独投影。本例的公开结果没有原始存储消息。这个结构只证明该映射路径不会直接返回cause，不能替代日志系统、序列化配置和访问控制的完整检查。

异常实现声明serialVersionUID，是明确Java异常类型的序列化版本字段，不代表应把Java异常对象作为远程业务协议传输。

## 三、只转换已经识别的失败

输入解析可以把格式错误与非正数量统一为INVALID_QUANTITY，因为调用方都需要修正数量。I/O读取失败则转换为SOURCE_UNAVAILABLE，并保留IOException；适配器内部IllegalStateException继续作为系统失败传播。

::: warning 统一包装可能把系统缺陷误报为输入错误

catch Exception后统一转换成INVALID_QUANTITY，会把代码缺陷误报为用户输入问题。转换应发生在能够增加语义的边界，不在每个方法重复包装同一原因。完整堆栈一般由决定任务最终失败的边界记录，底层反复打印会制造重复日志。

:::

批量部分失败还需要明确处理单位：本例允许每条数量验证独立失败，但遇到系统故障应中止而不是继续增加“坏数据”计数。真正的整批回滚、逐条提交或分段提交，需要由持久化事务规则决定。

## 四、订单错误与安全响应完整示例

保存为 `CustomErrorDesignDemo.java`。使用JDK 21，数据只在内存中；unavailable和bug是有意设置的模拟模式，没有连接真实订单服务。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看CustomErrorDesignDemo的完整代码

```java
// CustomErrorDesignDemo.java
import java.io.IOException;
import java.io.Serial;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/** 将可预期输入失败、技术故障与安全响应分开建模。 */
public final class CustomErrorDesignDemo {
    /** 仅提供静态验证入口。 */
    private CustomErrorDesignDemo() {}

    /**
     * 验证原因链和部分失败，或触发未处理错误；无返回值。
     * @param args 空参数正常；business、technical、unexpected为故障模式
     */
    public static void main(String[] args) {
        if (args.length > 0) {
            switch (args[0]) {
                case "business" -> parseQuantity("ORD-1001", "invalid");
                case "technical" -> importOrder("ORD-1001", "unavailable");
                case "unexpected" -> importOrder("ORD-1001", "bug");
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        assert parseQuantity("ORD-1001", "2") == 2;
        try {
            importOrder("ORD-1001", "unavailable");
        } catch (OrderImportFailure error) {
            assert error.getCause() instanceof IOException;
            ErrorView publicView = publicError(error);
            assert publicView.message().equals("Order source is unavailable");
            assert !publicView.toString().contains("storage");
            System.out.println("internal: code=" + error.code() + ", cause=" + error.getCause().getClass().getSimpleName());
            System.out.println("public=" + publicView);
        }
        List<LineFailure> failures = new ArrayList<>();
        int accepted = 0;
        List<String> quantities = List.of("2", "invalid", "0");
        for (int index = 0; index < quantities.size(); index++) {
            try {
                parseQuantity("ORD-100" + (index + 1), quantities.get(index));
                accepted++;
            } catch (OrderImportFailure error) {
                // 本批只处理预期输入错误；系统故障不被计作一条普通坏记录。
                if (error.code() != ErrorCode.INVALID_QUANTITY) {
                    throw error;
                }
                failures.add(new LineFailure(index + 1, error.code()));
            }
        }
        assert accepted == 1 && failures.size() == 2;
        System.out.println("accepted=" + accepted + ", failures=" + failures);
    }

    /**
     * 在输入边界把格式和范围错误转成稳定业务错误。
     * @param orderNumber 非null的演示订单标识，不包含敏感字段
     * @param text 数量文本；本例允许格式错误以验证拒绝分支
     * @return 正整数数量；非法输入抛OrderImportFailure并保留cause
     */
    private static int parseQuantity(String orderNumber, String text) {
        try {
            int quantity = Integer.parseInt(text);
            if (quantity <= 0) {
                throw new IllegalArgumentException("quantity must be positive");
            }
            return quantity;
        } catch (IllegalArgumentException error) {
            throw new OrderImportFailure(ErrorCode.INVALID_QUANTITY, orderNumber, error);
        }
    }

    /**
     * 仅转换已识别的技术失败，不把所有异常伪装为输入错误；无返回值。
     * @param orderNumber 非null演示订单标识
     * @param mode unavailable模拟I/O故障，bug模拟编程错误，ready正常
     */
    private static void importOrder(String orderNumber, String mode) {
        try {
            if ("unavailable".equals(mode)) {
                throw new IOException("simulated storage read failure");
            }
            if (!"ready".equals(mode)) {
                throw new IllegalStateException("simulated adapter invariant failure");
            }
        } catch (IOException error) {
            throw new OrderImportFailure(ErrorCode.SOURCE_UNAVAILABLE, orderNumber, error);
        }
    }

    /**
     * 将内部异常映射为显式允许公开的字段。
     * @param error 非null且具有本例错误码的异常
     * @return 不含cause、堆栈或底层消息的公开结果
     */
    private static ErrorView publicError(OrderImportFailure error) {
        String message = switch (error.code()) {
            case INVALID_QUANTITY -> "Quantity must be a positive integer";
            case SOURCE_UNAVAILABLE -> "Order source is unavailable";
        };
        return new ErrorView(error.code().name(), message);
    }

    /** 机器标识表达应用语义，不绑定HTTP状态或底层数据库错误号。 */
    enum ErrorCode { INVALID_QUANTITY, SOURCE_UNAVAILABLE }

    /** 表示应用边界失败，保留原始cause供内部诊断。 */
    static final class OrderImportFailure extends RuntimeException {
        @Serial
        private static final long serialVersionUID = 1L;
        private final ErrorCode code;

        /**
         * 构造失败对象，不记录日志或发送响应。
         * @param code 非null稳定错误码
         * @param orderNumber 非null且可用于内部诊断的演示编号
         * @param cause 非null原始原因
         */
        OrderImportFailure(ErrorCode code, String orderNumber, Throwable cause) {
            super("import " + Objects.requireNonNull(orderNumber) + ": " + Objects.requireNonNull(code),
                    Objects.requireNonNull(cause));
            this.code = code;
        }

        /** 返回稳定错误码，不解析可变消息文本。 */
        ErrorCode code() { return code; }
    }

    /**
     * 公开响应投影，不含内部异常对象。
     * @param code 非null稳定错误码文本
     * @param message 非null且明确允许公开的消息
     */
    record ErrorView(String code, String message) {}

    /**
     * 保存逐行输入失败，不保存原始输入内容。
     * @param line 正数行号
     * @param code 非null输入错误码
     */
    record LineFailure(int line, ErrorCode code) {}
}
```

:::

在本篇示例目录使用PowerShell编译运行。Xlint与doclint检查包括新增异常类、构造器和返回契约。

```powershell
javac -encoding UTF-8 -Xlint:all -Xdoclint:all,-missing -Werror -d out CustomErrorDesignDemo.java
java -ea -cp out CustomErrorDesignDemo
```

Corretto 21.0.11实测输出如下：

```text
internal: code=SOURCE_UNAVAILABLE, cause=IOException
public=ErrorView[code=SOURCE_UNAVAILABLE, message=Order source is unavailable]
accepted=1, failures=[LineFailure[line=2, code=INVALID_QUANTITY], LineFailure[line=3, code=INVALID_QUANTITY]]
```

内部cause仍是IOException，公开响应只含两项允许字段。数量2被接受，invalid和0分别记录在第2、3行；批量结果保留全部预期输入失败，没有因为第一条失败就丢弃其余记录。

## 五、失败复现与恢复条件

分别运行以下模式，均已验证非零退出。每个模式以独立进程执行，不产生持久化业务数据。

```powershell
java -ea -cp out CustomErrorDesignDemo business
java -ea -cp out CustomErrorDesignDemo technical
java -ea -cp out CustomErrorDesignDemo unexpected
```

| 模式 | 异常与证据 | 处理依据 |
|------|------------|----------|
| business | OrderImportFailure，码为INVALID_QUANTITY，cause为NumberFormatException | 修正数量格式，不原样重试同一非法值 |
| technical | OrderImportFailure，码为SOURCE_UNAVAILABLE，cause为IOException | 判断读取源恢复条件；重试还须有时间预算和幂等性 |
| unexpected | 原IllegalStateException | 定位适配器不变量问题，不转成普通输入错误 |

::: info 错误映射示例的验证范围

示例证明错误边界、cause保留和公开字段选择，不包含真实重试、日志脱敏链路或数据库事务。对外协议还需要决定状态码、消息确认或进程退出规则；领域异常不应直接依赖这些传输细节。

:::
