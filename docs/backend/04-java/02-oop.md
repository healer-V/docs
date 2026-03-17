---
title: "Java 面向对象编程"
category: "后端 · Java"
tags:
  - Java
  - OOP
  - 继承
  - 多态
date: 2026-03-17
---

# Java 面向对象编程

面向对象编程（OOP）是 Java 的核心思想，通过封装、继承、多态三大特性，将现实世界的实体抽象为程序中的对象，实现代码的复用与扩展。

## 一、类与对象

### 1. 类的定义

类是对象的模板，描述一类事物的属性和行为。对象是类的实例，是具体存在的实体。

```java
// 定义一个 User 类
public class User {
    // 实例字段（属性）
    private String name;
    private int age;

    // 构造方法
    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // 实例方法（行为）
    public void introduce() {
        System.out.println("我是 " + name + "，今年 " + age + " 岁。");
    }
}
```

### 2. 对象的创建与使用

通过 `new` 关键字调用构造方法创建对象，并通过引用访问其成员。

::: details 对象创建示例

```java
public class Main {
    public static void main(String[] args) {
        // 创建对象
        User user1 = new User("Alice", 25);
        User user2 = new User("Bob", 30);

        // 调用方法
        user1.introduce(); // 输出：我是 Alice，今年 25 岁。
        user2.introduce(); // 输出：我是 Bob，今年 30 岁。
    }
}
```

:::

### 3. 构造方法重载

同一个类可以定义多个构造方法，参数列表不同即构成重载。

::: details 构造方法重载示例

```java
public class Product {
    private String name;
    private double price;
    private int stock;

    // 无参构造
    public Product() {
        this("未命名", 0.0, 0);
    }

    // 两参构造
    public Product(String name, double price) {
        this(name, price, 0);
    }

    // 全参构造
    public Product(String name, double price, int stock) {
        this.name  = name;
        this.price = price;
        this.stock = stock;
    }
}
```

:::

## 二、封装

### 1. 访问修饰符

封装的核心是隐藏内部实现细节，对外暴露必要的接口。Java 提供四种访问级别：

| 修饰符 | 同类 | 同包 | 子类 | 其他包 |
|--------|------|------|------|--------|
| `private` | ✓ | ✗ | ✗ | ✗ |
| （无修饰）| ✓ | ✓ | ✗ | ✗ |
| `protected` | ✓ | ✓ | ✓ | ✗ |
| `public` | ✓ | ✓ | ✓ | ✓ |

### 2. Getter 与 Setter

将字段声明为 `private`，通过公开的 getter/setter 方法控制读写逻辑。

::: details Getter/Setter 示例

```java
public class BankAccount {
    private double balance;

    public double getBalance() {
        return balance;
    }

    // setter 中加入合法性校验
    public void setBalance(double balance) {
        if (balance < 0) {
            throw new IllegalArgumentException("余额不能为负数");
        }
        this.balance = balance;
    }

    public void deposit(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("存款金额必须大于 0");
        }
        this.balance += amount;
    }
}
```

:::

::: tip
实际开发中常借助 Lombok 的 `@Data`、`@Getter`、`@Setter` 注解自动生成这些方法，减少样板代码。
:::

## 三、继承

### 1. extends 关键字

子类通过 `extends` 继承父类的非私有字段和方法，实现代码复用。Java 只支持单继承。

::: details 继承示例

```java
// 父类
public class Animal {
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public void eat() {
        System.out.println(name + " 正在吃东西");
    }
}

// 子类
public class Dog extends Animal {
    private String breed;

    public Dog(String name, String breed) {
        super(name); // 调用父类构造方法
        this.breed = breed;
    }

    public void bark() {
        System.out.println(name + " 汪汪叫！");
    }
}
```

:::

### 2. super 关键字

`super` 用于在子类中访问父类的构造方法、字段和方法。

- `super()` —— 调用父类构造方法，必须是子类构造方法的第一行
- `super.方法名()` —— 调用父类被覆盖的方法
- `super.字段名` —— 访问父类字段（不推荐，建议通过 getter）

### 3. 方法重写（Override）

子类可以重写父类的方法，提供不同的实现。重写时方法签名必须一致，且访问权限不能缩小。

::: details 方法重写示例

```java
public class Cat extends Animal {
    public Cat(String name) {
        super(name);
    }

    // 重写父类 eat 方法
    @Override
    public void eat() {
        System.out.println(name + " 优雅地进食");
    }
}
```

:::

::: warning
始终在重写方法上添加 `@Override` 注解，这样编译器会在方法签名不匹配时报错，避免意外创建新方法而非重写。
:::

## 四、多态

### 1. 向上转型（Upcasting）

子类对象赋值给父类引用，自动发生，无需强制转换。调用方法时执行的是子类的重写版本（运行时多态）。

::: details 多态调用示例

```java
public class Main {
    public static void main(String[] args) {
        // 向上转型
        Animal animal1 = new Dog("旺财", "柴犬");
        Animal animal2 = new Cat("咪咪");

        // 运行时调用各自重写的 eat 方法
        animal1.eat(); // 输出：旺财 正在吃东西（Dog 未重写 eat）
        animal2.eat(); // 输出：咪咪 优雅地进食（Cat 重写了 eat）
    }

    // 多态的核心价值：统一处理不同类型的对象
    public static void feedAnimal(Animal animal) {
        animal.eat();
    }
}
```

:::

### 2. 向下转型（Downcasting）

父类引用转换为子类类型，需要显式强制转换，转换前应使用 `instanceof` 检查。

::: details 向下转型示例

```java
Animal animal = new Dog("旺财", "柴犬");

// 安全的向下转型
if (animal instanceof Dog dog) { // Java 16+ 模式匹配
    dog.bark(); // 输出：旺财 汪汪叫！
}

// Java 16 以前的写法
if (animal instanceof Dog) {
    Dog dog = (Dog) animal;
    dog.bark();
}
```

:::

::: danger
不使用 `instanceof` 检查直接强制转换，如果类型不匹配会抛出 `ClassCastException`，务必先验证类型。
:::

## 五、抽象类与接口

### 1. 抽象类

抽象类用 `abstract` 修饰，可以包含抽象方法（无方法体）和具体方法。抽象类不能被实例化，必须由子类实现所有抽象方法。

::: details 抽象类示例

```java
// 抽象类：定义模板方法
public abstract class Shape {
    private String color;

    public Shape(String color) {
        this.color = color;
    }

    // 抽象方法：子类必须实现
    public abstract double area();
    public abstract double perimeter();

    // 具体方法：子类共享
    public void describe() {
        System.out.printf("颜色：%s，面积：%.2f，周长：%.2f%n",
            color, area(), perimeter());
    }
}

public class Circle extends Shape {
    private double radius;

    public Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }

    @Override
    public double perimeter() {
        return 2 * Math.PI * radius;
    }
}
```

:::

### 2. 接口

接口定义行为契约，类通过 `implements` 实现接口。一个类可以实现多个接口，解决 Java 单继承的限制。

::: details 接口示例

```java
// 定义接口
public interface Flyable {
    int MAX_ALTITUDE = 10000; // 隐式 public static final

    void fly();               // 隐式 public abstract

    // Java 8+ 默认方法
    default void land() {
        System.out.println("正在降落...");
    }

    // Java 8+ 静态方法
    static String getDescription() {
        return "可飞行的对象";
    }
}

public interface Swimmable {
    void swim();
}

// 实现多个接口
public class Duck extends Animal implements Flyable, Swimmable {
    public Duck(String name) {
        super(name);
    }

    @Override
    public void fly() {
        System.out.println(name + " 展翅飞翔");
    }

    @Override
    public void swim() {
        System.out.println(name + " 在水中游泳");
    }
}
```

:::

### 3. 抽象类 vs 接口

| 对比项 | 抽象类 | 接口 |
|--------|--------|------|
| 继承/实现 | 单继承（`extends`） | 多实现（`implements`） |
| 字段 | 可有实例字段 | 只有常量（`public static final`） |
| 构造方法 | 有 | 无 |
| 方法 | 抽象 + 具体 | 抽象 + default + static |
| 适用场景 | is-a 关系，共享状态 | can-do 关系，能力契约 |

## 六、final 关键字

`final` 可以修饰类、方法和变量，表示"不可变"或"不可扩展"：

| 修饰目标 | 含义 |
|----------|------|
| `final` 类 | 不能被继承（如 `String`、`Integer`） |
| `final` 方法 | 不能被子类重写 |
| `final` 变量 | 只能赋值一次（基本类型值不变，引用类型引用不变） |

::: details final 变量示例

```java
public class Config {
    // 编译期常量：static final + 字面量
    public static final int MAX_RETRY = 3;

    // 实例常量：必须在构造方法或声明处初始化
    private final String appName;

    public Config(String appName) {
        this.appName = appName;
        // this.appName = "other"; // 编译错误：不能二次赋值
    }
}
```

:::

## 七、Object 类常用方法

所有 Java 类默认继承自 `Object`，以下方法在实际开发中频繁使用。

### 1. equals 与 hashCode

默认的 `equals` 比较引用地址，通常需要重写为按内容比较。重写 `equals` 时必须同步重写 `hashCode`，以保证集合类（`HashMap`、`HashSet`）的正确行为。

::: details equals/hashCode 重写示例

```java
import java.util.Objects;

public class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;             // 同一引用
        if (!(o instanceof Point other)) return false; // 类型检查
        return x == other.x && y == other.y;    // 按内容比较
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y); // 与 equals 保持一致
    }
}
```

:::

::: warning
**equals 与 hashCode 契约**：若两个对象 `equals` 返回 `true`，则它们的 `hashCode` 必须相等。违反此契约会导致对象在 `HashMap`、`HashSet` 中行为异常。
:::

### 2. toString

`toString` 返回对象的字符串表示，默认为类名加十六进制哈希码，通常需要重写为可读内容。

::: details toString 重写示例

```java
public class Order {
    private long id;
    private String product;
    private double amount;

    // 构造方法省略...

    @Override
    public String toString() {
        return String.format("Order{id=%d, product='%s', amount=%.2f}",
            id, product, amount);
    }
}

// 使用
Order order = new Order(1001L, "MacBook Pro", 12999.0);
System.out.println(order); // 输出：Order{id=1001, product='MacBook Pro', amount=12999.00}
```

:::

### 3. clone 与 getClass

- `getClass()` —— 返回对象的运行时类，常用于反射和类型判断
- `clone()` —— 浅拷贝对象，需实现 `Cloneable` 接口；深拷贝通常选择序列化或手动复制

::: tip
在 IDE 中（如 IntelliJ IDEA），可以使用快捷键自动生成 `equals`、`hashCode`、`toString` 方法，或直接引入 Lombok 的 `@EqualsAndHashCode`、`@ToString` 注解。
:::
