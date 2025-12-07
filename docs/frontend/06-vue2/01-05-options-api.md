# 选项式API

## 1、计算属性（Computed）
::: tip
1. 计算属性是基于它们的响应式依赖进行缓存的。
2. 依赖的响应式 `property` 变化才会重新计算。
3. 如果某个依赖 非响应式，则计算属性是不会被更新的。
:::

### 1.1、函数形式（getter）

>[!note] 函数形式（只有 getter）
>1. **参数：**
>    - **无参数**：计算属性的 `getter` 函数不接受任何参数
>2. **返回值：**
>    - **类型**：任意类型
>    - **说明**：必须返回一个值，该值会被缓存，直到依赖的响应式数据发生变化



::: details 函数
```vue
<template>
  <div>
    <p>原始消息: {{ message }}</p>
    <p>反转消息: {{ reversedMessage }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue!'
    }
  },
  computed: {
    reversedMessage() {
      return this.message.split('').reverse().join('')
    }
  }
}
</script>
```

### 1.2、对象形式（getter | setter）
:::
>[!note] 对象形式（getter 和 setter）
>1. **getter 函数：**
>   - **参数**：无参数
>   - **返回值**：任意类型，必须返回一个值
>2. **setter 函数：**
>   - **参数**：
>      - `newValue`（必需）：计算属性被赋值时的新值
>      - **类型**：任意类型
>      - **说明**：当通过 `this.propertyName = value` 赋值时，`newValue` 就是传入的 `value`
>   - **返回值**：无返回值（`undefined`）


:::details 对象
```vue
<template>
  <div>
    <p>名字: {{ fullName }}</p>
    <button @click="fullName = '李四'">修改全名</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      firstName: '张',
      lastName: '三'
    }
  },
  computed: {
    fullName: {
      get() {
        return this.firstName + ' ' + this.lastName
      },
      set(newValue) {
        const names = newValue.split(' ')
        this.firstName = names[0]
        this.lastName = names[names.length - 1]
      }
    }
  }
}
</script>
```
:::


### 1.3、使用场景
:::tip 计算属性
- 需要基于现有数据计算新值
- 需要缓存结果
- 模板中需要显示计算后的值
:::

## 2、侦听器（Watch）
::: tip
1. 侦听器用于观察和响应 Vue 实例上的数据变动。
2. 依赖项改变则
:::
### 2.1、基本用法
>[!note] 函数形式
>**参数：**
>- **`newVal`**（必需）：数据变化后的新值
>   - **类型**：任意类型（与被监听的数据类型相同）
>   - **说明**：数据变化后的最新值
>- **`oldVal`**（必需）：数据变化前的旧值
>   - **类型**：任意类型（与被监听的数据类型相同）
>   - **说明**：数据变化前的值。**注意**：对于对象和数组，`oldVal` 和 `newVal` 指向同一个引用（因为 Vue 不会保留变化前的副本）
>
>**返回值：**
>    - **类型**：`undefined`（无返回值）
>    - **说明**：watch 回调函数不需要返回值


>[!note] 对象形式（带选项）
>**handler 函数参数：**
>- **`newVal`**（必需）：数据变化后的新值
>   - **类型**：任意类型
>   - **说明**：同方式一
>- **`oldVal`**（必需）：数据变化前的旧值
>   - **类型**：任意类型
>   - **说明**：同方式一。
>- **注意**：当 `immediate: true` 时，首次调用时 `oldVal` 为 `undefined`
>
>**handler 函数返回值：**
>- **类型**：`undefined`（无返回值）
>
>**配置选项：**
>- **`deep`**（可选）：布尔值
>   - **默认值**：`false`
>   - **说明**：设置为 `true` 时，会深度监听对象内部属性的变化
>- **`immediate`**（可选）：布尔值
>   - **默认值**：`false`
>   - **说明**：设置为 `true` 时，会在初始化时立即执行一次 handler，此时 `oldVal` 为 `undefined`



```vue
<template>
  <div>
    <input v-model="question" placeholder="输入问题">
    <p>{{ answer }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      question: '',
      answer: '请输入问题...'
    }
  },
  watch: {
    question(newQuestion, oldQuestion) {
      if (newQuestion.indexOf('?') > -1) {
        this.getAnswer()
      }
    }
  },
  methods: {
    getAnswer() {
      this.answer = '思考中...'
      // 模拟异步请求
      setTimeout(() => {
        this.answer = '这是答案'
      }, 1000)
    }
  }
}
</script>
```

### 2.2、深度监听

监听对象内部属性的变化：

```vue
<template>
  <div>
    <input v-model="user.name" placeholder="姓名">
    <input v-model="user.age" type="number" placeholder="年龄">
    <p>{{ userInfo }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {
        name: '张三',
        age: 20
      },
      userInfo: ''
    }
  },
  watch: {
    user: {
      handler(newVal, oldVal) {
        this.userInfo = `${newVal.name}，${newVal.age}岁`
      },
      deep: true,  // 深度监听
      immediate: true  // 立即执行一次
    }
  }
}
</script>
```

### 2.3、监听对象属性

```vue
<script>
export default {
  watch: {
    'user.name'(newVal, oldVal) {
      console.log('姓名从', oldVal, '变为', newVal)
    }
  }
}
</script>
```

### 2.4、使用 $watch API

```vue
<script>
export default {
  mounted() {
    // 创建侦听器
    this.unwatch = this.$watch('message', (newVal, oldVal) => {
      console.log('消息变化:', oldVal, '->', newVal)
    })
  },
  beforeDestroy() {
    // 取消侦听
    if (this.unwatch) {
      this.unwatch()
    }
  }
}
</script>
```
### 2.5、使用场景

::: tip watch
- 需要在数据变化时，执行异步操作。
- 需要在数据变化时，执行开销较大的操作。
- 需要监听数据变化时，执行副作用。

:::

## 3、directives（自定义指令）

::: tip 说明
1. 自定义指令用于对普通 DOM 元素进行底层操作
2. 可以全局注册或局部注册
3. 指令名必须以 `v-` 开头，使用时直接写指令名（如 `v-focus`）
4. 适合用于 DOM 操作、事件处理、权限控制等场景
:::

### 3.1、基本用法

#### 3.1.1、全局注册

**语法：**
```javascript
Vue.directive('directive-name', {
  // 钩子函数
})
```
:::tip
**参数说明：**
- **`directive-name`**（必需）：
  - **类型**：`String`
  - **说明**：指令名称，不需要包含 `v-` 前缀，使用时需要加 `v-` 前缀
  - **示例**：`'focus'` → 使用时为 `v-focus`
  
- **指令定义对象**（必需）：
  - **类型**：`Object`
  - **说明**：包含指令钩子函数的对象
:::
**示例：**

```javascript
// main.js
import Vue from 'vue'

// 注册全局指令
Vue.directive('focus', {
  inserted(el) {
    el.focus()
  }
})
```

```vue
<!-- 使用 -->
<template>
  <input v-focus>
</template>
```

#### 3.1.2、局部注册

**语法：**
```javascript
directives: {
  'directive-name': {
    // 钩子函数
  }
}
```
:::tip
**参数说明：**
- **`directive-name`**（必需）：
  - **类型**：`String`
  - **说明**：指令名称，不需要包含 `v-` 前缀
  - **注意**：可以使用驼峰命名（如 `myDirective`），使用时为 `v-my-directive`
:::
**示例：**

```vue
<template>
  <input v-focus>
</template>

<script>
export default {
  directives: {
    focus: {
      inserted(el) {
        el.focus()
      }
    }
  }
}
</script>
```

### 3.2、指令钩子函数

一个指令定义对象可以提供如下几个钩子函数：

**钩子函数列表：**

| 钩子函数 | 说明 | 调用时机 | 参数 |
|---------|------|---------|------|
| `bind` | 指令第一次绑定到元素时调用 | 只调用一次 | `el, binding, vnode` |
| `inserted` | 被绑定元素插入父节点时调用 | 只调用一次 | `el, binding, vnode` |
| `update` | 所在组件的 VNode 更新时调用 | 可能多次调用 | `el, binding, vnode, oldVnode` |
| `componentUpdated` | 指令所在组件的 VNode 及其子 VNode 全部更新后调用 | 可能多次调用 | `el, binding, vnode, oldVnode` |
| `unbind` | 只调用一次，指令与元素解绑时调用 | 只调用一次 | `el, binding, vnode` |

:::tip
**参数说明：**

- **`el`**（必需）：
  - **类型**：`HTMLElement`
  - **说明**：指令绑定的 DOM 元素，可以直接操作 DOM

- **`binding`**（必需）：
  - **类型**：`Object`
  - **说明**：包含指令信息的对象
  - **属性**：
    - `name`：指令名（不包含 `v-` 前缀）
    - `value`：指令的绑定值
    - `oldValue`：指令绑定的前一个值（仅在 `update` 和 `componentUpdated` 中可用）
    - `expression`：字符串形式的指令表达式
    - `arg`：传给指令的参数（如 `v-my-directive:foo` 中的 `foo`）
    - `modifiers`：一个包含修饰符的对象（如 `v-my-directive.foo.bar` 中的 `{ foo: true, bar: true }`）

- **`vnode`**（必需）：
  - **类型**：`VNode`
  - **说明**：Vue 编译生成的虚拟节点

- **`oldVnode`**（可选）：
  - **类型**：`VNode`
  - **说明**：上一个虚拟节点（仅在 `update` 和 `componentUpdated` 中可用）
:::

**示例：**

```javascript
Vue.directive('my-directive', {
  // 只调用一次，指令第一次绑定到元素时调用
  bind(el, binding, vnode) {
    // el: 指令绑定的元素
    // binding: 包含指令信息的对象
    // vnode: Vue 编译生成的虚拟节点
    console.log('bind:', binding.value)
  },
  
  // 被绑定元素插入父节点时调用
  inserted(el, binding, vnode) {
    // 此时可以访问父节点
    console.log('inserted:', binding.value)
  },
  
  // 所在组件的 VNode 更新时调用
  update(el, binding, vnode, oldVnode) {
    // 但是可能发生在其子 VNode 更新之前
    console.log('update:', binding.value, binding.oldValue)
  },
  
  // 指令所在组件的 VNode 及其子 VNode 全部更新后调用
  componentUpdated(el, binding, vnode, oldVnode) {
    console.log('componentUpdated:', binding.value)
  },
  
  // 只调用一次，指令与元素解绑时调用
  unbind(el, binding, vnode) {
    // 清理工作
    console.log('unbind')
  }
})
```

### 3.3、binding 对象详解

**binding 对象结构：**

```javascript
{
  name: 'directive-name',        // 指令名（不包含 v- 前缀）
  value: 'value',                // 指令的绑定值
  oldValue: 'old-value',          // 指令绑定的前一个值（仅在 update 和 componentUpdated 中可用）
  expression: 'expression',        // 字符串形式的指令表达式
  arg: 'arg',                     // 传给指令的参数
  modifiers: {                   // 一个包含修饰符的对象
    modifier1: true,
    modifier2: true
  }
}
```

**使用示例：**

```vue
<template>
  <div>
    <!-- 基本使用 -->
    <div v-my-directive="message"></div>
    <!-- binding.value = message 的值 -->
    
    <!-- 带参数 -->
    <div v-my-directive:arg="message"></div>
    <!-- binding.arg = 'arg' -->
    
    <!-- 带修饰符 -->
    <div v-my-directive.modifier1.modifier2="message"></div>
    <!-- binding.modifiers = { modifier1: true, modifier2: true } -->
    
    <!-- 完整形式 -->
    <div v-my-directive:arg.modifier1.modifier2="message"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue!'
    }
  },
  directives: {
    'my-directive': {
      bind(el, binding) {
        console.log('name:', binding.name)           // 'my-directive'
        console.log('value:', binding.value)        // 'Hello Vue!'
        console.log('expression:', binding.expression) // 'message'
        console.log('arg:', binding.arg)            // 'arg'（如果有）
        console.log('modifiers:', binding.modifiers) // { modifier1: true, modifier2: true }（如果有）
      }
    }
  }
}
</script>
```

### 3.4、常用指令示例

#### 示例 1：自动聚焦指令

```javascript
// 全局注册
Vue.directive('focus', {
  inserted(el) {
    el.focus()
  }
})
```

```vue
<template>
  <input v-focus placeholder="自动聚焦">
</template>
```

#### 示例 2：点击外部区域指令

```javascript
Vue.directive('click-outside', {
  bind(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unbind(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
})
```

```vue
<template>
  <div v-click-outside="closeMenu">
    <button @click="showMenu = true">菜单</button>
    <div v-if="showMenu">菜单内容</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showMenu: false
    }
  },
  methods: {
    closeMenu() {
      this.showMenu = false
    }
  }
}
</script>
```

#### 示例 3：防抖指令

```javascript
Vue.directive('debounce', {
  inserted(el, binding) {
    let timer = null
    el.addEventListener('input', () => {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        binding.value()
      }, binding.arg || 300)
    })
  }
})
```

```vue
<template>
  <input v-debounce:500="handleInput" v-model="text">
</template>

<script>
export default {
  data() {
    return {
      text: ''
    }
  },
  methods: {
    handleInput() {
      console.log('输入:', this.text)
    }
  }
}
</script>
```

### 3.5、使用场景

::: tip 使用场景
- **DOM 操作**：自动聚焦、滚动到底部、元素拖拽等
- **事件处理**：点击外部区域、防抖、节流等
- **权限控制**：根据权限显示/隐藏元素
- **样式控制**：动态样式、动画效果等
- **第三方库集成**：集成 jQuery 插件、图表库等
:::

## 4、filters（过滤器）

::: tip 说明
1. 过滤器用于文本格式化，可以用在插值表达式和 `v-bind` 表达式中
2. 可以全局注册或局部注册
3. 支持链式调用和参数传递
4. **注意**：Vue 3 中已移除过滤器，建议使用计算属性或方法替代
:::

### 4.1、基本用法

#### 4.1.1、局部注册

**语法：**
```javascript
filters: {
  filterName(value, arg1, arg2, ...) {
    // 处理逻辑
    return formattedValue
  }
}
```
:::tip
**参数说明：**
- **`value`**（必需）：
  - **类型**：任意类型
  - **说明**：要过滤的值，即管道符 `|` 前面的值
  
- **`arg1, arg2, ...`**（可选）：
  - **类型**：任意类型
  - **说明**：传递给过滤器的参数

**返回值：**
- **类型**：任意类型
- **说明**：格式化后的值
:::

**示例：**

```vue
<template>
  <div>
    <p>{{ message | capitalize }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'hello vue'
    }
  },
  filters: {
    capitalize(value) {
      if (!value) return ''
      return value.toString().charAt(0).toUpperCase() + value.slice(1)
    }
  }
}
</script>
```

#### 4.1.2、全局注册

**语法：**
```javascript
Vue.filter('filter-name', function(value, arg1, arg2, ...) {
  // 处理逻辑
  return formattedValue
})
```
:::tip
**参数说明：**
- **`filter-name`**（必需）：
  - **类型**：`String`
  - **说明**：过滤器名称
  
- **`function`**（必需）：
  - **类型**：`Function`
  - **参数**：`value`（必需），`arg1, arg2, ...`（可选）
  - **返回值**：格式化后的值
:::

**示例：**

```javascript
// main.js
import Vue from 'vue'

Vue.filter('capitalize', function(value) {
  if (!value) return ''
  return value.toString().charAt(0).toUpperCase() + value.slice(1)
})
```

### 4.2、链式调用

过滤器可以链式调用，前一个过滤器的输出作为后一个过滤器的输入。

**语法：**
```vue
{{ value | filterA | filterB | filterC }}
```

**执行顺序：**
1. `value` → `filterA` → 结果1
2. 结果1 → `filterB` → 结果2
3. 结果2 → `filterC` → 最终结果

**示例：**

```vue
<template>
  <div>
    <p>{{ message | capitalize | reverse }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'hello vue'
    }
  },
  filters: {
    capitalize(value) {
      if (!value) return ''
      return value.toString().charAt(0).toUpperCase() + value.slice(1)
    },
    reverse(value) {
      if (!value) return ''
      return value.toString().split('').reverse().join('')
    }
  }
}
</script>
```

### 4.3、传递参数

过滤器可以接收多个参数。

**语法：**
```vue
{{ value | filterName(arg1, arg2, ...) }}
```
:::tip
**参数说明：**
- **`value`**：要过滤的值
- **`arg1, arg2, ...`**：传递给过滤器的参数
:::

**示例：**

```vue
<template>
  <div>
    <p>{{ date | formatDate('YYYY-MM-DD') }}</p>
    <p>{{ price | currency('$', 2) }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      date: new Date(),
      price: 1234.567
    }
  },
  filters: {
    formatDate(value, format) {
      if (!value) return ''
      const date = new Date(value)
      // 根据 format 格式化日期
      if (format === 'YYYY-MM-DD') {
        return date.toISOString().split('T')[0]
      }
      return date.toLocaleDateString()
    },
    currency(value, symbol = '¥', decimals = 2) {
      if (!value) return ''
      return symbol + parseFloat(value).toFixed(decimals)
    }
  }
}
</script>
```

### 4.4、在 v-bind 中使用

过滤器也可以在 `v-bind` 表达式中使用。

**语法：**
```vue
<div v-bind:id="rawId | formatId"></div>
```

**示例：**

```vue
<template>
  <div>
    <div :class="status | statusClass">状态</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      status: 'active'
    }
  },
  filters: {
    statusClass(value) {
      return `status-${value}`
    }
  }
}
</script>
```

### 4.5、常用过滤器示例

#### 示例 1：日期格式化

```javascript
Vue.filter('date', function(value, format) {
  if (!value) return ''
  const date = new Date(value)
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`
  }
  return date.toLocaleDateString()
})
```

```vue
<template>
  <p>{{ new Date() | date('YYYY-MM-DD') }}</p>
</template>
```

#### 示例 2：货币格式化

```javascript
Vue.filter('currency', function(value, symbol = '¥', decimals = 2) {
  if (!value) return ''
  return symbol + parseFloat(value).toFixed(decimals)
})
```

```vue
<template>
  <p>{{ price | currency('$', 2) }}</p>
</template>
```

#### 示例 3：文本截断

```javascript
Vue.filter('truncate', function(value, length = 20) {
  if (!value) return ''
  if (value.length <= length) return value
  return value.slice(0, length) + '...'
})
```

```vue
<template>
  <p>{{ longText | truncate(50) }}</p>
</template>
```

### 4.6、注意事项

::: warning 重要提示
1. **Vue 3 中已移除**：Vue 3 不再支持过滤器，建议使用计算属性或方法替代
2. **过滤器应该是纯函数**：不应该有副作用，不应该修改原始数据
3. **性能考虑**：过滤器在每次重新渲染时都会执行，复杂逻辑建议使用计算属性
4. **替代方案**：可以使用计算属性或方法来实现相同的功能
:::

**Vue 3 替代方案：**

```vue
<!-- Vue 2 写法 -->
<template>
  <p>{{ message | capitalize }}</p>
</template>

<!-- Vue 3 替代方案：使用计算属性 -->
<template>
  <p>{{ capitalizedMessage }}</p>
</template>

<script>
export default {
  computed: {
    capitalizedMessage() {
      if (!this.message) return ''
      return this.message.charAt(0).toUpperCase() + this.message.slice(1)
    }
  }
}
</script>

<!-- 或使用方法 -->
<template>
  <p>{{ capitalize(message) }}</p>
</template>

<script>
export default {
  methods: {
    capitalize(value) {
      if (!value) return ''
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
  }
}
</script>
```

## 5、mixins（混入）

::: tip 说明
1. 混入提供了一种非常灵活的方式，来分发 Vue 组件中的可复用功能
2. 可以全局注册或局部注册
3. 当组件和混入对象含有同名选项时，会按照特定规则进行合并
4. 适合用于复用组件逻辑（data、methods、生命周期等）
:::

### 5.1、基本用法

#### 5.1.1、局部混入

**语法：**
```javascript
mixins: [mixin1, mixin2, ...]
```
:::tip
**参数说明：**
- **`mixins`**（必需）：
  - **类型**：`Array`
  - **说明**：混入对象数组，每个混入对象可以包含 `data`、`methods`、`computed`、`watch`、生命周期钩子等选项
:::
**示例：**

```javascript
// mixin.js
export const myMixin = {
  data() {
    return {
      message: 'Hello from mixin'
    }
  },
  created() {
    console.log('mixin created')
  },
  methods: {
    hello() {
      console.log('Hello from mixin')
    }
  }
}
```

```vue
<!-- 组件中使用 -->
<template>
  <div>
    <p>{{ message }}</p>
    <button @click="hello">调用混入方法</button>
  </div>
</template>

<script>
import { myMixin } from './mixin.js'

export default {
  mixins: [myMixin],
  created() {
    console.log('component created')
    // 输出：
    // 'mixin created'
    // 'component created'
  }
}
</script>
```

#### 5.1.2、全局混入

**语法：**
```javascript
Vue.mixin({
  // 混入选项
})
```
:::tip
**参数说明：**
- **混入对象**（必需）：
  - **类型**：`Object`
  - **说明**：包含要混入的选项（data、methods、生命周期等）
:::
**示例：**

```javascript
// main.js
import Vue from 'vue'

Vue.mixin({
  created() {
    console.log('global mixin created')
  }
})
```

::: warning 注意事项
- **全局混入会影响所有组件**：包括第三方组件，谨慎使用
- **建议使用局部混入**：只在需要的地方使用，避免全局污染
:::

### 5.2、选项合并规则

当组件和混入对象含有同名选项时，会按照以下规则进行合并：

**合并规则：**

| 选项类型 | 合并规则 | 说明 |
|---------|---------|------|
| **data** | 递归合并，组件数据优先 | 同名属性会被组件数据覆盖 |
| **methods** | 合并，组件方法优先 | 同名方法会被组件方法覆盖 |
| **computed** | 合并，组件计算属性优先 | 同名计算属性会被组件计算属性覆盖 |
| **watch** | 合并为数组，都会执行 | 同名 watch 都会执行，混入的先执行 |
| **生命周期钩子** | 合并为数组，都会执行 | 同名钩子都会执行，混入的先执行 |
| **其他选项** | 组件选项优先 | `props`、`directives`、`filters` 等 |

**示例：**

```javascript
// mixin.js
export const myMixin = {
  data() {
    return {
      message: 'mixin',
      foo: 'bar'
    }
  },
  methods: {
    foo() {
      console.log('mixin foo')
    },
    conflicting() {
      console.log('from mixin')
    }
  },
  created() {
    console.log('mixin created')
  }
}
```

```vue
<script>
import { myMixin } from './mixin.js'

export default {
  mixins: [myMixin],
  data() {
    return {
      message: 'component',  // 组件数据优先，覆盖混入的 message
      bar: 'foo'
    }
  },
  methods: {
    bar() {
      console.log('component bar')
    },
    conflicting() {  // 组件方法优先，覆盖混入的 conflicting
      console.log('from component')
    }
  },
  created() {
    console.log('component created')
    // 输出：
    // 'mixin created'（混入的先执行）
    // 'component created'（组件的后执行）
    
    console.log(this.message)  // 'component'（组件数据优先）
    console.log(this.foo)      // 'bar'（混入的数据）
    this.foo()  // 'mixin foo'（混入的方法）
    this.bar()  // 'component bar'（组件方法优先）
    this.conflicting()  // 'from component'（组件方法优先）
  }
}
</script>
```

### 5.3、实际应用示例

#### 示例 1：表单混入

```javascript
// utils/formMixin.js
export const formMixin = {
  data() {
    return {
      formData: {},
      formErrors: {},
      submitting: false
    }
  },
  methods: {
    validateForm() {
      // 表单验证逻辑
      this.formErrors = {}
      // 验证逻辑...
      return Object.keys(this.formErrors).length === 0
    },
    resetForm() {
      this.formData = {}
      this.formErrors = {}
    },
    async submitForm() {
      if (!this.validateForm()) {
        return
      }
      this.submitting = true
      try {
        await this.handleSubmit()
      } finally {
        this.submitting = false
      }
    }
  }
}
```

```vue
<!-- 使用混入 -->
<template>
  <form @submit.prevent="submitForm">
    <input v-model="formData.username" placeholder="用户名">
    <input v-model="formData.email" placeholder="邮箱">
    <button type="submit" :disabled="submitting">
      {{ submitting ? '提交中...' : '提交' }}
    </button>
  </form>
</template>

<script>
import { formMixin } from '@/utils/formMixin'

export default {
  mixins: [formMixin],
  data() {
    return {
      formData: {
        username: '',
        email: ''
      }
    }
  },
  methods: {
    async handleSubmit() {
      // 提交表单逻辑
      console.log('提交', this.formData)
      // 实际项目中这里应该是 API 调用
    }
  }
}
</script>
```

#### 示例 2：权限混入

```javascript
// utils/permissionMixin.js
export const permissionMixin = {
  data() {
    return {
      userRole: 'user',
      permissions: []
    }
  },
  methods: {
    hasPermission(permission) {
      return this.permissions.includes(permission)
    },
    hasRole(role) {
      return this.userRole === role
    },
    checkPermission(permission) {
      if (!this.hasPermission(permission)) {
        this.$message.error('没有权限')
        return false
      }
      return true
    }
  },
  created() {
    // 获取用户权限
    this.permissions = ['read', 'write']
    this.userRole = 'admin'
  }
}
```

```vue
<script>
import { permissionMixin } from '@/utils/permissionMixin'

export default {
  mixins: [permissionMixin],
  methods: {
    editData() {
      if (!this.checkPermission('write')) {
        return
      }
      // 编辑逻辑
    }
  }
}
</script>
```

### 5.4、注意事项

::: warning 重要提示
1. **避免过度使用混入**：混入过多会导致代码难以理解和维护
2. **注意选项合并规则**：理解合并规则，避免意外的覆盖
3. **生命周期钩子都会执行**：混入和组件的同名钩子都会执行，注意执行顺序
4. **全局混入要谨慎**：全局混入会影响所有组件，包括第三方组件
5. **Vue 3 推荐使用组合式 API**：Vue 3 推荐使用 `setup` 和组合式函数替代混入
:::

### 5.5、混入 vs 组件

| 特性 | 混入 | 组件 |
|------|------|------|
| **用途** | 复用组件逻辑 | 复用 UI 和逻辑 |
| **作用范围** | 组件级别 | 独立组件 |
| **适用场景** | data、methods、生命周期 | 完整的 UI 组件 |
| **复用方式** | 通过 `mixins` 选项 | 通过组件注册和使用 |
