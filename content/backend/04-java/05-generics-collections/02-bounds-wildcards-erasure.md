---
title: "泛型边界与类型擦除"
tags:
  - Java
  - 泛型
  - 类型擦除
excerpt: "解释类型上界、不变性、通配符与 PECS 如何约束泛型 API，并通过订单数据示例、编译错误、字节码和堆污染复现，区分编译期保证与运行时检查的边界。"
date: 2026-09-08
---

# 泛型边界与类型擦除 {#泛型边界、通配符与类型擦除}

泛型边界决定类型参数具备哪些能力，通配符决定一个引用允许怎样读写数据，类型擦除决定这些约束如何落实到字节码。三者共同回答一个问题：一个泛型 API 为什么接受某些调用、拒绝另一些调用，以及哪些错误仍会在运行时暴露。

## 一、类型上界与泛型不变性

### 1. 上界约束能力，不决定实际传入的类

方法声明中的 `<T>` 引入一个有名字的类型变量；调用时，编译器根据参数和上下文推断满足约束的类型。`<T extends Number>` 进一步要求这个类型能够作为 `Number` 使用，所以方法体可以调用 `intValue()` 等已知成员。类型变量的声明方式可参照[泛型类、接口与方法](./01-generic-types-methods.md)。

上界可以包含一个类和多个接口；存在类上界时，类必须放在第一位。下面从下方完整 `GenericBoundsDemo.java` 提取的方法是类成员，需要该文件中的 `Objects` 导入；它同时要求数值能力和比较能力，返回时仍保留具体的 `T`。[类型参数边界规则](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.4)

::: details 查看泛型边界、通配符与类型擦除：上界约束能力，不决定实际传入的类的完整代码

```java
// GenericBoundsDemo.java（成员片段）
/**
 * 在同一数值类型内返回较大值，保留原始类型及其数值表示。
 *
 * @param first 第一个非 null 数值
 * @param second 第二个非 null 数值；必须满足同一个 T 的约束
 * @param <T> 同时是 Number 子类型，且能够与 T 或其父类型进行比较
 * @return 较大值的原引用；相等时返回 first，不改变 scale 等表示信息
 */
static <T extends Number & Comparable<? super T>> T maximum(T first, T second) {
    Objects.requireNonNull(first, "first");
    Objects.requireNonNull(second, "second");
    return first.compareTo(second) >= 0 ? first : second;
}
```

:::

传入两个 `BigDecimal` 时，结果仍是 `BigDecimal`，不会先转为 `double` 再比较；样例中 `19.90` 和 `29.90` 得到 `29.90`。`Comparable<? super T>` 允许比较能力由 `T` 自身或其父类型提供，不强迫每个子类重新实现一个新的比较接口。

::: info 类型能力与业务约束分别验证

上界只提供类型能力，不保证“数值为正”“库存足够”等业务条件。这里要求非 `null`，但没有验证金额币种、精度或业务范围；这些条件应由业务模型承担。金额表示规则由[BigInteger 与 BigDecimal](../04-core-apis/04-big-numbers.md)主讲。

:::

### 2. 不变性避免通过另一个引用写入错误类型

`Integer` 是 `Number` 的子类型，不代表 `List<Integer>` 是 `List<Number>` 的子类型。如果允许这种赋值，同一个数量列表就能通过 `List<Number>` 引用加入 `Double`，破坏原有元素契约。因此，普通参数化类型具有不变性；需要更宽的接收范围时，必须显式表达通配符。[泛型继承与子类型](https://docs.oracle.com/javase/tutorial/java/generics/inheritance.html)

下面是 `InvalidGenerics.java` 中的错误字段声明，不是可运行程序。第七节给出完整错误文件和复现命令。

```java
// InvalidGenerics.java（错误成员片段）
List<Number> quantities = new ArrayList<Integer>();
```

实际编译诊断包含 `ArrayList<Integer> cannot be converted to List<Number>`。正确选择取决于使用目的：只读取数字时接收 `List<? extends Number>`；需要确实混合存放多种数字时，从一开始创建 `List<Number>`。

数组采用不同的规则。`Number[]` 可以引用 `Integer[]`，但数组对象保留运行时元素类型，存入 `Double` 会触发 `ArrayStoreException`。这不能作为把两种 `List` 强制互转的理由：列表元素契约不由这种数组存储检查保护。

## 二、通配符限制的是引用的使用方式

### 1. 通配符的读写边界 {#_1-extends-适合读取-super-适合接收写入}

`List<? extends Number>` 表示元素类型是某个未知的 `Number` 子类型。读取值可以作为 `Number` 使用，但添加 `Integer` 不安全：实际列表也可以是 `List<BigDecimal>`。

`List<? super Integer>` 表示元素类型是 `Integer` 或其某个父类型。写入 `Integer` 安全，但读取时只能保证得到 `Object`：如果底层是 `List<Object>`，原有元素可以是字符串。生产者、消费者要从**当前方法如何使用参数**判断。[通配符使用原则](https://docs.oracle.com/javase/tutorial/java/generics/wildcardGuidelines.html)

| 引用类型 | 读取时保证的静态类型 | 能否加入 Integer | 能否加入其他 Number |
|---|---|---|---|
| `List<Number>` | `Number` | 能 | 能 |
| `List<? extends Number>` | `Number` | 不能 | 不能 |
| `List<? super Integer>` | `Object` | 能 | 不能据此加入 Double 等其他数值 |
| `List<?>` | `Object` | 不能 | 不能 |
| `List<Object>` | `Object` | 能 | 能 |

::: warning 类型检查通过不保证集合可修改

这张表描述类型检查，不保证底层集合支持修改。`List.of(...)` 返回的列表不支持添加和删除；某些集合也拒绝 `null`。通配符引用在类型层面可以接受 `null`，实际调用还要满足具体 API 的限制。

:::

### 2. 未知类型与可变性 {#_2-extends-不等于不可变-未知也不等于-object}

上界通配符限制“放入一个无法证明匹配的元素”，并没有删除列表的修改接口。`clear()`、按索引删除等操作仍能通过类型检查；是否执行成功由集合实现决定。

下面是完整正向程序中的局部语句。这里显式使用可修改的 `ArrayList`，因此清空操作会影响原来的数量列表；`ArrayList`、`List` 已由宿主文件导入。

```java
// GenericBoundsDemo.java（main 中的局部语句）
List<Integer> quantities = new ArrayList<>(List.of(2, 3));
List<? extends Number> producer = quantities;
Number first = producer.get(0);
producer.clear();
System.out.println("extends clear size=" + quantities.size());
```

输出为 `extends clear size=0`。这里没有创建不可变包装，也没有复制列表；它只是同一对象的另一个静态类型视角。

`List<?>` 同样不是 `List<Object>`。`?` 是“某种尚不知道的元素类型”，并非允许随意放入对象。两份 `List<?>` 的元素类型也不必相同，不能因为它们都写着问号就互相搬运元素。

### 3. 用同一个 T 关联生产者与消费者

PECS 即“生产者使用 extends，消费者使用 super”。例如把商品数量追加到审计列表，来源可以更具体，目标可以更宽，但两者必须围绕同一个 `T` 建立关系。

下面是下方完整正向程序中的完整成员方法；它依赖 `List`、`ArrayList`、`Objects` 导入。快照用于避免源和目标是同一列表时边遍历边追加，不提供并发一致性，也不进行对象深拷贝。

::: details 查看泛型边界、通配符与类型擦除：用同一个 T 关联生产者与消费者的完整代码

```java
// GenericBoundsDemo.java（成员片段）
/**
 * 读取生产者并把元素引用追加到消费者，使用快照避免源与目标别名影响遍历。
 *
 * <p>无返回值；按原顺序追加引用，不深拷贝；目标拒绝元素时不保证回滚。</p>
 *
 * @param source 非 null 来源列表；元素允许为 null
 * @param target 非 null 且支持 add 的目标列表；元素合法性由目标实现决定
 * @param <T> 连接读取类型与允许写入类型的共同类型
 */
static <T> void copyTo(List<? extends T> source, List<? super T> target) {
    Objects.requireNonNull(source, "source");
    Objects.requireNonNull(target, "target");
    for (T value : new ArrayList<T>(source)) {
        target.add(value);
    }
}
```

:::

`copyTo(List<Integer>, List<Number>)` 合法；把字符串列表复制到整数列表则没有满足两个方向约束的 `T`，编译器会拒绝。两个独立的 `List<?>` 参数无法表达这种关系。

::: warning 类型安全不提供追加操作的原子性

方法会把值追加到目标末尾，目标需要支持 `add`。若目标在追加过程中拒绝某个元素，此方法不回滚此前写入；API 的类型安全和操作的原子性是不同承诺。标准库的 `Collections.copy` 也使用类似的类型关系，但它替换已有位置，要求目标长度足够，并不是这里的追加实现。[Collections.copy API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html#copy(java.util.List,java.util.List))

:::

## 三、捕获转换为未知类型建立局部名字

当元素来自同一个列表时，即使不知道元素类型，也能安全地调整它们的位置。困难在于让编译器证明“读出的值与写回位置具有同一个未知类型”，而不是用强制转换绕过检查。

下面的错误成员位于第七节完整失败文件。直接将一次通配符读取放入另一次通配符调用，不能建立所需的捕获关系；本机诊断为 `Object cannot be converted to CAP#1`。

```java
// InvalidGenerics.java（错误成员片段）
/**
 * 演示捕获关系无法直接建立；无返回值。
 * @param values 未知元素类型列表，仅用于编译验证
 */
void restoreFirst(List<?> values) {
    values.set(0, values.get(0));
}
```

`CAP#1` 是编译器为捕获到的未知类型使用的诊断名称，不是需要手工声明的 Java 类。通过辅助方法引入 `T`，可以在一次调用中保存这层关系。以下两个成员来自正向程序，公共入口负责接收未知类型，辅助方法在同一个 `List<T>` 上读写。[捕获转换](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.10)、[捕获辅助方法](https://docs.oracle.com/javase/tutorial/java/generics/capture.html)

::: details 查看泛型边界、通配符与类型擦除：捕获转换为未知类型建立局部名字的完整代码

```java
// GenericBoundsDemo.java（成员片段）
/**
 * 交换未知元素类型列表的前两个元素；不足两个元素时保持原样。
 *
 * <p>无返回值；通过捕获辅助方法原地交换。</p>
 *
 * @param values 非 null 列表；发生交换时必须支持 set
 */
static void swapFirstTwo(List<?> values) {
    Objects.requireNonNull(values, "values");
    swapCaptured(values);
}

/**
 * 为一次通配符捕获命名，确保读取的元素只能写回同一捕获类型的列表。
 *
 * <p>无返回值；不足两个元素不修改，否则交换前两个引用。</p>
 *
 * @param values 非 null 列表；至少两个元素时必须支持 set
 * @param <T> 编译器针对当前列表推断的捕获类型
 */
private static <T> void swapCaptured(List<T> values) {
    if (values.size() >= 2) {
        T first = values.get(0);
        values.set(0, values.get(1));
        values.set(1, first);
    }
}
```

:::

订单编号列表 `[ORD-1001, ORD-1002]` 会变成 `[ORD-1002, ORD-1001]`；不足两个元素时不修改。整个过程没有转换到 `List<Object>`，没有引入原始类型，也没有关闭编译警告。

辅助方法只能捕获当前列表的类型，不能证明两份无关的 `List<?>` 元素兼容。需要跨容器传递数据时，应在 API 上显式声明像 `copyTo` 那样的共同类型关系。

## 四、类型擦除如何保留调用契约

### 1. 描述符、泛型签名与实例类型不是同一层信息

编译器先按泛型规则检查源码，再按照擦除规则生成 JVM 使用的类型描述：参数化类型去掉类型实参，无上界的类型变量使用 `Object`，有上界的类型变量使用最左侧上界的擦除类型。[JLS 类型擦除](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.6)

| 源码形式 | 擦除后的类型或描述 | 直接影响 |
|---|---|---|
| `List<String>`、`List<Integer>` | 都是 `List` | 不按元素类型生成两套 ArrayList 类 |
| 无显式上界的 `T` | `Object` | `ValueSlot<T>.get()` 的描述符返回 Object |
| `T extends Number & Comparable<? super T>` | `Number` | `maximum` 的参数和返回描述符使用 Number |
| `List<? extends T>` | `List` | 具体通配符关系由源码检查与签名信息描述 |

::: info 擦除后仍可能保留泛型声明信息

擦除不等于“类文件没有任何泛型信息”。`Signature` 属性可以保留类、字段或方法的泛型声明；但一个普通 `ArrayList<String>` 对象不会因此拥有逐元素验证 `String` 的运行时能力。读取完整 `Type` 元数据属于注解反射章节；这里仅用 `javap` 区分描述符与声明签名。

:::

下面是第二个独立完整程序。它通过泛型父类引用写入和读取订单编号，同时产生可以检查的桥接方法；无外部依赖，使用 JDK 21。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看GenericErasureDemo的完整代码

```java
// GenericErasureDemo.java
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/** 通过相同运行时类和覆写调用，提供检查擦除描述符与桥接方法的字节码样本。 */
public final class GenericErasureDemo {

    /** 禁止创建只承载静态示例的入口对象。 */
    private GenericErasureDemo() {
    }

    /**
     * 调用泛型父类型引用，供 javap 观察桥接转发和读取点的 checkcast。
     *
     * <p>无返回值；输出类身份比较和订单编号。</p>
     *
     * @param args 不读取启动参数
     */
    public static void main(String[] args) {
        List<String> orderIds = new ArrayList<>();
        List<Integer> quantities = new ArrayList<>();
        boolean sameClass = orderIds.getClass() == quantities.getClass();
        assert sameClass;
        System.out.println("same runtime class=" + sameClass);

        ValueSlot<String> slot = new OrderIdSlot();
        slot.set("ORD-1001");
        String orderId = slot.get();
        assert "ORD-1001".equals(orderId);
        System.out.println("order id=" + orderId);
    }

    /**
     * 保存单个类型安全的值；未显式给 T 上界，因此擦除后使用 Object。
     *
     * @param <T> 由调用方声明的值类型
     */
    static class ValueSlot<T> {
        private T value;

        /**
         * 保存非 null 值，泛型约束在调用点限制允许传入的静态类型。
         *
         * <p>无返回值；替换当前保存的引用。</p>
         *
         * @param value 非 null 值，必须符合 T
         */
        void set(T value) {
            this.value = Objects.requireNonNull(value, "value");
        }

        /**
         * 读取当前值，供编译器在有具体类型的调用点插入必要转换。
         *
         * @return 已设置的值；尚未调用 set 时返回 null
         */
        T get() {
            return value;
        }
    }

    /** 固定父类类型参数并覆写 set，触发编译器生成 set(Object) 桥接方法。 */
    static final class OrderIdSlot extends ValueSlot<String> {

        /**
         * 按 String 签名覆写父类方法，保持父类的非 null 约束。
         *
         * <p>无返回值；将值保存到父类字段。</p>
         *
         * @param value 非 null 的演示订单编号
         */
        @Override
        void set(String value) {
            super.set(value);
        }
    }
}
```

:::

编译和执行方式见第七节。实际输出的 `same runtime class=true` 表示这两个普通 ArrayList 实例具有同一个运行时类；`order id=ORD-1001` 表示泛型父类引用仍正确完成调用。

### 2. 类型检查与桥接方法 {#_2-checkcast-保证读取点-桥接方法保持覆写关系}

`ValueSlot<T>.set(T)` 擦除后是 `set(Object)`，但子类源码声明的是 `set(String)`。为使通过父类型发起的调用仍到达子类覆写，编译器在子类补充一个 `set(Object)` 桥接方法：先将实参检查为 String，再转发给源码中的 `set(String)`。[桥接方法的作用](https://docs.oracle.com/javase/tutorial/java/generics/bridgeMethods.html)

::: tip PowerShell 中嵌套类名使用单引号

在本篇示例目录完成第七节编译后，执行以下 PowerShell 命令。嵌套类名含有 `$`，必须保留单引号，避免 PowerShell 将它解释成变量。

:::

```powershell
javap -classpath out -p -c -v 'GenericErasureDemo$OrderIdSlot'
javap -classpath out -p -c GenericErasureDemo
javap -classpath out -p -s GenericBoundsDemo
```

本机子类输出中，桥接方法的关键摘录如下；这里只省略了常量池、行号表和其他方法。

```text
void set(java.lang.Object);
  descriptor: (Ljava/lang/Object;)V
  flags: (0x1040) ACC_BRIDGE, ACC_SYNTHETIC
  Code:
    stack=2, locals=2, args_size=2
       0: aload_0
       1: aload_1
       2: checkcast     #11                 // class java/lang/String
       5: invokevirtual #13                 // Method set:(Ljava/lang/String;)V
       8: return
```

`ACC_BRIDGE` 和 `ACC_SYNTHETIC` 表明它由编译器补充；`checkcast` 执行运行时类型检查。`main` 中读取 `slot.get()` 的位置也会出现检查到 String 的转换，因为父类方法描述符返回 Object。

同一次编译中，`maximum` 的参数和返回描述符都是 Number：

```text
descriptor: (Ljava/lang/Number;Ljava/lang/Number;)Ljava/lang/Number;
```

泛型类型参数不会直接变成一个运行时“万能类型”。编译器用静态检查、擦除后的签名、必要转换和桥接方法共同维持调用契约；经原始类型绕过检查的错误仍会在这些转换处暴露。

## 五、运行时不能恢复任意类型实参

### 1. new T、泛型数组与相同擦除的重载

可具体化类型是运行时具有足够类型信息的类型，例如非泛型类、原始类型以及类型实参全为无界通配符的参数化类型。`List<?>` 属于这一类，`List<String>` 不属于。[可具体化类型](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.7)

由此可以解释以下限制。表内是语法片段，非法项的完整编译证据见第七节。

| 写法 | 判断与原因 | 对应处理 |
|---|---|---|
| `new T()` | 类型变量不是一个可直接实例化的具体类，也没有声明可调用构造器 | 接受已创建的 T；确需创建时由调用方传入显式构造策略 |
| `new T[2]` | 不能创建元素类型为不可具体化类型变量的数组 | 在明确需求下使用 `List<T>` 或由调用方提供类型正确的数组 |
| `new List<String>[2]` | 数组无法检查被存入 List 的 String 元素契约 | 优先使用 `List<List<String>>` |
| `new List<?>[2]` | 合法，数组只需保证元素是某种 List | 读取内部元素时仍只有未知类型，不能自动变为 String |
| 同时声明 `importOrders(List<String>)` 和 `importOrders(List<Integer>)` | 擦除后参数都为 List，发生方法签名冲突 | 按业务职责改名或使用明确不同的参数类型 |

`List<int>` 也不是合法类型实参，应使用包装类型或适合业务的数据结构；上界不能改写成 `<T super Integer>`。下界形式用于 `?`，不能据此声明一个带下界的类型参数。擦除后的重载冲突由[方法签名与覆写约束](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.3)规定，不能靠改返回类型解决。

### 2. instanceof 的泛型限制 {#_2-java-21-的-instanceof-要结合表达式静态类型}

当来源仅为 `Object` 时，`value instanceof List<String>` 无法验证所有元素都是 String，编译器会拒绝；`value instanceof List<?>` 只能确定它是 List。若业务需要字符串元素，仍须逐个验证并构造类型明确的结果。

不能把这条限制写成“所有参数化类型都不能出现在 instanceof 中”。Java 21 允许在已有静态类型信息足够的情况下进行更具体的判断。例如下面是正向程序中的局部语句，`orderIds` 已经具有 `List<String>` 静态类型，检查的是实现类，不是在运行时恢复 String 元素信息。[JLS 21 instanceof 规则](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.20.2)

```java
// GenericBoundsDemo.java（main 中的局部语句）
List<String> orderIds = new ArrayList<>(List.of("ORD-1001", "ORD-1002"));
boolean arrayList = orderIds instanceof ArrayList<String>;
System.out.println("typed instanceof=" + arrayList);
```

本机输出 `typed instanceof=true`。这种检查沿用已建立的泛型约束；如果原有引用已经受堆污染破坏，该检查仍不会检查容器内部每个元素。

## 六、原始类型和可变参数的堆污染

### 1. 警告发生的位置与异常发生的位置可以不同

原始类型 `List` 会丢失元素类型约束。若先把 `List<String>` 暴露为原始类型，再加入整数，写入时仍是一个合法 Object，读取为 String 时才触发类型转换失败。定位时应回查未经检查的写入，而不能只在读取处增加强制转换或吞掉异常。

堆污染指参数化类型变量引用了不符合其声明参数化类型的对象。它还可以通过泛型数组的别名产生：`List<String>...` 形参具有数组形式，通过 `Object[]` 别名放入 `List<Integer>` 时，数组存储检查只看到 List，无法验证其元素类型。[堆污染定义](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12.2)、[不可具体化可变参数](https://docs.oracle.com/javase/tutorial/java/generics/nonReifiableVarargsType.html)

下面是完整故障程序，故意保留原始类型和未经检查警告。它只用于本地验证，不加入正常示例的 `-Werror` 编译集合。

::: details 查看UnsafeGenericDemo的完整代码

```java
// UnsafeGenericDemo.java
import java.util.ArrayList;
import java.util.List;

/** 故意保留警告和错误，用于复现原始类型与泛型可变参数导致的堆污染。 */
public final class UnsafeGenericDemo {

    /** 禁止实例化故障示例入口。 */
    private UnsafeGenericDemo() {
    }

    /**
     * 选择一种堆污染；两种合法模式均应在读取 String 时以 ClassCastException 退出。
     *
     * <p>正常情况下无返回；故意触发异常，并在失败前输出所选模式。</p>
     *
     * @param args 无参数或 raw 复现原始类型污染；varargs 复现数组别名污染
     */
    public static void main(String[] args) {
        String mode = args.length == 0 ? "raw" : args[0];
        System.out.println("mode=" + mode);
        if ("raw".equals(mode)) {
            System.out.println(readPollutedOrder());
        } else if ("varargs".equals(mode)) {
            System.out.println(readPollutedGroup(List.of("ORD-1001")));
        } else {
            throw new IllegalArgumentException("mode must be raw or varargs");
        }
    }

    /**
     * 经原始类型引用写入错误元素；新代码应保留 {@code List<String>}，让错误在编译期被拒绝。
     *
     * @return 本应是订单编号；实际读取时因 Integer 不能转为 String 而失败
     */
    private static String readPollutedOrder() {
        List<String> orderIds = new ArrayList<>();
        List rawOrders = orderIds;
        rawOrders.add(1001);
        return orderIds.get(0);
    }

    /**
     * 将泛型数组暴露为 Object[] 后替换一个分组，演示数组检查无法验证列表元素类型。
     *
     * @param groups 至少包含一个非空字符串分组；演示仅传入一组
     * @return 本应是订单编号；实际读取错误分组时触发 ClassCastException
     */
    private static String readPollutedGroup(List<String>... groups) {
        Object[] aliases = groups;
        aliases[0] = List.of(1001);
        return groups[0].get(0);
    }
}
```

:::

编译时得到4条警告，分别指向原始类型、未经检查的添加、可变参数声明和调用点数组创建。两种模式均以 ClassCastException 失败；第七节分别运行，避免把“出现警告”直接当作“运行时一定已经发生污染”的证明。

### 2. SafeVarargs 的安全承诺 {#_2-safevarargs-是作者承诺-不是运行时保护}

`@SafeVarargs` 表示作者确认方法或构造器对可变参数数组的使用安全；它抑制相应未经检查警告，不会生成元素验证或自动修复数组别名。Java 21 中可变参数方法还须是 `static`、`final` 或 `private` 才能使用该注解；构造器也有相应适用范围。[SafeVarargs API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/SafeVarargs.html)

正向程序中的 `flatten` 只读取分组，把元素引用复制到新列表，不修改或泄露可变参数数组，所以能够作出这个承诺。若把故障程序的 `readPollutedGroup` 加上注解，危险写入仍然存在。

::: tip 无法证明数组安全时调整 API

审查这类方法时，要检查数组是否被写入不匹配内容、交给不受控方法或返回给外部。若无法证明安全，可以将 API 改成接收一个普通的分组列表，而不是通过注解压下警告。

:::

## 七、订单示例的编译、运行与失败证据

### 1. 完整正向源码与运行入口

以下完整文件把类型上界、数量复制、捕获交换、安全分组合并和 instanceof 检查放到独立的本地输入上。需要 JDK 21，无 Maven 或外部服务依赖；演示订单编号和金额仅用于说明类型行为。实际验证环境为 Corretto 21.0.11，`javac 21.0.11`。

前面已经直接展示了核心方法；下面展开后可复制整个文件，包含 import、入口、断言及所有辅助方法。

::: details 查看 GenericBoundsDemo 完整源码

```java
// GenericBoundsDemo.java
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/** 用订单金额、数量和编号验证上界、PECS、捕获转换及安全的泛型可变参数。 */
public final class GenericBoundsDemo {

    /** 禁止创建只承载静态示例的入口对象。 */
    private GenericBoundsDemo() {
    }

    /**
     * 运行互不共享外部状态的正向示例；使用 -ea 启用行为断言。
     *
     * <p>无返回值；输出断言通过后的观察结果。</p>
     *
     * @param args 不读取启动参数
     */
    public static void main(String[] args) {
        BigDecimal higher = maximum(new BigDecimal("19.90"), new BigDecimal("29.90"));
        assert higher.equals(new BigDecimal("29.90"));
        System.out.println("maximum=" + higher);

        List<Integer> quantities = new ArrayList<>(List.of(2, 3));
        List<Number> copied = new ArrayList<>();
        copyTo(quantities, copied);
        assert copied.equals(List.of(2, 3));
        System.out.println("copied quantities=" + copied);

        List<? extends Number> producer = quantities;
        Number first = producer.get(0);
        assert first.equals(2);
        producer.clear();
        assert quantities.isEmpty();
        System.out.println("extends clear size=" + quantities.size());

        List<? super Integer> consumer = copied;
        consumer.add(5);
        Object stored = consumer.get(2);
        assert stored.equals(5);
        System.out.println("consumer stored=" + stored);

        List<String> orderIds = new ArrayList<>(List.of("ORD-1001", "ORD-1002"));
        swapFirstTwo(orderIds);
        assert orderIds.equals(List.of("ORD-1002", "ORD-1001"));
        System.out.println("swapped orders=" + orderIds);

        List<Number> emptyTarget = new ArrayList<>();
        copyTo(List.<Integer>of(), emptyTarget);
        swapFirstTwo(new ArrayList<String>());
        assert emptyTarget.isEmpty();
        System.out.println("empty inputs=unchanged");

        List<String> merged = flatten(List.of("ORD-1001"), List.of("ORD-1002"));
        assert merged.equals(List.of("ORD-1001", "ORD-1002"));
        System.out.println("flattened orders=" + merged);

        boolean arrayList = orderIds instanceof ArrayList<String>;
        assert arrayList;
        System.out.println("typed instanceof=" + arrayList);
    }

    /**
     * 在同一数值类型内返回较大值，保留原始类型及其数值表示。
     *
     * @param first 第一个非 null 数值
     * @param second 第二个非 null 数值；必须满足同一个 T 的约束
     * @param <T> 同时是 Number 子类型，且能够与 T 或其父类型进行比较
     * @return 较大值的原引用；相等时返回 first，不改变 scale 等表示信息
     */
    static <T extends Number & Comparable<? super T>> T maximum(T first, T second) {
        Objects.requireNonNull(first, "first");
        Objects.requireNonNull(second, "second");
        return first.compareTo(second) >= 0 ? first : second;
    }

    /**
     * 读取生产者并把元素引用追加到消费者，使用快照避免源与目标别名影响遍历。
     *
     * <p>无返回值；按原顺序追加引用，不深拷贝；目标拒绝元素时不保证回滚。</p>
     *
     * @param source 非 null 来源列表；元素允许为 null
     * @param target 非 null 且支持 add 的目标列表；元素合法性由目标实现决定
     * @param <T> 连接读取类型与允许写入类型的共同类型
     */
    static <T> void copyTo(List<? extends T> source, List<? super T> target) {
        Objects.requireNonNull(source, "source");
        Objects.requireNonNull(target, "target");
        for (T value : new ArrayList<T>(source)) {
            target.add(value);
        }
    }

    /**
     * 交换未知元素类型列表的前两个元素；不足两个元素时保持原样。
     *
     * <p>无返回值；通过捕获辅助方法原地交换。</p>
     *
     * @param values 非 null 列表；发生交换时必须支持 set
     */
    static void swapFirstTwo(List<?> values) {
        Objects.requireNonNull(values, "values");
        swapCaptured(values);
    }

    /**
     * 为一次通配符捕获命名，确保读取的元素只能写回同一捕获类型的列表。
     *
     * <p>无返回值；不足两个元素不修改，否则交换前两个引用。</p>
     *
     * @param values 非 null 列表；至少两个元素时必须支持 set
     * @param <T> 编译器针对当前列表推断的捕获类型
     */
    private static <T> void swapCaptured(List<T> values) {
        if (values.size() >= 2) {
            T first = values.get(0);
            values.set(0, values.get(1));
            values.set(1, first);
        }
    }

    /**
     * 合并订单分组；只读取可变参数数组，不向数组写入或将其引用交给外部。
     *
     * @param groups 非 null 的分组数组，各列表非 null；列表元素允许为 null
     * @param <T> 所有分组元素的共同类型
     * @return 按分组顺序复制元素引用的新列表，不共享可变参数数组
     */
    @SafeVarargs
    private static <T> List<T> flatten(List<? extends T>... groups) {
        Objects.requireNonNull(groups, "groups");
        List<T> result = new ArrayList<>();
        for (List<? extends T> group : groups) {
            result.addAll(Objects.requireNonNull(group, "group"));
        }
        return result;
    }
}
```

:::

在本篇示例目录执行以下 PowerShell 命令，显式只编译两个正常程序。`-Werror` 会把编译警告视为失败，`-ea` 会启用运行断言；输出写入 `.build`，不污染源码目录。

```powershell
New-Item -ItemType Directory -Force -Path 'out' | Out-Null
javac -Xlint:all -Werror -encoding UTF-8 -d out GenericBoundsDemo.java GenericErasureDemo.java
if ($LASTEXITCODE -ne 0) { throw '正常示例编译失败' }
java -ea -cp out GenericBoundsDemo
if ($LASTEXITCODE -ne 0) { throw '边界与通配符示例运行失败' }
java -ea -cp out GenericErasureDemo
if ($LASTEXITCODE -ne 0) { throw '擦除示例运行失败' }
```

两个程序按上述顺序执行，本机实际输出如下：

```text
maximum=29.90
copied quantities=[2, 3]
extends clear size=0
consumer stored=5
swapped orders=[ORD-1002, ORD-1001]
empty inputs=unchanged
flattened orders=[ORD-1001, ORD-1002]
typed instanceof=true
same runtime class=true
order id=ORD-1001
```

复制得到数量 `[2, 3]`，说明读写方向可以不同但仍受共同类型约束；清空结果证明 extends 不是不可变集合。交换和空输入断言验证捕获辅助方法的行为边界；最后两行则提供运行时类身份和泛型父类调用的观察入口。

::: info 泛型示例没有验证并发与事务能力

这些断言与编译诊断共同支撑语言行为，没有验证并发修改、深拷贝、事务回滚或生产吞吐。例子的“类型安全”不应被扩展为这些额外保证。

:::

### 2. 九处静态错误的独立复现

把下面内容保存为 `InvalidGenerics.java`。它是刻意无法编译的完整文件，必须单独编译，不加入两个正常程序的编译命令；每个错误都对应前面已经解释的类型限制。

::: details 查看独立编译失败源码

```java
// InvalidGenerics.java
import java.util.ArrayList;
import java.util.List;

/**
 * 故意产生九处编译错误的独立文件，不属于正常示例编译集合。
 *
 * @param <T> 未指定上界的类型变量，用于观察 new T 和泛型数组限制
 */
final class InvalidGenerics<T> {
    List<Number> quantities = new ArrayList<Integer>();
    List<String>[] orderGroups = new List<String>[2];

    /**
     * 演示上界视图不能接收任意具体 Number；无返回值。
     *
     * @param values 元素类型为某个未知 Number 子类型的列表
     */
    void writeProducer(List<? extends Number> values) {
        values.add(1);
    }

    /**
     * 演示下界视图读取结果不能直接声明为 Number。
     *
     * @param values 可接收 Integer，但原有元素类型未必是 Number 的列表
     * @return 本想返回 Number；实际编译失败
     */
    Number readConsumer(List<? super Integer> values) {
        return values.get(0);
    }

    /**
     * 演示两个通配符捕获不能仅凭同一个变量名建立关系；无返回值。
     *
     * @param values 未知元素类型列表；本例只验证类型检查
     */
    void restoreFirst(List<?> values) {
        values.set(0, values.get(0));
    }

    /**
     * 演示类型变量不能直接实例化。
     *
     * @return 本想创建 T；实际编译失败
     */
    T create() {
        return new T();
    }

    /**
     * 演示不能创建元素类型为 T 的数组。
     *
     * @return 本想创建 T 数组；实际编译失败
     */
    T[] createArray() {
        return new T[2];
    }

    /**
     * 演示 Object 无法仅靠 instanceof 验证列表的 String 元素契约。
     *
     * @param value 任意对象，可为 null
     * @return 本想判断列表元素类型；实际编译失败
     */
    boolean hasStringElements(Object value) {
        return value instanceof List<String>;
    }

    /**
     * 与另一个 importOrders 方法制造擦除后签名冲突；无返回值。
     *
     * @param orderIds 订单编号列表
     */
    void importOrders(List<String> orderIds) {
    }

    /**
     * 与字符串列表重载擦除后都接收 List；无返回值。
     *
     * @param quantities 数量列表
     */
    void importOrders(List<Integer> quantities) {
    }
}
```

:::

在本篇示例目录执行，英文诊断参数加引号以适配 PowerShell；预期编译退出码为1。

```powershell
javac '-J-Duser.language=en' '-J-Duser.country=US' -Xlint:all -encoding UTF-8 -d out InvalidGenerics.java
if ($LASTEXITCODE -ne 1) { throw '未得到预期的编译失败' }
```

本机得到 `9 errors`。下表摘录真实诊断关键文本，并对应到应修正的契约；CAP 编号与错误行号不是语言规范保证。

| 错误 | 诊断关键文本 | 修正方向 |
|---|---|---|
| 把整数列表赋给 Number 列表 | `ArrayList<Integer> cannot be converted to List<Number>` | 按读写目的声明通配符，或新建合适的目标列表 |
| 创建参数化列表数组 | `generic array creation` | 使用列表的列表或受控的类型正确数组 |
| 向 extends 视图添加整数 | `int cannot be converted to CAP#1` | 在原始精确类型引用上修改，或将参数改为合适的消费者 |
| 从 super 视图直接读取 Number | `CAP#1 cannot be converted to Number` | 读取为 Object，或重新设计输入契约 |
| 直接把未知元素写回 | `Object cannot be converted to CAP#1` | 用泛型辅助方法保存捕获关系 |
| 实例化 T | `unexpected type`，`found: type parameter T` | 将创建责任交给已知实际类型的一方 |
| 创建 T 数组 | `generic array creation` | 使用 List 或调用方提供的数组 |
| 从 Object 判断 String 列表 | `Object cannot be safely cast to List<String>` | 判断 List<?> 后逐元素验证 |
| 只靠元素类型重载 | `have the same erasure` | 改为不同职责名称或不同的实际参数类型 |

### 3. 两种堆污染的运行失败

故障文件应允许保留警告，以观察它们与运行时异常的关系。先编译，再分别运行两个模式；每次运行均预期退出码为1。

```powershell
javac '-J-Duser.language=en' '-J-Duser.country=US' -Xlint:all -encoding UTF-8 -d out UnsafeGenericDemo.java
if ($LASTEXITCODE -ne 0) { throw '故障示例应带警告编译通过' }

java '-Duser.language=en' '-Duser.country=US' -cp out UnsafeGenericDemo raw
if ($LASTEXITCODE -ne 1) { throw 'raw 模式没有按预期失败' }

java '-Duser.language=en' '-Duser.country=US' -cp out UnsafeGenericDemo varargs
if ($LASTEXITCODE -ne 1) { throw 'varargs 模式没有按预期失败' }
```

两次运行的关键输出摘录如下，省略其余调用栈；不同行号只影响定位位置，不改变异常原因。

```text
mode=raw
Exception in thread "main" java.lang.ClassCastException: class java.lang.Integer cannot be cast to class java.lang.String (java.lang.Integer and java.lang.String are in module java.base of loader 'bootstrap')
mode=varargs
Exception in thread "main" java.lang.ClassCastException: class java.lang.Integer cannot be cast to class java.lang.String (java.lang.Integer and java.lang.String are in module java.base of loader 'bootstrap')
```

raw 模式应回查 `rawOrders.add(1001)`，varargs 模式应回查 `aliases[0] = List.of(1001)`。修复方式是恢复静态类型约束、限制数组别名并重新编译；在 `get(0)` 处捕获异常无法把整数变成有效订单编号。示例不写文件、不访问数据库，进程结束即可退出故障状态。

## 八、事实来源与验证范围

语言规则以 Java SE 21 为准；官方 Java Tutorials 页面用于辅助解释，其中面向 JDK 8 的 instanceof 限制不能直接覆盖 Java 21。文章引用的声明规则、捕获与运行检查分别由对应规范章节支撑。

| 资料 | 核对用途 |
|---|---|
| [JLS 21 类型参数、擦除与可具体化类型](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html) | 上界、实例与声明信息的边界、堆污染 |
| [JLS 21 捕获转换](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.10) | 未知类型的局部命名与辅助方法 |
| [JLS 21 方法签名约束](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.8.3) | 擦除后的重载冲突 |
| [JLS 21 instanceof](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.20.2) | 根据表达式静态类型判断合法性 |
| [Java 21 SafeVarargs](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/SafeVarargs.html) | 注解适用范围和安全承诺 |
| [通配符使用说明](https://docs.oracle.com/javase/tutorial/java/generics/wildcardGuidelines.html) | 生产者、消费者和可修改性的区别 |
| [擦除与桥接方法](https://docs.oracle.com/javase/tutorial/java/generics/bridgeMethods.html) | 通过字节码解释覆写转发 |

正常程序通过无警告编译和带断言运行；错误文件产生预期静态诊断，两个污染模式复现 ClassCastException，桥接与转换通过 javap 观察。完整反射 Type API、集合实现性能及多线程访问各有独立主讲范围。
