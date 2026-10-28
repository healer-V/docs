---
title: "Math、随机数与 UUID"
tags:
  - Java 21
  - Math
  - SecureRandom
  - UUID
excerpt: "区分数学函数、可复现伪随机、并发随机、安全随机和 UUID 的用途，并说明范围采样、模偏差、令牌强度与唯一标识边界。"
date: 2026-09-03
---

# Math、随机数与 UUID

`Math` 提供确定性数学函数，`Random` 适合普通模拟与可复现测试，`ThreadLocalRandom` 适合并发普通采样，`SecureRandom` 用于安全令牌，`UUID` 用于生成低碰撞概率标识。它们解决的问题不同，不能因为都“产生数字”而互换。

## 一、Math 提供确定性计算

常用方法包括：

| API | 示例结果 | 注意点 |
|-----|----------|--------|
| `Math.min/max` | 取两个值边界 | 不负责业务参数校验 |
| `Math.abs` | 绝对值 | 最小负整数的绝对值仍会溢出 |
| `Math.floor/ceil` | 向下/向上取整，返回浮点值 | 与强制转换截断方向不同 |
| `Math.round` | 四舍五入为整数类型 | 不适合直接制定金额舍入策略 |
| `Math.pow/sqrt` | 幂和平方根 | 基于 `double`，存在浮点精度边界 |
| `Math.addExact` 等 | 精确整数算术 | 溢出时抛出 `ArithmeticException` |

`Math.abs(Integer.MIN_VALUE)` 仍等于负数，因为正方向没有对应 `int` 值。需要溢出可见时使用 `Math.absExact`；金额与大整数则选择 `BigDecimal`、`BigInteger`。

## 二、普通随机是确定性算法

`Random` 根据内部种子生成伪随机序列。同一种实现和种子可以重复得到相同序列，因此适合测试、模拟和非安全抽样：

```java
Random random = new Random(20_260_903L);
int value = random.nextInt(10) + 1; // 1～10
```

`nextInt(10)` 的结果范围是 `0～9`，加一后成为 `1～10`。上界为排他边界，写范围时应先推导：

```text
[minimum, maximum] → nextInt(maximum - minimum + 1) + minimum
```

生产代码不要固定种子，否则每次启动会重复序列；测试可以固定种子，让失败稳定复现。Java 17 起还有统一的 `RandomGenerator` API，但 Java 8 维护线继续使用 `Random` 更易兼容。

## 三、避免手工取模造成偏差

下面的写法有两个问题：

```java
// 错误示意
int value = Math.abs(random.nextInt()) % 10;
```

::: tip 使用有界 API 避免取模偏差

一是 `Integer.MIN_VALUE` 取绝对值仍为负数；二是完整整数范围不能均匀分成 10 份，直接取模会让部分结果出现概率略高。使用 `nextInt(bound)`，标准库会处理有界采样的拒绝逻辑。

:::

随机洗牌、抽奖或负载采样还需要明确是否允许重复、样本是否均匀和数据源是否会动态变化。随机 API 只能提供随机值，不会自动保证业务公平性。

## 四、并发普通随机与安全随机

### 1. 线程本地随机数 {#_1-threadlocalrandom-减少共享竞争}

多线程普通采样可使用 `ThreadLocalRandom.current().nextInt(origin, bound)`。每个线程使用自己的生成器状态，避免多个线程竞争同一个 `Random`。它不能手工设置种子，也不能用于密码、验证码或重置令牌。

::: info 线程局部随机数具有使用边界

调用方不应缓存 `ThreadLocalRandom.current()` 后交给其他线程，每次在实际执行线程中获取即可。`origin` 是包含边界、`bound` 是排他边界，二者相等或顺序错误会直接抛出 `IllegalArgumentException`。

:::

### 2. SecureRandom 用于不可预测值

`SecureRandom` 使用密码学安全伪随机生成器，适合会话令牌、密码重置令牌和密钥材料：

```java
byte[] bytes = new byte[16];
secureRandom.nextBytes(bytes);
String token = Base64.getUrlEncoder()
        .withoutPadding()
        .encodeToString(bytes);
```

::: danger 安全令牌必须同时具备随机性与生命周期控制

16 个随机字节提供 128 位原始随机空间，URL 安全 Base64 且去掉填充后为 22 个字符。令牌还必须通过 HTTPS 传输、仅保存安全摘要、设置过期时间并在使用后失效；随机性只是安全链路的一部分。

:::

不要使用 `Random`、`Math.random()`、当前时间戳或可预测用户信息生成安全令牌。

## 五、UUID 是标识而不是安全令牌

`UUID.randomUUID()` 生成版本 4 UUID，典型文本包含 32 个十六进制字符和 4 个连字符，总长 36：

```text
xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```

::: warning UUID 不能直接当成访问凭证

随机 UUID 碰撞概率极低，适合请求跟踪、分布式对象标识和公开不连续标识，但仍应在数据库中建立唯一约束。UUID 不是访问凭证：格式和随机来源用途不同，不能因为难猜就代替认证授权。

:::

UUID 文本应使用标准格式，通过 `UUID.fromString` 解析。存储时选择字符串、两个 `long` 或数据库原生 UUID 类型，要在协议与索引设计中保持一致。

`UUID.nameUUIDFromBytes` 根据输入稳定生成版本 3 UUID，同一字节输入得到同一结果，适合确定性映射，不适合隐藏原始值或生成安全令牌。

## 六、工具选择矩阵

| 需求 | 选择 | 是否可预测 | 是否适合安全用途 |
|------|------|------------|------------------|
| 数学函数与溢出检查 | `Math` | 完全确定 | 不涉及随机 |
| 单线程模拟、固定种子测试 | `Random` | 是 | 否 |
| 多线程非安全采样 | `ThreadLocalRandom` | 是 | 否 |
| Java 21 多算法普通随机 | `RandomGenerator` | 取决于算法和种子 | 默认否 |
| 令牌、密钥材料 | `SecureRandom` | 设计为不可预测 | 是 |
| 低碰撞分布式标识 | `UUID.randomUUID` | 基于安全随机生成版本 4 | 不是凭证 |

先回答“需要可复现、并发吞吐、安全不可预测还是唯一标识”，再选 API，不能用一个全局随机对象承担所有职责。

## 七、运行随机与标识示例

完整源码保存为 `RandomIdentifiersDemo.java`。普通随机使用固定种子，因此范围样本可复现；安全令牌和 UUID 内容每次不同，示例只验证稳定属性。


将以下代码保存为 `RandomIdentifiersDemo.java`：

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看 RandomIdentifiersDemo 完整代码

```java [RandomIdentifiersDemo.java]
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Random;
import java.util.UUID;

/**
 * 演示数学工具、可复现普通随机、安全随机令牌和 UUID 属性。
 */
public final class RandomIdentifiersDemo {

    /**
     * 示例入口类不需要实例化。
     */
    private RandomIdentifiersDemo() {
    }

    /**
     * 输出确定性数学结果、随机范围和标识格式证据。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        Random reproducible = new Random(20_260_903L);
        int sample = reproducible.nextInt(10) + 1;
        UUID requestId = UUID.randomUUID();
        String secureToken = createSecureToken(new SecureRandom(), 16);

        System.out.println("max=" + Math.max(12, 20));
        System.out.println("ceil=" + (long) Math.ceil(19.01));
        System.out.println("sample 1..10=" + sample);
        System.out.println("uuid length=" + requestId.toString().length());
        System.out.println("uuid version=" + requestId.version() + ", variant=" + requestId.variant());
        System.out.println("secure bytes=16, token chars=" + secureToken.length());
    }

    /**
     * 生成使用 URL 安全 Base64 表示且不带填充的随机令牌。
     *
     * @param secureRandom 密码学安全随机源，不能为 null
     * @param byteLength 随机字节数，必须大于 0；安全强度由该长度决定
     * @return URL 安全、不带等号填充的令牌文本
     */
    private static String createSecureToken(SecureRandom secureRandom, int byteLength) {
        if (byteLength <= 0) {
            throw new IllegalArgumentException("令牌字节数必须大于 0");
        }
        byte[] bytes = new byte[byteLength];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out RandomIdentifiersDemo.java
java -cp out RandomIdentifiersDemo
```

代表性输出：

```text
max=20
ceil=20
sample 1..10=10
uuid length=36
uuid version=4, variant=2
secure bytes=16, token chars=22
```

::: tip 验证随机属性时避免输出完整令牌

UUID 和安全令牌的具体内容没有打印，避免读者把某个随机结果误认为固定预期，也避免日志泄露可用令牌。可验证的是版本、variant、编码长度和样本范围。

:::

## 八、Java 8 维护线

Java 8 已提供 `Math`、`Random`、`ThreadLocalRandom`、`SecureRandom`、`Base64` 和 `UUID`，本示例使用的核心能力可以迁移。`RandomGenerator` 不存在于 Java 8，`Math.absExact` 也是后续版本 API，因此跨版本代码应分别使用 `Random`，并对最小负整数显式处理绝对值溢出。

升级 Java 21 不会自动把历史 `Random` 令牌变安全。维护排查应搜索安全相关场景中的 `Random`、`Math.random`、时间戳和自制取模逻辑，并按用途替换。

## 九、常见错误

| 错误 | 风险 | 修正 |
|------|------|------|
| `nextInt(max - min) + min` 生成闭区间 | 永远取不到 `max` | 闭区间宽度加 1，并检查溢出 |
| `abs(randomInt) % bound` | 最小值仍为负且存在模偏差 | 使用有界随机 API |
| 固定种子进入生产抽奖 | 序列可重放和预测 | 生产随机源由明确策略创建 |
| `Random` 生成登录令牌 | 攻击者可预测 | 使用 `SecureRandom` 和足够字节数 |
| 把 UUID 当数据库唯一保证 | 极低概率碰撞仍未受约束 | 增加数据库唯一索引并处理冲突 |
| 在日志打印安全令牌 | 日志读者可直接使用凭证 | 仅记录请求 ID 或令牌摘要 |

规范依据可参阅 [Java 21 Math API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html)、[Random API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Random.html)、[SecureRandom API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/SecureRandom.html) 与 [UUID API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/UUID.html)。
