---
title: "日期时间 API"
tags:
  - Java 21
  - java.time
  - 时区
  - Clock
excerpt: "区分时间点、本地日期时间、偏移量、地区时区、Duration 与 Period，并通过固定时钟验证跨时区转换、夏令时和解析失败。"
date: 2026-09-03
---

# 日期时间 API

`java.time` 用不同类型区分时间点、日历日期、本地墙上时间、固定偏移量和地区时区。正确设计的关键不是记住所有方法，而是先判断业务数据究竟表示“全球同一瞬间”还是“某地日历规则下的时间”。

## 一、时间表示与值操作

时间数据首先需要区分“已经发生的瞬间”和“日历上的约定”。前者用于事件排序和超时比较，后者用于账期、生日或门店排期；选定类型后再进行不可变值运算，避免让展示格式决定存储模型。

### 1. 按业务含义选择时间类型 {#一、按业务含义选择时间类型}

| 类型 | 表示内容 | 不包含什么 | 典型场景 |
|------|----------|------------|----------|
| `Instant` | UTC 时间线上的瞬间 | 地区时区和展示格式 | 创建时间、事件时间戳 |
| `LocalDate` | 年月日 | 时间、偏移量、时区 | 生日、账单日期 |
| `LocalTime` | 一天内时分秒 | 日期、偏移量、时区 | 每日营业时间 |
| `LocalDateTime` | 本地日期与时间 | 偏移量、地区时区 | “门店当地 9:00”规则输入 |
| `OffsetDateTime` | 本地时间与固定偏移量 | 地区历史和夏令时规则 | 带 `+08:00` 的接口时间 |
| `ZonedDateTime` | 本地时间、偏移量和 `ZoneId` | 无 | 跨地区排期、时区展示 |
| `YearMonth` | 年月 | 具体日和时间 | 账期、信用卡有效月 |
| `MonthDay` | 月日 | 年份 | 周年纪念规则 |

::: warning 本地日期时间不能唯一确定瞬间

`LocalDateTime` 看起来信息很多，却不能唯一定位时间线上的瞬间。例如“2026-11-01 01:30”在纽约夏令时回拨时可能出现两次。数据库中的创建时间通常应存 `Instant` 或明确偏移量，而不是依赖服务器默认时区解释本地文本。

:::

### 2. java.time 类型不可变 {#二、java-time-类型不可变}

```java
LocalDate placedDate = LocalDate.of(2026, 9, 3);
LocalDate nextDay = placedDate.plusDays(1);
```

`placedDate` 不变，`nextDay` 是新值。与 `String` 类似，调用 `plus`、`minus`、`with` 后必须接收返回值。

这些核心类型不可变并且线程安全，可以安全共享。`DateTimeFormatter` 也不可变、线程安全，可以声明为静态常量；旧 `SimpleDateFormat` 则不是线程安全类型。

## 二、时区转换与本地时间解析

从 `Instant` 转换为地区时间时，瞬间已经确定；从 `LocalDateTime` 转换为瞬间时，却需要地区规则决定有效偏移。两种转换方向不能混为一谈，夏令时的歧义主要出现在后者。

### 1. 时间点与时区转换 {#四、时间点与时区转换}

同一个 `Instant` 可以在不同地区显示为不同墙上时间：

```java
Instant placedAt = Instant.parse("2026-09-03T02:30:00Z");
ZonedDateTime shanghai = placedAt.atZone(ZoneId.of("Asia/Shanghai"));
ZonedDateTime newYork = placedAt.atZone(ZoneId.of("America/New_York"));
```

结果分别是上海 10:30 和纽约前一天 22:30，但 `toInstant()` 完全相等。`withZoneSameInstant` 也能保留瞬间切换显示时区。

`withZoneSameLocal` 则保留墙上时间、改变对应瞬间，通常只适用于“把排期规则搬到另一个地区”等明确业务，不应误用于普通展示转换。

::: info 地区时区与固定偏移量表达不同事实

不要用 `ZoneOffset.ofHours(8)` 永久代替 `Asia/Shanghai` 等地区时区。固定偏移量没有地区历史规则；航班、会议和未来排期应保存地区 `ZoneId`。

:::

### 2. 夏令时产生缺口与重叠 {#五、夏令时产生缺口与重叠}

地区时区规则可能让某些本地时间不存在或出现两次。纽约在 2026 年春季切换时，02:30 落入缺口：

```java
LocalDateTime local = LocalDateTime.of(2026, 3, 8, 2, 30);
ZonedDateTime resolved = local.atZone(ZoneId.of("America/New_York"));
```

默认解析会把它向前调整到 03:30。秋季回拨的重叠时间默认选择较早偏移量，也可显式选择另一个有效偏移。

判断本地预约能否落到唯一瞬间时，可先看有效偏移数量，再决定是否接受：

| 有效偏移数量 | 本地时间状态 | 预约系统需要的处理 |
|--------------|--------------|--------------------|
| 1 | 唯一有效时间 | 使用该偏移完成转换 |
| 0 | 时钟向前跳过的缺口 | 拒绝该预约，或按已公布规则顺延 |
| 2 | 时钟回拨造成的重叠 | 明确选择第一次或第二次发生，并保存选择 |

::: warning 夏令时缺口与重叠需要业务决策

金融批次、预约和定时任务不能静默依赖默认解析策略。边界输入应检查 `ZoneRules.getValidOffsets(localDateTime)`：结果为空表示缺口，两个偏移表示重叠，然后按业务规则拒绝或选择。

:::

时区规则来自 JDK 的 TZDB 数据，历史和未来规则可能在 JDK 更新中变化。长期未来排期需要保存原始本地时间、地区时区和业务决策，而不仅是预先换算后的瞬间。

## 三、Duration 与 Period {#六、duration-与-period-表示不同时间量}

`Duration` 基于秒和纳秒，适合时间线上的固定持续时间；`Period` 基于年、月、日，适合日历变化。

```java
Duration paymentWindow = Duration.ofMinutes(30); // PT30M
Period oneMonth = Period.ofMonths(1);             // P1M
```

一个月不是固定秒数，跨夏令时的一天也不一定是 24 小时：

- “支付后 30 分钟过期”使用 `Duration`；
- “下个自然月同一天续费”使用 `Period` 或日期运算；
- “门店下一营业日”需要业务日历，不能只加 24 小时。

比较两个时间点先把它们放在同一时间线上；计算日历年龄则使用 `LocalDate` 与 `Period`，不要拿毫秒数除以 365 天。

## 四、格式化与解析必须共享契约 {#七、格式化与解析必须共享契约}

### 1. 格式模式与地区设置

优先使用 ISO 格式器，例如 `DateTimeFormatter.ISO_INSTANT`、`ISO_OFFSET_DATE_TIME`。自定义格式器应明确 Locale：

```java
DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
        "uuuu-MM-dd HH:mm",
        Locale.ROOT
);
```

::: warning 日期格式中的年份符号不能混用

`uuuu` 表示公历年份，`yyyy` 表示纪年中的年，`YYYY` 表示基于周的年份。年末附近误用 `YYYY-MM-dd` 可能输出下一周所属年份，这是常见生产日期错误。

:::

### 2. 格式匹配与日期有效性分开判断

文本符合 `uuuu-MM-dd` 的字符形状，不代表它是合法日历日期。`ofPattern` 默认采用 `SMART` 解析策略；要求严格拒绝无效日期的接口应使用 `withResolverStyle(ResolverStyle.STRICT)`，并用闰年、月末和非法日验证契约。格式模式、解析策略与时区解决不同问题，指定其中一项不会自动补齐其他条件。

解析失败抛出 `DateTimeParseException`，错误中包含文本和失败索引。接口不应接收“2026/9/3、下周、下午”等没有格式和时区契约的模糊文本。错误处理应保留原始输入与约定格式供诊断，不应把解析失败直接替换为当前时间。

## 五、存储、接口和旧 API 边界 {#八、存储、接口和旧-api-边界}

| 数据 | 推荐表示 | 说明 |
|------|----------|------|
| 创建/更新时间 | `Instant` 或数据库 UTC 时间戳 | 明确同一时间线 |
| 带偏移 API 时间 | ISO 8601 `OffsetDateTime` 文本 | 调用方可恢复瞬间 |
| 用户预约 | 本地日期时间 + `ZoneId` | 保留地区规则 |
| 纯日期 | ISO `LocalDate` | 不附加虚假午夜和时区 |
| 持续时间 | ISO `Duration` 或明确秒数单位 | 字段名包含单位 |

旧 `java.util.Date` 实际表示时间线上的毫秒值，可以使用 `date.toInstant()` 和 `Date.from(instant)` 转换。`Calendar`、`SimpleDateFormat` 具有可变性、月份和线程安全等历史负担，新代码优先停留在 `java.time`。

JDBC 4.2 驱动通常可以直接绑定 `LocalDate`、`LocalDateTime` 等类型，但数据库列是否包含时区、驱动如何转换仍需集成测试确认。

## 六、当前时间通过 Clock 建立测试边界 {#三、当前时间通过-clock-建立测试边界}

直接调用 `Instant.now()` 或 `LocalDate.now()` 会读取系统时钟，使测试结果随执行时间变化。需要判断超时、营业日或订单截止时间时，将 `Clock` 作为协作者传入：

本篇完整的 `DateTimeDemo.java` 定义了 `OrderDeadline`，其构造器保存 `Clock`，`expired` 比较时钟当前瞬间与截止瞬间。下面摘录 `main` 中创建固定时钟的方式；完整导入、类型与调用入口在本篇运行示例中给出：

```java
Instant placedAt = Instant.parse("2026-09-03T02:30:00Z");
Clock fixedClock = Clock.fixed(placedAt, SHANGHAI);
OrderDeadline deadlines = new OrderDeadline(fixedClock);
```

::: tip 用固定时钟稳定测试结果

生产使用 `Clock.systemUTC()` 或指定 `ZoneId`，测试使用 `Clock.fixed`。这样无需等待真实时间，也无需修改全局系统时钟。

:::

`LocalDate.now(clock)` 会使用 `clock` 携带的时区计算日期。同一 `Instant` 在 UTC 和上海可能对应不同日期，因此“今天”必须属于某个业务时区。

示例用 `isAfter` 表达“超过截止瞬间才过期”，相等时仍返回 `false`。业务若要求到达截止瞬间立即过期，需要采用包含相等的判断，并分别验证截止前、恰好截止和截止后三种输入；注入时钟解决可复现性，截止规则仍需由业务定义。

## 七、运行跨时区示例 {#九、运行跨时区示例}

完整源码保存为 `DateTimeDemo.java`。示例固定在 `2026-09-03T02:30:00Z`，避免执行时间影响结果，并展示夏令时缺口的默认解析。

新建一个空文件夹，将以下代码保存为 `DateTimeDemo.java`，编码使用 UTF-8。后续编译和运行命令均在该文件夹执行。

::: details 查看 DateTimeDemo 完整代码

```java [DateTimeDemo.java]
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.Objects;

/**
 * 演示时间点、本地时间、时区、Duration、Period、格式化和固定时钟。
 */
public final class DateTimeDemo {

    private static final ZoneId SHANGHAI = ZoneId.of("Asia/Shanghai");
    private static final ZoneId NEW_YORK = ZoneId.of("America/New_York");

    /**
     * 示例入口类不需要实例化。
     */
    private DateTimeDemo() {
    }

    /**
     * 输出同一时间点的跨时区表示和时间量语义；可选参数触发解析失败。
     *
     * @param args 传入 invalid-parse 时复现 DateTimeParseException
     */
    public static void main(String[] args) {
        if (args.length > 0 && "invalid-parse".equals(args[0])) {
            System.out.println(Instant.parse("2026/09/03 10:30"));
            return;
        }

        Instant placedAt = Instant.parse("2026-09-03T02:30:00Z");
        Clock fixedClock = Clock.fixed(placedAt, SHANGHAI);
        OrderDeadline deadlines = new OrderDeadline(fixedClock);
        ZonedDateTime shanghaiTime = placedAt.atZone(SHANGHAI);
        ZonedDateTime newYorkTime = placedAt.atZone(NEW_YORK);
        Duration paymentWindow = Duration.between(placedAt, placedAt.plusSeconds(1_800));
        Period billingPeriod = Period.between(LocalDate.of(2026, 9, 3), LocalDate.of(2026, 10, 3));
        LocalDateTime dstGap = LocalDateTime.of(2026, 3, 8, 2, 30);
        ZonedDateTime resolvedGap = dstGap.atZone(NEW_YORK);
        Date legacyDate = Date.from(placedAt);

        System.out.println("fixed instant=" + fixedClock.instant());
        System.out.println("local date=" + LocalDate.now(fixedClock));
        System.out.println("Shanghai=" + format(shanghaiTime));
        System.out.println("New York=" + format(newYorkTime));
        System.out.println("same instant=" + shanghaiTime.toInstant().equals(newYorkTime.toInstant()));
        System.out.println("payment window=" + paymentWindow);
        System.out.println("billing period=" + billingPeriod);
        System.out.println("DST gap resolved=" + resolvedGap);
        System.out.println("legacy round trip=" + legacyDate.toInstant().equals(placedAt));
        System.out.println("expired earlier=" + deadlines.expired(placedAt.minusSeconds(1)));
        System.out.println("expired equal=" + deadlines.expired(placedAt));
        System.out.println("expired later=" + deadlines.expired(placedAt.plusSeconds(1)));
    }

    /**
     * 以包含偏移量和地区时区的 ISO 格式输出时间。
     *
     * @param value 待格式化的带时区时间，不能为 null
     * @return ISO_ZONED_DATE_TIME 格式文本
     */
    private static String format(ZonedDateTime value) {
        return DateTimeFormatter.ISO_ZONED_DATE_TIME.format(value);
    }

    /** 使用注入时钟判断支付截止状态，超过截止瞬间才视为过期。 */
    private static final class OrderDeadline {
        private final Clock clock;

        /**
         * 保存用于时间判断的时钟，避免隐式读取系统当前时间。
         * @param clock 非 null 的业务时钟，测试可传入固定时钟
         */
        private OrderDeadline(Clock clock) {
            this.clock = Objects.requireNonNull(clock, "clock");
        }

        /**
         * 比较当前瞬间与截止瞬间，不将恰好相等判为过期。
         * @param deadline 非 null 的截止瞬间
         * @return 当前瞬间严格晚于截止瞬间时返回 true
         */
        private boolean expired(Instant deadline) {
            return clock.instant().isAfter(Objects.requireNonNull(deadline, "deadline"));
        }
    }
}
```

:::


```powershell

New-Item -ItemType Directory -Force out | Out-Null
javac -encoding UTF-8 -d out DateTimeDemo.java
java -cp out DateTimeDemo
```

预期输出：

::: details 查看跨时区与截止边界输出

```text
fixed instant=2026-09-03T02:30:00Z
local date=2026-09-03
Shanghai=2026-09-03T10:30:00+08:00[Asia/Shanghai]
New York=2026-09-02T22:30:00-04:00[America/New_York]
same instant=true
payment window=PT30M
billing period=P1M
DST gap resolved=2026-03-08T03:30-04:00[America/New_York]
legacy round trip=true
expired earlier=true
expired equal=false
expired later=false
```

:::

上海与纽约表示同一个瞬间，日期却分别为 9 月 3 日和 9 月 2 日。三次截止时间分别设为固定时钟之前 1 秒、相同瞬间和之后 1 秒；只有已经过去的截止瞬间返回 `true`，验证了“超过才过期”的边界。

运行解析失败路径：

```powershell
java -cp out DateTimeDemo invalid-parse
```

`Instant.parse` 只接受符合其 ISO 瞬间格式的文本，示例以非零状态和 `DateTimeParseException` 结束。修复应让生产者与消费者共享格式和时区契约，而不是连续尝试多种猜测格式。

## 八、Java 8 维护线与常见错误 {#十、java-8-维护线与常见错误}

`java.time` 从 Java 8 引入，本文核心类型、`Clock` 和格式化能力均可使用。不同 JDK 更新可能携带不同 TZDB 版本，同一未来地区时间的偏移规则应在升级测试中验证。

| 错误 | 后果 | 修正 |
|------|------|------|
| 使用系统默认时区 | 不同机器得到不同日期或瞬间 | 显式传入 `ZoneId` 或 `Clock` |
| 用 `LocalDateTime` 存创建时间 | 无法唯一恢复瞬间 | 存 `Instant` 或明确偏移 |
| 用 24 小时表示自然日 | 夏令时切换时偏移 | 日历规则使用日期和 `Period` |
| 自定义格式使用 `YYYY` | 年末输出错误周所属年份 | 普通公历日期使用 `uuuu` |
| 共享 `SimpleDateFormat` | 并发解析格式化错误 | 使用不可变 `DateTimeFormatter` |
| 测试直接调用 `now()` | 结果随时间变化 | 注入固定 `Clock` |

规范依据可参阅 [Java 21 java.time 包说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/package-summary.html)、[Clock API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Clock.html) 与 [DateTimeFormatter API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/format/DateTimeFormatter.html)。
