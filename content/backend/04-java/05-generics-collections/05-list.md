---
title: "List"
tags:
  - Java
  - List
  - ArrayList
excerpt: "围绕订单列表解释索引、重复元素、删除重载、数组视图和 subList 的共享行为，比较 ArrayList 与 LinkedList 在定位和修改中的成本，并复现越界与失效视图。"
date: 2026-09-08
---

# List

`List<E>` 按位置保存元素，允许重复，索引从0开始。它的顺序是当前元素排列，不是自动按大小排序；插入、删除和排序都会改变位置，业务不能把列表下标当作稳定订单标识。

## 一、位置操作与相等判断

列表的 get、set 和按索引 remove 访问已有元素，合法区间是 `0 <= index < size()`；按索引 add 插入新元素，允许 `index == size()` 表示追加。初始容量只预留存储空间，不会制造可读取的空元素。

| 操作 | 返回值 | 对位置与大小的影响 |
|---|---|---|
| get(index) | 当前元素 | 不修改 |
| set(index, value) | 被替换的旧元素 | 大小不变 |
| add(index, value) | 无返回值 | 插入位置及之后的索引变化 |
| remove(index) | 被删除的元素 | 后续元素前移 |
| remove(Object) | 是否删除成功 | 删除第一个相等元素 |
| indexOf / lastIndexOf | 首个／末个匹配位置，未找到为-1 | 不修改 |

两个 List 的相等性比较同时考虑长度、对应位置和元素相等性，与是否采用同一种实现无关。重复出现的订单事件应保留在 List 中；需要唯一性时应明确改变数据模型，而不是在读取时假定同一个编号只出现一次。[List 契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html)

::: warning 整数列表的删除重载含义不同

`List<Integer>` 特别容易混淆两个 remove：传入基本类型1调用按索引删除，传入 `Integer.valueOf(30)` 调用按值删除。两者返回类型分别是元素与 boolean，读取返回值也有助于发现意图错误。

:::

## 二、实现选型要计算定位成本

### 1. ArrayList 的索引与移动成本

ArrayList 用可扩展数组保存引用。随机读取、替换为 O(1)，尾部添加为摊销 O(1)，中间插入删除需要移动后续引用。某次扩容会复制已有引用，因此不能把摊销常数成本解读成每次调用耗时恒定。增长倍数是实现细节，不作为应用的依赖。[ArrayList 性能说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html)

### 2. LinkedList 的定位与链接修改

LinkedList 通过双向节点保存引用。首尾操作和已定位游标附近的链接修改成本低，但 get(index) 或 add(index, value) 仍要先找到位置。使用从0到n的索引循环反复 get，会把线性遍历变成平方级访问工作；迭代器只需顺着节点推进。[LinkedList 访问说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedList.html)

“已定位后插入快”必须连同访问入口一起理解。如果每次都从头调用按索引方法定位，中间的链接修改再便宜也抵消不了查找成本；只有持续使用同一游标进行局部编辑，才能利用已有位置。

### 3. 按实际访问模式比较实现

先记录读取、定位和修改的实际比例，再选择容器。下面的判断强调操作路径，不能仅凭“读多写少”之类缺少位置条件的描述作决定。

| 订单访问模式 | 选择依据 | 改选或测量条件 |
|---|---|---|
| 构建结果后多次按索引读取 | ArrayList 与索引访问匹配 | 数据规模或复制量成为瓶颈时测量 |
| 使用同一已定位游标连续局部编辑 | LinkedList 可以避免重复移动大量引用 | 必须把定位、节点分配和缓存成本计入比较 |
| 只在首尾添加和删除 | 用 Deque 表达真实意图 | 普通队列优先评估 ArrayDeque |
| 返回一页独立结果 | 显式复制区间 | 是否要求元素对象也独立，由业务另定 |

::: info 结构复杂度不能代替性能实测

这里没有提供性能基准结果，也不能从几个元素的执行时间判断生产环境中哪种结构“总是更快”。[迭代、比较与排序](./04-iteration-comparison-sorting.md)中的游标示例展示了已定位修改，不代表所有 LinkedList 插入都是 O(1)。

:::

## 三、固定大小的数组视图 {#三、arrays-aslist-共享数组但固定大小}

`Arrays.asList(array)` 返回由数组支持的固定大小视图。set 替换元素会改写数组，直接改数组元素也会反映到列表；add 和删除改变长度，因而不受支持。这不是不可修改列表，也不是独立副本。[Arrays.asList](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html#asList(T...))

本例在视图中替换第一项，再通过数组替换第二项，最终两处变化都可从列表读取。toArray 创建的新数组可以单独替换数组元素，但复制的仍是元素引用；当元素本身可变时，修改对象内部状态仍会共享。

::: warning 基本类型数组不会自动展开成元素列表

还要区分基本类型数组：`Arrays.asList(intArray)` 得到包含一个 int[] 元素的列表，不会自动拆装箱成整数列表。需要整数元素时应显式转换，不能仅凭方法名判断容器形状。只读与浅不可变的完整区别见[不可变集合与 Sequenced Collections](./09-immutable-sequenced.md)。

:::

## 四、subList 是受原列表约束的区间视图

### 1. 区间操作如何回写原列表

`subList(from, to)` 选择左闭右开的区间。通过受支持的视图 set、remove 等操作会回写原列表，不是“截取后得到另一个独立数组”。对子区间删除能清理一段元素，但外部持有的索引含义也会随之改变。

视图把局部区间映射回原列表，因此适合在同一个编辑阶段修改一段连续内容。复制出来的列表则有自己的结构；两者即使最初输出相同，后续删除与替换传播的方向也不同，应通过操作结果来区分。

### 2. 结构修改后如何处理旧视图

原列表经视图之外的路径发生结构修改后，subList 的后续语义不再有保证；不能依赖继续访问成功，也不能依赖一定得到某类异常。本机 ArrayList 在错误示例中抛出 ConcurrentModificationException，这是本次实现的诊断证据。[subList 约束](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html#subList(int,int))

::: tip 结果离开编辑范围时明确复制

结果需要离开原列表的编辑生命周期时，可使用 `new ArrayList<>(source.subList(from, to))` 复制引用。复制后原列表增删和替换不会改变这份结果的结构，但元素对象仍未深拷贝。不要通过捕获异常反复重试同一失效视图；应该重新取得有效区间或在边界复制。

:::

## 五、列表与两种视图的完整观察

以下独立源码以订单编号和商品编码演示位置、删除重载、区间视图、数组视图与新数组。数据均为本地演示值，未访问业务系统。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看ListViewsDemo的完整代码

```java
// ListViewsDemo.java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** 验证列表位置、删除重载以及数组和区间视图的共享边界。 */
public final class ListViewsDemo {
    /** 静态示例无需实例；构造器不产生副作用。 */
    private ListViewsDemo() {}

    /**
     * 运行列表操作；无返回值，失败模式按要求抛出原始异常。
     * @param args 空参数正常；index 越界；fixed-add 增加固定列表；stale-view 使用失效视图
     */
    public static void main(String[] args) {
        List<String> orders = new ArrayList<>(List.of("ORD-1001", "ORD-1002", "ORD-1003"));
        List<String> page = orders.subList(0, 2);
        if (args.length > 0) {
            switch (args[0]) {
                case "index" -> orders.get(orders.size());
                case "fixed-add" -> Arrays.asList("ORD-1001").add("ORD-1002");
                case "stale-view" -> {
                    orders.add("ORD-1004");
                    page.size();
                }
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        List<String> copiedPage = new ArrayList<>(page);
        String previous = page.set(1, "ORD-1009");
        page.remove(0);
        assert previous.equals("ORD-1002");
        assert orders.equals(List.of("ORD-1009", "ORD-1003"));
        assert copiedPage.equals(List.of("ORD-1001", "ORD-1002"));
        List<Integer> quantities = new ArrayList<>(List.of(10, 20, 30));
        int removedByIndex = quantities.remove(1);
        boolean removedByValue = quantities.remove(Integer.valueOf(30));
        assert removedByIndex == 20 && removedByValue && quantities.equals(List.of(10));

        String[] codes = {"P-1001", "P-1002"};
        List<String> fixed = Arrays.asList(codes);
        fixed.set(0, "P-1009");
        codes[1] = "P-1008";
        assert fixed.equals(List.of("P-1009", "P-1008"));
        String[] detached = fixed.toArray(new String[0]);
        detached[0] = "P-2000";
        assert fixed.get(0).equals("P-1009");
        assert new ArrayList<String>(100).isEmpty();
        System.out.println("backing=" + orders);
        System.out.println("copied page=" + copiedPage);
        System.out.println("quantities=" + quantities + ", removed=" + removedByIndex);
        System.out.println("array view=" + fixed);
    }
}
```

:::

在本篇示例目录执行以下 PowerShell 命令，需要 JDK 21，无外部依赖。源码已在 Corretto 21.0.11 上通过编译及断言运行。

```powershell
New-Item -ItemType Directory -Force -Path 'out' | Out-Null
javac -encoding UTF-8 -Xlint:all -Werror -d out ListViewsDemo.java
if ($LASTEXITCODE -ne 0) { throw '示例编译失败' }
java -ea -cp out ListViewsDemo
if ($LASTEXITCODE -ne 0) { throw '示例运行失败' }
```

本机实际输出：

```text
backing=[ORD-1009, ORD-1003]
copied page=[ORD-1001, ORD-1002]
quantities=[10], removed=20
array view=[P-1009, P-1008]
```

原列表受到 page 的替换和删除，复制页保留原先两项；remove(1) 删除数量20，按值删除30后只剩10。数组视图两项同时反映了数组与列表两侧的写入；独立 toArray 的替换没有影响它。

## 六、越界、长度限制与失效视图

正常文件已编译后，分别运行以下失败场景。每个调用预期退出码为1，并应核对其异常类型而不是只看程序是否退出。

```powershell
java -cp out ListViewsDemo index
if ($LASTEXITCODE -ne 1) { throw '越界场景未按预期失败' }
java -cp out ListViewsDemo fixed-add
if ($LASTEXITCODE -ne 1) { throw '固定大小场景未按预期失败' }
java -cp out ListViewsDemo stale-view
if ($LASTEXITCODE -ne 1) { throw '失效视图未按预期失败' }
```

| 模式 | 本机异常 | 定位和处理 |
|---|---|---|
| index | IndexOutOfBoundsException | 把 size 当成已有元素位置；读取使用小于size的索引 |
| fixed-add | UnsupportedOperationException | 向数组支持的固定列表追加；需要可增删时复制为 ArrayList |
| stale-view | ConcurrentModificationException | 原列表结构改变后访问旧page；重新计算范围或预先复制 |

三种错误都发生于局部内存对象；结束进程后重新运行正常入口即可验证修正后的访问方式，无外部回滚动作。
