---
title: "Lambda 变量捕获"
tags:
  - Java
  - Lambda
  - 变量捕获
excerpt: "解释 effectively final 与确定赋值规则，区分捕获局部值、共享可变对象和调用时读取实例字段，通过延迟调用、循环回调与独立编译错误验证状态及生命周期边界。"
date: 2026-09-08
---

# Lambda 变量捕获

变量捕获让行为在声明位置之外继续使用所需的局部值。Java 要求被捕获的局部变量保持final或effectively final，但这只约束变量绑定，不会递归冻结对象，也不会自动使行为成为无状态计算。

## 一、实际不可变变量 {#一、effectively-final-约束重新赋值}

一个已经初始化的局部变量，如果后续没有重新赋值、自增或自减，就可以在未显式写final时满足effectively final。Lambda参数之外、在函数体中引用的局部变量或方法参数，需要满足这项约束，并且在捕获前已经确定赋值。[变量final规则](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12.4)、[Lambda捕获规则](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27.2)

规则检查覆盖变量的使用范围，不是只看Lambda声明之前。先创建Lambda，再修改minimum，也会让这份捕获不合法；把修改语句放到Lambda内部同样不能绕过限制。

::: info 确定赋值与保持绑定是两个条件

未初始化的变量可以在互斥分支中分别完成一次赋值，但必须保证每条到达捕获点的路径都有值。“没重新赋值”和“肯定已经有值”是两个独立条件，不能因为满足前者就忽略后者。

:::

## 二、捕获引用不复制对象

捕获基本类型时，行为保留相应数值；捕获引用类型时，保留的是引用关系。示例中的numbers变量没有重新赋值，所以可以被捕获；numbers.add只修改同一个列表，并没有把变量改为指向另一个对象。

| 时间点 | numbers中的编号 | liveSize.get | savedSize.get |
|---|---|---|---|
| 创建行为与快照时 | ORD-1001 | 调用会得到1 | 调用会得到1 |
| 原列表加入ORD-1002后 | ORD-1001、ORD-1002 | 2 | 1 |

liveSize在调用时读取当前列表大小；savedSize读取List.copyOf建立的独立结构。本例元素是不可变String，因此不包含元素内部继续变化的问题。更一般的集合副本仍可能共享可变元素，完整边界见[不可变集合与Sequenced Collections](../05-generics-collections/09-immutable-sequenced.md)。

::: warning 可变包装不能消除共享状态

用一个数组或容器包住计数变量，确实能让代码通过捕获检查，但此时共享状态仍然存在。这种写法可用于有意的本地观察，不应当作消除并发问题或规避归约设计的技巧。

:::

## 三、实例字段在调用时读取

实例字段不受局部变量effectively final规则直接约束。`quantity -> quantity >= this.minimum` 在test时读取字段，所以创建行为后把minimum从2改成3，会改变同一个输入2的判断结果。

::: tip 按规则生效时点选择动态值或快照

需要固定创建时的规则时，可以先把字段值复制到局部变量savedMinimum，再捕获这个值。示例同时保留liveRule与snapshotRule：字段更新后，前者对2返回false，后者仍返回true。这是两种不同的业务契约，应按“动态配置”还是“固定批次规则”选择。

:::

这里所有赋值与调用都在一个线程顺序执行。字段可被读取不代表跨线程更新具有可见性保证；也不能从本例推断多个线程更新同一对象是安全的。线程内存语义由并发章节主讲，当前只识别行为到底依赖哪份状态。

## 四、循环回调要区分变量声明

传统for循环通常反复更新同一个索引变量，不能直接捕获这个持续变化的index。正确做法是在每次循环体内建立savedIndex，然后捕获本次迭代的副本。

增强for的循环变量按每次迭代分别处理；只要本次变量不被重新赋值，就可以捕获。示例在循环结束后才逐个执行回调，仍能得到ORD-1001、ORD-1002，以及索引副本0、1、2。不能把其他语言中某种循环闭包行为直接套到Java上。

若迭代变量本身是可变订单对象，每轮绑定不同引用也不会自动创建对象副本。后续修改订单字段仍可能被回调观察到；需要保存创建时状态，应复制真正需要的字段或不可变值。

## 五、方法返回不结束行为的可用性

atLeast方法接收minimum并返回一个IntPredicate。调用方在该方法结束后执行test，仍能使用阈值2；行为所需的值不会因为局部作用域结束而变成悬空引用。

::: tip 长期回调只保留必要的对象引用

这不要求读者依赖编译器内部如何存储捕获值。需要关注的是持有关系：长时间保存引用外层对象、集合或资源的回调，可能延长相关对象的可达时间。只捕获必要数据，并在订阅或任务结束时解除不再需要的持有关系，比假设“方法返回就自动释放”可靠。

:::

下面的完整验证覆盖方法返回后的调用、动态字段、结构快照和循环绑定，证明可观察语义；没有通过内存转储推断具体对象布局或GC时机。

## 六、延迟调用与状态变化的完整验证

文件在Corretto 21.0.11上独立运行，无外部依赖。所有编号和阈值均为本地演示数据：

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看VariableCaptureDemo的完整代码

```java
// VariableCaptureDemo.java
import java.util.ArrayList;
import java.util.List;
import java.util.function.IntPredicate;
import java.util.function.Supplier;

/** 用单线程延迟调用区分局部捕获、字段读取和可变对象共享。 */
public final class VariableCaptureDemo {
    private int minimum = 2;

    /** 创建初始阈值为2的演示对象；不访问外部状态。 */
    private VariableCaptureDemo() {}

    /**
     * 执行捕获与循环断言；无返回值，仅修改本地演示数据并输出结果。
     * @param args 本程序不使用启动参数
     */
    public static void main(String[] args) {
        IntPredicate savedRule = atLeast(2);
        assert savedRule.test(2) && !savedRule.test(1);

        List<String> numbers = new ArrayList<>(List.of("ORD-1001"));
        // 捕获的是引用；size在get时读取，会观察同一列表后续变化。
        Supplier<Integer> liveSize = () -> numbers.size();
        List<String> snapshot = List.copyOf(numbers);
        // 读取独立结构快照；String元素在这里也不可变。
        Supplier<Integer> savedSize = () -> snapshot.size();
        numbers.add("ORD-1002");
        assert liveSize.get() == 2 && savedSize.get() == 1;

        VariableCaptureDemo policy = new VariableCaptureDemo();
        IntPredicate liveRule = policy.liveRule();
        IntPredicate frozenRule = policy.snapshotRule();
        policy.minimum = 3;
        assert !liveRule.test(2) && frozenRule.test(2);

        List<Supplier<String>> callbacks = new ArrayList<>();
        for (String number : numbers) {
            // 增强for每次迭代声明一个变量；回调返回本次迭代绑定的编号。
            callbacks.add(() -> number);
        }
        List<String> laterNumbers = new ArrayList<>();
        for (Supplier<String> callback : callbacks) {
            laterNumbers.add(callback.get());
        }
        assert laterNumbers.equals(List.of("ORD-1001", "ORD-1002"));

        List<Supplier<Integer>> positions = new ArrayList<>();
        for (int index = 0; index < 3; index++) {
            int savedIndex = index;
            // 返回当前迭代中不再重新赋值的副本，不捕获不断递增的index。
            positions.add(() -> savedIndex);
        }
        List<Integer> laterPositions = new ArrayList<>();
        for (Supplier<Integer> position : positions) {
            laterPositions.add(position.get());
        }
        assert laterPositions.equals(List.of(0, 1, 2));
        System.out.println("sizes: live=" + liveSize.get() + ", snapshot=" + savedSize.get());
        System.out.println("rules for 2: live=" + liveRule.test(2) + ", snapshot=" + frozenRule.test(2));
        System.out.println("later numbers=" + laterNumbers);
        System.out.println("later positions=" + laterPositions);
    }

    /**
     * 在方法返回后仍保留当前阈值的行为。
     * @param minimum 正整数阈值；传入后不重新赋值
     * @return 无副作用的数量判断，输入达到阈值时为true
     */
    private static IntPredicate atLeast(int minimum) {
        // 只依赖调用参数和捕获的阈值，不读取实例字段。
        return quantity -> quantity >= minimum;
    }

    /**
     * 创建每次调用时读取本对象字段的行为。
     * @return 根据当前minimum判断的规则；不提供并发可见性保证
     */
    private IntPredicate liveRule() {
        // this.minimum在test时读取，不是创建行为时的数值副本。
        return quantity -> quantity >= this.minimum;
    }

    /**
     * 将当前字段值保存到局部变量，再创建规则。
     * @return 只使用创建时阈值的行为，不反映字段后续变化
     */
    private IntPredicate snapshotRule() {
        int savedMinimum = this.minimum;
        // savedMinimum不再赋值，满足effectively final；返回阈值比较结果。
        return quantity -> quantity >= savedMinimum;
    }
}
```

:::

在本篇示例目录的PowerShell编译，开启断言验证状态关系：

```powershell
New-Item -ItemType Directory -Force -Path out | Out-Null
javac -encoding UTF-8 -Xlint:all -Werror -d out VariableCaptureDemo.java
if ($LASTEXITCODE -ne 0) { throw '编译失败' }
java -ea -cp out VariableCaptureDemo
if ($LASTEXITCODE -ne 0) { throw '运行失败' }
```

实际输出清楚区分动态读取与固定数据：

```text
sizes: live=2, snapshot=1
rules for 2: live=false, snapshot=true
later numbers=[ORD-1001, ORD-1002]
later positions=[0, 1, 2]
```

## 七、复现两种非法捕获

下面两份独立文件分别保留“重新赋值局部变量”和“直接捕获递增索引”的错误，不参与正常源码编译。

::: details 查看ReassignedCapture的完整代码

```java
// ReassignedCapture.java
import java.util.function.IntPredicate;

/** 故意重新赋值被捕获的局部变量。 */
class ReassignedCapture {
    /** 保留非法捕获供独立编译；不能运行，不产生副作用。 */
    static void inspect() {
        int minimum = 2;
        // 这里引用的minimum在下方重新赋值，不满足effectively final。
        IntPredicate rule = quantity -> quantity >= minimum;
        minimum = 3;
    }
}
```

:::

循环错误文件在每次迭代中引用的是同一个被更新的index：

::: details 查看LoopCapture的完整代码

```java
// LoopCapture.java
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

/** 故意捕获传统for循环中持续更新的变量。 */
class LoopCapture {
    /** 保留非法循环捕获供编译验证；不能运行，不产生副作用。 */
    static void inspect() {
        List<Supplier<Integer>> positions = new ArrayList<>();
        for (int index = 0; index < 3; index++) {
            // index被循环更新，不是effectively final，不能这样捕获。
            positions.add(() -> index);
        }
    }
}
```

:::

保存后逐个编译检查：

```powershell
foreach ($errorName in @('ReassignedCapture', 'LoopCapture')) {
    javac '-J-Duser.language=en' -encoding UTF-8 -d out "$errorName.java"
    if ($LASTEXITCODE -ne 1) { throw "$errorName 未按预期编译失败" }
}
```

两份源码均被拒绝，诊断包含local variables referenced from a lambda expression must be final or effectively final，位置分别指向minimum与index。修复应明确需要固定值还是动态状态：固定值采用独立局部副本，动态状态采用显式对象契约并另行处理并发要求；不能只为了通过编译而把所有局部变量改成共享字段。
