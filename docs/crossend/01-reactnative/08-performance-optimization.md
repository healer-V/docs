# 性能优化

性能优化是React Native开发中的关键环节，直接影响应用的用户体验。一个性能良好的应用应该具有流畅的动画、快速的响应和稳定的运行状态。本章将详细介绍React Native应用性能优化的各种技术和最佳实践，帮助你构建高性能的移动应用。

## 性能监控工具

在进行性能优化之前，我们需要先了解如何监控应用的性能，以便识别性能瓶颈。

### 1. React Native调试工具

#### React Developer Tools

React Developer Tools是React官方提供的调试工具，可以帮助你检查组件层次结构、查看和修改组件属性和状态。

```bash
# 安装React Developer Tools
npm install -g react-devtools

# 运行
react-devtools
```

#### Flipper

Flipper是Facebook（现Meta）开发的移动应用调试平台，提供了丰富的调试工具，包括布局检查器、网络监控、数据库查看器等。

从React Native 0.62开始，Flipper已经默认集成到React Native项目中。

### 2. 性能分析工具

#### Android Profiler

Android Profiler是Android Studio中的性能分析工具，可以监控应用的CPU、内存和网络使用情况。

#### Xcode Instruments

Xcode Instruments是iOS开发中的性能分析工具，可以帮助你分析应用的CPU使用、内存分配、网络请求等。

#### React Native Performance Monitor

React Native内置了性能监控工具，可以在开发模式下启用：

```jsx
import { useColorScheme } from 'react-native';
import { LogBox, NativeModules } from 'react-native';

// 在App.js中启用性能监控
if (__DEV__) {
  const { PerformanceMonitor } = NativeModules;
  PerformanceMonitor?.setInteractionTracingEnabled(true);
}
```

## 组件性能优化

### 1. 使用`PureComponent`和`memo`

`PureComponent`和`memo`可以帮助我们避免不必要的组件重渲染。

#### `PureComponent`（类组件）

```jsx
import React, { PureComponent } from 'react';
import { View, Text, StyleSheet } from 'react-native';

class PureComponentExample extends PureComponent {
  render() {
    console.log('PureComponentExample rendered');
    const { data } = this.props;
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{data}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 16,
  },
});

export default PureComponentExample;
```

#### `memo`（函数组件）

```jsx
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MemoizedComponent = memo(({ data }) => {
  console.log('MemoizedComponent rendered');
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{data}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 16,
  },
});

export default MemoizedComponent;
```

### 2. 使用`useMemo`和`useCallback`

`useMemo`和`useCallback`是React Hooks，可以帮助我们缓存计算结果和函数引用，避免不必要的重复计算和函数创建。

#### `useMemo`

```jsx
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

function UseMemoExample() {
  const [input, setInput] = useState('');
  const [count, setCount] = useState(0);
  
  // 模拟耗时计算
  const expensiveCalculation = (num) => {
    console.log('Calculating...');
    let result = 0;
    for (let i = 0; i < 100000000; i++) {
      result += num;
    }
    return result;
  };
  
  // 使用useMemo缓存计算结果
  const calculation = useMemo(() => {
    return expensiveCalculation(count);
  }, [count]); // 只有当count变化时才重新计算
  
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder="输入一些文本"
      />
      
      <Text style={styles.text}>输入的文本: {input}</Text>
      
      <View style={styles.buttonContainer}>
        <Text 
          style={styles.button} 
          onPress={() => setCount(count + 1)}
        >
          增加计数 ({count})
        </Text>
      </View>
      
      <Text style={styles.result}>计算结果: {calculation}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 16,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    color: '#fff',
    padding: 12,
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  result: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default UseMemoExample;
```

#### `useCallback`

```jsx
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function UseCallbackExample() {
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  
  // 不使用useCallback，每次渲染都会创建新的函数
  const incrementCount1 = () => {
    setCount1(count1 + 1);
  };
  
  // 使用useCallback缓存函数引用
  const incrementCount2 = useCallback(() => {
    setCount2(count2 + 1);
  }, [count2]); // 只有当count2变化时才重新创建函数
  
  return (
    <View style={styles.container}>
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>计数1: {count1}</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={incrementCount1}
        >
          <Text style={styles.buttonText}>增加计数1</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>计数2: {count2}</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={incrementCount2}
        >
          <Text style={styles.buttonText}>增加计数2</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  counterContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UseCallbackExample;
```

### 3. 避免内联样式和函数

内联样式和函数会在每次渲染时创建新的实例，导致不必要的重渲染。

#### 不好的做法

```jsx
function BadExample() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <TouchableOpacity onPress={() => console.log('Button pressed')}>
        <Text style={{ fontSize: 16, color: '#007AFF' }}>Press me</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### 好的做法

```jsx
import { StyleSheet } from 'react-native';

function GoodExample() {
  const handlePress = () => {
    console.log('Button pressed');
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress}>
        <Text style={styles.buttonText}>Press me</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});
```

## 列表性能优化

### 1. 使用`FlatList`和`SectionList`

对于长列表，应该使用`FlatList`或`SectionList`而不是`ScrollView`和`map`，因为它们实现了虚拟化，只会渲染可见区域的内容。

#### `FlatList`基本用法

```jsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

function FlatListExample() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 模拟获取数据
  useEffect(() => {
    const fetchData = async () => {
      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 生成1000个数据项
      const newData = Array.from({ length: 1000 }, (_, index) => ({
        id: index.toString(),
        title: `项目 ${index + 1}`,
        description: `这是项目 ${index + 1} 的描述信息`,
      }));
      
      setData(newData);
      setLoading(false);
    };
    
    fetchData();
  }, []);
  
  // 渲染单个项目
  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity style={styles.itemContainer}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
      </TouchableOpacity>
    );
  };
  
  // 渲染列表头部
  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>FlatList 示例</Text>
        <Text style={styles.subheaderText}>包含 {data.length} 个项目</Text>
      </View>
    );
  };
  
  // 渲染列表为空时的内容
  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>加载中...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无数据</Text>
      </View>
    );
  };
  
  // 渲染底部加载更多指示器
  const renderFooter = () => {
    if (!loading) return null;
    
    return (
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>加载更多...</Text>
      </View>
    );
  };
  
  // 列表项键提取器
  const keyExtractor = (item) => item.id;
  
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      // 性能优化选项
      initialNumToRender={10} // 初始渲染的项目数量
      maxToRenderPerBatch={5} // 每次批量渲染的项目数量
      windowSize={10} // 可见区域外预渲染的项目数量
      removeClippedSubviews={true} // 移除屏幕外的子视图
      updateCellsBatchingPeriod={50} // 批量更新的时间间隔(ms)
      getItemLayout={(data, index) => ({
        length: 80, // 每个项目的高度
        offset: 80 * index,
        index,
      })} // 可选，提供项目布局信息以提高性能
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    backgroundColor: '#007AFF',
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subheaderText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 10,
    marginVertical: 5,
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
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  footerContainer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
});

export default FlatListExample;
```

#### `SectionList`基本用法

```jsx
import React from 'react';
import { View, Text, SectionList, StyleSheet, TouchableOpacity } from 'react-native';

function SectionListExample() {
  // 模拟数据
  const sections = [
    {
      title: 'A',
      data: [
        { id: 'a1', name: 'Alice' },
        { id: 'a2', name: 'Amanda' },
        { id: 'a3', name: 'Andrew' },
      ],
    },
    {
      title: 'B',
      data: [
        { id: 'b1', name: 'Bob' },
        { id: 'b2', name: 'Barbara' },
        { id: 'b3', name: 'Ben' },
        { id: 'b4', name: 'Betty' },
      ],
    },
    {
      title: 'C',
      data: [
        { id: 'c1', name: 'Charlie' },
        { id: 'c2', name: 'Claire' },
        { id: 'c3', name: 'David' },
        { id: 'c4', name: 'Diana' },
        { id: 'c5', name: 'Daniel' },
      ],
    },
    {
      title: 'D',
      data: [
        { id: 'd1', name: 'David' },
        { id: 'd2', name: 'Diana' },
        { id: 'd3', name: 'Daniel' },
      ],
    },
    {
      title: 'E',
      data: [
        { id: 'e1', name: 'Eva' },
        { id: 'e2', name: 'Edward' },
        { id: 'e3', name: 'Emily' },
        { id: 'e4', name: 'Eric' },
        { id: 'e5', name: 'Elena' },
      ],
    },
  ];
  
  // 渲染单个项目
  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity style={styles.itemContainer}>
        <Text style={styles.itemText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };
  
  // 渲染分组头部
  const renderSectionHeader = ({ section }) => {
    return (
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
        <Text style={styles.sectionItemCount}>({section.data.length})</Text>
      </View>
    );
  };
  
  // 列表项键提取器
  const keyExtractor = (item) => item.id;
  
  return (
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      // 性能优化选项
      initialNumToRender={10}
      maxToRenderPerBatch={5}
      windowSize={10}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={50}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
  },
  sectionHeaderContainer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionItemCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  itemContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default SectionListExample;
```

### 2. `FlatList`性能优化技巧

#### 1. 使用`getItemLayout`

提供`getItemLayout`可以帮助`FlatList`避免测量渲染的项目，提高滚动性能。

```jsx
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  getItemLayout={(data, index) => ({
    length: 80, // 每个项目的高度
    offset: 80 * index,
    index,
  })}
/>
```

#### 2. 使用`removeClippedSubviews`

启用`removeClippedSubviews`可以移除屏幕外的子视图，减少内存使用。

```jsx
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  removeClippedSubviews={true}
/>
```

#### 3. 优化`initialNumToRender`和`maxToRenderPerBatch`

调整这些参数可以平衡初始加载性能和滚动性能。

```jsx
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  initialNumToRender={10} // 初始渲染的项目数量
  maxToRenderPerBatch={5} // 每次批量渲染的项目数量
/>
```

#### 4. 使用`windowSize`

`windowSize`控制可见区域外预渲染的项目数量。

```jsx
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  windowSize={10} // 可见区域外预渲染的项目数量
/>
```

## 内存优化

### 1. 图片优化

图片是应用内存使用的主要来源之一，合理优化图片可以显著减少内存使用。

#### 使用适当尺寸的图片

为不同屏幕尺寸提供不同尺寸的图片，避免使用过大的图片。

```jsx
import { Image } from 'react-native';

// 不好的做法 - 总是使用大图片
<Image source={require('./big-image.jpg')} style={{ width: 100, height: 100 }} />

// 好的做法 - 根据屏幕尺寸使用适当的图片
if (isTablet) {
  <Image source={require('./tablet-image.jpg')} style={{ width: 200, height: 200 }} />
} else {
  <Image source={require('./phone-image.jpg')} style={{ width: 100, height: 100 }} />
}
```

#### 使用`resizeMode`

选择合适的`resizeMode`可以减少内存使用。

```jsx
<Image 
  source={{ uri: 'https://example.com/image.jpg' }} 
  style={{ 
    width: 100, 
    height: 100,
    resizeMode: 'cover' // 或 'contain', 'stretch', 'center'
  }} 
/>
```

#### 懒加载图片

只加载可见区域的图片，避免一次性加载所有图片。

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Image, FlatList, StyleSheet } from 'react-native';

function ImageLazyLoadingExample() {
  // 模拟图片数据
  const images = Array.from({ length: 50 }, (_, index) => ({
    id: index.toString(),
    uri: `https://picsum.photos/400/300?random=${index}`,
  }));
  
  // 渲染单个图片项
  const renderImage = ({ item }) => {
    return (
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.uri }} 
          style={styles.image}
          resizeMode="cover"
          defaultSource={require('./placeholder.png')} // 占位图片
        />
      </View>
    );
  };
  
  return (
    <FlatList
      data={images}
      renderItem={renderImage}
      keyExtractor={item => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      // 性能优化
      initialNumToRender={8} // 初始渲染8张图片
      maxToRenderPerBatch={4} // 每次批量渲染4张图片
      windowSize={10}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={100}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
  },
  row: {
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '48%',
    aspectRatio: 4/3,
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
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
    height: '100%',
  },
});

export default ImageLazyLoadingExample;
```

### 2. 清理资源和定时器

在组件卸载时，应该清理不再使用的资源和定时器，避免内存泄漏。

```jsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

function ResourceCleanupExample() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef(null);
  
  useEffect(() => {
    // 创建定时器
    intervalRef.current = setInterval(() => {
      setCount(prevCount => prevCount + 1);
    }, 1000);
    
    // 组件卸载时清理定时器
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>资源清理示例</Text>
        <Text style={styles.countText}>计数: {count}</Text>
        <Text style={styles.description}>
          此示例展示了如何在组件卸载时正确清理定时器资源，
          避免内存泄漏。
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 20,
  },
  countText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ResourceCleanupExample;
```

### 3. 使用`useRef`缓存昂贵的对象

对于不需要引起重新渲染的可变值，可以使用`useRef`来存储，避免在每次渲染时创建新的对象。

```jsx
import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

function UseRefExample() {
  // 使用useRef缓存昂贵的对象
  const expensiveObject = useRef({
    // 模拟复杂对象
    data: Array.from({ length: 10000 }, (_, index) => index * 2),
    calculate: function(value) {
      // 模拟昂贵的计算
      let result = 0;
      for (let i = 0; i < this.data.length; i++) {
        result += this.data[i] * value;
      }
      return result;
    }
  }).current;
  
  // 使用缓存的对象进行计算
  const result = expensiveObject.calculate(5);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>useRef 缓存示例</Text>
      <Text style={styles.resultText}>计算结果: {result}</Text>
      <Text style={styles.description}>
        使用useRef缓存昂贵的对象，避免在每次渲染时重新创建。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 20,
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default UseRefExample;
```

## 动画性能优化

### 1. 使用`Animated` API

React Native提供了`Animated` API，可以创建高性能的动画。

```jsx
import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, TouchableOpacity } from 'react-native';

function AnimatedExample() {
  // 创建动画值
  const fadeAnim = useRef(new Animated.Value(0)).current; // 透明度从0开始
  const scaleAnim = useRef(new Animated.Value(0.5)).current; // 缩放从0.5开始
  
  // 开始动画
  const startAnimation = () => {
    Animated.parallel([
      // 透明度动画
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true, // 使用原生驱动，提高性能
      }),
      // 缩放动画
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true, // 使用原生驱动，提高性能
      }),
    ]).start();
  };
  
  // 重置动画
  const resetAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.animatedView,
          {
            opacity: fadeAnim, // 绑定透明度动画
            transform: [{ scale: scaleAnim }], // 绑定缩放动画
          },
        ]}
      />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.startButton]} 
          onPress={startAnimation}
        >
          <View style={styles.buttonText}>开始动画</View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]} 
          onPress={resetAnimation}
        >
          <View style={styles.buttonText}>重置动画</View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedView: {
    width: 200,
    height: 200,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    marginBottom: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  resetButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AnimatedExample;
```

### 2. 使用`useNativeDriver`

在动画中使用`useNativeDriver: true`可以将动画计算移至原生线程，提高动画性能。

```jsx
Animated.timing(animatedValue, {
  toValue: 1,
  duration: 1000,
  useNativeDriver: true, // 启用原生驱动
});
```

### 3. 避免在动画期间进行布局计算

在动画期间进行布局计算会导致动画卡顿，应该尽量避免。

```jsx
// 不好的做法
Animated.loop(
  Animated.timing(animatedValue, {
    toValue: 1,
    duration: 1000,
    useNativeDriver: true,
  })
).start(() => {
  // 在动画回调中进行布局计算
  this.setState({ layout: calculateLayout() });
});

// 好的做法
Animated.loop(
  Animated.timing(animatedValue, {
    toValue: 1,
    duration: 1000,
    useNativeDriver: true,
  })
).start();

// 使用Animated.event或useNativeDriver避免布局计算
```

## 网络优化

### 1. 缓存网络请求结果

缓存网络请求结果可以减少重复的网络请求，提高应用响应速度。

```jsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';

// 简单的内存缓存
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 缓存5分钟

function NetworkCachingExample() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 获取数据
  const fetchData = async () => {
    const cacheKey = 'posts';
    const now = Date.now();
    
    // 检查缓存
    const cached = cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('使用缓存数据');
      setData(cached.data);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 模拟网络请求
      const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=20');
      if (!response.ok) {
        throw new Error('网络请求失败');
      }
      
      const newData = await response.json();
      
      // 更新缓存
      cache.set(cacheKey, {
        data: newData,
        timestamp: now,
      });
      
      setData(newData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  // 渲染单个项目
  const renderItem = ({ item }) => {
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemBody}>{item.body}</Text>
      </View>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>错误: {error}</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#c62828',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  itemContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  itemBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default NetworkCachingExample;
```

### 2. 使用批量请求

将多个小请求合并为一个大请求可以减少网络往返次数，提高性能。

```jsx
// 不好的做法 - 多个小请求
async function fetchDataPoorly() {
  const userIds = [1, 2, 3, 4, 5];
  const users = [];
  
  for (const id of userIds) {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
    const user = await response.json();
    users.push(user);
  }
  
  return users;
}

// 好的做法 - 单个批量请求
async function fetchDataWell() {
  const userIds = [1, 2, 3, 4, 5];
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/users?id=${userIds.join(',')}`
  );
  
  return await response.json();
}
```

### 3. 压缩网络请求数据

使用压缩可以减少网络传输的数据量，提高请求速度。

```jsx
// 在服务器端启用压缩
// 例如，使用Express和compression中间件
const express = require('express');
const compression = require('compression');
const app = express();

// 使用压缩中间件
app.use(compression());

// 路由和其他中间件

// 在客户端，确保请求头包含Accept-Encoding
const response = await fetch('https://example.com/data', {
  headers: {
    'Accept-Encoding': 'gzip, deflate, br',
  },
});
```

## 代码分割和按需加载

### 1. 使用动态导入

使用动态导入可以将代码分割成更小的块，只在需要时加载。

```jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

function CodeSplittingExample() {
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 动态导入组件
  const loadComponent = async () => {
    setLoading(true);
    
    try {
      // 使用动态导入
      const { default: HeavyComponent } = await import('./HeavyComponent');
      setComponent(<HeavyComponent />);
    } catch (error) {
      console.error('加载组件失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>代码分割示例</Text>
      <Text style={styles.description}>
        点击按钮动态加载一个重型组件，演示代码分割的效果。
      </Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={loadComponent}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '加载中...' : '加载重型组件'}
        </Text>
      </TouchableOpacity>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>正在加载组件...</Text>
        </View>
      )}
      
      {component && (
        <View style={styles.componentContainer}>
          <Text style={styles.componentTitle}>重型组件已加载</Text>
          {component}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  componentContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  componentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default CodeSplittingExample;
```

## 生产环境优化

### 1. 启用代码混淆

代码混淆可以减小应用体积，提高安全性。

#### Android代码混淆

在`android/app/proguard-rules.pro`文件中添加混淆规则：

```text
# React Native
-dontwarn com.facebook.react.**
-keep class com.facebook.react.** { *; }

# 保持原生模块
-keepclasseswithmembers class * {
    @com.facebook.react.bridge.JavaScriptModule <fields>;
}
-keepclasseswithmembers class * {
    @com.facebook.react.bridge.NativeModule <fields>;
}
-keepclasseswithmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# 保持视图管理器
-keepclasseswithmembers class * extends com.facebook.react.uimanager.ViewManager {
    @com.facebook.react.uimanager.ReactProp <methods>;
    @com.facebook.react.uimanager.ReactPropGroup <methods>;
}

# 保持自定义视图
-keepclassmembers class * extends android.view.View {
    native <methods>;
}
```

然后在`android/app/build.gradle`中启用混淆：

```text
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        // 其他配置...
    }
}
```

#### iOS代码混淆

iOS可以使用第三方工具如`obfuscator-llvm`进行代码混淆。

### 2. 移除调试代码

在生产环境中，应该移除所有调试代码，减少应用体积和提高性能。

```jsx
// 使用环境变量区分开发和生产环境
if (__DEV__) {
  // 调试代码，只在开发环境中执行
  console.log('开发环境调试信息');
  // 启用性能监控
  NativeModules.PerformanceMonitor?.setInteractionTracingEnabled(true);
} else {
  // 生产环境代码
  console.log = () => {}; // 禁用console.log
  console.warn = () => {}; // 禁用console.warn
}
```

### 3. 使用Hermes引擎

Hermes是Facebook（现Meta）开发的JavaScript引擎，专为React Native优化，可以显著提高应用启动性能和减少内存使用。

#### 启用Hermes（Android）

在`android/app/build.gradle`中启用Hermes：

```text
def enableHermes = project.ext.react.get('enableHermes', true);

android {
    // 其他配置...
    buildTypes {
        release {
            // 其他配置...
            if (enableHermes) {
                def hermesPath = "$rootDir/../node_modules/hermes-engine/android/";
                debugImplementation files(hermesPath + "hermes-debug.aar")
                releaseImplementation files(hermesPath + "hermes-release.aar")
            } else {
                implementation jscFlavor
            }
        }
    }
}
```

#### 启用Hermes（iOS）

在`ios/Podfile`中启用Hermes：

```ruby
# Podfile
use_react_native!(:path => config["reactNativePath"], :hermes_enabled => true)
```

然后重新安装依赖：

```bash
cd ios && pod install
```

## 性能优化检查清单

### 组件优化
- [ ] 使用`PureComponent`或`memo`避免不必要的重渲染
- [ ] 使用`useMemo`和`useCallback`缓存计算结果和函数引用
- [ ] 避免内联样式和函数
- [ ] 合理使用`Context`，避免过度使用

### 列表优化
- [ ] 使用`FlatList`或`SectionList`而不是`ScrollView`和`map`
- [ ] 设置合理的`initialNumToRender`、`maxToRenderPerBatch`和`windowSize`
- [ ] 提供`getItemLayout`信息
- [ ] 启用`removeClippedSubviews`

### 内存优化
- [ ] 使用适当尺寸的图片
- [ ] 选择合适的`resizeMode`
- [ ] 懒加载图片
- [ ] 清理资源和定时器
- [ ] 使用`useRef`缓存昂贵的对象

### 动画优化
- [ ] 使用`Animated` API
- [ ] 启用`useNativeDriver`
- [ ] 避免在动画期间进行布局计算

### 网络优化
- [ ] 缓存网络请求结果
- [ ] 使用批量请求
- [ ] 压缩网络请求数据
- [ ] 减少不必要的网络请求

### 生产环境优化
- [ ] 启用代码混淆
- [ ] 移除调试代码
- [ ] 使用Hermes引擎
- [ ] 优化资源文件（图片、字体等）

## 总结

本章介绍了React Native应用性能优化的各种技术和最佳实践，包括：

1. **性能监控工具**：
   - React Developer Tools
   - Flipper
   - React Native Performance Monitor
   - Android Profiler和Xcode Instruments

2. **组件性能优化**：
   - 使用`PureComponent`和`memo`
   - 使用`useMemo`和`useCallback`
   - 避免内联样式和函数

3. **列表性能优化**：
   - 使用`FlatList`和`SectionList`
   - 优化列表渲染参数
   - 提供`getItemLayout`信息

4. **内存优化**：
   - 图片优化
   - 资源清理
   - 使用`useRef`缓存对象

5. **动画性能优化**：
   - 使用`Animated` API
   - 启用`useNativeDriver`
   - 避免在动画期间进行布局计算

6. **网络优化**：
   - 缓存网络请求结果
   - 使用批量请求
   - 压缩网络请求数据

7. **代码分割和按需加载**：
   - 使用动态导入

8. **生产环境优化**：
   - 启用代码混淆
   - 移除调试代码
   - 使用Hermes引擎

通过应用这些优化技术，你可以显著提高React Native应用的性能，提供更好的用户体验。性能优化是一个持续的过程，应该在开发的各个阶段都予以关注，不断地监控、分析和优化应用性能。

## 下一步

现在你已经学习了React Native的性能优化，接下来你可以学习：

- [部署与发布](./09-deployment.md) - 学习如何部署和发布React Native应用