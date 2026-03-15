---
title: "Flutter 网络请求"
category: "跨端 · Flutter"
tags:
  - Flutter
excerpt: "在现代移动应用开发中，网络请求是一个核心功能，它允许应用与服务器进行数据交换，实现数据获取、用户认证、内容更新等功能。Flutter 提供了多种方式来处理网络请求，包括内置的 dart:io 和 dart:html 库，以及第三方库如 ht..."
---

# Flutter 网络请求

在现代移动应用开发中，网络请求是一个核心功能，它允许应用与服务器进行数据交换，实现数据获取、用户认证、内容更新等功能。Flutter 提供了多种方式来处理网络请求，包括内置的 `dart:io` 和 `dart:html` 库，以及第三方库如 `http` 和 `dio`。本章节将深入探讨 Flutter 中的网络请求技术，包括基本请求、高级特性、最佳实践等内容。

## 1. 网络请求基础

### 1.1 HTTP 协议简介

HTTP（Hypertext Transfer Protocol）是一种用于传输超媒体文档（如 HTML）的应用层协议。它是 Web 的基础，也是移动应用与服务器通信的主要方式。HTTP 协议的主要特点包括：

- **无状态**：每个请求都是独立的，服务器不会记住之前的请求。
- **基于请求-响应**：客户端发送请求，服务器返回响应。
- **支持多种方法**：GET、POST、PUT、DELETE、PATCH 等。
- **支持头部信息**：用于传递元数据，如认证信息、内容类型等。
- **支持状态码**：用于表示请求的处理结果，如 200（成功）、404（未找到）、500（服务器错误）等。

### 1.2 Flutter 中的网络请求库

Flutter 提供了以下几种处理网络请求的方式：

#### 1.2.1 dart:io 库

`dart:io` 是 Dart 标准库的一部分，提供了底层的网络请求功能，主要用于命令行和服务器应用。在 Flutter 中，它主要用于与操作系统交互，也可以用于处理网络请求。

#### 1.2.2 http 包

`http` 是 Flutter 中最常用的网络请求包之一，它是对 `dart:io` 的高级封装，提供了更简洁的 API。

#### 1.2.3 dio 包

`dio` 是一个强大的 Dart HTTP 客户端，支持拦截器、全局配置、FormData、请求取消、文件下载、超时等功能，是一个功能全面的网络请求库。

## 2. 使用 http 包进行网络请求

### 2.1 安装 http 包

在 Flutter 项目中使用 `http` 包，首先需要在 `pubspec.yaml` 文件中添加依赖：

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^0.13.5
```

然后运行 `flutter pub get` 命令安装依赖。

### 2.2 发送 GET 请求

使用 `http.get` 方法可以发送 GET 请求，获取服务器数据。

**示例**：

```dart
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HTTP GET Demo',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: HttpGetExample(),
    );
  }
}

class HttpGetExample extends StatefulWidget {
  @override
  _HttpGetExampleState createState() => _HttpGetExampleState();
}

class _HttpGetExampleState extends State<HttpGetExample> {
  String result = '加载中...';

  @override
  void initState() {
    super.initState();
    fetchData();
  }

  Future<void> fetchData() async {
    try {
      // 发送 GET 请求
      final response = await http.get(Uri.parse('https://jsonplaceholder.typicode.com/posts/1'));
      
      // 检查响应状态码
      if (response.statusCode == 200) {
        // 解析 JSON 响应
        final data = jsonDecode(response.body);
        setState(() {
          result = 'Title: ${data['title']}\n\nBody: ${data['body']}';
        });
      } else {
        setState(() {
          result = '请求失败：${response.statusCode}';
        });
      }
    } catch (error) {
      setState(() {
        result = '发生错误：$error';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('HTTP GET 示例')),
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(result),
        ),
      ),
    );
  }
}
```

### 2.3 发送 POST 请求

使用 `http.post` 方法可以发送 POST 请求，向服务器提交数据。

**示例**：

```dart
Future<void> createPost() async {
  try {
    // 准备请求体
    final body = jsonEncode({
      'title': 'Flutter HTTP Post',
      'body': 'This is a test post from Flutter',
      'userId': 1,
    });
    
    // 发送 POST 请求
    final response = await http.post(
      Uri.parse('https://jsonplaceholder.typicode.com/posts'),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: body,
    );
    
    // 检查响应状态码
    if (response.statusCode == 201) { // 201 Created
      // 解析 JSON 响应
      final data = jsonDecode(response.body);
      setState(() {
        result = '创建成功！\nID: ${data['id']}\nTitle: ${data['title']}';
      });
    } else {
      setState(() {
        result = '创建失败：${response.statusCode}';
      });
    }
  } catch (error) {
    setState(() {
      result = '发生错误：$error';
    });
  }
}
```

### 2.4 发送 PUT 请求

使用 `http.put` 方法可以发送 PUT 请求，更新服务器上的资源。

**示例**：

```dart
Future<void> updatePost() async {
  try {
    // 准备请求体
    final body = jsonEncode({
      'id': 1,
      'title': 'Updated Title',
      'body': 'This post has been updated',
      'userId': 1,
    });
    
    // 发送 PUT 请求
    final response = await http.put(
      Uri.parse('https://jsonplaceholder.typicode.com/posts/1'),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: body,
    );
    
    // 检查响应状态码
    if (response.statusCode == 200) {
      // 解析 JSON 响应
      final data = jsonDecode(response.body);
      setState(() {
        result = '更新成功！\nTitle: ${data['title']}\nBody: ${data['body']}';
      });
    } else {
      setState(() {
        result = '更新失败：${response.statusCode}';
      });
    }
  } catch (error) {
    setState(() {
      result = '发生错误：$error';
    });
  }
}
```

### 2.5 发送 PATCH 请求

使用 `http.patch` 方法可以发送 PATCH 请求，部分更新服务器上的资源。

**示例**：

```dart
Future<void> patchPost() async {
  try {
    // 准备请求体（只包含需要更新的字段）
    final body = jsonEncode({
      'title': 'Partially Updated Title',
    });
    
    // 发送 PATCH 请求
    final response = await http.patch(
      Uri.parse('https://jsonplaceholder.typicode.com/posts/1'),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: body,
    );
    
    // 检查响应状态码
    if (response.statusCode == 200) {
      // 解析 JSON 响应
      final data = jsonDecode(response.body);
      setState(() {
        result = '部分更新成功！\nTitle: ${data['title']}';
      });
    } else {
      setState(() {
        result = '更新失败：${response.statusCode}';
      });
    }
  } catch (error) {
    setState(() {
      result = '发生错误：$error';
    });
  }
}
```

### 2.6 发送 DELETE 请求

使用 `http.delete` 方法可以发送 DELETE 请求，删除服务器上的资源。

**示例**：

```dart
Future<void> deletePost() async {
  try {
    // 发送 DELETE 请求
    final response = await http.delete(
      Uri.parse('https://jsonplaceholder.typicode.com/posts/1'),
    );
    
    // 检查响应状态码
    if (response.statusCode == 200) {
      setState(() {
        result = '删除成功！';
      });
    } else {
      setState(() {
        result = '删除失败：${response.statusCode}';
      });
    }
  } catch (error) {
    setState(() {
      result = '发生错误：$error';
    });
  }
}
```

### 2.7 处理响应数据

HTTP 响应包含以下几个重要部分：

- **状态码（statusCode）**：表示请求的处理结果。
- **响应头（headers）**：包含响应的元数据。
- **响应体（body）**：包含响应的实际内容，通常是 JSON 格式的字符串。

在 Flutter 中，可以使用 `jsonDecode` 函数将 JSON 字符串解析为 Dart 对象（如 Map 或 List）。

**示例**：

```dart
Future<void> fetchPosts() async {
  try {
    final response = await http.get(Uri.parse('https://jsonplaceholder.typicode.com/posts'));
    
    if (response.statusCode == 200) {
      // 解析 JSON 数组
      final List<dynamic> posts = jsonDecode(response.body);
      
      // 处理数据
      setState(() {
        result = '获取到 ${posts.length} 篇文章：\n';
        for (var i = 0; i < 3 && i < posts.length; i++) { // 只显示前 3 篇
          result += '\n标题：${posts[i]['title']}\n';
        }
        if (posts.length > 3) {
          result += '\n... 还有 ${posts.length - 3} 篇文章';
        }
      });
    } else {
      setState(() {
        result = '请求失败：${response.statusCode}';
      });
    }
  } catch (error) {
    setState(() {
      result = '发生错误：$error';
    });
  }
}
```

## 3. 使用 dio 包进行网络请求

### 3.1 安装 dio 包

在 Flutter 项目中使用 `dio` 包，首先需要在 `pubspec.yaml` 文件中添加依赖：

```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^4.0.6
```

然后运行 `flutter pub get` 命令安装依赖。

### 3.2 发送 GET 请求

使用 `dio.get` 方法可以发送 GET 请求，获取服务器数据。

**示例**：

```dart
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Dio GET Demo',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: DioGetExample(),
    );
  }
}

class DioGetExample extends StatefulWidget {
  @override
  _DioGetExampleState createState() => _DioGetExampleState();
}

class _DioGetExampleState extends State<DioGetExample> {
  String result = '加载中...';
  final Dio dio = Dio(); // 创建 Dio 实例

  @override
  void initState() {
    super.initState();
    fetchData();
  }

  Future<void> fetchData() async {
    try {
      // 发送 GET 请求
      final response = await dio.get('https://jsonplaceholder.typicode.com/posts/1');
      
      // 检查响应状态码
      if (response.statusCode == 200) {
        // Dio 自动解析 JSON
        final data = response.data;
        setState(() {
          result = 'Title: ${data['title']}\n\nBody: ${data['body']}';
        });
      } else {
        setState(() {
          result = '请求失败：${response.statusCode}';
        });
      }
    } catch (error) {
      setState(() {
        result = '发生错误：$error';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Dio GET 示例')),
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(result),
        ),
      ),
    );
  }
}
```

### 3.3 发送 POST 请求

使用 `dio.post` 方法可以发送 POST 请求，向服务器提交数据。

**示例**：

```dart
Future<void> createPost() async {
  try {
    // 准备请求体
    final data = {
      'title': 'Flutter Dio Post',
      'body': 'This is a test post from Flutter using Dio',
      'userId': 1,
    };
    
    // 发送 POST 请求
    final response = await dio.post(
      'https://jsonplaceholder.typicode.com/posts',
      data: data,
    );
    
    // 检查响应状态码
    if (response.statusCode == 201) { // 201 Created
      // Dio 自动解析 JSON
      final responseData = response.data;
      setState(() {
        result = '创建成功！\nID: ${responseData['id']}\nTitle: ${responseData['title']}';
      });
    } else {
      setState(() {
        result = '创建失败：${response.statusCode}';
      });
    }
  } catch (error) {
    setState(() {
      result = '发生错误：$error';
    });
  }
}
```

### 3.4 发送 PUT、PATCH 和 DELETE 请求

Dio 也提供了 `put`、`patch` 和 `delete` 方法，用法与 `get` 和 `post` 类似。

**示例**：

```dart
// PUT 请求
Future<void> updatePost() async {
  try {
    final data = {
      'id': 1,
      'title': 'Updated Title with Dio',
      'body': 'This post has been updated using Dio',
      'userId': 1,
    };
    
    final response = await dio.put(
      'https://jsonplaceholder.typicode.com/posts/1',
      data: data,
    );
    
    if (response.statusCode == 200) {
      setState(() {
        result = '更新成功！\nTitle: ${response.data['title']}';
      });
    } else {
      setState(() {
        result = '更新失败：${response.statusCode}';
      });
    }
  } catch (error) {
    setState(() {
      result = '发生错误：$error';
    });
  }
}

// PATCH 请求
Future<void> patchPost() async {
  try {
    final data = {
      'title': 'Partially Updated Title with Dio',
    };
    
    final response = await dio.patch(
      'https://jsonplaceholder.typicode.com/posts/1',
      data: data,
    );
    
    if (response.statusCode == 200) {
      setState(() {
        result = '部分更新成功！\nTitle: ${response.data['title']}';
      });
    } else {
      setState(() {
        result = '更新失败：${response.statusCode}';
      });
    }
  } catch (error) {
    setState(() {
      result = '发生错误：$error';
    });
  }
}

// DELETE 请求
Future<void> deletePost() async {
  try {
    final response = await dio.delete(
      'https://jsonplaceholder.typicode.com/posts/1',
    );
    
    if (response.statusCode == 200) {
      setState(() {
        result = '删除成功！';
      });
    } else {
      setState(() {
        result = '删除失败：${response.statusCode}';
      });
    }
  } catch (error) {
    setState(() {
      result = '发生错误：$error';
    });
  }
}
```

### 3.5 Dio 的高级特性

Dio 提供了许多高级特性，如拦截器、全局配置、请求取消、超时设置等，这些特性可以帮助我们更好地管理网络请求。

#### 3.5.1 全局配置

可以为 Dio 实例设置全局配置，如基础 URL、超时时间、默认 headers 等。

**示例**：

```dart
final Dio dio = Dio(BaseOptions(
  baseUrl: 'https://jsonplaceholder.typicode.com',
  connectTimeout: 5000, // 连接超时时间，单位毫秒
  receiveTimeout: 3000, // 接收超时时间，单位毫秒
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
    'Accept': 'application/json',
  },
));

// 使用全局配置发送请求
Future<void> fetchPost() async {
  try {
    // 由于设置了 baseUrl，这里只需要相对路径
    final response = await dio.get('/posts/1');
    
    if (response.statusCode == 200) {
      setState(() {
        result = 'Title: ${response.data['title']}';
      });
    }
  } catch (error) {
    setState(() {
      result = '发生错误：$error';
    });
  }
}
```

#### 3.5.2 拦截器

拦截器可以在请求发送前和响应返回后执行自定义逻辑，如添加认证令牌、处理错误、记录日志等。

Dio 提供了以下几种拦截器：

- **请求拦截器（onRequest）**：在请求发送前执行。
- **响应拦截器（onResponse）**：在接收到响应后执行。
- **错误拦截器（onError）**：在请求或响应过程中发生错误时执行。

**示例**：

```dart
final Dio dio = Dio();

// 添加拦截器
dio.interceptors.add(InterceptorsWrapper(
  // 请求拦截器
  onRequest: (options, handler) {
    print('请求前:');
    print('URL: ${options.uri}');
    print('方法: ${options.method}');
    print('Headers: ${options.headers}');
    print('数据: ${options.data}');
    
    // 添加认证令牌
    options.headers['Authorization'] = 'Bearer your_token_here';
    
    // 继续处理请求
    return handler.next(options);
  },
  
  // 响应拦截器
  onResponse: (response, handler) {
    print('\n响应后:');
    print('状态码: ${response.statusCode}');
    print('数据: ${response.data}');
    
    // 继续处理响应
    return handler.next(response);
  },
  
  // 错误拦截器
  onError: (DioError e, handler) {
    print('\n错误:');
    print('类型: ${e.type}');
    print('消息: ${e.message}');
    
    if (e.response != null) {
      print('状态码: ${e.response?.statusCode}');
      print('数据: ${e.response?.data}');
      
      // 处理特定错误
      if (e.response?.statusCode == 401) {
        // 未授权，重定向到登录页面
        print('未授权，请登录');
      } else if (e.response?.statusCode == 404) {
        // 资源不存在
        print('请求的资源不存在');
      } else if (e.response?.statusCode == 500) {
        // 服务器错误
        print('服务器错误，请稍后再试');
      }
    } else {
      // 网络错误或其他错误
      print('网络错误，请检查网络连接');
    }
    
    // 继续处理错误
    return handler.next(e);
  },
));
```

#### 3.5.3 请求取消

Dio 支持取消正在进行的请求，可以用于用户取消操作、页面关闭等场景。

**示例**：

```dart
class CancelRequestExample extends StatefulWidget {
  @override
  _CancelRequestExampleState createState() => _CancelRequestExampleState();
}

class _CancelRequestExampleState extends State<CancelRequestExample> {
  String result = '准备开始请求...';
  final Dio dio = Dio();
  CancelToken? cancelToken;

  Future<void> fetchData() async {
    try {
      setState(() {
        result = '正在请求数据...';
      });
      
      // 创建取消令牌
      cancelToken = CancelToken();
      
      final response = await dio.get(
        'https://jsonplaceholder.typicode.com/posts',
        cancelToken: cancelToken, // 设置取消令牌
      );
      
      if (response.statusCode == 200) {
        setState(() {
          result = '请求成功！获取到 ${response.data.length} 篇文章。';
        });
      }
    } on DioError catch (error) {
      if (DioErrorType.cancel == error.type) {
        setState(() {
          result = '请求已被取消';
        });
      } else {
        setState(() {
          result = '发生错误：$error';
        });
      }
    } finally {
      // 清理取消令牌
      cancelToken = null;
    }
  }

  void cancelRequest() {
    if (cancelToken != null) {
      // 取消请求
      cancelToken?.cancel('用户取消了请求');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('请求取消示例')),
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(result),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: fetchData,
                child: Text('开始请求'),
              ),
              SizedBox(height: 10),
              ElevatedButton(
                onPressed: cancelRequest,
                child: Text('取消请求'),
                style: ElevatedButton.styleFrom(primary: Colors.red),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

#### 3.5.4 文件上传

Dio 支持文件上传功能，可以上传单个文件或多个文件。

**示例**：

```dart
Future<void> uploadFile() async {
  try {
    // 创建 FormData
    FormData formData = FormData.fromMap({
      'title': 'Flutter File Upload',
      'file': await MultipartFile.fromFile(
        'path/to/your/file.txt',
        filename: 'uploaded_file.txt',
      ),
    });
    
    // 发送文件上传请求
    final response = await dio.post(
      'https://httpbin.org/post',
      data: formData,
      // 监听上传进度
      onSendProgress: (int sent, int total) {
        if (total > 0) {
          double progress = sent / total;
          print('上传进度: ${(progress * 100).toStringAsFixed(0)}%');
          // 可以使用进度值更新 UI，如进度条
        }
      },
    );
    
    if (response.statusCode == 200) {
      setState(() {
        result = '文件上传成功！';
      });
    }
  } catch (error) {
    setState(() {
      result = '文件上传失败：$error';
    });
  }
}

// 上传多个文件
Future<void> uploadMultipleFiles() async {
  try {
    FormData formData = FormData.fromMap({
      'title': 'Multiple File Upload',
      'files': [
        await MultipartFile.fromFile('path/to/file1.txt', filename: 'file1.txt'),
        await MultipartFile.fromFile('path/to/file2.txt', filename: 'file2.txt'),
      ],
    });
    
    final response = await dio.post(
      'https://httpbin.org/post',
      data: formData,
      onSendProgress: (int sent, int total) {
        if (total > 0) {
          double progress = sent / total;
          print('上传进度: ${(progress * 100).toStringAsFixed(0)}%');
        }
      },
    );
    
    if (response.statusCode == 200) {
      setState(() {
        result = '多个文件上传成功！';
      });
    }
  } catch (error) {
    setState(() {
      result = '多个文件上传失败：$error';
    });
  }
}
```

#### 3.5.5 文件下载

Dio 支持文件下载功能，可以将服务器上的文件下载到本地。

**示例**：

```dart
Future<void> downloadFile() async {
  try {
    // 下载文件
    await dio.download(
      'https://example.com/file.pdf',
      'path/to/save/file.pdf',
      // 监听下载进度
      onReceiveProgress: (int received, int total) {
        if (total > 0) {
          double progress = received / total;
          print('下载进度: ${(progress * 100).toStringAsFixed(0)}%');
          // 可以使用进度值更新 UI，如进度条
        }
      },
    );
    
    setState(() {
      result = '文件下载成功！';
    });
  } catch (error) {
    setState(() {
      result = '文件下载失败：$error';
    });
  }
}
```

## 4. 网络请求的最佳实践

### 4.1 错误处理

网络请求过程中可能会遇到各种错误，如网络连接问题、服务器错误、认证失败等。良好的错误处理可以提高应用的稳定性和用户体验。

#### 4.1.1 常见错误类型

- **网络错误**：如无网络连接、连接超时等。
- **服务器错误**：如服务器内部错误（500）、服务不可用（503）等。
- **客户端错误**：如请求的资源不存在（404）、未授权（401）、请求参数错误（400）等。
- **解析错误**：如响应数据格式不符合预期、JSON 解析失败等。

#### 4.1.2 错误处理策略

1. **使用 try-catch 捕获异常**：
   ```dart
   try {
     final response = await http.get(Uri.parse(url));
     // 处理响应
   } catch (e) {
     // 处理错误
     print('发生错误: $e');
   }
   ```

2. **检查响应状态码**：
   ```dart
   if (response.statusCode == 200) {
     // 请求成功
   } else if (response.statusCode == 404) {
     // 资源不存在
   } else if (response.statusCode == 500) {
     // 服务器错误
   }
   ```

3. **使用 Dio 的错误拦截器**：
   ```dart
   dio.interceptors.add(InterceptorsWrapper(
     onError: (DioError e, handler) {
       // 处理错误
       switch (e.type) {
         case DioErrorType.connectTimeout:
           print('连接超时');
           break;
         case DioErrorType.sendTimeout:
           print('发送超时');
           break;
         case DioErrorType.receiveTimeout:
           print('接收超时');
           break;
         case DioErrorType.response:
           print('服务器错误: ${e.response?.statusCode}');
           break;
         case DioErrorType.cancel:
           print('请求被取消');
           break;
         default:
           print('未知错误');
       }
       return handler.next(e);
     },
   ));
   ```

4. **向用户显示友好的错误信息**：
   ```dart
   ScaffoldMessenger.of(context).showSnackBar(
     SnackBar(content: Text('网络连接失败，请检查网络设置')),
   );
   ```

### 4.2 超时处理

设置合理的超时时间可以防止应用在网络条件差的情况下长时间无响应。

#### 4.2.1 使用 http 包设置超时

```dart
Future<void> fetchWithTimeout() async {
  try {
    final response = await http.get(
      Uri.parse('https://jsonplaceholder.typicode.com/posts/1'),
    ).timeout(Duration(seconds: 5)); // 设置 5 秒超时
    
    if (response.statusCode == 200) {
      setState(() {
        result = '成功: ${response.body}';
      });
    }
  } on TimeoutException {
    setState(() {
      result = '请求超时，请稍后重试';
    });
  } catch (error) {
    setState(() {
      result = '发生错误: $error';
    });
  }
}
```

#### 4.2.2 使用 Dio 设置超时

```dart
final Dio dio = Dio(BaseOptions(
  connectTimeout: 5000, // 连接超时 5 秒
  receiveTimeout: 3000, // 接收超时 3 秒
));

Future<void> fetchWithDioTimeout() async {
  try {
    final response = await dio.get('https://jsonplaceholder.typicode.com/posts/1');
    setState(() {
      result = '成功: ${response.data}';
    });
  } on DioError catch (e) {
    if (e.type == DioErrorType.connectTimeout || e.type == DioErrorType.receiveTimeout) {
      setState(() {
        result = '请求超时，请稍后重试';
      });
    } else {
      setState(() {
        result = '发生错误: $e';
      });
    }
  }
}
```

### 4.3 请求取消

允许用户取消正在进行的网络请求，可以提高应用的响应性和用户体验，特别是在以下场景：

- 用户快速切换页面
- 用户在搜索框中输入时，取消之前的搜索请求
- 下载大文件时，用户想要停止下载

#### 4.3.1 使用 http 包取消请求

`http` 包本身不直接支持请求取消，但可以使用 `CancelableOperation` 来实现。

```dart
import 'package:async/async.dart';

class HttpCancelExample extends StatefulWidget {
  @override
  _HttpCancelExampleState createState() => _HttpCancelExampleState();
}

class _HttpCancelExampleState extends State<HttpCancelExample> {
  String result = '准备开始请求...';
  CancelableOperation<http.Response>? cancelableOperation;

  Future<void> fetchWithCancel() async {
    try {
      setState(() {
        result = '正在请求数据...';
      });
      
      // 创建可取消的操作
      cancelableOperation = CancelableOperation.fromFuture(
        http.get(Uri.parse('https://jsonplaceholder.typicode.com/posts')),
        onCancel: () => print('请求被取消'),
      );
      
      final response = await cancelableOperation!.value;
      
      if (response.statusCode == 200) {
        setState(() {
          result = '请求成功！获取到数据。';
        });
      }
    } catch (error) {
      if (error is CancelException) {
        setState(() {
          result = '请求已被取消';
        });
      } else {
        setState(() {
          result = '发生错误：$error';
        });
      }
    }
  }

  void cancelFetch() {
    if (cancelableOperation != null && !cancelableOperation!.isCompleted) {
      cancelableOperation!.cancel();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('HTTP 请求取消示例')),
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(result),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: fetchWithCancel,
                child: Text('开始请求'),
              ),
              SizedBox(height: 10),
              ElevatedButton(
                onPressed: cancelFetch,
                child: Text('取消请求'),
                style: ElevatedButton.styleFrom(primary: Colors.red),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

#### 4.3.2 使用 Dio 取消请求

Dio 内置了请求取消功能，使用起来更加方便（如前面的示例所示）。

### 4.4 缓存策略

网络请求缓存可以减少不必要的网络请求，提高应用性能和响应速度，特别是在以下场景：

- 频繁访问的相同资源
- 离线使用的内容
- 网络条件较差的环境

Flutter 中可以使用以下几种方式实现缓存：

#### 4.4.1 使用 shared_preferences 进行简单缓存

```dart
import 'package:shared_preferences/shared_preferences.dart';

Future<void> fetchWithCache() async {
  try {
    final cacheKey = 'posts_cache';
    final cacheDuration = Duration(minutes: 5);
    
    // 检查缓存
    final prefs = await SharedPreferences.getInstance();
    final cachedData = prefs.getString(cacheKey);
    final cacheTime = prefs.getInt('${cacheKey}_time');
    
    final now = DateTime.now().millisecondsSinceEpoch;
    
    // 如果缓存存在且未过期，使用缓存数据
    if (cachedData != null && cacheTime != null) {
      final cacheAge = now - cacheTime;
      if (cacheAge < cacheDuration.inMilliseconds) {
        setState(() {
          result = '使用缓存数据: $cachedData';
        });
        return;
      }
    }
    
    // 缓存不存在或已过期，从网络获取
    final response = await http.get(Uri.parse('https://jsonplaceholder.typicode.com/posts/1'));
    
    if (response.statusCode == 200) {
      // 更新缓存
      await prefs.setString(cacheKey, response.body);
      await prefs.setInt('${cacheKey}_time', now);
      
      setState(() {
        result = '使用网络数据: ${response.body}';
      });
    }
  } catch (error) {
    setState(() {
      result = '发生错误: $error';
    });
  }
}
```

#### 4.4.2 使用 dio_cache_interceptor 进行高级缓存

`dio_cache_interceptor` 是一个专为 Dio 设计的缓存拦截器，支持多种缓存策略。

**安装依赖**：
```yaml
dependencies:
  dio_cache_interceptor: ^3.4.0
  dio_cache_interceptor_hive_store: ^3.1.0 # 使用 Hive 作为缓存存储
```

**示例**：
```dart
import 'package:dio_cache_interceptor/dio_cache_interceptor.dart';
import 'package:dio_cache_interceptor_hive_store/dio_cache_interceptor_hive_store.dart';

Future<void> fetchWithDioCache() async {
  try {
    // 创建缓存存储
    final cacheStore = HiveCacheStore('path/to/cache/directory');
    
    // 配置缓存选项
    final cacheOptions = CacheOptions(
      store: cacheStore,
      policy: CachePolicy.forceCache, // 缓存策略
      hitCacheOnErrorExcept: [401, 403], // 错误时使用缓存的状态码
      maxStale: Duration(days: 7), // 缓存的最大过期时间
      priority: CachePriority.normal, // 缓存优先级
      keyBuilder: CacheOptions.defaultCacheKeyBuilder, // 缓存键生成器
      allowPostMethod: false, // 是否允许缓存 POST 请求
    );
    
    // 创建带有缓存拦截器的 Dio 实例
    final dio = Dio()..interceptors.add(DioCacheInterceptor(options: cacheOptions));
    
    // 发送请求
    final response = await dio.get('https://jsonplaceholder.typicode.com/posts/1');
    
    setState(() {
      result = '数据: ${response.data}';
      // 检查是否使用了缓存
      final isCached = response.headers.value(DioCacheInterceptor.cacheHeader) == 'HIT';
      result += '\n缓存状态: ${isCached ? '使用缓存' : '从网络获取'}';
    });
  } catch (error) {
    setState(() {
      result = '发生错误: $error';
    });
  }
}
```

### 4.5 并发请求

在某些场景下，需要同时发送多个网络请求，如加载多个页面的数据、批量上传文件等。Flutter 提供了多种处理并发请求的方式。

#### 4.5.1 使用 Future.wait 并行处理多个请求

```dart
Future<void> fetchMultipleData() async {
  try {
    setState(() {
      result = '正在请求多个资源...';
    });
    
    // 创建多个请求
    final Future<http.Response> future1 = http.get(Uri.parse('https://jsonplaceholder.typicode.com/posts/1'));
    final Future<http.Response> future2 = http.get(Uri.parse('https://jsonplaceholder.typicode.com/posts/2'));
    final Future<http.Response> future3 = http.get(Uri.parse('https://jsonplaceholder.typicode.com/posts/3'));
    
    // 并行处理所有请求
    final List<http.Response> responses = await Future.wait([future1, future2, future3]);
    
    // 处理响应
    String data = '获取到 ${responses.length} 个响应:\n\n';
    for (int i = 0; i < responses.length; i++) {
      if (responses[i].statusCode == 200) {
        final post = jsonDecode(responses[i].body);
        data += '文章 ${i + 1} 标题: ${post['title']}\n\n';
      }
    }
    
    setState(() {
      result = data;
    });
  } catch (error) {
    setState(() {
      result = '发生错误: $error';
    });
  }
}
```

#### 4.5.2 使用 Dio 的并发请求

Dio 也支持并发请求，使用方式类似：

```dart
Future<void> fetchMultipleWithDio() async {
  try {
    setState(() {
      result = '正在请求多个资源...';
    });
    
    final Dio dio = Dio();
    
    // 创建多个请求
    final Future<Response> future1 = dio.get('https://jsonplaceholder.typicode.com/posts/1');
    final Future<Response> future2 = dio.get('https://jsonplaceholder.typicode.com/posts/2');
    final Future<Response> future3 = dio.get('https://jsonplaceholder.typicode.com/posts/3');
    
    // 并行处理所有请求
    final List<Response> responses = await Future.wait([future1, future2, future3]);
    
    // 处理响应
    String data = '获取到 ${responses.length} 个响应:\n\n';
    for (int i = 0; i < responses.length; i++) {
      data += '文章 ${i + 1} 标题: ${responses[i].data['title']}\n\n';
    }
    
    setState(() {
      result = data;
    });
  } catch (error) {
    setState(() {
      result = '发生错误: $error';
    });
  }
}
```

### 4.6 网络请求的封装

为了提高代码的可维护性和复用性，建议将网络请求相关的代码封装成独立的服务类。

#### 4.6.1 创建 API 服务类

```dart
import 'package:dio/dio.dart';

class ApiService {
  final Dio _dio;
  
  // 基础 URL
  static const baseUrl = 'https://jsonplaceholder.typicode.com';
  
  // 构造函数
  ApiService() : _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: 5000,
    receiveTimeout: 3000,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
    },
  )) {
    // 添加拦截器
    _setupInterceptors();
  }
  
  // 设置拦截器
  void _setupInterceptors() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        // 添加认证令牌等
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (DioError e, handler) {
        // 处理错误
        return handler.next(e);
      },
    ));
  }
  
  // GET 请求
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }
  
  // POST 请求
  Future<Response> post(String path, {dynamic data}) {
    return _dio.post(path, data: data);
  }
  
  // PUT 请求
  Future<Response> put(String path, {dynamic data}) {
    return _dio.put(path, data: data);
  }
  
  // PATCH 请求
  Future<Response> patch(String path, {dynamic data}) {
    return _dio.patch(path, data: data);
  }
  
  // DELETE 请求
  Future<Response> delete(String path) {
    return _dio.delete(path);
  }
  
  // 文件上传
  Future<Response> uploadFile(String path, String filePath, String fileName, {
    Map<String, dynamic>? otherData,
    ProgressCallback? onSendProgress,
  }) async {
    final formData = FormData.fromMap({
      ...?otherData,
      'file': await MultipartFile.fromFile(filePath, filename: fileName),
    });
    
    return _dio.post(path, data: formData, onSendProgress: onSendProgress);
  }
  
  // 文件下载
  Future<Response> downloadFile(String url, String savePath, {
    ProgressCallback? onReceiveProgress,
  }) {
    return _dio.download(url, savePath, onReceiveProgress: onReceiveProgress);
  }
}
```

#### 4.6.2 使用 API 服务类

```dart
// 创建 API 服务实例
final apiService = ApiService();

// 使用 API 服务获取数据
Future<void> fetchPosts() async {
  try {
    final response = await apiService.get('/posts');
    
    if (response.statusCode == 200) {
      setState(() {
        // 处理数据
      });
    }
  } catch (error) {
    // 处理错误
  }
}

// 使用 API 服务创建数据
Future<void> createPost() async {
  try {
    final data = {
      'title': 'New Post',
      'body': 'Post content',
      'userId': 1,
    };
    
    final response = await apiService.post('/posts', data: data);
    
    if (response.statusCode == 201) {
      setState(() {
        // 处理创建成功的情况
      });
    }
  } catch (error) {
    // 处理错误
  }
}
```

### 4.7 认证与安全

网络请求中的认证和安全是非常重要的，特别是处理用户敏感信息时。

#### 4.7.1 常见认证方式

- **Bearer Token**：在请求头中添加认证令牌。
  ```dart
  options.headers['Authorization'] = 'Bearer your_token_here';
  ```

- **Basic Auth**：使用用户名和密码进行认证。
  ```dart
  final credentials = base64.encode(utf8.encode('username:password'));
  options.headers['Authorization'] = 'Basic $credentials';
  ```

- **API Key**：在请求参数或头中添加 API 密钥。
  ```dart
  options.queryParameters['api_key'] = 'your_api_key_here';
  // 或
  options.headers['X-API-Key'] = 'your_api_key_here';
  ```

#### 4.7.2 安全建议

- 使用 HTTPS 协议：确保所有网络请求都通过 HTTPS 进行，防止数据被窃听或篡改。
- 保护敏感信息：不要在代码中硬编码敏感信息（如 API 密钥、认证令牌等），应该使用环境变量或安全存储。
- 定期更新令牌：实现令牌刷新机制，定期更新认证令牌。
- 验证服务器证书：确保应用只与受信任的服务器通信，防止中间人攻击。
- 限制权限：遵循最小权限原则，只请求必要的权限和数据。

## 5. 实际应用示例

### 5.1 创建一个完整的网络请求应用

下面是一个使用 Dio 进行网络请求的完整 Flutter 应用示例，包括用户列表的获取、刷新和加载更多功能。

**示例代码**：

```dart
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'dart:convert';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Network Demo',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: UserListScreen(),
    );
  }
}

// 用户模型
class User {
  final int id;
  final String name;
  final String email;
  final String phone;
  final String website;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.website,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      phone: json['phone'],
      website: json['website'],
    );
  }
}

// 用户列表页面
class UserListScreen extends StatefulWidget {
  @override
  _UserListScreenState createState() => _UserListScreenState();
}

class _UserListScreenState extends State<UserListScreen> {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'https://jsonplaceholder.typicode.com',
    connectTimeout: 5000,
    receiveTimeout: 3000,
  ));

  List<User> _users = [];
  bool _isLoading = false;
  bool _isRefreshing = false;
  bool _hasMore = true;
  int _page = 1;
  final int _limit = 5;
  
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _fetchUsers();
    
    // 监听滚动事件，实现加载更多
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= 
          _scrollController.position.maxScrollExtent - 200 && 
          !_isLoading && _hasMore) {
        _fetchMoreUsers();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  // 获取用户列表
  Future<void> _fetchUsers({bool isRefresh = false}) async {
    if (_isLoading) return;

    setState(() {
      if (isRefresh) {
        _isRefreshing = true;
      } else {
        _isLoading = true;
      }
      
      if (isRefresh) {
        _page = 1;
        _users.clear();
        _hasMore = true;
      }
    });

    try {
      final response = await _dio.get(
        '/users',
        queryParameters: {
          '_page': _page,
          '_limit': _limit,
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        
        setState(() {
          // 转换数据
          final List<User> newUsers = data.map((item) => User.fromJson(item)).toList();
          _users.addAll(newUsers);
          
          // 检查是否还有更多数据
          _hasMore = newUsers.length == _limit;
          
          if (_hasMore) {
            _page++;
          }
        });
      } else {
        _showError('获取用户列表失败：${response.statusCode}');
      }
    } catch (error) {
      _showError('获取用户列表时发生错误：$error');
    } finally {
      setState(() {
        _isLoading = false;
        _isRefreshing = false;
      });
    }
  }

  // 加载更多用户
  Future<void> _fetchMoreUsers() async {
    if (!_hasMore || _isLoading) return;
    await _fetchUsers();
  }

  // 下拉刷新
  Future<void> _handleRefresh() async {
    await _fetchUsers(isRefresh: true);
  }

  // 显示错误消息
  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('用户列表'),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_users.isEmpty && !_isLoading) {
      return Center(
        child: Text('暂无用户数据'),
      );
    }

    return RefreshIndicator(
      onRefresh: _handleRefresh,
      child: ListView.builder(
        controller: _scrollController,
        itemCount: _users.length + (_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index < _users.length) {
            return _buildUserItem(_users[index]);
          } else {
            return _buildLoadingMore();
          }
        },
      ),
    );
  }

  // 构建用户项
  Widget _buildUserItem(User user) {
    return Card(
      margin: EdgeInsets.all(8.0),
      child: Padding(
        padding: EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              user.name,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text('邮箱: ${user.email}'),
            Text('电话: ${user.phone}'),
            Text('网站: ${user.website}'),
          ],
        ),
      ),
    );
  }

  // 构建加载更多指示器
  Widget _buildLoadingMore() {
    return Padding(
      padding: EdgeInsets.all(16.0),
      child: Center(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(width: 12),
            Text('加载更多...'),
          ],
        ),
      ),
    );
  }
}
```

这个示例应用实现了以下功能：

- 使用 Dio 获取用户列表数据
- 下拉刷新功能
- 上拉加载更多功能
- 错误处理和用户反馈
- 加载状态显示

## 6. 总结

网络请求是 Flutter 应用开发中的重要组成部分，本章节介绍了 Flutter 中处理网络请求的多种方式和最佳实践，包括：

1. **基础网络请求**：使用 `http` 包和 `dio` 包发送 GET、POST、PUT、PATCH 和 DELETE 请求。

2. **高级特性**：如拦截器、请求取消、文件上传和下载等。

3. **最佳实践**：
   - 错误处理：捕获和处理各种网络错误，提供友好的用户反馈。
   - 超时处理：设置合理的超时时间，防止应用无响应。
   - 缓存策略：减少不必要的网络请求，提高应用性能。
   - 并发请求：并行处理多个请求，提高效率。
   - 代码组织：创建 API 服务类，封装网络请求逻辑。
   - 认证与安全：保护用户数据和应用安全。

4. **实际应用**：通过一个完整的示例，展示了如何在实际应用中使用网络请求。

选择合适的网络请求库和实现方式，结合良好的错误处理、缓存策略和安全措施，可以构建出高性能、可靠和用户友好的 Flutter 应用。在实际开发中，应该根据应用的具体需求和复杂度，选择合适的技术方案和架构设计。

通过不断学习和实践，你将能够更加熟练地使用 Flutter 的网络请求功能，为你的应用提供出色的用户体验。