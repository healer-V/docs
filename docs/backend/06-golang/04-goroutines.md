---
title: "Goroutine 与并发编程"
category: "后端 · Golang"
tags:
  - Go
  - Goroutine
  - Channel
  - 并发
date: 2026-03-17
---

# Goroutine 与并发编程

Go 的并发模型以 Goroutine 和 Channel 为核心，遵循"通过通信来共享内存，而不是通过共享内存来通信"的设计哲学。相比传统线程，Goroutine 启动开销极小（初始栈仅 2KB），可以轻松启动数十万个并发任务。

## 一、Goroutine

### 1. 创建与调度

::: details Goroutine 基础示例

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func fetchData(id int, wg *sync.WaitGroup) {
    defer wg.Done() // 确保 goroutine 完成时通知 WaitGroup
    time.Sleep(time.Duration(id) * 100 * time.Millisecond) // 模拟 I/O
    fmt.Printf("任务 %d 完成\n", id)
}

func main() {
    var wg sync.WaitGroup

    // 启动 10 个并发任务
    for i := 1; i <= 10; i++ {
        wg.Add(1)
        go fetchData(i, &wg) // go 关键字启动 goroutine
    }

    wg.Wait() // 等待所有 goroutine 完成
    fmt.Println("所有任务完成")
}
```

:::

### 2. GMP 调度模型简介

Go 运行时实现了 M:N 调度，将 M 个 Goroutine 映射到 N 个 OS 线程上：

| 组件 | 含义 | 说明 |
|------|------|------|
| **G**（Goroutine） | 用户态协程 | 初始栈 2KB，按需扩缩 |
| **M**（Machine） | OS 线程 | 实际执行计算的线程 |
| **P**（Processor） | 逻辑处理器 | 持有本地 G 队列，数量默认等于 CPU 核心数 |

```
每个 P 维护一个本地 runqueue（G 的队列）
P 绑定 M 执行 G
工作窃取（work stealing）：P 的本地队列为空时，从其他 P 偷取 G
系统调用：M 阻塞时，P 与 M 解绑并寻找新的 M
```

::: tip
`GOMAXPROCS` 控制同时运行 Go 代码的 P 数量，默认为 CPU 核心数。可通过 `runtime.GOMAXPROCS(n)` 或环境变量 `GOMAXPROCS` 修改。
:::

## 二、Channel

### 1. 无缓冲 Channel

无缓冲 Channel 的发送和接收必须同时就绪（同步）。

::: details 无缓冲 Channel 示例

```go
import "fmt"

func sum(s []int, ch chan int) {
    total := 0
    for _, v := range s {
        total += v
    }
    ch <- total // 发送结果到 channel
}

func main() {
    nums := []int{7, 2, 8, -9, 4, 0}
    ch   := make(chan int) // 无缓冲 channel

    go sum(nums[:3], ch) // [7 2 8]
    go sum(nums[3:], ch) // [-9 4 0]

    x, y := <-ch, <-ch  // 接收两个结果
    fmt.Println(x + y)   // 12
}
```

:::

### 2. 有缓冲 Channel

有缓冲 Channel 在缓冲区满之前发送不会阻塞，缓冲区空时接收才阻塞。

::: details 有缓冲 Channel 示例

```go
// 工作池模式（Worker Pool）
func workerPool(jobs <-chan int, results chan<- int, workerCount int) {
    var wg sync.WaitGroup

    for w := 0; w < workerCount; w++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs { // range channel：直到 channel 关闭
                results <- processJob(job)
            }
        }()
    }

    // 所有 worker 完成后关闭 results channel
    go func() {
        wg.Wait()
        close(results)
    }()
}

func main() {
    const numJobs = 100
    jobs    := make(chan int, numJobs)    // 有缓冲：一次性放入所有任务
    results := make(chan int, numJobs)

    // 启动 5 个 worker
    workerPool(jobs, results, 5)

    // 分配任务
    for j := 1; j <= numJobs; j++ {
        jobs <- j
    }
    close(jobs) // 关闭任务 channel，通知 worker 没有更多任务

    // 收集结果
    total := 0
    for r := range results {
        total += r
    }
    fmt.Println("总计：", total)
}
```

:::

### 3. 单向 Channel

函数参数中使用单向 channel，限制调用方的操作权限，提升类型安全性。

```go
// <-chan T：只读 channel（只能接收）
// chan<- T：只写 channel（只能发送）

func producer(ch chan<- int, count int) {
    for i := 0; i < count; i++ {
        ch <- i
    }
    close(ch)
}

func consumer(ch <-chan int) {
    for v := range ch {
        fmt.Println("收到：", v)
    }
}

func main() {
    ch := make(chan int, 10) // 双向 channel
    go producer(ch, 5)       // 传入时自动转为 chan<- int
    consumer(ch)             // 传入时自动转为 <-chan int
}
```

## 三、select 语句

`select` 监听多个 channel，哪个就绪就执行哪个，随机选择（多个同时就绪时）。

::: details select 示例

```go
import (
    "context"
    "fmt"
    "time"
)

// 超时控制
func fetchWithTimeout(url string) (string, error) {
    resultCh := make(chan string, 1)
    errCh    := make(chan error, 1)

    go func() {
        result, err := httpGet(url)
        if err != nil {
            errCh <- err
        } else {
            resultCh <- result
        }
    }()

    select {
    case result := <-resultCh:
        return result, nil
    case err := <-errCh:
        return "", err
    case <-time.After(3 * time.Second): // 3 秒超时
        return "", fmt.Errorf("请求超时：%s", url)
    }
}

// 多路复用：同时监听多个数据源
func fanIn(ch1, ch2 <-chan string) <-chan string {
    merged := make(chan string)
    go func() {
        defer close(merged)
        for {
            select {
            case v, ok := <-ch1:
                if !ok { ch1 = nil; continue }
                merged <- v
            case v, ok := <-ch2:
                if !ok { ch2 = nil; continue }
                merged <- v
            }
            if ch1 == nil && ch2 == nil {
                return
            }
        }
    }()
    return merged
}

// 非阻塞 channel 操作（default 分支）
func tryReceive(ch <-chan int) (int, bool) {
    select {
    case v := <-ch:
        return v, true
    default:
        return 0, false // channel 暂无数据，不阻塞
    }
}
```

:::

## 四、sync 包

### 1. Mutex 与 RWMutex

::: details 互斥锁示例

```go
import "sync"

// 互斥锁：保护共享变量
type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}

// 读写锁：读多写少场景性能更好
type SafeCache struct {
    mu    sync.RWMutex
    items map[string]any
}

func (c *SafeCache) Get(key string) (any, bool) {
    c.mu.RLock()   // 读锁（允许并发读）
    defer c.mu.RUnlock()
    v, ok := c.items[key]
    return v, ok
}

func (c *SafeCache) Set(key string, value any) {
    c.mu.Lock()    // 写锁（排他）
    defer c.mu.Unlock()
    c.items[key] = value
}
```

:::

### 2. WaitGroup 与 Once

::: details WaitGroup 与 Once 示例

```go
// WaitGroup：等待一组 goroutine 完成
func parallelProcess(items []string) []Result {
    results := make([]Result, len(items))
    var wg sync.WaitGroup

    for i, item := range items {
        wg.Add(1)
        i, item := i, item // 捕获循环变量（Go 1.22 以前需要）
        go func() {
            defer wg.Done()
            results[i] = process(item) // 每个 goroutine 写独立索引，无竞争
        }()
    }

    wg.Wait()
    return results
}

// Once：确保初始化只执行一次（线程安全的懒加载）
var (
    instance *Config
    once     sync.Once
)

func GetConfig() *Config {
    once.Do(func() {
        instance = loadConfig("config.yaml")
    })
    return instance
}
```

:::

## 五、context 包

`context` 在 goroutine 树中传递截止时间、取消信号和请求范围的键值对，是 Go 并发编程的标准惯例。

::: details context 超时与取消示例

```go
import (
    "context"
    "database/sql"
    "fmt"
    "time"
)

// 超时 context
func queryWithTimeout(db *sql.DB, query string) ([]Row, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel() // 必须调用 cancel，防止 context 泄漏

    rows, err := db.QueryContext(ctx, query)
    if err != nil {
        return nil, fmt.Errorf("查询失败：%w", err)
    }
    defer rows.Close()
    // 处理 rows...
    return parseRows(rows)
}

// 取消 context（用户主动取消或父任务取消）
func startLongTask(parentCtx context.Context) {
    ctx, cancel := context.WithCancel(parentCtx)
    defer cancel()

    go func() {
        for {
            select {
            case <-ctx.Done(): // 收到取消信号
                fmt.Println("任务已取消：", ctx.Err())
                return
            default:
                doWork()
            }
        }
    }()
}

// 在 context 中传递请求级别的值
type contextKey string

const (
    UserIDKey    contextKey = "userID"
    TraceIDKey   contextKey = "traceID"
)

func withUserID(ctx context.Context, userID int64) context.Context {
    return context.WithValue(ctx, UserIDKey, userID)
}

func getUserID(ctx context.Context) (int64, bool) {
    id, ok := ctx.Value(UserIDKey).(int64)
    return id, ok
}

// HTTP 处理链中的典型用法
func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context() // 请求的 context，请求取消时自动 Done

    result, err := service.Query(ctx, "SELECT ...")
    if err != nil {
        if errors.Is(err, context.Canceled) {
            fmt.Println("客户端已断开连接")
            return
        }
        http.Error(w, "查询失败", 500)
        return
    }
    json.NewEncoder(w).Encode(result)
}
```

:::

::: warning
`context.WithValue` 只应传递请求范围的元数据（如 traceID、userID），不应传递业务数据或用来替代函数参数。键类型应使用自定义类型（如 `type contextKey string`）避免与其他包的键冲突。
:::

## 六、竞争条件检测

Go 提供内置的 race detector，可在测试和运行时检测数据竞争。

::: details race detector 使用

```bash
# 运行测试时启用竞态检测
go test -race ./...

# 运行程序时启用竞态检测（开发/测试环境）
go run -race main.go

# 构建时启用
go build -race -o app_race .
```

```go
// 数据竞争示例（不安全）
var counter int

func unsafeIncrement() {
    go func() { counter++ }()  // 并发写 counter，竞争！
    go func() { counter++ }()
}

// 修复：使用 sync/atomic 或 sync.Mutex
import "sync/atomic"

var safeCounter int64

func safeIncrement() {
    go func() { atomic.AddInt64(&safeCounter, 1) }()
    go func() { atomic.AddInt64(&safeCounter, 1) }()
}
```

:::

::: tip
race detector 会有约 2-20 倍的性能损耗，仅在开发和测试环境启用。发布生产版本时不应携带 `-race` 标志。每次提交前建议运行 `go test -race ./...` 确保无竞争问题。
:::
