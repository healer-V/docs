---
title: "字节流、字符流与字符编码"
tags:
  - Java
  - IO
  - UTF-8
excerpt: "区分字节传输、文本解码和缓冲层，使用可运行程序复现部分读取、跨块 UTF-8 解码、flush 与关闭传播，验证非法编码和一次读取造成的截断，明确内存及记录长度边界。"
date: 2026-09-08
---

# 字节流、字符流与字符编码

<div id="java-i-o-与-nio"></div>

字节流处理原始二进制数据，字符流按字符集把字节转换为文本。订单 CSV 的传输长度以字节计，字段解析面对的是字符；图片和压缩包则不能经过 Reader 解码再编码，否则无法保证字节保持不变。

<div id="_1-inputstream-与-outputstream"></div>
<div id="_1-reader-与-writer"></div>
<div id="三、字符流"></div>
<div id="二、字节流"></div>

## 一、读取单位与结束条件

| 层次 | 输入 / 输出 | 返回值与处理单位 |
|------|------|------|
| 字节 | InputStream / OutputStream | read() 返回 0～255，-1 表示结束 |
| 字节块 | read(byte[]) / write(byte[], off, len) | 返回实际读取数量，可能小于数组长度 |
| 字符 | Reader / Writer | 以 char 单元读取或写入，不能用字节长度替代 |
| 文本行 | BufferedReader.readLine() | 返回不含行终止符的字符串，null 表示结束 |

一次 read 不代表一条业务记录。读取量受当前可用数据、流实现和缓冲区空间影响；复制时必须只写出本次实际获得的长度，否则尾部会混入旧字节。普通阻塞 InputStream 的非零长度读取在正常契约下会读到至少一个字节、遇到结束或失败，不能把 available()==0 当作结束。[InputStream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html)

::: warning 便捷读取方法不替代长度检查与关闭

readNBytes 会尝试累计到要求的数量，但提前结束时仍可能少于请求值，调用方需要检查长度。readAllBytes、transferTo 不代替资源关闭；它们也不自动提供业务上的输入上限。

:::

## 二、编码必须跨读取块保持状态

### 1. 跨块解码保留未完成字符

UTF-8 中的一个字符可能占多个字节，一次底层读取可以停在字符中间。对每个字节块单独 new String，会使半个字符被错误处理；InputStreamReader 内部维护解码状态，可以跨块完成字符。

把缓冲区增大只能改变边界出现的位置，不能保证每次读取都刚好停在完整字符之后。正确处理需要让同一个解码器延续未完成的序列，直到取得后续字节或确认输入结束；分块负责控制传输量，解码器负责保持文本连续性。

### 2. 编码合法与字段有效分开检查

::: tip 严格文本输入需要显式报告解码错误

对订单编号和金额等字段，静默替换非法字节可能改变业务含义。需要严格输入时，应将 CharsetDecoder 的 malformed 和 unmappable 策略设置为 REPORT；这与“指定 UTF-8”是两个独立决定。解码成功只表示字节符合字符集规则，仍需校验 CSV 格式和业务字段。[CharsetDecoder](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/CharsetDecoder.html)

:::

字符数也应说明计量单位。String.length() 返回 UTF-16 代码单元数，不能作为所有 Unicode 字符或用户可见字符的通用数量。CSV 的引号、嵌入换行、BOM 和分隔符属于文本格式，Reader 不会自动把一行解析成完整 CSV 记录。

<div id="_1-为什么需要缓冲流"></div>
<div id="四、缓冲流"></div>

## 三、缓冲、flush 与包装流所有权

缓冲层先累积小块数据，再交给下层，目的是减少调用次数；缓冲大小是否改善实际吞吐需要测量。flush 把当前层的数据推给下层，不等同于文件刷盘，也不等同于对端确认收到订单。[BufferedOutputStream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/BufferedOutputStream.html)

| 操作 | 可以证明什么 | 不能据此推导什么 |
|------|------|------|
| buffered.write | 数据被当前流接收 | 底层已经得到全部数据 |
| buffered.flush | 当前缓冲推送给下层 | 操作系统或磁盘已永久保存 |
| 包装流 close | 按实现契约释放包装链资源 | 所有任意自定义流都拥有底层资源 |
| PrintWriter.checkError | 检查该打印流记录的错误状态 | 所有 Writer 都会吞掉 IOException |

::: tip 包装流必须明确关闭所有权

接收调用方借出的流时，应将“不负责关闭”写入 API 契约；自己构造完整包装链时，由外层 try-with-resources 管理。若多个包装步骤可能在构造中失败，应确保先取得的真实资源也处于独立的资源管理范围内，具体异常保留规则见[资源生命周期](./04-resource-lifecycle.md)。

:::

## 四、复现部分读取与跨块解码

以下完整 Java 21 程序将每次读取限制为最多两个字节，保证中文 UTF-8 数据会跨块。CloseTrackingOutput 只记录 close 的传播，不把内存流当作真实文件关闭行为的替代品；输入大小固定为 16 字节。

保存为 `ByteCharacterStreamsDemo.java`：

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看ByteCharacterStreamsDemo的完整代码

```java
// ByteCharacterStreamsDemo.java
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/** 用受控内存数据验证部分读取、UTF-8解码和包装流关闭。 */
public final class ByteCharacterStreamsDemo {
    /** 禁止实例化命令行示例。 */
    private ByteCharacterStreamsDemo() {}

    /** 每次块读取最多返回两个字节，使部分读取可以确定性复现。 */
    private static final class SmallChunks extends ByteArrayInputStream {
        /** 使用非空输入数组初始化内存流。 */
        private SmallChunks(byte[] bytes) {
            super(bytes);
        }

        /**
         * 按父类契约校验目标范围，并限制本次读取长度。
         * @param target 非空目标数组
         * @param offset 起始下标，必须位于数组有效范围
         * @param length 请求长度，非负且不超过剩余数组空间
         * @return 实际读取数量；无数据时为-1，零长度请求为0
         */
        @Override
        public synchronized int read(byte[] target, int offset, int length) {
            java.util.Objects.checkFromIndexSize(offset, length, target.length);
            return length == 0 ? 0 : super.read(target, offset, Math.min(length, 2));
        }
    }

    /** 记录外层包装器是否将close传递到底层；不模拟真实文件关闭后的读写行为。 */
    private static final class CloseTrackingOutput extends ByteArrayOutputStream {
        private boolean closed;

        /** 记录关闭调用并按内存流契约关闭，无返回值。 */
        @Override
        public void close() throws IOException {
            closed = true;
            super.close();
        }
    }

    /** 严格解码给定UTF-8字节；错误输入抛出字符编码异常，返回第一行文本。 */
    private static String decodeLine(byte[] bytes) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new SmallChunks(bytes), StandardCharsets.UTF_8.newDecoder()
                        .onMalformedInput(CodingErrorAction.REPORT)
                        .onUnmappableCharacter(CodingErrorAction.REPORT)))) {
            return reader.readLine();
        }
    }

    /** 正常观察编码和缓冲；malformed与single-read分别暴露编码和截断错误。 */
    public static void main(String[] args) throws IOException {
        String text = "订单,ORD-1001\n";
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        if (args.length > 0 && args[0].equals("malformed")) {
            decodeLine(new byte[] {(byte) 0xC3, 0x28});
            return;
        }
        byte[] copied;
        int firstRead;
        try (InputStream input = new SmallChunks(bytes);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8];
            firstRead = input.read(buffer);
            output.write(buffer, 0, firstRead);
            if (args.length > 0 && args[0].equals("single-read")) {
                if (firstRead != bytes.length) {
                    throw new IOException("incomplete order: " + firstRead + "/" + bytes.length);
                }
            }
            int count;
            while ((count = input.read(buffer)) != -1) {
                output.write(buffer, 0, count);
            }
            copied = output.toByteArray();
        }
        assert Arrays.equals(bytes, copied);
        assert decodeLine(bytes).equals("订单,ORD-1001");
        assert !new String(bytes, StandardCharsets.ISO_8859_1).equals(text);
        CloseTrackingOutput target = new CloseTrackingOutput();
        try (BufferedOutputStream buffered = new BufferedOutputStream(target, 32)) {
            buffered.write(bytes);
            assert target.size() == 0;
            System.out.println("before flush bytes=" + target.size());
            buffered.flush();
            assert target.size() == bytes.length;
            System.out.println("after flush bytes=" + target.size());
        }
        assert target.closed;
        System.out.println("UTF-16 units=" + text.length() + ", UTF-8 bytes=" + bytes.length);
        System.out.println("first read=" + firstRead + ", copied=" + copied.length);
        System.out.println("decoded line matches=true, wrapped target closed=" + target.closed);
    }
}
```

:::

在本篇示例目录执行以下 PowerShell 命令，断言会核对完整字节、解码结果和关闭标记：

```powershell
javac -encoding UTF-8 -d out ByteCharacterStreamsDemo.java
java -ea -cp out ByteCharacterStreamsDemo
```

实际输出显示，第一次读取只有 2 字节，循环最终保留了全部 16 字节；flush 前底层还没有收到数据：

```text
before flush bytes=0
after flush bytes=16
UTF-16 units=12, UTF-8 bytes=16
first read=2, copied=16
decoded line matches=true, wrapped target closed=true
```

## 五、编码失败与无界输入的处理

以下两条命令应分别执行，均预期非零退出。single-read 中的异常是应用在检测到不完整结果后主动抛出的；普通 read 不会因为没有填满数组就自动报错。

```powershell
java -ea -cp out ByteCharacterStreamsDemo malformed
java -ea -cp out ByteCharacterStreamsDemo single-read
```

| 参数 | 实测结果 | 正确处理 |
|------|------|------|
| malformed | MalformedInputException | 拒绝不符合 UTF-8 的输入，核对发送方编码；不要静默替换关键字段 |
| single-read | IOException: incomplete order: 2/16 | 持续读取并检查真实帧或记录边界 |
| 正常程序中的错误字符集对照 | ISO-8859-1 解码结果与原文不同 | 编解码两端约定相同字符集，而不是依赖“没有抛异常” |

::: warning 按行读取仍可能遇到巨大记录

内存流用于小型夹具不会占用文件句柄，但会保存完整数据。生产导入除分块读取外，还必须限制总大小和单条记录长度；readLine 也可能遇到没有换行的巨大记录。不能为了避免 readAllBytes 就认定按行读取已经具备完整内存边界。

:::

该程序验证了块处理和字符解码，没有模拟磁盘故障、网络背压或外部 CSV 解析器。需要精确管理位置与剩余字节时，使用[NIO Buffer 与 Channel](./07-nio-buffers-channels.md)的状态模型；采用该模型仍然需要保留跨块字符或消息数据。

## 六、文件、缓冲区与对象格式的分工

<div id="_1-file-基本操作"></div>
<div id="_2-文件字节流读写"></div>
<div id="_2-文本文件读写"></div>
<div id="一、file-类"></div>
<div id="七、files-工具类-java-7"></div>
<div id="_1-path-路径操作"></div>
<div id="八、path-与-paths"></div>

文件读写需要先明确目标路径和覆盖方式，再选择字节或字符接口。历史 File API 可以通过 toPath 与 Path 互操作；实际文件创建、复制、属性读取和临时目录清理由[Path 与 Files](./05-path-files.md)提供可运行示例。处理大文件时可以用 Files.newInputStream 获得字节流，或用显式字符集的 Files.newBufferedReader 获得字符流，仍需遵守关闭与输入上限。

<div id="_1-buffer"></div>
<div id="_2-channel"></div>
<div id="_3-selector"></div>
<div id="六、nio"></div>

NIO 将数据位置显式放到 Buffer 中，Channel 负责传输，Selector 只对可选择通道提供就绪通知。[NIO Buffer 与 Channel](./07-nio-buffers-channels.md)给出状态和部分读写证据，普通文件通道不因名称包含 NIO 就变为非阻塞。文本跨块时的解码状态与 Buffer 的位置状态都必须保留。

<div id="_1-serializable-接口"></div>
<div id="五、序列化与反序列化"></div>

ObjectInputStream 和 ObjectOutputStream 建立在字节流之上，但它们恢复的是 Java 对象图，拥有不同的类型、版本和输入风险。[序列化与数据交换边界](./08-serialization-boundaries.md)负责 Serializable、字段恢复及过滤规则；字符流只负责文本转换，不能替对象协议解决兼容或安全问题。
