---
title: "JDK 21 环境配置"
tags:
  - JDK 21
  - Windows
  - macOS
  - Linux
excerpt: "说明如何选择并安装适配操作系统与 CPU 架构的 JDK 21，配置 JAVA_HOME 和 PATH，并通过编译与运行命令验证开发环境。"
date: 2026-09-02
---

# JDK 21 环境配置 {#jdk-21-安装与环境配置}

Java 开发环境必须同时提供 `java` 启动器和 `javac` 编译器。本篇以 JDK 21 为主线，使用 Oracle 官方安装包命名演示安装过程；企业环境如果统一使用 Eclipse Temurin、Amazon Corretto 或其他 OpenJDK 发行版，应遵守组织规定，并把下载地址、安装目录和更新策略替换为对应发行商的配置。

## 一、安装前确认版本与平台

下载前先确认四项信息：

| 项目 | 如何确认 | 选错后的表现 |
|------|----------|--------------|
| Java 功能版本 | 新项目主线选择 21 | 构建工具拒绝版本，或缺少需要的语言/API 能力 |
| 操作系统 | Windows、macOS 或 Linux | 安装包无法执行 |
| CPU 架构 | x64 或 AArch64/ARM64 | 安装器报错，或二进制不能运行 |
| 发行版和许可证 | 依据企业合规与支持政策 | 生产使用或更新策略不符合组织要求 |

Windows 可以在 PowerShell 中查看系统和架构：

```powershell
Get-CimInstance Win32_OperatingSystem | Select-Object Caption, OSArchitecture
$env:PROCESSOR_ARCHITECTURE
```

macOS 可以执行：

```bash
uname -s
uname -m
```

Linux 可以执行：

```bash
uname -s
uname -m
cat /etc/os-release
```

::: info 在实际安装目标上确认架构

常见输出中，`x86_64` 对应 x64，`aarch64` 或 macOS 的 `arm64` 对应 AArch64。容器、远程服务器和本机的架构可能不同，应在实际安装目标上确认。

:::

## 二、在 Windows x64 安装

Oracle JDK 21 的 Windows 安装文档提供 MSI 和压缩包等方式。需要标准系统安装时，可以下载形如 `jdk-21_windows-x64_bin.msi` 的 MSI 文件，然后在图形安装器中完成安装。

默认安装目录通常形如：

```text
C:\Program Files\Java\jdk-21
```

也可以在管理员 PowerShell 中调用 Windows Installer。命令中的文件名应替换为实际下载文件的绝对路径：

```powershell
msiexec.exe /i "C:\Users\your-name\Downloads\jdk-21_windows-x64_bin.msi"
```

安装完成后，在新的 PowerShell 窗口中确认命令来源：


将以下代码保存为 `HelloJava.java`：

将代码按文中给出的文件名保存在同一个空文件夹中，编码使用 UTF-8。编译和运行命令均在该文件夹执行。

::: details 查看 HelloJava 完整代码

```java [HelloJava.java]
/**
 * 输出第一条 Java 控制台消息。
 */
public final class HelloJava {

    /**
     * 工具类不需要实例化。
     */
    private HelloJava() {
    }

    /**
     * Java 应用入口，输出固定问候语。
     *
     * @param args 启动参数，本示例不使用
     */
    public static void main(String[] args) {
        System.out.println("Hello, Java 21");
    }
}
```

:::


```powershell
Get-Command java | Select-Object -ExpandProperty Source
Get-Command javac | Select-Object -ExpandProperty Source
```

::: tip 先调整命令来源再考虑重新安装

如果命令仍指向旧 JDK，需要调整系统环境变量的顺序，而不是重复安装更多 JDK。

:::

## 三、在 macOS 安装

Oracle JDK 21 为 macOS 提供 x64 和 AArch64 安装包。Intel Mac 选择 x64，Apple 芯片选择 AArch64；下载 `.dmg` 后打开安装器并按提示安装。

JDK 通常安装在下面的系统目录：

```text
/Library/Java/JavaVirtualMachines/
```

系统中存在多个 JDK 时，使用 macOS 自带工具选择 Java 21：

```bash
/usr/libexec/java_home -V
/usr/libexec/java_home -v 21 --exec javac -version
```

为当前终端会话设置 `JAVA_HOME`：

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH="$JAVA_HOME/bin:$PATH"
```

需要在新终端中持续生效时，把这两行加入当前 Shell 的启动配置，例如 Zsh 的 `~/.zshrc`，再打开新终端验证。修改前应确认团队是否使用 SDKMAN!、asdf 或其他版本管理工具，避免两套机制同时控制路径。

## 四、在 Linux 安装

Oracle JDK 21 为 Linux 提供 x64 和 AArch64 的压缩包，并针对部分发行版提供 RPM 或 Debian 包。安装方式应与系统包管理策略一致。

### 1. 使用 Debian 安装包

在 Debian 或 Ubuntu 系统中，进入安装包所在目录后执行：

```bash
sudo dpkg -i jdk-21_linux-x64_bin.deb
```

AArch64 机器需要下载对应架构的包，不能继续使用文件名带 `x64` 的安装包。`dpkg` 报告依赖问题时，应根据系统包管理器提示修复依赖，再重新验证安装状态。

### 2. 使用 RPM 安装包

在采用 RPM 的发行版上，可以执行：

```bash
sudo rpm -ivh jdk-21_linux-x64_bin.rpm
```

生产服务器通常由系统包仓库、镜像或配置管理平台统一安装。直接下载 RPM 只是官方支持的一种方式，不应绕过企业补丁和资产管理策略。

### 3. 使用压缩包

压缩包适合没有管理员权限或需要安装到独立目录的场景：

```bash
tar zxvf jdk-21_linux-x64_bin.tar.gz
```

解压后把目录移动到组织允许的位置，再为当前会话设置环境变量。下面假设实际目录为 `/opt/jdk-21`：

```bash
export JAVA_HOME=/opt/jdk-21
export PATH="$JAVA_HOME/bin:$PATH"
```

不要在没有核对目录的情况下照抄 `/opt/jdk-21`。压缩包解出的真实目录可能包含完整补丁版本，`JAVA_HOME` 必须指向其中含有 `bin/java` 和 `bin/javac` 的 JDK 根目录。

::: tip Linux 包管理优先级
企业 Linux 环境优先采用组织维护的软件源和自动化配置。这样安全补丁、卸载记录和多台机器的一致性更容易管理。
:::

## 五、JAVA_HOME 与 PATH {#五、正确配置-java-home-与-path}

`JAVA_HOME` 指向 JDK 根目录，`PATH` 让 Shell 能直接找到该目录下的命令。二者的职责不同：

| 变量 | 应指向哪里 | 谁会使用 |
|------|------------|----------|
| `JAVA_HOME` | JDK 根目录，不包含 `bin` | Maven、Gradle、应用脚本和部分 IDE |
| `PATH` | 包含 `%JAVA_HOME%\bin` 或 `$JAVA_HOME/bin` | Shell 查找 `java`、`javac` 等命令 |

Windows 当前 PowerShell 会话可以这样设置：

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

这不会永久修改系统配置，关闭窗口后失效。需要持久化时，可以在 Windows“系统属性 → 环境变量”中设置 `JAVA_HOME`，并在 `Path` 中添加 `%JAVA_HOME%\bin`。企业电脑如果由 IT 策略管理，应先确认是否允许修改系统级变量。

配置后同时检查变量值、命令路径和版本：

```powershell
$env:JAVA_HOME
Get-Command java | Select-Object -ExpandProperty Source
Get-Command javac | Select-Object -ExpandProperty Source
java -version
javac -version
```

只看 `JAVA_HOME` 不能证明 Shell 使用了这个 JDK，因为 `PATH` 前方可能还有旧版 `java`。

## 六、用编译和运行完成最终验证

版本命令成功只能证明可执行文件存在。完整开发环境还应实际编译并运行一段代码。

在本篇示例目录执行：

```powershell
New-Item -ItemType Directory -Force out | Out-Null

javac -encoding UTF-8 `
  -d out `
  HelloJava.java

java -cp out HelloJava
```

预期输出为：

```text
Hello, Java 21
```

这条闭环同时验证了四件事：

1. `javac` 可用，说明安装的是完整 JDK；
2. 编译器能读取 UTF-8 源文件；
3. 类文件可以写入指定目录；
4. `java` 能从类路径加载并执行编译结果。

## 七、多 JDK 环境的处理方法

企业电脑同时存在 Java 8 和 Java 21 很常见。不要通过反复安装、删除目录或手工复制 `java.exe` 切换版本，应明确控制每个工具使用哪个 JDK。

| 使用位置 | 需要检查的配置 |
|----------|----------------|
| PowerShell 或 Shell | `JAVA_HOME`、`PATH`、命令实际路径 |
| IntelliJ IDEA 项目 | Project SDK、Language level、模块 SDK |
| Maven | `mvn -version` 输出中的 Java home |
| Gradle | `gradle -version`、Toolchain 或 `org.gradle.java.home` |
| CI/CD | 构建镜像、Runner 工具缓存和流水线环境变量 |
| 生产服务 | 启动脚本使用的绝对路径、服务账户环境变量 |

::: tip 为不同项目固定各自工具链

新项目建议使用构建工具的 Java Toolchain 固定 Java 21，而不是完全依赖开发者机器的默认 `PATH`。Java 8 存量项目则单独配置 Java 8 工具链，避免一个全局切换影响所有项目。

:::

## 八、常见安装问题

### 1. 编译与运行版本不一致 {#_1-java-是-21-但-javac-是-8}

这说明两个命令来自不同安装目录。分别执行 `Get-Command java` 和 `Get-Command javac`，删除或后移 `PATH` 中错误的 JDK 条目，然后打开新终端再次验证。

### 2. IDE 使用的版本与终端不同

IDE 通常维护自己的项目 SDK 配置，不一定读取当前终端会话。先用终端确认 JDK 目录，再把同一路径配置为 IDE 的 Project SDK；随后检查构建工具是否又指定了另一个 Java home。

### 3. JDK 根目录配置错误 {#_3-java-home-指向了-bin}

错误配置形如 `C:\Program Files\Java\jdk-21\bin`。许多构建工具会继续拼接 `bin/java`，最终得到不存在的 `bin/bin/java`。正确值应停在 JDK 根目录 `C:\Program Files\Java\jdk-21`。

### 4. 修改环境变量后版本没有变化

已经打开的终端通常保留旧环境变量。关闭并重新打开终端，再检查命令路径；如果仍未变化，再检查系统级和用户级 `Path` 是否同时存在冲突条目。

## 九、验证范围与官方资料

::: info 区分实测环境与安装指南依据

本文中的 Windows 环境变量、编译和运行命令已在 Windows OpenJDK 21 环境验证。macOS 与 Linux 安装命令依据 Oracle JDK 21 官方安装指南整理，未在当前 Windows 环境实际执行；安装包名称和补丁版本应以下载页当前提供的文件为准。

:::

- [JDK 21 Installation Guide](https://docs.oracle.com/en/java/javase/21/install/) 汇总各平台安装入口。
- [Installing the JDK on Microsoft Windows](https://docs.oracle.com/en/java/javase/21/install/installation-jdk-microsoft-windows-platforms.html) 说明 Windows 安装包和默认目录。
- [Installing the JDK on macOS](https://docs.oracle.com/en/java/javase/21/install/installation-jdk-macos.html) 说明 macOS 架构、DMG 与安装目录。
- [Installing the JDK on Linux](https://docs.oracle.com/en/java/javase/21/install/installation-jdk-linux-platforms.html) 说明压缩包、Debian 和 RPM 安装方式。

生产环境还应记录发行版、完整补丁版本、安装来源和升级责任人。仅写“使用 Java 21”不足以支持漏洞修复和故障复现。
