# 5.4 严格模式与插件开发

## 5.4.1 严格模式

启用严格模式后，任何非 mutation 函数中修改 state 都会抛出错误：

```javascript
export default new Vuex.Store({
  strict: true,  // 开发环境启用
  state: {
    count: 0
  }
})
```

**注意**：生产环境不要启用严格模式，会影响性能。

```javascript
const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production'
})
```

## 插件

Vuex 插件是一个函数，接收 store 作为参数：

```javascript
const myPlugin = store => {
  // 在 store 初始化时调用
  store.subscribe((mutation, state) => {
    // 每次 mutation 之后调用
    console.log(mutation.type, mutation.payload)
  })
}

export default new Vuex.Store({
  plugins: [myPlugin]
})
```

## 5.4.3 插件示例

### 5.4.3.1 持久化插件

```javascript
const persistPlugin = store => {
  // 从 localStorage 恢复状态
  const savedState = localStorage.getItem('vuex-state')
  if (savedState) {
    store.replaceState(JSON.parse(savedState))
  }
  
  // 保存状态到 localStorage
  store.subscribe((mutation, state) => {
    localStorage.setItem('vuex-state', JSON.stringify(state))
  })
}
```

### 5.4.3.2 日志插件

```javascript
const loggerPlugin = store => {
  store.subscribe((mutation, state) => {
    console.group(mutation.type)
    console.log('payload:', mutation.payload)
    console.log('state:', state)
    console.groupEnd()
  })
}
```

## 5.4.4 总结

- 严格模式用于开发环境，确保状态修改的正确性
- 插件可以扩展 Vuex 功能
- 常见插件：持久化、日志、时间旅行等
