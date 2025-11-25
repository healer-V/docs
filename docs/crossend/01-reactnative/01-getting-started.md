# 入门指南

本指南将帮助你快速上手 React Native 开发，从环境搭建到创建第一个应用，循序渐进地介绍 React Native 的核心概念和开发流程。

## 环境搭建

### 选择开发方式

React Native 提供了两种主要的开发方式：

- **Expo**：官方推荐的快速开始方式，无需配置复杂的原生开发环境
- **React Native CLI**：更接近原生开发的方式，需要配置 iOS 和 Android 开发环境

#### Expo 环境配置

Expo 是 React Native 官方推荐的快速入门方式，它提供了一套完整的开发工具和服务，让你可以快速构建、测试和发布 React Native 应用。

##### 1. 安装必要工具

- **Node.js** (>= 16.0)：建议使用 LTS 版本
- **npm** 或 **Yarn**：包管理工具

##### 2. 安装 Expo CLI

```bash
# 使用 npm 安装
npm install -g expo-cli

# 或者使用 Yarn 安装
yarn global add expo-cli
```

##### 3. 创建新项目

```bash
# 创建一个名为 MyFirstProject 的新项目
expo init MyFirstProject

# 选择 blank 模板（推荐初学者使用）
```

##### 4. 启动开发服务器

```bash
# 进入项目目录
cd MyFirstProject

# 启动开发服务器
expo start
```

执行完上述命令后，Expo DevTools 会在浏览器中打开，你可以通过以下方式查看应用：

- **Expo Go 应用**：在 iOS 或 Android 设备上下载 Expo Go 应用，然后扫描终端或浏览器中显示的二维码
- **iOS 模拟器**：在 macOS 上，按 `i` 在 iOS 模拟器中运行
- **Android 模拟器**：按 `a` 在 Android 模拟器中运行

#### React Native CLI 环境配置

如果你需要更接近原生开发的体验，或者计划在现有原生应用中集成 React Native，可以使用 React Native CLI。

##### 1. 安装必要工具

- **Node.js** (>= 16.0)：建议使用 LTS 版本
- **JDK** (Java Development Kit)：推荐安装 JDK 11
- **Android Studio**：用于 Android 开发
- **Xcode**：用于 iOS 开发（仅限 macOS）

##### 2. 安装 React Native CLI

```bash
# 使用 npm 安装
npm install -g react-native-cli

# 或者使用 Yarn 安装
yarn global add react-native-cli
```

##### 3. Android 开发环境配置

1. 安装 Android Studio 最新版本
2. 在 Android Studio 中安装 Android SDK、Android SDK Platform-tools 和 Android SDK Build-tools
3. 配置 ANDROID_HOME 环境变量
4. 创建并配置 Android 虚拟设备 (AVD)

##### 4. iOS 开发环境配置（仅限 macOS）

1. 安装 Xcode 最新版本
2. 安装 Xcode Command Line Tools
3. 安装 CocoaPods

```bash
sudo gem install cocoapods
```

##### 5. 创建新项目

```bash
# 创建一个名为 MyFirstProject 的新项目
react-native init MyFirstProject --template react-native-template-typescript
```

##### 6. 运行应用

- **iOS** (仅限 macOS)：
  ```bash
  cd MyFirstProject
  react-native run-ios
  ```

- **Android**：
  ```bash
  cd MyFirstProject
  react-native run-android
  ```

## 项目结构

### Expo 项目结构

```
MyFirstProject/
├── assets/              # 静态资源（图片、字体等）
│   ├── icon.png         # 应用图标
│   └── splash.png       # 启动屏幕
├── node_modules/        # 依赖包
├── App.js               # 主应用组件
├── app.json             # Expo 配置文件
├── babel.config.js      # Babel 配置
└── package.json         # 项目配置和依赖
```

### React Native CLI 项目结构

```
MyFirstProject/
├── android/             # Android 原生代码
├── ios/                 # iOS 原生代码
├── node_modules/        # 依赖包
├── src/                 # 推荐创建的源代码目录
│   ├── components/      # 自定义组件
│   ├── screens/         # 页面组件
│   ├── navigation/      # 导航配置
│   ├── services/        # API 服务
│   └── utils/           # 工具函数
├── App.js               # 主应用组件
├── index.js             # 应用入口文件
└── package.json         # 项目配置和依赖
```

## 创建你的第一个应用

让我们使用 Expo 创建一个简单的问候应用，来了解 React Native 的基本开发流程。

### 步骤 1：初始化项目

```bash
# 创建一个名为 HelloReactNative 的新项目
expo init HelloReactNative --template blank
cd HelloReactNative
```

### 步骤 2：修改 App.js

打开 `App.js` 文件，替换为以下代码：

```jsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';

export default function App() {
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('');

  const handlePress = () => {
    setGreeting(`你好，${name || '陌生人'}！`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>React Native 欢迎你</Text>
        
        <Text style={styles.label}>请输入你的名字：</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="输入你的名字"
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>打招呼</Text>
        </TouchableOpacity>
        
        {greeting ? (
          <Text style={styles.greeting}>{greeting}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  greeting: {
    fontSize: 20,
    textAlign: 'center',
    color: '#333',
    marginTop: 20,
  },
});
```

### 步骤 3：运行应用

```bash
# 启动开发服务器
expo start
```

然后使用以下方式之一查看应用：

- **Expo Go 应用**：在 iOS 或 Android 设备上下载 Expo Go 应用，然后扫描终端或浏览器中显示的二维码
- **iOS 模拟器**：在 macOS 上，按 `i` 在 iOS 模拟器中运行
- **Android 模拟器**：按 `a` 在 Android 模拟器中运行

### 步骤 4：修改应用

现在，让我们对应用进行一些修改，添加更多功能，比如计数器功能：

```jsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';

export default function App() {
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [count, setCount] = useState(0);

  const handlePress = () => {
    setGreeting(`你好，${name || '陌生人'}！`);
  };

  const incrementCount = () => {
    setCount(count + 1);
  };

  const decrementCount = () => {
    setCount(count - 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>React Native 欢迎你</Text>
        
        <Text style={styles.label}>请输入你的名字：</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="输入你的名字"
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>打招呼</Text>
        </TouchableOpacity>
        
        {greeting ? (
          <Text style={styles.greeting}>{greeting}</Text>
        ) : null}

        <View style={styles.divider} />

        <Text style={styles.subtitle}>计数器功能</Text>
        <View style={styles.counterContainer}>
          <TouchableOpacity 
            style={[styles.counterButton, styles.decrementButton]} 
            onPress={decrementCount}
          >
            <Text style={styles.counterButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.counterValue}>{count}</Text>
          
          <TouchableOpacity 
            style={[styles.counterButton, styles.incrementButton]} 
            onPress={incrementCount}
          >
            <Text style={styles.counterButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  greeting: {
    fontSize: 20,
    textAlign: 'center',
    color: '#333',
    marginTop: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 30,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  counterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incrementButton: {
    backgroundColor: '#4CAF50',
  },
  decrementButton: {
    backgroundColor: '#F44336',
  },
  counterButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  counterValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 30,
    color: '#007AFF',
    minWidth: 50,
    textAlign: 'center',
  },
});
```

保存文件后，你应该能在模拟器或设备上看到应用的变化。这就是热重载的便捷之处！

## 开发工具与技巧

### 推荐的代码编辑器

- **Visual Studio Code**：推荐使用，有丰富的 React Native 插件支持
  - **React Native Tools**：提供调试、代码补全等功能
  - **ESLint**：代码质量检查
  - **Prettier**：代码格式化
  - **Auto Import**：自动导入模块
- **WebStorm**：JetBrains 出品的专业 IDE，对 React Native 有很好的支持

### 调试技巧

#### 1. 使用 Chrome DevTools 调试

1. 在模拟器或真机上运行应用
2. 启用调试模式（摇一摇设备或使用快捷键）
3. 选择 "Debug" 选项
4. 在 Chrome 中打开 http://localhost:8081/debugger-ui/

#### 2. 使用 React Native Debugger

React Native Debugger 是一个功能强大的独立调试工具，它整合了 Chrome DevTools 和 React DevTools：

```bash
# macOS 安装方式
brew update && brew install --cask react-native-debugger

# 启动
open -a "React Native Debugger"
```

#### 3. 使用 Expo DevTools

当你使用 `expo start` 启动开发服务器时，Expo DevTools 会在浏览器中打开，提供了以下功能：

- 查看应用在不同设备上的效果
- 管理应用状态和日志
- 安装和管理依赖包
- 配置应用设置

### 热重载与实时重载

- **热重载**：只重新加载修改的组件，保持应用状态
- **实时重载**：重新加载整个应用，丢失应用状态

在模拟器中启用：
1. 摇一摇设备或使用快捷键（iOS: Cmd+D, Android: Cmd+M）
2. 选择 "Enable Hot Reloading" 或 "Enable Live Reload"

## 常见问题与解决方案

### 环境搭建问题

#### Q: 安装依赖时遇到权限问题
A: 在 Linux 或 macOS 上，尝试使用 `sudo` 命令；在 Windows 上，尝试以管理员身份运行命令提示符。

#### Q: 模拟器无法启动
A: 确保已正确安装和配置了 iOS 模拟器或 Android 模拟器，并且模拟器已启动。对于 Android，检查是否已创建 AVD（Android Virtual Device）。

#### Q: 找不到 SDK 路径
A: 确保已正确设置 ANDROID_HOME 环境变量，并将 Android SDK 的 tools 和 platform-tools 目录添加到 PATH 中。

### 开发过程问题

#### Q: 应用在设备上白屏
A: 检查网络连接，确保设备可以访问开发服务器；尝试重启开发服务器和应用；检查控制台是否有错误信息。

#### Q: 热重载不工作
A: 确保在 Expo DevTools 中启用了热重载功能；尝试手动刷新应用（iOS: Cmd+R, Android: Ctrl+R）；检查是否有语法错误导致热重载失败。

#### Q: 依赖包安装失败
A: 尝试删除 node_modules 目录和 package-lock.json 或 yarn.lock 文件，然后重新安装依赖：

```bash
rm -rf node_modules
rm package-lock.json  # 或 rm yarn.lock
npm install  # 或 yarn install
```

### 运行时错误

#### Q: Failed to load bundle
A: 尝试重置 Metro Bundler 缓存：

```bash
# Expo 项目
expo start --clear

# React Native CLI 项目
react-native start --reset-cache
```

## 下一步学习

现在你已经成功创建了你的第一个 React Native 应用，接下来你可以学习：

- [基础组件](./02-basic-components.md)：了解 React Native 的核心组件，如 View、Text、Image 等
- [样式与布局](./03-styling-and-layout.md)：学习如何使用 StyleSheet 和 Flexbox 设计美观的用户界面
- [导航](./04-navigation.md)：学习如何在应用中实现页面跳转和导航
- [状态管理](./05-state-management.md)：学习如何管理应用的状态
- [网络请求](./06-networking.md)：学习如何在 React Native 中进行网络请求

## 资源推荐

- [React Native 官方文档](https://reactnative.dev/docs/getting-started)：最权威的学习资源
- [React Native 中文网](https://reactnative.cn/)：官方文档的中文翻译
- [Expo 官方文档](https://docs.expo.dev/)：Expo 开发的完整指南
- [React Native Express](http://www.reactnativeexpress.com/)：简洁明了的 React Native 教程
- [React Native 社区论坛](https://github.com/react-native-community/discussions-and-proposals)：与其他开发者交流和分享经验