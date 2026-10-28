---
title: "循环控制"
tags:
  - Java 21
  - for
  - while
excerpt: "说明如何根据计数、遍历和条件驱动场景选择 for、增强 for、while 与 do-while，并处理 break、continue、终止条件和边界偏差。"
date: 2026-09-02
---

# 循环控制

循环用于重复执行一段逻辑。一个正确循环必须明确初始状态、继续条件、每轮状态变化和终止结果；仅仅让代码能够重复运行，不代表它不会越界、漏项或永远无法结束。

## 一、根据已知信息选择循环

| 循环 | 适合的问题 | 关键观察点 |
|------|------------|------------|
| 基本 `for` | 已知索引范围或明确计数 | 初始化、条件、更新是否一致 |
| 增强 `for` | 依次读取数组或 `Iterable` 元素 | 没有直接索引，不能控制迭代器结构修改 |
| `while` | 次数未知，由条件或外部状态决定 | 循环体是否推进终止条件 |
| `do-while` | 循环体至少必须执行一次 | 首次执行前不会判断条件 |

选择循环结构时先描述业务问题。例如“处理数组的每个值”通常用增强 `for`，“最多轮询三次直到成功”通常用 `while`，“按索引写回数组”通常用基本 `for`。

## 二、基本 for 循环

### 1. 三个控制部分

```java
for (int index = 0; index < quantities.length; index++) {
    System.out.println(quantities[index]);
}
```

循环按下面顺序工作：

1. 初始化 `int index = 0`，只执行一次；
2. 判断 `index < quantities.length`；
3. 条件为 `true` 时执行循环体；
4. 执行更新 `index++`；
5. 回到条件判断。

索引变量的作用域包含条件、更新和循环体，离开循环后不可见。

### 2. 半开区间减少边界错误

::: tip 用半开区间表达数组索引

数组合法索引通常表达为半开区间 `[0, length)`：包含 `0`，不包含 `length`。因此条件使用 `<`。

:::

```text
长度 3
合法索引：0、1、2
停止位置：3
```

写成 `index <= quantities.length` 会多执行一次，并在索引等于长度时抛出 `ArrayIndexOutOfBoundsException`。

## 三、增强 for 循环

增强 `for` 直接获得每个元素：

```java
for (int quantity : quantities) {
    total += quantity;
}
```

它适合只关心元素值的遍历，不适合以下需求：

- 需要当前索引；
- 需要同时访问前后元素；
- 需要按索引替换数组元素；
- 需要用迭代器安全删除集合元素。

给循环变量重新赋值不会替换数组中的基本类型元素：

```java
for (int quantity : quantities) {
    quantity = 0; // 只修改当前循环变量
}
```

如果元素是引用类型，通过循环变量仍可能修改共享对象状态；这与引用值复制规则一致。

## 四、while 与状态推进

`while` 在每轮开始前检查条件：

```java
int attempts = 0;
while (attempts < maxAttempts) {
    attempts++;
}
```

判断一个 `while` 是否可能终止，应找到循环体中改变条件的语句。下面的错误循环没有更新 `attempts`：

```java
int attempts = 0;
while (attempts < 3) {
    System.out.println("polling");
}
```

::: warning 轮询必须有明确退出边界

在真实轮询中，还需要设计超时、最大次数、中断和失败结果。只依赖某个远程状态最终变化，可能让线程永久占用资源。

:::

## 五、do-while 至少执行一次

```java
int executions = 0;
do {
    executions++;
} while (shouldRepeat);
```

即使 `shouldRepeat` 初始为 `false`，循环体也执行一次。它适合“先执行，再决定是否继续”的交互或重试模型；如果业务允许零次执行，普通 `while` 更直接。

`do-while` 末尾的条件括号后需要分号，这是循环语法的一部分。

## 六、break 与 continue

### 1. break 结束当前循环

遇到终止哨兵或已经找到目标时，可以立即结束循环：

```java
for (int quantity : quantities) {
    if (quantity < 0) {
        break;
    }
    total += quantity;
}
```

::: info break 只结束目标控制结构

`break` 只结束直接包含它的循环或 `switch`。嵌套循环需要明确结束哪一层；标签 `break outer;` 可以跳出指定外层循环，但大量标签通常说明流程需要拆成方法。

:::

### 2. continue 跳过当前轮剩余语句

```java
for (int quantity : quantities) {
    if (quantity == 0) {
        continue;
    }
    total += quantity;
}
```

基本 `for` 的 `continue` 会先执行更新表达式，再重新判断条件；`while` 的 `continue` 直接回到条件判断。如果状态更新写在 `while` 循环体末尾，提前 `continue` 可能跳过更新并形成死循环。

## 七、循环不变量与结果验证

循环不变量是在每轮开始或结束时都应成立的事实。例如累加库存时可以定义：

```text
每轮结束后，total 等于已经处理的全部正库存之和。
```

用不变量检查循环：

1. 初始状态是否成立；
2. 执行一轮后是否仍成立；
3. 循环终止时，不变量和终止条件能否推出正确结果。

这比只用几个示例输入“看起来输出正确”更可靠，也能帮助定位漏加、重复加和错误更新变量。

## 八、完整程序

将完整源码保存为 `LoopsDemo.java`。它分别使用基本 `for`、增强 `for`、`while`、`do-while`、`break` 和 `continue`。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看LoopsDemo的完整代码

```java
/**
 * 演示计数循环、增强 for、while、do-while、break 和 continue。
 */
public final class LoopsDemo {

    /**
     * 工具类不需要实例化。
     */
    private LoopsDemo() {
    }

    /**
     * 输出多个循环的结果；传入 bounds 可触发典型边界错误。
     *
     * @param args 可选失败模式 bounds
     */
    public static void main(String[] args) {
        int[] quantities = {2, 0, 3, -1, 4};
        if (args.length == 1 && "bounds".equals(args[0])) {
            runBoundsFailure(quantities);
            return;
        }

        System.out.println("first empty index=" + findFirstEmptyIndex(quantities));
        System.out.println("valid sum=" + sumUntilSentinel(quantities));
        System.out.println("poll attempts=" + countPollAttempts(3));
        System.out.println("do-while executions=" + executeAtLeastOnce(false));
    }

    /**
     * 使用按索引 for 循环查找首个库存为 0 的位置。
     *
     * @param quantities 库存数组，不能为 null
     * @return 首个 0 的索引；不存在时返回 -1
     */
    private static int findFirstEmptyIndex(int[] quantities) {
        for (int index = 0; index < quantities.length; index++) {
            if (quantities[index] == 0) {
                return index;
            }
        }
        return -1;
    }

    /**
     * 使用增强 for 累加正数，跳过 0，并在负数哨兵处停止。
     *
     * @param quantities 包含库存值和可选负数哨兵的数组
     * @return 哨兵之前所有正库存的总和
     */
    private static int sumUntilSentinel(int[] quantities) {
        int total = 0;
        for (int quantity : quantities) {
            if (quantity < 0) {
                break;
            }
            if (quantity == 0) {
                continue;
            }
            total += quantity;
        }
        return total;
    }

    /**
     * 使用 while 模拟限定次数的轮询。
     *
     * @param maxAttempts 最大尝试次数，必须大于或等于 0
     * @return 实际执行的尝试次数
     */
    private static int countPollAttempts(int maxAttempts) {
        int attempts = 0;
        while (attempts < maxAttempts) {
            attempts++;
        }
        return attempts;
    }

    /**
     * 使用 do-while 证明循环体至少执行一次。
     *
     * @param shouldRepeat 首次执行后是否继续
     * @return 循环体执行次数
     */
    private static int executeAtLeastOnce(boolean shouldRepeat) {
        int executions = 0;
        do {
            executions++;
        } while (shouldRepeat && executions < 2);
        return executions;
    }

    /**
     * 故意使用小于等于数组长度的条件，触发越界异常。
     *
     * @param quantities 用于演示边界错误的数组
     */
    private static void runBoundsFailure(int[] quantities) {
        for (int index = 0; index <= quantities.length; index++) {
            System.out.println(quantities[index]);
        }
    }
}
```

:::

## 九、编译、运行与输出

```powershell
javac -Xlint:all -encoding UTF-8 `
  -d out `
  LoopsDemo.java

java -cp out LoopsDemo
```

预期输出：

```text
first empty index=1
valid sum=5
poll attempts=3
do-while executions=1
```

求和遇到 `0` 时跳过，遇到 `-1` 哨兵时结束，所以尾部 `4` 不参与结果。

## 十、边界错误与集合修改

运行故意越界的路径：

```powershell
java -cp out LoopsDemo bounds
```

程序先输出五个数组值，随后在索引 `5` 处以非零状态结束。调用栈定位到 `runBoundsFailure`，修复是把 `<= quantities.length` 改为 `< quantities.length`，而不是捕获越界异常继续循环。

::: warning 遍历集合时遵守结构修改规则

对集合使用增强 `for` 时，在循环中直接增删同一集合通常会触发 `ConcurrentModificationException`，但这取决于具体集合和修改方式。需要删除元素时使用迭代器规定的删除操作，或构造新的结果集合；集合细节将在集合框架章节展开。

:::

## 十一、常见循环缺陷

| 缺陷 | 识别证据 | 修复原则 |
|------|----------|----------|
| 少处理或多处理一个元素 | 最小、空、单元素和末尾边界失败 | 使用明确半开区间并写边界测试 |
| 无限循环 | 条件依赖变量在循环体中没有推进 | 明确进度变量、超时和最大次数 |
| continue 后不再推进 | 更新语句位于可能被跳过的位置 | 更新放到不会被跳过的位置或改用 `for` |
| 错改外层状态 | 循环体混合多个相似变量 | 缩小作用域并为累加器命名不变量 |
| 嵌套层级过深 | 大量标签、break 和布尔标记 | 拆分为有返回值的方法 |

## 十二、规范依据

- [JLS 14.12：The while Statement](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.12) 定义 `while` 执行规则。
- [JLS 14.13：The do Statement](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.13) 定义 `do-while`。
- [JLS 14.14：The for Statement](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.14) 定义基本和增强 `for`。
- [JLS 14.15～14.17](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.15) 定义 `break`、`continue` 和 `return` 的控制转移。

本篇循环语法在 Java 8 和 Java 21 中相同；维护旧系统时的主要风险来自边界、状态推进和集合修改，而不是版本差异。
