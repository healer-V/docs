---
title: "HttpClient"
tags:
  - Java
  - HTTP
  - HttpClient
excerpt: "使用 Java 21 HttpClient 完成同步订单查询，区分连接、请求与正文读取边界，验证非 2xx、超时和超大响应，说明客户端复用、响应流关闭、重定向及幂等重试的责任。"
date: 2026-09-08
---

# HttpClient {#httpclient-请求与响应处理}

HttpClient 负责发送 HTTP 请求并按 BodyHandler 处理响应体。HTTP 状态、网络异常和业务结果是不同维度：404 或 500 仍然是已收到的 HTTP 响应，send 不会仅因非 2xx 自动抛出异常。

## 一、客户端、请求与响应各自负责什么

| 对象 | 责任 | 使用边界 |
|------|------|------|
| HttpClient | 共享连接与客户端配置 | 在应用作用域复用，生命周期结束再关闭 |
| HttpRequest | 描述 URI、方法、请求头、超时和请求体 | 每次调用按请求契约构造 |
| BodyPublisher | 生成请求体字节 | 设置匹配的 Content-Type，重试时考虑是否可重放 |
| BodyHandler | 决定响应体的接收方式 | 选择内存、文件或流，并明确资源所有权 |
| HttpResponse | 状态码、响应头、协议版本和正文结果 | 检查状态后按成功或错误格式解释正文 |

::: info 客户端关闭方式以 Java 21 为基线

Java 21 的 HttpClient 实现 AutoCloseable，可以通过 try-with-resources 管理应用级作用域。不能在每笔订单查询后关闭一个本应共享的客户端，也不能让未消费、未关闭的响应流阻碍关闭过程。Java 11 已提供标准 HttpClient，但本文的客户端关闭写法以 Java 21 为基线。[HttpClient](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html)

:::

GET 使用 GET()；需要请求体时可用 POST 和 BodyPublishers.ofString 等 API。Accept 表达希望得到的格式，Content-Type 描述发送内容，两者不能互换。HTTP 客户端不会自动把 JSON 转成领域对象，JSON 解析和字段验证应由明确选择的解析器承担。

## 二、超时与响应体的边界

### 1. 各阶段超时不自动组成总截止时间

连接、等待响应、读取正文和业务重试占用不同阶段的时间。给其中一个阶段配置超时，不能据此推导整个订单查询一定在相同时间内结束。

| 控制项 | 管理范围 | 不能替代 |
|------|------|------|
| client.connectTimeout | 需要新建连接时的连接等待 | 服务器处理及整个业务调用期限 |
| request.timeout | 当前请求等待响应的超时配置 | ofInputStream 返回后的任意流读取总期限 |
| 正文大小上限 | 允许保留或处理的数据量 | 慢速正文的时间限制 |
| 业务总截止时间 | 多阶段和重试的总体预算 | 单次 API 默认行为 |

### 2. 响应体的接收与所有权 {#_2-bodyhandler-决定正文的接收与所有权}

ofString 和 ofByteArray 适合大小受控的响应；ofInputStream 把正文读取责任交给调用方。readNBytes(limit+1) 可以检测超限，但仍可能等待输入或结束标记。不能因为只申请了小数组，就声称它同时具备读取超时。[HttpRequest.Builder](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.Builder.html)、[BodyHandlers](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpResponse.BodyHandlers.html)

取得 `HttpResponse<InputStream>` 只表示可以从正文流继续读取，不表示正文已经完整到达。成功响应和错误响应都需要明确消费或关闭该流；决定不再解析错误正文时，也不能把它连同连接资源一起遗忘。

::: warning 响应头超时不等于正文总截止时间

正文读取失败时应关闭流，避免继续把不完整结果当成功数据解析。外部服务需要独立的正文截止策略和取消处理；本文固定服务立即发送完整小正文，只通过延迟响应头验证请求超时。

:::

## 三、同步查询与本地故障服务

以下 Java 21 完整程序使用 JDK 的 jdk.httpserver 模块创建回环服务，动态分配端口，并在同一客户端上执行正常查询和不存在查询。响应是固定 UTF-8 纯文本，未引入 JSON 映射库。

保存为 `HttpClientDemo.java`：

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看HttpClientDemo的完整代码

```java
// HttpClientDemo.java
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/** 使用本地可控HTTP服务验证同步请求、错误状态、请求超时和响应大小。 */
public final class HttpClientDemo {
    private static final int MAX_BODY = 128;

    /** 禁止实例化命令行示例。 */
    private HttpClientDemo() {}

    /** 保留传输状态与文本，避免将非2xx隐式当作成功业务数据。 */
    private record Reply(int status, String body) {}

    /** 仅提供固定的小型文本响应；慢请求通过闩锁等待客户端结束。 */
    private static final class OrderHandler implements HttpHandler {
        private final CountDownLatch release;
        private volatile IOException failure;

        /** 保存客户端结束信号，非空闩锁仅用于本地故障夹具。 */
        private OrderHandler(CountDownLatch release) {
            this.release = release;
        }

        /** 处理固定GET路径；异常记录供主流程检查，exchange始终关闭，无返回值。 */
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            try {
                String path = exchange.getRequestURI().getPath();
                if (path.equals("/slow")) {
                    try {
                        if (!release.await(3, TimeUnit.SECONDS)) {
                            throw new IOException("fixture deadline exceeded");
                        }
                    } catch (InterruptedException interrupted) {
                        Thread.currentThread().interrupt();
                        throw new IOException("fixture interrupted", interrupted);
                    }
                    return;
                }
                int status = path.equals("/missing") ? 404 : 200;
                String text = path.equals("/large") ? "X".repeat(MAX_BODY + 1)
                        : status == 404 ? "ORDER_NOT_FOUND" : "ORD-1001,PAID";
                byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=UTF-8");
                exchange.sendResponseHeaders(status, bytes.length);
                try (var output = exchange.getResponseBody()) {
                    output.write(bytes);
                }
            } catch (IOException problem) {
                failure = problem;
                throw problem;
            } finally {
                exchange.close();
            }
        }
    }

    /**
     * 同步取得响应并限量读取正文，调用后关闭响应流。
     * @param client 非空、由应用作用域复用且尚未关闭的客户端
     * @param uri 当前夹具的回环HTTP地址，不允许任意外部目标
     * @return 状态码和最多128字节的文本；不自动把HTTP错误状态转为异常
     */
    private static Reply query(HttpClient client, URI uri) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofMillis(uri.getPath().equals("/slow") ? 200 : 1500))
                .header("Accept", "text/plain")
                .GET().build();
        HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
        try (InputStream input = response.body()) {
            byte[] bytes = input.readNBytes(MAX_BODY + 1);
            if (bytes.length > MAX_BODY) {
                throw new IOException("response exceeds 128 bytes");
            }
            // 本夹具立即发送固定UTF-8正文；这里的字节上限不是流读取的总时间上限。
            return new Reply(response.statusCode(), new String(bytes, StandardCharsets.UTF_8));
        }
    }

    /** 在需要成功业务结果的边界显式检查HTTP状态，无返回值。 */
    private static void requireSuccess(Reply reply) throws IOException {
        if (reply.status() < 200 || reply.status() >= 300) {
            throw new IOException("unexpected HTTP status: " + reply.status());
        }
    }

    /** 运行回环HTTP闭环；status、timeout、oversize分别暴露三种不同失败。 */
    public static void main(String[] args) throws Exception {
        String mode = args.length == 0 ? "normal" : args[0];
        CountDownLatch release = new CountDownLatch(1);
        OrderHandler handler = new OrderHandler(release);
        HttpServer server = HttpServer.create(
                new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
        ExecutorService worker = Executors.newSingleThreadExecutor();
        server.setExecutor(worker);
        server.createContext("/", handler);
        server.start();
        try (HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(1500))
                .proxy(ProxySelector.of(null))
                .followRedirects(HttpClient.Redirect.NEVER)
                .version(HttpClient.Version.HTTP_1_1).build()) {
            URI base = new URI("http", null, server.getAddress().getAddress().getHostAddress(),
                    server.getAddress().getPort(), "/", null, null);
            System.out.println("listener=" + base);
            String path = switch (mode) {
                case "status" -> "/missing";
                case "timeout" -> "/slow";
                case "oversize" -> "/large";
                default -> "/orders/ORD-1001";
            };
            try {
                Reply reply = query(client, base.resolve(path));
                requireSuccess(reply);
                System.out.println("status=" + reply.status() + ", body=" + reply.body());
                Reply missing = query(client, base.resolve("/missing"));
                assert missing.status() == 404 && missing.body().equals("ORDER_NOT_FOUND");
                System.out.println("missing status=404, handled as absent=true");
            } finally {
                // 先释放慢处理器，再离开客户端作用域，避免清理互相等待。
                release.countDown();
            }
        } finally {
            release.countDown();
            server.stop(0);
            worker.shutdownNow();
            if (!worker.awaitTermination(4, TimeUnit.SECONDS)) {
                throw new IllegalStateException("HTTP worker did not terminate");
            }
        }
        if (handler.failure != null) {
            throw handler.failure;
        }
        System.out.println("client, server and worker closed=true");
    }
}
```

:::

在本篇示例目录执行以下 PowerShell 命令。代理仅在本例客户端上关闭，保证请求直达本地夹具，不改变全局代理配置：

```powershell
javac --add-modules jdk.httpserver -encoding UTF-8 -d out HttpClientDemo.java
java --add-modules jdk.httpserver -ea -cp out HttpClientDemo
```

一次实测输出如下，listener 地址中的端口每次由系统选择：

```text
listener=http://127.0.0.1:13110/
status=200, body=ORD-1001,PAID
missing status=404, handled as absent=true
client, server and worker closed=true
```

::: tip 由调用契约解释 HTTP 状态

query 返回原始 HTTP 状态和有界正文，requireSuccess 用于要求成功结果的调用边界。正常流程中，第二次查询将 404 解释为不存在；这说明状态处理由业务契约决定，而不是由 send 自动决定。[HttpServer](https://docs.oracle.com/en/java/javase/21/docs/api/jdk.httpserver/com/sun/net/httpserver/HttpServer.html)、[ProxySelector](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/ProxySelector.html)

:::

## 四、分别验证状态失败、超时与超限

以下命令分别运行，每条预期非零退出。故障处理器、客户端和服务器均由当前进程管理，慢请求最多等待三秒，并在客户端结束时提前释放：

```powershell
java --add-modules jdk.httpserver -ea -cp out HttpClientDemo status
java --add-modules jdk.httpserver -ea -cp out HttpClientDemo timeout
java --add-modules jdk.httpserver -ea -cp out HttpClientDemo oversize
```

| 参数 | 实测结果 | 失败层次与处理 |
|------|------|------|
| status | IOException: unexpected HTTP status: 404 | 应用 requireSuccess 主动拒绝状态；按接口契约决定是否映射不存在 |
| timeout | HttpTimeoutException | 服务端暂不发送响应头；本次请求结束，不假定远端业务未执行 |
| oversize | IOException: response exceeds 128 bytes | 服务发送 129 字节；客户端检测上限并关闭正文流 |

::: warning 转换中断异常时保留停止信号

IOException 表示 I/O 失败，不应与正常 HTTP 错误状态混为一谈。send 还可能抛出 InterruptedException：能够传播时向上抛出；转换为应用异常时应恢复中断状态并保留 cause，不能吞掉停止信号继续无限重试。

:::

示例验证的是回环 HTTP/1.1、固定文本和上述三种故障。没有执行 TLS、HTTP/2、流式慢正文总截止或第三方接口兼容测试，不能将其当作已经覆盖这些能力的生产封装。

## 五、重定向、重试与结果不确定性

| 问题 | 默认设计建议 | 判断依据 |
|------|------|------|
| 创建订单响应丢失 | 查询结果或使用幂等键重试 | 请求可能已在远端成功 |
| 多次重试 | 限制次数、退避和总时间预算 | 每次重试都消耗连接及远端容量 |
| 重定向 | 明确允许的目标与凭证传播规则 | 目标可能跨主机，认证信息不能任意转发 |
| 错误正文 | 限量读取并脱敏记录必要字段 | 错误页不一定符合成功 DTO |
| HTTP/2 偏好 | 检查 response.version 的实际结果 | 客户端偏好不等于对端协商结果 |

::: tip 保留调用证据并限制敏感日志

本例采用 Redirect.NEVER，让重定向保持为可见响应。日志可以记录状态码、调用耗时和请求关联标识，避免记录 Authorization、Cookie 或完整订单隐私字段。重试和取消无法撤销已经发生的远端副作用，必须依靠服务端业务契约。

:::

同步 send 的职责是提供清晰的请求与响应边界。多请求并行、CompletableFuture 异常组合和取消传播属于并发主题，此处保留单次同步调用与资源关闭闭环。
