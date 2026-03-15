---
title: "状态管理"
category: "跨端 · HarmonyOS"
tags:
  - HarmonyOS
excerpt: "在 HarmonyOS 应用开发中，状态管理是构建高质量用户界面的关键。合理的状态管理能够使应用更加稳定、可维护，并提供更好的用户体验。本章节将详细介绍 HarmonyOS 中的状态管理机制，包括内置的状态装饰器、应用级状态管理方案以及最佳..."
---

# 状态管理

在 HarmonyOS 应用开发中，状态管理是构建高质量用户界面的关键。合理的状态管理能够使应用更加稳定、可维护，并提供更好的用户体验。本章节将详细介绍 HarmonyOS 中的状态管理机制，包括内置的状态装饰器、应用级状态管理方案以及最佳实践。

## 1. 状态管理概述

### 1.1 什么是状态

状态（State）是应用中可以变化的数据，这些数据会影响应用的 UI 展示。例如：
- 用户输入的文本
- 按钮的点击次数
- 列表数据的加载状态
- 用户的登录状态

### 1.2 为什么需要状态管理

- **UI 与数据同步**：确保 UI 能够准确反映应用的当前状态
- **组件间通信**：实现组件之间的数据传递和共享
- **应用逻辑组织**：将业务逻辑与 UI 展示分离，提高代码可维护性
- **用户体验优化**：通过合理的状态管理提供流畅的用户体验

### 1.3 状态管理的层次

HarmonyOS 中的状态管理可以分为以下几个层次：

- **组件内部状态**：组件自身的状态，只影响当前组件
- **组件间状态**：父子组件或兄弟组件之间共享的状态
- **页面级状态**：单个页面内多个组件共享的状态
- **应用级状态**：整个应用共享的状态，如用户信息、主题设置等

## 2. 组件内部状态

### 2.1 @State 装饰器

`@State` 是最基本的状态装饰器，用于管理组件内部的状态。当 `@State` 装饰的变量发生变化时，组件会自动重新渲染。

#### 2.1.1 基本用法

```typescript
@Entry
@Component
struct CounterComponent {
  // 使用 @State 装饰器定义计数状态
  @State count: number = 0;
  
  build() {
    Column({
      space: 20
    }) {
      // 显示当前计数
      Text(`计数: ${this.count}`)
        .fontSize(30)
        .fontWeight(FontWeight.Bold)
      
      // 点击按钮增加计数
      Button('增加计数')
        .onClick(() => {
          // 修改状态变量，触发组件重新渲染
          this.count++;
        })
      
      // 点击按钮减少计数
      Button('减少计数')
        .onClick(() => {
          this.count--;
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}
```

#### 2.1.2 支持的数据类型

`@State` 装饰器支持以下数据类型：

- 基本数据类型：`number`、`string`、`boolean`、`enum`
- 复杂数据类型：`object`、`array`
- 自定义类型：使用 `@Observed` 装饰的类的实例

#### 2.1.3 复杂数据类型的状态管理

```typescript
@Entry
@Component
struct ComplexStateComponent {
  // 对象类型的状态
  @State userInfo: {
    name: string;
    age: number;
    isActive: boolean;
  } = {
    name: '张三',
    age: 25,
    isActive: true
  };
  
  // 数组类型的状态
  @State hobbies: string[] = ['阅读', '运动', '音乐'];
  
  build() {
    Column({
      space: 20
    }) {
      // 显示用户信息
      Text(`姓名: ${this.userInfo.name}`)
      Text(`年龄: ${this.userInfo.age}`)
      Text(`状态: ${this.userInfo.isActive ? '在线' : '离线'}`)
      
      // 更新用户信息
      Button('更新用户信息')
        .onClick(() => {
          // 直接修改对象属性，会触发重新渲染
          this.userInfo.name = '李四';
          this.userInfo.age = 30;
          this.userInfo.isActive = false;
        })
      
      // 显示爱好列表
      Text('爱好:')
        .fontWeight(FontWeight.Bold)
      List() {
        ForEach(this.hobbies, (hobby) => {
          ListItem() {
            Text(hobby)
              .padding(10)
          }
        }, (hobby) => hobby)
      }
      .width('100%')
      .height(150)
      
      // 添加爱好
      Button('添加爱好')
        .onClick(() => {
          // 修改数组，会触发重新渲染
          this.hobbies.push('旅行');
        })
    }
    .width('100%')
    .height('100%')
    .padding(20)
  }
}
```

## 3. 组件间状态管理

### 3.1 父子组件状态传递

#### 3.1.1 @Prop 装饰器

`@Prop` 装饰器用于实现父子组件之间的单向数据传递，父组件可以向子组件传递数据，但子组件不能直接修改父组件传递的数据。

```typescript
// 父组件
@Entry
@Component
struct ParentComponent {
  // 父组件的状态
  @State parentCount: number = 0;
  
  build() {
    Column({
      space: 20
    }) {
      // 显示父组件的计数
      Text(`父组件计数: ${this.parentCount}`)
        .fontSize(20)
      
      // 父组件的按钮，用于修改父组件的状态
      Button('父组件增加计数')
        .onClick(() => {
          this.parentCount++;
        })
      
      // 将父组件的状态传递给子组件
      ChildComponent({ count: this.parentCount })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}

// 子组件
@Component
struct ChildComponent {
  // 使用 @Prop 装饰器接收父组件传递的数据
  @Prop count: number;
  
  build() {
    Column({
      space: 10
    }) {
      // 显示从父组件接收到的计数
      Text(`子组件计数: ${this.count}`)
        .fontSize(20)
      
      // 子组件的按钮，尝试修改接收到的数据（这种方式不会影响父组件）
      Button('子组件增加计数（无效）')
        .onClick(() => {
          // 这里的修改只在子组件内部有效，不会影响父组件
          this.count++;
          console.log('子组件内部计数:', this.count);
        })
    }
    .padding(20)
    .backgroundColor('#f0f0f0')
    .borderRadius(10)
  }
}
```

#### 3.1.2 @Link 装饰器

`@Link` 装饰器用于实现父子组件之间的双向数据绑定，子组件可以直接修改父组件传递的数据。

```typescript
// 父组件
@Entry
@Component
struct ParentComponent {
  // 父组件的状态
  @State parentCount: number = 0;
  
  build() {
    Column({
      space: 20
    }) {
      // 显示父组件的计数
      Text(`父组件计数: ${this.parentCount}`)
        .fontSize(20)
      
      // 父组件的按钮，用于修改父组件的状态
      Button('父组件增加计数')
        .onClick(() => {
          this.parentCount++;
        })
      
      // 使用 $ 符号传递引用，实现双向绑定
      ChildComponent({ count: $parentCount })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}

// 子组件
@Component
struct ChildComponent {
  // 使用 @Link 装饰器接收父组件传递的引用
  @Link count: number;
  
  build() {
    Column({
      space: 10
    }) {
      // 显示从父组件接收到的计数
      Text(`子组件计数: ${this.count}`)
        .fontSize(20)
      
      // 子组件的按钮，直接修改父组件的状态
      Button('子组件增加计数（有效）')
        .onClick(() => {
          // 这里的修改会直接影响父组件的状态
          this.count++;
        })
    }
    .padding(20)
    .backgroundColor('#f0f0f0')
    .borderRadius(10)
  }
}
```

### 3.2 跨组件层级状态共享

#### 3.2.1 @Provide 和 @Consume 装饰器

`@Provide` 和 `@Consume` 装饰器用于实现跨组件层级的状态共享，适用于祖先组件向后代组件传递数据，无论组件层级有多深。

```typescript
// 祖先组件
@Entry
@Component
struct GrandparentComponent {
  // 使用 @Provide 装饰器提供共享状态
  @Provide appTheme: string = 'light';
  @Provide fontSize: number = 16;
  
  build() {
    Column({
      space: 20
    }) {
      Text('祖先组件')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      // 切换主题
      Button(`当前主题: ${this.appTheme}，点击切换`)
        .onClick(() => {
          this.appTheme = this.appTheme === 'light' ? 'dark' : 'light';
        })
      
      // 调整字体大小
      Button(`当前字体大小: ${this.fontSize}px，点击增加`)
        .onClick(() => {
          this.fontSize += 2;
        })
      
      // 父组件
      ParentComponent()
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
    .backgroundColor(this.appTheme === 'light' ? '#ffffff' : '#333333')
  }
}

// 父组件
@Component
struct ParentComponent {
  build() {
    Column({
      space: 20
    }) {
      Text('父组件')
        .fontSize(20)
        .fontWeight(FontWeight.Medium)
      
      // 子组件
      ChildComponent()
    }
    .padding(20)
    .backgroundColor('#f0f0f0')
    .borderRadius(10)
  }
}

// 子组件（后代组件）
@Component
struct ChildComponent {
  // 使用 @Consume 装饰器消费祖先组件提供的状态
  @Consume appTheme: string;
  @Consume fontSize: number;
  
  build() {
    Column({
      space: 10
    }) {
      Text('子组件')
        .fontSize(20)
        .fontWeight(FontWeight.Medium)
      
      // 使用从祖先组件获取的主题和字体大小
      Text(`当前主题: ${this.appTheme}`)
        .fontSize(this.fontSize)
      Text(`当前字体大小: ${this.fontSize}px`)
        .fontSize(this.fontSize)
    }
    .padding(20)
    .backgroundColor(this.appTheme === 'light' ? '#e0e0e0' : '#444444')
    .borderRadius(10)
    .fontColor(this.appTheme === 'light' ? '#000000' : '#ffffff')
  }
}
```

## 4. 对象数据的状态管理

### 4.1 @Observed 和 @ObjectLink 装饰器

对于复杂的对象数据类型，HarmonyOS 提供了 `@Observed` 和 `@ObjectLink` 装饰器，用于实现对象属性变化的响应式管理。

#### 4.1.1 基本用法

```typescript
// 使用 @Observed 装饰器标记可观察的类
@Observed
class User {
  name: string;
  age: number;
  address: {
    city: string;
    street: string;
  };
  
  constructor(name: string, age: number, address: { city: string; street: string }) {
    this.name = name;
    this.age = age;
    this.address = address;
  }
}

@Entry
@Component
struct UserProfileComponent {
  // 创建 User 类的实例作为状态
  @State user: User = new User(
    '张三',
    25,
    {
      city: '北京',
      street: '朝阳路 123 号'
    }
  );
  
  build() {
    Column({
      space: 20
    }) {
      Text('用户信息')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      // 显示用户信息
      Text(`姓名: ${this.user.name}`)
        .fontSize(18)
      Text(`年龄: ${this.user.age}`)
        .fontSize(18)
      Text(`地址: ${this.user.address.city}, ${this.user.address.street}`)
        .fontSize(18)
      
      // 更新用户信息
      Button('更新用户信息')
        .onClick(() => {
          // 修改对象的属性，会触发组件重新渲染
          this.user.name = '李四';
          this.user.age = 30;
          this.user.address.city = '上海';
          this.user.address.street = '南京路 456 号';
        })
      
      // 使用 @ObjectLink 的子组件
      UserDetailComponent({ user: $user })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
  }
}

// 子组件
@Component
struct UserDetailComponent {
  // 使用 @ObjectLink 装饰器链接到父组件的对象状态
  @ObjectLink user: User;
  
  build() {
    Column({
      space: 10
    }) {
      Text('用户详情（子组件）')
        .fontSize(20)
        .fontWeight(FontWeight.Medium)
      
      // 显示用户信息
      Text(`姓名: ${this.user.name}`)
        .fontSize(16)
      Text(`年龄: ${this.user.age}`)
        .fontSize(16)
      Text(`地址: ${this.user.address.city}, ${this.user.address.street}`)
        .fontSize(16)
      
      // 在子组件中更新用户信息
      Button('子组件更新用户年龄')
        .onClick(() => {
          // 这里的修改会直接影响父组件的对象状态
          this.user.age++;
        })
    }
    .padding(20)
    .backgroundColor('#f0f0f0')
    .borderRadius(10)
  }
}
```

#### 4.1.2 注意事项

- `@Observed` 装饰器只能用于类，不能用于接口或类型别名
- 当修改 `@Observed` 类实例的深层属性时，需要确保整个对象引用链都是响应式的
- 对于数组中的 `@Observed` 对象，需要使用索引或扩展运算符来触发重新渲染

## 5. 应用级状态管理

对于需要在整个应用中共享的状态，如用户信息、主题设置、应用配置等，可以使用应用级的状态管理方案。

### 5.1 使用单例模式

单例模式是一种简单的应用级状态管理方案，通过创建全局唯一的状态管理实例来实现状态共享。

#### 5.1.1 创建状态管理类

```typescript
// appStateManager.ts

// 定义应用状态接口
interface AppState {
  userInfo: {
    id: string;
    name: string;
    avatar?: string;
    isLoggedIn: boolean;
  };
  appTheme: 'light' | 'dark';
  language: string;
  fontSize: number;
}

// 创建应用状态管理类（单例模式）
class AppStateManager {
  private static instance: AppStateManager;
  
  // 应用状态
  private state: AppState = {
    userInfo: {
      id: '',
      name: '',
      avatar: '',
      isLoggedIn: false
    },
    appTheme: 'light',
    language: 'zh-CN',
    fontSize: 16
  };
  
  // 状态监听器
  private listeners: Map<string, (state: AppState) => void> = new Map();
  
  // 私有构造函数，防止外部实例化
  private constructor() {}
  
  // 获取单例实例
  public static getInstance(): AppStateManager {
    if (!AppStateManager.instance) {
      AppStateManager.instance = new AppStateManager();
    }
    return AppStateManager.instance;
  }
  
  // 获取当前状态
  public getState(): AppState {
    return { ...this.state };
  }
  
  // 更新用户信息
  public updateUserInfo(userInfo: Partial<AppState['userInfo']>): void {
    this.state.userInfo = { ...this.state.userInfo, ...userInfo };
    this.notifyListeners();
  }
  
  // 切换主题
  public toggleTheme(): void {
    this.state.appTheme = this.state.appTheme === 'light' ? 'dark' : 'light';
    this.notifyListeners();
  }
  
  // 设置语言
  public setLanguage(language: string): void {
    this.state.language = language;
    this.notifyListeners();
  }
  
  // 设置字体大小
  public setFontSize(size: number): void {
    this.state.fontSize = size;
    this.notifyListeners();
  }
  
  // 登录
  public login(userInfo: { id: string; name: string; avatar?: string }): void {
    this.state.userInfo = {
      ...userInfo,
      isLoggedIn: true
    };
    this.notifyListeners();
  }
  
  // 登出
  public logout(): void {
    this.state.userInfo = {
      id: '',
      name: '',
      avatar: '',
      isLoggedIn: false
    };
    this.notifyListeners();
  }
  
  // 注册状态监听器
  public subscribe(key: string, listener: (state: AppState) => void): void {
    this.listeners.set(key, listener);
    // 立即通知一次当前状态
    listener(this.getState());
  }
  
  // 取消状态监听器
  public unsubscribe(key: string): void {
    this.listeners.delete(key);
  }
  
  // 通知所有监听器状态变化
  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => {
      listener(currentState);
    });
  }
}

// 导出单例实例
export const appStateManager = AppStateManager.getInstance();
```

#### 5.1.2 在组件中使用状态管理

```typescript
import { appStateManager } from '../utils/appStateManager';

@Entry
@Component
struct AppStateDemo {
  // 组件内部状态，用于存储从全局状态管理器获取的数据
  @State appState: any = {
    userInfo: {
      name: '',
      isLoggedIn: false
    },
    appTheme: 'light',
    fontSize: 16
  };
  
  // 组件创建时注册状态监听器
  aboutToAppear() {
    // 注册状态监听器，key 可以是组件的唯一标识
    appStateManager.subscribe('AppStateDemo', (state) => {
      // 更新组件内部状态
      this.appState = state;
    });
  }
  
  // 组件销毁时取消状态监听器
  aboutToDisappear() {
    // 取消状态监听器
    appStateManager.unsubscribe('AppStateDemo');
  }
  
  build() {
    Column({
      space: 20
    }) {
      Text('应用状态管理示例')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      // 用户信息
      Column({
        space: 10
      }) {
        Text('用户信息')
          .fontSize(20)
          .fontWeight(FontWeight.Medium)
        
        if (this.appState.userInfo.isLoggedIn) {
          Text(`用户名: ${this.appState.userInfo.name}`)
            .fontSize(this.appState.fontSize)
          Button('退出登录')
            .onClick(() => {
              // 调用全局状态管理器的登出方法
              appStateManager.logout();
            })
        } else {
          Text('用户未登录')
            .fontSize(this.appState.fontSize)
          Button('登录')
            .onClick(() => {
              // 调用全局状态管理器的登录方法
              appStateManager.login({
                id: '1',
                name: '测试用户',
                avatar: 'https://example.com/avatar.jpg'
              });
            })
        }
      }
      
      // 应用设置
      Column({
        space: 10
      }) {
        Text('应用设置')
          .fontSize(20)
          .fontWeight(FontWeight.Medium)
        
        // 主题设置
        Button(`当前主题: ${this.appState.appTheme}，点击切换`)
          .onClick(() => {
            // 调用全局状态管理器的切换主题方法
            appStateManager.toggleTheme();
          })
        
        // 字体大小设置
        Text(`当前字体大小: ${this.appState.fontSize}px`)
          .fontSize(this.appState.fontSize)
        Row({
          space: 10
        }) {
          Button('减小字体')
            .onClick(() => {
              appStateManager.setFontSize(Math.max(12, this.appState.fontSize - 2));
            })
          Button('增大字体')
            .onClick(() => {
              appStateManager.setFontSize(Math.min(24, this.appState.fontSize + 2));
            })
        }
      }
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
    .backgroundColor(this.appState.appTheme === 'light' ? '#ffffff' : '#333333')
    .fontColor(this.appState.appTheme === 'light' ? '#000000' : '#ffffff')
  }
}
```

### 5.2 使用 Preferences 持久化存储

对于需要持久化存储的应用状态，可以使用 HarmonyOS 的 Preferences 存储。

#### 5.2.1 创建持久化状态管理类

```typescript
// persistentStateManager.ts
import preferences from '@ohos.data.preferences';

// 定义持久化状态接口
interface PersistentState {
  userInfo: {
    id: string;
    name: string;
    avatar?: string;
    isLoggedIn: boolean;
  };
  appTheme: 'light' | 'dark';
  language: string;
  fontSize: number;
}

// 默认状态
const DEFAULT_STATE: PersistentState = {
  userInfo: {
    id: '',
    name: '',
    avatar: '',
    isLoggedIn: false
  },
  appTheme: 'light',
  language: 'zh-CN',
  fontSize: 16
};

// 创建持久化状态管理类
class PersistentStateManager {
  private static instance: PersistentStateManager;
  private preferences: preferences.Preferences | null = null;
  private state: PersistentState = { ...DEFAULT_STATE };
  private listeners: Map<string, (state: PersistentState) => void> = new Map();
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  
  private constructor() {
    this.init();
  }
  
  public static getInstance(): PersistentStateManager {
    if (!PersistentStateManager.instance) {
      PersistentStateManager.instance = new PersistentStateManager();
    }
    return PersistentStateManager.instance;
  }
  
  // 初始化 Preferences
  private async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        // 获取 Preferences 实例
        this.preferences = await preferences.getPreferences(globalThis.abilityContext, 'app_state');
        
        // 从 Preferences 加载状态
        await this.loadState();
        
        this.isInitialized = true;
        resolve();
      } catch (error) {
        console.error('初始化 Preferences 失败:', error);
        reject(error);
      }
    });
    
    return this.initPromise;
  }
  
  // 从 Preferences 加载状态
  private async loadState(): Promise<void> {
    if (!this.preferences) return;
    
    try {
      // 加载各个状态项
      const appTheme = await this.preferences.get('appTheme', DEFAULT_STATE.appTheme) as 'light' | 'dark';
      const language = await this.preferences.get('language', DEFAULT_STATE.language) as string;
      const fontSize = await this.preferences.get('fontSize', DEFAULT_STATE.fontSize) as number;
      const userInfoStr = await this.preferences.get('userInfo', JSON.stringify(DEFAULT_STATE.userInfo)) as string;
      
      this.state = {
        appTheme,
        language,
        fontSize,
        userInfo: JSON.parse(userInfoStr)
      };
      
      console.log('从 Preferences 加载状态成功:', this.state);
    } catch (error) {
      console.error('加载状态失败:', error);
      // 加载失败时使用默认状态
      this.state = { ...DEFAULT_STATE };
    }
  }
  
  // 保存状态到 Preferences
  private async saveState(): Promise<void> {
    if (!this.preferences) await this.init();
    if (!this.preferences) return;
    
    try {
      // 保存各个状态项
      await this.preferences.put('appTheme', this.state.appTheme);
      await this.preferences.put('language', this.state.language);
      await this.preferences.put('fontSize', this.state.fontSize);
      await this.preferences.put('userInfo', JSON.stringify(this.state.userInfo));
      
      // 提交更改
      await this.preferences.flush();
      
      console.log('状态保存成功:', this.state);
    } catch (error) {
      console.error('保存状态失败:', error);
    }
  }
  
  // 获取当前状态
  public getState(): PersistentState {
    return { ...this.state };
  }
  
  // 更新用户信息
  public async updateUserInfo(userInfo: Partial<PersistentState['userInfo']>): Promise<void> {
    this.state.userInfo = { ...this.state.userInfo, ...userInfo };
    await this.saveState();
    this.notifyListeners();
  }
  
  // 切换主题
  public async toggleTheme(): Promise<void> {
    this.state.appTheme = this.state.appTheme === 'light' ? 'dark' : 'light';
    await this.saveState();
    this.notifyListeners();
  }
  
  // 设置语言
  public async setLanguage(language: string): Promise<void> {
    this.state.language = language;
    await this.saveState();
    this.notifyListeners();
  }
  
  // 设置字体大小
  public async setFontSize(size: number): Promise<void> {
    this.state.fontSize = size;
    await this.saveState();
    this.notifyListeners();
  }
  
  // 登录
  public async login(userInfo: { id: string; name: string; avatar?: string }): Promise<void> {
    this.state.userInfo = {
      ...userInfo,
      isLoggedIn: true
    };
    await this.saveState();
    this.notifyListeners();
  }
  
  // 登出
  public async logout(): Promise<void> {
    this.state.userInfo = {
      id: '',
      name: '',
      avatar: '',
      isLoggedIn: false
    };
    await this.saveState();
    this.notifyListeners();
  }
  
  // 注册状态监听器
  public async subscribe(key: string, listener: (state: PersistentState) => void): Promise<void> {
    // 确保已经初始化
    await this.init();
    
    this.listeners.set(key, listener);
    // 立即通知一次当前状态
    listener(this.getState());
  }
  
  // 取消状态监听器
  public unsubscribe(key: string): void {
    this.listeners.delete(key);
  }
  
  // 通知所有监听器状态变化
  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => {
      listener(currentState);
    });
  }
}

// 导出单例实例
export const persistentStateManager = PersistentStateManager.getInstance();
```

#### 5.1.2 在组件中使用持久化状态管理

```typescript
import { persistentStateManager } from '../utils/persistentStateManager';

@Entry
@Component
struct PersistentStateDemo {
  @State appState: any = {
    userInfo: {
      name: '',
      isLoggedIn: false
    },
    appTheme: 'light',
    fontSize: 16
  };
  
  aboutToAppear() {
    // 注册状态监听器
    persistentStateManager.subscribe('PersistentStateDemo', (state) => {
      this.appState = state;
    });
  }
  
  aboutToDisappear() {
    // 取消状态监听器
    persistentStateManager.unsubscribe('PersistentStateDemo');
  }
  
  build() {
    Column({
      space: 20
    }) {
      Text('持久化状态管理示例')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      // 用户信息
      Column({
        space: 10
      }) {
        Text('用户信息')
          .fontSize(20)
          .fontWeight(FontWeight.Medium)
        
        if (this.appState.userInfo.isLoggedIn) {
          Text(`用户名: ${this.appState.userInfo.name}`)
            .fontSize(this.appState.fontSize)
          Button('退出登录')
            .onClick(async () => {
              await persistentStateManager.logout();
            })
        } else {
          Text('用户未登录')
            .fontSize(this.appState.fontSize)
          Button('登录')
            .onClick(async () => {
              await persistentStateManager.login({
                id: '1',
                name: '测试用户',
                avatar: 'https://example.com/avatar.jpg'
              });
            })
        }
      }
      
      // 应用设置
      Column({
        space: 10
      }) {
        Text('应用设置')
          .fontSize(20)
          .fontWeight(FontWeight.Medium)
        
        // 主题设置
        Button(`当前主题: ${this.appState.appTheme}，点击切换`)
          .onClick(async () => {
            await persistentStateManager.toggleTheme();
          })
        
        // 字体大小设置
        Text(`当前字体大小: ${this.appState.fontSize}px`)
          .fontSize(this.appState.fontSize)
        Row({
          space: 10
        }) {
          Button('减小字体')
            .onClick(async () => {
              await persistentStateManager.setFontSize(Math.max(12, this.appState.fontSize - 2));
            })
          Button('增大字体')
            .onClick(async () => {
              await persistentStateManager.setFontSize(Math.min(24, this.appState.fontSize + 2));
            })
        }
      }
      
      Text('提示：所有设置都会持久化保存，下次启动应用时会自动恢复。')
        .fontSize(14)
        .textColor(Color.Gray)
        .textAlign(TextAlign.Center)
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(20)
    .backgroundColor(this.appState.appTheme === 'light' ? '#ffffff' : '#333333')
    .fontColor(this.appState.appTheme === 'light' ? '#000000' : '#ffffff')
  }
}
```

## 6. 状态管理最佳实践

### 6.1 状态设计原则

#### 6.1.1 单一数据源原则

- 尽量保持应用状态的单一数据源，避免状态分散在多个地方
- 对于复杂应用，可以将状态按功能模块进行划分，但每个模块内部保持单一数据源

#### 6.1.2 状态最小化原则

- 只将必要的数据定义为状态
- 避免将计算结果或派生数据定义为状态，应该在渲染时计算

```typescript
// 不推荐的做法
@State count: number = 0;
@State doubleCount: number = 0; // 这是计算结果，不应该作为状态

// 推荐的做法
@State count: number = 0;
// 在渲染时计算
Text(`计数的两倍: ${this.count * 2}`)
```

#### 6.1.3 不可变性原则

- 对于复杂数据类型，尽量避免直接修改其属性，而是创建新的对象
- 这样可以确保状态变化的可预测性，便于调试和测试

```typescript
// 不推荐的做法
@State userInfo: { name: string; age: number } = { name: '张三', age: 25 };

updateUser() {
  this.userInfo.name = '李四'; // 直接修改属性
}

// 推荐的做法
@State userInfo: { name: string; age: number } = { name: '张三', age: 25 };

updateUser() {
  // 创建新对象
  this.userInfo = {
    ...this.userInfo,
    name: '李四'
  };
}
```

### 6.2 性能优化

#### 6.2.1 减少不必要的重新渲染

- 只在必要时修改状态变量
- 对于复杂对象，使用 `@Observed` 和 `@ObjectLink` 来精确控制重新渲染的范围

#### 6.2.2 使用虚拟列表

对于大量数据的列表，使用 `List` 组件的虚拟列表功能，只渲染可见区域的列表项，提高性能。

```typescript
List({
  space: 10,
  initialIndex: 0
})
  .width('100%')
  .height(400)
  .padding(10)
  {
    ForEach(this.largeDataList, (item) => {
      ListItem() {
        Text(item.name)
          .width('100%')
          .height(50)
          .textAlign(TextAlign.Center)
          .backgroundColor('#f0f0f0')
      }
    }, item => item.id)
  }
```

#### 6.2.3 合理使用缓存

对于频繁访问但不经常变化的数据，可以使用缓存来减少计算或网络请求。

### 6.3 代码组织建议

#### 6.3.1 组件拆分

- 将复杂的 UI 拆分为多个独立的组件
- 每个组件只负责自己的状态和逻辑

#### 6.3.2 逻辑分离

- 将业务逻辑从 UI 组件中分离出来
- 使用自定义 hooks 或工具函数来封装复用逻辑

#### 6.3.3 状态管理分层

- 根据状态的作用范围选择合适的状态管理方案
- 组件内部状态使用 `@State`
- 组件间状态使用 `@Prop`、`@Link`
- 跨组件层级状态使用 `@Provide`、`@Consume`
- 应用级状态使用全局状态管理器

## 7. 常见问题与解决方案

### 7.1 状态更新后 UI 没有重新渲染

**问题描述**：修改了状态变量，但 UI 没有更新。

**解决方案**：

- 检查是否使用了正确的状态装饰器
- 对于复杂数据类型，确保修改了整个对象引用或使用了 `@Observed` 和 `@ObjectLink`
- 检查是否在正确的作用域内修改了状态变量

### 7.2 组件频繁重新渲染

**问题描述**：组件不必要地频繁重新渲染，影响性能。

**解决方案**：

- 减少状态变量的数量，只保留必要的状态
- 对于复杂对象，使用 `@Observed` 和 `@ObjectLink` 来精确控制重新渲染的范围
- 避免在渲染函数中创建新的对象或函数

### 7.3 状态管理混乱

**问题描述**：应用的状态管理混乱，难以维护。

**解决方案**：

- 采用清晰的状态管理架构
- 按照状态的作用范围进行分层管理
- 建立统一的状态管理规范和命名约定
- 定期重构和优化状态管理代码

## 8. 总结

状态管理是 HarmonyOS 应用开发中的重要组成部分，合理的状态管理能够使应用更加稳定、可维护，并提供更好的用户体验。

HarmonyOS 提供了多种状态管理机制，包括：

1. **组件内部状态**：使用 `@State` 装饰器管理组件自身的状态
2. **组件间状态**：使用 `@Prop`、`@Link` 实现父子组件间的数据传递
3. **跨组件层级状态**：使用 `@Provide`、`@Consume` 实现祖先组件向后代组件传递数据
4. **对象数据状态**：使用 `@Observed`、`@ObjectLink` 管理复杂对象的状态
5. **应用级状态**：使用单例模式或 Preferences 实现应用级状态管理

在实际开发中，应该根据应用的复杂度和需求，选择合适的状态管理方案，并遵循状态管理的最佳实践，如单一数据源原则、状态最小化原则、不可变性原则等。

通过合理的状态管理，可以构建出高质量、高性能的 HarmonyOS 应用，为用户提供流畅、稳定的使用体验。