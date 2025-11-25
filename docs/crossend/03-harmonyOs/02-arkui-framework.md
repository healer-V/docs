# ArkUI 开发框架

ArkUI 是 HarmonyOS 推荐的应用开发框架，提供了声明式 UI 开发能力，让开发者能够更高效地构建跨设备的应用界面。本章节将详细介绍 ArkUI 开发框架的核心概念、组件系统、布局能力和开发范式。

## 1. ArkUI 概述

### 1.1 什么是 ArkUI

ArkUI 是 HarmonyOS 的原生 UI 开发框架，基于组件化思想，提供了丰富的 UI 组件和布局能力，支持声明式编程范式，使开发者能够快速构建高质量的用户界面。

### 1.2 ArkUI 的核心特性

- **声明式 UI**：使用声明式语法描述 UI，代码更简洁、易读
- **跨设备适配**：支持多种设备形态，实现"一次开发，多端部署"
- **组件化开发**：提供丰富的内置组件，支持自定义组件
- **响应式状态管理**：通过状态变量和装饰器实现 UI 与数据的自动同步
- **高性能渲染**：采用增量渲染和缓存优化，提供流畅的用户体验

### 1.3 开发范式

ArkUI 提供了两种开发范式：

1. **声明式开发范式**（推荐）
   - 基于 ArkTS 语言的声明式 UI 开发
   - 类似于 React、Vue 等现代前端框架
   - 代码结构清晰，易于维护

2. **类 Web 开发范式**
   - 基于 HTML、CSS、JavaScript 的开发方式
   - 适合有 Web 开发经验的开发者
   - 支持传统的 Web 开发技术栈

## 2. 声明式开发范式

### 2.1 基本概念

#### 2.1.1 组件（Component）

组件是 ArkUI 开发的基本单位，代表 UI 界面的一个独立部分。组件可以组合使用，形成复杂的用户界面。

```typescript
@Component
struct MyComponent {
  build() {
    Text('Hello ArkUI')
      .fontSize(20)
  }
}
```

#### 2.1.2 页面（Page）

页面是应用的一个独立屏幕，由一个或多个组件组成。使用 `@Entry` 装饰器标记页面入口。

```typescript
@Entry
@Component
struct IndexPage {
  build() {
    Column() {
      Text('首页')
        .fontSize(30)
      MyComponent()
    }
  }
}
```

#### 2.1.3 状态管理

ArkUI 提供了多种状态装饰器，用于管理组件的状态：

- **@State**：组件内部状态，当状态变化时，组件会重新渲染
- **@Prop**：父子组件间的单向数据传递
- **@Link**：父子组件间的双向数据绑定
- **@Provide/@Consume**：跨组件层级的数据共享
- **@Observed/@ObjectLink**：对象数据的响应式管理

### 2.2 基本语法

#### 2.2.1 组件定义

```typescript
@Component
struct ComponentName {
  // 状态变量
  @State count: number = 0;
  
  // 构建函数
  build() {
    // UI 描述
    Column() {
      Text(`计数: ${this.count}`)
      Button('增加')
        .onClick(() => this.count++)
    }
  }
}
```

#### 2.2.2 属性设置

```typescript
Text('Hello')
  .fontSize(20)         // 字体大小
  .fontWeight(FontWeight.Bold)  // 字体粗细
  .textColor(Color.Blue)        // 文字颜色
  .margin({ top: 10, bottom: 10 })  // 外边距
  .padding(20)          // 内边距
```

#### 2.2.3 事件处理

```typescript
Button('点击我')
  .onClick(() => {
    console.log('按钮被点击了');
    this.count++;
  })
  
TextInput({
  placeholder: '请输入内容'
})
  .onChange((value) => {
    console.log('输入内容:', value);
    this.inputValue = value;
  })
```

## 3. 组件系统

### 3.1 基础组件

#### 3.1.1 文本组件（Text）

用于显示文本内容。

```typescript
Text('Hello ArkUI')
  .fontSize(24)
  .fontWeight(FontWeight.Bold)
  .textColor(Color.Blue)
  .textAlign(TextAlign.Center)
  .maxLines(2)
  .overflow({ overflow: TextOverflow.Ellipsis })
```

#### 3.1.2 按钮组件（Button）

用于触发用户操作。

```typescript
Button('主要按钮')
  .type(ButtonType.Capsule)
  .width(200)
  .height(40)
  .fontSize(16)
  .fontWeight(FontWeight.Medium)
  .backgroundColor('#007AFF')
  .onClick(() => {
    console.log('按钮被点击');
  })
  
Button('次要按钮')
  .type(ButtonType.Outline)
  .borderColor('#007AFF')
  .borderWidth(1)
```

#### 3.1.3 图片组件（Image）

用于显示图片。

```typescript
Image($r('app.media.icon'))
  .width(100)
  .height(100)
  .objectFit(ImageFit.Cover)
  .borderRadius(20)
  .margin(10)
```

#### 3.1.4 输入框组件（TextInput）

用于接收用户输入。

```typescript
TextInput({
  placeholder: '请输入用户名',
  text: this.username
})
  .width(300)
  .height(40)
  .borderRadius(8)
  .border({ width: 1, color: '#ddd' })
  .padding(10)
  .onChange((value) => {
    this.username = value;
  })
```

### 3.2 容器组件

#### 3.2.1 列布局组件（Column）

垂直方向排列子组件。

```typescript
Column({
  space: 10  // 子组件间距
})
  .width('100%')
  .height('100%')
  .justifyContent(FlexAlign.Center)  // 垂直居中
  .alignItems(HorizontalAlign.Center)  // 水平居中
  {
    Text('第一行')
    Text('第二行')
    Text('第三行')
  }
```

#### 3.2.2 行布局组件（Row）

水平方向排列子组件。

```typescript
Row({
  space: 10
})
  .width('100%')
  .height(100)
  .justifyContent(FlexAlign.SpaceAround)  // 均匀分布
  .alignItems(VerticalAlign.Center)  // 垂直居中
  {
    Text('左侧')
    Text('中间')
    Text('右侧')
  }
```

#### 3.2.3 弹性布局组件（Flex）

提供灵活的布局能力，类似 CSS Flexbox。

```typescript
Flex({
  direction: FlexDirection.Row,
  justifyContent: FlexAlign.SpaceBetween,
  alignItems: ItemAlign.Center
})
  .width('100%')
  .height(200)
  .padding(20)
  {
    Text('Item 1')
      .flexGrow(1)  // 自动拉伸
    Text('Item 2')
      .flexShrink(1)  // 自动收缩
    Text('Item 3')
      .width(80)  // 固定宽度
  }
```

#### 3.2.4 网格布局组件（Grid）

用于创建二维网格布局。

```typescript
Grid() {
  ForEach(this.items, (item) => {
    GridItem() {
      Text(item.name)
        .width('100%')
        .height('100%')
        .textAlign(TextAlign.Center)
        .backgroundColor('#f0f0f0')
    }
  }, item => item.id)
}
.columnsTemplate('1fr 1fr 1fr')  // 3列，每列等宽
.rowsTemplate('1fr 1fr')  // 2行，每行等高
.columnsGap(10)  // 列间距
.rowsGap(10)  // 行间距
.width('100%')
.height(200)
```

### 3.3 高级组件

#### 3.3.1 列表组件（List）

用于显示列表数据，支持滚动。

```typescript
List({
  space: 10,
  initialIndex: 0  // 初始显示位置
})
  .width('100%')
  .height(300)
  .padding(10)
  {
    ForEach(this.dataList, (item) => {
      ListItem() {
        Row({
          space: 10
        })
          .width('100%')
          .padding(10)
          .backgroundColor('#f5f5f5')
          .borderRadius(8)
          {
            Image(item.icon)
              .width(50)
              .height(50)
              .borderRadius(25)
            Column() {
              Text(item.title)
                .fontSize(16)
                .fontWeight(FontWeight.Medium)
              Text(item.subtitle)
                .fontSize(14)
                .textColor(Color.Gray)
            }
            .flexGrow(1)
            Text(item.time)
              .fontSize(12)
              .textColor(Color.Gray)
          }
      }
    }, item => item.id)
  }
  .onScrollIndex((firstIndex, lastIndex) => {
    console.log(`当前显示范围: ${firstIndex} - ${lastIndex}`);
  })
```

#### 3.3.2 滑动组件（Swiper）

用于创建轮播图或滑动切换的内容。

```typescript
Swiper({
  index: 0,
  autoPlay: true,
  interval: 3000,
  indicator: {
    indicatorType: IndicatorType.Dot,
    indicatorSize: 10
  }
})
  .width('100%')
  .height(200)
  {
    ForEach(this.banners, (banner) => {
      SwiperItem() {
        Image(banner.image)
          .width('100%')
          .height('100%')
          .objectFit(ImageFit.Cover)
        Text(banner.title)
          .position({ x: 20, y: 160 })
          .fontSize(18)
          .fontWeight(FontWeight.Bold)
          .textColor(Color.White)
          .shadow({ color: Color.Black, radius: 3, offsetX: 0, offsetY: 0 })
      }
    }, banner => banner.id)
  }
  .onChange((index) => {
    console.log(`当前轮播图索引: ${index}`);
  })
```

#### 3.3.3 弹出框组件（Dialog）

用于显示模态对话框。

```typescript
@State dialogVisible: boolean = false;

Button('显示对话框')
  .onClick(() => {
    this.dialogVisible = true;
  })

if (this.dialogVisible) {
  AlertDialog({
    title: '提示',
    message: '确定要执行此操作吗？',
    confirm: {
      value: '确定',
      action: () => {
        console.log('用户点击了确定');
        this.dialogVisible = false;
      }
    },
    cancel: {
      value: '取消',
      action: () => {
        console.log('用户点击了取消');
        this.dialogVisible = false;
      }
    },
    autoCancel: true
  })
    .overlayStyle({
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    })
    .show();
}
```

## 4. 布局系统

### 4.1 布局概念

ArkUI 的布局系统基于盒子模型，每个组件都有自己的边界框，包括内容区、内边距、边框和外边距。

### 4.2 布局组件

#### 4.2.1 基础布局组件

- **Stack**：堆叠布局，子组件按照添加顺序堆叠显示
- **Position**：定位布局，通过坐标精确定位子组件
- **RelativeContainer**：相对布局，子组件之间可以相对定位

#### 4.2.2 布局属性

| 属性 | 描述 | 示例 |
|------|------|------|
| width | 组件宽度 | `.width(200)` 或 `.width('100%')` |
| height | 组件高度 | `.height(100)` 或 `.height('50%')` |
| margin | 外边距 | `.margin(10)` 或 `.margin({ top: 10, left: 20 })` |
| padding | 内边距 | `.padding(15)` 或 `.padding({ right: 10, bottom: 15 })` |
| backgroundColor | 背景颜色 | `.backgroundColor('#f0f0f0')` |
| borderRadius | 圆角 | `.borderRadius(8)` |
| border | 边框 | `.border({ width: 1, color: '#ddd' })` |

### 4.3 布局示例

#### 4.3.1 卡片布局

```typescript
Column() {
  Image($r('app.media.card_image'))
    .width('100%')
    .height(150)
    .objectFit(ImageFit.Cover)
  
  Column() {
    Text('卡片标题')
      .fontSize(18)
      .fontWeight(FontWeight.Bold)
      .margin({ bottom: 8 })
    Text('这是卡片的描述内容，用于展示卡片的详细信息。')
      .fontSize(14)
      .textColor(Color.Gray)
      .lineHeight(20)
      .maxLines(2)
      .overflow({ overflow: TextOverflow.Ellipsis })
  }
  .padding(16)
}
.width(300)
.backgroundColor(Color.White)
.borderRadius(12)
.shadow({
  color: 'rgba(0, 0, 0, 0.1)',
  radius: 8,
  offsetX: 0,
  offsetY: 4
})
```

#### 4.3.2 登录页面布局

```typescript
Column({
  space: 20
})
  .width('100%')
  .height('100%')
  .justifyContent(FlexAlign.Center)
  .alignItems(HorizontalAlign.Center)
  .padding(40)
  {
    // Logo
    Image($r('app.media.app_logo'))
      .width(80)
      .height(80)
      .margin({ bottom: 40 })
    
    // 用户名输入框
    TextInput({
      placeholder: '请输入用户名',
      textInputType: TextInputType.Normal
    })
      .width('100%')
      .height(50)
      .padding(15)
      .backgroundColor('#f5f5f5')
      .borderRadius(8)
      .placeholderColor('#999')
    
    // 密码输入框
    TextInput({
      placeholder: '请输入密码',
      textInputType: TextInputType.Password,
      passwordIcon: {
        src: $r('app.media.password_icon')
      }
    })
      .width('100%')
      .height(50)
      .padding(15)
      .backgroundColor('#f5f5f5')
      .borderRadius(8)
      .placeholderColor('#999')
    
    // 登录按钮
    Button('登录')
      .width('100%')
      .height(50)
      .fontSize(18)
      .fontWeight(FontWeight.Medium)
      .backgroundColor('#007AFF')
      .borderRadius(8)
      .margin({ top: 30 })
    
    // 辅助链接
    Row() {
      Text('忘记密码?')
        .fontSize(14)
        .textColor('#007AFF')
        .margin({ right: 30 })
      Text('立即注册')
        .fontSize(14)
        .textColor('#007AFF')
    }
    .margin({ top: 20 })
  }
```

## 5. 状态管理

### 5.1 状态装饰器

#### 5.1.1 @State

组件内部状态，当状态变化时，组件会重新渲染。

```typescript
@State count: number = 0;

Button(`点击 ${this.count} 次`)
  .onClick(() => {
    this.count++;
  })
```

#### 5.1.2 @Prop

父子组件间的单向数据传递，父组件可以向子组件传递数据，但子组件不能直接修改父组件的数据。

```typescript
// 父组件
@State parentCount: number = 0;

Button('增加计数')
  .onClick(() => {
    this.parentCount++;
  })
ChildComponent({ count: this.parentCount })

// 子组件
@Component
struct ChildComponent {
  @Prop count: number;
  
  build() {
    Text(`当前计数: ${this.count}`)
  }
}
```

#### 5.1.3 @Link

父子组件间的双向数据绑定，子组件可以修改父组件传递的数据。

```typescript
// 父组件
@State parentCount: number = 0;

Text(`父组件计数: ${this.parentCount}`)
ChildComponent({ count: $parentCount })

// 子组件
@Component
struct ChildComponent {
  @Link count: number;
  
  build() {
    Button(`子组件增加计数 (${this.count})`)
      .onClick(() => {
        this.count++;
      })
  }
}
```

#### 5.1.4 @Provide/@Consume

跨组件层级的数据共享，适用于祖先组件向后代组件传递数据。

```typescript
// 祖先组件
@Provide appTheme: string = 'light';

Button(`切换主题: ${this.appTheme}`)
  .onClick(() => {
    this.appTheme = this.appTheme === 'light' ? 'dark' : 'light';
  })
ParentComponent()

// 中间组件
@Component
struct ParentComponent {
  build() {
    ChildComponent()
  }
}

// 后代组件
@Component
struct ChildComponent {
  @Consume appTheme: string;
  
  build() {
    Text(`当前主题: ${this.appTheme}`)
      .backgroundColor(this.appTheme === 'light' ? '#ffffff' : '#333333')
      .textColor(this.appTheme === 'light' ? '#000000' : '#ffffff')
  }
}
```

#### 5.1.5 @Observed/@ObjectLink

用于对象数据的响应式管理，当对象的属性发生变化时，组件会重新渲染。

```typescript
@Observed
class User {
  name: string;
  age: number;
  
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

@Entry
@Component
struct UserProfile {
  @State user: User = new User('张三', 25);
  
  build() {
    Column() {
      UserInfoComponent({ user: $user })
      Button('更新用户信息')
        .onClick(() => {
          this.user.name = '李四';
          this.user.age = 30;
        })
    }
  }
}

@Component
struct UserInfoComponent {
  @ObjectLink user: User;
  
  build() {
    Column() {
      Text(`姓名: ${this.user.name}`)
      Text(`年龄: ${this.user.age}`)
    }
  }
}
```

## 6. 自定义组件

### 6.1 创建自定义组件

自定义组件可以封装 UI 和逻辑，提高代码复用性。

```typescript
@Component
struct CustomButton {
  // 组件属性
  @Prop title: string;
  @Prop type: 'primary' | 'secondary' = 'primary';
  @Prop size: 'small' | 'medium' | 'large' = 'medium';
  
  // 事件回调
  @Prop onClick?: () => void;
  
  // 计算属性
  private get buttonStyle() {
    const styles: any = {
      primary: {
        backgroundColor: '#007AFF',
        textColor: Color.White
      },
      secondary: {
        backgroundColor: '#f0f0f0',
        textColor: Color.Black
      }
    };
    
    const sizes = {
      small: {
        width: 80,
        height: 32,
        fontSize: 14
      },
      medium: {
        width: 120,
        height: 40,
        fontSize: 16
      },
      large: {
        width: 160,
        height: 48,
        fontSize: 18
      }
    };
    
    return {
      ...styles[this.type],
      ...sizes[this.size]
    };
  }
  
  build() {
    Button(this.title)
      .width(this.buttonStyle.width)
      .height(this.buttonStyle.height)
      .fontSize(this.buttonStyle.fontSize)
      .backgroundColor(this.buttonStyle.backgroundColor)
      .fontColor(this.buttonStyle.textColor)
      .onClick(() => {
        if (this.onClick) {
          this.onClick();
        }
      })
  }
}
```

### 6.2 使用自定义组件

```typescript
@Entry
@Component
struct CustomButtonDemo {
  @State count: number = 0;
  
  build() {
    Column({
      space: 20
    })
      .width('100%')
      .height('100%')
      .justifyContent(FlexAlign.Center)
      .alignItems(HorizontalAlign.Center)
      {
        Text(`点击次数: ${this.count}`)
          .fontSize(20)
        
        CustomButton({
          title: '主要按钮',
          type: 'primary',
          size: 'medium',
          onClick: () => {
            this.count++;
          }
        })
        
        CustomButton({
          title: '次要按钮',
          type: 'secondary',
          size: 'small',
          onClick: () => {
            this.count++;
          }
        })
        
        CustomButton({
          title: '大按钮',
          type: 'primary',
          size: 'large',
          onClick: () => {
            this.count++;
          }
        })
      }
  }
}
```

## 7. 动画系统

### 7.1 基本动画

ArkUI 提供了丰富的动画 API，可以创建各种动画效果。

#### 7.1.1 属性动画

通过修改组件的属性值创建动画效果。

```typescript
@State scale: number = 1;
@State rotate: number = 0;

Button('点击动画')
  .onClick(() => {
    // 缩放动画
    animateTo({
      duration: 500,
      curve: Curve.EaseInOut
    }, () => {
      this.scale = this.scale === 1 ? 1.2 : 1;
    });
    
    // 旋转动画
    animateTo({
      duration: 1000,
      curve: Curve.Linear
    }, () => {
      this.rotate += 360;
    });
  })

Image($r('app.media.icon'))
  .width(100)
  .height(100)
  .scale({ x: this.scale, y: this.scale })
  .rotate({ angle: this.rotate })
```

#### 7.1.2 显式动画

使用 `AnimationController` 创建更复杂的动画效果。

```typescript
@State progress: number = 0;
private animationController: AnimationController = new AnimationController();

aboutToAppear() {
  // 配置动画
  this.animationController.initialize({
    duration: 2000,
    curve: Curve.EaseInOut,
    iterations: -1,  // 无限循环
    playMode: PlayMode.AlternateReverse
  });
  
  // 绑定动画值
  this.animationController.value.addListener(() => {
    this.progress = this.animationController.value.current;
  });
  
  // 启动动画
  this.animationController.play();
}

aboutToDisappear() {
  // 销毁动画控制器
  this.animationController.stop();
  this.animationController.destroy();
}

build() {
  Column() {
    // 进度条动画
    Progress({
      value: this.progress * 100,
      total: 100,
      type: ProgressType.Linear
    })
      .width('100%')
      .height(10)
      .color('#007AFF')
    
    // 圆形进度动画
    Progress({
      value: this.progress * 100,
      total: 100,
      type: ProgressType.Ring
    })
      .width(100)
      .height(100)
      .color('#007AFF')
  }
}
```

## 8. 最佳实践

### 8.1 代码组织

- **组件拆分**：将复杂的 UI 拆分为多个独立的组件
- **逻辑分离**：将业务逻辑与 UI 分离，提高代码可维护性
- **状态管理**：合理使用状态装饰器，避免状态管理混乱

### 8.2 性能优化

- **减少重渲染**：只在必要时修改状态变量，避免不必要的重渲染
- **使用虚拟列表**：对于大量数据，使用 `List` 组件的虚拟列表功能
- **图片优化**：使用适当尺寸的图片，避免大图片占用过多内存
- **延迟加载**：对于非关键资源，使用延迟加载技术

### 8.3 跨设备适配

- **使用相对单位**：尽量使用百分比、flex 等相对单位，避免使用固定像素值
- **响应式布局**：根据不同设备的屏幕尺寸调整布局
- **资源适配**：为不同设备提供合适的资源文件（如不同分辨率的图片）

### 8.4 开发建议

- **遵循命名规范**：使用清晰、一致的命名方式
- **添加注释**：为复杂的代码添加注释，提高代码可读性
- **错误处理**：妥善处理各种异常情况，提高应用稳定性
- **测试**：编写单元测试和 UI 测试，确保代码质量

## 9. 总结

ArkUI 开发框架是 HarmonyOS 应用开发的核心，提供了强大的声明式 UI 开发能力。通过本章节的学习，您已经了解了 ArkUI 的核心概念、组件系统、布局能力和开发范式。

ArkUI 的主要优势包括：

1. **声明式语法**：代码结构清晰，易于理解和维护
2. **丰富的组件库**：提供了大量内置组件，满足各种 UI 需求
3. **灵活的布局系统**：支持多种布局方式，适应不同的设计需求
4. **响应式状态管理**：通过状态装饰器实现 UI 与数据的自动同步
5. **跨设备适配**：支持多种设备形态，实现"一次开发，多端部署"

掌握 ArkUI 开发框架是 HarmonyOS 应用开发的基础，建议您通过实际项目练习，进一步巩固和提升 ArkUI 开发能力。