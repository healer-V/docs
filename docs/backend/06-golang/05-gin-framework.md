---
title: "Gin Web 框架入门"
category: "后端 · Golang"
tags:
  - Go
  - Gin
  - Web框架
  - REST
date: 2026-03-17
---

# Gin Web 框架入门

Gin 是 Go 生态中最流行的 HTTP Web 框架，基于 `httprouter` 实现高性能路由，提供中间件、请求绑定、JSON 响应等核心功能。GORM 是 Go 的全功能 ORM，两者结合是构建 REST API 的主流方案。

## 一、Gin 路由

### 1. 基本路由

::: details Gin 路由示例

```go
// main.go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    // 创建引擎（默认包含 Logger 和 Recovery 中间件）
    r := gin.Default()

    // 基本 CRUD 路由
    r.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "ok"})
    })

    // 路径参数
    r.GET("/users/:id", func(c *gin.Context) {
        id := c.Param("id") // 获取路径参数
        c.JSON(http.StatusOK, gin.H{"id": id})
    })

    // 查询参数：/search?q=go&page=1&size=20
    r.GET("/search", func(c *gin.Context) {
        query := c.Query("q")
        page  := c.DefaultQuery("page", "1")  // 有默认值
        size  := c.DefaultQuery("size", "20")
        c.JSON(http.StatusOK, gin.H{
            "query": query,
            "page":  page,
            "size":  size,
        })
    })

    // POST：接收 JSON 请求体
    r.POST("/users", createUser)
    r.PUT("/users/:id", updateUser)
    r.DELETE("/users/:id", deleteUser)

    // 启动服务
    r.Run(":8080") // 默认 0.0.0.0:8080
}
```

:::

### 2. 路由组

路由组为一组路由统一添加前缀和中间件，实现模块化管理。

::: details 路由组示例

```go
func setupRoutes(r *gin.Engine) {
    // API 版本前缀
    v1 := r.Group("/api/v1")
    {
        // 公开路由
        auth := v1.Group("/auth")
        auth.POST("/login",    handleLogin)
        auth.POST("/register", handleRegister)
        auth.POST("/refresh",  handleRefresh)

        // 需要认证的路由（加 JWT 中间件）
        protected := v1.Group("")
        protected.Use(JWTAuthMiddleware())
        {
            // 用户资源
            users := protected.Group("/users")
            users.GET("",         listUsers)
            users.GET("/:id",     getUser)
            users.PUT("/:id",     updateUser)
            users.DELETE("/:id",  deleteUser)

            // 订单资源
            orders := protected.Group("/orders")
            orders.GET("",        listOrders)
            orders.POST("",       createOrder)
            orders.GET("/:id",    getOrder)
        }

        // 管理员路由（加额外的权限中间件）
        admin := v1.Group("/admin")
        admin.Use(JWTAuthMiddleware(), AdminRoleMiddleware())
        {
            admin.GET("/stats",  getStats)
            admin.GET("/users",  adminListUsers)
        }
    }
}
```

:::

## 二、中间件

### 1. 内置中间件

`gin.Default()` 自动包含两个中间件：
- `gin.Logger()`：记录每次请求的方法、路径、状态码和耗时
- `gin.Recovery()`：捕获 panic，防止服务崩溃，返回 500

### 2. 自定义中间件

::: details 中间件示例

```go
// JWT 认证中间件
func JWTAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "error": "缺少 Authorization 请求头",
            })
            return
        }
        // 去掉 "Bearer " 前缀
        if len(token) > 7 && token[:7] == "Bearer " {
            token = token[7:]
        }

        claims, err := parseJWT(token)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "error": "无效的 token：" + err.Error(),
            })
            return
        }

        // 将用户信息存入 context，供后续 handler 使用
        c.Set("userID", claims.UserID)
        c.Set("userRole", claims.Role)

        c.Next() // 执行下一个 handler
    }
}

// 请求日志中间件（记录请求体，便于调试）
func RequestLogMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()

        // 读取并保存请求体（方便后续 handler 继续读取）
        body, _ := io.ReadAll(c.Request.Body)
        c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

        c.Next()

        log.Printf("[%s] %s %d %v | body: %s",
            c.Request.Method,
            c.Request.URL.Path,
            c.Writer.Status(),
            time.Since(start),
            string(body),
        )
    }
}

// 限流中间件（令牌桶）
func RateLimitMiddleware(rps int) gin.HandlerFunc {
    limiter := rate.NewLimiter(rate.Limit(rps), rps*2)
    return func(c *gin.Context) {
        if !limiter.Allow() {
            c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
                "error": "请求频率超限，请稍后再试",
            })
            return
        }
        c.Next()
    }
}
```

:::

## 三、请求绑定

Gin 通过 `ShouldBind` 系列方法将请求数据自动绑定到结构体，并触发 validator 验证。

::: details 请求绑定示例

```go
// 请求体结构体（binding tag 定义验证规则）
type CreateProductRequest struct {
    Name     string   `json:"name"     binding:"required,min=1,max=200"`
    Price    float64  `json:"price"    binding:"required,gt=0"`
    Category string   `json:"category" binding:"required"`
    Stock    int      `json:"stock"    binding:"min=0"`
    Tags     []string `json:"tags"     binding:"max=10"`
}

type ProductQueryRequest struct {
    Category string  `form:"category"`
    MinPrice float64 `form:"min_price" binding:"min=0"`
    MaxPrice float64 `form:"max_price" binding:"min=0"`
    Page     int     `form:"page"     binding:"min=1"`
    Size     int     `form:"size"     binding:"min=1,max=100"`
}

// 创建商品（绑定 JSON 请求体）
func createProduct(c *gin.Context) {
    var req CreateProductRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error":   "请求参数错误",
            "details": err.Error(),
        })
        return
    }

    product, err := productService.Create(c.Request.Context(), req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, gin.H{"data": product})
}

// 查询商品列表（绑定查询参数）
func listProducts(c *gin.Context) {
    var query ProductQueryRequest
    query.Page = 1   // 默认值
    query.Size = 20

    if err := c.ShouldBindQuery(&query); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    products, total, err := productService.List(c.Request.Context(), query)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{
        "data":  products,
        "total": total,
        "page":  query.Page,
        "size":  query.Size,
    })
}
```

:::

## 四、响应

::: details 响应方式示例

```go
// JSON 响应（最常用）
c.JSON(http.StatusOK, gin.H{
    "code":    0,
    "message": "success",
    "data":    data,
})

// 自定义响应结构体
type ApiResponse struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Data    any    `json:"data,omitempty"`
}

func Success(c *gin.Context, data any) {
    c.JSON(http.StatusOK, ApiResponse{Code: 0, Message: "success", Data: data})
}

func Fail(c *gin.Context, statusCode int, message string) {
    c.JSON(statusCode, ApiResponse{Code: statusCode, Message: message})
}

// 字符串响应
c.String(http.StatusOK, "Hello, %s!", name)

// 文件下载
c.File("./static/report.pdf")
c.FileAttachment("./static/report.pdf", "月报.pdf")

// 重定向
c.Redirect(http.StatusMovedPermanently, "https://example.com")

// 流式响应（SSE / Server-Sent Events）
c.Stream(func(w io.Writer) bool {
    data, ok := <-eventChan
    if !ok { return false }
    fmt.Fprintf(w, "data: %s\n\n", data)
    return true
})
```

:::

## 五、GORM 基础

### 1. 连接与模型定义

::: details GORM 连接与模型示例

```go
import (
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
    "time"
)

// 模型定义（嵌入 gorm.Model 自动获得 ID/CreatedAt/UpdatedAt/DeletedAt）
type Product struct {
    gorm.Model
    Name     string  `gorm:"size:200;not null;index"`
    Price    float64 `gorm:"type:decimal(10,2);not null"`
    Category string  `gorm:"size:100;index"`
    Stock    int     `gorm:"default:0"`
    Tags     string  `gorm:"size:500"`                // JSON 序列化存储
}

// 关联
type Order struct {
    gorm.Model
    UserID  uint
    User    User      `gorm:"foreignKey:UserID"`
    Items   []OrderItem
    Total   float64
    Status  string    `gorm:"default:'pending'"`
}

type OrderItem struct {
    gorm.Model
    OrderID   uint
    ProductID uint
    Product   Product
    Quantity  int
    Price     float64
}

// 初始化数据库连接
func InitDB(dsn string) (*gorm.DB, error) {
    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
        NowFunc: func() time.Time {
            return time.Now().UTC()
        },
    })
    if err != nil {
        return nil, err
    }

    // 配置连接池
    sqlDB, _ := db.DB()
    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)
    sqlDB.SetConnMaxLifetime(30 * time.Minute)

    // 自动迁移（开发环境）
    db.AutoMigrate(&Product{}, &Order{}, &OrderItem{})

    return db, nil
}
```

:::

### 2. CRUD 操作

::: details GORM CRUD 示例

```go
// 创建
product := &Product{Name: "iPhone 15", Price: 7999, Category: "electronics", Stock: 100}
result := db.Create(product)
if result.Error != nil {
    log.Fatal(result.Error)
}
fmt.Println("新商品 ID：", product.ID) // 自动填充

// 批量创建
products := []*Product{
    {Name: "AirPods Pro", Price: 1999, Category: "electronics"},
    {Name: "MacBook Pro",  Price: 12999, Category: "electronics"},
}
db.CreateInBatches(products, 100) // 每批 100 条

// 查询
var p Product
db.First(&p, 1)                     // 按主键查询
db.First(&p, "name = ?", "iPhone 15") // 条件查询

var all []Product
db.Find(&all)                       // 查询全部
db.Where("category = ? AND price < ?", "electronics", 5000).Find(&all)

// 链式调用
db.Model(&Product{}).
    Select("id, name, price").
    Where("category = ?", "electronics").
    Where("stock > 0").
    Order("price asc").
    Limit(20).Offset(0).
    Find(&all)

// 更新
db.Model(&product).Update("price", 8999.0)           // 单字段
db.Model(&product).Updates(Product{Price: 8999, Stock: 50}) // 多字段（零值字段被跳过）
db.Model(&product).Updates(map[string]any{"price": 8999, "stock": 50}) // 用 map 更新零值

// 删除（逻辑删除：gorm.Model 包含 DeletedAt 字段）
db.Delete(&product, 1)
db.Where("category = ?", "obsolete").Delete(&Product{})

// 关联查询
var order Order
db.Preload("User").Preload("Items.Product").First(&order, 1)
// Preload 嵌套加载：Order → Items → Product
```

:::

## 六、项目结构最佳实践

推荐的 Gin + GORM 项目目录结构：

```
myapp/
├── cmd/
│   └── server/
│       └── main.go          # 程序入口
├── internal/
│   ├── config/
│   │   └── config.go        # 配置加载（读取环境变量 / yaml）
│   ├── handler/             # HTTP 处理器（绑定请求 → 调用 service → 返回响应）
│   │   ├── product.go
│   │   └── user.go
│   ├── middleware/          # 中间件
│   │   ├── auth.go
│   │   └── logger.go
│   ├── model/               # 数据库模型（GORM struct）
│   │   ├── product.go
│   │   └── user.go
│   ├── repository/          # 数据访问层（封装 GORM 操作）
│   │   ├── product_repo.go
│   │   └── user_repo.go
│   ├── service/             # 业务逻辑层
│   │   ├── product_service.go
│   │   └── user_service.go
│   └── router/
│       └── router.go        # 路由注册
├── pkg/
│   ├── response/            # 统一响应格式
│   │   └── response.go
│   └── jwt/                 # JWT 工具
│       └── jwt.go
├── go.mod
└── go.sum
```

::: details main.go 入口示例

```go
// cmd/server/main.go
package main

import (
    "log"
    "myapp/internal/config"
    "myapp/internal/router"
    "myapp/internal/model"
)

func main() {
    // 1. 加载配置
    cfg, err := config.Load()
    if err != nil {
        log.Fatal("加载配置失败：", err)
    }

    // 2. 初始化数据库
    db, err := model.InitDB(cfg.DSN)
    if err != nil {
        log.Fatal("数据库连接失败：", err)
    }

    // 3. 初始化路由
    r := router.Setup(db, cfg)

    // 4. 启动服务
    log.Printf("服务启动，监听 %s", cfg.Addr)
    if err := r.Run(cfg.Addr); err != nil {
        log.Fatal("服务启动失败：", err)
    }
}
```

:::

::: tip 分层职责
- **handler**：只负责 HTTP 层（参数绑定、响应格式化），不包含业务逻辑
- **service**：核心业务逻辑，不感知 HTTP 协议
- **repository**：数据库操作封装，service 通过接口依赖 repository（便于单元测试时 mock）

这种分层使每层可以独立测试，依赖方向始终向内（handler → service → repository → DB）。
:::
