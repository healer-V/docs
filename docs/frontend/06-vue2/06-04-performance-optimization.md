---
title: "6.4 性能优化策略"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "使用 WebP 格式 图片懒加载 使用 CDN 压缩图片大小 频繁切换时使用 v-show，条件很少改变时使用 v-if。 使用计算属性替代模板中的复杂表达式，计算属性有缓存机制。 使用唯一的 key 避免在 v-for 中使用 v-if ..."
---

# 6.4 性能优化策略

## 6.4.1 代码分割

### 6.4.1.1 路由懒加载

```javascript
const Home = () => import('@/views/Home.vue')
const About = () => import('@/views/About.vue')
```

### 6.4.1.2 组件懒加载

```vue
<script>
export default {
  components: {
    HeavyComponent: () => import('./HeavyComponent.vue')
  }
}
</script>
```

## 6.4.2 图片优化

::: tip 图片优化
1. 使用 WebP 格式
2. 图片懒加载
3. 使用 CDN
4. 压缩图片大小
:::

## 6.4.3 组件优化

### 6.4.3.1 使用 v-show 替代 v-if

::: tip v-show vs v-if
频繁切换时使用 `v-show`，条件很少改变时使用 `v-if`。
:::

### 6.4.3.2 使用 keep-alive

```vue
<keep-alive>
  <component :is="currentComponent"></component>
</keep-alive>
```

### 6.4.3.3 避免在模板中使用复杂表达式

::: tip 计算属性
使用计算属性替代模板中的复杂表达式，计算属性有缓存机制。
:::

## 6.4.4 列表渲染优化

::: tip 列表优化
1. 使用唯一的 `key`
2. 避免在 `v-for` 中使用 `v-if`
3. 虚拟滚动（长列表）
:::

## 6.4.5 打包优化

::: tip 打包优化
1. 代码压缩
2. Tree Shaking
3. 提取公共代码
4. 使用 CDN
:::

## 6.4.6 总结

::: tip 总结
性能优化是一个持续的过程，需要根据实际情况选择合适的优化策略。
:::
