---
title: "Mockito 测试替身"
tags: [Java, Mockito, JUnit]
excerpt: "围绕库存预留契约区分 Stub、Fake、Mock 与 Spy，使用 Mockito 验证成功、拒绝、异常传播和校验顺序，并说明测试替身无法证明真实基础设施行为。"
date: 2026-09-11
---


# Mockito 测试替身

测试替身把被测对象边界外的协作者替换为可控实现。Mockito 可以提供预设返回值并记录调用，但测试仍应围绕公开结果和必要协作契约，避免绑定私有方法或无关执行顺序。


## 一、选择替身角色

| 角色 | 主要用途 | 库存场景 |
|------|----------|----------|
| Stub | 返回预先约定的结果 | 固定接受或拒绝预留 |
| Fake | 提供可工作的简化实现 | 用内存 Map 保存有限库存 |
| Mock | 验证有意义的交互 | 检查校验失败前没有调用库存 |
| Spy | 部分保留真实行为 | 观察遗留协作，需防止真实副作用 |
| Dummy | 仅满足参数位置 | 当前路径不使用的对象 |

这些名称描述测试角色，不等同于某一个框架类。金额值对象和普通集合使用真实对象通常更清楚；如果替身内部已经复制复杂库存算法，应改用职责明确、经过契约测试的 Fake。


## 二、库存协作边界

`OrderService` 在调用 `StockGateway` 前校验订单号和数量。其公开契约是：非法输入不访问库存，库存拒绝返回 `false`，技术异常保持原原因，不自动重试。

下面是 `src/main/java/order/app/OrderService.java` 的方法片段；完整类通过构造器要求非空网关。

::: details 查看预留方法与参数约束

```java
/**
 * 校验后执行一次预留，异常直接传播。
 * @param orderId 格式为 ORD-数字的非空演示订单号
 * @param quantity 大于零的商品数量
 * @return 库存预留结果，false 表示业务拒绝
 */
public boolean reserve(String orderId, int quantity) {
    if (orderId == null || !orderId.matches("ORD-\\d+") || quantity <= 0) {
        throw new IllegalArgumentException("invalid order request");
    }
    return stock.reserve(orderId, quantity);
}
```

:::

接口把外部库存与输入规则分开。测试无需通过反射替换私有字段，也无需真正启动库存服务，就能验证这条调用边界。


## 三、行为与交互断言


### 1. 预设返回值

下方完整 `OrderServiceTest` 使用 `@ExtendWith(MockitoExtension.class)` 与 `@Mock StockGateway stock`。以下是成功路径测试的局部代码，测试类的完整导入、注解与其他用例在下方完整文件中给出。

```java
when(stock.reserve("ORD-1001", 2)).thenReturn(true);
assertTrue(new OrderService(stock).reserve("ORD-1001", 2));
verify(stock).reserve("ORD-1001", 2);
```

`when` 控制协作者结果，`assertTrue` 验证对外返回值，`verify` 核对必要参数和默认一次调用。测试只需要证明业务契约，不能因使用了 Mockito 就逐一验证每个内部调用。

### 2. 校验先于访问

非法数量既应抛出公开异常，也应阻止外部库存访问。这是两项不同约束，需要分别断言：

```java
OrderService service = new OrderService(stock);
// 断言回调触发非法数量，异常交给 JUnit 核对。
assertThrows(IllegalArgumentException.class, () -> service.reserve("ORD-1001", 0));
verifyNoInteractions(stock);
```

仅断言异常可能漏掉“先调用库存、再发现参数无效”的错误实现。另一方面，没有业务要求时，不应把所有正常路径都限制为固定的内部调用顺序。

### 3. 拒绝与异常

`thenReturn(false)` 用于业务拒绝，`thenThrow(failure)` 用于技术故障。下方测试分别验证返回 `false` 与原异常对象继续传播；不把失败统一改成默认成功值。

参数匹配器应与真实契约相符，过宽的 `any()` 可能掩盖错误参数。未使用的 Stubbing 通常说明准备了无关状态，应缩小测试准备范围；不要直接全局启用宽松模式。


## 四、运行完整测试

示例固定 JDK 21、JUnit 6.1.2、Mockito 5.23.0 与 Surefire 3.5.4。应用 POM 使用 `mockito-junit-jupiter` 的 `test` 依赖，并在测试 JVM 启动时显式加载 Mockito Agent。

Agent 路径由 Dependency Plugin 的 `properties` 目标解析，不能写成本机缓存绝对路径。Surefire 的关键配置如下，完整插件配置位于应用 POM：

```xml
<configuration>
    <argLine>-javaagent:"${org.mockito:mockito-core:jar}"</argLine>
</configuration>
```

安装 JDK 21 和 Maven 3.9.11，在任意位置新建空目录。按下方路径创建父目录和 UTF-8 文件；以下命令均在这个目录执行，首次构建会下载声明的公开依赖。

将以下内容保存为 `pom.xml`：

::: details 查看 pom.xml 完整内容

```xml [pom.xml]
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>order</groupId>
    <artifactId>order-app</artifactId>
    <version>1.0.0</version>

    <properties>
        <maven.compiler.release>21</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <junit.version>6.1.2</junit.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.junit</groupId>
                <artifactId>junit-bom</artifactId>
                <version>${junit.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency><groupId>org.mockito</groupId><artifactId>mockito-junit-jupiter</artifactId><version>5.23.0</version><scope>test</scope></dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-clean-plugin</artifactId>
                <version>3.4.1</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-resources-plugin</artifactId>
                <version>3.3.1</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.14.1</version>
                <configuration>
                    <compilerArgs>
                        <arg>-Xlint:all</arg>
                        <arg>-Xdoclint:all,-missing</arg>
                        <arg>-Werror</arg>
                    </compilerArgs>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.5.4</version>
                <configuration>
                    <!-- 单元测试是该工程的交付内容，零测试不能按成功处理。 -->
                    <failIfNoTests>true</failIfNoTests>
                    <!-- 启动测试 JVM 时加载 Agent，避免依赖动态自附加。 -->
                    <argLine>-javaagent:"${org.mockito:mockito-core:jar}"</argLine>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <version>3.4.2</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId><artifactId>maven-dependency-plugin</artifactId><version>3.8.1</version>
                <executions><execution><id>resolve-test-agent</id><phase>initialize</phase><goals><goal>properties</goal></goals></execution></executions>
            </plugin>
        </plugins>
    </build>
</project>
```

:::

将以下内容保存为 `src/main/java/order/app/StockGateway.java`：

::: details 查看 StockGateway.java 完整内容

```java [src/main/java/order/app/StockGateway.java]
package order.app;


/** 库存协作边界；示例只定义契约，不连接外部库存服务。 */
public interface StockGateway {
    /**
     * 申请预留商品，无隐含重试。
     * @param orderId 格式为 ORD-数字的非空演示订单号
     * @param quantity 正整数商品数量
     * @return 库存是否接受预留；false 表示业务拒绝
     */
    boolean reserve(String orderId, int quantity);
}
```

:::

将以下内容保存为 `src/main/java/order/app/OrderService.java`：

::: details 查看 OrderService.java 完整内容

```java [src/main/java/order/app/OrderService.java]
package order.app;

import java.util.Objects;

/** 在访问库存前校验输入，保留协作者的业务拒绝与异常。 */
public final class OrderService {
    private final StockGateway stock;

    /**
     * 注入库存边界，不执行库存访问。
     * @param stock 非空库存协作者
     */
    public OrderService(StockGateway stock) {
        this.stock = Objects.requireNonNull(stock, "stock");
    }

    /**
     * 校验后执行一次预留，异常直接传播。
     * @param orderId 仅接受 ORD- 后接一位或多位数字，避免把外部任意文本写入日志
     * @param quantity 大于零的商品数量
     * @return 协作者返回的预留结果，不把 false 转换为技术异常
     * @throws IllegalArgumentException 订单号或数量无效，协作者不会被调用
     */
    public boolean reserve(String orderId, int quantity) {
        if (orderId == null || !orderId.matches("ORD-\\d+") || quantity <= 0) {
            throw new IllegalArgumentException("invalid order request");
        }
        return stock.reserve(orderId, quantity);
    }
}
```

:::

将以下内容保存为 `src/test/java/order/app/OrderServiceTest.java`：

::: details 查看 OrderServiceTest.java 完整内容

```java [src/test/java/order/app/OrderServiceTest.java]
package order.app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** 验证库存协作的公开契约，不连接真实库存系统。 */
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock
    private StockGateway stock;

    /** 验证成功申请的返回值和必要参数；无返回值。 */
    @Test
    void acceptsReservation() {
        when(stock.reserve("ORD-1001", 2)).thenReturn(true);
        assertTrue(new OrderService(stock).reserve("ORD-1001", 2));
        verify(stock).reserve("ORD-1001", 2);
    }

    /** 验证库存拒绝不会被转换为成功或技术异常；无返回值。 */
    @Test
    void preservesBusinessRejection() {
        when(stock.reserve("ORD-1001", 2)).thenReturn(false);
        assertFalse(new OrderService(stock).reserve("ORD-1001", 2));
    }

    /** 验证非法数量在访问库存前被拒绝；无返回值。 */
    @Test
    void rejectsInvalidInputBeforeGateway() {
        OrderService service = new OrderService(stock);
        // 断言回调仅触发无效输入，不捕获目标异常。
        assertThrows(IllegalArgumentException.class, () -> service.reserve("ORD-1001", 0));
        verifyNoInteractions(stock);
    }

    /** 验证技术故障保留原异常对象，便于上层定位；无返回值。 */
    @Test
    void preservesFailureCause() {
        IllegalStateException failure = new IllegalStateException("stock unavailable");
        when(stock.reserve("ORD-1001", 2)).thenThrow(failure);
        OrderService service = new OrderService(stock);
        // 断言回调只执行一次预留；对比异常身份验证传播契约。
        assertSame(failure, assertThrows(IllegalStateException.class,
                () -> service.reserve("ORD-1001", 2)));
    }
}
```

:::

在新建目录执行：

```powershell
mvn -ntp clean verify
```

`OrderServiceTest` 的成功、拒绝、输入校验和异常传播四个测试均应通过：

```text
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
```

将 `reserve` 中的数量检查去掉，会让非法数量测试失败：Mockito 默认布尔返回值为 `false`，不能代替必须抛出的异常。恢复校验后重新构建，测试应回到通过状态。

## 五、替身的证明范围

::: warning 真实库存仍需集成验证
这些测试证明应用按约定调用接口，不能证明真实库存的 SQL、超时、幂等或并发扣减正确。对应协议和数据库行为必须在真实实现边界单独验证。
:::

Spy 默认可能执行真实方法，预设返回值时也可能意外触发网络或文件操作。需要部分替身时应检查具体调用语义；长期依赖复杂 Spy 通常说明被测类的职责或协作边界需要调整。

## 六、参考资料

- [Mockito 官方项目](https://github.com/mockito/mockito)
- [Mockito API](https://javadoc.io/doc/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/Mockito.html)
- [JUnit 单元测试](./08-junit.md)
