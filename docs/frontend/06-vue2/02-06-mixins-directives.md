---
title: "2.6 混入（Mixin）与自定义指令"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "混入提供了一种非常灵活的方式，来分发 Vue 组件中的可复用功能。 当组件和混入对象含有同名选项时，会进行合并： 合并规则： data：递归合并，组件数据优先 methods：合并，组件方法优先 生命周期钩子：合并为数组，混入的钩子先执行 ..."
---

# 2.6 混入（Mixin）与自定义指令

## 混入（Mixin）

混入提供了一种非常灵活的方式，来分发 Vue 组件中的可复用功能。

### 基本用法

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

### 选项合并

当组件和混入对象含有同名选项时，会进行合并：

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
      message: 'component',  // 组件数据优先
      bar: 'foo'
    }
  },
  methods: {
    bar() {
      console.log('component bar')
    },
    conflicting() {  // 组件方法优先
      console.log('from component')
    }
  },
  created() {
    console.log(this.message)  // 'component'
    console.log(this.foo)      // 'bar'
    this.foo()  // 'mixin foo'
    this.bar()  // 'component bar'
    this.conflicting()  // 'from component'
  }
}
</script>
```

**合并规则**：
- **data**：递归合并，组件数据优先
- **methods**：合并，组件方法优先
- **生命周期钩子**：合并为数组，混入的钩子先执行
- **其他选项**：组件选项优先

### 全局混入

```javascript
// main.js
import Vue from 'vue'

Vue.mixin({
  created() {
    console.log('global mixin created')
  }
})
```

**注意**：全局混入会影响所有组件，谨慎使用。

### 混入示例

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
    handleSubmit() {
      // 提交表单逻辑
      console.log('提交', this.formData)
    }
  }
}
</script>
```

## 自定义指令

除了核心功能默认内置的指令（v-model 和 v-show），Vue 也允许注册自定义指令。

### 基本用法

```javascript
// 全局注册
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

### 局部注册

```vue
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

### 指令钩子函数

一个指令定义对象可以提供如下几个钩子函数：

```javascript
Vue.directive('my-directive', {
  // 只调用一次，指令第一次绑定到元素时调用
  bind(el, binding, vnode) {
    // el: 指令绑定的元素
    // binding: 包含指令信息的对象
    // vnode: Vue 编译生成的虚拟节点
  },
  
  // 被绑定元素插入父节点时调用
  inserted(el, binding, vnode) {
    // 此时可以访问父节点
  },
  
  // 所在组件的 VNode 更新时调用
  update(el, binding, vnode, oldVnode) {
    // 但是可能发生在其子 VNode 更新之前
  },
  
  // 指令所在组件的 VNode 及其子 VNode 全部更新后调用
  componentUpdated(el, binding, vnode, oldVnode) {
    // 
  },
  
  // 只调用一次，指令与元素解绑时调用
  unbind(el, binding, vnode) {
    // 清理工作
  }
})
```

### binding 对象

```javascript
{
  name: 'directive-name',  // 指令名
  value: 'value',           // 指令的绑定值
  oldValue: 'old-value',    // 指令绑定的前一个值（仅在 update 和 componentUpdated 中可用）
  expression: 'expression',  // 字符串形式的指令表达式
  arg: 'arg',               // 传给指令的参数
  modifiers: {              // 一个包含修饰符的对象
    modifier1: true,
    modifier2: true
  }
}
```

### 自定义指令示例

#### 示例1：自动聚焦

```javascript
Vue.directive('focus', {
  inserted(el) {
    el.focus()
  }
})
```

```vue
<input v-focus>
```

#### 示例2：点击外部区域

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

#### 示例3：防抖指令

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

#### 示例4：拖拽指令

```javascript
Vue.directive('drag', {
  bind(el) {
    el.onmousedown = function(e) {
      const disX = e.clientX - el.offsetLeft
      const disY = e.clientY - el.offsetTop
      
      document.onmousemove = function(e) {
        el.style.left = e.clientX - disX + 'px'
        el.style.top = e.clientY - disY + 'px'
      }
      
      document.onmouseup = function() {
        document.onmousemove = null
        document.onmouseup = null
      }
    }
  }
})
```

```vue
<template>
  <div v-drag class="draggable">可拖拽元素</div>
</template>

<style>
.draggable {
  position: absolute;
  cursor: move;
}
</style>
```

#### 示例5：权限指令

```javascript
Vue.directive('permission', {
  inserted(el, binding) {
    const permission = binding.value
    const hasPermission = checkPermission(permission)
    
    if (!hasPermission) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  }
})

function checkPermission(permission) {
  // 检查权限逻辑
  const userPermissions = ['read', 'write']
  return userPermissions.includes(permission)
}
```

```vue
<template>
  <div>
    <button v-permission="'write'">编辑</button>
    <button v-permission="'delete'">删除</button>
  </div>
</template>
```

## 混入 vs 自定义指令

| 特性 | 混入 | 自定义指令 |
|------|------|-----------|
| **用途** | 复用组件逻辑 | 操作 DOM |
| **作用范围** | 组件级别 | 元素级别 |
| **适用场景** | 数据、方法、生命周期 | DOM 操作、事件处理 |

## 总结

- **混入**：用于复用组件逻辑（data、methods、生命周期等）
- **自定义指令**：用于 DOM 操作和元素级别的功能
- **混入合并规则**：组件选项优先，生命周期钩子合并
- **指令钩子**：bind、inserted、update、componentUpdated、unbind
- 合理使用混入和自定义指令可以提高代码复用性
