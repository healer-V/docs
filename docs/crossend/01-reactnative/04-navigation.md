---
title: "导航"
category: "跨端 · React Native"
tags:
  - React
excerpt: "在React Native应用开发中，导航是连接不同屏幕和组件的关键部分。本章节将介绍React Navigation库，这是React Native中最流行的导航解决方案，帮助你实现流畅的用户导航体验。 React Navigation是..."
---

# 导航

在React Native应用开发中，导航是连接不同屏幕和组件的关键部分。本章节将介绍React Navigation库，这是React Native中最流行的导航解决方案，帮助你实现流畅的用户导航体验。

## React Navigation简介

React Navigation是一个功能强大的导航库，提供了多种导航器类型，可以满足各种应用场景的需求。它是React Native社区推荐的导航解决方案，具有以下特点：

- 跨平台兼容性（iOS和Android）
- 可定制化的导航栏和标签栏
- 支持嵌套导航
- 丰富的导航动画和过渡效果
- 类型安全（TypeScript支持）

### 安装React Navigation

首先，我们需要安装React Navigation的核心依赖和所需的导航器：

```bash
# 安装核心依赖
npm install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context

# 安装底部标签导航器（可选）
npm install @react-navigation/bottom-tabs

# 安装抽屉导航器（可选）
npm install @react-navigation/drawer react-native-gesture-handler

# 安装材料设计导航抽屉（可选）
npm install react-native-reanimated
```

## 基础导航设置

### 创建导航容器

```jsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';

// 创建堆栈导航器
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: '首页' }} 
        />
        <Stack.Screen 
          name="Details" 
          component={DetailsScreen} 
          options={{ title: '详情页' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## 堆栈导航（Stack Navigation）

堆栈导航是最基本的导航模式，类似于网页浏览器中的前进后退功能。每次导航到新屏幕时，它都会被添加到堆栈顶部。

### 创建堆栈导航器

```jsx
import React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 创建堆栈导航器
const Stack = createNativeStackNavigator();

// 首页屏幕
function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>首页</Text>
      <Text style={styles.description}>这是应用的首页</Text>
      <Button
        title="查看详情"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}

// 详情页屏幕
function DetailsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>详情页</Text>
      <Text style={styles.description}>这是详情页面内容</Text>
      <Button
        title="返回首页"
        onPress={() => navigation.goBack()}
      />
      <Button
        title="返回首页（重置堆栈）"
        onPress={() => navigation.navigate('Home')}
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

// 主导航组件
function StackNavigatorExample() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          // 配置转场动画
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            title: '首页',
            headerTitleAlign: 'center',
          }} 
        />
        <Stack.Screen 
          name="Details" 
          component={DetailsScreen} 
          options={({ route }) => ({
            title: '详情页',
            // 可以根据路由参数动态设置标题
            // title: `详情: ${route.params?.itemId}`,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
});

export default StackNavigatorExample;
```

### 传递参数

```jsx
import React from 'react';
import { StyleSheet, View, Text, Button, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  const [name, setName] = React.useState('');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>首页</Text>
      <Text style={styles.description}>请输入您的姓名</Text>
      
      <TextInput
        style={styles.input}
        placeholder="输入姓名"
        value={name}
        onChangeText={setName}
      />
      
      <Button
        title="前往详情页"
        onPress={() => {
          navigation.navigate('Details', {
            name: name || '访客',
            userId: 123,
            userData: {
              age: 25,
              email: 'example@reactnative.cn'
            }
          });
        }}
      />
    </View>
  );
}

function DetailsScreen({ route, navigation }) {
  // 从route.params获取传递的参数
  const { name, userId, userData } = route.params;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>详情页</Text>
      <Text style={styles.greeting}>你好，{name}！</Text>
      <Text style={styles.infoText}>用户ID: {userId}</Text>
      <Text style={styles.infoText}>年龄: {userData.age}</Text>
      <Text style={styles.infoText}>邮箱: {userData.email}</Text>
      
      <Button
        title="返回首页"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

function ParameterPassingExample() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
        <Stack.Screen name="Details" component={DetailsScreen} options={{ title: '用户详情' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
});

export default ParameterPassingExample;
```

### 自定义导航栏

```jsx
import React from 'react';
import { StyleSheet, View, Text, Button, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>首页</Text>
      <Text style={styles.description}>这是应用的首页</Text>
      <Button
        title="前往自定义导航页"
        onPress={() => navigation.navigate('CustomHeader')}
      />
    </View>
  );
}

function CustomHeaderScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>自定义导航栏</Text>
      <Text style={styles.description}>这个页面有自定义的导航栏按钮</Text>
    </View>
  );
}

function CustomHeaderExample() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            title: '首页',
            // 添加右侧按钮
            headerRight: () => (
              <TouchableOpacity
                onPress={() => alert('设置按钮被点击')}
                style={{ marginRight: 15 }}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>设置</Text>
              </TouchableOpacity>
            ),
          }} 
        />
        <Stack.Screen 
          name="CustomHeader" 
          component={CustomHeaderScreen} 
          options={({ navigation }) => ({
            title: '自定义页面',
            // 自定义左侧按钮
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ marginLeft: 15 }}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>‹ 返回</Text>
              </TouchableOpacity>
            ),
            // 添加多个右侧按钮
            headerRight: () => (
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  onPress={() => alert('分享按钮被点击')}
                  style={{ marginRight: 15 }}
                >
                  <Text style={{ color: '#fff', fontSize: 16 }}>分享</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => alert('收藏按钮被点击')}
                  style={{ marginRight: 15 }}
                >
                  <Text style={{ color: '#fff', fontSize: 16 }}>收藏</Text>
                </TouchableOpacity>
              </View>
            ),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default CustomHeaderExample;
```

## 底部标签导航（Bottom Tab Navigation）

底部标签导航是移动应用中常用的导航模式，允许用户在不同的主要功能区域之间快速切换。

### 创建底部标签导航

```jsx
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // 或其他图标库

const Tab = createBottomTabNavigator();

// 首页屏幕
function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>首页</Text>
      <Text style={styles.description}>这是应用的首页标签</Text>
    </View>
  );
}

// 搜索屏幕
function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>搜索</Text>
      <Text style={styles.description}>这是应用的搜索标签</Text>
    </View>
  );
}

// 个人中心屏幕
function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>个人中心</Text>
      <Text style={styles.description}>这是应用的个人中心标签</Text>
    </View>
  );
}

function BottomTabNavigatorExample() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            // 返回Ionicons组件
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
          },
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            title: '首页',
            // 可选：隐藏标签栏
            // tabBarShowLabel: false,
          }} 
        />
        <Tab.Screen 
          name="Search" 
          component={SearchScreen} 
          options={{ title: '搜索' }} 
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: '我的' }} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default BottomTabNavigatorExample;
```

## 抽屉导航（Drawer Navigation）

抽屉导航是从屏幕侧面滑出的导航菜单，常用于包含多个主要功能区域的应用。

### 创建抽屉导航

```jsx
import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();

// 首页屏幕
function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>首页</Text>
      <Text style={styles.description}>这是应用的首页</Text>
    </View>
  );
}

// 产品屏幕
function ProductsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>产品</Text>
      <Text style={styles.description}>浏览我们的产品</Text>
    </View>
  );
}

// 关于屏幕
function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>关于我们</Text>
      <Text style={styles.description}>了解更多关于我们的信息</Text>
    </View>
  );
}

function DrawerNavigatorExample() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="Home"
        screenOptions={{
          drawerStyle: {
            backgroundColor: '#f5f5f5',
            width: 280,
          },
          drawerActiveTintColor: '#007AFF',
          drawerInactiveTintColor: '#666',
          drawerLabelStyle: {
            fontSize: 16,
            marginLeft: -10,
          },
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Drawer.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            title: '首页',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }} 
        />
        <Drawer.Screen 
          name="Products" 
          component={ProductsScreen} 
          options={{
            title: '产品',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="cube" size={size} color={color} />
            ),
          }} 
        />
        <Drawer.Screen 
          name="About" 
          component={AboutScreen} 
          options={{
            title: '关于我们',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="information-circle" size={size} color={color} />
            ),
          }} 
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default DrawerNavigatorExample;
```

## 嵌套导航

在实际应用中，我们经常需要组合使用多种导航器，这就是嵌套导航。

### 堆栈导航嵌套在标签导航中

```jsx
import React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// 首页相关屏幕
function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>首页</Text>
      <Text style={styles.description}>这是应用的首页</Text>
      <Button
        title="查看文章详情"
        onPress={() => navigation.navigate('ArticleDetails')}
      />
    </View>
  );
}

function ArticleDetailsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>文章详情</Text>
      <Text style={styles.description}>这是一篇文章的详细内容</Text>
      <Button
        title="返回首页"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

// 个人中心相关屏幕
function ProfileScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>个人中心</Text>
      <Text style={styles.description}>这是用户的个人中心</Text>
      <Button
        title="编辑资料"
        onPress={() => navigation.navigate('EditProfile')}
      />
    </View>
  );
}

function EditProfileScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>编辑资料</Text>
      <Text style={styles.description}>在这里可以编辑个人信息</Text>
      <Button
        title="返回个人中心"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

// 首页堆栈导航
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ title: '首页' }} 
      />
      <HomeStack.Screen 
        name="ArticleDetails" 
        component={ArticleDetailsScreen} 
        options={{ title: '文章详情' }} 
      />
    </HomeStack.Navigator>
  );
}

// 个人中心堆栈导航
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ title: '个人中心' }} 
      />
      <ProfileStack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ title: '编辑资料' }} 
      />
    </ProfileStack.Navigator>
  );
}

// 主导航（标签导航）
function NestedNavigationExample() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStackNavigator} 
          options={{ 
            title: '首页',
            // 隐藏堆栈导航的头部，使用标签导航的头部
            headerShown: false,
          }} 
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileStackNavigator} 
          options={{ 
            title: '我的',
            // 隐藏堆栈导航的头部，使用标签导航的头部
            headerShown: false,
          }} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default NestedNavigationExample;
```

### 标签导航嵌套在抽屉导航中

```jsx
import React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// 首页屏幕
function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>首页</Text>
      <Text style={styles.description}>这是应用的首页</Text>
    </View>
  );
}

// 发现屏幕
function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>发现</Text>
      <Text style={styles.description}>发现更多内容</Text>
    </View>
  );
}

// 消息屏幕
function MessagesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>消息</Text>
      <Text style={styles.description}>查看消息通知</Text>
    </View>
  );
}

// 个人中心屏幕
function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>个人中心</Text>
      <Text style={styles.description}>这是用户的个人中心</Text>
    </View>
  );
}

// 设置屏幕
function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>设置</Text>
      <Text style={styles.description}>应用设置选项</Text>
    </View>
  );
}

// 底部标签导航
function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: '首页' }} 
      />
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen} 
        options={{ title: '发现' }} 
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen} 
        options={{ title: '消息' }} 
      />
    </Tab.Navigator>
  );
}

// 主导航（抽屉导航）
function ComplexNestedNavigationExample() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          drawerStyle: {
            backgroundColor: '#f5f5f5',
            width: 280,
          },
          drawerActiveTintColor: '#007AFF',
          drawerInactiveTintColor: '#666',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Drawer.Screen 
          name="MainTabs" 
          component={MainTabNavigator} 
          options={{
            title: '主页面',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="apps" size={size} color={color} />
            ),
            // 隐藏抽屉导航的头部，使用标签导航的头部
            headerShown: false,
          }} 
        />
        <Drawer.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{
            title: '个人中心',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }} 
        />
        <Drawer.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{
            title: '设置',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }} 
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ComplexNestedNavigationExample;
```

## 高级导航功能

### 导航状态持久化

```jsx
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Button, AsyncStorage } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>首页</Text>
      <Text style={styles.description}>导航状态会被持久化保存</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>个人中心</Text>
      <Text style={styles.description}>重新启动应用后会恢复到上次的导航状态</Text>
    </View>
  );
}

function PersistentNavigationExample() {
  const routeNameRef = useRef();
  const navigationRef = useRef();

  // 保存导航状态
  const saveNavigationState = async (state) => {
    try {
      await AsyncStorage.setItem('navigationState', JSON.stringify(state));
    } catch (e) {
      console.error('保存导航状态失败:', e);
    }
  };

  // 加载导航状态
  const loadNavigationState = async () => {
    try {
      const stateString = await AsyncStorage.getItem('navigationState');
      return stateString ? JSON.parse(stateString) : null;
    } catch (e) {
      console.error('加载导航状态失败:', e);
      return null;
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current.getCurrentRoute().name;
      }}
      onStateChange={(state) => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current.getCurrentRoute().name;

        if (previousRouteName !== currentRouteName) {
          // 路由改变时保存状态
          saveNavigationState(state);
        }

        // 更新当前路由名称
        routeNameRef.current = currentRouteName;
      }}
      // 初始状态将从AsyncStorage加载
      initialState={loadNavigationState()}
    >
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '个人中心' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default PersistentNavigationExample;
```

### 条件导航

```jsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, Button, TextInput, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

// 登录屏幕
function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // 简单的登录验证
    if (username === 'admin' && password === 'password') {
      // 登录成功，导航到主页
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } else {
      Alert.alert('登录失败', '用户名或密码错误');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>登录</Text>
      <TextInput
        style={styles.input}
        placeholder="用户名"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="密码"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="登录" onPress={handleLogin} />
    </View>
  );
}

// 主页屏幕
function MainScreen({ navigation }) {
  const handleLogout = () => {
    // 登出，重置导航堆栈到登录页面
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>欢迎回来！</Text>
      <Text style={styles.description}>这是受保护的内容</Text>
      <Button title="登出" onPress={handleLogout} />
    </View>
  );
}

function ConditionalNavigationExample() {
  // 这里可以从 AsyncStorage 或其他地方检查用户是否已登录
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  // 模拟加载和检查登录状态
  React.useEffect(() => {
    const bootstrapAsync = async () => {
      // 这里可以从 AsyncStorage 获取用户令牌
      // const userToken = await AsyncStorage.getItem('userToken');
      
      // 模拟网络请求延迟
      setTimeout(() => {
        setIsLoading(false);
        // 模拟未登录状态
        setUserToken(null);
      }, 1000);
    };

    bootstrapAsync();
  }, []);

  if (isLoading) {
    // 可以显示一个启动屏幕
    return (
      <View style={styles.container}>
        <Text style={styles.title}>加载中...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {userToken == null ? (
          // 用户未登录，显示登录页面
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
        ) : (
          // 用户已登录，显示主页
          <Stack.Screen 
            name="Main" 
            component={MainScreen} 
            options={{ 
              title: '主页',
              headerLeft: () => null, // 隐藏返回按钮
            }} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
});

export default ConditionalNavigationExample;
```

### 深度链接

```jsx
import React from 'react';
import { StyleSheet, View, Text, Linking, Button, Platform } from 'react-native';
import { NavigationContainer, useLinking } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>深度链接示例</Text>
      <Text style={styles.description}>使用以下链接可以直接打开特定页面：</Text>
      
      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>reactnativeapp://details/123</Text>
        <Button
          title="打开详情页"
          onPress={() => {
            const url = 'reactnativeapp://details/123';
            Linking.canOpenURL(url)
              .then(supported => {
                if (supported) {
                  return Linking.openURL(url);
                } else {
                  console.log("无法打开该链接");
                }
              });
          }}
        />
      </View>
      
      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>reactnativeapp://profile</Text>
        <Button
          title="打开个人中心"
          onPress={() => {
            const url = 'reactnativeapp://profile';
            Linking.canOpenURL(url)
              .then(supported => {
                if (supported) {
                  return Linking.openURL(url);
                } else {
                  console.log("无法打开该链接");
                }
              });
          }}
        />
      </View>
    </View>
  );
}

function DetailsScreen({ route }) {
  const { id } = route.params || {};
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>详情页</Text>
      <Text style={styles.description}>ID: {id || '未指定'}</Text>
      <Button
        title="返回首页"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>个人中心</Text>
      <Text style={styles.description}>这是通过深度链接访问的个人中心页面</Text>
      <Button
        title="返回首页"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

function LinkingConfiguration() {
  return {
    prefixes: ['reactnativeapp://', 'https://reactnativeapp.com'],
    config: {
      screens: {
        Home: 'home',
        Details: 'details/:id',
        Profile: 'profile',
      },
    },
  };
}

function DeepLinkingExample() {
  const { getInitialURL, subscribe } = useLinking(navigationRef, LinkingConfiguration());

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
        <Stack.Screen name="Details" component={DetailsScreen} options={{ title: '详情页' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: '个人中心' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// 创建导航引用
const navigationRef = React.createRef();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  linkContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default DeepLinkingExample;
```

## 性能优化

### 使用React.memo和useCallback

```jsx
import React, { useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

// 使用React.memo优化的列表项组件
const ListItem = React.memo(({ item, onPress }) => {
  console.log('渲染列表项:', item.id);
  return (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => onPress(item.id)}
    >
      <Text style={styles.listItemText}>{item.title}</Text>
    </TouchableOpacity>
  );
});

function HomeScreen({ navigation }) {
  // 生成大量数据
  const generateData = () => {
    const data = [];
    for (let i = 1; i <= 100; i++) {
      data.push({
        id: i.toString(),
        title: `项目 ${i}`,
      });
    }
    return data;
  };

  const data = generateData();

  // 使用useCallback缓存导航函数
  const navigateToDetails = useCallback((id) => {
    navigation.navigate('Details', { id });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <ListItem item={item} onPress={navigateToDetails} />
  ), [navigateToDetails]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>性能优化示例</Text>
      <Text style={styles.description}>使用React.memo和useCallback优化大量列表项的渲染</Text>
      
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={10} // 初始渲染的项目数量
        maxToRenderPerBatch={10} // 每批渲染的最大项目数
        windowSize={10} // 可见区域外渲染的项目数
        removeClippedSubviews={true} // 移除屏幕外的子视图
        ListEmptyComponent={
          <Text style={styles.emptyText}>没有数据</Text>
        }
      />
    </View>
  );
}

function DetailsScreen({ route }) {
  const { id } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>项目详情</Text>
      <Text style={styles.description}>ID: {id}</Text>
    </View>
  );
}

function PerformanceOptimizationExample() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '列表' }} />
        <Stack.Screen name="Details" component={DetailsScreen} options={{ title: '详情' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listItemText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default PerformanceOptimizationExample;
```

## 常见问题与解决方案

### 导航状态丢失

**问题**：应用重启后，用户的导航状态（如当前所在页面）丢失。

**解决方案**：使用导航状态持久化，如前面的"导航状态持久化"示例所示，将导航状态保存到AsyncStorage中。

### 导航循环依赖

**问题**：在嵌套导航中，可能会出现循环依赖的问题，导致应用崩溃。

**解决方案**：
1. 使用懒加载导入组件
2. 确保导航结构清晰，避免复杂的循环嵌套
3. 使用React Navigation的最新版本，它对循环依赖有更好的处理

### 深层嵌套导航性能问题

**问题**：深层嵌套的导航结构可能导致性能问题和复杂的导航逻辑。

**解决方案**：
1. 保持导航结构尽可能扁平
2. 使用React.memo和useCallback优化组件渲染
3. 考虑使用状态管理库（如Redux或Context API）来管理复杂的导航逻辑

### 导航栏样式不一致

**问题**：在嵌套导航中，不同层级的导航栏样式可能不一致。

**解决方案**：
1. 定义统一的导航栏样式主题
2. 使用screenOptions配置全局导航栏样式
3. 在需要时覆盖特定屏幕的导航栏样式

## 下一步

现在你已经学习了React Native的导航系统，接下来你可以学习：

- [状态管理](./05-state-management.md) - 学习如何管理应用的状态
- [网络请求](./06-networking.md) - 学习如何与服务器进行数据交互
- [原生模块](./07-native-modules.md) - 学习如何集成原生功能