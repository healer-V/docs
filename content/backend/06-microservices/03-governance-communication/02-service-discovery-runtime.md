---
title: "服务发现的运行机制"
tags:
  - Eureka
  - 服务发现
  - Spring Cloud
excerpt: "基于Spring Boot 4.1与Spring Cloud 2025.1搭建双实例服务发现实验，解释注册、续约、拉取、实例选择和多层缓存，并通过强制下线测量故障实例约45秒的实际传播窗口。"
date: 2026-07-22
---

# 服务发现的运行机制

服务发现解决的不是“把 IP 写到另一个地方”，而是让 Consumer 在实例持续启动、退出和变化时，根据一个可能暂时陈旧的本地视图选择目标。注册中心保存的记录、Consumer 已拉取的注册表、LoadBalancer 缓存和真实网络状态可能同时不同。

本文使用 Java 21、Spring Boot 4.1.0、Spring Cloud 2025.1.2 和 Eureka 完成可复现实验。读者将启动两个产品服务实例，通过投保服务观察轮询，然后强制结束一个实例，测量它从调用链中消失的实际时间。

## 一、实验要证明什么

实验拓扑如下：

```text
                    ┌─ product-service:8081
application-service │
       :8090 ───────┤  Spring Cloud LoadBalancer
                    │
                    └─ product-service:8082
             ↑
             │ Consumer 本地注册表
             │
      Eureka Server:8761
```

需要区分三类证据：

| 观察位置 | 能证明什么 | 不能证明什么 |
|----------|------------|--------------|
| Eureka Server | Server 当前保存了哪些实例记录 | Consumer 已经拉取、实例网络真实可达 |
| Consumer 的 `DiscoveryClient` | 当前 Consumer 本地注册表包含哪些实例 | LoadBalancer 下次一定选中哪个实例 |
| 实际业务调用 | 本次选择的实例和接口真实可用 | 其他实例和后续请求同样成功 |

只看到 Eureka 控制台中的 `UP`，不能证明调用链正常。完整验证必须同时观察控制面记录、本地缓存和真实请求。

## 二、注册发现链路中的参与者

一次基于逻辑服务名的调用包含以下角色：

| 角色 | 职责 | 关键状态 |
|------|------|----------|
| Provider | 向 Eureka 注册实例并定期续约 | 服务名、实例 ID、地址、端口、租约 |
| Eureka Server | 保存注册信息并根据租约处理实例 | 注册表、续约时间、响应缓存 |
| Eureka Client | 定期拉取注册表到 Consumer 本地 | 本地注册表版本和更新时间 |
| LoadBalancer | 从候选实例中选择本次目标 | 实例列表供应链和客户端缓存 |
| HTTP Client | 连接实际地址并发送请求 | 连接、读取、连接池和错误 |

实际调用顺序为：

```text
业务代码调用 http://product-service
  → LoadBalancer 请求候选实例
  → DiscoveryClient 返回本地注册表中的实例
  → LoadBalancer 选择 8081 或 8082
  → 逻辑主机名替换为实际地址
  → HTTP Client 建立连接并发送请求
```

服务发现只负责提供候选位置。它不会自动保证接口健康、请求成功、超时合理或写操作重试安全。

## 三、实例从启动到可调用存在时间窗口

Provider 启动后通常经历以下状态：

1. Spring Boot 完成基础初始化并监听端口；
2. Eureka Client 向 Server 注册实例；
3. Server 保存注册信息；
4. Consumer 按周期拉取注册表；
5. Consumer 的实例列表和 LoadBalancer 缓存更新；
6. 新实例开始被选择并接收真实请求。

因此，“应用健康端点已经返回 `UP`”“Eureka 控制台出现实例”“Consumer 能够调用”是三个不同时间点。自动化发布需要分别定义就绪、注册和接流标准，不能只等待进程启动日志。

异常退出时流程反向发生，但不会瞬间完成：

```text
实例进程已退出
  ≠ Eureka 租约已过期
  ≠ Server 响应缓存已更新
  ≠ Consumer 已重新拉取
  ≠ LoadBalancer 缓存已失效
```

这就是“实例已经停止，Consumer 仍然调用它”的根本来源。

## 四、构建最小服务发现案例

配套工程位于 `examples/microservices-insurance/`，第一阶段包含：

```text
discovery-server/       # Eureka Server
product-service/        # 可启动8081和8082两个实例
application-service/    # Consumer与负载均衡调用入口
insurance-contracts/    # 实验使用的最小响应契约
scripts/                # 启动、观察、故障和停止脚本
```

根 POM 统一使用 Java 21、Spring Boot 4.1.0 和 Spring Cloud 2025.1.2。先执行完整构建：

```powershell
.\mvnw.cmd verify
```

本文实际执行的 Reactor 结果为：

```text
microservices-insurance ........ SUCCESS
insurance-contracts ............ SUCCESS
insurance-monolith ............. SUCCESS
discovery-server ............... SUCCESS
product-service ................ SUCCESS
application-service ............ SUCCESS
BUILD SUCCESS
```

Eureka Server 的本地单节点配置如下：

```yaml
# examples/microservices-insurance/discovery-server/src/main/resources/application.yml
server:
  port: 8761

spring:
  application:
    name: discovery-server

eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
```

产品服务使用稳定服务名和可区分实例的 ID：

```yaml
# examples/microservices-insurance/product-service/src/main/resources/application.yml
server:
  port: 8081

spring:
  application:
    name: product-service

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    instance-id: ${spring.application.name}:${server.port}
```

`defaultZone` 是区分大小写的 Map 键。容器或远程环境中的 `localhost` 只指向当前容器或主机，不能直接复制此本地地址。

## 五、Consumer如何选择产品实例

投保服务使用一个明确限定的负载均衡 Builder 创建产品客户端：

```java
// examples/microservices-insurance/application-service/src/main/java/
// com/example/insurance/application/HttpClientConfiguration.java
@Configuration
public class HttpClientConfiguration {
    /** 为基础设施组件保留不解析逻辑服务名的普通客户端。 */
    @Bean
    @Primary
    RestClient.Builder defaultRestClientBuilder() {
        return RestClient.builder();
    }

    /** 只供业务远程客户端使用的负载均衡 Builder。 */
    @Bean("loadBalancedRestClientBuilder")
    @LoadBalanced
    RestClient.Builder loadBalancedRestClientBuilder() {
        return RestClient.builder();
    }
}
```

业务客户端使用逻辑服务名，而不是固定实例地址：

```java
// examples/microservices-insurance/application-service/src/main/java/
// com/example/insurance/application/LoadBalancedProductClient.java
@Component
public class LoadBalancedProductClient implements ProductClient {
    private final RestClient restClient;

    /**
     * 创建负载均衡产品客户端。
     *
     * @param builder 已启用 Spring Cloud LoadBalancer 的 Builder
     */
    public LoadBalancedProductClient(
            @Qualifier("loadBalancedRestClientBuilder") RestClient.Builder builder
    ) {
        this.restClient = builder.baseUrl("http://product-service").build();
    }

    /** 通过逻辑服务名查询产品。 */
    @Override
    public ProductInstanceView findByCode(String productCode) {
        return restClient.get()
                .uri("/internal/products/{productCode}", productCode)
                .retrieve()
                .body(ProductInstanceView.class);
    }
}
```

`product-service` 在这里不是 DNS 中必须存在的真实主机名。LoadBalancer 拦截请求，从 DiscoveryClient 本地注册表选择实例，再把目标替换为实际地址。

## 六、正常链路验证

启动脚本会先检查 8761、8081、8082 和 8090 端口，避免覆盖已有服务；然后以隐藏窗口启动四个 JAR，并记录本次进程 PID：

```powershell
.\scripts\start-discovery-lab.ps1
```

查询 Consumer 当前本地注册表：

```powershell
Invoke-RestMethod 'http://localhost:8090/internal/discovery/product-service' |
  ConvertTo-Json
```

两个实例均完成拉取后的预期结构是：

```json
[
  { "instanceId": "product-service:8081", "port": 8081 },
  { "instanceId": "product-service:8082", "port": 8082 }
]
```

连续调用投保接口：

```powershell
.\scripts\observe-discovery-lab.ps1
```

本文实际执行八次请求，Round Robin 结果为：

```text
Attempt  Instance              Port  Eligible
1        product-service:8082  8082  True
2        product-service:8081  8081  True
3        product-service:8082  8082  True
4        product-service:8081  8081  True
5        product-service:8082  8082  True
6        product-service:8081  8081  True
7        product-service:8082  8082  True
8        product-service:8081  8081  True

Port  Count
8081  4
8082  4
```

这个结果证明本次 Consumer 已发现两个实例并执行轮询。它不能证明实例长期均匀、服务具备过载保护或下线能够立即传播。

## 七、强制下线揭示多层缓存

实验 Profile 为了缩短反馈，把 Provider 租约续约设为 2 秒、过期设为 6 秒，并缩短 Eureka Server 的剔除和响应缓存更新周期。这些参数只用于本地实验。

执行故障测量：

```powershell
.\scripts\measure-discovery-failure.ps1
```

脚本强制结束 8082，然后持续调用投保接口。本文实际观察到：

```text
Attempt  Seconds  Result   Port
1        0.0      failed   -
2        3.6      success  8081
3        4.2      failed   -
4        7.7      success  8081
5        8.2      failed   -
...      ...      ...      ...
21       40.6     failed   -
22       44.2     success  8081
23       44.7     success  8081
24       45.2     success  8081
```

8082进程已经退出，但 Consumer 仍在两个候选之间轮询，所以请求交替成功和失败。约45秒后，调用才全部收敛到8081。

租约只有6秒，为什么窗口远大于6秒？因为故障传播还经过：

1. Eureka Server 检测租约过期并剔除实例；
2. Server 响应缓存更新；
3. Consumer 定期拉取注册表；
4. Spring Cloud LoadBalancer 实例缓存失效。

Spring Cloud LoadBalancer 5.0.2 的默认缓存 TTL 为35秒。多个异步周期不是简单相加，但任一层仍持有陈旧实例，都可能延长实际失败窗口。调整 Eureka 租约却忽略客户端缓存，不会得到预期下线速度。

::: warning 不要复制实验参数
生产环境关闭 Eureka 自我保护、把租约压缩到数秒，可能在网络抖动时批量误删健康实例。参数必须结合拓扑、发布流程、调用超时和故障演练确定。
:::

## 八、一次真实的客户端配置故障

本实验第一次运行时，投保调用返回500，Consumer 日志同时出现：

```text
No servers available for service: localhost
Cannot execute request on any known server
```

Eureka Server 明明运行在 `http://localhost:8761`，为什么客户端把 `localhost` 当成了服务名？原因是应用只声明了一个带 `@LoadBalanced` 的 `RestClient.Builder`。Eureka Client 内部也获得了这个 Builder，访问 Server 的普通 URL 被负载均衡拦截器处理，于是它尝试从注册表查找名为 `localhost` 的服务。

修复不是把 Eureka 注册成 `localhost` 服务，而是区分两类客户端：

- 普通 Builder 供 Eureka 等基础设施访问真实 URL；
- 带限定名称的负载均衡 Builder 只供业务客户端解析逻辑服务名。

修复后 Maven 构建通过，Consumer 能拉取注册表，八次调用按8081和8082轮询。这个故障说明 `@LoadBalanced` 不是一个无条件的全局开关；Bean 的作用范围会影响同一进程中的基础设施客户端。

## 九、正常下线与异常退出不同

强制结束进程用于暴露最坏的租约和缓存窗口。生产发布不应依赖等待异常实例自然过期，而应执行受控顺序：

```text
实例变为不接收新流量
  → 等待状态传播
  → 排空在途请求
  → 主动注销
  → 关闭进程
```

即使主动注销，Consumer 仍可能持有旧注册表或 LoadBalancer 缓存，因此需要测量实际传播时间，并确保调用连接和读取超时小于上游预算。服务发现不能代替请求级超时。

还需要关注以下生产边界：

| 边界 | 生产要求 |
|------|----------|
| 地址可达性 | 注册地址必须从 Consumer 网络视角可达 |
| 多网卡 | 统一选择业务网卡，避免注册管理网或虚拟网地址 |
| 安全 | Eureka 控制台和 API 不能暴露到公网，元数据不能保存秘密 |
| 自我保护 | 理解网络故障时保留实例与快速剔除之间的取舍 |
| 双重缓存 | Eureka Client 已缓存时，评估是否还需要 LoadBalancer 缓存 |
| 观察 | 记录注册、续约、拉取、实例选择和调用失败指标 |

## 十、Eureka与Kubernetes发现的关系

Eureka展示的是客户端注册发现：应用主动注册，Consumer 拉取实例并在本地选择。Kubernetes Service 通常通过平台控制面和 DNS/虚拟 IP 提供服务地址，实例变化由 EndpointSlice、代理或数据面处理。

| 维度 | Eureka | Kubernetes Service |
|------|--------|--------------------|
| 服务身份 | `spring.application.name` | Service 名称与 Namespace |
| 实例登记 | 应用客户端注册与续约 | Pod 就绪和控制器维护 Endpoint |
| 实例选择 | Consumer侧 LoadBalancer | 集群网络或数据面转发 |
| 本地注册表 | Eureka Client 持有 | 应用通常只解析 Service 地址 |
| 典型故障窗口 | 租约、拉取和客户端缓存 | Probe、Endpoint 更新、DNS和网络转发 |

两种方式都不能消除陈旧状态和部分失败，只是状态由不同组件维护。进入 Kubernetes 后是否保留 Eureka，应根据平台、跨集群发现、客户端路由和组织标准决定，不能默认叠加两套控制面。

## 十一、验证结论与清理

本文实验已经证明：

- 两个 Provider 可以使用同一服务名和不同实例 ID 注册；
- Consumer 能从本地注册表获得实例并执行轮询；
- 进程退出不会立即从调用候选中消失；
- 租约、Server缓存、Consumer拉取和LoadBalancer缓存共同决定故障窗口；
- 负载均衡客户端的 Bean 范围配置错误会破坏 Eureka 自身通信。

实验尚未覆盖多节点 Eureka、跨区域网络、认证、TLS、优雅发布和生产容量。完成观察后执行：

```powershell
.\scripts\stop-discovery-lab.ps1
```

停止脚本只处理 `start-discovery-lab.ps1` 记录的 PID，不会按进程名批量结束其他 Java 应用。

版本和默认属性以 [Spring Cloud Netflix Eureka](https://docs.spring.io/spring-cloud-netflix/reference/) 与 [Spring Cloud LoadBalancer](https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-commons/loadbalancer.html) 为准。下一步应继续学习 HTTP 契约、错误分类和调用预算，而不是通过无限缩短缓存时间掩盖调用失败。
