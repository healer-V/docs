# 3.5 渲染函数与JSX

当模板不够灵活时，可以使用渲染函数或 JSX 来创建更动态的组件。

## 渲染函数

### 基本用法

```vue
<script>
export default {
  render(h) {
    return h('div', {
      class: 'container'
    }, [
      h('h1', '标题'),
      h('p', '内容')
    ])
  }
}
</script>
```

### h 函数参数

```javascript
h(tag, data, children)

// tag: 标签名或组件
// data: 属性对象
// children: 子节点
```

### 示例

```vue
<script>
export default {
  props: {
    level: {
      type: Number,
      default: 1
    }
  },
  render(h) {
    return h(
      `h${this.level}`,
      this.$slots.default
    )
  }
}
</script>
```

## JSX

### 基本用法

```vue
<script>
export default {
  render() {
    return (
      <div class="container">
        <h1>标题</h1>
        <p>内容</p>
      </div>
    )
  }
}
</script>
```

### JSX 示例

```vue
<script>
export default {
  data() {
    return {
      items: ['a', 'b', 'c']
    }
  },
  render() {
    return (
      <ul>
        {this.items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
}
</script>
```

## 总结

- 渲染函数提供更灵活的组件创建方式
- JSX 语法更接近模板
- 适用于动态组件和复杂逻辑
- 大多数情况下模板已足够
