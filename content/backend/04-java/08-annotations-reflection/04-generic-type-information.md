---
title: "泛型类型信息"
tags:
  - Java
  - Reflection
  - 泛型
excerpt: "使用 Type、ParameterizedType、TypeVariable、WildcardType 与 GenericArrayType 读取订单模型的泛型声明树，并通过运行时类对照、堆污染和非法 instanceof 说明类型擦除后的可观察边界。"
date: 2026-09-08
---

# 泛型类型信息

类型擦除会把多数泛型操作编译为原始类型加必要的转换，但编译器仍可把字段、方法、父类型等声明位置的泛型签名写入 Class 文件。反射能够读取这些声明元数据，不能据此恢复任意对象在创建时使用的实际类型实参。

## 一、Type 表示一棵声明类型树

`java.lang.reflect.Type` 是反射类型的共同接口。一个字段的 `getGenericType()` 可能直接返回 `Class`，也可能返回需要继续向下遍历的子接口。[Type API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Type.html)

| Type 形状 | 示例声明 | 需要读取的信息 |
|---|---|---|
| `Class` | `String orderNumber` | 普通类、基本类型或可具体化数组类型 |
| `ParameterizedType` | `List<OrderLine>` | 原始类型、实际类型参数和可选所有者类型 |
| `TypeVariable` | `T` | 变量名、声明者和一个或多个上界 |
| `WildcardType` | `? extends Number` | 上界与下界数组 |
| `GenericArrayType` | `T[]` | 仍含类型变量或参数化类型的组件类型 |

::: tip 先识别 Type 节点再读取具体属性

`ParameterizedType.getActualTypeArguments()` 的元素仍然是 `Type`，嵌套的 `Map<String, List<OrderLine>>` 因而形成递归树。不能假设所有节点都是 `Class`；调用 `getRawType` 或边界 API 前先用 `instanceof` 或 `Class.isInstance` 判断。[ParameterizedType API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/ParameterizedType.html)

:::

## 二、类型变量和通配符保留不同约束

`T extends Number & Comparable<T>` 是具名类型变量，`getBounds()` 返回两个声明上界。`? extends Number` 是没有名字的通配符，`getUpperBounds()` 返回 Number，`getLowerBounds()` 返回空数组。没有显式上界的通配符以上界 Object 表示，没有显式下界时返回空数组。[WildcardType API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/WildcardType.html)

::: warning 递归类型边界需要防止循环展开

边界本身也可能是参数化类型或类型变量，因此通用解析器必须递归处理并防止在自引用边界上无限展开。比如 `Comparable<T>` 的参数再次指向同一个 T；用于序列化或依赖注入的类型解析器应维护已访问节点或采用框架明确的解析规则。

:::

`T[]` 不能由普通数组 Class 完整表示，因为其组件 T 不是运行时具体类，所以反射返回 `GenericArrayType`。相对地，`String[]` 由 `Class` 表示，`isArray()` 和 `getComponentType()` 可以直接读取组件类。

## 三、声明元数据不等于实例实参

`new ArrayList<String>()` 和 `new ArrayList<Integer>()` 的对象都属于同一个 ArrayList 运行时类。对实例调用 `getClass().getTypeParameters()` 只能看到 ArrayList 声明的变量 E，不能得到这次构造时的 String 或 Integer。

| 证据来源 | 能回答的问题 | 不能回答的问题 |
|---|---|---|
| 字段 `List<String> names` | 该字段声明的元素类型是 String | 字段当前引用对象是否只含 String |
| 方法返回 `List<OrderLine>` | API 声明的返回类型树 | 某个未经校验对象的真实元素类型 |
| 子类声明 `Base<String>` | 子类泛型父类型中的 String | 任意 Base 实例最初使用的实参 |
| 对象 `list.getClass()` | 具体集合实现类 | `List<T>` 中 T 的调用点实参 |

::: info 类型令牌保存的是额外声明

匿名类型令牌能够把类型参数写进匿名子类的泛型父类型声明，反射读取的是这段额外声明，不是从普通集合对象中逆推出被擦除的信息。对外部数据仍需检查实际值、协议字段和反序列化边界。

:::

## 四、完整程序读取五类类型信息

下面的 OrderSchema 只承担声明载体，字段不需要赋值。程序先检查每个 Type 实现，再读取对应属性。保存为 `src/order/GenericTypeInformationDemo.java`，使用 JDK 21，无第三方依赖。

在任意位置新建一个空目录作为本篇示例目录，按文中标注的相对路径创建文件并保存为 UTF-8。后续编译和运行命令都在该目录执行；文件夹不存在时先创建相应父目录。

::: details 查看GenericTypeInformationDemo的完整代码

```java
// src/order/GenericTypeInformationDemo.java
package order;

import java.lang.reflect.GenericArrayType;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.lang.reflect.TypeVariable;
import java.lang.reflect.WildcardType;
import java.util.ArrayList;
import java.util.List;

/** 读取声明位置的泛型类型树，并对照运行时实例无法恢复的实参。 */
public final class GenericTypeInformationDemo {
    /** 禁止实例化命令行示例。 */
    private GenericTypeInformationDemo() {}

    /**
     * 表示订单行，只用于形成具体泛型参数。
     *
     * @param sku 非空商品编码
     * @param quantity 正整数订单数量
     */
    private record OrderLine(String sku, int quantity) {}

    /**
     * 声明五类 Type 形状，字段值不是本例观察对象。
     *
     * @param <T> 同时具备数值语义和自然顺序的样本类型
     */
    private static final class OrderSchema<T extends Number & Comparable<T>> {
        /** 形成普通 Class 类型的字段声明。 */
        private String orderNumber;
        /** 形成具体参数化类型的字段声明。 */
        private List<OrderLine> lines;
        /** 形成上界通配符类型的字段声明。 */
        private List<? extends Number> quantities;
        /** 形成泛型数组类型的字段声明。 */
        private T[] samples;

        /** 创建仅承载类型声明的结构对象。 */
        OrderSchema() {}
    }

    /**
     * 输出声明类型树，或触发一种擦除相关失败；无返回值。
     *
     * @param args 空参数正常；erasure 或 wrong-type 触发独立失败
     * @throws ReflectiveOperationException 固定演示字段不存在时抛出
     */
    public static void main(String[] args) throws ReflectiveOperationException {
        if (args.length > 0) {
            runFailure(args[0]);
            return;
        }

        Type plain = fieldType("orderNumber");
        System.out.println("plain implementation=" + plain.getClass().getSimpleName()
                + ", name=" + plain.getTypeName());

        ParameterizedType lines = requireType(fieldType("lines"), ParameterizedType.class);
        System.out.println("parameterized raw=" + lines.getRawType().getTypeName()
                + ", argument=" + lines.getActualTypeArguments()[0].getTypeName());

        ParameterizedType quantities = requireType(fieldType("quantities"), ParameterizedType.class);
        WildcardType wildcard = requireType(
                quantities.getActualTypeArguments()[0], WildcardType.class);
        System.out.println("wildcard upper=" + wildcard.getUpperBounds()[0].getTypeName()
                + ", lowerCount=" + wildcard.getLowerBounds().length);

        TypeVariable<?> variable = OrderSchema.class.getTypeParameters()[0];
        System.out.println("variable=" + variable.getName() + ", bounds="
                + List.of(variable.getBounds()).stream().map(Type::getTypeName).toList());

        GenericArrayType array = requireType(fieldType("samples"), GenericArrayType.class);
        System.out.println("generic array component=" + array.getGenericComponentType().getTypeName());

        List<String> orderNumbers = new ArrayList<>(List.of("ORD-1001"));
        List<Integer> orderQuantities = new ArrayList<>(List.of(2));
        System.out.println("same runtime class="
                + (orderNumbers.getClass() == orderQuantities.getClass()));
        System.out.println("instance class variable="
                + orderNumbers.getClass().getTypeParameters()[0].getName());
    }

    /**
     * 返回 OrderSchema 指定字段的声明类型。
     *
     * @param fieldName OrderSchema 中存在的字段名
     * @return 字段的泛型声明类型，不推断对象实例实参
     * @throws NoSuchFieldException 字段名不属于固定示例模型
     */
    private static Type fieldType(String fieldName) throws NoSuchFieldException {
        return OrderSchema.class.getDeclaredField(fieldName).getGenericType();
    }

    /**
     * 先检查 Type 实现再执行类型化转换。
     *
     * @param type 待检查的非 null 反射类型
     * @param expected 期望的 Type 子接口 Class 对象
     * @param <T> 期望的 Type 子接口
     * @return 已由 isInstance 验证的同一对象
     * @throws IllegalArgumentException 实际实现与期望不一致
     */
    private static <T extends Type> T requireType(Type type, Class<T> expected) {
        if (!expected.isInstance(type)) {
            throw new IllegalArgumentException(
                    "expected " + expected.getSimpleName() + " but was " + type.getTypeName());
        }
        return expected.cast(type);
    }

    /**
     * 触发把声明信息误当实例信息的典型失败；无返回值。
     *
     * @param mode erasure 制造堆污染，wrong-type 盲目转换 Type 实现
     */
    private static void runFailure(String mode) {
        switch (mode) {
            case "erasure" -> readPollutedList();
            case "wrong-type" -> {
                Type plainType = String.class;
                ParameterizedType ignored = (ParameterizedType) plainType;
                System.out.println(ignored);
            }
            default -> throw new IllegalArgumentException("unknown mode: " + mode);
        }
    }

    /** 通过受控 raw 引用制造堆污染，并在读取 String 时触发转换失败。 */
    @SuppressWarnings({"rawtypes", "unchecked"})
    private static void readPollutedList() {
        List<String> orderNumbers = new ArrayList<>();
        List raw = orderNumbers;
        raw.add(1001);
        String ignored = orderNumbers.get(0);
        System.out.println(ignored);
    }
}
```

:::

## 五、编译与声明树输出

在本篇示例目录执行以下 PowerShell 命令：

```powershell
javac -encoding UTF-8 -Xlint:all -Xdoclint:all,-missing -Werror -d out src/order/GenericTypeInformationDemo.java
java -ea -cp out order.GenericTypeInformationDemo
```

Corretto 21.0.11 的实际输出如下。嵌套 OrderLine 的二进制类型名包含 `$`：

```text
plain implementation=Class, name=java.lang.String
parameterized raw=java.util.List, argument=order.GenericTypeInformationDemo$OrderLine
wildcard upper=java.lang.Number, lowerCount=0
variable=T, bounds=[java.lang.Number, java.lang.Comparable<T>]
generic array component=T
same runtime class=true
instance class variable=E
```

前五行来自 OrderSchema 的声明签名，最后两行来自两个实际 ArrayList 对象。相同运行时类和变量 E 共同证明，实例 Class 没有携带本次使用的 String 或 Integer 实参。

## 六、误判 Type 和实例类型的失败

两个运行时故障入口已经分别验证为退出码 1：

```powershell
java -ea -cp out order.GenericTypeInformationDemo erasure
java -ea -cp out order.GenericTypeInformationDemo wrong-type
```

| 参数 | 实测异常 | 产生原因 |
|---|---|---|
| `erasure` | `ClassCastException: Integer cannot be cast to String` | raw 引用绕过元素检查，读取位置插入的转换才发现堆污染 |
| `wrong-type` | `ClassCastException: Class cannot be cast to ParameterizedType` | 没有检查 Type 实现便直接强转普通 String Class |

Java 也不允许用 `instanceof List<String>` 检查被擦除的实参。下面的独立文件 `InvalidParameterizedInstanceof.java` 已验证产生 1 处编译错误：

::: details 查看InvalidParameterizedInstanceof的完整代码

```java
// InvalidParameterizedInstanceof.java
import java.util.List;

/** 故意对不可具体化的参数化类型执行 instanceof。 */
class InvalidParameterizedInstanceof {
    /**
     * 演示编译器无法在运行时检查 List 的 String 实参。
     *
     * @param value 任意待检查对象
     * @return 本文件预期无法编译，因此没有可用返回结果
     */
    static boolean isOrderNumberList(Object value) {
        return value instanceof List<String>;
    }
}
```

:::

```powershell
javac '-J-Duser.language=en' -encoding UTF-8 -d out InvalidParameterizedInstanceof.java
```

::: warning 声明元数据不能证明外部数据可信

需要判断集合内容时，应从可信声明取得预期 Type，再逐个检查外部值或交给有明确类型解析规则的组件。空集合和已经受污染的集合都无法仅靠元素采样证明完整类型；声明元数据是契约证据，不是运行时数据自动可信的证据。

:::
