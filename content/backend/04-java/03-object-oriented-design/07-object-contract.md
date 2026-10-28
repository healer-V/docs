---
title: "Object 通用契约"
tags:
  - Java 21
  - Object
  - equals
  - hashCode
excerpt: "解释 Object 根类、引用身份、逻辑相等性、哈希码和字符串表示，并通过商品编码验证 equals 与 hashCode 对 Set、Map 的影响。"
date: 2026-09-03
---

# Object 通用契约

所有 Java 类都直接或间接继承 `Object`。其中 `equals`、`hashCode` 和 `toString` 不是普通的便利方法：它们构成集合查找、值比较和诊断输出共同依赖的基础契约。

## 一、Object 提供的共同能力

常见 `Object` 实例方法包括：

| 方法 | 默认含义 | 常见处理 |
|------|----------|----------|
| `equals(Object)` | 与 `==` 相同的对象身份 | 值对象按业务值重写 |
| `hashCode()` | 与对象身份相关的哈希值 | 重写 `equals` 时必须同步重写 |
| `toString()` | 类型名与哈希表示 | 输出安全、稳定的诊断字段 |
| `getClass()` | 对象真实运行时类 | 反射、日志或严格类型比较 |
| `wait/notify/notifyAll` | 对象监视器协作 | 并发章节结合锁条件说明 |
| `clone()` | 受保护的浅复制入口 | 通常优先复制构造器或显式工厂 |

::: warning 不要通过 finalize 回收外部资源

现代 Java 不应实现 `finalize()` 进行资源回收；其执行时机不可靠且该机制已弃用。外部资源应使用 `AutoCloseable` 与 `try-with-resources` 管理。

:::

## 二、对象身份与逻辑相等性

相等性设计先确定比较的是同一对象还是同一业务值，再选择字段和类型策略。集合与调用方会依赖这个决定，因此不能仅为某个断言临时改变相等规则。

### 1. == 与 equals 的职责不同 {#二、-与-equals-的职责不同}

对于引用类型：

```java
ProductCode first = new ProductCode("SKU-7001");
ProductCode sameValue = new ProductCode("SKU-7001");

System.out.println(first == sameValue);      // false
System.out.println(first.equals(sameValue)); // 由 ProductCode 定义
```

`==` 只能回答是否为同一对象；`equals` 可以回答两个对象是否表达相同业务值。枚举常量是固定单例，可用 `==` 比较；字符串、包装类型和普通值对象不应依赖缓存偶然性使用 `==` 比内容。

### 2. equals 必须满足五项性质 {#三、equals-必须满足五项性质}

对任意非 `null` 引用，`equals` 应满足：

1. 自反性：`x.equals(x)` 为 `true`；
2. 对称性：`x.equals(y)` 与 `y.equals(x)` 结果相同；
3. 传递性：`x` 等于 `y` 且 `y` 等于 `z`，则 `x` 等于 `z`；
4. 一致性：参与比较的信息不变时，多次调用结果不变；
5. 非空性：`x.equals(null)` 为 `false`。

典型值对象实现先处理同一引用和类型，再比较定义值语义的字段：

以下是本篇 `ObjectContractDemo.java` 中 `ProductCode.equals` 的方法片段。`value` 是构造时保存的商品编码；完整类型还同时实现 `hashCode`，不能只复制此方法而忽略配套契约。

::: details 查看商品编码相等性方法

```java
/**
 * 按相同运行时类型和标准化编码比较逻辑值。
 *
 * @param other 待比较对象，可以为 null
 * @return 类型和编码都相同时返回 true
 */
@Override
public boolean equals(Object other) {
    if (this == other) {
        return true;
    }
    if (other == null || getClass() != other.getClass()) {
        return false;
    }
    ProductCode that = (ProductCode) other;
    return value.equals(that.value);
}
```

:::

::: tip 值类型应减少继承对相等性的干扰

使用 `getClass()` 表示只有完全相同运行时类才相等；使用 `instanceof` 可以允许父子类型相等，但很容易在新增字段后破坏对称性或传递性。值类型通常设为 `final` 或使用 Record，减少继承对相等性的干扰。

:::

## 三、哈希查找与键稳定性

哈希集合把相等契约用于定位元素。除了让两个等值对象算出相同哈希码，还必须保证对象留在集合期间，查找所依赖的信息不会无声改变。

### 1. 相等与哈希契约 {#四、hashcode-与-equals-必须一致}

哈希契约的核心要求是：两个对象经 `equals` 判断相等时，必须返回相同 `hashCode`。反方向不成立，不同对象允许发生哈希碰撞。

```java
@Override
public int hashCode() {
    return value.hashCode();
}
```

`HashSet` 和 `HashMap` 通常先根据哈希码缩小查找范围，再用 `equals` 确认逻辑相等。只重写 `equals` 不重写 `hashCode` 时，逻辑相等对象可能落入不同桶，导致重复元素、查找失败等违背直觉的结果。

::: warning 哈希码不能充当持久化身份

哈希码不要求跨进程或跨版本稳定，不应用作数据库标识、签名或持久化编码。

:::

### 2. 哈希键必须在使用期间稳定 {#五、哈希键必须在使用期间稳定}

如果对象加入 `HashSet` 后，参与 `equals/hashCode` 的字段又发生变化，集合仍按旧哈希位置组织该对象，新值计算出的桶可能找不到它：

```text
放入时：code=SKU-1 → hash=H1 → bucket H1
修改后：code=SKU-2 → hash=H2 → 查询 bucket H2，找不到旧位置
```

因此哈希键和值对象应优先不可变。实体如果存在可变业务字段，相等性只能谨慎选择稳定身份；持久化前后才生成的数据库主键还会引入生命周期问题，不能机械照搬模板。

问题不在于集合忘记保存对象，而在于插入位置与后续查询使用的哈希条件不再一致。排查时应对照插入前后的参与字段和哈希码；若业务必须修改这些字段，应先用旧状态移出，再完成修改并重新加入，不能在修改后指望按新状态移除旧条目。

## 四、toString 服务诊断而非序列化 {#六、tostring-服务诊断而非序列化}

好的 `toString` 应提供定位对象所需的少量字段，并避免密码、令牌、完整证件号等敏感信息：

```java
@Override
public String toString() {
    return "ProductCode[value=" + value + "]";
}
```

::: warning toString 不应执行外部操作

不要让 `toString` 执行数据库查询、网络调用或状态修改。它会被调试器、日志占位符和集合输出隐式调用。其格式也不是稳定交换协议；对外 JSON、消息或数据库字段应使用明确序列化契约。

:::

## 五、运行商品编码示例 {#七、运行商品编码示例}

完整源码保存为 `ObjectContractDemo.java`。`ProductCode` 在构造时标准化编码，并使用同一不可变字段实现 `equals` 和 `hashCode`。

```java
Set<ProductCode> codes = new HashSet<>();
codes.add(first);
codes.add(sameValue);

Map<ProductCode, String> names = new HashMap<>();
names.put(first, "机械键盘");

System.out.println("set size=" + codes.size());
System.out.println("map lookup=" + names.get(sameValue));
```

新建一个空文件夹，将以下代码保存为 `ObjectContractDemo.java`，编码使用 UTF-8。后续编译和运行命令均在该文件夹执行。

::: details 查看 ObjectContractDemo 完整代码

```java [ObjectContractDemo.java]
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 演示对象身份、值相等性以及 equals/hashCode 契约对哈希集合的影响。
 */
public final class ObjectContractDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private ObjectContractDemo() {
    }

    /**
     * 示例入口。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        ProductCode first = new ProductCode("SKU-7001");
        ProductCode sameValue = new ProductCode("SKU-7001");

        Set<ProductCode> codes = new HashSet<>();
        codes.add(first);
        codes.add(sameValue);

        Map<ProductCode, String> names = new HashMap<>();
        names.put(first, "机械键盘");

        System.out.println("same reference=" + (first == sameValue));
        System.out.println("same value=" + first.equals(sameValue));
        System.out.println("set size=" + codes.size());
        System.out.println("map lookup=" + names.get(sameValue));
        System.out.println("debug=" + first);
    }

    /**
     * 商品编码是不可变值对象，相等性只由标准化后的编码决定。
     */
    private static final class ProductCode {
        private final String value;

        /**
         * 创建并标准化商品编码。
         *
         * @param value 商品编码，不能为 null 或空白
         */
        private ProductCode(String value) {
            String requiredValue = Objects.requireNonNull(value, "商品编码不能为 null").trim();
            if (requiredValue.isEmpty()) {
                throw new IllegalArgumentException("商品编码不能为空");
            }
            this.value = requiredValue.toUpperCase();
        }

        /**
         * 按相同运行时类型和标准化编码比较逻辑值。
         *
         * @param other 待比较对象，可以为 null
         * @return 类型和编码都相同时返回 true
         */
        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            ProductCode that = (ProductCode) other;
            return value.equals(that.value);
        }

        /**
         * 由 equals 使用的同一字段生成哈希码。
         *
         * @return 商品编码的稳定哈希码
         */
        @Override
        public int hashCode() {
            return value.hashCode();
        }

        /**
         * 返回不含敏感信息的诊断文本。
         *
         * @return 商品编码调试表示
         */
        @Override
        public String toString() {
            return "ProductCode[value=" + value + "]";
        }
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out ObjectContractDemo.java
java -cp out ObjectContractDemo
```

预期输出：

```text
same reference=false
same value=true
set size=1
map lookup=机械键盘
debug=ProductCode[value=SKU-7001]
```

::: tip 同时验证相等性与哈希查找

两个引用身份不同但值相等，所以 `HashSet` 只保留一个逻辑值，`HashMap` 也能用另一个等值实例命中条目。该结果同时依赖正确的 `equals` 与 `hashCode`。

:::

## 六、实现检查表 {#八、实现检查表}

| 检查项 | 需要确认的结论 |
|--------|----------------|
| 值语义 | 哪些字段共同定义逻辑值，是否稳定 |
| 类型策略 | 是否允许父子类型相等，能否保持对称和传递 |
| 哈希一致性 | `equals` 使用的字段是否同步用于 `hashCode` |
| 集合作为键 | 对象进入哈希集合后相关字段是否不可变 |
| 诊断输出 | `toString` 是否无副作用且不泄露敏感信息 |

规范依据可参阅 [Java 21 Object API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html)、[Java 21 HashSet API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashSet.html) 与 [Java 21 HashMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)。
