---
title: "正则表达式与文本处理"
tags:
  - Java 21
  - Pattern
  - Matcher
excerpt: "解释 Java 正则的双重转义、Pattern 与 Matcher、完整匹配、查找、分组和替换，并说明回溯风险与复杂语法解析边界。"
date: 2026-09-03
---

# 正则表达式与文本处理

Java 正则由 `Pattern` 表示已编译规则，由 `Matcher` 保存一次输入上的匹配状态。它适合格式固定的文本识别、提取和替换，不适合解析任意嵌套 JSON、HTML 或编程语言。

## 一、先判断正则是否适合问题

适合正则的任务通常具有局部、有限且稳定的文本结构：

- 检查订单号是否符合固定字符格式；
- 从日志行提取日期、序号或追踪标识；
- 查找多个同类片段；
- 替换或脱敏明确格式的电话号码。

以下问题应优先使用专用解析器：

| 数据 | 更合适工具 | 原因 |
|------|------------|------|
| JSON | Jackson 等 JSON 解析器 | 支持转义、嵌套、类型和错误位置 |
| XML | 安全配置的 XML 解析器 | 命名空间、实体和层级结构复杂 |
| HTML | HTML 解析器 | 标签容错和嵌套不能靠简单表达式可靠处理 |
| URL | `URI` / `URL` | 编码、路径、查询和协议规则完整 |
| 日期时间 | `java.time` 解析器 | 能验证真实日历和时区规则 |

正则匹配成功只证明字符形状符合表达式，不代表订单真实存在、日期有效或当前用户有权限。

## 二、Java 字符串存在双重转义

正则引擎用反斜杠表达 `\d` 等元字符，而 Java 字符串也用反斜杠转义。因此传给正则引擎的 `\d` 在 Java 源码中要写成 `"\\d"`。

| 目标字符或规则 | 正则文本 | Java 字符串 |
|----------------|----------|-------------|
| 数字字符类 | `\d` | `"\\d"` |
| 字面句点 | `\.` | `"\\."` |
| 一个反斜杠 | `\\` | `"\\\\"` |
| 8 位数字 | `\d{8}` | `"\\d{8}"` |

```java
Pattern orderNumber = Pattern.compile(
        "ORD-(?<date>\\d{8})-(?<sequence>\\d{4})"
);
```

::: info 文本块仍然遵守字符串转义规则

文本块可以减少引号和换行转义，但反斜杠仍服从 Java 字符串规则，不会自动变成正则字面量。

:::

## 三、匹配规则、输入与结果状态

一次匹配先由 `Pattern` 定义规则，再由 `Matcher` 绑定输入并执行匹配，最后读取本次成功匹配的分组。规则可以共享，输入位置和匹配结果则属于具体操作，不能跨调用混用。

### 1. 正则规则与匹配状态 {#三、pattern-负责规则-matcher-负责状态}

`Pattern.compile` 解析表达式并可能抛出 `PatternSyntaxException`。规则固定时应编译一次并复用：

```java
private static final Pattern ORDER_NUMBER = Pattern.compile(
        "ORD-(?<date>\\d{8})-(?<sequence>\\d{4})"
);
```

`Pattern` 不可变且线程安全；`Matcher` 绑定具体输入并维护当前位置、分组和上一次匹配结果，不应跨线程共享：

```java
Matcher matcher = ORDER_NUMBER.matcher("ORD-20260903-0042");
```

::: tip 高频规则编译一次并复用

`String.matches(regex)` 每次都会编译并要求整个字符串匹配，适合一次性简单检查；高频或共享规则使用预编译 `Pattern` 更清晰。

:::

### 2. 匹配范围与查找方式 {#四、matches、find-与-lookingat-不同}

| 方法 | 检查范围 | 典型用途 |
|------|----------|----------|
| `matches()` | 整个输入必须匹配 | 校验完整订单号 |
| `find()` | 从当前位置查找下一个子串 | 从日志中连续提取多个订单号 |
| `lookingAt()` | 必须从输入开头匹配，但可剩余字符 | 检查固定前缀结构 |

```java
Matcher finder = ORDER_NUMBER.matcher(logLine);
while (finder.find()) {
    System.out.println(finder.group());
}
```

`find()` 会推进 Matcher 的内部位置；再次从头查找可创建新 Matcher 或调用 `reset()`。调用 `group()` 前必须有一次成功的 `matches/find/lookingAt`，否则抛出 `IllegalStateException`。

### 3. 分组提取结构化片段 {#五、分组提取结构化片段}

括号建立捕获组，编号从 1 开始，0 表示完整匹配。命名组比位置编号更能表达字段职责：

```java
if (matcher.matches()) {
    String date = matcher.group("date");
    String sequence = matcher.group("sequence");
}
```

不需要捕获的结构组使用 `(?:...)`，减少无意义编号。反向引用 `\1` 或 `\k<name>` 用于要求后续内容重复前组，但会增加阅读和回溯复杂度，应配测试说明。

::: warning 可选捕获组不一定具有文本

可选组未参与匹配时 `group` 可能返回 `null`；解析代码不能假设所有声明组都有文本。

:::

## 四、替换、拆分与字面量输入 {#六、替换、拆分与字面量输入}

### 1. 区分模式文本和替换模板

`replaceAll` 的第一个参数是正则，替换字符串中的 `$1`、`${name}` 和反斜杠也有特殊含义：

```java
String masked = PHONE.matcher("phone=13800138000")
        .replaceAll("***********");
```

若替换内容来自用户输入，使用 `Matcher.quoteReplacement(value)` 防止 `$` 和反斜杠被解释。若模式本身是用户提供的字面文本，使用 `Pattern.quote(value)`：

```java
Pattern literal = Pattern.compile(Pattern.quote("a+b"));
```

两种引用方法保护的是不同解释位置。模式侧的 `a+b` 会把加号视为量词，替换侧的 `$1` 会引用捕获组；应根据输入将被哪个解析器消费来选择，不能用同一种转义覆盖两侧。

### 2. 拆分时保留有意义的空字段

`String.split(regex)` 同样把参数当正则，句点必须写成 `"\\."`。默认会丢弃末尾空字段，需要保留时使用 `split(regex, -1)`。

例如固定列数的订单文本末尾为空，可能表示“已提供该列但值缺失”。丢弃末尾空字段后，结果数组变短，就无法与少提供一列区分；因此应先约定空字段语义，再检查拆分后的列数。包含引号和转义分隔符的 CSV 则应交给 CSV 解析器，不能仅靠 `split` 承担协议解析。

## 五、边界、标志与 Unicode {#七、边界、标志与-unicode}

`^`、`$` 表示行或输入边界，`\b` 表示单词边界。`Pattern.MULTILINE` 会改变 `^/$` 对多行输入的含义，`DOTALL` 让点号匹配行终止符，`CASE_INSENSITIVE` 控制忽略大小写。

需要 Unicode 大小写时通常组合 `CASE_INSENSITIVE | UNICODE_CASE`；字符类是否涵盖所有语言字符也要检查 `UNICODE_CHARACTER_CLASS`。协议标识若只允许 ASCII，反而应明确写出 `[A-Z0-9]`，避免定义无意扩大。

边界校验常需要锚定整个输入。使用 `Matcher.matches()` 已隐式要求全匹配，不必再机械添加 `^...$`；多行标志下锚点语义还可能与预期不同。

## 六、回溯性能与拒绝服务风险 {#八、回溯性能与拒绝服务风险}

Java 正则引擎包含回溯行为。嵌套量词和可重叠分支可能在失败输入上产生指数级尝试，例如：

```java
// 风险示意：嵌套量词处理很长的 a...! 时可能严重回溯
Pattern.compile("(a+)+$");
```

控制风险的方法包括：

1. 限制外部输入长度；
2. 避免嵌套、重叠的宽泛量词；
3. 能确定不回退时使用占有量词 `++` 或原子组 `(?>...)`；
4. 用接近上限的成功和失败输入做基准测试；
5. 复杂结构改用线性解析器。

::: danger 预编译不能消除灾难性回溯

预编译只能省去反复解析表达式，不能消除匹配过程的灾难性回溯。Java 标准 `Pattern` 没有每次匹配超时参数，服务端必须通过输入限制和结构设计预防。

:::

## 七、运行订单号示例 {#九、运行订单号示例}

完整源码保存为 `RegexDemo.java`。示例验证完整订单号、读取命名组、在日志中查找两个订单号、脱敏号码并按字面量匹配 `a+b`。


将以下代码保存为 `RegexDemo.java`：

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看 RegexDemo 完整代码

```java [RegexDemo.java]
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 演示 Pattern 复用、完整匹配、查找、命名分组和替换。
 */
public final class RegexDemo {

    private static final Pattern ORDER_NUMBER = Pattern.compile(
            "ORD-(?<date>\\d{8})-(?<sequence>\\d{4})"
    );
    private static final Pattern PHONE = Pattern.compile("(?<=phone=)\\d{11}");

    /**
     * 示例入口类不需要实例化。
     */
    private RegexDemo() {
    }

    /**
     * 输出完整匹配、查找与替换结果；可选参数触发非法正则编译失败。
     *
     * @param args 传入 invalid-pattern 时复现 PatternSyntaxException
     */
    public static void main(String[] args) {
        if (args.length > 0 && "invalid-pattern".equals(args[0])) {
            Pattern.compile("[");
            return;
        }

        String orderNumber = "ORD-20260903-0042";
        Matcher matcher = ORDER_NUMBER.matcher(orderNumber);
        System.out.println("matches=" + matcher.matches());
        System.out.println("date=" + matcher.group("date"));
        System.out.println("sequence=" + matcher.group("sequence"));
        System.out.println("invalid matches=" + ORDER_NUMBER.matcher("ORD-42").matches());

        String text = "created ORD-20260903-0042, paid ORD-20260903-0043";
        Matcher finder = ORDER_NUMBER.matcher(text);
        int found = 0;
        while (finder.find()) {
            found++;
        }
        System.out.println("found=" + found);
        System.out.println("masked=" + PHONE.matcher("phone=13800138000").replaceAll("***********"));
        System.out.println("quoted=" + Pattern.compile(Pattern.quote("a+b")).matcher("a+b").matches());
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out RegexDemo.java
java -cp out RegexDemo
```

预期输出：

```text
matches=true
date=20260903
sequence=0042
invalid matches=false
found=2
masked=phone=***********
quoted=true
```

::: warning 字符形状正确不代表日期有效

日期组只有字符形状验证，`20260231` 仍可能匹配。若它代表真实日期，应把分组交给 `LocalDate` 和严格格式器继续校验。

:::

运行非法模式失败路径：

```powershell
java -cp out RegexDemo invalid-pattern
```

单独的 `[` 没有闭合字符类，`Pattern.compile` 以非零状态抛出 `PatternSyntaxException` 并给出错误位置。固定正则应在启动或类初始化阶段尽早验证；允许用户配置规则时则要捕获并转换为明确配置错误。

## 八、Java 8 维护线与常见错误 {#十、java-8-维护线与常见错误}

Java 8 已支持 `Pattern`、`Matcher`、命名组、引用转义和本文示例的核心方法。后续 Java 版本增加了一些结果流和函数式替换能力，跨版本公共代码可继续使用显式 `while (matcher.find())`。

| 错误 | 失败表现 | 修正 |
|------|----------|------|
| 忘记 Java 层反斜杠转义 | 编译错误或规则含义变化 | 对照“正则文本”和“Java 字符串”两层 |
| 用 `find` 做完整字段校验 | 只要包含合法片段就通过 | 使用 `matches` |
| 成功匹配前调用 `group` | `IllegalStateException` | 先检查匹配方法返回值 |
| 用户文本直接进入模式或替换 | 元字符改变规则或替换引用 | 使用 `Pattern.quote` / `quoteReplacement` |
| 预编译后认为性能一定安全 | 长失败输入仍可能灾难回溯 | 限长、简化结构并压测 |
| 用正则解析嵌套格式 | 转义和层级边界不断失效 | 使用对应结构化解析器 |

规范依据可参阅 [Java 21 Pattern API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/regex/Pattern.html)、[Matcher API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/regex/Matcher.html) 与 [PatternSyntaxException API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/regex/PatternSyntaxException.html)。
