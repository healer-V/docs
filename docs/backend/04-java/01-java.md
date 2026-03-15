---
title: "Java概述"
category: "后端 · Java"
tags:
  - Java
excerpt: "Java是由Sun Microsystems（现Oracle）于1995年发布的面向对象编程语言。其设计理念为 \"Write Once, Run Anywhere\"，通过JVM实现跨平台运行。 | 版本 | 发布年份 | 重要特性 | |-..."
---

# Java概述

## 一、Java简介

### 1. 什么是Java

Java是由Sun Microsystems（现Oracle）于1995年发布的面向对象编程语言。其设计理念为 **"Write Once, Run Anywhere"**，通过JVM实现跨平台运行。

### 2. 发展历程

| 版本 | 发布年份 | 重要特性 |
|------|----------|----------|
| Java 1.0 | 1996 | 初始版本 |
| Java 5 | 2004 | 泛型、枚举、注解、自动装箱 |
| Java 8 | 2014 | Lambda表达式、Stream API、Optional |
| Java 11 | 2018 | HTTP Client、局部变量类型推断（LTS） |
| Java 17 | 2021 | 密封类、模式匹配（LTS） |
| Java 21 | 2023 | 虚拟线程、Record Patterns（LTS） |

### 3. JVM、JDK与JRE的关系

```
JDK（Java Development Kit）
├── JRE（Java Runtime Environment）
│   ├── JVM（Java Virtual Machine）
│   └── 核心类库（rt.jar）
├── javac（编译器）
├── jdb（调试器）
└── 其他开发工具
```

::: tip 选择建议
开发环境安装JDK，生产环境仅需JRE（Java 11之后Oracle不再单独提供JRE，建议直接使用JDK）。
:::

## 二、环境搭建

### 1. 安装JDK

::: code-group
```bash [macOS (Homebrew)]
# 安装OpenJDK 21
brew install openjdk@21

# 配置环境变量 ~/.zshrc
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH=$JAVA_HOME/bin:$PATH
```

```bash [Linux (Ubuntu)]
# 安装OpenJDK 21
sudo apt update
sudo apt install openjdk-21-jdk

# 验证安装
java -version
javac -version
```

```powershell [Windows]
# 使用scoop安装
scoop install openjdk21

# 或手动配置环境变量
# JAVA_HOME = C:\Program Files\Java\jdk-21
# Path追加 %JAVA_HOME%\bin
```
:::

### 2. 第一个Java程序

::: details 示例：HelloWorld
```java
// HelloWorld.java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}
```

```bash
# 编译
javac HelloWorld.java

# 运行
java HelloWorld
```
:::

### 3. 构建工具

实际项目中通常使用Maven或Gradle管理依赖和构建流程。

::: code-group
```xml [Maven - pom.xml]
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>my-app</artifactId>
    <version>1.0.0</version>
    <properties>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
    </properties>
</project>
```

```groovy [Gradle - build.gradle]
plugins {
    id 'java'
}

group = 'com.example'
version = '1.0.0'

java {
    sourceCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()
}
```
:::

## 三、基础语法

### 1. 数据类型

Java是强类型语言，数据类型分为 **基本类型** 和 **引用类型**。

| 基本类型 | 大小 | 默认值 | 取值范围 |
|----------|------|--------|----------|
| `byte` | 1字节 | 0 | -128 ~ 127 |
| `short` | 2字节 | 0 | -32768 ~ 32767 |
| `int` | 4字节 | 0 | -2^31 ~ 2^31-1 |
| `long` | 8字节 | 0L | -2^63 ~ 2^63-1 |
| `float` | 4字节 | 0.0f | IEEE 754单精度 |
| `double` | 8字节 | 0.0d | IEEE 754双精度 |
| `char` | 2字节 | '\u0000' | 0 ~ 65535 |
| `boolean` | - | false | true / false |

::: details 示例：变量声明与类型转换
```java
// 基本类型
int userAge = 25;
double accountBalance = 10240.50;
boolean isActive = true;
char grade = 'A';

// 自动类型转换（小 → 大）
long totalAmount = userAge; // int → long

// 强制类型转换（大 → 小）
int truncatedBalance = (int) accountBalance; // 精度丢失：10240

// Java 10+ 局部变量类型推断
var userName = "张三"; // 编译器推断为String
var orderList = List.of("订单A", "订单B"); // 推断为List<String>
```
:::

::: warning 注意
浮点数运算存在精度问题，金额计算应使用 `BigDecimal`。
```java
// 错误示范
double price = 0.1 + 0.2; // 0.30000000000000004

// 正确做法
BigDecimal price = new BigDecimal("0.1").add(new BigDecimal("0.2")); // 0.3
```
:::

### 2. 运算符

| 类别 | 运算符 |
|------|--------|
| 算术 | `+` `-` `*` `/` `%` |
| 关系 | `==` `!=` `>` `<` `>=` `<=` |
| 逻辑 | `&&` `\|\|` `!` |
| 位运算 | `&` `\|` `^` `~` `<<` `>>` `>>>` |
| 赋值 | `=` `+=` `-=` `*=` `/=` |
| 三元 | `条件 ? 值1 : 值2` |
| instanceof | `obj instanceof Type` |

### 3. 控制流

::: details 示例：条件与循环
```java
// if-else
int httpStatus = 404;
if (httpStatus == 200) {
    System.out.println("请求成功");
} else if (httpStatus == 404) {
    System.out.println("资源未找到");
} else {
    System.out.println("其他状态: " + httpStatus);
}

// switch表达式（Java 14+）
String statusMessage = switch (httpStatus) {
    case 200 -> "OK";
    case 301 -> "Moved Permanently";
    case 404 -> "Not Found";
    case 500 -> "Internal Server Error";
    default -> "Unknown Status";
};

// for循环
String[] fruits = {"苹果", "香蕉", "橙子"};
for (int i = 0; i < fruits.length; i++) {
    System.out.println(fruits[i]);
}

// 增强for循环
for (String fruit : fruits) {
    System.out.println(fruit);
}

// while循环
int retryCount = 0;
while (retryCount < 3) {
    System.out.println("第" + (retryCount + 1) + "次重试");
    retryCount++;
}
```
:::

## 四、面向对象编程

### 1. 类与对象

::: details 示例：定义类与创建对象
```java
// User.java
public class User {
    // 字段
    private String username;
    private String email;
    private int age;

    // 构造方法
    public User(String username, String email, int age) {
        this.username = username;
        this.email = email;
        this.age = age;
    }

    // Getter / Setter
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    // 方法
    public String getDisplayName() {
        return username + " (" + email + ")";
    }

    @Override
    public String toString() {
        return "User{username='" + username + "', email='" + email + "', age=" + age + "}";
    }
}
```

```java
// 使用
User admin = new User("admin", "admin@example.com", 30);
System.out.println(admin.getDisplayName()); // admin (admin@example.com)
```
:::

### 2. 接口与抽象类

::: details 示例：接口定义与实现
```java
// PaymentService.java - 接口
public interface PaymentService {
    boolean pay(BigDecimal amount);
    String getPaymentMethod();

    // 默认方法（Java 8+）
    default String formatReceipt(BigDecimal amount) {
        return "支付方式: " + getPaymentMethod() + ", 金额: ¥" + amount;
    }
}

// AlipayService.java - 实现
public class AlipayService implements PaymentService {
    @Override
    public boolean pay(BigDecimal amount) {
        System.out.println("通过支付宝支付: ¥" + amount);
        return true;
    }

    @Override
    public String getPaymentMethod() {
        return "支付宝";
    }
}

// WechatPayService.java - 实现
public class WechatPayService implements PaymentService {
    @Override
    public boolean pay(BigDecimal amount) {
        System.out.println("通过微信支付: ¥" + amount);
        return true;
    }

    @Override
    public String getPaymentMethod() {
        return "微信支付";
    }
}
```
:::

### 3. 继承

::: details 示例：继承与方法重写
```java
// Shape.java - 基类
public abstract class Shape {
    protected String color;

    public Shape(String color) {
        this.color = color;
    }

    public abstract double getArea();

    public String describe() {
        return color + "的图形，面积为" + String.format("%.2f", getArea());
    }
}

// Circle.java - 子类
public class Circle extends Shape {
    private double radius;

    public Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }

    @Override
    public double getArea() {
        return Math.PI * radius * radius;
    }
}

// Rectangle.java - 子类
public class Rectangle extends Shape {
    private double width;
    private double height;

    public Rectangle(String color, double width, double height) {
        super(color);
        this.width = width;
        this.height = height;
    }

    @Override
    public double getArea() {
        return width * height;
    }
}
```
:::

### 4. 多态

::: details 示例：多态的应用
```java
// 多态：父类引用指向子类对象
Shape circle = new Circle("红色", 5.0);
Shape rectangle = new Rectangle("蓝色", 4.0, 6.0);

List<Shape> shapes = List.of(circle, rectangle);
for (Shape shape : shapes) {
    // 运行时调用实际类型的getArea()
    System.out.println(shape.describe());
}

// Java 16+ 模式匹配
Object value = "Hello";
if (value instanceof String text) {
    System.out.println("字符串长度: " + text.length());
}
```
:::

## 五、集合框架

### 1. 集合体系结构

```
Collection（接口）
├── List（有序、可重复）
│   ├── ArrayList   — 数组实现，随机访问快
│   ├── LinkedList  — 链表实现，增删快
│   └── Vector      — 线程安全（已过时）
├── Set（无序、不可重复）
│   ├── HashSet     — 哈希表实现
│   ├── LinkedHashSet — 保持插入顺序
│   └── TreeSet     — 红黑树，自然排序
└── Queue（队列）
    ├── LinkedList
    ├── PriorityQueue
    └── ArrayDeque

Map（键值对，接口）
├── HashMap        — 哈希表实现
├── LinkedHashMap  — 保持插入顺序
├── TreeMap        — 红黑树，按键排序
└── ConcurrentHashMap — 线程安全
```

### 2. 常用操作

::: details 示例：List、Map、Set操作
```java
// List
List<String> cityList = new ArrayList<>();
cityList.add("北京");
cityList.add("上海");
cityList.add("深圳");
cityList.get(0); // "北京"
cityList.remove("上海");

// 不可变List（Java 9+）
List<String> languages = List.of("Java", "Go", "Rust");

// Map
Map<String, Integer> productStock = new HashMap<>();
productStock.put("笔记本电脑", 50);
productStock.put("机械键盘", 200);
productStock.put("显示器", 80);

int stock = productStock.getOrDefault("鼠标", 0); // 0

// 遍历Map
productStock.forEach((product, count) ->
    System.out.println(product + ": " + count + "台")
);

// Set
Set<String> tagSet = new HashSet<>();
tagSet.add("Java");
tagSet.add("Spring");
tagSet.add("Java"); // 重复元素不会添加
System.out.println(tagSet.size()); // 2
```
:::

### 3. Stream API

::: details 示例：Stream流式操作
```java
record Employee(String name, String department, double salary) {}

List<Employee> employees = List.of(
    new Employee("张三", "研发部", 15000),
    new Employee("李四", "市场部", 12000),
    new Employee("王五", "研发部", 18000),
    new Employee("赵六", "市场部", 13000),
    new Employee("陈七", "研发部", 20000)
);

// 筛选研发部员工并按薪资降序排列
List<String> devNames = employees.stream()
    .filter(e -> "研发部".equals(e.department()))
    .sorted(Comparator.comparingDouble(Employee::salary).reversed())
    .map(Employee::name)
    .toList(); // [陈七, 王五, 张三]

// 按部门分组并计算平均薪资
Map<String, Double> avgSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::department,
        Collectors.averagingDouble(Employee::salary)
    ));

// 总薪资
double totalSalary = employees.stream()
    .mapToDouble(Employee::salary)
    .sum(); // 78000.0
```
:::

## 六、异常处理

### 1. 异常体系

```
Throwable
├── Error（系统级错误，不可恢复）
│   ├── OutOfMemoryError
│   ├── StackOverflowError
│   └── ...
└── Exception
    ├── RuntimeException（非检查异常）
    │   ├── NullPointerException
    │   ├── IndexOutOfBoundsException
    │   ├── IllegalArgumentException
    │   └── ...
    └── 检查异常（必须处理）
        ├── IOException
        ├── SQLException
        └── ...
```

### 2. 异常处理机制

::: details 示例：try-catch-finally与自定义异常
```java
// 自定义业务异常
public class OrderException extends RuntimeException {
    private final String errorCode;

    public OrderException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}

// 使用try-catch处理异常
public Order createOrder(String productId, int quantity) {
    try {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new OrderException("PRODUCT_NOT_FOUND", "商品不存在: " + productId));

        if (product.getStock() < quantity) {
            throw new OrderException("INSUFFICIENT_STOCK", "库存不足");
        }

        return orderRepository.save(new Order(product, quantity));
    } catch (OrderException e) {
        logger.error("创建订单失败 [{}]: {}", e.getErrorCode(), e.getMessage());
        throw e;
    } catch (Exception e) {
        logger.error("创建订单时发生未知错误", e);
        throw new OrderException("SYSTEM_ERROR", "系统异常，请稍后重试");
    }
}
```
:::

::: tip try-with-resources
实现了 `AutoCloseable` 接口的资源可使用 try-with-resources 自动关闭，避免资源泄漏。
```java
try (var reader = new BufferedReader(new FileReader("config.properties"))) {
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
} // reader在此自动关闭，无论是否抛出异常
```
:::

## 七、I/O与NIO

### 1. 传统I/O

Java传统I/O基于流（Stream）模型，分为 **字节流** 和 **字符流**。

::: details 示例：文件读写
```java
// 写入文件
try (var writer = new BufferedWriter(new FileWriter("output/report.txt"))) {
    writer.write("销售报告 - 2024年度");
    writer.newLine();
    writer.write("总销售额: ¥1,250,000");
}

// 读取文件
try (var reader = new BufferedReader(new FileReader("output/report.txt"))) {
    reader.lines().forEach(System.out::println);
}
```
:::

### 2. NIO（New I/O）

NIO提供了 **Channel**、**Buffer**、**Selector** 三大核心组件，支持非阻塞I/O操作。

::: details 示例：NIO文件操作
```java
Path configPath = Path.of("config", "application.yml");

// 读取文件全部内容
String content = Files.readString(configPath);

// 写入文件
Path outputPath = Path.of("output", "result.txt");
Files.createDirectories(outputPath.getParent());
Files.writeString(outputPath, "处理完成", StandardOpenOption.CREATE);

// 遍历目录
try (var stream = Files.walk(Path.of("src"))) {
    List<Path> javaFiles = stream
        .filter(p -> p.toString().endsWith(".java"))
        .toList();
    javaFiles.forEach(System.out::println);
}

// 监听文件变化
WatchService watchService = FileSystems.getDefault().newWatchService();
Path watchDir = Path.of("config");
watchDir.register(watchService, StandardWatchEventKinds.ENTRY_MODIFY);
```
:::

::: warning 编码问题
读写文件时应显式指定字符编码，避免平台差异导致乱码。
```java
// 指定UTF-8编码
Files.readString(path, StandardCharsets.UTF_8);
Files.writeString(path, content, StandardCharsets.UTF_8);
```
:::

## 八、多线程与并发

### 1. 创建线程

::: details 示例：线程创建方式
```java
// 方式一：实现Runnable接口（推荐）
Runnable downloadTask = () -> {
    System.out.println("下载任务执行中 - " + Thread.currentThread().getName());
};
Thread downloadThread = new Thread(downloadTask, "downloader");
downloadThread.start();

// 方式二：使用Callable + Future（有返回值）
Callable<String> fetchTask = () -> {
    Thread.sleep(1000);
    return "数据获取完成";
};
ExecutorService executor = Executors.newFixedThreadPool(4);
Future<String> future = executor.submit(fetchTask);
String result = future.get(); // 阻塞等待结果

// 方式三：CompletableFuture（Java 8+，推荐）
CompletableFuture.supplyAsync(() -> queryUserFromDB(userId))
    .thenApply(user -> enrichUserProfile(user))
    .thenAccept(profile -> sendWelcomeEmail(profile))
    .exceptionally(ex -> {
        logger.error("处理用户信息失败", ex);
        return null;
    });
```
:::

### 2. 线程同步

::: details 示例：synchronized与Lock
```java
// synchronized方法
public class TicketCounter {
    private int remainingTickets = 100;

    public synchronized boolean sellTicket(String buyerName) {
        if (remainingTickets > 0) {
            remainingTickets--;
            System.out.println(buyerName + "购票成功，剩余: " + remainingTickets);
            return true;
        }
        return false;
    }
}

// ReentrantLock（更灵活）
public class AccountService {
    private final ReentrantLock lock = new ReentrantLock();
    private BigDecimal balance;

    public boolean transfer(BigDecimal amount) {
        if (lock.tryLock()) {
            try {
                if (balance.compareTo(amount) >= 0) {
                    balance = balance.subtract(amount);
                    return true;
                }
                return false;
            } finally {
                lock.unlock();
            }
        }
        return false;
    }
}
```
:::

### 3. 并发工具类

| 类 | 用途 |
|------|------|
| `ConcurrentHashMap` | 线程安全的HashMap |
| `CopyOnWriteArrayList` | 读多写少场景的线程安全List |
| `CountDownLatch` | 等待多个线程完成 |
| `CyclicBarrier` | 多个线程互相等待到达屏障点 |
| `Semaphore` | 控制并发访问数量 |
| `BlockingQueue` | 生产者-消费者模型 |

### 4. 虚拟线程

::: tip Java 21+ 虚拟线程
虚拟线程（Virtual Thread）是轻量级线程，由JVM调度而非操作系统，适合高并发I/O密集型场景。
```java
// 创建虚拟线程
Thread.startVirtualThread(() -> {
    System.out.println("虚拟线程运行中");
});

// 使用虚拟线程执行器处理大量并发任务
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<String>> futures = new ArrayList<>();
    for (int i = 0; i < 10000; i++) {
        int requestId = i;
        futures.add(executor.submit(() -> handleRequest(requestId)));
    }
}
```
:::

## 九、JVM内存模型

### 1. 运行时数据区

```
JVM运行时数据区
├── 线程私有
│   ├── 程序计数器（PC Register）    — 当前线程执行的字节码行号
│   ├── 虚拟机栈（VM Stack）         — 方法调用的栈帧（局部变量、操作数栈）
│   └── 本地方法栈（Native Stack）   — native方法调用
└── 线程共享
    ├── 堆（Heap）                   — 对象实例分配，GC主要区域
    │   ├── 新生代（Young Generation）
    │   │   ├── Eden区
    │   │   ├── Survivor 0
    │   │   └── Survivor 1
    │   └── 老年代（Old Generation）
    └── 方法区 / 元空间（Metaspace）  — 类信息、常量池、静态变量
```

### 2. 垃圾回收

| GC算法 | 特点 | 适用场景 |
|--------|------|----------|
| Serial GC | 单线程，Stop-The-World | 小型应用 |
| Parallel GC | 多线程并行回收 | 吞吐量优先 |
| G1 GC | 分区收集，可预测停顿 | 大堆内存（默认，Java 9+） |
| ZGC | 超低延迟（<1ms停顿） | 延迟敏感应用（Java 15+） |

### 3. 常用JVM参数

::: details 示例：JVM启动参数配置
```bash
java \
  -Xms512m \             # 初始堆大小
  -Xmx2g \               # 最大堆大小
  -Xss256k \             # 线程栈大小
  -XX:MetaspaceSize=128m \     # 元空间初始大小
  -XX:MaxMetaspaceSize=256m \  # 元空间最大大小
  -XX:+UseG1GC \               # 使用G1垃圾收集器
  -XX:MaxGCPauseMillis=200 \   # GC最大停顿时间目标
  -XX:+HeapDumpOnOutOfMemoryError \  # OOM时生成堆转储
  -XX:HeapDumpPath=/var/logs/heap-dump.hprof \
  -jar application.jar
```
:::

::: danger 内存溢出排查
遇到 `OutOfMemoryError` 时的排查步骤：
1. 通过 `-XX:+HeapDumpOnOutOfMemoryError` 获取堆转储文件
2. 使用MAT（Memory Analyzer Tool）或VisualVM分析堆转储
3. 查找占用内存最大的对象及其引用链
4. 检查是否存在内存泄漏（如未关闭的连接、静态集合持续增长）
:::
