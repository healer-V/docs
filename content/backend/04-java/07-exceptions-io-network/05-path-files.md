---
title: "Path 与 Files"
tags:
  - Java
  - Path
  - Files
excerpt: "区分路径计算与真实文件操作，通过临时订单文件完成创建、复制、移动、属性读取和清理，验证文件不存在、拒绝覆盖与路径越界，说明符号链接、权限和原子移动的边界。"
date: 2026-09-08
---

# Path 与 Files

`Path` 表示文件系统路径，`Files` 执行文件和目录操作。构造一个 Path 不会创建文件，也不能证明文件存在。订单导入需要分别解决“路径指向哪里”和“以什么方式打开或修改文件”，不能把拼接字符串当作完整的文件访问策略。

## 一、路径计算与文件系统访问

| 操作 | 作用 | 是否验证文件存在 |
|------|------|------|
| Path.of | 按文件系统规则解析路径 | 否 |
| resolve | 将子路径组合到基础路径；绝对子路径会改变组合结果 | 否 |
| normalize | 按语法消除冗余路径元素 | 否 |
| toAbsolutePath | 结合默认目录获得绝对路径 | 否 |
| relativize | 计算兼容路径之间的相对路径 | 否 |
| toRealPath | 取得已存在目标的真实路径，默认解析符号链接 | 是 |

相对路径受进程工作目录影响，不能假定始终相对于源码文件。服务中的存储根目录应由部署配置明确提供；测试可以创建自己拥有的临时目录。Windows 盘符、文件系统提供者和绝对/相对形式不同，会影响路径是否能进行 relativize 等操作。[Path API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Path.html)

## 二、创建、覆盖与结果检查

::: danger 归档写入必须显式防止覆盖

文件操作要把覆盖策略写进实际调用。先 exists 再写入存在检查与使用之间的竞态；使用 CREATE_NEW 才能把“目标必须不存在”交给创建操作检查。默认 writeString 可能创建或截断现有文件，不能用于默认禁止覆盖的订单归档。

:::

| 场景 | API 或选项 | 失败处理 |
|------|------|------|
| 新文件必须唯一 | writeString 配合 CREATE_NEW | 已存在时拒绝，不覆盖后重试 |
| 复制到新归档名 | copy，不提供 REPLACE_EXISTING | 目标冲突时重新分配名称或人工确认 |
| 同文件系统发布成品 | move，可请求 ATOMIC_MOVE | 不支持时按一致性要求选择终止或明确降级 |
| 查看大小、类型和时间 | readAttributes | 属性仅反映读取时刻，操作仍可能失败 |
| 删除已知临时文件 | deleteIfExists | 不存在可接受，权限错误仍应处理 |

原子移动控制名称切换的可见性，不等同于崩溃后的持久化承诺。ATOMIC_MOVE 不受所有文件系统支持；不要捕获异常后无条件退化为普通移动，再继续声称具备原子发布能力。复制也不是一项通用事务，失败后目标可能不完整。[Files API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html)

## 三、在临时目录完成文件操作

::: info 示例只操作自行创建的临时目录

以下 Java 21 完整示例只创建自己的临时目录和三个固定文件名。正常流程是写入 orders.csv、复制、移动为 archived.csv、读取并关闭目录流，最后删除本例创建的路径。清理失败会保留为异常，不会静默忽略。

:::

保存为 `PathFilesDemo.java`：

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看PathFilesDemo的完整代码

```java
// PathFilesDemo.java
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.stream.Stream;

/** 在独占临时目录演示路径与文件操作，不读取或删除业务目录。 */
public final class PathFilesDemo {
    /** 禁止实例化命令行示例。 */
    private PathFilesDemo() {}

    /** 仅持有本例创建的目录和固定文件名，负责有限范围清理。 */
    private static final class Workspace implements AutoCloseable {
        private final Path root;

        /** 获得临时目录；成功返回后由调用方关闭。 */
        private Workspace() throws IOException {
            root = Files.createTempDirectory("java-order-files-").toAbsolutePath().normalize();
        }

        /** 删除本例固定名称的文件后删除目录；失败继续清理并保留附加异常，无返回值。 */
        @Override
        public void close() throws IOException {
            IOException failure = null;
            for (Path path : new Path[] {root.resolve("archived.csv"), root.resolve("copy.csv"),
                    root.resolve("orders.csv"), root}) {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException cleanup) {
                    if (failure == null) {
                        failure = cleanup;
                    } else {
                        failure.addSuppressed(cleanup);
                    }
                }
            }
            if (failure != null) {
                throw failure;
            }
        }
    }

    /**
     * 解析受控临时目录下的相对文件名，只提供词法边界检查。
     * @param root 非空、绝对且已规范化的独占目录
     * @param input 非空相对路径，不能指向根目录本身或越出root
     * @return 规范化后位于root之下的路径；不防御符号链接或并发替换
     */
    private static Path resolveInside(Path root, String input) {
        Path relative = Path.of(input);
        Path candidate = root.resolve(relative).normalize();
        if (relative.isAbsolute() || !candidate.startsWith(root) || candidate.equals(root)) {
            throw new IllegalArgumentException("path outside order directory");
        }
        return candidate;
    }

    /** 执行文件闭环；missing、exists、traversal参数分别暴露必要的失败分支。 */
    public static void main(String[] args) throws IOException {
        Path createdRoot;
        try (Workspace workspace = new Workspace()) {
            createdRoot = workspace.root;
            Path source = resolveInside(createdRoot, "orders.csv");
            Files.writeString(source, "ORD-1001,2\n", StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
            String mode = args.length == 0 ? "normal" : args[0];
            switch (mode) {
                case "missing" -> Files.readString(createdRoot.resolve("missing.csv"));
                case "exists" -> Files.writeString(source, "replacement", StandardOpenOption.CREATE_NEW);
                case "traversal" -> resolveInside(createdRoot, "../outside.csv");
                default -> {
                    Path copy = createdRoot.resolve("copy.csv");
                    Path archive = createdRoot.resolve("archived.csv");
                    Files.copy(source, copy);
                    Files.move(copy, archive);
                    BasicFileAttributes attributes = Files.readAttributes(archive, BasicFileAttributes.class);
                    assert attributes.isRegularFile() && attributes.size() == 11;
                    assert Files.readString(archive, StandardCharsets.UTF_8).equals("ORD-1001,2\n");
                    assert archive.toRealPath().equals(source.getParent().toRealPath().resolve("archived.csv"));
                    try (Stream<Path> entries = Files.list(createdRoot)) {
                        assert entries.count() == 2;
                    }
                    System.out.println("archive=" + createdRoot.relativize(archive));
                    System.out.println("regular=" + attributes.isRegularFile() + ", bytes=" + attributes.size());
                    System.out.println("content=ORD-1001,2; entries=2");
                }
            }
        }
        assert !Files.exists(createdRoot);
        System.out.println("temporary directory removed=true");
    }
}
```

:::

在本篇示例目录执行以下 PowerShell 命令；无需业务目录或外部依赖：

```powershell
javac -encoding UTF-8 -d out PathFilesDemo.java
java -ea -cp out PathFilesDemo
```

实际输出如下。11 表示 UTF-8 字节数，目录流关闭后清理才会执行：

```text
archive=archived.csv
regular=true, bytes=11
content=ORD-1001,2; entries=2
temporary directory removed=true
```

Files.list 只读取直接子项，Files.walk 可遍历子树；两者返回的 Stream 都应关闭，不能只消费后丢弃。walk 的深度和是否跟随链接应明确限定。需要处理访问失败、跳过子树和访问后回调时，可以使用 walkFileTree。遍历顺序不应被当作业务顺序，需要排序时应显式排序。

## 四、验证拒绝覆盖与输入边界

三条故障命令各自创建独立临时目录，即使抛出异常也执行清理。每条命令应单独执行，预期非零退出：

```powershell
java -ea -cp out PathFilesDemo missing
java -ea -cp out PathFilesDemo exists
java -ea -cp out PathFilesDemo traversal
```

| 参数 | 实测异常 | 定位与处理 |
|------|------|------|
| missing | NoSuchFileException | 目标没有创建；核对输入路径和生产者流程，不能返回空文件伪装成功 |
| exists | FileAlreadyExistsException | CREATE_NEW 拒绝覆盖已有 orders.csv；按业务规则分配新名 |
| traversal | IllegalArgumentException: path outside order directory | ../outside.csv 规范化后越出根目录；在文件操作前拒绝 |

::: info 动态临时路径不能写成固定预期值

堆栈中的临时目录名称每次不同，不应写死路径作为预期输出。示例没有实施真实权限拒绝或符号链接攻击测试，因此不将这两项列为运行验证结果。

:::

## 五、路径安全与跨平台权限

示例使用 Path.startsWith 比较路径元素，避免将“order”和“orders-backup”的字符串前缀误判为包含关系。它还拒绝绝对输入和根目录本身，但这仍只是词法检查：允许目录中的符号链接可能指向外部，检查后的目标也可能被并发替换。

| 约束 | 设计措施 | 仍需确认的条件 |
|------|------|------|
| 不可信上传名称 | 服务端生成存储名，展示名独立保存 | 扩展名和媒体类型不能单独证明内容可信 |
| 只读已有文件 | 校验真实路径与允许根目录的关系 | 校验和打开之间仍可能发生替换 |
| 多用户可修改同一目录 | 隔离目录权限，按提供者能力考虑 SecureDirectoryStream | 不是所有文件系统都支持同样的能力 |
| 跨平台权限设置 | 检查 POSIX、DOS 或 ACL 属性视图 | 不把 Linux 权限位直接套到 Windows |

::: warning 禁止跟随链接不等于整条路径安全

NOFOLLOW_LINKS 只在支持该选项的具体操作中控制跟随行为，不能作为所有路径组件都安全的通用保证。生产文件访问还应限制目录权限和身份；示例的独占临时目录只用于验证 API 行为。

:::

readString 和 readAllBytes 会在内存中保留完整内容，适用于大小受控的文件。大文件应采用[字节流与字符流](./06-byte-character-streams.md)分块处理，并同时限制单条记录长度、总输入量和处理时间。
