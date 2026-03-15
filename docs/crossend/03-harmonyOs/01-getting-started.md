---
title: "HarmonyOS 快速入门"
category: "跨端 · HarmonyOS"
tags:
  - HarmonyOS
excerpt: "本章节将引导您快速上手 HarmonyOS 应用开发，包括环境搭建、创建第一个应用以及基本开发流程。 | 操作系统 | 版本要求 | |---------|----------| | Windows | Windows 10 64位（版本 ..."
---

# HarmonyOS 快速入门

本章节将引导您快速上手 HarmonyOS 应用开发，包括环境搭建、创建第一个应用以及基本开发流程。

## 1. 环境搭建

### 1.1 系统要求

| 操作系统 | 版本要求 |
|---------|----------|
| Windows | Windows 10 64位（版本 1903 及以上） |
| macOS | 10.14 及以上版本 |
| Linux | Ubuntu 18.04/20.04 64位 |

### 1.2 开发工具安装

HarmonyOS 推荐使用 DevEco Studio 作为开发工具，它基于 IntelliJ IDEA Community 开源版本开发，提供了完整的 HarmonyOS 应用开发能力。

#### 1.2.1 安装 DevEco Studio

1. **下载 DevEco Studio**
   - 访问 [HarmonyOS 开发者官网](https://developer.harmonyos.com/cn/develop/deveco-studio#download) 下载最新版本的 DevEco Studio
   - 根据您的操作系统选择对应的安装包

2. **安装 DevEco Studio**
   - **Windows**：运行下载的安装程序，按照向导完成安装
   - **macOS**：双击下载的 DMG 文件，将 DevEco Studio 拖入 Applications 文件夹
   - **Linux**：解压下载的压缩包，运行 `deveco-studio.sh` 脚本进行安装

3. **首次启动配置**
   - 启动 DevEco Studio，阅读并同意用户协议
   - 配置 SDK 存储路径（建议使用默认路径）
   - DevEco Studio 将自动下载并安装最新的 SDK 和工具链

#### 1.2.2 安装 Node.js

- HarmonyOS 开发需要 Node.js 14.19.1 或更高版本
- 访问 [Node.js 官网](https://nodejs.org/zh-cn/) 下载并安装适合您操作系统的 Node.js
- 安装完成后，在命令行中运行 `node -v` 和 `npm -v` 验证安装是否成功

#### 1.2.3 安装 JDK

- DevEco Studio 内置了 JDK，通常无需单独安装
- 如果需要使用独立的 JDK，推荐使用 OpenJDK 17

### 1.3 配置开发环境

#### 1.3.1 配置 SDK

1. 启动 DevEco Studio
2. 点击 **File > Settings > HarmonyOS SDK**（Windows/Linux）或 **DevEco Studio > Preferences > HarmonyOS SDK**（macOS）
3. 在 **SDK Platforms** 标签页中，选择需要安装的 SDK 版本，点击 **Apply** 进行安装
4. 在 **SDK Tools** 标签页中，选择需要安装的工具，点击 **Apply** 进行安装

#### 1.3.2 配置模拟器

1. 点击 DevEco Studio 工具栏中的 **Tools > Device Manager**
2. 选择 **Phone** 或其他设备类型
3. 点击 **New Device**，选择设备型号和系统版本
4. 点击 **Next**，完成模拟器创建
5. 选择创建好的模拟器，点击 **Start** 启动

## 2. 创建第一个应用

### 2.1 新建项目

1. 启动 DevEco Studio
2. 点击 **Create HarmonyOS Project**
3. 选择项目模板：
   - **Empty Ability**：空模板，适合从零开始开发
   - **Native C++**：包含 C++ 支持的模板，适合需要原生功能的应用
   - **Template Gallery**：查看更多模板
4. 点击 **Next**，进入项目配置页面：
   - **Project Name**：输入项目名称（如 "MyFirstHarmonyApp"）
   - **Package Name**：输入包名（如 "com.example.myfirstharmonyapp"）
   - **Save Location**：选择项目保存位置
   - **Compile SDK**：选择编译 SDK 版本
   - **Model**：选择应用模型（推荐使用 "Stage" 模型）
   - **Language**：选择开发语言（推荐使用 "eTS"，即 ArkTS）
5. 点击 **Finish**，DevEco Studio 将创建项目并初始化

### 2.2 项目结构

创建项目后，您将看到以下主要目录结构：

```
MyFirstHarmonyApp/
├── AppScope/
│   └── resources/
│       └── base/
│           ├── element/
│           ├── media/
│           └── profile/
├── entry/
│   ├── src/
│   │   └── main/
│   │       ├── ets/
│   │       │   ├── entryability/
│   │       │   └── pages/
│   │       ├── resources/
│   │       └── module.json5
│   ├── build-profile.json5
│   └── hvigorfile.ts
├── build-profile.json5
├── hvigorfile.ts
└── package.json
```

**主要目录说明：**

- **AppScope**：存放应用全局配置信息，如应用名称、版本号等
- **entry**：应用的主模块
  - **src/main/ets**：存放 ArkTS 源码
    - **entryability**：应用入口，处理应用生命周期
    - **pages**：存放应用页面
  - **src/main/resources**：存放资源文件，如图片、字符串、样式等
  - **module.json5**：模块配置文件

### 2.3 运行应用

1. 确保模拟器已启动或真机已连接
2. 在 DevEco Studio 中，点击工具栏中的 **Run** 按钮（绿色三角形）
3. 选择要运行的设备
4. DevEco Studio 将编译应用并部署到设备上
5. 等待应用启动，您将看到应用界面

## 3. 应用结构详解

### 3.1 应用模型

HarmonyOS 提供了两种应用模型：

1. **Stage 模型**（推荐）
   - 基于 AbilityStage 组件，提供更灵活的组件化开发能力
   - 支持多 HAP（HarmonyOS Ability Package）开发
   - 提供更丰富的生命周期管理

2. **FA（Feature Ability）模型**
   - 传统的应用模型，基于 PageAbility 组件
   - 结构相对简单，适合小型应用

### 3.2 Stage 模型结构

Stage 模型的应用结构主要包括：

- **AbilityStage**：应用的主入口，管理应用的生命周期
- **UIAbility**：提供 UI 交互的能力组件，相当于一个页面容器
- **ExtensionAbility**：提供特定扩展功能的能力组件，如后台服务、输入法等

### 3.3 页面结构

在 Stage 模型中，页面由以下部分组成：

- **页面文件**（如 `Index.ets`）：定义页面的 UI 和逻辑
- **路由配置**：管理页面间的导航
- **状态管理**：管理页面和应用的状态

## 4. 修改应用

让我们修改默认创建的应用，添加一些交互功能。

### 4.1 查看默认页面

打开 `entry/src/main/ets/pages/Index.ets` 文件，您将看到默认生成的代码：

```typescript
@Entry
@Component
struct Index {
  @State message: string = 'Hello World'

  build() {
    Row() {
      Column() {
        Text(this.message)
          .fontSize(50)
          .fontWeight(FontWeight.Bold)
      }
      .width('100%')
    }
    .height('100%')
  }
}
```

### 4.2 添加交互功能

修改 `Index.ets` 文件，添加一个按钮和计数功能：

```typescript
@Entry
@Component
struct Index {
  @State message: string = 'Hello HarmonyOS'
  @State count: number = 0

  build() {
    Row() {
      Column({
        space: 20 // 组件间距
      }) {
        Text(this.message)
          .fontSize(30)
          .fontWeight(FontWeight.Bold)
          .margin({ bottom: 20 })

        Text(`计数: ${this.count}`)
          .fontSize(20)
          .margin({ bottom: 20 })

        Button('点击我')
          .type(ButtonType.Capsule)
          .width(150)
          .height(40)
          .fontSize(16)
          .onClick(() => {
            this.count++
            this.message = `Hello HarmonyOS (${this.count})`
          })
      }
      .width('100%')
      .height('100%')
      .justifyContent(FlexAlign.Center)
      .padding(20)
    }
    .height('100%')
  }
}
```

### 4.3 运行修改后的应用

1. 点击工具栏中的 **Run** 按钮
2. 等待应用重新部署到设备上
3. 测试应用功能：点击按钮，查看计数是否增加，文本是否更新

## 5. 开发工具使用

### 5.1 热重载

DevEco Studio 支持热重载功能，可以在不重启应用的情况下查看代码更改：

1. 修改代码后，按下 **Ctrl+S**（Windows/Linux）或 **Command+S**（macOS）保存
2. 应用将自动重载，您可以立即看到更改效果

### 5.2 DevTools

HarmonyOS DevTools 是一套可视化的调试工具，帮助开发者进行应用调试和性能分析：

1. 点击工具栏中的 **Tools > DevTools**
2. 选择要调试的应用进程
3. DevTools 将在浏览器中打开，包含以下功能：
   - **Elements**：检查和修改 UI 元素
   - **Console**：查看日志和执行 JavaScript 代码
   - **Sources**：查看和调试源代码
   - **Network**：监控网络请求
   - **Performance**：分析应用性能
   - **Memory**：分析内存使用情况

## 6. ArkTS 语言简介

ArkTS 是 HarmonyOS 推荐的开发语言，基于 TypeScript 扩展，提供了更丰富的声明式 UI 开发能力。

### 6.1 基本语法

```typescript
// 变量声明
let message: string = 'Hello HarmonyOS';
const version: number = 1.0;

// 函数定义
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// 类定义
class Person {
  private name: string;
  private age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  getName(): string {
    return this.name;
  }
}
```

### 6.2 声明式 UI 语法

```typescript
@Entry  // 页面入口
@Component  // 组件装饰器
struct MyComponent {
  @State count: number = 0;  // 状态变量

  build() {
    // UI 构建
    Column({
      space: 20
    }) {
      Text(`计数: ${this.count}`)
        .fontSize(20)

      Button('点击我')
        .onClick(() => {
          this.count++;
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
  }
}
```

## 7. 常见问题

### 7.1 环境配置问题

**Q: 安装 SDK 时提示网络错误**
A: 检查网络连接，如使用代理，需要在 DevEco Studio 中配置代理设置。

**Q: 模拟器启动失败**
A: 检查系统是否支持虚拟化技术，确保已启用 CPU 虚拟化。

### 7.2 开发问题

**Q: 代码编译失败**
A: 检查代码语法错误，查看 DevEco Studio 的错误提示。

**Q: 应用启动后白屏**
A: 检查页面代码是否正确，查看日志中的错误信息。

**Q: 无法访问网络**
A: 在 `module.json5` 文件中声明 `ohos.permission.INTERNET` 权限。

## 8. 下一步学习

1. **学习 ArkUI 开发框架**：深入了解声明式 UI 开发
2. **学习状态管理**：掌握组件间的数据传递和状态管理
3. **学习页面路由**：掌握页面间的导航和参数传递
4. **学习网络请求**：了解如何与后端服务交互
5. **学习应用配置**：了解应用的配置和权限管理

通过本章节的学习，您已经成功搭建了 HarmonyOS 开发环境，并创建了第一个应用。下一步，您可以深入学习 HarmonyOS 的核心功能，如 ArkUI 开发框架、状态管理、页面路由等，进一步提升您的开发能力。