# 2.1 组件基础与注册方式

组件是 Vue 最强大的功能之一，可以将页面拆分为可复用的独立模块。

## 2.1.1 什么是组件

::: tip 组件定义
组件是可复用的 Vue 实例，具有自己的数据、方法和生命周期。组件可以嵌套、组合，形成复杂的应用结构。
:::

## 2.1.2 组件注册

### 2.1.2.1 全局注册

使用 `Vue.component()` 进行全局注册：

```javascript
// main.js
import Vue from 'vue'

Vue.component('my-component', {
  template: '<div>这是一个全局组件</div>'
})

new Vue({
  el: '#app'
})
```

```vue
<!-- 在任何组件中都可以使用 -->
<template>
  <div>
    <my-component></my-component>
  </div>
</template>
```

### 2.1.2.2 局部注册

在组件选项中注册：

```vue
<template>
  <div>
    <child-component></child-component>
  </div>
</template>

<script>
// 导入子组件
import ChildComponent from './ChildComponent.vue'

export default {
  name: 'ParentComponent',
  components: {
    // 局部注册
    ChildComponent
  }
}
</script>
```

### 2.1.2.3 组件命名

**推荐使用 PascalCase（大驼峰）命名**：

```vue
<script>
export default {
  name: 'MyComponent'  // ✅ 推荐
}
</script>
```

```vue
<template>
  <div>
    <MyComponent />  <!-- ✅ 推荐 -->
    <my-component />  <!-- ✅ 也可以，会自动转换 -->
  </div>
</template>
```

## 2.1.3 单文件组件

### 2.1.3.1 基本结构

```vue
<template>
  <!-- HTML 模板 -->
  <div class="my-component">
    <h1>{{ title }}</h1>
  </div>
</template>

<script>
// JavaScript 逻辑
export default {
  name: 'MyComponent',
  data() {
    return {
      title: '我的组件'
    }
  }
}
</script>

<style scoped>
/* CSS 样式 */
.my-component {
  color: #333;
}
</style>
```

### 2.1.3.2 使用单文件组件

```vue
<!-- ParentComponent.vue -->
<template>
  <div>
    <ChildComponent />
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  components: {
    ChildComponent
  }
}
</script>
```

## 2.1.4 组件的数据

### 2.1.4.1 data 必须是函数

组件中的 `data` 必须是一个函数，返回一个对象：

```vue
<script>
export default {
  data() {
    return {
      message: 'Hello'
    }
  }
}
</script>
```

**为什么必须是函数**：
- 如果 `data` 是对象，所有组件实例会共享同一个数据对象
- 使用函数返回对象，每个组件实例都有独立的数据副本

## 2.1.5 组件通信

### 2.1.5.1 父组件向子组件传递数据（Props）

```vue
<!-- 父组件 -->
<template>
  <div>
    <ChildComponent :message="parentMessage" :count="count" />
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  components: {
    ChildComponent
  },
  data() {
    return {
      parentMessage: '来自父组件',
      count: 10
    }
  }
}
</script>
```

```vue
<!-- 子组件 ChildComponent.vue -->
<template>
  <div>
    <p>{{ message }}</p>
    <p>计数: {{ count }}</p>
  </div>
</template>

<script>
export default {
  props: {
    message: String,
    count: Number
  }
}
</script>
```

### 2.1.5.2 子组件向父组件传递数据（$emit）

```vue
<!-- 子组件 -->
<template>
  <div>
    <button @click="sendMessage">发送消息</button>
  </div>
</template>

<script>
export default {
  methods: {
    sendMessage() {
      this.$emit('message-sent', '来自子组件的消息')
    }
  }
}
</script>
```

```vue
<!-- 父组件 -->
<template>
  <div>
    <ChildComponent @message-sent="handleMessage" />
    <p>{{ receivedMessage }}</p>
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  components: {
    ChildComponent
  },
  data() {
    return {
      receivedMessage: ''
    }
  },
  methods: {
    handleMessage(message) {
      this.receivedMessage = message
    }
  }
}
</script>
```

## 组件示例

### 示例：按钮组件

```vue
<!-- Button.vue -->
<template>
  <button 
    :class="['btn', `btn-${type}`, { 'btn-disabled': disabled }]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>

<script>
export default {
  name: 'Button',
  props: {
    type: {
      type: String,
      default: 'default',
      validator(value) {
        return ['default', 'primary', 'danger'].includes(value)
      }
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleClick() {
      if (!this.disabled) {
        this.$emit('click')
      }
    }
  }
}
</script>

<style scoped>
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-default {
  background: #f0f0f0;
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-danger {
  background: #f56c6c;
  color: white;
}

.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

```vue
<!-- 使用按钮组件 -->
<template>
  <div>
    <Button type="primary" @click="handleClick">主要按钮</Button>
    <Button type="danger" :disabled="true">禁用按钮</Button>
  </div>
</template>

<script>
import Button from './Button.vue'

export default {
  components: {
    Button
  },
  methods: {
    handleClick() {
      alert('按钮被点击')
    }
  }
}
</script>
```

## 2.1.7 组件最佳实践

1. **单一职责**：每个组件只负责一个功能
2. **可复用性**：组件应该是可复用的
3. **命名规范**：使用 PascalCase 命名组件
4. **Props 验证**：为 props 添加类型和验证
5. **使用 scoped 样式**：避免样式污染

## 2.1.8 总结

- 组件是可复用的 Vue 实例
- 全局注册使用 `Vue.component()`
- 局部注册在 `components` 选项中
- 组件 `data` 必须是函数
- 使用 Props 传递数据给子组件
- 使用 `$emit` 向父组件传递数据
