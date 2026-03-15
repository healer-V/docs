---
title: "3.1 响应式原理深入"
category: "前端 · Vue 2"
tags:
  - Vue
  - React
excerpt: "Vue 2 的响应式系统基于 Object.defineProperty 实现，理解其原理有助于更好地使用 Vue。 Object.defineProperty 可以定义或修改对象的属性描述符： Vue 2 通过 Object.define..."
---

# 3.1 响应式原理深入

Vue 2 的响应式系统基于 `Object.defineProperty` 实现，理解其原理有助于更好地使用 Vue。

## 3.1.1 Object.defineProperty

`Object.defineProperty` 可以定义或修改对象的属性描述符：

```javascript
const obj = {}
let value = 'hello'

Object.defineProperty(obj, 'message', {
  get() {
    console.log('获取值')
    return value
  },
  set(newValue) {
    console.log('设置值:', newValue)
    value = newValue
  }
})

obj.message  // 输出: '获取值'
obj.message = 'world'  // 输出: '设置值: world'
```

## 3.1.2 Vue 2 响应式原理

### 3.1.2.1 基本原理

Vue 2 通过 `Object.defineProperty` 将 data 中的属性转换为 getter/setter：

```javascript
// 简化版实现
function defineReactive(obj, key, val) {
  const dep = new Dep()  // 依赖收集器
  
  Object.defineProperty(obj, key, {
    get() {
      // 收集依赖
      if (Dep.target) {
        dep.depend()
      }
      return val
    },
    set(newVal) {
      if (newVal === val) return
      val = newVal
      // 通知更新
      dep.notify()
    }
  })
}
```

### 3.1.2.2 响应式流程

```
1. 初始化：遍历 data，使用 Object.defineProperty 转换属性
2. 依赖收集：在 getter 中收集依赖（Watcher）
3. 触发更新：在 setter 中通知所有依赖更新
4. 视图更新：Watcher 执行更新函数，更新视图
```

## 3.1.3 响应式限制

### 3.1.3.1 对象属性的添加和删除

Vue 无法检测对象属性的添加或删除：

```javascript
// ❌ 不会触发更新
this.obj.newProperty = 'value'
delete this.obj.property
```

**解决方案**：

```javascript
// ✅ 使用 Vue.set 或 this.$set
Vue.set(this.obj, 'newProperty', 'value')
this.$set(this.obj, 'newProperty', 'value')

// ✅ 使用 Object.assign
this.obj = Object.assign({}, this.obj, { newProperty: 'value' })
```

### 3.1.3.2 数组索引和长度

Vue 无法检测数组索引的直接赋值和长度修改：

```javascript
// ❌ 不会触发更新
this.items[0] = 'new value'
this.items.length = 2
```

**解决方案**：

```javascript
// ✅ 使用 Vue.set
Vue.set(this.items, 0, 'new value')

// ✅ 使用数组方法
this.items.splice(0, 1, 'new value')
```

### 3.1.3.3 数组的响应式方法

Vue 包装了以下数组方法，可以触发更新：

- `push()`
- `pop()`
- `shift()`
- `unshift()`
- `splice()`
- `sort()`
- `reverse()`

```javascript
// ✅ 会触发更新
this.items.push('new item')
this.items.splice(0, 1)
```

## 3.1.4 深入理解

### 3.1.4.1 依赖收集

```javascript
// 简化版 Watcher
class Watcher {
  constructor(vm, exp, cb) {
    this.vm = vm
    this.exp = exp
    this.cb = cb
    this.value = this.get()
  }
  
  get() {
    Dep.target = this  // 设置当前 Watcher
    const value = this.vm.data[this.exp]  // 触发 getter
    Dep.target = null  // 清除
    return value
  }
  
  update() {
    const newValue = this.vm.data[this.exp]
    if (newValue !== this.value) {
      this.value = newValue
      this.cb(newValue)
    }
  }
}
```

### 3.1.4.2 观察者模式

Vue 的响应式系统基于观察者模式：

```javascript
// 依赖收集器
class Dep {
  constructor() {
    this.subs = []  // 订阅者列表
  }
  
  depend() {
    if (Dep.target) {
      this.subs.push(Dep.target)
    }
  }
  
  notify() {
    this.subs.forEach(watcher => watcher.update())
  }
}
```

## 3.1.5 实际应用

### 3.1.5.1 示例1：动态添加响应式属性

```vue
<script>
export default {
  data() {
    return {
      user: {
        name: '张三'
      }
    }
  },
  methods: {
    addAge() {
      // ✅ 正确方式
      this.$set(this.user, 'age', 20)
    },
    addProperty() {
      // ✅ 使用 Object.assign
      this.user = Object.assign({}, this.user, {
        email: 'zhang@example.com'
      })
    }
  }
}
</script>
```

### 3.1.5.2 示例2：数组更新

```vue
<script>
export default {
  data() {
    return {
      items: ['a', 'b', 'c']
    }
  },
  methods: {
    updateItem(index, value) {
      // ✅ 正确方式
      this.$set(this.items, index, value)
      // 或
      this.items.splice(index, 1, value)
    },
    addItem(item) {
      // ✅ 使用数组方法
      this.items.push(item)
    }
  }
}
</script>
```

## 3.1.6 Vue 2 vs Vue 3

| 特性 | Vue 2 | Vue 3 |
|------|-------|-------|
| **实现方式** | Object.defineProperty | Proxy |
| **对象属性** | 需要 $set | 自动检测 |
| **数组索引** | 需要 $set | 自动检测 |
| **性能** | 较好 | 更好 |

## 3.1.7 总结

- Vue 2 使用 `Object.defineProperty` 实现响应式
- 通过 getter 收集依赖，setter 触发更新
- 对象属性添加/删除需要使用 `$set`
- 数组索引修改需要使用 `$set` 或数组方法
- 理解响应式原理有助于避免常见问题
