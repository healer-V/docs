---
title: "3.3 过渡与动画"
category: "前端 · Vue 2"
tags:
  - Vue
excerpt: "Vue 提供了过渡和动画的支持，可以让元素在插入、更新或移除时应用过渡效果。 Vue 在元素进入/离开过渡时，会应用以下类名： v-enter：进入开始 v-enter-active：进入过程中 v-enter-to：进入结束 v-leav..."
---

# 3.3 过渡与动画

Vue 提供了过渡和动画的支持，可以让元素在插入、更新或移除时应用过渡效果。

## transition 组件

### 基本用法

```vue
<template>
  <div>
    <button @click="show = !show">切换</button>
    <transition name="fade">
      <p v-if="show">Hello Vue</p>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      show: true
    }
  }
}
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
```

### 过渡类名

Vue 在元素进入/离开过渡时，会应用以下类名：

- `v-enter`：进入开始
- `v-enter-active`：进入过程中
- `v-enter-to`：进入结束
- `v-leave`：离开开始
- `v-leave-active`：离开过程中
- `v-leave-to`：离开结束

## CSS 过渡

### 示例1：淡入淡出

```vue
<template>
  <transition name="fade">
    <div v-if="show">内容</div>
  </transition>
</template>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
```

### 示例2：滑动

```vue
<template>
  <transition name="slide">
    <div v-if="show">内容</div>
  </transition>
</template>

<style>
.slide-enter-active {
  transition: all 0.3s ease;
}
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter {
  transform: translateX(-100%);
}
.slide-leave-to {
  transform: translateX(100%);
}
</style>
```

### 示例3：缩放

```vue
<template>
  <transition name="scale">
    <div v-if="show">内容</div>
  </transition>
</template>

<style>
.scale-enter-active, .scale-leave-active {
  transition: transform 0.3s;
}
.scale-enter, .scale-leave-to {
  transform: scale(0);
}
</style>
```

## CSS 动画

```vue
<template>
  <transition name="bounce">
    <div v-if="show">内容</div>
  </transition>
</template>

<style>
.bounce-enter-active {
  animation: bounce-in 0.5s;
}
.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.5);
  }
  100% {
    transform: scale(1);
  }
}
</style>
```

## JavaScript 钩子

```vue
<template>
  <transition
    @before-enter="beforeEnter"
    @enter="enter"
    @after-enter="afterEnter"
    @enter-cancelled="enterCancelled"
    @before-leave="beforeLeave"
    @leave="leave"
    @after-leave="afterLeave"
    @leave-cancelled="leaveCancelled"
  >
    <div v-if="show">内容</div>
  </transition>
</template>

<script>
export default {
  methods: {
    beforeEnter(el) {
      el.style.opacity = 0
    },
    enter(el, done) {
      // 使用 Velocity.js 等库
      Velocity(el, { opacity: 1 }, { duration: 300, complete: done })
    },
    afterEnter(el) {
      // 完成后的回调
    }
  }
}
</script>
```

## 列表过渡

使用 `<transition-group>` 实现列表过渡：

```vue
<template>
  <div>
    <button @click="addItem">添加</button>
    <button @click="removeItem">删除</button>
    <transition-group name="list" tag="ul">
      <li v-for="item in items" :key="item.id">
        {{ item.text }}
      </li>
    </transition-group>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { id: 1, text: '项目1' },
        { id: 2, text: '项目2' }
      ],
      nextId: 3
    }
  },
  methods: {
    addItem() {
      this.items.push({ id: this.nextId++, text: `项目${this.nextId}` })
    },
    removeItem() {
      this.items.pop()
    }
  }
}
</script>

<style>
.list-enter-active, .list-leave-active {
  transition: all 0.5s;
}
.list-enter, .list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
```

## 总结

- 使用 `<transition>` 包裹单个元素
- 使用 `<transition-group>` 包裹列表
- CSS 过渡和动画都可以使用
- JavaScript 钩子提供更灵活的控制
- 合理使用过渡和动画可以提升用户体验
