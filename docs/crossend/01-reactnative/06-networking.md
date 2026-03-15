---
title: "网络请求"
category: "跨端 · React Native"
tags:
  - React
excerpt: "在React Native应用开发中，网络请求是与服务器进行数据交互的核心功能。无论是获取数据、提交表单，还是上传文件，都需要通过网络请求来实现。本章将介绍React Native中的网络请求技术，包括内置的fetch API和流行的第三方..."
---

# 网络请求

在React Native应用开发中，网络请求是与服务器进行数据交互的核心功能。无论是获取数据、提交表单，还是上传文件，都需要通过网络请求来实现。本章将介绍React Native中的网络请求技术，包括内置的`fetch` API和流行的第三方库，以及如何处理各种网络场景。

## 使用内置的fetch API

React Native内置了`fetch` API，它是基于Web标准的网络请求API，提供了一种简洁的方式来发送HTTP请求。

### 基本GET请求

```jsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';

function BasicFetchExample() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 模拟API地址
  const API_URL = 'https://jsonplaceholder.typicode.com/posts';
  
  // 获取数据的函数
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 发送GET请求
      const response = await fetch(API_URL);
      
      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // 解析JSON响应
      const jsonData = await response.json();
      setData(jsonData.slice(0, 10)); // 只显示前10条数据
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 组件挂载时获取数据
  useEffect(() => {
    fetchData();
  }, []);
  
  // 渲染列表项
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemId}>ID: {item.id}</Text>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemBody}>{item.body}</Text>
    </View>
  );
  
  // 渲染加载状态
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }
  
  // 渲染错误状态
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>错误: {error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={fetchData}
        >
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // 渲染数据列表
  return (
    <View style={styles.container}>
      <Text style={styles.title}>基本GET请求示例</Text>
      <Text style={styles.description}>使用fetch API获取帖子数据</Text>
      
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={fetchData}
      >
        <Text style={styles.refreshButtonText}>刷新数据</Text>
      </TouchableOpacity>
      
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>没有数据</Text>
        }
      />
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
    marginBottom: 16,
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  itemBody: {
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

export default BasicFetchExample;
```

### POST请求示例

```jsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';

function PostRequestExample() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  
  // 模拟API地址
  const API_URL = 'https://jsonplaceholder.typicode.com/posts';
  
  // 发送POST请求的函数
  const submitPost = async () => {
    // 表单验证
    if (!title.trim() || !body.trim()) {
      Alert.alert('错误', '标题和内容不能为空');
      return;
    }
    
    setLoading(true);
    setResponse(null);
    
    try {
      // 准备请求数据
      const postData = {
        title: title.trim(),
        body: body.trim(),
        userId: 1, // 模拟用户ID
      };
      
      // 发送POST请求
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 可以添加其他请求头
          // 'Authorization': 'Bearer your-token-here',
        },
        body: JSON.stringify(postData),
      });
      
      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // 解析JSON响应
      const jsonResponse = await response.json();
      setResponse(jsonResponse);
      
      // 显示成功消息
      Alert.alert('成功', '帖子创建成功');
      
      // 清空表单
      setTitle('');
      setBody('');
    } catch (err) {
      Alert.alert('错误', `发送请求失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>POST请求示例</Text>
      <Text style={styles.description}>创建新帖子</Text>
      
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>标题</Text>
          <TextInput
            style={styles.input}
            placeholder="输入帖子标题"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>内容</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="输入帖子内容"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={submitPost}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? '发送中...' : '提交帖子'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* 显示响应数据 */}
      {response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseTitle}>服务器响应:</Text>
          <Text style={styles.responseItem}>ID: {response.id}</Text>
          <Text style={styles.responseItem}>标题: {response.title}</Text>
          <Text style={styles.responseItem}>内容: {response.body}</Text>
          <Text style={styles.responseItem}>用户ID: {response.userId}</Text>
        </View>
      )}
    </KeyboardAvoidingView>
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
  form: {
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
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#a0cfff',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  responseContainer: {
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
  responseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  responseItem: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
});

export default PostRequestExample;
```

### PUT/PATCH/DELETE请求

除了GET和POST，fetch API还支持其他HTTP方法，如PUT、PATCH和DELETE。

```jsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';

function AdvancedHttpMethods() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [operation, setOperation] = useState(null);
  
  // 模拟API地址
  const API_URL = 'https://jsonplaceholder.typicode.com/posts';
  
  // 获取初始帖子数据
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?_limit=5`);
      if (!response.ok) throw new Error('获取数据失败');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      Alert.alert('错误', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 组件挂载时获取数据
  React.useEffect(() => {
    fetchInitialData();
  }, []);
  
  // 执行PUT请求（更新整个资源）
  const handlePutRequest = async (postId) => {
    setLoading(true);
    setOperation('PUT');
    
    try {
      const updatedPost = {
        id: postId,
        title: '更新后的标题 (PUT)',
        body: '这是使用PUT方法更新的完整内容。PUT通常用于替换整个资源。',
        userId: 1
      };
      
      const response = await fetch(`${API_URL}/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPost),
      });
      
      if (!response.ok) throw new Error('更新失败');
      
      const result = await response.json();
      setSelectedPost(result);
      
      // 更新本地数据
      setPosts(prevPosts => 
        prevPosts.map(post => post.id === postId ? result : post)
      );
      
      Alert.alert('成功', '使用PUT方法更新帖子成功');
    } catch (error) {
      Alert.alert('错误', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 执行PATCH请求（部分更新）
  const handlePatchRequest = async (postId) => {
    setLoading(true);
    setOperation('PATCH');
    
    try {
      // 只更新部分字段
      const updatedFields = {
        title: '部分更新的标题 (PATCH)'
      };
      
      const response = await fetch(`${API_URL}/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFields),
      });
      
      if (!response.ok) throw new Error('更新失败');
      
      const result = await response.json();
      setSelectedPost(result);
      
      // 更新本地数据
      setPosts(prevPosts => 
        prevPosts.map(post => post.id === postId ? result : post)
      );
      
      Alert.alert('成功', '使用PATCH方法更新帖子成功');
    } catch (error) {
      Alert.alert('错误', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 执行DELETE请求
  const handleDeleteRequest = async (postId) => {
    // 显示确认对话框
    Alert.alert(
      '确认删除',
      '确定要删除这篇帖子吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setOperation('DELETE');
            
            try {
              const response = await fetch(`${API_URL}/${postId}`, {
                method: 'DELETE'
              });
              
              if (!response.ok) throw new Error('删除失败');
              
              // 从本地数据中移除
              setPosts(prevPosts => 
                prevPosts.filter(post => post.id !== postId)
              );
              
              Alert.alert('成功', '帖子删除成功');
            } catch (error) {
              Alert.alert('错误', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // 渲染列表项
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemId}>ID: {item.id}</Text>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemBody}>{item.body}</Text>
      
      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          style={[styles.button, styles.putButton]}
          onPress={() => handlePutRequest(item.id)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>PUT</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.patchButton]}
          onPress={() => handlePatchRequest(item.id)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>PATCH</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDeleteRequest(item.id)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>DELETE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>高级HTTP方法</Text>
      <Text style={styles.description}>演示PUT、PATCH和DELETE请求</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            执行{operation}请求中...
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={loading && !operation}
          onRefresh={fetchInitialData}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>没有帖子数据</Text>
              <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={fetchInitialData}
              >
                <Text style={styles.refreshButtonText}>重新加载</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      
      {/* 显示操作结果 */}
      {selectedPost && operation && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>
            {operation}操作结果:
          </Text>
          <Text style={styles.resultItem}>ID: {selectedPost.id}</Text>
          <Text style={styles.resultItem}>标题: {selectedPost.title}</Text>
          <Text style={styles.resultItem}>用户ID: {selectedPost.userId}</Text>
        </View>
      )}
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
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
  item: {
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
  itemId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  itemBody: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  putButton: {
    backgroundColor: '#34c759', // 绿色
  },
  patchButton: {
    backgroundColor: '#ff9500', // 橙色
  },
  deleteButton: {
    backgroundColor: '#ff3b30', // 红色
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultContainer: {
    backgroundColor: '#e6f7ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#91d5ff',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 8,
  },
  resultItem: {
    fontSize: 16,
    color: '#0066cc',
    marginBottom: 4,
  },
});

export default AdvancedHttpMethods;
```

## 使用Axios库

Axios是一个流行的HTTP客户端库，它提供了许多有用的功能，如拦截器、请求取消、自动转换JSON数据等。

### 安装Axios

```bash
npm install axios
```

### Axios基本用法

```jsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';

function AxiosBasicExample() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 模拟API地址
  const API_URL = 'https://jsonplaceholder.typicode.com/users';
  
  // 配置axios实例
  const api = axios.create({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 10000, // 10秒超时
    headers: {
      'Content-Type': 'application/json',
      // 可以添加其他默认头
    }
  });
  
  // 获取用户数据
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 使用axios发送GET请求
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      setError(
        err.response ? 
        `服务器错误: ${err.response.status}` : 
        (err.request ? '网络错误，请检查您的连接' : err.message)
      );
    } finally {
      setLoading(false);
    }
  };
  
  // 组件挂载时获取数据
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // 渲染用户项
  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
      <Text style={styles.userPhone}>{item.phone}</Text>
      <Text style={styles.userCompany}>{item.company.name}</Text>
      <Text style={styles.userWebsite}>{item.website}</Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Axios基本示例</Text>
      <Text style={styles.description}>使用Axios获取用户数据</Text>
      
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={fetchUsers}
        disabled={loading}
      >
        <Text style={styles.refreshButtonText}>
          {loading ? '加载中...' : '刷新用户'}
        </Text>
      </TouchableOpacity>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>加载用户数据...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={fetchUsers}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>没有用户数据</Text>
          }
        />
      )}
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
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  userCompany: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
  },
  userWebsite: {
    fontSize: 16,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
});

export default AxiosBasicExample;
```

### Axios拦截器

拦截器是Axios的强大功能，它允许你在请求发送前或响应返回后执行一些操作。

```jsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';

function AxiosInterceptorsExample() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(null);
  const [lastResponseTime, setLastResponseTime] = useState(null);
  
  // 创建axios实例
  const api = axios.create({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  // 请求拦截器
  api.interceptors.request.use(
    (config) => {
      // 在发送请求前做些什么
      console.log('发送请求:', config.method.toUpperCase(), config.url);
      setRequestCount(prev => prev + 1);
      setLastRequestTime(new Date().toLocaleTimeString());
      
      // 可以在这里添加认证token
      // config.headers.Authorization = `Bearer ${your_token}`;
      
      return config;
    },
    (error) => {
      // 处理请求错误
      console.error('请求错误:', error);
      return Promise.reject(error);
    }
  );
  
  // 响应拦截器
  api.interceptors.response.use(
    (response) => {
      // 对响应数据做点什么
      console.log('收到响应:', response.status, response.config.url);
      setResponseCount(prev => prev + 1);
      setLastResponseTime(new Date().toLocaleTimeString());
      
      return response;
    },
    (error) => {
      // 处理响应错误
      console.error('响应错误:', error);
      return Promise.reject(error);
    }
  );
  
  // 获取待办事项
  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/todos?_limit=10');
      setTodos(response.data);
    } catch (err) {
      setError(
        err.response ? 
        `服务器错误: ${err.response.status}` : 
        (err.request ? '网络错误' : err.message)
      );
    } finally {
      setLoading(false);
    }
  };
  
  // 组件挂载时获取数据
  useEffect(() => {
    fetchTodos();
  }, []);
  
  // 渲染待办项
  const renderTodo = ({ item }) => (
    <View style={styles.todoItem}>
      <View style={[styles.checkbox, item.completed && styles.checkedBox]}>
        {item.completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.todoTitle, item.completed && styles.completedTodo]}>
        {item.title}
      </Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Axios拦截器示例</Text>
      <Text style={styles.description}>演示请求和响应拦截器</Text>
      
      {/* 拦截器统计信息 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>请求次数</Text>
          <Text style={styles.statValue}>{requestCount}</Text>
          {lastRequestTime && (
            <Text style={styles.statTime}>上次: {lastRequestTime}</Text>
          )}
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>响应次数</Text>
          <Text style={styles.statValue}>{responseCount}</Text>
          {lastResponseTime && (
            <Text style={styles.statTime}>上次: {lastResponseTime}</Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={fetchTodos}
        disabled={loading}
      >
        <Text style={styles.refreshButtonText}>
          {loading ? '加载中...' : '获取待办事项'}
        </Text>
      </TouchableOpacity>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={fetchTodos}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={todos}
          renderItem={renderTodo}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>没有待办事项</Text>
          }
        />
      )}
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
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statTime: {
    fontSize: 12,
    color: '#999',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  todoTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  completedTodo: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
});

export default AxiosInterceptorsExample;
```

## 文件上传

React Native支持使用fetch API或Axios进行文件上传。

### 使用fetch上传文件

```jsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

function FileUploadExample() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  
  // 请求媒体库权限
  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限被拒绝', '需要访问媒体库的权限来选择图片');
        return false;
      }
    }
    return true;
  };
  
  // 选择图片
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
        setSelectedImage(result.assets[0]);
        setUploadResult(null);
        setUploadProgress(0);
      }
    } catch (error) {
      Alert.alert('错误', '选择图片时出错: ' + error.message);
    }
  };
  
  // 上传图片
  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert('错误', '请先选择一张图片');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // 创建FormData对象
      const formData = new FormData();
      
      // 根据平台处理文件
      if (Platform.OS === 'web') {
        // Web平台处理
        const response = await fetch(selectedImage.uri);
        const blob = await response.blob();
        formData.append('image', blob, 'photo.jpg');
      } else {
        // 移动平台处理
        formData.append('image', {
          uri: selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          name: selectedImage.fileName || 'photo.jpg',
        });
      }
      
      // 添加其他表单字段
      formData.append('title', '上传的图片');
      formData.append('description', '通过React Native应用上传');
      
      // 模拟上传进度
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
          }
          setUploadProgress(Math.round(progress));
        }, 300);
        return interval;
      };
      
      const progressInterval = simulateProgress();
      
      // 注意：在实际应用中，这里应该是你的真实API端点
      // 这里使用jsonplaceholder的POST接口模拟，它不支持真正的文件上传
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
          // 注意：文件上传时不要设置Content-Type为application/json
          // 浏览器会自动设置正确的Content-Type和boundary
        },
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        throw new Error(`服务器错误: ${response.status}`);
      }
      
      const data = await response.json();
      setUploadResult(data);
      Alert.alert('成功', '图片上传成功！');
    } catch (error) {
      Alert.alert('上传失败', '上传图片时出错: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>文件上传示例</Text>
      <Text style={styles.description}>选择并上传图片</Text>
      
      <View style={styles.imageContainer}>
        {selectedImage ? (
          <Image 
            source={{ uri: selectedImage.uri }} 
            style={styles.selectedImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>没有选择图片</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.pickButton}
        onPress={pickImage}
        disabled={uploading}
      >
        <Text style={styles.pickButtonText}>选择图片</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.uploadButton, 
          (!selectedImage || uploading) && styles.disabledButton
        ]}
        onPress={uploadImage}
        disabled={!selectedImage || uploading}
      >
        <Text style={styles.uploadButtonText}>
          {uploading ? '上传中...' : '上传图片'}
        </Text>
      </TouchableOpacity>
      
      {/* 上传进度 */}
      {uploading && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${uploadProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{uploadProgress}%</Text>
        </View>
      )}
      
      {/* 上传结果 */}
      {uploadResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>上传结果:</Text>
          <Text style={styles.resultItem}>ID: {uploadResult.id}</Text>
          <Text style={styles.resultItem}>标题: {uploadResult.title}</Text>
          <Text style={styles.resultItem}>状态: 上传成功</Text>
        </View>
      )}
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
    width: '100%',
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
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
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  pickButton: {
    backgroundColor: '#ff9500',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  pickButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  uploadButton: {
    backgroundColor: '#34c759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: '#e6f7ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#91d5ff',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 8,
  },
  resultItem: {
    fontSize: 16,
    color: '#0066cc',
    marginBottom: 4,
  },
});

export default FileUploadExample;
```

## 网络请求最佳实践

### 1. 错误处理

```jsx
// 统一错误处理函数
const handleApiError = (error) => {
  if (error.response) {
    // 服务器返回错误状态码
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return { message: '请求参数错误', details: data };
      case 401:
        // 处理未授权，可能需要重新登录
        // authService.logout();
        return { message: '未授权，请重新登录' };
      case 403:
        return { message: '没有权限访问此资源' };
      case 404:
        return { message: '请求的资源不存在' };
      case 500:
        return { message: '服务器内部错误' };
      default:
        return { message: `服务器错误 (${status})` };
    }
  } else if (error.request) {
    // 请求已发送但没有收到响应
    return { message: '网络连接错误，服务器无响应' };
  } else {
    // 请求配置时发生错误
    return { message: `请求错误: ${error.message}` };
  }
};

// 使用示例
try {
  const response = await api.get('/data');
  return response.data;
} catch (error) {
  const errorInfo = handleApiError(error);
  Alert.alert('错误', errorInfo.message);
  throw errorInfo;
}
```

### 2. 缓存策略

```jsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// 带缓存的API请求
const fetchWithCache = async (url, options = {}, cacheKey, cacheTime = 5 * 60 * 1000) => { // 默认缓存5分钟
  try {
    // 检查缓存
    const cachedData = await AsyncStorage.getItem(cacheKey);
    const cachedTimestamp = await AsyncStorage.getItem(`${cacheKey}_timestamp`);
    
    if (cachedData && cachedTimestamp) {
      const now = new Date().getTime();
      const cacheAge = now - parseInt(cachedTimestamp, 10);
      
      // 如果缓存未过期，返回缓存数据
      if (cacheAge < cacheTime) {
        console.log('使用缓存数据:', cacheKey);
        return JSON.parse(cachedData);
      }
    }
    
    // 缓存过期或不存在，发起新请求
    console.log('发起新请求:', url);
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
    const data = await response.json();
    
    // 保存到缓存
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    await AsyncStorage.setItem(`${cacheKey}_timestamp`, new Date().getTime().toString());
    
    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    
    // 如果请求失败，尝试返回过期缓存
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) {
      console.log('请求失败，使用过期缓存:', cacheKey);
      return JSON.parse(cachedData);
    }
    
    throw error;
  }
};

// 使用示例
const fetchUsers = async () => {
  return await fetchWithCache(
    'https://jsonplaceholder.typicode.com/users',
    {},
    'users_cache',
    10 * 60 * 1000 // 缓存10分钟
  );
};
```

### 3. 请求取消

```jsx
import axios from 'axios';

// 创建取消令牌源
const cancelTokenSource = axios.CancelToken.source();

// 发起可取消的请求
const makeCancellableRequest = async () => {
  try {
    const response = await axios.get('https://jsonplaceholder.typicode.com/posts', {
      cancelToken: cancelTokenSource.token
    });
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('请求已被取消:', error.message);
    } else {
      console.error('请求错误:', error);
    }
    throw error;
  }
};

// 取消请求
const cancelRequest = () => {
  cancelTokenSource.cancel('用户取消了请求');
};

// 在React组件中使用
function CancellableRequestExample() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  
  // 使用useRef保存取消令牌源，避免重新渲染时创建新实例
  const cancelTokenSourceRef = useRef(null);
  
  // 组件卸载时取消请求
  useEffect(() => {
    return () => {
      if (cancelTokenSourceRef.current) {
        cancelTokenSourceRef.current.cancel('组件已卸载');
      }
    };
  }, []);
  
  const fetchData = async () => {
    // 取消之前的请求
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel('发起了新请求');
    }
    
    // 创建新的取消令牌源
    cancelTokenSourceRef.current = axios.CancelToken.source();
    
    setLoading(true);
    
    try {
      const response = await axios.get('https://jsonplaceholder.typicode.com/posts', {
        cancelToken: cancelTokenSourceRef.current.token
      });
      setData(response.data);
    } catch (error) {
      if (!axios.isCancel(error)) {
        Alert.alert('错误', '获取数据失败');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const cancelFetch = () => {
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel('用户取消了请求');
      setLoading(false);
    }
  };
  
  return (
    <View>
      <Button 
        title="获取数据" 
        onPress={fetchData} 
        disabled={loading}
      />
      <Button 
        title="取消请求" 
        onPress={cancelFetch} 
        disabled={!loading}
      />
      {/* 渲染数据 */}
    </View>
  );
}
```

### 4. 超时处理

```jsx
// 使用fetch API的超时处理
const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('请求超时')), timeout)
    )
  ]);
};

// 使用示例
try {
  const response = await fetchWithTimeout('https://jsonplaceholder.typicode.com/posts', {}, 5000);
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  const data = await response.json();
  return data;
} catch (error) {
  if (error.message === '请求超时') {
    Alert.alert('超时', '网络请求超时，请检查您的网络连接');
  } else {
    Alert.alert('错误', '获取数据失败: ' + error.message);
  }
}

// Axios的超时设置
const api = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json'
  }
});
```

## 总结

本章介绍了React Native中网络请求的多种实现方式和最佳实践：

1. **内置fetch API**：
   - 支持各种HTTP方法（GET, POST, PUT, PATCH, DELETE）
   - 处理JSON数据和表单数据
   - 适用于基本的网络请求需求

2. **Axios库**：
   - 提供更丰富的功能和更好的开发体验
   - 支持请求/响应拦截器
   - 自动转换JSON数据
   - 更优雅的错误处理

3. **文件上传**：
   - 使用FormData处理文件上传
   - 适配不同平台（iOS, Android, Web）
   - 显示上传进度

4. **最佳实践**：
   - 统一的错误处理策略
   - 实现数据缓存机制
   - 支持请求取消
   - 设置合理的超时时间
   - 处理网络状态变化

选择合适的网络请求方式取决于你的项目需求、团队熟悉度和性能要求。对于大多数React Native项目，Axios是一个很好的选择，它提供了丰富的功能和良好的开发体验。

## 下一步

现在你已经学习了React Native的网络请求，接下来你可以学习：

- [原生模块](./07-native-modules.md) - 学习如何集成原生功能
- [性能优化](./08-performance-optimization.md) - 学习如何优化React Native应用性能