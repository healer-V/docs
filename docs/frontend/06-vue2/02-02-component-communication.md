# 2.2 组件通信

Vue 组件之间的通信有多种方式，根据不同的场景选择合适的方法。

## 2.2.1 父组件 → 子组件（Props）

### 2.2.1.1 基本用法

```vue
<!-- 父组件 -->
<template>
  <div>
    <ChildComponent :message="parentMessage" />
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
      parentMessage: '来自父组件的数据'
    }
  }
}
</script>
```

```vue
<!-- 子组件 -->
<template>
  <div>
    <p>{{ message }}</p>
  </div>
</template>

<script>
export default {
  props: {
    message: String
  }
}
</script>
```

### 2.2.1.2 Props 验证

```vue
<script>
export default {
  props: {
    // 基础类型检查
    propA: Number,
    
    // 多种类型
    propB: [String, Number],
    
    // 必填且指定类型
    propC: {
      type: String,
      required: true
    },
    
    // 带默认值
    propD: {
      type: Number,
      default: 100
    },
    
    // 对象/数组的默认值必须从函数返回
    propE: {
      type: Object,
      default() {
        return { message: 'hello' }
      }
    },
    
    // 自定义验证函数
    propF: {
      validator(value) {
        return ['success', 'warning', 'danger'].includes(value)
      }
    }
  }
}
</script>
```

### 2.2.1.3 单向数据流

::: tip 单向数据流
Props 是单向的，子组件不应该直接修改 props。应该通过 `$emit` 通知父组件更新。
:::

```vue
<!-- ❌ 错误做法 -->
<script>
export default {
  props: ['count'],
  methods: {
    increment() {
      this.count++  // 不要这样做
    }
  }
}
</script>
```

```vue
<!-- ✅ 正确做法 -->
<script>
export default {
  props: ['count'],
  data() {
    return {
      localCount: this.count
    }
  },
  methods: {
    increment() {
      this.localCount++
      this.$emit('update:count', this.localCount)
    }
  }
}
</script>
```

## 2.2.2 子组件 → 父组件（$emit）

### 2.2.2.1 基本用法

```vue
<!-- 子组件 -->
<template>
  <div>
    <button @click="sendData">发送数据</button>
  </div>
</template>

<script>
export default {
  methods: {
    sendData() {
      this.$emit('data-sent', { message: 'Hello' })
    }
  }
}
</script>
```

```vue
<!-- 父组件 -->
<template>
  <div>
    <ChildComponent @data-sent="handleData" />
    <p>{{ receivedData }}</p>
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
      receivedData: null
    }
  },
  methods: {
    handleData(data) {
      this.receivedData = data
    }
  }
}
</script>
```

### 2.2.2.2 .sync 修饰符（双向绑定）

```vue
<!-- 父组件 -->
<template>
  <div>
    <ChildComponent :count.sync="count" />
    <p>父组件 count: {{ count }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0
    }
  }
}
</script>
```

```vue
<!-- 子组件 -->
<template>
  <div>
    <button @click="updateCount">更新计数</button>
  </div>
</template>

<script>
export default {
  props: ['count'],
  methods: {
    updateCount() {
      this.$emit('update:count', this.count + 1)
    }
  }
}
</script>
```

## 2.2.3 兄弟组件通信

### 2.2.3.1 方式1：通过父组件中转

```vue
<!-- 父组件 -->
<template>
  <div>
    <ComponentA @send-data="handleData" />
    <ComponentB :data="sharedData" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      sharedData: null
    }
  },
  methods: {
    handleData(data) {
      this.sharedData = data
    }
  }
}
</script>
```

### 2.2.3.2 方式2：使用事件总线

```javascript
// eventBus.js
import Vue from 'vue'
export default new Vue()
```

```vue
<!-- ComponentA.vue -->
<script>
import eventBus from './eventBus'

export default {
  methods: {
    sendData() {
      eventBus.$emit('data-sent', { message: 'Hello' })
    }
  }
}
</script>
```

```vue
<!-- ComponentB.vue -->
<script>
import eventBus from './eventBus'

export default {
  mounted() {
    eventBus.$on('data-sent', (data) => {
      console.log('收到数据:', data)
    })
  },
  beforeDestroy() {
    eventBus.$off('data-sent')
  }
}
</script>
```

### 2.2.3.3 方式3：使用 Vuex（状态管理）

```javascript
// store.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    sharedData: null
  },
  mutations: {
    setSharedData(state, data) {
      state.sharedData = data
    }
  }
})
```

```vue
<!-- ComponentA.vue -->
<script>
export default {
  methods: {
    sendData() {
      this.$store.commit('setSharedData', { message: 'Hello' })
    }
  }
}
</script>
```

```vue
<!-- ComponentB.vue -->
<template>
  <div>{{ sharedData }}</div>
</template>

<script>
export default {
  computed: {
    sharedData() {
      return this.$store.state.sharedData
    }
  }
}
</script>
```

## 2.2.4 跨级组件通信

### 2.2.4.1 provide / inject

```vue
<!-- 祖先组件 -->
<script>
export default {
  provide() {
    return {
      theme: 'dark',
      user: {
        name: '张三',
        age: 20
      }
    }
  }
}
</script>
```

```vue
<!-- 后代组件 -->
<script>
export default {
  inject: ['theme', 'user'],
  mounted() {
    console.log(this.theme)  // 'dark'
    console.log(this.user)    // { name: '张三', age: 20 }
  }
}
</script>
```

## 2.2.5 实际应用示例

### 2.2.5.1 示例：表单组件

```vue
<!-- Form.vue 父组件 -->
<template>
  <div>
    <FormInput 
      v-model="username" 
      label="用户名" 
      :rules="usernameRules"
    />
    <FormInput 
      v-model="email" 
      label="邮箱" 
      type="email"
      :rules="emailRules"
    />
    <button @click="submit">提交</button>
  </div>
</template>

<script>
import FormInput from './FormInput.vue'

export default {
  components: {
    FormInput
  },
  data() {
    return {
      username: '',
      email: '',
      usernameRules: [
        { required: true, message: '用户名不能为空' }
      ],
      emailRules: [
        { required: true, message: '邮箱不能为空' },
        { type: 'email', message: '邮箱格式不正确' }
      ]
    }
  },
  methods: {
    submit() {
      console.log('提交:', {
        username: this.username,
        email: this.email
      })
    }
  }
}
</script>
```

```vue
<!-- FormInput.vue 子组件 -->
<template>
  <div class="form-input">
    <label>{{ label }}</label>
    <input 
      :type="type" 
      :value="value"
      @input="$emit('input', $event.target.value)"
      @blur="validate"
    />
    <span v-if="error" class="error">{{ error }}</span>
  </div>
</template>

<script>
export default {
  name: 'FormInput',
  props: {
    value: String,
    label: String,
    type: {
      type: String,
      default: 'text'
    },
    rules: Array
  },
  data() {
    return {
      error: ''
    }
  },
  methods: {
    validate() {
      if (!this.rules) return
      
      for (let rule of this.rules) {
        if (rule.required && !this.value) {
          this.error = rule.message
          return
        }
        if (rule.type === 'email' && !this.isValidEmail(this.value)) {
          this.error = rule.message
          return
        }
      }
      this.error = ''
    },
    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }
  }
}
</script>

<style scoped>
.form-input {
  margin-bottom: 16px;
}

.error {
  color: red;
  font-size: 12px;
}
</style>
```

## 2.2.6 通信方式总结

| 通信方式 | 适用场景 | 优点 | 缺点 |
|---------|---------|------|------|
| **Props** | 父→子 | 简单直接 | 只能父→子 |
| **$emit** | 子→父 | 简单直接 | 只能子→父 |
| **事件总线** | 任意组件 | 灵活 | 难以追踪，不推荐 |
| **Vuex** | 复杂应用 | 集中管理，可追踪 | 增加复杂度 |
| **provide/inject** | 跨级组件 | 避免逐层传递 | 耦合度高 |

## 2.2.7 总结

::: tip 总结
- **父子组件**：使用 Props 和 $emit
- **兄弟组件**：通过父组件中转或使用 Vuex
- **跨级组件**：使用 provide/inject 或 Vuex
- **复杂应用**：推荐使用 Vuex 进行状态管理
:::
