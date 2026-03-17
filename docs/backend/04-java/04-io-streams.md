---
title: "Java I/O 与 NIO"
category: "后端 · Java"
tags:
  - Java
  - IO
  - NIO
  - 文件操作
date: 2026-03-17
---

# Java I/O 与 NIO

Java I/O 体系提供了从低级字节操作到高级文件 API 的完整支持。传统 I/O（BIO）采用阻塞式读写，NIO 引入了 Buffer、Channel、Selector 机制，支持非阻塞和多路复用，适合高并发网络编程。

## 一、File 类

### 1. File 基本操作

`java.io.File` 代表文件或目录的路径抽象，不直接读写内容，只做路径和元信息操作。

::: details File 操作示例

```java
import java.io.File;
import java.io.IOException;

// 创建 File 对象（不会自动创建文件）
File file = new File("data/config.txt");
File dir  = new File("data/logs");

// 创建文件/目录
file.getParentFile().mkdirs(); // 递归创建父目录
file.createNewFile();          // 创建空文件，若已存在返回 false
dir.mkdirs();                  // 创建多级目录

// 元信息查询
System.out.println(file.exists());        // 是否存在
System.out.println(file.isFile());        // 是否是文件
System.out.println(file.isDirectory());   // 是否是目录
System.out.println(file.length());        // 文件大小（字节）
System.out.println(file.lastModified());  // 最后修改时间戳
System.out.println(file.getAbsolutePath()); // 绝对路径

// 列出目录内容
File[] children = dir.listFiles();
File[] txtFiles = dir.listFiles(f -> f.getName().endsWith(".txt"));

// 重命名 / 移动
file.renameTo(new File("data/config_bak.txt"));

// 删除（目录非空时需递归删除）
file.delete();
```

:::

::: tip
Java 7 引入的 `Files` 工具类和 `Path` API 更加简洁强大，新项目推荐优先使用，`File` 类主要用于兼容旧代码。
:::

## 二、字节流

### 1. InputStream 与 OutputStream

字节流以 8 位字节为单位传输数据，适合处理图片、音视频、可执行文件等二进制文件。

```
InputStream（抽象）
├── FileInputStream      读取文件
├── ByteArrayInputStream 读取字节数组
└── FilterInputStream
    ├── BufferedInputStream  带缓冲
    └── DataInputStream      读取基本类型

OutputStream（抽象）
├── FileOutputStream     写入文件
├── ByteArrayOutputStream 写入字节数组
└── FilterOutputStream
    ├── BufferedOutputStream 带缓冲
    └── DataOutputStream     写入基本类型
```

### 2. 文件字节流读写

::: details 字节流读写文件示例

```java
import java.io.*;

// 写入文件（try-with-resources 自动关闭流）
try (OutputStream out = new BufferedOutputStream(
        new FileOutputStream("output/photo.jpg"))) {
    byte[] data = fetchImageBytes(); // 获取图片字节数据
    out.write(data);
    out.flush();
}

// 读取文件
try (InputStream in = new BufferedInputStream(
        new FileInputStream("output/photo.jpg"))) {
    byte[] buffer = new byte[8192]; // 8KB 缓冲
    int bytesRead;
    ByteArrayOutputStream result = new ByteArrayOutputStream();
    while ((bytesRead = in.read(buffer)) != -1) {
        result.write(buffer, 0, bytesRead);
    }
    byte[] content = result.toByteArray();
    System.out.println("读取字节数：" + content.length);
}
```

:::

::: warning
必须在 `finally` 块或使用 try-with-resources 关闭流。未关闭流会导致文件句柄泄漏，在高并发或长时间运行的程序中可能耗尽系统资源。
:::

## 三、字符流

### 1. Reader 与 Writer

字符流以 Unicode 字符（通常 2 字节）为单位，自动处理字符编码转换，适合处理文本文件。

```
Reader（抽象）
├── FileReader           读取文件（使用默认编码）
├── InputStreamReader    字节流 → 字符流（可指定编码）
└── BufferedReader       带缓冲，支持 readLine()

Writer（抽象）
├── FileWriter           写入文件
├── OutputStreamWriter   字符流 → 字节流（可指定编码）
├── BufferedWriter       带缓冲
└── PrintWriter          格式化输出
```

### 2. 文本文件读写

::: details 字符流读写文件示例

```java
import java.io.*;
import java.nio.charset.StandardCharsets;

// 写入文本（明确指定 UTF-8 编码）
try (Writer writer = new BufferedWriter(
        new OutputStreamWriter(
            new FileOutputStream("logs/app.log"), StandardCharsets.UTF_8))) {
    writer.write("2026-03-17 INFO 服务启动成功\n");
    writer.write("2026-03-17 INFO 监听端口：8080\n");
}

// 按行读取文本
try (BufferedReader reader = new BufferedReader(
        new InputStreamReader(
            new FileInputStream("logs/app.log"), StandardCharsets.UTF_8))) {
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
}

// Java 8+ 流式读取
try (BufferedReader reader = new BufferedReader(
        new FileReader("logs/app.log", StandardCharsets.UTF_8))) {
    reader.lines()
          .filter(l -> l.contains("ERROR"))
          .forEach(System.out::println);
}
```

:::

::: danger
不要使用 `FileReader`/`FileWriter` 的无参构造（依赖系统默认编码），在不同操作系统上可能产生乱码。始终通过 `InputStreamReader`/`OutputStreamWriter` 明确指定 `StandardCharsets.UTF_8`。
:::

## 四、缓冲流

### 1. 为什么需要缓冲流

无缓冲的流每次 `read()`/`write()` 都触发一次系统调用，开销巨大。缓冲流在内存中维护一个缓冲区（默认 8KB），批量完成实际 I/O，显著提升性能。

::: details 缓冲流性能对比示意

```java
// 不推荐：无缓冲，每字节一次系统调用
try (InputStream in = new FileInputStream("large-file.bin")) {
    int b;
    while ((b = in.read()) != -1) { /* 处理 */ }
}

// 推荐：有缓冲，批量读取
try (InputStream in = new BufferedInputStream(
        new FileInputStream("large-file.bin"), 65536)) { // 64KB 缓冲
    int b;
    while ((b = in.read()) != -1) { /* 处理 */ }
}
```

:::

## 五、序列化与反序列化

### 1. Serializable 接口

实现 `Serializable` 接口的类可以将对象转换为字节流持久化存储或网络传输。

::: details 对象序列化示例

```java
import java.io.*;

public class UserSession implements Serializable {
    private static final long serialVersionUID = 1L; // 版本标识

    private String userId;
    private String token;
    private transient String password; // transient 字段不参与序列化

    // 构造方法、getter/setter 省略...
}

// 序列化：对象 → 字节流
try (ObjectOutputStream oos = new ObjectOutputStream(
        new FileOutputStream("session.dat"))) {
    UserSession session = new UserSession("u001", "abc123token");
    oos.writeObject(session);
}

// 反序列化：字节流 → 对象
try (ObjectInputStream ois = new ObjectInputStream(
        new FileInputStream("session.dat"))) {
    UserSession session = (UserSession) ois.readObject();
    System.out.println(session.getUserId()); // u001
    System.out.println(session.getPassword()); // null（transient）
}
```

:::

::: warning
Java 原生序列化存在安全漏洞（反序列化攻击），且性能较差。实际项目中推荐使用 JSON（Jackson/Gson）、Protobuf 或 Kryo 等替代方案。
:::

## 六、NIO

Java NIO（New I/O）是 Java 1.4 引入的 I/O 替代方案，核心组件为 Buffer、Channel 和 Selector。

### 1. Buffer

`Buffer` 是存储数据的容器，是一块有 `capacity`、`limit`、`position` 三个指针的内存区域。

| 指针 | 含义 |
|------|------|
| `capacity` | 缓冲区总容量，创建后不变 |
| `limit` | 当前可读/写的边界 |
| `position` | 当前读/写位置 |

::: details Buffer 操作示例

```java
import java.nio.ByteBuffer;

// 分配堆内缓冲区
ByteBuffer buffer = ByteBuffer.allocate(1024);

// 写入数据（position 向右移动）
buffer.put("Hello NIO".getBytes());

// 切换为读模式：flip() 将 limit 设为 position，position 归零
buffer.flip();

// 读取数据
byte[] data = new byte[buffer.remaining()];
buffer.get(data);
System.out.println(new String(data)); // Hello NIO

// 清空缓冲区，准备下次写入
buffer.clear();
```

:::

### 2. Channel

`Channel` 是双向的数据传输通道，比 `Stream` 更高效，支持异步操作。

::: details Channel 文件复制示例

```java
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.channels.*;

// 使用 Channel 高效复制文件
public static void copyFile(String src, String dst) throws IOException {
    try (FileChannel inChannel  = new FileInputStream(src).getChannel();
         FileChannel outChannel = new FileOutputStream(dst).getChannel()) {

        // transferTo：零拷贝，利用操作系统 sendfile 系统调用
        inChannel.transferTo(0, inChannel.size(), outChannel);
    }
}

// 手动 Buffer 方式
public static void copyFileWithBuffer(String src, String dst) throws IOException {
    try (FileChannel inCh  = FileChannel.open(Path.of(src), StandardOpenOption.READ);
         FileChannel outCh = FileChannel.open(Path.of(dst),
             StandardOpenOption.WRITE, StandardOpenOption.CREATE)) {

        ByteBuffer buffer = ByteBuffer.allocateDirect(65536); // 直接缓冲区（堆外）
        while (inCh.read(buffer) != -1) {
            buffer.flip();
            outCh.write(buffer);
            buffer.clear();
        }
    }
}
```

:::

### 3. Selector

`Selector` 允许单个线程监控多个 `Channel` 的 I/O 事件，是实现非阻塞 I/O 多路复用的关键。

::: details Selector 非阻塞服务端示例

```java
import java.io.IOException;
import java.net.*;
import java.nio.*;
import java.nio.channels.*;
import java.util.Iterator;

public class NioServer {
    public static void main(String[] args) throws IOException {
        // 创建并配置 ServerSocketChannel
        ServerSocketChannel serverChannel = ServerSocketChannel.open();
        serverChannel.configureBlocking(false);
        serverChannel.bind(new InetSocketAddress(8080));

        // 创建 Selector 并注册接受连接事件
        Selector selector = Selector.open();
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);

        ByteBuffer buffer = ByteBuffer.allocate(1024);

        while (true) {
            selector.select(); // 阻塞直到有事件就绪
            Iterator<SelectionKey> keys = selector.selectedKeys().iterator();

            while (keys.hasNext()) {
                SelectionKey key = keys.next();
                keys.remove();

                if (key.isAcceptable()) {
                    // 接受新连接
                    SocketChannel client = serverChannel.accept();
                    client.configureBlocking(false);
                    client.register(selector, SelectionKey.OP_READ);

                } else if (key.isReadable()) {
                    // 读取客户端数据
                    SocketChannel client = (SocketChannel) key.channel();
                    buffer.clear();
                    int bytesRead = client.read(buffer);
                    if (bytesRead == -1) {
                        client.close();
                    } else {
                        buffer.flip();
                        System.out.println("收到：" + new String(buffer.array(), 0, bytesRead));
                    }
                }
            }
        }
    }
}
```

:::

## 七、Files 工具类（Java 7+）

`java.nio.file.Files` 提供了大量静态方法，是操作文件的最简洁方式。

::: details Files 常用操作示例

```java
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.List;

Path src  = Path.of("src/data.csv");
Path dst  = Path.of("backup/data.csv");
Path dir  = Path.of("backup");

// 目录与文件操作
Files.createDirectories(dir);                  // 递归创建目录
Files.copy(src, dst, StandardCopyOption.REPLACE_EXISTING); // 复制
Files.move(src, dst, StandardCopyOption.ATOMIC_MOVE);      // 移动/重命名
Files.delete(dst);                             // 删除（不存在则异常）
Files.deleteIfExists(dst);                     // 删除（不存在则忽略）

// 读写文本（小文件）
String content = Files.readString(src, StandardCharsets.UTF_8);
List<String> lines = Files.readAllLines(src, StandardCharsets.UTF_8);
Files.writeString(dst, content, StandardCharsets.UTF_8);

// 读写字节
byte[] bytes = Files.readAllBytes(src);
Files.write(dst, bytes);

// 流式遍历目录（惰性求值）
try (var stream = Files.walk(dir)) {
    stream.filter(Files::isRegularFile)
          .filter(p -> p.toString().endsWith(".log"))
          .forEach(System.out::println);
}

// 文件属性
System.out.println(Files.size(src));           // 文件大小
System.out.println(Files.exists(src));         // 是否存在
System.out.println(Files.isReadable(src));     // 是否可读
```

:::

## 八、Path 与 Paths

### 1. Path 路径操作

`Path` 表示文件系统路径，提供跨平台的路径操作 API。

::: details Path 操作示例

```java
import java.nio.file.*;

// 创建 Path（Java 11+ 直接用 Path.of）
Path absolute = Path.of("/home/user/projects/app");
Path relative = Path.of("src", "main", "java"); // src/main/java

// 路径分解
System.out.println(absolute.getFileName()); // app
System.out.println(absolute.getParent());   // /home/user/projects
System.out.println(absolute.getRoot());     // /
System.out.println(absolute.getNameCount()); // 4（路径段数量）

// 路径拼接
Path filePath = absolute.resolve("config.yml"); // /home/user/projects/app/config.yml

// 路径规范化（处理 . 和 ..）
Path messy = Path.of("/home/user/../user/./projects");
System.out.println(messy.normalize()); // /home/user/projects

// 相对路径计算
Path from = Path.of("/home/user/projects");
Path to   = Path.of("/home/user/downloads/file.zip");
System.out.println(from.relativize(to)); // ../downloads/file.zip

// 转换
Path absolutePath = relative.toAbsolutePath(); // 转为绝对路径
File file = absolute.toFile();                  // 与 File 互转
```

:::

::: tip
`Path.of()` 是 Java 11 引入的工厂方法，是 `Paths.get()` 的等价替代。新代码推荐使用 `Path.of()`，语义更清晰。
:::
