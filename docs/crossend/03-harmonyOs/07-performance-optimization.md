# 性能优化

在 HarmonyOS 应用开发中，性能优化是确保应用流畅运行、提供良好用户体验的关键环节。随着应用功能的不断丰富和用户对应用性能要求的提高，性能优化变得越来越重要。本章节将详细介绍 HarmonyOS 应用性能优化的各个方面，包括性能分析工具、渲染优化、内存管理、网络优化等内容，帮助开发者构建高性能的 HarmonyOS 应用。

## 1. 性能优化概述

### 1.1 性能指标

在进行性能优化之前，需要了解关键的性能指标，以便量化应用的性能状况：

#### 1.1.1 启动性能指标

| 指标 | 描述 | 优化目标 |
|------|------|--------|
| 冷启动时间 | 应用从启动到主界面完全加载的时间 | < 1.5 秒 |
| 热启动时间 | 应用从后台唤醒到主界面响应的时间 | < 500 毫秒 |
| 首次绘制时间 (TTFD) | 应用启动到首次绘制内容的时间 | < 800 毫秒 |

#### 1.1.2 运行时性能指标

| 指标 | 描述 | 优化目标 |
|------|------|--------|
| 帧率 (FPS) | 应用每秒渲染的帧数 | 稳定 60 FPS |
| 响应时间 | 用户操作到应用响应的时间 | < 100 毫秒 |
| 内存占用 | 应用运行时占用的内存 | 合理范围内，无内存泄漏 |
| 电池消耗 | 应用运行时消耗的电量 | 最小化电量消耗 |
| 网络请求耗时 | 网络请求的响应时间 | < 2 秒 |

#### 1.1.3 资源使用指标

| 指标 | 描述 | 优化目标 |
|------|------|--------|
| 应用包大小 | 安装包的体积大小 | 最小化，按需加载 |
| 磁盘空间 | 应用占用的存储空间 | 合理使用，定期清理 |
| CPU 使用率 | 应用占用的 CPU 资源 | 峰值 < 80%，平均 < 30% |

### 1.2 性能优化原则

在进行性能优化时，应遵循以下原则：

#### 1.2.1 性能优先原则

- **用户体验优先**：性能优化的最终目标是提升用户体验
- **数据驱动决策**：基于实际性能数据进行优化，而不是猜测
- **渐进式优化**：从影响最大的地方开始优化，逐步完善
- **平衡各指标**：在启动速度、运行流畅度、内存占用等指标之间取得平衡

#### 1.2.2 优化策略

- **预防胜于治疗**：在开发初期就考虑性能问题，建立性能基线
- **最小化变更**：每次优化只针对一个问题，避免引入新问题
- **可测量性**：所有优化都应该是可测量的，有明确的性能提升数据
- **持续监控**：建立持续的性能监控机制，及时发现性能问题

## 2. 性能分析工具

HarmonyOS 提供了多种性能分析工具，帮助开发者识别和定位性能问题：

### 2.1 DevEco Studio 性能分析工具

DevEco Studio 是 HarmonyOS 应用开发的官方 IDE，集成了丰富的性能分析工具：

#### 2.1.1 CPU 分析器

CPU 分析器用于分析应用的 CPU 使用情况，帮助识别 CPU 密集型操作：

1. **启动 CPU 分析器**：
   - 点击菜单栏中的 **Profile > CPU Profiler**
   - 或使用快捷键 **Shift + F10**

2. **分析 CPU 使用率**：
   - 查看 CPU 使用率图表，识别 CPU 峰值
   - 分析线程活动，找出占用 CPU 资源较多的线程
   - 查看方法调用栈，定位耗时操作

3. **使用技巧**：
   - 进行特定操作时记录 CPU 活动
   - 比较不同版本的 CPU 使用情况
   - 关注长时间运行的方法和频繁调用的方法

#### 2.1.2 内存分析器

内存分析器用于监控应用的内存使用情况，帮助识别内存泄漏和内存占用过高的问题：

1. **启动内存分析器**：
   - 点击菜单栏中的 **Profile > Memory Profiler**
   - 或使用快捷键 **Shift + F11**

2. **分析内存使用**：
   - 查看内存使用曲线，识别内存泄漏（持续增长不释放）
   - 分析对象数量和大小，找出占用内存较多的对象
   - 进行内存转储，分析对象引用关系

3. **使用技巧**：
   - 重复执行相同操作，观察内存是否持续增长
   - 对比不同场景下的内存使用情况
   - 关注大对象和长生命周期对象

#### 2.1.3 网络分析器

网络分析器用于监控应用的网络请求情况，帮助优化网络请求：

1. **启动网络分析器**：
   - 点击菜单栏中的 **Profile > Network Profiler**
   - 或使用快捷键 **Shift + F12**

2. **分析网络请求**：
   - 查看网络请求列表，包括请求方法、URL、状态码、耗时等
   - 分析请求和响应的大小，识别数据冗余
   - 查看网络请求时序，优化请求顺序

3. **使用技巧**：
   - 过滤特定域名或请求类型的网络请求
   - 分析网络请求的响应时间，识别慢请求
   - 关注重复请求和不必要的请求

#### 2.1.4 帧率分析器

帧率分析器用于监控应用的渲染帧率，帮助优化 UI 渲染性能：

1. **启动帧率分析器**：
   - 点击菜单栏中的 **Profile > FPS Profiler**
   - 或使用快捷键 **Shift + F9**

2. **分析帧率**：
   - 查看实时帧率图表，识别帧率下降的场景
   - 分析渲染耗时，找出渲染瓶颈
   - 定位导致帧率下降的组件或操作

3. **使用技巧**：
   - 进行滑动、动画等操作时观察帧率变化
   - 对比不同场景下的帧率表现
   - 关注低于 60 FPS 的场景，特别是低于 30 FPS 的情况

### 2.2 命令行性能分析工具

除了 DevEco Studio 中的图形化工具，HarmonyOS 还提供了命令行性能分析工具：

#### 2.2.1 hdc 工具

`hdc` (Harmony Device Connect) 是 HarmonyOS 设备调试的命令行工具，可以用于性能分析：

```bash
# 查看设备信息
hdc shell "getprop"

# 查看应用 CPU 使用情况
hdc shell "top -n 1 | grep com.example.app"

# 查看应用内存使用情况
hdc shell "dumpsys meminfo com.example.app"

# 查看应用线程状态
hdc shell "ps -T -p $(pgrep -f com.example.app)"
```

#### 2.2.2 ArkUI 性能分析命令

HarmonyOS 提供了专门的 ArkUI 性能分析命令：

```bash
# 启用 ArkUI 性能监控
hdc shell "param set persist.ace.performance.monitor 1"

# 查看 ArkUI 性能日志
hdc shell "logcat | grep ArkUI.Performance"
```

### 2.3 自定义性能监控

除了使用系统提供的工具，还可以在应用中添加自定义的性能监控代码：

```typescript
// services/PerformanceMonitor.ts
import hilog from '@ohos.hilog';

// 性能监控工具类
class PerformanceMonitor {
  private startTimeMap: Map<string, number> = new Map();
  private memoryThreshold: number = 100; // MB
  private cpuThreshold: number = 80; // %
  
  /**
   * 记录操作开始时间
   * @param tag 操作标签
   */
  start(tag: string): void {
    this.startTimeMap.set(tag, Date.now());
    hilog.info(0x0000, 'Performance', `Operation ${tag} started`);
  }
  
  /**
   * 记录操作结束时间并计算耗时
   * @param tag 操作标签
   * @returns 操作耗时（毫秒）
   */
  end(tag: string): number {
    const startTime = this.startTimeMap.get(tag);
    if (!startTime) {
      hilog.error(0x0000, 'Performance', `Operation ${tag} not started`);
      return -1;
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    this.startTimeMap.delete(tag);
    hilog.info(0x0000, 'Performance', `Operation ${tag} completed in ${duration}ms`);
    
    // 如果操作耗时过长，输出警告日志
    if (duration > 100) {
      hilog.warn(0x0000, 'Performance', `Operation ${tag} is slow: ${duration}ms`);
    }
    
    return duration;
  }
  
  /**
   * 监控内存使用情况
   */
  async monitorMemory(): Promise<void> {
    try {
      // 获取内存使用情况（这里需要使用系统 API）
      // 由于 HarmonyOS API 限制，这里使用模拟数据
      const memoryUsage = this.getMemoryUsage();
      
      if (memoryUsage > this.memoryThreshold) {
        hilog.warn(0x0000, 'Performance', `High memory usage: ${memoryUsage}MB`);
      }
    } catch (error) {
      hilog.error(0x0000, 'Performance', `Monitor memory error: ${error}`);
    }
  }
  
  /**
   * 获取内存使用情况（模拟）
   * @returns 内存使用量（MB）
   */
  private getMemoryUsage(): number {
    // 实际应用中应该调用系统 API 获取内存使用情况
    return Math.random() * 150 + 50; // 模拟 50-200 MB 的内存使用
  }
  
  /**
   * 监控 FPS
   * @param fps 当前帧率
   */
  monitorFPS(fps: number): void {
    if (fps < 30) {
      hilog.warn(0x0000, 'Performance', `Low FPS detected: ${fps}`);
    }
  }
}

// 导出单例实例
export const performanceMonitor = new PerformanceMonitor();
```

## 3. 渲染优化

渲染优化是提升应用流畅度和用户体验的关键，主要包括 UI 组件优化、布局优化和绘制优化：

### 3.1 UI 组件优化

#### 3.1.1 组件复用

减少创建新组件的次数，尽量复用现有组件：

```typescript
// 不推荐：每次渲染都创建新的组件
@Entry
@Component
struct BadExample {
  @State items: number[] = Array.from({ length: 100 }, (_, i) => i);
  
  build() {
    List({
      space: 10
    }) {
      ForEach(this.items, (item) => {
        // 每次渲染都创建新的 ItemComponent 实例
        this.renderItem(item);
      }, (item) => item.toString());
    }
    .width('100%')
    .height('100%')
    .padding(10);
  }
  
  // 每次调用都创建新的组件实例
  @Builder renderItem(item: number) {
    Column() {
      Text(`Item ${item}`)
        .fontSize(16)
    }
    .width('100%')
    .height(50)
    .backgroundColor('#f0f0f0')
    .borderRadius(5)
    .padding(10);
  }
}

// 推荐：使用组件化和复用
@Entry
@Component
struct GoodExample {
  @State items: number[] = Array.from({ length: 100 }, (_, i) => i);
  
  build() {
    List({
      space: 10
    }) {
      ForEach(this.items, (item) => {
        // 使用独立的组件，提高复用性
        ListItem() {
          ItemComponent({ item: item });
        }
      }, (item) => item.toString());
    }
    .width('100%')
    .height('100%')
    .padding(10);
  }
}

// 独立的可复用组件
@Component
struct ItemComponent {
  private item: number;
  
  constructor(params: { item: number }) {
    this.item = params.item;
  }
  
  build() {
    Column() {
      Text(`Item ${this.item}`)
        .fontSize(16)
    }
    .width('100%')
    .height(50)
    .backgroundColor('#f0f0f0')
    .borderRadius(5)
    .padding(10);
  }
}
```

#### 3.1.2 避免不必要的组件更新

使用 `@State`、`@Prop`、`@Link` 等装饰器时，要避免不必要的组件更新：

```typescript
// 不推荐：频繁更新导致组件重新渲染
@Entry
@Component
struct BadExample {
  @State counter: number = 0;
  @State items: string[] = ['Item 1', 'Item 2', 'Item 3'];
  
  build() {
    Column({
      space: 20
    }) {
      Text(`Counter: ${this.counter}`)
        .fontSize(24);
      
      // 每次 counter 变化，整个列表都会重新渲染
      List() {
        ForEach(this.items, (item) => {
          ListItem() {
            Text(item)
              .fontSize(16)
              .padding(10);
          }
        });
      }
      .width('100%')
      .height(200);
      
      Button('Increment')
        .onClick(() => {
          this.counter++;
        });
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center);
  }
}

// 推荐：将不相关的状态分离到不同组件
@Entry
@Component
struct GoodExample {
  @State counter: number = 0;
  
  build() {
    Column({
      space: 20
    }) {
      Text(`Counter: ${this.counter}`)
        .fontSize(24);
      
      // 列表组件使用自己的状态，不会受到 counter 变化的影响
      ListComponent();
      
      Button('Increment')
        .onClick(() => {
          this.counter++;
        });
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center);
  }
}

// 独立的列表组件，有自己的状态
@Component
struct ListComponent {
  // 使用常量数组，避免不必要的更新
  private items: string[] = ['Item 1', 'Item 2', 'Item 3'];
  
  build() {
    List() {
      ForEach(this.items, (item) => {
        ListItem() {
          Text(item)
            .fontSize(16)
            .padding(10);
        });
      });
    }
    .width('100%')
    .height(200);
  }
}
```

#### 3.1.3 使用虚拟列表

对于长列表，使用虚拟列表可以显著提高性能：

```typescript
@Entry
@Component
struct VirtualListExample {
  // 假设有大量数据（10000条）
  @State items: number[] = Array.from({ length: 10000 }, (_, i) => i);
  
  build() {
    Column() {
      Text('虚拟列表示例')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin(20);
      
      // 使用 List 组件的虚拟列表功能
      List({
        space: 10,
        initialIndex: 0 // 初始显示的索引
      }) {
        ForEach(this.items, (item) => {
          ListItem() {
            ListItemComponent({
              itemId: item,
              itemData: `Item ${item}`
            });
          }
        }, (item) => item.toString());
      }
      .width('100%')
      .height('80%')
      // 启用虚拟滚动
      .edgeEffect(EdgeEffect.Spring) // 设置边缘效果
      .lanes({ minLength: 150 }) // 设置车道，用于网格布局
      .estimatedItemSize(60); // 估计的列表项大小，有助于优化滚动性能
    }
    .width('100%')
    .height('100%');
  }
}

// 列表项组件
@Component
struct ListItemComponent {
  private itemId: number;
  private itemData: string;
  
  constructor(params: {
    itemId: number;
    itemData: string;
  }) {
    this.itemId = params.itemId;
    this.itemData = params.itemData;
  }
  
  build() {
    Column() {
      Text(this.itemData)
        .fontSize(16)
        .fontColor(Color.Black);
      
      Text(`ID: ${this.itemId}`)
        .fontSize(12)
        .fontColor(Color.Gray);
    }
    .width('100%')
    .height(60)
    .backgroundColor('#f0f0f0')
    .borderRadius(5)
    .padding(10)
    .alignItems(HorizontalAlign.Center)
    .justifyContent(FlexAlign.Center);
  }
}
```

### 3.2 布局优化

#### 3.2.1 简化布局层次

减少嵌套布局的层数，简化布局结构：

```typescript
// 不推荐：过多的嵌套布局
@Entry
@Component
struct BadLayoutExample {
  build() {
    Column() {
      Row() {
        Column() {
          Row() {
            Text('Hello World')
              .fontSize(16);
          }
          .width('100%');
        }
        .width('100%');
      }
      .width('100%');
    }
    .width('100%')
    .height('100%')
    .padding(20);
  }
}

// 推荐：简化的布局结构
@Entry
@Component
struct GoodLayoutExample {
  build() {
    Column() {
      Text('Hello World')
        .fontSize(16);
    }
    .width('100%')
    .height('100%')
    .padding(20);
  }
}
```

#### 3.2.2 避免过度使用容器组件

只在必要时使用容器组件，避免不必要的容器嵌套：

```typescript
// 不推荐：不必要的容器组件
@Entry
@Component
struct BadContainerExample {
  build() {
    Column() {
      // 不必要的 Column 容器
      Column() {
        Text('Title')
          .fontSize(20)
          .fontWeight(FontWeight.Bold);
      }
      
      // 不必要的 Row 容器
      Row() {
        // 不必要的 Column 容器
        Column() {
          Text('Content')
            .fontSize(16);
        }
      }
      
      // 不必要的 Column 容器
      Column() {
        Button('Click Me')
          .onClick(() => {
            console.log('Button clicked');
          });
      }
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .space(20);
  }
}

// 推荐：减少不必要的容器组件
@Entry
@Component
struct GoodContainerExample {
  build() {
    Column({
      space: 20
    }) {
      Text('Title')
        .fontSize(20)
        .fontWeight(FontWeight.Bold);
      
      Text('Content')
        .fontSize(16);
      
      Button('Click Me')
        .onClick(() => {
          console.log('Button clicked');
        });
    }
    .width('100%')
    .height('100%')
    .padding(20);
  }
}
```

#### 3.2.3 使用 Flex 布局的最佳实践

合理使用 Flex 布局，避免不必要的计算：

```typescript
// 不推荐：过度使用 Flex 属性
@Entry
@Component
struct BadFlexExample {
  build() {
    Column() {
      Row({
        justifyContent: FlexAlign.SpaceBetween,
        alignItems: ItemAlign.Center
      }) {
        Column({
          justifyContent: FlexAlign.Center,
          alignItems: ItemAlign.Start
        }) {
          Text('Left Text')
            .fontSize(16);
        }
        .flexGrow(1);
        
        Column({
          justifyContent: FlexAlign.Center,
          alignItems: ItemAlign.End
        }) {
          Text('Right Text')
            .fontSize(16);
        }
        .flexGrow(1);
      }
      .width('100%')
      .height(100);
    }
    .width('100%')
    .height('100%')
    .padding(20);
  }
}

// 推荐：合理使用 Flex 属性
@Entry
@Component
struct GoodFlexExample {
  build() {
    Column() {
      Row({
        justifyContent: FlexAlign.SpaceBetween,
        alignItems: ItemAlign.Center
      }) {
        Text('Left Text')
          .fontSize(16);
        
        Text('Right Text')
          .fontSize(16);
      }
      .width('100%')
      .height(100);
    }
    .width('100%')
    .height('100%')
    .padding(20);
  }
}
```

### 3.3 绘制优化

#### 3.3.1 减少重绘

避免导致组件重绘的操作：

```typescript
// 不推荐：频繁修改导致重绘的属性
@Entry
@Component
struct BadRepaintExample {
  @State count: number = 0;
  @State backgroundColor: Color = Color.White;
  
  // 模拟频繁更新
  aboutToAppear() {
    setInterval(() => {
      this.count++;
      // 每次更新都修改背景颜色，导致整个组件重绘
      this.backgroundColor = new Color(Math.floor(Math.random() * 0xFFFFFF));
    }, 100);
  }
  
  build() {
    Column() {
      Text(`Count: ${this.count}`)
        .fontSize(24)
        .fontColor(Color.Black);
      
      Text('This component is repainting frequently')
        .fontSize(16)
        .fontColor(Color.Black)
        .margin(20);
    }
    .width('100%')
    .height('100%')
    .backgroundColor(this.backgroundColor) // 频繁修改背景色
    .padding(20)
    .justifyContent(FlexAlign.Center);
  }
}

// 推荐：避免频繁修改导致重绘的属性
@Entry
@Component
struct GoodRepaintExample {
  @State count: number = 0;
  @State textColor: Color = Color.Black;
  
  // 模拟更新，但减少重绘
  aboutToAppear() {
    setInterval(() => {
      this.count++;
      // 只修改文本颜色，减少重绘范围
      this.textColor = new Color(Math.floor(Math.random() * 0xFFFFFF));
    }, 100);
  }
  
  build() {
    Column() {
      Text(`Count: ${this.count}`)
        .fontSize(24)
        .fontColor(this.textColor); // 只修改文本颜色
      
      Text('This component is optimized for repainting')
        .fontSize(16)
        .fontColor(this.textColor) // 只修改文本颜色
        .margin(20);
    }
    .width('100%')
    .height('100%')
    .backgroundColor(Color.White) // 固定背景色，不频繁修改
    .padding(20)
    .justifyContent(FlexAlign.Center);
  }
}
```

#### 3.3.2 使用缓存

对于复杂的绘制操作，使用缓存减少重复计算：

```typescript
// services/DrawingCache.ts
// 绘制缓存服务
class DrawingCache {
  private cache: Map<string, any> = new Map();
  private maxCacheSize: number = 100;
  
  /**
   * 添加到缓存
   * @param key 缓存键
   * @param value 缓存值
   */
  set(key: string, value: any): void {
    // 如果缓存已满，移除最旧的项
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, value);
  }
  
  /**
   * 从缓存获取
   * @param key 缓存键
   * @returns 缓存值，如果不存在返回 undefined
   */
  get(key: string): any {
    return this.cache.get(key);
  }
  
  /**
   * 检查是否存在缓存
   * @param key 缓存键
   * @returns 是否存在缓存
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  /**
   * 清除指定缓存
   * @param key 缓存键
   */
  remove(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
  }
}

// 导出单例实例
export const drawingCache = new DrawingCache();

// 组件中使用缓存
@Entry
@Component
struct CachedDrawingExample {
  @State data: number[] = Array.from({ length: 100 }, () => Math.random() * 100);
  
  build() {
    Column() {
      Text('使用缓存的图表示例')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin(20);
      
      // 绘制图表
      this.drawChart();
      
      Button('更新数据')
        .onClick(() => {
          // 更新数据
          this.data = Array.from({ length: 100 }, () => Math.random() * 100);
          // 清除缓存，强制重新绘制
          drawingCache.remove('chart_data');
        })
        .margin(20);
    }
    .width('100%')
    .height('100%')
    .padding(10);
  }
  
  @Builder drawChart() {
    const cacheKey = 'chart_data';
    
    // 检查是否有缓存
    if (drawingCache.has(cacheKey)) {
      console.log('Using cached chart data');
    } else {
      console.log('Generating new chart data');
      // 计算图表数据（实际应用中可能是更复杂的计算）
      const chartData = this.calculateChartData();
      // 缓存结果
      drawingCache.set(cacheKey, chartData);
    }
    
    // 绘制图表
    Column() {
      ForEach(this.data, (value, index) => {
        Row() {
          Text(index.toString())
            .fontSize(10)
            .width(30)
            .textAlign(TextAlign.End);
          
          Rectangle({
            width: Math.max(value, 2),
            height: 20
          })
          .backgroundColor(Color.Blue)
          .marginLeft(10)
          .marginRight(10);
          
          Text(value.toFixed(1))
            .fontSize(10)
            .width(40);
        }
        .alignItems(ItemAlign.Center)
        .margin(2);
      });
    }
    .width('100%')
    .height('80%')
    .padding(10)
    .backgroundColor('#f5f5f5')
    .borderRadius(10);
  }
  
  // 计算图表数据（模拟耗时操作）
  private calculateChartData(): any {
    // 模拟耗时计算
    let result = 0;
    for (let i = 0; i < 10000; i++) {
      result += Math.sqrt(i) * Math.sin(i);
    }
    return { result, timestamp: Date.now() };
  }
}
```

#### 3.3.3 优化动画性能

动画是影响应用流畅度的重要因素，需要特别注意优化：

```typescript
// 不推荐：性能较差的动画实现
@Entry
@Component
struct BadAnimationExample {
  @State offsetX: number = 0;
  @State rotation: number = 0;
  @State scale: number = 1;
  
  build() {
    Column() {
      Text('性能较差的动画示例')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin(20);
      
      // 使用多个独立的动画，性能较差
      Column() {
        Text('Animated Text')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .transform({
            translateX: this.offsetX,
            rotate: `${this.rotation}deg`,
            scaleX: this.scale,
            scaleY: this.scale
          });
      }
      .width('100%')
      .height(200)
      .justifyContent(FlexAlign.Center);
      
      Button('Start Animation')
        .onClick(() => {
          this.startAnimation();
        })
        .margin(20);
    }
    .width('100%')
    .height('100%')
    .padding(10);
  }
  
  // 启动动画
  private startAnimation(): void {
    // 分别设置多个状态变量，触发多次渲染
    let startTime = Date.now();
    const duration = 1000; // 动画持续时间（毫秒）
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用 easeInOut 缓动函数
      const easeProgress = this.easeInOut(progress);
      
      // 分别更新多个状态变量
      this.offsetX = easeProgress * 200;
      this.rotation = easeProgress * 360;
      this.scale = 1 + easeProgress * 0.5;
      
      if (progress < 1) {
        // 继续下一帧
        requestAnimationFrame(animate);
      }
    };
    
    // 开始动画
    requestAnimationFrame(animate);
  }
  
  // 缓动函数
  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
}

// 推荐：使用动画 API 优化动画性能
@Entry
@Component
struct GoodAnimationExample {
  @State animationState: AnimationState = AnimationState.STOPPED;
  
  enum AnimationState {
    STOPPED,
    PLAYING,
    PAUSED
  }
  
  build() {
    Column() {
      Text('优化的动画示例')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin(20);
      
      // 使用动画 API，性能更好
      Column() {
        Text('Animated Text')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          // 使用 animateTo API，性能更好
          .animateTo({
            duration: 1000,
            tempo: 1.0,
            curve: Curve.EaseInOut,
            iterations: this.animationState === AnimationState.PLAYING ? -1 : 1, // -1 表示无限循环
            playMode: PlayMode.Alternate, // 交替播放
            onFinish: () => {
              if (this.animationState !== AnimationState.PLAYING) {
                this.animationState = AnimationState.STOPPED;
              }
            }
          }, () => {
            // 在动画回调中设置属性，系统会优化渲染
            if (this.animationState !== AnimationState.STOPPED) {
              return {
                transform: {
                  translateX: 200,
                  rotate: '360deg',
                  scaleX: 1.5,
                  scaleY: 1.5
                }
              };
            }
            return {};
          });
      }
      .width('100%')
      .height(200)
      .justifyContent(FlexAlign.Center);
      
      Row({
        space: 10
      }) {
        Button('Start')
          .onClick(() => {
            this.animationState = AnimationState.PLAYING;
          })
          .enabled(this.animationState === AnimationState.STOPPED);
        
        Button('Pause')
          .onClick(() => {
            this.animationState = AnimationState.PAUSED;
          })
          .enabled(this.animationState === AnimationState.PLAYING);
        
        Button('Stop')
          .onClick(() => {
            this.animationState = AnimationState.STOPPED;
          })
          .enabled(this.animationState !== AnimationState.STOPPED);
      }
      .margin(20);
    }
    .width('100%')
    .height('100%')
    .padding(10);
  }
}
```

## 4. 内存优化

内存优化是确保应用稳定运行、避免内存泄漏和崩溃的重要措施：

### 4.1 内存管理基础

#### 4.1.1 内存分配与回收

HarmonyOS 使用自动内存管理机制，通过垃圾回收器（Garbage Collector，GC）自动回收不再使用的内存：

- **内存分配**：当创建对象、数组等时，系统会从堆内存中分配相应的空间
- **内存回收**：当对象不再被引用时，垃圾回收器会自动回收其占用的内存
- **垃圾回收算法**：HarmonyOS 使用多种垃圾回收算法，包括标记-清除、复制算法等

#### 4.1.2 内存泄漏

内存泄漏是指应用程序无法释放不再使用的内存，导致内存占用持续增长：

- **常见原因**：
  - 长生命周期对象持有短生命周期对象的引用
  - 未关闭的资源（文件、网络连接等）
  - 静态集合类（如 Map、List）中的对象未及时清理
  - 事件监听器未正确移除
  - 定时器未正确取消

### 4.2 内存泄漏检测与修复

#### 4.2.1 使用内存分析工具

使用 DevEco Studio 的内存分析器检测内存泄漏：

1. **启动应用并连接设备**
2. **打开内存分析器**：点击菜单栏中的 **Profile > Memory Profiler**
3. **进行内存转储**：点击内存分析器中的 **Dump Java Heap** 按钮
4. **分析内存转储**：查看对象数量、大小和引用关系
5. **定位内存泄漏**：查找长时间存在且不断增长的对象集合

#### 4.2.2 常见内存泄漏场景与修复

##### 4.2.2.1 未取消的定时器

```typescript
// 不推荐：未取消的定时器导致内存泄漏
@Entry
@Component
struct TimerLeakExample {
  @State count: number = 0;
  private timerId: number | null = null;
  
  aboutToAppear() {
    // 启动定时器，但在组件销毁时未取消
    this.timerId = setInterval(() => {
      this.count++;
      console.log(`Count: ${this.count}`);
    }, 1000);
  }
  
  // 组件销毁时未取消定时器，导致内存泄漏
  // aboutToDisappear() {
  //   if (this.timerId !== null) {
  //     clearInterval(this.timerId);
  //     this.timerId = null;
  //   }
  // }
  
  build() {
    Column() {
      Text(`Count: ${this.count}`)
        .fontSize(24)
        .fontWeight(FontWeight.Bold);
      
      Text('This component has a timer leak')
        .fontSize(16)
        .fontColor(Color.Red)
        .margin(20);
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center);
  }
}

// 推荐：正确取消定时器
@Entry
@Component
struct TimerFixedExample {
  @State count: number = 0;
  private timerId: number | null = null;
  
  aboutToAppear() {
    // 启动定时器
    this.timerId = setInterval(() => {
      this.count++;
      console.log(`Count: ${this.count}`);
    }, 1000);
  }
  
  // 组件销毁时取消定时器，避免内存泄漏
  aboutToDisappear() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
  
  build() {
    Column() {
      Text(`Count: ${this.count}`)
        .fontSize(24)
        .fontWeight(FontWeight.Bold);
      
      Text('This component properly manages timer resources')
        .fontSize(16)
        .fontColor(Color.Green)
        .margin(20);
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center);
  }
}
```

##### 4.2.2.2 未移除的事件监听器

```typescript
// 不推荐：未移除的事件监听器导致内存泄漏
@Entry
@Component
struct EventListenerLeakExample {
  @State message: string = 'No message yet';
  
  aboutToAppear() {
    // 添加事件监听器，但在组件销毁时未移除
    this.addGlobalEventListener();
  }
  
  // 组件销毁时未移除事件监听器，导致内存泄漏
  // aboutToDisappear() {
  //   this.removeGlobalEventListener();
  // }
  
  // 添加全局事件监听器
  private addGlobalEventListener(): void {
    // 模拟添加全局事件监听器
    console.log('Added global event listener');
    // 实际应用中可能是这样的代码：
    // eventManager.on('globalEvent', this.handleGlobalEvent.bind(this));
  }
  
  // 移除全局事件监听器
  private removeGlobalEventListener(): void {
    // 模拟移除全局事件监听器
    console.log('Removed global event listener');
    // 实际应用中可能是这样的代码：
    // eventManager.off('globalEvent', this.handleGlobalEvent.bind(this));
  }
  
  // 处理全局事件
  private handleGlobalEvent(event: any): void {
    this.message = `Event received: ${event.type}`;
  }
  
  build() {
    Column() {
      Text('Event Listener Example')
        .fontSize(24)
        .fontWeight(FontWeight.Bold);
      
      Text(this.message)
        .fontSize(16)
        .margin(20);
      
      Text('This component has an event listener leak')
        .fontSize(16)
        .fontColor(Color.Red)
        .margin(20);
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center);
  }
}

// 推荐：正确移除事件监听器
@Entry
@Component
struct EventListenerFixedExample {
  @State message: string = 'No message yet';
  private eventHandler: (event: any) => void = this.handleGlobalEvent.bind(this);
  
  aboutToAppear() {
    // 添加事件监听器
    this.addGlobalEventListener();
  }
  
  // 组件销毁时移除事件监听器，避免内存泄漏
  aboutToDisappear() {
    this.removeGlobalEventListener();
  }
  
  // 添加全局事件监听器
  private addGlobalEventListener(): void {
    // 模拟添加全局事件监听器
    console.log('Added global event listener');
    // 实际应用中可能是这样的代码：
    // eventManager.on('globalEvent', this.eventHandler);
  }
  
  // 移除全局事件监听器
  private removeGlobalEventListener(): void {
    // 模拟移除全局事件监听器
    console.log('Removed global event listener');
    // 实际应用中可能是这样的代码：
    // eventManager.off('globalEvent', this.eventHandler);
  }
  
  // 处理全局事件
  private handleGlobalEvent(event: any): void {
    this.message = `Event received: ${event.type}`;
  }
  
  build() {
    Column() {
      Text('Event Listener Example')
        .fontSize(24)
        .fontWeight(FontWeight.Bold);
      
      Text(this.message)
        .fontSize(16)
        .margin(20);
      
      Text('This component properly manages event listeners')
        .fontSize(16)
        .fontColor(Color.Green)
        .margin(20);
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Center);
  }
}
```

##### 4.2.2.3 静态集合中的对象引用

```typescript
// 不推荐：静态集合中的对象引用导致内存泄漏
// utils/CacheUtils.ts
class CacheUtils {
  // 静态集合，生命周期与应用相同
  private static cache: Map<string, any> = new Map();
  
  /**
   * 添加到缓存
   * @param key 缓存键
   * @param value 缓存值
   */
  static set(key: string, value: any): void {
    this.cache.set(key, value);
  }
  
  /**
   * 从缓存获取
   * @param key 缓存键
   * @returns 缓存值
   */
  static get(key: string): any {
    return this.cache.get(key);
  }
  
  // 没有提供清除缓存的方法，导致缓存不断增长
}

// 组件中使用缓存
export class BadCacheComponent {
  private cacheKey: string;
  
  constructor() {
    this.cacheKey = `component_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  public initialize(): void {
    // 将组件实例添加到静态缓存中
    CacheUtils.set(this.cacheKey, this);
  }
  
  public doSomething(): void {
    console.log('Component doing something');
  }
}

// 推荐：正确管理静态集合中的对象引用
// utils/CacheUtils.ts
class CacheUtilsFixed {
  // 静态集合
  private static cache: Map<string, any> = new Map();
  private static maxSize: number = 100;
  
  /**
   * 添加到缓存
   * @param key 缓存键
   * @param value 缓存值
   */
  static set(key: string, value: any): void {
    // 如果缓存已满，移除最旧的项
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, value);
  }
  
  /**
   * 从缓存获取
   * @param key 缓存键
   * @returns 缓存值
   */
  static get(key: string): any {
    return this.cache.get(key);
  }
  
  /**
   * 从缓存移除
   * @param key 缓存键
   */
  static remove(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * 清除所有缓存
   */
  static clear(): void {
    this.cache.clear();
  }
  
  /**
   * 获取缓存大小
   * @returns 缓存大小
   */
  static size(): number {
    return this.cache.size;
  }
}

// 组件中使用优化后的缓存
export class GoodCacheComponent {
  private cacheKey: string;
  
  constructor() {
    this.cacheKey = `component_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  public initialize(): void {
    // 将组件实例添加到静态缓存中
    CacheUtilsFixed.set(this.cacheKey, this);
  }
  
  public destroy(): void {
    // 组件销毁时从缓存中移除，避免内存泄漏
    CacheUtilsFixed.remove(this.cacheKey);
  }
  
  public doSomething(): void {
    console.log('Component doing something');
  }
}
```

### 4.3 内存优化最佳实践

#### 4.3.1 合理使用数据结构

选择合适的数据结构，减少内存占用：

```typescript
// 不推荐：使用不合适的数据结构
class BadDataStructureExample {
  // 使用数组存储键值对，查找效率低，内存占用大
  private data: Array<[string, any]> = [];
  
  /**
   * 添加数据
   * @param key 键
   * @param value 值
   */
  public add(key: string, value: any): void {
    this.data.push([key, value]);
  }
  
  /**
   * 获取数据
   * @param key 键
   * @returns 值
   */
  public get(key: string): any {
    // 线性查找，效率低
    for (const [k, v] of this.data) {
      if (k === key) {
        return v;
      }
    }
    return undefined;
  }
  
  /**
   * 检查是否存在
   * @param key 键
   * @returns 是否存在
   */
  public has(key: string): boolean {
    // 线性查找，效率低
    for (const [k] of this.data) {
      if (k === key) {
        return true;
      }
    }
    return false;
  }
}

// 推荐：使用合适的数据结构
class GoodDataStructureExample {
  // 使用 Map 存储键值对，查找效率高，内存占用合理
  private data: Map<string, any> = new Map();
  
  /**
   * 添加数据
   * @param key 键
   * @param value 值
   */
  public add(key: string, value: any): void {
    this.data.set(key, value);
  }
  
  /**
   * 获取数据
   * @param key 键
   * @returns 值
   */
  public get(key: string): any {
    // Map 查找效率高，O(1) 时间复杂度
    return this.data.get(key);
  }
  
  /**
   * 检查是否存在
   * @param key 键
   * @returns 是否存在
   */
  public has(key: string): boolean {
    // Map 查找效率高，O(1) 时间复杂度
    return this.data.has(key);
  }
}
```

#### 4.3.2 对象池技术

对于频繁创建和销毁的对象，使用对象池技术减少内存分配和回收的开销：

```typescript
// utils/ObjectPool.ts
// 对象池类
class ObjectPool<T> {
  private pool: T[] = [];
  private maxSize: number;
  private createFunc: () => T;
  private resetFunc: (obj: T) => void;
  
  /**
   * 构造函数
   * @param createFunc 创建对象的函数
   * @param resetFunc 重置对象的函数
   * @param maxSize 最大池大小
   */
  constructor(createFunc: () => T, resetFunc: (obj: T) => void, maxSize: number = 100) {
    this.createFunc = createFunc;
    this.resetFunc = resetFunc;
    this.maxSize = maxSize;
  }
  
  /**
   * 从对象池获取对象
   * @returns 对象实例
   */
  public acquire(): T {
    if (this.pool.length > 0) {
      // 从对象池获取对象
      return this.pool.pop()!;
    } else {
      // 创建新对象
      return this.createFunc();
    }
  }
  
  /**
   * 将对象归还到对象池
   * @param obj 要归还的对象
   */
  public release(obj: T): void {
    // 重置对象状态
    this.resetFunc(obj);
    
    // 如果对象池未满，将对象归还到对象池
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
    // 否则，让对象被垃圾回收
  }
  
  /**
   * 清空对象池
   */
  public clear(): void {
    this.pool = [];
  }
  
  /**
   * 获取对象池大小
   * @returns 对象池大小
   */
  public size(): number {
    return this.pool.length;
  }
}

// 使用对象池的示例
interface Point {
  x: number;
  y: number;
}

// 创建 Point 对象的函数
const createPoint = (): Point => {
  return { x: 0, y: 0 };
};

// 重置 Point 对象的函数
const resetPoint = (point: Point): void => {
  point.x = 0;
  point.y = 0;
};

// 创建 Point 对象池
const pointPool = new ObjectPool<Point>(createPoint, resetPoint, 50);

// 使用对象池
export class ObjectPoolExample {
  /**
   * 计算两点之间的距离
   * @param x1 第一个点的 x 坐标
   * @param y1 第一个点的 y 坐标
   * @param x2 第二个点的 x 坐标
   * @param y2 第二个点的 y 坐标
   * @returns 两点之间的距离
   */
  public calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    // 从对象池获取 Point 对象
    const point1 = pointPool.acquire();
    const point2 = pointPool.acquire();
    
    try {
      // 使用对象
      point1.x = x1;
      point1.y = y1;
      point2.x = x2;
      point2.y = y2;
      
      // 计算距离
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      return Math.sqrt(dx * dx + dy * dy);
    } finally {
      // 将对象归还到对象池
      pointPool.release(point1);
      pointPool.release(point2);
    }
  }
}
```

#### 4.3.3 懒加载

使用懒加载技术，只在需要时加载资源：

```typescript
// 不推荐：一次性加载所有资源
class BadLazyLoadingExample {
  private allResources: Map<string, any> = new Map();
  
  constructor() {
    // 一次性加载所有资源，消耗大量内存
    this.loadAllResources();
  }
  
  /**
   * 加载所有资源
   */
  private loadAllResources(): void {
    console.log('Loading all resources at once...');
    
    // 模拟加载大量资源
    for (let i = 0; i < 1000; i++) {
      this.allResources.set(`resource_${i}`, this.loadResource(i));
    }
    
    console.log(`Loaded ${this.allResources.size} resources`);
  }
  
  /**
   * 加载单个资源
   * @param id 资源 ID
   * @returns 资源
   */
  private loadResource(id: number): any {
    // 模拟资源加载
    return {
      id: id,
      data: new Array(10000).fill(0) // 模拟大资源
    };
  }
  
  /**
   * 获取资源
   * @param key 资源键
   * @returns 资源
   */
  public getResource(key: string): any {
    return this.allResources.get(key);
  }
}

// 推荐：使用懒加载
class GoodLazyLoadingExample {
  private resources: Map<string, any> = new Map();
  
  constructor() {
    console.log('Resource manager initialized (no resources loaded yet)');
  }
  
  /**
   * 获取资源（懒加载）
   * @param key 资源键
   * @returns 资源
   */
  public getResource(key: string): any {
    // 检查资源是否已加载
    if (!this.resources.has(key)) {
      console.log(`Loading resource: ${key}`);
      
      // 解析资源 ID
      const id = parseInt(key.replace('resource_', ''), 10);
      
      // 只在需要时加载资源
      const resource = this.loadResource(id);
      this.resources.set(key, resource);
    }
    
    return this.resources.get(key);
  }
  
  /**
   * 加载单个资源
   * @param id 资源 ID
   * @returns 资源
   */
  private loadResource(id: number): any {
    // 模拟资源加载
    return {
      id: id,
      data: new Array(10000).fill(0) // 模拟大资源
    };
  }
  
  /**
   * 释放资源
   * @param key 资源键
   */
  public releaseResource(key: string): void {
    if (this.resources.has(key)) {
      console.log(`Releasing resource: ${key}`);
      this.resources.delete(key);
    }
  }
  
  /**
   * 释放所有资源
   */
  public releaseAllResources(): void {
    console.log(`Releasing all ${this.resources.size} resources`);
    this.resources.clear();
  }
}
```

## 4. 网络优化

网络优化是提升应用性能和用户体验的重要方面，主要包括请求优化、数据优化和连接优化：

### 4.1 请求优化

#### 4.1.1 减少请求数量

合并多个请求，减少网络请求的次数：

```typescript
// 不推荐：多次独立请求
class BadRequestExample {
  private baseUrl: string = 'https://api.example.com';
  
  /**
   * 获取用户信息
   * @param userId 用户 ID
   * @returns Promise<any> 用户信息
   */
  async getUserInfo(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`);
    return response.json();
  }
  
  /**
   * 获取用户文章列表
   * @param userId 用户 ID
   * @returns Promise<any> 文章列表
   */
  async getUserPosts(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/posts`);
    return response.json();
  }
  
  /**
   * 获取用户评论列表
   * @param userId 用户 ID
   * @returns Promise<any> 评论列表
   */
  async getUserComments(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/comments`);
    return response.json();
  }
  
  /**
   * 获取用户的完整信息（多次独立请求）
   * @param userId 用户 ID
   * @returns Promise<any> 用户完整信息
   */
  async getUserCompleteInfo(userId: string): Promise<any> {
    // 发起三次独立的网络请求，增加网络开销
    const userInfo = await this.getUserInfo(userId);
    const userPosts = await this.getUserPosts(userId);
    const userComments = await this.getUserComments(userId);
    
    return {
      userInfo,
      userPosts,
      userComments
    };
  }
}

// 推荐：合并请求
class GoodRequestExample {
  private baseUrl: string = 'https://api.example.com';
  
  /**
   * 获取用户的完整信息（合并请求）
   * @param userId 用户 ID
   * @returns Promise<any> 用户完整信息
   */
  async getUserCompleteInfo(userId: string): Promise<any> {
    // 发起一次请求，获取所有需要的数据
    const response = await fetch(`${this.baseUrl}/users/${userId}/complete`);
    return response.json();
  }
  
  /**
   * 并行请求（如果不能合并 API）
   * @param userId 用户 ID
   * @returns Promise<any> 用户完整信息
   */
  async getUserCompleteInfoParallel(userId: string): Promise<any> {
    // 使用 Promise.all 并行发起请求，减少总耗时
    const [userInfo, userPosts, userComments] = await Promise.all([
      this.getUserInfo(userId),
      this.getUserPosts(userId),
      this.getUserComments(userId)
    ]);
    
    return {
      userInfo,
      userPosts,
      userComments
    };
  }
  
  // 其他方法与 BadRequestExample 相同
  async getUserInfo(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`);
    return response.json();
  }
  
  async getUserPosts(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/posts`);
    return response.json();
  }
  
  async getUserComments(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/comments`);
    return response.json();
  }
}
```

#### 4.1.2 使用缓存减少重复请求

实现请求缓存机制，避免重复获取相同的数据：

```typescript
// services/ApiService.ts
import http from '@ohos.net.http';
import { BusinessError } from '@ohos.base';

// 请求缓存接口
interface CacheItem {
  data: any;
  timestamp: number;
  expiry: number;
}

// API 服务类
class ApiService {
  private baseUrl: string = 'https://api.example.com';
  private httpClient: http.HttpClient | null = null;
  private cache: Map<string, CacheItem> = new Map();
  private defaultCacheTime: number = 5 * 60 * 1000; // 默认缓存时间：5分钟
  
  constructor() {
    this.httpClient = http.createHttpClient();
  }
  
  /**
   * 发起 GET 请求
   * @param endpoint API 端点
   * @param params 请求参数
   * @param cacheTime 缓存时间（毫秒）
   * @returns Promise<any> 响应数据
   */
  async get(endpoint: string, params: Record<string, any> = {}, cacheTime: number = this.defaultCacheTime): Promise<any> {
    // 构建请求 URL
    const url = this.buildUrl(endpoint, params);
    
    // 检查缓存
    if (cacheTime > 0) {
      const cachedData = this.getFromCache(url);
      if (cachedData) {
        console.log(`Cache hit for ${url}`);
        return cachedData;
      }
    }
    
    // 发起网络请求
    try {
      console.log(`Fetching ${url}`);
      
      if (!this.httpClient) {
        throw new Error('HttpClient is not initialized');
      }
      
      const request = this.httpClient.request(
        url,
        {
          method: http.RequestMethod.GET,
          header: {
            'Content-Type': 'application/json'
          },
          readTimeout: 10000, // 读取超时时间：10秒
          connectTimeout: 5000 // 连接超时时间：5秒
        }
      );
      
      const response = await request;
      
      if (response.responseCode === 200) {
        const data = JSON.parse(response.result as string);
        
        // 缓存数据
        if (cacheTime > 0) {
          this.saveToCache(url, data, cacheTime);
        }
        
        return data;
      } else {
        throw new Error(`Request failed with status ${response.responseCode}`);
      }
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * 发起 POST 请求
   * @param endpoint API 端点
   * @param data 请求数据
   * @returns Promise<any> 响应数据
   */
  async post(endpoint: string, data: any): Promise<any> {
    // 构建请求 URL
    const url = this.buildUrl(endpoint);
    
    // 发起网络请求
    try {
      console.log(`Posting to ${url}`);
      
      if (!this.httpClient) {
        throw new Error('HttpClient is not initialized');
      }
      
      const request = this.httpClient.request(
        url,
        {
          method: http.RequestMethod.POST,
          header: {
            'Content-Type': 'application/json'
          },
          extraData: JSON.stringify(data),
          readTimeout: 10000,
          connectTimeout: 5000
        }
      );
      
      const response = await request;
      
      if (response.responseCode === 200 || response.responseCode === 201) {
        return JSON.parse(response.result as string);
      } else {
        throw new Error(`Request failed with status ${response.responseCode}`);
      }
    } catch (error) {
      console.error(`Error posting to ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * 构建请求 URL
   * @param endpoint API 端点
   * @param params 请求参数
   * @returns string 完整的请求 URL
   */
  private buildUrl(endpoint: string, params: Record<string, any> = {}): string {
    let url = `${this.baseUrl}${endpoint