---
title: "对象分配与引用"
tags: [Java, JVM, 引用]
excerpt: "解释对象从分配、初始化到失去可达性的过程，区分逃逸分析与栈分配误解，比较强软弱虚引用，并用确定性引用队列示例验证清除与入队的区别。"
date: 2026-09-10
---


# 对象分配与引用

对象生命周期由创建过程和引用关系共同决定。创建订单对象后，把它加入静态缓存可能使其长期存活；让局部变量离开方法，也不代表缓存持有的对象已经不可达。


## 一、分配与初始化


### 1. 创建过程

执行对象创建需要确认类可用、获得存储、设置默认值并执行构造过程。字段初始化器和构造器使对象进入业务有效状态，但构造过程本身不负责把引用安全发布给其他线程。

HotSpot 可以在适用的分配区域通过指针推进获得空间，并使用线程本地分配缓冲区 TLAB 降低竞争。TLAB 位于堆中，“线程本地分配”不等于“对象位于线程栈”。


### 2. 优化后的对象

逃逸分析判断对象是否流出某个作用范围。若优化条件成立，JIT 可以消除分配、进行标量替换或消除不必要的锁；这不构成“所有局部对象都会栈上分配”的语言保证。

对象头、引用宽度、对齐和收集器元数据影响实际占用。仅把字段大小相加，无法准确得到对象或整张订单对象图的保留大小。


## 二、引用强度

| 引用类型 | 常见行为 | 适用边界 |
|----------|----------|----------|
| 强引用 | 强可达对象保持存活 | 普通字段、集合、活动调用 |
| `SoftReference` | 可因内存需求被清除 | 不提供稳定的缓存容量或命中率承诺 |
| `WeakReference` | 弱可达对象可被清除 | 附加映射、观察对象存活；值不能反向强持有键 |
| `PhantomReference` | `get()` 始终返回 `null` | 配合队列处理清理通知，不能重新取得对象 |

引用对象本身也是普通对象。使用引用队列时，需要保留要观察的引用对象，不能只创建一个无人持有的 `WeakReference`，然后期望可靠收到通知。

::: warning 资源释放不等待 GC
连接、文件和本地资源应显式关闭。Cleaner 或虚引用可承担兜底通知，不能替代明确的所有权和 `try-with-resources`，也不能保证某个时间点完成清理。
:::

## 三、清除与入队

### 1. 两种操作

`clear()` 清除引用的 referent，不等于把该引用对象加入队列。`enqueue()` 请求把引用对象放入其注册队列，返回值表明这次入队是否成功。收到队列元素，得到的是引用对象本身。

下面摘自 `RuntimeLab#references`，`order` 为保持强可达的订单对象，`queue` 为 `ReferenceQueue<Object>`：

```java
WeakReference<Object> reference = new WeakReference<>(order, queue);
System.out.println("before=" + (reference.get() == order));
reference.clear();
System.out.println("cleared=" + (reference.get() == null));
System.out.println("enqueued=" + reference.enqueue());
System.out.println("sameReference=" + (queue.poll() == reference));
java.lang.ref.Reference.reachabilityFence(order);
```

### 2. 执行与解释

保存下方完整程序后，在本篇示例目录编译和运行：

在任意位置新建空目录，使用 JDK 21，将下面的文件保存到该目录。后续命令均在此目录执行。

保存为 `RuntimeLab.java`：

::: details 查看 RuntimeLab.java 完整代码

```java [RuntimeLab.java]
import java.lang.ref.ReferenceQueue;
import java.lang.ref.WeakReference;

/** 用有限工作量观察 Java 21 HotSpot；各模式独立进程执行。 */
public final class RuntimeLab {

    /** 禁止实例化命令入口。 */
    private RuntimeLab() { }
    /**
     * 执行当前观察场景并输出结果，无返回值。
     * @param args 只接受一个参数：reference
     * @throws Exception 参数不合法或观察失败时终止当前进程
     */
    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            throw new IllegalArgumentException("expected mode: reference");
        }
        switch (args[0]) {
            case "reference" -> references();
            default -> throw new IllegalArgumentException("unknown mode");
        }
    }

    /** 显式清除和入队，确定性证明引用对象与被引用对象是两个实体。 */
    private static void references() {
        Object order = new Object();
        ReferenceQueue<Object> queue = new ReferenceQueue<>();
        WeakReference<Object> reference = new WeakReference<>(order, queue);
        System.out.println("before=" + (reference.get() == order));
        reference.clear();
        System.out.println("cleared=" + (reference.get() == null));
        System.out.println("enqueued=" + reference.enqueue());
        System.out.println("sameReference=" + (queue.poll() == reference));
        java.lang.ref.Reference.reachabilityFence(order);
    }
}
```

:::

使用 UTF-8 编译本篇文件：

```powershell
javac -encoding UTF-8 --release 21 -Xlint:all -Werror -d out RuntimeLab.java
```


```powershell
java -cp out RuntimeLab reference
```

实际结果如下：

```text
before=true
cleared=true
enqueued=true
sameReference=true
```

这个实验主动执行清除与入队，证明 API 之间的区别；它没有请求 GC，也没有测量自动回收时机。`reachabilityFence` 使原对象在观察结束前保持强可达，避免把队列结果误认为对象已被回收。

## 四、从保留关系判断问题

若静态 `Map` 一直持有订单，改成更大的堆只能推迟容量耗尽。应确定数据的有效期和容量，删除不再需要的映射，再验证相同负载下存活集是否稳定。

弱键容器也有反例：如果值强引用键，根到“容器、值、键”的路径仍然存在，弱键不能达到预期回收效果。先画出强引用路径，比直接替换引用类型更有判断价值。

::: tip 回收观察要允许不确定性
`System.gc()` 是请求，不承诺对象立刻被清除或入队。依赖“调用一次后必须为 null”的测试无法证明正确的引用语义。
:::

## 五、参考资料

- [Java 21 Reference 包说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/package-summary.html)
- [Reference API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/Reference.html)
- [Cleaner](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/Cleaner.html)

以上资料定义可达性和清理边界。
