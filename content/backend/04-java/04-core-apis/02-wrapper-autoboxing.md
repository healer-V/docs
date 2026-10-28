---
title: "包装类型与自动装箱"
tags:
  - Java 21
  - 包装类型
  - 自动装箱
excerpt: "解释基本类型与包装类型的转换、缓存和比较规则，并通过集合求和与空拆箱失败说明何时使用包装类型以及如何处理 null。"
date: 2026-09-03
---

# 包装类型与自动装箱

包装类型把基本值表示为对象，使数值和布尔值能够进入泛型集合、允许缺失状态或调用对象 API。自动装箱和拆箱只是编译器插入的转换，包装对象仍可能为 `null`，对象身份也不能代表数值相等。

## 一、八种基本类型对应八个包装类型

| 基本类型 | 包装类型 | 常用解析方法 |
|----------|----------|--------------|
| `byte` | `Byte` | `Byte.parseByte` |
| `short` | `Short` | `Short.parseShort` |
| `int` | `Integer` | `Integer.parseInt` |
| `long` | `Long` | `Long.parseLong` |
| `float` | `Float` | `Float.parseFloat` |
| `double` | `Double` | `Double.parseDouble` |
| `char` | `Character` | 通常读取具体字符或码点 |
| `boolean` | `Boolean` | `Boolean.parseBoolean` |

包装类都位于 `java.lang`，不需要显式导入。除 `Character` 外，数值包装类继承 `Number`，但包装类型彼此没有数值继承关系；`Integer` 不是 `Long` 的子类。

## 二、装箱与拆箱是值转换

### 1. 自动装箱创建或复用包装对象

```java
Integer boxed = 42;
```

编译器把它转换为等价的 `Integer.valueOf(42)`。应优先使用自动装箱或 `valueOf`，不要显式创建包装对象；包装类构造器已弃用并可能产生不必要实例。

### 2. 自动拆箱读取基本值

```java
int unboxed = boxed;
int total = boxed + 8;
```

这些位置会调用类似 `boxed.intValue()` 的转换。算术、比较运算或赋给基本类型变量时都可能隐式拆箱，因此异常位置未必显式写着 `intValue()`。

::: tip 普通数值计算优先使用基本类型

装箱和拆箱不改变数值本身，但会引入对象、空值和潜在分配成本。局部计数、循环索引和密集数值运算优先使用基本类型。

:::

## 三、null 拆箱会抛出异常

```java
Integer quantity = null;
int required = quantity; // NullPointerException
```

`Integer` 可以表示缺失，`int` 必须始终有数值。拆箱需要调用空引用的取值方法，因此产生 `NullPointerException`。

处理方式取决于业务语义：

- 数量必填：在输入边界拒绝 `null`，领域内部使用 `int`；
- 缺失与 `0` 含义不同：保留 `Integer`，在分支中明确处理缺失；
- 配置存在默认值：在单一边界应用默认值，再转换为基本类型；
- 不要无条件使用 `null ? 0`，这会把“未提供”悄悄变成真实数量零。

::: warning 条件表达式也可能触发拆箱

条件表达式和比较也可能触发拆箱，例如 `quantity > 0`、`flag ? boxed : 0`，排查空指针时要查看编译器选择的目标类型。

:::

## 四、包装对象比较与缓存

### 1. == 比较包装对象身份

`Integer.valueOf` 至少缓存 `-128～127`，因此小整数身份比较可能为 `true`：

```java
Integer first = Integer.valueOf(127);
Integer second = Integer.valueOf(127);
System.out.println(first == second); // true
```

::: tip 把缓存行为与业务相等性分开

缓存范围外是否复用对象不能作为业务契约，JVM 参数也可能扩大部分缓存。数值比较应使用 `equals`、拆箱后的基本类型比较，或 `Integer.compare`。

:::

### 2. equals 要求包装类型也相同

```java
Integer intValue = 1;
Long longValue = 1L;
System.out.println(intValue.equals(longValue)); // false
```

两者数学值相同，但类型不同。跨数值类型比较需要先选择不会溢出且语义正确的共同表示，不能依赖包装类自动互转。

`Double.equals` 对 `NaN` 和正负零有定义好的对象契约，与基本类型 `==` 的部分行为不同；金额仍不应使用 `Double`，应使用 `BigDecimal` 或最小货币单位整数。

## 五、解析文本与生成字符串

`parseInt` 返回基本类型，`valueOf` 返回包装类型：

```java
int port = Integer.parseInt("8080");
Integer optionalPort = Integer.valueOf("8080");
String text = Integer.toString(port);
```

非法数字、超出目标类型范围都会抛出 `NumberFormatException`。解析前后还要处理空白、进制、正负号和业务范围；能解析成整数不代表它是合法端口、数量或年龄。

::: warning 布尔解析不会拒绝所有非法文本

`Boolean.parseBoolean` 较特殊：只有忽略大小写等于 `"true"` 时返回 `true`，其他字符串包括拼写错误都返回 `false`，不会抛出异常。严格配置解析应先验证允许值，避免把错误配置静默当成关闭。

:::

## 六、泛型集合需要引用类型

Java 泛型类型参数不能写基本类型，因此列表要使用 `List<Integer>`，不能写 `List<int>`：

```java
List<Integer> quantities = List.of(1, 2, 3);
for (Integer quantity : quantities) {
    total += quantity;
}
```

添加元素时发生装箱，参与加法时发生拆箱。如果集合允许 `null`，循环中的隐式拆箱可能失败。集合语义、泛型约束和性能选择会在后续章节展开。

大量数值数据使用包装集合会产生对象和间接访问成本。应先通过性能测量确认瓶颈，再考虑基本类型数组或专用数据结构，而不是因为一次装箱就提前优化普通业务代码。

## 七、运行包装类型示例

完整源码保存为 `WrapperTypesDemo.java`。默认路径展示装箱、拆箱、缓存、内容比较、解析和列表求和。


将以下代码保存为 `WrapperTypesDemo.java`：

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看 WrapperTypesDemo 完整代码

```java [WrapperTypesDemo.java]
import java.util.List;

/**
 * 演示包装类型、自动装箱拆箱、缓存身份和空拆箱失败。
 */
public final class WrapperTypesDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private WrapperTypesDemo() {
    }

    /**
     * 输出装箱、比较、解析和集合拆箱结果；可选参数触发空拆箱。
     *
     * @param args 传入 null-unbox 时复现 NullPointerException
     */
    public static void main(String[] args) {
        if (args.length > 0 && "null-unbox".equals(args[0])) {
            Integer missingQuantity = null;
            int requiredQuantity = missingQuantity;
            System.out.println(requiredQuantity);
            return;
        }

        Integer boxed = 42;
        int unboxed = boxed;
        Integer cachedA = Integer.valueOf(127);
        Integer cachedB = Integer.valueOf(127);
        Integer outsideA = Integer.valueOf(128);
        Integer outsideB = Integer.valueOf(128);
        int parsed = Integer.parseInt("2048");

        System.out.println("boxed=" + boxed + ", unboxed=" + unboxed);
        System.out.println("cached 127 identity=" + (cachedA == cachedB));
        System.out.println("128 identity on this runtime=" + (outsideA == outsideB));
        System.out.println("128 content equals=" + outsideA.equals(outsideB));
        System.out.println("parsed=" + parsed);
        System.out.println("list sum=" + sum(List.of(1, 2, 3)));
    }

    /**
     * 累加包装类型列表，读取元素时发生自动拆箱。
     *
     * @param quantities 非 null 数量列表，不能包含 null 元素
     * @return 所有数量的整数和
     */
    private static int sum(List<Integer> quantities) {
        int result = 0;
        for (Integer quantity : quantities) {
            result = Math.addExact(result, quantity);
        }
        return result;
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out WrapperTypesDemo.java
java -cp out WrapperTypesDemo
```

预期输出：

```text
boxed=42, unboxed=42
cached 127 identity=true
128 identity on this runtime=false
128 content equals=true
parsed=2048
list sum=6
```

第三行只记录当前验证 JVM 的观察值，不是允许使用 `==` 的依据；第四行的内容比较才是稳定业务结论。

运行空拆箱失败路径：

```powershell
java -cp out WrapperTypesDemo null-unbox
```

进程以非零状态结束，Java 21 详细空指针信息会指出 `missingQuantity` 为 `null`，无法调用 `Integer.intValue()`。修复应回到输入契约判断缺失是否合法，而不是在所有使用处捕获空指针。

## 八、Java 8 维护线

::: info Java 8 集合替代写法具有不同限制

装箱、拆箱、缓存和解析规则在 Java 8 中基本一致。示例中的 `List.of` 是 Java 9 新增 API，Java 8 可使用 `Arrays.asList(1, 2, 3)`；得到的列表大小固定，但允许替换已有位置的元素，语义并不完全等同于不可修改列表。

:::

迁移时应特别检查历史代码中的 `Integer` 空值、`==` 比较和三元表达式隐式拆箱。这些不是升级到 Java 21 才产生的问题，新版本详细异常信息只是让定位更容易。

## 九、常见错误

| 错误 | 失败表现 | 修正 |
|------|----------|------|
| 用 `==` 比较包装数值 | 小值通过、大值或配置变化后失败 | 使用 `equals` 或数值比较方法 |
| 允许 `null` 后直接参与算术 | 隐式拆箱产生空指针 | 在边界明确缺失语义 |
| 用包装类型做密集循环计数 | 产生装箱和可能的对象分配 | 局部计算优先基本类型 |
| 认为 `parseBoolean` 会拒绝拼写错误 | 错误文本静默变为 `false` | 先验证允许的字符串集合 |
| 用 `Integer` 承载超范围标识 | 解析溢出或截断 | 根据范围使用 `long`、`BigInteger` 或文本标识 |

规范依据可参阅 [JLS 5.1.7：Boxing Conversion](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.7)、[JLS 5.1.8：Unboxing Conversion](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.8) 与 [Java 21 Integer API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html)。
