# 部署与发布

将React Native应用部署到生产环境是开发流程中的重要环节。一个成功的部署流程包括代码优化、应用构建、签名、测试和发布到应用商店等步骤。本章将详细介绍React Native应用的部署与发布流程，帮助你将应用顺利发布到用户手中。

## 准备工作

### 1. 代码优化

在部署前，应该对代码进行优化，确保应用性能良好且没有明显的错误。

#### 移除调试代码

```jsx
// 在生产环境中移除调试代码
if (__DEV__) {
  // 仅在开发环境中执行的代码
  console.log('开发环境调试信息');
  // 启用性能监控
  NativeModules.PerformanceMonitor?.setInteractionTracingEnabled(true);
} else {
  // 生产环境中禁用console
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}
```

#### 优化依赖

移除不必要的依赖，减少应用体积：

```bash
# 检查未使用的依赖
npm install --save-dev depcheck
npx depcheck

# 移除未使用的依赖
npm uninstall <package-name>
```

### 2. 配置文件更新

#### app.json配置

更新`app.json`文件，确保应用信息正确：

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.yourapp"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-font"
    ]
  }
}
```

## Android应用构建与发布

### 1. 生成签名密钥

Android应用需要使用签名密钥进行签名，才能发布到Google Play商店。

#### 创建签名密钥

```bash
# 生成签名密钥
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

这个命令会生成一个名为`my-upload-key.keystore`的签名密钥文件，有效期为10000天。

#### 配置签名信息

在`android/app/build.gradle`文件中配置签名信息：

```text
android {
    // ...
    signingConfigs {
        release {
            // 使用环境变量或gradle.properties存储密钥信息
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            // ...
            signingConfig signingConfigs.release
        }
    }
}
```

在`android/gradle.properties`文件中添加密钥信息（注意不要将此文件提交到版本控制系统）：

```properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=your-store-password
MYAPP_UPLOAD_KEY_PASSWORD=your-key-password
```

### 2. 构建发布版本

#### 执行构建命令

```bash
# 进入android目录
cd android

# 构建发布版本
./gradlew assembleRelease
```

构建成功后，APK文件将位于`android/app/build/outputs/apk/release/app-release.apk`。

#### 优化构建配置

在`android/app/build.gradle`中添加优化配置：

```text
def enableProguardInReleaseBuilds = true

buildTypes {
    release {
        minifyEnabled enableProguardInReleaseBuilds
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        // ...
    }
}
```

### 3. 发布到Google Play商店

#### 创建Google Play开发者账号

访问[Google Play Console](https://play.google.com/console/)，注册开发者账号（需要支付一次性注册费）。

#### 创建应用

在Google Play Console中创建新应用，填写应用信息，包括名称、描述、分类等。

#### 上传应用

1. 准备应用商店素材：
   - 应用图标
   - 应用截图
   - 应用描述
   - 应用视频（可选）

2. 上传APK或AAB文件：
   - 点击"发布管理" > "应用发布"
   - 选择发布轨道（生产、测试等）
   - 上传构建文件
   - 填写发布说明

3. 配置应用内容：
   - 设置内容分级
   - 添加隐私政策
   - 配置权限说明

4. 发布应用：
   - 点击"查看发布"
   - 确认发布信息
   - 提交审核

## iOS应用构建与发布

### 1. 注册Apple开发者账号

访问[Apple Developer](https://developer.apple.com/)，注册开发者账号（需要支付年费）。

### 2. 配置Xcode项目

#### 打开Xcode项目

```bash
# 打开iOS项目
open ios/YourAppName.xcworkspace
```

#### 配置应用信息

1. 选择项目文件，点击"General"标签页
2. 更新应用名称、版本号、构建号
3. 配置签名和Capabilities

#### 创建证书和配置文件

1. 登录[Apple Developer Portal](https://developer.apple.com/account/)
2. 创建开发和发布证书
3. 创建App ID
4. 创建开发和发布配置文件

### 3. 构建发布版本

#### 配置构建设置

在Xcode中：

1. 选择"Product" > "Scheme" > "Edit Scheme"
2. 将"Run"的Build Configuration设置为"Release"

#### 执行构建

```bash
# 使用命令行构建
cd ios
xcodebuild -workspace YourAppName.xcworkspace -scheme YourAppName -configuration Release -sdk iphoneos -archivePath ./build/YourAppName.xcarchive archive
```

#### 导出IPA文件

```bash
xcodebuild -exportArchive -archivePath ./build/YourAppName.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath ./build
```

其中`ExportOptions.plist`文件包含导出配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <true/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
```

### 4. 发布到App Store

#### 创建App Store Connect应用

1. 登录[App Store Connect](https://appstoreconnect.apple.com/)
2. 点击"我的App"
3. 点击"+"按钮，选择"新建App"
4. 填写应用信息，包括名称、平台、语言等

#### 配置应用信息

1. 填写应用元数据：
   - 应用名称
   - 描述
   - 关键词
   - 支持URL
   - 营销URL

2. 上传应用素材：
   - 应用图标
   - 应用截图
   - 应用预览视频（可选）

3. 配置价格与销售范围

#### 提交应用进行审核

1. 在App Store Connect中选择你的应用
2. 点击"+"按钮，选择"新建版本"
3. 填写版本信息和发布说明
4. 使用Xcode或Transporter上传IPA文件
5. 选择要发布的构建版本
6. 点击"提交审核"

## 跨平台发布策略

### 1. 使用Expo进行发布

Expo提供了便捷的跨平台发布工具，可以同时发布到Android和iOS平台。

#### 安装Expo CLI

```bash
npm install -g expo-cli
```

#### 登录Expo账号

```bash
expo login
```

#### 发布应用

```bash
# 发布应用
expo publish
```

#### 构建独立应用

```bash
# 构建Android APK
expo build:android

# 构建iOS IPA
expo build:ios
```

### 2. Web版本发布

React Native支持将应用发布为Web版本，使用户可以通过浏览器访问。

#### 安装Web支持

```bash
# 安装Web支持
expo install react-native-web react-dom @expo/metro-runtime
```

#### 导出Web版本

```bash
# 导出Web版本
expo export --platform web
```

导出的Web版本将位于`dist`目录，可以部署到任何静态网站托管服务。

#### 部署Web版本

##### Vercel部署

```bash
# 安装Vercel CLI
npm install -g vercel

# 部署到Vercel
vercel
```

##### Netlify部署

```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 部署到Netlify
netlify deploy --prod
```

##### GitHub Pages部署

```bash
# 安装gh-pages
npm install --save-dev gh-pages

# 添加部署脚本
# package.json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}

# 执行部署
npm run deploy
```

## 应用更新策略

### 1. 应用内更新

实现应用内更新功能，让用户可以及时获取最新版本。

#### 检查更新

```jsx
import { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';

function UpdateChecker() {
  useEffect(() => {
    checkForUpdates();
  }, []);
  
  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        Alert.alert(
          '发现新版本',
          '是否立即更新应用？',
          [
            { text: '稍后', style: 'cancel' },
            { 
              text: '立即更新', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  // 跳转到App Store
                  Linking.openURL('https://apps.apple.com/app/your-app-id');
                } else {
                  // 跳转到Google Play
                  Linking.openURL('https://play.google.com/store/apps/details?id=com.yourcompany.yourapp');
                }
              }
            },
          ]
        );
      }
    } catch (error) {
      console.error('检查更新失败:', error);
    }
  };
  
  return null;
}

export default UpdateChecker;
```

### 2. 热更新

使用热更新技术，可以在不发布新版本的情况下更新应用内容。

#### 使用Expo Updates

```jsx
import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';

function HotUpdateManager() {
  useEffect(() => {
    // 检查并应用热更新
    checkAndApplyUpdates();
  }, []);
  
  const checkAndApplyUpdates = async () => {
    try {
      // 检查是否有可用的更新
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        // 下载并安装更新
        await Updates.fetchUpdateAsync();
        
        // 提示用户重启应用
        Alert.alert(
          '更新已下载',
          '需要重启应用以应用更新。',
          [
            {
              text: '立即重启',
              onPress: () => Updates.reloadAsync(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('热更新失败:', error);
    }
  };
  
  return null;
}

export default HotUpdateManager;
```

## 性能监控与分析

### 1. 集成性能监控工具

在生产环境中集成性能监控工具，收集应用的使用数据和错误信息。

#### 使用Firebase Performance Monitoring

```bash
# 安装Firebase
npm install --save @react-native-firebase/app @react-native-firebase/perf
```

```jsx
import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import perf from '@react-native-firebase/perf';

function PerformanceMonitoring() {
  useEffect(() => {
    // 配置性能监控
    setupPerformanceMonitoring();
  }, []);
  
  const setupPerformanceMonitoring = async () => {
    try {
      // 启用自定义跟踪
      const trace = await perf().startTrace('app_startup');
      
      // 记录关键性能指标
      trace.putAttribute('screen', 'home');
      trace.putMetric('load_time', 120);
      
      // 结束跟踪
      await trace.stop();
      
      // 监控网络请求
      perf().setPerformanceCollectionEnabled(true);
    } catch (error) {
      console.error('性能监控配置失败:', error);
    }
  };
  
  return null;
}

export default PerformanceMonitoring;
```

### 2. 错误监控

集成错误监控工具，及时发现和修复应用中的错误。

#### 使用Sentry

```bash
# 安装Sentry
npm install --save @sentry/react-native
npx @sentry/wizard -i reactNative -p ios android
```

```jsx
import { useEffect } from 'react';
import * as Sentry from '@sentry/react-native';

function ErrorMonitoring() {
  useEffect(() => {
    // 配置Sentry
    Sentry.init({
      dsn: 'https://your-sentry-dsn@sentry.io/project-id',
      // 只在生产环境中启用
      enabled: !__DEV__,
      tracesSampleRate: 1.0,
    });
    
    // 设置用户信息
    Sentry.setUser({ id: 'user-123' });
  }, []);
  
  return null;
}

export default ErrorMonitoring;
```

## 发布后的维护

### 1. 用户反馈收集

建立用户反馈收集机制，及时了解用户的需求和问题。

#### 集成反馈组件

```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';

function FeedbackForm() {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert('提示', '请输入反馈内容');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // 发送反馈到服务器
      await fetch('https://your-api.com/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback,
          email,
          timestamp: new Date().toISOString(),
        }),
      });
      
      Alert.alert('成功', '感谢您的反馈！');
      setFeedback('');
      setEmail('');
    } catch (error) {
      console.error('提交反馈失败:', error);
      Alert.alert('错误', '提交反馈失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>用户反馈</Text>
      <Text style={styles.description}>
        请分享您对应用的意见和建议，帮助我们改进产品。
      </Text>
      
      <TextInput
        style={styles.emailInput}
        placeholder="您的邮箱（可选）"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.feedbackInput}
        placeholder="请输入您的反馈..."
        value={feedback}
        onChangeText={setFeedback}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />
      
      <TouchableOpacity 
        style={[styles.button, submitting && styles.buttonDisabled]} 
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? '提交中...' : '提交反馈'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    minHeight: 120,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0cfff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FeedbackForm;
```

### 2. 数据分析

使用数据分析工具，了解用户的使用习惯和应用的性能状况。

#### 集成Google Analytics

```bash
# 安装Google Analytics
npm install --save @react-native-firebase/analytics
```

```jsx
import { useEffect } from 'react';
import analytics from '@react-native-firebase/analytics';

function AnalyticsTracker() {
  useEffect(() => {
    // 配置分析
    setupAnalytics();
  }, []);
  
  const setupAnalytics = async () => {
    try {
      // 记录屏幕访问
      await analytics().logScreenView({
        screen_name: 'home',
        screen_class: 'HomeScreen',
      });
      
      // 记录用户事件
      await analytics().logEvent('user_login', {
        method: 'email',
      });
    } catch (error) {
      console.error('分析跟踪失败:', error);
    }
  };
  
  return null;
}

export default AnalyticsTracker;
```

## 最佳实践

### 1. 版本管理

使用语义化版本管理，清晰地表达版本变更的内容：

```
# 主版本号.次版本号.修订号
# 例如: 1.2.3
```

- **主版本号**：不兼容的API变更
- **次版本号**：向下兼容的功能新增
- **修订号**：向下兼容的问题修复

### 2. 发布计划

制定合理的发布计划，确保应用稳定更新：

1. **内部测试**：在发布前进行内部测试，收集反馈
2. **Alpha测试**：邀请少量外部用户进行测试
3. **Beta测试**：扩大测试范围，收集更多反馈
4. **正式发布**：发布到应用商店

### 3. 发布清单

在发布前，使用清单确保所有必要的工作都已完成：

- [ ] 代码审查完成
- [ ] 所有测试通过
- [ ] 性能优化完成
- [ ] 调试代码已移除
- [ ] 应用图标和截图已更新
- [ ] 应用描述和关键词已优化
- [ ] 隐私政策已更新
- [ ] 版本号已递增
- [ ] 发布说明已编写

## 常见问题与解决方案

### 1. 应用被拒原因及解决方案

#### Android应用被拒

| 常见原因 | 解决方案 |
|---------|--------|
| 权限问题 | 只请求必要的权限，并在权限说明中清晰解释用途 |
| 内容违规 | 确保应用内容符合Google Play政策 |
| 崩溃或错误 | 修复所有已知的崩溃和错误，增加错误监控 |
| 版权问题 | 确保应用不侵犯他人的版权和商标 |

#### iOS应用被拒

| 常见原因 | 解决方案 |
|---------|--------|
| 应用功能不完整 | 确保应用功能完整，没有明显的漏洞 |
| 性能问题 | 优化应用性能，避免卡顿和崩溃 |
| 用户界面不符合规范 | 遵循Apple的Human Interface Guidelines |
| 数据隐私问题 | 明确说明数据收集和使用方式，获得用户同意 |
| 支付问题 | 使用App Store In-App Purchase进行支付 |

### 2. 发布后常见问题

#### 应用崩溃

```jsx
// 添加全局错误处理
import { ErrorUtils } from 'react-native';

// 保存原始的错误处理函数
const originalHandler = ErrorUtils.getGlobalHandler();

// 设置自定义错误处理函数
ErrorUtils.setGlobalHandler((error, isFatal) => {
  // 记录错误
  console.error('全局错误:', error, isFatal);
  
  // 发送错误到监控服务
  if (typeof Sentry !== 'undefined') {
    Sentry.captureException(error);
  }
  
  // 调用原始的错误处理函数
  if (originalHandler) {
    originalHandler(error, isFatal);
  }
});
```

#### 性能问题

1. 使用性能监控工具识别瓶颈
2. 优化渲染性能，使用`PureComponent`和`memo`
3. 减少不必要的网络请求，增加缓存
4. 优化图片加载，使用适当的尺寸和格式

## 总结

本章详细介绍了React Native应用的部署与发布流程，包括：

1. **准备工作**：
   - 代码优化
   - 配置文件更新

2. **Android应用构建与发布**：
   - 生成签名密钥
   - 构建发布版本
   - 发布到Google Play商店

3. **iOS应用构建与发布**：
   - 注册Apple开发者账号
   - 配置Xcode项目
   - 构建发布版本
   - 发布到App Store

4. **跨平台发布策略**：
   - 使用Expo进行发布
   - Web版本发布

5. **应用更新策略**：
   - 应用内更新
   - 热更新

6. **性能监控与分析**：
   - 集成性能监控工具
   - 错误监控

7. **发布后的维护**：
   - 用户反馈收集
   - 数据分析

8. **最佳实践**：
   - 版本管理
   - 发布计划
   - 发布清单

9. **常见问题与解决方案**：
   - 应用被拒原因及解决方案
   - 发布后常见问题

通过遵循这些流程和最佳实践，你可以顺利地将React Native应用发布到用户手中，并持续维护和改进应用。发布应用只是开始，持续收集用户反馈、分析应用性能、优化用户体验，才是保持应用活力和竞争力的关键。

## 下一步

现在你已经学习了React Native应用的部署与发布，接下来你可以学习：

- [学习资源](./10-learning-resources.md) - 探索更多React Native学习资源，持续提升你的技能