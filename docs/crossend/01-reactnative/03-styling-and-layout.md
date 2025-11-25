# 样式与布局

在React Native中，样式和布局是构建美观用户界面的核心。本章节将介绍React Native的样式系统和布局方法，帮助你创建精美的移动应用界面。

## 样式基础

React Native使用JavaScript对象来定义样式，类似于CSS，但有一些关键差异。

### 使用StyleSheet API

`StyleSheet`是React Native推荐的样式定义方式，它提供了性能优化和代码组织的好处。

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StyleSheetExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>使用StyleSheet API</Text>
      <Text style={styles.subtitle}>这是一个副标题</Text>
      <Text style={styles.paragraph}>这是一段普通的文本内容。</Text>
    </View>
  );
}

// 使用StyleSheet.create定义样式
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
});
```

### 内联样式

除了`StyleSheet`，你也可以使用内联样式，但不推荐用于性能敏感的组件。

```jsx
import React from 'react';
import { View, Text } from 'react-native';

export default function InlineStyleExample() {
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
      <Text 
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#333',
          marginBottom: 10,
        }}
      >
        内联样式示例
      </Text>
      <Text 
        style={{
          fontSize: 16,
          lineHeight: 24,
          color: '#444',
        }}
      >
        这是使用内联样式的文本。
      </Text>
    </View>
  );
}
```

### 样式继承和组合

React Native不支持CSS中的样式继承，但你可以通过样式数组合并多个样式对象。

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StyleCombinationExample() {
  return (
    <View style={styles.container}>
      <Text style={[styles.text, styles.primaryText]}>主要文本</Text>
      <Text style={[styles.text, styles.secondaryText]}>次要文本</Text>
      <Text style={[styles.text, styles.highlightedText]}>高亮文本</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
  primaryText: {
    color: '#333',
    fontWeight: 'bold',
  },
  secondaryText: {
    color: '#666',
  },
  highlightedText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
```

## Flexbox布局

React Native使用Flexbox布局系统来排列组件，它是一种一维布局模型，可以轻松地在水平或垂直方向上排列元素。

### 基础概念

- **容器属性**：应用于包含其他组件的容器
- **项目属性**：应用于容器内的子组件

### 容器属性

#### flexDirection

定义主轴方向，决定子组件的排列方向。

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FlexDirectionExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>flexDirection 示例</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>row（默认）</Text>
        <View style={[styles.flexContainer, { flexDirection: 'row' }]}>
          <View style={[styles.box, styles.box1]}><Text style={styles.boxText}>1</Text></View>
          <View style={[styles.box, styles.box2]}><Text style={styles.boxText}>2</Text></View>
          <View style={[styles.box, styles.box3]}><Text style={styles.boxText}>3</Text></View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>row-reverse</Text>
        <View style={[styles.flexContainer, { flexDirection: 'row-reverse' }]}>
          <View style={[styles.box, styles.box1]}><Text style={styles.boxText}>1</Text></View>
          <View style={[styles.box, styles.box2]}><Text style={styles.boxText}>2</Text></View>
          <View style={[styles.box, styles.box3]}><Text style={styles.boxText}>3</Text></View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>column</Text>
        <View style={[styles.flexContainer, { flexDirection: 'column', height: 200 }]}>
          <View style={[styles.box, styles.box1]}><Text style={styles.boxText}>1</Text></View>
          <View style={[styles.box, styles.box2]}><Text style={styles.boxText}>2</Text></View>
          <View style={[styles.box, styles.box3]}><Text style={styles.boxText}>3</Text></View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>column-reverse</Text>
        <View style={[styles.flexContainer, { flexDirection: 'column-reverse', height: 200 }]}>
          <View style={[styles.box, styles.box1]}><Text style={styles.boxText}>1</Text></View>
          <View style={[styles.box, styles.box2]}><Text style={styles.boxText}>2</Text></View>
          <View style={[styles.box, styles.box3]}><Text style={styles.boxText}>3</Text></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#666',
  },
  flexContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
  },
  box: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    margin: 5,
  },
  box1: {
    backgroundColor: '#FF6384',
  },
  box2: {
    backgroundColor: '#36A2EB',
  },
  box3: {
    backgroundColor: '#FFCE56',
  },
  boxText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

#### justifyContent

定义子组件在主轴上的对齐方式。

```jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function JustifyContentExample() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>justifyContent 示例</Text>
      
      const justifyContentValues = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'];
      
      justifyContentValues.map((value, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{value}</Text>
          <View style={[styles.flexContainer, { justifyContent: value }]}>
            <View style={[styles.box, styles.box1]}><Text style={styles.boxText}>1</Text></View>
            <View style={[styles.box, styles.box2]}><Text style={styles.boxText}>2</Text></View>
            <View style={[styles.box, styles.box3]}><Text style={styles.boxText}>3</Text></View>
          </View>
        </View>
      ))
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#666',
  },
  flexContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
    height: 100,
  },
  box: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  box1: {
    backgroundColor: '#FF6384',
  },
  box2: {
    backgroundColor: '#36A2EB',
  },
  box3: {
    backgroundColor: '#FFCE56',
  },
  boxText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

#### alignItems

定义子组件在交叉轴上的对齐方式。

```jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AlignItemsExample() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>alignItems 示例</Text>
      
      const alignItemsValues = ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'];
      
      alignItemsValues.map((value, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{value}</Text>
          <View style={[styles.flexContainer, { alignItems: value }]}>
            <View style={[styles.box, styles.box1, { height: 30 }]}><Text style={styles.boxText}>1</Text></View>
            <View style={[styles.box, styles.box2, { height: 60 }]}><Text style={styles.boxText}>2</Text></View>
            <View style={[styles.box, styles.box3, { height: 45 }]}><Text style={styles.boxText}>3</Text></View>
          </View>
        </View>
      ))
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#666',
  },
  flexContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
    height: 120,
  },
  box: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  box1: {
    backgroundColor: '#FF6384',
  },
  box2: {
    backgroundColor: '#36A2EB',
  },
  box3: {
    backgroundColor: '#FFCE56',
  },
  boxText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

#### flexWrap

定义子组件是否换行。

```jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function FlexWrapExample() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>flexWrap 示例</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>nowrap（默认）</Text>
        <View style={[styles.flexContainer, { flexWrap: 'nowrap' }]}>
          {Array.from({ length: 8 }).map((_, index) => (
            <View key={index} style={[styles.box, { backgroundColor: getRandomColor() }]}>
              <Text style={styles.boxText}>{index + 1}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>wrap</Text>
        <View style={[styles.flexContainer, { flexWrap: 'wrap' }]}>
          {Array.from({ length: 8 }).map((_, index) => (
            <View key={index} style={[styles.box, { backgroundColor: getRandomColor() }]}>
              <Text style={styles.boxText}>{index + 1}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// 辅助函数：生成随机颜色
function getRandomColor() {
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'];
  return colors[Math.floor(Math.random() * colors.length)];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#666',
  },
  flexContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
    height: 150,
  },
  box: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    margin: 5,
  },
  boxText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

### 项目属性

#### flex

定义项目的伸缩能力，决定项目在剩余空间中的分配比例。

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FlexExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>flex 属性示例</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>不同的 flex 值</Text>
        <View style={styles.flexContainer}>
          <View style={[styles.box, styles.box1, { flex: 1 }]}><Text style={styles.boxText}>1</Text></View>
          <View style={[styles.box, styles.box2, { flex: 2 }]}><Text style={styles.boxText}>2</Text></View>
          <View style={[styles.box, styles.box3, { flex: 1 }]}><Text style={styles.boxText}>1</Text></View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>flex: 0（不伸缩）</Text>
        <View style={styles.flexContainer}>
          <View style={[styles.box, styles.box1, { flex: 0, width: 50 }]}><Text style={styles.boxText}>固定</Text></View>
          <View style={[styles.box, styles.box2, { flex: 1 }]}><Text style={styles.boxText}>flex:1</Text></View>
          <View style={[styles.box, styles.box3, { flex: 0, width: 80 }]}><Text style={styles.boxText}>固定</Text></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#666',
  },
  flexContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
    height: 60,
  },
  box: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  box1: {
    backgroundColor: '#FF6384',
  },
  box2: {
    backgroundColor: '#36A2EB',
  },
  box3: {
    backgroundColor: '#FFCE56',
  },
  boxText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
```

#### alignSelf

允许单个项目覆盖容器的`alignItems`属性。

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AlignSelfExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>alignSelf 示例</Text>
      
      <View style={styles.flexContainer}>
        <View style={[styles.box, styles.box1, { alignSelf: 'flex-start' }]}>
          <Text style={styles.boxText}>start</Text>
        </View>
        <View style={[styles.box, styles.box2, { alignSelf: 'center' }]}>
          <Text style={styles.boxText}>center</Text>
        </View>
        <View style={[styles.box, styles.box3, { alignSelf: 'flex-end' }]}>
          <Text style={styles.boxText}>end</Text>
        </View>
        <View style={[styles.box, { backgroundColor: '#4BC0C0', alignSelf: 'stretch' }]}>
          <Text style={styles.boxText}>stretch</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  flexContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    height: 120,
    alignItems: 'center', // 容器设置为居中对齐
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 3.0,
    elevation: 3,
  },
  box: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 8,
  },
  box1: {
    backgroundColor: '#FF6384',
    height: 30,
  },
  box2: {
    backgroundColor: '#36A2EB',
    height: 50,
  },
  box3: {
    backgroundColor: '#FFCE56',
    height: 40,
  },
  boxText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

#### order

控制项目在容器中的排列顺序。

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OrderExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>order 属性示例</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>默认顺序</Text>
        <View style={styles.flexContainer}>
          <View style={[styles.box, styles.box1]}><Text style={styles.boxText}>1</Text></View>
          <View style={[styles.box, styles.box2]}><Text style={styles.boxText}>2</Text></View>
          <View style={[styles.box, styles.box3]}><Text style={styles.boxText}>3</Text></View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>自定义顺序</Text>
        <View style={styles.flexContainer}>
          <View style={[styles.box, styles.box1, { order: 3 }]}><Text style={styles.boxText}>1</Text></View>
          <View style={[styles.box, styles.box2, { order: 1 }]}><Text style={styles.boxText}>2</Text></View>
          <View style={[styles.box, styles.box3, { order: 2 }]}><Text style={styles.boxText}>3</Text></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#666',
  },
  flexContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
    height: 60,
  },
  box: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  box1: {
    backgroundColor: '#FF6384',
  },
  box2: {
    backgroundColor: '#36A2EB',
  },
  box3: {
    backgroundColor: '#FFCE56',
  },
  boxText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

## 常用布局模式

### 卡片布局

```jsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function CardLayoutExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>卡片布局示例</Text>
      
      <View style={styles.card}>
        <Image
          style={styles.cardImage}
          source={{ uri: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&h=200&fit=crop' }}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>旅行目的地</Text>
          <Text style={styles.cardSubtitle}>探索世界的美丽角落</Text>
          <Text style={styles.cardDescription}>
            发现令人惊叹的风景和文化体验，开始你的下一次冒险之旅。
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.cardFooterItem}>
              <Text style={styles.cardFooterText}>4.8 ★</Text>
            </View>
            <View style={styles.cardFooterItem}>
              <Text style={styles.cardFooterText}>128 评论</Text>
            </View>
            <View style={styles.cardFooterItem}>
              <Text style={styles.cardFooterPrice}>¥2,999</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 22,
    color: '#444',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cardFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooterText: {
    fontSize: 14,
    color: '#666',
  },
  cardFooterPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
});
```

### 列表项布局

```jsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

export default function ListItemLayoutExample() {
  const listItems = [
    {
      id: 1,
      title: '产品设计原则',
      subtitle: '掌握现代产品设计的核心原则',
      author: '李设计师',
      date: '2023-10-15',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      id: 2,
      title: 'React Native 开发实战',
      subtitle: '从零开始学习 React Native 移动应用开发',
      author: '王开发',
      date: '2023-10-10',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      id: 3,
      title: '用户体验优化技巧',
      subtitle: '提升应用用户体验的实用技巧和方法',
      author: '张体验',
      date: '2023-10-05',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>列表项布局示例</Text>
      
      <View style={styles.list}>
        {listItems.map((item) => (
          <TouchableOpacity key={item.id} style={styles.listItem} activeOpacity={0.7}>
            <Image style={styles.avatar} source={{ uri: item.avatar }} />
            <View style={styles.content}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.itemSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              <View style={styles.meta}>
                <Text style={styles.author}>{item.author}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
            </View>
            <View style={styles.arrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  list: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  author: {
    fontSize: 12,
    color: '#999',
  },
  dot: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  arrow: {
    marginLeft: 10,
  },
  arrowText: {
    fontSize: 24,
    color: '#ccc',
  },
});
```

### 表单布局

```jsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function FormLayoutExample() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>表单布局示例</Text>
      
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>姓名</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入您的姓名"
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>电子邮箱</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入您的电子邮箱"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>手机号码</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入您的手机号码"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>密码</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入密码"
            placeholderTextColor="#999"
            secureTextEntry
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>确认密码</Text>
          <TextInput
            style={styles.input}
            placeholder="请再次输入密码"
            placeholderTextColor="#999"
            secureTextEntry
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>个人简介</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="请简要介绍一下自己"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <TouchableOpacity style={styles.submitButton} activeOpacity={0.8}>
          <Text style={styles.submitButtonText}>提交注册</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## 响应式设计

### 使用Dimensions API

`Dimensions` API 允许你获取设备的屏幕尺寸，用于创建响应式布局。

```jsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

// 获取屏幕尺寸
const { width, height } = Dimensions.get('window');

export default function ResponsiveDesignExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>响应式设计示例</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>屏幕宽度: {width}px</Text>
        <Text style={styles.infoText}>屏幕高度: {height}px</Text>
      </View>
      
      <View style={styles.gridContainer}>
        {/* 使用百分比宽度创建响应式网格 */}
        <View style={[styles.gridItem, styles.gridItemLarge]}>
          <Text style={styles.gridItemText}>50%</Text>
        </View>
        <View style={[styles.gridItem, styles.gridItemSmall]}>
          <Text style={styles.gridItemText}>25%</Text>
        </View>
        <View style={[styles.gridItem, styles.gridItemSmall]}>
          <Text style={styles.gridItemText}>25%</Text>
        </View>
      </View>
      
      <View style={styles.gridContainer}>
        {/* 均等分布的网格 */}
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={[styles.gridItem, styles.gridItemEqual]}>
            <Text style={styles.gridItemText}>{(100/3).toFixed(1)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  gridContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    height: 100,
  },
  gridItem: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderRadius: 8,
  },
  gridItemLarge: {
    flex: 2, // 50% 宽度
    backgroundColor: '#FF6384',
  },
  gridItemSmall: {
    flex: 1, // 25% 宽度
    backgroundColor: '#36A2EB',
  },
  gridItemEqual: {
    flex: 1, // 均等分布
    backgroundColor: '#FFCE56',
  },
  gridItemText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

### 适配不同屏幕尺寸

```jsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// 判断是否为平板设备
const isTablet = width >= 768;

// 根据屏幕尺寸计算字体大小
const normalizeFontSize = (size) => {
  if (isTablet) {
    return size * 1.2; // 平板上字体放大20%
  }
  return size;
};

export default function DeviceAdaptationExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>设备适配示例</Text>
      
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceInfoText}>
          设备类型: {isTablet ? '平板' : '手机'}
        </Text>
        <Text style={styles.deviceInfoText}>
          平台: {Platform.OS}
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.text, { fontSize: normalizeFontSize(24) }]}>
          响应式标题
        </Text>
        <Text style={[styles.text, { fontSize: normalizeFontSize(18) }]}>
          响应式副标题
        </Text>
        <Text style={[styles.text, { fontSize: normalizeFontSize(16) }]}>
          这是一段响应式文本，在不同尺寸的设备上会自动调整字体大小和布局。
        </Text>
      </View>
      
      <View style={[styles.card, isTablet ? styles.tabletCard : styles.phoneCard]}>
        <Text style={styles.cardTitle}>适配卡片</Text>
        <Text style={styles.cardContent}>
          这个卡片在平板上会显示为横向布局，在手机上会显示为纵向布局。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  deviceInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  deviceInfoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  content: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  text: {
    color: '#333',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 3.84,
    elevation: 5,
  },
  phoneCard: {
    flexDirection: 'column',
  },
  tabletCard: {
    flexDirection: 'row',
    height: 150,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 15,
    backgroundColor: '#f0f0f0',
  },
  cardContent: {
    fontSize: 16,
    color: '#666',
    padding: 15,
    flex: 1,
  },
});
```

## 样式技巧和最佳实践

### 1. 使用主题系统

创建一个统一的主题文件，管理应用的颜色、字体大小和间距。

```jsx
// theme.js

export const theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#4CD964',
    warning: '#FF9500',
    danger: '#FF3B30',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: {
      primary: '#000000',
      secondary: '#8E8E93',
      tertiary: '#C7C7CC',
      inverse: '#FFFFFF',
    },
    border: '#E5E5EA',
  },
  typography: {
    largeTitle: 34,
    title1: 28,
    title2: 22,
    title3: 20,
    headline: 17,
    body: 16,
    callout: 16,
    subheadline: 15,
    footnote: 13,
    caption1: 12,
    caption2: 11,
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
    round: 9999,
  },
};

// 使用主题
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from './theme';

export default function ThemedComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>主题化组件</Text>
      <Text style={styles.subtitle}>使用统一的设计系统</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.title1,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    fontSize: theme.typography.body,
    color: theme.colors.text.secondary,
  },
});
```

### 2. 使用StyleSheet.compose（实验性）

`StyleSheet.compose` 允许你组合多个样式对象，类似于CSS的继承。

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StyleCompositionExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.baseText}>基础文本</Text>
      <Text style={styles.primaryText}>主要文本</Text>
      <Text style={styles.secondaryText}>次要文本</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  baseText: {
    fontSize: 16,
    marginBottom: 10,
  },
  primaryText: {
    ...StyleSheet.compose(
      styles.baseText,
      {
        color: '#007AFF',
        fontWeight: 'bold',
      }
    ),
  },
  secondaryText: {
    ...StyleSheet.compose(
      styles.baseText,
      {
        color: '#8E8E93',
        fontStyle: 'italic',
      }
    ),
  },
});
```

### 3. 性能优化技巧

1. **避免在渲染方法中创建新样式对象**

```jsx
// 避免这样做
render() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 16, color: '#333' }}>文本</Text>
    </View>
  );
}

// 推荐这样做
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});

render() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>文本</Text>
    </View>
  );
}
```

2. **使用memo和useMemo优化渲染**

```jsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ExpensiveComponent = React.memo(({ data }) => {
  // 复杂计算
  const processedData = useMemo(() => {
    // 这里是一些昂贵的计算
    return data.map(item => item * 2);
  }, [data]);

  return (
    <View>
      <Text>处理后的数据: {processedData.join(', ')}</Text>
    </View>
  );
});
```

### 4. 无障碍设计

```jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export default function AccessibilityExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>无障碍设计示例</Text>
      
      <TouchableOpacity 
        style={styles.button}
        accessible={true}
        accessibilityLabel="提交表单"
        accessibilityHint="点击此按钮提交您的信息"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>提交</Text>
      </TouchableOpacity>
      
      <Image
        style={styles.image}
        source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
        accessible={true}
        accessibilityLabel="React Native 标志"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  image: {
    width: 100,
    height: 100,
  },
});
```

## 下一步

现在你已经学习了React Native的样式和布局系统，接下来你可以学习：

- [导航](./04-navigation.md) - 学习如何在应用中实现页面跳转
- [状态管理](./05-state-management.md) - 学习如何管理应用的状态
- [网络请求](./06-networking.md) - 学习如何与服务器进行数据交互