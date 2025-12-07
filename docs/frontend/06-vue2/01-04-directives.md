# 指令系统

- Vue 使用了基于 HTML 的模板语法，允许开发者声明式地将 DOM 绑定到底层 Vue 实例的数据。
- 所有指令都以 `v-` 开头，用于在模板中实现数据绑定、条件渲染、列表渲染等功能。

## 一、插值

### 1、文本插值

::: tip 说明
- **作用**：将数据渲染为纯文本，支持 JavaScript 表达式。
- **语法**：`{` `{`  `}` `}`
- **特点**：数据变化时自动更新，支持表达式计算。
- **使用场景**：显示文本内容、计算结果显示。
:::

```vue
<template>
  <div>
    <!-- 基本使用 -->
    <p>{{ message }}</p>
    
    <!-- 支持 JavaScript 表达式 -->
    <p>{{ message + ' World' }}</p>
    <p>{{ count * 2 }}</p>
    <p>{{ ok ? 'YES' : 'NO' }}</p>
    
    <!-- 支持方法调用 -->
    <p>{{ message.split('').reverse().join('') }}</p>
    
    <!-- 支持对象属性访问 -->
    <p>{{ user.name }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue!',
      count: 5,
      ok: true,
      user: {
        name: '张三'
      }
    }
  }
}
</script>
```

::: warning 注意事项
- 双大括号内的内容会被解析为 JavaScript 表达式
- 不支持语句（如 `if`、`for`），只支持表达式
- 可以使用三元运算符进行条件判断
:::

### 2、v-text

::: tip 说明
- **作用**：更新元素的 `textContent` 属性
- **语法**：`v-text="expression"`
- **特点**：与 `{{ }}` 功能相同，但会替换整个元素内容
- **使用场景**：需要完全替换元素内容时使用
:::

```vue
<template>
  <div>
    <!-- 使用 v-text -->
    <span v-text="message"></span>
    
    <!-- 等价于 -->
    <span>{{ message }}</span>
    
    <!-- v-text 会替换整个元素内容 -->
    <div v-text="message">
      这段内容会被替换
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue!'
    }
  }
}
</script>
```

::: warning 注意事项
- `v-text` 会替换元素的所有内容，包括子元素
- 如果需要部分替换，使用 `{{ }}` 更合适
- `v-text` 性能略好于 `{{ }}`，但差异很小
:::

### 3、v-html

::: tip 说明
- **作用**：将数据作为 HTML 插入到元素中
- **语法**：`v-html="expression"`
- **特点**：会解析 HTML 标签，渲染为真实的 DOM 元素
- **使用场景**：渲染富文本内容、动态 HTML 结构
:::

```vue
<template>
  <div>
    <!-- 普通插值不会解析 HTML -->
    <p>{{ rawHtml }}</p>
    <!-- 输出: <span style="color: red">红色文本</span> -->
    
    <!-- v-html 会解析 HTML -->
    <p v-html="rawHtml"></p>
    <!-- 输出: 红色文本（带红色样式） -->
    
    <!-- 复杂 HTML 结构 -->
    <div v-html="htmlContent"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      rawHtml: '<span style="color: red">红色文本</span>',
      htmlContent: `
        <h2>标题</h2>
        <p>段落内容</p>
        <ul>
          <li>列表项1</li>
          <li>列表项2</li>
        </ul>
      `
    }
  }
}
</script>
```

::: danger 安全警告
- **XSS 攻击风险**：`v-html` 会执行 HTML 中的脚本，存在安全风险
- **只对可信内容使用**：不要直接渲染用户输入的内容
- **建议**：使用 HTML 转义库（如 `DOMPurify`）对内容进行清理
:::

```vue
<template>
  <div>
    <!-- ❌ 危险：直接渲染用户输入 -->
    <div v-html="userInput"></div>
    
    <!-- ✅ 安全：先清理再渲染 -->
    <div v-html="sanitizedHtml"></div>
  </div>
</template>

<script>
import DOMPurify from 'dompurify'

export default {
  data() {
    return {
      userInput: '<script>alert("XSS")</script>',
      sanitizedHtml: ''
    }
  },
  mounted() {
    // 清理 HTML 内容
    this.sanitizedHtml = DOMPurify.sanitize(this.userInput)
  }
}
</script>
```

### 4、v-once

::: tip 说明
- **作用**：只渲染元素和组件一次，后续数据变化不再更新
- **语法**：`v-once` 或 `v-once="true"`
- **特点**：提高性能，避免不必要的重新渲染
- **使用场景**：静态内容、初始值展示、性能优化
:::

```vue
<template>
  <div>
    <!-- 普通插值：会随数据变化更新 -->
    <p>{{ message }}</p>
    
    <!-- v-once：只渲染一次，后续不更新 -->
    <p v-once>{{ message }}</p>
    
    <!-- 在组件上使用 -->
    <my-component v-once :prop="value"></my-component>
    
    <!-- 在 v-for 中使用 -->
    <div v-for="item in list" v-once :key="item.id">
      {{ item.name }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: '初始消息',
      value: '初始值',
      list: [
        { id: 1, name: '项目1' },
        { id: 2, name: '项目2' }
      ]
    }
  },
  mounted() {
    // 这些变化不会影响 v-once 的元素
    this.message = '新消息'
    this.value = '新值'
  }
}
</script>
```

::: tip 使用场景
- **静态内容**：展示不会变化的内容
- **性能优化**：减少不必要的重新渲染
- **初始值展示**：需要保留初始状态时
:::

### 5、v-pre

::: tip 说明
- **作用**：跳过这个元素和它的子元素的编译过程
- **语法**：`v-pre`
- **特点**：显示原始 Mustache 标签，不进行插值
- **使用场景**：显示原始模板代码、提高编译性能
:::

```vue
<template>
  <div>
    <!-- 普通插值：会被编译 -->
    <p>{{ message }}</p>
    <!-- 输出: Hello Vue! -->
    
    <!-- v-pre：跳过编译，显示原始内容 -->
    <p v-pre>{{ message }}</p>
    <!-- 输出: {{ message }} -->
    
    <!-- 在代码示例中使用 -->
    <pre v-pre>
      <code>
        {{ message }}
        {{ count }}
      </code>
    </pre>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue!',
      count: 10
    }
  }
}
</script>
```

::: tip 使用场景
- **代码示例**：展示 Vue 模板代码
- **文档说明**：显示原始语法
- **性能优化**：跳过不需要编译的内容
:::

### 6、v-cloak

::: tip 说明
- **作用**：防止页面加载时显示未编译的 Mustache 标签
- **语法**：`v-cloak`
- **特点**：需要配合 CSS 使用，在编译完成后自动移除
- **使用场景**：解决页面闪烁问题，提升用户体验
:::

```vue
<template>
  <div>
    <!-- 使用 v-cloak 防止闪烁 -->
    <div v-cloak>
      {{ message }}
    </div>
  </div>
</template>

<style>
/* 在 CSS 中隐藏未编译的内容 */
[v-cloak] {
  display: none;
}
</style>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue!'
    }
  }
}
</script>
```

**工作原理：**
1. 页面加载时，Vue 还未编译完成
 `v-cloak` 元素会被 CSS 隐藏
 Vue 编译完成后，自动移除 `v-cloak` 属性
 元素正常显示，避免显示 `{{ message }}` 这样的原始标签

::: tip 使用场景
- **解决闪烁**：防止页面加载时显示未编译的模板
- **提升体验**：让页面加载更平滑
- **大型应用**：在复杂应用中特别有用
:::

## 二、属性绑定

### 1、v-bind

::: tip 说明
- **作用**：动态绑定 HTML 属性、组件 props、class、style 等
- **语法**：`v-bind:attribute="expression"` 或简写 `:attribute="expression"`
- **特点**：支持表达式、对象、数组等多种绑定方式
- **使用场景**：动态属性、条件样式、组件传参
:::

#### 1.1、基本属性绑定

```vue
<template>
  <div>
    <!-- 完整写法 -->
    <img v-bind:src="imageSrc" v-bind:alt="imageAlt">
    
    <!-- 简写形式（推荐） -->
    <img :src="imageSrc" :alt="imageAlt">
    
    <!-- 绑定多个属性 -->
    <a :href="url" :target="target" :title="title">链接</a>
    
    <!-- 支持表达式 -->
    <div :id="'item-' + id">内容</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      imageSrc: 'https://example.com/image.jpg',
      imageAlt: '示例图片',
      url: 'https://vuejs.org',
      target: '_blank',
      title: 'Vue官网',
      id: 123
    }
  }
}
</script>
```

#### 1.2、绑定 class

```vue
<template>
  <div>
    <!-- 对象语法 -->
    <div :class="{ active: isActive, 'text-danger': hasError }"></div>
    
    <!-- 数组语法 -->
    <div :class="[activeClass, errorClass]"></div>
    
    <!-- 混合使用 -->
    <div :class="[{ active: isActive }, errorClass]"></div>
    
    <!-- 计算属性（推荐） -->
    <div :class="classObject"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isActive: true,
      hasError: false,
      activeClass: 'active',
      errorClass: 'text-danger'
    }
  },
  computed: {
    classObject() {
      return {
        active: this.isActive && !this.error,
        'text-danger': this.error && this.error.type === 'fatal'
      }
    }
  }
}
</script>
```

#### 1.3、绑定 style

```vue
<template>
  <div>
    <!-- 对象语法 -->
    <div :style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
    
    <!-- 数组语法（合并多个对象） -->
    <div :style="[baseStyles, overridingStyles]"></div>
    
    <!-- 自动添加前缀 -->
    <div :style="{ display: ['-webkit-box', '-ms-flexbox', 'flex'] }"></div>
    
    <!-- 计算属性（推荐） -->
    <div :style="styleObject"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      activeColor: 'red',
      fontSize: 16,
      baseStyles: {
        color: 'blue',
        fontSize: '14px'
      },
      overridingStyles: {
        fontWeight: 'bold'
      }
    }
  },
  computed: {
    styleObject() {
      return {
        color: this.activeColor,
        fontSize: this.fontSize + 'px'
      }
    }
  }
}
</script>
```

#### 1.4、绑定 props

```vue
<!-- 父组件 -->
<template>
  <div>
    <child-component 
      :title="title"
      :user="user"
      :count="count"
    ></child-component>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: '标题',
      user: { name: '张三', age: 25 },
      count: 10
    }
  }
}
</script>
```

::: tip 最佳实践
- **优先使用简写**：`:attribute` 比 `v-bind:attribute` 更简洁
- **复杂逻辑用计算属性**：class 和 style 的复杂绑定使用计算属性
- **避免内联对象**：在模板中直接写对象会影响可读性
:::

## 三、条件渲染

### 1、v-if / v-else-if / v-else

::: tip 说明
- **作用**：根据条件决定 **是否** 渲染元素
- **语法**：`v-if="condition"`、`v-else-if="condition"`、`v-else`
- **特点**：条件为 false 时，元素不会被渲染到 DOM（完全移除）
- **使用场景**：条件显示、权限控制、多条件判断
:::

```vue
<template>
  <div>
    <!-- 基本使用 -->
    <p v-if="isVisible">显示内容</p>
    
    <!-- v-if / v-else -->
    <p v-if="score >= 60">及格</p>
    <p v-else>不及格</p>
    
    <!-- v-if / v-else-if / v-else -->
    <div v-if="type === 'A'">类型 A</div>
    <div v-else-if="type === 'B'">类型 B</div>
    <div v-else-if="type === 'C'">类型 C</div>
    <div v-else>其他类型</div>
    
    <!-- 在 template 上使用 -->
    <template v-if="ok">
      <h1>标题</h1>
      <p>段落1</p>
      <p>段落2</p>
    </template>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isVisible: true,
      score: 85,
      type: 'A',
      ok: true
    }
  }
}
</script>
```

::: warning 注意事项
- **key 属性**：Vue 会复用元素，如果需要强制替换，使用 `key` 属性
- **性能考虑**：频繁切换时，`v-show` 性能更好
- **v-else 必须紧跟在 v-if 或 v-else-if 后面**
:::

```vue
<template>
  <div>
    <!-- 使用 key 强制替换元素 -->
    <template v-if="loginType === 'username'">
      <label>用户名</label>
      <input placeholder="输入用户名" key="username-input">
    </template>
    <template v-else>
      <label>邮箱</label>
      <input placeholder="输入邮箱" key="email-input">
    </template>
    <button @click="toggleLoginType">切换登录方式</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loginType: 'username'
    }
  },
  methods: {
    toggleLoginType() {
      this.loginType = this.loginType === 'username' ? 'email' : 'username'
    }
  }
}
</script>
```

### 2、v-show

::: tip 说明
- **作用**：根据条件切换元素的 `display` CSS 属性
- **语法**：`v-show="condition"`
- **特点**：元素始终渲染，只是切换显示/隐藏
- **使用场景**：频繁切换显示、简单的显示/隐藏
:::

```vue
<template>
  <div>
    <!-- 基本使用 -->
    <p v-show="isVisible">显示/隐藏内容</p>
    
    <!-- 支持表达式 -->
    <div v-show="count > 0">计数大于0时显示</div>
    
    <!-- 在组件上使用 -->
    <my-component v-show="showComponent"></my-component>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isVisible: true,
      count: 5,
      showComponent: true
    }
  }
}
</script>
```

### 3、v-if vs v-show

| 特性 | v-if | v-show |
|------|------|--------|
| **DOM 渲染** | 条件为 false 时不渲染 | 始终渲染，只切换 display |
| **切换开销** | 高（需要创建/销毁元素） | 低（只切换 CSS） |
| **初始渲染** | 低（条件为 false 时不渲染） | 高（始终渲染） |
| **适用场景** | 很少切换、条件很少为 true | 频繁切换 |
| **生命周期** | 会触发组件的创建/销毁 | 不会触发 |

```vue
<template>
  <div>
    <!-- v-if：适合很少切换的场景 -->
    <div v-if="user.role === 'admin'">
      <admin-panel></admin-panel>
    </div>
    
    <!-- v-show：适合频繁切换的场景 -->
    <div v-show="isMenuOpen">
      <menu></menu>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: { role: 'admin' },
      isMenuOpen: true
    }
  }
}
</script>
```

::: tip 选择建议
- **使用 v-if**：条件很少改变、需要条件性渲染组件
- **使用 v-show**：需要频繁切换显示/隐藏
- **性能优先**：如果性能是主要考虑，频繁切换用 `v-show`，很少切换用 `v-if`
:::

## 四、列表渲染

### 1、v-for

::: tip 说明
- **作用**：基于源数据多次渲染元素或模板块
- **语法**：`v-for="item in items"` 或 `v-for="(item, index) in items"`
- **特点**：支持数组、对象、数字、字符串等多种数据源
- **使用场景**：列表展示、表格渲染、菜单生成
:::

#### 1.1、遍历数组

```vue
<template>
  <div>
    <!-- 基本语法 -->
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
    
    <!-- 带索引 -->
    <ul>
      <li v-for="(item, index) in items" :key="item.id">
        {{ index + 1 }}. {{ item.name }}
      </li>
    </ul>
    
    <!-- 使用 of 替代 in -->
    <div v-for="item of items" :key="item.id">
      {{ item.name }}
    </div>
    
    <!-- 在 template 上使用 -->
    <template v-for="item in items">
      <div :key="item.id">{{ item.name }}</div>
      <div :key="item.id + '-desc'">{{ item.description }}</div>
    </template>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { id: 1, name: '苹果', description: '红色水果' },
        { id: 2, name: '香蕉', description: '黄色水果' },
        { id: 3, name: '橙子', description: '橙色水果' }
      ]
    }
  }
}
</script>
```

#### 1.2、遍历对象

```vue
<template>
  <div>
    <!-- 遍历对象的值 -->
    <ul>
      <li v-for="value in object" :key="value">
        {{ value }}
      </li>
    </ul>
    
    <!-- 遍历对象的键和值 -->
    <ul>
      <li v-for="(value, key) in object" :key="key">
        {{ key }}: {{ value }}
      </li>
    </ul>
    
    <!-- 遍历对象的键、值和索引 -->
    <ul>
      <li v-for="(value, key, index) in object" :key="key">
        {{ index }}. {{ key }}: {{ value }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      object: {
        title: 'Vue 教程',
        author: 'Vue 团队',
        publishedAt: '2024-01-01'
      }
    }
  }
}
</script>
```

#### 1.3、遍历数字

```vue
<template>
  <div>
    <!-- 遍历数字（从 1 开始） -->
    <span v-for="n in 10" :key="n">{{ n }} </span>
    <!-- 输出: 1 2 3 4 5 6 7 8 9 10 -->
  </div>
</template>
```

#### 1.4、嵌套 v-for

```vue
<template>
  <div>
    <div v-for="category in categories" :key="category.id">
      <h3>{{ category.name }}</h3>
      <ul>
        <li v-for="item in category.items" :key="item.id">
          {{ item.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      categories: [
        {
          id: 1,
          name: '水果',
          items: [
            { id: 1, name: '苹果' },
            { id: 2, name: '香蕉' }
          ]
        },
        {
          id: 2,
          name: '蔬菜',
          items: [
            { id: 3, name: '胡萝卜' },
            { id: 4, name: '西红柿' }
          ]
        }
      ]
    }
  }
}
</script>
```

### 2、key 属性

::: tip 说明
- **作用**：为每个节点提供唯一标识，帮助 Vue 追踪节点
- **语法**：`:key="uniqueValue"`
- **特点**：必须提供，且应该是唯一值
- **使用场景**：列表渲染时必须使用
:::

```vue
<template>
  <div>
    <!-- ✅ 正确：使用唯一 ID -->
    <div v-for="item in items" :key="item.id">
      {{ item.name }}
    </div>
    
    <!-- ✅ 正确：使用唯一值 -->
    <div v-for="(item, index) in items" :key="item.id || index">
      {{ item.name }}
    </div>
    
    <!-- ❌ 错误：使用 index 作为 key（当列表会变化时） -->
    <div v-for="(item, index) in items" :key="index">
      {{ item.name }}
    </div>
  </div>
</template>
```

::: warning 重要提示
- **必须提供 key**：使用 `v-for` 时必须提供 `key` 属性
- **使用唯一值**：`key` 应该是唯一标识，不要使用 `index`（除非列表不会变化）
- **性能优化**：正确的 `key` 可以帮助 Vue 高效地更新 DOM
:::

**为什么需要 key？**

```vue
<template>
  <div>
    <!-- 没有 key 时，Vue 会复用元素 -->
    <div v-for="item in items">
      <input :value="item.name">
    </div>
    
    <!-- 有 key 时，Vue 可以正确追踪每个元素 -->
    <div v-for="item in items" :key="item.id">
      <input :value="item.name">
    </div>
  </div>
</template>
```

### 3、数组更新检测

Vue 对以下数组方法进行了包装，可以触发视图更新：

```vue
<template>
  <div>
    <ul>
      <li v-for="item in items" :key="item.id">{{ item.name }}</li>
    </ul>
    <button @click="addItem">添加</button>
    <button @click="removeItem">删除</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { id: 1, name: '项目1' },
        { id: 2, name: '项目2' }
      ]
    }
  },
  methods: {
    addItem() {
      // ✅ 这些方法会触发视图更新
      this.items.push({ id: 3, name: '项目3' })
      // this.items.pop()
      // this.items.shift()
      // this.items.unshift()
      // this.items.splice()
      // this.items.sort()
      // this.items.reverse()
    },
    removeItem() {
      // ✅ 使用 Vue.set 或 this.$set
      this.$set(this.items, 0, { id: 1, name: '修改后的项目1' })
      
      // ✅ 或者使用 splice
      this.items.splice(0, 1, { id: 1, name: '修改后的项目1' })
    }
  }
}
</script>
```

::: warning 注意事项
- **变异方法**：`push`、`pop`、`shift`、`unshift`、`splice`、`sort`、`reverse` 会触发视图更新
- **替换数组**：`filter`、`concat`、`slice` 不会改变原数组，需要重新赋值
- **直接修改索引**：`this.items[0] = newValue` 不会触发更新，需要使用 `Vue.set` 或 `this.$set`
:::

## 五、事件处理

### 1、v-on

::: tip 说明
- **作用**：监听 DOM 事件，执行 JavaScript 代码
- **语法**：`v-on:event="handler"` 或简写 `@event="handler"`
- **特点**：支持内联语句、方法调用、事件对象访问
- **使用场景**：用户交互、表单提交、组件通信
:::

#### 1.1、基本使用

```vue
<template>
  <div>
    <!-- 完整写法 -->
    <button v-on:click="handleClick">点击</button>
    
    <!-- 简写形式（推荐） -->
    <button @click="handleClick">点击</button>
    
    <!-- 内联语句 -->
    <button @click="count++">计数: {{ count }}</button>
    
    <!-- 方法调用 -->
    <button @click="greet('Hello', $event)">问候</button>
    
    <!-- 多个语句 -->
    <button @click="count++; message = '已点击'">多语句</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0,
      message: ''
    }
  },
  methods: {
    handleClick() {
      console.log('按钮被点击')
    },
    greet(greeting, event) {
      console.log(greeting)
      if (event) {
        console.log(event.target.tagName)
      }
    }
  }
}
</script>
```

#### 1.2、事件对象

```vue
<template>
  <div>
    <!-- 自动传入事件对象 -->
    <button @click="handleClick">点击</button>
    
    <!-- 手动传入事件对象 -->
    <button @click="handleClick($event)">点击</button>
    
    <!-- 传递参数和事件对象 -->
    <button @click="handleClick('参数', $event)">点击</button>
  </div>
</template>

<script>
export default {
  methods: {
    handleClick(message, event) {
      console.log(message) // '参数'
      console.log(event.target) // 按钮元素
      console.log(event.type) // 'click'
    }
  }
}
</script>
```

### 2、事件修饰符

::: tip 说明
- **作用**：简化常见的事件处理逻辑
- **语法**：`@event.modifier`
- **特点**：可以链式调用多个修饰符
- **使用场景**：阻止默认行为、阻止冒泡、事件捕获等
:::

```vue
<template>
  <div>
    <!-- .stop - 阻止事件冒泡 -->
    <div @click="doThis">
      <button @click.stop="doThat">点击</button>
    </div>
    
    <!-- .prevent - 阻止默认行为 -->
    <form @submit.prevent="onSubmit">
      <button type="submit">提交</button>
    </form>
    
    <!-- .capture - 使用事件捕获模式 -->
    <div @click.capture="doThis">
      <button @click="doThat">点击</button>
    </div>
    
    <!-- .self - 只有 event.target 是当前元素时才触发 -->
    <div @click.self="doThat">
      <button>点击</button>
    </div>
    
    <!-- .once - 事件只触发一次 -->
    <button @click.once="doThis">只触发一次</button>
    
    <!-- .passive - 滚动事件的默认行为会立即触发 -->
    <div @scroll.passive="onScroll">滚动内容</div>
    
    <!-- 链式调用 -->
    <form @submit.prevent.stop="onSubmit">
      <button type="submit">提交</button>
    </form>
  </div>
</template>

<script>
export default {
  methods: {
    doThis() {
      console.log('doThis')
    },
    doThat() {
      console.log('doThat')
    },
    onSubmit() {
      console.log('提交')
    },
    onScroll() {
      console.log('滚动')
    }
  }
}
</script>
```

### 3、按键修饰符

```vue
<template>
  <div>
    <!-- 按键别名 -->
    <input @keyup.enter="submit">
    <input @keyup.tab="onTab">
    <input @keyup.delete="onDelete">
    <input @keyup.esc="cancel">
    <input @keyup.space="onSpace">
    <input @keyup.up="onUp">
    <input @keyup.down="onDown">
    <input @keyup.left="onLeft">
    <input @keyup.right="onRight">
    
    <!-- 按键码（不推荐，已废弃） -->
    <input @keyup.13="submit">
    
    <!-- 系统修饰键 -->
    <input @keyup.ctrl.enter="submit">
    <input @keyup.alt.enter="submit">
    <input @keyup.shift.enter="submit">
    <input @keyup.meta.enter="submit">
    
    <!-- .exact 修饰符：精确控制 -->
    <button @click.ctrl.exact="onCtrlClick">只有 Ctrl 时触发</button>
    
    <!-- 鼠标按钮修饰符 -->
    <button @click.left="onLeftClick">左键</button>
    <button @click.right="onRightClick">右键</button>
    <button @click.middle="onMiddleClick">中键</button>
  </div>
</template>

<script>
export default {
  methods: {
    submit() {
      console.log('提交')
    },
    cancel() {
      console.log('取消')
    },
    onCtrlClick() {
      console.log('Ctrl + Click')
    }
  }
}
</script>
```

## 六、双向绑定

### 1、v-model

::: tip 说明
- **作用**：在表单元素上创建双向数据绑定
- **语法**：`v-model="dataProperty"`
- **特点**：自动处理用户输入，同步数据
- **原理**：`v-model` 是语法糖，本质上是 `v-bind` 和 `v-on` 的组合
- **使用场景**：表单输入、组件通信
:::


#### 1.1、文本输入

```vue
<template>
  <div>
    <!-- 单行文本 -->
    <input v-model="message" placeholder="输入消息">
    <p>消息: {{ message }}</p>
    
    <!-- 多行文本 -->
    <textarea v-model="text" placeholder="输入多行文本"></textarea>
    <p>文本: {{ text }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: '',
      text: ''
    }
  }
}
</script>
```

#### 1.2、复选框

```vue
<template>
  <div>
    <!-- 单个复选框（布尔值） -->
    <input type="checkbox" id="checkbox" v-model="checked">
    <label for="checkbox">{{ checked }}</label>
    
    <!-- 多个复选框（数组） -->
    <input type="checkbox" id="apple" value="苹果" v-model="checkedFruits">
    <label for="apple">苹果</label>
    <input type="checkbox" id="banana" value="香蕉" v-model="checkedFruits">
    <label for="banana">香蕉</label>
    <input type="checkbox" id="orange" value="橙子" v-model="checkedFruits">
    <label for="orange">橙子</label>
    <p>选中的水果: {{ checkedFruits }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      checked: false,
      checkedFruits: []
    }
  }
}
</script>
```

#### 1.3、单选按钮

```vue
<template>
  <div>
    <input type="radio" id="one" value="选项1" v-model="picked">
    <label for="one">选项1</label>
    <br>
    <input type="radio" id="two" value="选项2" v-model="picked">
    <label for="two">选项2</label>
    <br>
    <span>选中的是: {{ picked }}</span>
  </div>
</template>

<script>
export default {
  data() {
    return {
      picked: ''
    }
  }
}
</script>
```

#### 1.4、选择框

```vue
<template>
  <div>
    <!-- 单选 -->
    <select v-model="selected">
      <option disabled value="">请选择</option>
      <option>A</option>
      <option>B</option>
      <option>C</option>
    </select>
    <p>选中的是: {{ selected }}</p>
    
    <!-- 多选 -->
    <select v-model="selectedMultiple" multiple>
      <option>A</option>
      <option>B</option>
      <option>C</option>
    </select>
    <p>选中的是: {{ selectedMultiple }}</p>
    
    <!-- 动态选项 -->
    <select v-model="selectedDynamic">
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.text }}
      </option>
    </select>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selected: '',
      selectedMultiple: [],
      selectedDynamic: '',
      options: [
        { text: '选项1', value: 'A' },
        { text: '选项2', value: 'B' },
        { text: '选项3', value: 'C' }
      ]
    }
  }
}
</script>
```

### 2、原理说明

`v-model` 是 Vue 提供的语法糖，它实际上是 `v-bind` 和 `v-on` 的组合。不同表单元素的实现方式不同：

**1. 文本输入框（input、textarea）**

```vue
<!-- v-model 写法 -->
<input v-model="message">

<!-- 等价于 -->
<input 
  :value="message" 
  @input="message = $event.target.value"
>
```

**2. 复选框（checkbox）**

```vue
<!-- 单个复选框 -->
<input type="checkbox" v-model="checked">

<!-- 等价于 -->
<input 
  type="checkbox"
  :checked="checked"
  @change="checked = $event.target.checked"
>

<!-- 多个复选框（数组） -->
<input type="checkbox" value="苹果" v-model="fruits">

<!-- 等价于 -->
<input 
  type="checkbox"
  value="苹果"
  :checked="fruits.includes('苹果')"
  @change="handleFruitChange($event)"
>
```

**3. 单选按钮（radio）**

```vue
<!-- v-model 写法 -->
<input type="radio" value="选项1" v-model="picked">

<!-- 等价于 -->
<input 
  type="radio"
  value="选项1"
  :checked="picked === '选项1'"
  @change="picked = $event.target.value"
>
```

**4. 选择框（select）**

```vue
<!-- v-model 写法 -->
<select v-model="selected">
  <option value="A">选项A</option>
</select>

<!-- 等价于 -->
<select 
  :value="selected"
  @change="selected = $event.target.value"
>
  <option value="A">选项A</option>
</select>
```

**5. 在组件上使用 v-model**

```vue
<!-- 父组件 -->
<custom-input v-model="message"></custom-input>

<!-- 等价于 -->
<custom-input 
  :value="message"
  @input="message = $event"
></custom-input>
```

```vue
<!-- 子组件需要接收 value prop 并触发 input 事件 -->
<template>
  <input 
    :value="value"
    @input="$emit('input', $event.target.value)"
  >
</template>

<script>
export default {
  props: ['value']
}
</script>
```


**工作原理总结：**

1. **数据绑定**：使用 `v-bind` 将数据绑定到表单元素的 `value`（或 `checked`）属性
2. **事件监听**：使用 `v-on` 监听表单元素的 `input`（或 `change`）事件
3. **数据更新**：当用户输入时，通过事件处理函数更新数据
4. **自动同步**：数据更新后，由于响应式系统，视图自动更新

**优势：**
- 简化代码：不需要手动写 `:value` 和 `@input`
- 统一接口：不同表单元素使用相同的语法
- 自动处理：Vue 自动处理不同表单元素的差异



### 3、v-model 修饰符

::: tip 修饰符说明
Vue 为 `v-model` 提供了三个修饰符，用于处理常见的输入场景：

1. **`.lazy`**：将 `input` 事件改为 `change` 事件，在失去焦点或按回车时才同步数据，减少更新频率
2. **`.number`**：自动将用户输入转换为数字类型，使用 `parseFloat()` 解析
3. **`.trim`**：自动去除用户输入的首尾空白字符，使用 `String.prototype.trim()` 方法

这些修饰符可以单独使用，也可以组合使用（如 `v-model.lazy.trim`）。
:::

#### 3.1、.lazy

::: tip 说明
- **作用**：将 `input` 事件改为 `change` 事件，在失去焦点或按回车时才同步数据
- **语法**：`v-model.lazy="dataProperty"`
- **使用场景**：减少更新频率，提升性能，适合不需要实时同步的场景
- **原理**：默认情况下，`v-model` 在每次 `input` 事件触发时同步数据，`.lazy` 修饰符改为在 `change` 事件时同步
:::

```vue
<template>
  <div>
    <!-- 默认行为：每次输入都同步 -->
    <input v-model="message1" placeholder="实时同步">
    <p>实时: {{ message1 }}</p>
    
    <!-- 使用 .lazy：失去焦点或按回车时同步 -->
    <input v-model.lazy="message2" placeholder="延迟同步">
    <p>延迟: {{ message2 }}</p>
    
    <!-- 等价写法 -->
    <input 
      :value="message2"
      @change="message2 = $event.target.value"
      placeholder="等价写法"
    >
  </div>
</template>

<script>
export default {
  data() {
    return {
      message1: '',
      message2: ''
    }
  }
}
</script>
```

**使用场景：**
- 搜索框：用户输入完成后才触发搜索
- 表单验证：失去焦点时验证
- 性能优化：减少频繁的数据更新

#### 3.2、.number

::: tip 说明
- **作用**：自动将用户输入转换为数字类型
- **语法**：`v-model.number="dataProperty"`
- **使用场景**：数字输入框、年龄、数量等需要数字类型的场景
- **原理**：使用 `parseFloat()` 解析输入值，如果解析结果是 `NaN`，则返回原始值
:::

```vue
<template>
  <div>
    <!-- 不使用 .number：返回字符串 -->
    <input v-model="age1" type="number" placeholder="输入年龄">
    <p>类型: {{ typeof age1 }}，值: {{ age1 }}</p>
    <!-- 输出: 类型: string，值: "25" -->
    
    <!-- 使用 .number：自动转换为数字 -->
    <input v-model.number="age2" type="number" placeholder="输入年龄">
    <p>类型: {{ typeof age2 }}，值: {{ age2 }}</p>
    <!-- 输出: 类型: number，值: 25 -->
    
    <!-- 计算示例 -->
    <input v-model.number="num1" type="number" placeholder="数字1">
    <input v-model.number="num2" type="number" placeholder="数字2">
    <p>和: {{ num1 + num2 }}</p>
    <!-- 如果不用 .number，会是字符串拼接 "25" + "10" = "2510" -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      age1: '',
      age2: 0,
      num1: 0,
      num2: 0
    }
  }
}
</script>
```
::: danger 注意事项：
- 如果输入值无法解析为数字，会返回原始字符串
- 空字符串会转换为空字符串（不是 0）
- 建议配合 `type="number"` 使用，但即使不使用也能工作
:::
```vue
<template>
  <div>
    <input v-model.number="value" placeholder="输入数字">
    <p>值: {{ value }}，类型: {{ typeof value }}</p>
    <!-- 
      输入 "123" → 123 (number)
      输入 "abc" → "abc" (string)
      输入 "" → "" (string)
      输入 "12.5" → 12.5 (number)
    -->
  </div>
</template>
```

#### 3.3、.trim

::: tip 说明
- **作用**：自动去除用户输入的首尾空白字符
- **语法**：`v-model.trim="dataProperty"`
- **使用场景**：用户名、邮箱、搜索关键词等需要去除首尾空格的场景
- **原理**：使用 `String.prototype.trim()` 方法去除首尾空格
:::

```vue
<template>
  <div>
    <!-- 不使用 .trim：保留空格 -->
    <input v-model="username1" placeholder="输入用户名">
    <p>长度: {{ username1.length }}，值: "{{ username1 }}"</p>
    <!-- 输入 "  admin  " → 长度: 10，值: "  admin  " -->
    
    <!-- 使用 .trim：自动去除首尾空格 -->
    <input v-model.trim="username2" placeholder="输入用户名">
    <p>长度: {{ username2.length }}，值: "{{ username2 }}"</p>
    <!-- 输入 "  admin  " → 长度: 5，值: "admin" -->
    
    <!-- 登录示例 -->
    <input v-model.trim="email" type="email" placeholder="邮箱">
    <input v-model.trim="password" type="password" placeholder="密码">
    <button @click="login">登录</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username1: '',
      username2: '',
      email: '',
      password: ''
    }
  },
  methods: {
    login() {
      // 使用 .trim 后，不需要手动去除空格
      console.log('邮箱:', this.email) // 已去除首尾空格
      console.log('密码:', this.password) // 已去除首尾空格
    }
  }
}
</script>
```

**使用场景：**
- 用户输入：用户名、邮箱、手机号等
- 表单验证：避免因空格导致的验证失败
- 数据存储：确保存储的数据没有多余空格

**注意事项：**
- `.trim` 只去除首尾空格，不会去除中间的空格
- 如果用户输入全是空格，会变成空字符串

#### 3.4、修饰符组合使用

多个修饰符可以组合使用，按顺序执行：

```vue
<template>
  <div>
    <!-- 组合使用：先 trim，再 number，最后 lazy -->
    <input v-model.lazy.trim.number="value" type="text" placeholder="输入数字">
    <p>值: {{ value }}，类型: {{ typeof value }}</p>
    
    <!-- 执行顺序说明 -->
    <!-- 
      1. 用户输入: "  123  "
      2. .trim: "123"
      3. .number: 123 (number)
      4. .lazy: 失去焦点时同步
    -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      value: 0
    }
  }
}
</script>
```

::: warning 注意事项
- 修饰符的执行顺序：从左到右
- `.lazy` 会影响同步时机，建议放在最后
- `.number` 和 `.trim` 可以同时使用
- 组合使用时要注意执行顺序的影响
:::

#### 3.5、修饰符对比总结

| 修饰符 | 作用 | 使用场景 | 示例 |
|--------|------|---------|------|
| `.lazy` | 延迟同步（change 事件） | 搜索框、表单验证 | `v-model.lazy="search"` |
| `.number` | 转换为数字 | 数字输入、计算 | `v-model.number="age"` |
| `.trim` | 去除首尾空格 | 用户名、邮箱 | `v-model.trim="email"` |

**最佳实践：**
- 搜索框使用 `.lazy` 减少请求频率
- 数字输入使用 `.number` 确保类型正确
- 用户输入使用 `.trim` 避免空格问题



## 七、插槽

### 7.1、v-slot

::: tip 说明
- **作用**：定义插槽内容，用于组件内容分发
- **语法**：`v-slot:slotName` 或简写 `#slotName`
- **特点**：Vue 6+ 新增，替代了 `slot` 和 `slot-scope`
- **使用场景**：组件内容分发、作用域插槽
:::

```vue
<!-- 子组件 -->
<template>
  <div>
    <header>
      <slot name="header"></slot>
    </header>
    <main>
      <slot :user="user"></slot>
    </main>
    <footer>
      <slot name="footer"></slot>
    </footer>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: { name: '张三' }
    }
  }
}
</script>
```

```vue
<!-- 父组件 -->
<template>
  <child-component>
    <!-- 具名插槽 -->
    <template v-slot:header>
      <h1>标题</h1>
    </template>
    
    <!-- 默认插槽（作用域插槽） -->
    <template v-slot:default="slotProps">
      <p>用户: {{ slotProps.user.name }}</p>
    </template>
    
    <!-- 简写形式 -->
    <template #footer>
      <p>页脚</p>
    </template>
  </child-component>
</template>
```

## 八、指令总结

### 8.1、内置指令列表

| 指令 | 说明 | 使用场景 |
|------|------|---------|
| `v-text` | 更新元素的 textContent | 纯文本显示 |
| `v-html` | 更新元素的 innerHTML | HTML 内容渲染（需注意安全） |
| `v-show` | 切换元素的 display 属性 | 频繁显示/隐藏 |
| `v-if` | 条件渲染元素 | 条件性显示内容 |
| `v-else-if` | v-if 的 else-if 块 | 多条件判断 |
| `v-else` | v-if 的 else 块 | 默认情况 |
| `v-for` | 列表渲染 | 遍历数组、对象 |
| `v-on` | 事件监听 | 用户交互处理 |
| `v-bind` | 属性绑定 | 动态属性、样式、类 |
| `v-model` | 双向数据绑定 | 表单输入 |
| `v-pre` | 跳过编译 | 显示原始模板 |
| `v-cloak` | 防止闪烁 | 解决加载闪烁问题 |
| `v-once` | 只渲染一次 | 静态内容、性能优化 |
| `v-slot` | 插槽内容 | 组件内容分发 |

### 8.2、最佳实践

::: tip 最佳实践
- **合理选择指令**：根据场景选择最合适的指令
- **性能优化**：频繁切换用 `v-show`，很少切换用 `v-if`
- **安全考虑**：谨慎使用 `v-html`，避免 XSS 攻击
- **key 属性**：使用 `v-for` 时必须提供唯一的 `key`
- **修饰符使用**：合理使用修饰符简化代码
- **代码可读性**：复杂逻辑使用计算属性或方法
:::

## 九、总结

Vue 的指令系统提供了强大的模板功能：

- **插值**：`{` `{` `}` `}`、`v-text`、`v-html`、`v-once`、`v-pre`、`v-cloak`
- **属性绑定**：`v-bind`（`:`) 用于动态属性、样式、类
- **条件渲染**：`v-if`、`v-else-if`、`v-else`、`v-show`
- **列表渲染**：`v-for` 遍历数组、对象、数字
- **事件处理**：`v-on`（`@`）监听 DOM 事件
- **双向绑定**：`v-model` 实现表单双向绑定
- **插槽**：`v-slot`（`#`）用于组件内容分发
