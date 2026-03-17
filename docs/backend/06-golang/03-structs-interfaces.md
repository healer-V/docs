---
title: "Go 结构体与接口"
category: "后端 · Golang"
tags:
  - Go
  - 结构体
  - 接口
  - 方法
date: 2026-03-17
---

# Go 结构体与接口

Go 通过结构体定义数据模型，通过接口定义行为契约。Go 的接口采用隐式实现（无需 `implements` 关键字），结合鸭子类型思想，使代码解耦更自然。

## 一、结构体

### 1. 定义与初始化

::: details 结构体定义示例

```go
package main

import (
    "fmt"
    "time"
)

// 基本结构体
type User struct {
    ID        int64
    Name      string
    Email     string
    CreatedAt time.Time
    Profile   *UserProfile  // 指针字段（可为 nil）
}

type UserProfile struct {
    Avatar string
    Bio    string
    City   string
}

// 初始化方式
func main() {
    // 字面量（推荐：命名字段，顺序无关）
    u1 := User{
        ID:        1,
        Name:      "Alice",
        Email:     "alice@example.com",
        CreatedAt: time.Now(),
    }

    // 匿名字段初始化（按顺序，不推荐：字段顺序变动会导致 bug）
    u2 := User{2, "Bob", "bob@example.com", time.Now(), nil}

    // new：分配零值结构体，返回指针
    u3 := new(User)
    u3.Name = "Charlie"

    fmt.Println(u1.Name)  // Alice
    fmt.Println(u2.Email) // bob@example.com
    fmt.Println(u3.Name)  // Charlie

    // 工厂函数（Go 惯用模式，替代构造方法）
    user := NewUser(3, "Dave", "dave@example.com")
    fmt.Println(user)
}

func NewUser(id int64, name, email string) *User {
    return &User{
        ID:        id,
        Name:      name,
        Email:     email,
        CreatedAt: time.Now(),
    }
}
```

:::

### 2. 结构体嵌入

Go 通过嵌入（Embedding）实现"组合优于继承"，被嵌入类型的字段和方法自动提升到外层结构体。

::: details 结构体嵌入示例

```go
type Animal struct {
    Name string
    Age  int
}

func (a Animal) Describe() string {
    return fmt.Sprintf("%s（%d 岁）", a.Name, a.Age)
}

// Dog 嵌入 Animal（匿名字段）
type Dog struct {
    Animal        // 嵌入：Animal 的字段和方法被提升
    Breed  string
}

func main() {
    dog := Dog{
        Animal: Animal{Name: "旺财", Age: 3},
        Breed:  "柴犬",
    }

    // 直接访问被提升的字段和方法
    fmt.Println(dog.Name)        // 旺财（等价于 dog.Animal.Name）
    fmt.Println(dog.Describe())  // 旺财（3 岁）
    fmt.Println(dog.Breed)       // 柴犬
}

// 多层嵌入
type ServiceBase struct {
    Logger *log.Logger
    Config *Config
}

func (s *ServiceBase) Log(msg string) {
    s.Logger.Println(msg)
}

type UserService struct {
    ServiceBase     // 嵌入，获得 Log 方法
    DB *sql.DB
}
```

:::

## 二、方法

### 1. 值接收者 vs 指针接收者

::: details 接收者选择示例

```go
type Rectangle struct {
    Width  float64
    Height float64
}

// 值接收者：操作的是结构体的副本，不修改原值
// 适合：不修改状态、结构体很小、需要并发安全读操作
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
    return 2 * (r.Width + r.Height)
}

func (r Rectangle) String() string {
    return fmt.Sprintf("Rectangle(%.2f × %.2f)", r.Width, r.Height)
}

// 指针接收者：操作原结构体，修改会生效
// 适合：修改状态、结构体较大（避免复制开销）
func (r *Rectangle) Scale(factor float64) {
    r.Width  *= factor
    r.Height *= factor
}

func main() {
    rect := Rectangle{Width: 10, Height: 5}

    // 值接收者：rect 和指针都可以调用，编译器自动转换
    fmt.Println(rect.Area())       // 50
    fmt.Println((&rect).Area())    // 50（等价）

    // 指针接收者：也可以通过值调用（编译器自动取地址）
    rect.Scale(2)                  // 等价于 (&rect).Scale(2)
    fmt.Println(rect.Width)        // 20
}
```

:::

::: tip 接收者选择规则
- 需要修改接收者 → 指针接收者
- 结构体包含 `sync.Mutex` 等不可复制字段 → 指针接收者
- 结构体较大（通常超过几个字段） → 指针接收者
- 同一类型的所有方法应保持一致（要么全用值接收者，要么全用指针接收者），混用会导致混乱
:::

## 三、接口

### 1. 接口定义与隐式实现

Go 的接口是隐式实现的：一个类型只要拥有接口要求的所有方法，就自动满足该接口，无需显式声明。

::: details 接口定义与实现示例

```go
// 定义接口
type Shape interface {
    Area() float64
    Perimeter() float64
}

type Stringer interface {
    String() string
}

// 接口组合
type DescribableShape interface {
    Shape
    Stringer
}

// Circle 实现 Shape 接口（无需 implements 关键字）
type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
    return 2 * math.Pi * c.Radius
}

func (c Circle) String() string {
    return fmt.Sprintf("Circle(r=%.2f)", c.Radius)
}

// Rectangle 也实现了 Shape 接口（上面已定义了 Area 和 Perimeter）

func printShapeInfo(s Shape) {
    fmt.Printf("面积：%.2f，周长：%.2f\n", s.Area(), s.Perimeter())
}

func main() {
    shapes := []Shape{
        Circle{Radius: 5},
        Rectangle{Width: 4, Height: 6},
    }

    for _, shape := range shapes {
        printShapeInfo(shape)
    }
}
```

:::

### 2. 空接口 interface{}

`interface{}` 可以存储任意类型的值，类似其他语言的 `any`（Go 1.18+ 可以直接写 `any`）。

::: details 空接口示例

```go
// any 是 interface{} 的类型别名（Go 1.18+）
func printAnything(v any) {
    fmt.Printf("类型：%T，值：%v\n", v, v)
}

printAnything(42)
printAnything("hello")
printAnything([]int{1, 2, 3})
printAnything(nil)

// 存储任意类型的 map（类似动态类型语言的对象）
config := map[string]any{
    "host":    "localhost",
    "port":    5432,
    "debug":   true,
    "timeout": 30.0,
}
```

:::

### 3. 类型断言与类型 switch

::: details 类型断言示例

```go
var val any = "Hello, Go"

// 单返回值类型断言（类型不匹配则 panic）
s := val.(string)
fmt.Println(s) // Hello, Go

// 双返回值类型断言（安全，不 panic）
n, ok := val.(int)
if !ok {
    fmt.Println("val 不是 int 类型")
}

// 类型 switch（处理多种可能类型）
func describe(v any) string {
    switch x := v.(type) {
    case int:
        return fmt.Sprintf("整数：%d", x)
    case float64:
        return fmt.Sprintf("浮点数：%.2f", x)
    case string:
        return fmt.Sprintf("字符串：%q（长度 %d）", x, len(x))
    case bool:
        return fmt.Sprintf("布尔值：%v", x)
    case []int:
        return fmt.Sprintf("整数切片，共 %d 个元素", len(x))
    case nil:
        return "nil"
    default:
        return fmt.Sprintf("未知类型：%T", x)
    }
}

fmt.Println(describe(42))          // 整数：42
fmt.Println(describe("world"))     // 字符串："world"（长度 5）
fmt.Println(describe([]int{1,2}))  // 整数切片，共 2 个元素
```

:::

## 四、错误处理

### 1. error 接口

Go 将错误视为普通值，`error` 是一个内置接口：

```go
type error interface {
    Error() string
}
```

::: details 错误处理示例

```go
import (
    "errors"
    "fmt"
)

// 简单错误
var ErrNotFound = errors.New("记录不存在")
var ErrInvalidInput = errors.New("无效的输入参数")

// fmt.Errorf 包装错误（%w 动词保留错误链）
func findUser(id int) (*User, error) {
    if id <= 0 {
        return nil, fmt.Errorf("findUser: %w: id=%d", ErrInvalidInput, id)
    }
    user, err := db.QueryUser(id)
    if err != nil {
        return nil, fmt.Errorf("findUser: 数据库查询失败: %w", err)
    }
    if user == nil {
        return nil, fmt.Errorf("findUser: id=%d: %w", id, ErrNotFound)
    }
    return user, nil
}

// 自定义错误类型（携带上下文信息）
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("字段 %q 验证失败：%s", e.Field, e.Message)
}

func validateAge(age int) error {
    if age < 0 || age > 150 {
        return &ValidationError{
            Field:   "age",
            Message: fmt.Sprintf("年龄必须在 0-150 之间，收到 %d", age),
        }
    }
    return nil
}

func main() {
    user, err := findUser(0)
    if err != nil {
        // errors.Is：检查错误链中是否包含目标错误（支持 Unwrap）
        if errors.Is(err, ErrInvalidInput) {
            fmt.Println("输入参数错误")
        }
        fmt.Println(err) // 输出完整错误链
        return
    }

    if err := validateAge(200); err != nil {
        // errors.As：检查并提取特定类型的错误
        var ve *ValidationError
        if errors.As(err, &ve) {
            fmt.Printf("验证字段：%s\n", ve.Field)
            fmt.Printf("错误消息：%s\n", ve.Message)
        }
    }
    _ = user
}
```

:::

### 2. panic 与 recover

::: details panic/recover 示例

```go
// panic 用于不可恢复的错误（程序 bug，而非业务错误）
func mustParseInt(s string) int {
    n, err := strconv.Atoi(s)
    if err != nil {
        panic(fmt.Sprintf("mustParseInt: 无法解析 %q: %v", s, err))
    }
    return n
}

// recover 在 defer 中捕获 panic
func safeCall(f func()) (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("捕获 panic：%v", r)
        }
    }()
    f()
    return nil
}

// HTTP 服务中的 recover 中间件（防止单个请求 panic 导致服务崩溃）
func recoverMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if rec := recover(); rec != nil {
                log.Printf("panic recovered: %v\n%s", rec, debug.Stack())
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            }
        }()
        next.ServeHTTP(w, r)
    })
}
```

:::

::: warning
**panic 不是错误处理机制**。普通业务错误（如用户不存在、参数不合法）应返回 `error`，只有真正不可恢复的情况（如数组越界、nil 指针解引用等编程错误）才使用 panic。
:::
