# 3.4 过滤器与自定义过滤器

过滤器用于文本格式化，可以用在插值表达式和 v-bind 表达式中。

## 基本用法

```vue
<template>
  <div>
    <p>{{ message | capitalize }}</p>
  </div>
</template>

<script>
export default {
  filters: {
    capitalize(value) {
      if (!value) return ''
      return value.toString().charAt(0).toUpperCase() + value.slice(1)
    }
  },
  data() {
    return {
      message: 'hello vue'
    }
  }
}
</script>
```

## 全局过滤器

```javascript
// main.js
Vue.filter('capitalize', function(value) {
  if (!value) return ''
  return value.toString().charAt(0).toUpperCase() + value.slice(1)
})
```

## 链式调用

```vue
<template>
  <p>{{ message | filterA | filterB }}</p>
</template>
```

## 传递参数

```vue
<template>
  <p>{{ date | formatDate('YYYY-MM-DD') }}</p>
</template>

<script>
export default {
  filters: {
    formatDate(value, format) {
      // 格式化日期
      return value
    }
  }
}
</script>
```

## 常用过滤器示例

### 日期格式化

```javascript
Vue.filter('date', function(value, format) {
  if (!value) return ''
  const date = new Date(value)
  // 格式化逻辑
  return date.toLocaleDateString()
})
```

### 货币格式化

```javascript
Vue.filter('currency', function(value, symbol = '¥') {
  if (!value) return ''
  return symbol + parseFloat(value).toFixed(2)
})
```

### 文本截断

```javascript
Vue.filter('truncate', function(value, length = 20) {
  if (!value) return ''
  if (value.length <= length) return value
  return value.slice(0, length) + '...'
})
```

## 注意

Vue 3 中已移除过滤器，建议使用计算属性或方法替代。

## 总结

- 过滤器用于文本格式化
- 可以全局注册或局部注册
- 支持链式调用和参数传递
- Vue 3 中已移除，建议使用计算属性
