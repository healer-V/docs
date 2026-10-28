---
title: "NIO 缓冲区与通道"
tags:
  - Java
  - NIO
excerpt: "建立 Buffer 的位置与边界模型，通过完整示例验证 flip、compact、clear、部分写入和文件往返，定位溢出及只读错误，明确非阻塞、直接缓冲区和内存映射的适用边界。"
date: 2026-09-08
---

# NIO 缓冲区与通道 {#nio-buffer-与-channel}

Buffer 保存待传输或待消费的数据，Channel 连接缓冲区与文件、网络等 I/O 端点。Channel.read 把数据放入 Buffer，Channel.write 从 Buffer 取出数据，因此“读”和“写”必须说明是相对于通道还是缓冲区。

## 一、位置与有效区间

### 1. 相对位置与容量不变量

Buffer 的基本不变量是 `0 <= position <= limit <= capacity`。capacity 是容量，limit 是当前不能继续越过的边界，position 是下一次相对操作的位置。remaining 等于 limit-position。

::: warning 缓冲区状态错误不一定抛出异常

所谓读模式和写模式是程序使用方式，不是 Buffer 保存的独立布尔状态。遗漏 flip 不一定抛出异常，也可能读到原本不属于有效数据的字节，因此必须检查状态和结果。[Buffer API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/Buffer.html)

:::

### 2. 填充与消费切换 {#_2-flip-与-compact-连接填充和消费}

填充后调用 flip，用已写到的位置确定可读边界；消费后若还有未读数据，使用 compact 将它们保留在开头，再接收新数据。这里“读写模式切换”实际改变的是位置和边界，数据是否属于完整消息仍由应用协议判断。

以下状态变化对应本例中的 8 字节缓冲区：

| 操作 | position | limit | 观察重点 |
|------|------|------|------|
| allocate(8) | 0 | 8 | 可以填入数据 |
| put 四个字节 | 4 | 8 | 已写区间为 0～3 |
| flip | 0 | 4 | 有效读取范围收缩到四字节 |
| get 两次 | 2 | 4 | 仍有两个未读字节 |
| compact | 2 | 8 | 未读数据移到开头，后方可以继续接收 |
| 再 put 两字节并 flip | 0 | 4 | 两个旧字节和两个新字节组成完整区间 |

### 3. clear、rewind 与标记的使用条件

clear 重设位置和边界，不清除数据；rewind 将 position 归零并保留 limit，用于重读当前有效区间。mark/reset 用于保存和恢复位置，但 flip、clear、rewind 等操作会丢弃标记，不能跨状态切换假定 mark 仍然有效。

三种重用需求不能混为一谈：全部数据已消费、准备重新填充时可以 clear；需要重读同一有效区间时使用 rewind；部分内容尚未消费而要继续填充时才需要 compact。对仍有未读内容的缓冲区执行 clear，虽然旧字节还在，却失去了它们作为待消费数据的边界，后续写入也可能覆盖它们。

## 二、Channel 处理实际传输数量

read 返回本次读入数量、零进展或结束标记 -1；write 返回本次写出数量。成功调用不保证处理完所有 remaining 字节。每次传输都会推进参与的 Buffer 的 position，重复写入时不应重新 rewind，否则会把已发送数据再次发出。

| 通道场景 | 对零进展的处理 | 不能采用的假设 |
|------|------|------|
| 本文受控的阻塞式写入 | 作为异常终止并报告 | 永久重试一定有进展 |
| 非阻塞网络写入 | 保存剩余 Buffer，等待可写条件 | write 返回 0 就是连接关闭 |
| FileChannel 文件读取 | 根据实际读取量消费，-1 才结束 | 一次 read 一定填满数组 |
| transferTo / transferFrom | 累计实际数量并设置无进展策略 | API 名称代表一次复制全部内容 |

::: info 普通文件通道不能注册到 Selector

FileChannel 不是 SelectableChannel，不能注册到 Selector 监听普通文件就绪。NIO 不自动等于异步或非阻塞；非阻塞网络还需要通道模式、就绪事件、待发送队列与背压设计。[FileChannel](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/FileChannel.html)

:::

## 三、验证状态变化与完整字节传输

以下 Java 21 程序通过每次最多写两个字节的夹具确定性复现部分写入，再使用 FileChannel 完成临时订单文件往返。固定输入只有 15 字节，先完整收集字节再解码；大文本应使用能保留跨块状态的字符解码器。

保存为 `NioBuffersChannelsDemo.java`：

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看NioBuffersChannelsDemo的完整代码

```java
// NioBuffersChannelsDemo.java
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.ClosedChannelException;
import java.nio.channels.FileChannel;
import java.nio.channels.WritableByteChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;

/** 验证Buffer状态变化与部分写入，不依赖操作系统恰好发生短写。 */
public final class NioBuffersChannelsDemo {
    /** 禁止实例化命令行示例。 */
    private NioBuffersChannelsDemo() {}

    /** 最多写出两个字节的通道夹具，用于确定性观察position推进。 */
    private static final class SmallWrites implements WritableByteChannel {
        private final ByteArrayOutputStream output = new ByteArrayOutputStream();
        private boolean open = true;

        /** 从当前位置最多取两个字节，返回写出数量；关闭后拒绝写入。 */
        @Override
        public int write(ByteBuffer source) throws IOException {
            if (!open) {
                throw new ClosedChannelException();
            }
            int count = Math.min(2, source.remaining());
            for (int index = 0; index < count; index++) {
                output.write(source.get());
            }
            return count;
        }

        /** 返回本夹具通道是否仍然打开。 */
        @Override
        public boolean isOpen() {
            return open;
        }

        /** 标记关闭；内存结果仍可供断言读取，无返回值。 */
        @Override
        public void close() {
            open = false;
        }
    }

    /**
     * 将剩余字节写完；本例要求阻塞式且有进展的通道。
     * @param channel 非空、打开且可写的通道
     * @param buffer 非空、已设定读取区间的缓冲区
     * @return 实际写入总量；出现零进展时失败，避免套用于非阻塞忙循环
     */
    private static int writeFully(WritableByteChannel channel, ByteBuffer buffer) throws IOException {
        int total = 0;
        while (buffer.hasRemaining()) {
            int count = channel.write(buffer);
            if (count == 0) {
                throw new IOException("write made no progress");
            }
            total += count;
        }
        return total;
    }

    /** 展示状态并验证临时文件；overflow、underflow和readonly暴露状态使用错误。 */
    public static void main(String[] args) throws IOException {
        ByteBuffer buffer = ByteBuffer.allocate(8);
        if (args.length > 0) {
            switch (args[0]) {
                case "overflow" -> buffer.put(new byte[9]);
                case "underflow" -> buffer.flip().get();
                case "readonly" -> buffer.asReadOnlyBuffer().put((byte) 1);
                default -> throw new IllegalArgumentException("unknown mode");
            }
            return;
        }
        buffer.put(new byte[] {1, 2, 3, 4}).flip();
        System.out.println("flip: position=" + buffer.position() + ", limit=" + buffer.limit());
        buffer.get();
        buffer.get();
        buffer.compact();
        assert buffer.position() == 2 && buffer.limit() == 8;
        buffer.put(new byte[] {5, 6}).flip();
        byte[] remaining = new byte[buffer.remaining()];
        buffer.get(remaining);
        assert Arrays.equals(remaining, new byte[] {3, 4, 5, 6});
        System.out.println("compact retained + appended=" + Arrays.toString(remaining));
        buffer.clear();
        assert buffer.get(0) == 3;
        System.out.println("clear: position=" + buffer.position() + ", limit=" + buffer.limit()
                + ", first byte=" + buffer.get(0));

        byte[] order = "订单,ORD-1001".getBytes(StandardCharsets.UTF_8);
        try (SmallWrites target = new SmallWrites()) {
            int written = writeFully(target, ByteBuffer.wrap(order));
            assert Arrays.equals(order, target.output.toByteArray());
            System.out.println("partial writes total=" + written);
        }
        Path file = Files.createTempFile("java-order-nio-", ".bin");
        IOException primary = null;
        try {
            try (FileChannel channel = FileChannel.open(file, StandardOpenOption.READ,
                    StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING)) {
                writeFully(channel, ByteBuffer.wrap(order));
                channel.position(0);
                ByteBuffer chunk = ByteBuffer.allocate(2);
                ByteArrayOutputStream result = new ByteArrayOutputStream();
                int count;
                while ((count = channel.read(chunk)) != -1) {
                    if (count == 0) {
                        throw new IOException("read made no progress");
                    }
                    chunk.flip();
                    while (chunk.hasRemaining()) {
                        result.write(chunk.get());
                    }
                    chunk.clear();
                }
                // 先收集受控小输入的完整字节，避免对UTF-8半个字符逐块解码。
                assert Arrays.equals(order, result.toByteArray());
                assert result.toString(StandardCharsets.UTF_8).equals("订单,ORD-1001");
                System.out.println("file round trip=true");
            }
        } catch (IOException failure) {
            primary = failure;
            throw failure;
        } finally {
            try {
                Files.deleteIfExists(file);
            } catch (IOException cleanup) {
                if (primary != null) {
                    primary.addSuppressed(cleanup);
                } else {
                    throw cleanup;
                }
            }
        }
        assert !Files.exists(file);
    }
}
```

:::

在本篇示例目录执行以下 PowerShell 命令。临时文件仅由当前程序创建，通道关闭后删除：

```powershell
javac -encoding UTF-8 -d out NioBuffersChannelsDemo.java
java -ea -cp out NioBuffersChannelsDemo
```

实际输出中，compact 保留了 3、4 并追加 5、6；clear 后第一个字节仍为 3：

```text
flip: position=0, limit=4
compact retained + appended=[3, 4, 5, 6]
clear: position=0, limit=8, first byte=3
partial writes total=15
file round trip=true
```

::: warning 阻塞式完整写入不能直接用于非阻塞循环

writeFully 遇到零进展立即失败，是本示例阻塞式调用的明确策略。它不能直接作为非阻塞 SocketChannel 的发送循环；这种调用需要把剩余状态交回事件循环，而不是占用线程不断重试。

:::

## 四、根据缓冲区状态定位失败

以下命令分别运行，预期非零退出。错误全部由真实 Buffer API 触发：

```powershell
java -ea -cp out NioBuffersChannelsDemo overflow
java -ea -cp out NioBuffersChannelsDemo underflow
java -ea -cp out NioBuffersChannelsDemo readonly
```

| 参数 | 实测异常 | 定位证据与修复 |
|------|------|------|
| overflow | BufferOverflowException | 8 字节空间放入 9 字节；分批填充或按可信上限分配 |
| underflow | BufferUnderflowException | 新缓冲区 flip 后 limit 为 0；在读取前确认有效数据数量 |
| readonly | ReadOnlyBufferException | 只读视图不能修改内容；检查共享数据的可写契约 |

::: warning 视图位置独立不代表底层数据独立

slice、duplicate 和只读视图可以共享底层内容，独立的位置状态不等于深拷贝。通过另一可写视图修改共享内容，仍可能被只读视图观察到。Buffer 自身也不提供并发访问的安全保证，跨线程共享需要明确所有权或同步。

:::

## 五、直接缓冲区、字节序与文件能力

ByteBuffer 的多字节数值读写依赖 ByteOrder，协议必须规定字节序；文本字符集和整数大小端是不同问题。allocate 得到堆缓冲区，allocateDirect 得到直接缓冲区；直接缓冲区的分配回收成本及内存统计方式需要纳入评估，不能由名称推断“小数据一定更快”。[ByteBuffer](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/ByteBuffer.html)

| 能力 | 可考虑的场景 | 必须验证的边界 |
|------|------|------|
| FileChannel 指定位置读写 | 固定偏移记录或索引 | 与共享当前位置读写的差别、并发修改策略 |
| 分散读 / 聚集写 | 协议头与消息体分开保存 | 数组形式仍不保证整条消息一次完成 |
| force | 要求将修改推进到底层存储 | 文件系统、设备与元数据持久化范围 |
| 内存映射 | 大文件特定区域随机访问 | 映射生命周期、文件截断、平台文件占用 |
| transferTo | 文件到通道复制 | 部分传输、零进展及平台优化差异 |

::: info 示例没有验证吞吐与内存映射

本例没有做吞吐测量或内存映射实验，因此只验证 API 状态与完整性。旧式逐块直接 decode 容易截断多字节字符，文本边界应采用[字符流与字符编码](./06-byte-character-streams.md)中的连续解码方式。

:::
