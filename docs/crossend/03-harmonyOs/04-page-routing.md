---
title: "页面路由"
category: "跨端 · HarmonyOS"
tags:
  - HarmonyOS
excerpt: "在 HarmonyOS 应用开发中，页面路由（Page Routing）是实现页面之间跳转和数据传递的核心机制。合理使用页面路由可以提供流畅的用户体验，使应用的导航结构清晰易用。本章节将详细介绍 HarmonyOS 中的页面路由机制，包括基..."
---

# 页面路由

在 HarmonyOS 应用开发中，页面路由（Page Routing）是实现页面之间跳转和数据传递的核心机制。合理使用页面路由可以提供流畅的用户体验，使应用的导航结构清晰易用。本章节将详细介绍 HarmonyOS 中的页面路由机制，包括基本导航、参数传递、路由栈管理以及高级路由功能。

## 1. 页面路由概述

### 1.1 什么是页面路由

页面路由是指在应用中实现不同页面之间的跳转和导航的机制。它负责：

- 管理页面的加载和销毁
- 维护页面的导航历史（路由栈）
- 支持页面间的数据传递
- 提供页面跳转的动画效果

### 1.2 路由的基本概念

#### 1.2.1 路由栈

HarmonyOS 使用栈（Stack）数据结构来管理页面路由，称为路由栈（Routing Stack）：

- **入栈（Push）**：打开新页面时，新页面会被添加到路由栈的顶部
- **出栈（Pop）**：返回上一页时，当前页面会从路由栈顶部移除
- **栈顶页面**：当前显示在屏幕上的页面

#### 1.2.2 路由模式

HarmonyOS 支持两种主要的路由模式：

- **标准模式**：每次打开新页面都会创建一个新的页面实例
- **单例模式**：确保路由栈中只有一个特定页面的实例

## 2. 基本路由操作

### 2.1 使用 router 模块

HarmonyOS 提供了 `@ohos.router` 模块来实现页面路由功能。首先需要导入该模块：

```typescript
import router from '@ohos.router';
```

### 2.2 页面跳转

#### 2.2.1 基本跳转

使用 `router.pushUrl()` 方法可以跳转到新页面：

```typescript
import router from '@ohos.router';

@Entry
@Component
struct HomePage {
  build() {
    Column({
      space: 20
    }) {
      Text('首页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Button('跳转到详情页')
        .onClick(() => {
          // 跳转到详情页
          router.pushUrl({
            url: 'pages/DetailPage'
          }).then(() => {
            console.log('跳转成功');
          }).catch(err => {
            console.error('跳转失败:', err);
          });
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

#### 2.2.2 返回上一页

使用 `router.back()` 方法可以返回上一页：

```typescript
import router from '@ohos.router';

@Entry
@Component
struct DetailPage {
  build() {
    Column({
      space: 20
    }) {
      Text('详情页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Button('返回上一页')
        .onClick(() => {
          // 返回上一页
          router.back().then(() => {
            console.log('返回成功');
          }).catch(err => {
            console.error('返回失败:', err);
          });
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

### 2.3 路由配置

在使用路由跳转前，需要在应用的配置文件中注册页面。

#### 2.3.1 页面配置

在 `config.json`（API 9 之前）或 `module.json5`（API 9 及之后）文件中配置页面：

```json
// module.json5 示例（API 9+）
{
  "module": {
    "name": "entry",
    "type": "entry",
    "description": "示例应用",
    "mainElement": "EntryAbility",
    "deviceTypes": ["phone", "tablet"],
    "distributionCertificates": ["DISTRIBUTION_CERTIFICATE"],
    "pages": [
      "pages/HomePage",
      "pages/DetailPage",
      "pages/AboutPage"
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

## 3. 页面参数传递

### 3.1 正向传递参数

在页面跳转时，可以通过 `params` 参数向目标页面传递数据：

```typescript
// 首页 - 发送参数
import router from '@ohos.router';

@Entry
@Component
struct HomePage {
  @State message: string = '';
  
  build() {
    Column({
      space: 20
    }) {
      Text('首页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      TextInput({
        placeholder: '请输入要传递的消息'
      })
        .width('100%')
        .height(50)
        .backgroundColor('#f0f0f0')
        .padding(10)
        .onChange((value) => {
          this.message = value;
        })
      
      Button('跳转到详情页并传递参数')
        .onClick(() => {
          router.pushUrl({
            url: 'pages/DetailPage',
            params: {
              message: this.message,
              userId: '123456',
              isVip: true,
              score: 95.5
            }
          }).then(() => {
            console.log('跳转成功');
          }).catch(err => {
            console.error('跳转失败:', err);
          });
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

### 3.2 接收页面参数

目标页面可以通过 `router.getParams()` 方法获取传递过来的参数：

```typescript
// 详情页 - 接收参数
import router from '@ohos.router';

@Entry
@Component
struct DetailPage {
  @State message: string = '';
  @State userId: string = '';
  @State isVip: boolean = false;
  @State score: number = 0;
  
  // 组件创建时获取参数
  aboutToAppear() {
    // 获取路由参数
    const params = router.getParams();
    if (params) {
      this.message = params.message as string || '无消息';
      this.userId = params.userId as string || '';
      this.isVip = params.isVip as boolean || false;
      this.score = params.score as number || 0;
    }
  }
  
  build() {
    Column({
      space: 15
    }) {
      Text('详情页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Text(`接收到的消息: ${this.message}`)
        .fontSize(16)
      Text(`用户ID: ${this.userId}`)
        .fontSize(16)
      Text(`是否VIP: ${this.isVip ? '是' : '否'}`)
        .fontSize(16)
      Text(`分数: ${this.score}`)
        .fontSize(16)
      
      Button('返回上一页')
        .onClick(() => {
          router.back();
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

### 3.3 返回时传递参数

从目标页面返回时，可以通过 `router.back()` 方法的 `params` 参数向源页面传递数据：

#### 3.3.1 目标页面（返回时传递参数）

```typescript
// 详情页 - 返回时传递参数
import router from '@ohos.router';

@Entry
@Component
struct DetailPage {
  @State result: string = '';
  
  build() {
    Column({
      space: 20
    }) {
      Text('详情页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      TextInput({
        placeholder: '请输入返回结果'
      })
        .width('100%')
        .height(50)
        .backgroundColor('#f0f0f0')
        .padding(10)
        .onChange((value) => {
          this.result = value;
        })
      
      Button('返回首页并传递结果')
        .onClick(() => {
          router.back({
            params: {
              result: this.result,
              success: true,
              timestamp: new Date().getTime()
            }
          });
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

#### 3.3.2 源页面（接收返回参数）

源页面需要监听 `router.BackEvent` 事件来接收返回参数：

```typescript
// 首页 - 接收返回参数
import router from '@ohos.router';
import promptAction from '@ohos.promptAction';

@Entry
@Component
struct HomePage {
  @State result: string = '';
  
  // 组件创建时注册返回事件监听
  aboutToAppear() {
    // 监听返回事件
    router.onBackPress((event) => {
      // 处理返回参数
      if (event.params) {
        const result = event.params.result as string;
        const success = event.params.success as boolean;
        const timestamp = event.params.timestamp as number;
        
        this.result = `结果: ${result}, 成功: ${success}, 时间戳: ${timestamp}`;
        
        // 显示提示
        promptAction.showToast({
          message: `接收到返回参数: ${result}`,
          duration: 2000
        });
      }
      return false; // false 表示继续执行默认的返回行为
    });
  }
  
  // 组件销毁时取消事件监听
  aboutToDisappear() {
    // 取消返回事件监听
    router.offBackPress();
  }
  
  build() {
    Column({
      space: 20
    }) {
      Text('首页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Text(`返回结果: ${this.result}`)
        .fontSize(16)
        .textAlign(TextAlign.Center)
      
      Button('跳转到详情页')
        .onClick(() => {
          router.pushUrl({
            url: 'pages/DetailPage'
          });
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

## 4. 路由栈管理

### 4.1 路由栈操作

HarmonyOS 提供了多种路由栈操作方法，用于管理页面的导航历史：

#### 4.1.1 替换当前页面

使用 `router.replaceUrl()` 方法可以替换当前页面，当前页面会被移除出路由栈：

```typescript
import router from '@ohos.router';

@Entry
@Component
struct LoginPage {
  build() {
    Column({
      space: 20
    }) {
      Text('登录页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Button('登录成功，进入首页')
        .onClick(() => {
          // 登录成功后，替换当前页面为首页
          // 这样用户就无法通过返回按钮回到登录页
          router.replaceUrl({
            url: 'pages/HomePage'
          });
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

#### 4.1.2 清空路由栈并跳转

使用 `router.clear()` 方法可以清空整个路由栈，然后使用 `router.pushUrl()` 跳转到新页面：

```typescript
import router from '@ohos.router';

@Entry
@Component
struct UserCenterPage {
  build() {
    Column({
      space: 20
    }) {
      Text('用户中心')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Button('退出登录')
        .onClick(() => {
          // 清空路由栈
          router.clear();
          
          // 跳转到登录页
          router.pushUrl({
            url: 'pages/LoginPage'
          });
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

### 4.2 获取当前路由信息

可以使用 `router.getState()` 方法获取当前路由的状态信息：

```typescript
import router from '@ohos.router';
import promptAction from '@ohos.promptAction';

@Entry
@Component
struct HomePage {
  build() {
    Column({
      space: 20
    }) {
      Text('首页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Button('获取当前路由信息')
        .onClick(() => {
          // 获取当前路由状态
          const state = router.getState();
          
          console.log('当前路由信息:', JSON.stringify(state));
          
          promptAction.showToast({
            message: `当前页面: ${state.currentPath}, 路由栈大小: ${state.stackLength}`,
            duration: 2000
          });
        })
      
      Button('跳转到详情页')
        .onClick(() => {
          router.pushUrl({
            url: 'pages/DetailPage'
          });
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

### 4.3 获取路由栈信息

可以使用 `router.getLength()` 和 `router.getRouteInfoArray()` 方法获取路由栈的详细信息：

```typescript
import router from '@ohos.router';
import promptAction from '@ohos.promptAction';

@Entry
@Component
struct HomePage {
  build() {
    Column({
      space: 20
    }) {
      Text('首页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Button('获取路由栈信息')
        .onClick(() => {
          // 获取路由栈长度
          const stackLength = router.getLength();
          
          // 获取路由栈详细信息
          const routeInfoArray = router.getRouteInfoArray();
          
          console.log(`路由栈长度: ${stackLength}`);
          console.log('路由栈信息:', JSON.stringify(routeInfoArray));
          
          // 显示路由栈信息
          let message = `路由栈长度: ${stackLength}\n`;
          routeInfoArray.forEach((route, index) => {
            message += `${index + 1}. ${route.path}\n`;
          });
          
          promptAction.showToast({
            message: message,
            duration: 3000
          });
        })
      
      Button('跳转到详情页')
        .onClick(() => {
          router.pushUrl({
            url: 'pages/DetailPage'
          });
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

## 5. 高级路由功能

### 5.1 页面转场动画

HarmonyOS 支持自定义页面跳转时的转场动画效果。

#### 5.1.1 设置转场动画

在 `router.pushUrl()` 或 `router.replaceUrl()` 方法中，可以通过 `animationType` 和 `animationDuration` 参数设置转场动画：

```typescript
import router from '@ohos.router';

@Entry
@Component
struct HomePage {
  build() {
    Column({
      space: 20
    }) {
      Text('首页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Button('默认动画跳转')
        .onClick(() => {
          router.pushUrl({
            url: 'pages/DetailPage'
          });
        })
      
      Button('淡入淡出动画跳转')
        .onClick(() => {
          router.pushUrl({
            url: 'pages/DetailPage',
            params: {
              title: '淡入淡出动画'
            }
          },
          router.RouterMode.Single,
          router.RouterAnimation.Opacity // 淡入淡出动画
        );
      })
      
      Button('从右侧滑入动画跳转')
        .onClick(() => {
          router.pushUrl({
            url: 'pages/DetailPage',
            params: {
              title: '从右侧滑入动画'
            }
          },
          router.RouterMode.Single,
          router.RouterAnimation.Slide // 滑入动画
        );
      })
      
      Button('从底部滑入动画跳转')
        .onClick(() => {
          router.pushUrl({
            url: 'pages/DetailPage',
            params: {
              title: '从底部滑入动画'
            }
          },
          router.RouterMode.Single,
          router.RouterAnimation.None // 无动画，可以自定义
        );
        
        // 注意：RouterAnimation.None 表示不使用系统默认动画，
        // 但仍然可以通过页面组件的 transition 属性自定义动画
      })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

#### 5.1.2 页面组件的过渡动画

除了系统提供的转场动画，还可以在页面组件上使用 `transition` 属性定义自定义的过渡动画：

```typescript
// 详情页 - 自定义过渡动画
import router from '@ohos.router';

@Entry
@Component
struct DetailPage {
  @State title: string = '详情页';
  
  aboutToAppear() {
    const params = router.getParams();
    if (params && params.title) {
      this.title = params.title as string;
    }
  }
  
  build() {
    Column({
      space: 20
    }) {
      Text(this.title)
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      // 自定义过渡动画的内容区域
      Column({
        space: 10
      }) {
        Text('这是一个带有自定义过渡动画的页面')
          .fontSize(16)
        
        Text('当页面进入或离开时，会显示缩放和透明度动画')
          .fontSize(14)
          .textColor(Color.Gray)
      }
      .width('100%')
      .height(200)
      .backgroundColor('#f0f0f0')
      .padding(20)
      .borderRadius(10)
      // 定义过渡动画
      .transition({
        type: TransitionType.All, // 应用于所有过渡（进入、离开）
        opacity: [0, 1], // 透明度从 0 到 1
        scale: [0.8, 1], // 缩放从 0.8 到 1
        duration: 500, // 动画持续时间 500ms
        curve: Curve.EaseOut // 动画曲线
      })
      
      Button('返回上一页')
        .onClick(() => {
          router.back();
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
    // 页面进入时的动画
    .animation({
      duration: 500,
      curve: Curve.EaseOut
    })
  }
}
```

### 5.2 路由模式

HarmonyOS 支持两种路由模式：

#### 5.2.1 标准模式（Standard）

标准模式下，每次跳转都会创建一个新的页面实例：

```typescript
import router from '@ohos.router';

@Entry
@Component
struct HomePage {
  build() {
    Column({
      space: 20
    }) {
      Text('首页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Button('标准模式跳转到详情页')
        .onClick(() => {
          router.pushUrl({
            url: 'pages/DetailPage'
          },
          router.RouterMode.Standard // 标准模式
          );
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

#### 5.2.2 单例模式（Single）

单例模式下，如果目标页面已经在路由栈中，则会将该页面移到栈顶，而不是创建新实例：

```typescript
import router from '@ohos.router';

@Entry
@Component
struct HomePage {
  build() {
    Column({
      space: 20
    }) {
      Text('首页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Button('单例模式跳转到详情页')
        .onClick(() => {
          router.pushUrl({
            url: 'pages/DetailPage'
          },
          router.RouterMode.Single // 单例模式
          );
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

## 6. 路由工具类

为了更好地管理应用的路由，可以创建一个路由工具类，封装常用的路由操作：

### 6.1 创建路由工具类

```typescript
// routerUtil.ts
import router from '@ohos.router';

// 页面路由路径枚举
export enum RoutePath {
  HOME = 'pages/HomePage',
  LOGIN = 'pages/LoginPage',
  DETAIL = 'pages/DetailPage',
  ABOUT = 'pages/AboutPage',
  USER_CENTER = 'pages/UserCenterPage'
}

// 路由工具类
export class RouterUtil {
  /**
   * 跳转页面（标准模式）
   * @param path 页面路径
   * @param params 传递的参数
   * @param animationType 转场动画类型
   */
  static push(path: string, params?: object, animationType?: router.RouterAnimation): Promise<void> {
    return router.pushUrl({
      url: path,
      params: params
    }, router.RouterMode.Standard, animationType);
  }
  
  /**
   * 跳转页面（单例模式）
   * @param path 页面路径
   * @param params 传递的参数
   * @param animationType 转场动画类型
   */
  static pushSingle(path: string, params?: object, animationType?: router.RouterAnimation): Promise<void> {
    return router.pushUrl({
      url: path,
      params: params
    }, router.RouterMode.Single, animationType);
  }
  
  /**
   * 替换当前页面
   * @param path 页面路径
   * @param params 传递的参数
   * @param animationType 转场动画类型
   */
  static replace(path: string, params?: object, animationType?: router.RouterAnimation): Promise<void> {
    return router.replaceUrl({
      url: path,
      params: params
    }, router.RouterMode.Standard, animationType);
  }
  
  /**
   * 返回上一页
   * @param params 返回时传递的参数
   */
  static back(params?: object): Promise<void> {
    return router.back(params ? { params } : undefined);
  }
  
  /**
   * 返回到指定页面
   * @param index 页面在路由栈中的索引（0 表示首页）
   * @param params 返回时传递的参数
   */
  static backToIndex(index: number, params?: object): Promise<void> {
    return router.backTo({ index, params: params || {} });
  }
  
  /**
   * 清空路由栈并跳转到指定页面
   * @param path 页面路径
   * @param params 传递的参数
   */
  static clearAndPush(path: string, params?: object): Promise<void> {
    router.clear();
    return router.pushUrl({
      url: path,
      params: params
    });
  }
  
  /**
   * 获取当前页面参数
   */
  static getParams(): Record<string, any> {
    return router.getParams() || {};
  }
  
  /**
   * 获取当前路由状态
   */
  static getState(): router.RouterState {
    return router.getState();
  }
  
  /**
   * 获取路由栈长度
   */
  static getStackLength(): number {
    return router.getLength();
  }
  
  /**
   * 获取路由栈信息
   */
  static getStackInfo(): Array<router.RouteInfo> {
    return router.getRouteInfoArray();
  }
  
  /**
   * 注册返回事件监听
   * @param callback 回调函数
   */
  static onBackPress(callback: (event: router.BackPressCallbackInfo) => boolean): void {
    router.onBackPress(callback);
  }
  
  /**
   * 取消返回事件监听
   */
  static offBackPress(): void {
    router.offBackPress();
  }
}
```

### 6.2 使用路由工具类

```typescript
// 导入路由工具类
import { RouterUtil, RoutePath } from '../utils/routerUtil';
import promptAction from '@ohos.promptAction';

@Entry
@Component
struct HomePage {
  @State result: string = '';
  
  aboutToAppear() {
    // 使用路由工具类注册返回事件监听
    RouterUtil.onBackPress((event) => {
      if (event.params) {
        this.result = `返回结果: ${event.params.result}`;
        promptAction.showToast({
          message: `接收到返回参数: ${event.params.result}`,
          duration: 2000
        });
      }
      return false;
    });
  }
  
  aboutToDisappear() {
    // 取消返回事件监听
    RouterUtil.offBackPress();
  }
  
  build() {
    Column({
      space: 20
    }) {
      Text('首页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Text(`返回结果: ${this.result}`)
        .fontSize(16)
        .textAlign(TextAlign.Center)
      
      Button('跳转到详情页')
        .onClick(() => {
          // 使用路由工具类跳转页面
          RouterUtil.push(RoutePath.DETAIL, {
            message: 'Hello from HomePage',
            userId: '123'
          });
        })
      
      Button('单例模式跳转到详情页')
        .onClick(() => {
          RouterUtil.pushSingle(RoutePath.DETAIL, {
            message: 'Single mode'
          });
        })
      
      Button('获取路由栈信息')
        .onClick(() => {
          const stackLength = RouterUtil.getStackLength();
          const stackInfo = RouterUtil.getStackInfo();
          
          console.log(`路由栈长度: ${stackLength}`);
          console.log('路由栈信息:', JSON.stringify(stackInfo));
          
          promptAction.showToast({
            message: `路由栈长度: ${stackLength}`,
            duration: 2000
          });
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

```typescript
// 详情页 - 使用路由工具类
import { RouterUtil, RoutePath } from '../utils/routerUtil';

@Entry
@Component
struct DetailPage {
  @State message: string = '';
  @State userId: string = '';
  
  aboutToAppear() {
    // 使用路由工具类获取参数
    const params = RouterUtil.getParams();
    this.message = params.message as string || '无消息';
    this.userId = params.userId as string || '';
  }
  
  build() {
    Column({
      space: 20
    }) {
      Text('详情页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Text(`消息: ${this.message}`)
        .fontSize(16)
      Text(`用户ID: ${this.userId}`)
        .fontSize(16)
      
      Button('返回上一页')
        .onClick(() => {
          // 使用路由工具类返回
          RouterUtil.back({
            result: '操作成功',
            timestamp: new Date().getTime()
          });
        })
      
      Button('跳转到关于页')
        .onClick(() => {
          RouterUtil.push(RoutePath.ABOUT);
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

## 7. 路由守卫

路由守卫是一种在页面跳转前后执行特定逻辑的机制，可以用于：

- 权限验证（如登录检查）
- 页面访问控制
- 数据预加载
- 页面离开前的确认

### 7.1 实现简单的路由守卫

```typescript
// routerGuard.ts
import router from '@ohos.router';
import { RouterUtil, RoutePath } from './routerUtil';

// 路由守卫类
export class RouterGuard {
  private static isInitialized = false;
  
  /**
   * 初始化路由守卫
   */
  static init() {
    if (this.isInitialized) return;
    
    // 注册全局路由事件监听
    this.setupGlobalListeners();
    
    this.isInitialized = true;
    console.log('路由守卫初始化完成');
  }
  
  /**
   * 设置全局路由事件监听
   */
  private static setupGlobalListeners() {
    // 可以在这里添加全局的路由事件监听
    // 目前 HarmonyOS 的 router 模块没有提供全局的路由跳转前事件监听
    // 所以我们通过包装 RouterUtil 的方法来实现路由守卫
  }
  
  /**
   * 检查是否需要登录
   * @param path 要跳转的页面路径
   * @returns 是否需要登录
   */
  private static needLogin(path: string): boolean {
    // 定义需要登录的页面列表
    const needLoginPages = [
      RoutePath.USER_CENTER
    ];
    
    return needLoginPages.includes(path);
  }
  
  /**
   * 检查用户是否已登录
   * @returns 是否已登录
   */
  private static isLoggedIn(): boolean {
    // 这里应该从应用状态管理中获取登录状态
    // 这里只是一个示例
    const isLoggedIn = AppStorage.Get<boolean>('isLoggedIn') || false;
    return isLoggedIn;
  }
  
  /**
   * 带权限检查的页面跳转
   * @param path 页面路径
   * @param params 传递的参数
   * @param animationType 转场动画类型
   */
  static pushWithAuth(path: string, params?: object, animationType?: router.RouterAnimation): Promise<void> {
    // 检查是否需要登录
    if (this.needLogin(path) && !this.isLoggedIn()) {
      // 未登录，跳转到登录页
      console.log(`访问 ${path} 需要登录，当前未登录，跳转到登录页`);
      return RouterUtil.push(RoutePath.LOGIN, { redirectPath: path, redirectParams: params });
    }
    
    // 已登录或不需要登录，正常跳转
    return RouterUtil.push(path, params, animationType);
  }
  
  /**
   * 登录成功后的重定向处理
   */
  static handleRedirectAfterLogin(): void {
    // 从路由参数中获取重定向信息
    const params = RouterUtil.getParams();
    
    if (params.redirectPath) {
      const redirectPath = params.redirectPath as string;
      const redirectParams = params.redirectParams as object || {};
      
      console.log(`登录成功，重定向到 ${redirectPath}`);
      
      // 替换当前登录页为目标页面
      RouterUtil.replace(redirectPath, redirectParams);
    } else {
      // 没有重定向信息，跳转到首页
      RouterUtil.replace(RoutePath.HOME);
    }
  }
}
```

### 7.2 使用路由守卫

```typescript
// 首页 - 使用路由守卫
import { RouterGuard } from '../utils/routerGuard';
import { RouterUtil, RoutePath } from '../utils/routerUtil';

@Entry
@Component
struct HomePage {
  // 组件创建时初始化路由守卫
  aboutToAppear() {
    // 初始化路由守卫
    RouterGuard.init();
  }
  
  build() {
    Column({
      space: 20
    }) {
      Text('首页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      Button('访问不需要登录的页面（详情页）')
        .onClick(() => {
          RouterUtil.push(RoutePath.DETAIL);
        })
      
      Button('访问需要登录的页面（用户中心）')
        .onClick(() => {
          // 使用带权限检查的跳转方法
          RouterGuard.pushWithAuth(RoutePath.USER_CENTER, {
            message: '需要登录才能访问'
          });
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

```typescript
// 登录页 - 处理登录和重定向
import { RouterGuard } from '../utils/routerGuard';
import { RouterUtil, RoutePath } from '../utils/routerUtil';
import promptAction from '@ohos.promptAction';

@Entry
@Component
struct LoginPage {
  @State username: string = '';
  @State password: string = '';
  
  build() {
    Column({
      space: 20
    }) {
      Text('登录页')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      TextInput({
        placeholder: '请输入用户名'
      })
        .width('100%')
        .height(50)
        .backgroundColor('#f0f0f0')
        .padding(10)
        .onChange((value) => {
          this.username = value;
        })
      
      TextInput({
        placeholder: '请输入密码',
        securityMode: InputSecurityMode.Password
      })
        .width('100%')
        .height(50)
        .backgroundColor('#f0f0f0')
        .padding(10)
        .onChange((value) => {
          this.password = value;
        })
      
      Button('登录')
        .onClick(() => {
          if (!this.username || !this.password) {
            promptAction.showToast({
              message: '请输入用户名和密码',
              duration: 2000
            });
            return;
          }
          
          // 模拟登录请求
          console.log(`登录请求: 用户名=${this.username}, 密码=${this.password}`);
          
          // 模拟登录成功
          // 在实际应用中，这里应该调用登录 API
          setTimeout(() => {
            // 保存登录状态
            AppStorage.Set<boolean>('isLoggedIn', true);
            AppStorage.Set<string>('username', this.username);
            
            promptAction.showToast({
              message: '登录成功',
              duration: 2000
            });
            
            // 处理登录后的重定向
            RouterGuard.handleRedirectAfterLogin();
          }, 1000);
        })
      
      Button('取消')
        .onClick(() => {
          RouterUtil.back();
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

## 8. 最佳实践

### 8.1 路由设计原则

#### 8.1.1 清晰的路由结构

- 使用有意义的页面路径和组件名称
- 按照功能模块组织页面结构
- 避免过深的页面层级（建议不超过 5 层）

#### 8.1.2 统一的路由管理

- 使用路由工具类封装路由操作
- 定义页面路径枚举，避免硬编码
- 集中管理需要权限的页面

### 8.2 性能优化

#### 8.2.1 减少路由栈深度

- 对于不需要返回的页面（如登录成功后），使用 `replaceUrl` 替换当前页面
- 对于流程结束的页面，使用 `clear` 清空路由栈

#### 8.2.2 合理使用单例模式

- 对于频繁访问的页面（如首页、搜索页），使用单例模式可以减少内存占用
- 避免在路由栈中创建大量相同页面的实例

### 8.3 用户体验优化

#### 8.3.1 提供清晰的导航反馈

- 使用合适的转场动画，提供视觉反馈
- 对于耗时的页面跳转，可以添加加载指示器
- 处理页面跳转失败的情况，提供友好的错误提示

#### 8.3.2 支持返回手势

HarmonyOS 支持手势导航，用户可以通过滑动手势返回上一页。确保应用正确处理这些手势。

#### 8.3.3 处理特殊情况

- 处理页面不存在的情况
- 处理参数缺失或格式错误的情况
- 处理网络请求失败时的页面跳转

## 9. 常见问题与解决方案

### 9.1 页面跳转失败

**问题描述**：调用 `router.pushUrl()` 后页面没有跳转，或者抛出错误。

**解决方案**：

- 检查页面路径是否正确配置在 `module.json5` 文件中
- 确保页面文件存在且路径正确
- 检查是否有语法错误或运行时错误
- 查看日志中的错误信息

### 9.2 参数传递失败

**问题描述**：页面跳转时传递的参数在目标页面无法获取。

**解决方案**：

- 确保在 `router.pushUrl()` 方法中正确设置了 `params` 参数
- 在目标页面的 `aboutToAppear()` 生命周期方法中获取参数
- 检查参数的类型和名称是否匹配
- 使用 `JSON.stringify()` 和 `JSON.parse()` 处理复杂类型的参数

### 9.3 路由栈溢出

**问题描述**：应用出现路由栈溢出错误，通常是因为页面层级过深。

**解决方案**：

- 检查应用的导航逻辑，避免无限循环跳转
- 对于不需要返回的页面，使用 `replaceUrl` 替换当前页面
- 使用 `clear` 方法清空路由栈，特别是在登录/登出等关键流程

### 9.4 页面无法返回

**问题描述**：用户点击返回按钮或调用 `router.back()` 后，页面没有返回。

**解决方案**：

- 检查是否在 `onBackPress` 回调中返回了 `true`，这会阻止默认的返回行为
- 确保路由栈中还有其他页面
- 检查是否有异常阻止了返回操作

## 10. 总结

页面路由是 HarmonyOS 应用开发中的重要组成部分，合理使用页面路由可以提供流畅的用户体验。本章节介绍了 HarmonyOS 中的页面路由机制，包括：

1. **基本路由操作**：使用 `router` 模块实现页面跳转和返回
2. **页面参数传递**：在页面跳转时传递和接收参数
3. **路由栈管理**：管理页面的导航历史和路由栈
4. **高级路由功能**：自定义转场动画和路由模式
5. **路由工具类**：封装常用的路由操作，提高代码可维护性
6. **路由守卫**：实现页面访问控制和权限验证

通过合理使用这些功能，可以构建出导航结构清晰、用户体验良好的 HarmonyOS 应用。在实际开发中，建议创建路由工具类和路由守卫，统一管理应用的路由，提高代码的可维护性和可扩展性。

最后，要注意路由设计的最佳实践，包括清晰的路由结构、统一的路由管理、性能优化和用户体验优化，以确保应用的导航流畅、稳定。