# 选项式 API
::: tip 选项式 API 说明
- Vue 2 使用选项式 API（Options API）来组织组件代码，通过定义各种选项来配置组件的行为。
- 每个选项都有特定的用途和用法。
:::

## 一、components（组件对象）

::: tip
1. 用于注册局部组件，使组件可以在当前组件的模板中使用
2. 注册的组件只在当前组件及其子组件中可用
3. 支持多种注册方式：直接注册、自定义名称、动态注册等
4. 组件名可以使用 kebab-case 或 PascalCase
:::

### 1.1、基本用法

>[!note] 组件注册
>1. **类型**：`Object`
>2. **键名**：组件在模板中使用的名称
>3. **键值**：组件选项对象或导入的组件

:::details 基本注册示例
```vue
<template>
  <div>
    <my-component></my-component>
    <child-component></child-component>
  </div>
</template>

<script>
import MyComponent from './MyComponent.vue'
import ChildComponent from './ChildComponent.vue'

export default {
  name: 'Parent',
  components: {
    // 方式1：直接注册（推荐）
    MyComponent,
    // 方式2：自定义名称
    'child-component': ChildComponent
  }
}
</script>
```
:::

### 1.2、组件命名

>[!note] 组件命名规则
>1. **PascalCase**：`MyComponent` → 模板中使用 `<MyComponent>` 或 `<my-component>`
>2. **kebab-case**：`'my-component'` → 模板中使用 `<my-component>`
>3. **注意**：Vue 会自动将 PascalCase 转换为 kebab-case

:::details 组件命名示例
```vue
<template>
  <div>
    <!-- PascalCase 组件名 -->
    <MyComponent></MyComponent>
    <my-component></my-component>
    
    <!-- kebab-case 组件名 -->
    <child-component></child-component>
  </div>
</template>

<script>
import MyComponent from './MyComponent.vue'
import ChildComponent from './ChildComponent.vue'

export default {
  components: {
    MyComponent,              // PascalCase
    'child-component': ChildComponent  // kebab-case
  }
}
</script>
```
:::

### 1.3、使用场景

:::tip components
- 需要在当前组件中使用子组件
- 需要封装可复用的组件
- 需要按需加载组件
:::

## 二、name（组件名称）

::: tip
1. 定义组件的名称，用于调试和递归组件
2. 在 Vue DevTools 中显示组件名称，便于调试
3. 用于递归组件，组件可以在其模板中调用自己
4. 配合 `keep-alive` 的 `include` 和 `exclude` 使用
:::

### 2.1、基本用法

>[!note] name 选项
>1. **类型**：`String`
>2. **必需**：否（但强烈建议设置）
>3. **注意**：组件名应该有意义，便于调试和维护

:::details name 使用示例
```vue
<template>
  <div>
    <h2>{{ title }}</h2>
  </div>
</template>

<script>
export default {
  name: 'MyComponent', // 组件名称
  data() {
    return {
      title: 'Hello Vue'
    }
  }
}
</script>
```
:::

### 2.2、递归组件

>[!note] 递归组件
>1. 组件可以在其模板中调用自己
>2. 需要设置 `name` 选项
>3. 需要设置递归终止条件，避免无限循环

:::details 递归组件示例
```vue
<template>
  <div>
    <h3>{{ node.name }}</h3>
    <ul v-if="node.children && node.children.length">
      <li v-for="child in node.children" :key="child.id">
        <!-- 递归调用自身 -->
        <tree-node :node="child"></tree-node>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'TreeNode', // 必须有 name，才能递归调用
  props: {
    node: {
      type: Object,
      required: true
    }
  }
}
</script>
```
:::

### 2.3、keep-alive 配合使用

:::details keep-alive 示例
```vue
<template>
  <div>
    <keep-alive :include="['ComponentA', 'ComponentB']">
      <component :is="currentComponent"></component>
    </keep-alive>
  </div>
</template>

<script>
import ComponentA from './ComponentA.vue'
import ComponentB from './ComponentB.vue'

export default {
  components: {
    ComponentA,
    ComponentB
  },
  data() {
    return {
      currentComponent: 'ComponentA'
    }
  }
}
</script>
```

```vue
<!-- ComponentA.vue -->
<script>
export default {
  name: 'ComponentA', // 必须设置 name，keep-alive 才能识别
  // ...
}
</script>
```
:::

### 2.4、使用场景

:::tip name
- 需要在 Vue DevTools 中清晰识别组件
- 需要创建递归组件
- 需要配合 keep-alive 使用
- 需要动态组件切换
:::

## 三、el（挂载元素）

::: tip
1. 指定 Vue 实例要挂载的 DOM 元素
2. 只在根实例中有效，组件实例中无效
3. 挂载后，该元素成为 Vue 实例的根元素
4. 可以通过 `this.$el` 访问挂载的元素
:::

### 3.1、基本用法

>[!note] el 选项
>1. **类型**：`String | Element`
>2. **必需**：否（可以使用 `$mount` 方法替代）
>3. **限制**：不能挂载到 `<html>` 或 `<body>` 标签

:::details el 使用示例
```javascript
// 方式1：使用选择器字符串
new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue'
  }
})

// 方式2：使用 DOM 元素
const app = document.getElementById('app')
new Vue({
  el: app,
  data: {
    message: 'Hello Vue'
  }
})
```
:::

### 3.2、使用 $mount 方法

>[!note] $mount 方法
>1. **作用**：手动挂载 Vue 实例
>2. **参数**：选择器字符串或 DOM 元素
>3. **返回值**：Vue 实例本身（支持链式调用）
>4. **优势**：可以在实例创建后再决定挂载时机

:::details $mount 使用示例
```javascript
// 方式1：创建后立即挂载
const vm = new Vue({
  data: {
    message: 'Hello Vue'
  }
}).$mount('#app')

// 方式2：延迟挂载
const vm = new Vue({
  data: {
    message: 'Hello Vue'
  }
})

// 在某个时机挂载
setTimeout(() => {
  vm.$mount('#app')
}, 1000)

// 方式3：挂载到 DOM 元素
const app = document.getElementById('app')
const vm = new Vue({
  data: {
    message: 'Hello Vue'
  }
}).$mount(app)
```
:::

### 3.3、访问挂载元素

:::details 访问 $el 示例
```javascript
const vm = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue'
  },
  mounted() {
    // 访问挂载的 DOM 元素
    console.log(this.$el) // <div id="app">...</div>
    console.log(this.$el === document.getElementById('app')) // true
  }
})
```
:::

### 3.4、使用场景

:::tip el
- 创建根 Vue 实例时需要指定挂载点
- 需要延迟挂载实例
- 需要动态选择挂载元素
:::

## 四、data（数据对象）

::: tip
1. 定义组件的响应式数据，Vue 会将 data 中的属性转换为响应式
2. 组件中的 `data` 必须是函数，返回一个对象
3. 根实例中的 `data` 可以是对象或函数
4. 只有 `data` 中的属性才是响应式的，后续添加的属性需要使用 `Vue.set()` 或 `this.$set()`
:::

### 4.1、组件中的 data

>[!note] 组件中的 data
>1. **类型**：`Function`
>2. **返回值**：`Object`
>3. **必需**：是
>4. **原因**：避免多个组件实例共享同一个数据对象

:::details 组件中 data 使用示例
```vue
<template>
  <div>
    <p>{{ message }}</p>
    <p>{{ count }}</p>
    <p>{{ user.name }}</p>
  </div>
</template>

<script>
export default {
  name: 'MyComponent',
  // 组件中 data 必须是函数
  data() {
    return {
      message: 'Hello Vue',
      count: 0,
      user: {
        name: 'John',
        age: 25
      }
    }
  }
}
</script>
```
:::

### 4.2、根实例中的 data

>[!note] 根实例中的 data
>1. **类型**：`Object | Function`
>2. **推荐**：使用对象形式（更简洁）
>3. **注意**：根实例只有一个，不存在共享问题

:::details 根实例中 data 使用示例
```javascript
// 方式1：对象形式（推荐）
new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue',
    count: 0
  }
})

// 方式2：函数形式（也可以）
new Vue({
  el: '#app',
  data() {
    return {
      message: 'Hello Vue',
      count: 0
    }
  }
})
```
:::

### 4.3、响应式数据限制

>[!note] 响应式限制
>1. **已存在的属性**：只有 `data` 中已存在的属性才是响应式的
>2. **新增属性**：需要使用 `Vue.set()` 或 `this.$set()` 添加响应式属性
>3. **数组索引**：直接通过索引修改数组元素不是响应式的
>4. **数组长度**：直接修改 `array.length` 不是响应式的

:::details 响应式数据示例
```vue
<template>
  <div>
    <p>{{ message }}</p>
    <p>{{ newProperty }}</p>
    <p>{{ items.length }}</p>
    <button @click="addProperty">添加属性</button>
    <button @click="addItem">添加项</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue',
      items: []
    }
  },
  methods: {
    // ❌ 错误：直接添加属性不是响应式的
    // addProperty() {
    //   this.newProperty = 'New Value'
    // }
    
    // ✅ 正确：使用 $set 添加响应式属性
    addProperty() {
      this.$set(this, 'newProperty', 'New Value')
    },
    
    // ✅ 正确：使用数组方法添加项
    addItem() {
      this.items.push({ id: Date.now(), name: 'Item' })
    },
    
    // ❌ 错误：直接通过索引修改不是响应式的
    // updateItem() {
    //   this.items[0] = { id: 1, name: 'Updated' }
    // }
    
    // ✅ 正确：使用 $set 修改数组项
    updateItem() {
      this.$set(this.items, 0, { id: 1, name: 'Updated' })
    }
  }
}
</script>
```
:::

### 4.4、使用场景

:::tip data
- 定义组件的初始状态数据
- 存储用户输入的数据
- 存储从 API 获取的数据
- 存储组件的临时数据
:::

## 五、methods（方法对象）

::: tip
1. 定义组件的方法，可以在模板中调用，也可以在实例的其他方法中通过 `this` 访问
2. 方法中的 `this` 自动绑定为组件实例
3. 与计算属性不同，`methods` 中的方法每次调用都会执行，不会缓存结果
4. 常用于处理用户交互事件，如点击、输入等
:::

### 1.1、基本用法

>[!note] methods 选项
>1. **类型**：`Object`
>2. **必需**：否
>3. **this 绑定**：自动绑定为组件实例
>4. **调用方式**：在模板中使用 `@click="methodName"` 或 `v-on:click="methodName"`

:::details methods 使用示例
```vue
<template>
  <div>
    <p>{{ message }}</p>
    <button @click="handleClick">点击</button>
    <button @click="increment">增加</button>
    <p>计数：{{ count }}</p>
  </div>
</template>

<script>
export default {
  name: 'MyComponent',
  data() {
    return {
      message: 'Hello Vue',
      count: 0
    }
  },
  methods: {
    handleClick() {
      this.message = 'Button clicked!'
      console.log('按钮被点击了')
    },
    increment() {
      this.count++
    }
  }
}
</script>
```
:::

### 1.2、方法传参

>[!note] 方法参数
>1. **模板中传参**：`@click="methodName(arg1, arg2)"`
>2. **方法定义**：`methodName(param1, param2) { ... }`
>3. **事件对象**：使用 `$event` 传递原生事件对象

:::details 方法传参示例
```vue
<template>
  <div>
    <button @click="greet('Vue')">打招呼</button>
    <button @click="sayHello('John', $event)">说你好</button>
    <input @input="handleInput($event)" v-model="text">
  </div>
</template>

<script>
export default {
  data() {
    return {
      text: ''
    }
  },
  methods: {
    // 接收参数
    greet(name) {
      alert(`Hello, ${name}!`)
    },
    
    // 接收多个参数
    sayHello(name, event) {
      console.log(`Hello, ${name}!`, event)
    },
    
    // 接收事件对象
    handleInput(event) {
      console.log('输入值：', event.target.value)
    }
  }
}
</script>
```
:::

### 1.3、方法中访问 data 和 computed

:::details 方法访问数据示例
```vue
<template>
  <div>
    <p>{{ message }}</p>
    <p>{{ reversedMessage }}</p>
    <button @click="updateMessage">更新消息</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue'
    }
  },
  computed: {
    reversedMessage() {
      return this.message.split('').reverse().join('')
    }
  },
  methods: {
    updateMessage() {
      // 访问 data
      this.message = 'Updated!'
      
      // 访问 computed
      console.log('反转消息：', this.reversedMessage)
      
      // 调用其他方法
      this.logMessage()
    },
    logMessage() {
      console.log('当前消息：', this.message)
    }
  }
}
</script>
```
:::

### 1.4、methods vs computed

>[!note] methods 与 computed 的区别
>1. **缓存**：`methods` 无缓存，每次调用都执行；`computed` 有缓存，依赖不变不执行
>2. **调用方式**：`methods` 需要调用 `methodName()`；`computed` 作为属性访问
>3. **适用场景**：`methods` 用于事件处理、副作用操作；`computed` 用于数据计算、派生值

:::details methods vs computed 对比
```vue
<template>
  <div>
    <!-- methods：每次渲染都会执行 -->
    <p>方法结果：{{ getMessage() }}</p>
    <p>方法结果：{{ getMessage() }}</p>
    
    <!-- computed：有缓存，只计算一次 -->
    <p>计算属性：{{ computedMessage }}</p>
    <p>计算属性：{{ computedMessage }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue'
    }
  },
  methods: {
    getMessage() {
      console.log('方法被调用了') // 每次渲染都会执行
      return this.message.toUpperCase()
    }
  },
  computed: {
    computedMessage() {
      console.log('计算属性被计算了') // 依赖不变时只计算一次
      return this.message.toUpperCase()
    }
  }
}
</script>
```
:::

### 1.5、使用场景

:::tip methods
- 处理用户交互事件（点击、输入等）
- 执行副作用操作（API 请求、DOM 操作等）
- 需要传递参数的方法
- 不需要缓存的计算逻辑
:::

## 六、computed（计算属性对象）

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




## 七、watch（观察者对象）

::: tip
1. 侦听器用于观察和响应 Vue 实例上的数据变动。
2. 依赖项改变则
:::
### 1.1、基本用法
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

### 1.2、深度监听

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

### 1.3、监听对象属性

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

### 1.4、使用 $watch API

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
### 1.5、使用场景

::: tip watch
- 需要在数据变化时，执行异步操作。
- 需要在数据变化时，执行开销较大的操作。
- 需要监听数据变化时，执行副作用。

:::



## 八、filters（过滤器对象）

:::tip filters 说明
- **作用**：定义过滤器，用于文本格式化
- **类型**：`Object`
- **注意**：Vue 3 中已移除过滤器，建议使用计算属性或方法替代
:::

:::details filters 使用示例
```vue
<template>
  <div>
    <p>原文本：{{ message }}</p>
    <p>大写：{{ message | uppercase }}</p>
    <p>日期：{{ date | formatDate }}</p>
    <p>价格：{{ price | currency }}</p>
    <!-- 链式调用 -->
    <p>格式化：{{ message | uppercase | reverse }}</p>
  </div>
</template>

<script>
export default {
  name: 'MyComponent',
  data() {
    return {
      message: 'hello vue',
      date: new Date(),
      price: 99.99
    }
  },
  filters: {
    uppercase(value) {
      if (!value) return ''
      return value.toString().toUpperCase()
    },
    formatDate(value) {
      if (!value) return ''
      return new Date(value).toLocaleDateString()
    },
    currency(value) {
      if (!value) return ''
      return `¥${value.toFixed(2)}`
    },
    reverse(value) {
      if (!value) return ''
      return value.toString().split('').reverse().join('')
    }
  }
}
</script>
```
:::

## 九、directives（指令对象）

::: tip 说明
1. 自定义指令用于对普通 DOM 元素进行底层操作
2. 可以全局注册或局部注册
3. 指令名必须以 `v-` 开头，使用时直接写指令名（如 `v-focus`）
4. 适合用于 DOM 操作、事件处理、权限控制等场景
:::

### 1.1、基本用法

#### 1.1.1、全局注册

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

#### 1.1.2、局部注册

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

### 1.2、指令钩子函数

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

### 1.3、binding 对象详解

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

### 1.4、常用指令示例

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

### 1.5、使用场景

::: tip 使用场景
- **DOM 操作**：自动聚焦、滚动到底部、元素拖拽等
- **事件处理**：点击外部区域、防抖、节流等
- **权限控制**：根据权限显示/隐藏元素
- **样式控制**：动态样式、动画效果等
- **第三方库集成**：集成 jQuery 插件、图表库等
:::


## 十、props（属性对象）

::: tip
1. 定义组件接收的属性，用于父组件向子组件传递数据
2. 支持数组和对象两种定义方式，对象形式可以设置类型、默认值、校验等
3. 遵循单向数据流原则，子组件不能直接修改 props
4. props 会在组件实例创建之前进行校验，确保传入的数据符合要求
:::

### 1.1、数组形式

>[!note] 数组形式
>1. **类型**：`Array`
>2. **用法**：简单列出需要接收的 prop 名称
>3. **限制**：无法设置类型、默认值、校验等
>4. **适用场景**：简单的 prop 传递，不需要额外配置

:::details 数组形式示例
```vue
<script>
export default {
  name: 'ChildComponent',
  props: ['name', 'age', 'email']
}
</script>
```
:::

### 1.2、对象形式（推荐）

>[!note] 对象形式
>1. **类型**：`Object`
>2. **键名**：prop 名称
>3. **键值**：可以是类型构造函数，也可以是包含配置选项的对象
>4. **优势**：可以设置类型、默认值、必需性、校验函数等

:::details 对象形式示例
```vue
<!-- 子组件 -->
<template>
  <div>
    <p>姓名：{{ name }}</p>
    <p>年龄：{{ age }}</p>
    <p>用户信息：{{ userInfo.name }} - {{ userInfo.email }}</p>
  </div>
</template>

<script>
export default {
  name: 'ChildComponent',
  // 方式1：数组形式
  // props: ['name', 'age'],
  
  // 方式2：对象形式（推荐）
  props: {
    name: {
      type: String,
      required: true,
      default: 'Guest'
    },
    age: {
      type: Number,
      default: 0,
      validator(value) {
        return value >= 0 && value <= 150
      }
    },
    userInfo: {
      type: Object,
      default() {
        return { name: '', email: '' }
      }
    }
  }
}
</script>
```

```vue
<!-- 父组件 -->
<template>
  <div>
    <child-component 
      :name="userName" 
      :age="userAge"
      :user-info="user"
    ></child-component>
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  name: 'ParentComponent',
  components: {
    ChildComponent
  },
  data() {
    return {
      userName: 'John',
      userAge: 25,
      user: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    }
  }
}
</script>
```
:::

### 1.3、Prop 类型

>[!note] Prop 类型
>1. **类型**：可以是 `String`、`Number`、`Boolean`、`Array`、`Object`、`Date`、`Function`、`Symbol` 或自定义构造函数
>2. **多类型**：可以使用数组指定多个可能的类型
>3. **作用**：Vue 会在开发模式下检查 prop 的类型，不符合时会发出警告

:::details Prop 类型示例
```vue
<script>
export default {
  props: {
    // 单个类型
    name: String,
    age: Number,
    isActive: Boolean,
    
    // 多个类型
    value: [String, Number],
    
    // 对象类型
    user: Object,
    
    // 数组类型
    items: Array,
    
    // 自定义构造函数
    date: Date
  }
}
</script>
```
:::

### 1.4、Prop 验证

>[!note] Prop 验证选项
>1. **type**：指定 prop 的类型
>2. **default**：指定默认值（对象或数组必须使用函数返回）
>3. **required**：指定 prop 是否必需
>4. **validator**：自定义验证函数，返回 `true` 表示验证通过

:::details Prop 验证示例
```vue
<script>
export default {
  props: {
    name: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      default: 0,
      validator(value) {
        return value >= 0 && value <= 150
      }
    },
    user: {
      type: Object,
      default() {
        return { name: '', email: '' }
      }
    },
    items: {
      type: Array,
      default() {
        return []
      }
    }
  }
}
</script>
```
:::

### 1.5、使用场景

:::tip props
- 父组件向子组件传递数据
- 需要类型检查和数据验证
- 需要设置默认值
- 实现组件间的数据通信
:::

## 十一、mixins（混入对象）

::: tip
1. 将可复用的组件选项混入到组件中，实现代码复用
2. 多个混入对象会按照数组顺序合并，发生冲突时组件选项优先
3. 混入的钩子函数会在组件钩子之前调用
4. 适合用于提取公共逻辑，如日志记录、权限检查等
:::

### 1.1、基本用法

>[!note] mixins 选项
>1. **类型**：`Array`
>2. **元素**：混入对象，包含组件选项（data、methods、computed、生命周期钩子等）
>3. **合并策略**：不同选项有不同的合并策略
>4. **优先级**：组件选项 > 混入选项

:::details mixins 基本用法示例
```javascript
// mixins/commonMixin.js
export const commonMixin = {
  data() {
    return {
      commonData: '这是混入的数据'
    }
  },
  methods: {
    commonMethod() {
      console.log('这是混入的方法')
    }
  },
  created() {
    console.log('混入的 created 钩子')
  }
}

// mixins/logMixin.js
export const logMixin = {
  methods: {
    log(message) {
      console.log(`[${this.$options.name}] ${message}`)
    }
  }
}
```

```vue
<!-- 组件中使用 mixins -->
<template>
  <div>
    <p>{{ commonData }}</p>
    <button @click="commonMethod">调用混入方法</button>
    <button @click="log('测试日志')">记录日志</button>
  </div>
</template>

<script>
import { commonMixin } from './mixins/commonMixin'
import { logMixin } from './mixins/logMixin'

export default {
  name: 'MyComponent',
  mixins: [commonMixin, logMixin],
  data() {
    return {
      localData: '这是组件自己的数据'
    }
  },
  created() {
    console.log('组件的 created 钩子')
  }
}
</script>
```
:::

### 1.2、选项合并策略

>[!note] 合并策略
>1. **data**：递归合并，组件 data 优先
>2. **methods、computed**：合并，组件选项优先
>3. **生命周期钩子**：合并为数组，混入钩子先执行
>4. **directives、filters、components**：合并，组件选项优先

:::details 选项合并示例
```javascript
// mixin1.js
export const mixin1 = {
  data() {
    return {
      message: 'Mixin1',
      count: 1
    }
  },
  methods: {
    method1() {
      console.log('Mixin1 method')
    }
  },
  created() {
    console.log('Mixin1 created')
  }
}

// mixin2.js
export const mixin2 = {
  data() {
    return {
      message: 'Mixin2',
      value: 2
    }
  },
  methods: {
    method2() {
      console.log('Mixin2 method')
    }
  },
  created() {
    console.log('Mixin2 created')
  }
}
```

```vue
<script>
import { mixin1 } from './mixin1'
import { mixin2 } from './mixin2'

export default {
  mixins: [mixin1, mixin2],
  data() {
    return {
      message: 'Component', // 组件 data 优先
      localData: 'Local'
    }
    // 最终 data: { message: 'Component', count: 1, value: 2, localData: 'Local' }
  },
  methods: {
    method1() {
      console.log('Component method') // 组件方法优先
    }
    // 最终 methods: { method1: Component方法, method2: Mixin2方法 }
  },
  created() {
    console.log('Component created')
    // 执行顺序：Mixin1 created -> Mixin2 created -> Component created
  }
}
</script>
```
:::

### 1.3、全局混入

>[!note] 全局混入
>1. **用法**：使用 `Vue.mixin()` 注册全局混入
>2. **影响**：会影响所有 Vue 实例和组件
>3. **注意**：谨慎使用，可能导致意外的副作用
>4. **适用场景**：插件开发、全局配置等

:::details 全局混入示例
```javascript
// main.js
import Vue from 'vue'

// 全局混入
Vue.mixin({
  created() {
    console.log('全局混入的 created')
  },
  methods: {
    $log(message) {
      console.log(`[${this.$options.name}] ${message}`)
    }
  }
})
```

```vue
<!-- 所有组件都会自动拥有 $log 方法 -->
<script>
export default {
  name: 'MyComponent',
  created() {
    this.$log('组件创建') // 可以使用全局混入的方法
  }
}
</script>
```
:::

### 1.4、使用场景

:::tip mixins
- 提取多个组件的公共逻辑
- 实现横切关注点（如日志、权限、埋点等）
- 复用方法和计算属性
- 统一生命周期钩子处理
:::

## 十二、parent（父实例）

::: tip
1. 指定组件的父实例，通常由 Vue 自动管理
2. 不推荐直接使用 `parent` 选项，应该使用 `$parent` 访问父组件
3. 直接访问父组件会破坏组件的封装性，建议使用 props 和 events
4. 主要用于高级场景，如组件库开发、动态组件等
:::

### 1.1、访问父组件

>[!note] $parent 属性
>1. **类型**：`Vue instance | undefined`
>2. **作用**：访问父组件实例
>3. **注意**：如果组件没有父组件，`$parent` 为 `undefined`
>4. **不推荐**：直接访问父组件会创建紧耦合，不利于维护

:::details 访问父组件示例
```vue
<template>
  <div>
    <p>父组件数据：{{ parentData }}</p>
    <button @click="accessParent">访问父组件</button>
  </div>
</template>

<script>
export default {
  name: 'ChildComponent',
  data() {
    return {
      parentData: ''
    }
  },
  methods: {
    accessParent() {
      // 访问父组件实例
      if (this.$parent) {
        this.parentData = this.$parent.message || '无数据'
        console.log('父组件：', this.$parent)
      }
    }
  }
}
</script>
```
:::

### 1.2、使用场景

>[!note] 使用场景
>1. **组件库开发**：需要访问父组件的方法或属性
>2. **动态组件**：需要根据父组件状态动态调整
>3. **临时方案**：快速访问父组件（不推荐长期使用）
>4. **调试**：在开发时快速访问父组件信息

:::details 使用场景示例
```vue
<!-- 父组件 -->
<template>
  <div>
    <child-component></child-component>
  </div>
</template>

<script>
export default {
  name: 'ParentComponent',
  data() {
    return {
      theme: 'dark',
      config: { api: 'https://api.example.com' }
    }
  },
  methods: {
    updateTheme(theme) {
      this.theme = theme
    }
  }
}
</script>
```

```vue
<!-- 子组件 -->
<template>
  <div>
    <p>父组件主题：{{ parentTheme }}</p>
    <button @click="changeParentTheme">改变父组件主题</button>
  </div>
</template>

<script>
export default {
  name: 'ChildComponent',
  data() {
    return {
      parentTheme: ''
    }
  },
  mounted() {
    // 访问父组件数据
    if (this.$parent) {
      this.parentTheme = this.$parent.theme
    }
  },
  methods: {
    changeParentTheme() {
      // 调用父组件方法
      if (this.$parent && this.$parent.updateTheme) {
        this.$parent.updateTheme('light')
      }
    }
  }
}
</script>
```
:::

### 1.3、注意事项

:::warning 注意事项
- **不推荐使用**：直接访问 `$parent` 会创建紧耦合，不利于组件复用
- **替代方案**：使用 `props` 传递数据，使用 `$emit` 触发事件
- **最佳实践**：使用 `provide/inject` 实现跨级组件通信
- **调试工具**：`$parent` 主要用于调试，不应该在生产代码中频繁使用
:::

## 十三、provide（提供者对象）

::: tip
1. 向子组件树提供数据，配合 `inject` 使用，实现跨级组件通信
2. 支持对象和函数两种形式，函数形式可以访问 `this`
3. 提供的数据不是响应式的，除非提供的是响应式对象
4. 适合用于主题、配置、用户信息等需要在多个层级共享的数据
:::

### 1.1、对象形式

>[!note] 对象形式
>1. **类型**：`Object`
>2. **特点**：简单直接，但无法访问组件实例
>3. **适用场景**：提供静态数据或配置
>4. **限制**：无法提供响应式数据

:::details 对象形式示例
```vue
<!-- 父组件 -->
<template>
  <div>
    <child-component></child-component>
  </div>
</template>

<script>
export default {
  name: 'ParentComponent',
  // 对象形式：提供静态数据
  provide: {
    theme: 'dark',
    apiUrl: 'https://api.example.com',
    config: {
      timeout: 5000,
      retry: 3
    }
  }
}
</script>
```
:::

### 1.2、函数形式（推荐）

>[!note] 函数形式
>1. **类型**：`Function`
>2. **返回值**：`Object`
>3. **this 绑定**：函数中的 `this` 指向组件实例
>4. **优势**：可以访问组件数据和方法，提供响应式数据

:::details 函数形式示例
```vue
<!-- 父组件 -->
<template>
  <div>
    <child-component></child-component>
  </div>
</template>

<script>
export default {
  name: 'ParentComponent',
  data() {
    return {
      theme: 'dark',
      user: {
        name: 'John',
        role: 'admin'
      }
    }
  },
  // 函数形式（推荐，可以访问 this）
  provide() {
    return {
      theme: this.theme,
      user: this.user,
      updateTheme: this.updateTheme
    }
  },
  methods: {
    updateTheme(newTheme) {
      this.theme = newTheme
    }
  }
}
</script>
```
:::

### 1.3、响应式数据

>[!note] 响应式数据
>1. **问题**：`provide` 提供的值默认不是响应式的
>2. **解决方案**：提供响应式对象（如 `this.someObject`）
>3. **注意**：直接提供基本类型值不是响应式的
>4. **最佳实践**：提供对象引用，在对象内部修改属性

:::details 响应式数据示例
```vue
<!-- 父组件 -->
<template>
  <div>
    <button @click="updateTheme">切换主题</button>
    <child-component></child-component>
  </div>
</template>

<script>
export default {
  name: 'ParentComponent',
  data() {
    return {
      theme: {
        mode: 'dark',
        color: 'black'
      }
    }
  },
  provide() {
    return {
      // 提供响应式对象（推荐）
      theme: this.theme,
      // 提供方法，子组件可以调用
      updateTheme: this.updateTheme
    }
  },
  methods: {
    updateTheme() {
      this.theme.mode = this.theme.mode === 'dark' ? 'light' : 'dark'
      this.theme.color = this.theme.mode === 'dark' ? 'black' : 'white'
    }
  }
}
</script>
```
:::

### 1.4、使用场景

:::tip provide
- 跨级组件通信，避免逐层传递 props
- 提供全局配置（主题、语言、API 地址等）
- 提供共享服务（用户信息、权限等）
- 组件库开发，提供统一的上下文
:::

## 十四、inject（注入对象）

::: tip
1. 注入父组件通过 `provide` 提供的数据，实现跨级组件通信
2. 支持数组和对象两种形式，对象形式可以设置默认值
3. 注入的数据在子组件中可以直接使用，就像组件的 data 一样
4. 配合 `provide` 使用，是 props 的替代方案，适合跨级传递数据
:::

### 1.1、数组形式

>[!note] 数组形式
>1. **类型**：`Array`
>2. **元素**：字符串，对应 `provide` 中的键名
>3. **特点**：简单直接，但无法设置默认值
>4. **适用场景**：确定父组件一定会提供该数据

:::details 数组形式示例
```vue
<template>
  <div>
    <p>主题：{{ theme }}</p>
    <p>用户：{{ user.name }} - {{ user.role }}</p>
    <button @click="changeTheme">切换主题</button>
  </div>
</template>

<script>
export default {
  name: 'ChildComponent',
  // 数组形式：简单直接
  inject: ['theme', 'user', 'updateTheme'],
  methods: {
    changeTheme() {
      if (this.updateTheme) {
        this.updateTheme(this.theme === 'dark' ? 'light' : 'dark')
      }
    }
  }
}
</script>
```
:::

### 1.2、对象形式（推荐）

>[!note] 对象形式
>1. **类型**：`Object`
>2. **键名**：注入后在组件中使用的属性名
>3. **键值**：可以是字符串（对应 provide 的键名），也可以是对象（包含 from、default 等）
>4. **优势**：可以设置默认值、重命名等

:::details 对象形式示例
```vue
<template>
  <div>
    <p>主题：{{ theme }}</p>
    <p>用户：{{ user.name }} - {{ user.role }}</p>
    <button @click="changeTheme">切换主题</button>
  </div>
</template>

<script>
export default {
  name: 'ChildComponent',
  // 对象形式（推荐）
  inject: {
    theme: {
      from: 'theme',
      default: 'light'
    },
    user: {
      from: 'user',
      default: () => ({ name: 'Guest', role: 'user' })
    },
    updateTheme: {
      from: 'updateTheme'
    }
  },
  methods: {
    changeTheme() {
      if (this.updateTheme) {
        this.updateTheme(this.theme === 'dark' ? 'light' : 'dark')
      }
    }
  }
}
</script>
```
:::

### 1.3、默认值

>[!note] 默认值
>1. **from**：指定从 `provide` 中哪个键获取数据
>2. **default**：设置默认值，如果 `provide` 中没有提供该数据
>3. **对象/数组默认值**：必须使用函数返回
>4. **作用**：提高组件的健壮性，避免因缺少 provide 而报错

:::details 默认值示例
```vue
<script>
export default {
  name: 'ChildComponent',
  inject: {
    theme: {
      from: 'theme',
      default: 'light' // 基本类型默认值
    },
    user: {
      from: 'user',
      default: () => ({ name: 'Guest', role: 'user' }) // 对象默认值必须用函数
    },
    config: {
      from: 'config',
      default: () => ({ api: '', timeout: 5000 })
    }
  }
}
</script>
```
:::

### 1.4、使用场景

:::tip inject
- 接收父组件通过 provide 提供的数据
- 跨级组件通信，避免逐层传递 props
- 获取全局配置和共享服务
- 组件库开发，使用统一的上下文
:::

## 十五、extends（扩展实例）

::: tip
1. 扩展另一个组件，继承其所有选项（data、methods、computed、生命周期等）
2. 类似于混入，但只能扩展一个组件
3. 扩展组件的选项会与当前组件合并，当前组件选项优先
4. 适合用于创建基于现有组件的变体，如基础组件和扩展组件
:::

### 1.1、基本用法

>[!note] extends 选项
>1. **类型**：`Object | Function`
>2. **作用**：继承另一个组件的所有选项
>3. **合并策略**：与 mixins 相同
>4. **优先级**：当前组件选项 > 扩展组件选项

:::details extends 基本用法示例
```javascript
// baseComponent.js - 基础组件
export const BaseComponent = {
  data() {
    return {
      baseData: '基础数据'
    }
  },
  methods: {
    baseMethod() {
      console.log('基础方法')
    }
  }
}
```

```vue
<!-- 扩展组件 -->
<template>
  <div>
    <p>{{ baseData }}</p>
    <p>{{ extendedData }}</p>
    <button @click="baseMethod">基础方法</button>
    <button @click="extendedMethod">扩展方法</button>
  </div>
</template>

<script>
import { BaseComponent } from './baseComponent'

export default {
  name: 'ExtendedComponent',
  extends: BaseComponent,
  data() {
    return {
      extendedData: '扩展数据'
    }
  },
  methods: {
    extendedMethod() {
      console.log('扩展方法')
    }
  }
}
</script>
```
:::

### 1.2、与 mixins 的区别

>[!note] extends vs mixins
>1. **extends**：只能扩展一个组件，适合创建组件变体
>2. **mixins**：可以混入多个对象，适合提取公共逻辑
>3. **使用场景**：extends 用于组件继承，mixins 用于功能混入
>4. **优先级**：组件选项 > extends > mixins

:::details extends vs mixins 对比
```javascript
// 基础组件
export const BaseComponent = {
  data() {
    return {
      baseData: '基础数据'
    }
  },
  methods: {
    baseMethod() {
      console.log('基础方法')
    }
  }
}

// 使用 extends
export default {
  extends: BaseComponent, // 只能扩展一个
  data() {
    return {
      extendedData: '扩展数据'
    }
  }
}

// 使用 mixins
export default {
  mixins: [BaseComponent, AnotherMixin], // 可以混入多个
  data() {
    return {
      localData: '本地数据'
    }
  }
}
```
:::

### 1.3、使用场景

:::tip extends
- 创建基于现有组件的变体
- 实现组件继承关系
- 扩展现有组件的功能
- 创建组件的基础版本和高级版本
:::

## 十六、render（渲染函数）

::: tip
1. 使用 JavaScript 编写模板，提供比模板语法更灵活的渲染方式
2. 接收 `h` 函数（createElement）作为参数，用于创建虚拟节点
3. 适合用于动态组件、复杂逻辑渲染、JSX 支持等场景
4. 当 `render` 和 `template` 同时存在时，`render` 优先级更高
:::

### 1.1、基本用法

>[!note] render 函数
>1. **类型**：`Function`
>2. **参数**：`h`（createElement 函数）
>3. **返回值**：`VNode`（虚拟节点）
>4. **优先级**：高于 `template` 选项

:::details render 基本用法示例
```vue
<script>
export default {
  name: 'RenderComponent',
  props: {
    level: {
      type: Number,
      default: 1
    },
    items: {
      type: Array,
      default: () => []
    }
  },
  render(h) {
    // 创建标题标签
    const tag = `h${this.level}`
    
    // 方式1：简单渲染
    // return h(tag, this.$slots.default)
    
    // 方式2：带属性的渲染
    return h(
      'div',
      {
        class: 'render-component',
        style: { color: 'red' },
        attrs: { id: 'my-component' },
        on: {
          click: this.handleClick
        }
      },
      [
        h(tag, `标题 ${this.level}`),
        h('ul', this.items.map(item => {
          return h('li', { key: item.id }, item.name)
        }))
      ]
    )
  },
  methods: {
    handleClick() {
      console.log('点击了')
    }
  }
}
</script>
```

```vue
<!-- 使用 JSX -->
<script>
export default {
  name: 'JSXComponent',
  props: {
    title: String,
    items: Array
  },
  render() {
    return (
      <div class="jsx-component">
        <h1>{this.title}</h1>
        <ul>
          {this.items.map(item => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      </div>
    )
  }
}
</script>
```
:::

### 1.2、createElement 参数

>[!note] createElement 参数
>1. **第一个参数**：标签名、组件选项或异步组件（必需）
>2. **第二个参数**：数据对象（可选），包含属性、样式、事件等
>3. **第三个参数**：子节点（可选），可以是字符串、数组或 VNode
>4. **返回值**：VNode 对象

:::details createElement 参数详解
```vue
<script>
export default {
  render(h) {
    return h(
      // 第一个参数：标签名或组件
      'div',
      
      // 第二个参数：数据对象
      {
        // class 和 style
        class: { 'my-class': true },
        style: { color: 'red', fontSize: '14px' },
        
        // 普通 HTML 属性
        attrs: {
          id: 'my-id',
          'data-test': 'test'
        },
        
        // DOM 属性
        props: {
          innerHTML: 'Hello'
        },
        
        // 事件监听器
        on: {
          click: this.handleClick,
          input: this.handleInput
        },
        
        // 原生事件监听器（使用 .native 修饰符）
        nativeOn: {
          click: this.nativeClickHandler
        },
        
        // 指令
        directives: [
          {
            name: 'my-directive',
            value: 'value',
            arg: 'arg',
            modifiers: { modifier1: true }
          }
        ],
        
        // 作用域插槽
        scopedSlots: {
          default: props => h('span', props.text)
        },
        
        // 插槽名称（如果组件是其他组件的子组件）
        slot: 'name-of-slot',
        
        // 其他特殊顶层属性
        key: 'myKey',
        ref: 'myRef',
        refInFor: true
      },
      
      // 第三个参数：子节点
      [
        '文本内容',
        h('p', '段落'),
        h(MyComponent, { props: { msg: 'Hello' } })
      ]
    )
  }
}
</script>
```
:::

### 1.3、使用场景

:::tip render
- 动态组件渲染，根据条件渲染不同的组件
- 复杂逻辑渲染，模板语法无法满足需求
- JSX 支持，使用 JSX 编写组件
- 组件库开发，需要更灵活的渲染控制
- 性能优化，某些场景下 render 函数性能更好
:::

### 1.4、render vs template

>[!note] render vs template
>1. **template**：更直观，适合大多数场景
>2. **render**：更灵活，适合复杂逻辑
>3. **性能**：在简单场景下性能相近，复杂场景 render 可能更优
>4. **选择建议**：优先使用 template，复杂场景使用 render

:::details render vs template 对比
```vue
<!-- template 方式 -->
<template>
  <div>
    <h1 v-if="level === 1">标题1</h1>
    <h2 v-else-if="level === 2">标题2</h2>
    <h3 v-else>标题3</h3>
  </div>
</template>

<!-- render 方式 -->
<script>
export default {
  props: {
    level: Number
  },
  render(h) {
    const tag = `h${this.level}`
    return h(tag, `标题${this.level}`)
  }
}
</script>
```
:::
