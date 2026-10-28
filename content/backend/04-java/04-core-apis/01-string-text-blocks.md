---
title: "字符串与文本块"
tags:
  - Java 21
  - String
  - StringBuilder
  - 文本块
excerpt: "解释 Java 字符串不可变性、常量池和内容比较，并按固定拼接、循环构建、格式化与多行文本场景选择合适 API。"
date: 2026-09-03
---

# 字符串与文本块 {#string、stringbuilder-与文本块}

`String` 是不可变文本值：对象创建后字符序列不会改变，所有看似修改字符串的方法都返回新字符串。少量表达式拼接可以使用 `+`，循环或分支中逐步构建文本应使用 `StringBuilder`，多行模板可使用 Java 21 文本块。

## 一、String 的不可变语义

```java
String original = " order-42 ";
String normalized = original.strip().toUpperCase(Locale.ROOT);
```

执行后 `original` 仍包含首尾空格，`normalized` 指向新结果。不可变性带来三个直接结果：

- 字符串可以安全共享，不会被持有同一引用的代码原地改写；
- `hashCode` 可缓存且适合作为映射键；
- 连续转换会产生中间值，复杂构建需要选择更合适的工具。

字符串变量本身仍可重新赋值：

```java
String status = "CREATED";
status = "PAID";
```

改变的是变量保存的引用，不是把原来的 `"CREATED"` 对象修改成 `"PAID"`。若变量也不应重新赋值，可声明为 `final`。

## 二、字符串常量池与对象身份

### 1. 字面量可以共享池中实例

编译器和 JVM 会复用相同字符串字面量，因此下面的身份比较通常为 `true`，且由字面量驻留规则支持：

```java
String first = "ORD-1001";
String second = "ORD-1001";
System.out.println(first == second);
```

编译期可求值的常量表达式也可能合并进常量池。运行时输入、文件内容或动态拼接不必指向同一实例。

### 2. 内容比较必须使用 equals

```java
String heapValue = new String("ORD-1001");
System.out.println(first == heapValue);       // false
System.out.println(first.equals(heapValue)); // true
```

::: warning 字符串内容不能通过引用身份判断

`==` 只比较引用身份，`equals` 比较字符内容。不能因为字面量测试偶然通过就使用 `==` 校验订单号、状态文本或用户输入。忽略大小写比较可以使用 `equalsIgnoreCase`，但标识规范化最好明确字符集和语言规则。

:::

`intern()` 会返回池中规范引用，但会引入全局池依赖和额外查找，不能替代业务值比较。

## 三、常用文本检查与转换

| API | 结果含义 | 边界 |
|-----|----------|------|
| `length()` | UTF-16 代码单元数量 | emoji 等字符可能占两个代码单元 |
| `isEmpty()` | 长度是否为 0 | 空格字符串不是空字符串 |
| `isBlank()` | 是否为空或全是 Unicode 空白 | Java 11 起提供 |
| `strip()` | 删除首尾 Unicode 空白 | 比 `trim()` 的空白定义更完整 |
| `substring(begin, end)` | 返回左闭右开子串 | 索引越界抛出异常 |
| `contains` / `indexOf` | 查找字面字符序列 | 不按正则解释 |
| `replace` | 替换字面序列 | `replaceAll` 的参数是正则 |
| `toUpperCase(Locale.ROOT)` | 按稳定非语言环境规则大写 | 不依赖服务器默认 Locale |

::: tip 机器标识应使用稳定的 Locale

订单号、协议键等机器标识做大小写规范化时使用 `Locale.ROOT`，避免部署机器语言环境改变结果。面向用户的自然语言文本则应选择明确用户 Locale。

:::

字符串可以为 `null`；调用 `value.isBlank()` 前若契约允许空引用，需要先处理 `null`。不要把 `null`、空串和全空白串无条件当成同一个状态，它们在业务上可能分别表示缺失、明确为空和非法输入。

## 四、按构建场景选择拼接方式

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| 少量固定表达式 | `"order=" + number` | 可读，编译器会优化单个表达式 |
| 带占位符的结果 | `"order=%s".formatted(number)` | 模板和参数位置清晰 |
| 循环、条件逐步追加 | `StringBuilder` | 避免每次产生新中间字符串 |
| 带分隔符的集合文本 | `String.join` 或 `StringJoiner` | 自动处理分隔符和前后缀 |
| 复杂本地化消息 | `MessageFormat` 或国际化资源 | 不能只靠普通格式化处理语言变化 |

循环中使用 `result = result + item` 会在每次迭代创建新字符串并复制已有内容，累计成本可能接近平方增长。`StringBuilder` 维护可扩展字符缓冲区，最终只调用一次 `toString()`：

```java
StringBuilder builder = new StringBuilder(orderNumber).append(':');
for (int index = 0; index < itemCodes.length; index++) {
    if (index > 0) {
        builder.append(',');
    }
    builder.append(itemCodes[index]);
}
return builder.toString();
```

::: info 可变构建器应限制在线程内使用

`StringBuilder` 可变且不是线程安全容器，应作为方法内局部构建器使用。`StringBuffer` 的方法带同步，只有确实需要多个线程共享同一缓冲区时才考虑；通常更合理的设计是不共享构建器。

:::

## 五、文本块表达多行字符串

文本块使用三个双引号，适合 JSON、SQL 和多行模板：

```java
String json = """
        {
          "orderNumber": "%s",
          "status": "%s"
        }
        """.formatted(orderNumber, status);
```

编译器根据结束分隔符和非空行的公共前导空白移除附带缩进，因此源码可以与 Java 代码对齐。结束分隔符单独放在下一行时，结果通常包含末尾换行；若不需要，可以使用 `stripTrailing()` 或调整分隔符位置。

::: warning 文本块不会自动校验或转义内容

文本块减少双引号和换行转义，但内容仍是普通 `String`，不会自动成为合法 JSON 或 SQL，也不会进行安全参数绑定。用户输入进入 SQL 时必须使用 JDBC 参数，不能把文本块当作防注入机制。

:::

## 六、运行文本 API 示例

完整源码保存为 `TextApiDemo.java`。示例对比池中字面量和显式创建对象，验证不可变转换、循环构建和文本块实际换行。

```java
String literal = "ORD-1001";
String sameLiteral = "ORD-1001";
String heapValue = new String("ORD-1001");

System.out.println("literal identity=" + (literal == sameLiteral));
System.out.println("heap identity=" + (literal == heapValue));
System.out.println("content equals=" + literal.equals(heapValue));
```

新建一个空文件夹，将以下代码保存为 `TextApiDemo.java`，编码使用 UTF-8。后续编译和运行命令均在该文件夹执行。

::: details 查看 TextApiDemo 完整代码

```java [TextApiDemo.java]
import java.util.Locale;

/**
 * 演示 String 的不可变性、内容比较、StringBuilder 和文本块。
 */
public final class TextApiDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private TextApiDemo() {
    }

    /**
     * 输出字符串身份、内容、构建结果和文本块结构。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        String literal = "ORD-1001";
        String sameLiteral = "ORD-1001";
        String heapValue = new String("ORD-1001");
        String original = " order-42 ";
        String normalized = normalizeOrderNumber(original);

        System.out.println("literal identity=" + (literal == sameLiteral));
        System.out.println("heap identity=" + (literal == heapValue));
        System.out.println("content equals=" + literal.equals(heapValue));
        System.out.println("original=[" + original + "]");
        System.out.println("normalized=" + normalized);
        System.out.println("summary=" + buildItemSummary(literal, new String[]{"SKU-1001", "SKU-1002"}));

        String json = """
                {
                  "orderNumber": "%s",
                  "status": "%s"
                }
                """.formatted(literal, "PAID");
        System.out.println("json=" + json.replace("\n", "|"));
    }

    /**
     * 去除首尾 Unicode 空白并按固定语言规则转为大写。
     *
     * @param orderNumber 待规范化订单号，不能为 null
     * @return 新的规范化字符串，不修改原字符串
     */
    private static String normalizeOrderNumber(String orderNumber) {
        return orderNumber.strip().toUpperCase(Locale.ROOT);
    }

    /**
     * 使用 StringBuilder 构建订单与多个商品编码的摘要。
     *
     * @param orderNumber 订单号，不能为 null
     * @param itemCodes 商品编码数组，不能为 null，元素不能为 null
     * @return 以逗号连接商品编码的订单摘要
     */
    private static String buildItemSummary(String orderNumber, String[] itemCodes) {
        StringBuilder builder = new StringBuilder(orderNumber).append(':');
        for (int index = 0; index < itemCodes.length; index++) {
            if (index > 0) {
                builder.append(',');
            }
            builder.append(itemCodes[index]);
        }
        return builder.toString();
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out TextApiDemo.java
java -cp out TextApiDemo
```

预期输出：

```text
literal identity=true
heap identity=false
content equals=true
original=[ order-42 ]
normalized=ORDER-42
summary=ORD-1001:SKU-1001,SKU-1002
json={|  "orderNumber": "ORD-1001",|  "status": "PAID"|}|
```

最后一行把换行替换为 `|` 便于观察：左大括号、两个字段和右大括号各占一行，结果还包含一个末尾换行。

## 七、Java 8 维护线

Java 8 支持 `String`、`StringBuilder`、`String.join` 与 `String.format`，但不支持文本块、`String.formatted`、`isBlank` 和 `strip`。

| Java 21 写法 | Java 8 替代 | 差异 |
|--------------|-------------|------|
| `value.isBlank()` | `value.trim().isEmpty()` | `trim` 只处理较窄的字符范围 |
| `value.strip()` | `value.trim()` | Unicode 空白语义不完全相同 |
| `"%s".formatted(value)` | `String.format("%s", value)` | 格式能力相同，调用入口不同 |
| 文本块 | 普通字符串拼接或资源文件 | 需要显式换行和引号转义 |

维护线不能只机械替换方法名；若输入可能包含非 ASCII 空白，`strip` 与 `trim` 的行为差异需要测试确认。

## 八、常见错误

| 错误 | 现象 | 修正 |
|------|------|------|
| 用 `==` 比较内容 | 字面量通过、运行时输入失败 | 统一使用 `equals` 或明确空值安全比较 |
| 忽略方法返回值 | 调用 `strip()` 后原变量仍有空白 | 接收新字符串或重新赋值变量 |
| 循环内反复 `+` | 数据增大后复制和分配成本明显 | 使用局部 `StringBuilder` |
| 依赖默认 Locale 大小写 | 不同服务器结果可能不同 | 机器标识使用 `Locale.ROOT` |
| 误判文本块缩进和末尾换行 | JSON 快照或签名内容不一致 | 用输出或单元测试验证实际字符序列 |

规范依据可参阅 [Java 21 String API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html)、[StringBuilder API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuilder.html) 与 [JLS 3.10.6：Text Blocks](https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html#jls-3.10.6)。
