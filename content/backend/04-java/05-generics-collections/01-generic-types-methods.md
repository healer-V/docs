---
title: "泛型类、接口与方法"
tags:
  - Java
  - 泛型
excerpt: "通过订单仓库说明类型参数如何关联接口、实现、方法输入和返回值，区分类级与方法级类型变量、类型推断及业务约束，并用编译错误验证错误调用如何被拒绝。"
date: 2026-09-08
---

# 泛型类、接口与方法

泛型把“允许处理什么类型”写入可复用的声明中。一个 `Repository<Order, String>` 同时约束实体和标识：保存时只能接收订单和字符串标识，读取结果直接具有 Order 类型。它省去调用方的强制转换，也让不匹配的调用在编译期暴露。

## 一、类型参数是声明中的关系

`T` 是类型参数，`Order` 是代入声明的类型实参。`Repository<T, Id>` 里的两个参数彼此独立：订单和商品可以使用同一仓库接口，但标识类型不必相同。常见的 T、E、K、V 只是命名约定，Id 这样的语义名称也合法。

::: tip 用泛型保存实际需要的类型关系

选择泛型的依据是需要跨字段、输入或返回值保存同一类型关系。比如仓库保存 T、读取 T，这种联系能被编译器持续检查。若方法只需返回参数的 `toString()`，增加一个仅出现一次的 `<T>` 通常没有提供额外约束，接收 Object 已足够；为了“更通用”给每个方法增加 T 会让签名更难读。

:::

| 声明位置 | 约束范围 | 订单例中的作用 |
|---|---|---|
| `interface Repository<T, Id>` | 接口的实例方法契约 | 将保存值和查询结果连接为 T |
| `class MemoryRepository<T, Id>` | 每个参数化实例的类型视角 | 不同实例可保存 Order 或 Integer |
| `static <T> T firstNonNull(...)` | 当前方法调用 | 将两个候选值和返回值关联起来 |
| `Repository<Order, String>` | 当前引用的可接受调用 | 错误的键或实体类型无法直接传入 |

::: info 静态类型约束不能替代业务校验

这些约束不验证订单号是否重复、数量是否为正，也不保证参数 id 与 Order 内的 number 一致。示例的仓库只校验非空；真实领域规则仍要由业务模型或服务校验。泛型是一种静态类型关系，不是业务校验器。

:::

## 二、接口、实现与静态成员各自绑定类型

### 1. 实现类传递或固定类型参数

实现类可以继续声明 `T, Id`，再把它们传给接口；也可以在实现声明中固定成具体类型。继续声明适合通用容器，固定类型适合只服务某类实体的专用组件。两种方式都必须实现替换类型参数之后的方法签名。

`new MemoryRepository<>()` 的菱形语法让编译器根据目标引用推断构造时的类型；这不会使容器变成可以任意混装对象的结构。不要去掉左侧参数变成原始类型来消除编译错误，原始类型会使关键约束退化为未经检查的调用。

### 2. 静态方法必须声明自己的类型关系

类的类型参数属于实例的参数化视角，静态字段和静态方法不能直接引用它。静态泛型方法必须在返回类型前声明自己的 `<T>`。同名类型变量也可能是不同声明，不能凭它们都叫 T 认定共享关系。[JLS 泛型类](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.2)、[JLS 泛型方法](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.4)

例如订单仓库的实例已经绑定 `Order`，也不能据此推断某个静态方法的 T 必然是 Order。静态方法没有接收该实例作为类型约束来源，它的类型关系要从自己的参数、返回值和调用上下文建立；需要使用仓库实例关系时，应把行为声明为实例方法。

## 三、方法推断保留共同类型

`firstNonNull(null, "CREATED")` 在 String 赋值上下文中返回 String；`GenericTypesDemo.<String>firstNonNull(...)` 显式给出方法类型实参。显式类型实参用于澄清或约束推断，不能让原本不匹配的对象变成 String。

::: warning 共同类型推断不保证来自同一领域

推断会同时考虑输入与目标上下文，未必选择某一个实参的精确运行时类。混用不相关类型时，若上下文允许，更宽的共同类型仍能让调用通过；如果业务要求候选值来自同一领域，应通过参数化领域类型或更具体签名表达，不能依赖“编译器总会发现混用”。

:::

本例的两个候选都允许 null，因此两者为空时返回 null。允许 null 是这个方法的契约，不是泛型对所有 API 的默认承诺。需要上界、通配符和跨容器读写关系时，由[泛型边界、通配符与类型擦除](./02-bounds-wildcards-erasure.md)解释。

## 四、订单仓库的完整实现

::: info 内存仓库只验证本地类型契约

下面是独立可运行文件，包含泛型接口、通用实现、订单数据和方法推断。内部 Map 只承担内存存储，不提供数据库、事务、并发或缓存能力；订单编号、数量和库存均为本地演示输入。

:::

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看GenericTypesDemo的完整代码

```java
// GenericTypesDemo.java
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;

/** 用订单仓库验证类、接口与方法上的类型参数；存储仅存在于当前进程。 */
public final class GenericTypesDemo {
    /** 静态演示入口不需要实例；构造器不产生副作用。 */
    private GenericTypesDemo() {}

    /**
     * 验证同一泛型结构的不同实例与方法推断；无返回值，输出断言结果。
     * @param args 空参数运行正常路径；missing 查询缺失键；null 保存空值
     */
    public static void main(String[] args) {
        Repository<Order, String> orders = new MemoryRepository<>();
        orders.save("ORD-1001", new Order("ORD-1001", 2));
        if (args.length > 0) {
            switch (args[0]) {
                case "missing" -> orders.get("ORD-9999");
                case "null" -> orders.save("ORD-1002", null);
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        Order order = orders.get("ORD-1001");
        assert order.quantity() == 2;
        Repository<Integer, String> stocks = new MemoryRepository<>();
        stocks.save("P-1001", 20);
        assert stocks.get("P-1001") == 20;
        String status = firstNonNull(null, "CREATED");
        String explicit = GenericTypesDemo.<String>firstNonNull(null, "PAID");
        assert "CREATED".equals(status) && "PAID".equals(explicit);
        assert firstNonNull(null, null) == null;
        System.out.println("order=" + order.number() + ", quantity=" + order.quantity());
        System.out.println("stock=" + stocks.get("P-1001"));
        System.out.println("inferred=" + status + ", explicit=" + explicit);
    }

    /**
     * 用同一个 T 连接两个输入和返回值，不检查业务状态是否合法。
     * @param primary 首选值，允许 null
     * @param fallback 备用值，允许 null
     * @param <T> 编译器依据输入与目标上下文求出的共同类型
     * @return primary 非 null 时返回它，否则返回 fallback；两者为空时返回 null
     */
    static <T> T firstNonNull(T primary, T fallback) {
        return primary != null ? primary : fallback;
    }

    /**
     * 分别约束实体与标识类型；类型参数本身不提供持久化、事务或校验。
     * @param <T> 非 null 实体类型
     * @param <Id> 非 null 且在存储期间相等性稳定的标识类型
     */
    interface Repository<T, Id> {
        /**
         * 保存一个标识对应的实体；无返回值，同键覆盖之前的实体。
         * @param id 非 null 的稳定标识
         * @param value 非 null 实体；所属业务标识的一致性由调用方保证
         */
        void save(Id id, T value);

        /**
         * 查询已保存实体，不把不存在伪装成空对象。
         * @param id 非 null 标识
         * @return 匹配实体；缺失时抛出 NoSuchElementException
         */
        T get(Id id);
    }

    /**
     * 在内存中保存泛型映射，不提供并发访问或持久化能力。
     * @param <T> 非 null 实体类型
     * @param <Id> 非 null 的稳定标识类型
     */
    static final class MemoryRepository<T, Id> implements Repository<T, Id> {
        private final Map<Id, T> values = new LinkedHashMap<>();

        /**
         * 遵守接口约束保存值；无返回值，替换相同键的旧值。
         * @param id 非 null 稳定标识
         * @param value 非 null 实体
         */
        @Override
        public void save(Id id, T value) {
            values.put(Objects.requireNonNull(id, "id"), Objects.requireNonNull(value, "value"));
        }

        /**
         * 读取当前映射并把缺失状态显式转为异常。
         * @param id 非 null 标识
         * @return 已保存的非 null 实体；缺失时抛出 NoSuchElementException
         */
        @Override
        public T get(Id id) {
            T value = values.get(Objects.requireNonNull(id, "id"));
            if (value == null) {
                throw new NoSuchElementException("missing id: " + id);
            }
            return value;
        }
    }

    /**
     * 承载演示订单；实际业务范围校验独立于泛型检查。
     * @param number 演示订单编号
     * @param quantity 演示数量，正常输入为正整数
     */
    record Order(String number, int quantity) {}
}
```

:::

以下 PowerShell 命令从本篇示例目录执行；需要 JDK 21，无第三方依赖。本例已在 Corretto 21.0.11 上通过无警告编译和断言运行。

```powershell
New-Item -ItemType Directory -Force -Path 'out' | Out-Null
javac -encoding UTF-8 -Xlint:all -Werror -d out GenericTypesDemo.java
if ($LASTEXITCODE -ne 0) { throw '示例编译失败' }
java -ea -cp out GenericTypesDemo
if ($LASTEXITCODE -ne 0) { throw '示例运行失败' }
```

实际输出如下，断言同时检查没有展示的边界：

```text
order=ORD-1001, quantity=2
stock=20
inferred=CREATED, explicit=PAID
```

同一个实现保存了 Order 和 Integer，两次 get 的静态返回类型分别为 Order 和 Integer。示例读取现有订单不需要强制转换；保存相同键会覆盖旧值，这个行为来自仓库契约而非类型系统。

## 五、错误声明与错误调用的编译证据

把以下文件保存到 `InvalidGenericDeclarations.java`，它刻意包含三处错误，只能独立编译验证。先执行正常文件的编译命令，提供它引用的仓库类型。

::: details 查看InvalidGenericDeclarations的完整代码

```java
// InvalidGenericDeclarations.java
/**
 * 独立编译失败文件；正常入口源码不包含这些错误。
 * @param <T> 仅属于实例的类型参数
 */
final class InvalidGenericDeclarations<T> {
    static T shared;

    /**
     * 故意违背仓库的键和值类型；无返回值，本方法无法编译。
     * @param orders 键为字符串且实体为 Order 的仓库
     */
    void saveWrong(GenericTypesDemo.Repository<GenericTypesDemo.Order, String> orders) {
        orders.save(1001, new GenericTypesDemo.Order("ORD-1001", 2));
        orders.save("ORD-1001", "not-an-order");
    }
}
```

:::

以下命令预期退出码为1；不会生成可运行的失败类。

```powershell
javac '-J-Duser.language=en' -encoding UTF-8 -cp out -d out InvalidGenericDeclarations.java
if ($LASTEXITCODE -ne 1) { throw '未得到预期的类型检查失败' }
```

本机得到 `3 errors`，三处诊断各自指向一条被破坏的契约。

| 诊断关键文本 | 原因 | 正确处理 |
|---|---|---|
| `non-static type variable T cannot be referenced from a static context` | 静态字段引用实例类型参数 | 改为实例字段，或为静态方法单独声明类型参数 |
| `int cannot be converted to String` | 仓库键已绑定 String | 传入领域中的字符串标识，不用原始类型绕过约束 |
| `String cannot be converted to Order` | 仓库保存值已绑定 Order | 构造合法实体；不是在仓库内部强制转换字符串 |

## 六、缺失与空值仍是运行时契约

编译成功不代表查询一定命中。正常源码提供两种独立错误模式，分别验证缺失查询和保存空值。在相同编译产物上执行：

```powershell
java -cp out GenericTypesDemo missing
if ($LASTEXITCODE -ne 1) { throw '缺失查询没有按预期失败' }
java -cp out GenericTypesDemo null
if ($LASTEXITCODE -ne 1) { throw '空值保存没有按预期失败' }
```

`missing` 实际抛出 `NoSuchElementException: missing id: ORD-9999`；`null` 抛出 `NullPointerException: value`。前者应由调用方处理未命中或选择不同的查询结果契约，后者应在进入仓库前拒绝非法实体。进程结束即清除示例内存，无外部状态需要回滚。
