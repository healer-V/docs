---
title: "网络请求"
category: "跨端 · HarmonyOS"
tags:
  - HarmonyOS
excerpt: "在 HarmonyOS 应用开发中，网络请求是实现与服务器通信、获取远程数据的核心功能。HarmonyOS 提供了多种网络请求 API 和框架，支持 HTTP、HTTPS 等协议，以及各种网络操作场景。本章节将详细介绍 HarmonyOS ..."
---

# 网络请求

在 HarmonyOS 应用开发中，网络请求是实现与服务器通信、获取远程数据的核心功能。HarmonyOS 提供了多种网络请求 API 和框架，支持 HTTP、HTTPS 等协议，以及各种网络操作场景。本章节将详细介绍 HarmonyOS 中的网络请求机制，包括基本 API 的使用、高级功能实现以及最佳实践。

## 1. 网络请求概述

### 1.1 网络请求的基本概念

网络请求是指应用与远程服务器之间的数据交换过程，主要包括：

- **请求**（Request）：应用向服务器发送的数据，包括请求方法、URL、请求头和请求体
- **响应**（Response）：服务器返回给应用的数据，包括状态码、响应头和响应体
- **协议**（Protocol）：定义数据交换的规则，如 HTTP、HTTPS 等

### 1.2 HarmonyOS 网络请求的特点

HarmonyOS 提供的网络请求功能具有以下特点：

- 支持 HTTP/HTTPS 协议
- 提供多种网络请求 API，适应不同开发需求
- 支持同步和异步请求
- 提供网络状态监测功能
- 支持数据加密和安全认证
- 适应分布式场景的网络请求

### 1.3 网络权限配置

在使用网络请求功能前，需要在应用的配置文件中添加网络权限。

#### 1.3.1 配置网络权限

在 `module.json5` 文件中添加网络权限：

```json
// module.json5
{
  "module": {
    "name": "entry",
    "type": "entry",
    "description": "示例应用",
    "mainElement": "EntryAbility",
    "deviceTypes": ["phone", "tablet"],
    "distributionCertificates": ["DISTRIBUTION_CERTIFICATE"],
    "requestPermissions": [
      {
        "name": "ohos.permission.INTERNET"  // 网络访问权限
      },
      {
        "name": "ohos.permission.GET_NETWORK_INFO"  // 获取网络状态权限
      }
    ],
    "pages": [
      "pages/HomePage",
      "pages/NetworkDemoPage"
    ],
    "abilities": [
      {
        "name": "EntryAbility",
        "srcEntry": "./ets/entryability/EntryAbility.ts",
        "description": "应用入口",
        "icon": "$media:icon",
        "label": "示例应用",
        "startWindowIcon": "$media:icon",
        "startWindowBackground": "$color:start_window_background",
        "orientation": "portrait"
      }
    ]
  }
}
```

## 2. HTTP 网络请求基础

HarmonyOS 提供了 `@ohos.net.http` 模块，用于实现 HTTP/HTTPS 网络请求。

### 2.1 导入 HTTP 模块

首先需要导入 `@ohos.net.http` 模块：

```typescript
import http from '@ohos.net.http';
```

### 2.2 创建 HTTP 请求

使用 `http.createHttp()` 方法创建 HTTP 请求对象：

```typescript
// 创建 HTTP 请求对象
let httpRequest = http.createHttp();
```

### 2.3 发送 GET 请求

GET 请求用于从服务器获取数据：

```typescript
import http from '@ohos.net.http';
import promptAction from '@ohos.promptAction';

@Entry
@Component
struct GetRequestDemo {
  @State responseResult: string = '';
  @State isLoading: boolean = false;
  
  // 发送 GET 请求
  async sendGetRequest() {
    this.isLoading = true;
    this.responseResult = '加载中...';
    
    try {
      // 1. 创建 HTTP 请求对象
      let httpRequest = http.createHttp();
      
      // 2. 配置请求参数
      let options = {
        method: http.RequestMethod.GET,
        header: {
          'Content-Type': 'application/json'
        },
        readTimeout: 60000,  // 读取超时时间（毫秒）
        connectTimeout: 60000,  // 连接超时时间（毫秒）
      };
      
      // 3. 发送请求
      let url = 'https://jsonplaceholder.typicode.com/posts/1';
      let response = await httpRequest.request(url, options);
      
      // 4. 处理响应
      if (response.responseCode === 200) {
        // 请求成功
        let result = JSON.parse(response.result as string);
        this.responseResult = JSON.stringify(result, null, 2);
        
        promptAction.showToast({
          message: 'GET 请求成功',
          duration: 2000
        });
      } else {
        // 请求失败
        this.responseResult = `请求失败，响应码: ${response.responseCode}`;
        
        promptAction.showToast({
          message: `GET 请求失败，响应码: ${response.responseCode}`,
          duration: 2000
        });
      }
    } catch (error) {
      // 处理异常
      this.responseResult = `请求异常: ${JSON.stringify(error)}`;
      
      promptAction.showToast({
        message: 'GET 请求异常',
        duration: 2000
      });
      
      console.error('GET 请求异常:', error);
    } finally {
      // 5. 关闭 HTTP 请求对象
      httpRequest.destroy();
      this.isLoading = false;
    }
  }
  
  build() {
    Column({
      space: 20
    }) {
      Text('GET 请求示例')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Button('发送 GET 请求')
        .onClick(() => {
          this.sendGetRequest();
        })
        .enabled(!this.isLoading)
      
      Text(this.responseResult)
        .fontSize(14)
        .textAlign(TextAlign.Start)
        .padding(10)
        .backgroundColor('#f0f0f0')
        .borderRadius(10)
        .width('100%')
        .height(300)
        .overflow(TextOverflow.Scroll)
      
      if (this.isLoading) {
        LoadingProgress()
          .width(50)
          .height(50)
          .color(Color.Blue)
      }
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center)
  }
}
```

### 2.4 发送 POST 请求

POST 请求用于向服务器提交数据：

```typescript
import http from '@ohos.net.http';
import promptAction from '@ohos.promptAction';

@Entry
@Component
struct PostRequestDemo {
  @State responseResult: string = '';
  @State isLoading: boolean = false;
  @State title: string = '';
  @State body: string = '';
  @State userId: number = 1;
  
  // 发送 POST 请求
  async sendPostRequest() {
    if (!this.title || !this.body) {
      promptAction.showToast({
        message: '请输入标题和内容',
        duration: 2000
      });
      return;
    }
    
    this.isLoading = true;
    this.responseResult = '加载中...';
    
    try {
      // 1. 创建 HTTP 请求对象
      let httpRequest = http.createHttp();
      
      // 2. 准备请求体数据
      let requestBody = {
        title: this.title,
        body: this.body,
        userId: this.userId
      };
      
      // 3. 配置请求参数
      let options = {
        method: http.RequestMethod.POST,
        header: {
          'Content-Type': 'application/json'
        },
        extraData: JSON.stringify(requestBody),  // 请求体数据
        readTimeout: 60000,
        connectTimeout: 60000,
      };
      
      // 4. 发送请求
      let url = 'https://jsonplaceholder.typicode.com/posts';
      let response = await httpRequest.request(url, options);
      
      // 5. 处理响应
      if (response.responseCode === 201) {  // POST 请求成功的状态码通常是 201
        // 请求成功
        let result = JSON.parse(response.result as string);
        this.responseResult = JSON.stringify(result, null, 2);
        
        promptAction.showToast({
          message: 'POST 请求成功',
          duration: 2000
        });
      } else {
        // 请求失败
        this.responseResult = `请求失败，响应码: ${response.responseCode}`;
        
        promptAction.showToast({
          message: `POST 请求失败，响应码: ${response.responseCode}`,
          duration: 2000
        });
      }
    } catch (error) {
      // 处理异常
      this.responseResult = `请求异常: ${JSON.stringify(error)}`;
      
      promptAction.showToast({
        message: 'POST 请求异常',
        duration: 2000
      });
      
      console.error('POST 请求异常:', error);
    } finally {
      // 6. 关闭 HTTP 请求对象
      httpRequest.destroy();
      this.isLoading = false;
    }
  }
  
  build() {
    Column({
      space: 20
    }) {
      Text('POST 请求示例')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      // 输入表单
      Column({
        space: 15
      }) {
        TextInput({
          placeholder: '请输入标题'
        })
          .width('100%')
          .height(50)
          .backgroundColor('#f0f0f0')
          .padding(10)
          .onChange((value) => {
            this.title = value;
          })
        
        TextArea({
          placeholder: '请输入内容'
        })
          .width('100%')
          .height(100)
          .backgroundColor('#f0f0f0')
          .padding(10)
          .onChange((value) => {
            this.body = value;
          })
        
        Button('发送 POST 请求')
          .onClick(() => {
            this.sendPostRequest();
          })
          .enabled(!this.isLoading)
      }
      
      Text('响应结果:')
        .fontSize(16)
        .fontWeight(FontWeight.Medium)
      
      Text(this.responseResult)
        .fontSize(14)
        .textAlign(TextAlign.Start)
        .padding(10)
        .backgroundColor('#f0f0f0')
        .borderRadius(10)
        .width('100%')
        .height(200)
        .overflow(TextOverflow.Scroll)
      
      if (this.isLoading) {
        LoadingProgress()
          .width(50)
          .height(50)
          .color(Color.Blue)
      }
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center)
  }
}
```

### 2.5 其他 HTTP 请求方法

除了 GET 和 POST 之外，HTTP 协议还支持其他请求方法，如 PUT、PATCH、DELETE 等。HarmonyOS 的 http 模块也支持这些方法：

```typescript
// PUT 请求示例（用于更新资源）
async sendPutRequest() {
  try {
    let httpRequest = http.createHttp();
    
    let requestBody = {
      title: '更新的标题',
      body: '更新的内容',
      userId: 1
    };
    
    let options = {
      method: http.RequestMethod.PUT,  // 使用 PUT 方法
      header: {
        'Content-Type': 'application/json'
      },
      extraData: JSON.stringify(requestBody),
      readTimeout: 60000,
      connectTimeout: 60000,
    };
    
    let url = 'https://jsonplaceholder.typicode.com/posts/1';  // 更新 ID 为 1 的资源
    let response = await httpRequest.request(url, options);
    
    if (response.responseCode === 200) {
      // 请求成功
      let result = JSON.parse(response.result as string);
      console.log('PUT 请求成功:', JSON.stringify(result));
    }
    
    httpRequest.destroy();
  } catch (error) {
    console.error('PUT 请求异常:', error);
  }
}

// PATCH 请求示例（用于部分更新资源）
async sendPatchRequest() {
  try {
    let httpRequest = http.createHttp();
    
    let requestBody = {
      title: '部分更新的标题'  // 只更新标题
    };
    
    let options = {
      method: http.RequestMethod.PATCH,  // 使用 PATCH 方法
      header: {
        'Content-Type': 'application/json'
      },
      extraData: JSON.stringify(requestBody),
      readTimeout: 60000,
      connectTimeout: 60000,
    };
    
    let url = 'https://jsonplaceholder.typicode.com/posts/1';
    let response = await httpRequest.request(url, options);
    
    if (response.responseCode === 200) {
      // 请求成功
      let result = JSON.parse(response.result as string);
      console.log('PATCH 请求成功:', JSON.stringify(result));
    }
    
    httpRequest.destroy();
  } catch (error) {
    console.error('PATCH 请求异常:', error);
  }
}

// DELETE 请求示例（用于删除资源）
async sendDeleteRequest() {
  try {
    let httpRequest = http.createHttp();
    
    let options = {
      method: http.RequestMethod.DELETE,  // 使用 DELETE 方法
      header: {
        'Content-Type': 'application/json'
      },
      readTimeout: 60000,
      connectTimeout: 60000,
    };
    
    let url = 'https://jsonplaceholder.typicode.com/posts/1';  // 删除 ID 为 1 的资源
    let response = await httpRequest.request(url, options);
    
    if (response.responseCode === 200 || response.responseCode === 204) {
      // 请求成功（DELETE 成功通常返回 200 或 204）
      console.log('DELETE 请求成功');
    }
    
    httpRequest.destroy();
  } catch (error) {
    console.error('DELETE 请求异常:', error);
  }
}
```

## 3. 高级网络请求功能

### 3.1 请求头设置

HTTP 请求头包含了关于请求的元数据信息，可以通过 `header` 参数设置：

```typescript
async sendRequestWithHeaders() {
  try {
    let httpRequest = http.createHttp();
    
    let options = {
      method: http.RequestMethod.GET,
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your_access_token',  // 认证令牌
        'Accept': 'application/json',  // 接受的数据类型
        'User-Agent': 'HarmonyOS-App/1.0.0',  // 用户代理
        'Cache-Control': 'no-cache'  // 缓存控制
      },
      readTimeout: 60000,
      connectTimeout: 60000,
    };
    
    let url = 'https://api.example.com/data';
    let response = await httpRequest.request(url, options);
    
    // 处理响应...
    
    httpRequest.destroy();
  } catch (error) {
    console.error('请求异常:', error);
  }
}
```

### 3.2 文件上传

HarmonyOS 的 http 模块支持文件上传功能，可以通过 multipart/form-data 格式上传文件：

```typescript
import http from '@ohos.net.http';
import fileio from '@ohos.fileio';

async uploadFile() {
  try {
    let httpRequest = http.createHttp();
    
    // 准备表单数据
    let formData = {
      'username': 'testuser',
      'description': '测试文件上传',
      'file': {
        filename: 'test.jpg',
        name: 'file',
        type: 'image/jpeg',
        uri: 'internal://cache/test.jpg'  // 文件的 URI 路径
      }
    };
    
    let options = {
      method: http.RequestMethod.POST,
      header: {
        'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'  // 表单数据边界
      },
      extraData: formData,
      readTimeout: 60000,
      connectTimeout: 60000,
    };
    
    let url = 'https://api.example.com/upload';
    let response = await httpRequest.request(url, options);
    
    if (response.responseCode === 200) {
      console.log('文件上传成功:', response.result);
    }
    
    httpRequest.destroy();
  } catch (error) {
    console.error('文件上传失败:', error);
  }
}
```

### 3.3 文件下载

可以使用 http 模块下载文件并保存到本地：

```typescript
import http from '@ohos.net.http';
import fileio from '@ohos.fileio';
import promptAction from '@ohos.promptAction';

@Entry
@Component
struct FileDownloadDemo {
  @State downloadProgress: number = 0;
  @State isDownloading: boolean = false;
  @State downloadUrl: string = 'https://example.com/sample.jpg';
  
  // 下载文件
  async downloadFile() {
    this.isDownloading = true;
    this.downloadProgress = 0;
    
    try {
      // 1. 创建 HTTP 请求对象
      let httpRequest = http.createHttp();
      
      // 2. 配置请求参数
      let options = {
        method: http.RequestMethod.GET,
        header: {
          'Connection': 'keep-alive'
        },
        readTimeout: 60000,
        connectTimeout: 60000,
      };
      
      // 3. 发送请求
      let url = this.downloadUrl;
      let response = await httpRequest.request(url, options);
      
      // 4. 处理响应
      if (response.responseCode === 200) {
        // 创建文件并写入数据
        const context = getContext(this) as common.UIAbilityContext;
        const cacheDir = await context.getCacheDir();
        const filePath = `${cacheDir}/downloaded_file.jpg`;
        
        // 写入文件
        try {
          let file = fileio.openSync(filePath, fileio.OpenMode.CREATE | fileio.OpenMode.WRITE);
          fileio.writeSync(file, response.result as ArrayBuffer);
          fileio.closeSync(file);
          
          this.downloadProgress = 100;
          
          promptAction.showToast({
            message: `文件下载成功，保存路径: ${filePath}`,
            duration: 2000
          });
        } catch (fileError) {
          console.error('文件写入失败:', fileError);
          promptAction.showToast({
            message: '文件写入失败',
            duration: 2000
          });
        }
      } else {
        promptAction.showToast({
          message: `文件下载失败，响应码: ${response.responseCode}`,
          duration: 2000
        });
      }
    } catch (error) {
      console.error('文件下载异常:', error);
      promptAction.showToast({
        message: '文件下载异常',
        duration: 2000
      });
    } finally {
      this.isDownloading = false;
    }
  }
  
  build() {
    Column({
      space: 20
    }) {
      Text('文件下载示例')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      TextInput({
        placeholder: '请输入文件下载地址',
        text: this.downloadUrl
      })
        .width('100%')
        .height(50)
        .backgroundColor('#f0f0f0')
        .padding(10)
        .onChange((value) => {
          this.downloadUrl = value;
        })
      
      Button('下载文件')
        .onClick(() => {
          this.downloadFile();
        })
        .enabled(!this.isDownloading)
      
      if (this.isDownloading) {
        Column({
          space: 10
        }) {
          LoadingProgress()
            .width(50)
            .height(50)
            .color(Color.Blue)
          
          Text(`下载进度: ${this.downloadProgress}%`)
            .fontSize(16)
          
          Progress({
            value: this.downloadProgress,
            total: 100,
            type: ProgressType.Linear
          })
            .width('100%')
            .height(20)
        }
      }
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center)
  }
}
```

### 3.4 网络状态监测

HarmonyOS 提供了网络状态监测功能，可以实时获取设备的网络连接状态：

```typescript
import http from '@ohos.net.http';
import network from '@ohos.net.network';
import common from '@ohos.app.ability.common';
import promptAction from '@ohos.promptAction';

@Entry
@Component
struct NetworkStatusDemo {
  @State networkType: string = '未知';
  @State isConnected: boolean = false;
  
  // 获取当前网络状态
  getNetworkStatus() {
    try {
      const context = getContext(this) as common.UIAbilityContext;
      const netManager = network.getDefaultNetManagerSync();
      
      // 检查网络是否连接
      this.isConnected = netManager.hasDefaultNet();
      
      if (this.isConnected) {
        // 获取网络类型
        const netAttributes = netManager.getDefaultNetSync();
        const type = netAttributes.type;
        
        switch (type) {
          case network.NetConnectType.WIFI:
            this.networkType = 'WIFI';
            break;
          case network.NetConnectType.MOBILE:
            this.networkType = '移动网络';
            break;
          case network.NetConnectType.ETHERNET:
            this.networkType = '以太网';
            break;
          default:
            this.networkType = '其他网络';
        }
        
        promptAction.showToast({
          message: `网络已连接，类型: ${this.networkType}`,
          duration: 2000
        });
      } else {
        this.networkType = '无网络';
        promptAction.showToast({
          message: '网络未连接',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('获取网络状态失败:', error);
      promptAction.showToast({
        message: '获取网络状态失败',
        duration: 2000
      });
    }
  }
  
  // 监听网络状态变化
  aboutToAppear() {
    try {
      const netManager = network.getDefaultNetManagerSync();
      
      // 注册网络状态变化监听
      netManager.on('netStatusChange', (data) => {
        console.log('网络状态变化:', JSON.stringify(data));
        
        this.isConnected = data.isAvailable;
        
        if (this.isConnected) {
          switch (data.type) {
            case network.NetConnectType.WIFI:
              this.networkType = 'WIFI';
              break;
            case network.NetConnectType.MOBILE:
              this.networkType = '移动网络';
              break;
            case network.NetConnectType.ETHERNET:
              this.networkType = '以太网';
              break;
            default:
              this.networkType = '其他网络';
          }
        } else {
          this.networkType = '无网络';
        }
      });
      
      // 初始获取网络状态
      this.getNetworkStatus();
    } catch (error) {
      console.error('注册网络监听失败:', error);
    }
  }
  
  build() {
    Column({
      space: 20
    }) {
      Text('网络状态监测示例')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Column({
        space: 15
      }) {
        Text(`网络连接状态: ${this.isConnected ? '已连接' : '未连接'}`)
          .fontSize(18)
          .fontColor(this.isConnected ? Color.Green : Color.Red)
        
        Text(`网络类型: ${this.networkType}`)
          .fontSize(18)
      }
      
      Button('检查网络状态')
        .onClick(() => {
          this.getNetworkStatus();
        })
      
      Text('提示: 当网络状态变化时，页面会自动更新')
        .fontSize(14)
        .fontColor(Color.Gray)
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center)
  }
}
```

## 4. 使用第三方网络库

除了 HarmonyOS 内置的 http 模块，还可以使用第三方网络库来简化网络请求的开发。以下是一些常用的第三方网络库：

### 4.1 使用 axios 适配版

axios 是一个流行的 HTTP 客户端库，有 HarmonyOS 的适配版本：

#### 4.1.1 安装依赖

```bash
# 在项目根目录执行
npm install @ohos/axios --save
```

#### 4.1.2 使用示例

```typescript
import axios from '@ohos/axios';
import promptAction from '@ohos.promptAction';

@Entry
@Component
struct AxiosDemo {
  @State responseResult: string = '';
  @State isLoading: boolean = false;
  
  // 配置 axios 实例
  private axiosInstance = axios.create({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  // 发送 GET 请求
  async sendGetRequest() {
    this.isLoading = true;
    this.responseResult = '加载中...';
    
    try {
      // 使用 axios 发送 GET 请求
      const response = await this.axiosInstance.get('/posts/1');
      
      // 处理响应
      this.responseResult = JSON.stringify(response.data, null, 2);
      
      promptAction.showToast({
        message: 'GET 请求成功',
        duration: 2000
      });
    } catch (error) {
      // 处理错误
      this.responseResult = `请求失败: ${JSON.stringify(error)}`;
      
      promptAction.showToast({
        message: 'GET 请求失败',
        duration: 2000
      });
      
      console.error('GET 请求失败:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  // 发送 POST 请求
  async sendPostRequest() {
    this.isLoading = true;
    this.responseResult = '加载中...';
    
    try {
      // 请求数据
      const requestData = {
        title: '使用 axios 发送 POST 请求',
        body: '这是一个测试内容',
        userId: 1
      };
      
      // 使用 axios 发送 POST 请求
      const response = await this.axiosInstance.post('/posts', requestData);
      
      // 处理响应
      this.responseResult = JSON.stringify(response.data, null, 2);
      
      promptAction.showToast({
        message: 'POST 请求成功',
        duration: 2000
      });
    } catch (error) {
      // 处理错误
      this.responseResult = `请求失败: ${JSON.stringify(error)}`;
      
      promptAction.showToast({
        message: 'POST 请求失败',
        duration: 2000
      });
      
      console.error('POST 请求失败:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  build() {
    Column({
      space: 20
    }) {
      Text('Axios 网络请求示例')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Row({
        space: 10
      }) {
        Button('发送 GET 请求')
          .onClick(() => {
            this.sendGetRequest();
          })
          .enabled(!this.isLoading)
        
        Button('发送 POST 请求')
          .onClick(() => {
            this.sendPostRequest();
          })
          .enabled(!this.isLoading)
      }
      
      Text('响应结果:')
        .fontSize(16)
        .fontWeight(FontWeight.Medium)
      
      Text(this.responseResult)
        .fontSize(14)
        .textAlign(TextAlign.Start)
        .padding(10)
        .backgroundColor('#f0f0f0')
        .borderRadius(10)
        .width('100%')
        .height(300)
        .overflow(TextOverflow.Scroll)
      
      if (this.isLoading) {
        LoadingProgress()
          .width(50)
          .height(50)
          .color(Color.Blue)
      }
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center)
  }
}
```

### 4.2 使用 fetch API

HarmonyOS 也支持类似 Web 的 fetch API：

```typescript
@Entry
@Component
struct FetchApiDemo {
  @State responseResult: string = '';
  @State isLoading: boolean = false;
  
  // 发送 GET 请求
  async sendGetRequest() {
    this.isLoading = true;
    this.responseResult = '加载中...';
    
    try {
      // 使用 fetch API 发送 GET 请求
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // 检查响应状态
      if (response.ok) {
        // 解析响应数据
        const data = await response.json();
        this.responseResult = JSON.stringify(data, null, 2);
        
        promptAction.showToast({
          message: 'GET 请求成功',
          duration: 2000
        });
      } else {
        this.responseResult = `请求失败，状态码: ${response.status}`;
        
        promptAction.showToast({
          message: `GET 请求失败，状态码: ${response.status}`,
          duration: 2000
        });
      }
    } catch (error) {
      // 处理错误
      this.responseResult = `请求异常: ${JSON.stringify(error)}`;
      
      promptAction.showToast({
        message: 'GET 请求异常',
        duration: 2000
      });
      
      console.error('GET 请求异常:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  build() {
    // 类似前面的布局，省略...
  }
}
```

## 5. 网络请求最佳实践

### 5.1 封装网络请求工具类

为了提高代码的可维护性和复用性，建议封装网络请求工具类：

```typescript
// networkService.ts
import http from '@ohos.net.http';
import common from '@ohos.app.ability.common';

// 定义请求方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// 定义请求配置接口
export interface RequestConfig {
  url: string;
  method: HttpMethod;
  params?: any;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

// 定义响应接口
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 网络请求服务类
export class NetworkService {
  private context: common.UIAbilityContext | null = null;
  
  /**
   * 设置应用上下文
   * @param context 应用上下文
   */
  setContext(context: common.UIAbilityContext): void {
    this.context = context;
  }
  
  /**
   * 发送网络请求
   * @param config 请求配置
   * @returns Promise<ApiResponse<T>>
   */
  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      // 创建 HTTP 请求对象
      const httpRequest = http.createHttp();
      
      // 构建请求选项
      const options = {
        method: this.getHttpMethod(config.method),
        header: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        readTimeout: config.timeout || 60000,
        connectTimeout: config.timeout || 60000,
      };
      
      // 添加请求体（如果有）
      if (config.data) {
        (options as any).extraData = JSON.stringify(config.data);
      }
      
      // 构建完整 URL（如果有查询参数）
      let url = config.url;
      if (config.params) {
        const queryString = this.buildQueryString(config.params);
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
      
      // 发送请求
      const response = await httpRequest.request(url, options);
      
      // 关闭 HTTP 请求对象
      httpRequest.destroy();
      
      // 处理响应
      if (response.responseCode === 200 || response.responseCode === 201) {
        // 请求成功
        const result = typeof response.result === 'string' 
          ? JSON.parse(response.result as string)
          : response.result;
        
        return {
          code: response.responseCode,
          message: '请求成功',
          data: result
        };
      } else {
        // 请求失败
        return {
          code: response.responseCode,
          message: `请求失败: ${response.responseCode}`,
          data: null as any
        };
      }
    } catch (error) {
      console.error('网络请求异常:', error);
      
      return {
        code: 500,
        message: `请求异常: ${error instanceof Error ? error.message : '未知错误'}`,
        data: null as any
      };
    }
  }
  
  /**
   * 发送 GET 请求
   * @param url 请求 URL
   * @param params 查询参数
   * @param headers 请求头
   * @returns Promise<ApiResponse<T>>
   */
  get<T = any>(url: string, params?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      params,
      headers
    });
  }
  
  /**
   * 发送 POST 请求
   * @param url 请求 URL
   * @param data 请求体数据
   * @param headers 请求头
   * @returns Promise<ApiResponse<T>>
   */
  post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      headers
    });
  }
  
  /**
   * 发送 PUT 请求
   * @param url 请求 URL
   * @param data 请求体数据
   * @param headers 请求头
   * @returns Promise<ApiResponse<T>>
   */
  put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      headers
    });
  }
  
  /**
   * 发送 PATCH 请求
   * @param url 请求 URL
   * @param data 请求体数据
   * @param headers 请求头
   * @returns Promise<ApiResponse<T>>
   */
  patch<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PATCH',
      data,
      headers
    });
  }
  
  /**
   * 发送 DELETE 请求
   * @param url 请求 URL
   * @param params 查询参数
   * @param headers 请求头
   * @returns Promise<ApiResponse<T>>
   */
  delete<T = any>(url: string, params?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      params,
      headers
    });
  }
  
  /**
   * 将 HttpMethod 转换为 http.RequestMethod
   * @param method HttpMethod
   * @returns http.RequestMethod
   */
  private getHttpMethod(method: HttpMethod): http.RequestMethod {
    switch (method) {
      case 'GET':
        return http.RequestMethod.GET;
      case 'POST':
        return http.RequestMethod.POST;
      case 'PUT':
        return http.RequestMethod.PUT;
      case 'PATCH':
        return http.RequestMethod.PATCH;
      case 'DELETE':
        return http.RequestMethod.DELETE;
      default:
        return http.RequestMethod.GET;
    }
  }
  
  /**
   * 构建查询字符串
   * @param params 查询参数对象
   * @returns 查询字符串
   */
  private buildQueryString(params: any): string {
    return Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }
}

// 导出单例实例
export const networkService = new NetworkService();
```

### 5.2 使用封装的网络请求工具类

```typescript
import { networkService } from '../services/networkService';
import promptAction from '@ohos.promptAction';
import common from '@ohos.app.ability.common';

@Entry
@Component
struct NetworkServiceDemo {
  @State responseResult: string = '';
  @State isLoading: boolean = false;
  
  // 组件创建时初始化网络服务
  aboutToAppear() {
    // 获取应用上下文并设置到网络服务
    const context = getContext(this) as common.UIAbilityContext;
    networkService.setContext(context);
  }
  
  // 发送 GET 请求
  async sendGetRequest() {
    this.isLoading = true;
    this.responseResult = '加载中...';
    
    try {
      // 使用封装的网络服务发送 GET 请求
      const response = await networkService.get('https://jsonplaceholder.typicode.com/posts/1');
      
      if (response.code === 200) {
        // 请求成功
        this.responseResult = JSON.stringify(response.data, null, 2);
        
        promptAction.showToast({
          message: 'GET 请求成功',
          duration: 2000
        });
      } else {
        // 请求失败
        this.responseResult = `请求失败: ${response.message}`;
        
        promptAction.showToast({
          message: `GET 请求失败: ${response.message}`,
          duration: 2000
        });
      }
    } catch (error) {
      // 处理异常
      this.responseResult = `请求异常: ${JSON.stringify(error)}`;
      
      promptAction.showToast({
        message: 'GET 请求异常',
        duration: 2000
      });
      
      console.error('GET 请求异常:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  // 发送 POST 请求
  async sendPostRequest() {
    this.isLoading = true;
    this.responseResult = '加载中...';
    
    try {
      // 请求数据
      const requestData = {
        title: '测试标题',
        body: '测试内容',
        userId: 1
      };
      
      // 使用封装的网络服务发送 POST 请求
      const response = await networkService.post('https://jsonplaceholder.typicode.com/posts', requestData);
      
      if (response.code === 201) {
        // 请求成功
        this.responseResult = JSON.stringify(response.data, null, 2);
        
        promptAction.showToast({
          message: 'POST 请求成功',
          duration: 2000
        });
      } else {
        // 请求失败
        this.responseResult = `请求失败: ${response.message}`;
        
        promptAction.showToast({
          message: `POST 请求失败: ${response.message}`,
          duration: 2000
        });
      }
    } catch (error) {
      // 处理异常
      this.responseResult = `请求异常: ${JSON.stringify(error)}`;
      
      promptAction.showToast({
        message: 'POST 请求异常',
        duration: 2000
      });
      
      console.error('POST 请求异常:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  build() {
    // 类似前面的布局，省略...
  }
}
```

### 5.3 错误处理与重试机制

在实际应用中，网络请求可能会因为各种原因失败，因此需要实现错误处理和重试机制：

```typescript
// 在 networkService.ts 中添加重试机制

/**
 * 带重试机制的网络请求
 * @param config 请求配置
 * @param retryCount 重试次数
 * @param delay 重试间隔（毫秒）
 * @returns Promise<ApiResponse<T>>
 */
async requestWithRetry<T = any>(config: RequestConfig, retryCount: number = 3, delay: number = 1000): Promise<ApiResponse<T>> {
  let lastError: any = null;
  
  for (let i = 0; i <= retryCount; i++) {
    try {
      // 发送请求
      const response = await this.request<T>(config);
      return response;
    } catch (error) {
      lastError = error;
      
      // 如果不是最后一次重试，则等待一段时间后重试
      if (i < retryCount) {
        console.log(`请求失败，${delay}ms 后第 ${i + 1} 次重试...`);
        await this.sleep(delay);
        // 指数退避策略
        delay *= 2;
      }
    }
  }
  
  // 所有重试都失败
  throw lastError;
}

/**
 * 延时函数
 * @param ms 延时毫秒数
 * @returns Promise<void>
 */
private sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 5.4 缓存策略

实现网络请求缓存可以减少不必要的网络请求，提高应用性能：

```typescript
// 在 networkService.ts 中添加缓存机制
import preferences from '@ohos.data.preferences';

// 缓存接口
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number; // 缓存有效期（毫秒）
}

// 网络请求服务类（扩展）
export class NetworkService {
  // 现有代码...
  
  private preferences: preferences.Preferences | null = null;
  private cacheEnabled: boolean = true;
  private defaultCacheTTL: number = 5 * 60 * 1000; // 默认缓存有效期 5 分钟
  
  /**
   * 初始化缓存
   */
  async initCache(): Promise<void> {
    if (!this.context) {
      throw new Error('Context not set. Call setContext() first.');
    }
    
    try {
      this.preferences = await preferences.getPreferences(this.context, 'network_cache');
    } catch (error) {
      console.error('初始化缓存失败:', error);
    }
  }
  
  /**
   * 启用/禁用缓存
   * @param enabled 是否启用缓存
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
  }
  
  /**
   * 设置默认缓存有效期
   * @param ttl 缓存有效期（毫秒）
   */
  setDefaultCacheTTL(ttl: number): void {
    this.defaultCacheTTL = ttl;
  }
  
  /**
   * 获取缓存键
   * @param config 请求配置
   * @returns 缓存键
   */
  private getCacheKey(config: RequestConfig): string {
    // 对于 GET 请求，使用 URL 和参数作为缓存键
    // 对于其他请求，不使用缓存
    if (config.method === 'GET') {
      let url = config.url;
      if (config.params) {
        const queryString = this.buildQueryString(config.params);
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
      return `cache_${url}`;
    }
    return '';
  }
  
  /**
   * 获取缓存数据
   * @param key 缓存键
   * @returns Promise<CacheItem | null>
   */
  private async getCache(key: string): Promise<any | null> {
    if (!this.cacheEnabled || !this.preferences || !key) {
      return null;
    }
    
    try {
      const cacheStr = await this.preferences.get(key, '') as string;
      if (!cacheStr) {
        return null;
      }
      
      const cacheItem: CacheItem = JSON.parse(cacheStr);
      const now = Date.now();
      
      // 检查缓存是否过期
      if (now > cacheItem.timestamp + cacheItem.ttl) {
        // 缓存已过期，删除
        await this.preferences.delete(key);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  }
  
  /**
   * 设置缓存数据
   * @param key 缓存键
   * @param data 要缓存的数据
   * @param ttl 缓存有效期（毫秒）
   */
  private async setCache(key: string, data: any, ttl: number = this.defaultCacheTTL): Promise<void> {
    if (!this.cacheEnabled || !this.preferences || !key) {
      return;
    }
    
    try {
      const cacheItem: CacheItem = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      await this.preferences.put(key, JSON.stringify(cacheItem));
      await this.preferences.flush();
    } catch (error) {
      console.error('设置缓存失败:', error);
    }
  }
  
  /**
   * 带缓存的 GET 请求
   * @param url 请求 URL
   * @param params 查询参数
   * @param headers 请求头
   * @param ttl 缓存有效期（毫秒）
   * @returns Promise<ApiResponse<T>>
   */
  async getWithCache<T = any>(
    url: string, 
    params?: any, 
    headers?: Record<string, string>,
    ttl: number = this.defaultCacheTTL
  ): Promise<ApiResponse<T>> {
    const config: RequestConfig = {
      url,
      method: 'GET',
      params,
      headers
    };
    
    // 获取缓存键
    const cacheKey = this.getCacheKey(config);
    
    // 尝试从缓存获取数据
    const cachedData = await this.getCache(cacheKey);
    if (cachedData) {
      console.log('从缓存获取数据:', url);
      return {
        code: 200,
        message: '从缓存获取数据',
        data: cachedData
      };
    }
    
    // 缓存未命中，发送网络请求
    const response = await this.get<T>(url, params, headers);
    
    // 如果请求成功，更新缓存
    if (response.code === 200) {
      await this.setCache(cacheKey, response.data, ttl);
    }
    
    return response;
  }
  
  /**
   * 清除所有缓存
   */
  async clearCache(): Promise<void> {
    if (!this.preferences) {
      return;
    }
    
    try {
      await this.preferences.clear();
      await this.preferences.flush();
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  }
  
  /**
   * 清除特定 URL 的缓存
   * @param url 请求 URL
   * @param params 查询参数
   */
  async clearCacheByUrl(url: string, params?: any): Promise<void> {
    if (!this.preferences) {
      return;
    }
    
    const config: RequestConfig = {
      url,
      method: 'GET',
      params
    };
    
    const cacheKey = this.getCacheKey(config);
    
    if (cacheKey) {
      try {
        await this.preferences.delete(cacheKey);
        await this.preferences.flush();
      } catch (error) {
        console.error('清除缓存失败:', error);
      }
    }
  }
}
```

## 6. 安全性考虑

### 6.1 HTTPS 使用

始终使用 HTTPS 协议进行网络请求，以确保数据传输的安全性：

- HTTPS 可以加密数据传输，防止数据被窃听和篡改
- 验证服务器身份，防止中间人攻击
- 提高应用的安全性评级

### 6.2 数据加密

对于敏感数据，除了使用 HTTPS 外，还可以进行额外的加密处理：

```typescript
// 数据加密工具示例
import cryptoFramework from '@ohos.security.cryptoFramework';

export class EncryptionUtil {
  /**
   * AES 加密
   * @param data 要加密的数据
   * @param key 加密密钥
   * @returns 加密后的数据
   */
  static async aesEncrypt(data: string, key: string): Promise<string> {
    // 实现 AES 加密逻辑
    // 这里只是示例，实际实现需要使用 HarmonyOS 的 cryptoFramework
    return encryptedData;
  }
  
  /**
   * AES 解密
   * @param encryptedData 加密后的数据
   * @param key 解密密钥
   * @returns 解密后的数据
   */
  static async aesDecrypt(encryptedData: string, key: string): Promise<string> {
    // 实现 AES 解密逻辑
    return decryptedData;
  }
}
```

### 6.3 认证与授权

实现安全的认证与授权机制：

- 使用 token-based 认证（如 JWT）
- 实现 token 刷新机制
- 设置合理的 token 过期时间
- 保护用户凭证，避免明文存储

## 7. 完整应用示例

下面是一个使用网络请求功能的完整应用示例：

```typescript
// App.ets
import { networkService } from './services/networkService';
import { NetworkStatusDemo } from './pages/NetworkStatusDemo';
import { NetworkServiceDemo } from './pages/NetworkServiceDemo';

@Entry
@Component
struct App {
  @State currentPage: string = 'status';
  
  build() {
    Column({
      space: 0
    }) {
      // 页面切换标签栏
      Row({
        space: 0
      }) {
        Button('网络状态')
          .width('50%')
          .onClick(() => {
            this.currentPage = 'status';
          })
          .backgroundColor(this.currentPage === 'status' ? '#007AFF' : '#F0F0F0')
          .fontColor(this.currentPage === 'status' ? '#FFFFFF' : '#000000')
        
        Button('网络请求')
          .width('50%')
          .onClick(() => {
            this.currentPage = 'request';
          })
          .backgroundColor(this.currentPage === 'request' ? '#007AFF' : '#F0F0F0')
          .fontColor(this.currentPage === 'request' ? '#FFFFFF' : '#000000')
      }
      
      // 页面内容
      Stack() {
        if (this.currentPage === 'status') {
          NetworkStatusDemo()
        } else {
          NetworkServiceDemo()
        }
      }
      .width('100%')
      .flexGrow(1)
    }
    .width('100%')
    .height('100%')
  }
}
```

## 8. 总结

HarmonyOS 提供了强大的网络请求功能，支持各种网络通信场景。本章节详细介绍了：

1. **基本网络请求**：使用 `@ohos.net.http` 模块发送 GET、POST 等 HTTP 请求
2. **高级功能**：请求头设置、文件上传下载、网络状态监测等
3. **第三方库**：使用 axios 等第三方网络库简化开发
4. **最佳实践**：
   - 封装网络请求工具类，提高代码复用性
   - 实现错误处理与重试机制
   - 添加缓存策略，减少不必要的网络请求
   - 考虑安全性，使用 HTTPS 和数据加密

通过合理使用这些功能和最佳实践，可以构建出高效、安全、可靠的网络应用。在实际开发中，应根据应用的具体需求选择合适的网络请求方案，并注意性能优化和用户体验。