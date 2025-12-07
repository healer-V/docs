# 3.2 事件处理与表单绑定

## 事件处理

### v-on 指令

使用 `v-on` 或简写 `@` 监听 DOM 事件：

```vue
<template>
  <div>
    <button v-on:click="handleClick">点击</button>
    <button @click="handleClick">点击（简写）</button>
  </div>
</template>

<script>
export default {
  methods: {
    handleClick() {
      alert('按钮被点击')
    }
  }
}
</script>
```

### 内联语句

可以直接在模板中使用内联语句：

```vue
<template>
  <div>
    <button @click="count++">计数: {{ count }}</button>
  </div>
</template>
```

### 传递参数

```vue
<template>
  <div>
    <button @click="handleClick('参数1', '参数2')">传递参数</button>
    <button @click="handleClick($event, '参数')">访问事件对象</button>
  </div>
</template>

<script>
export default {
  methods: {
    handleClick(arg1, arg2, event) {
      console.log(arg1, arg2, event)
    }
  }
}
</script>
```

## 事件修饰符

### .stop

阻止事件冒泡：

```vue
<template>
  <div @click="outerClick">
    <div @click.stop="innerClick">内部</div>
  </div>
</template>
```

### .prevent

阻止默认行为：

```vue
<template>
  <form @submit.prevent="onSubmit">
    <button type="submit">提交</button>
  </form>
</template>
```

### .capture

使用事件捕获模式：

```vue
<template>
  <div @click.capture="outerClick">
    <div @click="innerClick">内部</div>
  </div>
</template>
```

### .self

只有 event.target 是当前元素时才触发：

```vue
<template>
  <div @click.self="doThat">只有点击自己才触发</div>
</template>
```

### .once

事件只触发一次：

```vue
<template>
  <button @click.once="doThis">只触发一次</button>
</template>
```

### .passive

滚动事件的默认行为会立即触发：

```vue
<template>
  <div @scroll.passive="onScroll">滚动</div>
</template>
```

### 修饰符链式调用

```vue
<template>
  <form @submit.prevent.stop="onSubmit">提交</form>
</template>
```

## 按键修饰符

### 常用按键

```vue
<template>
  <input @keyup.enter="submit">
  <input @keyup.esc="cancel">
  <input @keyup.tab="next">
  <input @keyup.delete="delete">
</template>
```

### 系统修饰键

```vue
<template>
  <input @keyup.ctrl.enter="submit">
  <input @keyup.alt.enter="submit">
  <input @keyup.shift.enter="submit">
  <input @keyup.meta.enter="submit">
</template>
```

### 鼠标按键修饰符

```vue
<template>
  <button @click.left="leftClick">左键</button>
  <button @click.right="rightClick">右键</button>
  <button @click.middle="middleClick">中键</button>
</template>
```

## 表单绑定

### v-model 基础

```vue
<template>
  <div>
    <input v-model="message" placeholder="输入消息">
    <p>消息: {{ message }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: ''
    }
  }
}
</script>
```

### 文本输入

```vue
<template>
  <div>
    <input v-model="text" type="text">
    <textarea v-model="text"></textarea>
  </div>
</template>
```

### 复选框

单个复选框：

```vue
<template>
  <div>
    <input type="checkbox" v-model="checked">
    <p>选中: {{ checked }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      checked: false
    }
  }
}
</script>
```

多个复选框：

```vue
<template>
  <div>
    <input type="checkbox" value="apple" v-model="fruits">苹果
    <input type="checkbox" value="banana" v-model="fruits">香蕉
    <input type="checkbox" value="orange" v-model="fruits">橙子
    <p>选择的水果: {{ fruits }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      fruits: []
    }
  }
}
</script>
```

### 单选按钮

```vue
<template>
  <div>
    <input type="radio" value="male" v-model="gender">男
    <input type="radio" value="female" v-model="gender">女
    <p>选择的性别: {{ gender }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      gender: ''
    }
  }
}
</script>
```

### 选择框

单选：

```vue
<template>
  <div>
    <select v-model="selected">
      <option disabled value="">请选择</option>
      <option value="a">选项A</option>
      <option value="b">选项B</option>
      <option value="c">选项C</option>
    </select>
    <p>选择: {{ selected }}</p>
  </div>
</template>
```

多选：

```vue
<template>
  <div>
    <select v-model="selected" multiple>
      <option value="a">选项A</option>
      <option value="b">选项B</option>
      <option value="c">选项C</option>
    </select>
    <p>选择: {{ selected }}</p>
  </div>
</template>
```

## v-model 修饰符

### .lazy

在 change 事件中同步：

```vue
<template>
  <input v-model.lazy="message">
  <p>{{ message }}</p>
</template>
```

### .number

自动转换为数字：

```vue
<template>
  <input v-model.number="age" type="number">
  <p>类型: {{ typeof age }}</p>
</template>
```

### .trim

自动去除首尾空格：

```vue
<template>
  <input v-model.trim="message">
  <p>长度: {{ message.length }}</p>
</template>
```

## 实际应用示例

### 示例1：登录表单

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label>用户名:</label>
      <input v-model.trim="form.username" required>
    </div>
    <div>
      <label>密码:</label>
      <input v-model="form.password" type="password" required>
    </div>
    <div>
      <label>记住我:</label>
      <input type="checkbox" v-model="form.remember">
    </div>
    <button type="submit">登录</button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: '',
        password: '',
        remember: false
      }
    }
  },
  methods: {
    handleSubmit() {
      console.log('提交:', this.form)
    }
  }
}
</script>
```

### 示例2：动态表单

```vue
<template>
  <div>
    <div v-for="(field, index) in fields" :key="index">
      <label>{{ field.label }}:</label>
      <input 
        v-if="field.type === 'text'"
        v-model="form[field.name]"
        :type="field.type"
      >
      <select v-else-if="field.type === 'select'" v-model="form[field.name]">
        <option v-for="opt in field.options" :key="opt" :value="opt">
          {{ opt }}
        </option>
      </select>
    </div>
    <button @click="submit">提交</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      fields: [
        { name: 'name', label: '姓名', type: 'text' },
        { name: 'city', label: '城市', type: 'select', options: ['北京', '上海', '广州'] }
      ],
      form: {}
    }
  },
  methods: {
    submit() {
      console.log('表单数据:', this.form)
    }
  }
}
</script>
```

## 总结

- 使用 `v-on` 或 `@` 监听事件
- 事件修饰符：`.stop`、`.prevent`、`.capture`、`.self`、`.once`、`.passive`
- 按键修饰符：`.enter`、`.esc`、`.ctrl` 等
- `v-model` 实现双向数据绑定
- 修饰符：`.lazy`、`.number`、`.trim`
- 合理使用事件修饰符和表单绑定可以简化代码
