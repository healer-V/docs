---
title: "Lambda 表达式"
tags:
  - Java
  - Lambda
excerpt: "通过订单规则解释 Lambda 的目标类型、参数与返回值适配、调用时机和 this 作用域，比较匿名类语义，并用正常执行、受检异常和独立编译错误说明行为边界。"
date: 2026-09-08
---

# Lambda 表达式

Lambda 表达式把一段行为适配为函数式接口的实例。订单筛选规则可以作为参数保存和传递，真正调用规则方法时才判断当前订单。参数类型、返回类型和可传播异常来自目标接口，箭头语法本身不是一个脱离上下文的函数类型。

## 一、目标接口决定行为的类型

`OrderRule rule = order -> order.quantity() >= 2` 中，OrderRule 的抽象方法如果声明为 `boolean accept(Order order)`，编译器就能确定 order 是 Order、结果必须适配 boolean。调用方通过 rule.accept(order) 执行行为，不能用 JavaScript 风格的 rule(order) 调用接口变量。

Java 21 的函数式接口必须不是 sealed，并能归并为一个逻辑抽象方法。default、static 方法不增加抽象职责；与 Object 的 public 实例方法同签名的声明按专门规则排除。继承得到的多个等价声明可以表示同一职责，所以不能简单数接口源码里有几个方法。`@FunctionalInterface` 让编译器检查这项契约，省略注解也不会自动使合格接口失去函数式属性。[函数式接口规则](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.8)

| 上下文 | 目标类型来自哪里 | 应如何判断 |
|---|---|---|
| 赋值给 OrderRule 变量 | 左侧声明 | 参数和结果与 accept 对齐 |
| 作为方法实参 | 被选择重载的参数类型 | 多个函数式重载都可接受时需消除歧义 |
| 从方法返回 | 方法的返回类型 | 返回的是行为对象，尚未执行其职责 |
| 用 var 直接声明 Lambda | 没有可推断的独立函数类型 | 改为明确接口声明 |
| 直接赋给 Object | Object 不提供函数契约 | 先适配具体函数式接口，再按需要作为 Object 使用 |

::: tip 一个明确行为适合使用 Lambda

当接口确实需要配置、多个相互协作的方法或独立状态时，普通实现类仍有价值。Lambda 适合表达一个明确行为，不应通过外部共享变量拼出隐含的多方法对象。

:::

## 二、参数列表和函数体必须匹配签名

### 1. 参数声明保持一致的类型形式

单个隐式类型参数可以省略括号；零参数必须写空括号，多个参数必须放在括号内。参数类型可以全部省略，或采用一致的显式声明方式；Java 21 也支持在 Lambda 参数声明中使用 var，但不能把 var、显式类型和未声明类型的参数混搭。[Lambda 参数规则](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27.1)

类型推断减少的是重复声明，不会改变目标接口的参数数量与类型。给参数加上显式类型也不能把接收 Order 的接口改成接收任意对象；先核对目标签名，再选择省略类型或显式声明。

### 2. 返回路径与 void 目标分别检查

表达式体把表达式结果交给目标返回类型；代码块需要按照正常控制流给出返回值。返回值类型为 boolean 的规则，不能存在一个正常结束却未返回 boolean 的分支。始终抛出异常的分支没有正常结果，因此与“忘记返回”不是同一种情形。

::: tip 区分输入非法与规则不匹配

示例中的 eligible 使用表达式体；checkedQuantity 使用代码块，先拒绝非正数量，再返回筛选结果。这样的写法把输入校验与业务判断区分开：非法数量产生异常，合法但不符合规则的订单返回 false。不要把所有失败都压成一个布尔值。

:::

void 目标也有表达式适配规则：方法调用等语句表达式可以作为函数体，调用结果可被忽略；普通算术表达式不能仅靠“结果不用”就适配 void。需要产生副作用时，应让接口和命名明确表达用途，而不是凭箭头外形推断是否有返回结果。

## 三、创建行为与执行行为是两个时点

对 Lambda 表达式求值得到行为引用，不等于执行其函数体。把查询 Lambda 赋给 lookup 时，不会立即查询订单；lookup.find() 才执行查询逻辑，并在该调用位置返回编号或传播异常。

异常能力也由接口决定。示例 CheckedLookup.find 声明 throws IOException，调用方需要处理或继续声明；标准 Supplier.get 没有这个受检异常声明，不能原样接收会传播 IOException 的函数体。合法处理应是选择准确的接口契约、在边界转换异常，或在函数体内完成可解释的恢复；不能通过空 catch 假装查询成功。

::: warning Lambda 对象身份不能成为业务规则

Lambda 是否每次求值都分配新实例属于实现可选择的范围。不要用两个 Lambda 引用的 `==`、实现类名或对象身份建立业务规则；需要稳定标识时，将标识显式放在领域模型中。[运行时求值边界](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27.4)

:::

## 四、this 保留词法外层的含义

Lambda 不引入匿名类那样的新 this。实例方法中的 Lambda 使用 this.scope，会读取外层实例字段；匿名类的方法使用 this.scope，则读取匿名对象自己的字段。替换匿名类时，除了接口方法签名，还要检查字段、super、this 和方法名解析是否因此改变。[函数体与 this 规则](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27.2)

示例的外层 scope 为 ORDER-SCOPE，匿名对象自己的 scope 为 ANONYMOUS，两种行为返回不同文本。这个差异来自名称绑定，没有创建线程，也不依赖调用顺序竞争。在 static 上下文中没有外层实例 this，不能因为加上一层 Lambda 就使用它。

::: info this 的含义与状态捕获分别判断

局部变量和实例字段的后续变化属于[Lambda 变量捕获](./03-variable-capture.md)的职责。这里先区分“this 指向谁”，不把它等同于“状态被冻结”或“线程安全”。

:::

## 五、订单规则与作用域的完整验证

以下文件可在 JDK 21 独立编译运行。本次使用 Corretto 21.0.11；无 Maven、外部服务或文件输入。Order 只保留当前规则需要的编号、状态和数量字段，所有值均为演示数据。

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看LambdaBasicsDemo的完整代码

```java
// LambdaBasicsDemo.java
import java.io.IOException;
import java.util.List;
import java.util.function.Supplier;

/** 验证 Lambda 的目标类型、调用时机与 this 作用域，所有输入均为本地演示数据。 */
public final class LambdaBasicsDemo {
    private final String scope = "ORDER-SCOPE";

    /** 创建作用域演示对象；无额外副作用。 */
    private LambdaBasicsDemo() {}

    /**
     * 执行正常适配或故意失败的规则；无返回值，输出结果或传播异常。
     * @param args 空参数正常运行；negative 检查非法数量；checked 模拟查询异常
     * @throws IOException checked 模式故意模拟查询失败
     */
    public static void main(String[] args) throws IOException {
        // 规则输入是当前订单，返回是否已支付且数量达到本例要求2。
        OrderRule eligible = order -> "PAID".equals(order.status()) && order.quantity() >= 2;
        // 显式参数类型与返回语句提供同一规则；数量不合法时拒绝输入。
        OrderRule checkedQuantity = (Order order) -> {
            if (order.quantity() <= 0) {
                throw new IllegalArgumentException("quantity must be positive");
            }
            return eligible.accept(order);
        };
        // 创建行为时不执行查询；find 的签名允许传播受检异常。
        CheckedLookup lookup = () -> {
            if (args.length > 0 && "checked".equals(args[0])) {
                throw new IOException("simulated lookup failure");
            }
            return "ORD-1001";
        };
        if (args.length > 0) {
            switch (args[0]) {
                case "negative" -> checkedQuantity.accept(new Order("ORD-1001", "PAID", 0));
                case "checked" -> lookup.find();
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        Order order = new Order("ORD-1001", "PAID", 2);
        assert eligible.accept(order) && checkedQuantity.accept(order);
        assert !eligible.accept(new Order("ORD-1002", "CREATED", 1));
        List<String> scopes = new LambdaBasicsDemo().readScopes();
        assert scopes.equals(List.of("ORDER-SCOPE", "ANONYMOUS"));
        System.out.println("eligible=" + eligible.accept(order));
        System.out.println("scopes=" + scopes);
        System.out.println("lookup=" + lookup.find());
    }

    /**
     * 比较 Lambda 与匿名类中的 this 绑定；不改变对象状态。
     * @return 依次为外层对象标识、匿名对象自己的标识
     */
    private List<String> readScopes() {
        // 零参数行为读取词法外层对象；返回外层scope，不引入新的this。
        Supplier<String> lambdaScope = () -> this.scope;
        Supplier<String> anonymousScope = new Supplier<>() {
            private final String scope = "ANONYMOUS";

            /** 返回匿名对象自己的scope；不读取外层对象状态。 */
            @Override
            public String get() {
                return this.scope;
            }
        };
        return List.of(lambdaScope.get(), anonymousScope.get());
    }

    /** 只声明一个逻辑抽象操作，适配接收订单并返回布尔值的行为。 */
    @FunctionalInterface
    interface OrderRule {
        /**
         * 判断订单是否满足当前规则。
         * @param order 非null演示订单，具体数量限制由规则实现决定
         * @return 满足规则时为true，否则为false
         */
        boolean accept(Order order);
    }

    /** 用签名显式允许查询失败；接口本身不创建线程或执行调度。 */
    @FunctionalInterface
    interface CheckedLookup {
        /**
         * 查询演示编号。
         * @return 非null订单编号
         * @throws IOException 演示查询失败，调用方必须处理或声明
         */
        String find() throws IOException;
    }

    /**
     * 保存规则验证所需的订单字段，构造器不代替规则校验。
     * @param number 非null演示订单编号
     * @param status 非null演示状态
     * @param quantity 演示数量，故障输入故意取0
     */
    record Order(String number, String status, int quantity) {}
}
```

:::

在本篇示例目录的 PowerShell 执行，断言验证合法与不符合规则的订单：

```powershell
New-Item -ItemType Directory -Force -Path out | Out-Null
javac -encoding UTF-8 -Xlint:all -Werror -d out LambdaBasicsDemo.java
if ($LASTEXITCODE -ne 0) { throw '编译失败' }
java -ea -cp out LambdaBasicsDemo
if ($LASTEXITCODE -ne 0) { throw '运行失败' }
```

实际输出如下，两个 scope 值证明 Lambda 与匿名类的名称绑定不同：

```text
eligible=true
scopes=[ORDER-SCOPE, ANONYMOUS]
lookup=ORD-1001
```

## 六、区分编译拒绝和运行时失败

下面三份独立错误文件用于核对不同的编译约束，不加入正常示例目录。分别保存到代码首行位置后编译，每份都应被拒绝。

```java
// InvalidLambdaTarget.java
/** 故意缺少目标类型，供独立编译失败验证。 */
class InvalidLambdaTarget {
    /** 声明非法局部变量；本文件不能编译，无运行副作用。 */
    static void inspect() {
        // 缺少函数式接口目标，无法推断参数与返回类型。
        var rule = quantity -> quantity > 0;
    }
}
```

返回值不匹配的文件明确让 IntPredicate 返回字符串：

```java
// InvalidLambdaReturn.java
import java.util.function.IntPredicate;

/** 故意让布尔规则返回字符串，验证返回类型检查。 */
class InvalidLambdaReturn {
    // IntPredicate必须返回boolean，字符串结果不兼容。
    IntPredicate rule = quantity -> "PAID";
}
```

受检异常文件保留了不被 Supplier 签名允许的传播：

```java
// InvalidLambdaChecked.java
import java.io.IOException;
import java.util.function.Supplier;

/** 故意在不声明受检异常的目标接口中传播IOException。 */
class InvalidLambdaChecked {
    // Supplier.get没有throws IOException，不能直接适配该行为。
    Supplier<String> lookup = () -> { throw new IOException("simulated failure"); };
}
```

逐个检查编译退出码，不能让后一个成功命令掩盖前面的错误：

```powershell
foreach ($errorName in @('InvalidLambdaTarget', 'InvalidLambdaReturn', 'InvalidLambdaChecked')) {
    javac '-J-Duser.language=en' -encoding UTF-8 -d out "$errorName.java"
    if ($LASTEXITCODE -ne 1) { throw "$errorName 未按预期编译失败" }
}
```

| 文件 | 本机编译诊断的关键内容 | 修复方向 |
|---|---|---|
| InvalidLambdaTarget | lambda expression needs an explicit target-type | 将 var 改为准确的函数式接口类型 |
| InvalidLambdaReturn | String cannot be converted to boolean | 返回布尔规则结果，或修订真实业务签名 |
| InvalidLambdaChecked | unreported exception IOException | 处理异常，或选择声明该异常的接口 |

正常源码的两个错误入口则已经通过编译，用来证明调用阶段的失败传播：

```powershell
java -cp out LambdaBasicsDemo negative
if ($LASTEXITCODE -ne 1) { throw '非法数量未按预期失败' }
java -cp out LambdaBasicsDemo checked
if ($LASTEXITCODE -ne 1) { throw '查询异常未按预期失败' }
```

第一种实际抛出 IllegalArgumentException，信息为 quantity must be positive；第二种抛出 IOException，信息为 simulated lookup failure。前者应修正数量输入，后者按调用边界处理查询故障。无参数重新运行即可恢复正常演示；示例只证明类型适配和调用语义，不提供数据源重试或业务事务。
