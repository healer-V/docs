# 状态管理

在React Native应用开发中，状态管理是一个核心概念，它决定了如何存储、更新和共享应用数据。随着应用规模的增长，有效的状态管理变得越来越重要。本章将介绍React Native中的状态管理方案，从基础的React Hooks到流行的状态管理库。

## 基础状态管理

### 使用React的useState Hook

`useState`是React提供的最基础的状态管理Hook，适用于简单组件内的状态管理。

```jsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, Button, TextInput } from 'react-native';

function CounterExample() {
  // 定义状态变量count，初始值为0，setCount是更新count的函数
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  
  // 增加计数
  const increment = () => {
    setCount(count + 1);
  };
  
  // 减少计数
  const decrement = () => {
    setCount(count - 1);
  };
  
  // 重置计数
  const reset = () => {
    setCount(0);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>计数器示例</Text>
      
      <View style={styles.counterContainer}>
        <Text style={styles.counterValue}>{count}</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button title="-" onPress={decrement} />
        <Button title="重置" onPress={reset} />
        <Button title="+" onPress={increment} />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="输入您的名字"
          value={name}
          onChangeText={setName}
        />
        {name ? (
          <Text style={styles.greeting}>你好，{name}！</Text>
        ) : null}
      </View>
    </View>
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
  counterContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
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
  greeting: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
});

export default CounterExample;
```

### 使用useReducer Hook

对于更复杂的状态逻辑，`useReducer`是一个更好的选择，它允许你通过reducer函数来管理状态更新。

```jsx
import React, { useReducer } from 'react';
import { StyleSheet, View, Text, Button, TextInput } from 'react-native';

// 定义初始状态
const initialState = {
  count: 0,
  userInput: '',
};

// 定义reducer函数，处理各种action
function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return {
        ...state,
        count: state.count + 1,
      };
    case 'DECREMENT':
      return {
        ...state,
        count: state.count - 1,
      };
    case 'RESET':
      return {
        ...state,
        count: 0,
      };
    case 'SET_USER_INPUT':
      return {
        ...state,
        userInput: action.payload,
      };
    case 'INCREMENT_BY_VALUE':
      return {
        ...state,
        count: state.count + (parseInt(action.payload) || 0),
      };
    default:
      return state;
  }
}

function UseReducerExample() {
  // 使用useReducer，传入reducer函数和初始状态
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // 提取状态
  const { count, userInput } = state;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>useReducer示例</Text>
      
      <View style={styles.counterContainer}>
        <Text style={styles.counterValue}>{count}</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="-" 
          onPress={() => dispatch({ type: 'DECREMENT' })} 
        />
        <Button 
          title="重置" 
          onPress={() => dispatch({ type: 'RESET' })} 
        />
        <Button 
          title="+" 
          onPress={() => dispatch({ type: 'INCREMENT' })} 
        />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="输入数字"
          value={userInput}
          onChangeText={(text) => dispatch({ 
            type: 'SET_USER_INPUT', 
            payload: text 
          })}
          keyboardType="numeric"
        />
        
        <Button 
          title={`增加 ${userInput || 0}`} 
          onPress={() => dispatch({ 
            type: 'INCREMENT_BY_VALUE', 
            payload: userInput 
          })} 
        />
      </View>
    </View>
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
  counterContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
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

export default UseReducerExample;
```

### 使用Context API进行状态共享

Context API允许你在组件树中共享状态，而不需要通过props一级一级地传递。

```jsx
import React, { createContext, useContext, useState, useReducer } from 'react';
import { StyleSheet, View, Text, Button, TouchableOpacity } from 'react-native';

// 创建主题上下文
const ThemeContext = createContext();

// 创建用户上下文
const UserContext = createContext();

// 主题提供者组件
export const ThemeProvider = ({ children }) => {
  // 使用useReducer管理主题状态
  const [theme, setTheme] = useState('light');
  
  // 切换主题的函数
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  // 主题配置
  const themeConfig = {
    light: {
      backgroundColor: '#fff',
      textColor: '#000',
      buttonColor: '#007AFF',
    },
    dark: {
      backgroundColor: '#333',
      textColor: '#fff',
      buttonColor: '#5AC8FA',
    },
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeConfig: themeConfig[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 用户提供者组件
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: '访客',
    isLoggedIn: false,
  });
  
  // 登录函数
  const login = (name) => {
    setUser({
      name,
      isLoggedIn: true,
    });
  };
  
  // 登出函数
  const logout = () => {
    setUser({
      name: '访客',
      isLoggedIn: false,
    });
  };
  
  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// 自定义Hook，用于访问主题上下文
export const useTheme = () => useContext(ThemeContext);

// 自定义Hook，用于访问用户上下文
export const useUser = () => useContext(UserContext);

// 使用Context的组件
function Header() {
  const { user, logout } = useUser();
  const { themeConfig } = useTheme();
  
  return (
    <View style={[styles.header, { backgroundColor: themeConfig.buttonColor }]}>
      <Text style={[styles.headerText, { color: '#fff' }]}>
        欢迎，{user.name}！
      </Text>
      {user.isLoggedIn && (
        <TouchableOpacity onPress={logout}>
          <Text style={[styles.logoutButton, { color: '#fff' }]}>登出</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function LoginPanel() {
  const { user, login } = useUser();
  const { themeConfig } = useTheme();
  
  if (user.isLoggedIn) {
    return null; // 用户已登录，不显示登录面板
  }
  
  return (
    <View style={[styles.loginPanel, { backgroundColor: themeConfig.backgroundColor }]}>
      <Text style={[styles.loginTitle, { color: themeConfig.textColor }]}>请登录</Text>
      <View style={styles.loginButtons}>
        <Button 
          title="登录为张三" 
          onPress={() => login('张三')} 
        />
        <Button 
          title="登录为李四" 
          onPress={() => login('李四')} 
        />
      </View>
    </View>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme, themeConfig } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.themeToggle, { backgroundColor: themeConfig.buttonColor }]}
      onPress={toggleTheme}
    >
      <Text style={{ color: '#fff' }}>
        切换到{theme === 'light' ? '深色' : '浅色'}主题
      </Text>
    </TouchableOpacity>
  );
}

function Content() {
  const { themeConfig } = useTheme();
  
  return (
    <View style={[styles.content, { backgroundColor: themeConfig.backgroundColor }]}>
      <Text style={[styles.contentTitle, { color: themeConfig.textColor }]}>
        Context API示例
      </Text>
      <Text style={[styles.contentText, { color: themeConfig.textColor }]}>
        这个示例展示了如何使用React Context API在组件树中共享状态。
        你可以切换主题和登录状态，这些状态会在整个应用中共享。
      </Text>
    </View>
  );
}

// 主应用组件
function ContextApiExample() {
  return (
    <ThemeProvider>
      <UserProvider>
        <View style={styles.container}>
          <Header />
          <Content />
          <LoginPanel />
          <ThemeToggle />
        </View>
      </UserProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  loginPanel: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  themeToggle: {
    padding: 15,
    alignItems: 'center',
  },
});

export default ContextApiExample;
```

## 使用Redux进行状态管理

Redux是一个流行的状态管理库，它提供了一个可预测的状态容器，特别适合大型应用。

### 安装Redux依赖

```bash
# 安装Redux核心依赖
npm install @reduxjs/toolkit react-redux

# 可选：安装Redux DevTools扩展
# 浏览器扩展：https://github.com/zalmoxisus/redux-devtools-extension
```

### 创建Redux Store

```jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { configureStore, createSlice, Provider, useDispatch, useSelector } from '@reduxjs/toolkit';

// 创建计数器切片
const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0,
  },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
    reset: (state) => {
      state.value = 0;
    },
  },
});

// 导出actions
export const { increment, decrement, incrementByAmount, reset } = counterSlice.actions;

// 创建主题切片
const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    mode: 'light',
  },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
    },
  },
});

// 导出主题actions
export const { toggleTheme, setTheme } = themeSlice.actions;

// 创建用户切片
const userSlice = createSlice({
  name: 'user',
  initialState: {
    name: '访客',
    isLoggedIn: false,
  },
  reducers: {
    login: (state, action) => {
      state.name = action.payload;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.name = '访客';
      state.isLoggedIn = false;
    },
  },
});

// 导出用户actions
export const { login, logout } = userSlice.actions;

// 配置Redux store，包含所有切片
const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    theme: themeSlice.reducer,
    user: userSlice.reducer,
  },
});

// 主题配置
const themeConfig = {
  light: {
    backgroundColor: '#fff',
    textColor: '#000',
    buttonColor: '#007AFF',
  },
  dark: {
    backgroundColor: '#333',
    textColor: '#fff',
    buttonColor: '#5AC8FA',
  },
};

// 使用Redux的组件
function Counter() {
  // 从Redux store中获取counter状态
  const count = useSelector((state) => state.counter.value);
  const themeMode = useSelector((state) => state.theme.mode);
  const currentTheme = themeConfig[themeMode];
  
  // 获取dispatch函数
  const dispatch = useDispatch();
  
  return (
    <View style={[styles.counterContainer, { backgroundColor: currentTheme.backgroundColor }]}>
      <Text style={[styles.counterTitle, { color: currentTheme.textColor }]}>计数器</Text>
      <Text style={[styles.counterValue, { color: currentTheme.textColor }]}>{count}</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}
          onPress={() => dispatch(decrement())}
        >
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}
          onPress={() => dispatch(reset())}
        >
          <Text style={styles.buttonText}>重置</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}
          onPress={() => dispatch(increment())}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}
          onPress={() => dispatch(incrementByAmount(5))}
        >
          <Text style={styles.buttonText}>+5</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}
          onPress={() => dispatch(incrementByAmount(10))}
        >
          <Text style={styles.buttonText}>+10</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function UserProfile() {
  // 从Redux store中获取user状态
  const user = useSelector((state) => state.user);
  const themeMode = useSelector((state) => state.theme.mode);
  const currentTheme = themeConfig[themeMode];
  
  // 获取dispatch函数
  const dispatch = useDispatch();
  
  return (
    <View style={[styles.profileContainer, { backgroundColor: currentTheme.backgroundColor }]}>
      <Text style={[styles.profileTitle, { color: currentTheme.textColor }]}>用户信息</Text>
      
      <Text style={[styles.profileText, { color: currentTheme.textColor }]}>
        用户名: {user.name}
      </Text>
      
      <Text style={[styles.profileText, { color: currentTheme.textColor }]}>
        登录状态: {user.isLoggedIn ? '已登录' : '未登录'}
      </Text>
      
      <View style={styles.buttonRow}>
        {user.isLoggedIn ? (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}
            onPress={() => dispatch(logout())}
          >
            <Text style={styles.buttonText}>登出</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}
              onPress={() => dispatch(login('张三'))}
            >
              <Text style={styles.buttonText}>登录为张三</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}
              onPress={() => dispatch(login('李四'))}
            >
              <Text style={styles.buttonText}>登录为李四</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function ThemeToggle() {
  // 从Redux store中获取theme状态
  const themeMode = useSelector((state) => state.theme.mode);
  const currentTheme = themeConfig[themeMode];
  
  // 获取dispatch函数
  const dispatch = useDispatch();
  
  return (
    <View style={styles.themeContainer}>
      <TouchableOpacity 
        style={[styles.themeButton, { backgroundColor: currentTheme.buttonColor }]}
        onPress={() => dispatch(toggleTheme())}
      >
        <Text style={styles.themeButtonText}>
          切换到{themeMode === 'light' ? '深色' : '浅色'}主题
        </Text>
      </TouchableOpacity>
      
      <View style={styles.themeOptions}>
        <TouchableOpacity 
          style={[
            styles.themeOption,
            themeMode === 'light' && { borderColor: currentTheme.buttonColor, borderWidth: 2 }
          ]}
          onPress={() => dispatch(setTheme('light'))}
        >
          <Text style={[styles.themeOptionText, { color: '#000' }]}>浅色主题</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.themeOption,
            themeMode === 'dark' && { borderColor: currentTheme.buttonColor, borderWidth: 2 }
          ]}
          onPress={() => dispatch(setTheme('dark'))}
        >
          <Text style={[styles.themeOptionText, { color: '#fff' }]}>深色主题</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 主应用组件
function ReduxExample() {
  return (
    <Provider store={store}>
      <View style={styles.container}>
        <Text style={styles.appTitle}>Redux示例应用</Text>
        <Counter />
        <UserProfile />
        <ThemeToggle />
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#007AFF',
  },
  counterContainer: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  counterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  counterValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileContainer: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profileText: {
    fontSize: 16,
    marginBottom: 5,
  },
  themeContainer: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  themeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  themeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  themeOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  themeOptionText: {
    fontWeight: 'bold',
  },
});

export default ReduxExample;
```

### 使用Redux Toolkit的异步操作

Redux Toolkit提供了`createAsyncThunk`来处理异步操作。

```jsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { configureStore, createSlice, createAsyncThunk, Provider, useDispatch, useSelector } from '@reduxjs/toolkit';

// 模拟API调用
const fetchPosts = async () => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 模拟API响应
  return [
    {
      id: '1',
      title: 'React Native入门指南',
      content: '这是一篇关于React Native的入门教程...',
      author: '张三',
      date: '2023-05-10',
    },
    {
      id: '2',
      title: 'Redux Toolkit最佳实践',
      content: 'Redux Toolkit可以帮助你更高效地使用Redux...',
      author: '李四',
      date: '2023-05-15',
    },
    {
      id: '3',
      title: 'React Native性能优化',
      content: '如何优化你的React Native应用性能...',
      author: '王五',
      date: '2023-05-20',
    },
  ];
};

// 创建异步thunk
export const fetchPostsAsync = createAsyncThunk(
  'posts/fetchPosts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchPosts();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 创建帖子切片
const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    addPost: (state, action) => {
      state.items.push(action.payload);
    },
    updatePost: (state, action) => {
      const index = state.items.findIndex(post => post.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deletePost: (state, action) => {
      state.items = state.items.filter(post => post.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPostsAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPostsAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // 添加获取到的帖子
        state.items = action.payload;
      })
      .addCase(fetchPostsAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

// 导出actions
export const { addPost, updatePost, deletePost } = postsSlice.actions;

// 配置store
const store = configureStore({
  reducer: {
    posts: postsSlice.reducer,
  },
});

// 帖子项组件
function PostItem({ post }) {
  return (
    <View style={styles.postItem}>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postAuthor}>{post.author} · {post.date}</Text>
      <Text style={styles.postContent}>{post.content}</Text>
    </View>
  );
}

// 主应用组件
function PostsList() {
  const dispatch = useDispatch();
  const { items: posts, status, error } = useSelector(state => state.posts);
  const [refreshing, setRefreshing] = React.useState(false);
  
  // 初始加载数据
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPostsAsync());
    }
  }, [status, dispatch]);
  
  // 处理下拉刷新
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    dispatch(fetchPostsAsync()).then(() => setRefreshing(false));
  }, [dispatch]);
  
  // 渲染加载状态
  if (status === 'loading' && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }
  
  // 渲染错误状态
  if (status === 'failed') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>加载失败: {error}</Text>
        <Text 
          style={styles.retryButton} 
          onPress={() => dispatch(fetchPostsAsync())}
        >
          重试
        </Text>
      </View>
    );
  }
  
  // 渲染帖子列表
  return (
    <View style={styles.container}>
      <Text style={styles.title}>帖子列表</Text>
      <FlatList
        data={posts}
        renderItem={({ item }) => <PostItem post={item} />}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>没有帖子</Text>
        }
      />
    </View>
  );
}

// 主应用组件（包含Provider）
function ReduxAsyncExample() {
  return (
    <Provider store={store}>
      <PostsList />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    padding: 10,
  },
  postItem: {
    backgroundColor: '#fff',
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
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  postAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
});

export default ReduxAsyncExample;
```

## 使用MobX进行状态管理

MobX是另一个流行的状态管理库，它使用响应式编程的思想，让状态管理更加简单和直观。

### 安装MobX

```bash
# 安装MobX和React绑定
npm install mobx mobx-react-lite
```

### MobX基本用法

```jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button } from 'react-native';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';

// 计数器存储
class CounterStore {
  count = 0;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  increment() {
    this.count += 1;
  }
  
  decrement() {
    this.count -= 1;
  }
  
  incrementBy(amount) {
    this.count += amount;
  }
  
  reset() {
    this.count = 0;
  }
}

// 主题存储
class ThemeStore {
  mode = 'light';
  
  constructor() {
    makeAutoObservable(this);
  }
  
  toggleTheme() {
    this.mode = this.mode === 'light' ? 'dark' : 'light';
  }
  
  setTheme(mode) {
    this.mode = mode;
  }
}

// 用户存储
class UserStore {
  name = '访客';
  isLoggedIn = false;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  login(name) {
    this.name = name;
    this.isLoggedIn = true;
  }
  
  logout() {
    this.name = '访客';
    this.isLoggedIn = false;
  }
}

// 创建存储实例
const counterStore = new CounterStore();
const themeStore = new ThemeStore();
const userStore = new UserStore();

// 主题配置
const themeConfig = {
  light: {
    backgroundColor: '#fff',
    textColor: '#000',
    buttonColor: '#007AFF',
  },
  dark: {
    backgroundColor: '#333',
    textColor: '#fff',
    buttonColor: '#5AC8FA',
  },
};

// 计数器组件
const Counter = observer(() => {
  const theme = themeConfig[themeStore.mode];
  
  return (
    <View style={[styles.section, { backgroundColor: theme.backgroundColor }]}>
      <Text style={[styles.sectionTitle, { color: theme.textColor }]}>计数器</Text>
      <Text style={[styles.counterValue, { color: theme.textColor }]}>{counterStore.count}</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.buttonColor }]}
          onPress={() => counterStore.decrement()}
        >
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.buttonColor }]}
          onPress={() => counterStore.reset()}
        >
          <Text style={styles.buttonText}>重置</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.buttonColor }]}
          onPress={() => counterStore.increment()}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.buttonColor }]}
          onPress={() => counterStore.incrementBy(5)}
        >
          <Text style={styles.buttonText}>+5</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.buttonColor }]}
          onPress={() => counterStore.incrementBy(10)}
        >
          <Text style={styles.buttonText}>+10</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// 用户组件
const UserProfile = observer(() => {
  const theme = themeConfig[themeStore.mode];
  
  return (
    <View style={[styles.section, { backgroundColor: theme.backgroundColor }]}>
      <Text style={[styles.sectionTitle, { color: theme.textColor }]}>用户信息</Text>
      
      <Text style={[styles.userInfo, { color: theme.textColor }]}>
        用户名: {userStore.name}
      </Text>
      
      <Text style={[styles.userInfo, { color: theme.textColor }]}>
        登录状态: {userStore.isLoggedIn ? '已登录' : '未登录'}
      </Text>
      
      <View style={styles.buttonRow}>
        {userStore.isLoggedIn ? (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.buttonColor }]}
            onPress={() => userStore.logout()}
          >
            <Text style={styles.buttonText}>登出</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.buttonColor }]}
              onPress={() => userStore.login('张三')}
            >
              <Text style={styles.buttonText}>登录为张三</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.buttonColor }]}
              onPress={() => userStore.login('李四')}
            >
              <Text style={styles.buttonText}>登录为李四</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
});

// 主题切换组件
const ThemeToggle = observer(() => {
  const theme = themeConfig[themeStore.mode];
  
  return (
    <View style={[styles.section, { backgroundColor: theme.backgroundColor }]}>
      <Text style={[styles.sectionTitle, { color: theme.textColor }]}>主题设置</Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.buttonColor }]}
        onPress={() => themeStore.toggleTheme()}
      >
        <Text style={styles.buttonText}>
          切换到{themeStore.mode === 'light' ? '深色' : '浅色'}主题
        </Text>
      </TouchableOpacity>
      
      <View style={styles.themeOptions}>
        <TouchableOpacity 
          style={[
            styles.themeOption,
            { backgroundColor: '#fff' },
            themeStore.mode === 'light' && { borderColor: theme.buttonColor, borderWidth: 2 }
          ]}
          onPress={() => themeStore.setTheme('light')}
        >
          <Text style={[styles.themeOptionText, { color: '#000' }]}>浅色主题</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.themeOption,
            { backgroundColor: '#333' },
            themeStore.mode === 'dark' && { borderColor: theme.buttonColor, borderWidth: 2 }
          ]}
          onPress={() => themeStore.setTheme('dark')}
        >
          <Text style={[styles.themeOptionText, { color: '#fff' }]}>深色主题</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// 主应用组件
function MobXExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.appTitle}>MobX示例应用</Text>
      <Counter />
      <UserProfile />
      <ThemeToggle />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#007AFF',
  },
  section: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  counterValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  themeOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  themeOptionText: {
    fontWeight: 'bold',
  },
});

export default MobXExample;
```

## 状态管理最佳实践

### 1. 选择合适的状态管理方案

| 方案 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| useState | 简单组件内状态 | 简单易用，内置Hook | 不适合跨组件共享 |
| useReducer | 复杂组件内状态逻辑 | 管理复杂状态转换 | 不适合跨组件共享 |
| Context API | 中等复杂度的状态共享 | 内置API，无需额外依赖 | 性能问题（大面积重渲染） |
| Redux | 大型应用，复杂状态管理 | 可预测、可调试、中间件支持 | 样板代码多，学习曲线陡 |
| Redux Toolkit | 大型应用，推荐的Redux用法 | 减少样板代码，内置最佳实践 | 仍然有一定学习曲线 |
| MobX | 响应式状态管理 | 简单直观，自动追踪依赖 | 可能过于灵活，难以调试 |

### 2. 状态管理的原则

- **单一数据源**：尽量让应用的状态来自单一的数据源，便于管理和调试。
- **状态不可变**：不要直接修改状态，而是创建新的状态对象。
- **纯函数更新**：状态更新函数应该是纯函数，相同的输入总是产生相同的输出。
- **分离关注点**：将状态管理逻辑与UI组件分离，提高代码的可维护性。
- **避免过度设计**：根据应用规模选择合适的状态管理方案，不要过度设计。

### 3. 性能优化

- **使用React.memo**：避免不必要的组件重渲染。
- **使用useMemo和useCallback**：缓存计算结果和函数引用。
- **优化Context使用**：将不同的状态拆分到不同的Context中，避免大面积重渲染。
- **Redux性能优化**：
  - 使用`createSelector`创建记忆化的选择器
  - 避免在选择器中进行复杂计算
  - 合理使用中间件

### 4. 调试技巧

- **React DevTools**：用于检查组件树和状态。
- **Redux DevTools**：用于调试Redux状态变化。
- **MobX DevTools**：用于调试MobX状态变化。
- **日志中间件**：在状态更新前后记录日志，便于追踪问题。

## 下一步

现在你已经学习了React Native的状态管理，接下来你可以学习：

- [网络请求](./06-networking.md) - 学习如何与服务器进行数据交互
- [原生模块](./07-native-modules.md) - 学习如何集成原生功能
- [性能优化](./08-performance-optimization.md) - 学习如何优化React Native应用性能