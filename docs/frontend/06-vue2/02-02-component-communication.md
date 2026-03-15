---
title: "组件通信"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "Vue 组件之间的通信有多种方式，根据不同的场景选择合适的方法。 父组件中在子组件的标签中绑定属性，即传递数据 子组件中使用props接受数据 Props 是单向的，子组件不应该直接修改 props。 应该通过 $emit 通知父组件更新。..."
---

# 组件通信

Vue 组件之间的通信有多种方式，根据不同的场景选择合适的方法。

## 1、父组件 → 子组件（Props）
>[!tip]
>1. 父组件中在子组件的标签中绑定属性，即传递数据
>2. 子组件中使用`props`接受数据

### 1.1、基本用法
:::details 父组件
```vue
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
:::

:::details 子组件
```vue
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
:::


### 1.2、字段校验
:::details Props传值 字段校验
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
:::

### 1.3、单向数据流

::: tip 单向数据流
- Props 是单向的，子组件不应该直接修改 props。
- 应该通过 `$emit` 通知父组件更新。
:::

::: details 错误示例
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
:::

:::details 正确示例
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
:::
## 2、子组件 → 父组件（$emit）

### 2.1、基本用法
:::details 子组件
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
:::
:::details 父组件
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
:::

### 2.2、.sync 修饰符（双向绑定）

:::tip
1. Vue 2 提供的一个语法糖，简化了父子组件之间双向绑定数据的操作。
2. Vue 会自动为这个 `prop` 添加一个更新事件监听，事件名称为 `update:propName`。
3. 在父组件中，使用 .sync 修饰符来绑定一个数据到子组件的 prop 上。
4. 在子组件中，需要修改这个 prop 时，触发一个 `update:propName` 事件，并传递新值。
:::

单个`prop`使用`.sync`
::: details 父组件
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
:::

:::details 子组件
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
:::

多个 `prop` 使用 `.sync`
:::details 父组件中多prop
```vue
<template>
  <child-component 
    :name.sync="user.name"
    :age.sync="user.age"
  ></child-component>
</template>

<script>
export default {
  data() {
    return {
      user: {
        name: '张三',
        age: 20
      }
    }
  }
}
</script>
```
:::

:::details 子组件中多prop
```vue
<template>
  <div>
    <input :value="name" @input="$emit('update:name', $event.target.value)">
    <input type="number" :value="age" @input="$emit('update:age', $event.target.value)">
  </div>
</template>

<script>
export default {
  props: ['name', 'age']
}
</script>
```
:::


## 3、兄弟组件通信

### 3.1、方式1：通过父组件中转

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

### 3.2、方式2：使用事件总线

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

### 3.3、方式3：使用 Vuex

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

## 4、跨级组件通信

### 4.1、provide / inject

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


## 5、通信方式总结

| 通信方式 | 适用场景 | 优点 | 缺点 |
|---------|---------|------|------|
| **Props** | 父→子 | 简单直接 | 只能父→子 |
| **$emit** | 子→父 | 简单直接 | 只能子→父 |
| **事件总线** | 任意组件 | 灵活 | 难以追踪，不推荐 |
| **Vuex** | 复杂应用 | 集中管理，可追踪 | 增加复杂度 |
| **provide/inject** | 跨级组件 | 避免逐层传递 | 耦合度高 |
