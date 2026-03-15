---
title: "基础组件"
category: "跨端 · React Native"
tags:
  - React
excerpt: "React Native提供了一系列内置的基础组件，这些组件是构建React Native应用用户界面的基石。本章节将介绍最常用的基础组件及其用法。 View是React Native中最基础的容器组件，类似于HTML中的div元素。它用于..."
---

# 基础组件

React Native提供了一系列内置的基础组件，这些组件是构建React Native应用用户界面的基石。本章节将介绍最常用的基础组件及其用法。

## 核心组件

### View

`View`是React Native中最基础的容器组件，类似于HTML中的`div`元素。它用于组织其他组件的布局。

```jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ViewExample() {
  return (
    <View style={styles.container}>
      <View style={styles.box1} />
      <View style={styles.box2} />
      <View style={styles.box3} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box1: {
    width: 50,
    height: 50,
    backgroundColor: 'red',
    marginBottom: 10,
  },
  box2: {
    width: 50,
    height: 50,
    backgroundColor: 'green',
    marginBottom: 10,
  },
  box3: {
    width: 50,
    height: 50,
    backgroundColor: 'blue',
  },
});
```

### Text

`Text`组件用于显示文本内容，是React Native中唯一可以包含文本的组件。

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TextExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>这是标题</Text>
      <Text style={styles.subtitle}>这是副标题</Text>
      <Text style={styles.paragraph}>
        这是一段普通的文本内容。
        {'\n'}{'\n'}Text组件支持\n换行和\n\n\n多个换行。
      </Text>
      <Text style={styles.link}>这是一个链接样式的文本</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#666',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 20,
  },
  link: {
    fontSize: 16,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
```

### Image

`Image`组件用于显示图片，可以加载本地图片或网络图片。

```jsx
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export default function ImageExample() {
  return (
    <View style={styles.container}>
      {/* 加载网络图片 */}
      <Image
        style={styles.networkImage}
        source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
        resizeMode="contain"
      />
      
      {/* 加载本地图片（需要先导入） */}
      {/* <Image
        style={styles.localImage}
        source={require('./assets/icon.png')}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  networkImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  localImage: {
    width: 100,
    height: 100,
  },
});
```

### TextInput

`TextInput`组件用于接收用户的文本输入，类似于HTML中的`input`元素。

```jsx
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

export default function TextInputExample() {
  const [text, setText] = useState('');
  const [password, setPassword] = useState('');
  const [multilineText, setMultilineText] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>普通输入框：</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="请输入文本"
          placeholderTextColor="#999"
        />
        <Text style={styles.result}>你输入的是：{text}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>密码输入框：</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="请输入密码"
          secureTextEntry
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>多行输入框：</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={multilineText}
          onChangeText={setMultilineText}
          placeholder="请输入多行文本"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor="#999"
        />
        <Text style={styles.charCount}>{multilineText.length} 字符</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  multilineInput: {
    height: 100,
    paddingTop: 10,
  },
  result: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 5,
    fontSize: 12,
    color: '#999',
  },
});
```

### TouchableOpacity

`TouchableOpacity`组件用于创建可点击的按钮，当用户点击时会显示透明度变化的效果。

```jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function TouchableOpacityExample() {
  const [count, setCount] = useState(0);

  const handlePress = () => {
    setCount(count + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.countText}>点击次数：{count}</Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.7} // 点击时的透明度
      >
        <Text style={styles.buttonText}>点击我</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={handlePress}
        disabled={count >= 10} // 当点击次数达到10次时禁用按钮
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          {count >= 10 ? '已达到上限' : '次要按钮'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  countText: {
    fontSize: 24,
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});
```

## 滚动组件

### ScrollView

`ScrollView`组件用于创建可滚动的视图，适合内容不多的场景。

```jsx
import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';

export default function ScrollViewExample() {
  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={true} // 显示垂直滚动指示器
      showsHorizontalScrollIndicator={false} // 隐藏水平滚动指示器
      bounces={true} // 允许滚动视图弹跳
    >
      <View style={styles.section}>
        <Text style={styles.title}>滚动视图示例</Text>
        <Text style={styles.description}>
          这个示例展示了如何使用ScrollView组件创建一个可滚动的视图。
          你可以上下滑动查看更多内容。
        </Text>
      </View>

      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
        <View key={item} style={styles.item}>
          <Image
            style={styles.image}
            source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
          />
          <Text style={styles.itemText}>项目 {item}</Text>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>滚动到底部了！</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
    marginHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  itemText: {
    fontSize: 18,
    color: '#333',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
```

### FlatList

`FlatList`组件是一个高性能的滚动列表组件，特别适合显示长列表数据。

```jsx
import React from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function FlatListExample() {
  // 模拟数据
  const data = [
    { id: '1', title: '项目 1', description: '这是项目 1 的描述' },
    { id: '2', title: '项目 2', description: '这是项目 2 的描述' },
    { id: '3', title: '项目 3', description: '这是项目 3 的描述' },
    { id: '4', title: '项目 4', description: '这是项目 4 的描述' },
    { id: '5', title: '项目 5', description: '这是项目 5 的描述' },
    { id: '6', title: '项目 6', description: '这是项目 6 的描述' },
    { id: '7', title: '项目 7', description: '这是项目 7 的描述' },
    { id: '8', title: '项目 8', description: '这是项目 8 的描述' },
    { id: '9', title: '项目 9', description: '这是项目 9 的描述' },
    { id: '10', title: '项目 10', description: '这是项目 10 的描述' },
    { id: '11', title: '项目 11', description: '这是项目 11 的描述' },
    { id: '12', title: '项目 12', description: '这是项目 12 的描述' },
  ];

  // 渲染单个列表项
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  // 列表头部
  const ListHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>FlatList 示例</Text>
      <Text style={styles.headerDescription}>这是一个使用FlatList组件的高性能列表</Text>
    </View>
  );

  // 列表底部
  const ListFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>没有更多项目了</Text>
    </View>
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      initialNumToRender={5} // 初始渲染的项目数量
      maxToRenderPerBatch={10} // 每次批量渲染的最大项目数量
      windowSize={10} // 窗口大小，用于性能优化
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  item: {
    backgroundColor: '#fff',
    padding: 15,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 15,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});
```

## 表单组件

### Switch

`Switch`组件是一个开关控件，用于在开启和关闭状态之间切换。

```jsx
import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

export default function SwitchExample() {
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  return (
    <View style={styles.container}>
      <View style={styles.switchContainer}>
        <Text style={styles.label}>开关状态：{isEnabled ? '开启' : '关闭'}</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isEnabled ? '#007AFF' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      </View>

      <View style={[styles.statusBox, isEnabled ? styles.enabledBox : styles.disabledBox]}>
        <Text style={styles.statusText}>
          {isEnabled ? '功能已开启' : '功能已关闭'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 18,
    color: '#333',
  },
  statusBox: {
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  enabledBox: {
    backgroundColor: '#e6f7ff',
    borderWidth: 1,
    borderColor: '#91d5ff',
  },
  disabledBox: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
```

### ActivityIndicator

`ActivityIndicator`组件用于显示加载指示器，通常用于表示正在进行的操作。

```jsx
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

export default function ActivityIndicatorExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const startLoading = () => {
    setIsLoading(true);
    setLoadingText('正在加载...');

    // 模拟加载过程
    setTimeout(() => {
      setLoadingText('加载中...');
      setTimeout(() => {
        setLoadingText('即将完成...');
        setTimeout(() => {
          setIsLoading(false);
          setLoadingText('');
        }, 1000);
      }, 1000);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={startLoading}>
          <Text style={styles.buttonText}>开始加载</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## 组件组合示例

下面是一个组合使用多个基础组件的示例，创建一个简单的用户资料卡片：

```jsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function UserProfileCard() {
  return (
    <View style={styles.container}>
      {/* 用户头像 */}
      <View style={styles.avatarContainer}>
        <Image
          style={styles.avatar}
          source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
        />
        <View style={styles.onlineIndicator} />
      </View>

      {/* 用户信息 */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>张明</Text>
        <Text style={styles.title}>高级产品经理</Text>
        <Text style={styles.company}>科技有限公司</Text>
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.messageButton]}>
          <Text style={styles.messageButtonText}>发消息</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.followButton]}>
          <Text style={styles.followButtonText}>关注</Text>
        </TouchableOpacity>
      </View>

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>128</Text>
          <Text style={styles.statLabel}>帖子</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>3.2k</Text>
          <Text style={styles.statLabel}>粉丝</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>560</Text>
          <Text style={styles.statLabel}>关注</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 20,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#fff',
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  company: {
    fontSize: 14,
    color: '#999',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  messageButton: {
    backgroundColor: '#007AFF',
    marginRight: 10,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  followButton: {
    backgroundColor: '#f0f0f0',
    marginLeft: 10,
  },
  followButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
});
```

## 最佳实践

1. **组件复用**：将常用的UI模式封装成可复用的组件
2. **性能优化**：
   - 对于长列表，优先使用`FlatList`或`SectionList`
   - 避免在渲染方法中创建新函数
   - 使用`React.memo`包装纯组件
3. **可访问性**：
   - 为可点击元素添加合适的`onPress`事件
   - 使用适当的颜色对比度
   - 为图片添加描述信息
4. **代码组织**：
   - 将相关组件放在同一个文件或目录中
   - 使用有意义的组件和变量名
   - 添加清晰的注释

## 下一步

现在你已经了解了React Native的基础组件，接下来你可以学习：

- [样式与布局](./03-styling-and-layout.md) - 学习如何设计美观的用户界面
- [状态管理](./05-state-management.md) - 学习如何管理应用的状态
- [网络请求](./06-networking.md) - 学习如何与服务器进行数据交互