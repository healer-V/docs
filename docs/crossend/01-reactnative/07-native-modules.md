---
title: "原生模块"
category: "跨端 · React Native"
tags:
  - React
excerpt: "在React Native开发中，虽然JavaScript可以处理大部分应用逻辑，但有时我们需要访问平台特定的功能，如摄像头、GPS、蓝牙等。这时，原生模块(Native Modules)就成为了连接React Native和原生平台(iO..."
---

# 原生模块

在React Native开发中，虽然JavaScript可以处理大部分应用逻辑，但有时我们需要访问平台特定的功能，如摄像头、GPS、蓝牙等。这时，原生模块(Native Modules)就成为了连接React Native和原生平台(iOS和Android)的桥梁。本章将详细介绍如何创建和使用原生模块，以便在React Native应用中访问原生功能。

## 原生模块的概念

原生模块是用原生语言(如Swift/Objective-C for iOS，Java/Kotlin for Android)编写的代码库，通过React Native的桥接机制暴露给JavaScript调用。这种机制使开发者能够：

- 访问平台特定的API和功能
- 利用原生代码实现高性能操作
- 集成第三方原生库
- 处理JavaScript不擅长的任务

## 创建原生模块

### iOS原生模块

#### 步骤1：创建原生模块类

在iOS项目中，我们需要创建一个继承自`NSObject`并实现`RCTBridgeModule`协议的类。

```objective-c
// MyNativeModule.h
#import <React/RCTBridgeModule.h>

@interface MyNativeModule : NSObject <RCTBridgeModule>
@end

// MyNativeModule.m
#import "MyNativeModule.h"

@implementation MyNativeModule

// 导出模块名，在JS中通过这个名字访问
RCT_EXPORT_MODULE(MyNativeModule);

// 导出同步方法
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getDeviceName) {
  return [[UIDevice currentDevice] name];
}

// 导出异步方法
RCT_EXPORT_METHOD(getDeviceInfo:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  @try {
    UIDevice *device = [UIDevice currentDevice];
    NSDictionary *info = @{
      @"name": device.name,
      @"model": device.model,
      @"systemName": device.systemName,
      @"systemVersion": device.systemVersion,
      @"identifierForVendor": [device.identifierForVendor UUIDString]
    };
    resolve(info);
  } @catch (NSError *error) {
    reject(@"ERROR_GETTING_DEVICE_INFO", error.localizedDescription, error);
  }
}

// 导出带参数的方法
RCT_EXPORT_METHOD(showAlert:(NSString *)title
                  message:(NSString *)message
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  @try {
    dispatch_async(dispatch_get_main_queue(), ^{  // 确保在主线程执行UI操作
      UIAlertController *alert = [UIAlertController 
                                  alertControllerWithTitle:title
                                  message:message
                                  preferredStyle:UIAlertControllerStyleAlert];
      
      UIAlertAction *okAction = [UIAlertAction 
                                 actionWithTitle:@"确定"
                                 style:UIAlertActionStyleDefault
                                 handler:^(UIAlertAction *action) {
                                   resolve(@YES);
                                 }];
      
      [alert addAction:okAction];
      
      // 获取当前视图控制器
      UIViewController *rootViewController = [UIApplication sharedApplication].delegate.window.rootViewController;
      [rootViewController presentViewController:alert animated:YES completion:nil];
    });
  } @catch (NSError *error) {
    reject(@"ERROR_SHOWING_ALERT", error.localizedDescription, error);
  }
}

@end
```

#### 步骤2：注册模块（可选）

在较新版本的React Native中，模块通常会自动注册，但如果需要手动注册，可以在`AppDelegate.m`中添加：

```objective-c
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import "MyNativeModule.h" // 导入你的模块

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"YourAppName"
                                            initialProperties:nil];
  
  // 其余代码...
  
  return YES;
}

// 其余方法...

@end
```

### Android原生模块

#### 步骤1：创建原生模块类

在Android项目中，我们需要创建一个继承自`ReactContextBaseJavaModule`的类。

```java
// MyNativeModule.java
package com.yourappname;

import android.app.AlertDialog;
import android.content.Context;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import java.util.HashMap;
import java.util.Map;

@ReactModule(name = MyNativeModule.MODULE_NAME)
public class MyNativeModule extends ReactContextBaseJavaModule {
  public static final String MODULE_NAME = "MyNativeModule";
  private final Context context;

  public MyNativeModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext;
  }

  @NonNull
  @Override
  public String getName() {
    return MODULE_NAME;
  }

  // 向JS暴露常量
  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("DEVICE_MODEL", Build.MODEL);
    constants.put("SYSTEM_VERSION", Build.VERSION.RELEASE);
    return constants;
  }

  // 导出同步方法
  @ReactMethod(isBlockingSynchronousMethod = true)
  public String getDeviceName() {
    return Build.MODEL;
  }

  // 导出异步方法
  @ReactMethod
  public void getDeviceInfo(Promise promise) {
    try {
      Map<String, Object> deviceInfo = new HashMap<>();
      deviceInfo.put("name", Build.MODEL);
      deviceInfo.put("manufacturer", Build.MANUFACTURER);
      deviceInfo.put("systemName", "Android");
      deviceInfo.put("systemVersion", Build.VERSION.RELEASE);
      deviceInfo.put("sdkVersion", Build.VERSION.SDK_INT);
      deviceInfo.put("deviceId", Settings.Secure.getString(
          context.getContentResolver(), Settings.Secure.ANDROID_ID));
      
      promise.resolve(deviceInfo);
    } catch (Exception e) {
      promise.reject("ERROR_GETTING_DEVICE_INFO", e);
    }
  }

  // 导出带参数的方法
  @ReactMethod
  public void showAlert(String title, String message, Promise promise) {
    try {
      AlertDialog.Builder builder = new AlertDialog.Builder(getCurrentActivity());
      builder.setTitle(title)
             .setMessage(message)
             .setPositiveButton("确定", (dialog, which) -> promise.resolve(true))
             .setCancelable(false)
             .create()
             .show();
    } catch (Exception e) {
      promise.reject("ERROR_SHOWING_ALERT", e);
    }
  }
}
```

#### 步骤2：创建模块包

接下来，我们需要创建一个实现`ReactPackage`接口的类来注册我们的模块。

```java
// MyAppPackage.java
package com.yourappname;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class MyAppPackage implements ReactPackage {

  @NonNull
  @Override
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new MyNativeModule(reactContext));
    return modules;
  }

  @NonNull
  @Override
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}
```

#### 步骤3：在MainApplication中注册包

最后，在`MainApplication.java`中注册我们的包：

```java
// MainApplication.java
package com.yourappname;

import android.app.Application;
import android.content.Context;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.soloader.SoLoader;
import java.lang.reflect.InvocationTargetException;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          // 注册自定义包
          packages.add(new MyAppPackage());
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }

  /**
   * Loads Flipper in React Native templates. Call this in the onCreate method with something like
   * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   *
   * @param context
   * @param reactInstanceManager
   */
  private static void initializeFlipper(
      Context context, ReactInstanceManager reactInstanceManager) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
        Class<?> aClass = Class.forName("com.yourappname.ReactNativeFlipper");
        aClass
            .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
            .invoke(null, context, reactInstanceManager);
      } catch (ClassNotFoundException e) {
        e.printStackTrace();
      } catch (NoSuchMethodException e) {
        e.printStackTrace();
      } catch (IllegalAccessException e) {
        e.printStackTrace();
      } catch (InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }
}
```

## 在JavaScript中使用原生模块

创建好原生模块后，我们可以在JavaScript代码中导入并使用它。

```jsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { NativeModules } from 'react-native';

// 导入原生模块
const { MyNativeModule } = NativeModules;

function NativeModuleExample() {
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 获取设备信息
  const getDeviceInfo = async () => {
    setLoading(true);
    try {
      // 调用异步方法
      const info = await MyNativeModule.getDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      Alert.alert('错误', `获取设备信息失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 显示原生警告框
  const showNativeAlert = () => {
    MyNativeModule.showAlert(
      '原生警告框', 
      '这是一个来自原生模块的警告框！',
      (success) => {
        if (success) {
          Alert.alert('成功', '用户点击了确定按钮');
        }
      }
    ).catch(error => {
      Alert.alert('错误', `显示警告框失败: ${error.message}`);
    });
  };
  
  // 获取设备名称（同步方法）
  const getDeviceName = () => {
    try {
      const name = MyNativeModule.getDeviceName();
      Alert.alert('设备名称', name);
    } catch (error) {
      Alert.alert('错误', `获取设备名称失败: ${error.message}`);
    }
  };
  
  // 组件挂载时获取设备信息
  useEffect(() => {
    getDeviceInfo();
  }, []);
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>原生模块示例</Text>
      <Text style={styles.description}>演示如何创建和使用原生模块</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={getDeviceInfo}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '获取中...' : '获取设备信息'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={showNativeAlert}
      >
        <Text style={styles.buttonText}>显示原生警告框</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={getDeviceName}
      >
        <Text style={styles.buttonText}>获取设备名称（同步）</Text>
      </TouchableOpacity>
      
      {/* 显示设备信息 */}
      {deviceInfo && (
        <View style={styles.deviceInfoContainer}>
          <Text style={styles.sectionTitle}>设备信息</Text>
          {Object.entries(deviceInfo).map(([key, value]) => (
            <View key={key} style={styles.infoItem}>
              <Text style={styles.infoLabel}>{key}:</Text>
              <Text style={styles.infoValue}>{String(value)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deviceInfoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default NativeModuleExample;
```

## 原生UI组件

除了原生模块，React Native还支持创建原生UI组件，允许我们使用原生视图来扩展React Native的UI能力。

### iOS原生UI组件

#### 步骤1：创建原生视图管理器

```objective-c
// MyCustomViewManager.h
#import <React/RCTViewManager.h>

@interface MyCustomViewManager : RCTViewManager
@end

// MyCustomViewManager.m
#import "MyCustomViewManager.h"
#import "MyCustomView.h"

@implementation MyCustomViewManager

RCT_EXPORT_MODULE(MyCustomView);

- (UIView *)view {
  return [[MyCustomView alloc] init];
}

// 导出属性
RCT_EXPORT_VIEW_PROPERTY(text, NSString);
RCT_EXPORT_VIEW_PROPERTY(textColor, UIColor);
RCT_EXPORT_VIEW_PROPERTY(fontSize, CGFloat);

// 导出方法
RCT_EXPORT_METHOD(updateText:(nonnull NSNumber *)reactTag text:(NSString *)text) {
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    MyCustomView *view = (MyCustomView *)viewRegistry[reactTag];
    if (view) {
      [view setText:text];
    }
  }];
}

@end

// MyCustomView.h
#import <UIKit/UIKit.h>

@interface MyCustomView : UIView

@property (nonatomic, strong) UILabel *label;
@property (nonatomic, strong) NSString *text;
@property (nonatomic, strong) UIColor *textColor;
@property (nonatomic, assign) CGFloat fontSize;

@end

// MyCustomView.m
#import "MyCustomView.h"

@implementation MyCustomView

- (instancetype)initWithFrame:(CGRect)frame {
  self = [super initWithFrame:frame];
  if (self) {
    [self setupView];
  }
  return self;
}

- (void)setupView {
  self.backgroundColor = [UIColor lightGrayColor];
  
  _label = [[UILabel alloc] initWithFrame:self.bounds];
  _label.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  _label.textAlignment = NSTextAlignmentCenter;
  _label.textColor = [UIColor blackColor];
  _label.font = [UIFont systemFontOfSize:16];
  
  [self addSubview:_label];
}

- (void)setText:(NSString *)text {
  _text = text;
  _label.text = text;
}

- (void)setTextColor:(UIColor *)textColor {
  _textColor = textColor;
  _label.textColor = textColor;
}

- (void)setFontSize:(CGFloat)fontSize {
  _fontSize = fontSize;
  _label.font = [UIFont systemFontOfSize:fontSize];
}

@end
```

### Android原生UI组件

#### 步骤1：创建原生视图管理器

```java
// MyCustomViewManager.java
package com.yourappname;

import android.content.Context;
import android.graphics.Color;
import android.util.AttributeSet;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.Map;
import java.util.HashMap;

public class MyCustomViewManager extends SimpleViewManager<MyCustomView> {

  public static final String REACT_CLASS = "MyCustomView";
  private static final int COMMAND_UPDATE_TEXT = 1;

  @NonNull
  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @NonNull
  @Override
  protected MyCustomView createViewInstance(@NonNull ThemedReactContext reactContext) {
    return new MyCustomView(reactContext);
  }

  // 导出属性
  @ReactProp(name = "text")
  public void setText(MyCustomView view, String text) {
    view.setText(text);
  }

  @ReactProp(name = "textColor", defaultInt = Color.BLACK)
  public void setTextColor(MyCustomView view, int color) {
    view.setTextColor(color);
  }

  @ReactProp(name = "fontSize", defaultFloat = 16f)
  public void setFontSize(MyCustomView view, float fontSize) {
    view.setFontSize(fontSize);
  }

  // 导出命令
  @Override
  public Map<String, Integer> getCommandsMap() {
    final Map<String, Integer> commands = new HashMap<>();
    commands.put("updateText", COMMAND_UPDATE_TEXT);
    return commands;
  }

  @Override
  public void receiveCommand(@NonNull MyCustomView view, int commandId, @Nullable ReadableArray args) {
    super.receiveCommand(view, commandId, args);
    if (commandId == COMMAND_UPDATE_TEXT && args != null) {
      String text = args.getString(0);
      view.setText(text);
    }
  }
}

// MyCustomView.java
package com.yourappname;

import android.content.Context;
import android.graphics.Color;
import android.util.AttributeSet;
import android.widget.TextView;
import android.widget.LinearLayout;

import androidx.annotation.Nullable;

public class MyCustomView extends LinearLayout {

  private TextView textView;

  public MyCustomView(Context context) {
    super(context);
    init();
  }

  public MyCustomView(Context context, @Nullable AttributeSet attrs) {
    super(context, attrs);
    init();
  }

  public MyCustomView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
    super(context, attrs, defStyleAttr);
    init();
  }

  private void init() {
    setOrientation(LinearLayout.VERTICAL);
    setBackgroundColor(Color.LTGRAY);
    
    textView = new TextView(getContext());
    textView.setTextColor(Color.BLACK);
    textView.setTextSize(16);
    textView.setGravity(android.view.Gravity.CENTER);
    
    LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.MATCH_PARENT
    );
    
    addView(textView, params);
  }

  public void setText(String text) {
    textView.setText(text);
  }

  public void setTextColor(int color) {
    textView.setTextColor(color);
  }

  public void setFontSize(float fontSize) {
    textView.setTextSize(fontSize);
  }
}
```

#### 步骤2：在包中注册视图管理器

```java
// MyAppPackage.java (更新)
@Override
public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
  List<ViewManager> viewManagers = new ArrayList<>();
  viewManagers.add(new MyCustomViewManager());
  return viewManagers;
}
```

### 在JavaScript中使用原生UI组件

```jsx
import React, { useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, requireNativeComponent } from 'react-native';

// 导入原生UI组件
const MyCustomView = requireNativeComponent('MyCustomView');

function NativeUIComponentExample() {
  const customViewRef = useRef(null);
  
  // 更新文本（通过命令）
  const updateText = () => {
    if (customViewRef.current) {
      customViewRef.current.updateText(`更新于 ${new Date().toLocaleTimeString()}`);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>原生UI组件示例</Text>
      <Text style={styles.description}>演示如何创建和使用原生UI组件</Text>
      
      <View style={styles.customViewContainer}>
        <Text style={styles.sectionTitle}>自定义原生视图：</Text>
        <MyCustomView
          ref={customViewRef}
          style={styles.customView}
          text="Hello from Native UI!"
          textColor="#ff0000"
          fontSize={20}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={updateText}
      >
        <Text style={styles.buttonText}>更新文本</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  customViewContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  customView: {
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default NativeUIComponentExample;
```

## 高级技巧和最佳实践

### 1. 线程处理

React Native的桥接是异步的，并且JavaScript代码运行在JavaScript线程上，而原生代码通常运行在主线程或其他后台线程上。

#### iOS线程处理

```objective-c
// 在后台线程执行
dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{  
  // 执行耗时操作
  
  // 回到主线程更新UI或回调
  dispatch_async(dispatch_get_main_queue(), ^{  
    // 更新UI或调用回调
  });
});
```

#### Android线程处理

```java
// 在后台线程执行
new Thread(new Runnable() {
  @Override
  public void run() {
    // 执行耗时操作
    
    // 回到主线程更新UI或回调
    getCurrentActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        // 更新UI或调用回调
      }
    });
  }
}).start();

// 或者使用React Native的线程工具
reactApplicationContext.runOnUiQueueThread(new Runnable() {
  @Override
  public void run() {
    // 在UI线程执行
  }
});

reactApplicationContext.runOnNativeModulesQueueThread(new Runnable() {
  @Override
  public void run() {
    // 在原生模块线程执行
  }
});
```

### 2. 内存管理

#### iOS内存管理

```objective-c
// 使用weak引用避免循环引用
__weak typeof(self) weakSelf = self;

// 在block中使用weakSelf
RCT_EXPORT_METHOD(someMethod:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  // 操作完成后调用resolve或reject
}
```

#### Android内存管理

```java
// 避免持有Activity的强引用
private final WeakReference<Activity> activityRef;

public MyNativeModule(ReactApplicationContext reactContext) {
  super(reactContext);
  this.activityRef = new WeakReference<>(reactContext.getCurrentActivity());
}

// 使用时检查Activity是否存在
Activity activity = activityRef.get();
if (activity != null) {
  // 使用activity
}
```

### 3. 错误处理

#### iOS错误处理

```objective-c
RCT_EXPORT_METHOD(someMethod:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  @try {
    // 可能抛出异常的代码
    resolve(successResult);
  } @catch (NSException *exception) {
    NSError *error = [NSError errorWithDomain:@"MyNativeModule" 
                                         code:1 
                                     userInfo:@{NSLocalizedDescriptionKey: exception.reason}];
    reject(@"ERROR_CODE", exception.reason, error);
  }
}
```

#### Android错误处理

```java
@ReactMethod
public void someMethod(Promise promise) {
  try {
    // 可能抛出异常的代码
    promise.resolve(successResult);
  } catch (Exception e) {
    promise.reject("ERROR_CODE", "错误描述", e);
  }
}
```

### 4. 导出常量

#### iOS导出常量

```objective-c
- (NSDictionary *)constantsToExport {
  return @{
    @"DEFAULT_VALUE": @42,
    @"API_BASE_URL": @"https://api.example.com",
    @"SUPPORTED_FORMATS": @[@"jpg", @"png", @"gif"]
  };
}
```

#### Android导出常量

```java
@Override
public Map<String, Object> getConstants() {
  final Map<String, Object> constants = new HashMap<>();
  constants.put("DEFAULT_VALUE", 42);
  constants.put("API_BASE_URL", "https://api.example.com");
  constants.put("SUPPORTED_FORMATS", Arrays.asList("jpg", "png", "gif"));
  return constants;
}
```

### 5. 使用TurboModules（新架构）

React Native正在推出新架构，其中包括TurboModules，它提供了更好的性能和更直接的原生API访问。

#### iOS TurboModule

```objective-c
// MyTurboModule.h
#import <React/RCTBridgeModule.h>

@interface MyTurboModule : NSObject <RCTBridgeModule>
@end

// MyTurboModule.mm
#import "MyTurboModule.h"

@implementation MyTurboModule

RCT_EXPORT_MODULE(MyTurboModule);

// 使用RCT_EXPORT_METHOD宏和Promise
s
@end
```

#### Android TurboModule

```java
// MyTurboModule.java
package com.yourappname;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;

@ReactModule(name = MyTurboModule.NAME)
public class MyTurboModule extends ReactContextBaseJavaModule implements TurboModule {
  public static final String NAME = "MyTurboModule";

  public MyTurboModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  // 方法实现
}
```

## 第三方原生模块示例

React Native生态系统中有许多优秀的第三方原生模块，下面是一些常用的例子：

### 1. 相机和图片选择

```bash
npm install react-native-image-picker
```

```jsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'react-native-image-picker';

function ImagePickerExample() {
  const [image, setImage] = useState(null);
  
  // 请求权限
  const requestPermission = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('权限被拒绝', '需要访问相册的权限来选择图片');
      return false;
    }
    
    return true;
  };
  
  // 从相册选择图片
  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('错误', '选择图片失败: ' + error.message);
    }
  };
  
  // 使用相机拍照
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('权限被拒绝', '需要相机权限来拍照');
      return;
    }
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('错误', '拍照失败: ' + error.message);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>图片选择器示例</Text>
      <Text style={styles.description}>演示如何使用第三方原生模块</Text>
      
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>没有选择图片</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>从相册选择</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <Text style={styles.buttonText}>拍照</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 200,
  },
  placeholderContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default ImagePickerExample;
```

### 2. 地理位置

```bash
npm install react-native-geolocation-service
```

```jsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid } from 'react-native';

function GeolocationExample() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 请求权限
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '位置权限',
            message: '需要您的位置权限来获取当前位置',
            buttonNeutral: '稍后询问',
            buttonNegative: '拒绝',
            buttonPositive: '允许',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error(error);
        return false;
      }
    } else {
      // iOS权限在使用时自动请求
      return true;
    }
  };
  
  // 获取当前位置
  const getCurrentLocation = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert('权限被拒绝', '需要位置权限来获取当前位置');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp).toLocaleString(),
        });
        setLoading(false);
      },
      (error) => {
        setError(`获取位置失败: ${error.code} - ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };
  
  // 监听位置变化
  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      (position) => {
        console.log('位置变化:', position.coords);
      },
      (error) => {
        console.error('监听位置失败:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // 位置变化超过10米才触发
        interval: 5000, // 每5秒尝试获取一次位置
        fastestInterval: 2000, // 最快每2秒获取一次位置
      }
    );
    
    // 清理监听器
    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, []);
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>地理位置示例</Text>
      <Text style={styles.description}>演示如何使用地理位置服务</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={getCurrentLocation}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '获取中...' : '获取当前位置'}
        </Text>
      </TouchableOpacity>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {location && (
        <View style={styles.locationContainer}>
          <Text style={styles.sectionTitle}>当前位置信息：</Text>
          <Text style={styles.infoItem}>纬度: {location.latitude}</Text>
          <Text style={styles.infoItem}>经度: {location.longitude}</Text>
          <Text style={styles.infoItem}>精度: {location.accuracy} 米</Text>
          {location.altitude && (
            <Text style={styles.infoItem}>海拔: {location.altitude.toFixed(2)} 米</Text>
          )}
          {location.altitudeAccuracy && (
            <Text style={styles.infoItem}>海拔精度: {location.altitudeAccuracy.toFixed(2)} 米</Text>
          )}
          {location.heading && (
            <Text style={styles.infoItem}>航向: {location.heading.toFixed(2)}°</Text>
          )}
          {location.speed && (
            <Text style={styles.infoItem}>速度: {location.speed.toFixed(2)} m/s</Text>
          )}
          <Text style={styles.infoItem}>时间: {location.timestamp}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: 16,
  },
  locationContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
});

export default GeolocationExample;
```

## 总结

本章介绍了React Native原生模块的创建和使用，包括：

1. **原生模块的概念**：
   - 连接React Native和原生平台的桥梁
   - 访问平台特定API和功能的方式

2. **创建原生模块**：
   - iOS原生模块（Objective-C/Swift）
   - Android原生模块（Java/Kotlin）

3. **在JavaScript中使用原生模块**：
   - 导入原生模块
   - 调用异步和同步方法
   - 处理回调和Promise

4. **原生UI组件**：
   - 创建自定义原生视图
   - 导出属性和方法
   - 在JavaScript中使用

5. **高级技巧**：
   - 线程处理
   - 内存管理
   - 错误处理
   - 导出常量

6. **第三方原生模块**：
   - 相机和图片选择
   - 地理位置

通过创建和使用原生模块，我们可以充分利用原生平台的能力，为React Native应用添加更丰富的功能和更好的性能。

## 下一步

现在你已经学习了React Native的原生模块，接下来你可以学习：

- [性能优化](./08-performance-optimization.md) - 学习如何优化React Native应用性能
- [部署与发布](./09-deployment.md) - 学习如何部署和发布React Native应用