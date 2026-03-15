---
title: "权限管理"
category: "跨端 · HarmonyOS"
tags:
  - HarmonyOS
excerpt: "在 HarmonyOS 应用开发中，权限管理是确保应用安全运行的重要机制。HarmonyOS 提供了一套完整的权限管理框架，用于控制应用对系统资源和用户数据的访问。本章节将详细介绍 HarmonyOS 的权限管理机制、权限申请流程以及最佳实..."
---

# 权限管理

在 HarmonyOS 应用开发中，权限管理是确保应用安全运行的重要机制。HarmonyOS 提供了一套完整的权限管理框架，用于控制应用对系统资源和用户数据的访问。本章节将详细介绍 HarmonyOS 的权限管理机制、权限申请流程以及最佳实践，帮助开发者构建安全、合规的应用。

## 1. 权限管理概述

### 1.1 权限的基本概念

权限是系统为了保护用户隐私和设备安全而设置的访问控制机制。在 HarmonyOS 中，权限可以分为以下几类：

- **系统权限**：控制应用对系统功能的访问，如网络、蓝牙、位置等
- **用户数据权限**：控制应用对用户数据的访问，如联系人、照片、日历等
- **应用间权限**：控制应用之间的交互，如启动其他应用、访问其他应用数据等

### 1.2 HarmonyOS 权限管理的特点

HarmonyOS 的权限管理具有以下特点：

- **基于声明式配置**：应用需要在配置文件中声明所需的权限
- **动态权限申请**：敏感权限需要在运行时向用户请求授权
- **权限分级管理**：根据权限的敏感程度进行分级，不同级别有不同的申请流程
- **用户可控**：用户可以在系统设置中查看和管理应用的权限
- **安全沙箱机制**：应用在独立的安全沙箱中运行，只能访问被授权的资源

### 1.3 权限分级

HarmonyOS 将权限分为以下几个级别：

| 权限级别 | 描述 | 示例 | 申请方式 |
|---------|------|------|--------|
| 普通权限 | 对用户隐私和设备安全影响较小的权限 | INTERNET, ACCESS_BLUETOOTH | 配置文件声明即可 |
| 敏感权限 | 涉及用户隐私或设备安全的权限 | READ_CONTACTS, CAMERA, LOCATION | 需要运行时申请 |
| 危险权限 | 对用户隐私和设备安全影响较大的权限 | READ_CALL_LOG, WRITE_SETTINGS | 需要特殊申请流程 |
| 系统权限 | 系统保留的特殊权限 | SYSTEM_ALERT_WINDOW | 通常不开放给第三方应用 |

## 2. 权限配置

### 2.1 配置文件声明权限

在 HarmonyOS 应用中，需要在 `module.json5` 配置文件中声明应用所需的所有权限。

#### 2.1.1 基本权限配置

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
        "name": "ohos.permission.INTERNET",
        "reason": "用于访问网络资源",
        "usedScene": {
          "ability": ["EntryAbility"],
          "when": "always"
        }
      },
      {
        "name": "ohos.permission.GET_NETWORK_INFO",
        "reason": "用于获取网络状态信息",
        "usedScene": {
          "ability": ["EntryAbility"],
          "when": "inuse"
        }
      }
    ],
    "pages": [
      "pages/HomePage",
      "pages/PermissionDemoPage"
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

#### 2.1.2 权限配置参数说明

- **name**：权限名称，必须使用系统定义的权限名称
- **reason**：申请权限的原因，会在权限申请弹窗中显示给用户
- **usedScene**：权限使用场景
  - **ability**：使用该权限的 Ability 列表
  - **when**：权限使用时机
    - **always**：应用始终需要该权限
    - **inuse**：应用在前台运行时需要该权限
    - **background**：应用在后台运行时需要该权限

### 2.2 常用权限列表

HarmonyOS 提供了丰富的系统权限，以下是一些常用的权限：

#### 2.2.1 网络相关权限

- `ohos.permission.INTERNET`：访问网络
- `ohos.permission.GET_NETWORK_INFO`：获取网络状态信息
- `ohos.permission.SET_NETWORK_INFO`：修改网络状态信息

#### 2.2.2 设备相关权限

- `ohos.permission.BLUETOOTH`：使用蓝牙功能
- `ohos.permission.CAMERA`：使用相机
- `ohos.permission.MICROPHONE`：使用麦克风
- `ohos.permission.READ_STORAGE`：读取外部存储
- `ohos.permission.WRITE_STORAGE`：写入外部存储

#### 2.2.3 位置相关权限

- `ohos.permission.LOCATION`：获取设备位置信息
- `ohos.permission.LOCATION_IN_BACKGROUND`：后台获取设备位置信息

#### 2.2.4 用户数据相关权限

- `ohos.permission.READ_CONTACTS`：读取联系人
- `ohos.permission.WRITE_CONTACTS`：写入联系人
- `ohos.permission.READ_CALENDAR`：读取日历
- `ohos.permission.WRITE_CALENDAR`：写入日历
- `ohos.permission.READ_CALL_LOG`：读取通话记录
- `ohos.permission.WRITE_CALL_LOG`：写入通话记录

## 3. 动态权限申请

对于敏感权限，除了在配置文件中声明外，还需要在运行时向用户动态申请。

### 3.1 动态权限申请流程

动态权限申请的基本流程如下：

1. 检查应用是否已被授予该权限
2. 如果未授予，检查是否需要向用户解释权限用途
3. 向用户请求授权
4. 处理用户的授权结果

### 3.2 权限检查与申请

使用 `@ohos.abilityAccessCtrl` 模块进行权限管理：

```typescript
import abilityAccessCtrl from '@ohos.abilityAccessCtrl';
import { BusinessError } from '@ohos.base';

// 权限管理工具类
class PermissionManager {
  private atManager: abilityAccessCtrl.AtManager | null = null;
  
  constructor() {
    this.atManager = abilityAccessCtrl.createAtManager();
  }
  
  /**
   * 检查应用是否已被授予指定权限
   * @param permission 权限名称
   * @returns Promise<boolean> 是否已授予权限
   */
  async checkPermission(permission: string): Promise<boolean> {
    if (!this.atManager) {
      console.error('AtManager is null');
      return false;
    }
    
    try {
      // 获取应用的 AccessTokenID
      const tokenId: number = abilityAccessCtrl.getAccessTokenSync().tokenId;
      
      // 检查权限
      const result = await this.atManager.checkPermission(tokenId, permission);
      
      return result === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED;
    } catch (error) {
      console.error(`检查权限 ${permission} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 申请单个权限
   * @param permission 权限名称
   * @returns Promise<boolean> 是否获得授权
   */
  async requestPermission(permission: string): Promise<boolean> {
    if (!this.atManager) {
      console.error('AtManager is null');
      return false;
    }
    
    try {
      // 检查是否已经授权
      const hasPermission = await this.checkPermission(permission);
      if (hasPermission) {
        return true;
      }
      
      // 请求授权
      const result = await this.atManager.requestPermissionsFromUser(
        abilityAccessCtrl.getAccessTokenSync(),
        [permission]
      );
      
      // 处理授权结果
      if (result.authResults && result.authResults.length > 0) {
        return result.authResults[0] === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED;
      }
      
      return false;
    } catch (error) {
      console.error(`请求权限 ${permission} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 申请多个权限
   * @param permissions 权限列表
   * @returns Promise<Record<string, boolean>> 权限授权结果
   */
  async requestPermissions(permissions: string[]): Promise<Record<string, boolean>> {
    if (!this.atManager) {
      console.error('AtManager is null');
      return {};
    }
    
    try {
      // 过滤出未授权的权限
      const needRequestPermissions: string[] = [];
      for (const permission of permissions) {
        const hasPermission = await this.checkPermission(permission);
        if (!hasPermission) {
          needRequestPermissions.push(permission);
        }
      }
      
      // 如果所有权限都已授权，直接返回
      if (needRequestPermissions.length === 0) {
        const result: Record<string, boolean> = {};
        permissions.forEach(permission => {
          result[permission] = true;
        });
        return result;
      }
      
      // 请求未授权的权限
      const result = await this.atManager.requestPermissionsFromUser(
        abilityAccessCtrl.getAccessTokenSync(),
        needRequestPermissions
      );
      
      // 构建授权结果
      const authResults: Record<string, boolean> = {};
      
      // 已授权的权限
      permissions.forEach(permission => {
        if (!needRequestPermissions.includes(permission)) {
          authResults[permission] = true;
        }
      });
      
      // 新申请的权限结果
      if (result.authResults) {
        needRequestPermissions.forEach((permission, index) => {
          authResults[permission] = result.authResults![index] === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED;
        });
      }
      
      return authResults;
    } catch (error) {
      console.error('请求权限失败:', error);
      return {};
    }
  }
}

// 导出单例实例
export const permissionManager = new PermissionManager();
```

### 3.3 权限申请示例

下面是一个使用动态权限申请的完整示例：

```typescript
import abilityAccessCtrl from '@ohos.abilityAccessCtrl';
import promptAction from '@ohos.promptAction';
import { permissionManager } from '../services/PermissionManager';

@Entry
@Component
struct PermissionDemo {
  @State hasCameraPermission: boolean = false;
  @State hasLocationPermission: boolean = false;
  @State isRequesting: boolean = false;
  
  // 检查权限状态
  async checkPermissions() {
    this.hasCameraPermission = await permissionManager.checkPermission('ohos.permission.CAMERA');
    this.hasLocationPermission = await permissionManager.checkPermission('ohos.permission.LOCATION');
  }
  
  // 申请相机权限
  async requestCameraPermission() {
    if (this.isRequesting) return;
    
    this.isRequesting = true;
    
    try {
      const granted = await permissionManager.requestPermission('ohos.permission.CAMERA');
      this.hasCameraPermission = granted;
      
      if (granted) {
        promptAction.showToast({
          message: '相机权限申请成功',
          duration: 2000
        });
      } else {
        promptAction.showToast({
          message: '相机权限申请失败',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('申请相机权限失败:', error);
      promptAction.showToast({
        message: '申请相机权限出错',
        duration: 2000
      });
    } finally {
      this.isRequesting = false;
    }
  }
  
  // 申请位置权限
  async requestLocationPermission() {
    if (this.isRequesting) return;
    
    this.isRequesting = true;
    
    try {
      const granted = await permissionManager.requestPermission('ohos.permission.LOCATION');
      this.hasLocationPermission = granted;
      
      if (granted) {
        promptAction.showToast({
          message: '位置权限申请成功',
          duration: 2000
        });
      } else {
        promptAction.showToast({
          message: '位置权限申请失败',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('申请位置权限失败:', error);
      promptAction.showToast({
        message: '申请位置权限出错',
        duration: 2000
      });
    } finally {
      this.isRequesting = false;
    }
  }
  
  // 同时申请多个权限
  async requestMultiplePermissions() {
    if (this.isRequesting) return;
    
    this.isRequesting = true;
    
    try {
      const permissions = ['ohos.permission.CAMERA', 'ohos.permission.LOCATION'];
      const results = await permissionManager.requestPermissions(permissions);
      
      this.hasCameraPermission = results['ohos.permission.CAMERA'] || false;
      this.hasLocationPermission = results['ohos.permission.LOCATION'] || false;
      
      let message = '权限申请结果:\n';
      message += `相机权限: ${this.hasCameraPermission ? '已授权' : '未授权'}\n`;
      message += `位置权限: ${this.hasLocationPermission ? '已授权' : '未授权'}`;
      
      promptAction.showToast({
        message: message,
        duration: 3000
      });
    } catch (error) {
      console.error('申请多个权限失败:', error);
      promptAction.showToast({
        message: '申请权限出错',
        duration: 2000
      });
    } finally {
      this.isRequesting = false;
    }
  }
  
  // 组件创建时检查权限状态
  aboutToAppear() {
    this.checkPermissions();
  }
  
  build() {
    Column({
      space: 20
    }) {
      Text('权限管理示例')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      // 权限状态显示
      Column({
        space: 10
      }) {
        Row({
          space: 10
        }) {
          Text('相机权限:')
            .width(100)
          
          Text(this.hasCameraPermission ? '已授权' : '未授权')
            .fontColor(this.hasCameraPermission ? Color.Green : Color.Red)
        }
        
        Row({
          space: 10
        }) {
          Text('位置权限:')
            .width(100)
          
          Text(this.hasLocationPermission ? '已授权' : '未授权')
            .fontColor(this.hasLocationPermission ? Color.Green : Color.Red)
        }
      }
      
      // 权限申请按钮
      Column({
        space: 10
      }) {
        Button('申请相机权限')
          .width('100%')
          .onClick(() => {
            this.requestCameraPermission();
          })
          .enabled(!this.isRequesting && !this.hasCameraPermission)
        
        Button('申请位置权限')
          .width('100%')
          .onClick(() => {
            this.requestLocationPermission();
          })
          .enabled(!this.isRequesting && !this.hasLocationPermission)
        
        Button('同时申请多个权限')
          .width('100%')
          .onClick(() => {
            this.requestMultiplePermissions();
          })
          .enabled(!this.isRequesting)
        
        Button('刷新权限状态')
          .width('100%')
          .onClick(() => {
            this.checkPermissions();
          })
      }
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center)
  }
}
```

## 4. 权限申请的最佳实践

### 4.1 权限申请策略

#### 4.1.1 按需申请原则

- **最小权限原则**：只申请应用必需的权限，不申请不必要的权限
- **按需申请**：在实际需要使用权限时才进行申请，不要在应用启动时一次性申请所有权限
- **权限分组申请**：将相关的权限组合在一起申请，减少用户的授权次数

#### 4.1.2 权限申请时机

| 场景 | 申请时机 | 示例 |
|------|---------|------|
| 核心功能 | 用户首次使用该功能时 | 首次拍照时申请相机权限 |
| 高级功能 | 用户主动开启该功能时 | 用户开启位置服务时申请位置权限 |
| 设置项 | 用户在设置中主动开启时 | 用户在设置中开启消息通知时申请通知权限 |

### 4.2 权限申请体验优化

#### 4.2.1 权限说明的重要性

向用户清晰地说明权限的用途非常重要：

- **简明扼要**：使用简洁明了的语言说明权限用途
- **具体场景**：说明在什么场景下会使用该权限
- **用户受益**：说明授权该权限对用户的好处

#### 4.2.2 处理权限拒绝

当用户拒绝权限申请时，应该采取适当的措施：

1. **不强制**：不要反复弹窗请求权限，这会影响用户体验
2. **提供替代方案**：如果可能，提供不需要该权限的替代功能
3. **引导设置**：如果权限是核心功能必需的，可以引导用户到系统设置中手动授权

```typescript
// 处理权限拒绝的示例
async handlePermissionDenied(permission: string) {
  // 显示权限说明弹窗
  const result = await promptAction.showDialog({
    title: '权限说明',
    message: this.getPermissionDescription(permission),
    buttons: [
      {
        text: '取消',
        color: '#999999'
      },
      {
        text: '去设置',
        color: '#007AFF'
      }
    ]
  });
  
  // 如果用户选择去设置，引导用户到系统设置页面
  if (result.index === 1) {
    // 这里可以使用系统能力启动设置页面
    console.log('引导用户到设置页面');
  }
}

// 获取权限说明
private getPermissionDescription(permission: string): string {
  const descriptions: Record<string, string> = {
    'ohos.permission.CAMERA': '需要相机权限来拍摄照片和视频，用于发布动态和扫码功能。',
    'ohos.permission.LOCATION': '需要位置权限来提供附近的服务和基于位置的推荐。',
    'ohos.permission.READ_CONTACTS': '需要读取联系人权限来快速添加好友和分享内容。'
  };
  
  return descriptions[permission] || '需要该权限来提供完整功能体验。';
}
```

### 4.3 权限使用监控

应用应该监控权限的使用情况，确保权限被正确使用：

#### 4.3.1 权限使用日志

记录权限的使用情况，便于调试和问题排查：

```typescript
// 记录权限使用日志
logPermissionUsage(permission: string, action: string) {
  console.log(`权限使用: ${permission}, 操作: ${action}, 时间: ${new Date().toISOString()}`);
  
  // 可以将日志发送到服务器进行分析
}
```

#### 4.3.2 权限使用审计

定期审计权限的使用情况，确保权限被正确使用：

- 检查是否有不必要的权限申请
- 确认权限是否只在必要时使用
- 验证权限使用是否符合隐私政策要求

## 5. 特殊权限处理

### 5.1 后台位置权限

后台位置权限允许应用在后台运行时获取设备位置信息，申请流程如下：

1. 在 `module.json5` 中声明 `ohos.permission.LOCATION` 和 `ohos.permission.LOCATION_IN_BACKGROUND` 权限
2. 先申请前台位置权限
3. 当前台位置权限被授权后，再申请后台位置权限

```typescript
// 申请后台位置权限
async requestBackgroundLocationPermission() {
  try {
    // 先检查并申请前台位置权限
    const hasForegroundPermission = await permissionManager.checkPermission('ohos.permission.LOCATION');
    if (!hasForegroundPermission) {
      const granted = await permissionManager.requestPermission('ohos.permission.LOCATION');
      if (!granted) {
        promptAction.showToast({
          message: '需要先授予前台位置权限',
          duration: 2000
        });
        return false;
      }
    }
    
    // 申请后台位置权限
    const hasBackgroundPermission = await permissionManager.requestPermission('ohos.permission.LOCATION_IN_BACKGROUND');
    
    if (hasBackgroundPermission) {
      promptAction.showToast({
        message: '后台位置权限申请成功',
        duration: 2000
      });
    } else {
      promptAction.showToast({
        message: '后台位置权限申请失败',
        duration: 2000
      });
    }
    
    return hasBackgroundPermission;
  } catch (error) {
    console.error('申请后台位置权限失败:', error);
    return false;
  }
}
```

### 5.2 文件访问权限

文件访问权限控制应用对设备存储的访问，需要注意以下几点：

- 使用应用专属目录存储应用数据，无需额外权限
- 访问公共目录需要申请 `ohos.permission.READ_STORAGE` 和 `ohos.permission.WRITE_STORAGE` 权限
- 优先使用系统提供的文件选择器，减少对存储权限的依赖

```typescript
// 使用文件选择器访问文件，减少权限依赖
async selectFile() {
  try {
    // 使用系统文件选择器，无需存储权限
    const result = await filePicker.selectFile({
      type: filePicker.FileSelectOptionsType.IMAGE,
      count: 1
    });
    
    if (result && result.length > 0) {
      const file = result[0];
      console.log('选择的文件:', file.uri);
      
      // 处理选中的文件
      this.handleSelectedFile(file.uri);
    }
  } catch (error) {
    console.error('选择文件失败:', error);
  }
}
```

## 6. 权限管理最佳实践

### 6.1 架构层面的权限管理

在应用架构层面，可以采用以下策略管理权限：

#### 6.1.1 权限服务封装

创建专门的权限服务类，统一管理权限相关的操作：

```typescript
// services/PermissionService.ts
import abilityAccessCtrl from '@ohos.abilityAccessCtrl';
import promptAction from '@ohos.promptAction';
import { BusinessError } from '@ohos.base';

// 权限配置接口
interface PermissionConfig {
  name: string;
  description: string;
  isCritical: boolean; // 是否为核心功能必需的权限
}

export class PermissionService {
  private atManager: abilityAccessCtrl.AtManager | null = null;
  private permissions: Map<string, PermissionConfig> = new Map();
  
  constructor() {
    this.atManager = abilityAccessCtrl.createAtManager();
    this.initPermissions();
  }
  
  /**
   * 初始化权限配置
   */
  private initPermissions(): void {
    this.permissions.set('ohos.permission.CAMERA', {
      name: 'ohos.permission.CAMERA',
      description: '用于拍摄照片和视频，发布动态和扫码功能',
      isCritical: false
    });
    
    this.permissions.set('ohos.permission.LOCATION', {
      name: 'ohos.permission.LOCATION',
      description: '用于提供附近的服务和基于位置的推荐',
      isCritical: false
    });
    
    this.permissions.set('ohos.permission.READ_CONTACTS', {
      name: 'ohos.permission.READ_CONTACTS',
      description: '用于快速添加好友和分享内容',
      isCritical: false
    });
  }
  
  /**
   * 获取权限配置
   * @param permission 权限名称
   * @returns PermissionConfig | undefined
   */
  getPermissionConfig(permission: string): PermissionConfig | undefined {
    return this.permissions.get(permission);
  }
  
  /**
   * 检查并申请权限
   * @param permission 权限名称
   * @returns Promise<boolean> 是否获得授权
   */
  async checkAndRequestPermission(permission: string): Promise<boolean> {
    if (!this.atManager) {
      console.error('AtManager is null');
      return false;
    }
    
    try {
      // 检查权限
      const hasPermission = await this.checkPermission(permission);
      if (hasPermission) {
        return true;
      }
      
      // 申请权限
      const granted = await this.requestPermission(permission);
      
      if (!granted) {
        const config = this.getPermissionConfig(permission);
        if (config?.isCritical) {
          // 如果是核心权限，引导用户到设置
          await this.handleCriticalPermissionDenied(permission);
        }
      }
      
      return granted;
    } catch (error) {
      console.error(`处理权限 ${permission} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 检查权限
   * @param permission 权限名称
   * @returns Promise<boolean>
   */
  private async checkPermission(permission: string): Promise<boolean> {
    if (!this.atManager) {
      return false;
    }
    
    try {
      const tokenId = abilityAccessCtrl.getAccessTokenSync().tokenId;
      const result = await this.atManager.checkPermission(tokenId, permission);
      return result === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED;
    } catch (error) {
      console.error(`检查权限 ${permission} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 申请权限
   * @param permission 权限名称
   * @returns Promise<boolean>
   */
  private async requestPermission(permission: string): Promise<boolean> {
    if (!this.atManager) {
      return false;
    }
    
    try {
      const result = await this.atManager.requestPermissionsFromUser(
        abilityAccessCtrl.getAccessTokenSync(),
        [permission]
      );
      
      if (result.authResults) {
        return result.authResults[0] === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED;
      }
      
      return false;
    } catch (error) {
      console.error(`申请权限 ${permission} 失败:`, error);
      return false;
    }
  }
  
  /**
   * 处理核心权限被拒绝的情况
   * @param permission 权限名称
   */
  private async handleCriticalPermissionDenied(permission: string): Promise<void> {
    const config = this.getPermissionConfig(permission);
    if (!config) {
      return;
    }
    
    const result = await promptAction.showDialog({
      title: '权限必需',
      message: `该应用的核心功能需要${config.description}，请授权以继续使用。`,
      buttons: [
        {
          text: '取消',
          color: '#999999'
        },
        {
          text: '去设置',
          color: '#007AFF'
        }
      ]
    });
    
    if (result.index === 1) {
      // 引导用户到设置页面
      console.log('引导用户到设置页面');
    }
  }
}

// 导出单例实例
export const permissionService = new PermissionService();
```

#### 6.1.2 权限状态管理

使用状态管理库管理应用的权限状态，便于在整个应用中共享：

```typescript
// stores/PermissionStore.ts
import { observable, action } from '@ohos/reactive';
import { permissionService } from '../services/PermissionService';

class PermissionStore {
  @observable permissions: Record<string, boolean> = {};
  
  /**
   * 初始化权限状态
   */
  @action async initPermissions() {
    const permissionList = [
      'ohos.permission.CAMERA',
      'ohos.permission.LOCATION',
      'ohos.permission.READ_CONTACTS'
    ];
    
    for (const permission of permissionList) {
      const hasPermission = await permissionService.checkAndRequestPermission(permission);
      this.permissions[permission] = hasPermission;
    }
  }
  
  /**
   * 检查并更新权限状态
   * @param permission 权限名称
   * @returns Promise<boolean>
   */
  @action async checkAndUpdatePermission(permission: string): Promise<boolean> {
    const hasPermission = await permissionService.checkAndRequestPermission(permission);
    this.permissions[permission] = hasPermission;
    return hasPermission;
  }
  
  /**
   * 获取权限状态
   * @param permission 权限名称
   * @returns boolean
   */
  @action getPermissionStatus(permission: string): boolean {
    return this.permissions[permission] || false;
  }
}

// 导出单例实例
export const permissionStore = new PermissionStore();
```

### 6.2 权限使用的安全建议

#### 6.2.1 数据保护

当应用获取到用户数据后，应该采取措施保护这些数据：

- **加密存储**：对敏感数据进行加密存储
- **合理使用**：只在必要时使用用户数据，不滥用权限
- **及时清理**：不再需要的数据应该及时清理
- **合规处理**：遵守相关的数据保护法规

#### 6.2.2 隐私政策和用户协议

应用应该提供清晰的隐私政策和用户协议：

- **透明公开**：明确说明应用收集、使用和存储的数据类型
- **用户知情**：用户在首次使用应用时应该看到并同意隐私政策
- **定期更新**：当权限使用方式发生变化时，应该更新隐私政策并通知用户

## 7. 完整应用示例

下面是一个使用权限管理功能的完整应用示例：

### 7.1 应用结构

```
entry/
  ├── ets/
  │   ├── entryability/
  │   │   └── EntryAbility.ts
  │   ├── services/
  │   │   ├── PermissionManager.ts
  │   │   └── PermissionService.ts
  │   ├── stores/
  │   │   └── PermissionStore.ts
  │   └── pages/
  │       ├── HomePage.ts
  │       ├── CameraPage.ts
  │       ├── LocationPage.ts
  │       └── SettingsPage.ts
  └── resources/
      └── base/
          ├── media/
          │   └── icon.png
          └── element/
              └── string.json
```

### 7.2 首页实现

```typescript
// pages/HomePage.ts
import { permissionStore } from '../stores/PermissionStore';
import router from '@ohos.router';

@Entry
@Component
struct HomePage {
  build() {
    Column({
      space: 20
    }) {
      Text('权限管理示例应用')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      // 功能列表
      Column({
        space: 15
      }) {
        Button('相机功能')
          .width('100%')
          .onClick(async () => {
            const hasPermission = await permissionStore.checkAndUpdatePermission('ohos.permission.CAMERA');
            if (hasPermission) {
              router.pushUrl({
                url: 'pages/CameraPage'
              });
            }
          })
        
        Button('位置功能')
          .width('100%')
          .onClick(async () => {
            const hasPermission = await permissionStore.checkAndUpdatePermission('ohos.permission.LOCATION');
            if (hasPermission) {
              router.pushUrl({
                url: 'pages/LocationPage'
              });
            }
          })
        
        Button('应用设置')
          .width('100%')
          .onClick(() => {
            router.pushUrl({
              url: 'pages/SettingsPage'
            });
          })
      }
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center)
  }
}
```

### 7.3 相机页面实现

```typescript
// pages/CameraPage.ts
import { permissionStore } from '../stores/PermissionStore';
import router from '@ohos.router';
import promptAction from '@ohos.promptAction';

@Entry
@Component
struct CameraPage {
  @State isLoading: boolean = false;
  
  // 检查权限
  async checkPermission() {
    const hasPermission = await permissionStore.checkAndUpdatePermission('ohos.permission.CAMERA');
    if (!hasPermission) {
      promptAction.showToast({
        message: '没有相机权限，无法使用相机功能',
        duration: 2000
      });
      router.back();
    }
  }
  
  // 组件创建时检查权限
  aboutToAppear() {
    this.checkPermission();
  }
  
  build() {
    Column({
      space: 20
    }) {
      // 返回按钮
      Row({
        justifyContent: FlexAlign.Start
      }) {
        Button('返回')
          .onClick(() => {
            router.back();
          })
      }
      
      Text('相机功能')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      // 这里应该是相机预览组件
      // 由于相机功能比较复杂，这里使用一个占位符
      Column({
        space: 10
      }) {
        Text('相机预览区域')
          .fontSize(16)
          .fontColor(Color.Gray)
        
        // 模拟相机预览
        Rectangle({
          width: '100%',
          height: 300
        })
          .backgroundColor('#f0f0f0')
          .borderRadius(10)
          .alignItems(HorizontalAlign.Center)
          .justifyContent(FlexAlign.Center)
          .onClick(() => {
            promptAction.showToast({
              message: '拍照功能演示',
              duration: 1000
            });
          })
        
        Button('拍照')
          .width(80)
          .height(80)
          .borderRadius(40)
          .backgroundColor(Color.White)
          .shadow({
            color: '#000000',
            offsetX: 0,
            offsetY: 2,
            blurRadius: 4
          })
          .onClick(() => {
            promptAction.showToast({
              message: '拍照成功',
              duration: 1000
            });
          })
      }
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center)
  }
}
```

### 7.4 设置页面实现

```typescript
// pages/SettingsPage.ts
import { permissionStore } from '../stores/PermissionStore';
import router from '@ohos.router';
import promptAction from '@ohos.promptAction';

@Entry
@Component
struct SettingsPage {
  @State permissions: Record<string, boolean> = {};
  
  // 刷新权限状态
  async refreshPermissions() {
    const cameraPermission = await permissionStore.getPermissionStatus('ohos.permission.CAMERA');
    const locationPermission = await permissionStore.getPermissionStatus('ohos.permission.LOCATION');
    
    this.permissions = {
      'ohos.permission.CAMERA': cameraPermission,
      'ohos.permission.LOCATION': locationPermission
    };
  }
  
  // 组件创建时刷新权限状态
  aboutToAppear() {
    this.refreshPermissions();
  }
  
  build() {
    Column({
      space: 20
    }) {
      // 返回按钮
      Row({
        justifyContent: FlexAlign.Start
      }) {
        Button('返回')
          .onClick(() => {
            router.back();
          })
      }
      
      Text('应用设置')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
      
      // 权限设置列表
      List({
        space: 10
      }) {
        ListItem() {
          Row({
            space: 10,
            alignItems: VerticalAlign.Center,
            justifyContent: FlexAlign.SpaceBetween
          }) {
            Text('相机权限')
              .fontSize(16)
            
            Switch({
              checked: this.permissions['ohos.permission.CAMERA'] || false,
              onChange: async (isChecked: boolean) => {
                if (isChecked) {
                  await permissionStore.checkAndUpdatePermission('ohos.permission.CAMERA');
                } else {
                  promptAction.showToast({
                    message: '请在系统设置中关闭权限',
                    duration: 2000
                  });
                }
                await this.refreshPermissions();
              }
            })
          }
          .padding(15)
        }
        
        ListItem() {
          Row({
            space: 10,
            alignItems: VerticalAlign.Center,
            justifyContent: FlexAlign.SpaceBetween
          }) {
            Text('位置权限')
              .fontSize(16)
            
            Switch({
              checked: this.permissions['ohos.permission.LOCATION'] || false,
              onChange: async (isChecked: boolean) => {
                if (isChecked) {
                  await permissionStore.checkAndUpdatePermission('ohos.permission.LOCATION');
                } else {
                  promptAction.showToast({
                    message: '请在系统设置中关闭权限',
                    duration: 2000
                  });
                }
                await this.refreshPermissions();
              }
            })
          }
          .padding(15)
        }
      }
      .width('100%')
      .height(200)
      
      Button('刷新权限状态')
        .width('100%')
        .onClick(() => {
          this.refreshPermissions();
          promptAction.showToast({
            message: '权限状态已刷新',
            duration: 1000
          });
        })
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center)
  }
}
```

## 8. 总结

HarmonyOS 的权限管理是保障应用安全和用户隐私的重要机制。本章节详细介绍了：

1. **权限基础**：权限的概念、分类和特点
2. **权限配置**：如何在配置文件中声明权限
3. **动态权限申请**：运行时权限申请的流程和实现
4. **最佳实践**：
   - 按需申请权限，避免过度授权
   - 清晰地向用户说明权限用途
   - 优雅地处理权限拒绝情况
   - 保护用户数据安全和隐私
5. **架构设计**：如何在应用架构层面管理权限

通过合理使用 HarmonyOS 的权限管理功能，可以构建安全、可靠、用户体验良好的应用。开发者应该始终将用户隐私和数据安全放在首位，遵循最小权限原则，只申请和使用应用必需的权限。