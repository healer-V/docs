---
title: "包、访问控制与封装"
tags:
  - Java 21
  - 封装
  - 访问控制
excerpt: "说明包声明、四种访问级别和封装之间的关系，并通过库存对象展示如何用构造校验与业务行为持续维护对象不变量。"
date: 2026-09-03
---

# 包、访问控制与封装

包组织类型名称，访问控制限制源码能够直接依赖哪些成员，封装则利用这些边界持续保护对象规则。封装不是把字段改成 `private` 后为每个字段生成 Getter 和 Setter，而是只公开不会破坏不变量的操作。

## 一、包建立命名与协作边界

包声明必须位于源文件的有效声明开头：

```java
package order.domain;

public final class Order {
}
```

完整类型名是 `order.domain.Order`。源码目录通常按包名分层，便于构建工具定位，但 Java 语言真正识别的是 `package` 声明和编译结果中的二进制名称。

`import` 只让源码省略全限定名，不会复制类，也不会提高访问权限。即使导入了另一个包的类型，仍只能访问对当前位置可见的成员。

## 二、四种成员访问级别

| 修饰符 | 同一个类 | 同一个包 | 不同包子类 | 其他不同包代码 |
|--------|----------|----------|------------|----------------|
| `private` | 可访问 | 不可访问 | 不可访问 | 不可访问 |
| 无修饰符（包访问） | 可访问 | 可访问 | 仅同包时可访问 | 不可访问 |
| `protected` | 可访问 | 可访问 | 通过继承关系受限访问 | 不可访问 |
| `public` | 可访问 | 可访问 | 可访问 | 可访问 |

顶级类只能是 `public` 或包访问；成员类和成员字段才可以使用四种级别。`protected` 在跨包场景中不是“对子类对象全部开放”：子类代码访问继承成员时还受接收者类型限制，因此不应把它当成普通公共 API。

::: tip 从最小可见范围开始开放

可见性默认从最小范围开始：实现细节用 `private`，同一包内稳定协作才用包访问，确有继承扩展点才用 `protected`，跨模块调用契约才用 `public`。

:::

## 三、封装围绕对象不变量

不变量是在对象整个有效生命周期内都必须成立的规则。例如库存对象可以约定：

- 商品编码不为 `null` 或空白；
- 可用库存始终大于或等于 `0`；
- 预占数量必须为正且不能超过可用库存；
- 入库加法不能静默溢出。

如果字段公开，任何调用方都能绕开这些规则：

```java
// 错误设计：任何代码都能写入无效库存
inventory.available = -100;
```

私有字段只是第一步，真正的封装来自 `reserve`、`restock` 等业务方法在每次状态迁移时验证规则。

## 四、业务行为优于任意 Setter

### 1. Setter 只描述赋值，不描述意图

`setAvailable(7)` 无法说明库存为何变化，也不清楚是否经过预占、取消还是盘点。调用方还需要自己读取旧值并计算新值，容易形成竞态和重复校验。

```java
void reserve(int quantity) {
    requirePositive(quantity, "预占数量");
    if (quantity > available) {
        throw new IllegalStateException("库存不足：available=" + available);
    }
    available -= quantity;
}
```

`reserve` 同时表达业务目的、失败条件和状态变化，调用方不需要知道库存字段如何保存。

### 2. Getter 也可能泄漏可变状态

::: warning Getter 返回值也可能破坏封装

若字段是数组或可变集合，直接返回引用会让外部绕过方法修改内部内容。构造时复制输入、读取时返回不可变视图或副本，才能保持封装。`final` 只禁止字段引用重新赋值，不会自动冻结引用指向的对象。

:::

例如 `return List.copyOf(items)` 可以交付不可修改的列表结构；若元素本身可变，仍需复制元素或返回不可变元素类型。防御性复制的深度由对象图中真实的可变边界决定。

## 五、构造阶段和运行阶段的校验

| 阶段 | 负责的约束 | 失败类型示例 |
|------|------------|--------------|
| 构造阶段 | 必填字段、初始范围、字段间初始关系 | `IllegalArgumentException`、`NullPointerException` |
| 行为调用阶段 | 当前状态是否允许本次迁移 | `IllegalStateException` |
| 算术阶段 | 加减乘结果是否超出表示范围 | `ArithmeticException` |

参数本身不合法，例如预占 `0` 件，属于调用契约错误；参数合法但当前库存不足，属于对象状态不允许操作。区分失败原因能让调用方给出更准确的处理和日志。

## 六、包结构不等于安全沙箱

::: warning 包访问不能承担安全隔离

包访问可以减少公共 API，但包不是部署级安全边界。反射、同包新增代码和 JVM 进程权限仍可能接触实现细节。访问控制主要提供编译期依赖约束和维护边界，敏感数据保护仍需身份认证、授权、进程隔离和密钥管理。

:::

推荐按业务职责组织包，而不是建立巨大的 `util`、`entity`、`service` 杂物箱。例如：

```text
order.domain       订单状态与业务规则
order.application 用例编排
order.infrastructure 数据库、消息等适配实现
```

依赖方向应由公开类型和构建模块共同约束，包名本身不会阻止错误依赖。

## 七、运行库存封装示例

完整源码保存为 `src/order/EncapsulationDemo.java`。示例先预占 2 件、再入库 4 件，最后故意预占超过可用量，验证失败后库存不被破坏。

```java
ProductInventory inventory = new ProductInventory("SKU-3001", 5);
inventory.reserve(2);
inventory.restock(4);
System.out.println(inventory.snapshot());

try {
    inventory.reserve(8);
} catch (IllegalStateException exception) {
    System.out.println("rejected=" + exception.getMessage());
}
```

新建一个空目录，在其中创建 `src/order/EncapsulationDemo.java` 并将以下代码保存为 UTF-8；先创建所需父目录，后续命令均在该空目录的根部执行。

::: details 查看 EncapsulationDemo 完整代码

```java [src/order/EncapsulationDemo.java]
package order;

import java.util.Objects;

/**
 * 演示通过访问控制、构造校验和业务方法维护库存不变量。
 */
public final class EncapsulationDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private EncapsulationDemo() {
    }

    /**
     * 示例入口。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        ProductInventory inventory = new ProductInventory("SKU-3001", 5);
        inventory.reserve(2);
        inventory.restock(4);
        System.out.println(inventory.snapshot());

        try {
            inventory.reserve(8);
        } catch (IllegalStateException exception) {
            System.out.println("rejected=" + exception.getMessage());
        }
    }

    /**
     * 库存对象不公开可变字段，只允许通过有业务含义的方法改变状态。
     */
    private static final class ProductInventory {
        private final String sku;
        private int available;

        /**
         * 创建库存对象并验证初始状态。
         *
         * @param sku 商品编码，不能为 null 或空白
         * @param available 初始可用数量，必须大于或等于 0
         */
        private ProductInventory(String sku, int available) {
            this.sku = Objects.requireNonNull(sku, "sku 不能为 null");
            if (sku.isBlank()) {
                throw new IllegalArgumentException("sku 不能为空白");
            }
            if (available < 0) {
                throw new IllegalArgumentException("初始库存不能为负数");
            }
            this.available = available;
        }

        /**
         * 在库存充足时预占商品。
         *
         * @param quantity 预占数量，必须大于 0
         * @throws IllegalArgumentException 数量不是正数时抛出
         * @throws IllegalStateException 库存不足时抛出
         */
        private void reserve(int quantity) {
            requirePositive(quantity, "预占数量");
            if (quantity > available) {
                throw new IllegalStateException("库存不足：available=" + available);
            }
            available -= quantity;
        }

        /**
         * 增加可用库存。
         *
         * @param quantity 入库数量，必须大于 0
         */
        private void restock(int quantity) {
            requirePositive(quantity, "入库数量");
            available = Math.addExact(available, quantity);
        }

        /**
         * 验证业务数量为正数。
         *
         * @param quantity 待验证数量
         * @param fieldName 错误信息中的字段名称，不能为空
         * @throws IllegalArgumentException 数量不是正数时抛出
         */
        private static void requirePositive(int quantity, String fieldName) {
            if (quantity <= 0) {
                throw new IllegalArgumentException(fieldName + "必须大于 0");
            }
        }

        /**
         * 返回只读文本快照，不暴露对象内部字段。
         *
         * @return 当前商品编码和可用库存
         */
        private String snapshot() {
            return "sku=%s, available=%d".formatted(sku, available);
        }
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out src/order/EncapsulationDemo.java
java -cp out order.EncapsulationDemo
```

预期输出：

```text
sku=SKU-3001, available=7
rejected=库存不足：available=7
```

::: info 单线程不变量与并发控制分开验证

异常在减库存之前抛出，因此失败后可用库存仍为 `7`。这个最小示例只验证单线程对象不变量；多线程库存竞争还需要原子性控制，将在并发章节处理。

:::

## 八、常见封装失败

| 失败设计 | 为什么不成立 | 更合适的边界 |
|----------|--------------|--------------|
| 私有字段配全量 Setter | 调用方仍可任意组合出无效状态 | 提供 `reserve`、`cancel` 等状态迁移方法 |
| 只在 Controller 校验 | 测试、批处理或其他入口可绕过规则 | 在领域对象或应用边界重复维护核心约束 |
| 返回内部可变集合 | 调用方绕过行为直接修改内容 | 防御性复制或不可变返回值 |
| 所有成员都设为 `public` | 实现细节成为长期兼容承诺 | 只公开真实跨边界契约 |

规范依据可参阅 [JLS 6.6：Access Control](https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.6) 与 [JLS 7：Packages and Modules](https://docs.oracle.com/javase/specs/jls/se21/html/jls-7.html)。
