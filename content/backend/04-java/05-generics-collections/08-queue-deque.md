---
title: "Queue 与 Deque"
tags:
  - Java
  - Queue
  - Deque
excerpt: "将订单处理顺序映射到 Queue、Deque、ArrayDeque 与 PriorityQueue，解释两组失败 API、FIFO 与 LIFO、优先级和同级次序，并验证空队列、空元素及容量边界。"
date: 2026-09-08
---

# Queue 与 Deque

Queue用队头选择规则表达待处理元素，Deque提供双端操作。FIFO是常见队列策略，但不是所有Queue的规则：PriorityQueue按比较器决定队头，较晚加入的高优先级任务可以先被取出。

## 一、两组API区分正常边界与异常

当空队列是正常状态时，poll或peek返回null便于调用方分支处理；预期必须有元素时，remove或element通过异常指出不满足前提。入队失败的两组API主要区别在容量限制，offer仍会对非法元素抛出异常，不是所有失败都返回false。[Deque与Queue操作对应](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Deque.html)

| 目的 | 特殊值形式 | 异常形式 | 不修改状态的操作 |
|---|---|---|---|
| 加入队列 | offer；受容量限制时可返回false | add；受容量限制时可抛IllegalStateException | 无 |
| 获取并删除队头 | poll；空时null | remove；空时NoSuchElementException | 无 |
| 查看队头 | peek；空时null | element；空时NoSuchElementException | peek、element |

::: info 空队列信号与任务值需要区分

不能把null同时用作“真实待处理任务”和“当前没有任务”。ArrayDeque与PriorityQueue都禁止null；Queue接口本身不强制所有实现都禁止，因此业务应主动建立清楚的空值约束。

:::

## 二、首尾操作表达FIFO与LIFO

Deque分别提供offerFirst／offerLast、pollFirst／pollLast、peekFirst／peekLast。异常形式是addFirst／addLast、removeFirst／removeLast、getFirst／getLast。选择首端或尾端会改变业务处理次序，需要在调用边界保持一致。

| 业务模型 | 加入方式 | 取出方式 | 订单解释 |
|---|---|---|---|
| FIFO | offerLast | pollFirst | 最早进入的订单先处理 |
| LIFO | push，即addFirst | pop，即removeFirst | 最近压入的动作先撤销 |
| 双端调度 | 按明确规则选择首端或尾端 | 与调度协议一致 | 紧急插队必须显式约定，不能临时混用 |

::: tip 只需要首尾操作时使用 Deque

现代栈代码可以用Deque表达，不必依赖继承Vector的Stack。若业务本质上只需要首尾操作，ArrayList.remove(0)造成的整体移动也是选择Deque的理由；换容器前仍需确认外部是否依赖索引访问。

:::

## 三、ArrayDeque 的初始容量不是任务上限

ArrayDeque以可扩展数组支持首尾操作，常见首尾操作具有摊销常数成本，按指定对象删除和查找需要扫描。它不支持按索引访问，也不提供无同步并发写保障。[ArrayDeque API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayDeque.html)

::: warning 初始容量不是队列任务上限

`new ArrayDeque<>(1)` 只是初始容量要求，加入两个元素仍成功，不能用它实现“最多排队一个任务”。PriorityQueue同样会增长；初始容量控制分配起点，无法代替业务上限和背压。

:::

需要容量限制时，应明确谁负责拒绝、等待、超时和恢复。单线程业务可以在唯一写入边界检查当前数量；跨线程的“先size再offer”存在竞争，必须采用正确的并发队列与协作协议，这部分由并发章节负责。本例不构建有界队列或生产消费系统。

## 四、优先队列的顺序保证 {#四、priorityqueue-只承诺当前队头最优}

### 1. 队头保证不等于全局排序

默认自然顺序的PriorityQueue取出当前最小元素；自定义比较器可以把更小priority数字解释为更高优先级。入队与出队通常为O(log n)，peek为O(1)，remove(Object)需要扫描。它适合动态加入、持续取最优项，不等于一次性排序列表。[PriorityQueue API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/PriorityQueue.html)

直接遍历或toString展示的内部排列不保证全局排序。需要按优先级生成处理序列时，应不断poll；不允许消耗原队列时，可复制后出队或单独排序副本。也不能通过反复peek推进处理，因为peek不移除队头。

### 2. 同级次序与优先级变更

比较器判为相等的任务，出队先后不保证稳定。本例增加队列内唯一的sequence作为第二比较键，使同优先级任务仍有明确次序。业务若重复使用同一sequence，就失去了这个额外保证；字段必须在入队后保持稳定。

比较键决定后续出队观察到的先后关系，不能只在显示时临时拼一个序号。若业务要求同优先级按进入顺序处理，序号应在入队边界建立并参与比较；若要求按截止时间优先，则需要明确它与现有优先级谁先比较，并验证并列输入。

::: warning 修改入队对象不会触发自动重排

改变已入队对象的优先级不会触发自动重排。正确处理是移除旧任务并按新规则重新插入，或使用独立的调度设计。订单任务示例采用Record保存排序字段，使修改只能通过创建新任务表达。

:::

## 五、三种顺序的完整订单例

下面程序先以ArrayDeque演示FIFO和LIFO，再使用显式TaskOrder比较器处理三项任务。priority越小越优先，sequence表示同级任务的输入先后；全部为本地演示数据。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看QueueOrdersDemo的完整代码

```java
// QueueOrdersDemo.java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.List;
import java.util.PriorityQueue;
import java.util.Queue;

/** 用待处理订单验证 FIFO、LIFO、优先级及初始容量与容量上限的区别。 */
public final class QueueOrdersDemo {
    /** 静态入口无需实例；构造器不产生副作用。 */
    private QueueOrdersDemo() {}

    /**
     * 验证队头和双端状态；无返回值，失败模式不捕获原始异常。
     * @param args 空参数正常；empty 从空队列 remove；null 向 ArrayDeque 放入 null
     */
    public static void main(String[] args) {
        Deque<String> pending = new ArrayDeque<>(1);
        if (args.length > 0) {
            switch (args[0]) {
                case "empty" -> pending.remove();
                case "null" -> pending.offer(null);
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        pending.offerLast("ORD-1001");
        pending.offerLast("ORD-1002");
        assert pending.size() == 2; // 初始容量1没有限制最多只接收一个元素。
        String first = pending.pollFirst();
        assert first.equals("ORD-1001");
        pending.push("ORD-1003");
        String popped = pending.pop();
        assert popped.equals("ORD-1003");
        assert pending.pollFirst().equals("ORD-1002") && pending.pollFirst() == null;

        Queue<Task> priorities = new PriorityQueue<>(new TaskOrder());
        priorities.offer(new Task("ORD-1001", 2, 1));
        priorities.offer(new Task("ORD-1002", 1, 2));
        priorities.offer(new Task("ORD-1003", 1, 3));
        List<String> processed = new ArrayList<>();
        while (!priorities.isEmpty()) {
            processed.add(priorities.poll().number());
        }
        assert processed.equals(List.of("ORD-1002", "ORD-1003", "ORD-1001"));
        System.out.println("fifo first=" + first);
        System.out.println("lifo first=" + popped);
        System.out.println("priority order=" + processed);
        System.out.println("empty peek=" + pending.peek());
    }

    /**
     * 保存稳定排序字段，任务入队后不修改优先级。
     * @param number 非 null 演示订单编号
     * @param priority 正整数；越小越优先
     * @param sequence 正整数；在本队列中唯一，用于同级任务的先后顺序
     */
    record Task(String number, int priority, long sequence) {}

    /** 先比较优先级，再比较唯一入队序号，避免依赖堆对同级元素的偶然顺序。 */
    static final class TaskOrder implements Comparator<Task> {
        /**
         * 比较两个稳定任务的业务先后顺序。
         * @param left 非 null 左任务，字段满足 Task 约束
         * @param right 非 null 右任务，字段满足 Task 约束
         * @return 负数表示左任务先处理，零表示比较字段相同，正数表示右任务先处理
         */
        @Override
        public int compare(Task left, Task right) {
            int byPriority = Integer.compare(left.priority(), right.priority());
            return byPriority != 0 ? byPriority : Long.compare(left.sequence(), right.sequence());
        }
    }
}
```

:::

在本篇示例目录执行以下 PowerShell 命令；需要 JDK 21，无第三方依赖。本例已在 Corretto 21.0.11 上实际编译运行。

```powershell
New-Item -ItemType Directory -Force -Path 'out' | Out-Null
javac -encoding UTF-8 -Xlint:all -Werror -d out QueueOrdersDemo.java
if ($LASTEXITCODE -ne 0) { throw '示例编译失败' }
java -ea -cp out QueueOrdersDemo
if ($LASTEXITCODE -ne 0) { throw '示例运行失败' }
```

本机实际输出：

```text
fifo first=ORD-1001
lifo first=ORD-1003
priority order=[ORD-1002, ORD-1003, ORD-1001]
empty peek=null
```

ORD-1001最早进入FIFO，所以先被取走；ORD-1003最近push，所以先pop。优先队列中的ORD-1002和ORD-1003虽然较晚加入，却因为priority为1先处理，再按sequence保持业务次序。这里没有对优先队列的迭代排列作断言。

正常路径还验证了容量参数1没有阻止加入两个任务。处理完所有ArrayDeque元素后，poll与peek都返回null，这是正常空队列状态，不需要用异常恢复。

## 六、空队列与非法元素的独立故障

完成正常编译后运行以下两种模式，预期均退出1。

```powershell
java -cp out QueueOrdersDemo empty
if ($LASTEXITCODE -ne 1) { throw '空队列remove未按预期失败' }
java -cp out QueueOrdersDemo null
if ($LASTEXITCODE -ne 1) { throw '空元素入队未按预期失败' }
```

empty实际抛出NoSuchElementException，源头是空队列remove；允许暂时无任务时应使用poll并处理null。null实际抛出NullPointerException，说明offer也会拒绝非法元素；应先验证任务对象，不把null当作终止标记。

::: info 出队顺序验证不覆盖生产调度能力

本例不访问外部系统，进程结束后无需恢复共享队列。生产场景还需单独设计失败任务的重试、去重、确认和容量控制；上述出队顺序验证不证明这些能力。

:::
