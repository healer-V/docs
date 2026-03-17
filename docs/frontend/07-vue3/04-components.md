---
title: "Vue 3 组件系统"
category: "前端 · Vue 3"
tags:
  - Vue
  - TypeScript
excerpt: "Vue 3 组件系统涵盖 defineComponent、props 定义与校验、emits 声明、expose 控制暴露内容，以及父子组件通信、provide/inject 依赖注入等核心机制。"
date: 2026-03-17
---

# Vue 3 组件系统

组件是 Vue 应用的基本构建单元。Vue 3 在组件定义、Props 类型安全、事件声明和依赖注入等方面都有显著改进，配合 `<script setup>` 语法糖让组件代码更简洁。

## 一、组件定义

### 1. script setup（推荐）

使用 `<script setup>` 定义的组件，导入的组件无需注册即可使用：

::: details 基础组件示例

```vue
<!-- src/components/ProductCard.vue -->
<script setup>
import { ref, computed } from 'vue'
import PriceTag from './PriceTag.vue'  // 无需注册，直接使用

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['add-to-cart', 'view-detail'])

const isWishlisted = ref(false)

const discountedPrice = computed(() =>
  props.product.discount
    ? (props.product.price * (1 - props.product.discount)).toFixed(2)
    : props.product.price
)

function handleAddToCart() {
  emit('add-to-cart', props.product)
}
</script>

<template>
  <div class="product-card">
    <img :src="product.imageUrl" :alt="product.name" />
    <h3>{{ product.name }}</h3>
    <PriceTag :price="discountedPrice" />
    <button @click="handleAddToCart">加入购物车</button>
  </div>
</template>
```
:::

### 2. defineComponent（TypeScript 场景）

在 TypeScript 项目中使用 Options API 时，`defineComponent` 提供类型推断：

::: details defineComponent 示例

```ts
import { defineComponent, ref, computed } from 'vue'

export default defineComponent({
  name: 'SearchBar',
  props: {
    placeholder: {
      type: String,
      default: '请输入关键词'
    },
    debounceMs: {
      type: Number,
      default: 300
    }
  },
  emits: ['search', 'clear'],
  setup(props, { emit }) {
    const keyword = ref('')

    let timer: ReturnType<typeof setTimeout>

    function handleInput(e: Event) {
      keyword.value = (e.target as HTMLInputElement).value
      clearTimeout(timer)
      timer = setTimeout(() => {
        emit('search', keyword.value)
      }, props.debounceMs)
    }

    function handleClear() {
      keyword.value = ''
      emit('clear')
    }

    return { keyword, handleInput, handleClear }
  }
})
```
:::

## 二、Props 定义与校验

### 1. 运行时声明

::: details Props 运行时声明示例

```vue
<script setup>
// 基础类型声明
const props = defineProps({
  // 基本类型
  title: String,
  count: Number,
  isActive: Boolean,

  // 带默认值
  size: {
    type: String,
    default: 'medium'
  },

  // 必填项
  userId: {
    type: Number,
    required: true
  },

  // 多类型
  value: {
    type: [String, Number],
    default: ''
  },

  // 自定义校验
  status: {
    type: String,
    validator(value) {
      return ['pending', 'active', 'inactive'].includes(value)
    }
  },

  // 对象类型（默认值用工厂函数）
  config: {
    type: Object,
    default: () => ({ theme: 'light', lang: 'zh' })
  },

  // 数组类型
  tags: {
    type: Array,
    default: () => []
  }
})
</script>
```
:::

### 2. TypeScript 类型声明（推荐）

::: details TypeScript Props 类型声明

```vue
<script setup lang="ts">
interface UserCardProps {
  user: {
    id: number
    name: string
    email: string
    avatar?: string
  }
  isEditable?: boolean
  variant?: 'compact' | 'full'
}

// 使用泛型语法，编译时类型检查更严格
const props = defineProps<UserCardProps>()

// 带默认值：使用 withDefaults
// const props = withDefaults(defineProps<UserCardProps>(), {
//   isEditable: false,
//   variant: 'full'
// })
</script>

<template>
  <div :class="`card-${props.variant}`">
    <img v-if="props.user.avatar" :src="props.user.avatar" alt="头像" />
    <h3>{{ props.user.name }}</h3>
    <p>{{ props.user.email }}</p>
  </div>
</template>
```
:::

::: tip Props 命名规范
Props 在 JavaScript 中使用 camelCase（如 `userName`），在模板中既可用 camelCase 也可用 kebab-case（如 `:user-name`）。推荐在模板中统一使用 kebab-case，与 HTML 规范保持一致。
:::

## 三、Emits 事件声明

### 1. 声明与触发事件

::: details Emits 完整示例

```vue
<!-- src/components/LoginForm.vue -->
<script setup>
import { ref, reactive } from 'vue'

// 声明组件可以触发的事件
const emit = defineEmits(['login-success', 'login-failed', 'cancel'])

const form = reactive({ email: '', password: '' })
const isLoading = ref(false)

async function handleSubmit() {
  if (!form.email || !form.password) return

  isLoading.value = true
  try {
    const user = await authLogin(form.email, form.password)
    emit('login-success', user)  // 传递数据给父组件
  } catch (error) {
    emit('login-failed', error.message)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.email" type="email" placeholder="邮箱" />
    <input v-model="form.password" type="password" placeholder="密码" />
    <button :disabled="isLoading" type="submit">
      {{ isLoading ? '登录中...' : '登录' }}
    </button>
    <button type="button" @click="emit('cancel')">取消</button>
  </form>
</template>
```

```vue
<!-- 父组件使用 -->
<template>
  <LoginForm
    @login-success="handleLoginSuccess"
    @login-failed="handleLoginFailed"
    @cancel="showLoginModal = false"
  />
</template>

<script setup>
import LoginForm from '@/components/LoginForm.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showLoginModal = ref(false)

function handleLoginSuccess(user) {
  console.log('登录成功:', user)
  router.push('/dashboard')
}

function handleLoginFailed(message) {
  console.error('登录失败:', message)
}
</script>
```
:::

### 2. TypeScript 事件类型标注

::: details TypeScript Emits 类型声明

```vue
<script setup lang="ts">
interface EmitEvents {
  (e: 'update:modelValue', value: string): void
  (e: 'submit', data: { email: string; message: string }): void
  (e: 'cancel'): void
}

const emit = defineEmits<EmitEvents>()
</script>
```
:::

## 四、v-model 双向绑定

### 1. 组件 v-model

::: details 自定义组件 v-model 示例

```vue
<!-- src/components/AppInput.vue -->
<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: String
})

const emit = defineEmits(['update:modelValue'])

function handleInput(e) {
  emit('update:modelValue', e.target.value)
}
</script>

<template>
  <div class="app-input">
    <label>{{ label }}</label>
    <input :value="modelValue" @input="handleInput" />
  </div>
</template>
```

```vue
<!-- 父组件使用 v-model -->
<script setup>
import { ref } from 'vue'
import AppInput from '@/components/AppInput.vue'

const username = ref('')
</script>

<template>
  <AppInput v-model="username" label="用户名" />
  <!-- 等同于 -->
  <AppInput :modelValue="username" @update:modelValue="username = $event" label="用户名" />
</template>
```
:::

### 2. 多个 v-model 绑定

::: details 多 v-model 示例

```vue
<!-- 组件支持多个 v-model -->
<script setup>
defineProps(['firstName', 'lastName'])
defineEmits(['update:firstName', 'update:lastName'])
</script>

<template>
  <input
    :value="firstName"
    @input="$emit('update:firstName', $event.target.value)"
  />
  <input
    :value="lastName"
    @input="$emit('update:lastName', $event.target.value)"
  />
</template>
```

```vue
<!-- 父组件 -->
<NameInput
  v-model:first-name="firstName"
  v-model:last-name="lastName"
/>
```
:::

## 五、expose 控制暴露内容

默认情况下，`<script setup>` 组件的内部内容对父组件不可见。使用 `defineExpose` 显式指定需要暴露的内容：

::: details defineExpose 示例

```vue
<!-- src/components/VideoPlayer.vue -->
<script setup>
import { ref } from 'vue'

const videoRef = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)

function play() {
  videoRef.value?.play()
  isPlaying.value = true
}

function pause() {
  videoRef.value?.pause()
  isPlaying.value = false
}

function seekTo(time) {
  if (videoRef.value) {
    videoRef.value.currentTime = time
  }
}

// 只暴露需要的方法，内部状态不暴露
defineExpose({ play, pause, seekTo })
</script>

<template>
  <video ref="videoRef" @timeupdate="currentTime = $event.target.currentTime" />
</template>
```

```vue
<!-- 父组件通过模板引用调用 -->
<script setup>
import { ref, onMounted } from 'vue'
import VideoPlayer from '@/components/VideoPlayer.vue'

const playerRef = ref(null)

onMounted(() => {
  // 可以调用 expose 出来的方法
  playerRef.value.play()
})
</script>

<template>
  <VideoPlayer ref="playerRef" />
  <button @click="playerRef.seekTo(30)">跳到30秒</button>
</template>
```
:::

## 六、provide / inject 依赖注入

`provide` 和 `inject` 用于跨越多层组件传递数据，避免 props 逐层传递（"prop drilling"）：

::: details provide / inject 完整示例

```vue
<!-- src/App.vue 或父组件 -->
<script setup>
import { provide, ref, readonly } from 'vue'

const theme = ref('light')
const currentUser = ref({ id: 1, name: 'Alice', role: 'admin' })

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

// 提供响应式数据和修改方法
provide('theme', readonly(theme))          // 只读，防止子组件直接修改
provide('currentUser', readonly(currentUser))
provide('toggleTheme', toggleTheme)        // 提供修改函数
</script>
```

```vue
<!-- 任意深度的子组件 -->
<script setup>
import { inject } from 'vue'

// 注入数据（第二个参数是默认值）
const theme = inject('theme', 'light')
const currentUser = inject('currentUser')
const toggleTheme = inject('toggleTheme')
</script>

<template>
  <div :class="`theme-${theme}`">
    <p>当前用户：{{ currentUser.name }}（{{ currentUser.role }}）</p>
    <button @click="toggleTheme">切换主题</button>
  </div>
</template>
```
:::

::: tip provide/inject 的 Symbol key
在大型项目中，建议使用 Symbol 作为注入的 key，避免命名冲突：

```js
// src/injection-keys.js
export const THEME_KEY = Symbol('theme')
export const USER_KEY = Symbol('currentUser')
```
:::

## 七、动态组件

使用 `<component :is="">` 实现动态组件切换，结合 `<KeepAlive>` 缓存组件状态：

::: details 动态组件示例

```vue
<script setup>
import { ref, shallowRef } from 'vue'
import DashboardView from './DashboardView.vue'
import ProfileView from './ProfileView.vue'
import SettingsView from './SettingsView.vue'

const tabs = [
  { name: '仪表盘', component: DashboardView },
  { name: '个人资料', component: ProfileView },
  { name: '设置', component: SettingsView }
]

const activeTab = shallowRef(tabs[0])
</script>

<template>
  <div>
    <nav>
      <button
        v-for="tab in tabs"
        :key="tab.name"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab.name }}
      </button>
    </nav>

    <!-- KeepAlive 缓存组件状态，切换时不销毁 -->
    <KeepAlive>
      <component :is="activeTab.component" />
    </KeepAlive>
  </div>
</template>
```
:::
