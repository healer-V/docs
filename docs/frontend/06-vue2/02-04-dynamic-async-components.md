# 2.4 动态组件与异步组件

## 动态组件

使用 `<component>` 元素配合 `is` 属性可以实现动态组件切换。

### 基本用法

```vue
<template>
  <div>
    <button @click="currentComponent = 'ComponentA'">组件A</button>
    <button @click="currentComponent = 'ComponentB'">组件B</button>
    
    <component :is="currentComponent"></component>
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

### 动态组件示例

```vue
<!-- 父组件 -->
<template>
  <div>
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.name"
        @click="currentTab = tab.name"
        :class="{ active: currentTab === tab.name }"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <component :is="currentTab" :data="tabData"></component>
  </div>
</template>

<script>
import Tab1 from './Tab1.vue'
import Tab2 from './Tab2.vue'
import Tab3 from './Tab3.vue'

export default {
  components: {
    Tab1,
    Tab2,
    Tab3
  },
  data() {
    return {
      currentTab: 'Tab1',
      tabs: [
        { name: 'Tab1', label: '标签1' },
        { name: 'Tab2', label: '标签2' },
        { name: 'Tab3', label: '标签3' }
      ],
      tabData: {}
    }
  }
}
</script>
```

### keep-alive 缓存组件

使用 `<keep-alive>` 包裹动态组件，可以缓存组件状态：

```vue
<template>
  <div>
    <button @click="currentComponent = 'ComponentA'">组件A</button>
    <button @click="currentComponent = 'ComponentB'">组件B</button>
    
    <keep-alive>
      <component :is="currentComponent"></component>
    </keep-alive>
  </div>
</template>
```

**keep-alive 的作用**：
- 缓存组件实例，避免重复渲染
- 保留组件状态（data、computed 等）
- 保留滚动位置

### keep-alive 的 include 和 exclude

```vue
<template>
  <keep-alive :include="['ComponentA', 'ComponentB']">
    <component :is="currentComponent"></component>
  </keep-alive>
</template>
```

```vue
<template>
  <keep-alive exclude="ComponentC">
    <component :is="currentComponent"></component>
  </keep-alive>
</template>
```

## 异步组件

异步组件可以按需加载，提高应用的初始加载速度。

### 基本用法

```javascript
// 方式1：使用工厂函数
const AsyncComponent = () => import('./AsyncComponent.vue')

export default {
  components: {
    AsyncComponent
  }
}
```

```vue
<!-- 方式2：在组件中直接使用 -->
<template>
  <div>
    <AsyncComponent />
  </div>
</template>

<script>
export default {
  components: {
    AsyncComponent: () => import('./AsyncComponent.vue')
  }
}
</script>
```

### 异步组件的完整写法

```javascript
const AsyncComponent = () => ({
  // 需要加载的组件
  component: import('./AsyncComponent.vue'),
  // 加载中显示的组件
  loading: LoadingComponent,
  // 加载失败显示的组件
  error: ErrorComponent,
  // 延迟显示加载组件的时间（ms）
  delay: 200,
  // 超时时间（ms）
  timeout: 3000
})
```

### 异步组件示例

```vue
<!-- 父组件 -->
<template>
  <div>
    <button @click="showAsync = true">加载异步组件</button>
    <AsyncComponent v-if="showAsync" />
  </div>
</template>

<script>
export default {
  components: {
    AsyncComponent: () => ({
      component: import('./AsyncComponent.vue'),
      loading: {
        template: '<div>加载中...</div>'
      },
      error: {
        template: '<div>加载失败</div>'
      },
      delay: 200,
      timeout: 3000
    })
  },
  data() {
    return {
      showAsync: false
    }
  }
}
</script>
```

### 路由懒加载

在 Vue Router 中使用异步组件实现路由懒加载：

```javascript
// router/index.js
const routes = [
  {
    path: '/home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/about',
    component: () => import('@/views/About.vue')
  }
]
```

### 按需加载组件库

```javascript
// 按需加载 Element UI 组件
import { Button, Input } from 'element-ui'

export default {
  components: {
    ElButton: Button,
    ElInput: Input
  }
}
```

## 实际应用示例

### 示例1：标签页切换

```vue
<template>
  <div class="tabs-container">
    <div class="tabs-header">
      <div 
        v-for="tab in tabs" 
        :key="tab.name"
        class="tab-item"
        :class="{ active: currentTab === tab.name }"
        @click="switchTab(tab.name)"
      >
        {{ tab.label }}
      </div>
    </div>
    
    <div class="tabs-content">
      <keep-alive>
        <component :is="currentTab" :key="currentTab"></component>
      </keep-alive>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentTab: 'Tab1',
      tabs: [
        { name: 'Tab1', label: '首页', component: () => import('./Tab1.vue') },
        { name: 'Tab2', label: '关于', component: () => import('./Tab2.vue') },
        { name: 'Tab3', label: '联系', component: () => import('./Tab3.vue') }
      ]
    }
  },
  components: {
    Tab1: () => import('./Tab1.vue'),
    Tab2: () => import('./Tab2.vue'),
    Tab3: () => import('./Tab3.vue')
  },
  methods: {
    switchTab(tabName) {
      this.currentTab = tabName
    }
  }
}
</script>

<style scoped>
.tabs-container {
  border: 1px solid #ddd;
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid #ddd;
}

.tab-item {
  padding: 12px 24px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-item.active {
  color: #409eff;
  border-bottom-color: #409eff;
}

.tabs-content {
  padding: 20px;
}
</style>
```

### 示例2：条件加载组件

```vue
<template>
  <div>
    <button @click="loadChart">加载图表</button>
    <div v-if="showChart">
      <ChartComponent :data="chartData" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showChart: false,
      chartData: []
    }
  },
  components: {
    ChartComponent: () => import('./ChartComponent.vue')
  },
  methods: {
    async loadChart() {
      // 加载数据
      this.chartData = await this.fetchChartData()
      // 显示图表组件
      this.showChart = true
    },
    async fetchChartData() {
      // 模拟 API 请求
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([1, 2, 3, 4, 5])
        }, 1000)
      })
    }
  }
}
</script>
```

## 性能优化建议

1. **使用异步组件**：对于不常用的组件，使用异步加载
2. **使用 keep-alive**：对于频繁切换的组件，使用 keep-alive 缓存
3. **路由懒加载**：在路由配置中使用异步组件
4. **按需加载**：只加载需要的组件库组件

## 总结

- **动态组件**：使用 `<component :is="">` 实现组件动态切换
- **keep-alive**：缓存组件实例，保留状态
- **异步组件**：按需加载，提高初始加载速度
- **路由懒加载**：结合 Vue Router 实现路由级别的代码分割

合理使用动态组件和异步组件可以优化应用性能和用户体验。
