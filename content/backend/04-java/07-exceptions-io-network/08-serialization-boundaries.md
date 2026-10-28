---
title: "序列化与数据交换边界"
tags:
  - Java
  - Serialization
excerpt: "区分对象图恢复与跨系统数据协议，说明 serialVersionUID、transient 和字段校验，通过受控内存示例验证共享引用及类型、数组、大小和业务状态拒绝，建立格式选择与迁移边界。"
date: 2026-09-08
---

# 序列化与数据交换边界

序列化把内存状态转换为字节，数据交换协议则定义消费者如何理解字段、版本和错误。Java 原生序列化能恢复具体类和对象图，但这也让字节格式与 Java 类结构产生联系。订单的外部接口通常需要稳定的数据模型，而不需要恢复服务对象、缓存和内部继承关系。

## 一、对象图与默认字段

Serializable 是标记接口。ObjectOutputStream 会沿可序列化字段遍历对象图，在同一对象流中为已写过的对象保存引用关系；反序列化恢复共享引用，并不意味着恢复为原进程中的同一个实例。

| 内容 | 默认序列化行为 | 设计影响 |
|------|------|------|
| 非 static、非 transient 实例字段 | 保存字段状态 | private 不代表不会写出 |
| transient 字段 | 不参与默认字段保存 | 不等于加密，也不能阻止自定义代码另行写出 |
| static 字段 | 属于类，不作为实例状态保存 | 恢复结果取决于当前运行时类状态 |
| 共享对象引用 | 在图中保留共享关系 | 意外关联大对象会扩大数据规模 |
| 不可序列化的可达对象 | 写出失败 | 不应直接序列化含资源和服务依赖的领域实体 |

::: warning 恢复普通对象不能只依赖构造器校验

对普通 Serializable 类，反序列化不经过该类的普通构造器和实例初始化逻辑；不能只依赖构造器保护不变量。记录类和 Externalizable 有各自规则，不应把普通类的行为直接套用过去。[序列化体系结构](https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/serial-arch.html)、[Serializable](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Serializable.html)

:::

## 二、版本兼容不是只改 UID

serialVersionUID 是原生序列化的类版本兼容标识。显式声明可以避免依赖类结构推导出的默认值，但“UID 相同”不代表所有修改都能兼容，更不代表恢复后的字段符合当前业务规则。

| 变更 | 应判断的风险 | 验证方式 |
|------|------|------|
| 新增字段 | 旧数据没有该字段，可能恢复默认值 | 保存旧样本并验证默认语义 |
| 修改字段类型 | 原始数据无法按新类型恢复 | 做明确数据迁移，不只保留 UID |
| 修改字段含义 | 字节能读取，业务语义却改变 | 新增字段或版本分支，不复用旧语义 |
| 改变 UID | 原有流与当前类版本可能被拒绝 | 确认是有意阻断还是误改 |
| 修改验证规则 | 旧数据不再满足当前约束 | 给出迁移或拒绝策略 |

::: info 同版本恢复不证明跨版本兼容

本文的程序验证同一类版本中的恢复和拒绝，不声称完成跨版本兼容测试。真实升级应在隔离环境中运行“旧生产者→新消费者”和需要支持的反向组合，并保留格式样本。[对象版本兼容规范](https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/version.html)

:::

## 三、输入过滤与字段校验分别负责什么

过滤器限制允许的类及对象图规模，字段校验检查业务不变量，读取前的字节上限控制输入载荷。三者不能互相替代。ObjectInputFilter 不会为所有字符串内容执行普通对象类型过滤，也不会自动验证“数量必须大于零”。

| 层次 | 示例限制 | 解决的问题 |
|------|------|------|
| 已取得的字节 | 最多 4096 字节 | 在构造对象流前拒绝过大夹具 |
| 对象图 | 深度 4、引用数 12、数组长度 2 | 限制遍历规模 |
| 类型 | 订单快照及其数组 | 拒绝不属于当前模型的类 |
| 根形状 | 两个非空订单引用 | 防止只靠强制类型转换接收错误结构 |
| 字段 | 订单号长度与正数量 | 恢复后再次维护业务不变量 |

::: warning 接收阶段就要限制输入规模

这些上限只服务于两个订单引用的教学夹具，不是通用生产阈值。对上传和网络数据，应在接收阶段限制大小；把任意无界输入完整读入数组后再检查长度，已经错过了内存保护时机。[ObjectInputFilter](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ObjectInputFilter.html)

:::

## 四、验证受控对象图与拒绝分支

::: danger 示例不能接入不可信对象流
过滤器减少可接收的类型与规模，不能把任意外部对象流变成安全的通用协议。不要将本例接到不可信网络输入；外部数据应按明确的数据格式解析，并执行类型、结构和业务校验。
:::

以下 Java 21 完整程序只消费当前进程自己创建的字节，不接入上传、网络或任意文件。两个数组元素指向同一订单，恢复后检查共享身份和 transient 字段。过滤器在读取对象之前安装。

保存为 `SerializationBoundariesDemo.java`：

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看SerializationBoundariesDemo的完整代码

```java
// SerializationBoundariesDemo.java
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InvalidObjectException;
import java.io.ObjectInputFilter;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serial;
import java.io.Serializable;

/** 只序列化当前进程构造的夹具，验证共享引用、字段恢复与输入拒绝。 */
public final class SerializationBoundariesDemo {
    private static final int MAX_BYTES = 4096;

    /** 禁止实例化命令行示例。 */
    private SerializationBoundariesDemo() {}

    /** 明确限定字段的订单快照，不携带服务对象或任意领域聚合。 */
    private static final class OrderSnapshot implements Serializable {
        @Serial
        private static final long serialVersionUID = 1L;
        private String orderNumber;
        private int quantity;
        private transient String localNote = "diagnostic-only";

        /**
         * 构造订单快照并检查业务不变量。
         * @param orderNumber 非空、非空白且长度不超过32的订单号
         * @param quantity 严格大于0的数量
         */
        private OrderSnapshot(String orderNumber, int quantity) throws InvalidObjectException {
            this.orderNumber = orderNumber;
            this.quantity = quantity;
            validate();
        }

        /** 校验恢复后的字段，不满足订单契约时拒绝，无返回值。 */
        private void validate() throws InvalidObjectException {
            if (orderNumber == null || orderNumber.isBlank() || orderNumber.length() > 32 || quantity <= 0) {
                throw new InvalidObjectException("invalid order snapshot");
            }
        }

        /** 反序列化回调，默认恢复字段后再次验证；不依赖普通构造器执行，无返回值。 */
        @Serial
        private void readObject(ObjectInputStream input) throws IOException, ClassNotFoundException {
            input.defaultReadObject();
            validate();
        }
    }

    /** 序列化非空的本地可信夹具，返回原生对象流字节；不接收网络输入。 */
    private static byte[] encode(Serializable value) throws IOException {
        try (ByteArrayOutputStream bytes = new ByteArrayOutputStream();
             ObjectOutputStream output = new ObjectOutputStream(bytes)) {
            output.writeObject(value);
            output.flush();
            return bytes.toByteArray();
        }
    }

    /** 过滤回调：先限制图规模，再仅允许订单快照及其数组，返回当前检查状态。 */
    private static ObjectInputFilter.Status filter(ObjectInputFilter.FilterInfo info) {
        if (info.depth() > 4 || info.references() > 12 || info.streamBytes() > MAX_BYTES
                || info.arrayLength() > 2) {
            return ObjectInputFilter.Status.REJECTED;
        }
        Class<?> type = info.serialClass();
        if (type == null) {
            return ObjectInputFilter.Status.UNDECIDED;
        }
        return type == OrderSnapshot.class || type == OrderSnapshot[].class || type == String.class
                ? ObjectInputFilter.Status.ALLOWED : ObjectInputFilter.Status.REJECTED;
    }

    /** 在已取得的受控字节上检查大小、类型及根形状，返回含两个元素的订单数组。 */
    private static OrderSnapshot[] decode(byte[] bytes) throws IOException, ClassNotFoundException {
        if (bytes.length > MAX_BYTES) {
            throw new IOException("snapshot exceeds 4096 bytes");
        }
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            input.setObjectInputFilter(SerializationBoundariesDemo::filter);
            Object value = input.readObject();
            if (!(value instanceof OrderSnapshot[] orders) || orders.length != 2
                    || orders[0] == null || orders[1] == null) {
                throw new InvalidObjectException("expected two order references");
            }
            return orders;
        }
    }

    /** 正常验证对象图；foreign、array、oversize、bad-state分别验证输入边界。 */
    public static void main(String[] args) throws IOException, ClassNotFoundException {
        OrderSnapshot snapshot = new OrderSnapshot("ORD-1001", 2);
        if (args.length > 0) {
            switch (args[0]) {
                case "foreign" -> decode(encode(new java.util.Date(0)));
                case "array" -> decode(encode(new OrderSnapshot[] {snapshot, snapshot, snapshot}));
                case "oversize" -> decode(new byte[MAX_BYTES + 1]);
                case "bad-state" -> {
                    // 只为模拟不符合当前规则的历史快照，故意绕过本类构造后的不变量。
                    snapshot.quantity = 0;
                    decode(encode(new OrderSnapshot[] {snapshot, snapshot}));
                }
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        OrderSnapshot[] restored = decode(encode(new OrderSnapshot[] {snapshot, snapshot}));
        assert restored[0] == restored[1] && restored[0] != snapshot;
        assert restored[0].localNote == null;
        assert restored[0].quantity == 2 && restored[0].orderNumber.equals("ORD-1001");
        System.out.println("order=" + restored[0].orderNumber + ", quantity=" + restored[0].quantity);
        System.out.println("shared reference=true, new instance=true");
        System.out.println("transient note=" + restored[0].localNote);
    }
}
```

:::

在本篇示例目录执行以下 PowerShell 命令，无第三方依赖：

```powershell
javac -encoding UTF-8 -d out SerializationBoundariesDemo.java
java -ea -cp out SerializationBoundariesDemo
```

实际输出中，恢复的两个元素共享一个新实例；localNote 的字段初始化器没有在恢复时重新赋值：

```text
order=ORD-1001, quantity=2
shared reference=true, new instance=true
transient note=null
```

以下故障命令分别执行，均预期非零退出。Date 只是无害的非允许类型夹具，bad-state 只在程序内故意改变字段，不涉及攻击载荷：

```powershell
java -ea -cp out SerializationBoundariesDemo foreign
java -ea -cp out SerializationBoundariesDemo array
java -ea -cp out SerializationBoundariesDemo oversize
java -ea -cp out SerializationBoundariesDemo bad-state
```

| 参数 | 实测失败 | 证明与处理 |
|------|------|------|
| foreign | InvalidClassException，filter status: REJECTED | 过滤器拒绝 Date；不自动扩大允许类型 |
| array | InvalidClassException，filter status: REJECTED | 三元素数组超过夹具上限；检查对象图是否符合契约 |
| oversize | IOException: snapshot exceeds 4096 bytes | 在构造对象流前拒绝过大字节 |
| bad-state | InvalidObjectException: invalid order snapshot | readObject 验证拒绝数量为零；不要跳过校验恢复坏状态 |

## 五、交换格式的选择与迁移

下面是订单数据方向的设计取舍。格式选择要落到消费者语言、兼容周期、可观察性和工具链约束，不能只比较文件大小。

| 场景 | 候选形式 | 需要独立制定的契约 |
|------|------|------|
| 面向多语言调用方的订单 API | JSON 数据对象 | 字段类型、数值精度、缺失与 null、未知字段、输入上限 |
| 批量平面订单导入导出 | CSV | 编码、引号转义、嵌入换行、列版本与单行上限 |
| 有统一 schema 工具链的消息 | schema 驱动二进制格式，例如 Protobuf | 字段标识、生成代码版本、兼容演进和诊断方式 |
| 受控 Java 遗留快照 | 已存在的原生序列化 | 允许类型、类版本、历史样本和退出计划 |

订单号应作为标识保留，不应为了看似“数字”而允许消费方丢失前导零；金额需要规定币种和精度。协议应保存业务数据，避免暴露私有缓存字段。JSON 和二进制 schema 的具体编解码库不在此实现，本文也不将原生序列化代码伪装成它们的使用方式。

::: tip 用受控转换保留迁移回退条件

迁移遗留快照时，可以用受控版本程序读取允许的数据，转换为显式 DTO 并写入新格式，之后验证数量、关键字段和回读结果。失败数据隔离处理，保留可回退的原始样本与迁移版本，不在主业务请求中无限尝试不同类定义。

:::
