# Flutter 状态管理

状态管理是构建复杂应用的关键部分，它决定了如何在应用中存储、更新和共享数据。Flutter 提供了多种状态管理方案，从简单的 setState 到复杂的状态管理库。本章节将详细介绍 Flutter 的状态管理概念和常用的状态管理方案。

## 1. 状态管理基础

### 1.1 什么是状态

在 Flutter 中，状态（State）是指应用中可以变化的数据。这些数据可以是：

- 用户输入（如文本框内容、开关状态）
- 应用配置（如主题、语言设置）
- 应用数据（如用户信息、列表数据）
- UI 状态（如加载状态、错误状态）

### 1.2 状态的分类

根据状态的作用范围和生命周期，可以将状态分为以下几类：

#### 1.2.1 局部状态

局部状态（Local State）是指仅在单个 Widget 或少数相关 Widget 中使用的状态。这种状态通常由 Widget 自己管理，不需要与应用的其他部分共享。

**示例**：
- 文本输入框的内容
- 开关按钮的状态
- 页面的滚动位置

#### 1.2.2 应用状态

应用状态（App State）是指需要在应用的多个部分之间共享的状态。这种状态通常由专门的状态管理方案来管理。

**示例**：
- 用户登录状态
- 应用主题设置
- 购物车内容
- 应用级别的配置信息

### 1.3 状态管理的原则

在选择和实现状态管理方案时，应遵循以下原则：

- **单一数据源**：应用的状态应该有一个单一的真实来源（Single Source of Truth）。
- **状态是只读的**：状态不应该直接修改，而应该通过特定的方法（如 actions、events）来更新。
- **状态更新是纯函数**：状态更新应该是可预测的，相同的输入应该产生相同的输出。
- **分离关注点**：UI 代码和状态管理代码应该分离，使代码更容易维护和测试。

## 2. 基本状态管理

### 2.1 setState

`setState` 是 Flutter 中最基本的状态管理方式，它适用于管理单个 Widget 的局部状态。

**工作原理**：
- 当调用 `setState` 时，Flutter 会重新调用当前 Widget 的 `build` 方法，更新 UI。
- `setState` 接受一个回调函数，在这个回调函数中修改状态变量。

**示例**：

```dart
class CounterWidget extends StatefulWidget {
  @override
  _CounterWidgetState createState() => _CounterWidgetState();
}

class _CounterWidgetState extends State<CounterWidget> {
  int _counter = 0;  // 状态变量

  void _incrementCounter() {
    setState(() {
      _counter++;  // 在 setState 回调中修改状态
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Counter')),
      body: Center(
        child: Text('Count: $_counter'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        child: Icon(Icons.add),
      ),
    );
  }
}
```

**适用场景**：
- 简单的局部状态管理
- 仅在单个 Widget 中使用的状态
- 快速原型开发

### 2.2 管理类组件的状态

对于更复杂的局部状态管理，可以使用管理类来封装状态逻辑，使 UI 代码更加清晰。

**示例**：

```dart
// 状态管理类
class CounterManager {
  int _counter = 0;
  int get counter => _counter;

  void increment() {
    _counter++;
  }

  void decrement() {
    _counter--;
  }

  void reset() {
    _counter = 0;
  }
}

// 使用状态管理类的 Widget
class CounterWidget extends StatefulWidget {
  @override
  _CounterWidgetState createState() => _CounterWidgetState();
}

class _CounterWidgetState extends State<CounterWidget> {
  final _counterManager = CounterManager();

  void _increment() {
    setState(() {
      _counterManager.increment();
    });
  }

  void _decrement() {
    setState(() {
      _counterManager.decrement();
    });
  }

  void _reset() {
    setState(() {
      _counterManager.reset();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Counter')),
      body: Center(
        child: Text('Count: ${_counterManager.counter}'),
      ),
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          FloatingActionButton(
            onPressed: _increment,
            child: Icon(Icons.add),
          ),
          SizedBox(height: 10),
          FloatingActionButton(
            onPressed: _decrement,
            child: Icon(Icons.remove),
          ),
          SizedBox(height: 10),
          FloatingActionButton(
            onPressed: _reset,
            child: Icon(Icons.refresh),
          ),
        ],
      ),
    );
  }
}
```

**适用场景**：
- 中等复杂度的局部状态管理
- 需要在单个 Widget 中封装复杂的状态逻辑
- 希望将状态逻辑与 UI 代码分离

## 3. InheritedWidget 和 InheritedModel

### 3.1 InheritedWidget

`InheritedWidget` 是 Flutter 中用于在 Widget 树中共享数据的特殊 Widget。它允许数据从父 Widget 向下传递到子 Widget，而不需要通过构造函数显式传递。

**工作原理**：
- `InheritedWidget` 存储需要共享的数据。
- 子 Widget 可以通过 `BuildContext.dependOnInheritedWidgetOfExactType` 获取 `InheritedWidget` 中的数据。
- 当 `InheritedWidget` 中的数据发生变化时，依赖于这些数据的子 Widget 会自动重建。

**示例**：

```dart
// 定义一个 InheritedWidget
class ThemeProvider extends InheritedWidget {
  final ThemeData themeData;
  final Function(ThemeData) updateTheme;

  const ThemeProvider({
    Key? key,
    required this.themeData,
    required this.updateTheme,
    required Widget child,
  }) : super(key: key, child: child);

  // 提供一个便捷方法，让子 Widget 可以获取 ThemeProvider
  static ThemeProvider of(BuildContext context) {
    final ThemeProvider? result = context.dependOnInheritedWidgetOfExactType<ThemeProvider>();
    assert(result != null, 'No ThemeProvider found in context');
    return result!;
  }

  // 当数据发生变化时，通知依赖的子 Widget
  @override
  bool updateShouldNotify(ThemeProvider oldWidget) {
    return themeData != oldWidget.themeData;
  }
}

// 使用 ThemeProvider 的 Widget
class ThemeSwitcher extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final themeProvider = ThemeProvider.of(context);
    
    return Switch(
      value: themeProvider.themeData.brightness == Brightness.dark,
      onChanged: (value) {
        themeProvider.updateTheme(
          value ? ThemeData.dark() : ThemeData.light(),
        );
      },
    );
  }
}

class ThemedText extends StatelessWidget {
  final String text;

  const ThemedText(this.text, {Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final themeProvider = ThemeProvider.of(context);
    
    return Text(
      text,
      style: themeProvider.themeData.textTheme.headline6,
    );
  }
}

// 应用入口
class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  ThemeData _themeData = ThemeData.light();

  void _updateTheme(ThemeData newTheme) {
    setState(() {
      _themeData = newTheme;
    });
  }

  @override
  Widget build(BuildContext context) {
    return ThemeProvider(
      themeData: _themeData,
      updateTheme: _updateTheme,
      child: MaterialApp(
        theme: _themeData,
        home: Scaffold(
          appBar: AppBar(title: Text('Theme Example')),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ThemedText('Hello, Flutter!'),
                SizedBox(height: 20),
                ThemeSwitcher(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

**适用场景**：
- 应用主题设置
- 语言设置
- 用户登录状态
- 需要在 Widget 树中共享的全局配置信息

### 3.2 InheritedModel

`InheritedModel` 是 `InheritedWidget` 的扩展，它允许子 Widget 只依赖于 `InheritedWidget` 中的部分数据，而不是所有数据。这样可以减少不必要的 Widget 重建，提高性能。

**工作原理**：
- `InheritedModel` 存储需要共享的数据，并为数据的不同部分定义 "aspects"（方面）。
- 子 Widget 可以通过 `BuildContext.dependOnInheritedWidgetOfExactType` 并指定需要依赖的 "aspects" 来获取 `InheritedModel` 中的部分数据。
- 当 `InheritedModel` 中的数据发生变化时，只有依赖于发生变化的数据部分的子 Widget 会自动重建。

**示例**：

```dart
// 定义一个 InheritedModel
class CounterModel extends InheritedModel<String> {
  final int counterA;
  final int counterB;
  final Function() incrementA;
  final Function() incrementB;

  const CounterModel({
    Key? key,
    required this.counterA,
    required this.counterB,
    required this.incrementA,
    required this.incrementB,
    required Widget child,
  }) : super(key: key, child: child);

  // 提供便捷方法
  static CounterModel of(BuildContext context, {String? aspect}) {
    return InheritedModel.inheritFrom<CounterModel>(context, aspect: aspect)!;
  }

  // 当数据发生变化时，通知依赖的子 Widget
  @override
  bool updateShouldNotify(CounterModel oldWidget) {
    return counterA != oldWidget.counterA || counterB != oldWidget.counterB;
  }

  // 决定哪些依赖特定 aspect 的子 Widget 需要重建
  @override
  bool updateShouldNotifyDependent(CounterModel oldWidget, Set<String> dependencies) {
    if (dependencies.contains('counterA') && counterA != oldWidget.counterA) {
      return true;
    }
    if (dependencies.contains('counterB') && counterB != oldWidget.counterB) {
      return true;
    }
    return false;
  }
}

// 只依赖 counterA 的 Widget
class CounterADisplay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final counterModel = CounterModel.of(context, aspect: 'counterA');
    
    print('CounterADisplay built');
    
    return Column(
      children: [
        Text('Counter A: ${counterModel.counterA}'),
        ElevatedButton(
          onPressed: counterModel.incrementA,
          child: Text('Increment A'),
        ),
      ],
    );
  }
}

// 只依赖 counterB 的 Widget
class CounterBDisplay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final counterModel = CounterModel.of(context, aspect: 'counterB');
    
    print('CounterBDisplay built');
    
    return Column(
      children: [
        Text('Counter B: ${counterModel.counterB}'),
        ElevatedButton(
          onPressed: counterModel.incrementB,
          child: Text('Increment B'),
        ),
      ],
    );
  }
}

// 应用入口
class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  int _counterA = 0;
  int _counterB = 0;

  void _incrementA() {
    setState(() {
      _counterA++;
    });
  }

  void _incrementB() {
    setState(() {
      _counterB++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: CounterModel(
        counterA: _counterA,
        counterB: _counterB,
        incrementA: _incrementA,
        incrementB: _incrementB,
        child: Scaffold(
          appBar: AppBar(title: Text('InheritedModel Example')),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CounterADisplay(),
                SizedBox(height: 20),
                CounterBDisplay(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

**适用场景**：
- 复杂的应用状态管理
- 需要精细控制 Widget 重建的场景
- 性能要求较高的应用

## 4. Provider 状态管理

### 4.1 Provider 简介

`Provider` 是 Flutter 官方推荐的状态管理库，它基于 `InheritedWidget` 构建，提供了更简洁、更易用的 API。`Provider` 可以帮助我们：

- 轻松地在 Widget 树中共享数据
- 减少样板代码
- 提高代码的可测试性
- 更好地分离关注点

### 4.2 Provider 的核心概念

#### 4.2.1 ChangeNotifier

`ChangeNotifier` 是 Flutter 中用于实现观察者模式的类。它提供了：
- `addListener` 方法：添加监听器
- `removeListener` 方法：移除监听器
- `notifyListeners` 方法：通知所有监听器数据发生了变化

**示例**：

```dart
class CounterModel extends ChangeNotifier {
  int _count = 0;
  int get count => _count;

  void increment() {
    _count++;
    notifyListeners();  // 通知监听器数据发生了变化
  }

  void decrement() {
    _count--;
    notifyListeners();  // 通知监听器数据发生了变化
  }
}
```

#### 4.2.2 Provider 组件

`Provider` 是 `Provider` 库中最基本的组件，它用于在 Widget 树中提供数据。

**示例**：

```dart
Provider<CounterModel>(
  create: (context) => CounterModel(),
  child: MyApp(),
)
```

#### 4.2.3 Consumer 组件

`Consumer` 是 `Provider` 库中用于消费（使用）`Provider` 提供的数据的组件。

**示例**：

```dart
Consumer<CounterModel>(
  builder: (context, counter, child) {
    return Text('Count: ${counter.count}');
  },
)
```

### 4.3 Provider 的使用

#### 4.3.1 安装 Provider

在 `pubspec.yaml` 文件中添加 `provider` 依赖：

```yaml
dependencies:
  flutter:
    sdk: flutter
  provider: ^6.0.0
```

然后运行 `flutter pub get` 命令安装依赖。

#### 4.3.2 基本使用

**示例**：

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// 状态模型
class CounterModel extends ChangeNotifier {
  int _count = 0;
  int get count => _count;

  void increment() {
    _count++;
    notifyListeners();
  }

  void decrement() {
    _count--;
    notifyListeners();
  }
}

// 使用状态的 Widget
class CounterDisplay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // 使用 Provider.of 获取状态
    final counter = Provider.of<CounterModel>(context);
    
    return Text('Count: ${counter.count}');
  }
}

class CounterControls extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // 使用 Consumer 获取状态
    return Consumer<CounterModel>(
      builder: (context, counter, child) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: counter.decrement,
              child: Icon(Icons.remove),
            ),
            SizedBox(width: 20),
            ElevatedButton(
              onPressed: counter.increment,
              child: Icon(Icons.add),
            ),
          ],
        );
      },
    );
  }
}

// 应用入口
void main() {
  runApp(
    // 使用 Provider 提供状态
    ChangeNotifierProvider(
      create: (context) => CounterModel(),
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: Text('Provider Example')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CounterDisplay(),
              SizedBox(height: 20),
              CounterControls(),
            ],
          ),
        ),
      ),
    );
  }
}
```

#### 4.3.3 多种 Provider 类型

`Provider` 库提供了多种类型的 Provider，用于不同的场景：

##### Provider
最基本的 Provider，用于提供不变的数据。

```dart
Provider<String>(
  create: (context) => 'Hello, Flutter!',
  child: MyWidget(),
)
```

##### ListenableProvider
用于提供实现了 `Listenable` 接口的对象（如 `ChangeNotifier`）。

```dart
ListenableProvider<CounterModel>(
  create: (context) => CounterModel(),
  child: MyWidget(),
)
```

##### ChangeNotifierProvider
专门用于提供 `ChangeNotifier` 对象的 Provider，是 `ListenableProvider` 的特例。

```dart
ChangeNotifierProvider<CounterModel>(
  create: (context) => CounterModel(),
  child: MyWidget(),
)
```

##### ValueListenableProvider
用于提供实现了 `ValueListenable` 接口的对象。

```dart
final counter = ValueNotifier<int>(0);

ValueListenableProvider<int>(
  valueListenable: counter,
  child: MyWidget(),
)
```

##### StreamProvider
用于提供 `Stream` 对象的数据。

```dart
final counterStream = Stream<int>.periodic(Duration(seconds: 1), (i) => i);

StreamProvider<int>(
  create: (context) => counterStream,
  initialData: 0,
  child: MyWidget(),
)
```

##### FutureProvider
用于提供 `Future` 对象的数据。

```dart
final fetchData = Future<String>.delayed(Duration(seconds: 2), () => 'Hello, Flutter!');

FutureProvider<String>(
  create: (context) => fetchData,
  initialData: 'Loading...',
  child: MyWidget(),
)
```

#### 4.3.4 多个 Provider

在一个应用中，我们通常需要提供多个状态。`Provider` 库提供了 `MultiProvider` 组件，用于同时提供多个状态。

**示例**：

```dart
void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => CounterModel()),
        ChangeNotifierProvider(create: (context) => ThemeModel()),
        Provider(create: (context) => ApiService()),
      ],
      child: MyApp(),
    ),
  );
}
```

#### 4.3.5 嵌套 Provider

Provider 可以嵌套使用，子 Provider 可以访问父 Provider 提供的数据。

**示例**：

```dart
void main() {
  runApp(
    Provider<ApiService>(
      create: (context) => ApiService(),
      child: ChangeNotifierProvider<CounterModel>(
        create: (context) => CounterModel(Provider.of<ApiService>(context, listen: false)),
        child: MyApp(),
      ),
    ),
  );
}
```

### 4.4 Provider 的高级用法

#### 4.4.1 选择器（Selector）

`Selector` 是 `Consumer` 的变体，它允许我们只依赖于状态的一部分，而不是整个状态。这样可以减少不必要的 Widget 重建，提高性能。

**示例**：

```dart
class UserProfile extends ChangeNotifier {
  String _name = 'John Doe';
  int _age = 30;
  String get name => _name;
  int get age => _age;

  void updateName(String newName) {
    _name = newName;
    notifyListeners();
  }

  void updateAge(int newAge) {
    _age = newAge;
    notifyListeners();
  }
}

// 只依赖于 name 的 Widget
class NameDisplay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Selector<UserProfile, String>(
      selector: (context, user) => user.name,
      builder: (context, name, child) {
        print('NameDisplay built');
        return Text('Name: $name');
      },
    );
  }
}

// 只依赖于 age 的 Widget
class AgeDisplay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Selector<UserProfile, int>(
      selector: (context, user) => user.age,
      builder: (context, age, child) {
        print('AgeDisplay built');
        return Text('Age: $age');
      },
    );
  }
}
```

#### 4.4.2 状态持久化

我们可以使用 `shared_preferences` 库和 `Provider` 结合，实现状态的持久化。

**示例**：

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CounterModel extends ChangeNotifier {
  static const String _counterKey = 'counter';
  int _count = 0;
  late SharedPreferences _prefs;

  int get count => _count;

  CounterModel() {
    _loadCounter();
  }

  Future<void> _loadCounter() async {
    _prefs = await SharedPreferences.getInstance();
    _count = _prefs.getInt(_counterKey) ?? 0;
    notifyListeners();
  }

  Future<void> increment() async {
    _count++;
    await _prefs.setInt(_counterKey, _count);
    notifyListeners();
  }

  Future<void> decrement() async {
    _count--;
    await _prefs.setInt(_counterKey, _count);
    notifyListeners();
  }
}
```

#### 4.4.3 测试 Provider

`Provider` 库提供了测试工具，使我们可以轻松地测试使用 `Provider` 的 Widget。

**示例**：

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

class CounterModel extends ChangeNotifier {
  int _count = 0;
  int get count => _count;

  void increment() {
    _count++;
    notifyListeners();
  }
}

class CounterDisplay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final counter = Provider.of<CounterModel>(context);
    return Text('Count: ${counter.count}');
  }
}

void main() {
  testWidgets('CounterDisplay shows initial count', (WidgetTester tester) async {
    // 构建 Widget
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (context) => CounterModel(),
        child: MaterialApp(
          home: Scaffold(
            body: CounterDisplay(),
          ),
        ),
      ),
    );

    // 验证初始状态
    expect(find.text('Count: 0'), findsOneWidget);
  });

  testWidgets('CounterDisplay updates when count changes', (WidgetTester tester) async {
    // 创建 CounterModel
    final counterModel = CounterModel();

    // 构建 Widget
    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: counterModel,
        child: MaterialApp(
          home: Scaffold(
            body: CounterDisplay(),
          ),
        ),
      ),
    );

    // 验证初始状态
    expect(find.text('Count: 0'), findsOneWidget);

    // 更新状态
    counterModel.increment();
    await tester.pump();

    // 验证状态更新
    expect(find.text('Count: 1'), findsOneWidget);
  });
}
```

## 5. Bloc 状态管理

### 5.1 Bloc 简介

BLoC（Business Logic Component）是一种状态管理模式，它的核心思想是将业务逻辑与 UI 分离，使应用更易于测试和维护。BLoC 模式基于 `Stream` 和 `Sink`，使用响应式编程的思想来管理状态。

**BLoC 模式的组成部分**：

- **Events**：表示用户操作或系统事件（如按钮点击、网络请求完成）。
- **States**：表示应用的状态（如加载中、加载成功、加载失败）。
- **Bloc**：接收 Events，处理业务逻辑，输出 States。

### 5.2 Bloc 库的使用

#### 5.2.1 安装 Bloc

在 `pubspec.yaml` 文件中添加 `bloc` 和 `flutter_bloc` 依赖：

```yaml
dependencies:
  flutter:
    sdk: flutter
  bloc: ^8.0.0
  flutter_bloc: ^8.0.0
```

然后运行 `flutter pub get` 命令安装依赖。

#### 5.2.2 基本使用

**示例**：

```dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

// 1. 定义 Events
enum CounterEvent {
  increment,
  decrement,
}

// 2. 定义 States
class CounterState {
  final int count;
  const CounterState(this.count);
}

// 3. 定义 Bloc
class CounterBloc extends Bloc<CounterEvent, CounterState> {
  CounterBloc() : super(const CounterState(0)) {
    on<CounterEvent>((event, emit) {
      if (event == CounterEvent.increment) {
        emit(CounterState(state.count + 1));
      } else if (event == CounterEvent.decrement) {
        emit(CounterState(state.count - 1));
      }
    });
  }
}

// 4. 使用 Bloc 的 Widget
class CounterPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bloc Counter')),
      body: BlocBuilder<CounterBloc, CounterState>(
        builder: (context, state) {
          return Center(
            child: Text('Count: ${state.count}'),
          );
        },
      ),
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          FloatingActionButton(
            onPressed: () => context.read<CounterBloc>().add(CounterEvent.increment),
            child: const Icon(Icons.add),
          ),
          const SizedBox(height: 10),
          FloatingActionButton(
            onPressed: () => context.read<CounterBloc>().add(CounterEvent.decrement),
            child: const Icon(Icons.remove),
          ),
        ],
      ),
    );
  }
}

// 5. 应用入口
void main() {
  runApp(
    BlocProvider(
      create: (context) => CounterBloc(),
      child: const MaterialApp(
        home: CounterPage(),
      ),
    ),
  );
}
```

#### 5.2.3 Bloc 的高级用法

##### 异步操作

Bloc 可以轻松处理异步操作，如网络请求。

**示例**：

```dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

// 1. 定义 Events
enum WeatherEvent {
  fetchWeather,
  refreshWeather,
}

// 2. 定义 States
abstract class WeatherState {} class WeatherInitial extends WeatherState {} class WeatherLoading extends WeatherState {} class WeatherLoaded extends WeatherState {
  final String city;
  final double temperature;
  final String condition;

  WeatherLoaded({
    required this.city,
    required this.temperature,
    required this.condition,
  });
}

class WeatherError extends WeatherState {
  final String message;

  WeatherError(this.message);
}

// 3. 定义 Bloc
class WeatherBloc extends Bloc<WeatherEvent, WeatherState> {
  final http.Client httpClient;

  WeatherBloc({required this.httpClient}) : super(WeatherInitial()) {
    on<WeatherEvent>((event, emit) async {
      if (event == WeatherEvent.fetchWeather || event == WeatherEvent.refreshWeather) {
        emit(WeatherLoading());
        try {
          final weather = await _fetchWeather();
          emit(WeatherLoaded(
            city: weather['city'],
            temperature: weather['temperature'],
            condition: weather['condition'],
          ));
        } catch (e) {
          emit(WeatherError('Failed to fetch weather data'));
        }
      }
    });
  }

  Future<Map<String, dynamic>> _fetchWeather() async {
    final response = await httpClient.get(
      Uri.parse('https://api.example.com/weather?city=New York'),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to fetch weather');
    }
  }
}

// 4. 使用 Bloc 的 Widget
class WeatherPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Weather App')),
      body: BlocBuilder<WeatherBloc, WeatherState>(
        builder: (context, state) {
          if (state is WeatherInitial) {
            return const Center(child: Text('Press the button to fetch weather'));
          } else if (state is WeatherLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is WeatherLoaded) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('City: ${state.city}'),
                  const SizedBox(height: 10),
                  Text('Temperature: ${state.temperature}°C'),
                  const SizedBox(height: 10),
                  Text('Condition: ${state.condition}'),
                ],
              ),
            );
          } else if (state is WeatherError) {
            return Center(child: Text(state.message));
          }
          return const SizedBox();
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.read<WeatherBloc>().add(WeatherEvent.fetchWeather),
        child: const Icon(Icons.cloud_download),
      ),
    );
  }
}

// 5. 应用入口
void main() {
  runApp(
    BlocProvider(
      create: (context) => WeatherBloc(httpClient: http.Client()),
      child: const MaterialApp(
        home: WeatherPage(),
      ),
    ),
  );
}
```

##### 多个 Bloc

在一个应用中，我们通常需要使用多个 Bloc。`flutter_bloc` 库提供了 `MultiBlocProvider` 组件，用于同时提供多个 Bloc。

**示例**：

```dart
void main() {
  runApp(
    MultiBlocProvider(
      providers: [
        BlocProvider(create: (context) => CounterBloc()),
        BlocProvider(create: (context) => ThemeBloc()),
        BlocProvider(create: (context) => UserBloc()),
      ],
      child: const MyApp(),
    ),
  );
}
```

##### BlocListener

`BlocListener` 用于监听 Bloc 的状态变化，并执行副作用操作（如导航、显示对话框、显示 SnackBar 等）。

**示例**：

```dart
class LoginPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: BlocListener<LoginBloc, LoginState>(
        listener: (context, state) {
          if (state is LoginSuccess) {
            // 登录成功，导航到首页
            Navigator.pushReplacementNamed(context, '/home');
          } else if (state is LoginError) {
            // 登录失败，显示错误消息
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
          }
        },
        child: BlocBuilder<LoginBloc, LoginState>(
          builder: (context, state) {
            if (state is LoginLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            return LoginForm();
          },
        ),
      ),
    );
  }
}
```

##### BlocSelector

`BlocSelector` 是 `BlocBuilder` 的变体，它允许我们只依赖于 Bloc 状态的一部分，而不是整个状态。这样可以减少不必要的 Widget 重建，提高性能。

**示例**：

```dart
class UserPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('User Profile')),
      body: BlocSelector<UserBloc, UserState, String>(
        selector: (state) => state.name,
        builder: (context, name) {
          return Center(
            child: Text('Name: $name'),
          );
        },
      ),
    );
  }
}
```

## 6. 其他状态管理方案

除了上述提到的状态管理方案外，Flutter 社区还提供了多种其他状态管理库，每种库都有其特点和适用场景。

### 6.1 Redux

Redux 是一种来自 React 生态系统的状态管理模式，它基于单向数据流的思想。在 Flutter 中，可以使用 `flutter_redux` 库来实现 Redux 状态管理。

**核心概念**：

- **Store**：存储应用的状态。
- **Actions**：描述状态应该如何变化。
- **Reducers**：根据当前状态和 Actions 计算新状态的纯函数。
- **Middleware**：处理异步操作和副作用。

**适用场景**：
- 复杂的应用状态管理
- 需要严格控制状态变化的场景
- 团队熟悉 Redux 模式的项目

### 6.2 MobX

MobX 是一种简单、可扩展的状态管理库，它基于观察者模式。在 Flutter 中，可以使用 `mobx` 和 `flutter_mobx` 库来实现 MobX 状态管理。

**核心概念**：

- **Observable**：可观察的状态。
- **Actions**：修改 Observable 状态的方法。
- **Computed**：根据 Observable 状态计算得出的值。
- **Reactions**：响应 Observable 状态变化的副作用。

**适用场景**：
- 中等复杂度的状态管理
- 希望减少样板代码的项目
- 团队熟悉 MobX 模式的项目

### 6.3 GetX

GetX 是一个轻量级的、功能丰富的 Flutter 框架，它提供了状态管理、路由管理、依赖注入等功能。

**核心概念**：

- **Controller**：管理状态和业务逻辑。
- **Observable**：可观察的状态。
- **GetBuilder**：用于重建依赖于 Controller 的 Widget。
- **GetX**：用于重建依赖于 Observable 状态的 Widget。

**适用场景**：
- 希望使用统一框架的项目
- 快速开发原型或小型应用
- 需要轻量级解决方案的项目

### 6.4 Riverpod

Riverpod 是由 `Provider` 库的作者创建的新一代状态管理库，它解决了 `Provider` 库的一些限制，并提供了更好的开发体验和性能。

**核心概念**：

- **Provider**：提供数据的函数。
- **ConsumerWidget**：用于消费 Provider 的 Widget。
- **ConsumerStatefulWidget**：用于消费 Provider 的有状态 Widget。
- **Selector**：用于选择性地消费 Provider 的部分数据。

**适用场景**：
- 复杂的应用状态管理
- 需要更好的开发体验和性能的项目
- 团队熟悉 `Provider` 库的项目

## 7. 状态管理方案选择

选择合适的状态管理方案是构建高质量 Flutter 应用的关键。以下是一些选择状态管理方案的建议：

### 7.1 根据应用复杂度选择

| 应用复杂度 | 推荐的状态管理方案 |
|-----------|-------------------|
| 简单应用（单个页面，少量状态） | `setState` |
| 中等复杂度应用（多个页面，中等状态） | `Provider` |
| 复杂应用（多个页面，大量状态，复杂业务逻辑） | `Bloc`、`Riverpod`、`Redux` |

### 7.2 根据团队经验选择

- 如果团队熟悉 React 的状态管理库（如 Redux、MobX），可以选择对应的 Flutter 实现。
- 如果团队是 Flutter 新手，可以从 `setState` 和 `Provider` 开始，然后逐步学习更复杂的状态管理方案。
- 如果团队希望使用统一的框架，可以考虑 `GetX`。

### 7.3 根据性能要求选择

- 对于性能要求较高的应用，可以选择 `InheritedModel`、`Selector`（在 `Provider` 中）、`BlocSelector`（在 `Bloc` 中）等精细控制 Widget 重建的方案。
- 对于需要处理大量数据的应用，可以选择 `Riverpod`、`Redux` 等支持持久化、缓存等功能的方案。

## 8. 状态管理最佳实践

### 8.1 代码组织

- **分离关注点**：将 UI 代码、业务逻辑和状态管理代码分离。
- **模块化**：将状态管理按功能模块划分，每个模块负责自己的状态。
- **使用接口**：定义清晰的接口，使代码更容易测试和维护。

### 8.2 性能优化

- **避免不必要的重建**：使用 `const` 构造函数、`Selector` 等方式减少不必要的 Widget 重建。
- **批量更新**：当需要更新多个状态时，尽量批量更新，减少状态更新的次数。
- **使用缓存**：对于计算密集型的状态，使用缓存机制避免重复计算。

### 8.3 可测试性

- **使用依赖注入**：使用依赖注入（如 `Provider`、`GetIt`）使代码更容易测试。
- **编写单元测试**：为状态管理代码编写单元测试，确保状态更新的逻辑正确。
- **编写集成测试**：为使用状态管理的 Widget 编写集成测试，确保 UI 和状态管理的交互正确。

### 8.4 调试技巧

- **使用 Flutter DevTools**：Flutter DevTools 提供了强大的调试功能，包括 Widget 树、性能分析、内存分析等。
- **添加日志**：在状态更新的关键位置添加日志，方便调试和追踪问题。
- **使用状态可视化工具**：一些状态管理库（如 `Bloc`、`GetX`）提供了状态可视化工具，可以帮助我们更好地理解和调试状态变化。

## 9. 总结

状态管理是构建复杂 Flutter 应用的关键部分，选择合适的状态管理方案并正确实现，可以使应用更容易维护、测试和扩展。

本章节介绍了 Flutter 中常用的状态管理方案，包括：

1. **基本状态管理**：`setState` 是最基本的状态管理方式，适用于管理单个 Widget 的局部状态。
2. **InheritedWidget 和 InheritedModel**：Flutter 内置的用于在 Widget 树中共享数据的方案。
3. **Provider**：Flutter 官方推荐的状态管理库，基于 `InheritedWidget` 构建，提供了简洁易用的 API。
4. **Bloc**：基于 `Stream` 和响应式编程思想的状态管理模式，适用于复杂的应用状态管理。
5. **其他状态管理方案**：Redux、MobX、GetX、Riverpod 等，每种方案都有其特点和适用场景。

在选择状态管理方案时，应根据应用的复杂度、团队的经验和性能要求等因素综合考虑。无论选择哪种方案，都应遵循状态管理的基本原则，如单一数据源、状态只读、纯函数更新等，以确保状态管理的可预测性和可维护性。

通过学习本章节，你应该能够理解 Flutter 中各种状态管理方案的工作原理和适用场景，并能够根据项目需求选择合适的状态管理方案。在接下来的章节中，我们将学习 Flutter 的导航与路由、网络请求等高级主题，进一步提升你的 Flutter 开发技能。