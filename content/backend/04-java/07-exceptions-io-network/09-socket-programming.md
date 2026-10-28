---
title: "Socket 与应用消息边界"
tags:
  - Java
  - Socket
  - TCP
excerpt: "以本地订单请求响应建立 Socket 生命周期和 TCP 帧模型，提供有长度上限的 UTF-8 协议，验证连续消息、半关闭、超时、超长声明和截断，明确业务重试与传输成功的区别。"
date: 2026-09-08
---

# Socket 与应用消息边界

TCP Socket 提供有序字节流，应用协议决定字节如何组成消息。一次 write 可以被对端分多次 read 获得，多次 write 也可以被一起读到；订单号、请求编号和响应含义需要协议自己定义。

## 一、监听器与连接各自的生命周期

ServerSocket 绑定本地地址和端口，通过 accept 获得独立 Socket。监听器负责接收新连接，已经接收的 Socket 负责当前客户端通信，关闭其中一个并不等于按业务规则管理完另一个。

| 操作 | 作用 | 需要设置的边界 |
|------|------|------|
| 绑定回环地址、端口 0 | 仅供本机访问，由系统分配端口 | 使用真实绑定地址构造客户端目标 |
| ServerSocket.accept | 等待一个连接 | accept 超时和停止时关闭监听器 |
| Socket.connect | 建立到指定目标的连接 | 独立的连接超时 |
| setSoTimeout | 限制阻塞读取等待 | 不是整次请求或写入的总时间预算 |
| shutdownOutput | 声明本端不会继续发送 | 输入方向仍可接收响应 |
| close | 释放当前 Socket | 半关闭不能代替最终关闭 |

::: info 客户端应复用监听器的实际地址

回环地址可能是 IPv4 或 IPv6，客户端应复用服务端实际地址，不能一边绑定 IPv6、一边把目标写死为 IPv4。connect 成功也不能证明服务已经处理订单。[Socket](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/Socket.html)、[ServerSocket](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/ServerSocket.html)

:::

## 二、先定义帧，再处理字节

### 1. 长度前缀约束一条消息的范围

本例协议是“四字节大端有符号整数长度 + 标准 UTF-8 正文”，允许长度为 1～1024 字节。先验证声明长度，再分配数组并累计读取；长度合法但提前 EOF 仍然是协议失败。

| 帧方案 | 适用情况 | 必须处理的问题 |
|------|------|------|
| 固定长度 | 字段数量与宽度固定 | 字节宽度、填充和版本扩展 |
| 分隔符 | 人可读文本协议 | 转义、内容中的分隔符、单帧最大长度 |
| 长度前缀 | 可变长文本或二进制载荷 | 字节序、非法长度、部分读取和截断 |
| 连接结束 | 单次上传后关闭输出 | 无法直接复用同一方向发送后续消息 |

::: warning 读取长度和字符编码仍由协议约束

DataInputStream.readInt 负责读取四字节整数，但不会替应用验证业务长度；readNBytes 也需要检查实际返回数量。writeUTF/readUTF 使用 modified UTF-8，不能当作本例的标准 UTF-8 格式直接替换。[DataInputStream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/DataInputStream.html)

:::

### 2. 半关闭结束方向，不代替帧边界

客户端连续发送两个订单帧后 shutdownOutput，服务端读取两帧并观察 EOF，再发送一帧确认。这验证“请求方向已结束，响应方向仍可用”。生产中的长连接协议一般用请求编号与帧边界管理请求，不依赖每个请求都半关闭连接。

本例的等待关系需要两端共同遵守：服务端把请求方向的 EOF 作为可以发确认的条件，客户端必须先结束输出，再等待响应。如果客户端只 flush 后就等待，而服务端仍等待 EOF，两端会互相等待，直到超时或连接被关闭。flush 只推进当前缓冲数据，不能表达“以后不会再发送”。

## 三、运行本地请求响应

::: info 回环夹具只管理一次本地连接

以下完整程序使用 Java 21，无外部服务。监听端口动态分配并打印，正常及故障流程结束时关闭客户端、服务端连接、监听器和执行器。Future 用于把工作线程的错误交回入口，不展开异步业务编排。

:::

保存为 `SocketProgrammingDemo.java`：

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看SocketProgrammingDemo的完整代码

```java
// SocketProgrammingDemo.java
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.FilterInputStream;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/** 在回环地址验证两个请求帧、半关闭及三类响应故障。 */
public final class SocketProgrammingDemo {
    private static final int MAX_FRAME = 1024;

    /** 禁止实例化命令行示例。 */
    private SocketProgrammingDemo() {}


    /** 限制应用层每次块读取长度；不声称改变TCP实际分段。 */
    private static final class SmallReads extends FilterInputStream {
        /** 包装当前Socket的非空输入流，生命周期仍由Socket管理。 */
        private SmallReads(InputStream input) {
            super(input);
        }

        /**
         * 将合法请求范围限制为两个字节，保证完整帧需要多次块读取。
         * @param target 非空目标数组
         * @param offset 非负起始下标，不超过数组长度
         * @param length 非负请求长度，不超过目标剩余空间
         * @return 实际读取量；流结束为-1，零长度请求为0
         */
        @Override
        public int read(byte[] target, int offset, int length) throws IOException {
            java.util.Objects.checkFromIndexSize(offset, length, target.length);
            return length == 0 ? 0 : in.read(target, offset, Math.min(length, 2));
        }
    }

    /**
     * 写出四字节大端长度和标准UTF-8载荷，不关闭借用的流。
     * @param output 非空、打开的当前连接输出流
     * @param message 非空文本，编码长度必须在1到1024字节之间
     */
    private static void writeFrame(DataOutputStream output, String message) throws IOException {
        byte[] bytes = message.getBytes(StandardCharsets.UTF_8);
        if (bytes.length == 0 || bytes.length > MAX_FRAME) {
            throw new IOException("invalid outgoing frame length");
        }
        output.writeInt(bytes.length);
        output.write(bytes);
        output.flush();
    }

    /** 读取一个完整且有界的UTF-8帧，返回正文；借用流由Socket所有者关闭。 */
    private static String readFrame(DataInputStream input) throws IOException {
        int length = input.readInt();
        if (length <= 0 || length > MAX_FRAME) {
            throw new IOException("invalid frame length: " + length);
        }
        byte[] bytes = input.readNBytes(length);
        if (bytes.length != length) {
            throw new EOFException("truncated frame: " + bytes.length + "/" + length);
        }
        return StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(bytes)).toString();
    }

    /**
     * 接受一个连接，读两个请求和输出结束信号，再返回正常或故障响应。
     * @param server 已绑定回环地址并设置accept超时的监听器
     * @param mode normal、oversize、truncated或read-timeout
     * @param release 客户端结束时释放的闩锁，慢响应最多等待3秒
     * @return 已验证的服务端处理结果
     */
    private static String serveOnce(ServerSocket server, String mode, CountDownLatch release)
            throws IOException, InterruptedException {
        try (Socket socket = server.accept()) {
            socket.setSoTimeout(3000);
            DataInputStream input = new DataInputStream(new SmallReads(socket.getInputStream()));
            DataOutputStream output = new DataOutputStream(socket.getOutputStream());
            String first = readFrame(input);
            String second = readFrame(input);
            if (!first.equals("ORD-1001") || !second.equals("ORD-1002") || input.read() != -1) {
                throw new IOException("unexpected request sequence");
            }
            switch (mode) {
                case "oversize" -> {
                    output.writeInt(MAX_FRAME + 1);
                    output.flush();
                }
                case "truncated" -> {
                    output.writeInt(10);
                    output.write(new byte[] {65, 66});
                    output.flush();
                    socket.shutdownOutput();
                }
                case "read-timeout" -> {
                    if (!release.await(3, TimeUnit.SECONDS)) {
                        throw new IOException("client did not finish within fixture deadline");
                    }
                }
                default -> writeFrame(output, "ACK:ORD-1001,ORD-1002");
            }
            return "requests=2, peer output ended=true";
        }
    }

    /** 运行一次本地通信；所有故障保留到入口，关闭Socket、监听器和执行器。 */
    public static void main(String[] args) throws Exception {
        String mode = args.length == 0 ? "normal" : args[0];
        CountDownLatch release = new CountDownLatch(1);
        try (ExecutorService worker = Executors.newSingleThreadExecutor();
             ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
            server.setSoTimeout(3000);
            System.out.println("listener=" + server.getLocalSocketAddress());
            // 服务回调交由Future传播错误，避免只在工作线程打印堆栈。
            Future<String> served = worker.submit(() -> serveOnce(server, mode, release));
            IOException clientFailure = null;
            try (Socket client = new Socket()) {
                client.connect(new InetSocketAddress(server.getInetAddress(), server.getLocalPort()), 1500);
                client.setSoTimeout(mode.equals("read-timeout") ? 200 : 1500);
                DataOutputStream output = new DataOutputStream(client.getOutputStream());
                DataInputStream input = new DataInputStream(new SmallReads(client.getInputStream()));
                writeFrame(output, "ORD-1001");
                writeFrame(output, "ORD-1002");
                client.shutdownOutput();
                String response = readFrame(input);
                assert response.equals("ACK:ORD-1001,ORD-1002");
                System.out.println("response=" + response);
            } catch (IOException failure) {
                clientFailure = failure;
            } finally {
                release.countDown();
            }
            try {
                String serverResult = served.get(4, TimeUnit.SECONDS);
                if (clientFailure == null) {
                    System.out.println(serverResult);
                }
            } catch (ExecutionException failure) {
                if (clientFailure != null) {
                    clientFailure.addSuppressed(failure.getCause());
                } else {
                    throw failure;
                }
            }
            if (clientFailure != null) {
                throw clientFailure;
            }
        }
        System.out.println("listener and worker closed=true");
    }
}
```

:::

在本篇示例目录执行以下 PowerShell 命令。程序只监听一次连接，不能作为常驻服务使用：

```powershell
javac -encoding UTF-8 -d out SocketProgrammingDemo.java
java -ea -cp out SocketProgrammingDemo
```

一次实测输出如下，listener 中的地址表示形式和端口会随环境、运行次数变化：

```text
listener=localhost/127.0.0.1:7842
response=ACK:ORD-1001,ORD-1002
requests=2, peer output ended=true
listener and worker closed=true
```

这个结果证明两帧按应用协议独立解析，客户端半关闭后仍能接收确认。SmallReads 将应用层块读取限制为最多两个字节，确定性验证累计读取还原完整帧；它没有改变或证明 TCP 的实际分段方式。

## 四、验证超时、超长声明与截断

下面三条命令应单独执行，每条都会建立自己的回环监听器并预期非零退出。没有访问不可达公网地址来“碰运气”制造超时。

```powershell
java -ea -cp out SocketProgrammingDemo oversize
java -ea -cp out SocketProgrammingDemo truncated
java -ea -cp out SocketProgrammingDemo read-timeout
```

| 参数 | 服务端夹具行为 | 实测错误与处理 |
|------|------|------|
| oversize | 声明正文长度 1025 | IOException: invalid frame length: 1025；分配前拒绝并关闭连接 |
| truncated | 声明 10 字节，仅发送 2 字节后半关闭 | EOFException: truncated frame: 2/10；丢弃不完整响应 |
| read-timeout | 读取请求后等待客户端结束，不发送响应 | SocketTimeoutException；终止本次读取并释放连接 |

::: warning 读取超时后不能无条件重试下一帧

读取超时后 Socket 不一定已经自动关闭，应用需要决定继续当前协议还是放弃。本文发生协议故障后直接关闭，因为已经消费了多少字节会影响恢复位置；不能在原连接上无条件从“下一条帧头”重新尝试。

:::

## 五、生产协议仍需补齐的能力

| 场景 | 额外能力 | 原因 |
|------|------|------|
| 客户端持续缓慢发送 | 总请求截止时间与速率限制 | 每次 read 均未超时仍可长期占用连接 |
| 多客户端接入 | 并发连接上限、调度和拒绝策略 | 单次夹具不具备服务容量治理 |
| 订单创建响应丢失 | 幂等键、服务端去重与结果查询 | 客户端超时不能证明远端没有执行 |
| 不可信网络 | TLS、身份认证和授权 | 明文 Socket 不提供这些保证 |
| 长连接复用 | 请求编号、帧状态、心跳及有界队列 | 仅靠 TCP 保序不能完成业务关联 |

::: tip 为完整请求建立统一时间预算

传统 Socket 没有通过 setSoTimeout 提供通用写入截止时间；本例只向本地受控端点发送小帧。生产实现应把连接、读取、写入、处理和重试纳入同一时间预算。非阻塞状态模型见[NIO Buffer 与 Channel](./07-nio-buffers-channels.md)，数据格式的可信边界见[序列化与数据交换](./08-serialization-boundaries.md)。

:::
