---
title: "Go 基础语法"
category: "后端 · Golang"
tags:
  - Go
  - 语法
  - 变量
  - 控制流
date: 2026-03-17
---

# Go 基础语法

Go 是静态类型、编译型语言，以简洁的语法、高效的并发和快速的编译著称。理解其变量、数据类型、切片、映射和函数特性，是掌握 Go 语言的基础。

## 一、变量声明

### 1. var 与 :=

Go 提供两种变量声明方式，编译器会在编译期检查类型。

::: details 变量声明示例

```go
package main

import "fmt"

func main() {
    // var 声明（显式类型，可用于包级变量和局部变量）
    var name string = "Alice"
    var age  int    = 25
    var pi   float64 = 3.14159

    // var 省略类型（类型推断）
    var score = 95.5

    // var 批量声明
    var (
        host = "localhost"
        port = 8080
        tls  = false
    )

    // := 短变量声明（只能在函数内部使用，最常用）
    city := "Beijing"
    x, y := 10, 20      // 多变量同时声明

    // 零值：未显式初始化的变量有对应类型的零值
    var count int     // 0
    var flag  bool    // false
    var label string  // ""（空字符串）
    var ptr   *int    // nil

    fmt.Println(name, age, pi, score, host, port, tls, city, x, y)
    fmt.Println(count, flag, label, ptr)

    // 常量
    const MaxRetry = 3
    const (
        StatusOK       = 200
        StatusNotFound = 404
    )
}
```

:::

### 2. 基本数据类型

| 类型 | 大小 | 说明 |
|------|------|------|
| `int` / `uint` | 平台相关（32/64位） | 有符号/无符号整数 |
| `int8` ~ `int64` | 固定 | 固定大小有符号整数 |
| `float32` / `float64` | 4/8 字节 | 浮点数（推荐 float64） |
| `bool` | 1 字节 | `true` / `false` |
| `string` | — | UTF-8 编码的不可变字节序列 |
| `byte` | 1 字节 | `uint8` 的别名 |
| `rune` | 4 字节 | `int32` 的别名，表示 Unicode 码点 |

::: details 字符串操作示例

```go
import (
    "fmt"
    "strings"
    "unicode/utf8"
)

s := "Hello, 世界"

fmt.Println(len(s))                       // 13（字节数，不是字符数）
fmt.Println(utf8.RuneCountInString(s))    // 9（Unicode 字符数）

// 遍历字节
for i := 0; i < len(s); i++ {
    fmt.Printf("%d: %x\n", i, s[i])
}

// 遍历 rune（Unicode 字符）
for idx, r := range s {
    fmt.Printf("%d: %c\n", idx, r)
}

// 字符串操作
fmt.Println(strings.ToUpper(s))
fmt.Println(strings.Contains(s, "世界"))  // true
fmt.Println(strings.HasPrefix(s, "Hello"))
fmt.Println(strings.Replace(s, "World", "Go", 1))
parts := strings.Split("a,b,c", ",")      // ["a" "b" "c"]
joined := strings.Join(parts, "-")         // "a-b-c"

// 格式化字符串
formatted := fmt.Sprintf("用户：%s，年龄：%d，分数：%.2f", "Alice", 25, 95.5)
```

:::

## 二、数组与切片

### 1. 数组

数组长度固定，是值类型（赋值和传参时复制）。

```go
// 数组声明（长度是类型的一部分）
var scores [5]int                    // [0 0 0 0 0]
names := [3]string{"Alice", "Bob", "Charlie"}
matrix := [3][3]int{{1,2,3},{4,5,6},{7,8,9}}

// 让编译器推断长度
primes := [...]int{2, 3, 5, 7, 11}  // [5]int

fmt.Println(len(primes))             // 5
fmt.Println(primes[0])               // 2
```

### 2. 切片（slice）

切片是对底层数组的引用视图，长度可变，是 Go 中最常用的序列类型。

::: details 切片操作示例

```go
// 创建切片
nums := []int{1, 2, 3, 4, 5}          // 字面量
s1   := make([]int, 5)                 // make(类型, 长度)，元素为零值
s2   := make([]int, 3, 10)             // make(类型, 长度, 容量)

// 从数组/切片截取
arr    := [5]int{10, 20, 30, 40, 50}
slice  := arr[1:4]   // [20 30 40]，左闭右开
all    := arr[:]     // [10 20 30 40 50]
prefix := arr[:3]    // [10 20 30]

// append（可能触发底层数组扩容，返回新切片）
nums = append(nums, 6)           // [1 2 3 4 5 6]
nums = append(nums, 7, 8, 9)     // 追加多个
other := []int{10, 11}
nums = append(nums, other...)    // 展开切片追加

// copy（复制到独立内存，修改互不影响）
dst := make([]int, len(nums))
n   := copy(dst, nums)  // 返回复制的元素数

// 删除元素
// 删除索引 i 的元素（保持顺序）
i := 2
nums = append(nums[:i], nums[i+1:]...)

// 删除索引 i 的元素（不保持顺序，但更高效）
nums[i] = nums[len(nums)-1]
nums = nums[:len(nums)-1]

// 切片的长度与容量
fmt.Printf("len=%d, cap=%d\n", len(s2), cap(s2))  // len=3, cap=10
```

:::

::: warning
切片是引用类型，多个切片可能共享同一底层数组。对一个切片的修改会影响共享同一底层数组的其他切片。在需要独立副本时，使用 `copy` 或 `append([]T{}, src...)` 创建新切片。
:::

## 三、map 操作

::: details map 操作示例

```go
// 创建 map（必须用 make 或字面量初始化，nil map 不能写入）
scores := map[string]int{
    "Alice": 95,
    "Bob":   88,
}
freq := make(map[string]int)

// 读写
scores["Charlie"] = 92
alice := scores["Alice"]     // 95

// 安全读取（区分"键不存在"与"值为零值"）
val, ok := scores["David"]
if !ok {
    fmt.Println("David 不在 map 中")
}

// 删除
delete(scores, "Bob")

// 遍历（顺序不确定）
for name, score := range scores {
    fmt.Printf("%s: %d\n", name, score)
}

// 词频统计
words := []string{"go", "python", "go", "java", "go", "python"}
wordCount := make(map[string]int)
for _, word := range words {
    wordCount[word]++
}
// map[go:3 java:1 python:2]
```

:::

## 四、控制流

### 1. if / for / switch

::: details 控制流示例

```go
// if（条件无括号；支持初始化语句）
if score := getScore(); score >= 90 {
    fmt.Println("优秀")
} else if score >= 80 {
    fmt.Println("良好")
} else {
    fmt.Println("及格")
}

// for（Go 唯一的循环关键字，可模拟 while）
for i := 0; i < 5; i++ {
    fmt.Println(i)
}

// 类 while 循环
n := 1
for n < 100 {
    n *= 2
}

// 无限循环
for {
    if done() { break }
}

// range 遍历
fruits := []string{"apple", "banana", "cherry"}
for idx, fruit := range fruits {
    fmt.Printf("%d: %s\n", idx, fruit)
}

// 忽略索引或值（用 _ 占位）
for _, fruit := range fruits { fmt.Println(fruit) }
for idx := range fruits      { fmt.Println(idx) }

// switch（无需 break；case 可包含多个值）
day := "Monday"
switch day {
case "Saturday", "Sunday":
    fmt.Println("周末")
case "Monday", "Tuesday", "Wednesday", "Thursday", "Friday":
    fmt.Println("工作日")
default:
    fmt.Println("未知")
}

// switch 无条件（类似 if-else）
switch {
case score >= 90:
    fmt.Println("A")
case score >= 80:
    fmt.Println("B")
default:
    fmt.Println("C")
}
```

:::

### 2. defer

`defer` 将函数调用延迟到外层函数返回前执行，常用于资源清理。多个 defer 按 LIFO（后进先出）顺序执行。

::: details defer 示例

```go
import (
    "fmt"
    "os"
)

func processFile(filename string) error {
    f, err := os.Open(filename)
    if err != nil {
        return fmt.Errorf("打开文件失败：%w", err)
    }
    defer f.Close()  // 无论后续是否发生错误，函数返回时自动关闭

    // 处理文件内容...
    return nil
}

// defer 与循环（避免在循环体内使用 defer，应提取为函数）
func processFiles(files []string) {
    for _, file := range files {
        func() {
            f, err := os.Open(file)
            if err != nil { return }
            defer f.Close()    // defer 在匿名函数返回时执行
            // 处理...
        }()
    }
}

// defer 打印顺序
func demoOrder() {
    defer fmt.Println("第三")
    defer fmt.Println("第二")
    defer fmt.Println("第一")
    fmt.Println("正常执行")
}
// 输出：正常执行 → 第一 → 第二 → 第三
```

:::

## 五、函数

### 1. 多返回值与命名返回值

::: details 函数特性示例

```go
// 多返回值（Go 的特色，常用于错误处理）
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("除数不能为零")
    }
    return a / b, nil
}

result, err := divide(10, 3)
if err != nil {
    fmt.Println("错误：", err)
    return
}
fmt.Printf("结果：%.4f\n", result)

// 命名返回值（适合短小函数，增强可读性）
func minMax(nums []int) (min, max int) {
    min, max = nums[0], nums[0]
    for _, n := range nums[1:] {
        if n < min { min = n }
        if n > max { max = n }
    }
    return // 裸返回（naked return），返回命名变量的当前值
}

// 可变参数（variadic）
func sum(nums ...int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}

fmt.Println(sum(1, 2, 3))          // 6
fmt.Println(sum([]int{1,2,3,4}...)) // 展开切片：10

// 函数作为值（一等公民）
type MathFunc func(int, int) int

func applyOp(a, b int, op MathFunc) int {
    return op(a, b)
}

add := func(x, y int) int { return x + y }
fmt.Println(applyOp(3, 4, add))    // 7

// 闭包
func makeCounter(start int) func() int {
    count := start
    return func() int {
        count++
        return count
    }
}

counter := makeCounter(0)
fmt.Println(counter()) // 1
fmt.Println(counter()) // 2
fmt.Println(counter()) // 3
```

:::

## 六、指针基础

Go 的指针比 C 安全（无指针运算），主要用于在函数间共享可变数据，避免大结构体的值拷贝。

::: details 指针示例

```go
// & 取地址，* 解引用
x := 42
ptr := &x           // ptr 是 *int 类型，存储 x 的内存地址
fmt.Println(*ptr)   // 42（解引用获取值）
*ptr = 100          // 通过指针修改原变量
fmt.Println(x)      // 100

// 函数通过指针修改参数
func increment(n *int) {
    *n++
}

count := 0
increment(&count)
fmt.Println(count) // 1

// new 分配零值并返回指针
p := new(int)       // *int，指向值为 0 的 int
*p = 999
fmt.Println(*p)     // 999

// 结构体指针（访问字段时 . 自动解引用，无需 ->）
type Point struct{ X, Y int }
pp := &Point{X: 3, Y: 4}
fmt.Println(pp.X)   // 3（等价于 (*pp).X）
pp.X = 10           // 修改原结构体
```

:::

::: tip
Go 不支持指针运算（如 `ptr++`），这是 Go 相对 C/C++ 更安全的重要原因之一。如果需要低级内存操作，可以使用 `unsafe` 包，但通常不推荐。
:::
